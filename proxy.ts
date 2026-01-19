import { auth } from './lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // 1. Protect private routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/tasks')) {
    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // 2. Redirect authenticated users away from auth pages
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Specify which paths the proxy should run for
export const config = {
  matcher: ['/dashboard/:path*', '/tasks/:path*', '/sign-in', '/sign-up'],
};