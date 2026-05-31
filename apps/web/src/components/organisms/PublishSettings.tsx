"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGame, useUpdateGame, usePublishGame } from "@/hooks/useGames";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";

const CATEGORIES = ["strategy","party","cooperative","deck_building","worker_placement","euro","abstract","rpg","family","other"];
const COMPLEXITIES = ["light","medium","medium_heavy","heavy"];

export function PublishSettings({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { data: game, isLoading } = useGame(gameId);
  const updateGame = useUpdateGame(gameId);
  const publish = usePublishGame(gameId);

  const [form, setForm] = useState({
    title: "", shortDescription: "", description: "",
    category: "strategy", complexity: "medium",
    playerCountMin: 2, playerCountMax: 4, playtimeMin: 30, playtimeMax: 60, minAge: 8,
    tags: "", isFree: true, priceUsd: 0, hasTrial: false,
    thumbnailUrl: "" as string | null,
  });

  useEffect(() => {
    if (!game) return;
    setForm({
      title: game.title, shortDescription: game.shortDescription, description: game.description,
      category: game.category, complexity: game.complexity,
      playerCountMin: game.playerCountMin, playerCountMax: game.playerCountMax,
      playtimeMin: game.playtimeMin, playtimeMax: game.playtimeMax, minAge: game.minAge,
      tags: game.tags?.join(", ") ?? "",
      isFree: game.isFree, priceUsd: game.priceUsd ?? 0, hasTrial: game.hasTrial,
      thumbnailUrl: game.thumbnailUrl,
    });
  }, [game]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function save(thenPublish = false) {
    try {
      await updateGame.mutateAsync({
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category as never,
        complexity: form.complexity as never,
        playerCountMin: form.playerCountMin,
        playerCountMax: form.playerCountMax,
        playtimeMin: form.playtimeMin,
        playtimeMax: form.playtimeMax,
        minAge: form.minAge,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        isFree: form.isFree,
        priceUsd: form.isFree ? null : Math.round(form.priceUsd),
        hasTrial: form.hasTrial,
        thumbnailUrl: form.thumbnailUrl,
      } as never);
      if (thenPublish) {
        await publish.mutateAsync();
        toast.success("Submitted for review!");
        router.push("/dashboard");
      } else {
        toast.success("Saved.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  if (isLoading || !game) {
    return <div className="min-h-screen bg-deep-void flex items-center justify-center"><div className="w-8 h-8 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" /></div>;
  }

  const statusBadge = {
    draft: "bg-warm-wood text-soft-gray", reviewing: "bg-[rgba(0,229,255,0.15)] text-cyan-spark",
    published: "bg-emerald-ghost text-emerald-glow", rejected: "bg-crimson-ghost text-crimson-flame",
    unpublished: "bg-warm-wood text-soft-gray",
  }[game.status] ?? "bg-warm-wood text-soft-gray";

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/studio/${gameId}`} className="text-soft-gray text-sm font-ui hover:text-parchment-light">← Studio</Link>
          <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize ${statusBadge}`}>{game.status}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-display mb-1">Publish settings</h1>
        <p className="text-soft-gray text-sm font-ui mb-8">Set your game&apos;s details, cover, and pricing before submitting for review.</p>

        {game.status === "rejected" && game.rejectionReason && (
          <div className="mb-6 p-4 rounded-xl bg-crimson-ghost border border-crimson-flame/30">
            <p className="text-sm font-ui font-semibold text-crimson-flame mb-1">Changes requested</p>
            <p className="text-sm text-parchment-mid font-ui">{game.rejectionReason}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Cover */}
          <div className="v-card p-6">
            <ImageUploadField label="Cover image" shape="cover" value={form.thumbnailUrl}
              onChange={(url) => set("thumbnailUrl", url)} hint="Shown on marketplace cards & detail page. Recommended 1200×800." />
          </div>

          {/* Basics */}
          <div className="v-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-parchment-light">Game details</h2>
            <Input label="Title" value={form.title} onChange={e => set("title", e.target.value)} />
            <div>
              <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">Short description</label>
              <textarea className="v-input resize-none h-16" value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} maxLength={160} />
              <p className="text-2xs text-soft-gray-dark font-ui mt-1">{form.shortDescription.length}/160</p>
            </div>
            <div>
              <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">Full description</label>
              <textarea className="v-input resize-none h-40" value={form.description} onChange={e => set("description", e.target.value)} />
              <p className="text-2xs text-soft-gray-dark font-ui mt-1">Min 50 characters · {form.description.length} written</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">Category</span>
                <select className="v-input capitalize" value={form.category} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">Complexity</span>
                <select className="v-input capitalize" value={form.complexity} onChange={e => set("complexity", e.target.value)}>
                  {COMPLEXITIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
                </select>
              </label>
            </div>
            <Input label="Tags (comma separated)" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="strategy, fantasy, 2-player" />
          </div>

          {/* Specs */}
          <div className="v-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-parchment-light">Player specs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input label="Min players" type="number" value={form.playerCountMin} onChange={e => set("playerCountMin", Number(e.target.value) || 1)} />
              <Input label="Max players" type="number" value={form.playerCountMax} onChange={e => set("playerCountMax", Number(e.target.value) || 1)} />
              <Input label="Min age" type="number" value={form.minAge} onChange={e => set("minAge", Number(e.target.value) || 0)} />
              <Input label="Min playtime (min)" type="number" value={form.playtimeMin} onChange={e => set("playtimeMin", Number(e.target.value) || 1)} />
              <Input label="Max playtime (min)" type="number" value={form.playtimeMax} onChange={e => set("playtimeMax", Number(e.target.value) || 1)} />
            </div>
          </div>

          {/* Pricing */}
          <div className="v-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-parchment-light">Pricing</h2>
            <div className="flex gap-2">
              <button onClick={() => set("isFree", true)} className={`flex-1 py-3 rounded-lg border text-sm font-ui font-semibold transition-all ${form.isFree ? "border-emerald-glow bg-emerald-ghost text-emerald-glow" : "border-warm-wood text-soft-gray"}`}>Free</button>
              <button onClick={() => set("isFree", false)} className={`flex-1 py-3 rounded-lg border text-sm font-ui font-semibold transition-all ${!form.isFree ? "border-emerald-glow bg-emerald-ghost text-emerald-glow" : "border-warm-wood text-soft-gray"}`}>Paid</button>
            </div>
            {!form.isFree && (
              <>
                <label className="block">
                  <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">Price (USD)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-parchment-mid font-ui">$</span>
                    <input type="number" step="0.01" min="0.99" className="v-input font-mono"
                      value={(form.priceUsd / 100).toFixed(2)}
                      onChange={e => set("priceUsd", Math.round(Number(e.target.value) * 100) || 0)} />
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasTrial} onChange={e => set("hasTrial", e.target.checked)} className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow" />
                  <span className="text-sm font-ui text-parchment-light">Offer a free trial</span>
                </label>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4">
            <Button variant="outline" className="flex-1" isLoading={updateGame.isPending} onClick={() => save(false)}>Save Draft</Button>
            <Button variant="primary" className="flex-1" isLoading={publish.isPending || updateGame.isPending}
              disabled={game.status === "reviewing"}
              onClick={() => save(true)}>
              {game.status === "reviewing" ? "In Review" : "Save & Submit for Review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
