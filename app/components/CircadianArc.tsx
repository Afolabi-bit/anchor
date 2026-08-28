"use client";

import { Sun, Moon, Sparkles, Clock, Compass } from "lucide-react";

interface CircadianArcProps {
  currentHour?: number;
  morningCompleted?: boolean;
  eveningCompleted?: boolean;
  onOpenMorning: () => void;
  onOpenEvening: () => void;
  onOpenGrounding: () => void;
}

export default function CircadianArc({
  currentHour = new Date().getHours(),
  morningCompleted = false,
  eveningCompleted = false,
  onOpenMorning,
  onOpenEvening,
  onOpenGrounding,
}: CircadianArcProps) {
  const isMorningWindow = currentHour >= 5 && currentHour < 12;
  const isMiddayWindow = currentHour >= 12 && currentHour < 18;
  const isEveningWindow = currentHour >= 18 || currentHour < 5;

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md mb-8">
      {/* Background Soft Arc SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 flex items-center justify-center">
        <svg viewBox="0 0 400 120" className="w-full h-full preserve-3d">
          <path
            d="M 20 100 Q 200 -20 380 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 6"
            className="text-[#C86D51]"
          />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C86D51] animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-[#786F66] dark:text-[#A8A096]">
              24-Hour Rhythm Arc
            </span>
          </div>
          <span className="text-xs text-[#786F66] dark:text-[#A8A096] font-medium">
            {isMorningWindow ? "Morning Intention Window" : isMiddayWindow ? "Midday Grounding Window" : "Evening Reflection Window"}
          </span>
        </div>

        {/* 3 Interactive Circadian Nodes */}
        <div className="grid grid-cols-3 gap-3">
          {/* Node 1: Morning Dawn */}
          <button
            type="button"
            onClick={onOpenMorning}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
              isMorningWindow
                ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${morningCompleted ? "bg-[#658B70] text-white" : "bg-[#FAF2EA] text-[#B88452]"}`}>
                <Sun className="w-4 h-4" />
              </div>
              {morningCompleted ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF4F0] text-[#658B70] font-semibold">Sealed</span>
              ) : isMorningWindow ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86D51] text-white font-semibold animate-pulse">Active</span>
              ) : null}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                Morning Plan
              </span>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                {morningCompleted ? "Intention set" : "Tap to anchor"}
              </span>
            </div>
          </button>

          {/* Node 2: Midday Grounding */}
          <button
            type="button"
            onClick={onOpenGrounding}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
              isMiddayWindow
                ? "border-[#658B70] bg-[#EEF4F0] dark:bg-[#202D24] shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C]">
                <Compass className="w-4 h-4" />
              </div>
              {isMiddayWindow && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#658B70] text-white font-semibold">Active</span>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                Pause & Breathe
              </span>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                4-7-8 box guide
              </span>
            </div>
          </button>

          {/* Node 3: Evening Reflection */}
          <button
            type="button"
            onClick={onOpenEvening}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
              isEveningWindow
                ? "border-[#C86D51] bg-[#F9EBE7] dark:bg-[#38251F] shadow-organic-sm"
                : "border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] hover:bg-[#F3EFE7]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${eveningCompleted ? "bg-[#658B70] text-white" : "bg-[#F9EBE7] text-[#C86D51]"}`}>
                <Moon className="w-4 h-4" />
              </div>
              {eveningCompleted ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF4F0] text-[#658B70] font-semibold">Recorded</span>
              ) : isEveningWindow ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86D51] text-white font-semibold animate-pulse">Open</span>
              ) : null}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                Evening Reflection
              </span>
              <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
                {eveningCompleted ? "Reflection saved" : "Tap to reflect"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
