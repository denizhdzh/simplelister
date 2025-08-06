import React from 'react';
import { ArrowLeft, ArrowRight, Link } from '@phosphor-icons/react';

function Step3_URLs({ formData, updateFormData, nextStep, prevStep, setError, validateStep }) {

  const handleNext = (e) => {
    e.preventDefault();
    const errorMsg = validateStep(3);
    if (!errorMsg) {
      nextStep();
    } else {
      setError(errorMsg);
    }
  };

  const handleUrlBlur = (fieldName, value) => {
    if (value && !/^(https?):\/\//i.test(value)) {
      updateFormData(fieldName, `https://${value}`);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <label htmlFor="product_url" className="block text-base text-gray-700 mb-2">
          Product URL
        </label>
        <div className="flex items-center">
          <div className="mr-2 text-gray-400">
            <Link size={18} />
          </div>
          <input
            type="url"
            id="product_url"
            value={formData.product_url}
            onChange={(e) => updateFormData('product_url', e.target.value)}
            onBlur={(e) => handleUrlBlur('product_url', e.target.value)}
            placeholder="https://yourproduct.com"
            className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The main website for your product
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="linkedin_url" className="block text-base text-gray-700 mb-2">
          LinkedIn URL <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <div className="flex items-center">
          <div className="mr-2 text-gray-400">
            <Link size={18} />
          </div>
          <input
            type="url"
            id="linkedin_url"
            value={formData.linkedin_url}
            onChange={(e) => updateFormData('linkedin_url', e.target.value)}
            onBlur={(e) => handleUrlBlur('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/company/yourproduct"
            className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          />
        </div>
      </div>
      
      <div className="mb-10">
        <label htmlFor="twitter_url" className="block text-base text-gray-700 mb-2">
          Twitter URL <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <div className="flex items-center">
          <div className="mr-2 text-gray-400">
            <Link size={18} />
          </div>
          <input
            type="url"
            id="twitter_url"
            value={formData.twitter_url}
            onChange={(e) => updateFormData('twitter_url', e.target.value)}
            onBlur={(e) => handleUrlBlur('twitter_url', e.target.value)}
            placeholder="https://twitter.com/yourproduct"
            className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          />
        </div>
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
          disabled={!formData.product_url}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default Step3_URLs; 