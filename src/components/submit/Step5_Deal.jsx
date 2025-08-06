import React from 'react';
import { ArrowLeft, ArrowRight, Tag } from '@phosphor-icons/react';

function Step5_Deal({ formData, updateFormData, nextStep, prevStep, setError, validateStep }) {

  const handleNext = (e) => {
    e.preventDefault();
    // This step is optional, so validation always passes
    const errorMsg = validateStep(5);
    if (!errorMsg) {
      nextStep();
    } else {
      // Should technically not happen for this step
      setError(errorMsg);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="dealDescription" className="block text-base text-gray-700">
            Special Deal <span className="text-xs text-gray-500">(Optional)</span>
          </label>
        </div>
        <textarea
          id="dealDescription"
          rows={3}
          value={formData.dealDescription}
          onChange={(e) => updateFormData('dealDescription', e.target.value)}
          placeholder="e.g., Get 20% off for the first month!"
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
        />
        <p className="mt-1 text-xs text-gray-500">
          Describe any special offers for our community members.
        </p>
      </div>

      <div className="mb-10">
        <label htmlFor="dealCode" className="block text-base text-gray-700 mb-2">
          Discount Code <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <div className="flex items-center">
          <div className="mr-2 text-gray-400">
            <Tag size={18} />
          </div>
          <input
            type="text"
            id="dealCode"
            value={formData.dealCode}
            onChange={(e) => updateFormData('dealCode', e.target.value)}
            placeholder="e.g., LISTER20"
            className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The code users should enter to claim the deal.
        </p>
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
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center"
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default Step5_Deal; 