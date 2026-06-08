import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgetPassForm } from "@/components/organisms/ForgetPassForm";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";
import Link from "next/link";

export const metadata: Metadata = { title: "Forget Password" };

export default function ForgetPassPage() {
  return (
    <AuthPagesLayout card_name="Forget Password">
      <Suspense
        fallback={
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          </div>
        }
      >
        <ForgetPassForm />
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
      </Suspense>
    </AuthPagesLayout>
  );
}
