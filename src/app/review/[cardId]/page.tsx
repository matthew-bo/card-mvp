'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CreditCardDetails } from '@/types/cards';
import { StarRating } from '@/components/StarRating';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: number;
  likes: number;
}

/*
interface UserRating {
  id: string;
  rating: number;
  comment?: string;
}
*/

export default function CardDetailPage() {
  const params = useParams();
  const cardId = params.cardId as string;
  
  const [card, setCard] = useState<CreditCardDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useLocalStorage('review_user_name', '');
  
  // Track user's liked comments to prevent multiple likes
  const [likedComments, setLikedComments] = useLocalStorage<string[]>('liked_comments', []);
  
  // Load card details
  useEffect(() => {
    const fetchCardDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cards/details?cardKey=${cardId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch card details');
        }
        const data = await response.json();
        setCard(data.data);
      } catch (err) {
        console.error('Error fetching card details:', err);
        setError('Failed to load card details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCardDetails();
  }, [cardId]);
  
  // Load reviews
  useEffect(() => {
    const fetchReviews = async () => {
        const response = await fetch(`/api/reviews/${cardId}`);
      setReviewsLoading(true);
      try {
        const response = await fetch(`/api/reviews/${cardId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    
    fetchReviews();
  }, [cardId]);
  
  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  // Submit a review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating) return;
    
    setSubmitting(true);
    try {
      const newReview = {
        cardId,
        userName: userName || 'Anonymous User',
        rating: userRating,
        comment: userComment.trim() || undefined
      };
      
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      const result = await response.json();
      
      // Add the new review to the list
      setReviews(prev => [...prev, {
        ...newReview,
        id: result.reviewId,
        userId: 'anonymous',
        timestamp: Date.now(),
        likes: 0
      } as Review]);
      
      // Reset form
      setUserRating(0);
      setUserComment('');
      
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Like a review
  const handleLikeReview = async (reviewId: string) => {
    // Check if the user has already liked this comment
    if (likedComments.includes(reviewId)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reviews/like/${reviewId}`, {
        method: 'POST'
      });
      
      // Use the response or just check if it's OK
      if (!response.ok) {
        throw new Error('Failed to like review');
      }
      
      // Update the reviews list with the new like count
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, likes: review.likes + 1 } 
          : review
      ));
      
      // Add this comment to the liked comments list
      setLikedComments([...likedComments, reviewId]);
      
    } catch (err) {
      console.error('Error liking review:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error || 'Card not found'}
          </div>
          <div className="mt-4">
            <Link href="/review" className="text-blue-600 hover:text-blue-800">
              ← Back to all cards
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/review" className="text-blue-600 hover:text-blue-800">
            ← Back to all cards
          </Link>
        </div>
        
        {/* Card details section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card basic information */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900">{card.name}</h1>
              <p className="text-xl text-gray-600 mt-1">{card.issuer}</p>
              
              <div className="flex items-center mt-4">
                <StarRating rating={averageRating} size="large" />
                <span className="ml-2 text-gray-600">
                  {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Card Details</h2>
                <p className="text-gray-700 mb-4">{card.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Key Information</h3>
                    <dl className="space-y-2">
                      <div className="flex">
                        <dt className="w-1/2 text-sm font-medium text-gray-500">Annual Fee</dt>
                        <dd className="w-1/2 text-sm text-gray-900">${card.annualFee}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/2 text-sm font-medium text-gray-500">Credit Score Required</dt>
                        <dd className="w-1/2 text-sm text-gray-900 capitalize">{card.creditScoreRequired}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-1/2 text-sm font-medium text-gray-500">Foreign Transaction Fee</dt>
                        <dd className="w-1/2 text-sm text-gray-900">{card.foreignTransactionFee ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Reward Rates</h3>
                    <ul className="space-y-1">
                      {Object.entries(card.rewardRates)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, rate]) => (
                          <li key={category} className="text-sm text-gray-700">
                            <span className="font-medium capitalize">{category}:</span> {rate}%
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                </div>
                
                {/* Sign up bonus */}
                {card.signupBonus && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sign-up Bonus</h3>
                    <p className="text-sm text-gray-700">{card.signupBonus.description}</p>
                  </div>
                )}
                
                {/* Perks */}
                {card.perks && card.perks.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Card Perks</h3>
                    <ul className="space-y-1 list-disc pl-4">
                      {card.perks.map((perk, index) => (
                        <li key={index} className="text-sm text-gray-700">{perk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Write a review section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h2>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Anonymous User"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Rating
                  </label>
                  <StarRating 
                    rating={userRating} 
                    onChange={setUserRating} 
                    editable 
                    size="large" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review (optional)
                  </label>
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Share your experience with this card..."
                    rows={5}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !userRating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Reviews section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h2>
          
          {reviewsLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No reviews yet. Be the first to review this card!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews
                .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
                .map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <StarRating rating={review.rating} size="medium" />
                        <span className="ml-2 font-medium text-gray-900">
                          {review.userName}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.comment && (
                      <p className="mt-2 text-gray-700">{review.comment}</p>
                    )}
                    
                    <div className="mt-3 flex items-center">
                      <button
                        onClick={() => handleLikeReview(review.id)}
                        disabled={likedComments.includes(review.id)}
                        className={`flex items-center text-sm ${
                          likedComments.includes(review.id)
                            ? 'text-blue-600 cursor-default'
                            : 'text-gray-500 hover:text-blue-600'
                        }`}
                      >
                        <svg 
                          className="w-4 h-4 mr-1" 
                          fill={likedComments.includes(review.id) ? 'currentColor' : 'none'} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
                          />
                        </svg>
                        {review.likes} {review.likes === 1 ? 'like' : 'likes'}
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </main>
    </div>
  );
}