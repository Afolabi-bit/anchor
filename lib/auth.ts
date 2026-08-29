import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET_STR = process.env.JWT_SECRET || "anchor-secret-recovery-companion-2026-key";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);
const COOKIE_NAME = "anchor_session";

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

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
