// Pricing constants for SimpleLister monetization system

// Stripe Price IDs (placeholders - you'll replace with actual Stripe price IDs)
export const STRIPE_PRICE_IDS = {
  // Premium Membership Plans
  PREMIUM_MONTHLY: 'price_premium_monthly_placeholder',
  BUSINESS_MONTHLY: 'price_business_monthly_placeholder',
  
  // One-time Launch Packages  
  LAUNCH_BOOST: 'price_launch_boost_placeholder',
  MEGA_LAUNCH: 'price_mega_launch_placeholder',
  ENTERPRISE_LAUNCH: 'price_enterprise_launch_placeholder',
  
  // Sponsorship Packages (weekly recurring)
  BRONZE_SPONSOR: 'price_bronze_sponsor_placeholder',
  SILVER_SPONSOR: 'price_silver_sponsor_placeholder', 
  GOLD_SPONSOR: 'price_gold_sponsor_placeholder'
};

// Pricing tiers configuration
export const PRICING_PLANS = {
  // Free tier limits
  FREE: {
    name: 'Free',
    price: 0,
    submissionsPerWeek: 1,
    features: [
      'Random launch day',
      'Basic listing',
      'Community voting',
      'Basic analytics (views only)'
    ]
  },
  
  // Premium Membership
  PREMIUM: {
    name: 'Premium',
    price: 19,
    priceId: STRIPE_PRICE_IDS.PREMIUM_MONTHLY,
    interval: 'month',
    submissionsPerWeek: 'unlimited',
    features: [
      'Unlimited submissions',
      '⭐ Premium badge',
      'Priority support (24h)',
      'Advanced analytics',
      'Early access to features',
      'Enhanced profile',
      'Newsletter priority',
      'Community access'
    ]
  },
  
  // Business Plan
  BUSINESS: {
    name: 'Business',
    price: 49,
    priceId: STRIPE_PRICE_IDS.BUSINESS_MONTHLY,
    interval: 'month',
    submissionsPerWeek: 'unlimited',
    features: [
      'All Premium features',
      'Team management (5 users)',
      'White-label options',
      'API access',
      'Custom branding',
      'Priority listing review',
      'Dedicated account manager'
    ]
  }
};

// Launch Packages (One-time)
export const LAUNCH_PACKAGES = {
  BOOST: {
    name: 'Launch Boost',
    price: 99,
    priceId: STRIPE_PRICE_IDS.LAUNCH_BOOST,
    features: [
      'Guaranteed Top 3 position for launch day',
      'Featured in newsletter (50K+ subscribers)',
      'Social media promotion',
      'Launch day analytics report',
      '48h priority support',
      'Custom launch timeline planning'
    ]
  },
  
  MEGA: {
    name: 'Mega Launch',
    price: 299,
    priceId: STRIPE_PRICE_IDS.MEGA_LAUNCH,
    features: [
      'All Launch Boost features',
      'Homepage hero section (24h)',
      'Sticky announcement banner',
      'Press kit creation',
      'Influencer outreach',
      'LinkedIn company feature',
      'Custom success story article',
      '1-week extended promotion'
    ]
  },
  
  ENTERPRISE: {
    name: 'Enterprise Launch',
    price: 999,
    priceId: STRIPE_PRICE_IDS.ENTERPRISE_LAUNCH,
    features: [
      'All Mega Launch features',
      'Dedicated launch manager',
      'Custom landing page creation',
      'Email blast to entire user base',
      'PR distribution (200+ journalists)',
      'Video testimonial creation',
      'Podcast outreach coordination',
      '1-month marketing support',
      'Post-launch strategy session'
    ]
  }
};

// Sponsorship Tiers (Weekly recurring)
export const SPONSORSHIP_TIERS = {
  BRONZE: {
    name: 'Bronze Sponsor',
    price: 49,
    priceId: STRIPE_PRICE_IDS.BRONZE_SPONSOR,
    interval: 'week',
    badge: 'FEATURED',
    features: [
      'Sidebar featured section',
      'Yeşil "FEATURED" badge',
      '50K+ weekly impressions',
      'Click-through tracking',
      'Basic analytics report'
    ]
  },
  
  SILVER: {
    name: 'Silver Sponsor', 
    price: 199,
    priceId: STRIPE_PRICE_IDS.SILVER_SPONSOR,
    interval: 'week',
    badge: 'PREMIUM SPONSOR',
    features: [
      'Homepage top banner',
      'Sidebar featured section',
      '"PREMIUM SPONSOR" altın badge',
      'Priority ranking (top 5)',
      '200K+ weekly impressions',
      'Detailed analytics + conversion',
      'Newsletter mention'
    ]
  },
  
  GOLD: {
    name: 'Gold Sponsor',
    price: 499, 
    priceId: STRIPE_PRICE_IDS.GOLD_SPONSOR,
    interval: 'week',
    badge: 'PLATINUM PARTNER',
    features: [
      'Sticky header banner (all pages)',
      'Homepage hero section',
      'Sidebar premium slot',
      '"PLATINUM PARTNER" özel badge',
      '#1 guaranteed position (1 day)',
      '500K+ weekly impressions',
      'Custom landing page',
      'Social media promotion',
      'Newsletter featured article',
      'Direct email to subscribers'
    ]
  }
};

// Submission limits for free users
export const SUBMISSION_LIMITS = {
  FREE_WEEKLY_LIMIT: 1,
  RESET_DAY: 1, // Monday = 1
  RESET_HOUR: 0 // Midnight UTC
};

// Premium features flags
export const PREMIUM_FEATURES = {
  UNLIMITED_SUBMISSIONS: 'unlimited_submissions',
  ADVANCED_ANALYTICS: 'advanced_analytics', 
  PRIORITY_SUPPORT: 'priority_support',
  EARLY_ACCESS: 'early_access',
  ENHANCED_PROFILE: 'enhanced_profile',
  NEWSLETTER_PRIORITY: 'newsletter_priority',
  COMMUNITY_ACCESS: 'community_access',
  TEAM_MANAGEMENT: 'team_management',
  API_ACCESS: 'api_access',
  WHITE_LABEL: 'white_label'
};

export default {
  STRIPE_PRICE_IDS,
  PRICING_PLANS,
  LAUNCH_PACKAGES,
  SPONSORSHIP_TIERS,
  SUBMISSION_LIMITS,
  PREMIUM_FEATURES
};