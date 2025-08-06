import React, { useState, useMemo } from 'react';
import { Rocket, BookmarkSimple, ArrowSquareOut, StarFour, CaretDoubleUp } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, updateDoc, increment, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app, auth } from '../firebase';

function CategoryProductList({ products, loading, currentUser, userProfileData, updateLocalProductVote, updateLocalBookmark }) {
  const [votingProductId, setVotingProductId] = useState(null);
  const [bookmarkingProductId, setBookmarkingProductId] = useState(null);
  const [sortBy, setSortBy] = useState('random');
  const navigate = useNavigate();

  const getCategories = (product) => {
    if (product.taglines && Array.isArray(product.taglines)) {
      return product.taglines;
    }
    if (product.topics && Array.isArray(product.topics)) {
      return product.topics;
    }
    return [];
  };

  const sortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    let sorted = [...products];
    
    switch (sortBy) {
      case 'popularity':
        sorted.sort((a, b) => (b.upvote || 0) - (a.upvote || 0));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const dateA = a.launch_date?.toDate ? a.launch_date.toDate() : new Date(0);
          const dateB = b.launch_date?.toDate ? b.launch_date.toDate() : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'random':
      default:
        // Fisher-Yates shuffle algorithm
        for (let i = sorted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        }
        break;
    }
    
    return sorted;
  }, [products, sortBy]);

  const handleUpvote = async (product) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (userProfileData && !userProfileData.onboardingCompleted) {
      navigate('/onboarding');
      return;
    }
    if (votingProductId === product.id) {
      return; 
    }
    
    const userId = currentUser.uid;
    const userHasUpvoted = product.upvotes?.[userId] === true;
    const change = userHasUpvoted ? -1 : 1;

    // Optimistic UI Update
    if (updateLocalProductVote) {
        updateLocalProductVote(product.id, change, userId);
    }

    setVotingProductId(product.id); 
    
    const db = getFirestore(app);
    const productRef = doc(db, 'products', product.id);
    const userDocRef = doc(db, 'users', userId); 

    try {
      if (userHasUpvoted) {
        await Promise.all([
          updateDoc(productRef, { upvote: increment(-1), [`upvotes.${userId}`]: deleteField() }),
          updateDoc(userDocRef, { upvotedProducts: arrayRemove(product.id) })
        ]);
      } else {
        await Promise.all([
          updateDoc(productRef, { upvote: increment(1), [`upvotes.${userId}`]: true }),
          updateDoc(userDocRef, { upvotedProducts: arrayUnion(product.id) })
        ]);
      }
      console.log('Firebase vote update successful for:', product.id);
    } catch (error) {
      console.error("Error updating vote or user profile: ", error);
      // Revert Optimistic UI on Error
      if (updateLocalProductVote) {
          updateLocalProductVote(product.id, -change, userId); 
      }
    } finally {
      setTimeout(() => {
        setVotingProductId(null);
      }, 500); 
    }
  };

  const handleBookmark = async (product) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (!userProfileData) {
        console.warn("Bookmark action attempted before userProfileData was available.");
        return; 
    }
    if (!userProfileData.onboardingCompleted) {
        navigate('/onboarding');
        return;
    }

    if (bookmarkingProductId === product.id) {
        return;
    }
    
    const userId = currentUser.uid;
    const isAlreadyBookmarked = userProfileData.bookmarks?.includes(product.id);

    // Optimistic UI Update
    if (updateLocalBookmark) {
        updateLocalBookmark(product.id);
    }

    setBookmarkingProductId(product.id); 
    const db = getFirestore(app);
    const userDocRef = doc(db, 'users', userId);

    try {
        if (isAlreadyBookmarked) {
            await updateDoc(userDocRef, {
                bookmarks: arrayRemove(product.id)
            });
        } else {
            await updateDoc(userDocRef, {
                bookmarks: arrayUnion(product.id)
            });
        }
        console.log("Firebase bookmark update successful for:", product.id);
    } catch (error) {
        console.error("Error updating bookmark status:", error);
        // Revert Optimistic UI on Error
         if (updateLocalBookmark) {
             updateLocalBookmark(product.id); // Call again to toggle back
         }
    } finally {
        setTimeout(() => {
             setBookmarkingProductId(null);
        }, 500);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 h-auto flex items-center animate-pulse">
            <div className="flex items-center w-full">
              <div className="w-10 flex flex-col items-center mr-4 space-y-1">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-[10px] p-1 mr-4"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex space-x-1">
                  <div className="h-3 bg-gray-200 rounded-md w-12"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-12"></div>
                </div>
              </div>
              <div className="ml-4 h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-6 bg-white border border-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">No products found.</p>
        <button 
          onClick={() => navigate('/categories')}
          className="mt-4 text-sm bg-black text-white rounded-md px-4 py-2 hover:bg-gray-800"
        >
          Browse all products
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Sorting Options */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-600">Sort by:</span>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="random">Random</option>
          <option value="popularity">Popularity</option>
          <option value="recent">Most Recent</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedProducts.map((product) => {
          const categories = getCategories(product);
          const userHasUpvoted = currentUser && product.upvotes?.[currentUser.uid] === true;
          const isBookmarked = userProfileData?.bookmarks?.includes(product.id);
          
          return (
            <div 
              key={product.id} 
              className="bg-white rounded-lg p-3 transition-all duration-200 ease-in-out hover:bg-neutral-50/90 hover:-translate-y-1"
            >
              <div className="flex items-center w-full">
                <Link 
                  to={`/product/${product.slug}`}
                  className="flex-shrink-0 w-12 h-12 rounded-[10px] p-1 mr-4 flex items-center justify-center overflow-hidden bg-gray-100"
                >
                  {product.logo && product.logo.url ? (
                    <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full rounded-[5px] h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-sm text-gray-500">{product.product_name.charAt(0)}</span>
                    </div>
                  )}
                </Link>
                
                <Link 
                  to={`/product/${product.slug}`} 
                  className="flex-1 min-w-0 flex flex-col justify-start rounded-sm"
                >
                  <h3 className="font-medium text-lg text-gray-900 mb-0.5 truncate">{product.product_name}</h3>
                  
                  {product.tagline && (
                    <p className="text-gray-600 text-sm mb-0.5 line-clamp-2">{product.tagline}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-0 justify-start">
                    {categories.length > 0 ? (
                      categories.slice(0, 3).map((category, index) => (
                        <span
                          key={index} 
                          className="text-[10px] py-0.5 px-0.5 text-gray-500"
                        >
                          #{category}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No categories</span>
                    )}
                  </div>
                </Link>

                <button 
                  onClick={() => handleUpvote(product)}
                  disabled={votingProductId === product.id}
                  className={`flex-shrink-0 w-10 flex flex-col items-center justify-center ml-4 p-1 rounded-md transition-colors border-transparent ${userHasUpvoted ? 'text-red-500' : 'text-gray-700 hover:bg-red-50'} ${(votingProductId === product.id) ? 'cursor-not-allowed opacity-50' : ''}`}
                  aria-label={`Upvote ${product.product_name}`}
                >
                  <CaretDoubleUp size={16} weight={userHasUpvoted ? "fill" : "bold"} />
                  <span className={`text-xs font-medium mt-0.5 ${userHasUpvoted ? 'text-red-600' : 'text-gray-800'}`}>
                      {product.upvote || 0}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryProductList; 