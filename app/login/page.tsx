import { AuthLayout } from "@/components/auth-layout";
import { LoginCard } from "@/components/login-card";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login | NexyriumOS",
  description: "Secure login access to the NexyriumOS internal portal.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center text-zinc-400 text-xs">
            Loading secure connection...
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </AuthLayout>
  );
}
