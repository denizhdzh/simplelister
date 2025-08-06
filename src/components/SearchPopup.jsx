import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { app } from '../firebase';
import { X, MagnifyingGlass, ArrowSquareOut } from '@phosphor-icons/react';

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

function SearchPopup({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // Track if initial fetch happened
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch all products once when the popup becomes visible for the first time
  useEffect(() => {
    if (isOpen && !hasFetched) {
      const fetchAllProducts = async () => {
        console.log("SearchPopup: Fetching all products...");
        setIsLoading(true);
        setAllProducts([]); // Clear previous products
        try {
          const db = getFirestore(app);
          const productsRef = collection(db, 'products');
          // Consider ordering for relevance if needed, e.g., by launch_date or upvote
          const q = query(productsRef, orderBy('launch_date', 'desc')); 
          const snapshot = await getDocs(q);
          const productList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllProducts(productList);
          setHasFetched(true);
          console.log(`SearchPopup: Fetched ${productList.length} products.`);
        } catch (error) {
          console.error("Error fetching all products for search:", error);
          // Handle error appropriately
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllProducts();
    }
  }, [isOpen, hasFetched]);

  // Filter products based on search term (debounced)
  const filterProducts = useCallback((term) => {
     if (!term) {
      setSearchResults([]);
      return;
    }
    if (!allProducts.length) return;

    console.log(`SearchPopup: Filtering for "${term}"...`);
    setIsLoading(true); // Show loading while filtering potentially large array
    const lowerCaseTerm = term.toLowerCase();
    const results = allProducts.filter(product => {
      const nameMatch = product.product_name?.toLowerCase().includes(lowerCaseTerm);
      const taglineMatch = product.tagline?.toLowerCase().includes(lowerCaseTerm);
      const descriptionMatch = product.description?.toLowerCase().includes(lowerCaseTerm);
      return nameMatch || taglineMatch || descriptionMatch;
    });
    setSearchResults(results);
     console.log(`SearchPopup: Found ${results.length} results.`);
    setIsLoading(false);
  }, [allProducts]);

  // Debounced version of the filter function
  const debouncedFilter = useCallback(debounce(filterProducts, 300), [filterProducts]);

  // Update search results when searchTerm changes
  useEffect(() => {
    debouncedFilter(searchTerm);
  }, [searchTerm, debouncedFilter]);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen) {
      // Slight delay to ensure popup is rendered and focusable
      setTimeout(() => inputRef.current?.focus(), 100); 
    }
  }, [isOpen]);

  // Close popup on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, popupRef]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out">
      <div 
        ref={popupRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 overflow-hidden transform transition-all duration-300 ease-in-out"
      >
        {/* Close Button (Moved Here) */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close search"
        >
          <X size={18} />
        </button>

        {/* Search Input */}
        <div className="relative border-b border-gray-200">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlass size={18} className="text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, tagline, or description..."
            className="block w-full pl-11 pr-10 py-3 border-0 bg-white text-gray-900 focus:outline-none focus:ring-0 text-sm placeholder-gray-500"
          />
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && searchTerm && (
            <div className="p-6 text-center text-sm text-gray-500">Searching...</div>
          )}
          {!isLoading && searchTerm && searchResults.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No products found for "{searchTerm}".</div>
          )}
          {!isLoading && searchResults.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {searchResults.map((product) => (
                <li key={product.id}>
                  <Link 
                    to={`/product/${product.slug}`} 
                    onClick={onClose}
                    className="flex items-center p-3 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg p-1 mr-3 flex items-center justify-center overflow-hidden bg-gray-100 border border-gray-200">
                       {product.logo && product.logo.url ? (
                        <img src={product.logo.url} alt={`${product.product_name} logo`} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">{product.product_name?.charAt(0) || 'P'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{product.tagline}</p>
                    </div>
                     <ArrowSquareOut size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
           {!searchTerm && (
             <div className="p-6 text-center text-sm text-gray-400">Start typing to search for products.</div>
           )}
        </div>
      </div>
    </div>
  );
}

export default SearchPopup; 