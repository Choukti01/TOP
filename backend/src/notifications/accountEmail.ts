import type { AppConfig } from "../config/env.js";

export type AccountActionPurpose = "verify-email" | "password-reset";
export type AccountEmailDelivery = "sent" | "development" | "not-configured" | "failed";

export interface AccountActionEmail {
  email: string;
  displayName: string;
  purpose: AccountActionPurpose;
  actionUrl: string;
}

export class AccountEmailService {
  public constructor(private readonly config: Pick<AppConfig, "environment" | "resendApiKey" | "emailFrom">) {}

  public async send(input: AccountActionEmail): Promise<AccountEmailDelivery> {
    if (this.config.resendApiKey && this.config.emailFrom) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: this.config.emailFrom,
            to: [input.email],
            subject: input.purpose === "verify-email" ? "Verify your TOP email" : "Reset your TOP password",
            text: emailText(input),
            html: emailHtml(input),
            tags: [{ name: "top_message", value: input.purpose }]
          })
        });
        if (response.ok) return "sent";
        // Resend's safe error message is intentionally kept in the private
        // server log. It makes a sender-domain or API-key problem diagnosable
        // without exposing recipient addresses, tokens, or provider details
        // to a browser response.
        const providerMessage = await response.text().catch(() => "");
        console.error("TOP account email delivery failed", {
          purpose: input.purpose,
          status: response.status,
          providerMessage: providerMessage.slice(0, 500)
        });
        return "failed";
      } catch (error) {
        console.error("TOP account email delivery could not reach the provider", { purpose: input.purpose, name: error instanceof Error ? error.name : "UnknownError" });
        return "failed";
      }
    }

    if (this.config.environment !== "production") {
      // A local-only convenience. Production never puts action links in logs.
      console.info("TOP development account action", { purpose: input.purpose, email: input.email, actionUrl: input.actionUrl });
      return "development";
    }

    console.warn("TOP account email is not configured", { purpose: input.purpose });
    return "not-configured";
  }
}

function emailText(input: AccountActionEmail): string {
  const greeting = input.displayName.trim() || "there";
  if (input.purpose === "verify-email") {
    return `Hi ${greeting},\n\nVerify this email to secure your TOP account:\n${input.actionUrl}\n\nThis link expires in 24 hours. If you did not create a TOP account, you can ignore this email.`;
  }
  return `Hi ${greeting},\n\nReset your TOP password:\n${input.actionUrl}\n\nThis link expires in 30 minutes. If you did not request it, you can ignore this email. Your current password remains unchanged.`;
}

function emailHtml(input: AccountActionEmail): string {
  const greeting = escapeHtml(input.displayName.trim() || "there");
  const isVerification = input.purpose === "verify-email";
  const title = isVerification ? "Verify your TOP email" : "Reset your TOP password";
  const description = isVerification
    ? "Confirm this email to open your field and protect the work you make on TOP."
    : "Choose a new password for your TOP account. This signs out other sessions.";
  const button = isVerification ? "Verify my email" : "Reset my password";
  const expiry = isVerification ? "24 hours" : "30 minutes";

  return `<!doctype html><html><body style="margin:0;background:#060817;color:#edf3ff;font-family:Arial,sans-serif"><main style="max-width:560px;margin:0 auto;padding:44px 24px"><div style="background:linear-gradient(145deg,#182553,#080b20);border:1px solid #35539b;border-radius:24px;padding:34px"><p style="color:#67e8f9;font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 18px">TOP · SECURE ACCOUNT</p><h1 style="font-size:30px;line-height:1.1;margin:0 0 16px">${title}</h1><p style="color:#c8d4f0;line-height:1.65">Hi ${greeting},<br><br>${description}</p><p style="margin:30px 0"><a href="${escapeHtml(input.actionUrl)}" style="background:linear-gradient(100deg,#67e8f9,#a78bfa,#f472b6);border-radius:999px;color:#07101d;display:inline-block;font-weight:800;padding:14px 22px;text-decoration:none">${button}</a></p><p style="color:#9eaccd;font-size:12px;line-height:1.6">This link expires in ${expiry}. If you did not request it, you can safely ignore this email.</p></div></main></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
