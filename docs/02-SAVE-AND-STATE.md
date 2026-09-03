# Save, state and persistence

The numbers here were **measured** (headless Chromium serializing with the
game's own `save()`), not estimated — **with one exception explicitly marked
as an estimate** in the §3 table. Save size depends on id, day and nickname,
so values marked with `≈` come with the measurement that produced them.

## 1. The `G` object

`let G = null` — `src/24-state.js`. **A loose global variable.** There is no
class, no schema, no type validation beyond `migrate()`.

- `newGame()` creates **91 top-level fields**
- `migrate(s)` = `Object.assign(newGame(), s||{})` + ~110 lines of sanitization.
  **Every save goes through here**, including a brand-new save (`G=migrate(null)` on boot)
- A live save can reach 99-100 fields (some are born at runtime)

### Groups

| group | fields |
|---|---|
| **time** | `day`, `hour` (0-34, not 0-23!), `min`, `warned`, `overWarned` |
| **money** | `money`, `best`, `hype`, `taxPeriodNet`, `taxDue`, `taxRows`, `lastTaxDay`, `lastAuditDay`, `per`, `feeCut`, `stipend`, `chainLoad`, `scamLoss` |
| **collection** | `tokens`, `seq`, `minted`, `myMinted`, `npcMinted`, `mintout`, `mintLog` (≤24), `binder` (≤60 pages × 15 slots) |
| **market** | `mkt`, `offers`, `cbids`, `event`, `eventRace`, `heat`, `shills` |
| **charts** | `curCandle`, `icandles` (≤72), `candles` (≤60), `hist` (≤40), `priceHist` (≤30), `volH`/`volCur`/`volTot`/`volSeed` |
| **progression** | `level`, `bestLevel`, `peakHeld`, `up`, `contract`, `gasLv`, `bulk`, `listLv`, `capLv`, `stakeOn`, `stakeSlotLv`, `xp` |
| **social** | `social` (the biggest field in the save), `rep`, `feed` (≤8), `mailbox` (≤40), `mailRead`, `netSeen` |
| **story** | `story`, `quests`, `spot`, `achv`, `achvBig`/`achvVault`/`achvStorm`, `goals`, `seenRaces`, `seenIntro` |
| **security** | `secUntil`, `lastHack`, `scamsToday`, `lastScamAt`, `dropShield`, `dirtyMoney`, `spamDay` |
| **identity** | `nick` (≤16, `[a-z0-9]`), `seed` (**cosmetic** phrase), `walletMade`, `refCode` |
| **seeds** | `gasSeed`, `mintSeed`, `mintOrderV` |
| **preferences** | `prefs` — 45 keys in `PREF_DEF` (`src/24a-prefs.js`), a constant 693 bytes |

`G.social` is normalized in `soc()` (`src/50-social.js`):
`{posts (≤48), threads (≤20), trust, clubs, said (≤70), votes, popsToday, lastPopAt, unread, tips, tipsToday, act}`.

⚠️ **`hour` goes up to 31, not 23.** `dayEndHour()` = `26 + (has('coffee') ? 5 : 0)`.
The clamp in `migrate` allows 0-34 because of this.

⚠️ **UI clutter that leaks into the save:** `_mkAcc`, `_lastMinted`, `_lastPct`.
These are animation state that ends up persisted because `save()` copies all of `G`.
Harmless — a server should ignore them.

## 2. The token — only 6 numbers need to persist

`buildToken(id, day, fresh)` produces an object of **≈287 bytes**, and
`packToken()` reduces it to **17 bytes**, a 6-position array:

> Measured with `buildToken(1234, 1, false)`: 287 B as an object,
> `[1234,0,-1,1,0,0]` = 17 B packed. **The size depends on the id and the day**,
> because traits have names of different lengths and the day enters as
> digits: across a sample of 400 ids the object ranges from **147 to 366 B**
> (median 280) and the packed form from **14 to 17 B** (median 16.9). The
> order of magnitude — ~17 times smaller — is the point.

```js
[ id, staked?1:0, listed==null?-1:listed, day, seq, stakedDay ]
```

| # | field | meaning |
|---|---|---|
| 0 | `id` | which Kaiju (1..8888) |
| 1 | `staked` | locked in the vault |
| 2 | `listed` | listed price (`-1` = null) |
| 3 | `day` | day it entered the wallet |
| 4 | `seq` | **arrival order** — this, and only this, is what the "Newest" filter uses |
| 5 | `stakedDay` | day it was locked (10-day lock) |

**Everything else is derived from the `id` via `metaOf(id)`, which reads
`KK_META`:** the traits (20 possible layers), the rarity (0-5) and the rank.
A server stores 6 numbers per Kaiju and derives the rest — **provided it has
the same copy of `KK_META`**.

⚠️ If `KK_META` changes (reordering, renaming), all derived traits change
retroactively. And note that `renameTraits()` (`src/22-data.js`) swaps
`Special→Secret` and `Reserve→Reserved` **in memory, after loading** — it's a
presentation layer, the server should not blindly replicate it.

## 3. Measured size

| scenario | bytes | tokens |
|---|---|---|
| day 1, freshly-created wallet | **≈2,114** | 0 |
| end of day 1 | 8,471 | 9 |
| end of day 10 | 36,337 | 30 |
| end of day 30 | **43,969** | 106 |
| extreme: mintout, wallet with 7,288 Kaiju | **~196,000 (estimate)** | 7,288 |

⚠️ **Two caveats on this table.**

**`day 1` re-measured:** came out to **2,114 B** with a 3-letter nickname
(`migrate(null)` + `walletMade` + `save()`, five repetitions: 2,113–2,114).
The nickname is what moves it most: 2,111 B with 1 letter, 2,125 B with 14.
The old value (2,194) wasn't reproduced under any configuration and is from
an earlier version.

**The mintout row is an estimate, not a measurement.** Reproducing a real
mintout save requires playing hundreds of days, and forcing the state via the
console produces a save with empty `social`, `icandles` and `candles` —
which measures the floor, not the case. What **was** measured: the 7,288
packed tokens alone take up **135,179 B**, and a test save loading those
tokens over a sparsely-populated state came to **141,566 B**. Adding the
rest of a mature day-30 save on top of those tokens (~42 KB outside the
tokens) gets you into the 180–200 KB range. **Treat the number as an order
of magnitude**; what matters for sizing is that the worst-case save lands in
the hundreds of KB, not MB.

Composition of a day-30 save: `social` 39%, `icandles` 18%, `hist` 13%,
`candles` 7%, `mkt` 3%, `prefs` 2%, tokens ~4%.

**The save does not grow without bound** — almost everything is a list with
a hard cap. The only linear term is `tokens`: **≈18 B per Kaiju** in a large
wallet. Measured by JSON growth over the same `G`: **16.6 B/Kaiju** at 100
tokens, **17.6 B** at 1,000 and **18.6 B** at 7,288 (it grows because larger
ids and days spend more digits).

`exportSave()` wraps it in base64 → ×1.33.

## 4. Persistence

**`localStorage` only. Zero sessionStorage, zero IndexedDB, zero network.**

| key | content |
|---|---|
| `kaijukaki_slot_1` / `_2` / `_3` | the profile's save, plain JSON |
| `kaijukaki_slot_N_bak` | copy swapped **once per in-game day** |
| `kaijukaki_os_v1` | **dead key**, legacy. Nothing writes to it |

Worst case: 6 blobs competing for the domain's ~5 MB quota.

**No compression. No custom serialization beyond `packToken`. Plain JSON.**

`save()`: `Object.assign({}, G, {tv:3, tokens: G.tokens.map(packToken)})` →
`JSON.stringify` → `setItem`. Wrapped in `try/catch`: on `QuotaExceededError`
it shows a toast **once** and **keeps playing with in-memory state only**.

`load()`: tries the main key; if `JSON.parse` throws or `tokens` isn't an
array, it falls back to `_bak` and warns. If both fail, new game.

⚠️ Deleting a profile (`removeItem`) and `wipe()` **do not remove `_bak`** —
it's left orphaned.

### Write frequency — the number that matters

**With the tab open and idle, the entire save is written every 4.5 seconds.**

- `startClock()` (`src/26-flow.js`): `setInterval(..., IDLE_TICK_MS=4500)` →
  `timeAct(2)` → `advance` + `save()`
- `timeAct()` is called on **every player action** (minting, listing,
  selling, buying, upgrading)
- plus another `setInterval(...,20000)` in `src/40-boot.js`
- plus `pagehide`, `beforeunload`, `visibilitychange`

With a 200 KB save that's ~44 KB/s of synchronous writes on the main
thread. **A remote save absolutely needs a debounced, write-behind queue.**
`desktop/preload.js` already implements exactly this pattern (400 ms,
temp+rename, backup) — copy it.

## 5. Schema versioning: DOES NOT EXIST

This is the single most important piece of information in this document.

- **`tv:3` is written to the save and NEVER read.** There is no
  `if (o.tv < 3)` anywhere in the codebase. It's a decorative number.
- `GAME_VERSION` ('3.2.1', in `src/44-app-inbox.js`) goes into `exportSave()`
  and **is not checked on import**.
- There is no `schemaVersion`, nor any list of versioned migrations.
- The only two version numbers that are actually **read** are subsystem-level:
  `G.mintOrderV` (1 or 2) and `G.story.v` (1).

Compatibility is achieved through **total defensiveness** inside `migrate()`:
`Object.assign(newGame(), s)` makes a new field automatically come to life
with its default, followed by ~55 lines of `Array.isArray(x)?x:[]`, `+x||0`,
`clamp(...)`. `migrate()` is idempotent and runs in full on every save,
always.

**Consequence: you cannot tell a save's age just by looking at the save.**

⚠️ **The token format is assumed unconditionally.** A save written by a
future build with 7 positions would be read and the 7th field silently
dropped. An old save with a token as an object would produce
`metaOf(undefined)` → invalid token → filtered out in `migrate` →
**silent loss of the entire wallet**.

> **Step zero of any server work:** adopt `tv` (or a new `schemaVersion`) as
> a field that is actually **read**, and stamp every existing save as
> version 3. Without this there's no safe way to write server-side
> migrations or detect a save tampered with in format.

### What `migrate()` already does (and you don't need to redo)

Old-mechanic → new-mechanic conversions, with deletion of the old field
(`up.bulk5/10/25/100` → `bulk`, `up.gas1/2` → `gasLv`, `up.cap1..5` →
`capLv`); reconstruction of `peakHeld` and of `seq`; referential
sanitization (the binder loses invalid slots, `mkt` loses listings for
tokens you don't own, tokens outside 1..8888 are discarded); seeding of
missing PRNG state; and `prefsAdopt()`, which migrates old loose fields
(`g.ui`, `g.lang`, `g.iconPos`…) into `G.prefs` **and deletes the
originals**, so there's never two sources of truth.

## 6. Randomness — what can and can't be re-simulated

Two sources: **pure `Math.random()` (49 calls across 15 files)** and
**`mulberry(seed)`**, a deterministic 32-bit PRNG (`src/20-util.js`).

### Deterministic (a server can reproduce this)

| system | seed |
|---|---|
| **mint order** — which id comes out on the k-th mint | `G.mintSeed` + `G.mintOrderV` |
| the day's gas wave and spikes | `G.gasSeed ^ (day * const)` |
| Kaiju Spotter's turn | `hash32('kakispot\|'+mintSeed+'\|'+day)` |
| Kakizone draw | `hash32('kakipull\|'+mintSeed+'\|'+day)` |
| an id's fictional holder | `hash32('holder\|'+id+'\|'+mintSeed)` |
| traits/rarity/rank | not random — it's `KK_META` |

**The mint reveal is 100% deterministic.** Given `mintSeed`, `mintOrderV`
and `minted`, you can reproduce exactly which Kaiju comes out.

### NOT deterministic (raw `Math.random()`)

Secondary market (which id shows up, the price multiplier, whether it
disappears, whether it sells), offers (which token, the amount, the ttl,
whether it's a lowball), scams (whether one appears, which one, how much it
takes, which Kaiju it takes), the day's weather, daily quests, the social
feed, bids on the collection, `sweepFloor`. And `gasSeed`/`mintSeed`/`refCode`
are born from `Math.random()` — no CSPRNG.

**A leaderboard based on re-simulation is impossible today.**

**The good news:** most of the 49 usages go through **four helpers
centralized in `src/20-util.js`** — `ri`, `rf`, `pick`, `chance`. Swapping
them for a single seeded PRNG, with the call counter persisted in the save,
is a surgical change that fits in one file.

## 7. Time

**State stores no timestamp at all.** There's no offline progress: closing
the tab and coming back three days later advances nothing. This is great
for the server.

But there are **three** places where real-world clock time drives state
mutation:

1. **`startClock()`** (`src/26-flow.js`) — every 4.5 real seconds, 2 minutes
   of game time pass on their own. **Implicit exchange rate: 1 game hour ≈
   135 real seconds while idle.** The market moves, gas fluctuates, NPCs
   mint.
2. **`mkLiveTick()`** (`src/31-app-market.js`, `setInterval` 900 ms) — **the
   most dangerous one.** Uses real `dt` from `Date.now()` and effectively
   **removes listings from `G.mkt` and creates new ones**. Only runs while
   the market tab is open and visible. So **the content of `G.mkt` depends
   on how much real time the player left the market window open.** A
   server has no way to reconstruct this.
3. **`G.playMs`** — the only field measured in real milliseconds.

Everything else touching `Date.now()` is cosmetic (double-click throttle,
error anti-spam, animations) and doesn't touch `G`.

### The day turnover — `endDay()`

Exact order: consolidate candles → push `log` into `hist` → listing-spam
penalty → `heatTick` + `socialEndDay` + `checkAchievements` + `rollQuests`
→ achievements → **staking pays out here, once per day** → `day++`,
`hour=8` → hype fatigue carries across the day (×0.30) → clear `log` →
roll tomorrow's weather → allowance + hype decay (×0.94, floor 1.2) →
`freeMints++` → nightly hack → every 3 days, generate Mr. Kaiju's invoice.

⚠️ **Day turnover has a history of reentrancy bugs** (`dayLock`,
`reportBusy`, `outroBusy`, and even a safety net inside `setInterval`).
Slipping a network `await` into this path is exactly the kind of change
that brings back the "closed two days at once / corrupted save" bug.
**Send it outside the lock, fire-and-forget, with a local queue.**

## 8. The numbers a leaderboard would use

| field | trustworthy? |
|---|---|
| `G.bestLevel` | **monotonic by construction** (`Math.max(new, previous)`). The most stable one — but it's derived, not a source |
| `G.peakHeld` | monotonic, **with one loophole**: `migrate` does `max(peakHeld, tokens.length, LEVELS[bestLevel-1].req)` — an inflated `bestLevel` **retroactively raises `peakHeld`** |
| `G.minted` | **not a per-player metric** — it's the global supply (you + NPCs). What you personally minted is in `G.myMinted`. And `stuxGift()` increments `G.minted` **without** going through `doMint`, so the counters legitimately diverge |
| `G.money` | a single write point (`earn`/`spend`), but it's an instantaneous balance. `G.best` is the peak and **is monotonic** |
| `G.totals.*` | monotonic, but **write points are scattered across 6 files** — `totals.sold` alone has 6 spots. Any new sale path that forgets to add to it creates silent divergence |
| `G.playMs` | counts 5,000 ms per tick without checking drift; a hidden tab doesn't count. An approximation |

### Why none of them is trustworthy today

1. **The save is plain, editable text.** `localStorage` with no signature,
   no hash, no obfuscation.
2. **`importSave()` accepts anything**: base64 → `JSON.parse` → only checks
   that `tokens` is an array → `migrate()`. **No HMAC, no checksum.**
3. `migrate()` sanitizes **type, not value**. `g.money = +g.money || 0` —
   **no cap whatsoever**. `totals`, `best`, `bestSale`, `xp` also have no
   cap.
4. **There are official cheat codes in the game** (`CODES` in
   `src/33-app-vault.js`), tracked in `G.usedCodes`: `-30%` on every
   permanent fee, a daily allowance, +10 free mints. A leaderboard needs to
   decide whether `usedCodes` disqualifies an entry or just flags it.
