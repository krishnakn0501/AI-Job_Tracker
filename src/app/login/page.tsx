"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to dashboard on successful login
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Elements for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-slate-300/40 dark:bg-neutral-800/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 dark:bg-neutral-700/40 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] border border-white/40 dark:border-white/10 p-8 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Sign in to your JobTrack account to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 group">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-slate-200 dark:border-neutral-700 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300 h-11 rounded-xl shadow-sm"
              />
            </div>

            <div className="space-y-1.5 group">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white">Password</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-slate-200 dark:border-neutral-700 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300 h-11 rounded-xl shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-slate-900 dark:text-white hover:underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4 transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}