# TOP security and launch runbook

This document explains the trust foundation currently built into TOP and the operational steps required before inviting the public.

## What TOP protects today

- Passwords are hashed with scrypt using a fresh 16-byte salt. TOP never stores a readable password.
- Browser sessions are signed, HTTP-only cookies with a seven-day lifetime. Production cookies are marked Secure.
- Password reset links are random, one-time tokens. TOP stores only an HMAC hash of each token.
- Resetting a password revokes every existing session for that account.
- Email verification links expire after 24 hours. Password reset links expire after 30 minutes.
- Sensitive account endpoints have IP-based limits in the API process:
  - registration: 5 attempts per hour
  - sign-in: 7 failed password attempts in 15 minutes, plus an API boundary limit
  - verification resend: 5 attempts per hour
  - password reset: 5 attempts per hour
- Public write actions have separate IP-based limits to make automated spam and report flooding costly while leaving normal use comfortable:
  - public signals: 20 per hour
  - reactions and responses: 50 per hour
  - connection requests and offers: 25 per hour
  - direct messages: 60 per hour
  - block changes and safety reports: 12 per day
- The API rejects oversized JSON requests, sends conservative security headers, disables the Express fingerprint header, and uses explicit CORS origins with credentials.
- Every API response has an `X-Request-Id`. Server errors are structured in Render logs without passwords, cookies, request bodies, or reset links.
- A person can report a public profile and block another person. Reports are accepted only for real, relevant people, posts, comments, or received messages. Blocking is enforced by the API: it hides public discovery and signals, stops offers and connection requests, and closes private messaging between the two people.

## Verification boundary

New email-and-password accounts receive a signed, HTTP-only setup session only long enough to verify their email, resend the link, correct a mistyped email with their password, reset a password, edit their basic profile, or sign out. Until verified, TOP blocks access to the private Field and all public actions such as posting, reacting, commenting, connecting, messaging, offers, and project invitations.

Google sign-in uses Google OpenID Connect with PKCE, state, nonce, and server-side ID-token signature validation. A successful Google identity is tied to the provider's stable subject identifier, then receives the same signed TOP session as an email account. Google-confirmed email addresses are marked verified. TOP never exposes the Google client secret to the frontend.

The current rate-limit counters live inside the single Render API process. They protect TOP now, but they are not shared across multiple API instances. Move these counters to Redis before scaling beyond one web process.

## Production environment variables

Set these on the Render API service. Do not put any of them in Netlify or frontend source code.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV=production` | yes | Enables production cookie and transport protections. |
| `DATABASE_ENABLED=true` | yes | Turns on the Supabase PostgreSQL repository. |
| `DATABASE_URL` | yes | Supabase connection string using the transaction pooler. |
| `SESSION_SECRET` | yes | Random 32+ character session signing secret. |
| `ACCOUNT_ACTION_SECRET` | yes | Different random 32+ character secret for verification and reset links. |
| `WEB_ORIGIN=https://www.t0p.world` | yes | Allows the TOP frontend to call the API. |
| `PUBLIC_APP_URL=https://www.t0p.world` | yes | Destination for verification and password-reset links. |
| `RESEND_API_KEY` | for email | API key for email delivery through Resend. |
| `EMAIL_FROM=TOP <hello@t0p.world>` | for email | A verified sender identity in Resend. |
| `GOOGLE_CLIENT_ID` | for Google sign-in | OAuth web-client ID from Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | for Google sign-in | OAuth web-client secret from Google Cloud. Keep it only in Render. |
| `GOOGLE_REDIRECT_URI=https://api.t0p.world/api/v1/auth/google/callback` | for Google sign-in | Must exactly match the authorized redirect URI in Google Cloud. |
| `ERROR_WEBHOOK_URL` | optional | Secure endpoint for concise server-error alerts. |

Generate each secret with a password manager or this command in a local terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Never paste a production secret into GitHub issues, screenshots, frontend variables, or the public repository.

## Email verification and password recovery

TOP uses Resend's HTTPS API when both `RESEND_API_KEY` and `EMAIL_FROM` are configured.

1. Create a Resend account and add `t0p.world` as a sending domain.
2. Add the DNS records Resend gives you in Spaceship.
3. Wait until Resend marks the domain as verified.
4. Create a restricted Resend API key for TOP.
5. Enter `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL` in Render.
6. Redeploy Render and create a test account with an email you control.
7. Verify the email link, request a password reset, and confirm that the old browser session becomes invalid.

Without a delivery provider, TOP still creates the secure hashed token but cannot send it to a real inbox. Development logs show local action links only outside production. Production never prints these links.

## Google sign-in setup

1. In Google Cloud Console, create or select a project and configure the OAuth consent screen as an External application.
2. Add `www.t0p.world` and `t0p.world` as authorized JavaScript origins.
3. Create a Web application OAuth client and add this exact authorized redirect URI: `https://api.t0p.world/api/v1/auth/google/callback`.
4. Copy the client ID, client secret, and redirect URI into the three Render environment variables above.
5. Redeploy the Render API. The Google button appears only after all three values are present.
6. Test with an address that has never used TOP, then test an existing email account. Both must arrive at a signed TOP session with the existing profile preserved.

Do not create a frontend Google client, place credentials in Netlify, or add a wildcard redirect URI. The TOP API is the only OAuth callback owner.

## Database migration and backup plan

Migration `0014_account_trust_and_safety.sql` adds email verification, one-time account tokens, blocks, and safety reports. Migration `0015_google_oauth_identities.sql` adds the provider-identity link used by Google sign-in. Run migrations once through the Render service command that already uses `npm run db:migrate` before serving the new release.

Use this backup routine before public launch:

1. In Supabase, confirm that automated backups or point-in-time recovery are enabled for your plan.
2. Create a weekly logical backup using a protected machine or CI secret and `pg_dump` with the direct database connection. Store the encrypted file outside the GitHub repository.
3. Keep at least 30 days of backups, plus one monthly backup retained longer.
4. Once per month, restore a backup into a separate temporary database and verify that users, projects, messages, and reports can be read.
5. Record the restore date and result in your private operations notes.

Example logical backup command. Run it only on a trusted machine with `DATABASE_URL` loaded privately:

```bash
pg_dump --format=custom --no-owner --file top-$(date +%F).dump "$DATABASE_URL"
```

## Error monitoring and incident response

Render logs are the primary error monitor today. Search them by `X-Request-Id` when a member reports a problem. If `ERROR_WEBHOOK_URL` is set, TOP sends a small error event without private request data.

For a production alert receiver, use a private webhook endpoint operated by your monitoring service. Do not configure it to forward error payloads into a public channel.

If a session or account concern is reported:

1. Ask for the time, the member's email through a private channel, and the request ID if available.
2. Review Render logs by request ID.
3. If an account could be compromised, ask the member to reset their password. This revokes all current sessions.
4. For abusive contact, preserve the report record, block the account if needed, and do not expose the reporter's identity.
5. Rotate `SESSION_SECRET` only as an emergency action. It signs every member out.

## Security review before a public beta

- Confirm all Render environment variables above are set and are not exposed in Netlify.
- Confirm the API URL uses HTTPS and the frontend has no `localhost` API value in its production build.
- Confirm Supabase uses the transaction pooler and that the API connection pool remains small.
- Run `npm --prefix backend test`, `npm --prefix backend run type-check`, and `npm --prefix frontend run build` for every release.
- Test registration, verification, normal sign-in, Google sign-in, invalid sign-in, password reset, sign-out, block, report, connection, and direct message flows on production.
- Confirm CORS only permits `https://www.t0p.world`, `https://t0p.world`, and explicitly approved local development origins.
- Review the latest dependency audit before a release. Do not automatically apply breaking security fixes without testing them.
- Restrict Supabase, Render, Resend, Netlify, Spaceship, and GitHub access to the smallest set of trusted people.

## Next hardening steps as TOP grows

- Move rate-limit counters from in-memory storage to Redis when the API has more than one instance.
- Add an internal, access-controlled moderation queue for reviewing safety reports.
- Add device/session management so members can see and revoke individual sessions.
- Add a responsible disclosure contact and a short privacy policy before a wider launch.
