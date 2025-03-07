'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';
import { useAuthGuard } from '@/utils/auth/useAuthGuard';
import { signIn, signUp, signInWithGoogle } from '@/utils/auth/authService';
import GoogleButton from '@/components/auth/GoogleButton';
import ScrollReveal from '@/components/ScrollReveal';
import { useNotification } from '@/contexts/NotificationContext';

export default function ConsultationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // Use the auth guard for redirecting if needed
  useAuthGuard({
    // Do not require auth, we'll handle showing login form ourselves
    requireAuth: false,
    redirectIfAuthenticated: false
  });
  
  // Local state for login/signup form
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for Calendly booking status
  const [bookingComplete, setBookingComplete] = useState(false);
  
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const handleFaqToggle = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Listen for Calendly events
  useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event && e.data.event.indexOf('calendly') === 0) {
        if (e.data.event === 'calendly.event_scheduled') {
          // Show success message when booking is complete
          setBookingComplete(true);
          showNotification(
            'Your consultation has been successfully scheduled! Check your email for confirmation details.',
            'success'
          );
          
          // You could also log the event to Firebase here
          console.log('Calendly booking completed:', e.data);
        }
      }
    };
    
    window.addEventListener('message', handleCalendlyEvent);
    
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [showNotification]);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await signIn(email, password);
      setSuccessMessage('Successfully logged in!');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { message: string; code?: string };
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Failed to sign in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle signup form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      await signUp(email, password, displayName);
      setSuccessMessage('Account created successfully! You can now book a consultation.');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Signup error:', error);
      
      if (error.message.includes('email-already-in-use')) {
        setError('An account already exists with this email address.');
      } else if (error.message.includes('weak-password')) {
        setError('Password is too weak. Please use at least 8 characters with uppercase, lowercase, number and special character.');
      } else {
        setError('Failed to sign up: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      setSuccessMessage('Successfully logged in with Google!');
    } catch (err) {
      console.error('Google login error:', err);
      const error = err as { message: string };
      setError('Google sign-in failed: ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // FAQ data
  const faqItems = [
    {
      question: "What happens during the consultation?",
      answer: "During our 30-minute consultation, we'll discuss your spending habits, current credit cards, and financial goals. We'll analyze your spending patterns to identify opportunities for maximizing rewards. Our goal is to understand your needs so we can recommend the optimal credit card portfolio for your situation."
    },
    {
      question: "How should I prepare for the consultation?",
      answer: "To get the most out of our session, please have the following information ready: a list of your current credit cards, your typical monthly spending in major categories (dining, travel, groceries, etc.), and any specific financial goals you have. The more details you can provide, the more tailored our recommendations will be."
    },
    {
      question: "Is this consultation really free?",
      answer: "Yes, the consultation is completely free with no obligation. Our goal is to help you optimize your credit card rewards and benefits. We may receive compensation if you choose to apply for certain card recommendations through our referral links, but there's never any pressure to do so."
    },
    {
      question: "How do you handle my personal information?",
      answer: "We take your privacy seriously. All information shared during the consultation is kept strictly confidential. We don't store sensitive financial data like card numbers or account details. The information you provide is used solely to generate personalized recommendations. You can review our full privacy policy for more details on how we protect your information."
    },
    {
      question: "What if I need to reschedule?",
      answer: "No problem! You can reschedule directly through the Calendly link. We ask that you give at least 24 hours notice if possible so we can make the slot available to other users."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Success Message Banner */}
      {successMessage && (
        <div className="bg-green-50 text-green-800 p-4 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p>{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="text-green-500 hover:text-green-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Booking Complete Banner */}
      {bookingComplete && (
        <div className="bg-blue-50 text-blue-800 p-4 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Consultation Scheduled!</p>
                <p className="text-sm">Check your email for confirmation details and calendar invite.</p>
              </div>
            </div>
            <button 
              onClick={() => setBookingComplete(false)} 
              className="text-blue-500 hover:text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Information Column */}
          <div className="lg:col-span-7 space-y-10">
            <ScrollReveal>
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Free Credit Card Consultation</h1>
                
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Get Personalized Credit Card Recommendations</h2>
                  <p className="text-gray-600">
                    Book a free 30-minute consultation with our credit card expert to receive tailored 
                    recommendations based on your spending habits and financial goals. We'll help you 
                    optimize your rewards, minimize fees, and maximize the value of every dollar you spend.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <h3 className="font-medium text-blue-700">What you'll get:</h3>
                    <ul className="mt-2 space-y-1 text-blue-600">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Analysis of your current credit card portfolio</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Personalized recommendations to maximize rewards</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Strategic advice on which cards to apply for and when</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Expert guidance on credit score optimization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.1}>
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-3 text-blue-600 mr-4 flex-shrink-0">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">30-Minute Video Call</h3>
                      <p className="mt-1 text-gray-600">
                        We'll meet over Zoom or Google Meet to discuss your financial situation and goals.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-3 text-blue-600 mr-4 flex-shrink-0">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Post-Consultation Follow-Up</h3>
                      <p className="mt-1 text-gray-600">
                        Within 48 hours, you'll receive an email with your personalized credit card strategy and specific recommendations.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-3 text-blue-600 mr-4 flex-shrink-0">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Two Weeks of Support</h3>
                      <p className="mt-1 text-gray-600">
                        You'll have access to email support for two weeks after your consultation to ask any follow-up questions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <button
                        className="flex w-full justify-between items-center focus:outline-none"
                        onClick={() => handleFaqToggle(index)}
                      >
                        <h3 className="text-lg font-medium text-gray-900 text-left">{faq.question}</h3>
                        <svg 
                          className={`h-5 w-5 text-gray-500 transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {openFaq === index && (
                        <div className="mt-2 text-gray-600 prose max-w-none">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
          
          {/* Booking Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {user ? (
                // Calendly embed for logged-in users
                <ScrollReveal>
                  <div className="bg-white p-8 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Book Your Consultation</h2>
                    <p className="text-gray-600 mb-6">
                      Select a date and time that works for you. The consultation is completely free.
                    </p>
                    
                    <div className="rounded-lg overflow-hidden border border-gray-200 aspect-square">
                      {/* Calendly inline widget embed code */}
                      <div 
                        className="calendly-inline-widget" 
                        data-url="https://calendly.com/matthewpieguy" 
                        style={{minWidth: '320px', height: '100%'}}
                      ></div>
                      <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-500">
                      By scheduling a consultation, you agree to our{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-800 underline">Terms of Service</a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>.
                    </p>
                  </div>
                </ScrollReveal>
              ) : (
                // Authentication form for non-logged-in users
                <ScrollReveal>
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {isLoginView ? "Sign in to book a consultation" : "Sign up to book a consultation"}
                      </h2>
                      <p className="text-gray-600">
                        {isLoginView 
                          ? "Please sign in to access our booking calendar." 
                          : "Create an account to schedule your free consultation."}
                      </p>
                    </div>
                    
                    <div className="p-6">
                      {/* Toggle between login and signup */}
                      <div className="flex border-b border-gray-200 mb-6">
                        <button
                          className={`py-2 px-4 text-sm font-medium border-b-2 ${
                            isLoginView 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={() => setIsLoginView(true)}
                        >
                          Sign In
                        </button>
                        <button
                          className={`py-2 px-4 text-sm font-medium border-b-2 ${
                            !isLoginView 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={() => setIsLoginView(false)}
                        >
                          Sign Up
                        </button>
                      </div>
                      
                      {/* Error display */}
                      {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                          {error}
                        </div>
                      )}
                      
                      {/* Login Form */}
                      {isLoginView ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                          </div>
                          
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                              </>
                            ) : 'Sign In'}
                          </button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                          </div>
                          
                          <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
                        </form>
                      ) : (
                        // Sign Up Form
                        <form onSubmit={handleSignup} className="space-y-4">
                          <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                              Full Name
                            </label>
                            <input
                              id="displayName"
                              name="displayName"
                              type="text"
                              required
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Must be at least 8 characters with uppercase, lowercase, numbers and special characters.
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              Confirm Password
                            </label>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                          </div>
                          
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                              </>
                            ) : 'Create Account'}
                          </button>
                          
                          <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                          </div>
                          
                          <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
                        </form>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}