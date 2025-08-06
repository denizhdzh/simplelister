import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, app } from '../firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { MagnifyingGlass, Plus, SignOut, User as UserIcon } from '@phosphor-icons/react';
import SearchPopup from './SearchPopup';
import logoSrc from '/logonaked.png';

function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const avatarUrl = useMemo(() => {
    if (userProfileData?.profilePicture) {
      return userProfileData.profilePicture;
    }
    if (currentUser?.photoURL) {
      return currentUser.photoURL;
    }
    // Fallback to UI Avatars
    const namePart = currentUser?.displayName || currentUser?.email?.charAt(0) || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(namePart)}&background=random&size=96`;
  }, [currentUser, userProfileData]);

  const profileUsername = useMemo(() => {
    if (userProfileData?.username) {
      return userProfileData.username;
    }
    if (currentUser?.email) {
      const emailName = currentUser.email.split('@')[0];
      if (emailName && !emailName.includes(' ')) {
        return emailName.toLowerCase();
      }
    }
    return 'profile';
  }, [currentUser, userProfileData]);

  useEffect(() => {
    const db = getFirestore(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Header - onAuthStateChanged - user:", user);
      setCurrentUser(user);
      setUserProfileData(null);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profileData = { id: user.uid, ...userDocSnap.data() };
            console.log("Header - Fetched Firestore profile:", profileData);
            setUserProfileData(profileData); 
            
            if (!profileData.onboardingCompleted && location.pathname !== '/onboarding' && location.pathname !== '/auth') {
              console.log("Header - User has not completed onboarding. Redirecting...");
              navigate('/onboarding', { replace: true });
            }
          } else {
            console.log("Header - No Firestore profile found for user:", user.uid);
            if (location.pathname !== '/onboarding' && location.pathname !== '/auth') {
                 console.log("Header - No profile, redirecting to onboarding as a fallback.");
                 navigate('/onboarding', { replace: true });
            }
          }
        } catch (error) {
           console.error("Header - Error fetching user profile:", error);
        }
      } 
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex-shrink-0 rounded-sm">
              <div className="bg-red-500 p-2 rounded-lg">
                <img className="h-6 w-auto" src={logoSrc} alt="SimpleLister" />
              </div>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/leaderboard">Leaderboard</NavLink>
              <NavLink to="/categories">Categories</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full text-gray-600 bg-white hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <MagnifyingGlass size={20} />
            </button>
            
            {currentUser ? (
              <>
                <Link
                  to="/submit"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-200 hover:text-red-500 hover:border-red-500"
                >
                  <Plus size={16} className="mr-1.5" /> Submit
                </Link>
                <div className="relative">
                  <button 
                    className="flex items-center p-1 border border-transparent rounded-full bg-white hover:bg-gray-100 focus:outline-none transition-colors"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <img 
                       src={avatarUrl}
                       alt="User profile" 
                       className="h-8 w-8 rounded-full object-cover bg-gray-200"
                     />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100">
                       <Link 
                         to={`/profile/${profileUsername}`}
                         onClick={() => setShowDropdown(false)}
                         className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 rounded-sm mx-1"
                       >
                          <UserIcon size={16} className="mr-2"/> Your Profile
                       </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={handleSignOut} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 rounded-sm mx-1"
                      >
                        <SignOut size={16} className="mr-2"/> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth?mode=signup"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`text-sm font-medium transition-colors ${isActive ? 'text-black' : 'text-gray-600 hover:text-black'} focus:outline-none focus:text-black focus:underline`}
    >
      {children}
    </Link>
  );
}

export default Header; 