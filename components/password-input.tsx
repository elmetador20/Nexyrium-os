"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1">
        <div className="relative">
          {/* Prefix Icon */}
          <div className="absolute top-1/2 left-4.5 -translate-y-1/2 text-[#94A3B8]">
            <Lock className="h-4 w-4" />
          </div>

          <input
            type={showPassword ? "text" : "password"}
            className={`h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-11 py-2 text-base text-white transition-all placeholder:text-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
            } ${className || ""}`}
            ref={ref}
            {...props}
          />

          {/* Suffix Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-[#EF4444] mt-1 pl-1" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
