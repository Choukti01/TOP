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
            text: emailText(input)
          })
        });
        if (response.ok) return "sent";
        console.error("TOP account email delivery failed", { purpose: input.purpose, status: response.status });
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
