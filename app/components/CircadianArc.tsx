"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Compass, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

interface CircadianArcProps {
  currentHour?: number;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  morningSealed?: boolean;
  eveningSealed?: boolean;
  onOpenMorning?: () => void;
  onOpenEvening?: () => void;
  onOpenGrounding?: () => void;
}

export default function CircadianArc({
  currentHour = new Date().getHours(),
  morningCompleted = false,
  eveningCompleted = false,
  morningSealed,
  eveningSealed,
  onOpenMorning,
  onOpenEvening,
  onOpenGrounding,
}: CircadianArcProps) {
  const isMorningDone =
    morningSealed !== undefined ? morningSealed : morningCompleted;
  const isEveningDone =
    eveningSealed !== undefined ? eveningSealed : eveningCompleted;
  const [timeProgress, setTimeProgress] = useState(0); // 0 to 1 across 24 hours

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setTimeProgress(minutes / 1440);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const isMorningWindow = currentHour >= 5 && currentHour < 12;
  const isMiddayWindow = currentHour >= 12 && currentHour < 18;
  const isEveningWindow = currentHour >= 18 || currentHour < 5;

  // Arc calculation: Parabolic curve over SVG viewBox 0 0 500 130
  // Path: M 30 110 Q 250 -10 470 110
  // Quadratic bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const p0 = { x: 30, y: 110 };
  const p1 = { x: 250, y: 0 };
  const p2 = { x: 470, y: 110 };

  const t = Math.min(Math.max(timeProgress, 0), 1);
  const sunX =
    Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
  const sunY =
    Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md mb-8">
      {/* Header & Window State */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C86D51] dark:bg-[#DB8165] animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-semibold text-[#786F66] dark:text-[#A8A096]">
            24-Hour Rhythm Arc
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFE7] dark:bg-[#2E2A26] border border-[#EAE3D7] dark:border-[#38332E] text-[11px] text-[#786F66] dark:text-[#A8A096] font-medium shadow-2xs">
          <Sparkles className="w-3 h-3 text-[#C86D51] dark:text-[#DB8165]" />
          <span>
            {isMorningWindow
              ? "Morning Intention Window"
              : isMiddayWindow
                ? "Midday Grounding Window"
                : "Evening Reflection Window"}
          </span>
        </div>
      </div>

      {/* Dynamic SVG Arc Trajectory */}
      <div className="relative w-full h-24 mb-4 select-none">
        <svg viewBox="0 0 500 130" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient
              id="arcGlowGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#B88452" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#658B70" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#C86D51" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient
              id="activeTrackGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#B88452" />
              <stop offset="50%" stopColor="#658B70" />
              <stop offset="100%" stopColor="#C86D51" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc Path */}
          <path
            d="M 30 110 Q 250 0 470 110"
            fill="none"
            stroke="var(--border-card)"
            strokeWidth="3"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />

          {/* Glowing Active Arc */}
          <path
            d="M 30 110 Q 250 0 470 110"
            fill="none"
            stroke="url(#arcGlowGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* 3 Hotspot Node Anchors on SVG */}
          {/* Dawn (8 AM ~ t=0.33) */}
          <circle cx="160" cy="45" r="4.5" fill="#B88452" opacity="0.6" />
          {/* Noon (12 PM ~ t=0.5) */}
          <circle cx="250" cy="27" r="4.5" fill="#658B70" opacity="0.6" />
          {/* Dusk (8 PM ~ t=0.83) */}
          <circle cx="395" cy="65" r="4.5" fill="#C86D51" opacity="0.6" />

          {/* Live Sun/Moon Tracker Dot */}
          <g transform={`translate(${sunX}, ${sunY})`}>
            {/* Halo pulse */}
            <circle
              r="14"
              fill={isEveningWindow ? "#C86D51" : "#B88452"}
              opacity="0.2"
              className="animate-ping origin-center"
              style={{ animationDuration: "3s" }}
            />
            {/* Glowing Core */}
            <circle
              r="7"
              fill={isEveningWindow ? "#DB8165" : "#E2A365"}
              stroke="#FFFFFF"
              strokeWidth="2"
              filter="url(#glow)"
            />
          </g>
        </svg>

        {/* Time Anchor Labels */}
        <div className="flex justify-between text-[10px] text-[#9E948A] px-2 -mt-3 font-medium">
          <span>06:00 (Dawn)</span>
          <span>12:00 (Zenith)</span>
          <span>18:00 (Dusk)</span>
          <span>00:00 (Rest)</span>
        </div>
      </div>

      {/* 3 Interactive Circadian Ritual Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Node 1: Morning Dawn */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          type="button"
          onClick={() => {
            triggerHaptic(12);
            onOpenMorning?.();
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-31.25 relative overflow-hidden ${
            isMorningWindow
              ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] shadow-organic-sm"
              : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F]"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className={`p-2 rounded-xl shadow-2xs ${isMorningDone ? "bg-[#658B70] text-white" : "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452]"}`}
            >
              <Sun className="w-4 h-4" />
            </div>
            {isMorningDone ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold">
                <Check className="w-2.5 h-2.5" />
                Sealed
              </span>
            ) : isMorningWindow ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86D51] text-white font-semibold animate-pulse">
                Active
              </span>
            ) : null}
          </div>
          <div>
            <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
              Morning Plan
            </span>
            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
              {isMorningDone ? "Intention set" : "Tap to anchor"}
            </span>
          </div>
        </motion.button>

        {/* Node 2: Midday Grounding */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          type="button"
          onClick={() => {
            triggerHaptic(12);
            onOpenGrounding?.();
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-31.25 relative overflow-hidden ${
            isMiddayWindow
              ? "border-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24] shadow-organic-sm"
              : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F]"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
            {isMiddayWindow && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#658B70] text-white font-semibold animate-pulse">
                Zenith
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
              Midday Pause
            </span>
            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
              Check in with breath
            </span>
          </div>
        </motion.button>

        {/* Node 3: Evening Reflection */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          type="button"
          onClick={() => {
            triggerHaptic(12);
            onOpenEvening?.();
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-31.25 relative overflow-hidden ${
            isEveningWindow
              ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] shadow-organic-sm"
              : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7] dark:hover:bg-[#25221F]"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className={`p-2 rounded-xl shadow-2xs ${isEveningDone ? "bg-[#658B70] text-white" : "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165]"}`}
            >
              <Moon className="w-4 h-4" />
            </div>
            {isEveningDone ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] font-semibold">
                <Check className="w-2.5 h-2.5" />
                Reflected
              </span>
            ) : isEveningWindow ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86D51] text-white font-semibold animate-pulse">
                Active
              </span>
            ) : null}
          </div>
          <div>
            <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
              Evening Review
            </span>
            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
              {isEveningDone ? "Review complete" : "Tap to reflect"}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
