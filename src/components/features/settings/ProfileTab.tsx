"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "react-hot-toast";

type UserData = {
  theme: string;
  username: string;
  dob: Date | null;
  country: string;
  mobile: string;
  email: string;
};

export default function ProfileTab({
  userData,
  setUserData,
}: {
  userData: UserData;
  setUserData: (data: UserData) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-1">
          Personal Information
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your basic profile details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">
            Username
          </Label>
          <Input
            id="username"
            value={userData.username}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            placeholder="e.g. janesmith"
            className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob" className="text-slate-700 dark:text-slate-300">
            Date of Birth
          </Label>
          <div className="relative">
            <DatePicker
              id="dob"
              selected={userData.dob}
              onChange={(date: Date | null) =>
                setUserData({ ...userData, dob: date })
              }
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-black/20 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-indigo-500"
              dateFormat="MM/dd/yyyy"
              placeholderText="Select date"
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="text-slate-700 dark:text-slate-300">
            Country
          </Label>
          <Select
            value={userData.country}
            onValueChange={(value) =>
              setUserData({ ...userData, country: value })
            }
          >
            <SelectTrigger className="w-full bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10">
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

        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-slate-700 dark:text-slate-300">
            Mobile Number
          </Label>
          <PhoneInput
            id="mobile"
            placeholder="Enter mobile number"
            value={userData.mobile}
            onChange={(value) =>
              setUserData({ ...userData, mobile: value || "" })
            }
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white/50 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:border-white/10 dark:bg-black/20 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-within:ring-indigo-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-white/10">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all duration-200"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
