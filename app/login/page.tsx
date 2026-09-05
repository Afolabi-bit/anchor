"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, ArrowRight, Eye, EyeSlash as EyeOff, WarningCircle } from "@phosphor-icons/react";
import Spinner from "@/app/components/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorCode(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address");
      setErrorCode("MISSING_EMAIL");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please provide a valid email address");
      setErrorCode("INVALID_EMAIL");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      setErrorCode("MISSING_PASSWORD");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setErrorCode(data.code || null);
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem("anchor_token", data.token);
          if (data.user) {
            localStorage.setItem("anchor_user", JSON.stringify(data.user));
          }
        } catch {}
      }

      window.location.href = data.user && !data.user.isOnboarded ? "/onboarding" : "/today";
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isEmailError = errorCode === "USER_NOT_FOUND" || errorCode === "MISSING_EMAIL" || errorCode === "INVALID_EMAIL";
  const isPasswordError = errorCode === "WRONG_PASSWORD" || errorCode === "MISSING_PASSWORD";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-5 py-8 sm:py-12 bg-[#FAF7F2] dark:bg-[#1C1917] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F9EBE7] dark:bg-[#38251F] text-[#C86D51] dark:text-[#DB8165] mb-3.5 shadow-xs">
            <Anchor className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-medium tracking-tight text-[#2C2520] dark:text-[#ECE7E0]">
            Return to your daily rhythm
          </h1>
          <p className="text-xs sm:text-sm text-[#786F66] dark:text-[#A8A096] mt-1">
            Sign in to check in with yourself today.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#25221F] border border-[#EAE3D7] dark:border-[#38332E] rounded-3xl p-5 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-[#FAF2EA] dark:bg-[#352A1E] border border-[#F2D7CE] dark:border-[#4D332B] text-[#B88452] dark:text-[#E2A365] text-xs leading-relaxed space-y-2">
              <div className="flex items-start gap-2">
                <WarningCircle className="w-4 h-4 shrink-0 text-[#C86D51] dark:text-[#DB8165] mt-0.5" />
                <span className="font-medium text-[#2C2520] dark:text-[#ECE7E0]">{error}</span>
              </div>
              {errorCode === "USER_NOT_FOUND" && (
                <div className="pl-6 text-[11px] text-[#786F66] dark:text-[#A8A096]">
                  Don't have an account yet?{" "}
                  <Link href="/signup" className="text-[#C86D51] dark:text-[#DB8165] font-semibold underline hover:opacity-80">
                    Create an account here →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (isEmailError) setError("");
                }}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-2xl border bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none transition-colors ${
                  isEmailError
                    ? "border-[#C86D51] focus:border-[#C86D51]"
                    : "border-[#EAE3D7] dark:border-[#38332E] focus:border-[#C86D51]"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#786F66] dark:text-[#A8A096] font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isPasswordError) setError("");
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 pr-11 py-3 rounded-2xl border bg-[#FAF7F2] dark:bg-[#1E1B18] text-[#2C2520] dark:text-[#ECE7E0] placeholder:text-[#9E948A] text-sm focus:outline-none transition-colors ${
                    isPasswordError
                      ? "border-[#C86D51] focus:border-[#C86D51]"
                      : "border-[#EAE3D7] dark:border-[#38332E] focus:border-[#C86D51]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E948A] hover:text-[#2C2520] dark:hover:text-[#ECE7E0] p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-5 rounded-2xl bg-[#C86D51] hover:bg-[#B35D43] text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Create account link */}
        <p className="text-center text-sm text-[#786F66] dark:text-[#A8A096] mt-6">
          New to Anchor?{" "}
          <Link href="/signup" className="font-medium text-[#C86D51] dark:text-[#DB8165] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
