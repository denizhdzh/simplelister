import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Star, CalendarBlank, CreditCard } from '@phosphor-icons/react';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from '../firebase';

const functions = getFunctions(app);
const createStripeCheckout = httpsCallable(functions, 'createStripeCheckoutSession');

// Ensure this is your correct Stripe Publishable Key
const stripePromise = loadStripe('pk_live_51Q8KL5DRgvwK8lM2WhTzDO0hwDVBJtRCCqytxH1pKGD94R8XsbABztFzaZgptqZhtRpkKJVQWn2taNoS49xKLM2h00lC87KeLY');

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'Not scheduled';
  return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

function MyProductsList({ products, currentUser }) {
  const [isLoadingUpgrade, setIsLoadingUpgrade] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!products) {
    return <div className="text-center py-10"><p>Loading products...</p></div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No products submitted yet.</p>
        <Link
          to="/submit"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none"
        >
          Submit Your First Product
        </Link>
      </div>
    );
  }

  const handleUpgradeToPremium = async (productId) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setIsLoadingUpgrade(productId);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User authentication lost. Please log in again.");
      }
      await user.getIdToken(true); // Force refresh token

      const result = await createStripeCheckout({ productId: productId });
      const sessionId = result.data.id;

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        throw new Error(`Payment Redirect Error: ${stripeError.message}`);
      }
    } catch (err) {
      console.error("Upgrade to Premium Error:", err);
      setError(`Upgrade failed: ${err.message || 'Please try again.'}`);
      setIsLoadingUpgrade(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {error && <p className="col-span-full text-red-500 text-sm mb-4 text-center">{error}</p>}
      {products.map((product) => {
        const isFreeTier = product.submissionType === 'free';
        const isRejected = product.submissionType === 'rejected';
        
        let isLaunched = false;
        if (product.launch_date && product.launch_date.toDate) {
          try {
            isLaunched = product.launch_date.toDate() < new Date();
          } catch (e) {
            console.error("Error converting launch_date to Date:", e, product.launch_date);
            isLaunched = false; // Fallback if toDate fails or comparison fails
          }
        } else if (typeof product.launch_date === 'string') {
            // Handle potential string date - attempt to parse
            try {
                isLaunched = new Date(product.launch_date) < new Date();
            } catch (e) {
                console.error("Error parsing string launch_date:", e, product.launch_date);
                isLaunched = false;
            }
        }

        const isPending = !isLaunched && !isRejected;

        let statusText = 'Unknown Status';
        let statusColor = 'bg-gray-400';

        if (isRejected) {
          statusText = 'Rejected';
          statusColor = 'bg-red-500';
        } else if (isLaunched) {
          statusText = 'Launched';
          statusColor = 'bg-green-500';
        } else if (isPending) {
          statusText = 'Pending / Scheduled';
          statusColor = 'bg-yellow-500';
        }
        
        const showUpgradeButton = !product.premium && isPending;

        return (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col transition-shadow hover:shadow-xl"
          >
            <div className="p-5 flex-grow">
              <div className="flex items-start space-x-4 mb-4">
                <Link
                  to={`/product/${product.slug}`}
                  className="flex-shrink-0 w-24 h-24 rounded-lg p-2 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white"
                >
                  {product.logo && product.logo.url ? (
                    <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <Package size={40} className="text-gray-400" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <Link 
                      to={`/product/${product.slug}`}
                      className="focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 focus:ring-offset-white rounded-sm block"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {product.product_name || 'Unnamed Product'}
                      </h3>
                    </Link>
                    <div className="flex items-center ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.upvote || 0}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                    {product.tagline || 'No tagline provided.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-gray-700 mb-5">
                <div className="flex items-center">
                  <CalendarBlank size={18} className="mr-2.5 text-gray-500 flex-shrink-0" />
                  <span>Launch Date: {product.launch_date ? formatDate(product.launch_date) : (isFreeTier ? 'Random' : 'Not scheduled')}</span>
                </div>
                <div className="flex items-center">
                  {isFreeTier ? (
                    <Package size={18} className="mr-2.5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Star size={18} weight="fill" className="mr-2.5 text-yellow-500 flex-shrink-0" />
                  )}
                  <span>Package: <span className="font-medium">{product.submissionType || 'N/A'}</span></span>
                </div>
                 <div className="flex items-center">
                   <span className={`mr-2.5 h-3 w-3 rounded-full ${statusColor} flex-shrink-0`}></span>
                  <span>Status: <span className="font-medium">{statusText}</span></span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 mt-auto">
              {showUpgradeButton && (
                <button
                  onClick={() => handleUpgradeToPremium(product.id)}
                  disabled={isLoadingUpgrade === product.id}
                  className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  <CreditCard size={20} className="mr-2" />
                  {isLoadingUpgrade === product.id ? 'Processing...' : 'Upgrade to Premium ($29)'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MyProductsList; 