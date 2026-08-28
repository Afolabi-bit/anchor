"use client";

import { useState, useEffect } from "react";
import { Wind, Phone, X, Volume2, VolumeX, Sparkles } from "lucide-react";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

export default function GroundingDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [breathingStep, setBreathingStep] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [seconds, setSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  return (
    <>
      {/* Discreet Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsBreathingActive(true);
          triggerHaptic(10);
        }}
        className="text-xs text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] flex items-center gap-2 px-4 py-2 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#F3EFE7]/80 dark:bg-[#25221F] hover:bg-[#F3EFE7] transition-all cursor-pointer clay-card shadow-organic-sm"
      >
        <Wind className="w-3.5 h-3.5 text-[#658B70] dark:text-[#82A78C]" />
        <span className="font-medium">Pause & Breathe</span>
      </button>

      {/* Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl max-w-md w-full p-7 sm:p-9 shadow-organic-lg relative max-h-[90vh] overflow-y-auto clay-card">
            {/* Top Bar Controls */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  triggerHaptic(10);
                }}
                className="p-2 rounded-full text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                title={soundEnabled ? "Mute singing bowl chime" : "Enable singing bowl chime"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#658B70]" /> : <VolumeX className="w-4 h-4 text-[#9E948A]" />}
                <span>{soundEnabled ? "432Hz Chime On" : "Chime Muted"}</span>
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
              <div className="w-10 h-10 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] flex items-center justify-center shadow-xs">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                  Take a Gentle Moment
                </h3>
                <p className="text-xs text-[#786F66] dark:text-[#A8A096]">Pause, ground yourself, and let urgency pass.</p>
              </div>
            </div>

            {/* Impeccable Concentric Multi-Ring Breathing Visualizer */}
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
                4-4-4-4 Box Rhythm: Slowing the vagus nerve and releasing urgent craving.
              </p>
            </div>

            {/* Sensory Grounding Card */}
            <div className="p-4 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] border border-[#D9E6DD] dark:border-[#2C4032] text-xs text-[#2C2520] dark:text-[#ECE7E0] mb-5">
              <span className="font-semibold text-[#658B70] dark:text-[#82A78C] block mb-1">
                5-4-3-2-1 Sensory Grounding:
              </span>
              <p className="text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                Notice 5 things you can see, 4 things you can feel, 3 sounds, 2 scents, and 1 slow breath.
              </p>
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
          </div>
        </div>
      )}
    </>
  );
}
