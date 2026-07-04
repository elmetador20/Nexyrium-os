"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "../types";
import { LoadingButton } from "@/components/loading-button";
import { KeyRound, Mail, Sparkles } from "lucide-react";

const userSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Please select a department"),
  roleId: z.string().min(1, "Please select a role"),
  status: z.enum(["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"]),
  tempPassword: z.string().min(6, "Password must be at least 6 characters"),
  sendEmail: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSubmit: (values: UserFormValues) => Promise<void>;
}

export function CreateUserModal({ open, onOpenChange, roles, onSubmit }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      department: "Operations",
      roleId: "",
      status: "ACTIVE",
      tempPassword: "",
      sendEmail: true,
    },
  });

  const watchTempPassword = watch("tempPassword");

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("tempPassword", password);
    setGeneratedPassword(password);
  };

  const handleFormSubmit = async (values: any) => {
    setLoading(true);
    try {
      await onSubmit(values);
      reset();
      setGeneratedPassword("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0F172A] border-[#1E293B] text-zinc-100 p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Invite System Employee
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Create a user profile, pre-assign their role/department, and generate credential details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Full Name</label>
            <Input
              {...register("fullName")}
              placeholder="e.g. John Doe"
              className="bg-[#090D16] border-[#1E293B] text-zinc-100 placeholder-zinc-500 text-xs focus:ring-[#3B82F6]"
            />
            {errors.fullName && <p className="text-red-400 text-[10px]">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Email Address</label>
            <Input
              type="email"
              {...register("email")}
              placeholder="e.g. john@fundraisingstudio.com"
              className="bg-[#090D16] border-[#1E293B] text-zinc-100 placeholder-zinc-500 text-xs focus:ring-[#3B82F6]"
            />
            {errors.email && <p className="text-red-400 text-[10px]">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Phone (Optional)</label>
              <Input
                {...register("phone")}
                placeholder="+1 (555) 019-2834"
                className="bg-[#090D16] border-[#1E293B] text-zinc-100 placeholder-zinc-500 text-xs focus:ring-[#3B82F6]"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Department</label>
              <Select 
                defaultValue="Operations"
                onValueChange={(val) => setValue("department", val || "Operations")}
              >
                <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-100 text-xs">
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="External Client">External Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role selection */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Role</label>
              <Select 
                onValueChange={(val: any) => setValue("roleId", val || "")}
              >
                <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs">
                  <SelectValue placeholder="Assign role" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-100 text-xs">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && <p className="text-red-400 text-[10px]">{errors.roleId.message}</p>}
            </div>

            {/* Status selection */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Status</label>
              <Select 
                defaultValue="ACTIVE"
                onValueChange={(val) => setValue("status", (val || "ACTIVE") as any)}
              >
                <SelectTrigger className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-[#1E293B] text-zinc-100 text-xs">
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Temporary Password Generation */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300">Temporary Password</label>
            <div className="flex gap-2">
              <Input
                {...register("tempPassword")}
                placeholder="Password"
                className="bg-[#090D16] border-[#1E293B] text-zinc-100 text-xs font-mono"
              />
              <Button
                type="button"
                onClick={generatePassword}
                variant="outline"
                className="border-[#1E293B] hover:bg-[#1E293B] gap-1 px-3 text-xs"
              >
                <KeyRound className="h-3.5 w-3.5 text-blue-500" />
                Generate
              </Button>
            </div>
            {errors.tempPassword && <p className="text-red-400 text-[10px]">{errors.tempPassword.message}</p>}
          </div>

          {/* Invite email placeholder option */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="sendEmail"
              {...register("sendEmail")}
              className="rounded bg-[#090D16] border-[#1E293B] text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <label htmlFor="sendEmail" className="font-semibold text-zinc-400 flex items-center gap-1 cursor-pointer">
              <Mail className="h-3.5 w-3.5 text-zinc-500" />
              Send Welcome Invitation Email (Placeholder)
            </label>
          </div>

          <DialogFooter className="pt-4 border-t border-[#1E293B] mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4"
            >
              Send Invite
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
