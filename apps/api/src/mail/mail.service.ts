import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("RESEND_SMTP_HOST"),
      port: this.config.get<string>("RESEND_SMTP_PORT") ?? 587,
      secure: this.config.get<string>("RESEND_SMTP_SECURE") === "true",
      auth: {
        user: this.config.get<string>("RESEND_SMTP_USER"),
        pass: this.config.get<string>("RESEND_SMTP_PASS"),
      },
    } as any);

    this.from = `${this.config.get("EMAIL_FROM_NAME") ?? "Velonix"} <${this.config.get("EMAIL_FROM") ?? "noreply@velonix.gg"}>`;
  }

  // ── Send ─────────────────────────────────────────────────────────────────

  private async send(opts: SendMailOptions): Promise<void> {
    console.log({
      host: this.config.get<string>("RESEND_SMTP_HOST"),
      port: this.config.get<string>("RESEND_SMTP_PORT") ?? 587,
      secure: this.config.get<string>("RESEND_SMTP_SECURE") === "true",
      auth: {
        user: this.config.get<string>("RESEND_SMTP_USER"),
        pass: this.config.get<string>("RESEND_SMTP_PASS"),
      },
    });
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
    }
  }

  // ── Public email methods ──────────────────────────────────────────────────

  async sendPasswordReset(opts: {
    to: string;
    code: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: "Your Velonix Password Reset Code",
      html: this.buildPasswordResetTemplate({
        code: opts.code,
        expiresInMinutes: opts.expiresInMinutes ?? 15,
      }),
    });
  }

  async sendEmailVerification(opts: {
    to: string;
    code: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: "Your Velonix Email Verification Code",
      html: this.buildEmailVerificationTemplate({
        code: opts.code,
        expiresInMinutes: opts.expiresInMinutes ?? 15,
      }),
    });
  }

  async sendWelcome(opts: { to: string; displayName: string }): Promise<void> {
    await this.send({
      to: opts.to,
      subject: "Welcome to Velonix — The Board Awaits",
      html: this.buildWelcomeTemplate({ displayName: opts.displayName }),
    });
  }

  // ── Template builders ─────────────────────────────────────────────────────

  private wrapper(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;padding:6px 0 2px;">
                <span style="
                  font-family:'Cinzel',Georgia,serif;
                  font-size:26px;
                  font-weight:900;
                  letter-spacing:0.18em;
                  background:linear-gradient(135deg,#e8d5b8 0%,#f5c451 50%,#e8d5b8 100%);
                  -webkit-background-clip:text;
                  -webkit-text-fill-color:transparent;
                  background-clip:text;
                ">VELONIX</span>
              </div>
              <div style="width:160px;height:1px;background:linear-gradient(90deg,transparent,#3a2a1f,transparent);margin:8px auto 0;"></div>
              <p style="margin:6px 0 0;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#6b6460;font-family:'DM Sans',Arial,sans-serif;">Play. Think. Conquer.</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background:#1c140f;
              border:1px solid #3a2a1f;
              border-radius:14px;
              overflow:hidden;
            ">
              <!-- Gold top bar -->
              <div style="height:3px;background:linear-gradient(90deg,#00D68F,#f5c451,#00D68F);"></div>
              <div style="padding:36px 40px 40px;">
                ${body}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#6b6460;line-height:1.6;">
                You received this email because an action was taken on your Velonix account.<br/>
                If this wasn't you, you can safely ignore this email.
              </p>
              <p style="margin:10px 0 0;font-size:10px;color:#3a2a1f;">
                © ${new Date().getFullYear()} Velonix. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildPasswordResetTemplate(opts: {
    code: string;
    expiresInMinutes: number;
  }): string {
    const digits = opts.code
      .split("")
      .map(
        (d) => `
        <td style="
          width:44px;height:52px;
          background:#241a12;
          border:1px solid #4a3728;
          border-radius:8px;
          text-align:center;
          vertical-align:middle;
          font-family:'Cinzel',Georgia,serif;
          font-size:22px;
          font-weight:700;
          color:#e8d5b8;
          letter-spacing:0;
        ">${d}</td>
      `,
      )
      .join('<td style="width:8px;"></td>');

    return this.wrapper(
      "Reset Your Password — Velonix",
      `
      <h1 style="
        margin:0 0 8px;
        font-family:'Cinzel',Georgia,serif;
        font-size:22px;
        font-weight:900;
        letter-spacing:0.1em;
        color:#e8d5b8;
      ">Reset Your Password</h1>

      <div style="width:40px;height:2px;background:#00D68F;border-radius:2px;margin-bottom:20px;"></div>

      <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.7;">
        We received a request to reset the password for your Velonix account.
        Use the code below to continue. It expires in
        <span style="color:#f5c451;font-weight:600;">${opts.expiresInMinutes} minutes</span>.
      </p>

      <!-- Code grid -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
        <tr>${digits}</tr>
      </table>

      <div style="
        background:#241a12;
        border:1px solid rgba(255,59,92,0.18);
        border-radius:8px;
        padding:12px 16px;
        margin-bottom:24px;
      ">
        <p style="margin:0;font-size:12px;color:#ff3b5c;line-height:1.5;">
          ⚠ &nbsp;Never share this code with anyone — Velonix will never ask for it.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#6b6460;line-height:1.6;">
        If you didn't request a password reset, no action is needed.
        Your account remains secure.
      </p>
    `,
    );
  }

  private buildEmailVerificationTemplate(opts: {
    code: string;
    expiresInMinutes: number;
  }): string {
    const digits = opts.code
      .split("")
      .map(
        (d) => `
        <td style="
          width:44px;height:52px;
          background:#241a12;
          border:1px solid #4a3728;
          border-radius:8px;
          text-align:center;
          vertical-align:middle;
          font-family:'Cinzel',Georgia,serif;
          font-size:22px;
          font-weight:700;
          color:#e8d5b8;
          letter-spacing:0;
        ">${d}</td>
      `,
      )
      .join('<td style="width:8px;"></td>');

    return this.wrapper(
      "Verify Your Email — Velonix",
      `
      <h1 style="
        margin:0 0 8px;
        font-family:'Cinzel',Georgia,serif;
        font-size:22px;
        font-weight:900;
        letter-spacing:0.1em;
        color:#e8d5b8;
      ">Verify Your Email</h1>

      <div style="width:40px;height:2px;background:#00D68F;border-radius:2px;margin-bottom:20px;"></div>

      <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.7;">
        We received a request to verify your email for your Velonix account.
        Use the code below to continue. It expires in
        <span style="color:#f5c451;font-weight:600;">${opts.expiresInMinutes} minutes</span>.
      </p>

      <!-- Code grid -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
        <tr>${digits}</tr>
      </table>

      <div style="
        background:#241a12;
        border:1px solid rgba(255,59,92,0.18);
        border-radius:8px;
        padding:12px 16px;
        margin-bottom:24px;
      ">
        <p style="margin:0;font-size:12px;color:#ff3b5c;line-height:1.5;">
          ⚠ &nbsp;Never share this code with anyone — Velonix will never ask for it.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#6b6460;line-height:1.6;">
        If you didn't request to verify your email, no action is needed.
        Your account remains secure.
      </p>
    `,
    );
  }

  private buildWelcomeTemplate(opts: { displayName: string }): string {
    const appUrl =
      this.config.get<string>("NEXT_PUBLIC_APP_URL") ?? "https://velonix.gg";

    const features = [
      {
        icon: "♟",
        label: "Design your first game",
        desc: "Use the Studio to build boards, cards, and rules.",
      },
      {
        icon: "🏪",
        label: "Explore the Marketplace",
        desc: "Discover games created by the community.",
      },
      {
        icon: "✦",
        label: "Publish & Earn",
        desc: "Sell your creations and track your earnings.",
      },
    ];

    const featureRows = features
      .map(
        (f) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #241a12;vertical-align:top;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;font-size:20px;vertical-align:top;padding-top:2px;">${f.icon}</td>
            <td>
              <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#e8d5b8;">${f.label}</p>
              <p style="margin:0;font-size:12px;color:#6b6460;">${f.desc}</p>
            </td>
          </tr></table>
        </td>
      </tr>
    `,
      )
      .join("");

    return this.wrapper(
      "Welcome to Velonix",
      `
      <h1 style="
        margin:0 0 4px;
        font-family:'Cinzel',Georgia,serif;
        font-size:22px;
        font-weight:900;
        letter-spacing:0.1em;
        color:#e8d5b8;
      ">Welcome, ${opts.displayName}</h1>

      <div style="width:40px;height:2px;background:#f5c451;border-radius:2px;margin-bottom:20px;"></div>

      <p style="margin:0 0 24px;font-size:14px;color:#a8a29e;line-height:1.7;">
        Your account is ready. You've just joined a community of designers, strategists,
        and game enthusiasts. Here's what you can do next:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${featureRows}
      </table>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="
            background:#00D68F;
            border-radius:8px;
            padding:0;
          ">
            <a href="${appUrl}/dashboard" style="
              display:inline-block;
              padding:13px 32px;
              font-family:'DM Sans',Arial,sans-serif;
              font-size:14px;
              font-weight:700;
              color:#0a0a0a;
              text-decoration:none;
              letter-spacing:0.04em;
            ">Enter the Dashboard →</a>
          </td>
        </tr>
      </table>
    `,
    );
  }
}
