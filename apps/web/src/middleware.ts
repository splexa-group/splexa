import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/cases',
  '/clients',
  '/calendar',
  '/documents',
  '/settings',
] as const;

const AUTH_ROUTE_PREFIXES = ['/login', '/signup'] as const;

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value ?? null;
  const { pathname } = req.nextUrl;

  // const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  // const isAuthRoute = AUTH_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));

  // if (isProtected && !token) {
  //   return NextResponse.redirect(new URL('/login', req.url));
  // }

  // if (isAuthRoute && token) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url));
  // }

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cases/:path*',
    '/clients/:path*',
    '/calendar/:path*',
    '/documents/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
    '/',
  ],
};
