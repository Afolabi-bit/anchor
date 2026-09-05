"use client";

import { useState, useEffect } from "react";
import { Compass, ThumbsUp, ThumbsDown, X, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { LoggedPattern, InsightsSynthesis } from "@/lib/insights-service";
import Link from "next/link";

interface AIPatternInsightsProps {
  commitmentId?: string;
}

const DISMISSED_PATTERNS_STORAGE_KEY = "anchor_dismissed_patterns";

export default function AIPatternInsights({ commitmentId }: AIPatternInsightsProps) {
  const [data, setData] = useState<InsightsSynthesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Record<string, "helpful" | "unhelpful">>({});

  useEffect(() => {
    // Load dismissed patterns from localStorage
    try {
      const saved = localStorage.getItem(DISMISSED_PATTERNS_STORAGE_KEY);
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to read dismissed patterns:", e);
    }

    async function loadInsights() {
      try {
        setLoading(true);
        const url = commitmentId
          ? `/api/insights?commitmentId=${commitmentId}`
          : "/api/insights";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [commitmentId]);

  const handleDismiss = (patternId: string) => {
    triggerHaptic(8);
    const next = [...dismissedIds, patternId];
    setDismissedIds(next);
    try {
      localStorage.setItem(DISMISSED_PATTERNS_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to store dismissed patterns:", e);
    }
  };

  const handleReaction = async (insightId: string, helpful: boolean) => {
    triggerHaptic(10);
    setReactions((prev) => ({
      ...prev,
      [insightId]: helpful ? "helpful" : "unhelpful",
    }));

    try {
      await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, helpful }),
      });
    } catch (e) {
      console.warn("Failed to send insight reaction:", e);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-organic-md animate-pulse space-y-3">
        <div className="h-4 w-36 bg-[#EAE3D7] dark:bg-[#38332E] rounded-full" />
        <div className="h-6 w-56 bg-[#EAE3D7] dark:bg-[#38332E] rounded-full" />
        <div className="h-16 w-full bg-[#FAF7F2] dark:bg-[#1E1B18] rounded-2xl" />
      </div>
    );
  }

  // Filter out any dismissed patterns
  const activeInsights = (data?.insights || []).filter(
    (item) => !dismissedIds.includes(item.id)
  );

  if (!data || activeInsights.length === 0) return null;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-4 sm:p-6 clay-card shadow-organic-md space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#658B70] dark:text-[#82A78C]">
          <Compass className="w-4 h-4 shrink-0" />
          <span className="truncate">Patterns You've Logged</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] font-medium border border-[#EAE3D7] dark:border-[#38332E] shrink-0">
            Statistical Observations
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold border border-[#D9E6DD] dark:border-[#2C4032] shrink-0">
            {data.analyzedDaysCount} Days Evaluated
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {activeInsights.map((insight: LoggedPattern) => {
            const userReaction = reactions[insight.id];
            const isBlocker = insight.category === "blocker";

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-3 shadow-2xs relative group"
              >
                {/* Dismiss Button (top right) */}
                <button
                  type="button"
                  onClick={() => handleDismiss(insight.id)}
                  title="Dismiss this pattern"
                  className="absolute top-3.5 right-3.5 p-1 rounded-lg text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] hover:bg-[#EAE3D7]/60 dark:hover:bg-[#38332E]/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: insight.accentColor }}
                    />
                    <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                      {insight.title}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] font-medium shrink-0">
                    {insight.tag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                  {insight.observation}
                </p>

                <div className="pt-2 border-t border-[#EAE3D7]/60 dark:border-[#38332E]/60 flex items-center justify-between text-xs text-[#9E948A] flex-wrap gap-2">
                  <span className="italic">{insight.evidence}</span>

                  <div className="flex items-center gap-3">
                    {isBlocker && (
                      <Link
                        href="/settings"
                        className="text-xs text-[#C86D51] hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Adjust reminder</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReaction(insight.id, true)}
                        className={`p-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                          userReaction === "helpful"
                            ? "text-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24]"
                            : "hover:text-[#2C2520]"
                        }`}
                        title="Helpful observation"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReaction(insight.id, false)}
                        className={`p-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                          userReaction === "unhelpful"
                            ? "text-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F]"
                            : "hover:text-[#2C2520]"
                        }`}
                        title="Not relevant"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
