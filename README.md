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

Create `.env.local` from `.env.example` if you want a default RPC prefilled in the UI and used by the API:

```bash
cp .env.example .env.local
```

Then set one or both:

```bash
NEXT_PUBLIC_DEFAULT_RPC_URL=
SERVER_DEFAULT_RPC_URL=
```

- `NEXT_PUBLIC_DEFAULT_RPC_URL`: pre-fills the RPC field in the browser
- `SERVER_DEFAULT_RPC_URL`: server-side fallback if the form omits RPC

## Deploy to Vercel

```bash
npm install
npm run build
```

Then import the repo into Vercel and configure the env vars in the Vercel dashboard.
