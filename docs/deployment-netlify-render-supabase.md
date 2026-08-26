# Deploying TOP: Netlify, Render, Supabase, and Spaceship

This is TOP's first production setup. It keeps the public Vue application, API, and PostgreSQL database separate:

```text
www.t0p.world  -> Netlify  -> Vue / Vite frontend
api.t0p.world  -> Render   -> Node / Express API
                              -> Supabase PostgreSQL
```

The split matters: TOP's account sessions use secure cookies. Keeping both browser-facing services under `t0p.world` means a signed-in user can use the public TOP Page, Field, profile, messages, and project circles without third-party-cookie problems.

## Before starting

1. Keep this repository public only until Netlify and Render are successfully serving TOP. Do not make it private yet.
2. Push the deployment files in this repository before connecting the services:
   - `netlify.toml`
   - `render.yaml`
3. Never send a database password, complete `DATABASE_URL`, Supabase service-role key, Render token, or account password in chat or a screenshot.

## 1. Create the Supabase PostgreSQL database

1. Go to Supabase and choose **New project**.
2. Give it a clear name such as `top-production`, choose the closest European region available, and create a strong database password. Save that password privately.
3. Wait until the project is ready, then open **Connect** and copy a PostgreSQL connection URI.
4. Keep the URI private. TOP's backend needs it later as `DATABASE_URL`.

Use the normal direct URI first. If Render reports a database networking or connection-capacity error, use the **Session pooler** URI from the same Connect screen instead. Either is private and must not be committed.

### Apply TOP's database migrations

From Git Bash, run this once after the new Supabase database exists. Replace the placeholder locally; do not paste the real URL into chat.

```bash
cd backend
DATABASE_URL='YOUR_PRIVATE_SUPABASE_CONNECTION_URI' DATABASE_ENABLED=true npm run db:migrate
```

Success means every migration, including `0011_signal_to_project_bridge.sql`, has been applied. Send me only the command result, with any connection URL removed.

## 2. Deploy the API on Render

1. Go to Render and choose **New** -> **Blueprint**.
2. Connect GitHub, select the `TOP` repository, and select the `main` branch.
3. Render reads `render.yaml` automatically. It creates one free Node web service named `top-api`.
4. When Render asks for `DATABASE_URL`, paste the private Supabase URI there. Do not place it in GitHub or this repository.
5. Let the deployment finish. The health check must report success at `/health`.
6. Open the service's **Settings** -> **Custom Domains**, add `api.t0p.world`, and copy the exact DNS target Render gives you. It normally ends in `onrender.com`.

Render generates the production session secret itself. Do not replace it with a short value. Free Render services may sleep after inactivity; the first API request after a pause can take a little longer.

## 3. Deploy the frontend on Netlify

1. Go to Netlify and choose **Add new project** -> **Import an existing project**.
2. Connect GitHub and choose `TOP` on the `main` branch.
3. Netlify reads `netlify.toml`; do not override the build command or publish directory in the dashboard.
4. Deploy the site. The temporary `*.netlify.app` URL is expected at this stage.
5. In **Project configuration** -> **Environment variables**, confirm this production value exists:

```text
VITE_API_URL = https://api.t0p.world
```

This value is intentionally public because it is part of the browser application. It is already included in `netlify.toml` so it should appear automatically.

6. In **Domain management**, add `www.t0p.world`. Netlify will show the exact DNS target for the `www` record. Copy that target.
7. Add `t0p.world` as well, then make `www.t0p.world` the primary site address and redirect the bare domain to `www`.

## 4. Point the domain in Spaceship

In Spaceship's DNS area, work only with the records for `t0p.world`.

| Host / name | Record type | Target |
| --- | --- | --- |
| `www` | `CNAME` | The exact Netlify target shown for this site |
| `api` | `CNAME` | The exact Render target shown for `api.t0p.world` |
| `@` | Use Netlify's recommended apex setup | The exact values Netlify shows, or a redirect to `www` if Spaceship offers that option |

Before adding new records, remove only the older records that use the same host name (`www`, `api`, or `@`) and point to GitHub Pages or another previous host. Do not delete unrelated records such as email records.

DNS can take minutes to propagate, occasionally longer. When both providers mark their custom domains as verified, enable HTTPS enforcement in Netlify and Render if each dashboard offers it.

## 5. Verify TOP in the correct order

1. Open `https://api.t0p.world/health`. It should return a small JSON health response.
2. Open `https://www.t0p.world` in a private/incognito browser window.
3. Register a test account, sign out, and sign back in.
4. Create a post on TOP Page, react or comment, bring it into the Field, and confirm it becomes a real seed or project.
5. Open the profile and a project circle. Confirm messages, signals, invitations, and activity still work after refreshing the page.

Only after that is fully green: disable the old GitHub Pages site in GitHub settings if you no longer need it, then make the repository private if that is your decision. Netlify and Render need permission to continue reading the private repository.

## What to send me after each step

Send only these safe, non-secret details:

| After | Send me |
| --- | --- |
| Supabase | The project reference or a masked database host, plus the migration command result with credentials removed |
| Render | The public `*.onrender.com` service URL, deployment status, and any error text with secrets removed |
| Netlify | The public `*.netlify.app` site URL, build status, and any build error text |
| Spaceship | A screenshot or typed list of DNS host names and targets, with no account details |
| Final check | The exact browser error, API response, or console message if something fails |

With that information I can adjust TOP's configuration or code without ever needing access to your accounts or private credentials.
