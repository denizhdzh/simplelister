import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '../firebase'; // Assuming firebase is configured here
import Header from '../components/Header';
import Footer from '../components/Footer';
import LeaderboardList from '../components/LeaderboardList'; // Import the new component
import { Rocket, User, Fire, ThumbsUp } from '@phosphor-icons/react'; // Icons for list items

// Helper function to capitalize the first letter (if not already available globally)
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const LEADERBOARD_LIMIT = 10;

function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch Top Users
  useEffect(() => {
    const fetchTopUsers = async () => {
      setLoadingUsers(true);
      try {
        const db = getFirestore(app);
        const usersRef = collection(db, 'users');
        // Rank users by streak count
        const q = query(usersRef, orderBy('streak.count', 'desc'), limit(LEADERBOARD_LIMIT));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched userList:', userList); // Added for debugging
        setTopUsers(userList);
      } catch (error) {
        console.error("Error fetching top users:", error);
        // Handle error appropriately
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchTopUsers();
  }, []);

  // Fetch Top Products
  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoadingProducts(true);
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('upvote', 'desc'), limit(LEADERBOARD_LIMIT));
        const snapshot = await getDocs(q);
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTopProducts(productList);
      } catch (error) {
        console.error("Error fetching top products:", error);
        // Handle error appropriately
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchTopProducts();
  }, []);

  // Render function for a single user item (Updated Icon Styles)
  const renderUserItem = (user, index) => {
    console.log('Rendering user item:', user); // Added for debugging
    const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=random`;

    const handleImageError = (event) => {
      console.log('Image error triggered for:', event.target.currentSrc, 'Switching to fallback:', fallbackAvatarUrl); // Updated for debugging
      // Prevent infinite loop if the fallback itself fails
      if (event.target.src !== fallbackAvatarUrl) {
        event.target.src = fallbackAvatarUrl;
      }
    };

    return (
      <div className="flex items-center space-x-3">
        <span className="w-6 text-right font-medium text-gray-500 text-sm">{index + 1}</span>
        <img 
          src={user.profilePicture || user.photoURL || fallbackAvatarUrl} 
          alt={user.displayName || user.username || 'User'}
          className="h-10 w-10 rounded-full object-cover bg-gray-200"
          onError={handleImageError}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Anonymous User'}</p>
          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center">
              <Fire size={14} weight="bold" className="mr-1"/>
              {user.streak?.count || 0} streak
            </span>
            <span className="inline-flex items-center">
               <ThumbsUp size={14} weight="bold" className="mr-1"/>
               {user.upvotedProducts?.length || 0} upvotes
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render function for a single product item (Wrapped in Link)
  const renderProductItem = (product, index) => (
    <Link to={`/product/${product.slug}`} className="block w-full">
      <div className="flex items-center space-x-3">
        <span className="w-6 text-right font-medium text-gray-500 text-sm">{index + 1}</span>
        <div className="relative flex-shrink-0 w-10 h-10 rounded-[10px] p-1 flex items-center justify-center overflow-hidden bg-gray-100">
            {product.logo && product.logo.url ? (
                <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full rounded-[5px] h-full object-contain" />
            ) : (
                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-xs text-gray-500">{product.product_name?.charAt(0) || 'P'}</span>
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{product.product_name || 'Unnamed Product'}</p>
            {product.tagline && <p className="text-xs text-gray-500 truncate">{product.tagline}</p>}
        </div>
        <div className="flex items-center text-sm font-semibold text-gray-700">
            <Rocket size={14} weight="bold" className="mr-1"/> 
            {product.upvote || 0}
        </div>
      </div>
    </Link>
  );


  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Fire size={18} className="text-orange-500" />
              <span className="text-sm font-mono opacity-50">leaderboard</span>
            </div>
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              Top Contributors
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Community champions and trending products making waves this month.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* User Leaderboard */}
            <div>
              <h2 className="text-xl font-semibold text-black mb-6">Top Users</h2>
              {loadingUsers ? (
                <div className="space-y-4">
                  {Array(LEADERBOARD_LIMIT).fill().map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                      <div className="w-6 h-4 bg-gray-200"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <img 
                        src={user.profilePicture || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=random`} 
                        alt={user.displayName || user.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          if (e.target.src !== `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=random`) {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username || 'User')}&background=random`;
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-black">
                          {user.displayName || 'Anonymous User'}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          {user.streak?.count || 0} day streak • {user.upvotedProducts?.length || 0} votes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Leaderboard */}
            <div>
              <h2 className="text-xl font-semibold text-black mb-6">Top Products</h2>
              {loadingProducts ? (
                <div className="space-y-4">
                  {Array(LEADERBOARD_LIMIT).fill().map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                      <div className="w-6 h-4 bg-gray-200"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 w-1/2"></div>
                      </div>
                      <div className="w-12 h-4 bg-gray-200"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {topProducts.map((product, index) => (
                    <Link 
                      key={product.id} 
                      to={`/product/${product.slug}`}
                      className="flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      
                      <div className="w-10 h-10">
                        {product.logo && product.logo.url ? (
                          <img 
                            src={product.logo.url} 
                            alt={product.product_name} 
                            className="w-10 h-10 rounded object-cover" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {product.product_name?.charAt(0) || 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black truncate">
                          {product.product_name || 'Unnamed Product'}
                        </div>
                        {product.tagline && (
                          <div className="text-sm text-gray-500 truncate">
                            {product.tagline}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm font-mono text-gray-600">
                        {product.upvote || 0} votes
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LeaderboardPage; 