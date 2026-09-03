"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Anchor, CalendarDays, BookOpen, BarChart3, Settings, LogOut, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { performClientLogout } from "@/lib/client-storage";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation({ userEmail, userName }: { userEmail?: string; userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    // Sync privacy blur class on document body
    if (privacyMode) {
      document.body.classList.add("privacy-active");
    } else {
      document.body.classList.remove("privacy-active");
    }
    return () => {
      document.body.classList.remove("privacy-active");
    };
  }, [privacyMode]);

  const togglePrivacyMode = () => {
    triggerHaptic(15);
    setPrivacyMode(!privacyMode);
  };

  const handleLogout = async () => {
    await performClientLogout();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Living Ambient Light Layer */}
      <div className="ambient-glow-layer" />

      {/* Desktop / Tablet Header */}
      <header className="border-b border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2]/85 dark:bg-[#1C1917]/85 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/today" className="flex items-center gap-2.5 sm:gap-3 group">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
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

          <div className="flex items-center gap-2">
            {/* Discreet Privacy Shield Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={togglePrivacyMode}
              title={privacyMode ? "Disable Privacy Blur" : "Enable Discreet Privacy Blur in Public"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                privacyMode
                  ? "bg-[#C86D51] text-white shadow-organic-sm"
                  : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F]"
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>

            {(userName || userEmail) && (
              <span className="text-xs text-[#786F66] dark:text-[#A8A096] hidden md:inline-block truncate max-w-[130px] font-normal pl-1">
                {userName || userEmail}
              </span>
            )}

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleLogout}
              title="Sign out"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
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
