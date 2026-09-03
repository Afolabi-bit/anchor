"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Sparkles, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isGuestMode } from "@/lib/guest-service";

export default function GuestBanner() {
  const [isGuest, setIsGuest] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsGuest(isGuestMode());
  }, []);

  if (!isGuest || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full bg-[#FAF2EA] dark:bg-[#2C221A] border-b border-[#EAE3D7] dark:border-[#38332E] px-4 py-2.5 text-xs text-[#786F66] dark:text-[#D5CFC7]"
      >
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#B88452] shrink-0" />
            <p className="truncate">
              <strong>Guest Mode:</strong> Saved locally on this device. Create an account to back up and sync.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/signup"
              className="px-2.5 py-1 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
            >
              <span>Save & Sync</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] rounded-full cursor-pointer"
              title="Dismiss guest notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
