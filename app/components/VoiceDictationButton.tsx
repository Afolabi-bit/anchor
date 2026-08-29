"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import { isSpeechRecognitionSupported, createSpeechRecognizer } from "@/lib/voice-dictation";

interface VoiceDictationButtonProps {
  onAppendText: (text: string) => void;
  className?: string;
}

export default function VoiceDictationButton({
  onAppendText,
  className = "",
}: VoiceDictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const toggleListening = () => {
    triggerHaptic(12);

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          onAppendText(transcript.trim());
          triggerHaptic(8);
        }
      },
      (listening) => {
        setIsListening(listening);
      },
      (err) => {
        console.warn("Dictation message:", err);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (e) {
        console.error("Start dictation error:", e);
      }
    }
  };

  if (!supported) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        type="button"
        onClick={toggleListening}
        title={isListening ? "Stop voice dictation" : "Speak to dictate reflection"}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs text-xs font-medium ${
          isListening
            ? "bg-[#C86D51] text-white ring-2 ring-[#C86D51]/40 animate-pulse"
            : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span className="text-[10px]">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Voice</span>
          </>
        )}
      </motion.button>

      {/* Pulsing Wave Animation When Active */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#C86D51] text-white text-[9px] font-semibold flex items-center gap-1 whitespace-nowrap shadow-organic-sm pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>Speaking...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
