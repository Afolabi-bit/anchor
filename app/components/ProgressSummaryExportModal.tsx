"use client";

import { useState } from "react";
import { X, Printer, Copy, Check, ShieldCheck, HeartHandshake, FileText, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { ProgressSummaryData, FIXED_PROGRESS_DISCLAIMER } from "@/lib/progress-summary-service";

interface ProgressSummaryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProgressSummaryData;
  includeJournalNotes: boolean;
  onToggleIncludeJournalNotes: (include: boolean) => void;
}

export default function ProgressSummaryExportModal({
  isOpen,
  onClose,
  report,
  includeJournalNotes,
  onToggleIncludeJournalNotes,
}: ProgressSummaryExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    triggerHaptic(12);
    window.print();
  };

  const handleCopyText = () => {
    triggerHaptic(10);
    const plainText = `
PROGRESS & ACCOUNTABILITY SUMMARY — ANCHOR
Generated: ${report.generatedAt}
Member: ${report.userName}
Time Horizon: ${report.dateRange}

DISCLAIMER: ${report.disclaimer}

1. PRIMARY VALUES & ANCHOR COMMITMENT
- Anchor Focus: ${report.commitmentName}
- Grounding Why: "${report.commitmentWhy}"

2. CONSISTENCY & ADHERENCE
- Evaluated Check-Ins: ${report.totalDaysEvaluated}
- Anchored Follow-Through Days: ${report.totalAnchoredDays} (${report.followThroughPercentage}%)

3. EMOTIONAL & AFFECTIVE CLIMATE
- Mean Valence: ${report.affectiveProfile.averageValence} (Scale -5 to +5)
- Mean Energy: ${report.affectiveProfile.averageEnergy} / 5
- Dominant State: ${report.affectiveProfile.dominantEmotion}
- Emotion Breakdown: ${report.affectiveProfile.emotionBreakdown.map((e) => `${e.emotion} (${e.percentage}%)`).join(", ")}

4. TOP OBSTACLES & BLOCKERS
${report.barrierDistribution.length > 0 ? report.barrierDistribution.map((b) => `- ${b.label}: ${b.count} events (${b.percentage}%)`).join("\n") : "- No significant barriers reported."}

5. REFLECTIVE OBSERVATIONS
${report.observations.map((o) => `• ${o}`).join("\n")}

${report.reflections && report.reflections.length > 0 ? `6. INCLUDED WRITTEN REFLECTIONS\n${report.reflections.map((r) => `"${r}"`).join("\n")}` : ""}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2C2520]/60 backdrop-blur-md print:hidden"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          className="relative max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] bg-[#FFFFFF] dark:bg-[#1E1B18] border-t sm:border border-[#EAE3D7] dark:border-[#38332E] rounded-t-3xl sm:rounded-3xl shadow-organic-lg clay-card flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:p-0 print:bg-white print:text-black"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-6 border-b border-[#EAE3D7] dark:border-[#38332E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-lg sm:text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Progress Summary Export
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                  A structured, non-diagnostic reflection summary to share or save as PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#25221F] text-xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#658B70]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Text"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-full bg-[#658B70] hover:bg-[#53735C] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-organic-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#9E948A] hover:text-[#2C2520] rounded-full cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Privacy & Opt-in Controls Bar (Print Hidden) */}
          <div className="p-4 bg-[#FAF7F2] dark:bg-[#25221F] border-b border-[#EAE3D7] dark:border-[#38332E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-[#2C2520] dark:text-[#ECE7E0]">
              <input
                type="checkbox"
                checked={includeJournalNotes}
                onChange={(e) => onToggleIncludeJournalNotes(e.target.checked)}
                className="rounded text-[#C86D51] focus:ring-[#C86D51]"
              />
              <span>Include written reflections in this export</span>
            </label>

            <span className="text-[11px] text-[#786F66] dark:text-[#A8A096]">
              {includeJournalNotes
                ? "Reflections included for this document."
                : "Excluded by default for privacy."}
            </span>
          </div>

          {/* Printable Report Document Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-[#2C2520] dark:text-[#ECE7E0] print:overflow-visible print:p-0 print:text-black">
            {/* Document Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#658B70] block">
                  Self-Reported Behavioral Summary
                </span>
                <h1 className="font-serif-title text-2xl mt-0.5 text-[#2C2520] dark:text-[#ECE7E0] print:text-black">
                  Anchor Progress Brief
                </h1>
              </div>
              <div className="text-right text-xs text-[#786F66] dark:text-[#A8A096] print:text-neutral-600">
                <div>Member: <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0] print:text-black">{report.userName}</span></div>
                <div>Date: {report.generatedAt}</div>
              </div>
            </div>

            {/* MANDATORY FIXED DISCLAIMER — CANNOT BE HIDDEN */}
            <div className="p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#EAE3D7] dark:border-[#38332E] text-xs text-[#786F66] dark:text-[#D5CFC7] print:bg-neutral-100 print:text-neutral-800 print:border-neutral-300 font-medium">
              <p className="font-semibold text-[#B88452] dark:text-[#E2A365] print:text-black text-[11px] uppercase tracking-wide mb-0.5">
                Notice & Purpose
              </p>
              <p>{report.disclaimer}</p>
            </div>

            {/* Section 1: Anchor Focus */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] print:bg-neutral-50 print:border-neutral-300 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C86D51]">
                Tracked Commitment & Core Values
              </span>
              <h3 className="font-serif-title text-lg font-medium print:text-black">{report.commitmentName}</h3>
              <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096] print:text-neutral-700">
                "{report.commitmentWhy}"
              </p>
            </div>

            {/* Section 2: Consistency & Affective Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Consistency</span>
                <span className="font-serif-title text-2xl text-[#658B70] font-semibold">{report.followThroughPercentage}%</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">{report.totalAnchoredDays} / {report.totalDaysEvaluated} days</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Dominant Emotion</span>
                <span className="font-serif-title text-xl font-medium">{report.affectiveProfile.dominantEmotion}</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Self-Reported</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Mean Valence</span>
                <span className="font-serif-title text-2xl font-semibold">{report.affectiveProfile.averageValence > 0 ? `+${report.affectiveProfile.averageValence}` : report.affectiveProfile.averageValence}</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Scale -5 to +5</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Mean Energy</span>
                <span className="font-serif-title text-2xl font-semibold">{report.affectiveProfile.averageEnergy} / 5</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Scale 1 to 5</span>
              </div>
            </div>

            {/* Section 3: Emotion Breakdown & Trigger Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Emotion Landscape */}
              <div className="p-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Emotion Frequency
                </h4>
                <div className="space-y-2">
                  {report.affectiveProfile.emotionBreakdown.map((em, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{em.emotion}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-[#FAF7F2] dark:bg-[#25221F] print:bg-neutral-200 overflow-hidden">
                          <div
                            className="h-full bg-[#658B70] rounded-full"
                            style={{ width: `${em.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#786F66] w-8 text-right">{em.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barrier Distribution */}
              <div className="p-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Logged Obstacle Categories
                </h4>
                {report.barrierDistribution.length === 0 ? (
                  <p className="text-xs text-[#786F66] italic">No obstacle tags recorded during this period.</p>
                ) : (
                  <div className="space-y-2">
                    {report.barrierDistribution.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="truncate pr-2">{b.label}</span>
                        <span className="text-[11px] text-[#C86D51] font-semibold">{b.count} times ({b.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Behavioral Observations */}
            <div className="p-5 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] print:bg-neutral-50 print:border-neutral-300 space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#658B70] dark:text-[#82A78C] print:text-neutral-800">
                Logged Patterns & Summary Observations
              </h4>
              <ul className="space-y-1.5 text-xs leading-relaxed text-[#2C2520] dark:text-[#ECE7E0] print:text-neutral-900">
                {report.observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#658B70] font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 5: Included Reflections (Only if opted in) */}
            {includeJournalNotes && report.reflections && report.reflections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Selected Personal Reflections (Opted In)
                </h4>
                <div className="space-y-2">
                  {report.reflections.map((reflection, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] print:bg-neutral-50 print:border-neutral-300 text-xs font-serif italic"
                    >
                      "{reflection}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Sign-off Block */}
            <div className="pt-6 border-t border-[#EAE3D7] dark:border-[#38332E] print:border-neutral-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#786F66] print:text-neutral-600">
              <span>Anchor • Transparent Self-Reported Accountability</span>
              <span>{report.disclaimer}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
