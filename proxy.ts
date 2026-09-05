import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STR = process.env.JWT_SECRET || "anchor-secret-recovery-companion-2026-key";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);
const COOKIE_NAME = "anchor_session";

// Protected application routes (require an authenticated account)
const PROTECTED_ROUTES = ["/today", "/journal", "/progress", "/settings", "/community"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;

  let isValidSession = false;
  let isOnboarded = false;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
      if (payload && payload.id) {
        isValidSession = true;
        isOnboarded = Boolean(payload.isOnboarded);
      }
    } catch {
      isValidSession = false;
    }
  }

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  // 1. Authenticated user visiting /login or /signup → redirect to active destination
  if (isAuthRoute && isValidSession) {
    const destination = isOnboarded ? "/today" : "/onboarding";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Protected app routes (/today, /journal, /progress, /settings, /community) — requires active account
  if (isProtectedRoute) {
    if (!isValidSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 3. Onboarding route — requires active account
  if (isOnboardingRoute) {
    if (!isValidSession) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }
    if (isOnboarded) {
      return NextResponse.redirect(new URL("/today", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today",
    "/today/:path*",
    "/journal",
    "/journal/:path*",
    "/progress",
    "/progress/:path*",
    "/settings",
    "/settings/:path*",
    "/community",
    "/community/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
