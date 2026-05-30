import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/organisms/LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-deep-void flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex flex-col items-center gap-2 group">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="vlg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b49a" />
                  <stop offset="50%" stopColor="#f5c451" />
                  <stop offset="100%" stopColor="#c4b49a" />
                </linearGradient>
              </defs>
              <polyline points="8,18 40,62 72,18" fill="none" stroke="url(#vlg)" strokeWidth="5" strokeLinejoin="miter" />
              <polyline points="18,18 40,52 62,18" fill="none" stroke="url(#vlg)" strokeWidth="3" strokeLinejoin="miter" opacity="0.45" />
              <circle cx="40" cy="15" r="3.5" fill="url(#vlg)" />
              <rect x="37.5" y="8" width="5" height="2.5" rx="1" fill="url(#vlg)" />
            </svg>
            <span className="font-display text-lg font-bold tracking-display text-royal-gold group-hover:text-royal-gold-bright transition-colors">
              VELONIX
            </span>
          </Link>
          <p className="text-soft-gray text-sm mt-3 font-ui">Welcome back to the table</p>
        </div>

        {/* Card */}
        <div className="v-card p-8">
          <h1 className="font-display text-xl font-bold tracking-display text-parchment-light mb-6 text-center">
            Sign In
          </h1>
          <LoginForm />
          <div className="mt-6 text-center">
            <p className="text-soft-gray text-sm font-ui">
              No account?{" "}
              <Link href="/auth/register" className="text-emerald-glow hover:text-emerald-bright transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
