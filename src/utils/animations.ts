export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  export const fadeInDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  };
  
  export const fadeInLeft = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };
  
  export const fadeInRight = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };
  
  export const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  export const popIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200
      }
    }
  };
  
  export const slideIn = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Use this for animating in list items one after another
  export const getStaggeredChildren = (staggerAmount = 0.1) => ({
    visible: {
      transition: {
        staggerChildren: staggerAmount
      }
    }
  });
  
  // Animation for cards that expand/collapse
  export const expandCard = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: {
          duration: 0.3
        },
        opacity: {
          duration: 0.25,
          delay: 0.05
        }
      }
    }
  };
  
  // Notification animation
  export const notificationAnimation = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };