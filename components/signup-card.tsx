"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, AlertCircle, CheckCircle, Briefcase } from "lucide-react";
import { signupAction } from "@/app/actions/auth";
import { signupSchema, SignupInput } from "@/lib/schemas/auth";
import { PasswordInput } from "@/components/password-input";
import { LoadingButton } from "@/components/loading-button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function SignupCard() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<{ email: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "CLIENT",
    },
  });

  const onSubmit = async (values: SignupInput) => {
    setLoading(true);
    setFormError(null);

    try {
      const result = await signupAction(values);
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.success) {
        setSuccessState({ email: result.email });
      }
    } catch (err) {
      setFormError("An unexpected error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successState) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-zinc-705 bg-zinc-900 p-8 shadow-2xl space-y-6 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450">
          <CheckCircle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Request Submitted</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your account request for <span className="text-white font-semibold">{successState.email}</span> has been successfully submitted.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4.5 text-xs text-amber-400 text-left leading-relaxed">
          <span className="font-semibold block mb-1">Approval Pending:</span>
          Your account is currently awaiting administrator approval. You will receive access and be able to log in once your account request has been reviewed and approved.
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider font-mono cursor-pointer transition shadow-[0_0_20px_rgba(245,179,1,0.1)]"
          >
            Return to Login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-705 bg-zinc-900 p-8 shadow-2xl">
      <div className="mb-6 space-y-1.5 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">Request Access</h2>
        <p className="text-xs text-zinc-400">
          Submit a request to join the NexyriumOS portal
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

        {/* Role Field */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase pl-0.5 font-mono">
            Requested Role
          </label>
          <div className="relative">
            <div className="absolute top-1/2 left-4.5 -translate-y-1/2 text-zinc-500">
              <Briefcase className="h-4 w-4" />
            </div>
            <select
              className={`h-11 w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 py-2 text-base text-white transition-all placeholder:text-zinc-650 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 outline-none md:text-sm appearance-none cursor-pointer ${
                errors.role ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
              }`}
              disabled={loading}
              {...register("role")}
            >
              <option value="CLIENT">Client</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="RESEARCHER">Researcher</option>
              <option value="CONTENT_WRITER">Content Writer</option>
              <option value="DESIGNER">Designer</option>
              <option value="QA">Quality Assurance (QA)</option>
              <option value="FINANCE">Finance</option>
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4.5 text-zinc-550">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p className="text-xs text-red-500 mt-1 pl-1" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase pl-0.5 font-mono">
            Password
          </label>
          <PasswordInput
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            disabled={loading}
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <LoadingButton 
            type="submit" 
            loading={loading}
            className="h-11 w-full rounded-xl bg-amber-500 text-black hover:bg-amber-450 font-bold text-xs uppercase tracking-wider transition-all focus-visible:ring-amber-500 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(245,179,1,0.15)]"
          >
            <span className="flex items-center justify-center gap-2">
              Submit Access Request
              <ArrowRight className="h-4 w-4" />
            </span>
          </LoadingButton>
        </div>
      </form>

      <div className="mt-6 text-center text-xs">
        <span className="text-zinc-500">Already registered? </span>
        <Link
          href="/login"
          className="text-amber-500 hover:text-amber-400 font-bold transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
