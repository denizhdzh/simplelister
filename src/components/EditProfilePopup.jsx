import React, { useState, useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

function EditProfilePopup({ isOpen, onClose, initialData, onSave }) {
  const [formData, setFormData] = useState({ ...initialData });
  const [isSaving, setIsSaving] = useState(false);
  const popupRef = useRef(null);

  // Reset form data when initialData changes (e.g., popup reopens)
  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData, isOpen]); // Depend on isOpen to reset when opened

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData); // Call the save function passed from parent
      // onClose(); // Parent handles closing on success via onSave logic
    } catch (error) {
      console.error("Error during save:", error);
      // Error state is handled in the parent (reverting optimistic UI)
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div 
        ref={popupRef}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden transform transition-all duration-300 ease-in-out"
      >
         <button 
           onClick={onClose} 
           className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
           aria-label="Close edit profile"
           disabled={isSaving}
         >
           <X size={18} />
         </button>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
              placeholder="Tell us a bit about yourself"
            />
          </div>
          
          {/* Website */}
           <div>
             <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
             <input
               type="url"
               id="website"
               name="website"
               value={formData.website}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
               placeholder="https://yourwebsite.com"
             />
           </div>

          {/* Personal Link */}
           <div>
             <label htmlFor="personalLink" className="block text-sm font-medium text-gray-700 mb-1">Personal Link (e.g., Twitter, LinkedIn)</label>
             <input
               type="url"
               id="personalLink"
               name="personalLink"
               value={formData.personalLink}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
               placeholder="https://yourlink.com"
             />
           </div>

          {/* Social Media */}
          <div>
             <label htmlFor="socialMedia" className="block text-sm font-medium text-gray-700 mb-1">Another Social Link</label>
             <input
               type="url"
               id="socialMedia"
               name="socialMedia"
               value={formData.socialMedia}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
               placeholder="https://anotherlink.com"
             />
           </div>

           {/* Company */}
           <div>
             <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
             <input
               type="text"
               id="company"
               name="company"
               value={formData.company}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
             />
           </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfilePopup; 