"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import StoryRecapModal from "@/app/components/StoryRecapModal";
import ExportReportModal from "@/app/components/ExportReportModal";
import ClinicalExportModal from "@/app/components/ClinicalExportModal";
import AIPatternInsights from "@/app/components/AIPatternInsights";
import CalendarHeatmap from "@/app/components/CalendarHeatmap";
import MilestoneGallery from "@/app/components/MilestoneGallery";
import PageTransition from "@/app/components/PageTransition";
import { ProgressSkeleton } from "@/app/components/Skeletons";
import { generateClinicalSummary, ClinicalSummaryData } from "@/lib/clinical-report";
import {
  Calendar,
  Sun,
  Moon,
  Tag,
  Lightbulb,
  HeartHandshake,
  Sparkles,
  Printer,
  FileText,
  Compass,
  Play,
  TrendingUp,
  Activity,
  Flame,
  Award,
  Anchor
} from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [commitment, setCommitment] = useState<any>(null);
  const [recapData, setRecapData] = useState<any>(null);

  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [rangeLoading, setRangeLoading] = useState(false);

  // Modal states
  const [storyOpen, setStoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<ClinicalSummaryData | null>(null);

  const handleOpenClinicalReport = async () => {
    try {
      triggerHaptic(12);
      const checkInsRes = await fetch("/api/checkins");
      const checkInsData = checkInsRes.ok ? await checkInsRes.json() : { checkIns: [] };
      const report = generateClinicalSummary(
        user,
        commitment,
        checkInsData.checkIns || []
      );
      setClinicalReport(report);
      setClinicalModalOpen(true);
    } catch (err) {
      console.error("Clinical summary error:", err);
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
      />

      <PageTransition>
        <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-5 py-5 sm:py-8 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#786F66] dark:text-[#A8A096] font-semibold block">
                Insight Sanctuary
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
                onClick={handleOpenClinicalReport}
                className="text-xs px-3 py-1.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold border border-[#D9E6DD] dark:border-[#2C4032] shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Clinical PDF</span>
              </motion.button>
            </div>
          </div>

          {/* Top Metric Summary Trio */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Follow-Through % */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Consistency
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#658B70] block">
                {completionRate}%
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#786F66] dark:text-[#A8A096] block truncate">
                {recapData?.totalDays || 30}d window
              </span>
            </div>

            {/* Cumulative Anchored Days */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Anchored
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#B88452] block">
                {totalAnchored}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#786F66] dark:text-[#A8A096] block truncate">
                Cumulative
              </span>
            </div>

            {/* Current Active Cadence */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-2xs text-center space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block truncate">
                Cadence
              </span>
              <span className="font-serif-title text-xl sm:text-2xl font-semibold text-[#C86D51] block">
                {streakCurrent}d
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#786F66] dark:text-[#A8A096] block truncate">
                Active Streak
              </span>
            </div>
          </div>

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
                <Award className="w-4 h-4 text-[#C86D51]" />
                <h3 className="font-serif-title text-lg text-[#2C2520] dark:text-[#ECE7E0]">
                  Recovery Milestones
                </h3>
              </div>
              <span className="text-[10px] text-[#786F66] dark:text-[#A8A096]">Cumulative days shown up</span>
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

      {/* Clinical Report Export Modal */}
      {exportOpen && (
        <ExportReportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          userEmail={user?.email}
          commitment={commitment}
          recapData={recapData}
        />
      )}

      {/* Clinical & Therapy Intake Report Modal */}
      {clinicalModalOpen && clinicalReport && (
        <ClinicalExportModal
          isOpen={clinicalModalOpen}
          onClose={() => setClinicalModalOpen(false)}
          report={clinicalReport}
        />
      )}
    </div>
  );
}
