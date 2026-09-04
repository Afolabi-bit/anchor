"use client";

import { motion } from "framer-motion";
import { Check } from "@phosphor-icons/react";

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!password) {
    return {
      score: 0,
      label: "Enter a password",
      color: "#9E948A",
      hasMinLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  if (password.length < 6) {
    return {
      score: 1,
      label: "Too short (min 6 chars)",
      color: "#C86D51",
      hasMinLength: false,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  // If length is less than 8, it can never reach Good or Strong
  if (password.length < 8) {
    const variety = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
    return {
      score: variety >= 3 ? 2 : 1,
      label: variety >= 3 ? "Fair (needs 8+ chars)" : "Weak",
      color: variety >= 3 ? "#B88452" : "#C86D51",
      hasMinLength: false,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }

  // Length is >= 8
  let varietyCount = 0;
  if (hasLower) varietyCount++;
  if (hasUpper) varietyCount++;
  if (hasNumber) varietyCount++;
  if (hasSpecial) varietyCount++;

  let score = 2;
  let label = "Fair";
  let color = "#B88452"; // Ochre

  if (varietyCount >= 4 || (varietyCount >= 3 && password.length >= 10)) {
    score = 4;
    label = "Strong & Secure";
    color = "#658B70"; // Sage / Green
  } else if (varietyCount >= 3 || (varietyCount >= 2 && password.length >= 10)) {
    score = 3;
    label = "Good";
    color = "#82A78C"; // Soft Sage
  }

  return {
    score,
    label,
    color,
    hasMinLength: true,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  showCriteria = true,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = evaluatePasswordStrength(password);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2 pt-1 text-xs"
    >
      {/* Segmented Strength Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          {[1, 2, 3, 4].map((level) => {
            const isFilled = strength.score >= level;
            return (
              <div
                key={level}
                className="h-1.5 flex-1 rounded-full bg-[#EAE3D7] dark:bg-[#38332E] overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: isFilled ? "100%" : "0%",
                    backgroundColor: isFilled ? strength.color : "transparent",
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="h-full rounded-full"
                />
              </div>
            );
          })}
        </div>

        <span
          className="text-[11px] font-semibold tracking-wide shrink-0 transition-colors"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {/* Responsive Micro-Checklist Pills */}
      {showCriteria && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
          <span
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
              strength.hasMinLength
                ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold"
                : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#9E948A] border border-[#EAE3D7] dark:border-[#38332E]"
            }`}
          >
            {strength.hasMinLength && <Check className="w-2.5 h-2.5" />}
            <span>8+ characters</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
              strength.hasUpper && strength.hasLower
                ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold"
                : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#9E948A] border border-[#EAE3D7] dark:border-[#38332E]"
            }`}
          >
            {strength.hasUpper && strength.hasLower && <Check className="w-2.5 h-2.5" />}
            <span>Upper & lowercase</span>
          </span>

          <span
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
              strength.hasNumber || strength.hasSpecial
                ? "bg-[#EEF4F0] dark:bg-[#202D24] text-[#658B70] font-semibold"
                : "bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#9E948A] border border-[#EAE3D7] dark:border-[#38332E]"
            }`}
          >
            {(strength.hasNumber || strength.hasSpecial) && <Check className="w-2.5 h-2.5" />}
            <span>Number or symbol</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
