interface Section {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
}

export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-black tracking-display text-parchment-light mb-2">
          {title}
        </h1>
        <p className="text-soft-gray-dark text-sm font-ui mb-8">
          Last updated: {lastUpdated}
        </p>

        <div className="flex items-center gap-4 max-w-xs mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-warm-wood-light to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold/50" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-transparent" />
        </div>

        <p className="font-body text-lg text-parchment-mid italic leading-relaxed mb-12">
          {intro}
        </p>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display text-xl font-bold tracking-wide text-parchment-light mb-3">
                {i + 1}. {section.heading}
              </h2>
              <div className="space-y-3">
                {section.body.map((para, j) => (
                  <p
                    key={j}
                    className="text-soft-gray text-sm font-ui leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-warm-wood">
          <p className="text-soft-gray-dark text-sm font-ui">
            Questions? Contact us at{" "}
            <a
              href="mailto:legal@velonix.gg"
              className="text-emerald-glow hover:text-emerald-bright transition-colors"
            >
              legal@velonix.gg
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
