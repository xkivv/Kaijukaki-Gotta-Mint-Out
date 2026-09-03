# 12 pitfalls that have already cost this project days

All of these are real bugs that happened, with their root cause. Worth reading
before you touch anything.

**1. Everything is ONE `<script>`. A syntax error in any `src/*.js` takes down
the whole game** — black screen, nothing in the DOM. There is no module
isolation. A `const` with the same name at the top of two files is a global
`SyntaxError`. Real case: **a backtick inside a changelog's text** broke the
template string and killed the build. *Run `node --check` on the bundle before
shipping* (command in `docs/01` §3).

**2. Bundle order is a contract, not a style choice.** `18b-meta.js` has to
come before `22-data.js` (TDZ on `const`). `40-boot.js` has to be last (the IIFE
that boots the game). `54-collection.js` has to come after `24-state.js` and
`31-app-market.js` (monkey-patch). In the CSS, `21c-contrast` is second-to-last
and `14-mobile` is last, on purpose. Details in `docs/01` §3.

**3. Reused canvas = wrong art. This was a real bug, twice.** The gacha draw
paints ~13 random Kaiju on the **same canvas** before it stops, and the AVIF
sheets respond seconds later — they'd paint the random Kaiju over the actual
result. `drawKaiju()` stamps `cv.__want = id` and the callback rejects anything
else (`src/23-art.js`). **Any new canvas inside an animation needs the same
guard**, and never reuse a live canvas for another id.

**4. `tk.id` does NOT indicate arrival order.** The mint queue is shuffled. The
"Newest" sort used to order by `tk.id`, and a freshly minted Kaiju `#412` would
always land at the end of page three. **Any "recent" ordering has to read
`seq`**, assigned in `ownToken()`.

**5. `G.mintOrderV` protects saves in progress.** A save **without** that field
stays on the old (v1) shuffling algorithm on purpose: changing the queue
algorithm out from under a save in progress rewrites the player's future — and
anyone who bought the scanner has already seen what's next. **The same
reasoning applies to any future change to queue generation.**

**6. `getBoundingClientRect()` accounts for CSS transforms.** During the day
turn, `#screen` sits at `scaleY(.004)` for ~1.6s (the TV-shutting-off
animation) — and that's exactly when the story unlocks a new icon and calls
`buildDesktop()`. The measurement returned a height of 15px, only fit one icon
per column, and the desktop area turned into a single row **for the rest of the
session**. Fix: `deskArea()` measures via `clientWidth`/`clientHeight` (the
layout box, immune to transform). **Never measure geometry with
`getBoundingClientRect()` on an element that might be mid-transform-animation.**

**7. "No modal is open right now" ≠ "the modal queue is empty".** `UI.modal()`
queues whatever doesn't fit and opens it 170ms later. `showDayReport()` only
checked the instant, so it would run `endDay()` with a box still queued; it
would then open on top of the new day, and clicking it **burned an entire day**
— it was a corrupted save, not a stubborn pop-up. Related: **`#modalveil` is
ALWAYS in the document** — it's only a modal when it has the `.on` class.
Testing for its existence would lock the dialog queue forever.

**8. Marking `.out` on a toast doesn't remove it from the DOM right away** — it
leaves 300ms later. Counting again inside a `while` **freezes the browser**.
Count once.

**9. Never rewrite a window's `innerHTML` in `refresh()`.** `UI.refresh()` is
called on every game action. The Kaki+ feed used to jump back to the top
mid-read. The shell is built once (`knShell`), then refresh only updates the
numbers and **doesn't touch the scroll** (`knTock`).

**10. Text drawn on canvas doesn't go through CSS and no tool can see it.**
`ctx.fillText` doesn't have `--fs`. The prices on the floor-price chart and the
hours on the gas tracker stayed at **9-10px for months** without anyone
noticing. **When touching any canvas, look for `.font=` and confirm the size
goes through `uiScale()` with a 15px floor — 17px if it's VT323.**

**11. Character names NEVER as literal text.** Always `CHARS[id].who`. They've
already been renamed three times (`ina_lurks` → `Anonymous Wallet` → `Kiv`;
`tobi_04` → `Stux`), and every hardcoded name became a silent bug in the Kaiju
Log, the changelog, and the Kaki+ cast. Related detail: **"Bom dia!" in the
English version is not a translation mistake** — the community hates gm/gn and
deliberately says *bom dia* (Portuguese for "good morning") on purpose. It's
identity.

**12. Nothing may leak between the MINT click and the player closing the
reveal.** Two things have already leaked: the NFT would appear in the wallet
before the reveal (today every token is born `hidden=1`), and the rare-pull
banner / new-species toast / level-up would fire together with the mint. Today
`doMintFlow` holds everything in `PENDING_REVEAL`, and `releaseHidden()`
releases it 210ms later. **Any new reaction to a mint goes into
`PENDING_REVEAL`, never straight into `doMintFlow`.**

---

## Bonus, testing-related

- **Test in the user's environment, not your own.** The first swapped-art bug
  only showed up with the `images/` folder next to the HTML file; running from
  `dist/` never reproduced it. It's the main lesson recorded in
  `docs/projeto/bug-arte-trocada.md`.
- **If the test doesn't reproduce what the owner reported, the test is wrong.**
  His own written rule. Both readability-meter bugs were found exactly this way.
- **PNG via `file://` taints the canvas** — `getImageData`/`toDataURL` fail. You
  need `--allow-file-access-from-files` in Chromium.
- **Source of truth for metadata:** `src/18b-meta.js` (traits + `pos`). Any old
  `meta.json` you find lying around has a different permutation — that mix-up is
  what produced the wrong art sheets in the first place.
</content>
</invoke>
