# TOP Architecture

TOP is a modular Web2 application. The practical platform and the Three.js experience share the same domain data rather than becoming separate products.

```text
Vue application + Three.js world
            ↓
     Node.js Express API
            ↓
        PostgreSQL
```

## Domain model

- **Profiles** describe a person’s identity, interests, and demonstrated skills.
- **Seeds** are early ideas that can grow through contribution.
- **Projects** turn a seed into purposeful, collaborative work.
- **Contributions** record meaningful work rather than popularity signals.
- **Circles** are intentionally small communities.
- **Mentorships** connect people through real learning goals.
- **Reflections** support intentional review and future focus.

The API owns this data. Vue renders it as a practical interface, while Three.js translates it into visual metaphors such as seeds, worlds, branches, constellations, and landmarks.

## Local platform services

- `frontend/` communicates with the API through `VITE_API_URL`.
- `backend/` exposes a health check at `/health` and versioned routes beneath `/api/v1`.
- `backend/` currently provides the workspace bootstrap data at `/api/v1/workspace/overview`.
- `database/compose.yaml` provides PostgreSQL for local development.
- The health route remains available without PostgreSQL so interface work is not blocked by database setup.

## Design constraints

- Conventional Web2 accounts, APIs, databases, and permission systems.
- No blockchain, wallets, tokens, NFTs, or Motoko dependencies.
- Three.js is used directly in the browser; Blender is not required.
- Begin as a modular monolith, not microservices.
