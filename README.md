# Qipi

**Qi (七)** means seven in Chinese. **Pi (ពីរ)** means two in Khmer. Seven days make a week; two of them are the weekend, when people can get out and travel. Qipi helps people turn those two days into trips and stories.

This repository is an MVP demo for Cambodia travelers. People can share travel stories from any destination or publish a trip that others can request to join. The Safety area provides emergency numbers, check-ins, trusted contacts, destination search, and temporary location sharing. The social feed supports English (default), Khmer, and Chinese. The deployed demo is [qipi.vercel.app](https://qipi.vercel.app/); local changes are not live until deployed.

## Run locally

Requires Node.js 24, matching the Vercel runtime pinned in package.json ([supported versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)). Install dependencies, then start the Next.js development server:

```bash
pnpm install
pnpm dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). `npm install` and `npm run dev` work as well. The Next.js API route uses local JSON storage unless the Supabase environment variables are configured.

Local development uses `data/store.json` unless both `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set. Put local variables in an ignored `.env.local` file, using `.env.example` for the names. Without Auth settings, local development keeps the original browser-token demo flow. To test real sign-in locally, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` without the secret key; the app then uses Supabase Auth and local JSON data. Add the local URL to Supabase Auth's redirect allowlist if you want email confirmation links to return to localhost.

To enable the moderation page, start the server with a private admin token:

```bash
QIPI_ADMIN_TOKEN='choose-a-long-random-secret' npm run dev
```

Then open [http://127.0.0.1:4173/admin.html](http://127.0.0.1:4173/admin.html) and enter that token. Do not expose a token in a public repository or share it with travelers.

Run the regression tests and production checks:

```bash
pnpm test
pnpm build
pnpm check:production
```

The production check starts the actual built Next.js server against disposable, in-memory Supabase-compatible endpoints. It checks page routes, browser modules, security headers, server-side Auth verification, database writes, image delivery, and deployment file traces. It does not connect to your Supabase project. Add `--keep-open --port=4175` to inspect that isolated production preview in a browser.

## Supabase and Vercel

1. Create a Supabase project. Run [0001_qipi_state.sql](supabase/migrations/0001_qipi_state.sql) in its SQL Editor.
2. In Storage, create a **public** bucket named `qipi-images`, set the maximum file size to **5 MiB**, and allow only `image/jpeg`, `image/png`, and `image/webp`. Then run [0002_qipi_images.sql](supabase/migrations/0002_qipi_images.sql) in the SQL Editor. The policy lets signed-in users upload only to their own profile or trip folder. Public bucket URLs can be viewed by anyone who has them.
3. Run [0003_qipi_chat.sql](supabase/migrations/0003_qipi_chat.sql) and [0004_qipi_safety.sql](supabase/migrations/0004_qipi_safety.sql) in the SQL Editor. The Safety migration creates private tables for trusted contacts, temporary sharing sessions, and check-ins.
4. In Supabase, copy the **Project URL**, **publishable API key** (`sb_publishable_...`), and create a **secret API key** (`sb_secret_...`). The publishable key is returned to the browser for Supabase Auth and Storage uploads; the secret key must stay on the server. Both use the `apikey` header, while signed-in user JWTs use `Authorization` ([Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)).
5. Import this GitHub repository into Vercel with the **Next.js** framework preset and the repository root as the Root Directory. Use Node.js **24.x**, `pnpm build` as the build command, and the framework's default output directory. Vercel builds the Next.js App Router pages and API route handlers.
6. In Vercel project settings, set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_PUBLISHABLE_KEY` for Production and Preview, pointing each environment at its intended project. Set `QIPI_ADMIN_TOKEN` if you want the moderation page. Redeploy after adding variables. The CSP derives its allowed Supabase origin from `SUPABASE_URL`; no project URL is hardcoded.
7. In Supabase Authentication → URL Configuration, set the Site URL and an allowed redirect URL to `https://qipi.vercel.app/`. Keep email confirmation enabled. New users must follow their confirmation email before signing in.
8. Optionally set `MAPTILER_PUBLIC_KEY` and `OPENROUTESERVICE_API_KEY` in Vercel for destination search and in-app driving directions. Restrict the MapTiler key to Qipi domains; it is public in `/api/config`. Keep the openrouteservice key server-side. MapTiler's free tier is for development or noncommercial use; a commercial production deployment needs an appropriate plan. Without these keys, Safety shows the current position on an OpenStreetMap pilot embed and links to external destination search.
9. Open the Vercel URL and check `/api/health` for `"storage":"supabase"`, then create an account, confirm its email, post a test story, and submit a join request from a second account. Check `/admin.html` with your admin token if configured.

Use [.env.example](.env.example) as a list of environment variable names. Never commit real keys or prefix the secret/admin variables with `NEXT_PUBLIC_`. Only the publishable key and project URL are returned to the browser. Vercel API and media handlers fail with a service error when configuration is incomplete; they never fall back to writing a local JSON file. Existing projects with both migrations already applied do not need a database migration for this refactor.

## What the demo includes

- An Instagram-inspired community feed for travel stories and optional group trip posts. Explore destinations are derived from member posts; fixed pilot routes are no longer part of the main browsing and posting flow.
- A Settings page for account profile details and English, Khmer, or Chinese language selection.
- Profile photo uploads and optional trip photos use the `qipi-images` Supabase Storage bucket (JPG/PNG/WebP, up to 5 MiB per image).
- Supabase email/password accounts with email confirmation and password reset. Guests can browse; members can post trips, request to join, and submit route notes. The server checks each access token with Supabase Auth before these actions.
- Trip filtering, shareable links, join requests, host approval or decline, capacity tracking, and trip closure. Account ownership works across devices. Existing pilot trips retain their browser-token controls.
- A shared profile view with posts, follows, owner editing, and the owner's join request status.
- Authenticated one-to-one text chat with an inbox, unread counts, message history, and periodic refresh. Apply [0003_qipi_chat.sql](supabase/migrations/0003_qipi_chat.sql) to Supabase before enabling chat on a hosted project.
- A Safety area with Cambodia emergency call links, private trusted contacts, check-ins, and revocable 15/30/60-minute live location links. A member can send an active location link to an existing Qipi conversation. Location updates require an open, visible browser tab, GPS permission, and connectivity. Qipi does not dispatch emergency responders or automatically alert contacts.
- Destination search through MapTiler and driving instructions through openrouteservice when configured. The destination map uses OpenStreetMap's pilot embed and links to an interactive route map. There is no offline or background turn-by-turn navigation.
- Search results and filters, removable recent-search history, and saved trips in the owner’s profile tab.
- Reporting and a small moderation dashboard for route notes, reports, and trip hiding.
- Local file-backed demo data in `data/store.json`, created automatically on first run. On Vercel, the same API uses the Supabase row instead of the local file.

The app uses Next.js App Router with JavaScript, React, Tailwind CSS, and a Node.js API runtime. The browser controllers retain the current DOM-based interface inside a React page shell. Supabase remains the shared store in deployed instances, while the local JSON file is available for development. Route guides are planning ideas, not live road, weather, price, or safety information. Travelers should check current conditions before departure.

## Code organization

| Location | Responsibility |
| --- | --- |
| `app/` | Next.js pages, API/media route entry points, and initial theme script |
| `public/app.js` | Application orchestration, navigation, and delegated actions/forms |
| `public/js/` | Shared state, routing, HTTP client, feed/profile/search controllers, image uploads, dropdowns, and skeleton rendering |
| `public/auth.js` | Supabase browser sessions, token refresh, sign-in, signup, and profile updates |
| `public/locales/` | Final English, Khmer, and Simplified Chinese messages |
| `public/css/` | Readable stylesheets imported in their preserved cascade order |
| `src/server/` | Account/trip/community endpoints, validation, ownership checks, HTTP adaptation, and media delivery |
| `src/config.mjs`, `src/runtime-store.mjs` | Runtime environment validation and storage selection |
| `src/store.mjs` | Local atomic writes and Supabase compare-and-swap persistence |
| `src/ui/QipiShell.jsx`, `src/ui/pages/`, `src/ui/components/` | Shared Next shell, page definitions, navigation, headings, and dialogs |
| `public/js/trip-card.js`, `public/js/route-config.js` | Shared trip renderer and URL contracts |
| `src/ui/shell.mjs`, `scripts/generate-shell.mjs` | Generate the standalone HTML from the same page components |

The saved browser keys, public URLs, request/response shapes, and Supabase JSONB data format remain compatible. The synchronous startup script stays separate from application modules so saved themes and first-visit routing can apply before the app renders.

## Demo limits and next step

New posts, requests, messages, and Safety records belong to Supabase Auth accounts. Older pilot trips and requests still use browser-local tokens, so clearing local data can lose control of those older records. Chat and Safety data use separate private relational tables. There is no identity verification, payments, booking, automated SOS, or guaranteed background tracking. The Supabase JSONB row is suitable for a small pilot, but posts and interactions should move to indexed relational tables as usage grows. Before a larger public pilot, add stronger abuse controls, moderation operations, a custom SMTP provider, and a privacy review.

Apply the Safety migration and add the optional map keys before enabling the new production features.

See [the architecture and scaling guide](docs/architecture.md) for component ownership, dynamic slugs, Saved behavior, chat data boundaries, and remaining database migration work.
