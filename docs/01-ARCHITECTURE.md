# Architecture and build

## 1. The build

`build.sh` — 25 lines of bash. **There is no bundler, no npm build, no
transpilation, and no minification.** It's `cat`-ing files in a fixed order
inside an HTML skeleton.

```
src/00-head.html          <meta>, <title>, Google Fonts
<style>  23 CSS files  </style>
src/05-body.html          the static DOM (#screen, #desktop, #hud, #taskbar, #boot)
<script> 41 JS files   </script>
```

The root `package.json` exists **only** to hold `playwright` for the tests.
The only `package.json` with an actual build is `desktop/package.json` (Electron).

### The three targets

The `build()` function takes three parameters: the art slot, the output, and
the real-map slot. **The difference between the three targets is exactly two
files.** Everything else — 5,572 lines of CSS and ~19,000 of JS — is byte for
byte identical.

| target | art slot | map slot | size |
|---|---|---|---|
| `dist/kaijukaki.html` | `18a-sheets.js` (35 AVIF sheets in base64) | `18c-noreal.js` | ~15.4 MB |
| `dist/kaijukaki-local.html` | `18a-nosheets.js` (none) | `18c-real.js` | ~1.7 MB |
| `desktop/app/index.html` | `18a-files.js` (points to `art/*.avif`) | `18c-noreal.js` | ~1.7 MB + 11 MB of art |

`src/18a-files.js` declares `KK_SHEET_DIR='art/'`, and `sheetSrc()`
(`src/23-art.js`) returns `art/N.avif` instead of decoding base64. **It's the
only code branch that differs between web and desktop.**

## 2. The numbering ranges

**CSS (23 files, 5,572 lines)**

| range | role |
|---|---|
| `10-base` `11-window` `12-apps` `13-fx` | Win98/CRT skeleton, windows, apps, effects |
| `15` to `20` | per-area CSS (market, social, mint, onboard, shop) |
| `21-legible` `21b-leg-*` | font-size overrides, one per area |
| `22` to `28` | specific screens (desktop, quests, spotter, sizing, DM, story) |
| `21c-contrast` | **second to last** — color fixes |
| `14-mobile` | **always last** |

⚠️ **CSS order is not numeric.** `21c-contrast` comes after `28`, and
`14-mobile` comes last. This is deliberate: whoever writes a new rule that
gets overridden on mobile raises the specificity (`html body.mob .x{}`),
they don't change the order.

**JS (44 files in `src/`; 41 go into each build)**

The 3 left out of each target are the alternative slots: out of the three
art variants (`18a-sheets` / `18a-nosheets` / `18a-files`) and the two map
variants (`18c-noreal` / `18c-real`), `build()` picks one of each.

| range | role |
|---|---|
| `18a-*` `18b-meta` `18c-*` | data: art · metadata · real map |
| `19` to `24a` | core: i18n, util, icons, data, art, state, preferences |
| `25` `26` | shell: window manager and clock/day flow |
| `30` to `59` | one app or system per file |
| `40-boot.js` | **desktop + boot — goes LAST in the bundle, despite its number** |

The biggest ones, by line count (`wc -l`): `40-boot` 1467 · `44-app-inbox`
1327 · `30-app-site` 1318 · `56-dm-lines` 1245 · `51-app-social` 991 ·
`58-story` 863 · `31-app-market` 738. `24-state.js` (1521) is the biggest of
all and is the heart of the economy.

## 3. Why the order matters (tested, not assumed)

Everything ends up inside **a single `<script>`**, so all the files share
the same top-level scope.

1. **Top-level `const`/`let` are in the TDZ.** `src/22-data.js` does
   `const TRAIT_LAYERS = KK_META.types.slice()` **at load time**. Putting
   `22-data.js` before `18b-meta.js` gives
   `Cannot access 'KK_META' before initialization` — and this **kills the
   entire `<script>`**: black screen, the game doesn't exist. The same
   applies to `src/23-art.js` and its `probeArt()` IIFE.
2. **Top-level `function`s hoist across the whole bundle.** Moving
   `40-boot.js` to the middle doesn't error. What's order-sensitive is:
   `const` TDZ, IIFEs that run on load, and monkey-patching.
3. **`40-boot.js` has to be last** — it contains the `init()` IIFE that
   wires up the game (`useSlot(1); G=migrate(null); setLang('en'); boot();`).
   It's **not** the last thing in the file: `init()` is around line 1436,
   and after it still comes the `kkVisTick()` IIFE (line 1464), which wires
   up `visibilitychange`. What matters is that `init()` runs on load, so
   everything it touches must already exist — that's why the whole file
   goes last in the bundle.
4. **`54-collection.js` has to come after `24-state.js` and
   `31-app-market.js`** — it monkey-patches `onHour`, `sellTick`, and
   `mktTick`, storing the original in a closure
   (`const _onHour=onHour; onHour=function(){...}`). Loaded before them, it
   wraps `undefined`.
5. **`22-data.js` mutates `KK_META.dict` on load** (`renameTraits()`:
   `Special`→`Secret`, `Reserve`→`Reserved`). Anyone reading the dictionary
   before that sees the collection files' original names.
6. **A duplicate top-level `const` in two files = global `SyntaxError`.**
   There's no namespacing. **Always run a syntax sweep before shipping:**

```bash
bash build.sh
python3 -c "
s=open('dist/kaijukaki.html',encoding='utf-8').read()
i=s.index('<script>')+8; j=s.rindex('</script>')
open('/tmp/js.js','w',encoding='utf-8').write(s[i:j])"
node --check /tmp/js.js
```

## 4. The pattern for extending without stepping on someone else's file

`src/54-collection.js` is the reference. It adds a whole system (collection
bids, volume) without editing `24-state.js`: it stores the original function
in a closure and replaces the global.

```js
const _onHour = onHour;
onHour = function(){ _onHour(); /* your tick here */ };
```

**A backend should use exactly this pattern, in a new file loaded at the end
of the bundle.** That way the `git diff` of someone working on something
else doesn't collide with yours.

## 5. How to run and test

```bash
bash build.sh                          # ~1s, no dependencies
# open dist/kaijukaki.html — file:// works
npm install                            # just to run the tests (playwright)
node tools/leg2.js 1366 900            # readability — MUST return 0
node tools/leg.js site,market,wallet   # per-app meter
```

The canonical shortcut to skip login + wizard inside a Playwright test:

```js
await p.evaluate(()=>{
  const v=document.querySelector('#wizveil');
  if(v){v.remove(); G.walletMade=true; G.nick='kiv'; save(); start();}
});
```

⚠️ The wallet wizard takes ~2.5 s to leave the welcome screen (it has an
animation). Automation with a short wait fails without anything actually
being broken.
And watch out: `#modalveil` stays on after the wizard and blocks the dialog
queue in a test harness — remove the `.on` class.

## 6. Electron

`desktop/main.js`:
- `requestSingleInstanceLock()` — two windows writing the same save = a
  corrupted save
- `loadFile('app/index.html')` — no local server
- `setWindowOpenHandler`: `http(s):` opens in the system browser, everything
  else is denied; `will-navigate` blocks leaving `file://`
- `additionalArguments: ['--kk-save-dir=' + userData/saves]`
- **`contextIsolation:false`** — justified in the file: the preload needs to
  **replace** `window.localStorage`, and `contextBridge` can't swap out a
  native accessor on `window`

`desktop/preload.js` replaces `window.localStorage` with a shim that has the
same interface, which reads and writes `<userData>/saves/save.json`:
- writes to memory immediately, to disk **400 ms later** (debounce) —
  "writing 40 times a minute destroys the SSD and freezes the UI"
- writes a `.tmp` → copies the current one to `.bak.json` → `renameSync`
  (atomic)
- synchronous flush on `beforeunload` and `pagehide`
- **has to run at the top of the preload**: the game script runs at the end
  of `<body>`, before `DOMContentLoaded`; waiting for that event would make
  the game read native localStorage and come up empty every time

**The game has no idea this exists. Not a single line of `src/` changes.**
This means **the persistence layer is already abstracted on desktop** — see
`docs/04`, §1.
