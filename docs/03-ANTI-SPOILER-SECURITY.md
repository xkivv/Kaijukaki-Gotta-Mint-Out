# The anti-spoiler rule — read it in full

**This is the most important document in the package.**

## The problem, in one sentence

The Kaijukaki collection has 8888 hand-drawn pieces and **has not been
minted yet**. The game simulates minting it, with the real art and the real
traits. If someone manages to translate "the game's Kaiju #3344" into "file
#X of the collection," the game becomes an oracle for the real mint and the
launch is ruined.

## How this is solved today: three stacked independences

### 1. The numbers are permuted

There's a bijective permutation σ over `1..8888`. `σ(i)` = which real file
corresponds to the Kaiju the game calls `#i`.

- **`KK_META`** (`src/18b-meta.js`, 313 KB) contains traits, tier, rank and
  position on the art sheet for all 8888 — **real, but reindexed by σ**. It
  isn't fake metadata: it's the true metadata with the addresses swapped.
- **The art** (`src/18a-sheets.js`, 35 AVIF sheets at 2048², 128px tiles) is
  addressed **by the game's number**, via `metaOf(id).pos`.
- Result: inside the game, art and traits **match each other** — the (art,
  traits) pair is the real pair. **Only the number is fictional.**

> ⚠️ The comment in `src/24-state.js` that says *"Kaiju #N is the actual
> Kaiju #N"* is **outdated and misleading**. It was written before the
> shuffle existed. Don't trust it.

### 2. σ is not in the public build

`src/18c-noreal.js` is literally `const KK_REAL=null;`. Without σ:
- `realFileId(id)` (`src/23-art.js`) returns the id itself
- `canReadLocalArt()` returns `false` and the game doesn't even look for the
  `images/` folder

**In this package σ does not exist anywhere.** `src/18c-real.js` is a
placeholder.

### 3. The game's mint order is rolled per profile

`mintOrder()` (`src/24-state.js`) generates the queue via exponential-key
sampling, weighted by rarity, seeded by `G.mintSeed` — which is randomized in
`newGame()`. **Every player has a different queue.** Two playthroughs on the
same machine already diverge.

### Why this is enough

The player reaches `G.minted = 3343` and the game says the next one is
`#5712`. For that to turn into information about the Scatter, two things
that aren't in the file would still be needed: σ (not embedded) and the real
chain order (which neither the game nor its owner controls).

---

## Where it has already leaked, and what was done about it

### 🔴 `dist/kk-artmap.js` — FIXED in 3.2, but understand the mechanism

The public build injects `<script src="kk-artmap.js">` on load
(`loadArtMap()`, `src/23-art.js`). This is intentional: whoever has the
collection on disk places that file next to the HTML and plays with the
300px art. Whoever just downloaded the game doesn't have the file, so
nothing leaks.

**The hole:** if someone served the entire `dist/` folder from a static
server or a bucket, `kk-artmap.js` would be on the same origin — and the
game itself would load it on its own, exposing σ in full via
`window.KK_ARTMAP` to any visitor.

In 3.2, loading now requires `location.protocol === 'file:'`. Verified by
serving `dist/` over HTTP:

```
HTTP (server)             {"artmap":"missing","ARTmap":"null","realFileId_1a5":[1,2,3,4,5]}
file:// (owner's machine) {"artmap":"len 8888","ARTmap":"set","realFileId_1a5":[aaaa,bbbb,cccc,dddd,eeee]}
```
(the real values are masked on purpose — even five of them is protected
information, and a document about not leaking can't itself leak)

**Even so: never serve the `dist/` folder statically. Serve only the HTML.**
The guard is a seatbelt, not a permission slip.

### 🔴 The source code contains σ — that's why it isn't in here

`src/18c-real.js`, and by extension `dist/kaijukaki-local.html`. Sending
someone the raw repository hands over the permutation. That's why this
package was assembled by hand instead of being a plain `zip -r` of the
folder.

---

## Checklist for the backend

Root rule: **nothing, anywhere, may correlate a game number with a real
number, file, image or hash.**

- [ ] **Never embed σ (`KK_REAL` / `KK_ARTMAP`) in anything that leaves the
      owner's machine** — not a build, not an API, not an environment
      variable, not a database seed.
- [ ] **Do not serve `dist/` statically.** Serve only the HTML.
- [ ] **No metadata API.** It's unnecessary — the client already has all
      8888 traits offline in `KK_META`. Any endpoint that returns traits
      indexed by the **real** id reconstructs σ by comparison against the
      public `KK_META`.
- [ ] **No "next mint," "how many left in tier X," "queue distribution"
      endpoint.** Any aggregate over the queue is a partial oracle.
- [ ] **Do not sync `G.mintSeed` across players.** Today it's per profile,
      and that's one of the three independences. A "global queue" served by
      the backend drops it from three independences to two.
- [ ] **Never render a Kaiju thumbnail server-side.** Rendering requires
      the (game id → file) pair, i.e. σ on the server. If art needs to
      appear on a server-side page, have the client draw it instead.
- [ ] **Do not store in the database any pair linking a game id to an
      external artifact** — image hash, IPFS CID, metadata URL, chain token
      id. That pair, and only that pair, is what reconstructs σ.
- [ ] **Leaderboard: game number OR art, never both.** Today several
      screens show `#game id` alongside the art, and that's safe **as
      long as** the real art isn't publicly associated with real numbers.
      **This changes on the day of the collection's public reveal**:
      anyone will be able to match tile ↔ official image and recover σ in
      full by inspection. If there's a hosted showcase, it should either
      launch without art, or have a plan to shut it off at reveal time.
- [ ] **The Kaiju Spotter is the most delicate spot.** It shows art and
      asks about a trait. The rule is already implemented: the card uses a
      **made-up number** (`slip`, format `NNNN-X`, in `src/52-spotter.js`),
      never the token id. If answers are ever sent to a server, send **the
      slip and the trait, never the id**.
- [ ] **Telemetry:** counting mints by tier or by race is harmless (the
      distribution is already in the public file). Correlating a game id
      with any real identifier is the leak.
- [ ] **Anti-spoiler comes before anti-cheat.** If proving a player didn't
      cheat ever requires revealing the queue, the leaderboard dies, not
      the rule.

---

## What THIS package contains, and how long that holds up

Honesty, because you'll notice it yourself anyway: **σ is protected, the
art and the names are not.** This package includes the 8888 pieces at
128px (35 AVIF sheets, in `src/18a-sheets.js` and in `desktop/app/art/`)
and the complete trait dictionary for a collection **that has not been
released yet** — 20 layers, 35 races, 548 outfits, and 90 proper names for
1/1 pieces.

This is a deliberate decision: without the art the game doesn't run, and
the owner preferred that you be able to run it. **Treat the whole package
as confidential** — see `CONFIDENTIAL.md` at the root. Don't publish the
art, don't publish the name list, don't upload this to a public repository
or an open bucket.

**And the protection has an expiration date.** On the day the collection is
publicly revealed, σ becomes recoverable from this package alone, via two
paths: matching tile ↔ official image, and — even easier — matching
`KK_META` ↔ official metadata by trait fingerprinting, which is a `JOIN`,
not computer vision. After the mint this stops mattering, which is exactly
the point. But **don't promise anyone that this file is safe forever**: it
is safe *until the reveal*, which is exactly the amount of time it needs to
be.

## How to test that you haven't leaked anything

```bash
bash build.sh
grep -c "KK_REAL=\[" dist/kaijukaki.html     # must be 0
grep -c "KK_ARTMAP" dist/kaijukaki.html      # only the loader, never the data
```

And in the browser, with the build isolated in a clean folder:
```js
typeof KK_ARTMAP        // "undefined"
ART.map                 // null
[1,2,3,4,5].map(realFileId)   // [1,2,3,4,5]  ← identity = no map
```
