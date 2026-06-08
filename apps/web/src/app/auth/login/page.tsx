import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/organisms/LoginForm";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthPagesLayout
      card_name="Sign In"
      header_information="Welcome back to the table"
    >
      <Suspense
        fallback={
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <div className="mt-6 text-center">
        <p className="text-soft-gray text-sm font-ui">
          No account?{" "}
          <Link
            href="/auth/register"
            className="text-emerald-glow hover:text-emerald-bright transition-colors"
          >
            Create one free
          </Link>
        </p>
      </div>
    </AuthPagesLayout>
  );
}
