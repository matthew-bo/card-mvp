'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CreditCardDetails } from '@/types/cards';
import StarRating from '@/components/StarRating';
import { ChevronLeft, ThumbsUp } from 'lucide-react';

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

export default function ReviewPage({ params }: { params: { cardId: string } }) {
  const cardId = params.cardId;
  
  const [card, setCard] = useState<CreditCardDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [likedComments, setLikedComments] = useState<string[]>([]);
  
  // Add sorting options
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'mostLiked'>('newest');
  
  // Load user data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = sessionStorage.getItem('review_user_name');
      const storedLikedComments = sessionStorage.getItem('liked_comments');
      
      if (storedUserName) {
        setUserName(storedUserName);
      }
      
      if (storedLikedComments) {
        try {
          setLikedComments(JSON.parse(storedLikedComments));
        } catch (error) {
          console.error('Error parsing liked comments:', error);
        }
      }
    }
  }, []);
  
  // Save user data to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (userName) {
        sessionStorage.setItem('review_user_name', userName);
      }
      
      if (likedComments.length > 0) {
        sessionStorage.setItem('liked_comments', JSON.stringify(likedComments));
      }
    }
  }, [userName, likedComments]);
  
  // Load card details
  useEffect(() => {
    const fetchCardDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cards/details/${cardId}`);
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
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp: {seconds: number; nanoseconds: number} | number | unknown): string => {
    if (!timestamp) return '';
    
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp) {
      date = new Date((timestamp as {seconds: number}).seconds * 1000);
    } else {
      date = new Date();
    }
    
    return date.toLocaleDateString();
  };
  
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
      
      const submission = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      });
      
      if (!submission.ok) {
        throw new Error('Failed to submit review');
      }
      
      const result = await submission.json();
      
      // Add the new review to the list
      setReviews(prev => [{
        ...newReview,
        id: result.reviewId,
        userId: 'anonymous',
        timestamp: Date.now(),
        likes: 0,
        comment: userComment.trim() || ''
      } as Review, ...prev]);
      
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
  
  // Get sorted reviews
  const getSortedReviews = () => {
    return [...reviews].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const timeA = typeof a.timestamp === 'number' ? 
            a.timestamp : 
            a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0;
          
          const timeB = typeof b.timestamp === 'number' ? 
            b.timestamp : 
            b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0;
            
          return timeB - timeA;
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'mostLiked':
          return b.likes - a.likes;
        default:
          return 0;
      }
    });
  };
  
  // Handle like review
  const handleLikeReview = async (reviewId: string) => {
    if (likedComments.includes(reviewId)) return;
    
    try {
      const response = await fetch(`/api/reviews/${cardId}/${reviewId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to like review');
      
      // Update reviews list with new like count
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, likes: review.likes + 1 }
          : review
      ));
      
      // Add to liked comments
      setLikedComments([...likedComments, reviewId]);
    } catch (error) {
      console.error('Error liking review:', error);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const TextRating = ({ rating }: { rating: number }) => {
    return (
      <span className="text-yellow-500 font-bold">
        {rating.toFixed(1)} / 5.0 ★
      </span>
    );
  };
  
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/review" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ChevronLeft size={16} className="mr-1" />
            Back to All Cards
          </Link>
        </nav>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : card && (
          <>
            {/* Card Details Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Card Info */}
                <div className="lg:col-span-2">
                  <h1 className="text-3xl font-bold text-gray-900">{card.name}</h1>
                  <p className="text-xl text-gray-600 mt-1">{card.issuer}</p>
                  
                  <div className="flex items-center mt-4">
                    <StarRating rating={averageRating} size="large" />
                    <span className="ml-2 text-gray-600">
                      {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

                  {/* Card Description */}
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">About This Card</h2>
                    <p className="text-gray-700">{card.description}</p>
                  </div>

                  {/* Key Features */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">Annual Fee</h3>
                        <p className="text-gray-700">{card.annualFee === 0 ? 'No Annual Fee' : `$${card.annualFee}`}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">Credit Score Required</h3>
                        <p className="text-gray-700 capitalize">{card.creditScoreRequired}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">Foreign Transaction Fee</h3>
                        <p className="text-gray-700">{card.foreignTransactionFee ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">Card Type</h3>
                        <p className="text-gray-700 capitalize">{card.cardType || 'Personal'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rewards Section */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Rewards & Benefits</h2>
                    <div className="space-y-4">
                      {Object.entries(card.rewardRates || {}).map(([category, rate]) => (
                        <div key={category} className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-gray-700 capitalize">{category}:</span>
                          <span className="ml-2 font-medium text-blue-600">{rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Write Review */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 p-6 rounded-lg sticky top-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h2>
                    
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name (optional)
                        </label>
                        <input
                          id="userName"
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
                        <label htmlFor="userComment" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Review (optional)
                        </label>
                        <textarea
                          id="userComment"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Share your experience with this card..."
                          rows={5}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!userRating || submitting}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                          !userRating || submitting
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="mostLiked">Most Liked</option>
                </select>
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No reviews yet. Be the first to review this card!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getSortedReviews().map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StarRating rating={review.rating} size="medium" />
                          <span className="ml-2 font-medium text-gray-900">
                            {review.userName || 'Anonymous User'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(review.timestamp)}
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
                              ? 'text-blue-600 cursor-not-allowed'
                              : 'text-gray-500 hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp size={14} className="mr-1" />
                          Helpful ({review.likes})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}