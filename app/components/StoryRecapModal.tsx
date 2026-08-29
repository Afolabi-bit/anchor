"use client";

import { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic, playSingingBowlChime } from "@/lib/sensory";

interface StoryRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  recapData: any;
}

export default function StoryRecapModal({
  isOpen,
  onClose,
  recapData,
}: StoryRecapModalProps) {
  const [slide, setSlide] = useState(1);
  const totalSlides = 4;

  if (!isOpen || !recapData) return null;

  const nextSlide = () => {
    triggerHaptic(12);
    if (slide < totalSlides) {
      setSlide(slide + 1);
    } else {
      playSingingBowlChime(432);
      onClose();
    }
  };

  const prevSlide = () => {
    triggerHaptic(10);
    if (slide > 1) setSlide(slide - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#FAF7F2]/95 dark:bg-[#1C1917]/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[#25221F] border-t sm:border border-[#EAE3D7] dark:border-[#38332E] rounded-t-3xl sm:rounded-3xl p-5 sm:p-9 shadow-organic-lg clay-card flex flex-col justify-between min-h-[460px] sm:min-h-[520px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Top Story Indicator Bars */}
        <div>
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  slide >= idx + 1
                    ? "bg-[#C86D51]"
                    : "bg-[#EAE3D7] dark:bg-[#38332E]"
                }`}
              />
            ))}

            <button
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ---------------- SLIDE 1: THE RHYTHM ---------------- */}
          {slide === 1 && (
            <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C86D51] font-semibold block mb-1">
                  7-Day Story • Chapter 1
                </span>
                <h2 className="font-serif-title text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Your Weekly Follow-Through
                </h2>
                <div className="my-6 p-6 rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] text-center shadow-organic-sm">
                  <span className="font-serif-title text-5xl font-medium text-[#2C2520] dark:text-[#ECE7E0]">
                    {recapData.completionRate}%
                  </span>
                  <span className="text-xs text-[#786F66] dark:text-[#A8A096] block mt-1">
                    Follow-through across {recapData.totalDaysWithEvening || 0}{" "}
                    reflections
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
                  Anchor views every day as an independent moment. Whether you
                  logged a full day or took pause, showing up to reflect is
                  progress.
                </p>
              </div>
            </div>
          )}

          {/* ---------------- SLIDE 2: THE OBSTACLES ---------------- */}
          {slide === 2 && (
            <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center shadow-xs">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#B88452] font-semibold block mb-1">
                  7-Day Story • Chapter 2
                </span>
                <h2 className="font-serif-title text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Themes & Circumstances
                </h2>
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-2 mb-4 leading-relaxed">
                  Recognizing what creates tension is the first step toward
                  self-compassion.
                </p>

                {recapData.topBlockerTags &&
                recapData.topBlockerTags.length > 0 ? (
                  <div className="space-y-2">
                    {recapData.topBlockerTags.slice(0, 3).map((item: any) => (
                      <div
                        key={item.tag}
                        className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0] capitalize">
                          {item.tag}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] text-[#786F66] font-semibold">
                          Observed {item.count}{" "}
                          {item.count === 1 ? "time" : "times"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-[#EAE3D7] text-center text-xs text-[#786F66]">
                    No recurring obstacles tagged this week.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- SLIDE 3: WISDOM PINNED ---------------- */}
          {slide === 3 && (
            <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] flex items-center justify-center shadow-xs">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#C86D51] font-semibold block mb-1">
                  7-Day Story • Chapter 3
                </span>
                <h2 className="font-serif-title text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Your Pinned Wisdom
                </h2>
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-2 mb-4">
                  Takeaways you discovered in your evening reflections.
                </p>

                {recapData.pinnedLessons &&
                recapData.pinnedLessons.length > 0 ? (
                  <div className="space-y-3">
                    {recapData.pinnedLessons
                      .slice(0, 2)
                      .map((lesson: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] font-serif text-sm italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed shadow-xs"
                        >
                          "{lesson}"
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-[#EAE3D7] text-center text-xs text-[#786F66]">
                    Add takeaways in your evening reflections to see them
                    honored here.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- SLIDE 4: FORWARD ANCHOR ---------------- */}
          {slide === 4 && (
            <div className="space-y-6 py-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] flex items-center justify-center shadow-organic-sm">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#658B70] font-semibold block mb-1">
                  Forward Anchor
                </span>
                <h2 className="font-serif-title text-3xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Show Up For Yourself
                </h2>
                <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-3 max-w-sm mx-auto leading-relaxed">
                  Next week is not about perfection. It is simply about one more
                  day of honest intention and gentle self-awareness.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="pt-6 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-center justify-between">
          {slide > 1 ? (
            <button
              type="button"
              onClick={prevSlide}
              className="py-3 px-5 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66] hover:text-[#2C2520] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={nextSlide}
            className="py-3.5 px-6 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-organic-md"
          >
            <span>
              {slide === totalSlides ? "Complete Story Review" : "Next Chapter"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
