import React from 'react';
import { Star, Crown, Sparkle } from '@phosphor-icons/react';

const PremiumBadge = ({ type = 'premium', size = 'sm', className = '' }) => {
  const configs = {
    // Premium membership badge
    premium: {
      icon: Star,
      text: 'PREMIUM',
      className: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold text-xs px-2 py-1 rounded',
      iconSize: 10
    },
    
    // Business plan badge  
    business: {
      icon: Crown,
      text: 'BUSINESS',
      className: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs px-2 py-1 rounded',
      iconSize: 10
    },
    
    // Sponsor badges
    featured: {
      icon: Sparkle,
      text: 'FEATURED', 
      className: 'bg-orange-400 text-black font-mono text-xs px-1.5 py-0.5 rounded',
      iconSize: 10
    },
    
    premium_sponsor: {
      icon: Crown,
      text: 'PREMIUM SPONSOR',
      className: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white font-mono text-xs px-1.5 py-0.5 rounded',
      iconSize: 10
    },
    
    platinum_partner: {
      icon: Crown,
      text: 'PLATINUM PARTNER', 
      className: 'bg-gradient-to-r from-gray-700 to-gray-900 text-white font-mono text-xs px-1.5 py-0.5 rounded',
      iconSize: 10
    }
  };

  const config = configs[type] || configs.premium;
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'text-xs px-1 py-0.5',
    sm: 'text-xs px-2 py-1', 
    md: 'text-sm px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const iconSizes = {
    xs: 8,
    sm: 10,
    md: 12, 
    lg: 14
  };

  return (
    <div className={`inline-flex items-center gap-1 ${config.className} ${className}`}>
      <Icon size={iconSizes[size]} weight="fill" />
      <span className="font-mono font-bold">
        {config.text}
      </span>
    </div>
  );
};

export default PremiumBadge;