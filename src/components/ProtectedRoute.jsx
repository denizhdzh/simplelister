import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

function ProtectedRoute() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    // Optional: Return a loading spinner or null while checking auth state
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        </div>
    ); 
  }

  return currentUser ? (
    <Outlet /> // Render the child route element (SubmitPage or OnboardingPage)
  ) : (
    <Navigate to="/auth" state={{ from: location }} replace /> // Redirect to login, saving the intended location
  );
}

export default ProtectedRoute; 