"use client";

import { useState, useEffect } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, Check, Compass, TrendingUp, ShieldAlert, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { AIInsight, InsightsSynthesis } from "@/lib/insights-service";

interface AIPatternInsightsProps {
  commitmentId?: string;
}

export default function AIPatternInsights({ commitmentId }: AIPatternInsightsProps) {
  const [data, setData] = useState<InsightsSynthesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<Record<string, "helpful" | "unhelpful">>({});

  useEffect(() => {
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
    } catch {}
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

  if (!data || data.insights.length === 0) return null;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-4 sm:p-6 clay-card shadow-organic-md space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#658B70] dark:text-[#82A78C]">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">AI Pattern Synthesis</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {data.isAiGenerated && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] dark:text-[#E2A365] font-semibold border border-[#F2D7CE] dark:border-[#4D332B] flex items-center gap-1 shrink-0">
              <span>✦</span>
              <span>Gemini 3.6</span>
            </span>
          )}
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold border border-[#D9E6DD] dark:border-[#2C4032] shrink-0">
            {data.analyzedDaysCount} Days
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {data.insights.map((insight: AIInsight) => {
          const userReaction = reactions[insight.id];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: insight.accentColor }}
                  />
                  <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                    {insight.title}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096] font-medium">
                  {insight.tag}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                {insight.observation}
              </p>

              <div className="pt-2 border-t border-[#EAE3D7]/60 dark:border-[#38332E]/60 flex items-center justify-between text-[11px] text-[#9E948A]">
                <span className="italic">{insight.evidence}</span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleReaction(insight.id, true)}
                    className={`p-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                      userReaction === "helpful"
                        ? "text-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24]"
                        : "hover:text-[#2C2520]"
                    }`}
                    title="Helpful insight"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {userReaction === "helpful" && <span className="text-[9px] font-semibold">Helpful</span>}
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
