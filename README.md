# Qipi

**Qi (七)** means seven in Chinese. **Pi (ពីរ)** means two in Khmer. Seven days make a week; two of them are the weekend, when people can get out and travel. Qipi helps people turn those two days into trips and stories.

This repository is an MVP demo for Cambodia travelers. It starts with the Kampot–Kep–Bokor area and focuses on a single flow: explore a route, post or find a trip, request to join, and let the host decide. The interface is available in Khmer and English.

## Run locally

Requires Node.js 20 or newer. There are no package dependencies.

```bash
cd /home/vireak/Documents/start-up/qipi
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). If `npm` is unavailable, run `node server.mjs` from this directory. In this Codex workspace, Node is bundled at `/home/vireak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`, so that full path can replace `node`. Set `PORT` and `HOST` to change the listening address.

Local development uses `data/store.json` unless both Supabase environment variables are set. To enable the moderation page, start the server with a private admin token:

```bash
QIPI_ADMIN_TOKEN='choose-a-long-random-secret' npm run dev
```

Then open [http://127.0.0.1:4173/admin.html](http://127.0.0.1:4173/admin.html) and enter that token. Do not expose a token in a public repository or share it with travelers.

Run the API tests with `npm test` (or `node --test`).

## Supabase and Vercel

1. Create a Supabase project. Run [0001_qipi_state.sql](supabase/migrations/0001_qipi_state.sql) in its SQL Editor. It creates one private, versioned JSONB row for the pilot data.
2. In Supabase, copy the **Project URL** and create a new **secret API key** (`sb_secret_...`). Keep the key on the server; the browser does not use it.
3. Import this GitHub repository into Vercel with the **Other** framework preset and the repository root as the Root Directory. The `public` folder is the static output and `api/index.mjs` is the server function; `vercel.json` routes `/api/*` to it.
4. In Vercel project settings, set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `QIPI_ADMIN_TOKEN` for the environments you deploy. Redeploy after adding them.
5. Open the Vercel URL and check `/api/health` for `"storage":"supabase"`, then post a test trip and submit a join request from a second browser. Check `/admin.html` with your admin token.

Use [.env.example](.env.example) as a list of environment variable names. Never commit real keys. To use Supabase during local development, export those variables before starting `npm run dev`.

## What the demo includes

- Three bilingual route guides with stops, cost checklists, source links, and a way to submit recent route notes for moderation.
- A trip board filtered by route, trip posting, shareable trip links, join requests, host approval or decline, capacity tracking, and trip closure.
- A browser-local “My trips” view for hosted trips and join request status.
- Reporting and a small moderation dashboard for route notes, reports, and trip hiding.
- Local file-backed demo data in `data/store.json`, created automatically on first run. On Vercel, the same API uses the Supabase row instead of the local file.

The app uses a Node.js HTTP server and plain HTML, CSS, and JavaScript. There is no build step or framework. Supabase is the shared database for deployed instances; the local file remains the default for development. Route guides are planning ideas, not live road, weather, price, or safety information. Travelers should check current conditions before departure.

## Demo limits and next step

Host and traveler permissions use random tokens stored in the current browser. Clearing its local data or moving to another device loses access to those controls. There are no user accounts, identity verification, private messaging, payments, booking, live location, or emergency SOS. The Supabase row is suitable for a small pilot, but should become relational tables as usage grows. Do not use this demo as an open public service without authentication, stronger abuse controls, and privacy review.

The next implementation milestone is account-based access and a private way for approved travelers to coordinate, while retaining the route → trip → request → approval flow.
