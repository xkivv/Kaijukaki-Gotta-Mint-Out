# Where a server would touch

For each point: the exact function, the file, and **what is synchronous today and
would have to become asynchronous** — which is the real work.

## 1. Save / load

| function | file |
|---|---|
| `save()` / `readSave()` / `load()` | `src/24-state.js` |
| `migrate(s)` | `src/24-state.js` |
| `packToken` / `unpackToken` | `src/24-state.js` |
| `exportSave()` / `importSave(code)` | `src/24-state.js` |
| `useSlot(n)` / `slotKey(n)` | `src/24-state.js` |
| `slotInfo(n)` / `showLogin()` | `src/40-boot.js` |

**A wire format already exists:** `exportSave()` returns
`'KAIJU1:' + base64(JSON({kk:1, slot, ver, g}))`. A cloud-save backend
can use exactly this payload without inventing anything.

**What becomes async:**
- `save()` is a direct `localStorage.setItem`, called dozens of times per minute
  (see `docs/02` §4). **A debounced, write-behind queue is mandatory**, not
  optional. `desktop/preload.js` is already that implementation — copy the pattern.
- `load()` is synchronous and runs on two critical paths: the `init()` that boots
  the game, and `logOn()`. `showLogin()` also calls `slotInfo(n)` synchronously
  three times just to draw the profile cards. That whole path becomes `await` +
  a loading state that doesn't exist today.
- **There is no conflict resolution.** Two devices writing the same slot
  overwrite each other. It needs versioning / vector clocks — none of that exists.

**Where it's cheapest to plug in:** on desktop, persistence is **already
abstracted** behind the `localStorage` interface (`desktop/preload.js` replaces
`window.localStorage` with a file shim, and the game doesn't know). Cloud save
on desktop = swap that shim.

⚠️ **Real friction:** the `localStorage` interface is **synchronous by
contract** — `getItem` has to return a value, not a Promise. A network shim
needs a local cache + background sync. Write-behind already exists; read-through
and conflict resolution are missing.

❌ **On web this layer doesn't exist** — there, `save()` talks directly to
`localStorage`. If the backend is meant for both, it's worth building the same
abstraction on the web side and having **a single point of exchange**.

## 2. Player identity

| function | file |
|---|---|
| `walletWizard(onDone)` | `src/40-boot.js` |
| `finish()` — writes the identity | `src/40-boot.js` |
| `nickOf()` / `cleanNick()` | `src/24-state.js` |

The wizard has 3 screens with one decision each: welcome → recovery phrase →
nickname.

⚠️ **`G.seed` is a joke phrase**, pulled from a fixed list. It isn't a key for
anything. There's an explicit project rule that nothing in the game may look
like a real seed phrase (five BIP-39 words were deliberately removed from
`src/56-dm-lines.js`). **Don't build authentication on top of it.**

**There is no stable identity.** The "player" is slot 1, 2, or 3 of that
browser's `localStorage`. `cleanNick()` sanitizes but doesn't guarantee
uniqueness, and nothing persists outside the browser.

**What becomes async:** step 3 calls `finish()` directly. Reserving a nickname
on the server requires a "checking…" state and an error path (nickname taken)
that the wizard **doesn't have** — and the X button is explicitly inescapable,
on purpose.

## 3. Leaderboard

The numbers all live in `G` — the list, with the reliability of each one, is in
`docs/02` §8. **Read that section before designing any ranking.**

The `APPS.profile` screen (`src/34-app-misc.js`) already aggregates all of this.
It's the ready-made mockup.

**Where to send it:** `endDay()` or `sleepNow()` are the natural points.
⚠️ But see the warning about day-turn reentrancy in `docs/02` §7: **send
outside the lock, fire-and-forget, with a local queue.**

## 4. The social feed and DMs — 100% local

**Nothing comes from the network. Everything is generated client-side.**

| layer | file | lines |
|---|---|---|
| cast and lines | `src/49-social-data.js` | 500 |
| feed engine | `src/50-social.js` | 418 |
| feed and DM UI | `src/51-app-social.js` | 991 |
| DM engine | `src/55-dm.js` | 566 |
| DM lines | `src/56-dm-lines.js` | 1245 |
| public echo | `src/57-dm-echo.js` | 537 |

`feedTick()` picks the **author** first, their personality decides the topic,
and the line comes from a pool with anti-repetition (`S.said`, cap 70). DMs pick
the reply by the pair (message type × tone) — that's how the "incoherent
replies" problem was solved. `57-dm-echo.js` is what turns what you talk about
in DMs into gossip on the feed, with a **deliberate delay of hours**.

⚠️ The content of `49-social-data.js` **doesn't go through `t()`** — it's
bilingual directly in the object (`{en, pt}`), because the PT map is an exact
string lookup.

**Where it's cheapest to plug in a server feed:** the UI is **already** split
into "shell built once" (`knShell`) and "only updates numbers, doesn't touch the
scroll" (`knTock`) — `src/51-app-social.js`. That separation exists because
`UI.refresh()` is called on every game action, and rewriting `innerHTML` kept
throwing the feed back to the top mid-read. **Respect that separation.**

## 5. Minting

| function | file |
|---|---|
| `doMint(qty)` — the core | `src/24-state.js` |
| `doMintFlow(q, btn, chained)` — the UI | `src/30-app-site.js` |
| `PENDING_REVEAL` / `releaseHidden()` | `src/30-app-site.js` |
| `idAtMintIndex(k)` | `src/24-state.js` |

`doMint` is **entirely synchronous and transactional within one tick**: it
validates balance → `spend(cost)` → creates the tokens → `G.minted++` →
`ownToken()` → log/quest/hype → `stuxGift()` → returns `{made, cost, free}` or
`{err:'money'|'full'}`.

**What becomes async** when turning it into "reserve on server → confirm →
reveal":
- the return value of `doMint` — callers use the object **immediately**
- `G.minted` stops being local authority
- **`PENDING_REVEAL` is already the right place to hang the wait on.** It exists
  exactly because nothing may leak between the MINT click and the player closing
  the reveal. Any network latency has to fit inside it, with the timeout showing
  an error **without revealing anything**.

⚠️ See `docs/05` item 12 — two leaks have already happened on this path.

## 6. The Kaiju Spotter

`src/52-spotter.js`. Questions generated deterministically by
`mulberry(hash32('kakispot|'+mintSeed+'|'+day))`, 3 to 8 tokens per day depending
on rank, with three real distractors from the same trait. State in `G.spot`.

It's the most obvious candidate to become server-side (the in-fiction pitch is
"collaborative cataloguing") and **at the same time the most dangerous** — see
the checklist in `docs/03`. If answers go to a server, send **the `slip`
(made-up number) and the trait, never the token's `id`**.

## 7. The cheating surface — tested, not assumed

**Summary: total. There is no defense at all.**

Tests run in Chromium, on the isolated build:

| attempt | result |
|---|---|
| `G.money = 1e9; save()` + reload | ✅ works, persists |
| `G.level=10; G.bestLevel=10; G.peakHeld=9000` | ✅ HUD shows "Big Whale" rank |
| `for(i<40) ownToken(buildToken(idAtMintIndex(i),1))` | ✅ 40 free Kaiju, **and you can choose the ids** (filter `metaOf(id).rarity===5` = Mythic only) |
| `G.mintSeed=12345; MINT_ORDER=null; idAtMintIndex(0)` | ✅ **rebuilds the entire queue** — lets you brute-force seeds until you find one with Mythics in the first mints |
| `exportSave()` | ✅ returns the whole save in base64 |

**The easiest vector doesn't even need the console:** `importSave()` does
`atob` + `JSON.parse` + `migrate`, with no signature. Edit the JSON, re-encode,
paste it into the "Import save" dialog.

### On Electron — the exact mechanism (verified against `desktop/main.js` and `desktop/preload.js`)

What `main.js` actually declares in `webPreferences`:

```js
contextIsolation: false,
nodeIntegration:  false,
sandbox:          false,
```

**Correcting an error this document used to carry:** with `nodeIntegration:false`
the page does **not** get `require`. Measured on Electron 32 with this same
`main.js` and `preload.js`, evaluating in the renderer after the game loads:

| expression on the page | result |
|---|---|
| `typeof require` | `undefined` |
| `typeof process` | `undefined` |
| `typeof module` | `undefined` |
| `require('fs')` | `ReferenceError: require is not defined` |
| `typeof window.KK_SAVE_DIR` | `string` (absolute path to the saves folder) |
| is `window.localStorage.getItem` native? | **no** — it's the preload shim |

The one with Node access is the **preload script**, and only during its own
execution: Electron strips the Node globals from `window` before the page's own
scripts run.

What `contextIsolation:false` actually causes is a different thing, and it's
still a problem: **preload and page share the same JavaScript world.** There is
no boundary between the two. In practice that means:

- **Everything the preload leaves on `window` belongs to the page.** It leaves
  two things there:
  - `window.localStorage` **replaced** by a shim that really reads and writes
    `<userData>/saves/save.json`. The page's `setItem` becomes a disk write
    (with a 400 ms debounce). The content is chosen by the page; the path is not.
  - `window.KK_SAVE_DIR` — the **absolute path** to the saves folder, handed for
    free to any script that runs there.
- **With no isolation, the shim is tamperable — confirmed.** From the page,
  `window.localStorage.getItem = <wrapper>` works: you can intercept and rewrite
  everything that goes in and out of the on-disk save. Injected code can also
  replace `window.localStorage` entirely or reach into the preload's closures
  via prototype pollution. With `contextIsolation:true` this would sit on the
  other side of the boundary.
- **`sandbox:false`** removes the OS sandbox from the renderer process. A remote
  code execution bug in Chromium isn't contained to the process — and it's
  precisely `sandbox:false` that lets the preload use `require` while
  `nodeIntegration` is off.
- **F12 opens DevTools** (enabled on purpose in `before-input-event`), which
  gives free console access to that same world.

What is **not** true today: the page doesn't have `fs`, doesn't have
`child_process`, doesn't read or write arbitrary files. The real reach is the
save, its path, and the lack of containment.

🔴 **This remains the first item to change once a server comes in.** Today it's
acceptable because nothing loads from the network: with no remote content,
there's nowhere for an injection to come from. The moment the app fetches data
from a server, any injection starts running **in the same world as the
preload**, with the disk shim and the save path right there, in a process with
no OS sandbox. The order of fixes is `contextIsolation:true` →
`sandbox:true`, and making that change requires rethinking the `localStorage`
replacement — most likely a `contextBridge` exposing an async API, with the
game calling `KK.save()` instead of `localStorage`. That's a real refactor in
`src/24-state.js`.

### The three realistic paths, in order of cost

1. **Showcase, not competition.** Leaderboard explicitly unverified — "what
   people say they did" — no prize. Low cost, honest.
2. **Verified replay.** The client sends the seed + the action log; the server
   runs the same simulation and checks it. Viable **because almost everything is
   already deterministic by seed**, but requires (a) swapping the 4 helpers in
   `src/20-util.js` for a seeded PRNG with a persisted counter, and (b)
   extracting the logic from `24-state.js` into a module that runs in Node —
   today it's tangled together with `UI.*` and `SFX.*`.
3. **Authoritative server** over the entire economy (mint, gas, market, tax,
   staking). This is rewriting the game, not plugging in a backend.

Obfuscation and a save checksum raise the cost without solving anything: the
bundle is a readable `<script>` of ~19 thousand lines, unminified.
</content>
</invoke>
