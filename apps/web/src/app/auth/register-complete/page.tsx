import type { Metadata } from "next";
import Link from "next/link";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";
import { RegisterCompleteForm } from "@/components/organisms/RegisterCompleteForm";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterCompletePage() {
  return (
    <AuthPagesLayout card_name="Create Account">
      <RegisterCompleteForm />
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
    </AuthPagesLayout>
  );
}
