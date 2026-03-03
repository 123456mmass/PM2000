'use client';

import React from 'react';

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/**
 * Skeleton loader for data tables
 * Displays placeholder rows and columns while data is loading
 */
export function DataTableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        {showHeader && (
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{
                      width: `${Math.random() * 40 + 60}%`,
                      animationDelay: `${rowIndex * 100}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTableSkeleton;
