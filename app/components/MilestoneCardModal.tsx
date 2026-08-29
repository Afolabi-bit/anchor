"use client";

import { useEffect } from "react";
import { X, Sparkles, Award, Sun, Anchor, Shield, Flame, Crown, Compass, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";
import { Milestone } from "@/lib/milestones-service";

interface MilestoneCardModalProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MilestoneCardModal({ milestone, isOpen, onClose }: MilestoneCardModalProps) {
  useEffect(() => {
    if (isOpen && milestone?.unlocked) {
      playSingingBowlChime(528);
      triggerHaptic([30, 60, 40]);
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#C86D51", "#B88452", "#658B70", "#FAF2EA"],
      });
    }
  }, [isOpen, milestone]);

  if (!isOpen || !milestone) return null;

  const renderIcon = (name: string) => {
    const props = { className: "w-8 h-8", style: { color: milestone.accentColor } };
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#2C2520]/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative max-w-sm w-full bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-7 shadow-organic-lg clay-card text-center space-y-5 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-[#9E948A] hover:text-[#2C2520] rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge Icon Emblem */}
          <div className="w-20 h-20 rounded-full mx-auto bg-[#FFFFFF] dark:bg-[#25221F] border-2 border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-center shadow-organic-md relative">
            <div
              className="absolute inset-0 rounded-full opacity-15 animate-pulse"
              style={{ backgroundColor: milestone.accentColor }}
            />
            {renderIcon(milestone.iconName)}
          </div>

          <div className="space-y-1.5">
            <span
              className="text-xs uppercase tracking-widest font-semibold block"
              style={{ color: milestone.accentColor }}
            >
              {milestone.subtitle}
            </span>
            <h3 className="font-serif-title text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
              {milestone.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed pt-1 font-serif italic">
              "{milestone.description}"
            </p>
          </div>

          <div className="pt-2">
            {milestone.unlocked ? (
              <div className="p-3 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] text-xs font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Milestone Honored & Unlocked</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#786F66] dark:text-[#A8A096]">
                  <span>Progress to unlock</span>
                  <span className="font-semibold">{milestone.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE3D7] dark:bg-[#38332E] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${milestone.progressPercent}%`,
                      backgroundColor: milestone.accentColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] font-medium text-xs shadow-organic-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Keep Grounding
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
