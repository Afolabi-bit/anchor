"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, Sparkles, CheckCircle2, Calendar } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

interface MoodTimelineChartProps {
  checkIns: any[];
  journalEntries?: any[];
}

interface DayPoint {
  dateStr: string;
  dayLabel: string;
  valence: number | null; // -5 to +5
  energy: number | null;  // 1 to 5
  status: "yes" | "partial" | "no" | "none";
  emotionName?: string;
}

export default function MoodTimelineChart({
  checkIns = [],
  journalEntries = [],
}: MoodTimelineChartProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [hoveredPoint, setHoveredPoint] = useState<DayPoint | null>(null);

  // Generate timeline data for the chosen window (7, 30, or 90 days)
  const timelineData = useMemo(() => {
    const points: DayPoint[] = [];
    const today = new Date();

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-US", {
        weekday: range <= 7 ? "short" : undefined,
        month: range > 7 ? "short" : undefined,
        day: "numeric",
      });

      // Find evening check-in for this date
      const checkIn = checkIns.find(
        (c) => c.date === dateStr && c.type === "evening"
      );

      // Find journal entry if checkIn lacks mood
      const journal = journalEntries.find((j) => j.date === dateStr);

      const valence =
        typeof checkIn?.moodValence === "number"
          ? checkIn.moodValence
          : typeof journal?.moodValence === "number"
          ? journal.moodValence
          : null;

      const energy =
        typeof checkIn?.moodEnergy === "number"
          ? checkIn.moodEnergy
          : typeof checkIn?.moodArousal === "number"
          ? checkIn.moodArousal
          : typeof journal?.moodEnergy === "number"
          ? journal.moodEnergy
          : null;

      const status: "yes" | "partial" | "no" | "none" =
        checkIn?.status === "yes"
          ? "yes"
          : checkIn?.status === "partial"
          ? "partial"
          : checkIn?.status === "no"
          ? "no"
          : "none";

      points.push({
        dateStr,
        dayLabel,
        valence,
        energy,
        status,
        emotionName: checkIn?.emotionName || undefined,
      });
    }

    return points;
  }, [checkIns, journalEntries, range]);

  // Chart dimensions & scaling
  const chartHeight = 180;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 40;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Coordinate converters
  // Valence: -5 to +5 -> Y coordinate
  const valenceToY = (val: number) => {
    const normalized = (val - -5) / 10; // 0 to 1
    return paddingTop + innerHeight * (1 - normalized);
  };

  // Energy: 1 to 5 -> Y coordinate
  const energyToY = (eng: number) => {
    const normalized = (eng - 1) / 4; // 0 to 1
    return paddingTop + innerHeight * (1 - normalized);
  };

  const pointsCount = timelineData.length;
  const stepX = pointsCount > 1 ? (100 - (paddingX * 2) / 6) / (pointsCount - 1) : 0;

  // Build SVG path strings for lines
  const valencePoints = timelineData
    .map((p, idx) => {
      if (p.valence === null) return null;
      const x = ((idx / (pointsCount - 1)) * 100).toFixed(1);
      const y = valenceToY(p.valence).toFixed(1);
      return { x: Number(x), y: Number(y), point: p };
    })
    .filter(Boolean) as { x: number; y: number; point: DayPoint }[];

  const energyPoints = timelineData
    .map((p, idx) => {
      if (p.energy === null) return null;
      const x = ((idx / (pointsCount - 1)) * 100).toFixed(1);
      const y = energyToY(p.energy).toFixed(1);
      return { x: Number(x), y: Number(y), point: p };
    })
    .filter(Boolean) as { x: number; y: number; point: DayPoint }[];

  const valencePathD =
    valencePoints.length > 1
      ? valencePoints.reduce((acc, curr, idx) => {
          return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x}% ${curr.y}`;
        }, "")
      : "";

  const energyPathD =
    energyPoints.length > 1
      ? energyPoints.reduce((acc, curr, idx) => {
          return `${acc} ${idx === 0 ? "M" : "L"} ${curr.x}% ${curr.y}`;
        }, "")
      : "";

  const hasData = valencePoints.length > 0 || energyPoints.length > 0;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4">
      {/* Header with 7/30/90 Day Switcher */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#658B70]" />
          <div>
            <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
              Mood & Energy Timeline
            </h3>
            <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">
              Correlated with daily check-in follow-through
            </span>
          </div>
        </div>

        {/* 7/30/90 Range Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs self-start xs:self-auto">
          {([7, 30, 90] as const).map((r) => {
            const isActive = range === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setRange(r);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] font-semibold shadow-2xs"
                    : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
                }`}
              >
                {r}d
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#786F66] dark:text-[#A8A096] pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-[#658B70]" />
          <span>Valence (Mood -5 to +5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-[#B88452]" />
          <span>Energy (Somatic 1 to 5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#658B70]" />
          <span>Follow-Through Marks</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-2">
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-44 overflow-visible"
        >
          {/* Neutral Baseline (Valence = 0) */}
          <line
            x1="0%"
            y1={valenceToY(0)}
            x2="100%"
            y2={valenceToY(0)}
            stroke="currentColor"
            strokeDasharray="2 2"
            className="text-[#EAE3D7] dark:text-[#38332E]"
            strokeWidth="0.8"
          />

          {/* Valence Curve (Sage Green) */}
          {valencePathD && (
            <motion.path
              key={`valence-${range}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              d={valencePathD}
              fill="none"
              stroke="#658B70"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Energy Curve (Warm Ochre) */}
          {energyPathD && (
            <motion.path
              key={`energy-${range}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              d={energyPathD}
              fill="none"
              stroke="#B88452"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Interactive Date Points & Follow-Through Markers */}
          {timelineData.map((p, idx) => {
            const xPercent = (idx / (pointsCount - 1)) * 100;
            const hasCheckIn = p.status !== "none";

            return (
              <g key={idx}>
                {/* Check-in Marker at Timeline Bottom */}
                {hasCheckIn && (
                  <circle
                    cx={`${xPercent}%`}
                    cy={chartHeight - 16}
                    r="3.5"
                    fill={
                      p.status === "yes"
                        ? "#658B70"
                        : p.status === "partial"
                        ? "#B88452"
                        : "#786F66"
                    }
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onClick={() => {
                      triggerHaptic(6);
                      setHoveredPoint(p);
                    }}
                  />
                )}

                {/* Valence Point Node */}
                {p.valence !== null && (
                  <circle
                    cx={`${xPercent}%`}
                    cy={valenceToY(p.valence)}
                    r="3"
                    fill="#658B70"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    className="cursor-pointer hover:r-4 transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onClick={() => {
                      triggerHaptic(6);
                      setHoveredPoint(p);
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Date Labels along the bottom */}
        <div className="flex justify-between text-[9px] text-[#9E948A] pt-2 px-1">
          <span>{timelineData[0]?.dayLabel}</span>
          {pointsCount >= 14 && (
            <span>{timelineData[Math.floor(pointsCount / 2)]?.dayLabel}</span>
          )}
          <span>{timelineData[pointsCount - 1]?.dayLabel}</span>
        </div>

        {/* Hover / Tap Details Popover */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                  {hoveredPoint.dateStr}
                </span>
                <button
                  type="button"
                  onClick={() => setHoveredPoint(null)}
                  className="text-[10px] text-[#9E948A] hover:text-[#2C2520]"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-[#786F66] dark:text-[#A8A096] block text-[10px]">Valence:</span>
                  <span className="font-medium text-[#658B70]">
                    {hoveredPoint.valence !== null
                      ? hoveredPoint.valence > 0
                        ? `+${hoveredPoint.valence}`
                        : hoveredPoint.valence
                      : "Not logged"}
                  </span>
                </div>

                <div>
                  <span className="text-[#786F66] dark:text-[#A8A096] block text-[10px]">Energy:</span>
                  <span className="font-medium text-[#B88452]">
                    {hoveredPoint.energy !== null ? `${hoveredPoint.energy} / 5` : "Not logged"}
                  </span>
                </div>

                <div>
                  <span className="text-[#786F66] dark:text-[#A8A096] block text-[10px]">Follow-through:</span>
                  <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0] capitalize">
                    {hoveredPoint.status === "yes"
                      ? "Anchored ✓"
                      : hoveredPoint.status === "partial"
                      ? "Partial ~"
                      : hoveredPoint.status === "no"
                      ? "Paused •"
                      : "None"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasData && (
          <div className="text-center py-6 text-xs text-[#786F66] dark:text-[#A8A096] italic">
            No mood entries recorded yet in this window. Check in tonight or write a journal entry to begin your curve.
          </div>
        )}
      </div>
    </div>
  );
}
