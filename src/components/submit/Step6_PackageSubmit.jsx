import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Package, Star } from '@phosphor-icons/react';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from '../../firebase';
import { auth } from '../../firebase';

const functions = getFunctions(app);
const createStripeCheckout = httpsCallable(functions, 'createStripeCheckoutSession');

const stripePromise = loadStripe('pk_live_51Q8KL5DRgvwK8lM2WhTzDO0hwDVBJtRCCqytxH1pKGD94R8XsbABztFzaZgptqZhtRpkKJVQWn2taNoS49xKLM2h00lC87KeLY');

function Step6_PackageSubmit({ formData, setFormData, prevStep, submitProduct, isSubmitting, setIsSubmitting, error, setError, updateFormData }) {
  const [selectedPackage, setSelectedPackage] = useState('paid');

  const handlePackageSelect = (packageName) => {
    setSelectedPackage(packageName);
    if (updateFormData) { 
        updateFormData('selectedPackage', packageName);
    } else {
        console.warn("updateFormData prop not provided to Step6_PackageSubmit");
    }
    if (setError) setError(null);
  };

  const handleCheckout = async () => {
    if (!submitProduct) {
        console.error("submitProduct function is not provided as a prop.");
        if (setError) setError("Cannot submit product. Please try again later.");
        return;
    }
    if (setIsSubmitting) setIsSubmitting(true);
    if (setError) setError(null);

    try {
      // 1. Submit the product data to Firestore first
      // IMPORTANT: submitProduct MUST return the new product ID on success
      // AND throw an error on failure.
      console.log("Calling submitProduct('paid')...");
      const submissionResult = await submitProduct('paid'); // Now expects ID or throws error
      console.log("--- submitProduct('paid') returned:", submissionResult); // Log the raw result
      console.log("--- Type of returned value:", typeof submissionResult); // Log the type

      const newProductId = submissionResult; // Assign it

      // Add a more explicit check
      if (typeof newProductId !== 'string' || !newProductId) {
           console.error("Received invalid product ID type or value from submitProduct:", newProductId);
           throw new Error("Failed to get a valid product ID after submission.");
      }

      console.log(`Proceeding to Stripe checkout with ID: ${newProductId}.`);

      // Get current user
      const user = auth.currentUser;
      if (!user) {
          console.error("User is not authenticated before calling the function.");
          throw new Error("User authentication lost. Please log in again.");
      }
      console.log("--- Auth check passed. User UID:", user.uid);

      // Force refresh the ID token before calling the function
      try {
        console.log("Forcing token refresh...");
        await user.getIdToken(true); // Pass true to force refresh
        console.log("Token refresh successful.");
      } catch (refreshError) {
        console.error("Error forcing token refresh:", refreshError);
        // Handle this error, e.g., ask user to log in again
        throw new Error("Authentication error. Please try logging in again.");
      }

      // 2. Call the Firebase Function to create Stripe session
      console.log("Calling createStripeCheckout with ID:", newProductId);
      const result = await createStripeCheckout({ productId: newProductId });
      const sessionId = result.data.id;

      // 3. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: sessionId,
      });

      if (stripeError) {
          // This error is usually client-side (network, browser)
          throw new Error(`Payment Redirect Error: ${stripeError.message}`);
      }
      // On successful redirect, isSubmitting remains true

    } catch (err) {
      // Handle errors from submitProduct, createStripeCheckout, or redirectToCheckout
      console.error("Checkout process error in Step6:", err); // Add context
      if (setError) setError(`An error occurred: ${err.message || 'Please try again.'}`);
      if (setIsSubmitting) setIsSubmitting(false); // Reset loading state on any error
      // Note: Product might be created in Firestore even if payment fails here.
    }
  };

  const FeatureItem = ({ text, included, isPremium = false }) => (
    <li className="flex items-center space-x-2">
      {included ? (
        <CheckCircle size={18} weight="fill" className={isPremium ? "text-green-500" : "text-red-500"} />
      ) : (
        <XCircle size={18} weight="fill" className="text-red-500" /> 
      )}
      <span className="text-sm text-gray-700">{text}</span>
    </li>
  );

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Submission Package</h2>
      <p className="text-sm text-gray-600 mb-8">Select a package that fits your needs.</p>

      <div className="space-y-4 mb-10">
        <div 
          className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
            selectedPackage === 'free' ? 'border-black ring-1 ring-black' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handlePackageSelect('free')}
        >
           <div className="flex items-center mb-3">
             <Package size={24} className={`mr-3 flex-shrink-0 ${selectedPackage === 'free' ? 'text-black' : 'text-gray-500'}`} /> 
             <div className="flex-grow"><h3 className={`font-medium ${selectedPackage === 'free' ? 'text-gray-900' : 'text-gray-700'}`}>FREE SUBMIT</h3><p className="text-lg font-semibold text-gray-800">$0</p></div>
             {selectedPackage === 'free' && (
                <CheckCircle size={20} weight="fill" className="text-black ml-4 flex-shrink-0" />
             )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">What you will get?</p>
            <ul className="space-y-1.5">
              <FeatureItem text="1 day guarantee visibility" included={true} isPremium={false} /> <FeatureItem text="Random launch day" included={true} isPremium={false} /> <FeatureItem text="Normal Launch" included={true} isPremium={false} /> <FeatureItem text="No-follow backlink" included={true} isPremium={false} />
            </ul>
          </div>
        </div>

        <div 
          className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
            selectedPackage === 'paid' ? 'border-black ring-1 ring-black' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => handlePackageSelect('paid')}
        >
          <div className="flex items-center mb-3">
            <Star size={24} weight="fill" className={`mr-3 flex-shrink-0 ${selectedPackage === 'paid' ? 'text-yellow-500' : 'text-gray-400'}`} />
            <div className="flex-grow"><h3 className={`font-medium ${selectedPackage === 'paid' ? 'text-gray-900' : 'text-gray-700'}`}>PREMIUM LAUNCH</h3><div className="flex items-baseline"><span className="text-lg font-semibold text-gray-800">$29</span></div></div>
            {selectedPackage === 'paid' && (
              <CheckCircle size={20} weight="fill" className="text-black ml-4 flex-shrink-0" />
            )}
          </div>
           <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">What you will get?</p>
            <ul className="space-y-1.5">
              <FeatureItem text="3 days guarantee visibility" included={true} isPremium={true} /> 
              <FeatureItem text="Skip the line & launch tomorrow" included={true} isPremium={true} />
              <FeatureItem text="100% Launch Schedule Flexibility" included={true} isPremium={true} /> 
              <FeatureItem text="Verified product, Premium Launch" included={true} isPremium={true} /> 
              <FeatureItem text="Do-follow backlink forever" included={true} isPremium={true} />
            </ul>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <div className="flex justify-between items-center mt-10">
         <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedPackage === 'paid') {
              handleCheckout();
            } else {
              if (submitProduct) {
                if (setIsSubmitting) setIsSubmitting(true);
                if (setError) setError(null);
                submitProduct('free')
                  .then(() => {
                    console.log("Free product submitted.");
                  })
                  .catch((err) => {
                    console.error("Free submission error:", err);
                    if (setError) setError(`Submission failed: ${err.message || 'Please try again.'}`);
                    if (setIsSubmitting) setIsSubmitting(false);
                  });
              } else {
                console.error("submitProduct function is not provided.");
                if (setError) setError("Cannot submit product.");
              }
            }
          }}
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : (selectedPackage === 'paid' ? 'Proceed to Payment' : 'Submit Product')}
        </button>
      </div>
      
       <p className="text-center text-xs text-gray-400 mt-12">Step 6 of 6</p>
    </div>
  );
}

export default Step6_PackageSubmit; 