# IDX Slot Bot Checker

A Vercel-ready Next.js app for comparing a trigger transaction against bot transactions by:

- slot
- intra-slot transaction index
- same-slot index delta
- estimated delay in milliseconds

It accepts either raw transaction signatures or Solscan transaction URLs.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then set:

```bash
SERVER_DEFAULT_RPC_URL=
SITE_PASSWORD=
SITE_SESSION_SECRET=
```

- `SERVER_DEFAULT_RPC_URL`: server-only RPC used by the API route
- `SITE_PASSWORD`: password required to access the site
- `SITE_SESSION_SECRET`: long random secret used to sign the session cookie

The RPC URL is kept server-side only and is not sent to the browser.

## Deploy to Vercel

```bash
npm install
npm run build
```

Then import the repo into Vercel and configure the env vars in the Vercel dashboard.
