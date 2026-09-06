"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sun,
  Moon,
  PencilSimple as PenLine,
  CheckCircle as CheckCircle2,
} from "@phosphor-icons/react";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";
import { syncClientTimeLogs, ClientActivityLog } from "@/lib/client-time-log";

/**
 * Universal truncated text preview: clamps to 2 lines, tapping expands in-place.
 */
function TruncatedReflection({
  text,
  isQuote = false,
  className = "",
}: {
  text: string;
  isQuote?: boolean;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic(8);
        setIsExpanded(!isExpanded);
      }}
      className="cursor-pointer group/trunc select-none"
      title={isExpanded ? "Tap to collapse" : "Tap to expand"}
    >
      <p className={`${className} ${!isExpanded ? "line-clamp-2" : ""}`}>
        {isQuote ? `“${text}”` : text}
      </p>
      <span className="text-[10px] font-medium text-[#786F66]/60 dark:text-[#A8A096]/60 group-hover/trunc:text-[#C86D51] transition-colors mt-0.5 inline-block">
        {isExpanded ? "Show less" : "Read more"}
      </span>
    </div>
  );
}

interface DailyActivityCardProps {
  commitments: Commitment[];
  todayCheckIns: CheckIn[];
  todayJournals: JournalEntry[];
  activeCommitmentId?: string;
  onSelectCommitment?: (id: string) => void;
  onOpenStepper?: (stage: "morning" | "evening", commitment: Commitment) => void;
}

export default function DailyActivityCard({
  commitments,
  todayCheckIns,
  todayJournals,
  activeCommitmentId,
}: DailyActivityCardProps) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Client-side time logs saved strictly in localStorage
  const [clientLogs, setClientLogs] = useState<ClientActivityLog[]>([]);

  useEffect(() => {
    // Synchronize client-side time logs in localStorage
    const synced = syncClientTimeLogs(todayStr, todayCheckIns, todayJournals, commitments);
    setClientLogs(synced);
  }, [todayStr, todayCheckIns, todayJournals, commitments]);

  // Strictly scope Today's Journey to the selected commitment
  const scopedLogs = useMemo(() => {
    if (!activeCommitmentId) return clientLogs;
    return clientLogs.filter((l) => l.commitmentId === activeCommitmentId);
  }, [clientLogs, activeCommitmentId]);

  const activeCommitment = useMemo(() => {
    return commitments.find((c) => c.id === activeCommitmentId);
  }, [commitments, activeCommitmentId]);

  if (commitments.length === 0) return null;

  return (
    <section
      aria-label="Activities"
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-4"
    >
      {/* Header: Simple Activities title */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif-title text-base font-normal text-[#2C2520] dark:text-[#ECE7E0]">
          Activities
        </h3>
        {scopedLogs.length > 0 && (
          <span className="text-2xs font-mono text-[#786F66] dark:text-[#A8A096]">
            {scopedLogs.length}
          </span>
        )}
      </div>

      {/* Timeline Stream */}
      {scopedLogs.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[#FAF7F2]/60 dark:bg-[#1E1B18]/60 border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-center">
          <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096]">
            No activities logged yet today.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4">
          {/* Vertical timeline line / pipe (centered at 12px with golden amber lead-in) */}
          <div className="absolute left-3 top-2 bottom-4 w-[1.5px] -translate-x-1/2 bg-gradient-to-b from-[#C49B66] via-[#B88452]/70 via-35% to-[#EAE3D7] dark:to-[#38332E]" />

          {scopedLogs.map((log) => {
            return (
              <div key={log.id} className="relative group">
                {/* Timeline node dot (solid white circle centered at 12px directly on the pipe) */}
                <div
                  className="absolute -left-3 top-[22px] w-2 h-2 rounded-full bg-white ring-2 ring-[#2C2520]/20 dark:ring-[#25221F] -translate-x-1/2 -translate-y-1/2 z-10 shadow-xs"
                />

                {/* Entry Card */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs space-y-2 transition-all">
                  {/* Event Header: Anchor, Type, Time */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0] truncate">
                        {log.commitmentName}
                      </span>
                      <span className="text-[#786F66]/35 dark:text-[#A8A096]/35 text-xs leading-none select-none">
                        |
                      </span>
                      <span className="text-2xs text-[#786F66] dark:text-[#A8A096] truncate flex items-center gap-1">
                        {log.type === "morning_checkin" && <Sun className="w-3 h-3 text-[#B88452]" />}
                        {log.type === "evening_checkin" && <Moon className="w-3 h-3 text-[#C86D51]" />}
                        {log.type === "journal_entry" && <PenLine className="w-3 h-3 text-[#658B70]" />}
                        <span>{log.title}</span>
                      </span>
                    </div>

                    <span className="text-2xs text-[#786F66] dark:text-[#A8A096] font-mono shrink-0">
                      {log.timeStr}
                    </span>
                  </div>

                  {/* Morning details */}
                  {log.type === "morning_checkin" && (
                    <div className="space-y-1.5 pt-0.5">
                      {log.plannedActions && log.plannedActions.length > 0 && (
                        <div className="space-y-1">
                          {log.plannedActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[#2C2520] dark:text-[#ECE7E0]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#658B70] shrink-0" />
                              <span className="leading-snug">{action}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {log.detail && (
                        <TruncatedReflection
                          text={log.detail}
                          isQuote
                          className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] leading-relaxed"
                        />
                      )}
                    </div>
                  )}

                  {/* Evening details */}
                  {log.type === "evening_checkin" && (
                    <div className="space-y-1.5 pt-0.5">
                      {(log.status || log.emotion) && (
                        <div className="text-2xs text-[#786F66] dark:text-[#A8A096]">
                          <span>
                            {log.status === "yes"
                              ? "Followed Through"
                              : log.status === "partial"
                              ? "Adjusted"
                              : "Learned"}
                          </span>
                          {log.emotion && (
                            <span className="italic text-[#658B70] dark:text-[#82A78C] ml-1.5">
                              ({log.emotion})
                            </span>
                          )}
                        </div>
                      )}
                      {log.detail && (
                        <TruncatedReflection
                          text={log.detail}
                          isQuote
                          className="font-serif italic text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed"
                        />
                      )}
                      {log.lessonsLearned && (
                        <div className="text-2xs text-[#786F66] dark:text-[#A8A096] pt-0.5">
                          <strong className="text-[#C86D51] font-medium">Lesson: </strong>
                          <TruncatedReflection
                            text={log.lessonsLearned}
                            className="inline italic"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Journal entry details */}
                  {log.type === "journal_entry" && (
                    <div className="space-y-1 pt-0.5">
                      {log.detail && (
                        <TruncatedReflection
                          text={log.detail}
                          className="font-serif text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed whitespace-pre-wrap"
                        />
                      )}
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5 text-2xs text-[#786F66] dark:text-[#A8A096]">
                          {log.tags.map((tg) => (
                            <span key={tg}>#{tg}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
