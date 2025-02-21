type RateLimitEntry = {
    count: number;
    timestamp: number;
  };
  
  const rateLimit = new Map<string, RateLimitEntry>();
  const WINDOW_SIZE = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 100; // per minute
  
  export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimit.get(ip);
  
    if (!entry) {
      rateLimit.set(ip, { count: 1, timestamp: now });
      return true;
    }
  
    if (now - entry.timestamp > WINDOW_SIZE) {
      // Reset if window has passed
      rateLimit.set(ip, { count: 1, timestamp: now });
      return true;
    }
  
    if (entry.count >= MAX_REQUESTS) {
      return false;
    }
  
    // Increment count
    entry.count++;
    return true;
  }