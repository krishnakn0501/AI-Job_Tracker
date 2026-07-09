"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyOtpContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const purpose = searchParams.get("purpose");

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle key presses for OTP inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle OTP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter a 6-digit code");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: otpString, purpose }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      setSuccess(true);

      // Redirect based on purpose
      if (purpose === "signup") {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else if (purpose === "reset_password") {
        setTimeout(() => {
          router.push(`/reset-password?userId=${userId}`);
        }, 1500);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (resendCountdown > 0) return;

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code");
        return;
      }

      setResendCountdown(30); // 30 seconds cooldown
      setResendDisabled(true);
      setCountdown(120); // Reset countdown

      // Show success message
      setError("Code resent successfully!");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      console.error(err);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }
  }, [resendCountdown]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-slate-300/40 dark:bg-neutral-800/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[-5%] w-[40%] h-[40%] rounded-full bg-slate-200/40 dark:bg-neutral-700/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] border border-white/40 dark:border-white/10 p-8 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {purpose === "signup" ? "Verify your email" : "Reset your password"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-xl text-sm animate-in slide-in-from-top-2 backdrop-blur-md border ${
              success 
                ? "bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" 
                : "bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300 shadow-sm"
                />
              ))}
            </div>

            <div className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Time remaining: <span className="font-mono text-slate-700 dark:text-slate-300">{formatTime(countdown)}</span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || countdown <= 0}
              className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Button
              onClick={handleResend}
              disabled={resendDisabled || countdown <= 0}
              variant="link"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 disabled:opacity-50"
            >
              {resendDisabled
                ? `Resend in ${formatTime(resendCountdown)}`
                : "Resend code"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {purpose === "signup" ? (
              <>
                Didn't receive an email?{" "}
                <Link href="/signup" className="text-slate-900 dark:text-white hover:underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4 transition-all">
                  Resend
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/forgot-password"
                  className="text-slate-900 dark:text-white hover:underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4 transition-all"
                >
                  Didn't receive an email?
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}