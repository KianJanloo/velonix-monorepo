import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import { VelonixLogo } from "@/components/atoms";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-deep-void flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center gap-2 group">
            <VelonixLogo />
            <span className="font-display text-lg font-bold tracking-display text-royal-gold">
              VELONIX
            </span>
          </Link>
          <p className="text-soft-gray text-sm mt-3 font-ui">
            Your first game is waiting
          </p>
        </div>

        <div className="v-card p-8">
          <h1 className="font-display text-xl font-bold tracking-display text-parchment-light mb-6 text-center">
            Create Account
          </h1>
          <RegisterForm />
          <div className="mt-6 text-center">
            <p className="text-soft-gray text-sm font-ui">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-emerald-glow hover:text-emerald-bright transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
