"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import StoryRecapModal from "@/app/components/StoryRecapModal";
import ProgressSummaryExportModal from "@/app/components/ProgressSummaryExportModal";
import MoodTimelineChart from "@/app/components/MoodTimelineChart";
import AIPatternInsights from "@/app/components/AIPatternInsights";
import CalendarHeatmap from "@/app/components/CalendarHeatmap";
import MilestoneGallery from "@/app/components/MilestoneGallery";
import PageTransition from "@/app/components/PageTransition";
import { ProgressSkeleton } from "@/app/components/Skeletons";
import { generateProgressSummary, ProgressSummaryData } from "@/lib/progress-summary-service";
import {
  Calendar,
  Lightbulb,
  HandHeart as HeartHandshake,
  FileText,
  Play,
  Trophy,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import type { User, Commitment, CheckIn, JournalEntry } from "@/db/schema";

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [recapData, setRecapData] = useState<any>(null);

  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [allCheckIns, setAllCheckIns] = useState<CheckIn[]>([]);
  const [allJournals, setAllJournals] = useState<JournalEntry[]>([]);

  // Modal states
  const [storyOpen, setStoryOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryReport, setSummaryReport] = useState<ProgressSummaryData | null>(null);
  const [includeJournalInSummary, setIncludeJournalInSummary] = useState(false);

  const handleOpenSummaryReport = async () => {
    try {
      triggerHaptic(12);
      const report = generateProgressSummary(
        user,
        commitment,
        allCheckIns,
        allJournals,
        { includeJournalNotes: includeJournalInSummary }
      );
      setSummaryReport(report);
      setSummaryModalOpen(true);
    } catch (err) {
      console.error("Summary error:", err);
    }
  };

  useEffect(() => {
    async function loadRecap() {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        const comm = meData.commitment || meData.commitments?.[0];
        setCommitment(comm);

        const res = await fetch(`/api/recaps?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setRecapData(data.recap);
        }

        // Fetch check-ins and journal entries for mood timeline and summary
        const [checkInsRes, journalRes] = await Promise.all([
          fetch("/api/checkins"),
          fetch("/api/journal"),
        ]);
        if (checkInsRes.ok) {
          const ciData = await checkInsRes.json();
          setAllCheckIns(ciData.checkIns || []);
        }
        if (journalRes.ok) {
          const jData = await journalRes.json();
          setAllJournals(jData.entries || []);
        }
      } catch (err) {
        console.error("Failed to load recap:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecap();
  }, [router, range]);

  const handleRangeChange = async (newRange: "7" | "30" | "90" | "all") => {
    triggerHaptic(10);
    setRange(newRange);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
        <Navigation />
        <ProgressSkeleton />
      </div>
    );
  }

  const completionRate = recapData?.completionRate ?? 0;
  const streakCurrent = recapData?.streakCurrent ?? 0;
  const totalAnchored = recapData?.daysAnchored ?? Math.round((completionRate / 100) * (recapData?.totalDays || 7));

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#1C1917] flex flex-col pb-24 sm:pb-16 transition-colors duration-200">
      <Navigation
        userEmail={user?.email}
        userName={user?.firstName ? `${user.firstName}${user?.lastName ? ` ${user.lastName}` : ""}` : undefined}
        firstName={user?.firstName}
        lastName={user?.lastName}
      />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 pb-36">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <span className="text-xs sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
                Progress & Insights
              </span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-normal text-[#2C2520] dark:text-[#ECE7E0] mt-0.5">
                Progress & Rhythm
              </h1>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 self-start xs:self-auto flex-wrap">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  triggerHaptic(15);
                  setStoryOpen(true);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] font-semibold border border-[#F2D7CE] dark:border-[#4D332B] shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Story Deck</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleOpenSummaryReport}
                className="text-xs px-3 py-1.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold border border-[#D9E6DD] dark:border-[#2C4032] shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </motion.button>
            </div>
          </div>

          {/* Top Metric Summary Trio */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Follow-Through % */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-xs sm:text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Consistency
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#658B70] block">
                {completionRate}%
              </span>
              <span className="text-xs sm:text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                {recapData?.windowLabel || `${recapData?.totalDays || 1}d on path`}
              </span>
            </div>

            {/* Cumulative Anchored Days */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-xs sm:text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Anchored
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#B88452] block">
                {totalAnchored}
              </span>
              <span className="text-xs sm:text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                {recapData?.accountAgeInDays ? `Day ${recapData.accountAgeInDays} total` : "Cumulative"}
              </span>
            </div>

            {/* Current Active Cadence */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-xs sm:text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Cadence
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#C86D51] block">
                {streakCurrent}d
              </span>
              <span className="text-xs sm:text-xs text-[#786F66] dark:text-[#A8A096] block truncate">
                Active Streak
              </span>
            </div>
          </div>

          {/* 7/30/90-Day Mood & Energy Timeline Chart with Follow-Through Overlays */}
          <MoodTimelineChart checkIns={allCheckIns} journalEntries={allJournals} />

          {/* 90-Day Rhythm Calendar Heatmap Matrix */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B88452]" />
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                  Rhythm Matrix
                </h3>
              </div>

              {/* Range Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs">
                {(
                  [
                    { id: "7", label: "7d" },
                    { id: "30", label: "30d" },
                    { id: "90", label: "90d" },
                    { id: "all", label: "All" },
                  ] as const
                ).map((tab) => {
                  const isActive = range === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleRangeChange(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] font-semibold shadow-2xs"
                          : "text-[#786F66] dark:text-[#A8A096]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <CalendarHeatmap
              data={recapData?.heatmapData || recapData?.heatmapMatrix || []}
              totalAnchoredDays={totalAnchored}
            />
          </div>

          {/* AI Pattern Insights Synthesis */}
          <AIPatternInsights commitmentId={commitment?.id} />

          {/* Non-Punitive Milestone Shelf */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C86D51]" />
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                  Recovery Milestones
                </h3>
              </div>
              <span className="text-xs text-[#786F66] dark:text-[#A8A096]">Cumulative days shown up</span>
            </div>

            <MilestoneGallery totalAnchoredDays={totalAnchored} />
          </div>

          {/* Recent Pinned Takeaways & Wisdom */}
          {recapData?.pinnedLessons && recapData.pinnedLessons.length > 0 && (
            <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-sm space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#B88452]">
                <Lightbulb className="w-4 h-4" />
                <span>Pinned Reflections & Wisdom</span>
              </div>
              <div className="space-y-2">
                {recapData.pinnedLessons.slice(0, 3).map((lesson: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs font-serif italic text-[#2C2520] dark:text-[#ECE7E0]"
                  >
                    "{lesson}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compassionate Mirror Card */}
          <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] flex items-center gap-3 text-xs text-[#658B70] dark:text-[#82A78C] shadow-2xs">
            <HeartHandshake className="w-4 h-4 shrink-0" />
            <span>
              <strong>A Mirror, Not a Scorecard:</strong> Anchor reflects your habits without evaluation or shame. Progress is simply showing up again.
            </span>
          </div>
        </main>
      </PageTransition>

      {/* Story Recap Modal Deck */}
      {storyOpen && (
        <StoryRecapModal
          isOpen={storyOpen}
          onClose={() => setStoryOpen(false)}
          recapData={recapData}
        />
      )}

      {/* Progress Summary Export Modal */}
      {summaryModalOpen && summaryReport && (
        <ProgressSummaryExportModal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
          report={summaryReport}
          includeJournalNotes={includeJournalInSummary}
          onToggleIncludeJournalNotes={(include) => {
            setIncludeJournalInSummary(include);
            const updated = generateProgressSummary(
              user,
              commitment,
              allCheckIns,
              allJournals,
              { includeJournalNotes: include }
            );
            setSummaryReport(updated);
          }}
        />
      )}
    </div>
  );
}
