"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { VelonixLogo } from "../atoms";

export default function AuthPagesLayout({
  children,
  header_information,
  card_name,
}: {
  children: React.ReactNode;
  header_information: string;
  card_name: string;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);
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
          <p className="text-soft-gray text-sm mt-3 font-ui">
            {header_information}
          </p>
        </div>

        {/* Card */}
        <div className="v-card p-8">
          <h1 className="font-display text-xl font-bold tracking-display text-parchment-light mb-6 text-center">
            {card_name}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
