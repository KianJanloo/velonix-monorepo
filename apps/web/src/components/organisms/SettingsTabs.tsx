"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfile";
import { UpdateProfileSchema, type UpdateProfileDto } from "@velonix/game-engine";

type Tab = "profile" | "billing" | "notifications" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing & Subscription" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Danger Zone" },
];

const TIER_LABELS: Record<string, { label: string; price: string }> = {
  free: { label: "Free Plan", price: "Free forever" },
  creator: { label: "Creator Plan", price: "$12/month" },
  pro: { label: "Pro Plan", price: "$29/month" },
  studio: { label: "Studio Plan", price: "$79/month" },
};

function ProfileTab() {
  const user = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileDto>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      bio: user?.bio ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => updateProfile.mutate(data))}
      className="v-card p-6 flex flex-col gap-5"
    >
      <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light">
        Profile Settings
      </h2>
      <Input
        {...register("displayName")}
        label="Display Name"
        error={!!errors.displayName}
        errorMessage={errors.displayName?.message}
      />
      <div>
        <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">
          Bio
        </label>
        <textarea
          {...register("bio")}
          className="v-input resize-none h-24"
          placeholder="Tell the community about yourself..."
        />
        {errors.bio && (
          <p className="text-xs text-crimson-flame mt-1 font-ui">{errors.bio.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting || updateProfile.isPending}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const user = useCurrentUser();
  const tier = TIER_LABELS[user?.subscriptionTier ?? "free"] ?? { label: "Free Plan", price: "Free forever" };

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
        {activeTab === "profile" && <ProfileTab />}

        {activeTab === "billing" && (
          <div className="v-card p-6">
            <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
              Billing &amp; Subscription
            </h2>
            <div className="flex items-center justify-between p-4 bg-emerald-ghost border border-emerald-glow/20 rounded-lg mb-6">
              <div>
                <p className="text-sm font-ui font-semibold text-emerald-glow">{tier.label}</p>
                <p className="text-xs text-soft-gray font-ui">{tier.price}</p>
              </div>
              {user?.subscriptionTier !== "free" && (
                <Button variant="outline" size="sm">Manage</Button>
              )}
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
