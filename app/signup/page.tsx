"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, ArrowRight, ShieldCheck, User, Envelope as Mail, Lock, Eye, EyeSlash as EyeOff } from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/sensory";
import PasswordStrengthIndicator from "@/app/components/PasswordStrengthIndicator";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError("Please provide your first and last name so Anchor can address you.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      triggerHaptic(12);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: email.trim().toLowerCase(),
          password,
          timezone: userTimezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Store token and user in client storage as bulletproof fallback
      if (data.token) {
        try {
          localStorage.setItem("anchor_token", data.token);
          if (data.user) {
            localStorage.setItem("anchor_user", JSON.stringify(data.user));
          }
        } catch {}
      }

      // Hard redirect to ensure browser commits HttpOnly session cookie
      window.location.href = "/onboarding";
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-5 py-10 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-3.5 shadow-organic-sm"
          >
            <Anchor className="w-7 h-7" />
          </motion.div>
          <h1 className="font-serif-title text-3xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
            Anchor
          </h1>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1 font-normal">
            Show up for yourself, one day at a time.
          </p>
        </div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-6 sm:p-8 clay-card shadow-organic-md"
        >
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C86D51] dark:text-[#DB8165] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Create Your Account</span>
            </div>
            <h2 className="font-serif-title text-xl sm:text-2xl text-[#2C2520] dark:text-[#ECE7E0]">
              Create your private space
            </h2>
            <p className="text-xs text-[#786F66] dark:text-[#A8A096] mt-1 leading-relaxed">
              We personalize your daily check-ins and reflective inquiries with your name.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-5 p-3.5 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] text-[#B88452] dark:text-[#E2A365] text-xs leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name & Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5"
                  htmlFor="firstName"
                >
                  First Name <span className="text-[#C86D51]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E948A]" />
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs sm:text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5"
                  htmlFor="lastName"
                >
                  Last Name <span className="text-[#C86D51]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E948A]" />
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Morgan"
                    className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs sm:text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5"
                htmlFor="email"
              >
                Email address <span className="text-[#C86D51]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E948A]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs sm:text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-semibold mb-1.5"
                htmlFor="password"
              >
                Password <span className="text-[#C86D51]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E948A]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters recommended"
                  className="w-full pl-9 pr-10 py-3 rounded-2xl border border-[#EAE3D7] dark:border-[#38332E] bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-xs sm:text-sm focus:outline-none focus:border-[#C86D51] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              <AnimatePresence>
                {password && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </AnimatePresence>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-organic-sm"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Creating your space...</span>
                </>
              ) : (
                <>
                  <span>Begin with Anchor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-[#EAE3D7] dark:border-[#38332E] flex items-start gap-2.5 text-xs text-[#786F66] dark:text-[#A8A096]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#658B70] mt-0.5" />
            <span className="leading-relaxed">
              Your name and reflections are strictly private to your personal space.
            </span>
          </div>
        </motion.div>

        {/* Existing account link */}
        <p className="text-center text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#C86D51] dark:text-[#DB8165] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
