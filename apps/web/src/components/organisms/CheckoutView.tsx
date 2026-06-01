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
import { getStripe } from "@/lib/stripe";
import { useGame, usePurchaseGame, gameKeys } from "@/hooks/useGames";
import { useCurrentUser } from "@/hooks/useAuth";
import { Button } from "@/components/atoms/Button";
import { useQueryClient } from "@tanstack/react-query";
import type { GameRecord } from "@/types/game";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Inner form — only rendered once we have a clientSecret + Elements context. */
function PaymentForm({ game, amount }: { game: GameRecord; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const qc = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?purchased=${game.id}`,
      },
      // Keep the user on-page for card payments; only redirect when the chosen
      // method (e.g. a bank redirect) actually requires it.
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      setSucceeded(true);
      // The purchase is recorded asynchronously via Stripe webhook; refresh the
      // library/detail so it appears once processed.
      void qc.invalidateQueries({ queryKey: gameKeys.detail(game.id) });
      void qc.invalidateQueries({ queryKey: ["library"] });
    } else {
      setErrorMessage("Payment is processing. We'll email you once it's confirmed.");
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="v-card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-ghost flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#3ddc97" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-parchment-light mb-1">Payment successful</h2>
        <p className="text-soft-gray text-sm font-ui mb-6">
          <span className="text-parchment-light font-semibold">{game.title}</span> has been added to your library.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={() => router.push("/dashboard")}>Go to library</Button>
          <Link href={`/marketplace/${game.id}`} className="inline-flex items-center px-5 py-2.5 rounded-lg border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:bg-warm-wood transition-all">
            View game
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="v-card p-6 space-y-5">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm font-ui text-crimson-flame bg-crimson-ghost border border-crimson-flame/30 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" isLoading={submitting} disabled={!stripe || !elements}>
        Pay {money(amount)}
      </Button>
      <p className="text-2xs text-soft-gray-dark font-ui text-center">
        Payments are processed securely by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
}

export function CheckoutView({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { data: game, isLoading, error } = useGame(gameId);
  const user = useCurrentUser();
  const purchase = usePurchaseGame();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Create the PaymentIntent once the game is loaded and eligible.
  const purchaseMutate = purchase.mutate;
  useEffect(() => {
    if (!mounted || !game) return;
    if (game.isFree || game.status !== "published") return;
    if (clientSecret || purchase.isPending) return;

    purchaseMutate(gameId, {
      onSuccess: (res) => {
        if (res.clientSecret) {
          setClientSecret(res.clientSecret);
          setAmount(res.amount);
        } else {
          setInitError("Payments are not configured. Please contact support.");
        }
      },
      onError: (err) => setInitError(err instanceof Error ? err.message : "Could not start checkout."),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, game, gameId]);

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
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              },
            },
          }
        : null,
    [clientSecret]
  );

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <CheckoutShell>
        <div className="v-card p-8 text-center">
          <p className="font-display text-xl font-bold text-parchment-light mb-2">Game not found</p>
          <p className="text-soft-gray text-sm font-ui mb-6">This game may have been removed or unpublished.</p>
          <Link href="/marketplace" className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm">Back to Marketplace</Link>
        </div>
      </CheckoutShell>
    );
  }

  if (!user) {
    router.replace(`/auth/login?next=/checkout/${gameId}`);
    return null;
  }

  if (game.isFree) {
    return (
      <CheckoutShell>
        <div className="v-card p-8 text-center">
          <p className="font-display text-xl font-bold text-parchment-light mb-2">This game is free</p>
          <p className="text-soft-gray text-sm font-ui mb-6">No payment is needed — grab it from the game page.</p>
          <Link href={`/marketplace/${gameId}`} className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm">Get it free</Link>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Payment column */}
        <div className="lg:col-span-3 space-y-4">
          <h1 className="font-display text-2xl font-bold tracking-display text-parchment-light">Checkout</h1>
          {initError ? (
            <div className="v-card p-6">
              <p className="text-sm font-ui text-crimson-flame">{initError}</p>
              <Link href={`/marketplace/${gameId}`} className="text-sm text-emerald-glow font-ui mt-3 inline-block hover:underline">← Back to game</Link>
            </div>
          ) : options ? (
            <Elements stripe={getStripe()} options={options}>
              <PaymentForm game={game} amount={amount || game.priceUsd || 0} />
            </Elements>
          ) : (
            <div className="v-card p-6 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
              <span className="text-sm text-soft-gray font-ui">Preparing secure payment…</span>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="v-card p-6 lg:sticky lg:top-20">
            <h2 className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider mb-4">Order summary</h2>
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-felt-dark border border-warm-wood shrink-0 flex items-center justify-center">
                {game.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 80 80" fill="none" className="opacity-20"><polyline points="8,18 40,62 72,18" fill="none" stroke="#f5c451" strokeWidth="6"/></svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-ui font-semibold text-parchment-light truncate">{game.title}</p>
                <p className="text-2xs text-soft-gray font-ui capitalize">{game.category?.replace("_", " ")} · {game.complexity?.replace("_", " ")}</p>
                {game.creator && <p className="text-2xs text-soft-gray font-ui mt-0.5">by {game.creator.displayName}</p>}
              </div>
            </div>
            <div className="border-t border-warm-wood pt-4 space-y-2 text-sm font-ui">
              <div className="flex justify-between"><span className="text-soft-gray">Price</span><span className="text-parchment-light">{money(game.priceUsd ?? 0)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-warm-wood">
                <span className="text-parchment-light">Total</span>
                <span className="text-emerald-glow">{money(amount || game.priceUsd || 0)}</span>
              </div>
            </div>
            <Link href={`/marketplace/${gameId}`} className="text-2xs text-soft-gray font-ui mt-4 inline-block hover:text-parchment-light">← Back to game</Link>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">{children}</div>
    </div>
  );
}
