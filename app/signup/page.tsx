import { AuthLayout } from "@/components/auth-layout";
import { SignupCard } from "@/components/signup-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Access | NexyriumOS",
  description: "Request an account to join the NexyriumOS internal portal.",
};

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupCard />
    </AuthLayout>
  );
}
