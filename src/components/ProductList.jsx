import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { Fire } from '@phosphor-icons/react';
import { app, auth } from '../firebase';

function ProductList({ products, loading, currentUser, userProfileData, updateLocalProductVote, updateLocalBookmark }) {
  const [votingProductId, setVotingProductId] = useState(null);
  const [bookmarkingProductId, setBookmarkingProductId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
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

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    // Load user votes from localStorage on component mount
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  const saveUserVotes = (votes) => {
    localStorage.setItem('userVotes', JSON.stringify(votes));
    setUserVotes(votes);
  };

  const handleSupport = async (product, level) => {
    if (votingProductId === product.id) {
      return; 
    }
    
    // Check if user is trying to vote the same level (remove vote)
    const currentUserVote = userVotes[product.id] || 0;
    const finalLevel = currentUserVote === level ? 0 : level;
    
    setVotingProductId(product.id); 
    
    const db = getFirestore(app);
    const productRef = doc(db, 'products', product.id);
    const deviceId = getDeviceId();
    const voteKey = currentUser ? `vote_${currentUser.uid}` : `vote_${deviceId}`;

    try {
      // Get current product data
      const productDoc = await getDoc(productRef);
      const productData = productDoc.data() || {};
      const currentVotes = productData.deviceVotes || {};
      
      // Check existing vote in Firebase
      const existingVote = currentVotes[voteKey] || 0;
      const voteDifference = finalLevel - existingVote;
      
      // Update votes in Firebase
      if (finalLevel === 0) {
        delete currentVotes[voteKey];
      } else {
        currentVotes[voteKey] = finalLevel;
      }
      
      await updateDoc(productRef, {
        upvote: increment(voteDifference),
        deviceVotes: currentVotes
      });
      
      // Update local storage
      const newUserVotes = { ...userVotes };
      if (finalLevel === 0) {
        delete newUserVotes[product.id];
      } else {
        newUserVotes[product.id] = finalLevel;
      }
      saveUserVotes(newUserVotes);
      
      console.log('Vote update successful:', product.id, 'Level:', finalLevel);
    } catch (error) {
      console.error("Error updating vote: ", error);
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
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No products found</p>
        <button 
          onClick={() => navigate('/categories')}
          className="text-gray-900 hover:text-gray-600 underline"
        >
          Browse all products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products
        .sort((a, b) => {
          const aTotal = (a.upvote || 0) + (userVotes[a.id] > 0 ? userVotes[a.id] : 0);
          const bTotal = (b.upvote || 0) + (userVotes[b.id] > 0 ? userVotes[b.id] : 0);
          return bTotal - aTotal;
        })
        .map((product, index) => {
        const categories = getCategories(product);
        const currentUserVote = userVotes[product.id] || 0;
        
        return (
          <div key={product.id} className="flex items-center gap-4 py-3">
            <span className="text-sm text-gray-400 w-6">
              {index + 1}
            </span>
            
            <Link to={`/product/${product.slug}`} className="shrink-0">
              {product.logo && product.logo.url ? (
                <img 
                  src={product.logo.url} 
                  alt={product.product_name} 
                  className="w-12 h-12 rounded object-cover" 
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {product.product_name.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
            
            <div className="flex-1 min-w-0">
              <Link to={`/product/${product.slug}`}>
                <h3 className="text-lg font-semibold text-black hover:opacity-70 transition-opacity">
                  {product.product_name}
                </h3>
              </Link>
              <p className="text-gray-600 leading-relaxed mb-1">
                {product.tagline}
              </p>
              {categories.length > 0 && (
                <span className="text-sm text-gray-500 font-mono">
                  {categories[0]}
                </span>
              )}
            </div>
            
            <button
              onClick={() => handleSupport(product, 1)}
              disabled={votingProductId === product.id}
              className={`flex items-center gap-1.5 text-sm transition-opacity ${
                currentUserVote > 0 
                  ? 'opacity-100 font-bold' 
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <Fire size={16} weight={currentUserVote > 0 ? "fill" : "regular"} />
              <span className="font-mono">{(product.upvote || 0) + (currentUserVote > 0 ? currentUserVote : 0)} votes</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ProductList; 