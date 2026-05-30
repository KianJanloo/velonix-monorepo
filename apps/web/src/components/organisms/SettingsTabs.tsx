"use client";

import { useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";

type Tab = "profile" | "billing" | "notifications" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing & Subscription" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Danger Zone" },
];

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="flex gap-8">
      {/* Sidebar nav */}
      <nav className="w-48 shrink-0 flex flex-col gap-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`v-nav-item ${activeTab === id ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === "profile" && (
          <div className="v-card p-6 flex flex-col gap-5">
            <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light">
              Profile Settings
            </h2>
            <Input label="Display Name" defaultValue="stormrider" />
            <div>
              <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">
                Bio
              </label>
              <textarea
                className="v-input resize-none h-24"
                placeholder="Tell the community about yourself..."
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="v-card p-6">
            <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
              Billing &amp; Subscription
            </h2>
            <div className="flex items-center justify-between p-4 bg-emerald-ghost border border-emerald-glow/20 rounded-lg mb-6">
              <div>
                <p className="text-sm font-ui font-semibold text-emerald-glow">Pro Plan</p>
                <p className="text-xs text-soft-gray font-ui">$29/month · Renews Feb 1, 2025</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <p className="text-soft-gray text-sm font-ui">
              Manage payment methods and invoices through the Stripe customer portal.
            </p>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="v-card p-6">
            <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
              Notifications
            </h2>
            <p className="text-soft-gray text-sm font-ui">Notification preferences coming soon.</p>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="v-card p-6 border-crimson-flame/30">
            <h2 className="font-display text-lg font-semibold tracking-display text-crimson-flame mb-5">
              Danger Zone
            </h2>
            <div className="flex items-center justify-between p-4 bg-crimson-ghost border border-crimson-flame/20 rounded-lg">
              <div>
                <p className="text-sm font-ui font-semibold text-parchment-light">Delete Account</p>
                <p className="text-xs text-soft-gray font-ui">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <Button variant="danger" size="sm">Delete Account</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
