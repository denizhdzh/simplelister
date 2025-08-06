import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { GithubLogo, TwitterLogo, InstagramLogo } from '@phosphor-icons/react';
import logoSrc from '/logonaked.png'; // Import the logo

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12 mt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-red-500 p-2 rounded-lg">
                <img src={logoSrc} alt="SimpleLister Logo" className="h-5 w-auto" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Discover and share tech products in a simple, beautiful way.
            </p>
          </div>

          {/* Column 2: Products */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Browse</Link></li>
              <li><Link to="/submit" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Add Product</Link></li>
              <li><Link to="/categories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Collections</Link></li>
            </ul>
          </div>

          
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
      © {new Date().getFullYear()} Simple Lister. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Terms</Link>
              <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
          
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 