"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useSubscriptionPortal } from "@/hooks/useSubscriptions";
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

const NOTIFICATION_PREFS = [
  { id: "sales", label: "Sales & purchases", desc: "When someone buys your game" },
  { id: "reviews", label: "New reviews", desc: "When a player reviews your game" },
  { id: "review_status", label: "Review decisions", desc: "When your game is approved or rejected" },
  { id: "product", label: "Product updates", desc: "New features and platform news" },
  { id: "marketing", label: "Marketing emails", desc: "Tips, promotions, and community highlights" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    sales: true, reviews: true, review_status: true, product: true, marketing: false,
  });
  const [saved, setSaved] = useState(true);

  function toggle(id: string) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
    setSaved(false);
  }

  return (
    <div className="v-card p-6">
      <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
        Email Notifications
      </h2>
      <div className="space-y-1">
        {NOTIFICATION_PREFS.map(({ id, label, desc }) => (
          <div key={id} className="flex items-center justify-between py-3 border-b border-warm-wood/40 last:border-0">
            <div>
              <p className="text-sm font-ui text-parchment-light">{label}</p>
              <p className="text-2xs text-soft-gray font-ui">{desc}</p>
            </div>
            <button
              onClick={() => toggle(id)}
              role="switch"
              aria-checked={prefs[id]}
              className={`relative w-10 h-6 rounded-full transition-colors ${prefs[id] ? "bg-emerald-glow" : "bg-warm-wood"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-deep-void transition-transform ${prefs[id] ? "translate-x-4" : ""}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-5">
        <Button variant="primary" disabled={saved} onClick={() => { setSaved(true); toast.success("Notification preferences saved."); }}>
          {saved ? "Saved" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

function BillingTab({ tier, currentTier }: { tier: { label: string; price: string }; currentTier: string }) {
  const portal = useSubscriptionPortal();
  return (
    <div className="v-card p-6">
      <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
        Billing &amp; Subscription
      </h2>
      <div className="flex items-center justify-between p-4 bg-emerald-ghost border border-emerald-glow/20 rounded-lg mb-6">
        <div>
          <p className="text-sm font-ui font-semibold text-emerald-glow">{tier.label}</p>
          <p className="text-xs text-soft-gray font-ui">{tier.price}</p>
        </div>
        {currentTier !== "free" ? (
          <Button variant="outline" size="sm" isLoading={portal.isPending} onClick={() => portal.mutate()}>
            Manage Billing
          </Button>
        ) : (
          <Link href="/pricing">
            <Button variant="primary" size="sm">Upgrade Plan</Button>
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-soft-gray text-sm font-ui">
          {currentTier !== "free"
            ? "Manage payment methods and invoices through the Stripe customer portal."
            : "Unlock more projects, 3D preview, analytics, and lower commission rates."}
        </p>
        <Link href="/pricing" className="text-emerald-glow text-sm font-ui font-semibold hover:text-emerald-bright transition-colors shrink-0 ml-4">
          View all plans →
        </Link>
      </div>
    </div>
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

        {activeTab === "billing" && <BillingTab tier={tier} currentTier={user?.subscriptionTier ?? "free"} />}

        {activeTab === "notifications" && <NotificationsTab />}

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
              <ConfirmDialog
                title="Delete your account?"
                description="This will permanently delete your account, all your games, and associated data. This action cannot be undone."
                confirmLabel="Delete my account"
                variant="danger"
                onConfirm={() => { toast.error("Account deletion is disabled in this demo environment."); }}
              >
                {(open) => <Button variant="danger" size="sm" onClick={open}>Delete Account</Button>}
              </ConfirmDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
