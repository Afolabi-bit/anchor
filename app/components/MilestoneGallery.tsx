"use client";

import { useState } from "react";
import { Award, Sun, Anchor, Shield, Flame, Crown, Compass, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { Milestone, calculateMilestones } from "@/lib/milestones-service";
import MilestoneCardModal from "@/app/components/MilestoneCardModal";

interface MilestoneGalleryProps {
  totalAnchoredDays: number;
}

export default function MilestoneGallery({ totalAnchoredDays }: MilestoneGalleryProps) {
  const milestones = calculateMilestones(totalAnchoredDays);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const renderIcon = (name: string, unlocked: boolean, color: string) => {
    const props = {
      className: "w-5 h-5",
      style: { color: unlocked ? color : "#9E948A" },
    };
    switch (name) {
      case "Compass": return <Compass {...props} />;
      case "Sun": return <Sun {...props} />;
      case "Anchor": return <Anchor {...props} />;
      case "Shield": return <Shield {...props} />;
      case "Award": return <Award {...props} />;
      case "Flame": return <Flame {...props} />;
      case "Crown": return <Crown {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  const handleCardClick = (m: Milestone) => {
    triggerHaptic(12);
    setSelectedMilestone(m);
    setModalOpen(true);
  };

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] clay-card shadow-organic-md space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#2C2520] dark:text-[#ECE7E0]">
          <Award className="w-4 h-4 text-[#C86D51] shrink-0" />
          <span className="truncate">Progress Milestones</span>
        </div>

        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] dark:text-[#E2A365] font-semibold border border-[#F2D7CE] dark:border-[#4D332B] shrink-0">
          {unlockedCount} of {milestones.length} Unlocked
        </span>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {milestones.map((m) => {
          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleCardClick(m)}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                m.unlocked
                  ? "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] shadow-2xs"
                  : "bg-[#F3EFE7]/40 dark:bg-[#25221F]/30 border-dashed border-[#EAE3D7] dark:border-[#38332E] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    m.unlocked
                      ? "bg-[#FFFFFF] dark:bg-[#25221F] shadow-2xs border border-[#EAE3D7] dark:border-[#38332E]"
                      : "bg-[#EAE3D7]/60 dark:bg-[#2E2A26]"
                  }`}
                >
                  {renderIcon(m.iconName, m.unlocked, m.accentColor)}
                </div>
                {m.unlocked ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-bold">
                    ✓
                  </span>
                ) : (
                  <Lock className="w-3 h-3 text-[#9E948A]" />
                )}
              </div>

              <div>
                <span className="font-semibold text-xs text-[#2C2520] dark:text-[#ECE7E0] block truncate">
                  {m.title}
                </span>
                <span className="text-[10px] text-[#786F66] dark:text-[#A8A096] block truncate">
                  {m.subtitle}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Milestone Modal */}
      {selectedMilestone && (
        <MilestoneCardModal
          milestone={selectedMilestone}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
