import React, { useState, useEffect } from 'react';
import { app, auth } from '../firebase'; // Firebase config dosyamız ve auth import edildi
import { getFirestore, doc, getDoc, collection, getDocs, where, query, orderBy, limit, Timestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth"; // onAuthStateChanged import edildi
import { Link } from 'react-router-dom'; // Removed useNavigate import
import { 
  LinkSimple, 
  Fire,
  ArrowUpRight,
  Sparkle,
  Star
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
    <div className="sticky top-20">
      <div className="bg-white rounded-lg">
        {/* Banner Ads */}
        <div className="relative w-full mb-6" style={{ paddingBottom: '75%' }}>
          {loadingAds ? (
            <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : adsProduct ? (
            <a 
              href={`${adsProduct.product_url?.startsWith('http') ? adsProduct.product_url : `https://${adsProduct.product_url}`}?ref=simplelister`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 group"
            >
              {/* Background Image or Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${adsGradientColors} rounded-lg`}></div>
              
              {/* Overlay Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                {/* Top Section */}
                <div className="flex items-start justify-between">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] font-bold">
                    ✨ FEATURED
                  </div>
                  {adsProduct.logo && adsProduct.logo.url && (
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg p-1">
                      <img 
                        src={adsProduct.logo.url} 
                        alt={`${adsProduct.product_name} logo`}
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                  )}
                </div>
                
                {/* Bottom Section */}
                <div>
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">
                    {adsProduct.product_name || 'Featured Product'}
                  </h3>
                  {adsProduct.tagline && (
                    <p className="text-xs opacity-90 line-clamp-2 mb-2">
                      {adsProduct.tagline}
                    </p>
                  )}
                  <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-1 text-[10px] font-semibold inline-flex items-center gap-1 group-hover:bg-white/30 transition-colors">
                    Discover Now
                    <ArrowUpRight size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            </a>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-medium">Ad Space</span>
            </div>
          )}
        </div>

        {/* Daily Streak */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Daily Streak</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {loadingAuth ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : currentUser ? (
              <div>
                <div className="flex items-center mb-2">
                  <Fire size={18} className="text-orange-500 mr-2" />
                  <span className="text-sm font-medium text-gray-800">
                    {streakCount} day{streakCount !== 1 ? 's' : ''} streak
                  </span>
                </div>
                <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(streakCount * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="w-full flex items-center justify-center px-3 py-1.5 text-sm bg-black hover:bg-gray-800 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Analytics</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-800">22800</div>
              <div className="text-xs text-gray-500">Page Views</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-800">12600</div>
              <div className="text-xs text-gray-500">Visitors</div>
            </div>
          </div>
        </div>

        {/* Daily Underdog */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Daily Underdog</h3>
          {loadingUnderdog ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : underdogProduct ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Make the entire card clickable */}
              <a 
                href={`${underdogProduct.product_url?.startsWith('http') ? underdogProduct.product_url : `https://${underdogProduct.product_url}`}?ref=simplelister`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50 transition-colors"
              >
                {/* Logo and product info section */}
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="relative flex-shrink-0 w-14 h-14 rounded-[12px] p-1.5 mr-3 flex items-center justify-center overflow-hidden bg-gray-100">
                      {underdogProduct.logo && underdogProduct.logo.url ? (
                        <img 
                          src={underdogProduct.logo.url} 
                          alt={`${underdogProduct.product_name || 'Underdog'} logo`}
                          className="w-full h-full rounded-[6px] object-contain"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[6px] bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-medium">
                            {underdogProduct.product_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-0.5">
                        {underdogProduct.product_name || 'Underdog Product'}
                      </h3>
                      {underdogProduct.tagline && (
                        <p className="text-xs text-gray-600 line-clamp-2">{underdogProduct.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100">
                  <div className="py-2.5 px-4 text-xs text-gray-600 font-medium flex items-center justify-center">
                    <LinkSimple size={12} className="mr-1.5" />
                    Visit Website
                    <ArrowUpRight size={10} className="ml-1 text-gray-400" />
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Underdog product not available.</p>
            </div>
          )}
        </div>



        {/* Featured Products */}
        {/* Entire section removed:
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Featured Products</h3>
          ...
        </div>
        */}
      </div>
    </div>
  );
}

export default Sidebar; 