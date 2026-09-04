"use client";

import { useState } from "react";
import { X, Anchor, ArrowRight, BookOpen } from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion } from "framer-motion";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";
import CommitmentLibraryModal from "@/app/components/CommitmentLibraryModal";
import { AnchorTemplate } from "@/lib/templates";

const PALETTE = [
  { id: 0, name: "Terracotta", hex: "#C86D51", bg: "bg-[#F9EBE7] dark:bg-[#38251F]" },
  { id: 1, name: "Amber", hex: "#B88452", bg: "bg-[#FAF2EA] dark:bg-[#352A1E]" },
  { id: 2, name: "Sage", hex: "#658B70", bg: "bg-[#EEF4F0] dark:bg-[#202D24]" },
  { id: 3, name: "Slate", hex: "#786F66", bg: "bg-[#F3EFE7] dark:bg-[#25221F]" },
  { id: 4, name: "Ochre", hex: "#D4A373", bg: "bg-[#FAF4EC] dark:bg-[#33271D]" },
];

const PRESETS = [
  { name: "Daily 20m Walk", why: "To clear my mind and breathe fresh air.", colorIndex: 2 },
  { name: "Mindful Wind-down", why: "To protect my rest and sleep peacefully.", colorIndex: 1 },
  { name: "No Compulsive Spending", why: "To rebuild financial peace and mindfulness.", colorIndex: 0 },
  { name: "1 Hour Creative Focus", why: "To make steady progress without stress.", colorIndex: 4 },
];

interface NewCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (commitment: any) => void;
}

export default function NewCommitmentModal({
  isOpen,
  onClose,
  onCreated,
}: NewCommitmentModalProps) {
  const [name, setName] = useState("");
  const [why, setWhy] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a commitment title.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      triggerHaptic(12);

      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          why: why.trim(),
          colorIndex,
          frequency: "daily",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create commitment");
        setSubmitting(false);
        return;
      }

      playSingingBowlChime(528);
      onCreated(data.commitment);
      onClose();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTemplateSelected = (t: AnchorTemplate) => {
    setName(t.name);
    setWhy(t.why);
    setColorIndex(t.suggestedColorIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl max-w-md w-full p-7 sm:p-9 shadow-organic-lg relative clay-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-2xs">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                Add New Anchor
              </h3>
              <p className="text-xs text-[#786F66] dark:text-[#A8A096]">
                Track an additional habit or recovery dimension
              </p>
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

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FAF2EA] border border-[#F2D7CE] text-[#B88452] text-xs">
            {error}
          </div>
        )}

        {/* Browse Template Library Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setLibraryOpen(true);
            }}
            className="w-full p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] hover:border-[#C86D51] text-xs font-semibold text-[#2C2520] dark:text-[#ECE7E0] flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C86D51]" />
              <span>Browse Curated Goal Templates</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold">
              Explore 20+
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5">
              Anchor Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 20-minute daily walk, Mindful wind-down"
              className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51] shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5">
              Your "Why" (Grounding Thought)
            </label>
            <textarea
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Why is this meaningful for your wellbeing?"
              className="w-full px-4 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] text-sm focus:outline-none focus:border-[#C86D51] resize-none shadow-2xs"
            />
          </div>

          {/* Color Tag Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2.5">
              {PALETTE.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setColorIndex(p.id);
                  }}
                  className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    colorIndex === p.id ? "scale-115 ring-2 ring-offset-2 ring-[#2C2520] dark:ring-[#ECE7E0]" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setName(item.name);
                    setWhy(item.why);
                    setColorIndex(item.colorIndex);
                  }}
                  className="text-[11px] px-3 py-1 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-organic-sm hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner />
                  <span>Anchoring...</span>
                </>
              ) : (
                <>
                  <span>Create Anchor Goal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Commitment Template Library Modal */}
      {libraryOpen && (
        <CommitmentLibraryModal
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onSelectTemplate={handleTemplateSelected}
        />
      )}
    </div>
  );
}
