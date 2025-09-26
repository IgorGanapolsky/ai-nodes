import { NextRequest, NextResponse } from 'next/server';

// Basic auth credentials from environment variables
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || 'admin';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'password';

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  return username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD;
}

function createAuthResponse(): NextResponse {
  const response = new NextResponse('Authentication required', {
    status: 401,
    statusText: 'Unauthorized',
    headers: {
      'WWW-Authenticate': 'Basic realm="DePIN Autopilot", charset="UTF-8"',
      'Content-Type': 'text/plain',
    },
  });

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for certain paths
  const skipAuthPaths = [
    '/api/health',
    '/favicon.ico',
    '/_next',
    '/images',
    '/icons',
    '/manifest.json',
  ];

  // Check if path should skip authentication
  const shouldSkipAuth = skipAuthPaths.some((path) => pathname.startsWith(path));

  if (shouldSkipAuth) {
    return NextResponse.next();
  }

  // Development mode bypass (if NODE_ENV is development and no auth env vars set)
  if (
    process.env.NODE_ENV === 'development' &&
    !process.env.BASIC_AUTH_USERNAME &&
    !process.env.BASIC_AUTH_PASSWORD
  ) {
    console.log('[Middleware] Development mode: Skipping basic auth');
    return NextResponse.next();
  }

  // Check authentication for all other routes
  if (!isAuthenticated(request)) {
    console.log(`[Middleware] Unauthorized access attempt to: ${pathname}`);
    return createAuthResponse();
  }

  // Create response and forward auth headers to API routes
  const response = NextResponse.next();

  // Forward basic auth to API proxy routes
  if (pathname.startsWith('/api/proxy/')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      response.headers.set('x-forwarded-authorization', authHeader.split(' ')[1]);
    }
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  console.log(`[Middleware] Authorized access to: ${pathname}`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
