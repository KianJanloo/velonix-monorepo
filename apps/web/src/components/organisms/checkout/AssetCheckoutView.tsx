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
import { useQueryClient } from "@tanstack/react-query";
import { getStripe } from "@/lib/stripe";
import { useAsset, usePurchaseAssetIntent, assetKeys } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useAuth";
import { Button } from "@/components/atoms/Button";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function PaymentForm({
  assetId,
  title,
  amount,
}: {
  assetId: string;
  title: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/studio?asset=${assetId}`,
      },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Payment failed.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      setDone(true);
      void qc.invalidateQueries({ queryKey: assetKeys.library() });
    } else {
      setError(
        "Payment is processing. Your asset will appear in your library shortly.",
      );
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="v-card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-ghost flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="#3ddc97"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-parchment-light mb-1">
          Purchase complete
        </h2>
        <p className="text-soft-gray text-sm font-ui mb-6">
          <span className="text-parchment-light font-semibold">{title}</span> is
          now in your component library.
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          Back to studio
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="v-card p-6 space-y-5">
      <PaymentElement />
      {error && (
        <p className="text-sm font-ui text-crimson-flame bg-crimson-ghost border border-crimson-flame/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={submitting}
        disabled={!stripe || !elements}
      >
        Pay {money(amount)}
      </Button>
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        Secured by Stripe. The asset author receives a revenue share of every
        sale.
      </p>
    </form>
  );
}

export function AssetCheckoutView({ assetId }: { assetId: string }) {
  const router = useRouter();
  const { data: asset, isLoading } = useAsset(assetId);
  const user = useCurrentUser();
  const purchase = usePurchaseAssetIntent();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const purchaseMutate = purchase.mutate;
  useEffect(() => {
    if (!mounted || !asset || clientSecret || purchase.isPending) return;
    if (asset.isFree) return;
    purchaseMutate(assetId, {
      onSuccess: (res) => {
        if (res.clientSecret) {
          setClientSecret(res.clientSecret);
          setAmount(res.amount);
        } else setInitError("Payments are not configured.");
      },
      onError: (err) =>
        setInitError(
          err instanceof Error ? err.message : "Could not start checkout.",
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, asset, assetId]);

  const options: StripeElementsOptions | null = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#3ddc97",
                colorBackground: "#1a1410",
                colorText: "#f0e6d2",
                borderRadius: "8px",
              },
            },
          }
        : null,
    [clientSecret],
  );

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">{children}</div>
    </div>
  );

  if (!asset)
    return shell(
      <div className="v-card p-8 text-center">
        <p className="font-display text-xl font-bold mb-2">Asset not found</p>
        <Link href="/studio" className="text-emerald-glow text-sm font-ui">
          ← Back to studio
        </Link>
      </div>,
    );
  if (!user) {
    router.replace(`/auth/login?next=/checkout/asset/${assetId}`);
    return null;
  }
  if (asset.isFree)
    return shell(
      <div className="v-card p-8 text-center">
        <p className="font-display text-xl font-bold mb-2">
          This asset is free
        </p>
        <p className="text-soft-gray text-sm font-ui">
          Grab it from the studio marketplace.
        </p>
      </div>,
    );

  return shell(
    <>
      <h1 className="font-display text-2xl font-bold tracking-display mb-1">
        Buy component
      </h1>
      <p className="text-soft-gray text-sm font-ui mb-5">
        <span className="text-parchment-light font-semibold">
          {asset.title}
        </span>
        {asset.authorUsername && <> · by {asset.authorUsername}</>} ·{" "}
        {money(asset.priceUsd ?? amount)}
      </p>
      {initError ? (
        <div className="v-card p-6">
          <p className="text-sm font-ui text-crimson-flame">{initError}</p>
        </div>
      ) : options ? (
        <Elements stripe={getStripe()} options={options}>
          <PaymentForm
            assetId={assetId}
            title={asset.title}
            amount={amount || asset.priceUsd || 0}
          />
        </Elements>
      ) : (
        <div className="v-card p-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          <span className="text-sm text-soft-gray font-ui">
            Preparing secure payment…
          </span>
        </div>
      )}
    </>,
  );
}
