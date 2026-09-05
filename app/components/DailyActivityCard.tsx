"use client";

import { useMemo } from "react";
import {
  Sun,
  Moon,
  CheckCircle as CheckCircle2,
  Circle,
  Compass,
  ArrowRight,
} from "@phosphor-icons/react";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

interface DailyActivityCardProps {
  commitments: Commitment[];
  activeCommitmentId: string;
  onSelectCommitment: (id: string) => void;
  todayCheckIns: CheckIn[];
  todayJournals: JournalEntry[];
  onOpenStepper: (stage: "morning" | "evening", commitment: Commitment) => void;
}

export default function DailyActivityCard({
  commitments,
  activeCommitmentId,
  onSelectCommitment,
  todayCheckIns,
  todayJournals,
  onOpenStepper,
}: DailyActivityCardProps) {
  // Only render if user has at least 1 commitment
  if (commitments.length === 0) return null;

  const totalPossible = commitments.length * 2;
  const completedCheckIns = todayCheckIns.length;
  const progressPercent =
    totalPossible > 0 ? Math.round((completedCheckIns / totalPossible) * 100) : 0;

  return (
    <section
      aria-label="Today across all anchors"
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4"
    >
      {/* Header Row: Quiet & Balanced */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] dark:bg-[#2E2A26] border border-[#EAE3D7] dark:border-[#38332E] text-[#B88452] flex items-center justify-center shadow-2xs shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
              Today Across Anchors
            </h2>
            <span className="text-2xs text-[#786F66] dark:text-[#A8A096]">
              {completedCheckIns} of {totalPossible} completed
              {todayJournals.length > 0 && ` • ${todayJournals.length} note${todayJournals.length > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* Minimal Progress Chip */}
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-[#F3EFE7] dark:bg-[#1E1B18] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#658B70] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-2xs font-semibold text-[#786F66] dark:text-[#A8A096]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Clean, Scannable Anchor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {commitments.map((comm) => {
          const isActive = comm.id === activeCommitmentId;
          const colorHex = PALETTE_HEX[comm.colorIndex % PALETTE_HEX.length] || "#C86D51";

          const morning = todayCheckIns.find(
            (c) => c.commitmentId === comm.id && c.type === "morning"
          );
          const evening = todayCheckIns.find(
            (c) => c.commitmentId === comm.id && c.type === "evening"
          );

          return (
            <div
              key={comm.id}
              onClick={() => {
                if (!isActive) {
                  triggerHaptic(8);
                  onSelectCommitment(comm.id);
                }
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                isActive
                  ? "bg-[#FAF7F2] dark:bg-[#201D1A] border-[#C86D51]/40 ring-1 ring-[#C86D51]/20 shadow-2xs"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] hover:bg-[#FAF7F2]/50 hover:border-[#C86D51]/30"
              }`}
            >
              {/* Anchor Identity */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
                <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] truncate">
                  {comm.name}
                </span>
              </div>

              {/* Status Chips: Morning & Evening */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Morning Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(8);
                    onOpenStepper("morning", comm);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs transition-colors cursor-pointer ${
                    morning
                      ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold"
                      : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] border border-dashed border-[#EAE3D7] dark:border-[#38332E]"
                  }`}
                  title={morning ? "Morning intention set" : "Tap to set morning intention"}
                >
                  {morning ? (
                    <CheckCircle2 className="w-3 h-3 text-[#658B70]" />
                  ) : (
                    <Sun className="w-3 h-3 opacity-60" />
                  )}
                  <span>{morning ? "Morning" : "Morning"}</span>
                </button>

                {/* Evening Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(8);
                    onOpenStepper("evening", comm);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs transition-colors cursor-pointer ${
                    evening
                      ? "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] font-semibold"
                      : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] border border-dashed border-[#EAE3D7] dark:border-[#38332E]"
                  }`}
                  title={evening ? "Evening reflection completed" : "Tap to review evening"}
                >
                  {evening ? (
                    <CheckCircle2 className="w-3 h-3 text-[#658B70]" />
                  ) : (
                    <Moon className="w-3 h-3 opacity-60" />
                  )}
                  <span>{evening ? "Evening" : "Evening"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
