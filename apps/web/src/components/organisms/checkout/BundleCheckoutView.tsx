"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import { getStripe } from "@/lib/stripe";
import { useBundleIntent, assetKeys, type BundleIntent } from "@/hooks/useAssets";
import { apiClient } from "@/lib/apiClient";
import { useCurrentUser } from "@/hooks/useAuth";
import { useBundleStore } from "@/stores/bundleStore";
import { Button } from "@/components/atoms/Button";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function PaymentForm({ amount, onDone }: { amount: number; onDone: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/studio?bundle=done` },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Payment failed.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") onDone();
    else {
      setError("Payment is processing. Your components will appear in your library shortly.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="v-card p-6 space-y-5">
      <PaymentElement />
      {error && (
        <p className="text-sm font-ui text-crimson-flame bg-crimson-ghost border border-crimson-flame/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" isLoading={submitting} disabled={!stripe || !elements}>
        Pay {money(amount)}
      </Button>
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        Secured by Stripe. Each component author receives their revenue share.
      </p>
    </form>
  );
}

export function BundleCheckoutView() {
  const router = useRouter();
  const user = useCurrentUser();
  const ids = useBundleStore((s) => s.ids);
  const clearBundle = useBundleStore((s) => s.clear);
  const removeFromBundle = useBundleStore((s) => s.remove);
  const qc = useQueryClient();
  const intent = useBundleIntent();

  const [data, setData] = useState<BundleIntent | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Titles for the line-item list.
  const titleQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: assetKeys.detail(id),
      queryFn: () => apiClient.get<{ id: string; title: string; priceUsd: number | null }>(`/assets/${id}`),
      staleTime: 60_000,
    })),
  });

  const intentMutate = intent.mutate;
  useEffect(() => {
    if (!mounted || !user || ids.length < 2 || data || intent.isPending) return;
    intentMutate(ids, {
      onSuccess: (res) => {
        if (res.clientSecret) setData(res);
        else setInitError("Payments are not configured.");
      },
      onError: (err) => setInitError(err instanceof Error ? err.message : "Could not start checkout."),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, ids, data]);

  const options: StripeElementsOptions | null = useMemo(
    () =>
      data?.clientSecret
        ? {
            clientSecret: data.clientSecret,
            appearance: {
              theme: "night",
              variables: { colorPrimary: "#3ddc97", colorBackground: "#1a1410", colorText: "#f0e6d2", borderRadius: "8px" },
            },
          }
        : null,
    [data?.clientSecret],
  );

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">{children}</div>
    </div>
  );

  if (!mounted) return null;
  if (!user) {
    router.replace("/auth/login?next=/checkout/bundle");
    return null;
  }

  if (done)
    return shell(
      <div className="v-card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-ghost flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#3ddc97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold mb-1">Bundle purchased</h2>
        <p className="text-soft-gray text-sm font-ui mb-6">All components are now in your library.</p>
        <Button variant="primary" onClick={() => router.push("/studio")}>Back to studio</Button>
      </div>,
    );

  if (ids.length < 2)
    return shell(
      <div className="v-card p-8 text-center">
        <p className="font-display text-xl font-bold mb-2">Your bundle is empty</p>
        <p className="text-soft-gray text-sm font-ui mb-4">Add at least 2 paid components to build a bundle.</p>
        <Link href="/studio" className="text-emerald-glow text-sm font-ui">← Back to studio</Link>
      </div>,
    );

  return shell(
    <>
      <h1 className="font-display text-2xl font-bold tracking-display mb-1">Build your bundle</h1>
      <p className="text-soft-gray text-sm font-ui mb-5">{ids.length} components</p>

      {/* Line items */}
      <div className="v-card p-4 mb-4 space-y-2">
        {titleQueries.map((q, i) => {
          const id = ids[i]!;
          return (
            <div key={id} className="flex items-center justify-between gap-2 text-sm font-ui">
              <span className="text-parchment-light truncate flex-1">
                {q.data?.title ?? "…"}
              </span>
              <span className="text-soft-gray font-mono">{q.data?.priceUsd != null ? money(q.data.priceUsd) : ""}</span>
              <button
                onClick={() => { removeFromBundle(id); setData(null); }}
                className="text-soft-gray-dark hover:text-crimson-flame text-xs px-1"
                title="Remove"
              >
                ×
              </button>
            </div>
          );
        })}
        {data && (
          <div className="border-t border-warm-wood pt-2 mt-2 space-y-1 text-sm font-ui">
            <div className="flex justify-between text-soft-gray"><span>Subtotal</span><span className="font-mono">{money(data.subtotal)}</span></div>
            <div className="flex justify-between text-emerald-glow"><span>Bundle discount</span><span className="font-mono">−{money(data.discount)}</span></div>
            <div className="flex justify-between text-parchment-light font-bold"><span>Total</span><span className="font-mono">{money(data.total)}</span></div>
          </div>
        )}
      </div>

      {initError ? (
        <div className="v-card p-6"><p className="text-sm font-ui text-crimson-flame">{initError}</p></div>
      ) : options && data ? (
        <Elements stripe={getStripe()} options={options}>
          <PaymentForm
            amount={data.total}
            onDone={() => {
              setDone(true);
              clearBundle();
              void qc.invalidateQueries({ queryKey: assetKeys.library() });
            }}
          />
        </Elements>
      ) : (
        <div className="v-card p-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          <span className="text-sm text-soft-gray font-ui">Preparing secure payment…</span>
        </div>
      )}
    </>,
  );
}
