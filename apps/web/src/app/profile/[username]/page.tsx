import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Creator Profile` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Profile header */}
        <div className="v-card p-8 mb-8 flex items-center gap-6">
          {/* Avatar placeholder */}
          <div className="w-20 h-20 rounded-full bg-warm-wood border-2 border-royal-gold/30 flex items-center justify-center shrink-0">
            <span className="font-display text-2xl text-royal-gold font-bold">
              {username[0]?.toUpperCase() ?? "V"}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-display text-parchment-light mb-1">
              {username}
            </h1>
            <p className="text-soft-gray text-sm font-ui">Independent Board Game Designer</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="v-badge-premium">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M5 1l1 2.5h2.5L6.5 5l.5 2.5L5 6.5 3 7.5l.5-2.5L1.5 3.5H4z" fill="currentColor" />
                </svg>
                Pro Creator
              </span>
            </div>
          </div>
        </div>
        <p className="text-soft-gray font-ui text-sm">Published games and portfolio coming soon.</p>
      </div>
    </div>
  );
}
