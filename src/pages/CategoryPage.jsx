import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { app, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 order-1">
              <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Products in "{capitalizeFirstLetter(decodedCategoryName)}"
                </h1>
              </div>
              
              {/* Category Filter Section */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                {/* Letter Selection Buttons */}
                <div className="mb-4 flex flex-wrap gap-x-2 gap-y-2">
                  {loadingCategories ? (
                    <div className="flex space-x-2 animate-pulse">
                      <div className="h-7 w-7 bg-gray-200 rounded"></div>
                      <div className="h-7 w-7 bg-gray-200 rounded"></div>
                      <div className="h-7 w-7 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    sortedLetters.map(letter => (
                      <button
                        key={letter}
                        onClick={() => setSelectedLetter(letter)}
                        className={`h-7 w-7 flex items-center justify-center text-xs font-medium rounded transition-colors focus:outline-none ${ 
                          selectedLetter === letter
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1'
                        }`}
                      >
                        {letter}
                      </button>
                    ))
                  )}
                </div>

                {/* Selected Letter's Categories */}
                <div className="flex flex-wrap gap-x-3 gap-y-2 min-h-[30px]">
                  {!loadingCategories && selectedLetter && groupedCategories[selectedLetter] && (
                    groupedCategories[selectedLetter].map(cat => { // cat is original cased here
                      const lowerCat = cat.toLowerCase();
                      const isActive = lowerCat === decodedCategoryName.toLowerCase(); // Compare lowercase with lowercase URL part
                      const encodedCatURL = encodeURIComponent(lowerCat); // URL version is lowercase
                      return (
                        <Link
                          key={cat} // Use original cased cat for key as it's unique in the list
                          to={`/categories/${encodedCatURL}`} // URL will be lowercase
                          className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center justify-center focus:outline-none ${ 
                            isActive
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1'
                          }`}
                        >
                          {capitalizeFirstLetter(cat)} {/* Display capitalized original, link is lowercase */}
                        </Link>
                      );
                    })
                  )}
                   {/* Show message if no categories for selected letter (shouldn't happen with current logic) */}
                  {!loadingCategories && (!selectedLetter || !groupedCategories[selectedLetter]) && sortedLetters.length > 0 && (
                     <p className="text-sm text-gray-500">Select a letter above.</p>
                  )}
                   {/* Show message if no categories found at all */}
                  {!loadingCategories && sortedLetters.length === 0 && (
                    <p className="text-sm text-gray-500">No categories found.</p>
                  )}
                </div>
              </div>

              {/* Products List */}
              {error && <p className="text-red-500">{error}</p>}
              <CategoryProductList 
                products={products} 
                loading={loadingProducts || authLoading}
                currentUser={currentUser} 
                userProfileData={userProfileData} 
                updateLocalProductVote={updateLocalProductVote} 
                updateLocalBookmark={updateLocalBookmark}
              />
            </div>
            
            <div className="w-full md:w-64 md:flex-shrink-0 order-2">
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