import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCardDetails } from '@/types/cards';
import { StarRating } from '@/components/StarRating';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { getIssuerColorScheme, getCreditScoreBadgeClass, getTopRewardCategories } from '@/utils/cardUtils';
import { ChevronRight, MessageSquare, Award } from 'lucide-react';

interface ReviewCardDisplayProps {
  card: CreditCardDetails & { cardType?: string };
}

const ReviewCardDisplay: React.FC<ReviewCardDisplayProps> = ({ card }) => {
  console.log('Rendering card:', card.id, card.name);
  
  interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    timestamp: {
      seconds: number;
      nanoseconds: number;
    } | number;
    likes: number;
  }
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [quickRating, setQuickRating] = useState(0);
  const [quickComment, setQuickComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Load user data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = sessionStorage.getItem('review_user_name');
      if (storedUserName) {
        setUserName(storedUserName);
      }
    }
  }, []);
  
  // Save user data to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && userName) {
      sessionStorage.setItem('review_user_name', userName);
    }
  }, [userName]);
  
  // Fetch reviews for this card
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/${card.id}`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.success && data.reviews) {
          setReviews(data.reviews);
          
          // Calculate average rating if there are reviews
          if (data.reviews.length > 0) {
            const total = data.reviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
            setAverageRating(total / data.reviews.length);
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [card.id]);
  
  // Get issuer-specific styling
  const issuerStyle = getIssuerColorScheme(card.issuer);
  
  // Get the top 3 reward categories
  const topRewardCategories = getTopRewardCategories(card, 3);
  
  // Get one featured review (most recent with comment)
  const featuredReview = reviews.find(review => review.comment && review.comment.trim() !== '');
  
  // Get credit score badge class
  const creditScoreBadgeClass = getCreditScoreBadgeClass(card.creditScoreRequired);
  
  const handleQuickReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${card.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: quickRating,
          comment: quickComment,
          userName: userName || 'Anonymous User',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      // Update reviews list
      const newReview = await response.json();
      setReviews([...reviews, newReview]);
      
      // Reset form
      setQuickRating(0);
      setQuickComment('');
      setShowQuickReview(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="md:flex">
        {/* Card Visual (Left Side) */}
        <div className="md:w-1/4 p-6 flex items-center justify-center bg-gray-50 border-r border-gray-100">
          <div className="w-full max-w-xs aspect-[1.6/1] rounded-lg shadow-sm relative overflow-hidden">
            <div className={`absolute inset-0 ${issuerStyle.bg}`}></div>
            <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
              <div className="text-sm opacity-80">{card.issuer}</div>
              <div>
                <h3 className="font-medium line-clamp-2">{card.name}</h3>
                <div className="mt-1 flex justify-between items-center">
                  <span className="text-xs opacity-90">
                    {card.annualFee > 0 ? formatCurrency(card.annualFee) + '/yr' : 'No Annual Fee'}
                  </span>
                  
                  {card.creditScoreRequired && (
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full capitalize">
                      {card.creditScoreRequired}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Details (Right Side) */}
        <div className="flex-1 p-6">
          <div className="sm:flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{card.name}</h3>
              <div className="flex items-center mt-1 text-sm">
                <span className="text-gray-600">{card.issuer}</span>
                {card.cardType && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    card.cardType === 'business' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {card.cardType === 'business' ? 'Business' : 'Personal'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-2 sm:mt-0 flex items-center">
              {isLoading ? (
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <>
                  <StarRating rating={averageRating} size="medium" />
                  <span className="ml-2 text-sm text-gray-600">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Card description */}
          <p className="text-gray-700 mb-4 line-clamp-2">{card.description}</p>
          
          {/* Key features and top rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Award size={16} className="mr-1" /> Top Rewards
              </h4>
              <ul className="space-y-1">
                {topRewardCategories.map(([category, rate], index) => (
                  <li key={index} className="flex items-center text-sm">
                    <span className={`w-2 h-2 rounded-full ${issuerStyle.bg} mr-2`}></span>
                    <span className="text-gray-700 capitalize">{category}:</span>
                    <span className={`ml-1 font-medium ${issuerStyle.text}`}>
                      {rate}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Details</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Annual Fee:</span>
                  <span className="font-medium">
                    {card.annualFee === 0 ? 'None' : formatCurrency(card.annualFee)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Foreign Transaction Fee:</span>
                  <span className="font-medium">
                    {card.foreignTransactionFee ? 'Yes' : 'None'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Credit Score:</span>
                  <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${creditScoreBadgeClass}`}>
                    {card.creditScoreRequired}
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Featured review */}
          {featuredReview && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center mb-2">
                <MessageSquare size={16} className="text-gray-400 mr-2" />
                <span className="text-sm font-medium">{featuredReview.userName}</span>
                <div className="ml-auto">
                  <StarRating rating={featuredReview.rating} size="small" />
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">&quot;{featuredReview.comment}&quot;</p>
            </div>
          )}
          
          {/* View details link */}
          <div className="mt-4 flex justify-end">
            <Link 
              href={`/review/${card.id}`}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => console.log('Navigating to card details:', card.id)}
            >
              View Details & Reviews
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Quick Review Section */}
          <div className="px-6 pb-4">
            {!showQuickReview ? (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setShowQuickReview(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <MessageSquare size={16} className="mr-1" />
                  Write a Quick Review
                </button>
                {submitSuccess && (
                  <span className="text-sm text-green-600">Review submitted successfully!</span>
                )}
              </div>
            ) : (
              <form onSubmit={handleQuickReview} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Rating
                  </label>
                  <StarRating 
                    rating={quickRating} 
                    onChange={setQuickRating}
                    editable
                    size="medium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Anonymous User"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quick Comment (optional)
                  </label>
                  <textarea
                    value={quickComment}
                    onChange={(e) => setQuickComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={2}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickReview(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!quickRating || isSubmitting}
                    className={`px-3 py-1 text-sm text-white rounded-md ${
                      !quickRating || isSubmitting
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCardDisplay;

