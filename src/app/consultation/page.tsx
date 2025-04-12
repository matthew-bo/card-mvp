'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';

// TypeScript declaration for Calendly
declare global {
  interface Window {
    Calendly?: any;
  }
}

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

  // Ensure Calendly widget loads properly
  useEffect(() => {
    // Function to load the Calendly script if it's not already loaded
    const loadCalendlyScript = () => {
      if (typeof window !== 'undefined' && !window.Calendly) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        script.onload = initializeWidget;
        document.body.appendChild(script);
      } else if (window.Calendly) {
        initializeWidget();
      }
    };

    // Function to initialize the widget
    const initializeWidget = () => {
      // Check if widget is already initialized
      const existingWidget = document.querySelector('.calendly-inline-widget');
      if (existingWidget) {
        return; // Widget already exists, don't initialize again
      }

      // Create the widget container
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'calendly-inline-widget';
      widgetContainer.style.minWidth = '320px';
      widgetContainer.style.height = '630px';
      document.getElementById('calendly-container')?.appendChild(widgetContainer);

      if (window.Calendly) {
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/matthewpieguy/30min',
          parentElement: widgetContainer,
          prefill: {},
          utm: {}
        });
      }
    };

    // Small delay to ensure the DOM element is ready
    setTimeout(loadCalendlyScript, 100);

    return () => {
      // Cleanup: remove the widget when component unmounts
      const widget = document.querySelector('.calendly-inline-widget');
      if (widget) {
        widget.remove();
      }
    };
  }, []);

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

  // Add media query hook
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      {/* Success Message Banner with animation */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 text-green-800 p-4 border-b border-green-200"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Booking Complete Banner with animation */}
      <AnimatePresence>
        {bookingComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 text-blue-800 p-4 border-b border-blue-200"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Information Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-10"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Free Credit Card Consultation
              </h1>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Get Personalized Credit Card Recommendations</h2>
                <p className="text-gray-600 leading-relaxed">
                  Book a free 30-minute consultation with our credit card expert to receive tailored 
                  recommendations based on your spending habits and financial goals. We&apos;ll help you 
                  optimize your rewards, minimize fees, and maximize the value of every dollar you spend.
                </p>
                
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-sm"
                >
                  <h3 className="font-medium text-blue-700">What you&apos;ll get:</h3>
                  <ul className="mt-4 space-y-3 text-blue-600">
                    {[
                      "Analysis of your current credit card portfolio",
                      "Personalized recommendations to maximize rewards",
                      "Strategic advice on which cards to apply for and when",
                      "Expert guidance on credit score optimization"
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start group"
                      >
                        <svg className="h-5 w-5 mr-3 flex-shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="group-hover:text-blue-700 transition-colors">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                What to Expect
              </h2>
              
              <div className="space-y-8">
                {[
                  {
                    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                    title: "30-Minute Video Call",
                    description: "We'll meet over Zoom or Google Meet to discuss your financial situation and goals."
                  },
                  {
                    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                    title: "Post-Consultation Follow-Up",
                    description: "Within 48 hours, you'll receive an email with your personalized credit card strategy and specific recommendations."
                  },
                  {
                    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Two Weeks of Support",
                    description: "You'll have access to email support for two weeks after your consultation to ask any follow-up questions."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex items-start group"
                  >
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-4 text-blue-600 mr-4 flex-shrink-0 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                      <p className="mt-1 text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <button
                      className="flex w-full justify-between items-center focus:outline-none group"
                      onClick={() => handleFaqToggle(index)}
                      aria-expanded={openFaq === index}
                      aria-controls={`faq-${index}`}
                    >
                      <h3 className="text-lg font-medium text-gray-900 text-left group-hover:text-blue-700 transition-colors">
                        {faq.question}
                      </h3>
                      <svg 
                        className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 group-hover:text-blue-600 ${
                          openFaq === index ? 'rotate-180' : ''
                        }`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          id={`faq-${index}`}
                          className="mt-2 text-gray-600 prose max-w-none"
                        >
                          <p>{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          {/* Calendly Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 sticky top-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Schedule Your Consultation
              </h2>
              <div 
                id="calendly-container" 
                className="calendly-container rounded-lg overflow-hidden shadow-inner"
                style={{ 
                  minHeight: isMobile ? '400px' : '630px',
                  width: '100%'
                }}
              ></div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}