import type { Metadata } from "next";
import { ResetPassForm } from "@/components/organisms/ResetPassForm";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";
import { Suspense } from "react";
import Link from "next/dist/client/link";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthPagesLayout
      card_name="Reset Password"
      header_information="Reset your password and login again."
    >
      <Suspense
        fallback={
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          </div>
        }
      >
        <ResetPassForm />
      </Suspense>
      <div className="mt-6 text-center">
        <p className="text-soft-gray text-sm font-ui">
          Would you like to change your email?{" "}
          <Link
            href="/auth/login"
            className="text-emerald-glow hover:text-emerald-bright transition-colors"
          >
            Update your email
          </Link>
        </p>
      </div>
    </AuthPagesLayout>
  );
}
