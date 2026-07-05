"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { loginSchema, LoginInput } from "@/lib/schemas/auth";
import { PasswordInput } from "@/components/password-input";
import { LoadingButton } from "@/components/loading-button";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Check if redirect has status parameters
  const statusParam = searchParams.get("status");
  React.useEffect(() => {
    if (statusParam) {
      if (statusParam === "PENDING_APPROVAL") {
        setInfoMessage(
          "Your account has been created successfully and is awaiting administrator approval. You will receive access once your account has been approved."
        );
      } else if (statusParam === "REJECTED") {
        setFormError(
          "Your account request has been declined. Please contact the administrator for more information."
        );
      } else if (statusParam === "SUSPENDED") {
        setFormError(
          "Your account has been temporarily suspended. Please contact your administrator."
        );
      }
    }
  }, [statusParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setLoading(true);
    setFormError(null);
    setInfoMessage(null);

    try {
      const result = await loginAction(values);
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.redirectUrl) {
        router.push(result.redirectUrl);
      }
    } catch (err) {
      setFormError("An unexpected login error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError(null);
    setInfoMessage(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setFormError(error.message);
    } catch (err) {
      setFormError("Failed to initiate Google sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);
    
    // Quick prompt for email
    const emailInput = window.prompt("Enter your email address to reset password:");
    if (!emailInput) return;
    
    if (!z.string().email().safeParse(emailInput).success) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setFormError(error.message);
      } else {
        setInfoMessage("Password reset email sent. Please check your inbox.");
      }
    } catch (err) {
      setFormError("Failed to request password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-705 bg-zinc-900 p-8 shadow-2xl">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
        <p className="text-xs text-zinc-400">
          Enter your credentials to access the internal CRM
        </p>
      </div>

      <AnimatePresence mode="wait">
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-400"
          >
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <p className="leading-normal">{formError}</p>
          </motion.div>
        )}

        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-400"
          >
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <p className="leading-normal">{infoMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase pl-0.5 font-mono">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute top-1/2 left-4.5 -translate-y-1/2 text-zinc-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              placeholder="name@fundraisingstudio.com"
              className={`h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 py-2 text-base text-white transition-all placeholder:text-zinc-650 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 outline-none md:text-sm ${
                errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
              }`}
              disabled={loading}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 pl-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between pl-0.5">
            <label className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-mono">
              Password
            </label>
            <a
              href="#"
              onClick={handleForgotPassword}
              className="text-xs text-amber-500 hover:text-amber-400 font-bold transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <PasswordInput
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            disabled={loading}
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2 py-0.5 pl-0.5">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500/40 focus:ring-offset-zinc-950 accent-amber-500"
          />
          <label
            htmlFor="rememberMe"
            className="text-xs text-zinc-400 font-medium select-none cursor-pointer hover:text-white transition-colors"
          >
            Remember me on this device
          </label>
        </div>

        {/* Login Button */}
        <div className="pt-2">
          <LoadingButton 
            type="submit" 
            loading={loading}
            className="h-11 w-full rounded-xl bg-amber-500 text-black hover:bg-amber-450 font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-amber-500 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(245,179,1,0.15)]"
          >
            <span className="flex items-center justify-center gap-2">
              Access Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
            </span>
          </LoadingButton>
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono">
          <span className="bg-zinc-900 px-3.5 text-zinc-500 font-bold">Or continue with</span>
        </div>
      </div>

      {/* OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-850 hover:text-white text-zinc-300 font-bold text-xs uppercase tracking-wider font-mono transition-all focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:opacity-50 cursor-pointer"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="mt-6 text-center text-xs">
        <span className="text-zinc-500">Don't have an account? </span>
        <Link
          href="/signup"
          className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
        >
          Request Access
        </Link>
      </div>
    </div>
  );
}
