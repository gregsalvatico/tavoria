# Tavoria web

The web app for venues (hotels, restaurants, bars, cafés). Next.js + TypeScript + Tailwind.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Stop with `Ctrl+C`.

## Admin

Open `/admin/login`. The admin area uses the server-side `ADMIN_PASSWORD` and
`ADMIN_SESSION_SECRET` environment variables, along with
`SUPABASE_SERVICE_ROLE_KEY`. Keep these values in the local environment or
deployment secrets; never expose or commit them. The admin login is a single
operator credential, separate from customer accounts.

The admin area can search accounts, remove a venue and its shifts, pause or
republish shifts, and permanently delete an account with its profiles,
applications, documents, and uploaded media.
