import React from 'react';

function LeaderboardList({ title, items, renderItem, loading, loadingItemCount = 5 }) {

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {[...Array(loadingItemCount)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <div className="w-6 text-right text-gray-400">
             <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No data available.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={item.id || index} className="p-2 rounded-md hover:bg-gray-50">
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LeaderboardList; 