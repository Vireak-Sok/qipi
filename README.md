# Qipi

**Qi (七)** means seven in Chinese. **Pi (ពីរ)** means two in Khmer. Seven days make a week; two of them are the weekend, when people can get out and travel. Qipi helps people turn those two days into trips and stories.

This repository is an MVP demo for Cambodia travelers. It starts with the Kampot–Kep–Bokor area and focuses on a single flow: explore a route, post or find a trip, request to join, and let the host decide. The social feed supports English (default), Khmer, and Chinese, with account and language controls in Settings. The deployed demo is [qipi.vercel.app](https://qipi.vercel.app/).

## Run locally

Requires Node.js 20 or newer. There are no package dependencies.

```bash
cd /home/vireak/Documents/start-up/qipi
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). If `npm` is unavailable, run `node server.mjs` from this directory. In this Codex workspace, Node is bundled at `/home/vireak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`, so that full path can replace `node`. Set `PORT` and `HOST` to change the listening address.

Local development uses `data/store.json` unless both `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set. Without Auth settings, local development keeps the original browser-token demo flow. To test real sign-in locally, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` without the secret key; the app then uses Supabase Auth and local JSON data. Add the local URL to Supabase Auth's redirect allowlist if you want email confirmation links to return to localhost.

To enable the moderation page, start the server with a private admin token:

```bash
QIPI_ADMIN_TOKEN='choose-a-long-random-secret' npm run dev
```

Then open [http://127.0.0.1:4173/admin.html](http://127.0.0.1:4173/admin.html) and enter that token. Do not expose a token in a public repository or share it with travelers.

Run the API tests with `npm test` (or `node --test`).

## Supabase and Vercel

1. Create a Supabase project. Run [0001_qipi_state.sql](supabase/migrations/0001_qipi_state.sql) in its SQL Editor. It creates one private, versioned JSONB row for the pilot data.
2. In Storage, create a **public** bucket named `qipi-images`, set the maximum file size to **5 MiB**, and allow only `image/jpeg`, `image/png`, and `image/webp`. Then run [0002_qipi_images.sql](supabase/migrations/0002_qipi_images.sql) in the SQL Editor. The policy lets signed-in users upload only to their own profile or trip folder. Public bucket URLs can be viewed by anyone who has them.
3. In Supabase, copy the **Project URL**, **publishable API key** (`sb_publishable_...`), and create a **secret API key** (`sb_secret_...`). The publishable key is returned to the browser for Supabase Auth and Storage uploads; the secret key must stay on the server.
4. Import this GitHub repository into Vercel with the **Other** framework preset and the repository root as the Root Directory. The `public` folder is the static output and `api/index.mjs` is the server function; `vercel.json` routes `/api/*` to it.
5. In Vercel project settings, set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_PUBLISHABLE_KEY` for Production and Preview. Set `QIPI_ADMIN_TOKEN` if you want the moderation page. Redeploy after adding variables.
6. In Supabase Authentication → URL Configuration, set the Site URL and an allowed redirect URL to `https://qipi.vercel.app/`. Keep email confirmation enabled. New users must follow their confirmation email before signing in.
7. Open the Vercel URL and check `/api/health` for `"storage":"supabase"`, then create an account, confirm its email, post a test trip, and submit a join request from a second account. Check `/admin.html` with your admin token if configured.

Use [.env.example](.env.example) as a list of environment variable names. Never commit real keys. To use Supabase during local development, export those variables before starting `npm run dev`.

## What the demo includes

- Three bilingual route guides with stops, cost checklists, source links, and a way to submit recent route notes for moderation.
- An Instagram-inspired community feed with a dedicated Explore view, story-style route highlights, trip posts, saved trips in the browser, profile settings, a responsive mobile nav, and inline Heroicons.
- A Settings page for account profile details and English, Khmer, or Chinese language selection.
- Profile photo uploads and optional trip photos use the `qipi-images` Supabase Storage bucket (JPG/PNG/WebP, up to 5 MiB per image).
- Supabase email/password accounts with email confirmation and password reset. Guests can browse; members can post trips, request to join, and submit route notes. The server checks each access token with Supabase Auth before these actions.
- Trip filtering, shareable links, join requests, host approval or decline, capacity tracking, and trip closure. Account ownership works across devices. Existing pilot trips retain their browser-token controls.
- A “My trips” view for hosted trips and join request status.
- Reporting and a small moderation dashboard for route notes, reports, and trip hiding.
- Local file-backed demo data in `data/store.json`, created automatically on first run. On Vercel, the same API uses the Supabase row instead of the local file.

The app uses a Node.js HTTP server and plain HTML, CSS, and JavaScript. There is no build step or framework. Supabase is the shared database for deployed instances; the local file remains the default for development. Route guides are planning ideas, not live road, weather, price, or safety information. Travelers should check current conditions before departure.

## Demo limits and next step

New trips and requests belong to Supabase Auth accounts. Older pilot trips and requests still use browser-local tokens, so clearing local data can lose control of those older records. There is no identity verification, private messaging, payments, booking, live location, or emergency SOS. The Supabase row is suitable for a small pilot, but should become relational tables as usage grows. Before a larger public pilot, add stronger abuse controls, moderation operations, a custom SMTP provider, and a privacy review.

The next implementation milestone is a private way for approved travelers to coordinate, while retaining the route → trip → request → approval flow.
