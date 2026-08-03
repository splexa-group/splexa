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
  // session_active is what routing decisions should key off — it's a
  // non-secret marker cookie set alongside the (narrowly path-scoped)
  // refresh_token and shares its lifetime, unlike the short-lived (15 min)
  // access_token, whose expiry is handled transparently by the axios
  // response interceptor on actual API calls, not by this gate.
  //
  // access_token is also accepted here as a migration bridge: a session
  // that predates session_active existing has access_token but not yet
  // session_active, and would otherwise be forced to re-login on its very
  // next navigation, before ever getting the chance to hit a 401 that
  // triggers /auth/refresh (which now also (re-)sets session_active). This
  // self-heals within at most one access_token lifetime.
  const hasSession = req.cookies.has("session_active") || req.cookies.has("access_token");
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
