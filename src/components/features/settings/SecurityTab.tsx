"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "react-hot-toast";
import { getPasswordPolicyError } from "@/domains/user/value-objects/Password";

export default function SecurityTab({ emailForm, setEmailForm }: any) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const policyError = getPasswordPolicyError(passwordForm.newPassword);
    if (policyError) {
      toast.error(policyError);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password updated successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const handleChangeEmail = async () => {
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          currentPassword: emailForm.currentPassword,
        }),
      });

      if (res.ok) {
        toast.success("Email change request sent. Please check your inbox.");
        setEmailForm({ newEmail: "", currentPassword: "" });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to request email change");
      }
    } catch (error) {
      toast.error("Failed to request email change");
    }
  };

  return (
    <div className="space-y-10">
      {/* Change Password */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Change Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update your account password.
          </p>
        </div>

        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label
              htmlFor="current-password"
              className="text-slate-700 dark:text-slate-300"
            >
              Current Password
            </Label>
            <PasswordInput
              id="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="new-password"
              className="text-slate-700 dark:text-slate-300"
            >
              New Password
            </Label>
            <PasswordInput
              id="new-password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-slate-700 dark:text-slate-300"
            >
              Confirm New Password
            </Label>
            <PasswordInput
              id="confirm-password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-md transition-all mt-2"
          >
            Update Password
          </Button>
        </div>
      </section>

      {/* Change Email */}
      <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
            Change Email
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update your account email address.
          </p>
        </div>

        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="new-email" className="text-slate-700 dark:text-slate-300">
              New Email Address
            </Label>
            <Input
              id="new-email"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, newEmail: e.target.value })
              }
              className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email-current-password"
              className="text-slate-700 dark:text-slate-300"
            >
              Current Password (to verify)
            </Label>
            <PasswordInput
              id="email-current-password"
              value={emailForm.currentPassword}
              onChange={(e) =>
                setEmailForm({ ...emailForm, currentPassword: e.target.value })
              }
              className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
            />
          </div>

          <Button
            onClick={handleChangeEmail}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-md transition-all mt-2"
          >
            Send Verification
          </Button>
        </div>
      </section>
    </div>
  );
}
