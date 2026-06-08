import type { Metadata } from "next";
import { ResetPassForm } from "@/components/organisms/ResetPassForm";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";
import { Suspense } from "react";

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
    </AuthPagesLayout>
  );
}
