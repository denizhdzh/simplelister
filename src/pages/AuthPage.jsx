import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    auth, 
    googleProvider 
} from '../firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged, 
    getAdditionalUserInfo
} from 'firebase/auth';
import { GoogleLogo } from '@phosphor-icons/react';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Import Firebase Functions
import Header from '../components/Header'; // Assuming you want Header/Footer on this page
import Footer from '../components/Footer';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Default to sign in, will be updated by URL param
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Effect to set mode from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false); // Default to login if mode is not 'signup' or not present
    }
  }, [location.search]);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/'); // Redirect to home if logged in
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential && userCredential.user && newsletterSubscribed) {
          const user = userCredential.user;
          const firstName = email.split('@')[0];
          handleBackendNewsletterSubscription(user.email, firstName, user.uid).catch(err => console.warn("Newsletter subscription failed in background:", err));
        }
        navigate('/onboarding');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err) {
      console.error("Email Auth Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try logging in or use a different email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError('Failed to authenticate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      if (user) {
        if (newsletterSubscribed) {
          let firstName = user.email.split('@')[0];
          if (user.displayName) {
            firstName = user.displayName.split(' ')[0];
          }
          handleBackendNewsletterSubscription(user.email, firstName, user.uid).catch(err => console.warn("Newsletter subscription failed in background:", err));
        }

        if (additionalUserInfo?.isNewUser) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Google Sign In Error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackendNewsletterSubscription = async (userEmail, userFirstName, userId) => {
    try {
      const functions = getFunctions();
      const subscribeToNewsletterFunction = httpsCallable(functions, 'subscribeToNewsletter');
      
      console.log(`Calling subscribeToNewsletter Firebase Function for ${userEmail}`);
      const result = await subscribeToNewsletterFunction({
        email: userEmail,
        firstName: userFirstName,
        userId: userId
      });
      
      if (result.data && result.data.success) {
        console.log('Successfully subscribed to newsletter via Firebase Function:', result.data.message);
      } else {
        console.warn('Newsletter subscription via Firebase Function returned success:false or unexpected data:', result.data);
      }
    } catch (err) {
      console.error("Error calling subscribeToNewsletter Firebase Function:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 flex justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-lg border border-gray-200">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
          </div>
          
           <div className="mt-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md bg-white text-sm font-medium text-black hover:bg-gray-50 focus:outline-none disabled:opacity-60 transition-colors"
            >
              <GoogleLogo size={20} weight="fill" className="mr-2" />
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleEmailAuth}>
             {error && (
               <div className="rounded-md bg-red-50 p-4">
                 <p className="text-sm text-red-700">{error}</p>
               </div>
             )}
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-t-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-b-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    checked={newsletterSubscribed}
                    onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                    className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded bg-white checked:bg-red-600 checked:border-transparent form-checkbox"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="newsletter" className="font-medium text-gray-700">
                    Subscribe to our newsletter
                  </label>
                  <p className="text-gray-500 text-xs">Get updates on new features and products.</p>
                </div>
              </div>
              {isSignUp && (
                <div className="text-xs text-gray-500 pt-2">
                  By signing up, you indicate that you have read and agree to our
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-red-600 hover:text-red-700 underline ml-1 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 rounded-sm">
                    Terms of Service
                  </Link>
                  {' and '}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-red-600 hover:text-red-700 underline focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 rounded-sm">
                    Privacy Policy
                  </Link>.
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
          </form>

           <div className="text-sm text-center mt-6">
              <span 
                role="button"
                tabIndex={loading ? -1 : 0}
                onClick={() => { 
                  if (loading) return;
                  setIsSignUp(!isSignUp); 
                  setError(''); 
                  const newMode = !isSignUp ? 'signup' : 'login';
                  navigate(`${location.pathname}?mode=${newMode}${location.hash}`, { replace: true });
                }} 
                onKeyDown={(e) => {
                  if (loading) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent page scroll if space is pressed
                    setIsSignUp(!isSignUp); 
                    setError(''); 
                    const newMode = !isSignUp ? 'signup' : 'login';
                    navigate(`${location.pathname}?mode=${newMode}${location.hash}`, { replace: true });
                  }
                }}
                className={`font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 rounded-sm transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don\'t have an account? Sign Up"}
              </span>
            </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AuthPage; 
