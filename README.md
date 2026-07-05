# Tavoria

Hospitality staffing marketplace for Milan. Venues post shifts, workers apply with a 30-second video, hires happen the same day.

Live at: [tavoriapp.com](https://tavoriapp.com) (landing) · [app.tavoriapp.com](https://app.tavoriapp.com) (worker app)

Operated by K3Y Solutions S.r.l.

---

## Monorepo layout

| Folder | What it is | Stack | Deployed to |
|---|---|---|---|
| [`tavoria-web/`](./tavoria-web) | Marketing landing + venue QR pages (`/v/<id>`) + hidden `/oli-blu` | Next.js 15 (App Router) | `tavoriapp.com` |
| [`tavoria-worker/`](./tavoria-worker) | The worker & venue app — signups, QR scan, apply, post shifts | Expo SDK 54 (React Native, web-first) | `app.tavoriapp.com` |
| [`tavoria-worker-v2/`](./tavoria-worker-v2) | v2 rewrite (design-system-first, incremental) | Expo SDK 54 | not deployed |

Backend: Supabase (Postgres + Auth + Storage + Edge Functions). Project ID lives in each subproject's `.env.local` (never committed).

---

## Local dev

Each subproject is independent — no root package.json.

```bash
# Marketing / landing
cd tavoria-web && npm install && npm run dev

# Worker app
cd tavoria-worker && npm install --legacy-peer-deps && npx expo start --web
```

Environment: copy `.env.local.example` → `.env.local` in each subproject and fill in Supabase keys from the dashboard.

---

## Deploy

Both projects auto-deploy to Vercel:

```bash
# From the relevant subproject folder
vercel --prod
```

---

## License

Proprietary. All rights reserved.
