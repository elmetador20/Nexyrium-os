"use client";

import React, { useState } from "react";
import { SystemSettings } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/loading-button";
import { toast } from "sonner";
import { Save, ShieldCheck, Globe, HelpCircle } from "lucide-react";

export function SettingsView() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: "NexyriumOS",
    logoUrl: "",
    timezone: "UTC",
    currency: "USD",
    theme: "dark",
    allowPublicSignup: false,
    requireMfa: false
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API saving
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    toast.success("System configurations saved successfully.");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl text-xs select-none">
      {/* Company settings group */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-[#1E293B] pb-2">
          <Globe className="h-4 w-4 text-blue-500" />
          General Agency Profiles
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Agency Name</label>
            <Input
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs h-9"
            />
          </div>
          
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Logo Assets (URL)</label>
            <Input
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="e.g. https://fundraisingstudio.com/logo.svg"
              className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Primary Timezone</label>
            <Select 
              value={settings.timezone}
              onValueChange={(val) => setSettings({ ...settings, timezone: val || "UTC" })}
            >
              <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-200 h-9 text-xs">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-200 text-xs">
                <SelectItem value="UTC">UTC / Coordinated Universal Time</SelectItem>
                <SelectItem value="EST">EST / Eastern Standard Time (New York)</SelectItem>
                <SelectItem value="IST">IST / Indian Standard Time (Delhi)</SelectItem>
                <SelectItem value="GMT">GMT / Greenwich Mean Time (London)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Default Valuation Currency</label>
            <Select 
              value={settings.currency}
              onValueChange={(val) => setSettings({ ...settings, currency: val || "USD" })}
            >
              <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-200 h-9 text-xs">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-200 text-xs">
                <SelectItem value="USD">USD ($) - United States Dollar</SelectItem>
                <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Security settings group */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0F172A]/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-[#1E293B] pb-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Security & Access Policies
        </h3>

        <div className="space-y-4">
          {/* Public signup toggle */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <label className="font-bold text-white">Enable Open Client Registration</label>
              <p className="text-[10px] text-zinc-400">Allow any client visitor to request approval profiles from login page.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowPublicSignup}
              onChange={(e) => setSettings({ ...settings, allowPublicSignup: e.target.checked })}
              className="rounded bg-[#090D16] border-[#1E293B] text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-1"
            />
          </div>

          <div className="h-px bg-[#1E293B]" />

          {/* MFA toggle */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <label className="font-bold text-white">Require Multi-Factor Authentication (MFA)</label>
              <p className="text-[10px] text-zinc-400">Enforce all internal employees to complete OTP verification on active sessions.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireMfa}
              onChange={(e) => setSettings({ ...settings, requireMfa: e.target.checked })}
              className="rounded bg-[#090D16] border-[#1E293B] text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* Save Trigger */}
      <div className="flex justify-end gap-2">
        <LoadingButton
          type="submit"
          loading={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 px-5 h-9 rounded-lg transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          Save Configurations
        </LoadingButton>
      </div>
    </form>
  );
}
