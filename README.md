# tablemates

Mobile-first multiplayer game platform. Visual source of truth:

https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/Untitled?node-id=0-1

Live sites:

- GitHub Pages: https://bubbafrye.github.io/tablemates/
- Personal host: https://hurstfrye.com/tablemates/ (see [`docs/DEPLOY-HURSTFRYE.md`](docs/DEPLOY-HURSTFRYE.md))

Read `docs/FOUNDATIONS.md` before adding screens, tokens, or games.

Backend for novices (Cloudflare Workers, Durable Objects, PartyServer, free-tier limits): [`docs/BACKEND.md`](docs/BACKEND.md) — also linked as **Readme** from the usage dashboard (footer → “Made for fun by Jason”).

## Run locally

```bash
npm install
npm run tokens
npm run party
npm run dev
```

- App: http://localhost:3000
- PartyServer rooms: http://127.0.0.1:8787
- Storybook: `npm run storybook` → http://localhost:6006

## GitHub Pages

The site is a **static export** deployed by `.github/workflows/deploy-pages.yml`.

1. Repo **Settings → Pages → Build and deployment → Source**: **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main` (or run the workflow manually). The Action builds with `basePath=/tablemates` and publishes the `out/` folder.
3. Optional repo **Variables** (Settings → Secrets and variables → Actions → Variables):
   - `NEXT_PUBLIC_PARTY_HOST` — PartyServer host after `npm run party:deploy` (e.g. `tablemates.yourname.workers.dev`)
   - `NEXT_PUBLIC_CONTACT_EMAIL` — footer mailto

Without `NEXT_PUBLIC_PARTY_HOST`, the catalog still loads; live rooms only work against a deployed PartyServer (or local `npm run party`).

## hurstfrye.com (optional mirror)

Pushing to `main` also runs `.github/workflows/deploy-hurstfrye.yml`, which uploads the same static `out/` build over FTPS to Network Solutions at `/tablemates/`. Pages stays enabled.

Finish the one-time FTP secrets in [`docs/DEPLOY-HURSTFRYE.md`](docs/DEPLOY-HURSTFRYE.md) (Network Solutions hosting uses FTPS, not SSH).

## Platform first

The home catalog is implemented from Figma. Session rooms, invite codes, QR, scores, pause/resume, and leaderboards are platform APIs. The first game (tic-tac-toe) is not built yet.
