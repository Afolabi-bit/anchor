"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Sun,
  Moon,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wind,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";

export default function LandingHero() {
  const [activeTab, setActiveTab] = useState<"morning" | "circadian" | "evening">("morning");

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Value Pill */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full border border-[#D9E6DD] dark:border-[#2C4032] bg-[#EEF4F0]/80 dark:bg-[#202D24]/80 backdrop-blur-md text-[#658B70] dark:text-[#82A78C] text-xs font-medium mb-6 shadow-2xs"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>A judgment-free daily accountability companion</span>
      </motion.div>

      {/* Main Hero Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#2C2520] dark:text-[#ECE7E0] leading-[1.12] max-w-3xl text-center"
      >
        Show up for yourself, <br />
        <span className="italic text-[#C86D51] dark:text-[#DB8165]">one day at a time.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="text-base sm:text-lg text-[#786F66] dark:text-[#A8A096] mt-6 max-w-xl text-center leading-relaxed"
      >
        Morning intentions, evening reflections, and soft landings when days don't go as planned. Built for recovery, habits, and emotional grounding without streak anxiety.
      </motion.p>

      {/* Hero CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full max-w-sm sm:max-w-none justify-center"
      >
        <Link
          href="/signup"
          onClick={() => triggerHaptic(12)}
          className="py-4 px-8 rounded-full bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-organic-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Start your daily anchor</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          onClick={() => triggerHaptic(10)}
          className="py-4 px-8 rounded-full border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] hover:bg-[#F3EFE7] dark:hover:bg-[#2E2A26] text-[#2C2520] dark:text-[#ECE7E0] font-medium text-base transition-all flex items-center justify-center shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
        >
          Sign in to your sanctuary
        </Link>
      </motion.div>

      {/* Floating Interactive Live Mockup Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-14 w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 sm:p-8 shadow-organic-lg clay-card text-left"
      >
        {/* Interactive Feature Selector Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#EAE3D7] dark:border-[#38332E] pb-4">
          <button
            onClick={() => {
              triggerHaptic(10);
              setActiveTab("morning");
            }}
            className={`text-xs px-3.5 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "morning"
                ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-semibold border border-[#EAE3D7] dark:border-[#38332E]"
                : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Morning Intention</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              setActiveTab("circadian");
            }}
            className={`text-xs px-3.5 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "circadian"
                ? "bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] font-semibold border border-[#EAE3D7] dark:border-[#38332E]"
                : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>24h Circadian Rhythm</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              setActiveTab("evening");
            }}
            className={`text-xs px-3.5 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "evening"
                ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold border border-[#EAE3D7] dark:border-[#38332E]"
                : "text-[#786F66] dark:text-[#A8A096] hover:text-[#2C2520]"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Evening Reflection</span>
          </button>
        </div>

        {/* Dynamic Card Preview Based on Active Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "morning" && (
            <motion.div
              key="morning"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#B88452] font-semibold">
                    Morning Ritual
                  </span>
                  <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                    "Stay sober & grounded"
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] font-medium">
                  Sealed Today ?
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold">
                  Today's Planned Micro-Actions:
                </span>
                <div className="flex items-center gap-2 text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                  <CheckCircle2 className="w-4 h-4 text-[#658B70]" />
                  <span>Call sponsor / friend if craving hits at 5pm</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#2C2520] dark:text-[#ECE7E0]">
                  <CheckCircle2 className="w-4 h-4 text-[#658B70]" />
                  <span>20m walk after work to decompress</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "circadian" && (
            <motion.div
              key="circadian"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#C86D51] font-semibold">
                  Dynamic Rhythm
                </span>
                <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Solar & Lunar Awareness
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E]">
                <svg viewBox="0 0 400 70" className="w-full h-16">
                  <path d="M 20 60 Q 200 -10 380 60" fill="none" stroke="#C86D51" strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
                  <circle cx="200" cy="25" r="7" fill="#C86D51" />
                  <circle cx="200" cy="25" r="14" fill="#C86D51" opacity="0.15" />
                </svg>
                <div className="flex justify-between text-[10px] text-[#786F66] dark:text-[#A8A096] pt-1">
                  <span>06:00 Morning Rise</span>
                  <span className="font-semibold text-[#C86D51]">Current Position</span>
                  <span>22:00 Evening Wind-down</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "evening" && (
            <motion.div
              key="evening"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#658B70] font-semibold">
                  Honest Reflection
                </span>
                <h3 className="font-serif-title text-xl text-[#2C2520] dark:text-[#ECE7E0]">
                  Soft Landings Guaranteed
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E1B18] border border-[#EAE3D7] dark:border-[#38332E] space-y-2">
                <p className="font-serif text-xs italic text-[#2C2520] dark:text-[#ECE7E0] leading-relaxed">
                  "Had a stressful afternoon meeting, but took a breath and stepped outside. Proud of holding steady."
                </p>
                <div className="flex gap-1.5 pt-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]">#stress</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] text-[#786F66]">#work-fatigue</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3 Core Pillars Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 text-left w-full max-w-4xl">
        <motion.div
          whileHover={{ y: -3 }}
          className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] clay-card shadow-organic-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] flex items-center justify-center mb-5">
            <Sun className="w-5 h-5" />
          </div>
          <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
            Morning Intention
          </h3>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Set 1�2 realistic micro-actions for your commitment without feeling pressured. Seal with the tactile anchor.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] clay-card shadow-organic-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] flex items-center justify-center mb-5">
            <Moon className="w-5 h-5" />
          </div>
          <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
            Evening Reflection
          </h3>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            Reflect honestly on how the day went, tag obstacles (fatigue, urges, stress), and capture takeaways.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="p-7 rounded-3xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FFFFFF] dark:bg-[#25221F] clay-card shadow-organic-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] dark:text-[#82A78C] flex items-center justify-center mb-5">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-serif-title font-medium text-[#2C2520] dark:text-[#ECE7E0] text-lg mb-2">
            Soft Landings
          </h3>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] leading-relaxed">
            No punitive streak resets or warning colors. Every morning is a clean slate to show up again.
          </p>
        </motion.div>
      </div>

      {/* Trust & Privacy Statement */}
      <div className="mt-14 py-6 px-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] flex flex-col sm:flex-row items-center gap-4 text-xs text-[#786F66] dark:text-[#A8A096] shadow-organic-sm max-w-2xl w-full">
        <ShieldCheck className="w-6 h-6 text-[#658B70] shrink-0" />
        <div>
          <span className="font-semibold text-[#2C2520] dark:text-[#ECE7E0]">Private & Non-Judgemental: </span>
          Your reflections belong entirely to you. Built with strict cryptographic encryption and clinical data export.
        </div>
      </div>
    </div>
  );
}
