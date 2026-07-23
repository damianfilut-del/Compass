# מצפן טייב לחינוך — כלי סקר בסיס

Next.js app: public scenario-based survey (15 questions, 6 principles) + a
password-protected admin dashboard (add local authorities, view aggregated
baseline results per authority).

## Local development

```
npm install
npm run dev
```

Without a `POSTGRES_URL` environment variable, data is stored in a local
`data.local.json` file (auto-created) so you can try the app without a real
database. Set `ADMIN_PASSWORD` in a `.env.local` file to access `/admin`, e.g.:

```
ADMIN_PASSWORD=choose-a-password
```

## Production (Vercel)

1. Create a Postgres database from the Vercel project's Storage tab and link
   it to this project — Vercel automatically sets `POSTGRES_URL` and related
   env vars, and the app's data layer (`lib/db.js`) will use them automatically.
2. Add an `ADMIN_PASSWORD` environment variable in Vercel project settings.
3. Deploy. The public survey lives at `/`, the admin dashboard at `/admin`.

See the accompanying deployment guide for click-by-click instructions.
