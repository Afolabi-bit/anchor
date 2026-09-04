"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
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
  const [status, setStatus] = useState<"idle" | "connecting" | "listening">("idle");
  const [supported, setSupported] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const toggleListening = () => {
    triggerHaptic(12);

    if (status === "listening" || status === "connecting") {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop speech recognizer:", e);
        }
      }
      setStatus("idle");
      return;
    }

    setFeedbackMsg(null);
    setStatus("connecting");

    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          onAppendText(transcript.trim());
          triggerHaptic(8);
        }
      },
      (listening) => {
        setStatus(listening ? "listening" : "idle");
      },
      (err) => {
        setStatus("idle");
        setFeedbackMsg(err);
        const timer = setTimeout(() => setFeedbackMsg(null), 4000);
        return () => clearTimeout(timer);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (e) {
        console.warn("Could not activate microphone for voice dictation:", e);
        setStatus("idle");
        setFeedbackMsg("Could not activate microphone. You can type freely.");
      }
    } else {
      setStatus("idle");
    }
  };

  if (!supported) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={toggleListening}
        title={
          status === "listening"
            ? "Stop voice dictation"
            : status === "connecting"
            ? "Connecting to speech service..."
            : "Speak to dictate reflection"
        }
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs text-xs font-medium ${
          status === "listening"
            ? "bg-[#C86D51] text-white ring-2 ring-[#C86D51]/40 animate-pulse"
            : status === "connecting"
            ? "bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] border border-[#B88452]/40"
            : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#786F66] dark:text-[#A8A096] border border-[#EAE3D7] dark:border-[#38332E] hover:text-[#2C2520] dark:hover:text-[#ECE7E0]"
        }`}
      >
        {status === "connecting" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B88452]" />
            <span className="text-xs text-[#B88452] font-semibold">Connecting...</span>
          </>
        ) : status === "listening" ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            <span className="text-xs">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">Voice</span>
          </>
        )}
      </motion.button>

      {/* Pulsing Wave Animation When Active */}
      <AnimatePresence>
        {status === "listening" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#C86D51] text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap shadow-organic-sm pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>Speaking...</span>
          </motion.div>
        )}
        {status === "connecting" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#FAF2EA] dark:bg-[#352A1E] text-[#B88452] border border-[#EAE3D7] dark:border-[#38332E] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-organic-sm pointer-events-none"
          >
            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#B88452]" />
            <span>Connecting mic...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gentle Error / Fallback Tooltip */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 right-0 w-60 p-2.5 rounded-2xl bg-[#2C2520] dark:bg-[#ECE7E0] text-white dark:text-[#1C1917] text-xs leading-snug shadow-organic-md z-50 pointer-events-auto border border-[#443E38] dark:border-[#D5CFC7]"
          >
            <div className="flex items-start justify-between gap-2">
              <span>{feedbackMsg}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="opacity-70 hover:opacity-100 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
