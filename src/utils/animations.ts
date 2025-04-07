import { Variants } from 'framer-motion';

// Timing constants
export const ANIMATION_DURATIONS = {
  EXTRA_FAST: 0.15,
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  EXTRA_SLOW: 0.8
};

// Easing presets
export const ANIMATION_EASING = {
  // Standard easings
  EASE_OUT: [0.0, 0.0, 0.2, 1], // Material Design standard easing
  EASE_IN: [0.4, 0.0, 1, 1], // Material Design standard easing
  EASE_IN_OUT: [0.4, 0.0, 0.2, 1], // Material Design standard easing
  
  // Special easings
  BOUNCE: [0.175, 0.885, 0.32, 1.275], // Slight bounce
  GENTLE: [0.25, 0.1, 0.25, 1], // Gentle motion
  ANTICIPATE: [0.38, 0.005, 0.215, 1.2], // Anticipate (slight overshoot)
  PRECISE: [0.4, 0.0, 0.0, 1] // Very precise movement
};

// Standard distances (in pixels or percent)
export const ANIMATION_DISTANCES = {
  TINY: 2,
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 20,
  XLARGE: 40
};

// Stagger children delay
export const STAGGER_CHILDREN = {
  FAST: 0.03,
  NORMAL: 0.05,
  SLOW: 0.08
};

/**
 * Fade variants
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: ANIMATION_DURATIONS.NORMAL,
      ease: ANIMATION_EASING.EASE_OUT
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: ANIMATION_DURATIONS.FAST,
      ease: ANIMATION_EASING.EASE_IN
    }
  }
};

/**
 * Slide in variants (from bottom)
 */
export const slideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: ANIMATION_DISTANCES.MEDIUM 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: ANIMATION_DURATIONS.NORMAL,
      ease: ANIMATION_EASING.EASE_OUT
    }
  },
  exit: { 
    opacity: 0, 
    y: ANIMATION_DISTANCES.MEDIUM,
    transition: { 
      duration: ANIMATION_DURATIONS.FAST,
      ease: ANIMATION_EASING.EASE_IN
    }
  }
};

/**
 * Slide in variants (from right)
 */
export const slideIn: Variants = {
  hidden: { 
    opacity: 0, 
    x: ANIMATION_DISTANCES.MEDIUM 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: ANIMATION_DURATIONS.NORMAL,
      ease: ANIMATION_EASING.EASE_OUT
    }
  },
  exit: { 
    opacity: 0, 
    x: ANIMATION_DISTANCES.MEDIUM,
    transition: { 
      duration: ANIMATION_DURATIONS.FAST,
      ease: ANIMATION_EASING.EASE_IN
    }
  }
};

/**
 * Scale variants (grow/shrink)
 */
export const scale: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: ANIMATION_DURATIONS.NORMAL,
      ease: ANIMATION_EASING.EASE_OUT
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: ANIMATION_DURATIONS.FAST,
      ease: ANIMATION_EASING.EASE_IN
    }
  }
};

/**
 * Staggered container variant
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: STAGGER_CHILDREN.NORMAL,
      delayChildren: 0.1,
    }
  }
};

/**
 * Subtle hover effect
 */
export const subtleHover = {
  scale: 1.02,
  y: -3,
  transition: { 
    duration: ANIMATION_DURATIONS.FAST,
    ease: ANIMATION_EASING.GENTLE 
  }
};

/**
 * Button press effect
 */
export const buttonPress = {
  scale: 0.97,
  transition: { 
    duration: ANIMATION_DURATIONS.EXTRA_FAST,
    ease: ANIMATION_EASING.EASE_IN 
  }
};

/**
 * Shimmer effect for skeletons
 */
export const shimmer: Variants = {
  hidden: { 
    x: -100,
    opacity: 0 
  },
  visible: { 
    x: '100%',
    opacity: 0.8,
    transition: { 
      repeat: Infinity,
      duration: 1.5,
      ease: ANIMATION_EASING.EASE_IN_OUT
    }
  }
};

/**
 * Check if user prefers reduced motion
 * Usage: if (prefersReducedMotion()) { use simpler animations }
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate animation duration based on user preferences
 */
export const getAppropriateAnimationDuration = (duration: number): number => {
  if (prefersReducedMotion()) {
    return duration * 0.5; // Reduce animation duration for users who prefer reduced motion
  }
  return duration;
};

/**
 * Creates variants that respect reduced motion preferences
 */
export const createAccessibleVariants = (regularVariants: Variants, reducedMotionVariants?: Variants): Variants => {
  if (typeof window === 'undefined') return regularVariants;
  
  const shouldReduceMotion = prefersReducedMotion();
  
  if (shouldReduceMotion && reducedMotionVariants) {
    return reducedMotionVariants;
  }
  
  if (shouldReduceMotion) {
    // Create simplified variants that only change opacity
    return {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: ANIMATION_DURATIONS.FAST }
      },
      exit: { 
        opacity: 0,
        transition: { duration: ANIMATION_DURATIONS.FAST }
      }
    };
  }
  
  return regularVariants;
};

export default {
  ANIMATION_DURATIONS,
  ANIMATION_EASING,
  ANIMATION_DISTANCES,
  STAGGER_CHILDREN,
  fadeIn,
  slideUp,
  slideIn,
  scale,
  staggerContainer,
  subtleHover,
  buttonPress,
  shimmer,
  prefersReducedMotion,
  getAppropriateAnimationDuration,
  createAccessibleVariants
};