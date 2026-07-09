"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      // Show success message for existing users
      setMessage(
        "If that email exists in our system, a reset code has been sent."
      );

      // Redirect to verify OTP page after 2 seconds
      setTimeout(() => {
        router.push(`/verify-otp?userId=${data.userId || ""}&purpose=reset_password`);
      }, 2000);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Reset password</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your email address and we'll send you a reset code
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
              {error.toLowerCase().includes("account") && (
                <div className="mt-2">
                  <Link
                    href="/signup"
                    className="font-medium underline hover:text-red-800"
                  >
                    Sign up here
                  </Link>
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Sending..." : "Send reset code"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
