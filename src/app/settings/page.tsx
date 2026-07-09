"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Calendar, Lock, User, Globe, Phone } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Switch } from "@/components/ui/switch";
import {
  summarizePreference,
  ReminderPreference,
} from "@/lib/reminder-engine";
import { getPasswordPolicyError } from "@/domains/user/value-objects/Password";

function defaultReminderOffset(offsetDays: number) {
  const presets = [0, 1, 2, 3, 7];
  return presets.includes(offsetDays) ? String(offsetDays) : "other";
}

export default function SettingsPage() {
  const [userData, setUserData] = useState({
    theme: "light",
    username: "",
    dob: null as Date | null,
    country: "India",
    mobile: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [supportForm, setSupportForm] = useState({
    category: "Bug Report",
    message: "",
  });
  const [supportQueries, setSupportQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingReminders, setIsSavingReminders] = useState(false);

  // S10 — reminder preferences
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderAmPm, setReminderAmPm] = useState<"AM" | "PM">("AM");
  const [reminderOffsetDays, setReminderOffsetDays] = useState(0);
  const [reminderRepeat, setReminderRepeat] = useState(false);
  const [offsetPreset, setOffsetPreset] = useState("0");
  const [customOffsetDays, setCustomOffsetDays] = useState(1);

  const effectiveOffsetDays =
    offsetPreset === "other" ? customOffsetDays : Number(offsetPreset);

  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          setUserData({
            theme: data.theme,
            username: data.username || "",
            dob: data.dob ? new Date(data.dob) : null,
            country: data.country || "India",
            mobile: data.mobile || "",
            email: data.email || "",
          });
          // S10
          setReminderHour(data.reminderHour ?? 9);
          setReminderAmPm(data.reminderAmPm ?? "AM");
          setReminderOffsetDays(data.reminderOffsetDays ?? 0);
          setReminderRepeat(data.reminderRepeat ?? false);
          setOffsetPreset(defaultReminderOffset(data.reminderOffsetDays ?? 0));
          if (data.reminderOffsetDays && data.reminderOffsetDays > 3 && data.reminderOffsetDays !== 7) {
            setCustomOffsetDays(data.reminderOffsetDays);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch support queries on mount
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await fetch("/api/support-queries");
        if (res.ok) {
          const data = await res.json();
          setSupportQueries(data);
        }
      } catch (error) {
        console.error("Failed to fetch support queries:", error);
      }
    };

    fetchQueries();
  }, []);

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    if (newTheme === userData.theme) return;

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (res.ok) {
        setUserData(prev => ({ ...prev, theme: newTheme }));
        toast.success("Theme updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update theme");
      }
    } catch (error) {
      toast.error("Failed to update theme");
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userData.username,
          dob: userData.dob ? userData.dob.toISOString() : null,
          country: userData.country,
          mobile: userData.mobile,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
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

  const handleSubmitSupport = async () => {
    if (!supportForm.category || !supportForm.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/support-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });

      if (res.ok) {
        toast.success("Support query submitted successfully");
        setSupportForm({ category: "Bug Report", message: "" });
        // Refresh queries
        const refreshRes = await fetch("/api/support-queries");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSupportQueries(data);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit support query");
      }
    } catch (error) {
      toast.error("Failed to submit support query");
    }
  };

  // S10 — save reminder preferences
  const saveReminderPreferences = async () => {
    setIsSavingReminders(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderHour,
          reminderAmPm,
          reminderOffsetDays: effectiveOffsetDays,
          reminderRepeat,
        }),
      });

      if (res.ok) {
        toast.success("Reminder preferences saved");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save reminder preferences");
      }
    } catch (error) {
      toast.error("Failed to save reminder preferences");
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleOffsetPresetChange = (value: string) => {
    setOffsetPreset(value);
    if (value !== "other") {
      setReminderOffsetDays(Number(value));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Theme Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Theme</h2>
        <p className="text-slate-600 mb-4">Choose your preferred theme for the application</p>

        <div className="flex items-center space-x-4">
          <Button
            variant={userData.theme === "light" ? "default" : "outline"}
            onClick={() => handleThemeChange("light")}
          >
            Light
          </Button>
          <Button
            variant={userData.theme === "dark" ? "default" : "outline"}
            onClick={() => handleThemeChange("dark")}
          >
            Dark
          </Button>
        </div>
      </section>

      {/* S10 — Reminders Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Reminder preferences</h2>
        <p className="text-slate-600 mb-4">
          Set when you want to receive follow-up reminder emails.
          These are your defaults — individual applications can override them.
        </p>

        {/* Time of day */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              Reminder time
            </label>
            <Select value={String(reminderHour)} onValueChange={(v) => setReminderHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                  <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">&nbsp;</label>
            <Select value={reminderAmPm} onValueChange={(v) => setReminderAmPm(v as "AM" | "PM")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lead-time offset */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-500 block mb-1.5">
            Remind me
          </label>
          <Select value={offsetPreset} onValueChange={handleOffsetPresetChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">On the day</SelectItem>
              <SelectItem value="1">1 day before</SelectItem>
              <SelectItem value="2">2 days before</SelectItem>
              <SelectItem value="3">3 days before</SelectItem>
              <SelectItem value="7">1 week before</SelectItem>
              <SelectItem value="other">Other…</SelectItem>
            </SelectContent>
          </Select>
          {offsetPreset === "other" && (
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={customOffsetDays}
                onChange={(e) => setCustomOffsetDays(Number(e.target.value))}
                className="w-20 h-8 text-sm"
              />
              <span className="text-sm text-slate-500">days before</span>
            </div>
          )}
        </div>

        {/* Repeat toggle */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-700">Repeat daily</p>
            <p className="text-xs text-slate-400">
              Fire every day starting from the offset until the follow-up date
            </p>
          </div>
          <Switch checked={reminderRepeat} onCheckedChange={setReminderRepeat} />
        </div>

        {/* Effective summary */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5 text-xs text-blue-700">
          {summarizePreference({
            hour: reminderHour,
            amPm: reminderAmPm,
            offsetDays: effectiveOffsetDays,
            repeat: reminderRepeat,
          })}
        </div>

        <Button onClick={saveReminderPreferences} disabled={isSavingReminders} className="h-9 text-sm">
          {isSavingReminders ? "Saving…" : "Save reminder preferences"}
        </Button>
      </section>

      {/* Change Password Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Change Password</h2>
        <p className="text-slate-600 mb-4">Update your account password</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <PasswordInput
              id="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <PasswordInput
              id="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <PasswordInput
              id="confirm-password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <Button onClick={handleChangePassword}>Save Password</Button>
        </div>
      </section>

      {/* Change Email Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Change Email</h2>
        <p className="text-slate-600 mb-4">Update your account email address</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="email-current-password">Current Password</Label>
            <PasswordInput
              id="email-current-password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm({...emailForm, currentPassword: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <Button onClick={handleChangeEmail}>Send Verification</Button>
        </div>
      </section>

      {/* Profile Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Profile</h2>
        <p className="text-slate-600 mb-4">Manage your personal information</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={userData.username}
              onChange={(e) => setUserData({...userData, username: e.target.value})}
              className="max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <div className="relative">
              <DatePicker
                id="dob"
                selected={userData.dob}
                onChange={(date: Date | null) => setUserData({...userData, dob: date})}
                className="w-full p-2 border border-slate-300 rounded-md"
                dateFormat="MM/dd/yyyy"
                placeholderText="Select date"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={userData.country} onValueChange={(value) => setUserData({...userData, country: value})}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <PhoneInput
              id="mobile"
              placeholder="Enter mobile number"
              value={userData.mobile}
              onChange={(value) => setUserData({...userData, mobile: value || ""})}
              className="w-full max-w-xs"
            />
          </div>
        </div>

        <Button className="mt-6" onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </section>

      {/* Support Query Section */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Support / Contact Admin</h2>
        <p className="text-slate-600 mb-4">Submit a support request or feedback</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="support-category">Category</Label>
            <Select value={supportForm.category} onValueChange={(value) => setSupportForm({...supportForm, category: value})}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bug Report">Bug Report</SelectItem>
                <SelectItem value="Feature Request">Feature Request</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={supportForm.message}
              onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
              placeholder="Describe your issue or suggestion..."
              className="max-w-2xl h-32"
            />
          </div>

          <Button onClick={handleSubmitSupport}>Submit Query</Button>
        </div>

        {/* Past Queries */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Your Past Queries</h3>

          {supportQueries.length === 0 ? (
            <p className="text-slate-500 italic">No support queries submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {supportQueries.map((query) => (
                <div key={query.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {query.category}
                      </span>
                      <p className="mt-2 text-slate-700">{query.message}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {format(new Date(query.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      query.status === "open"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}