import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  Eye
} from '@phosphor-icons/react';

function PricingPage() {
  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
              <Fire size={16} className="mr-2" />
              Launch with Maximum Impact
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Get Your Product
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500"> Noticed</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join over 500+ successful launches on Simple Lister. Choose the perfect package to reach 22K+ monthly visitors and build your community.
            </p>
          </div>

          {/* Main Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* Premium Launch - Large Card */}
            <div className="lg:col-span-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-6 right-6">
                <div className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <Crown size={16} className="mr-2" />
                  <span className="text-sm font-semibold">Most Popular</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Rocket size={40} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Premium Launch</h3>
                    <p className="text-red-100 text-lg">The ultimate visibility package</p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <div className="flex items-baseline mb-4">
                    <span className="text-6xl font-bold">$29</span>
                    <span className="text-xl text-red-100 ml-3">one-time payment</span>
                  </div>
                  <p className="text-red-100 text-lg leading-relaxed">
                    Perfect for serious launches that need guaranteed exposure and premium placement on our homepage.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-green-300" />
                    <span className="text-lg">3-day homepage feature</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-green-300" />
                    <span className="text-lg">Dofollow SEO backlink</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-green-300" />
                    <span className="text-lg">Choose your launch day</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-green-300" />
                    <span className="text-lg">Priority support</span>
                  </div>
                </div>
                
                <Link 
                  to="/submit"
                  className="inline-flex items-center px-8 py-4 bg-white text-red-600 text-lg font-semibold rounded-2xl hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  Start Premium Launch
                  <ArrowRight size={24} className="ml-3" />
                </Link>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full"></div>
            </div>

            {/* Stats Card */}
            <div className="lg:col-span-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <TrendUp size={24} className="text-white" />
                </div>
                <h4 className="text-2xl font-bold">Live Stats</h4>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <Eye size={20} className="text-blue-400" />
                    <span className="text-gray-300">Monthly Visitors</span>
                  </div>
                  <span className="text-3xl font-bold">22.8K</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <Users size={20} className="text-green-400" />
                    <span className="text-gray-300">Active Users</span>
                  </div>
                  <span className="text-3xl font-bold">12.6K</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <Rocket size={20} className="text-purple-400" />
                    <span className="text-gray-300">Launches</span>
                  </div>
                  <span className="text-3xl font-bold">500+</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 font-semibold">Growing 25% monthly</span>
                </div>
              </div>
            </div>

            {/* Featured Package */}
            <div className="lg:col-span-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Star size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Featured Spotlight</h3>
                    <p className="text-blue-100">Premium placement boost</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline mb-3">
                    <span className="text-5xl font-bold">$49</span>
                    <span className="text-lg text-blue-100 ml-2">one-time</span>
                  </div>
                  <p className="text-blue-100 leading-relaxed">
                    Get premium placement in our featured section for enhanced visibility and targeted exposure.
                  </p>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-3">
                    <Lightning size={20} className="text-yellow-300" />
                    <span>Homepage featured section</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target size={20} className="text-green-300" />
                    <span>Targeted exposure boost</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart size={20} className="text-pink-300" />
                    <span>Community engagement</span>
                  </div>
                </div>
                
                <a 
                  href="https://buy.stripe.com/9B6dR97Bqg0k5rxaWk5J608"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105"
                >
                  Get Featured Spot
                  <ArrowRight size={20} className="ml-2" />
                </a>
              </div>
              
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
            </div>

            {/* Sponsorship Package */}
            <div className="lg:col-span-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Trophy size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Sponsorship</h3>
                    <p className="text-purple-100">Ongoing brand exposure</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline mb-3">
                    <span className="text-4xl font-bold">Custom</span>
                    <span className="text-lg text-purple-100 ml-2">pricing</span>
                  </div>
                  <p className="text-purple-100 leading-relaxed">
                    Become a community sponsor with banner placement and custom integration options.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
                    <Sparkle size={20} className="text-yellow-300" />
                    <span>Banner placement on all pages</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
                    <Calendar size={20} className="text-blue-300" />
                    <span>Monthly recurring exposure</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl">
                    <LinkIcon size={20} className="text-green-300" />
                    <span>Custom integration options</span>
                  </div>
                </div>
                
                <a 
                  href="https://buy.stripe.com/14AaEXcVKbK49HN5C05J607"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all transform hover:scale-105"
                >
                  Become Sponsor
                  <ArrowRight size={20} className="ml-2" />
                </a>
              </div>
              
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>
            </div>

          </div>

          {/* Free Option */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-10 text-center mb-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart size={32} className="text-gray-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Free Launch Option</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Not ready for premium? Start with our free option! Your product will appear on the homepage for one day with a nofollow link on a randomly assigned launch day.
              </p>
              <Link 
                to="/submit"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-lg font-semibold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Submit for Free
                <ArrowRight size={24} className="ml-3" />
              </Link>
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