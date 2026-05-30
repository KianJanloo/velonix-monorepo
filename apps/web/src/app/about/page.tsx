import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Velonix is the premium platform for creating, publishing, and selling digital board games.",
};

const VALUES = [
  {
    title: "Creators first",
    desc: "Every decision we make starts with one question: does this help designers make better games and earn a living doing it?",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.5 6.5H21l-5 4.5 2 7-6-4-6 4 2-7-5-4.5h6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  },
  {
    title: "Craftsmanship",
    desc: "Board games are an art form. Our tools are built to honor that craft, from typography to 3D previews.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 21l6-6m0 0l4-9 7 7-9 4m-2-2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    title: "Fair economics",
    desc: "Transparent commission rates, direct payouts, and no hidden fees. Creators keep the majority of every sale.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v10M9.5 9.5a2.5 2 0 012.5-1.5c1.5 0 2.5.7 2.5 1.8 0 2.4-5 1.4-5 3.9 0 1.1 1 1.8 2.5 1.8a2.5 2 0 002.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      {/* Hero */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(58,42,31,0.4),transparent)]" />
        <p className="font-ui text-xs font-bold tracking-[0.18em] text-emerald-glow uppercase mb-4">Our story</p>
        <h1 className="font-display text-5xl md:text-6xl font-black tracking-display gradient-gold-parchment mb-6">
          We believe in tabletop magic
        </h1>
        <p className="font-body text-xl text-parchment-mid italic max-w-2xl mx-auto leading-relaxed">
          Velonix exists to give independent board game designers the tools, marketplace, and economics
          they need to turn ideas into thriving creations — without gatekeepers.
        </p>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 border-y border-warm-wood bg-rich-wood-dark/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-6">Our mission</h2>
          <p className="font-body text-lg text-parchment-mid leading-relaxed mb-4">
            Designing a board game has always required a daunting mix of artistic vision, production logistics,
            and business savvy. Most great ideas never make it past a prototype on someone&apos;s kitchen table.
          </p>
          <p className="font-body text-lg text-parchment-mid leading-relaxed">
            We&apos;re changing that. Velonix combines a professional design studio, a curated marketplace, and
            fair creator economics into one platform — so the only thing standing between an idea and an
            audience is your imagination.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold tracking-display text-parchment-light text-center mb-12">What we stand for</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map(({ title, desc, icon }) => (
              <div key={title} className="v-card p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-ghost border border-emerald-glow/20 flex items-center justify-center text-emerald-glow mb-4">
                  {icon}
                </div>
                <h3 className="font-display text-lg font-bold tracking-wide text-parchment-light mb-2">{title}</h3>
                <p className="text-soft-gray text-sm font-ui leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-warm-wood bg-rich-wood-dark/40">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "2,400+", label: "Creators" },
            { value: "18,000+", label: "Games Published" },
            { value: "$1.2M+", label: "Paid to Creators" },
            { value: "120+", label: "Countries" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-3xl font-bold gradient-gold-parchment mb-1">{value}</p>
              <p className="text-soft-gray text-sm font-ui">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="font-display text-4xl font-bold tracking-display text-parchment-light mb-4">
          Join the Velonix community
        </h2>
        <p className="font-body text-lg text-parchment-mid italic mb-10 max-w-xl mx-auto">
          Whether you&apos;re designing your first game or your fiftieth, there&apos;s a place for you here.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all">
            Start Creating Free
          </Link>
          <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:border-royal-gold/50 hover:text-royal-gold transition-all">
            Explore the Marketplace
          </Link>
        </div>
      </section>
    </div>
  );
}
