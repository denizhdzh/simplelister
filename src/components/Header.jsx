import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, app } from '../firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { MagnifyingGlass, Plus, SignOut, User as UserIcon, Star } from '@phosphor-icons/react';
import SearchPopup from './SearchPopup';
import logoSrc from '/logo.svg';

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
    <header className="sticky top-0 z-40 w-full bg-neutral-100 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0">
              <img className="h-5 w-auto" src={logoSrc} alt="SimpleLister" style={{filter: 'brightness(0) saturate(100%)'}} />
            </Link>
            <nav className="hidden md:flex gap-6">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/leaderboard">Leaderboard</NavLink>
              <NavLink to="/categories">Categories</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Search"
            >
              <MagnifyingGlass size={18} />
            </button>
            
            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-black text-neutral-100 hover:opacity-70 transition-opacity"
                  >
                    <Plus size={14} /> Submit
                  </Link>
                  <Link
                    to="/get-featured"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-orange-500 text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Star size={14} /> Get Featured
                  </Link>
                </div>
                <div className="relative">
                  <button 
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:opacity-70 transition-opacity"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <img 
                       src={avatarUrl}
                       alt="User profile" 
                       className="h-8 w-8  object-cover"
                     />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-neutral-100 border border-gray-200 py-1.5 shadow-lg">
                       <Link 
                         to={`/profile/${profileUsername}`}
                         onClick={() => setShowDropdown(false)}
                         className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                       >
                          <UserIcon size={14} /> Profile
                       </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={handleSignOut} 
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <SignOut size={14} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth?mode=signup"
                className="px-3 py-1.5 text-sm font-semibold bg-black text-white hover:opacity-70 transition-opacity"
              >
                Sign up
              </Link>
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
      className={`text-sm font-mono transition-opacity ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
    >
      {children}
    </Link>
  );
}

export default Header; 