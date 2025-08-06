import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProductList from './components/ProductList';
import LaunchCountdown from './components/LaunchCountdown';
import { app, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy, Timestamp, limit, doc, getDoc } from 'firebase/firestore';
import { PlusCircle, Rocket, ArrowRight } from '@phosphor-icons/react';

function App() {
  const [sponsors, setSponsors] = useState([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [todaysProducts, setTodaysProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userProfileData, setUserProfileData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSponsorPopup, setShowSponsorPopup] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
        console.log("App.jsx: Fetched Firestore profile:", profileData);
        setUserProfileData(profileData);
        return profileData;
      } else {
        console.log("App.jsx: No Firestore profile found for user:", userId);
        setUserProfileData(null);
        return null;
      }
    } catch (error) {
      console.error("App.jsx: Error fetching user profile:", error);
      setUserProfileData(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("App.jsx - onAuthStateChanged - user:", user);
      setCurrentUser(user);
      let fetchedProfile = null;
      if (user) {
        fetchedProfile = await fetchUserProfile(user.uid);
      } else {
        setUserProfileData(null);
      }
      setAuthLoading(false);

      if (user && fetchedProfile && !fetchedProfile.onboardingCompleted && location.pathname !== '/onboarding') {
        console.log("App.jsx: User needs onboarding. Redirecting...");
        navigate('/onboarding');
      } else if (user && fetchedProfile?.onboardingCompleted && location.pathname === '/onboarding') {
        console.log("App.jsx: User already onboarded, redirecting from /onboarding to home.");
        navigate('/');
      }
    });
    return unsubscribe;
  }, [fetchUserProfile, navigate, location.pathname]);

  const fetchTodaysProducts = useCallback(async () => {
    console.log("App.jsx: fetchTodaysProducts running...");
    setLoadingProducts(true);
    try {
      const db = getFirestore(app);
      const productsRef = collection(db, 'products');

      // Calculate timestamps for filtering (UTC based)
      const now = new Date();
      
      // Get this week's Monday 00:01 UTC
      const thisMonday = new Date();
      const currentDay = thisMonday.getUTCDay();
      const daysToThisMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
      thisMonday.setUTCDate(thisMonday.getUTCDate() - daysToThisMonday);
      thisMonday.setUTCHours(0, 1, 0, 0); // Monday 00:01
      
      // Get this week's Sunday 23:59 UTC for upper bound
      const thisSunday = new Date(thisMonday);
      thisSunday.setUTCDate(thisSunday.getUTCDate() + 6); // Add 6 days to get Sunday
      thisSunday.setUTCHours(23, 59, 59, 999); // Sunday 23:59

      // Convert to Firestore Timestamps for query
      const thisMondayTimestamp = Timestamp.fromDate(thisMonday);
      const thisSundayTimestamp = Timestamp.fromDate(thisSunday);

      console.log("App.jsx: Filtering UTC Dates - This Monday:", thisMonday.toISOString(), "This Sunday:", thisSunday.toISOString());

      // Query for products launched this week (Monday 00:01 to Sunday 23:59)
      const q = query(
        productsRef, 
        where('launch_date', '>=', thisMondayTimestamp),
        where('launch_date', '<=', thisSundayTimestamp),
        orderBy('launch_date', 'desc'),
        orderBy('upvote', 'desc')
      );

      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`App.jsx: Fetched ${productList.length} products for this week (Monday-Sunday).`);
      setTodaysProducts(productList);

    } catch (error) {
      console.error("Error fetching latest products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const fetchSponsors = async () => {
      setLoadingSponsors(true);
      try {
        const db = getFirestore(app);
        const sponsorsRef = collection(db, 'sponsors');
        const snapshot = await getDocs(sponsorsRef);
        const sponsorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("DEBUG sponsors:", sponsorsList);
        setSponsors(sponsorsList);
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      } finally {
        setLoadingSponsors(false);
      }
    };

    fetchSponsors();
    fetchTodaysProducts();
  }, [fetchTodaysProducts]);

  const updateLocalProductVote = useCallback((productId, change, userId) => {
    setTodaysProducts(currentProducts => 
      currentProducts.map(p => {
        if (p.id === productId) {
          const newUpvoteCount = (p.upvote || 0) + change;
          const newUpvotesMap = { ...(p.upvotes || {}) };
          if (change > 0) {
            newUpvotesMap[userId] = true;
          } else {
            delete newUpvotesMap[userId];
          }
          console.log(`App.jsx: Updating local product ${productId}, new count: ${newUpvoteCount}`);
          return { ...p, upvote: newUpvoteCount, upvotes: newUpvotesMap };
        }
        return p;
      })
    );
  }, []);

  const updateLocalBookmark = useCallback((productId) => {
     setUserProfileData(currentProfile => {
       if (!currentProfile) return null;
       const currentBookmarks = currentProfile.bookmarks || [];
       const isBookmarked = currentBookmarks.includes(productId);
       let newBookmarks;
       if (isBookmarked) {
         newBookmarks = currentBookmarks.filter(id => id !== productId);
         console.log(`App.jsx: Removing local bookmark for ${productId}`);
       } else {
         newBookmarks = [...currentBookmarks, productId];
          console.log(`App.jsx: Adding local bookmark for ${productId}`);
       }
       return { ...currentProfile, bookmarks: newBookmarks };
     });
  }, []);

  if (authLoading) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-100">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-neutral-900 mb-2">Weekly Product Battle</h1>
                <p className="text-lg text-neutral-600">Vote for the most innovative products this week. Only the best survive.</p>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-mono opacity-50">weekly sponsors</h3>
                  <Link 
                    to="/pricing"
                    className="text-xs text-orange-500 hover:text-orange-600 font-mono transition-colors"
                  >
                    become a sponsor →
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loadingSponsors ? (
                    <>
                      {Array(4).fill().map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 animate-pulse"></div>
                      ))}
                    </>
                  ) : (
                    <>
                      {/* Always show 4 slots */}
                      {Array(4).fill().map((_, index) => {
                        const sponsor = sponsors[index];
                        
                        if (sponsor) {
                          // Show actual sponsor
                          return (
                            <a 
                              key={sponsor.id} 
                              href={`${sponsor.url}${sponsor.url.includes('?') ? '&' : '?'}ref=simplelister`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-4 flex items-center justify-center gap-3 hover:opacity-70 transition-opacity"
                            >
                              {sponsor.logo && (
                                <img 
                                  src={typeof sponsor.logo === 'string' ? sponsor.logo : sponsor.logo.url} 
                                  alt={sponsor.name} 
                                  className="max-h-8 w-auto object-contain"
                                />
                              )}
                              {sponsor.showName && sponsor.name && (
                                <span className="font-bold text-black text-lg">{sponsor.name}</span>
                              )}
                              {!sponsor.logo && sponsor.name && (
                                <span className="font-bold text-black text-lg">{sponsor.name}</span>
                              )}
                            </a>
                          );
                        } else {
                          // Show empty slot with promotion
                          return (
                            <div
                              key={`empty-${index}`}
                              onClick={() => setShowSponsorPopup(true)}
                              className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 flex flex-col items-center justify-center hover:from-orange-100 hover:to-orange-200 transition-all border-2 border-dashed border-orange-200 group cursor-pointer"
                            >
                              <PlusCircle size={20} className="text-orange-400 group-hover:text-orange-500 mb-1" />
                              <span className="text-xs font-mono text-orange-600 group-hover:text-orange-700">
                                Your Brand Here
                              </span>
                            </div>
                          );
                        }
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <LaunchCountdown />
              </div>
              
              <ProductList 
                products={todaysProducts} 
                loading={loadingProducts || authLoading}
                currentUser={currentUser} 
                userProfileData={userProfileData} 
                updateLocalProductVote={updateLocalProductVote}
                updateLocalBookmark={updateLocalBookmark}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Sponsor Popup */}
      {showSponsorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 relative">
            <button 
              onClick={() => setShowSponsorPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowRight size={20} />
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
                  <li>• Featured in weekly newsletter</li>
                  <li>• Targeted tech-savvy audience</li>
                  <li>• Monthly performance reports</li>
                  <li>• Premium brand positioning</li>
                </ul>
              </div>
              
              <div className="bg-orange-100 p-3 mb-6 text-center">
                <p className="text-sm font-semibold text-black">Starting from $199/month</p>
                <p className="text-xs text-gray-600">Flexible packages available</p>
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

export default App;
