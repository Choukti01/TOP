# TOP database

TOP uses PostgreSQL as its primary Web2 database. The local development service matches the `DATABASE_URL` in `backend/.env.example`.

## Start PostgreSQL

```bash
cd database
docker compose up -d
```

Then, from `backend/`, generate and apply the initial schema:

```bash
npm run db:generate
npm run db:migrate
```

The Docker volume `top-postgres-data` keeps local data between restarts. To remove that local data deliberately, run `docker compose down -v` from this directory.
