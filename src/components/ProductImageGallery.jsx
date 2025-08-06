import React, { useState, useEffect } from 'react';

function ProductImageGallery({ images }) {
  // Default to the first image if available, or null
  const [selectedImage, setSelectedImage] = useState(images?.[0] || null);

  // Handle cases where there are no images
  if (!images || images.length === 0) {
    return (
      <div className="mb-6 bg-gray-100 border border-gray-200 rounded-lg aspect-video flex items-center justify-center">
        <p className="text-gray-500">No product images available.</p>
      </div>
    );
  }

  // Ensure selectedImage is valid if images array changes
  useEffect(() => {
    if (images && images.length > 0 && !images.some(img => img.url === selectedImage?.url)) {
      setSelectedImage(images[0]);
    }
  }, [images, selectedImage]);

  return (
    <div className="mb-8">
      {/* Main Image Display */}
      <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
        {selectedImage ? (
          <img 
            src={selectedImage.url} 
            alt="Selected product view" 
            className="w-full h-full object-cover"
          />
        ) : (
           <p className="text-gray-500">Image not available.</p> 
        )}
      </div>

      {/* Thumbnails (only show if more than 1 image) */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.url || index} // Use URL as key if available
              onClick={() => setSelectedImage(image)}
              className={`block flex-shrink-0 w-16 h-16 rounded-md border overflow-hidden p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black ${selectedImage?.url === image.url ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
            >
              <img 
                src={image.url} 
                alt={`Product thumbnail ${index + 1}`} 
                className="w-full h-full object-cover rounded-sm"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductImageGallery; 