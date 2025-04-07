import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './utils/security/rateLimiter';
import { securityHeaders } from './utils/security/headers';
import { SimpleMonitor } from './utils/monitoring/simpleMonitor';

// List of environment variables to expose to the client
const clientEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

export async function middleware(request: NextRequest) {
  const start = performance.now();
  
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      SimpleMonitor.logEvent(
        'rate_limit',
        `Rate limit exceeded for IP: ${ip}`
      );
      
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = NextResponse.next();

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Expose environment variables to the client
    clientEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        response.headers.set(`x-env-${varName}`, value);
      }
    });

    // Track performance
    const duration = performance.now() - start;
    SimpleMonitor.trackPerformance('request', duration);

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    SimpleMonitor.trackError(error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};