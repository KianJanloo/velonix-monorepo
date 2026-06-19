/**
 * Ambient type declaration for `nodemailer`.
 *
 * Why this file exists: the `nodemailer` *runtime* package is already a
 * normal ("dependencies", not "devDependencies") package at the monorepo
 * root, so it installs fine even in Vercel's production-only install.
 * `@types/nodemailer`, however, is currently a root *devDependency*, which
 * pnpm skips when NODE_ENV=production (Vercel's build environment) — so
 * its type declarations are simply never installed, and `apps/api` never
 * declared either package directly in its own package.json to begin with.
 *
 * Rather than editing package.json/pnpm-lock.yaml (risky to hand-edit
 * correctly under pnpm's --frozen-lockfile, which Vercel uses by default
 * whenever CI=1 is set), this supplies just enough of a real, typed
 * declaration — not a blanket `declare module "nodemailer";` — to compile
 * the small surface MailService actually uses. `nodemailer.Transporter` is
 * used as a type, and a bare/shorthand `any`-module declaration can't be
 * referenced as a namespace for that, so this declares a real interface.
 *
 * To get full upstream types later: add "nodemailer" to apps/api's own
 * "dependencies" and "@types/nodemailer" to its "dependencies" (this repo
 * keeps @types/* in "dependencies" rather than "devDependencies" for
 * exactly this Vercel production-install reason — see the other @types/*
 * entries in apps/api/package.json), then run `pnpm install` locally to
 * regenerate pnpm-lock.yaml, and delete this file.
 */
declare module "nodemailer" {
  export interface SentMessageInfo {
    messageId?: string;
    [key: string]: unknown;
  }

  export interface Transporter {
    sendMail(
      mail: {
        from?: string;
        to: string | string[];
        subject?: string;
        text?: string;
        html?: string;
        [key: string]: unknown;
      },
    ): Promise<SentMessageInfo>;
    verify(): Promise<true>;
    close(): void;
  }

  /** Accepts the same loosely-typed transport options object nodemailer
   * itself supports (SMTP config, transport plugin, etc.) — kept as
   * `unknown` rather than `any` so callers still have to be deliberate
   * about it, matching how this file's only caller already casts its
   * options object explicitly. */
  export function createTransport(options: unknown): Transporter;
}
