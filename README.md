# tablemates

Mobile-first multiplayer game platform. Visual source of truth:

https://www.figma.com/design/tE15PVyJVeYZ6XP0d0xfMc/Untitled?node-id=0-1

Read `docs/FOUNDATIONS.md` before adding screens, tokens, or games.

## Run

```bash
npm install
npm run tokens
npm run party
npm run dev
```

- App: http://localhost:3000
- PartyKit rooms: http://127.0.0.1:1999
- Storybook: `npm run storybook` → http://localhost:6006

## Platform first

The home catalog is implemented from Figma. Session rooms, invite codes, QR, scores, pause/resume, and leaderboards are platform APIs. The first game (tic-tac-toe) is not built yet.
