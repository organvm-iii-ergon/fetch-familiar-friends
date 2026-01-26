-- Migration: Push Notifications Infrastructure
-- This migration adds support for Web Push notifications

-- Push Subscriptions Table
-- Stores Web Push API subscription data for each user
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    expiration_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Add notification_preferences to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
            "enabled": false,
            "pushEnabled": false,
            "vaccination_due": true,
            "medication_reminder": true,
            "vet_appointment": true,
            "friend_request": true,
            "friend_accepted": true,
            "activity_reaction": true,
            "activity_comment": true,
            "quest_complete": true,
            "level_up": true,
            "streak_milestone": true,
            "virtual_pet_needs": true
        }'::jsonb;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_push_subscriptions_timestamp ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_timestamp
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscription_timestamp();

-- Scheduled Notifications Table (for future reminder scheduling)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for) WHERE sent_at IS NULL;

-- Enable RLS on scheduled_notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view own scheduled notifications"
    ON scheduled_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled notifications"
    ON scheduled_notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications"
    ON scheduled_notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled notifications"
    ON scheduled_notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON scheduled_notifications TO authenticated;

-- Comment on tables
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscription data for push notifications';
COMMENT ON TABLE scheduled_notifications IS 'Stores scheduled notifications to be sent at specific times';
