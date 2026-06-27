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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              {purpose === "signup" ? "Verify your email" : "Reset your password"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
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
                  className="w-12 h-12 text-center text-xl border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <div className="text-center text-sm text-slate-500">
              Time remaining: <span className="font-mono">{formatTime(countdown)}</span>
            </div>

            <Button
              type="submit"
              disabled={isLoading || countdown <= 0}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              onClick={handleResend}
              disabled={resendDisabled || countdown <= 0}
              variant="link"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {resendDisabled
                ? `Resend in ${formatTime(resendCountdown)}`
                : "Resend code"}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            {purpose === "signup" ? (
              <>
                Didn't receive an email?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800">
                  Resend
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-800"
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