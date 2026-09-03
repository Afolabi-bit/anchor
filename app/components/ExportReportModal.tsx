"use client";

import { useState } from "react";
import { X, Printer, Download, FileText, CheckCircle2, Shield } from "lucide-react";
import { triggerHaptic } from "@/lib/sensory";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  commitment?: any;
  recapData?: any;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  userEmail,
  commitment,
  recapData,
}: ExportReportModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    triggerHaptic(12);
    window.print();
  };

  const handleDownloadCsv = () => {
    triggerHaptic(12);
    window.location.href = "/api/export";
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl max-w-lg w-full p-7 sm:p-9 shadow-organic-lg relative max-h-[90vh] overflow-y-auto clay-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                Accountability & Session Report
              </h3>
              <p className="text-xs text-[#786F66] dark:text-[#A8A096]">Export full accountability telemetry or review raw reflection metrics</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(10);
              onClose();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#786F66] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Document Preview Area */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-4 shadow-organic-sm text-xs print:m-0 print:p-0 print:border-none">
          <div className="border-b border-[#EAE3D7] dark:border-[#38332E] pb-3 flex justify-between items-baseline">
            <div>
              <span className="font-serif-title text-base font-semibold text-[#2C2520] dark:text-[#ECE7E0] block">
                Anchor Accountability Record
              </span>
              <span className="text-[11px] text-[#786F66]">Prepared: {todayFormatted}</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EEF4F0] text-[#658B70] font-semibold">
              Confidential
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#786F66] font-semibold block">Commitment</span>
            <p className="font-medium text-[#2C2520] dark:text-[#ECE7E0] text-sm">
              {commitment?.name || "Daily Accountability Goal"}
            </p>
            {commitment?.why && (
              <p className="text-xs text-[#786F66] italic">"{commitment.why}"</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAE3D7] dark:border-[#38332E]">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#25221F] text-center">
              <span className="text-[10px] text-[#786F66] block">Follow-Through</span>
              <span className="font-serif-title text-xl font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                {recapData?.completionRate ?? 85}%
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#25221F] text-center">
              <span className="text-[10px] text-[#786F66] block">Touchpoints</span>
              <span className="font-serif-title text-xl font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                {recapData?.totalCheckIns ?? 14}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#25221F] text-center">
              <span className="text-[10px] text-[#786F66] block">Active Cadence</span>
              <span className="font-serif-title text-xl font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
                {recapData?.streakCurrent ?? 7}d
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex-1 py-3.5 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] hover:bg-[#F3EFE7] text-[#2C2520] dark:text-[#ECE7E0] text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Dataset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
