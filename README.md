# TOP

TOP is a Web2 creator platform that helps people turn ideas into meaningful real-world projects. Its Vue interface and Three.js world are two views of the same human-growth system: people, skills, seeds, projects, contributions, circles, mentorship, and reflection.

## Current architecture

- `frontend/`: Vue 3, TypeScript, Vite, Pinia, Vue Router, and Three.js.
- `backend/`: Node.js, Express, TypeScript, PostgreSQL-ready Drizzle schema, and versioned REST API foundation.
- `database/`: reserved for local database deployment and operational assets.
- `docs/`: product, architecture, and manifesto documentation.

## Run locally

Open two terminals.

```bash
cd frontend
npm install
npm run dev -- --port 5188
```

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API is available at `http://127.0.0.1:3000/health`. The frontend reads `VITE_API_URL` from `frontend/.env` and defaults to that local address.

## Deploy TOP

TOP is prepared for a production split with Netlify hosting the frontend, Render hosting the API, Supabase providing PostgreSQL, and Spaceship managing `t0p.world`. Follow the complete guide in [docs/deployment-netlify-render-supabase.md](docs/deployment-netlify-render-supabase.md).

## Product direction

TOP is not optimized for scrolling, watch time, or popularity. It is organized around a practical loop:

```text
Idea → Action → Collaboration → Reflection → Growth
```

The Three.js world visualizes genuine activity from the Web2 platform; it is never a replacement for real life.
