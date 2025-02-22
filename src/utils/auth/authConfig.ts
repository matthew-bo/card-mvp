import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export const auth = getAuth(app);

// Require strong passwords
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validatePassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

// Add rate limiting for failed attempts
const failedAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = (email: string): boolean => {
  const attempts = failedAttempts.get(email);
  if (attempts) {
    if (attempts.count >= MAX_ATTEMPTS) {
      const timeElapsed = Date.now() - attempts.timestamp;
      if (timeElapsed < LOCKOUT_TIME) {
        return false;
      }
      failedAttempts.delete(email);
    }
  }
  return true;
};