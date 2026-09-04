"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles, Check, Heart, Shield } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

interface HeatmapDay {
  date: string;
  status: "yes" | "partial" | "no" | "empty";
  level: number; // 0, 1, 2, 3
  emotionName?: string | null;
  morningDone: boolean;
  eveningDone: boolean;
  isPreAccount?: boolean;
}

interface CalendarHeatmapProps {
  data: HeatmapDay[];
  totalAnchoredDays: number;
}

export default function CalendarHeatmap({ data, totalAnchoredDays }: CalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  if (!data || data.length === 0) return null;

  // Group data into weeks of 7 days
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  data.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || idx === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (day: HeatmapDay) => {
    if (day.isPreAccount) {
      return "bg-[#F3EFE7]/40 dark:bg-[#25221F]/30 opacity-40 border border-dashed border-[#EAE3D7] dark:border-[#38332E]";
    }
    switch (day.level) {
      case 3:
        return "bg-[#658B70] dark:bg-[#52775D]"; // Followed through (Sage)
      case 2:
        return "bg-[#B88452] dark:bg-[#A07040]"; // Partial (Ochre)
      case 1:
        return "bg-[#82786F] dark:bg-[#685F57]"; // Reflected / Learning
      default:
        return "bg-[#EAE3D7] dark:bg-[#2E2A26]"; // Empty
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
          <Calendar className="w-4 h-4 text-[#B88452] shrink-0" />
          <span className="truncate">90-Day Rhythm Heatmap</span>
        </div>

        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold border border-[#D9E6DD] dark:border-[#2C4032] shrink-0">
          {totalAnchoredDays} Anchored Days
        </span>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="flex gap-1.5 min-w-max items-center">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const isHovered = hoveredDay?.date === day.date;
                return (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.1 }}
                    onMouseEnter={() => {
                      triggerHaptic(5);
                      setHoveredDay(day);
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => {
                      triggerHaptic(10);
                      setHoveredDay(day);
                    }}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md cursor-pointer transition-colors relative ${getCellColor(
                      day
                    )} ${isHovered ? "ring-2 ring-[#C86D51] ring-offset-1 z-10" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Floating / Active Preview Detail */}
      <div className="min-h-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs pt-2 border-t border-[#EAE3D7] dark:border-[#38332E]">
        {hoveredDay ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
              {formatDate(hoveredDay.date)}:
            </span>
            {hoveredDay.isPreAccount ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#9E948A] border border-[#EAE3D7] dark:border-[#38332E]">
                Prior to Joining Anchor
              </span>
            ) : (
              <>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    hoveredDay.status === "yes"
                      ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70]"
                      : hoveredDay.status === "partial"
                      ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]"
                      : hoveredDay.status === "no"
                      ? "bg-[#F0ECE6] dark:bg-[#2B2824] text-[#786F66]"
                      : "bg-[#F3EFE7] dark:bg-[#25221F] text-[#9E948A]"
                  }`}
                >
                  {hoveredDay.status === "yes"
                    ? "Followed Through"
                    : hoveredDay.status === "partial"
                    ? "Partial"
                    : hoveredDay.status === "no"
                    ? "Reflected"
                    : "Resting"}
                </span>
                {hoveredDay.emotionName && (
                  <span className="text-[10px] text-[#786F66] dark:text-[#A8A096] italic">
                    • {hoveredDay.emotionName}
                  </span>
                )}
              </>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-[#9E948A]">
            Hover or tap any date to inspect daily reflection
          </span>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#786F66] dark:text-[#A8A096] self-end sm:self-auto">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-xs bg-[#EAE3D7] dark:bg-[#2E2A26]" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#82786F]" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#B88452]" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#658B70]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
