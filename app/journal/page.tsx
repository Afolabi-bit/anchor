"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import PageTransition from "@/app/components/PageTransition";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import CheckInStepper from "@/app/components/CheckInStepper";
import { JournalSkeleton } from "@/app/components/Skeletons";
import JournalComposer from "@/app/components/JournalComposer";
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
import type { User, Commitment, CheckIn, JournalEntry } from "@/db/schema";

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(null);
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
    async function loadData() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        setActiveCommitment(meData.commitment);

        const [checkInsRes, journalRes] = await Promise.all([
          fetch("/api/checkins"),
          fetch("/api/journal"),
        ]);

        if (checkInsRes.ok) {
          const data = await checkInsRes.json();
          setCheckIns(data.checkIns || []);
        }

        if (journalRes.ok) {
          const jData = await journalRes.json();
          setJournalEntries(jData.entries || []);
        }
      } catch (err) {
        console.error("Journal loading error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

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

  // Group check-ins and journal entries by Date
  interface DayGroup {
    morning?: CheckIn;
    evening?: CheckIn;
    journals: JournalEntry[];
  }

  const groupedByDate: Record<string, DayGroup> = {};
  checkIns.forEach((item) => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = { journals: [] };
    }
    if (item.type === "morning") groupedByDate[item.date].morning = item;
    if (item.type === "evening") groupedByDate[item.date].evening = item;
  });

  journalEntries.forEach((entry) => {
    if (!groupedByDate[entry.date]) {
      groupedByDate[entry.date] = { journals: [] };
    }
    groupedByDate[entry.date].journals.push(entry);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1));

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

  // Filtered & Searched dates
  const filteredDates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortedDates.filter((dateStr) => {
      const entry = groupedByDate[dateStr];
      const evening = entry.evening;
      const morning = entry.morning;

      if (showStarredOnly && !starredDates.includes(dateStr)) {
        return false;
      }

      if (filterStatus !== "all" && evening?.status !== filterStatus) {
        return false;
      }

      if (q) {
        const morningMatches =
          morning?.intentionNote?.toLowerCase().includes(q) ||
          morning?.plannedActions?.some((a: string) => a.toLowerCase().includes(q));
        const eveningMatches =
          evening?.reflection?.toLowerCase().includes(q) ||
          evening?.lessonsLearned?.toLowerCase().includes(q) ||
          evening?.blockerTags?.some((t: string) => t.toLowerCase().includes(q)) ||
          evening?.emotionName?.toLowerCase().includes(q);
        const journalMatches = entry.journals?.some(
          (j: any) =>
            j.content?.toLowerCase().includes(q) ||
            j.title?.toLowerCase().includes(q) ||
            (j.tags && j.tags.some((t: string) => t.toLowerCase().includes(q)))
        );
        return Boolean(morningMatches || eveningMatches || journalMatches || dateStr.includes(q));
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

  const accountStartDate = user?.createdAt
    ? new Date(user.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const missedPastDays = past7Days
    .slice(0, 6)
    .filter((dStr) => !groupedByDate[dStr]?.evening && dStr >= accountStartDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
        <Navigation />
        <JournalSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={user?.firstName ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}` : undefined}
        firstName={user?.firstName}
        lastName={user?.lastName}
      />
      <OfflineSyncBadge />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 pb-36">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Reflective Archive
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5 truncate">
                Personal Journal
              </h1>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] text-[#786F66] dark:text-[#A8A096] font-medium border border-[#EAE3D7] dark:border-[#38332E] shadow-2xs shrink-0">
              {filteredDates.length} {filteredDates.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Prominent Freeform Journal Composer */}
          <JournalComposer onEntryCreated={handleNewJournalEntry} variant="full" />

          {/* Compact 7-Day Timeline Pebble Strip */}
          <div className="p-3.5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-1 text-xs text-[#786F66] dark:text-[#A8A096]">
              <span className="uppercase tracking-wider font-semibold">This Week</span>
              <span className="text-xs">Tap pebble to focus</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {past7Days.map((dStr) => {
                const entry = groupedByDate[dStr];
                const eveningStatus = entry?.evening?.status;
                const hasMorning = Boolean(entry?.morning);
                const isToday = dStr === new Date().toISOString().slice(0, 10);
                const isPreAccount = dStr < accountStartDate;

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
                placeholder="Search reflections, emotions, lessons..."
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
                const entry = groupedByDate[dateStr];
                const morning = entry.morning;
                const evening = entry.evening;
                const isExpanded = Boolean(expandedDates[dateStr]);
                const isStarred = starredDates.includes(dateStr);

                return (
                  <motion.div
                    id={`entry-${dateStr}`}
                    key={dateStr}
                    layout
                    className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs space-y-3 relative overflow-hidden transition-all"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleExpand(dateStr)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif-title text-base text-[#2C2520] dark:text-[#ECE7E0] font-medium">
                          {formatDate(dateStr)}
                        </span>

                        {evening?.emotionName && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold">
                            {evening.emotionName}
                          </span>
                        )}
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
                      <p
                        onClick={() => toggleExpand(dateStr)}
                        className="font-serif italic text-xs text-[#786F66] dark:text-[#A8A096] truncate cursor-pointer"
                      >
                        {entry.journals?.[0]?.content
                          ? `"${entry.journals[0].content}"`
                          : evening?.reflection
                          ? `"${evening.reflection}"`
                          : morning?.intentionNote
                          ? `"${morning.intentionNote}"`
                          : "Tap to view day details"}
                      </p>
                    )}

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-3 border-t border-[#EAE3D7] dark:border-[#38332E] space-y-3.5 text-xs overflow-hidden"
                        >
                          {/* Morning Section */}
                          {morning && (
                            <div className="p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] space-y-2">
                              <span className="text-xs uppercase tracking-wider font-bold text-[#B88452] flex items-center gap-1">
                                <Sun className="w-3.5 h-3.5" />
                                Morning Intention
                              </span>
                              {morning.plannedActions && morning.plannedActions.length > 0 && (
                                <div className="space-y-1 text-[#2C2520] dark:text-[#ECE7E0]">
                                  {morning.plannedActions.map((act: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3 h-3 text-[#658B70]" />
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {morning.intentionNote && (
                                <p className="font-serif italic text-[#786F66] dark:text-[#A8A096]">
                                  "{morning.intentionNote}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Evening Section */}
                          {evening && (
                            <div className="p-3.5 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wider font-bold text-[#C86D51] flex items-center gap-1">
                                  <Moon className="w-3.5 h-3.5" />
                                  Evening Reflection
                                </span>
                                <span className="capitalize px-2 py-0.5 rounded-full bg-[#FFFFFF]/70 dark:bg-[#1E1B18]/70 text-[#C86D51] font-semibold text-xs">
                                  {evening.status === "yes" ? "Followed Through" : evening.status === "partial" ? "Adjusted" : "Learned"}
                                </span>
                              </div>

                              {evening.reflection && (
                                <p className="font-serif italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                                  "{evening.reflection}"
                                </p>
                              )}

                              {evening.lessonsLearned && (
                                <div className="pt-1.5 border-t border-[#C86D51]/20">
                                  <span className="text-xs font-semibold text-[#C86D51] block mb-0.5">Lesson Learned:</span>
                                  <p className="text-[#2C2520] dark:text-[#ECE7E0] italic">{evening.lessonsLearned}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Freeform Journal Reflections Section */}
                          {entry.journals && entry.journals.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="text-xs uppercase tracking-wider font-bold text-[#786F66] dark:text-[#A8A096] flex items-center gap-1">
                                <PenLine className="w-3 h-3 text-[#C86D51]" />
                                Written Reflections ({entry.journals.length})
                              </span>
                              {entry.journals.map((journal: any) => (
                                <div
                                  key={journal.id}
                                  className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#201D1A] border border-[#EAE3D7] dark:border-[#38332E] space-y-2 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                                        {journal.title || "Daily Reflection"}
                                      </span>
                                      {journal.moodValence !== null && journal.moodValence !== undefined && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold">
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
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </PageTransition>

      {/* Backfill Stepper Modal */}
      {stepperOpen && (
        <CheckInStepper
          isOpen={stepperOpen}
          initialStage="evening"
          targetDate={backfillDate || undefined}
          isLate={true}
          commitmentName={activeCommitment?.name || "Daily Anchor"}
          commitmentWhy={activeCommitment?.why || undefined}
          commitmentId={activeCommitment?.id}
          onClose={() => setStepperOpen(false)}
          onSuccess={(saved) => {
            setCheckIns((prev) => [saved, ...prev]);
            setStepperOpen(false);
          }}
        />
      )}
    </div>
  );
}
