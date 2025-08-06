import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp, query, where, getCountFromServer } from 'firebase/firestore';
// Import Storage functions
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app, auth } from '../firebase';
import Header from '../components/Header';
// Import Step components - will create/rename these
import Step1_NameUrl from '../components/submit/Step1_NameUrl';
import Step2_TaglineTags from '../components/submit/Step2_TaglineTags';
import Step3_URLs from '../components/submit/Step3_URLs';
import Step4_Media from '../components/submit/Step4_Media';
import Step5_Deal from '../components/submit/Step5_Deal';
import Step6_PackageSubmit from '../components/submit/Step6_PackageSubmit';
import { CheckCircle } from '@phosphor-icons/react';

const TOTAL_STEPS = 6;

function SubmitProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    product_name: '',
    tagline: '',       // Max 35 chars
    // Step 2
    description: '',
    taglines: [],    // Min 1, Max 3 categories
    // Step 3
    product_url: '',   // Required
    linkedin_url: '', // Optional
    twitter_url: '',  // Optional
    // Step 4 (Files handled separately for upload)
    logoFile: null,     // Required
    imageFiles: [],   // Required (min 1), Max 4
    // Step 5
    dealDescription: '', // Optional
    dealCode: '',        // Optional
    // Step 6
    selectedPackage: null // 'free' or 'premium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // State for success message
  const [successMessageContent, setSuccessMessageContent] = useState({ title: '', message: '' }); // New state for dynamic success message

  // Listen for auth changes to potentially disable submit if logged out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setError(''); // Clear errors on step change
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setError(''); // Clear errors on step change
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- File Handling (Basic State Update) ---
  const handleLogoSelect = (file) => {
    updateFormData('logoFile', file);
  };

  const handleImagesSelect = (files) => {
    // Enforce max 4 images
    updateFormData('imageFiles', files.slice(0, 4));
  };
  // --- End File Handling ---

  // --- Validation Logic (Example - expand as needed) ---
  const validateStep = (step) => {
    setError('');
    switch (step) {
      case 1:
        if (!formData.product_name) return 'Product Name is required.';
        if (!formData.tagline) return 'Product Tagline is required.';
        if (formData.tagline.length > 60) return 'Tagline cannot exceed 35 characters.';
        return '';
      case 2:
         if (!formData.description) return 'Product Description is required.';
         if (formData.taglines.length === 0) return 'At least one Category is required.';
         if (formData.taglines.length > 3) return 'Maximum 3 categories allowed.';
         return '';
      case 3:
          if (!formData.product_url) return 'Product URL is required.';
          // Basic URL validation (can be improved)
          try { new URL(formData.product_url); } catch (_) { return 'Invalid Product URL format.'; }
          if (formData.linkedin_url) try { new URL(formData.linkedin_url); } catch (_) { return 'Invalid LinkedIn URL format.'; }
          if (formData.twitter_url) try { new URL(formData.twitter_url); } catch (_) { return 'Invalid Twitter URL format.'; }
          return '';
      case 4:
          if (!formData.logoFile) return 'Product Logo is required.';
          if (formData.imageFiles.length === 0) return 'At least one Product Image is required.';
          return '';
       case 5: // Optional step
          return '';
       case 6:
           return '';
      default:
        return 'Invalid step.';
    }
  };

  const uploadFile = async (file, path, onProgress) => {
    console.log(`[Uploader] Starting upload for: ${path}`);
    console.log(`[Uploader] File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      console.error('[Uploader] No authenticated user!');
      throw new Error('User not authenticated');
    }
    
    console.log(`[Uploader] User authenticated:`, {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Check if user has valid token
    try {
      const token = await user.getIdToken();
      console.log(`[Uploader] Got auth token, length: ${token.length}`);
    } catch (error) {
      console.error('[Uploader] Failed to get auth token:', error);
      throw error;
    }
    
    const storage = getStorage(app);
    console.log(`[Uploader] Storage bucket: ${storage.app.options.storageBucket}`);
    
    const fileRef = ref(storage, path);
    console.log(`[Uploader] Storage ref created: ${fileRef.toString()}`);
    
    const uploadTask = uploadBytesResumable(fileRef, file);
    console.log(`[Uploader] Upload task created`);
    
    return new Promise((resolve, reject) => {
      // Set a timeout for the upload
      const timeoutId = setTimeout(() => {
        console.error(`[Uploader] Upload timeout for ${path} after 60 seconds`);
        reject(new Error(`Upload timeout for ${path}`));
      }, 60000); // 60 seconds timeout
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[Uploader] Progress for ${path}: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
          console.log(`[Uploader] State: ${snapshot.state}`);
          console.log(`[Uploader] Task snapshot:`, {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state,
            metadata: snapshot.metadata
          });
          if (onProgress) onProgress(progress);
        }, 
        (error) => {
          clearTimeout(timeoutId);
          console.error(`[Uploader] Error for ${path}:`, error);
          console.error(`[Uploader] Error code: ${error.code}`);
          console.error(`[Uploader] Error message: ${error.message}`);
          console.error(`[Uploader] Full error object:`, error);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            console.log(`[Uploader] Upload completed, getting download URL...`);
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Uploader] Finished upload for: ${path}`, downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error(`[Uploader] Error getting download URL for ${path}:`, error);
            reject(error);
          }
        }
      );
      
      console.log(`[Uploader] Event listeners attached, upload should start...`);
    });
  };

  // --- Final Submission Handler ---
  const handleSubmit = async (selectedPackage) => {
    console.log('[New handleSubmit] >>>>>>>>>> Process started. <<<<<<<<<<');
    if (!currentUser) {
       console.log("--- handleSubmit exiting early: No currentUser.");
       setError('You must be logged in to submit a product.');
       throw new Error('User not authenticated');
    }

    console.log("--- handleSubmit: Starting validation...");
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      // Skip validation for step 6 here as package is handled
      if (i === 6) continue;
      const stepError = validateStep(i);
      if (stepError) {
        console.log(`--- handleSubmit exiting early: Validation failed at step ${i}: ${stepError}`);
        setError(`Error in Step ${i}: ${stepError}`);
        setCurrentStep(i);
        throw new Error(`Validation failed at step ${i}: ${stepError}`);
      }
    }
    console.log("--- handleSubmit: Validation passed. Proceeding to try block...");

    setIsSubmitting(true);
    setError('');
    setUploadProgress(0);
    console.log("SubmitProductPage: Submitting product data to backend...", selectedPackage);

    try {
      const slug = formData.product_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      console.log('[New handleSubmit] Generated slug:', slug);
      
      const totalFiles = 1 + formData.imageFiles.length; // 1 logo + images
      let uploadedFiles = 0;
      
      const updateOverallProgress = () => {
        uploadedFiles++;
        const progress = (uploadedFiles / totalFiles) * 100;
        setUploadProgress(progress);
        console.log(`[New handleSubmit] Overall progress: ${progress}% (${uploadedFiles}/${totalFiles})`);
      };
      
      // 1. Upload Logo
      console.log('[New handleSubmit] Starting logo upload...');
      const logoPath = `products/${slug}/logo_${Date.now()}_${formData.logoFile.name}`;
      const logoUrl = await uploadFile(formData.logoFile, logoPath, (progress) => {
        console.log(`[New handleSubmit] Logo upload progress: ${progress}%`);
      });
      updateOverallProgress();
      console.log('[New handleSubmit] Logo uploaded successfully:', logoUrl);

      // 2. Upload Images
      console.log('[New handleSubmit] Starting images upload...');
      const imageUploadPromises = formData.imageFiles.map(async (file, index) => {
        const imagePath = `products/${slug}/image_${index}_${Date.now()}_${file.name}`;
        console.log(`[New handleSubmit] Starting upload for image ${index + 1}:`, imagePath);
        
        const imageUrl = await uploadFile(file, imagePath, (progress) => {
          console.log(`[New handleSubmit] Image ${index + 1} upload progress: ${progress}%`);
        });
        
        updateOverallProgress();
        console.log(`[New handleSubmit] Image ${index + 1} uploaded successfully:`, imageUrl);
        return imageUrl;
      });
      
      const imageUrls = await Promise.all(imageUploadPromises);
      console.log('[New handleSubmit] All images uploaded successfully:', imageUrls);

      // 3. Prepare JSON Payload
      const payload = {
        product_name: formData.product_name,
        tagline: formData.tagline,
        description: formData.description,
        taglines: formData.taglines,
        product_url: formData.product_url,
        linkedin_url: formData.linkedin_url,
        twitter_url: formData.twitter_url,
        dealDescription: formData.dealDescription,
        dealCode: formData.dealCode,
        logo: { url: logoUrl },
        images: imageUrls.map(url => ({ url })),
        selectedPackage,
      };

      console.log('[New handleSubmit] Payload prepared:', payload);

      // 4. Send to Backend
      console.log('[New handleSubmit] Sending to backend...');
      const idToken = await currentUser.getIdToken();
      const response = await fetch('https://submitproduct-gcn7372oea-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      console.log('SubmitProductPage: Backend response:', result);
      
      setIsSubmitting(false);

      // Handle Success State and Navigation  
      const launchDate = new Date(result.launchDate);
      const launchDateForPopup = launchDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      let successPopupTitle = "Product Submitted Successfully!";
      let successPopupMessage = `'${formData.product_name}' has been received for submission.`;

      if (selectedPackage === 'free') {
        successPopupMessage += `\nScheduled launch date: ${launchDateForPopup}.`;
      } else {
        successPopupMessage += ` You are being redirected to payment, or your product will be published after payment confirmation.`;
      }
      successPopupMessage += "\nYou are being redirected to the homepage...";

      setSuccessMessageContent({ title: successPopupTitle, message: successPopupMessage });
      setShowSuccessMessage(true);

      // For FREE submission, navigate after delay
      if (selectedPackage === 'free') {
        console.log("SubmitProductPage: Free submission successful. Setting up redirect timer.");
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/');
        }, 4000);
        return; 
      }

      // For premium, return product ID for Step 6 payment flow
      return result.productId;

    } catch (e) {
      console.error("[New handleSubmit] Submission error:", e);
      setError(`Submission failed: ${e.message || 'Please try again.'}`);
      setIsSubmitting(false);
      throw e; // Re-throw to be caught by Step 6 handler
    }
  };

  // --- Render Current Step --- 
  const renderStep = () => {
    const stepProps = { 
        formData, 
        updateFormData, 
        nextStep, 
        prevStep, 
        setError, // Pass setError
        validateStep 
    }; 
    switch (currentStep) {
      case 1: return <Step1_NameUrl {...stepProps} />;
      case 2: return <Step2_TaglineTags {...stepProps} />;
      case 3: return <Step3_URLs {...stepProps} />;
      case 4: return <Step4_Media {...stepProps} handleLogoSelect={handleLogoSelect} handleImagesSelect={handleImagesSelect} error={error} />;
      case 5: return <Step5_Deal {...stepProps} error={error}/>;
      case 6: return <Step6_PackageSubmit 
                       {...stepProps} 
                       submitProduct={handleSubmit} // Pass handleSubmit as submitProduct
                       isSubmitting={isSubmitting} 
                       setIsSubmitting={setIsSubmitting} // Pass setIsSubmitting
                       error={error} // Pass error state
                       uploadProgress={uploadProgress} // Pass upload progress
                       // setError is already in stepProps
                     />;
      default: return <p>Unknown step</p>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white to-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* Progress Bar (Example) */}
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
              <div style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black transition-all duration-500"></div>
            </div>
            <p className="text-xs text-gray-500 text-right">Step {currentStep} of {TOTAL_STEPS}</p>
          </div>
        </div>

        {/* Render the current step component */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          {renderStep()}
          {/* Success Message Popup/Overlay */}
          {showSuccessMessage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
                <CheckCircle size={48} weight="fill" className="text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-800">{successMessageContent.title}</p>
                {successMessageContent.message.split('\n').map((line, index) => (
                  <p key={index} className="text-sm text-gray-600 mt-1 whitespace-pre-line">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SubmitProductPage; 