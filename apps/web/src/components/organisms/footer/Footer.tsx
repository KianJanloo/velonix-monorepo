import Link from "next/link";
import { VelonixLogo } from "@/components/atoms/VelonixLogo";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/components/templates/SettingsProvider";

const LINKS = {
  Product: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Studio", href: "/studio/new" },
    { label: "Pricing", href: "/pricing" },
  ],
  Creators: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing & Plans", href: "/pricing" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Support", href: "/support" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

const ADMIN_LINKS = [{ href: "/admin", label: "Admin" }];

export function Footer() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName || "Velonix";

  if (ADMIN_LINKS.map((a) => pathname.includes(a.href)).some(Boolean)) {
    return null;
  }

  return (
    <footer className="bg-rich-wood-dark border-t border-warm-wood">
      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group mb-4"
            >
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={siteName} className="h-6 w-auto" />
              ) : (
                <VelonixLogo size={24} showWordmark wordmarkSize="sm" />
              )}
            </Link>
            <p className="text-soft-gray text-sm font-ui leading-relaxed max-w-[220px]">
              {settings?.siteDescription || "The premium platform for designing and publishing digital board games."}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-parchment-mid mb-4">
                {section}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-soft-gray text-sm font-ui hover:text-parchment-light transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-warm-wood" />
          <div className="w-1 h-1 rotate-45 bg-royal-gold/40" />
          <div className="flex-1 h-px bg-warm-wood" />
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-soft-gray-dark text-xs font-ui">
            {settings?.footerText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
          <div className="flex items-center gap-5">
            {settings?.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M9.294 6.928 13.999 1.5h-1.124l-4.09 4.76L5.555 1.5H1.5l4.94 7.19L1.5 14.5h1.124l4.32-5.025 3.45 5.025H14.5L9.294 6.928zm-1.53 1.779-.5-.716-3.981-5.696h1.715l3.215 4.6.5.716 4.181 5.985h-1.715l-3.416-4.89z" />
                </svg>
              </a>
            )}
            {settings?.discordUrl && (
              <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Discord"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
              </a>
            )}
            {settings?.githubUrl && (
              <a href={settings.githubUrl} target="_blank" rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            )}
            {settings?.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
            {settings?.linkedinUrl && (
              <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {settings?.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {settings?.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-soft-gray-dark hover:text-parchment-light transition-colors">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
