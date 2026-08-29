"use client";

import { useState } from "react";
import { X, Printer, Copy, Check, ShieldCheck, HeartHandshake, Sparkles, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { ClinicalSummaryData } from "@/lib/clinical-report";

interface ClinicalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ClinicalSummaryData;
}

export default function ClinicalExportModal({
  isOpen,
  onClose,
  report,
}: ClinicalExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    triggerHaptic(12);
    window.print();
  };

  const handleCopyText = () => {
    triggerHaptic(10);
    const plainText = `
CLINICAL INTAKE & ACCOUNTABILITY SUMMARY — ANCHOR
Generated: ${report.generatedAt}
Patient / Client: ${report.userName}
Time Horizon: ${report.dateRange}

1. PRIMARY VALUES & ANCHOR COMMITMENT
- Anchor Focus: ${report.commitmentName}
- Grounding Why: "${report.commitmentWhy}"

2. OBJECTIVE ADHERENCE TELEMETRY
- Evaluated Check-Ins: ${report.totalDaysEvaluated}
- Anchored Follow-Through Days: ${report.totalAnchoredDays} (${report.followThroughPercentage}%)

3. AFFECTIVE & EMOTIONAL CLIMATE (Russell Circumplex)
- Mean Valence: ${report.affectiveProfile.averageValence} / 5
- Dominant Emotional State: ${report.affectiveProfile.dominantEmotion}
- Emotion Breakdown: ${report.affectiveProfile.emotionBreakdown.map((e) => `${e.emotion} (${e.percentage}%)`).join(", ")}

4. TOP BARRIERS & OBSTACLE TRIGGERS
${report.barrierDistribution.length > 0 ? report.barrierDistribution.map((b) => `- ${b.label}: ${b.count} events (${b.percentage}%)`).join("\n") : "- No significant barriers reported."}

5. CLINICAL OBSERVATIONS & ACT PRINCIPLES
${report.clinicalObservations.map((o) => `• ${o}`).join("\n")}

6. NOTABLE PATIENT REFLECTIONS
${report.pinnedTakeaways.length > 0 ? report.pinnedTakeaways.map((t) => `"${t}"`).join("\n") : "None recorded."}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-3xl w-full max-h-[90vh] bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl shadow-organic-lg clay-card flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:p-0"
        >
          {/* Header Bar */}
          <div className="p-6 border-b border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Clinical & Therapy Summary
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                  Structured psychological intake report for therapists & healthcare providers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Printable Report Document Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 text-[#2C2520] dark:text-[#ECE7E0] print:overflow-visible print:p-0">
            {/* Confidential Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D7] dark:border-[#38332E]">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#658B70] block">
                  Confidential • Behavioral Health Summary
                </span>
                <h1 className="font-serif-title text-2xl mt-0.5 text-[#2C2520] dark:text-[#ECE7E0]">
                  Anchor Intake & Progress Brief
                </h1>
              </div>
              <div className="text-right text-xs text-[#786F66] dark:text-[#A8A096]">
                <div>Patient: <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">{report.userName}</span></div>
                <div>Generated: {report.generatedAt}</div>
              </div>
            </div>

            {/* Section 1: Treatment / Anchor Focus */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C86D51]">
                Primary Values & Habit Dimension
              </span>
              <h3 className="font-serif-title text-lg font-medium">{report.commitmentName}</h3>
              <p className="text-xs font-serif italic text-[#786F66] dark:text-[#A8A096]">
                "{report.commitmentWhy}"
              </p>
            </div>

            {/* Section 2: Adherence & Affective Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Consistency</span>
                <span className="font-serif-title text-2xl text-[#658B70] font-semibold">{report.followThroughPercentage}%</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">{report.totalAnchoredDays} / {report.totalDaysEvaluated} days</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Dominant State</span>
                <span className="font-serif-title text-xl font-medium">{report.affectiveProfile.dominantEmotion}</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Russell 2D Model</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Mean Valence</span>
                <span className="font-serif-title text-2xl font-semibold">+{report.affectiveProfile.averageValence}</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Scale -5 to +5</span>
              </div>

              <div className="p-4 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] block">Mean Arousal</span>
                <span className="font-serif-title text-2xl font-semibold">{report.affectiveProfile.averageArousal} / 5</span>
                <span className="text-[10px] text-[#786F66] block mt-0.5">Somatic Energy</span>
              </div>
            </div>

            {/* Section 3: Emotion Breakdown & Trigger Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Emotion Landscape */}
              <div className="p-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Affective Distribution
                </h4>
                <div className="space-y-2">
                  {report.affectiveProfile.emotionBreakdown.map((em, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{em.emotion}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-[#FAF7F2] dark:bg-[#25221F] overflow-hidden">
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
              <div className="p-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Primary Obstacle Triggers
                </h4>
                {report.barrierDistribution.length === 0 ? (
                  <p className="text-xs text-[#786F66] italic">No significant barriers recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {report.barrierDistribution.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="truncate pr-2">{b.label}</span>
                        <span className="text-[11px] text-[#C86D51] font-semibold">{b.count} events</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Clinical Observations */}
            <div className="p-5 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#658B70] dark:text-[#82A78C] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Clinical & ACT Framework Observations
              </h4>
              <ul className="space-y-1.5 text-xs leading-relaxed text-[#2C2520] dark:text-[#ECE7E0]">
                {report.clinicalObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#658B70] font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 5: Pinned Patient Takeaways */}
            {report.pinnedTakeaways.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-[#786F66]">
                  Key Patient Reflections & Insights
                </h4>
                <div className="space-y-2">
                  {report.pinnedTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-xs font-serif italic"
                    >
                      "{takeaway}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Notes & Sign-off Block */}
            <div className="pt-6 border-t border-[#EAE3D7] dark:border-[#38332E] grid grid-cols-2 gap-8 text-xs text-[#786F66]">
              <div>
                <span className="block font-semibold mb-6">Clinician / Provider Signature:</span>
                <div className="border-b border-[#9E948A] w-48" />
              </div>
              <div className="text-right">
                <span className="block font-semibold mb-6">Date of Consultation:</span>
                <div className="border-b border-[#9E948A] w-36 ml-auto" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
