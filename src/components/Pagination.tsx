'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  preserveParams?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
  preserveParams = false
}) => {
  const searchParams = useSearchParams();
  
  // Function to generate page URL with preserved parameters
  const getPageUrl = (page: number) => {
    if (!preserveParams) {
      return `${baseUrl}?page=${page}`;
    }
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of the page range
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }
    
    // Add pages in the middle
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('...');
  }
  
  // Always show last page if there's more than one page
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
};

  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center space-x-1">
      {/* Previous page button */}
      <Link
        href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'}
        className={`px-3 py-1 rounded-md ${
          currentPage > 1
            ? 'text-gray-700 hover:bg-gray-200'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        aria-disabled={currentPage <= 1}
        onClick={(e) => {
          if (currentPage <= 1) e.preventDefault();
        }}
      >
        Previous
      </Link>
      
      {/* Page numbers */}
      {getPageNumbers().map((page, i) => (
        <React.Fragment key={i}>
          {page === '...' ? (
            <span className="px-3 py-1 text-gray-500">...</span>
          ) : (
            <Link
              href={getPageUrl(page as number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </Link>
          )}
        </React.Fragment>
      ))}
      
      {/* Next page button */}
      <Link
        href={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'}
        className={`px-3 py-1 rounded-md ${
          currentPage < totalPages
            ? 'text-gray-700 hover:bg-gray-200'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        aria-disabled={currentPage >= totalPages}
        onClick={(e) => {
          if (currentPage >= totalPages) e.preventDefault();
        }}
      >
        Next
      </Link>
    </div>
  );
};

export default Pagination;