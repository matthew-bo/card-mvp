import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './utils/security/rateLimiter';
import { securityHeaders } from './utils/security/headers';
import { SimpleMonitor } from './utils/monitoring/simpleMonitor';

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