import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, X } from '@phosphor-icons/react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';

// Updated Tag input component with max limit
function TagInput({ tags, setTags, maxTags = 3 }) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    setError(''); // Clear error on new input
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag) {
          if (tags.length >= maxTags) {
              setError(`Maximum ${maxTags} tags allowed.`);
          } else if (!tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setInputValue('');
          } else {
             // Tag already exists - optionally clear input or show message
             setInputValue(''); 
          }
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setError(''); 
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-3">
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length >= maxTags ? `Max ${maxTags} categories reached` : "Type a category & press Enter"}
                className={`flex-1 px-3 py-2 bg-white text-gray-900 border rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors duration-200 ${error ? 'border-red-300 focus:ring-red-300 focus:border-red-300' : 'border-gray-200 focus:ring-gray-400 focus:border-gray-400'}`}
                disabled={tags.length >= maxTags}
            />
            <button
                type="button"
                disabled={!inputValue.trim() || tags.length >= maxTags}
                onClick={() => {
                    const newTag = inputValue.trim();
                    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
                        setTags([...tags, newTag]);
                        setInputValue('');
                    }
                }}
                className="p-2 text-gray-500 rounded-md hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={18} />
            </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex flex-wrap gap-2 min-h-[36px]">
            {tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {tag}
                    <button 
                        type="button" 
                        onClick={() => removeTag(tag)} 
                        className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                        <X size={14} weight="bold" />
                    </button>
                </span>
            ))}
        </div>
    </div>
  );
}

function Step2_DescriptionCategories({ formData, updateFormData, nextStep, prevStep, setError, validateStep }) {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all unique categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        // Extract all taglines from all products
        const allTaglines = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.taglines && Array.isArray(data.taglines)) {
            allTaglines.push(...data.taglines);
          }
        });
        
        // Remove duplicates and sort alphabetically
        const uniqueTaglines = [...new Set(allTaglines)].sort();
        setAvailableCategories(uniqueTaglines);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [setError]);
  
  const handleTagsChange = (newTags) => {
    updateFormData('taglines', newTags);
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errorMsg = validateStep(2);
    if (!errorMsg) {
      nextStep();
    } else {
      setError(errorMsg);
    }
  };
  
  const addTag = (tag) => {
    if (!formData.taglines.includes(tag) && formData.taglines.length < 3) {
      handleTagsChange([...formData.taglines, tag]);
      setSearchTerm('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleTagsChange(formData.taglines.filter(tag => tag !== tagToRemove));
  };
  
  // Filter categories based on search term
  const filteredCategories = availableCategories.filter(cat => 
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8">
        <label htmlFor="description" className="block text-base text-gray-700 mb-2">
          Product Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Explain what your product does, its key features, and who it's for..."
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Be concise but comprehensive. Include key benefits and use cases.
        </p>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="taglines" className="block text-base text-gray-700">
            Categories
          </label>
          <span className="text-xs text-gray-500 font-mono">
            {formData.taglines.length}/3
          </span>
        </div>
        
        {/* Categories selection */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={formData.taglines.length >= 3 ? "Max 3 categories reached" : "Search for categories..."}
              className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-200 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors duration-200"
              disabled={formData.taglines.length >= 3}
            />
          </div>
          
          {/* Selected categories */}
          <div className="flex flex-wrap gap-2 min-h-[36px] mb-2">
            {formData.taglines.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)} 
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={14} weight="bold" />
                </button>
              </span>
            ))}
          </div>
          
          {/* Category suggestions */}
          {searchTerm && formData.taglines.length < 3 && (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-2 text-center text-xs text-gray-700">Loading categories...</div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => addTag(category)}
                    disabled={formData.taglines.includes(category)}
                    className={`w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-100 transition-colors duration-150 ${
                      formData.taglines.includes(category) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {category.toUpperCase()}
                  </button>
                ))
              ) : (
                <div className="p-2 text-center text-xs text-gray-700">No matching categories found</div>
              )}
            </div>
          )}
        </div>
        
        <p className="mt-1 text-xs text-gray-500">
          Select 1-3 categories that best describe your product. Search for existing categories.
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
          disabled={!formData.description || formData.taglines.length === 0 || formData.taglines.length > 3}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default Step2_DescriptionCategories; 