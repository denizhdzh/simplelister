import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, limit, documentId, Timestamp, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { app, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductList from '../components/ProductList';
import MyProductsList from '../components/MyProductsList';
import EditProfilePopup from '../components/EditProfilePopup';
import Sidebar from '../components/Sidebar';
import { Fire, BookmarkSimple, Link as LinkIconPhosphor, Globe, Briefcase, CalendarBlank, PencilSimple } from '@phosphor-icons/react';

// Helper to format dates (optional)
const formatDate = (timestamp) => {
  if (!timestamp || !(timestamp instanceof Timestamp)) return '';
  return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); // Simpler format: Month Year
};

const MAX_PRODUCTS_TO_FETCH = 30; // Firestore 'in' query limit

function ProfilePage() {
  const { username } = useParams(); // Get username from URL
  const [userProfile, setUserProfile] = useState(null);
  const [loggedInUserProfileData, setLoggedInUserProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [upvotedProducts, setUpvotedProducts] = useState([]);
  const [bookmarkedProducts, setBookmarkedProducts] = useState([]);
  const [submittedProducts, setSubmittedProducts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingUpvoted, setLoadingUpvoted] = useState(false);
  const [loadingBookmarked, setLoadingBookmarked] = useState(false);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upvoted'); // Default active tab

  // --- Auth State and Logged-in User Profile Fetch --- 
  useEffect(() => {
    const fetchLoggedInUserProfile = async (userId) => {
       if (!userId) {
         setLoggedInUserProfileData(null);
         return;
       }
       try {
         const db = getFirestore(app);
         const userDocRef = doc(db, 'users', userId);
         const userDocSnap = await getDoc(userDocRef);
         if (userDocSnap.exists()) {
           setLoggedInUserProfileData({ id: userId, ...userDocSnap.data() });
         } else {
           setLoggedInUserProfileData(null);
         }
       } catch (error) {
         console.error("ProfilePage: Error fetching logged-in user profile:", error);
         setLoggedInUserProfileData(null);
       }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("ProfilePage - onAuthStateChanged - user:", user);
      setCurrentUser(user);
      await fetchLoggedInUserProfile(user?.uid);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch User Profile Data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;

      setLoadingUser(true);
      setError(null);
      setUserProfile(null);
      setUpvotedProducts([]);
      setBookmarkedProducts([]);

      try {
        const db = getFirestore(app);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('User profile not found.');
        } else {
          const userData = snapshot.docs[0].data();
          setUserProfile({ id: snapshot.docs[0].id, ...userData });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError('Failed to load user profile.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  // Fetch Upvoted Products when userProfile is loaded
  useEffect(() => {
    if (!userProfile || !userProfile.upvotedProducts || userProfile.upvotedProducts.length === 0) {
      setUpvotedProducts([]);
      return;
    }

    const fetchProductsByIds = async (ids, setter, setLoading) => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        // Fetch up to MAX_PRODUCTS_TO_FETCH
        const limitedIds = ids.slice(0, MAX_PRODUCTS_TO_FETCH);
        if (limitedIds.length === 0) {
            setter([]);
            return;
        }
        const q = query(productsRef, where(documentId(), 'in', limitedIds));
        const snapshot = await getDocs(q);
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Optional: Reorder productList to match the order in `limitedIds` if needed
        const orderedProductList = limitedIds.map(id => productList.find(p => p.id === id)).filter(Boolean);
        setter(orderedProductList);

      } catch (err) {
        console.error("Error fetching products by IDs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByIds(userProfile.upvotedProducts, setUpvotedProducts, setLoadingUpvoted);

  }, [userProfile]);

   // Fetch Bookmarked Products when userProfile is loaded
   useEffect(() => {
    if (!userProfile || !userProfile.bookmarks || userProfile.bookmarks.length === 0) {
      setBookmarkedProducts([]);
      return;
    }

    const fetchProductsByIds = async (ids, setter, setLoading) => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const limitedIds = ids.slice(0, MAX_PRODUCTS_TO_FETCH);
         if (limitedIds.length === 0) {
            setter([]);
            return;
        }
        const q = query(productsRef, where(documentId(), 'in', limitedIds));
        const snapshot = await getDocs(q);
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orderedProductList = limitedIds.map(id => productList.find(p => p.id === id)).filter(Boolean);
        setter(orderedProductList);
      } catch (err) {
        console.error("Error fetching bookmarked products by IDs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByIds(userProfile.bookmarks, setBookmarkedProducts, setLoadingBookmarked);

  }, [userProfile]);

  // Fetch Submitted Products when viewing own profile
  useEffect(() => {
    const fetchSubmittedProducts = async () => {
      // Check if currentUser and userProfile are loaded before determining isOwnProfile logic
      if (!currentUser || !userProfile) {
        setSubmittedProducts([]);
        setLoadingSubmitted(false);
        return;
      }

      // Determine if it's the user's own profile based on loaded currentUser and userProfile
      const isActuallyOwnProfile = currentUser.uid === userProfile.id;

      if (isActuallyOwnProfile) {
        setLoadingSubmitted(true);
        try {
          const db = getFirestore(app);
          const productsRef = collection(db, 'products');
          const q = query(
            productsRef,
            where('submitterId', '==', currentUser.uid),
            orderBy('createdAt', 'desc') // Or launch_date for chronological launch order
          );
          const snapshot = await getDocs(q);
          const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSubmittedProducts(productList);
        } catch (err) {
          console.error("Error fetching submitted products:", err);
          if (!error) setError('Error loading your submitted products.'); 
        } finally {
          setLoadingSubmitted(false);
        }
      } else {
        // Not own profile, or data not loaded appropriately to determine
        setSubmittedProducts([]);
        setLoadingSubmitted(false);
      }
    };

    fetchSubmittedProducts();
  }, [currentUser, userProfile, error]); // Dependencies are currentUser and userProfile

  // --- Local State Update Functions for Optimistic UI --- 
  const updateLocalVoteInProfile = useCallback((productId, change, userId) => {
    const updateList = (list) => list.map(p => {
       if (p.id === productId) {
         const newUpvoteCount = (p.upvote || 0) + change;
         const newUpvotesMap = { ...(p.upvotes || {}) };
         if (change > 0) {
           newUpvotesMap[userId] = true;
         } else {
           delete newUpvotesMap[userId];
         }
         console.log(`ProfilePage: Updating local product ${productId} in list, new count: ${newUpvoteCount}`);
         return { ...p, upvote: newUpvoteCount, upvotes: newUpvotesMap };
       }
       return p;
    });

    setUpvotedProducts(updateList);
    setBookmarkedProducts(updateList);

    // Also update loggedInUserProfileData if the vote affects their list
    if (loggedInUserProfileData && loggedInUserProfileData.id === userId) {
        setLoggedInUserProfileData(currentProfile => {
            if (!currentProfile) return null;
            let newUpvotedProducts;
            if (change > 0) {
                 newUpvotedProducts = [...(currentProfile.upvotedProducts || []), productId];
            } else {
                 newUpvotedProducts = (currentProfile.upvotedProducts || []).filter(id => id !== productId);
            }
             return { ...currentProfile, upvotedProducts: newUpvotedProducts };
        });
    }

  }, [loggedInUserProfileData]);

  const updateLocalBookmarkInProfile = useCallback((productId) => {
     // Update the loggedInUser's profile data for icon state and ensuring consistency
     setLoggedInUserProfileData(currentLoggedInProfile => {
       if (!currentLoggedInProfile) return null;
       const currentBookmarks = currentLoggedInProfile.bookmarks || [];
       const isCurrentlyBookmarked = currentBookmarks.includes(productId);
       let newBookmarks;
       if (isCurrentlyBookmarked) {
         newBookmarks = currentBookmarks.filter(id => id !== productId);
       } else {
         newBookmarks = [...currentBookmarks, productId];
       }
       console.log(`ProfilePage: Updating loggedInUserProfileData.bookmarks. Product ${productId} ${isCurrentlyBookmarked ? 'removed' : 'added'}.`);
       return { ...currentLoggedInProfile, bookmarks: newBookmarks };
     });

     // If the currently viewed profile is the logged-in user's own profile,
     // we also need to update the 'userProfile' state. This state is used to
     // fetch and display the list of bookmarked products in the "Bookmarked" tab.
     // By updating userProfile.bookmarks, we trigger the useEffect that re-fetches this list.
     if (userProfile && currentUser && userProfile.id === currentUser.uid) {
       setUserProfile(currentViewedProfile => {
         if (!currentViewedProfile) return null; 
         const viewedProfileBookmarks = currentViewedProfile.bookmarks || [];
         const isPresentInViewedProfile = viewedProfileBookmarks.includes(productId);
         let newViewedProfileBookmarks;

         if (isPresentInViewedProfile) { // It was there, so we're removing it
           newViewedProfileBookmarks = viewedProfileBookmarks.filter(id => id !== productId);
         } else { // It wasn't there, so we're adding it
           newViewedProfileBookmarks = [...viewedProfileBookmarks, productId];
         }
         console.log(`ProfilePage: Updating userProfile.bookmarks (own profile). Product ${productId} ${isPresentInViewedProfile ? 'removed' : 'added'}.`);
         return { ...currentViewedProfile, bookmarks: newViewedProfileBookmarks };
       });
     }
  }, [currentUser, userProfile]);
  // --- End Local State Update Functions --- 

  // --- Handle Profile Update --- 
  const handleProfileUpdate = async (updatedData) => {
    if (!currentUser || !userProfile || currentUser.uid !== userProfile.id) {
        console.error("Cannot update profile: Not authorized or profile mismatch.");
        return; // Or show error to user
    }

    const db = getFirestore(app);
    const userDocRef = doc(db, 'users', currentUser.uid);

    // Optimistic UI Update
    const previousProfile = { ...userProfile }; // Backup previous state
    setUserProfile(current => ({ ...current, ...updatedData }));
    // Also update loggedInUserProfileData if viewing own profile
    setLoggedInUserProfileData(current => ({ ...current, ...updatedData }));

    try {
        await updateDoc(userDocRef, {
            ...updatedData,
            lastUpdated: Timestamp.now() // Add a last updated timestamp
        });
        console.log("Profile updated successfully in Firestore.");
        setIsEditPopupOpen(false); // Close popup on success
    } catch (error) {
        console.error("Error updating profile:", error);
        // Revert optimistic update on error
        setUserProfile(previousProfile);
        setLoggedInUserProfileData(previousProfile); 
        // TODO: Show error message in the popup or on the page
    }
  };
  // --- End Handle Profile Update --- 

  // --- Loading State --- 
  if (authLoading || loadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading profile...</p> 
        </main>
        <Footer />
      </div>
    );
  }

  // --- Error State --- 
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

  // --- Profile Found State --- 
  if (!userProfile) { 
     return null;
  }

  // Log the fetched user profile data
  console.log("ProfilePage - userProfile:", userProfile);
  
  const avatarUrl = userProfile.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName || userProfile.username || 'U')}&background=random&size=128`;

  // Log the final avatar URL being used
  console.log("ProfilePage - avatarUrl:", avatarUrl);

  // Define streak count safely
  const streakCount = (userProfile.streak && typeof userProfile.streak === 'object' && userProfile.streak.count > 0) 
                      ? userProfile.streak.count 
                      : 0;

  const isOwnProfile = currentUser && userProfile && currentUser.uid === userProfile.id;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

            {/* Profile Header */}
            <div className="relative bg-white border border-gray-100 rounded-lg p-6 mb-8 flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-6">
              {/* Edit Button (Conditionally Rendered) */}
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditPopupOpen(true)}
                  className="absolute top-4 right-4 p-1.5 bg-gray-50 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full focus:outline-none transition-colors"
                  aria-label="Edit profile"
                >
                  <PencilSimple size={18} />
                </button>
              )}

              <img 
                src={avatarUrl} 
                alt={`${userProfile.displayName || 'User'}'s profile`} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userProfile.displayName || 'User'}</h1>
                {userProfile.username && <p className="text-sm text-gray-500 mb-2">@{userProfile.username}</p>}
                {userProfile.bio && <p className="text-base text-gray-700 mb-4">{userProfile.bio}</p>}
                
                {/* Links and Stats */}
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                   {/* Streak - Updated Check */}
                   {streakCount > 0 && (
                     <span className="inline-flex items-center">
                       <Fire size={16} weight="bold" className="mr-1.5"/>
                       {streakCount} Day Streak
                     </span>
                   )}
                   {/* Website */}
                   {userProfile.website && (
                     <a href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-gray-900">
                       <Globe size={16} weight="regular" className="mr-1.5"/>
                       Website
                     </a>
                   )}
                   {/* Personal Link */}
                   {userProfile.personalLink && (
                      <a href={userProfile.personalLink.startsWith('http') ? userProfile.personalLink : `https://${userProfile.personalLink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-gray-900">
                       <LinkIconPhosphor size={16} weight="regular" className="mr-1.5"/>
                       Personal Link
                     </a>
                   )}
                   {/* Added Social Media Link */} 
                   {userProfile.socialMedia && (
                      <a href={userProfile.socialMedia.startsWith('http') ? userProfile.socialMedia : `https://${userProfile.socialMedia}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-gray-900">
                       <LinkIconPhosphor size={16} weight="regular" className="mr-1.5"/>
                       Social
                     </a>
                   )}
                   {/* Added Joined Date */} 
                   {userProfile.createdAt && (
                      <span className="inline-flex items-center">
                        <CalendarBlank size={16} weight="regular" className="mr-1.5"/>
                        Joined {formatDate(userProfile.createdAt)}
                      </span>
                   )}
                   {/* Company */}
                   {userProfile.company && (
                      <span className="inline-flex items-center">
                       <Briefcase size={16} weight="regular" className="mr-1.5"/>
                       {userProfile.company}
                     </span>
                   )}
                </div>
              </div>
            </div>

            {/* Horizontal Stack */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Section - Tabbed Interface */}
              <div className="flex-1">
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mb-4 bg-white">
                  <nav className="flex -mb-px space-x-8" aria-label="Profile Tabs">
                    <span
                      role="tab"
                      tabIndex={0}
                      onClick={() => setActiveTab('submitted')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('submitted');
                        }
                      }}
                      className={`pb-3 px-1 font-medium text-sm transition-colors rounded-none border-b-2 bg-transparent focus:outline-none cursor-pointer ${
                        activeTab === 'submitted'
                          ? 'text-black border-b-black'
                          : 'text-gray-500 border-b-transparent hover:text-gray-700'
                      } `}
                    >
                      My Products
                    </span>
                    <span
                      role="tab"
                      tabIndex={0}
                      onClick={() => setActiveTab('upvoted')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('upvoted');
                        }
                      }}
                      className={`pb-3 px-1 font-medium text-sm transition-colors rounded-none border-b-2 bg-transparent focus:outline-none cursor-pointer ${
                        activeTab === 'upvoted'
                          ? 'text-black border-b-black'
                          : 'text-gray-500 border-b-transparent hover:text-gray-700'
                      } `}
                    >
                      Upvoted
                    </span>
                    <span
                      role="tab"
                      tabIndex={0}
                      onClick={() => setActiveTab('bookmarked')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('bookmarked');
                        }
                      }}
                      className={`pb-3 px-1 font-medium text-sm transition-colors rounded-none border-b-2 bg-transparent focus:outline-none cursor-pointer ${
                        activeTab === 'bookmarked'
                          ? 'text-black border-b-black'
                          : 'text-gray-500 border-b-transparent hover:text-gray-700'
                      } `}
                    >
                      Bookmarked
                    </span>
                  </nav>
                </div>

                {/* Tab Content */}
                <div>
                  {/* Submitted Products Tab */}
                  {activeTab === 'submitted' && (
                    <div>
                      {loadingSubmitted ? (
                        <div className="text-center py-10">
                          <p>Loading submitted products...</p>
                        </div>
                      ) : (
                        <MyProductsList 
                          products={submittedProducts} 
                          currentUser={currentUser}
                        />
                      )}
                    </div>
                  )}

                  {/* Upvoted Products Tab */}
                  {activeTab === 'upvoted' && (
                    <div>
                      {loadingUpvoted ? (
                        <div className="text-center py-10">
                          <p>Loading upvoted products...</p>
                        </div>
                      ) : upvotedProducts.length > 0 ? (
                        <ProductList 
                          products={upvotedProducts} 
                          currentUser={currentUser}
                          userProfileData={loggedInUserProfileData}
                          updateLocalProductVote={updateLocalVoteInProfile}
                          updateLocalBookmark={updateLocalBookmarkInProfile}
                        />
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-500">No upvoted products found.</p>
                          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none">
                            Discover Products
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bookmarked Products Tab */}
                  {activeTab === 'bookmarked' && (
                    <div>
                      {loadingBookmarked ? (
                        <div className="text-center py-10">
                          <p>Loading bookmarked products...</p>
                        </div>
                      ) : bookmarkedProducts.length > 0 ? (
                        <ProductList 
                          products={bookmarkedProducts}
                          currentUser={currentUser}
                          userProfileData={loggedInUserProfileData}
                          updateLocalProductVote={updateLocalVoteInProfile}
                          updateLocalBookmark={updateLocalBookmarkInProfile}
                        />
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-500">No bookmarked products found.</p>
                          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none">
                            Discover Products
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Section - Sidebar */}
              <div className="lg:w-72 flex-shrink-0">
                <Sidebar />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Edit Profile Popup */}
      {userProfile && (
         <EditProfilePopup
            isOpen={isEditPopupOpen}
            onClose={() => setIsEditPopupOpen(false)}
            initialData={{
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                website: userProfile.website || '',
                personalLink: userProfile.personalLink || '',
                socialMedia: userProfile.socialMedia || '',
                company: userProfile.company || ''
            }}
            onSave={handleProfileUpdate}
         />
      )}
    </>
  );
}

export default ProfilePage; 