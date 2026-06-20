"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { CreateGameSchema, type CreateGameDto } from "@velonix/game-engine";
import { useCreateGame } from "@/hooks/useGames";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useCategories } from "@/hooks/useCategories";

const COMPLEXITIES = [
  { value: "light", label: "Light", desc: "Easy to learn, great for newcomers" },
  { value: "medium", label: "Medium", desc: "Some strategy involved" },
  { value: "medium_heavy", label: "Medium-Heavy", desc: "Complex decisions, rewarding" },
  { value: "heavy", label: "Heavy", desc: "Deep strategy, steep learning curve" },
] as const;

export function NewGameWizard() {
  const router = useRouter();
  const createGame = useCreateGame();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { data: allCategories = [], isLoading: catsLoading } = useCategories();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateGameDto>({
    resolver: zodResolver(CreateGameSchema),
    defaultValues: {
      language: "en",
      minAge: 8,
      playerCountMin: 2,
      playerCountMax: 4,
      playtimeMin: 30,
      playtimeMax: 60,
      tags: [],
      categories: [],
    },
  });

  const complexity = watch("complexity");

  async function nextStep() {
    const fieldsPerStep: Record<number, (keyof CreateGameDto)[]> = {
      1: ["title", "shortDescription", "description"],
      2: ["categories", "complexity", "playerCountMin", "playerCountMax", "playtimeMin", "playtimeMax", "minAge"],
    };
    const valid = await trigger(fieldsPerStep[step] as (keyof CreateGameDto)[]);
    if (valid) setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  async function onSubmit(data: CreateGameDto) {
    if (createGame.isPending) return; // prevent double-submit
    try {
      const game = await createGame.mutateAsync(data);
      toast.success("Game created! Opening studio…");
      router.push(`/studio/${game.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create game. Please try again.";
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light flex flex-col">
      {/* Header */}
      <header className="h-14 bg-rich-wood-dark border-b border-warm-wood flex items-center px-6 gap-4 shrink-0">
        <Link href="/dashboard" className="text-soft-gray hover:text-parchment-light transition-colors text-sm font-ui">
          ← <span className="max-md:hidden">Back to Dashboard</span>
        </Link>
        <div className="w-px h-5 bg-warm-wood" />
        <span className="font-display text-sm font-bold tracking-wide text-royal-gold max-md:hidden">New Game</span>
        <div className="ml-auto flex items-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-ui font-bold transition-colors ${
                  s < step
                    ? "bg-emerald-glow text-deep-void"
                    : s === step
                    ? "bg-warm-wood border border-royal-gold text-royal-gold"
                    : "bg-rich-wood-dark border border-warm-wood text-soft-gray-dark"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-10 h-px ${s < step ? "bg-emerald-glow/50" : "bg-warm-wood"}`} />}
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl">
          {/* Step 1 — Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-2">
                  Name your game
                </h1>
                <p className="text-soft-gray text-sm font-ui">Give your creation an identity.</p>
              </div>
              <Input
                {...register("title")}
                label="Game Title"
                placeholder="e.g. Verdant Conquest"
                error={!!errors.title}
                errorMessage={errors.title?.message}
              />
              <div>
                <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">
                  Short Description <span className="text-soft-gray-dark normal-case">(shown in marketplace cards)</span>
                </label>
                <textarea
                  {...register("shortDescription")}
                  rows={2}
                  placeholder="A 2–4 player strategic territory control game set in a mythical world."
                  className={`v-input resize-none ${errors.shortDescription ? "border-crimson-flame" : ""}`}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-crimson-flame mt-1 font-ui">{errors.shortDescription.message}</p>
                )}
              </div>
              <div>
                <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">
                  Full Description
                </label>
                <textarea
                  {...register("description")}
                  rows={5}
                  placeholder="Tell players everything about your game: theme, mechanics, what makes it unique…"
                  className={`v-input resize-none ${errors.description ? "border-crimson-flame" : ""}`}
                />
                {errors.description && (
                  <p className="text-xs text-crimson-flame mt-1 font-ui">{errors.description.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Game Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-2">
                  Game details
                </h1>
                <p className="text-soft-gray text-sm font-ui">Help players find your game in the marketplace.</p>
              </div>

              {/* Categories (multi-select) */}
              <div>
                <p className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider mb-3">Categories</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {catsLoading ? (
                    <span className="text-[10px] text-soft-gray-dark font-ui animate-pulse col-span-full">Loading categories…</span>
                  ) : allCategories.map(({ slug, label, icon }: any) => {
                    const selected = (watch("categories") ?? []).includes(slug);
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => {
                          const current = watch("categories") ?? [];
                          const next = selected
                            ? current.filter((c: string) => c !== slug)
                            : [...current, slug];
                          setValue("categories", next, { shouldValidate: true });
                        }}
                        className={`px-3 py-2.5 rounded-lg text-sm font-ui border transition-all ${
                          selected
                            ? "bg-emerald-ghost border-emerald-glow/50 text-emerald-glow"
                            : "border-warm-wood text-soft-gray hover:border-warm-wood-light hover:text-parchment-light"
                        }`}
                      >
                        {icon ? `${icon} ` : ""}{label}
                      </button>
                    );
                  })}
                </div>
                {errors.categories && <p className="text-xs text-crimson-flame mt-1 font-ui">{errors.categories.message}</p>}
              </div>

              {/* Complexity */}
              <div>
                <p className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider mb-3">Complexity</p>
                <div className="grid grid-cols-2 gap-2">
                  {COMPLEXITIES.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("complexity", value, { shouldValidate: true })}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        complexity === value
                          ? "bg-emerald-ghost border-emerald-glow/50"
                          : "border-warm-wood hover:border-warm-wood-light"
                      }`}
                    >
                      <p className={`text-sm font-ui font-semibold mb-0.5 ${complexity === value ? "text-emerald-glow" : "text-parchment-light"}`}>{label}</p>
                      <p className="text-2xs text-soft-gray font-ui">{desc}</p>
                    </button>
                  ))}
                </div>
                {errors.complexity && <p className="text-xs text-crimson-flame mt-1 font-ui">{errors.complexity.message}</p>}
              </div>

              {/* Player count */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register("playerCountMin", { valueAsNumber: true })}
                  label="Min Players"
                  type="number"
                  min={1}
                  max={20}
                  error={!!errors.playerCountMin}
                  errorMessage={errors.playerCountMin?.message}
                />
                <Input
                  {...register("playerCountMax", { valueAsNumber: true })}
                  label="Max Players"
                  type="number"
                  min={1}
                  max={20}
                  error={!!errors.playerCountMax}
                  errorMessage={errors.playerCountMax?.message}
                />
              </div>

              {/* Playtime */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register("playtimeMin", { valueAsNumber: true })}
                  label="Min Playtime (min)"
                  type="number"
                  min={1}
                  error={!!errors.playtimeMin}
                  errorMessage={errors.playtimeMin?.message}
                />
                <Input
                  {...register("playtimeMax", { valueAsNumber: true })}
                  label="Max Playtime (min)"
                  type="number"
                  min={1}
                  error={!!errors.playtimeMax}
                  errorMessage={errors.playtimeMax?.message}
                />
              </div>

              <Input
                {...register("minAge", { valueAsNumber: true })}
                label="Minimum Age"
                type="number"
                min={2}
                max={18}
                error={!!errors.minAge}
                errorMessage={errors.minAge?.message}
              />
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-2">
                  Ready to build
                </h1>
                <p className="text-soft-gray text-sm font-ui">
                  Your game project will be created in Draft status. You can always edit details later.
                </p>
              </div>

              <div className="v-card p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-warm-wood">
                  <div className="w-10 h-10 rounded-lg bg-warm-wood flex items-center justify-center text-royal-gold font-display font-bold text-lg">
                    {watch("title")?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-parchment-light">{watch("title") || "—"}</p>
                    <p className="text-2xs text-soft-gray font-ui capitalize">{(watch("categories") ?? []).join(", ").replace(/_/g, " ") || "—"} · {watch("complexity")?.replace("_", " ") || "—"}</p>
                  </div>
                </div>
                <p className="text-sm text-parchment-mid font-ui leading-relaxed">{watch("shortDescription") || "—"}</p>
                <div className="flex gap-4 text-2xs text-soft-gray font-ui pt-1">
                  <span>{watch("playerCountMin")}–{watch("playerCountMax")} players</span>
                  <span>{watch("playtimeMin")}–{watch("playtimeMax")} min</span>
                  <span>Age {watch("minAge")}+</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-ghost border border-emerald-glow/20 rounded-xl">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-emerald-glow shrink-0 mt-0.5">
                  <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 5v5M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-emerald-glow text-xs font-ui leading-relaxed">
                  After creation you&apos;ll be taken directly to the Studio to start designing your components.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" variant="primary" className="ml-auto" onClick={nextStep}>
                Continue →
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="ml-auto"
                isLoading={isSubmitting || createGame.isPending}
              >
                Create Game & Open Studio
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
