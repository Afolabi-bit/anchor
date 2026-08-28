"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Anchor, CalendarDays, BookOpen, BarChart3, Settings, LogOut, Eye, EyeOff } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation({ userEmail }: { userEmail?: string }) {
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
  }, [privacyMode]);

  const togglePrivacyMode = () => {
    triggerHaptic(15);
    setPrivacyMode(!privacyMode);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Living Ambient Light Layer */}
      <div className="ambient-glow-layer" />

      {/* Desktop / Tablet Header */}
      <header className="border-b border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2]/85 dark:bg-[#1C1917]/85 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200 shadow-xs">
        <div className="max-w-3xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/today" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center transition-transform group-hover:scale-105 duration-200 shadow-organic-sm">
              <Anchor className="w-5 h-5" />
            </div>
            <span className="font-serif-title text-xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
              Anchor
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center gap-1 bg-[#F3EFE7] dark:bg-[#25221F] p-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[#FFFFFF] dark:bg-[#2E2A26] text-[#2C2520] dark:text-[#ECE7E0] font-medium shadow-organic-sm"
                      : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C86D51] dark:text-[#DB8165]" : "opacity-70"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Discreet Privacy Shield Button */}
            <button
              onClick={togglePrivacyMode}
              title={privacyMode ? "Disable Privacy Blur" : "Enable Discreet Privacy Blur in Public"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                privacyMode
                  ? "bg-[#C86D51] text-white shadow-organic-sm"
                  : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F]"
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {userEmail && (
              <span className="text-xs text-[#786F66] dark:text-[#A8A096] hidden md:inline-block truncate max-w-[130px] font-normal pl-1">
                {userEmail}
              </span>
            )}

            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-xl border-t border-[#EAE3D7] dark:border-[#38332E] pb-safe shadow-organic-md">
        <div className="grid grid-cols-4 h-16 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-[#C86D51] dark:text-[#DB8165] font-medium"
                    : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
                <span className="text-[11px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
