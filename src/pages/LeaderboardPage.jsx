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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
           <div className="mb-6 pb-4 border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Leaderboard
              </h1>
              <p className="text-base text-gray-600">Top contributors and products in the community</p>
           </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Leaderboard */}
            <div>
              <LeaderboardList 
                title="Top Users" 
                items={topUsers} 
                renderItem={renderUserItem} 
                loading={loadingUsers}
                loadingItemCount={LEADERBOARD_LIMIT}
              />
            </div>

            {/* Product Leaderboard */}
            <div>
              <LeaderboardList 
                title="Top Products" 
                items={topProducts} 
                renderItem={renderProductItem} 
                loading={loadingProducts}
                loadingItemCount={LEADERBOARD_LIMIT}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LeaderboardPage; 