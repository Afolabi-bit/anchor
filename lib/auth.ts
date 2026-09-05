import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET_STR = process.env.JWT_SECRET || "anchor-secret-recovery-companion-2026-key";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);
export const COOKIE_NAME = "anchor_session";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isOnboarded: boolean;
  morningNotificationTime: string;
  eveningNotificationTime: string;
  timezone: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    isOnboarded: user.isOnboarded,
    morningNotificationTime: user.morningNotificationTime,
    eveningNotificationTime: user.eveningNotificationTime,
    timezone: user.timezone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      firstName: (payload.firstName as string) || null,
      lastName: (payload.lastName as string) || null,
      isOnboarded: Boolean(payload.isOnboarded),
      morningNotificationTime: (payload.morningNotificationTime as string) || "08:00",
      eveningNotificationTime: (payload.eveningNotificationTime as string) || "20:00",
      timezone: (payload.timezone as string) || "UTC",
    };
  } catch (err) {
    return null;
  }
}

export async function getSession(request?: Request): Promise<SessionUser | null> {
  // 1. Check cookies via Next cookie store
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const user = await verifySessionToken(token);
      if (user) return user;
    }
  } catch {
    // cookies() might fail if called outside Server Component/Route Handler request lifecycle
  }

  // 2. Check Authorization header or Cookie header from request if passed
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const user = await verifySessionToken(token);
      if (user) return user;
    }

    const rawCookie = request.headers.get("cookie");
    if (rawCookie) {
      const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
      if (match && match[1]) {
        const user = await verifySessionToken(decodeURIComponent(match[1]));
        if (user) return user;
      }
    }
  }

  return null;
}

export async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  } catch {
    // Ignore if not in mutable context
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });
  } catch {
    // Ignore if not in mutable context
  }
}

export function attachSessionCookie<T>(response: import("next/server").NextResponse<T>, token: string) {
  response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return response;
}

export function attachClearSessionCookie<T>(response: import("next/server").NextResponse<T>) {
  response.cookies.set(COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
