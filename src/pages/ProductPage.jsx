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
import { Rocket, Tag, LinkSimple, LinkedinLogo, TwitterLogo } from '@phosphor-icons/react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Product Content Area */}
            <div className="flex-1 order-1 bg-white border border-gray-100 rounded-lg p-6">
              {/* Product Header (Logo, Name, Tagline, Upvote) */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                {/* Logo */}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl p-1 flex items-center justify-center overflow-hidden bg-gray-100 border border-gray-200">
                  {product.logo && product.logo.url ? (
                    <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full rounded-lg h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-500">{product.product_name?.charAt(0) || 'P'}</span>
                    </div>
                  )}
                </div>
                {/* Info + Upvote */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1 inline-flex items-center">
                    {product.product_name || 'Unnamed Product'}
                    {productBadgeImageUrl && (
                      <img 
                        src={productBadgeImageUrl} 
                        alt={`Badge ${product.badge}`}
                        title={`Badge ${product.badge}`}
                        className="h-8 w-auto ml-2 inline-block align-middle"
                      />
                    )}
                  </h1>
                  {product.tagline && <p className="text-lg text-gray-600 mb-3">{product.tagline}</p>}
                </div>
                {/* Upvote Button */}
                <button 
                  onClick={handleUpvote}
                  disabled={isVoting}
                  className={`flex flex-col items-center justify-center border rounded-md px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${userHasUpvoted ? 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100 focus:ring-red-500/50' : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-400'} ${isVoting ? 'cursor-not-allowed opacity-70' : ''}`}
                  aria-label={`Upvote ${product.product_name}`}
                >
                  <Rocket size={20} weight={userHasUpvoted ? "fill" : "bold"} className={userHasUpvoted ? 'text-red-500' : 'text-gray-700'}/>
                  <span className={`text-sm font-semibold mt-1 ${userHasUpvoted ? 'text-red-600' : 'text-gray-800'}`}>
                    {product.upvote || 0}
                  </span>
                </button>
              </div>

              {/* Links & Tags Section */}
              <div className="mb-6">
                {/* Horizontal Link Buttons */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {effectiveProductUrl && (
                    <a
                      href={effectiveProductUrl.startsWith('http') ? effectiveProductUrl : `https://${effectiveProductUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                    >
                      <LinkSimple size={16} weight="bold" className="mr-1.5" />
                      Website
                    </a>
                  )}
                  {product.linkedin_url && (
                    <a
                      href={product.linkedin_url.startsWith('http') ? product.linkedin_url : `https://${product.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                    >
                      <LinkedinLogo size={16} weight="bold" className="mr-1.5" />
                      LinkedIn
                    </a>
                  )}
                  {product.twitter_url && (
                    <a
                      href={product.twitter_url.startsWith('http') ? product.twitter_url : `https://${product.twitter_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                    >
                      <TwitterLogo size={16} weight="bold" className="mr-1.5" />
                      Twitter
                    </a>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 justify-start">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Link 
                          key={category} 
                          to={`/categories/${encodeURIComponent(category)}`}
                          className="text-xs flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 px-2.5 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                        >
                          <Tag size={12} />
                          {capitalizeFirstLetter(category)}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No categories</span>
                    )}
                  </div>
              </div>

              {/* Image Gallery */}
              <ProductImageGallery images={productImages} />

              {/* Product Description */}
              {product.description && (
                <div className="prose prose-sm max-w-none mb-6">
                  <h2 className="text-lg font-semibold mb-2">About the Product</h2>
                  <p>{product.description}</p> 
                </div>
              )}
              
              {/* Related Products Section */}
              <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Products</h2>
                  <ProductList 
                    products={relatedProducts} 
                    loading={loadingRelated} 
                    currentUser={currentUser}
                    userProfileData={loggedInUserProfileData}
                    updateLocalProductVote={updateRelatedProductVote}
                    updateLocalBookmark={updateLocalBookmarkForRelatedProducts}
                  />
                  {!loadingRelated && relatedProducts.length === 0 && (
                     <div className="bg-white border border-gray-100 rounded-lg p-6 text-center">
                       <p className="text-sm text-gray-500">No related products found.</p>
                     </div>
                  )}
              </div>

            </div>
            
            {/* Sidebar */}
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

export default ProductPage; 