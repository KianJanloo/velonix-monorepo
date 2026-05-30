import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/organisms/RegisterForm";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-deep-void flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center gap-2 group">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="vrg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b49a" />
                  <stop offset="50%" stopColor="#f5c451" />
                  <stop offset="100%" stopColor="#c4b49a" />
                </linearGradient>
              </defs>
              <polyline points="8,18 40,62 72,18" fill="none" stroke="url(#vrg)" strokeWidth="5" strokeLinejoin="miter" />
              <polyline points="18,18 40,52 62,18" fill="none" stroke="url(#vrg)" strokeWidth="3" strokeLinejoin="miter" opacity="0.45" />
              <circle cx="40" cy="15" r="3.5" fill="url(#vrg)" />
            </svg>
            <span className="font-display text-lg font-bold tracking-display text-royal-gold">VELONIX</span>
          </Link>
          <p className="text-soft-gray text-sm mt-3 font-ui">Your first game is waiting</p>
        </div>

        <div className="v-card p-8">
          <h1 className="font-display text-xl font-bold tracking-display text-parchment-light mb-6 text-center">
            Create Account
          </h1>
          <RegisterForm />
          <div className="mt-6 text-center">
            <p className="text-soft-gray text-sm font-ui">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-glow hover:text-emerald-bright transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
