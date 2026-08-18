# TOP API

The TOP API is the Web2 platform layer behind the Vue and Three.js experience.

## Local development

1. Copy `.env.example` to `.env` and set `DATABASE_URL` when database work begins. The API loads this file when it starts.
2. Install packages with `npm install`.
3. Run `npm run dev`.
4. Visit `http://127.0.0.1:3000/health`.

The health endpoint runs without a database. Database operations intentionally require `DATABASE_URL` so an unconfigured local machine cannot accidentally write elsewhere.
