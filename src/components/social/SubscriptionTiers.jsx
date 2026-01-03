import { motion } from 'framer-motion';
import { useState } from 'react';

function SubscriptionTiers() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = [
    {
      id: 'free',
      name: 'Free Tier',
      price: { monthly: 0, annual: 0 },
      icon: '🐾',
      color: 'from-gray-400 to-gray-600',
      popular: false,
      features: [
        { name: 'Daily dog content', included: true },
        { name: 'Basic calendar view', included: true },
        { name: 'Photo favorites (10 max)', included: true },
        { name: 'Simple journal entries', included: true },
        { name: 'Activity feed', included: false },
        { name: 'Friend connections', included: false },
        { name: 'AR features', included: false },
        { name: 'Virtual pet', included: false },
        { name: 'Vet telemedicine', included: false },
        { name: 'Monthly physical products', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium Digital',
      price: { monthly: 9.99, annual: 99 },
      icon: '✨',
      color: 'from-blue-500 to-purple-600',
      popular: true,
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Unlimited photo favorites', included: true },
        { name: 'Full social features', included: true, detail: 'Friends, activity feed, nearby' },
        { name: 'AR camera & games', included: true },
        { name: 'Virtual pet companion', included: true },
        { name: 'Care instructions sharing', included: true },
        { name: 'Achievement badges & XP', included: true },
        { name: 'Monthly digital story book', included: true, detail: 'Downloadable PDF' },
        { name: 'Vet chat (2/month)', included: true },
        { name: 'Professional coaching (10% off)', included: true },
      ],
    },
    {
      id: 'luxury',
      name: 'Luxury Analog',
      price: { monthly: 49.99, annual: 499 },
      icon: '👑',
      color: 'from-yellow-500 to-orange-600',
      popular: false,
      features: [
        { name: 'Everything in Premium', included: true },
        { name: 'Monthly physical book', included: true, detail: 'Premium hardcover with your pet\'s stories' },
        { name: 'Custom calendar prints', included: true, detail: 'Professional photo calendar delivered monthly' },
        { name: 'Pet memorial package', included: true, detail: 'Professional tribute + life book' },
        { name: 'Unlimited vet video calls', included: true },
        { name: '24/7 nurse practitioner', included: true },
        { name: 'Priority coaching booking', included: true },
        { name: 'Monthly care package', included: true, detail: 'Treats, toys, supplies' },
        { name: 'Professional pet portraits', included: true, detail: 'Quarterly custom artwork' },
        { name: 'White-glove concierge', included: true, detail: 'Dedicated pet care coordinator' },
      ],
    },
  ];

  const monthlyStoryBook = {
    description: 'Your pet\'s daily moments become a beautiful story',
    howItWorks: [
      'Each day: Get personalized comic panel or story page featuring your pet',
      'Throughout month: Pages build a cohesive narrative adventure',
      'End of month: Complete story ready for purchase',
      'Premium: Download digital PDF book',
      'Luxury: Receive professional printed hardcover',
    ],
    examples: [
      { month: 'January', theme: 'Winter Adventures', pages: 31 },
      { month: 'February', theme: 'Love & Friendship', pages: 28 },
      { month: 'March', theme: 'Spring Awakening', pages: 31 },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Choose Your Experience
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          From digital to luxury physical products
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'annual'
                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Annual
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ${
              tier.popular ? 'ring-4 ring-blue-500 scale-105' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                POPULAR
              </div>
            )}

            <div className={`bg-gradient-to-r ${tier.color} p-6 text-white`}>
              <div className="text-5xl mb-3">{tier.icon}</div>
              <h4 className="text-2xl font-bold">{tier.name}</h4>
              <div className="mt-4">
                <span className="text-5xl font-bold">
                  ${billingCycle === 'monthly' ? tier.price.monthly : tier.price.annual}
                </span>
                <span className="text-xl opacity-80">
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              {billingCycle === 'annual' && tier.price.annual > 0 && (
                <p className="text-sm mt-2 opacity-90">
                  ${(tier.price.annual / 12).toFixed(2)}/month billed annually
                </p>
              )}
            </div>

            <div className="p-6">
              <ul className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className={`text-xl ${feature.included ? 'text-green-500' : 'text-gray-300'}`}>
                      {feature.included ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <div className={feature.included ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 line-through'}>
                        {feature.name}
                      </div>
                      {feature.detail && feature.included && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {feature.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <button className={`w-full mt-6 py-3 rounded-lg font-bold transition-all ${
                tier.popular
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
                {tier.price.monthly === 0 ? 'Get Started Free' : 'Subscribe Now'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Story Book Feature */}
      <div className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 rounded-2xl p-8 border-2 border-orange-300 dark:border-orange-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-6xl">📚</div>
          <div>
            <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Monthly Story Books
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {monthlyStoryBook.description}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-4">How It Works</h5>
          <ul className="space-y-3">
            {monthlyStoryBook.howItWorks.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {monthlyStoryBook.examples.map((example, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">📖</div>
              <div className="font-bold text-gray-800 dark:text-gray-100">{example.month}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{example.theme}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{example.pages} pages</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">💎</div>
            <div className="font-semibold text-blue-800 dark:text-blue-300">Premium</div>
            <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">Digital PDF Download</div>
            <div className="text-xs text-blue-600 dark:text-blue-500 mt-2">Included in subscription</div>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">👑</div>
            <div className="font-semibold text-yellow-800 dark:text-yellow-300">Luxury</div>
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Premium Hardcover Print</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">Delivered to your door</div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md overflow-x-auto">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Full Feature Comparison
        </h4>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Feature</th>
              <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Free</th>
              <th className="text-center py-3 px-4 text-blue-600 dark:text-blue-400">Premium</th>
              <th className="text-center py-3 px-4 text-yellow-600 dark:text-yellow-400">Luxury</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Daily Content</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Social Features</td>
              <td className="text-center">✗</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Virtual Pet</td>
              <td className="text-center">✗</td>
              <td className="text-center">✓</td>
              <td className="text-center">✓</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Vet Telemedicine</td>
              <td className="text-center">✗</td>
              <td className="text-center">2/mo</td>
              <td className="text-center">Unlimited</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Monthly Book</td>
              <td className="text-center">✗</td>
              <td className="text-center">Digital</td>
              <td className="text-center">Print</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-3 px-4">Care Packages</td>
              <td className="text-center">✗</td>
              <td className="text-center">✗</td>
              <td className="text-center">✓</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubscriptionTiers;
