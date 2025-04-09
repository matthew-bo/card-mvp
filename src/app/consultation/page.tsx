'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';

export default function ConsultationPage() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  // Local state for login/signup form
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          setBookingComplete(true);
          console.log('Calendly booking completed:', e.data);
        }
      }
    };
    
    window.addEventListener('message', handleCalendlyEvent);
    
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, []);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await signIn(email, password);
      setSuccessMessage('Login successful!');
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
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
      await signUp(email, password);
      setSuccessMessage('Account created successfully!');
      router.push('/');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
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
      setSuccessMessage('Google login successful!');
      router.push('/');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to login with Google. Please try again.');
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
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Free Credit Card Consultation</h1>
              
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Get Personalized Credit Card Recommendations</h2>
                <p className="text-gray-600">
                  Book a free 30-minute consultation with our credit card expert to receive tailored 
                  recommendations based on your spending habits and financial goals. We&apos;ll help you 
                  optimize your rewards, minimize fees, and maximize the value of every dollar you spend.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-medium text-blue-700">What you&apos;ll get:</h3>
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
                      We&apos;ll meet over Zoom or Google Meet to discuss your financial situation and goals.
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
                      Within 48 hours, you&apos;ll receive an email with your personalized credit card strategy and specific recommendations.
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
                      You&apos;ll have access to email support for two weeks after your consultation to ask any follow-up questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
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
          </div>
          
          {/* Booking Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Consultation Service Currently Being Updated</h2>
                <p className="text-gray-600 mb-6">
                  We're currently updating our consultation booking system to better serve you. Please check back later or contact us directly.
                </p>
                
                <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <svg className="h-12 w-12 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Coming Soon</h3>
                    <p className="text-gray-500">Our improved booking system will be available shortly.</p>
                  </div>
                </div>
                
                <p className="mt-6 text-sm text-gray-500">
                  For immediate assistance, please email us at 
                  <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800"> support@example.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}