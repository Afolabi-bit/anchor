"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  CalendarBlank,
  BookOpen,
  ChartBar,
  UsersThree,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: CalendarBlank },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: ChartBar },
  { href: "/community", label: "Community", icon: UsersThree },
];

/**
 * Derives user initials from first and last name, full name, or email.
 * E.g., "John" + "Doe" -> "JD", "Zerox" -> "Z", "zerox@example.com" -> "Z"
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  userName?: string | null,
  userEmail?: string | null
): string {
  const f = firstName?.trim();
  const l = lastName?.trim();

  if (f && l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }

  if (f) {
    const parts = f.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return f.charAt(0).toUpperCase();
  }

  const u = userName?.trim();
  if (u) {
    const parts = u.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return u.charAt(0).toUpperCase();
  }

  const e = userEmail?.trim();
  if (e) {
    return e.charAt(0).toUpperCase();
  }

  return "A";
}

export default function Navigation({
  userEmail,
  userName,
  firstName,
  lastName,
}: {
  userEmail?: string | null;
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const pathname = usePathname();
  const isSettings = pathname === "/settings";

  useEffect(() => {
    // Sync privacy blur class on document body from localStorage
    try {
      const isPrivacyActive = localStorage.getItem("anchor_privacy_mode") === "true";
      if (isPrivacyActive) {
        document.body.classList.add("privacy-active");
      } else {
        document.body.classList.remove("privacy-active");
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const initials = getInitials(firstName, lastName, userName, userEmail);

  return (
    <>
      {/* Living Ambient Light Layer */}
      <div className="ambient-glow-layer" />

      {/* Desktop / Tablet Header */}
      <header className="border-b border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2]/85 dark:bg-[#1C1917]/85 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/today" className="flex items-center gap-2.5 sm:gap-3 group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center shadow-organic-sm shrink-0"
            >
              <Anchor className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </motion.div>
            <span className="font-serif-title text-lg sm:text-xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
              Anchor
            </span>
          </Link>

          {/* Desktop Nav Links with Magnetic Layout Pill */}
          <nav className="hidden sm:flex items-center gap-1 bg-[#F3EFE7] dark:bg-[#25221F] p-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm relative">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => triggerHaptic(10)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors z-10 ${
                    isActive
                      ? "text-[#2C2520] dark:text-[#ECE7E0]"
                      : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopNavPill"
                      className="absolute inset-0 bg-[#FFFFFF] dark:bg-[#2E2A26] rounded-full shadow-organic-sm -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive
                        ? "text-[#C86D51] dark:text-[#DB8165] scale-105"
                        : "opacity-70"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Persistent User Profile Avatar -> Links to Settings */}
          <Link
            href="/settings"
            onClick={() => triggerHaptic(10)}
            title="Account & Settings"
            aria-label="Account and Settings"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm tracking-wider transition-all shadow-organic-sm ${
                isSettings
                  ? "bg-[#C86D51] text-white ring-2 ring-[#C86D51]/50 ring-offset-2 ring-offset-[#FAF7F2] dark:ring-offset-[#1C1917]"
                  : "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] border border-[#EAE3D7] dark:border-[#38332E] group-hover:border-[#C86D51]/50"
              }`}
            >
              {initials}
            </motion.div>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar with Fluid Spring Tabs */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-xl border-t border-[#EAE3D7] dark:border-[#38332E] pb-safe shadow-organic-md">
        <div className="grid grid-cols-4 h-16 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => triggerHaptic(12)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-[#C86D51] dark:text-[#DB8165] font-medium"
                    : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                }`}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.14 : 1, y: isActive ? -2 : 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.3]" : "stroke-[1.6]"}`} />
                </motion.div>
                <span className="text-[11px] tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNavIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C86D51] dark:bg-[#DB8165]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
