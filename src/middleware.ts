import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './utils/security/rateLimiter';
import { securityHeaders } from './utils/security/headers';
import { Monitor } from '@/utils/monitoring/monitor';
import { AlertManager } from '@/utils/monitoring/alerts';
import { PerformanceMetrics } from '@/utils/metrics/performance';

export async function middleware(request: NextRequest) {
  const start = performance.now();
  
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      await Monitor.logEvent({
        type: 'rate_limit',
        level: 'warning',
        message: `Rate limit exceeded for IP: ${ip}`,
        timestamp: new Date()
      });
      
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

    // Track response time
    const duration = performance.now() - start;
    await PerformanceMetrics.recordResponseTime(
      request.nextUrl.pathname,
      duration
    );

    // Check thresholds
    await AlertManager.checkThresholds('responseTime', duration);

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    await Monitor.trackError(error);
    
    // Log the error but don't throw it to prevent breaking the request
    console.error('Middleware error:', error);
    
    // Return a basic response to keep the application running
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};