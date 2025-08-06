import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, UploadSimple, ImageSquare, X, Plus } from '@phosphor-icons/react';

// Simple component to display image previews
function ImagePreview({ file, onRemove, label }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl); 
      }
    };
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div className="relative group rounded-md overflow-hidden border border-gray-200 bg-white">
      <div className="aspect-square w-full h-full">
        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-1" />
      </div>
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-70 p-1 text-xs text-center">
          {label}
        </div>
      )}
      <button 
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Remove image"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}

function UploadBox({ onClick, label, icon, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-200 rounded-md text-gray-400 hover:text-gray-500 hover:border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 hover:bg-gray-100 p-4"
    >
      {icon}
      <span className="mt-2 text-xs font-medium">{label}</span>
    </button>
  );
}

function Step4_Media({ formData, handleLogoSelect, handleImagesSelect, nextStep, prevStep, setError, validateStep }) {
  const logoInputRef = useRef(null);
  const imagesInputRef = useRef(null);

  // Check if image is horizontal (width > height)
  const isHorizontalImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width > img.height);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeInMB = file.size / (1024 * 1024);
    console.log(`Step4_Media: Logo file selected - ${file.name} (${fileSizeInMB.toFixed(2)}MB)`);

    // File type validation
    if (!file.type.startsWith('image/')) {
      setError("Logo must be an image file (PNG, JPG, SVG, etc.)");
      return;
    }

    // Size validation
    const maxSizeInMB = 2;
    if (fileSizeInMB > maxSizeInMB) {
      setError(`Logo file too large (${fileSizeInMB.toFixed(1)}MB). Maximum size is ${maxSizeInMB}MB.`);
      return;
    }

    handleLogoSelect(file);
    setError(''); // Clear any previous errors
  };

  const onImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const maxSizeInMB = 5;
    let hasErrors = false;
    
    console.log(`Step4_Media: ${files.length} product image(s) selected for validation`);
    
    for (const file of files) {
      const fileSizeInMB = file.size / (1024 * 1024);
      console.log(`Step4_Media: Validating ${file.name} (${fileSizeInMB.toFixed(2)}MB)`);

      // File type validation
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not a valid image file`);
        hasErrors = true;
        continue;
      }

      // Size validation
      if (fileSizeInMB > maxSizeInMB) {
        setError(`${file.name} is too large (${fileSizeInMB.toFixed(1)}MB). Maximum size is ${maxSizeInMB}MB.`);
        hasErrors = true;
        continue;
      }
      
      // Aspect ratio validation
      try {
        const isHorizontal = await isHorizontalImage(file);
        if (!isHorizontal) {
          setError(`${file.name} must be horizontal (landscape orientation)`);
          hasErrors = true;
          continue;
        }
      } catch (error) {
        console.error(`Step4_Media: Error checking aspect ratio for ${file.name}:`, error);
        setError(`Error processing ${file.name}. Please try a different image.`);
        hasErrors = true;
        continue;
      }
      
      validFiles.push(file);
    }
    
    // Combine with existing files, up to max 4
    const newImages = [...formData.imageFiles, ...validFiles].slice(0, 4);
    handleImagesSelect(newImages);

    // Clear errors if no issues and we have valid files
    if (!hasErrors && validFiles.length > 0) {
      setError('');
      console.log(`Step4_Media: ${validFiles.length} valid image(s) added`);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errorMsg = validateStep(4);
    if (!errorMsg) {
      nextStep();
    } else {
      setError(errorMsg);
    }
  };
  
  const triggerLogoInput = () => logoInputRef.current?.click();
  const triggerImagesInput = () => imagesInputRef.current?.click();

  const removeImage = (index) => {
    const updatedFiles = formData.imageFiles.filter((_, i) => i !== index);
    handleImagesSelect(updatedFiles);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-base text-gray-700">
            Product Logo
          </label>
          <span className="text-xs text-gray-500">Square format recommended</span>
        </div>
        
        <div className="h-24 w-24 mb-1">
          {formData.logoFile ? (
            <ImagePreview file={formData.logoFile} onRemove={() => handleLogoSelect(null)} label="Logo" />
          ) : (
            <UploadBox 
              onClick={triggerLogoInput} 
              label="Upload Logo" 
              icon={<ImageSquare size={24} weight="light" />} 
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          PNG, JPG or SVG (max. 2MB)
        </p>
        <input 
          ref={logoInputRef} 
          type="file" 
          onChange={onLogoChange} 
          accept="image/png, image/jpeg, image/svg+xml, image/webp" 
          className="hidden"
          id="logo-upload"
        />
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-base text-gray-700">
            Product Images
          </label>
          <span className="text-xs text-gray-500 font-mono">{formData.imageFiles.length}/4</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
          {formData.imageFiles.map((file, index) => (
            <ImagePreview 
              key={index} 
              file={file} 
              onRemove={() => removeImage(index)} 
              label={`Image ${index + 1}`} 
            />
          ))}
          
          {formData.imageFiles.length < 4 && (
            <div className="aspect-square">
              <UploadBox 
                onClick={triggerImagesInput} 
                label={formData.imageFiles.length === 0 ? "Upload Images" : "Add More"} 
                icon={<Plus size={24} weight="light" />} 
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">
          PNG, JPG or WEBP (max. 5MB each). Images must be horizontal (landscape orientation).
        </p>
        <input 
          ref={imagesInputRef} 
          type="file" 
          multiple
          onChange={onImagesChange} 
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          id="images-upload"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-100 transition-colors duration-200 flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!formData.logoFile || formData.imageFiles.length === 0}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default Step4_Media; 