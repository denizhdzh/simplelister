import React, { useState, useEffect } from 'react';
import { app, auth } from '../firebase'; // Firebase config dosyamız ve auth import edildi
import { getFirestore, doc, getDoc, collection, getDocs, where, query, orderBy, limit, Timestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth"; // onAuthStateChanged import edildi
import { Link } from 'react-router-dom'; // Removed useNavigate import
import { 
  ArrowRight, 
  Flame,
  Rocket,
  PlusSquare,
  Minus,
  Fire
  // Removed SignIn, ChartLine, Users, Lightning, Star, CaretRight, Plus, X
} from '@phosphor-icons/react';

// Helper function to check if two dates are the same day (ignoring time)
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Helper function to check if date1 is the day before date2
const isYesterday = (date1, date2) => {
  if (!date1 || !date2) return false;
  const yesterday = new Date(date2);
  yesterday.setDate(date2.getDate() - 1);
  return isSameDay(date1, yesterday);
};

function Sidebar() {
  const [underdogProduct, setUnderdogProduct] = useState(null);
  const [loadingUnderdog, setLoadingUnderdog] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [streakCount, setStreakCount] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [adsProduct, setAdsProduct] = useState(null);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsGradientColors, setAdsGradientColors] = useState('from-red-500 to-neutral-950');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [showFeaturedPopup, setShowFeaturedPopup] = useState(false);
  const [showSponsorPopup, setShowSponsorPopup] = useState(false);





  useEffect(() => {
    const db = getFirestore(app);

    // --- Auth State Listener --- 
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true);
      if (user) {
        // Kullanıcı giriş yapmış
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const now = new Date(); // Current date
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
          let currentStreakCount = 0;
          let needsUpdate = false;
          let updateData = {};

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const streakData = userData.streak;
            const lastUpdatedTimestamp = streakData?.lastUpdated;
            let lastUpdateDate = null;

            if (lastUpdatedTimestamp && lastUpdatedTimestamp.toDate) {
                lastUpdateDate = lastUpdatedTimestamp.toDate();
            }

            console.log("Current User Streak Data:", streakData);
            console.log("Last Update Date:", lastUpdateDate);
            console.log("Today:", today);

            if (lastUpdateDate) {
              if (isSameDay(lastUpdateDate, today)) {
                // Already updated today, do nothing
                currentStreakCount = streakData.count || 0;
                console.log("Streak already updated today.");
              } else if (isYesterday(lastUpdateDate, today)) {
                // Updated yesterday, increment streak
                currentStreakCount = (streakData.count || 0) + 1;
                needsUpdate = true;
                updateData = { 
                  'streak.count': increment(1),
                  'streak.lastUpdated': Timestamp.fromDate(today) // Update to start of today
                };
                console.log("Streak incremented.");
              } else {
                // Missed days, reset streak
                currentStreakCount = 1;
                needsUpdate = true;
                updateData = { 
                  'streak.count': 1,
                  'streak.lastUpdated': Timestamp.fromDate(today) // Update to start of today
                };
                console.log("Streak reset.");
              }
            } else {
              // No previous streak data, start new streak
              currentStreakCount = 1;
              needsUpdate = true;
              updateData = { 
                'streak.count': 1, 
                'streak.lastUpdated': Timestamp.fromDate(today) // Update to start of today
              };
              console.log("Starting new streak.");
            }
          } else {
            // User document doesn't exist, create it with streak 1
            currentStreakCount = 1;
            needsUpdate = true; // Need to create the doc/field
             updateData = { 
                'streak.count': 1, 
                'streak.lastUpdated': Timestamp.fromDate(today) // Start of today
             };
            // Note: This assumes the user document might be created elsewhere.
            // If not, you might need setDoc here instead of updateDoc.
            // For simplicity, assuming updateDoc will create the field if the doc exists.
            console.log("User document not found, setting streak to 1.");
          }

          // Update Firestore if necessary
          if (needsUpdate) {
            try {
              if (userDocSnap.exists()) {
                await updateDoc(userDocRef, updateData);
                console.log("Firestore streak data updated successfully.");
              } else {
                // Document does not exist, so create it with setDoc
                const initialData = {
                  ...updateData,
                  email: user.email, // Make sure to add other essential fields
                  displayName: user.displayName || 'New User',
                  createdAt: Timestamp.now()
                };
                await setDoc(userDocRef, initialData, { merge: true });
                console.log("User document created with initial streak data.");
              }
            } catch (error) {
              console.error("Error updating/setting user streak data in Firestore: ", error);
            }
          }
          
          // Update local state
          setStreakCount(currentStreakCount);

        } catch (error) {
          console.error("Error fetching/processing user streak data: ", error);
          setStreakCount(0); // Reset to 0 on error
        }
      } else {
        // Kullanıcı çıkış yapmış
        setCurrentUser(null);
        setStreakCount(0);
      }
      setLoadingAuth(false);
    });

    // Underdog ürünü çek (Updated Logic)
    const fetchUnderdog = async () => {
      setLoadingUnderdog(true);
      setUnderdogProduct(null); // Reset previous product
      try {
        const underdogConfigRef = doc(db, 'system', 'underdog');
        const configSnap = await getDoc(underdogConfigRef);

        if (configSnap.exists()) {
          const configData = configSnap.data();
          const underdogProductId = configData.productId; // *** Assuming the field is named 'productId' ***

          if (underdogProductId) {
            // Now fetch the actual product using the ID
            const productRef = doc(db, 'products', underdogProductId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
              setUnderdogProduct({ id: productSnap.id, ...productSnap.data() });
            } else {
              console.log(`Underdog product document with ID ${underdogProductId} not found in products collection!`);
            }
          } else {
            console.log("Underdog config document does not contain a productId field.");
          }
        } else {
          console.log("Underdog config document (system/underdog) not found!");
        }
      } catch (error) {
        console.error("Error fetching underdog product: ", error);
      } finally {
        setLoadingUnderdog(false);
      }
    };

    fetchUnderdog();

    // Fetch specific ads product
    const fetchAdsProduct = async () => {
      setLoadingAds(true);
      setAdsProduct(null);
      try {
        const adsProductId = 'I2BvauGAHdH9VYSaEnwb';
        const productRef = doc(db, 'products', adsProductId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          setAdsProduct(productData);
          console.log("Ads product fetched successfully:", productData);
          
          // Keep simple red gradient
          setAdsGradientColors('from-red-500 to-red-950');
        } else {
          console.log(`Ads product with ID ${adsProductId} not found!`);
        }
      } catch (error) {
        console.error("Error fetching ads product: ", error);
      } finally {
        setLoadingAds(false);
      }
    };

    fetchAdsProduct();

    // Fetch featured products
    const fetchFeaturedProducts = async () => {
      setLoadingFeatured(true);
      setFeaturedProducts([]);
      try {
        const featuredConfigRef = doc(db, 'system', 'featured_products');
        const configSnap = await getDoc(featuredConfigRef);

        if (configSnap.exists()) {
          const configData = configSnap.data();
          console.log("Featured products config data:", configData);
          // Use the correct field name: productId (array)
          const featuredProductIds = configData.productId || [];

          if (featuredProductIds.length > 0) {
            // Fetch all featured products
            const productPromises = featuredProductIds.map(async (productId) => {
              try {
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                  return { id: productSnap.id, ...productSnap.data() };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching featured product ${productId}:`, error);
                return null;
              }
            });

            const products = await Promise.all(productPromises);
            const validProducts = products.filter(product => product !== null);
            setFeaturedProducts(validProducts);
            console.log("Featured products fetched successfully:", validProducts);
          } else {
            console.log("Featured products config does not contain productId field or it's empty.");
          }
        } else {
          console.log("Featured products config document (system/featured_products) not found!");
        }
      } catch (error) {
        console.error("Error fetching featured products: ", error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedProducts();

    // Cleanup listener on component unmount
    return () => {
      unsubscribeAuth();
    };

  }, []);

  // Tarih formatlama (Timestamp nesnesini okunaklı hale getirmek için)
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    // Firestore Timestamp'ı JavaScript Date nesnesine çevir
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR'); // veya istediğin başka bir format
  };

  return (
    <div className="sticky top-16 space-y-6">
      {/* Banner Ads */}
      {loadingAds ? (
        <div className="h-32 bg-gray-100 animate-pulse"></div>
      ) : adsProduct ? (
        <a 
          href={`${adsProduct.product_url?.startsWith('http') ? adsProduct.product_url : `https://${adsProduct.product_url}`}?ref=simplelister`}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="bg-black text-white p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="bg-orange-400 text-black text-xs font-mono px-1.5 py-0.5">
                FEATURED
              </span>
              {adsProduct.logo && adsProduct.logo.url && (
                <div className="w-8 h-8 bg-white rounded p-1">
                  <img 
                    src={adsProduct.logo.url} 
                    alt={`${adsProduct.product_name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-lg mb-1">
              {adsProduct.product_name}
            </h3>
            {adsProduct.tagline && (
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                {adsProduct.tagline}
              </p>
            )}
            <div className="text-xs text-gray-400 group-hover:text-white font-mono transition-colors">
              visit product →
            </div>
          </div>
        </a>
      ) : null}


      {/* Voting Streak */}
      <div>
        <h3 className="text-sm font-mono mb-3 opacity-50">voting streak</h3>
        {loadingAuth ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 w-3/4"></div>
            <div className="h-2 bg-gray-200 w-1/2"></div>
          </div>
        ) : currentUser ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-orange-500" />
              <span className="font-semibold text-black">
                {streakCount} days
              </span>
            </div>
            <div className="bg-gray-100 h-2 overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-300" 
                style={{ width: `${Math.min(streakCount * 10, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-mono">keep voting daily</p>
          </div>
        ) : (
          <Link 
            to="/auth" 
            className="block text-center py-2 text-sm bg-black text-white hover:opacity-70 transition-opacity"
          >
            start voting
          </Link>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Live Stats */}
      <div>
        <h3 className="text-sm font-mono mb-3 opacity-50">live stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xl font-semibold text-black">22.8K</div>
            <div className="text-xs text-gray-500 font-mono">views</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-black">1.2K</div>
            <div className="text-xs text-gray-500 font-mono">viewers</div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Featured Products */}
      <div>
        <h3 className="text-sm font-mono mb-3 opacity-50">featured products</h3>
        {loadingFeatured ? (
          <div className="space-y-3 animate-pulse">
            {Array(3).fill().map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 w-3/4"></div>
                  <div className="h-2 bg-gray-200 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div>
            <div className="space-y-2 mb-4">
              {featuredProducts.slice(0, 5).map((product) => (
                <Link 
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="block border border-gray-200 p-3 hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 p-1 flex-shrink-0">
                      {product.logo && product.logo.url ? (
                        <img 
                          src={product.logo.url} 
                          alt={product.product_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-xs font-mono">
                            {product.product_name?.charAt(0) || 'P'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-black text-sm truncate mb-1">
                        {product.product_name}
                      </h4>
                      {product.tagline && (
                        <p className="text-xs text-gray-600 truncate mb-1 leading-relaxed">
                          {product.tagline}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 font-mono">
                        {product.upvote || 0} votes
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Get Featured Button - Always show */}
            <div 
              onClick={() => setShowFeaturedPopup(true)}
              className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 border border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 transition-all"
            >
              <div className="text-center">
                <Fire size={24} className="text-orange-500 mx-auto mb-2" />
                <h4 className="font-semibold text-black text-sm mb-2">
                  Get Featured
                </h4>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Boost your product visibility with premium placement
                </p>
                <div className="text-xs font-semibold text-orange-600">
                  Learn More →
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setShowFeaturedPopup(true)}
            className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-2 border-dashed border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 transition-all"
          >
            <div className="text-center">
              <PlusSquare size={24} className="text-orange-500 mx-auto mb-2" />
              <h4 className="font-semibold text-black text-sm mb-2">
                Get Featured
              </h4>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Be the first to showcase your product here
              </p>
              <div className="text-xs font-semibold text-orange-600">
                Learn More →
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Hidden Gem */}
      <div>
        <h3 className="text-sm font-mono mb-3 opacity-50">hidden gem</h3>
        {loadingUnderdog ? (
          <div className="animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 w-3/4"></div>
                <div className="h-3 bg-gray-200 w-1/2"></div>
              </div>
            </div>
          </div>
        ) : underdogProduct ? (
          <a 
            href={`${underdogProduct.product_url?.startsWith('http') ? underdogProduct.product_url : `https://${underdogProduct.product_url}`}?ref=simplelister`}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 p-2">
                {underdogProduct.logo && underdogProduct.logo.url ? (
                  <img 
                    src={underdogProduct.logo.url} 
                    alt={underdogProduct.product_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-mono">
                      {underdogProduct.product_name?.charAt(0) || 'H'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-black text-sm truncate">
                  {underdogProduct.product_name}
                </h4>
                {underdogProduct.tagline && (
                  <p className="text-xs text-gray-600 truncate">{underdogProduct.tagline}</p>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
              <ArrowRight size={12} />
              discover product
            </div>
          </a>
        ) : (
          <p className="text-sm text-gray-500 font-mono">no gem available</p>
        )}
      </div>

      {/* Featured Products Popup */}
      {showFeaturedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 relative">
            <button 
              onClick={() => setShowFeaturedPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <Minus size={20} />
            </button>
            
            <div className="text-center">
              <Fire size={48} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-4">Get Featured</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Showcase your product in our premium featured section and reach 22K+ monthly visitors. 
                Get maximum visibility and drive more traffic to your product.
              </p>
              
              <div className="bg-orange-50 p-4 mb-6 text-left">
                <h3 className="font-semibold text-black mb-2">What's included:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Premium placement in sidebar</li>
                  <li>• Featured badge on your product</li>
                  <li>• Extended visibility (30 days)</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFeaturedPopup(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  to="/pricing"
                  onClick={() => setShowFeaturedPopup(false)}
                  className="flex-1 py-2 px-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-center"
                >
                  Get Featured - $79
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sponsor Popup */}
      {showSponsorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 relative">
            <button 
              onClick={() => setShowSponsorPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <Minus size={20} />
            </button>
            
            <div className="text-center">
              <Rocket size={48} className="text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-4">Become a Sponsor</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Partner with SimpleLister and get your brand in front of 22K+ monthly visitors. 
                Perfect for SaaS tools, developer products, and tech services.
              </p>
              
              <div className="bg-orange-50 p-4 mb-6 text-left">
                <h3 className="font-semibold text-black mb-2">Sponsor benefits:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Logo placement on homepage</li>
                  <li>• Brand visibility across all pages</li>
                  <li>• Targeted tech-savvy audience</li>
                  <li>• Monthly performance reports</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSponsorPopup(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Not Now
                </button>
                <Link
                  to="/pricing"
                  onClick={() => setShowSponsorPopup(false)}
                  className="flex-1 py-2 px-4 bg-orange-500 text-white hover:bg-orange-600 transition-colors text-center"
                >
                  View Packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar; 