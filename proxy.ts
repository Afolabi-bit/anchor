import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STR = process.env.JWT_SECRET || "anchor-secret-recovery-companion-2026-key";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);
const COOKIE_NAME = "anchor_session";

// Fully protected routes (require an authenticated account)
const PROTECTED_ROUTES = ["/progress", "/settings"];

// Guest-eligible routes (allow guest mode or authenticated account)
const GUEST_ELIGIBLE_ROUTES = ["/today", "/journal"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
  const isGuest = request.cookies.get("anchor_guest")?.value === "true";

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
  const isGuestEligibleRoute = GUEST_ELIGIBLE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  // 1. Authenticated user visiting /login or /signup -> redirect to active destination
  if (isAuthRoute && isValidSession) {
    const destination = isOnboarded ? "/today" : "/onboarding";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Strict protected routes (/progress, /settings)
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

  // 3. Guest-eligible routes (/today, /journal)
  if (isGuestEligibleRoute) {
    if (!isValidSession && !isGuest) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isValidSession && !isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 4. Onboarding route
  if (isOnboardingRoute) {
    if (isValidSession && isOnboarded) {
      return NextResponse.redirect(new URL("/today", request.url));
    }
  }

  return NextResponse.next();
}

// Support both Next.js proxy and traditional middleware exports
export { proxy as middleware };

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
    "/onboarding",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
