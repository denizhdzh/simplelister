import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebase';
import { SUBMISSION_LIMITS } from '../constants/pricing';

const useSubmissionLimit = (currentUser, userProfileData) => {
  const [submissionsThisWeek, setSubmissionsThisWeek] = useState(0);
  const [weeklyResetDate, setWeeklyResetDate] = useState(null);
  const [canSubmit, setCanSubmit] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if user is premium
  const isPremium = userProfileData?.subscriptionTier === 'premium' || 
                   userProfileData?.subscriptionTier === 'business';

  // Calculate next Monday (weekly reset)
  const getNextMondayReset = () => {
    const now = new Date();
    const nextMonday = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days until next Monday
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(SUBMISSION_LIMITS.RESET_HOUR, 0, 0, 0);
    
    return nextMonday;
  };

  // Get current week's Monday
  const getCurrentWeekMonday = () => {
    const now = new Date();
    const monday = new Date();
    const dayOfWeek = now.getDay();
    
    // Calculate days since Monday (0 = Sunday, 1 = Monday)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(SUBMISSION_LIMITS.RESET_HOUR, 0, 0, 0);
    
    return monday;
  };

  useEffect(() => {
    const fetchSubmissionData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const submissions = userData.submissionsThisWeek || 0;
          const resetDate = userData.weeklyResetDate?.toDate();
          
          const currentWeekMonday = getCurrentWeekMonday();
          const nextResetDate = getNextMondayReset();
          
          // Check if we need to reset the counter
          let currentSubmissions = submissions;
          let currentResetDate = resetDate;
          
          if (!resetDate || resetDate < currentWeekMonday) {
            // Need to reset - it's a new week
            currentSubmissions = 0;
            currentResetDate = nextResetDate;
          }
          
          setSubmissionsThisWeek(currentSubmissions);
          setWeeklyResetDate(currentResetDate);
          
          // Determine if user can submit
          if (isPremium) {
            setCanSubmit(true); // Premium users have unlimited submissions
          } else {
            setCanSubmit(currentSubmissions < SUBMISSION_LIMITS.FREE_WEEKLY_LIMIT);
          }
        } else {
          // New user - can submit
          setSubmissionsThisWeek(0);
          setWeeklyResetDate(getNextMondayReset());
          setCanSubmit(true);
        }
      } catch (error) {
        console.error('Error fetching submission data:', error);
        setCanSubmit(false);
      }
      
      setLoading(false);
    };

    fetchSubmissionData();
  }, [currentUser, isPremium]);

  // Calculate remaining submissions for free users
  const remainingSubmissions = isPremium ? 
    'unlimited' : 
    Math.max(0, SUBMISSION_LIMITS.FREE_WEEKLY_LIMIT - submissionsThisWeek);

  // Time until reset
  const timeUntilReset = weeklyResetDate ? 
    Math.max(0, weeklyResetDate - new Date()) : 0;

  // Format time until reset
  const formatTimeUntilReset = () => {
    if (!timeUntilReset) return '';
    
    const days = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  return {
    submissionsThisWeek,
    remainingSubmissions,
    canSubmit,
    isPremium,
    loading,
    weeklyResetDate,
    timeUntilReset: formatTimeUntilReset(),
    nextResetDate: getNextMondayReset()
  };
};

export default useSubmissionLimit;