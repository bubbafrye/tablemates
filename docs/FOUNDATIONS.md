# Tablemates foundations

This document is the working contract for the platform. The Figma file is the visual source of truth. This file records architecture, tokens, and gaps so later work stays aligned.

## Source of truth

- Figma: https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/Untitled?node-id=0-1
- File key: `tE15PVyJVeYZ6XP0d0xfMc`
- Page: `site` (`0:1`) for catalog; `tic-tac-toe` (`22:3195`) for the first game
- Tokens source: `design/tokens.json` (synced from Figma variables + frame measurements)
- Generated CSS: `src/styles/tokens.css` via `npm run tokens`
- Game modules: `/_tic-tac-toe` at project root (imported as `@_tic-tac-toe/*`)

Do not invent UI patterns. If a screen is not in Figma, ask before designing it. Compose from existing components if a holding surface is required to ship a platform capability.

## What the designed file covers

Responsive catalog / home: (page `site` `0:1`)

| Frame | Node | Layout |
| --- | --- | --- |
| mobile (393) | `20:2083` | 1-col `sm` cards. Register CTA stacked. |
| 640–899 | `20:2158` | `xs` cards, equal flex spacers (2-col until 3 fit). Register CTA stacked. |
| 900–1023 | `20:1976` | 3-col `xs` cards, equal flex spacers. Register CTA. |
| 1024–1280 | `20:277` | 3-col `xs` cards, equal flex spacers. Register CTA, lede under title row. |
| >1280 | `20:1773` | 3-col `sm` cards, equal flex spacers. Register CTA side-by-side. |

Tic-tac-toe (page `tic-tac-toe` `22:3195`):

| Frame | Node | Layout |
| --- | --- | --- |
| `<740` | `26:6973` | Stacked players, `sm` board, exit + Invite others |
| `740+` | `26:6776` | Side-by-side players, `med` board, exit + Invite others |
| `share-modal` | `26:7720` | QR + “share link” (opened from Invite others) |

Game code lives in `/_tic-tac-toe` (project root). Catalog id: `tic-tac-toe`.

Components:

- `header` (`25:4348`) — brand always; hidden `room-code` shown in-session
- `logo` (`18:140`)
- `Button-primary` (`17:29`) — Default, Hover, Pressed, Focused, Disabled
- `Button-secondary` (`13:90`) — same states
- `Button-plain` (`25:4845`) — same states; used for Join inside `input`
- `input` (`25:5010`) — field + buttons slot (`Button-plain` or `Button-secondary`)
- `qr` (`24:4150`) — med / sm; `qr-btn` uses sm inside header room-code
- `game-card` (`20:201`) — Default / sm / xs
- `cards` (`20:571`) — `<600` / `600-1280` / `>1280`
- `hero-image` (`21:2757`) — lg 380×225, med 336×196, sm 246×143
- `app-icon` (`26:7892`) — tic-tac-toe card art (exported to `public/assets/tic-tac-toe/hero-{lg,sm,xs}.png`)
- `text-title` (`9:51`), `text-description` (`9:52`)

Copy (use verbatim):

- Wordmark: `table` + `mates`
- Hero: `Pick a game. Bring your people.`
- Hero lede: `Choose a game and start a new round, or join an existing game by entering its code.`
- Join placeholder: `Enter room code...`
- Join action: `Join` (Button-plain + launch icon)
- Room code label: `Room code:`
- Card title: `Game Name` (until a real game is registered)
- Card lede: `Game description.  Short text.  Two sentences maximum. Short text.  Two sentences maximum. Short text.  Two sentences maximum. `
- Launch button: `Launch`
- Register heading: `Someone's got to kick things off...`
- Register lede: `To get a private room, I'll need an email to tie things to.  Use a real one, and you can revisit old lobbies you've started and maintain leaderboards. Don't worry, I won't sell or spam you. `
- Register placeholder: `you@yourface.com`
- Register button: `Register`
- Footer: `Made for fun by Jason` / `Hit me up`

## What the designed file does not cover

These were requested for the platform but have **no frames** in Figma:

- Session / lobby screen body for non–tic-tac-toe games (header room-code is designed; the rest is not)
- In-game chrome beyond what tic-tac-toe covers (generic pause / resume / scores UI)
- Auth beyond the email field
- Additional games beyond tic-tac-toe

Until those are designed, non–tic-tac-toe session routes only compose `SiteHeader` (with `roomCode`), `SiteFooter`, `Button`, `JoinField` / `input` patterns, `GameCard` surface tokens, and type styles. Treat those as temporary compositions, not new patterns.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js App Router + TypeScript (`output: "export"`) | Mobile-first web; static export for GitHub Pages (`/tablemates` basePath) |
| Styles | CSS modules + generated custom properties | Figma instruction: do not add Tailwind. Tokens stay the single source of values. |
| Components | Storybook | Authenticate each design-system piece in isolation |
| Realtime | PartyKit | Free Cloudflare-backed rooms; already familiar. Room id = invite code. |
| Invites | 6-char code + URL + QR | Code is shareable over IM; QR encodes the session URL for nearby join |
| Host identity | Email in `localStorage` | Matches the Register copy. No email vendor yet. |

PartyKit alternatives if we outgrow it: Cloudflare Durable Objects directly, or PartyKit's Cloudflare-native path. Do not add a paid realtime vendor unless asked.

## Platform APIs (all games)

Games talk to the session room. They do not implement their own scoring or pause.

Client module: `src/platform/session.ts` (`useSession`).

| Capability | Client | Room message |
| --- | --- | --- |
| Create / join | Navigate to `/s/{code}?game={id}` (host) or `/s/{code}` (guest) | `hello` |
| Pause | `session.pause()` | `pause` |
| Resume | `session.resume()` | `resume` |
| Score | `session.setScore(playerId, value)` / `adjustScore(playerId, delta)` | `score` |
| Leaderboard | `session.leaderboard` (room) + Party `leaderboard` (high scores) | persisted on score |

Invite URL shape: `{origin}/s/{CODE}`. QR encodes that URL.

## Catalog

`src/platform/catalog.ts` is the registry. Home renders one `GameCard` per entry. Placeholder entries match Figma dummy cards. Replace an entry when a game is built — do not hardcode cards in the page.

## Breakpoints

Implemented from frame names, not invented:

- default: mobile (393) — hero/library 20px horizontal; register CTA with 30px section padding; `sm` cards fill the padded column (max 370), 1 column
- `640`–`899`: intro/register 72px + 20px; library 10px; `xs` cards, `space-evenly` (2-col until 3 fit)
- `900`–`1279`: `xs` cards, 3 columns, `space-evenly` (`cards` Property 1=600-1280)
- `1024`: hero / register become side-by-side
- `1280`: `sm` cards, 3 columns, `space-evenly`

## Changing tokens

1. Update values in Figma (preferred) or `design/tokens.json`
2. Run `npm run tokens`
3. Do not edit `src/styles/tokens.css` by hand
