import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PremiumBadge from '../components/PremiumBadge';
import { 
  Rocket, 
  Star, 
  Crown, 
  Lightning, 
  Target, 
  TrendUp,
  Calendar,
  Link as LinkIcon,
  Users,
  Trophy,
  Sparkle,
  CheckCircle,
  ArrowRight,
  Fire,
  Heart,
  Eye,
  Check
} from '@phosphor-icons/react';
import { PRICING_PLANS, LAUNCH_PACKAGES, SPONSORSHIP_TIERS } from '../constants/pricing';

function PricingPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handlePremiumCheckout = async (planType) => {
    if (!currentUser) {
      window.location.href = '/auth';
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const createCheckout = httpsCallable(functions, 'createPremiumCheckoutSession');
      
      const result = await createCheckout({ planType });
      
      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${result.data.id}`;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error creating checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Fire size={18} className="text-orange-500" />
              <span className="text-sm font-mono opacity-50">pricing plans</span>
            </div>
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              Launch Your Product with
              <span className="text-orange-500"> Impact</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From free launches to premium sponsorships. Choose the plan that fits your goals and budget.
            </p>
          </div>

          {/* Launch Plans */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-black mb-2">Launch Plans</h2>
              <p className="text-gray-500 font-mono">get your product discovered</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              
              {/* Free Launch */}
              <div className="md:col-span-1 border border-gray-200 p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black">Free Launch</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-black">$0</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm flex-grow">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-green-500" />
                    Random launch day
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-green-500" />
                    1 day homepage visibility
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-green-500" />
                    Community voting
                  </li>
                  <li className="flex items-center gap-2 text-red-600">
                    <span className="text-red-400">⚠</span>
                    Limited to 1 per week
                  </li>
                </ul>
                
                <Link 
                  to="/submit"
                  className="block w-full text-center py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold mt-auto"
                >
                  Submit Free
                </Link>
              </div>

              {/* Skip the Line */}
              <div className="md:col-span-1 border border-gray-200 bg-gray-50 p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black">Skip the Line</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-black">$29</span>
                    <span className="text-sm text-gray-500 font-mono">one-time</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6 text-sm flex-grow">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-gray-600" />
                    Choose your launch day
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-gray-600" />
                    Skip the waiting queue
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-gray-600" />
                    1 day homepage feature
                  </li>
                </ul>
                
                <Link 
                  to="/submit"
                  className="block w-full text-center py-3 bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors mt-auto"
                >
                  Skip the Line
                </Link>
              </div>

              {/* Monthly Pro */}
              <div className="md:col-span-2 border-2 border-orange-500 bg-orange-50 p-6 relative flex flex-col">
                <div className="absolute -top-3 left-4">
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1">POPULAR</span>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-black">Monthly Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-black">$19</span>
                    <span className="text-sm text-gray-500 font-mono">/month</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 flex-grow">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-orange-500" />
                      Unlimited launches
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-orange-500" />
                      1 premium launch/month
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-orange-500" />
                      Choose launch days
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-orange-500" />
                      Priority support
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => alert('Monthly Pro coming soon!')}
                  className="block w-full text-center py-3 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors mt-auto"
                >
                  Go Pro Monthly
                </button>
              </div>

            </div>
          </div>

          {/* Premium Services */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-black mb-2">Premium Services</h2>
              <p className="text-gray-500 font-mono">maximize your reach</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">

              {/* Get Featured */}
              <div className="border border-gray-200 bg-gray-50 p-8 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-black mb-2">Get Featured</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-black">$79</span>
                    <span className="text-sm text-gray-500 font-mono">30 days visibility</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm flex-grow">
                  <li className="flex items-center gap-3 text-gray-700">
                    <Fire size={16} className="text-orange-500" />
                    Premium sidebar placement
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Fire size={16} className="text-orange-500" />
                    Featured badge on product
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Fire size={16} className="text-orange-500" />
                    30 days extended visibility
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <Fire size={16} className="text-orange-500" />
                    Priority customer support
                  </li>
                </ul>
                
                <button
                  onClick={() => alert('Contact us for featured placement')}
                  className="block w-full text-center py-3 bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors mt-auto"
                >
                  Get Featured
                </button>
              </div>

              {/* Sponsorship */}
              <div className="border-2 border-orange-200 bg-orange-50 p-8 relative flex flex-col">
                <div className="absolute -top-3 left-8">
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1">PREMIUM</span>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-black mb-2">Become a Sponsor</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-black">$199</span>
                    <span className="text-sm text-gray-500 font-mono">/month - everything included</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-8 flex-grow">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 text-gray-700">
                      <Rocket size={16} className="text-orange-500" />
                      Homepage logo placement
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <Rocket size={16} className="text-orange-500" />
                      Site-wide brand visibility
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <Rocket size={16} className="text-orange-500" />
                      Weekly newsletter feature
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <Rocket size={16} className="text-orange-500" />
                      22K+ monthly reach
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => alert('Contact us for sponsorship opportunities')}
                  className="block w-full text-center py-3 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors mt-auto"
                >
                  Become a Sponsor
                </button>
              </div>

            </div>
          </div>

          {/* Stats */}
          <div className="text-center mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold text-black">22.8K</div>
                <div className="text-sm text-gray-500 font-mono">monthly visitors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-black">12.6K</div>
                <div className="text-sm text-gray-500 font-mono">active users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-black">500+</div>
                <div className="text-sm text-gray-500 font-mono">product launches</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-black">25%</div>
                <div className="text-sm text-gray-500 font-mono">monthly growth</div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about our packages</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-3">What's the difference between free and premium?</h4>
                <p className="text-gray-600 leading-relaxed">Premium launches get 3 days of featured placement, dofollow links, and you can choose your launch day. Free launches get 1 day with nofollow links on random days.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-3">How does sponsorship work?</h4>
                <p className="text-gray-600 leading-relaxed">Sponsors get banner placement across the site, custom integration options, and ongoing exposure to our engaged community of tech enthusiasts and entrepreneurs.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-3">Can I change my launch date?</h4>
                <p className="text-gray-600 leading-relaxed">Yes! Premium launch customers can choose their preferred launch date. Free launches are assigned random dates but can be rescheduled once through our support.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-3">What kind of traffic can I expect?</h4>
                <p className="text-gray-600 leading-relaxed">Our homepage gets 22.8K monthly visitors with 12.6K active users. Premium launches typically see 3-5x more engagement and clicks than free launches.</p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Launch Your Product?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of successful products that have launched on Simple Lister. Our community is waiting to discover your next big thing.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/submit"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-2xl text-gray-900 bg-white hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Get Premium Launch - $29
                <Rocket size={24} className="ml-3" />
              </Link>
              <Link 
                to="/submit"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-2xl text-white hover:bg-white hover:text-gray-900 transition-all"
              >
                Try Free Launch
                <ArrowRight size={24} className="ml-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}

export default PricingPage; 