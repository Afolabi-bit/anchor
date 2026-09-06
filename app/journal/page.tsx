"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CheckInStepper from "@/app/components/CheckInStepper";
import { JournalSkeleton } from "@/app/components/Skeletons";
import JournalComposer from "@/app/components/JournalComposer";
import { useAppContext } from "@/app/context/AppContext";
import {
  Sun,
  Moon,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  MagnifyingGlass as Search,
  X,
  CheckCircle as CheckCircle2,
  HandHeart as HeartHandshake,
  Star,
  Quotes as Quote,
  Trash as Trash2,
  PencilSimple as PenLine,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import type { Commitment, CheckIn, JournalEntry } from "@/db/schema";

const PALETTE_HEX = ["#C86D51", "#B88452", "#658B70", "#786F66", "#D4A373"];

interface DayAnchorGroup {
  commitmentId: string;
  commitment?: Commitment;
  morning?: CheckIn;
  evening?: CheckIn;
}

interface DayGroup {
  date: string;
  anchors: Record<string, DayAnchorGroup>;
  journals: JournalEntry[];
}

export default function JournalPage() {
  const router = useRouter();
  const {
    user,
    commitments,
    activeCommitment,
    activeCommitmentId,
    checkIns,
    journalEntries,
    setJournalEntries,
    isInitialLoading,
    refreshCheckIns,
    refreshJournals,
    updateCheckInLocally,
  } = useAppContext();

  const [filterStatus, setFilterStatus] = useState<"all" | "yes" | "partial" | "no">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Starred reflections state
  const [starredDates, setStarredDates] = useState<string[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Backfill modal state
  const [backfillDate, setBackfillDate] = useState<string | null>(null);
  const [stepperOpen, setStepperOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("anchor_starred_journal_dates") || "[]");
      setStarredDates(saved);
    } catch (e) {
      console.warn("Could not load starred journal dates:", e);
    }
  }, []);

  const toggleStarDate = (dateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(14);
    setStarredDates((prev) => {
      const next = prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr];
      try {
        localStorage.setItem("anchor_starred_journal_dates", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not persist starred journal dates:", e);
      }
      return next;
    });
  };

  useEffect(() => {
    refreshCheckIns(undefined, activeCommitmentId || undefined);
    refreshJournals(activeCommitmentId || undefined);
  }, [activeCommitmentId, refreshCheckIns, refreshJournals]);

  const handleNewJournalEntry = (newEntry: JournalEntry) => {
    setJournalEntries((prev) => [newEntry, ...prev.filter((j) => j.id !== newEntry.id)]);
    setExpandedDates((prev) => ({ ...prev, [newEntry.date]: true }));
  };

  const handleDeleteJournalEntry = async (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to remove this reflection?")) return;
    try {
      triggerHaptic(10);
      const res = await fetch(`/api/journal/${entryId}`, { method: "DELETE" });
      if (res.ok) {
        setJournalEntries((prev) => prev.filter((j) => j.id !== entryId));
      }
    } catch (err) {
      console.error("Delete journal entry error:", err);
    }
  };

  // Group check-ins and journal entries by Date and by Anchor
  // This guarantees entries from multiple anchors on the same date never clobber each other!
  const groupedByDate: Record<string, DayGroup> = useMemo(() => {
    const map: Record<string, DayGroup> = {};

    checkIns.forEach((item) => {
      // Strictly scope check-ins to the active anchor selected on the dashboard
      if (activeCommitmentId && item.commitmentId && item.commitmentId !== activeCommitmentId) {
        return;
      }

      const cId = item.commitmentId || "unassigned";
      if (!map[item.date]) {
        map[item.date] = { date: item.date, anchors: {}, journals: [] };
      }
      if (!map[item.date].anchors[cId]) {
        const comm = commitments.find((c) => c.id === item.commitmentId);
        map[item.date].anchors[cId] = {
          commitmentId: cId,
          commitment: comm,
        };
      }
      if (item.type === "morning") {
        map[item.date].anchors[cId].morning = item;
      }
      if (item.type === "evening") {
        map[item.date].anchors[cId].evening = item;
      }
    });

    journalEntries.forEach((entry) => {
      // Strictly scope reflections to the active anchor selected on the dashboard
      if (
        activeCommitmentId &&
        entry.commitmentId &&
        entry.commitmentId !== activeCommitmentId
      ) {
        return;
      }

      if (!map[entry.date]) {
        map[entry.date] = { date: entry.date, anchors: {}, journals: [] };
      }
      map[entry.date].journals.push(entry);
    });

    return map;
  }, [checkIns, journalEntries, activeCommitmentId, commitments]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1));
  }, [groupedByDate]);

  // Past 7 Days Strip
  const past7Days = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  }, []);

  const accountStartDate = user?.createdAt
    ? new Date(user.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const missedPastDays = useMemo(() => {
    return past7Days.slice(0, 6).filter((dStr) => {
      if (dStr < accountStartDate) return false;
      const day = groupedByDate[dStr];
      if (!day) return true;
      if (activeCommitmentId) {
        return !day.anchors[activeCommitmentId]?.evening;
      }
      return Object.values(day.anchors).every((ag) => !ag.evening);
    });
  }, [past7Days, accountStartDate, groupedByDate, activeCommitmentId]);

  // Filtered & Searched dates
  const filteredDates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortedDates.filter((dateStr) => {
      const day = groupedByDate[dateStr];
      if (!day) return false;

      if (showStarredOnly && !starredDates.includes(dateStr)) {
        return false;
      }

      const anchorGroups = Object.values(day.anchors);

      if (filterStatus !== "all") {
        const matchesStatus = anchorGroups.some((ag) => ag.evening?.status === filterStatus);
        if (!matchesStatus) return false;
      }

      if (q) {
        const checkInMatches = anchorGroups.some((ag) => {
          const m = ag.morning;
          const e = ag.evening;
          const commMatch = ag.commitment?.name.toLowerCase().includes(q);
          const morningMatch =
            m?.intentionNote?.toLowerCase().includes(q) ||
            m?.plannedActions?.some((a: string) => a.toLowerCase().includes(q));
          const eveningMatch =
            e?.reflection?.toLowerCase().includes(q) ||
            e?.lessonsLearned?.toLowerCase().includes(q) ||
            e?.blockerTags?.some((t: string) => t.toLowerCase().includes(q)) ||
            e?.emotionName?.toLowerCase().includes(q);
          return Boolean(commMatch || morningMatch || eveningMatch);
        });

        const journalMatches = day.journals?.some(
          (j: any) =>
            j.content?.toLowerCase().includes(q) ||
            j.title?.toLowerCase().includes(q) ||
            (j.tags && j.tags.some((t: string) => t.toLowerCase().includes(q)))
        );

        return Boolean(checkInMatches || journalMatches || dateStr.includes(q));
      }

      return true;
    });
  }, [sortedDates, groupedByDate, filterStatus, searchQuery, showStarredOnly, starredDates]);

  const toggleExpand = (dateStr: string) => {
    triggerHaptic(10);
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const scrollToDate = (dateStr: string) => {
    triggerHaptic(12);
    setExpandedDates((prev) => ({ ...prev, [dateStr]: true }));
    const el = document.getElementById(`entry-${dateStr}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatWeekday = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);
    } catch {
      return "";
    }
  };

  const formatDayNumber = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      return parts[2];
    } catch {
      return "";
    }
  };

  if (isInitialLoading && !user && checkIns.length === 0) {
    return <JournalSkeleton />;
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 pb-36">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
              Reflective Archive
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5 truncate">
              Personal Journal
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {activeCommitment && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] shadow-2xs">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      PALETTE_HEX[activeCommitment.colorIndex % PALETTE_HEX.length] || "#C86D51",
                  }}
                />
                <span className="text-xs font-medium text-[#2C2520] dark:text-[#ECE7E0] truncate max-w-[160px]">
                  {activeCommitment.name}
                </span>
              </div>
            )}
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] font-medium border border-[#EAE3D7] dark:border-[#38332E] shadow-2xs shrink-0">
              {filteredDates.length} {filteredDates.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>

        {/* Prominent Freeform Journal Composer */}
        <JournalComposer
          onEntryCreated={handleNewJournalEntry}
          variant="full"
          commitmentId={activeCommitmentId}
        />

        {/* Compact 7-Day Timeline Pebble Strip */}
        <div className="p-3.5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-[#786F66] dark:text-[#A8A096]">
            <span className="uppercase tracking-wider font-semibold">
              This Week {activeCommitment ? `• ${activeCommitment.name}` : ""}
            </span>
            <span className="text-xs">Tap pebble to focus</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {past7Days.map((dStr) => {
              const day = groupedByDate[dStr];
              const isToday = dStr === new Date().toISOString().slice(0, 10);
              const isPreAccount = dStr < accountStartDate;

              let eveningStatus: string | undefined;
              let hasMorning = false;

              if (day && activeCommitmentId) {
                const ag = day.anchors[activeCommitmentId];
                eveningStatus = ag?.evening?.status ?? undefined;
                hasMorning = Boolean(ag?.morning);
              } else if (day) {
                const anyAgWithEvening = Object.values(day.anchors).find((a) => a.evening?.status);
                eveningStatus = anyAgWithEvening?.evening?.status ?? undefined;
                hasMorning = Object.values(day.anchors).some((a) => Boolean(a.morning));
              }

              return (
                <button
                  key={dStr}
                  type="button"
                  disabled={isPreAccount}
                  onClick={() => !isPreAccount && scrollToDate(dStr)}
                  className={`flex flex-col items-center gap-1 py-0.5 ${
                    isPreAccount ? "opacity-35 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title={isPreAccount ? "Prior to joining Anchor" : undefined}
                >
                  <span className="text-xs text-[#786F66] dark:text-[#A8A096] font-medium">
                    {formatWeekday(dStr)}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs ${
                      isPreAccount
                        ? "bg-[#F3EFE7]/40 dark:bg-[#25221F]/30 border border-dashed border-[#EAE3D7] dark:border-[#38332E] text-[#A8A096]"
                        : eveningStatus === "yes"
                        ? "bg-[#658B70] text-white font-semibold"
                        : eveningStatus === "partial"
                        ? "bg-[#B88452] text-white font-semibold"
                        : eveningStatus === "no"
                        ? "bg-[#82786F] text-white font-semibold"
                        : hasMorning
                        ? "border-2 border-[#B88452] bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold"
                        : "bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-[#9E948A]"
                    } ${isToday ? "ring-2 ring-[#C86D51]" : ""}`}
                  >
                    <span className="text-xs">{formatDayNumber(dStr)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Soft Landing Backfill Banner (If missed days exist) */}
        {missedPastDays.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] flex items-center justify-between text-xs text-[#B88452] dark:text-[#E2A365] shadow-2xs">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 shrink-0" />
              <span>{missedPastDays.length} unrecorded past days • Soft landing</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBackfillDate(missedPastDays[0]);
                setStepperOpen(true);
              }}
              className="font-semibold underline cursor-pointer"
            >
              Backfill →
            </button>
          </div>
        )}

        {/* Unified Search & Quick Filter Capsule */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E948A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, emotions, lessons, anchors..."
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] text-xs text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C86D51] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E948A] hover:text-[#2C2520]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setFilterStatus("all");
                setShowStarredOnly(false);
              }}
              className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors shrink-0 ${
                filterStatus === "all" && !showStarredOnly
                  ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] font-semibold"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
              }`}
            >
              All Days
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setShowStarredOnly(!showStarredOnly);
              }}
              className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors flex items-center gap-1 shrink-0 ${
                showStarredOnly
                  ? "bg-[#B88452] border-[#B88452] text-white font-semibold"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
              }`}
            >
              <Star className={`w-3 h-3 ${showStarredOnly ? "fill-current" : ""}`} />
              <span>Starred ({starredDates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setFilterStatus("yes");
                setShowStarredOnly(false);
              }}
              className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors shrink-0 ${
                filterStatus === "yes" && !showStarredOnly
                  ? "bg-[#658B70] border-[#658B70] text-white font-semibold"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
              }`}
            >
              Followed Through
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setFilterStatus("partial");
                setShowStarredOnly(false);
              }}
              className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors shrink-0 ${
                filterStatus === "partial" && !showStarredOnly
                  ? "bg-[#B88452] border-[#B88452] text-white font-semibold"
                  : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]"
              }`}
            >
              Adjusted
            </button>
          </div>
        </div>

        {/* Reflections Stream */}
        {filteredDates.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-center space-y-2 clay-card shadow-2xs">
            <Quote className="w-6 h-6 text-[#786F66] mx-auto opacity-70" />
            <h3 className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0]">
              No matching journal reflections found
            </h3>
            <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredDates.map((dateStr) => {
              const day = groupedByDate[dateStr];
              const anchorGroups = Object.values(day.anchors);
              const isExpanded = Boolean(expandedDates[dateStr]);
              const isStarred = starredDates.includes(dateStr);

              // Find unique emotions for this day across anchors
              const emotionNames = Array.from(
                new Set(
                  anchorGroups
                    .map((ag) => ag.evening?.emotionName)
                    .filter(Boolean) as string[]
                )
              );

              return (
                <div
                  id={`entry-${dateStr}`}
                  key={dateStr}
                  className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-3 relative overflow-hidden"
                >
                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(dateStr)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0] font-medium">
                        {formatDate(dateStr)}
                      </span>

                      {emotionNames.map((emo, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold"
                        >
                          {emo}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => toggleStarDate(dateStr, e)}
                        className="p-1.5 text-[#9E948A] hover:text-[#B88452] cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${isStarred ? "fill-[#B88452] text-[#B88452]" : ""}`} />
                      </button>

                      <button
                        type="button"
                        className="p-1.5 text-[#786F66] hover:text-[#2C2520] cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Excerpt preview when collapsed */}
                  {!isExpanded && (
                    <div
                      onClick={() => toggleExpand(dateStr)}
                      className="cursor-pointer space-y-1"
                    >
                      {day.journals?.[0]?.content ? (
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate">
                          "{day.journals[0].content}"
                        </p>
                      ) : anchorGroups[0]?.evening?.reflection ? (
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate">
                          "{anchorGroups[0].evening.reflection}"
                        </p>
                      ) : anchorGroups[0]?.morning?.intentionNote ? (
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate">
                          "{anchorGroups[0].morning.intentionNote}"
                        </p>
                      ) : (
                        <p className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate">
                          Tap to view day details
                        </p>
                      )}

                    </div>
                  )}

                  {/* Expanded Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-[#EAE3D7] dark:border-[#38332E] space-y-4 text-xs overflow-hidden"
                      >
                        {/* Anchors Check-In Blocks */}
                        {anchorGroups.map((ag) => {
                          const commName =
                            ag.commitment?.name ||
                            (ag.commitmentId !== "unassigned" ? "Anchor" : "Daily Check-in");
                          const colorHex =
                            PALETTE_HEX[(ag.commitment?.colorIndex ?? 0) % PALETTE_HEX.length] ||
                            "#C86D51";

                          return (
                            <div
                              key={ag.commitmentId}
                              className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-3"
                            >
                              {/* Anchor Badge Header */}
                              <div className="flex items-center justify-between pb-1.5 border-b border-[#EAE3D7]/60 dark:border-[#38332E]/60">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: colorHex }}
                                  />
                                  <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                                    {commName}
                                  </span>
                                </div>
                                {ag.evening?.status && (
                                  <span className="capitalize px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E] font-medium text-2xs">
                                    {ag.evening.status === "yes"
                                      ? "Followed Through"
                                      : ag.evening.status === "partial"
                                      ? "Adjusted"
                                      : "Learned"}
                                  </span>
                                )}
                              </div>

                              {/* Morning Section */}
                              {ag.morning && (
                                <div className="p-3 rounded-xl bg-[#FAF2EA] dark:bg-[#352A1E] space-y-2">
                                  <span className="text-2xs uppercase tracking-wider font-bold text-[#B88452] flex items-center gap-1">
                                    <Sun className="w-3.5 h-3.5" />
                                    Morning Intention
                                  </span>
                                  {ag.morning.plannedActions && ag.morning.plannedActions.length > 0 && (
                                    <div className="space-y-1 text-[#2C2520] dark:text-[#ECE7E0]">
                                      {ag.morning.plannedActions.map((act: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                          <CheckCircle2 className="w-3 h-3 text-[#658B70]" />
                                          <span>{act}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {ag.morning.intentionNote && (
                                    <p className="font-serif italic text-[#786F66] dark:text-[#A8A096]">
                                      "{ag.morning.intentionNote}"
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Evening Section */}
                              {ag.evening && (
                                <div className="p-3 rounded-xl bg-[#F9EBE7] dark:bg-[#38251F] space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xs uppercase tracking-wider font-bold text-[#C86D51] flex items-center gap-1">
                                      <Moon className="w-3.5 h-3.5" />
                                      Evening Reflection
                                    </span>
                                    {ag.evening.emotionName && (
                                      <span className="text-2xs px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold">
                                        {ag.evening.emotionName}
                                      </span>
                                    )}
                                  </div>

                                  {ag.evening.reflection && (
                                    <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                                      "{ag.evening.reflection}"
                                    </p>
                                  )}

                                  {ag.evening.lessonsLearned && (
                                    <div className="pt-1.5 border-t border-[#C86D51]/20">
                                      <span className="text-2xs font-semibold text-[#C86D51] block mb-0.5">
                                        Lesson Learned:
                                      </span>
                                      <p className="text-[#2C2520] dark:text-[#ECE7E0] italic">
                                        {ag.evening.lessonsLearned}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Freeform Journal Reflections Section */}
                        {day.journals && day.journals.length > 0 && (
                          <div className="space-y-2.5">
                            <span className="text-xs uppercase tracking-wider font-bold text-[#786F66] dark:text-[#A8A096] flex items-center gap-1">
                              <PenLine className="w-3 h-3 text-[#C86D51]" />
                              Written Reflections ({day.journals.length})
                            </span>
                            {day.journals.map((journal: any) => {
                              const journalComm = commitments.find((c) => c.id === journal.commitmentId);
                              const jColor = journalComm
                                ? PALETTE_HEX[journalComm.colorIndex % PALETTE_HEX.length]
                                : undefined;

                              return (
                                <div
                                  key={journal.id}
                                  className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#201D1A] border border-[#EAE3D7] dark:border-[#38332E] space-y-2 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                                        {journal.title || "Daily Reflection"}
                                      </span>
                                      {journalComm && (
                                        <span className="text-2xs px-2 py-0.5 rounded-full bg-[#F3EFE7] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] flex items-center gap-1">
                                          <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: jColor }}
                                          />
                                          {journalComm.name}
                                        </span>
                                      )}
                                      {journal.moodValence !== null && journal.moodValence !== undefined && (
                                        <span className="text-2xs px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold">
                                          Mood {journal.moodValence > 0 ? `+${journal.moodValence}` : journal.moodValence}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteJournalEntry(journal.id, e)}
                                      className="text-[#9E948A] hover:text-[#C86D51] p-1 cursor-pointer"
                                      title="Delete reflection"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <p className="font-serif text-xs text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed whitespace-pre-wrap">
                                    {journal.content}
                                  </p>

                                  {journal.tags && journal.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {journal.tags.map((tg: string) => (
                                        <span
                                          key={tg}
                                          className="text-xs px-2 py-0.5 rounded-md bg-[#F3EFE7] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096]"
                                        >
                                          #{tg}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Backfill Stepper Modal */}
      {stepperOpen && (
        <CheckInStepper
          isOpen={stepperOpen}
          initialStage="evening"
          targetDate={backfillDate || undefined}
          isLate={true}
          commitmentName={activeCommitment?.name || "Daily Anchor"}
          commitmentWhy={activeCommitment?.why || undefined}
          commitmentId={activeCommitmentId || undefined}
          onClose={() => setStepperOpen(false)}
          onSuccess={(saved) => {
            updateCheckInLocally(saved);
            setStepperOpen(false);
          }}
        />
      )}
    </div>
  );
}
