"use client";

import { useState, useEffect } from "react";
import { User, Settings as SettingsIcon, Shield, LifeBuoy } from "lucide-react";
import ProfileTab from "@/components/features/settings/ProfileTab";
import PreferencesTab from "@/components/features/settings/PreferencesTab";
import SecurityTab from "@/components/features/settings/SecurityTab";
import SupportTab from "@/components/features/settings/SupportTab";

type TabType = "profile" | "preferences" | "security" | "support";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // Shared state
  const [userData, setUserData] = useState({
    theme: "light",
    username: "",
    dob: null as Date | null,
    country: "India",
    mobile: "",
    email: "",
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });

  // Reminder preferences state
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderAmPm, setReminderAmPm] = useState<"AM" | "PM">("AM");
  const [reminderOffsetDays, setReminderOffsetDays] = useState(0);
  const [reminderRepeat, setReminderRepeat] = useState(false);
  const [offsetPreset, setOffsetPreset] = useState("0");
  const [customOffsetDays, setCustomOffsetDays] = useState(1);

  const [loading, setLoading] = useState(true);

  // Helper to map DB value to preset
  const defaultReminderOffset = (offsetDays: number) => {
    const presets = [0, 1, 2, 3, 7];
    return presets.includes(offsetDays) ? String(offsetDays) : "other";
  };

  useEffect(() => {
    // Check URL for tab parameter (e.g. ?tab=support)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["profile", "preferences", "security", "support"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          setUserData({
            theme: data.theme || "system", // default to system if not set
            username: data.username || "",
            dob: data.dob ? new Date(data.dob) : null,
            country: data.country || "India",
            mobile: data.mobile || "",
            email: data.email || "",
          });
          
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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: SettingsIcon },
    { id: "security", label: "Security", icon: Shield },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto w-full">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-sm min-h-[500px]">
        {activeTab === "profile" && (
          <ProfileTab userData={userData} setUserData={setUserData} />
        )}
        {activeTab === "preferences" && (
          <PreferencesTab
            userData={userData}
            setUserData={setUserData}
            reminderHour={reminderHour}
            setReminderHour={setReminderHour}
            reminderAmPm={reminderAmPm}
            setReminderAmPm={setReminderAmPm}
            reminderOffsetDays={reminderOffsetDays}
            setReminderOffsetDays={setReminderOffsetDays}
            reminderRepeat={reminderRepeat}
            setReminderRepeat={setReminderRepeat}
            offsetPreset={offsetPreset}
            setOffsetPreset={setOffsetPreset}
            customOffsetDays={customOffsetDays}
            setCustomOffsetDays={setCustomOffsetDays}
          />
        )}
        {activeTab === "security" && (
          <SecurityTab emailForm={emailForm} setEmailForm={setEmailForm} />
        )}
        {activeTab === "support" && <SupportTab />}
      </div>
    </div>
  );
}