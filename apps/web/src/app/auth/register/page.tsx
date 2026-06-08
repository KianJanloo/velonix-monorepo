import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import AuthPagesLayout from "@/components/templates/AuthPagesLayout";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthPagesLayout
      card_name="Create Account"
      header_information="Your first game is waiting"
    >
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
    </AuthPagesLayout>
  );
}
