// Mock auth service for development purposes
// This is a fallback to use when the real authService is not available

/**
 * Creates a mock user object structure to match Firebase User
 */
function createMockUser({ email, displayName = null, isGoogle = false }) {
  const uid = `mock_${Math.random().toString(36).substring(2, 10)}`;
  const photoURL = isGoogle ? `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=random` : null;
  
  return {
    uid,
    email,
    displayName: displayName || email?.split('@')[0] || 'User',
    emailVerified: isGoogle || Math.random() > 0.5,
    photoURL,
    providerData: [
      {
        providerId: isGoogle ? 'google.com' : 'password',
        uid: isGoogle ? uid : email,
        displayName: displayName || (isGoogle ? email?.split('@')[0] : null),
        email,
        photoURL
      }
    ]
  };
}

/**
 * Signs in a user with email and password
 */
export async function signIn(email, password) {
  console.log('Mock signIn called with:', { email, password: '***' });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Basic validation
  if (!email || !password) {
    throw {
      code: 'auth/invalid-credential',
      message: 'Email and password are required'
    };
  }
  
  if (password.length < 6) {
    throw {
      code: 'auth/wrong-password',
      message: 'Invalid password'
    };
  }
  
  // Mock successful login
  return {
    user: createMockUser({ email })
  };
}

/**
 * Creates a new user account
 */
export async function signUp(email, password, displayName) {
  console.log('Mock signUp called with:', { email, password: '***', displayName });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Basic validation
  if (!email || !password) {
    throw {
      code: 'auth/invalid-credential',
      message: 'Email and password are required'
    };
  }
  
  if (password.length < 6) {
    throw {
      code: 'auth/weak-password',
      message: 'Password should be at least 6 characters'
    };
  }
  
  // Simulate existing email check (random for demo)
  if (email === 'existing@example.com' || Math.random() < 0.1) {
    throw {
      code: 'auth/email-already-in-use',
      message: 'An account with this email already exists'
    };
  }
  
  // Mock successful signup
  return {
    user: createMockUser({ email, displayName })
  };
}

/**
 * Signs in with Google
 */
export async function signInWithGoogle() {
  console.log('Mock signInWithGoogle called');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful Google sign-in
  const mockGoogleUser = {
    email: `user${Math.floor(Math.random() * 10000)}@gmail.com`,
    displayName: `Google User ${Math.floor(Math.random() * 100)}`
  };
  
  return {
    user: createMockUser({ 
      email: mockGoogleUser.email, 
      displayName: mockGoogleUser.displayName,
      isGoogle: true
    })
  };
}

/**
 * Signs out the current user
 */
export async function signOut() {
  console.log('Mock signOut called');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
} 