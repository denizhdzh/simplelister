import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, limit, orderBy, doc, getDoc, Timestamp, updateDoc, increment, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '../firebase';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import ProductImageGallery from '../components/ProductImageGallery';
import ProductList from '../components/ProductList';
import { Fire, Rocket, Tag, LinkSimple, LinkedinLogo, TwitterLogo } from '@phosphor-icons/react';
import { auth } from '../firebase';

// Initialize Firebase Functions and Stripe
const functions = getFunctions(app);
const createStripeCheckout = httpsCallable(functions, 'createStripeCheckoutSession');
// Use your publishable key
const stripePromise = loadStripe('pk_live_51Q8KL5DRgvwK8lM2WhTzDO0hwDVBJtRCCqytxH1pKGD94R8XsbABztFzaZgptqZhtRpkKJVQWn2taNoS49xKLM2h00lC87KeLY');

// Helper function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const RELATED_PRODUCTS_LIMIT = 10;

function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // All useState hooks at the top
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isVoting, setIsVoting] = useState(false);
  const [loggedInUserProfileData, setLoggedInUserProfileData] = useState(null);
  const [productBadgeImageUrl, setProductBadgeImageUrl] = useState(null);

  // All useEffect hooks
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fetchLoggedInUserProfile = async () => {
        try {
          const db = getFirestore(app);
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setLoggedInUserProfileData({ id: currentUser.uid, ...userDocSnap.data() });
          } else {
            setLoggedInUserProfileData(null);
            console.warn("ProductPage: Logged-in user profile not found in Firestore.");
          }
        } catch (error) {
          console.error("ProductPage: Error fetching logged-in user profile:", error);
          setLoggedInUserProfileData(null);
        }
      };
      fetchLoggedInUserProfile();
    } else {
      setLoggedInUserProfileData(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!slug) return;

    const fetchProductBySlug = async () => {
      setLoading(true);
      setError(null);
      setProduct(null);
      setRelatedProducts([]);
      setLoadingRelated(false);
      setCreatorInfo(null);
      setIsUpgrading(false);
      setUpgradeError('');
      setProductBadgeImageUrl(null);

      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        
        const q = query(
          productsRef,
          where('slug', '==', slug),
          limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Product not found.');
        } else {
          const productData = snapshot.docs[0].data();
          setProduct({ id: snapshot.docs[0].id, ...productData });
        }
      } catch (err) {
        console.error("Error fetching product by slug:", err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductBySlug();
  }, [slug]);

  useEffect(() => {
    if (!product) return;

    // Fetch creator data
    if (product.submitterId) {
      const fetchCreatorData = async () => {
        try {
          const db = getFirestore(app);
          const userDocRef = doc(db, 'users', product.submitterId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCreatorInfo(userDocSnap.data());
          } else {
            console.warn("Creator user document not found:", product.submitterId);
            setCreatorInfo({ displayName: 'Unknown User' });
          }
        } catch (err) {
          console.error("Error fetching creator data:", err);
          setCreatorInfo({ displayName: 'Error loading user' });
        }
      };
      fetchCreatorData();
    }

    // Fetch product badge image
    if (product.badge) {
      const fetchBadgeImage = async () => {
        try {
          const storage = getStorage(app);
          const imagePath = `badges/${product.badge}.png`;
          const imageRef = ref(storage, imagePath);
          const url = await getDownloadURL(imageRef);
          setProductBadgeImageUrl(url);
        } catch (error) {
          console.error("Error fetching product badge image URL:", error);
          setProductBadgeImageUrl(null);
        }
      };
      fetchBadgeImage();
    }

    // Fetch related products
    if (product.taglines && product.taglines.length > 0) {
      const fetchRelatedProducts = async () => {
        setLoadingRelated(true);
        try {
          const db = getFirestore(app);
          const productsRef = collection(db, 'products');

          const q = query(
            productsRef,
            where('taglines', 'array-contains-any', product.taglines),
            where('slug', '!=', product.slug),
            orderBy('upvote', 'desc'),
            limit(RELATED_PRODUCTS_LIMIT)
          );

          const snapshot = await getDocs(q);
          const productList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRelatedProducts(productList);
        } catch (err) {
          console.error("Error fetching related products:", err);
        } finally {
          setLoadingRelated(false);
        }
      };
      fetchRelatedProducts();
    }
  }, [product]);

  // Regular functions instead of useCallback
  const updateLocalBookmarkForRelatedProducts = (productId) => {
    setLoggedInUserProfileData(currentProfile => {
      if (!currentProfile) return null;
      const currentBookmarks = currentProfile.bookmarks || [];
      const isBookmarked = currentBookmarks.includes(productId);
      let newBookmarks;
      if (isBookmarked) {
        newBookmarks = currentBookmarks.filter(id => id !== productId);
      } else {
        newBookmarks = [...currentBookmarks, productId];
      }
      console.log(`ProductPage (Related): Updating local bookmarks. Product ${productId} ${isBookmarked ? 'removed' : 'added'}.`);
      return { ...currentProfile, bookmarks: newBookmarks };
    });
  };

  const updateRelatedProductVote = (productId, change, userId) => {
    setRelatedProducts(prevProducts => 
      prevProducts.map(p => {
        if (p.id === productId) {
          const newUpvoteCount = (p.upvote || 0) + change;
          const newUpvotesMap = { ...(p.upvotes || {}) };
          if (change > 0) {
            newUpvotesMap[userId] = true;
          } else {
            delete newUpvotesMap[userId];
          }
          return { 
            ...p, 
            upvote: newUpvoteCount,
            upvotes: newUpvotesMap
          };
        }
        return p;
      })
    );
  };

  const handleUpvote = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isVoting) {
      return;
    }

    setIsVoting(true);
    const db = getFirestore(app);
    const productRef = doc(db, 'products', product.id);
    const userDocRef = doc(db, 'users', currentUser.uid); 
    const userHasUpvoted = currentUser && product?.upvotes?.[currentUser.uid] === true;
    const change = userHasUpvoted ? -1 : 1;
    const userId = currentUser.uid;

    // Optimistic UI Update
    const originalProduct = { ...product };
    const optimisticProduct = {
      ...product,
      upvote: (product.upvote || 0) + change,
      upvotes: {
        ...product.upvotes,
        [userId]: !userHasUpvoted
      }
    };
    if (userHasUpvoted) {
      delete optimisticProduct.upvotes[userId];
    }
    setProduct(optimisticProduct);

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
      setProduct(originalProduct);
      setError('Failed to update vote. Please try again.');
    } finally {
      setTimeout(() => setIsVoting(false), 300);
    }
  };

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
     return null;
  }

  const userHasUpvoted = currentUser && product?.upvotes?.[currentUser.uid] === true;
  const productImages = product.images || []; 
  const categories = product.taglines && Array.isArray(product.taglines) ? product.taglines : [];
  const effectiveProductUrl = product.product_url || product.url;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6">
              <Fire size={18} className="text-orange-500" />
              <span className="text-sm font-mono opacity-50">product details</span>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-100 p-2">
                {product.logo && product.logo.url ? (
                  <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-500">{product.product_name?.charAt(0) || 'P'}</span>
                  </div>
                )}
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-black mb-2 leading-tight flex items-center">
                  {product.product_name || 'Unnamed Product'}
                  {productBadgeImageUrl && (
                    <img 
                      src={productBadgeImageUrl} 
                      alt={`Badge ${product.badge}`}
                      title={`Badge ${product.badge}`}
                      className="h-10 w-auto ml-3"
                    />
                  )}
                </h1>
                {product.tagline && <p className="text-lg text-gray-600 leading-relaxed">{product.tagline}</p>}
              </div>
              <button 
                onClick={handleUpvote}
                disabled={isVoting}
                className={`flex items-center gap-2 px-4 py-2 font-mono transition-all ${
                  userHasUpvoted 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                } ${isVoting ? 'opacity-70 cursor-not-allowed' : ''}`}
                aria-label={`Upvote ${product.product_name}`}
              >
                <Fire size={18} weight={userHasUpvoted ? "fill" : "regular"} />
                <span className="font-semibold">{product.upvote || 0}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {/* Quick Actions */}
              <div className="mb-12">
                <div className="flex flex-wrap gap-3 mb-6">
                  {effectiveProductUrl && (
                    <a
                      href={effectiveProductUrl.startsWith('http') ? effectiveProductUrl : `https://${effectiveProductUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-semibold hover:opacity-70 transition-opacity"
                    >
                      <LinkSimple size={16} />
                      Visit Website
                    </a>
                  )}
                  {product.linkedin_url && (
                    <a
                      href={product.linkedin_url.startsWith('http') ? product.linkedin_url : `https://${product.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <LinkedinLogo size={16} />
                      LinkedIn
                    </a>
                  )}
                  {product.twitter_url && (
                    <a
                      href={product.twitter_url.startsWith('http') ? product.twitter_url : `https://${product.twitter_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <TwitterLogo size={16} />
                      Twitter
                    </a>
                  )}
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-mono mb-3 opacity-50">categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Link 
                          key={category} 
                          to={`/categories/${encodeURIComponent(category)}`}
                          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-mono"
                        >
                          {capitalizeFirstLetter(category)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Gallery */}
              <div className="mb-12">
                <ProductImageGallery images={productImages} />
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-black mb-4">About the Product</h2>
                  <div className="text-gray-700 leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                </div>
              )}
              
              {/* Related Products Section */}
              <div>
                <h2 className="text-xl font-semibold text-black mb-6">Related Products</h2>
                <ProductList 
                  products={relatedProducts} 
                  loading={loadingRelated} 
                  currentUser={currentUser}
                  userProfileData={loggedInUserProfileData}
                  updateLocalProductVote={updateRelatedProductVote}
                  updateLocalBookmark={updateLocalBookmarkForRelatedProducts}
                />
                {!loadingRelated && relatedProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500 font-mono">no related products found</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar */}
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

export default ProductPage; 