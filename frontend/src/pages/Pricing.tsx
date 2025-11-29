import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'tabler-icons-react';
import AuthModal from '../components/AuthModal';
import logo from '../assets/checkmate-logo.png';

export default function Pricing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const plans = [
    {
      name: 'Scout',
      price: 'Free',
      description: 'For the casual truth-seeker.',
      features: [
        'Daily limit: 5 checks',
        'Basic text/image verification',
        'Extension access',
        'Community support',
        'Basic analytics'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Grandmaster',
      price: '$9',
      period: '/month',
      description: 'For power users & researchers.',
      features: [
        'Unlimited checks',
        'Priority queue',
        'Deep Graph Analytics',
        'Voice mode',
        'Searchable history',
        'Advanced AI models',
        'Export reports',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Syndicate',
      price: 'Custom',
      description: 'For platforms & organizations.',
      features: [
        'API Access',
        'Custom Threat Feed',
        'Dedicated Support',
        'Brand Safety Monitoring',
        'White-label options',
        'SLA guarantees',
        'Custom integrations',
        'Training & onboarding'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0]/70 backdrop-blur-lg border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CheckMate" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold">CheckMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm font-medium text-[#8B4513]">Pricing</Link>
            <Link to="/careers" className="text-sm font-medium text-gray-700 hover:text-black">Careers</Link>
            <Link to="/resources" className="text-sm font-medium text-gray-700 hover:text-black">Resources</Link>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-2.5 bg-[#8B4513] text-white text-sm font-semibold rounded-lg hover:bg-[#6B4423] transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-16 px-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Choose Your <span className="text-[#8B4513]">Truth Arsenal</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From casual fact-checking to enterprise-grade verification. Pick the plan that matches your mission.
          </p>
        </div>
      </motion.section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white/80 backdrop-blur-lg border-2 rounded-3xl p-8 hover:shadow-2xl transition-all ${
                  plan.popular
                    ? 'border-[#8B4513] shadow-xl scale-105'
                    : 'border-[#F5E6D3]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#8B4513] text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-600">{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check size={20} className="text-[#8B4513] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setAuthModalOpen(true)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-[#8B4513] text-white hover:bg-[#6B4423]'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="py-24 px-6 bg-white/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for enterprise plans.'
              },
              {
                q: 'Is there a free trial for Pro?',
                a: 'Yes! Get 14 days of Grandmaster Pro free. No credit card required.'
              },
              {
                q: 'What happens when I hit my daily limit?',
                a: 'On the free plan, you can upgrade anytime or wait until the next day for your limit to reset.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white/80 border border-[#F5E6D3] rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Verifying?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users fighting misinformation every day.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-8 py-4 bg-[#8B4513] text-white font-bold text-lg rounded-xl hover:bg-[#6B4423] transition-all shadow-xl"
          >
            Get Started Free
          </button>
        </div>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
