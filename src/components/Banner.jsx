import React from 'react';

function Banner() {
  return (
    <div className="relative w-full mb-6" style={{ paddingBottom: '75%' }}> {/* 4:3 aspect ratio */}
      <img 
        src="https://images.unsplash.com/photo-1614851099511-773084f6911d?q=80&w=2940&auto=format&fit=crop"
        alt="Banner" 
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
      />
    </div>
  );
}

export default Banner; 