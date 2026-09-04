"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Wind, Flame, Check } from "@phosphor-icons/react";
import { triggerHaptic } from "@/lib/sensory";

export interface EmotionState {
  name: string;
  quadrant: "pleasant-high" | "pleasant-low" | "unpleasant-high" | "unpleasant-low";
  valence: number; // -5 to +5
  arousal: number; // 1 to 5
  color: string;
  textColor: string;
  bgLight: string;
  bgDark: string;
}

export const EMOTIONS_CATALOG: EmotionState[] = [
  // Low Energy + Pleasant (Sage Grounding)
  { name: "Peaceful", quadrant: "pleasant-low", valence: 4, arousal: 1, color: "#658B70", textColor: "text-[#658B70]", bgLight: "bg-[#EEF4F0]", bgDark: "dark:bg-[#202D24]" },
  { name: "Grateful", quadrant: "pleasant-low", valence: 5, arousal: 2, color: "#658B70", textColor: "text-[#658B70]", bgLight: "bg-[#EEF4F0]", bgDark: "dark:bg-[#202D24]" },
  { name: "Grounded", quadrant: "pleasant-low", valence: 4, arousal: 2, color: "#658B70", textColor: "text-[#658B70]", bgLight: "bg-[#EEF4F0]", bgDark: "dark:bg-[#202D24]" },
  { name: "Content", quadrant: "pleasant-low", valence: 3, arousal: 1, color: "#658B70", textColor: "text-[#658B70]", bgLight: "bg-[#EEF4F0]", bgDark: "dark:bg-[#202D24]" },
  { name: "Calm", quadrant: "pleasant-low", valence: 3, arousal: 1, color: "#658B70", textColor: "text-[#658B70]", bgLight: "bg-[#EEF4F0]", bgDark: "dark:bg-[#202D24]" },

  // High Energy + Pleasant (Ochre / Sun)
  { name: "Energized", quadrant: "pleasant-high", valence: 4, arousal: 5, color: "#B88452", textColor: "text-[#B88452]", bgLight: "bg-[#FAF2EA]", bgDark: "dark:bg-[#352A1E]" },
  { name: "Joyful", quadrant: "pleasant-high", valence: 5, arousal: 4, color: "#B88452", textColor: "text-[#B88452]", bgLight: "bg-[#FAF2EA]", bgDark: "dark:bg-[#352A1E]" },
  { name: "Motivated", quadrant: "pleasant-high", valence: 4, arousal: 4, color: "#B88452", textColor: "text-[#B88452]", bgLight: "bg-[#FAF2EA]", bgDark: "dark:bg-[#352A1E]" },
  { name: "Inspired", quadrant: "pleasant-high", valence: 4, arousal: 3, color: "#B88452", textColor: "text-[#B88452]", bgLight: "bg-[#FAF2EA]", bgDark: "dark:bg-[#352A1E]" },

  // High Energy + Unpleasant (Terracotta / Urgent)
  { name: "Anxious", quadrant: "unpleasant-high", valence: -4, arousal: 4, color: "#C86D51", textColor: "text-[#C86D51]", bgLight: "bg-[#F9EBE7]", bgDark: "dark:bg-[#38251F]" },
  { name: "Overwhelmed", quadrant: "unpleasant-high", valence: -4, arousal: 5, color: "#C86D51", textColor: "text-[#C86D51]", bgLight: "bg-[#F9EBE7]", bgDark: "dark:bg-[#38251F]" },
  { name: "Restless", quadrant: "unpleasant-high", valence: -3, arousal: 4, color: "#C86D51", textColor: "text-[#C86D51]", bgLight: "bg-[#F9EBE7]", bgDark: "dark:bg-[#38251F]" },
  { name: "Frustrated", quadrant: "unpleasant-high", valence: -3, arousal: 4, color: "#C86D51", textColor: "text-[#C86D51]", bgLight: "bg-[#F9EBE7]", bgDark: "dark:bg-[#38251F]" },

  // Low Energy + Unpleasant (Stone / Heavy)
  { name: "Exhausted", quadrant: "unpleasant-low", valence: -3, arousal: 1, color: "#786F66", textColor: "text-[#786F66]", bgLight: "bg-[#F3EFE7]", bgDark: "dark:bg-[#25221F]" },
  { name: "Heavy", quadrant: "unpleasant-low", valence: -4, arousal: 1, color: "#786F66", textColor: "text-[#786F66]", bgLight: "bg-[#F3EFE7]", bgDark: "dark:bg-[#25221F]" },
  { name: "Down", quadrant: "unpleasant-low", valence: -4, arousal: 2, color: "#786F66", textColor: "text-[#786F66]", bgLight: "bg-[#F3EFE7]", bgDark: "dark:bg-[#25221F]" },
  { name: "Numb", quadrant: "unpleasant-low", valence: -2, arousal: 1, color: "#786F66", textColor: "text-[#786F66]", bgLight: "bg-[#F3EFE7]", bgDark: "dark:bg-[#25221F]" },
];

const QUADRANTS = [
  { id: "pleasant-low", label: "Calm & Grounded", desc: "Low energy · Pleasant", icon: Wind, color: "#658B70", bg: "bg-[#EEF4F0] dark:bg-[#202D24]" },
  { id: "pleasant-high", label: "Energized & Joyful", desc: "High energy · Pleasant", icon: Sun, color: "#B88452", bg: "bg-[#FAF2EA] dark:bg-[#352A1E]" },
  { id: "unpleasant-high", label: "Restless & Anxious", desc: "High energy · Challenging", icon: Flame, color: "#C86D51", bg: "bg-[#F9EBE7] dark:bg-[#38251F]" },
  { id: "unpleasant-low", label: "Heavy & Depleted", desc: "Low energy · Challenging", icon: Moon, color: "#786F66", bg: "bg-[#F3EFE7] dark:bg-[#25221F]" },
];

interface EmotionWheelProps {
  selectedEmotion?: string | null;
  onSelectEmotion: (emotion: EmotionState) => void;
}

export default function EmotionWheel({
  selectedEmotion,
  onSelectEmotion,
}: EmotionWheelProps) {
  const initialSelected = EMOTIONS_CATALOG.find((e) => e.name === selectedEmotion);
  const [activeQuadrant, setActiveQuadrant] = useState<string>(
    initialSelected?.quadrant || "pleasant-low"
  );

  const handleSelect = (emotion: EmotionState) => {
    triggerHaptic(12);
    onSelectEmotion(emotion);
  };

  const currentSelection = EMOTIONS_CATALOG.find((e) => e.name === selectedEmotion);

  return (
    <div className="space-y-4">
      {/* Circumplex Quadrant Tab Bar */}
      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((quad) => {
          const isActive = activeQuadrant === quad.id;
          const Icon = quad.icon;
          return (
            <button
              key={quad.id}
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setActiveQuadrant(quad.id);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                isActive
                  ? `${quad.bg} border-current shadow-organic-sm font-semibold`
                  : "bg-[#FAF7F2] dark:bg-[#1E1B18] border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] dark:text-[#A8A096]"
              }`}
              style={{ color: isActive ? quad.color : undefined }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: isActive ? quad.color : undefined, color: isActive ? "#FFFFFF" : undefined }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs truncate font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  {quad.label}
                </span>
                <span className="block text-[10px] text-[#786F66] dark:text-[#A8A096] truncate">
                  {quad.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Emotion Chips for Active Quadrant */}
      <div className="p-4 rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E]">
        <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold block mb-2.5">
          Select Your Emotional State:
        </span>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS_CATALOG.filter((e) => e.quadrant === activeQuadrant).map((item) => {
            const isSelected = selectedEmotion === item.name;
            return (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSelect(item)}
                className={`text-xs px-4 py-2 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] border-[#2C2520] dark:border-[#ECE7E0] shadow-organic-sm font-semibold"
                    : "bg-[#FFFFFF] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#2C2520] dark:text-[#ECE7E0] hover:border-[#C86D51]"
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Emotion Feedback Bar */}
        {currentSelection && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 pt-3 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs text-[#786F66] dark:text-[#A8A096]"
          >
            <span>
              Selected State: <strong className="text-[#2C2520] dark:text-[#ECE7E0]">{currentSelection.name}</strong>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E]">
              Valence: {currentSelection.valence > 0 ? `+${currentSelection.valence}` : currentSelection.valence} · Energy: {currentSelection.arousal}/5
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
