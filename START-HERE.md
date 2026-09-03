# Kaijukaki — Gotta Mint Out!

Source code package, version **1.7**. Single-file web game, plain HTML + CSS + JS.
No framework, no bundler, no build step beyond a `cat`.

---

## ⛔ BEFORE ANYTHING ELSE: the rule that must not be broken

The Kaijukaki collection (8888 hand-drawn busts) **has not been minted in real
life yet**. The game simulates that minting.

If the game's order could be mapped to the real order, someone could open the
game during the actual mint and know whether the next one is rare. That would
ruin the launch. In the project owner's words:

> *"since this is about NFTs and the kaijukaki collection hasn't been minted
> yet, I don't want people using this here to find out what the next mint is
> going to be in real life — like, imagine I'm on the scatter site minting for
> real and it's sitting there at 3343/8888 minted and I go check the game to
> know if 3344/8888 is worth it. we have to shuffle the images and the data
> somehow. without breaking the system, obviously."*

**This comes before everything else. If it ever conflicts with anti-cheat,
telemetry, leaderboards, or any other feature, the anti-spoiler rule wins.**

Read **`docs/03-ANTI-SPOILER-SECURITY.md`** in full before writing the first
line of server code. There's a checklist at the end.

### What was removed from this package

`src/18c-real.js` normally contains `KK_REAL` — the permutation of 1..8888
that links the in-game number to the real file. **It is not here.** The file
has become a placeholder with `KK_REAL = null`, which is exactly what the
public build and the desktop build already use.

The game works 100% without it. The only thing missing is the owner's "local"
build, which reads the original 300px PNGs from his disk. You don't need that.

---

## Run it in 30 seconds

```bash
bash build.sh                 # ~1s, no dependencies at all
```

Generates three files:

| file | what it is |
|---|---|
| `dist/kaijukaki.html` (~15 MB) | **the public build.** Art embedded as base64. Opens with a double click, runs on `file://`, works offline. This is the one you use. |
| `dist/kaijukaki-local.html` (~1.7 MB) | build without embedded art. Since there's no `KK_REAL` in this package, it falls back to the same behavior as the public build, just without art. Ignore it. |
| `desktop/app/index.html` (~1.8 MB) | Electron build. Reads art from `desktop/app/art/*.avif` — run `node tools/extrair-arte.js` once to generate that folder (it doesn't ship in the package because it would be 10 MB duplicating the base64 already in `src/`). |

To run the desktop version:
```bash
bash build.sh                              # REQUIRED first
node tools/extrair-arte.js          # only the first time: generates desktop/app/art/
cd desktop && npm install --include=dev && npm start
```
⚠️ **`bash build.sh` first, always.** `desktop/app/index.html` is a build
artifact and **does not ship in this package** — without running the build,
Electron opens to a blank window (`loadFile` on a file that doesn't exist).
The `desktop/app/art/` folder, on the other hand, does come ready-made.
⚠️ If `npm install` says "up to date" without creating `node_modules`, that's
the machine's `NODE_ENV=production` silently skipping devDependencies. Use
`--include=dev`. This is documented in `desktop/COMO-RODAR.txt`.

To run the tests (the only thing that needs npm at the root):
```bash
npm install                        # just playwright
node tools/leg2.js 1366 900        # readability checker — must return 0
```

---

## How the project is organized

```
src/            44 JS files + 23 CSS + 2 .html. build.sh concatenates them in a FIXED order.
build.sh        the entire build, 25 lines of bash
tools/          readability checkers (Playwright)
desktop/        Electron app (main.js + preload.js + the same game)
docs/           what you're reading, and the rest
```

Of the 44 JS files, **41 go into each build**: the 39 fixed ones plus one art
slot (`18a-sheets` / `18a-nosheets` / `18a-files`) and one map slot
(`18c-noreal` / `18c-real`). The other 3 are the unused alternatives for that
target.

**The order in `build.sh` is a contract, not a style choice.** Swapping the
order of two files can kill the entire game (black screen). This is explained
in `docs/01-ARCHITECTURE.md` §3 ("Why the order matters") — read it before
touching anything.

---

## The documents, in the order worth reading them

| doc | when to read it |
|---|---|
| **`docs/03-ANTI-SPOILER-SECURITY.md`** | **first, always** |
| `docs/01-ARCHITECTURE.md` | before touching the build or adding a file |
| `docs/02-SAVE-AND-STATE.md` | if the work involves save data, accounts, or syncing |
| `docs/04-INTEGRATION-POINTS.md` | where a server would touch it, and what becomes async |
| `docs/05-PITFALLS.md` | 12 bugs that already cost days on this project |
| `PERSONAGENS.md` (root) | who each character is, tone of voice, and where to paste the portraits. Read before writing any new dialogue |
| `docs/projeto/*` | the rules and design of the game, written throughout development — start with `docs/projeto/LEIA.md` |

---

## The three things that surprise newcomers the most

**1. The game does no networking.** Zero `fetch`, zero `XMLHttpRequest`, zero
WebSocket. The only external request is Google Fonts. It runs offline, start
to finish. Persistence is plain `localStorage`.

**2. There is no schema versioning in the save data.** The `tv:3` field is
written and **never read**. Compatibility with old saves is achieved through
total defensiveness inside `migrate()`, not through versioning. If you're
going to put save data on a server, **adopting `tv` as a field that's actually
read is step zero** — without that you can't write safe server-side migration.
Details in `docs/02`.

**3. There is no anti-cheat defense whatsoever.** `G` is a mutable global
object. `G.money = 1e9; save()` in the console works and persists.
`importSave()` accepts any JSON without a signature. This is a known and
accepted fact — the game is single-player. It becomes a problem the minute a
leaderboard exists. The realistic options are covered in `docs/04` §5.

---

## Code conventions

- **Comments are in Portuguese.** On-screen strings are in English, always
  inside `t('...')`, with the Portuguese counterpart in `src/19-i18n.js`. The
  game is bilingual.
- **Readability is the owner's rule number one.** Nothing readable may render
  below `calc(15px * var(--fs))`, and every text must pass WCAG AA contrast.
  `node tools/leg2.js` measures this and **must return
  `TOTAL FORA DA REGRA: 0`** before any delivery. Details in
  `docs/projeto/REGRAS-DO-PROJETO.md`.
- **Win98 + CRT visual style.** Bevels via `box-shadow`, no modern rounded
  corners, no generic gradients. The game has an identity and it is defended.
- **A character's name is never written as a literal string** — always
  `CHARS[id].who`. They've already been renamed three times.

---

## Who to talk to

Kiv (Oekaki Connect) is the owner of the project and the collection. He
**does not code** — deliver finished code and explain in simple Portuguese
what changed and why.
