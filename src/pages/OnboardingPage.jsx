import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, collection, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { app, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../components/Header'; // Include Header for consistency

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function OnboardingPage() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isValidUsername, setIsValidUsername] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  const [personalLink, setPersonalLink] = useState('');
  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Basic username validation regex (letters, numbers, underscore, hyphen, 3-15 chars)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
  const bioMinLength = 30;

  // Get current user on mount and redirect if not logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const suggestedUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 15) || '';
        setUsername(suggestedUsername);
        setDisplayName(user.displayName || '');
      } else {
        navigate('/auth');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  // Check username availability (debounced)
  const checkUsernameAvailability = useCallback(async (inputUsername) => {
    if (!usernameRegex.test(inputUsername)) {
        setUsernameAvailable(false);
        setIsValidUsername(false);
        return;
    }
    setIsValidUsername(true);
    setIsCheckingUsername(true);
    setUsernameAvailable(false); 
    setError('');

    try {
      const db = getFirestore(app);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', inputUsername));
      const snapshot = await getDocs(q);
      setUsernameAvailable(snapshot.empty);
      if (!snapshot.empty) {
          setError('Username already taken.');
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setError('Error checking username. Please try again.');
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const debouncedCheck = useCallback(debounce(checkUsernameAvailability, 500), [checkUsernameAvailability]);

  useEffect(() => {
    if (username) {
      debouncedCheck(username);
    } else {
        setUsernameAvailable(true);
        setIsValidUsername(false);
        setError('');
    }
  }, [username, debouncedCheck]);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value.toLowerCase());
  };

  const handleBioChange = (e) => {
    const newBio = e.target.value;
    setBio(newBio);
    if (newBio.length < bioMinLength) {
      setBioError(`Bio must be at least ${bioMinLength} characters long.`);
    } else {
      setBioError('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // --- Start Validation ---
    if (bio.length < bioMinLength) {
      setBioError(`Bio must be at least ${bioMinLength} characters long.`);
      return;
    }
    if (!displayName.trim()) {
        setError('Please enter your full name.');
        return;
    }
    if (!currentUser || !username || !usernameAvailable || !isValidUsername) {
        setError('Please ensure your username is valid and available.');
        return;
    }
    if (isSaving || isCheckingUsername) {
        return;
    }
    // --- End Validation ---

    setIsSaving(true);
    
    // Prepare payload for the backend
    const payload = {
      username,
      displayName: displayName.trim(),
      personalLink: personalLink.trim(),
      bio: bio.trim(),
    };

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('https://completeonboarding-gcn7372oea-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server responded with ${response.status}`);
      }

      console.log('Onboarding successful:', result);
      navigate('/');

    } catch (backendError) {
      console.error('OnboardingPage: Backend error:', backendError);
      setError(`Failed to complete onboarding: ${backendError.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <Header /> 
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">Welcome! Let's set up your profile.</h2>
                
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g., Ada Lovelace"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Choose a Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="e.g., awesome_hacker_99"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm 
                                ${!isValidUsername && username ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'} 
                                ${usernameAvailable && isValidUsername ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}`}
                            required
                            aria-describedby="username-help"
                        />
                        <p id="username-help" className="mt-1 text-xs text-gray-500">Letters, numbers, underscores, hyphens only (3-15 chars).</p>
                        {isCheckingUsername && <p className="mt-1 text-xs text-gray-500 animate-pulse">Checking...</p>}
                        {!isCheckingUsername && username && !isValidUsername && <p className="mt-1 text-xs text-red-600">Invalid format.</p>}
                        {!isCheckingUsername && username && isValidUsername && !usernameAvailable && <p className="mt-1 text-xs text-red-600">Username taken.</p>}
                        {!isCheckingUsername && username && isValidUsername && usernameAvailable && <p className="mt-1 text-xs text-green-600">Available!</p>}
                    </div>
                    <div>
                        <label htmlFor="personalLink" className="block text-sm font-medium text-gray-700 mb-1">Personal Link (Optional)</label>
                        <input
                            type="url"
                            id="personalLink"
                            name="personalLink"
                            value={personalLink}
                            onChange={(e) => setPersonalLink(e.target.value)}
                            placeholder="https://your-portfolio-or-blog.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            rows="3"
                            value={bio}
                            onChange={handleBioChange}
                            placeholder={`Tell us a bit about yourself (min. ${bioMinLength} characters)`}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${bioError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'}`}
                            required
                            aria-describedby="bio-help"
                        />
                        {bioError && <p className="mt-1 text-xs text-red-600">{bioError}</p>}
                        {!bioError && bio && bio.length < bioMinLength && <p className="mt-1 text-xs text-gray-500">{bioMinLength - bio.length} more characters needed.</p>}
                        <p id="bio-help" className="mt-1 text-xs text-gray-500">Minimum {bioMinLength} characters.</p>
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSaving || isCheckingUsername || !usernameAvailable || !isValidUsername || !displayName.trim() || bio.length < bioMinLength}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </div>
        </main>
    </div>
  );
}

// Need Timestamp for the update logic
// import { Timestamp } from 'firebase/firestore'; // Already imported above
export default OnboardingPage; 