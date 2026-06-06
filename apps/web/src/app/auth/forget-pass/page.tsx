import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/organisms/LoginForm";
import { VelonixLogo } from "@/components/atoms";
import { ForgetPassForm } from "@/components/organisms/ForgetPassForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-deep-void flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center gap-2 group">
            <VelonixLogo />
            <span className="font-display text-lg font-bold tracking-display text-royal-gold group-hover:text-royal-gold-bright transition-colors">
              VELONIX
            </span>
          </Link>
          <p className="text-soft-gray text-sm mt-3 font-ui">Welcome back to the table</p>
        </div>

        {/* Card */}
        <div className="v-card p-8">
          <h1 className="font-display text-xl font-bold tracking-display text-parchment-light mb-6 text-center">
            Forget Password
          </h1>
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" /></div>}>
            <ForgetPassForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
