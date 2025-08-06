import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { app, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Fire } from '@phosphor-icons/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import CategoryProductList from '../components/CategoryProductList';

// Helper function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

function CategoryPage() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [groupedCategories, setGroupedCategories] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userProfileData, setUserProfileData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const decodedCategoryName = decodeURIComponent(categoryName || '');

  // Callback to fetch user profile
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setUserProfileData(null);
      return null;
    }
    try {
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const profileData = { id: userId, ...userDocSnap.data() };
        setUserProfileData(profileData);
        return profileData;
      } else {
        setUserProfileData(null);
        return null;
      }
    } catch (error) {
      console.error("CategoryPage: Error fetching user profile:", error);
      setUserProfileData(null);
      return null;
    }
  }, []);

  // Effect for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfileData(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [fetchUserProfile]);

  // Effect to fetch and group all unique categories
  useEffect(() => {
    console.log("CategoryPage: fetchAllCategories effect running");
    const fetchAllCategories = async () => {
      setLoadingCategories(true);
      setGroupedCategories({});
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        const categoryMap = new Map(); 
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.taglines && Array.isArray(data.taglines)) {
            data.taglines.forEach(tag => {
              if (tag && typeof tag === 'string') {
                const lowerTag = tag.toLowerCase();
                if (!categoryMap.has(lowerTag)) {
                  categoryMap.set(lowerTag, tag); // Store lowercase as key, ORIGINAL case as value
                }
              }
            });
          }
        });
        
        // uniqueOriginalCaseCategories will have the casing as it first appeared in the DB for each unique lowercase tag
        const uniqueOriginalCaseCategories = Array.from(categoryMap.values());
        const sortedCategories = uniqueOriginalCaseCategories.sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );

        const groups = {};
        let initialLetter = null;
        sortedCategories.forEach(cat => { // cat is now in its original casing
          const firstLetter = cat.charAt(0).toUpperCase();
          if (!groups[firstLetter]) {
            groups[firstLetter] = [];
            if (!initialLetter) initialLetter = firstLetter;
          }
          groups[firstLetter].push(cat); // Push original cased cat
        });
        setGroupedCategories(groups);

        // Determine selected letter based on decodedCategoryName (which comes from lowercase URL)
        // or fall back to the initial letter from sorted original case categories.
        const currentCategoryFirstLetter = decodedCategoryName ? decodedCategoryName.charAt(0).toUpperCase() : initialLetter;
        if (currentCategoryFirstLetter && groups[currentCategoryFirstLetter]) {
          setSelectedLetter(currentCategoryFirstLetter);
        } else if (initialLetter) {
          setSelectedLetter(initialLetter);
        }
        console.log("CategoryPage: fetchAllCategories finished. Selected Letter:", selectedLetter);

      } catch (err) {
        console.error("Error fetching all categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchAllCategories();
  }, []);

  // Effect to fetch products for the selected category
  useEffect(() => {
    const fetchProductsByCategoryLogic = async () => {
      const lowerDecodedCategoryName = decodedCategoryName.toLowerCase(); // From lowercase URL
      console.log(`CategoryPage: fetchProductsByCategory EFFECT TRIGGERED. Original URL category: '${categoryName}', Decoded: '${decodedCategoryName}', Lowercase for matching: '${lowerDecodedCategoryName}', Auth Loading: ${authLoading}`);

      if (!lowerDecodedCategoryName) {
        console.log("CategoryPage: fetchProductsByCategory SKIPPING (No category name yet).");
        setProducts([]);
        setLoadingProducts(false);
        return;
      }
      if (authLoading || loadingCategories) { // Also wait if categories are still loading
        console.log(`CategoryPage: fetchProductsByCategory WAITING for auth or categories. Category: '${lowerDecodedCategoryName}'.`);
        return;
      }

      // Find the original-cased category name that matches the lowercase name from the URL
      let categoryToQuery = null;
      if (groupedCategories) {
        for (const letterGroup of Object.values(groupedCategories)) {
          const foundCat = letterGroup.find(cat => cat.toLowerCase() === lowerDecodedCategoryName);
          if (foundCat) {
            categoryToQuery = foundCat; // This is the original cased category name
            break;
          }
        }
      }

      if (!categoryToQuery) {
        console.warn(`CategoryPage: Could not find original casing for '${lowerDecodedCategoryName}'. Products will likely be 0.`);
        // We can still proceed with the lowercase query as a fallback, or just show no products.
        // For now, let's proceed, but it indicates a potential issue if we expect matches.
        categoryToQuery = lowerDecodedCategoryName; // Fallback, might not match if DB casing is different
      }
      
      console.log(`CategoryPage: fetchProductsByCategory PROCEEDING. Querying with: '${categoryToQuery}'.`);
      setLoadingProducts(true);
      setError(null);
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef,
          where('taglines', 'array-contains', categoryToQuery), // Query with original case found
          orderBy('launch_date', 'desc') 
        );
        const snapshot = await getDocs(q);
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`CategoryPage: fetchProductsByCategory SUCCESS. Found ${productList.length} products for '${categoryToQuery}'.`);
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products by category:", err);
        setError('Failed to load products for this category.');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
        console.log("CategoryPage: fetchProductsByCategory FINALLY. setLoadingProducts(false).");
      }
    };
    fetchProductsByCategoryLogic();
  }, [categoryName, decodedCategoryName, authLoading, loadingCategories, groupedCategories]);

  // Get sorted letters for rendering buttons AND for the redirect logic
  // This needs to be defined before the useEffect that uses it.
  const sortedLetters = Object.keys(groupedCategories || {}).sort();

  // useEffect to handle redirection if no category is in the URL
  useEffect(() => {
    if (!decodedCategoryName && !loadingCategories && sortedLetters.length > 0) {
      const firstLetter = sortedLetters[0];
      if (firstLetter && groupedCategories[firstLetter] && groupedCategories[firstLetter].length > 0) {
        const firstCategoryOriginalCasing = groupedCategories[firstLetter][0]; // This is original cased
        console.log(`CategoryPage: No category in URL, redirecting. First original: ${firstCategoryOriginalCasing}, Navigating to lowercase: ${firstCategoryOriginalCasing.toLowerCase()}`);
        navigate(`/categories/${encodeURIComponent(firstCategoryOriginalCasing.toLowerCase())}`, { replace: true }); // Navigate to its lowercase URL version
      }
    }
  }, [decodedCategoryName, loadingCategories, groupedCategories, sortedLetters, navigate]);

  // Placeholder functions for local updates (might not be needed visually on this page)
  const updateLocalProductVote = useCallback((productId, change, userId) => {
    // Update the products state locally for optimistic UI
    setProducts(currentProducts => 
      currentProducts.map(p => {
        if (p.id === productId) {
          const newUpvoteCount = (p.upvote || 0) + change;
          const newUpvotesMap = { ...(p.upvotes || {}) };
          if (change > 0) {
            newUpvotesMap[userId] = true;
          } else {
            delete newUpvotesMap[userId];
          }
          console.log(`CategoryPage: Updating local product ${productId}, new count: ${newUpvoteCount}`);
          return { ...p, upvote: newUpvoteCount, upvotes: newUpvotesMap };
        }
        return p;
      })
    );
  }, []);

  const updateLocalBookmark = useCallback((productId) => {
    // Update the user profile state locally for optimistic UI
    setUserProfileData(currentProfile => {
      if (!currentProfile) return null; // Should have profile if bookmarking
      const currentBookmarks = currentProfile.bookmarks || [];
      const isBookmarked = currentBookmarks.includes(productId);
      let newBookmarks;
      if (isBookmarked) {
        newBookmarks = currentBookmarks.filter(id => id !== productId);
        console.log(`CategoryPage: Removing local bookmark for ${productId}`);
      } else {
        newBookmarks = [...currentBookmarks, productId];
        console.log(`CategoryPage: Adding local bookmark for ${productId}`);
      }
      return { ...currentProfile, bookmarks: newBookmarks };
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Fire size={18} className="text-orange-500" />
              <span className="text-sm font-mono opacity-50">categories</span>
            </div>
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              {decodedCategoryName ? `${capitalizeFirstLetter(decodedCategoryName)} Products` : 'Browse Categories'}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover products organized by category, from the latest launches to community favorites.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {/* Category Navigation */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-black mb-4">Browse by Letter</h2>
                  <div className="flex flex-wrap gap-2">
                    {loadingCategories ? (
                      <div className="flex space-x-2 animate-pulse">
                        {Array(5).fill().map((_, i) => (
                          <div key={i} className="w-8 h-8 bg-gray-200"></div>
                        ))}
                      </div>
                    ) : (
                      sortedLetters.map(letter => (
                        <button
                          key={letter}
                          onClick={() => setSelectedLetter(letter)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-mono transition-all ${
                            selectedLetter === letter
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {letter}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {selectedLetter && groupedCategories[selectedLetter] && (
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4">
                      Categories starting with "{selectedLetter}"
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {groupedCategories[selectedLetter].map(cat => {
                        const lowerCat = cat.toLowerCase();
                        const isActive = lowerCat === decodedCategoryName.toLowerCase();
                        const encodedCatURL = encodeURIComponent(lowerCat);
                        return (
                          <Link
                            key={cat}
                            to={`/categories/${encodedCatURL}`}
                            className={`px-4 py-2 text-sm font-mono transition-all ${
                              isActive
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {capitalizeFirstLetter(cat)}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Products List */}
              {decodedCategoryName && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black">
                      {capitalizeFirstLetter(decodedCategoryName)} Products
                    </h2>
                    <span className="text-sm font-mono text-gray-500">
                      {loadingProducts ? 'loading...' : `${products.length} products`}
                    </span>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 p-4 mb-6">
                      <p className="text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <CategoryProductList 
                    products={products} 
                    loading={loadingProducts || authLoading}
                    currentUser={currentUser} 
                    userProfileData={userProfileData} 
                    updateLocalProductVote={updateLocalProductVote} 
                    updateLocalBookmark={updateLocalBookmark}
                  />
                </div>
              )}
            </div>
            
            <div className="w-full lg:w-64 lg:flex-shrink-0">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default CategoryPage; 