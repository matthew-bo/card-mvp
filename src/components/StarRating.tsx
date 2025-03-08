import React from 'react';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'medium',
  editable = false,
  onChange
}) => {
  const totalStars = 5;
  
  // Determine star size
  const starSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  const starSize = starSizes[size];
  
  // Handle star click for editable mode
  const handleClick = (selectedRating: number) => {
    if (editable && onChange) {
      onChange(selectedRating);
    }
  };
  
  // Handle mouse enter for hover effect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseEnter = (selectedRating: number) => {
    if (editable && onChange) {
      // You can add hover effects here if needed
    }
  };
  
  return (
    <div className="flex">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        
        return (
          <button
            key={index}
            type="button"
            className={`${editable ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={!editable}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <svg
              className={`${starSize} ${
                isFilled ? 'text-yellow-400' : 'text-gray-300'
              } ${editable && 'hover:text-yellow-400'}`}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

// Export both as default and named export for flexibility
export default StarRating;
export { StarRating };