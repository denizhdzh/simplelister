import React from 'react';
import { Navigate } from 'react-router-dom';

function CategoriesRedirect() {
  // Redirect immediately to the default category page
  return <Navigate to="/categories/Advertising" replace />;
}

export default CategoriesRedirect; 