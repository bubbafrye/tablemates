# Tablemates backend

A short guide for all the moving parts

## The big picture

tablemates is split into two pieces:

| Piece | What it is | Where it lives |
| --- | --- | --- |
| **Frontend (the site)** | Static web app (Next.js export) | GitHub Pages — [bubbafrye.github.io/tablemates](https://bubbafrye.github.io/tablemates/) — and optionally [hurstfrye.com/tablemates](https://hurstfrye.com/tablemates/) ([deploy doc](./DEPLOY-HURSTFRYE.md)) |
| **Backend (live rooms)** | Realtime game servers | Cloudflare Workers + Durable Objects — e.g. `tablemates.*.workers.dev` |

The website alone can show the catalog and UI. **Starting or joining a live multiplayer game** needs the Cloudflare backend, because every room is a long-lived server that keeps players in sync over WebSockets. Solo games (`catalog.multiplayer === false`, currently 2048 and Space Rocks) play entirely in the browser. 2048 POSTs a personal best to the Leaderboard HTTP API. Space Rocks reads/writes sector high scores to the existing PHP board on hurstfrye.com. They do not open a Session room.

```
Browser  ──HTTP──►  GitHub Pages (HTML/CSS/JS)
Browser  ──WSS───►  Cloudflare Worker → Durable Object (one per room code)
```

## Services involved

### 1. GitHub Pages (and optional hurstfrye.com)

Hosts the built frontend (`out/` from `npm run build`). No Node server.

- Pages: `.github/workflows/deploy-pages.yml`
- Personal server mirror: `.github/workflows/deploy-hurstfrye.yml` → [DEPLOY-HURSTFRYE.md](./DEPLOY-HURSTFRYE.md)

Important build variables:

- `NEXT_PUBLIC_BASE_PATH` — `/tablemates` on Pages and hurstfrye.com
- `NEXT_PUBLIC_PARTY_HOST` — hostname of the Cloudflare Worker (without `https://`)

### 2. Cloudflare Workers

A small edge program that receives every backend request/WebSocket. Entry: `party/index.ts`. It routes URLs like:

`/parties/session/ABC123` → the **Session** Durable Object named `ABC123`  
`/parties/stats/global` → the **Stats** Durable Object  
`/parties/leaderboard/global` → the **Leaderboard** Durable Object

Locally: `npm run party` (Wrangler) → `http://127.0.0.1:8787`  
Production: `npm run party:deploy` → your `*.workers.dev` host

### 3. Durable Objects 

A **Durable Object** is a tiny single-threaded server Cloudflare keeps for a specific name (here: a room code). All players in room `RH9RNJ` talk to the **same** object, so they share one source of truth.

This project defines three classes (`wrangler.jsonc`):

| Class | Binding / party name | Role |
| --- | --- | --- |
| `Session` | `session` | One live game room: players, scores, pause, game payload |
| `Stats` | `stats` | Registry of open rooms for the usage dashboard |
| `Leaderboard` | `leaderboard` | High-score lists per game |

**Hibernation** is enabled: when a room is idle, Cloudflare can sleep the object to reduce **duration** billing while keeping the design cheap on the free plan.

### 4. PartyServer + PartySocket

- **PartyServer** (`partyserver`) — library that turns Durable Objects into room-style servers with `onConnect` / `onMessage` / `onClose`
- **PartySocket** (`partysocket`) — browser client used in `src/platform/session.ts` to open the WebSocket

You can think of them as “PartyKit-style rooms on Cloudflare.”

## What happens when you Launch a game

1. Multiplayer: the site creates a 6-character **room code** and navigates to `/s/?code=XXXXXX&game=rakko` (or tic-tac-toe). Solo: `/play/?game=2048` with no room.
2. The browser opens a WebSocket to `wss://<PARTY_HOST>/parties/session/XXXXXX`.
3. The Worker wakes (or creates) the Session Durable Object for that code.
4. First connected player becomes **host** (`hostId`). Hosts can start rounds / play bot; guests primarily Ready + wait.
5. Game logic updates are sent as `{ type: "game", payload }` messages; the Session stores and broadcasts state.

Joining is the same path with someone else’s code (often from Invite / QR).

## Free-tier limits

Durable Objects on the Workers **free** plan include a daily **duration** budget (wall-clock time objects stay awake), currently **13,000 GB-s / day**, resetting at **00:00 UTC**.

If that quota is exhausted, the Worker returns errors (often Cloudflare `1101`). The site then cannot connect: lobbies look “join only,” and the usage dashboard cannot load live rooms.

Mitigations in this codebase:

- WebSocket **hibernation** on Session / Stats / Leaderboard
- Usage dashboard **Close** on a room (kicks sockets, **seals** the room so reconnects are rejected, and drops it from Stats)
- Live room rows show client **IP / country / colo / browser** from the Cloudflare edge request (helps find abandoned tabs on other devices)
- Connection banner shows time until the daily reset
- Usage dashboard progress bar fed by a **GraphQL Analytics snapshot** (see below)

Upgrading the Cloudflare Workers plan removes that daily ceiling (paid quotas apply instead).

## DO duration progress bar

GitHub Pages never sees Cloudflare credentials. The Party Worker holds:

- `CF_API_TOKEN` — Account Analytics: Read (Wrangler secret)
- `CF_ACCOUNT_ID` — account tag (Wrangler secret)

Every ~10 minutes (cron) and on Stats `GET` when the snapshot is older than 10 minutes, the Worker queries Cloudflare GraphQL for today’s `durableObjectsPeriodicGroups.sum.duration` (treated as GB-s), stores `{ usedGbS, limitGbS, asOf }` on the Stats Durable Object, and returns it as `doQuota` on `/parties/stats/global`. The Pages site only reads that public JSON.

GraphQL is usage telemetry, not Cloudflare’s official remaining free-tier meter — good enough for the bar; it can lag slightly.

```bash
npx wrangler secret put CF_API_TOKEN
npx wrangler secret put CF_ACCOUNT_ID
```

Locally, put the same keys in `.dev.vars` (gitignored).

## Usage dashboard

Click the plain text **Made for fun by Jason** in the footer. The popup shows:

- Free-tier DO duration progress (from `doQuota`) + reset countdown
- Live open lobbies / games / connections (from Stats)
- Per-room **Close**
- High scores (from Leaderboard), when reachable
- This browser’s localStorage identity (player id, email, rooms you launched)

## Key files

| Path | Purpose |
| --- | --- |
| `party/index.ts` | Worker fetch router + cron quota refresh |
| `party/doUsage.ts` | Cloudflare GraphQL DO-duration fetch |
| `party/session.ts` | Room Durable Object |
| `party/stats.ts` | Live-room registry + close API + quota snapshot |
| `party/leaderboard.ts` | High scores |
| `wrangler.jsonc` | Worker name, DO bindings, migrations, cron |
| `src/platform/session.ts` | Browser WebSocket / session hooks |
| `src/platform/stats.ts` | Dashboard fetch + closeRoom |
| `src/platform/site.ts` | `partyHost()` / `partyHttpOrigin()` |
| `src/platform/codes.ts` | Room codes + invite URLs |

## Run it yourself

```bash
npm install
npm run tokens
npm run party          # terminal 1 — backend
npm run dev            # terminal 2 — frontend at :3000
```

Point `NEXT_PUBLIC_PARTY_HOST` at `127.0.0.1:8787` locally (see `.env.example`). For production Pages, set the same variable to your deployed Worker hostname in GitHub Actions variables.

## Further reading

- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [PartyServer](https://github.com/threepointone/partyserver)
- Project foundations: `docs/FOUNDATIONS.md`
