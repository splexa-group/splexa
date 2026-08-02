import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/cases",
  "/clients",
  "/calendar",
  "/documents",
  "/settings",
] as const;

const AUTH_ROUTE_PREFIXES = ["/login", "/signup"] as const;

export function middleware(req: NextRequest) {
  // access_token is short-lived (15 min) and only proves the last refresh
  // succeeded, not that the session is still alive — session_active is a
  // non-secret marker cookie set alongside the (narrowly path-scoped)
  // refresh_token and shares its lifetime, so it's what routing decisions
  // should key off. The real access_token expiry is handled transparently
  // by the axios response interceptor on actual API calls.
  const hasSession = req.cookies.has("session_active");
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/clients/:path*",
    "/calendar/:path*",
    "/documents/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/",
  ],
};
