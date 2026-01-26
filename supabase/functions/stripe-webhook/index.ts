// Supabase Edge Function for Stripe Webhook handling
// This runs on Deno Deploy and handles Stripe webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.12.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      throw new Error('Missing webhook signature or secret');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(supabaseAdmin, stripe, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseAdmin, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseAdmin, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function handleCheckoutComplete(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const userId = subscription.metadata.supabase_user_id;
  const tier = subscription.metadata.tier || 'premium';

  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  // Update user profile
  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_customer_id: session.customer as string,
    })
    .eq('id', userId);

  console.log(`User ${userId} subscribed to ${tier}`);
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.supabase_user_id;
  const tier = subscription.metadata.tier || 'premium';

  if (!userId) return;

  const status = subscription.status;
  const isActive = ['active', 'trialing'].includes(status);

  await supabase
    .from('profiles')
    .update({
      subscription_tier: isActive ? tier : 'free',
      subscription_expires_at: isActive
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
    .eq('id', userId);

  console.log(`Subscription updated for user ${userId}: ${tier} (${status})`);
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) return;

  // Downgrade to free tier
  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_expires_at: null,
    })
    .eq('id', userId);

  console.log(`Subscription canceled for user ${userId}`);
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  // Log successful payment
  console.log(`Payment succeeded for invoice ${invoice.id}`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  // Log failed payment - could send notification to user
  console.log(`Payment failed for invoice ${invoice.id}`);
}
