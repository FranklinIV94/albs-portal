import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/admin'];
// Routes that are always accessible
const publicRoutes = ['/admin/login', '/api/auth', '/onboard', '/client', '/book', '/calendar', '/api/calendar'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if accessing protected admin routes
  if (pathname.startsWith('/admin')) {
    // Check for admin_token cookie
    const adminToken = request.cookies.get('admin_token');

    if (!adminToken || !adminToken.value) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token with API
    // For simplicity, we'll trust the cookie exists (production should verify with API)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
