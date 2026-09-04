"use client";

import { useState, useEffect } from "react";
import { Bookmark, Copy, Check, Shuffle, Quotes as Quote } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { Affirmation, DAILY_AFFIRMATIONS, getTodayAffirmation } from "@/lib/affirmations";

export default function DailyAffirmationCard() {
  const [affirmation, setAffirmation] = useState<Affirmation>(getTodayAffirmation());
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const today = getTodayAffirmation();
    setAffirmation(today);
    const initialIndex = DAILY_AFFIRMATIONS.findIndex((a) => a.id === today.id);
    setIndex(initialIndex >= 0 ? initialIndex : 0);

    // Check if bookmarked in localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("anchor_bookmarked_quotes") || "[]");
      setBookmarked(saved.includes(today.id));
    } catch (e) {
      console.warn("Failed to load bookmarked quote status:", e);
    }
  }, []);

  const handleShuffle = () => {
    triggerHaptic(8);
    const nextIdx = (index + 1) % DAILY_AFFIRMATIONS.length;
    setIndex(nextIdx);
    const nextAffirmation = DAILY_AFFIRMATIONS[nextIdx];
    setAffirmation(nextAffirmation);

    try {
      const saved = JSON.parse(localStorage.getItem("anchor_bookmarked_quotes") || "[]");
      setBookmarked(saved.includes(nextAffirmation.id));
    } catch (e) {
      console.warn("Failed to update bookmarked quote status on shuffle:", e);
    }
  };

  const handleToggleBookmark = () => {
    triggerHaptic(12);
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("anchor_bookmarked_quotes") || "[]");
      let nextSaved: string[];
      if (saved.includes(affirmation.id)) {
        nextSaved = saved.filter((id) => id !== affirmation.id);
        setBookmarked(false);
      } else {
        nextSaved = [...saved, affirmation.id];
        setBookmarked(true);
      }
      localStorage.setItem("anchor_bookmarked_quotes", JSON.stringify(nextSaved));
    } catch (e) {
      console.warn("Failed to toggle quote bookmark:", e);
    }
  };

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    triggerHaptic(10);
    navigator.clipboard.writeText(`"${affirmation.quote}" — ${affirmation.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm space-y-3.5 relative overflow-hidden">
      {/* Background Decorative Quote Mark */}
      <div className="absolute right-4 top-2 text-[#EAE3D7]/40 dark:text-[#38332E]/30 pointer-events-none select-none">
        <Quote className="w-16 h-16" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: affirmation.themeColor }}
          />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#786F66] dark:text-[#A8A096]">
            Daily Quote • {affirmation.category}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShuffle}
            title="Next reflection"
            className="p-1.5 rounded-full text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18] transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleBookmark}
            title={bookmarked ? "Bookmarked" : "Bookmark quote"}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              bookmarked
                ? "text-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F]"
                : "text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" weight={bookmarked ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy quote"
            className="p-1.5 rounded-full text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#658B70]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quote Content with Animated Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={affirmation.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="space-y-1.5 relative z-10"
        >
          <p className="font-serif italic text-sm sm:text-base text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
            "{affirmation.quote}"
          </p>
          <span className="text-xs text-[#786F66] dark:text-[#A8A096] font-medium block">
            — {affirmation.author}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
