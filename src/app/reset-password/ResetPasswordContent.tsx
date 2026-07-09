"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import Link from "next/link";
import { getPasswordPolicyError } from "@/domains/user/value-objects/Password";

export default function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      setError(policyError);
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setError("Invalid request. Please restart the process.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: password }),
      });

      const data = await res.json();


      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login");
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
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              Password reset successfully! Redirecting to login...
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                New Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={isLoading || success} className="w-full">
              {isLoading ? "Resetting..." : "Reset password"}
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