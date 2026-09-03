"use client";

import { useState, useEffect } from "react";
import { Wind, Phone, X, Volume2, VolumeX, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

const GROUNDING_ITEMS = [
  { id: 5, label: "5 things you can see around you", placeholder: "e.g. Tree branches, light on the wall, mug" },
  { id: 4, label: "4 things you can physically feel", placeholder: "e.g. Feet on ground, fabric of shirt, cool air" },
  { id: 3, label: "3 sounds you can hear right now", placeholder: "e.g. Distant traffic, hum of fridge, breath" },
  { id: 2, label: "2 things you can smell or enjoy the scent of", placeholder: "e.g. Coffee, fresh air, wood" },
  { id: 1, label: "1 slow, honest breath down to the belly", placeholder: "Take a full 4-second inhale and exhale" },
];

export default function GroundingDrawer({ triggerClassName }: { triggerClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [breathingStep, setBreathingStep] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [seconds, setSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkedSensory, setCheckedSensory] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathingActive && isOpen) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setBreathingStep((currentStep) => {
              triggerHaptic(12); // micro tactile tick
              switch (currentStep) {
                case "Inhale":
                  return "Hold";
                case "Hold":
                  return "Exhale";
                case "Exhale":
                  return "Pause";
                case "Pause":
                  if (soundEnabled) playSingingBowlChime(432);
                  triggerHaptic([15, 30, 20]);
                  return "Inhale";
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, isOpen, soundEnabled]);

  const toggleSensory = (id: number) => {
    triggerHaptic(10);
    setCheckedSensory((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setIsOpen(true);
          setIsBreathingActive(true);
          triggerHaptic(10);
        }}
        className={
          triggerClassName ||
          "text-xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-transparent hover:bg-[#FAF7F2] dark:hover:bg-[#1E1B18] transition-colors cursor-pointer"
        }
      >
        <Wind className="w-3.5 h-3.5 text-[#658B70]" />
        <span className="font-medium">Pause & Breathe</span>
      </motion.button>

      {/* Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] as const }}
              className="bg-[#FAF7F2] dark:bg-[#25221F] border-t sm:border border-[#EAE3D7] dark:border-[#38332E] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-organic-lg relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto clay-card"
            >
              {/* Top Bar Controls */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    triggerHaptic(10);
                  }}
                  className="p-2 rounded-full text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  title={soundEnabled ? "Mute gentle chime" : "Enable gentle chime"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-[#658B70]" /> : <VolumeX className="w-4 h-4 text-[#9E948A]" />}
                  <span>{soundEnabled ? "Grounding Chime On" : "Chime Muted"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsBreathingActive(false);
                    triggerHaptic(10);
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] flex items-center justify-center shadow-2xs">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                    Take a Gentle Moment
                  </h3>
                  <p className="text-xs text-[#786F66] dark:text-[#A8A096]">Pause, ground yourself, and let urgency pass.</p>
                </div>
              </div>

              {/* Concentric Multi-Ring Breathing Visualizer */}
              <div className="py-10 px-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-center my-6 flex flex-col items-center shadow-organic-sm relative overflow-hidden">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* Outer Ring 1 */}
                  <div
                    className={`absolute inset-0 rounded-full border border-[#658B70]/30 transition-all duration-1000 ${
                      breathingStep === "Inhale"
                        ? "scale-110 opacity-70 bg-[#658B70]/10"
                        : breathingStep === "Hold"
                        ? "scale-110 opacity-90 bg-[#C86D51]/10 border-[#C86D51]/30"
                        : breathingStep === "Exhale"
                        ? "scale-90 opacity-40 bg-[#B88452]/5"
                        : "scale-80 opacity-20"
                    }`}
                  />

                  {/* Mid Ring 2 */}
                  <div
                    className={`absolute w-36 h-36 rounded-full border border-[#C86D51]/20 transition-all duration-1000 delay-75 ${
                      breathingStep === "Inhale"
                        ? "scale-105 opacity-80"
                        : breathingStep === "Hold"
                        ? "scale-105 opacity-100"
                        : breathingStep === "Exhale"
                        ? "scale-95 opacity-50"
                        : "scale-85 opacity-30"
                    }`}
                  />

                  {/* Inner Core 3 */}
                  <div
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-organic-md z-10 ${
                      breathingStep === "Inhale"
                        ? "scale-110 bg-[#EEF4F0] dark:bg-[#233528] text-[#658B70] dark:text-[#82A78C]"
                        : breathingStep === "Hold"
                        ? "scale-110 bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165]"
                        : breathingStep === "Exhale"
                        ? "scale-95 bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] dark:text-[#CFA070]"
                        : "scale-90 bg-[#F3EFE7] dark:bg-[#2D2A26] text-[#786F66]"
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest">{breathingStep}</span>
                    <span className="font-serif-title text-3xl font-medium mt-0.5">{seconds}</span>
                  </div>
                </div>

                <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-6 max-w-xs leading-relaxed">
                  4-4-4-4 Box Rhythm: Calming the vagus nerve and releasing urgency.
                </p>
              </div>

              {/* 5-4-3-2-1 Interactive Sensory Grounding Checklist */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-xs text-[#2C2520] dark:text-[#ECE7E0] mb-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#658B70] dark:text-[#82A78C] block">
                    5-4-3-2-1 Sensory Grounding
                  </span>
                  <span className="text-[10px] text-[#9E948A]">Tap as you notice</span>
                </div>

                <div className="space-y-2">
                  {GROUNDING_ITEMS.map((item) => {
                    const isChecked = Boolean(checkedSensory[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSensory(item.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer text-xs ${
                          isChecked
                            ? "bg-[#EEF4F0] dark:bg-[#202D24] border-[#D9E6DD] text-[#658B70] dark:text-[#82A78C]"
                            : "bg-[#FAF7F2] dark:bg-[#25221F] border-[#EAE3D7] dark:border-[#38332E] text-[#2C2520] dark:text-[#ECE7E0]"
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-[#658B70] shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#9E948A] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={`font-semibold ${isChecked ? "line-through opacity-80" : ""}`}>
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-[#786F66] dark:text-[#A8A096]">
                            {item.placeholder}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quiet Crisis Support */}
              <div className="border-t border-[#EAE3D7] dark:border-[#38332E] pt-4">
                <span className="text-xs font-medium text-[#786F66] dark:text-[#A8A096] flex items-center gap-1.5 mb-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#C86D51]" />
                  Quiet, Confidential Helplines
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex justify-between items-center shadow-organic-sm">
                    <span className="text-[#786F66] dark:text-[#A8A096]">988 Suicide & Crisis Lifeline</span>
                    <a href="tel:988" className="font-semibold text-[#C86D51] dark:text-[#DB8165] hover:underline">
                      Call or Text 988
                    </a>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex justify-between items-center shadow-organic-sm">
                    <span className="text-[#786F66] dark:text-[#A8A096]">SAMHSA Substance Helpline</span>
                    <a href="tel:18006624357" className="font-semibold text-[#C86D51] dark:text-[#DB8165] hover:underline">
                      1-800-662-4357
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
