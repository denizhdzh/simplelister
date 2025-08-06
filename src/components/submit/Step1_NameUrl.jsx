import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';

function Step1_NameTagline({ formData, updateFormData, nextStep, setError, validateStep }) {

  const handleNext = (e) => {
    e.preventDefault();
    const errorMsg = validateStep(1); // Validate this step
    if (!errorMsg) {
      nextStep();
    } else {
      setError(errorMsg); // Show error specific to this step
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8">
        <label htmlFor="product_name" className="block text-base text-gray-700 mb-2">
          Product Name
        </label>
        <input
          type="text"
          id="product_name"
          value={formData.product_name}
          onChange={(e) => updateFormData('product_name', e.target.value)}
          placeholder="e.g., Simple Lister"
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          required
        />
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="tagline" className="block text-base text-gray-700">
            Tagline
          </label>
          <span className="text-xs text-gray-500 font-mono">
            {formData.tagline.length}/60
          </span>
        </div>
        <input
          type="text"
          id="tagline"
          value={formData.tagline}
          onChange={(e) => updateFormData('tagline', e.target.value)}
          placeholder="e.g., The easiest way to list anything."
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          maxLength={60}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Describe your product in one concise sentence.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!formData.product_name || !formData.tagline || formData.tagline.length > 60}
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default Step1_NameTagline; 