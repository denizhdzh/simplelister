import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProductList from './components/ProductList';
import LaunchCountdown from './components/LaunchCountdown';
import { app, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy, Timestamp, limit, doc, getDoc } from 'firebase/firestore';

function App() {
  const [sponsors, setSponsors] = useState([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [todaysProducts, setTodaysProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userProfileData, setUserProfileData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 order-1">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Today's Products</h1>
                <p className="text-base text-gray-600">Discover the latest products launched in the tech community</p>
              </div>
              
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 mr-3">Sponsored by</p>
                  <div className="flex space-x-4">
                    {loadingSponsors ? (
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                    ) : sponsors.length > 0 ? (
                      sponsors.map(sponsor => (
                        <a 
                          key={sponsor.id} 
                          href={`${sponsor.url}${sponsor.url.includes('?') ? '&' : '?'}ref=simplelister`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:opacity-80 transition-opacity"
                        >
                          {sponsor.logo && (
                            <img 
                              src={typeof sponsor.logo === 'string' ? sponsor.logo : sponsor.logo.url} 
                              alt={sponsor.name} 
                              className="h-8 w-auto rounded-md" 
                              style={{ maxHeight: '32px' }}
                            />
                          )}
                          {sponsor.name && sponsor.showName !== false && (
                            <span className="text-2xl font-bold text-gray-800 ml-2">{sponsor.name}</span>
                          )}
                        </a>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No sponsors</span>
                    )}
                  </div>
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

export default App;
