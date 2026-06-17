import type { Metadata } from "next";
import { SettingsTabs } from "@/components/organisms/profile/SettingsTabs";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-8">
          Settings
        </h1>
        <SettingsTabs />
      </div>
    </div>
  );
}
