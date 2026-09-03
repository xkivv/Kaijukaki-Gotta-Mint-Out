# CHARACTERS — Story Mode

Six people guide the player. None of them was invented to be a tutorial:
they all already existed in the game's feed and DM, and they keep appearing
there afterward. That's why each one's portrait has to be the **exact same
face** she uses in Kaki+.

---

## The six

### `Anonymous Wallet` — the moderator
**Is:** moderator · has already watched four collections die.
**Tone:** calm, direct, no hype. Short, affirmative sentences. Doesn't sell
anything, doesn't promise anything, doesn't use crypto slang. She's the one
who opens the game ("So you found it too.") and who explains what's
structural: hype, the ledger, rank.
**Draws as:** someone who's been here too long to get excited anymore.

### `oni_of_the_floor` — the floor watchman
**Is:** floor watchman · doesn't like you yet.
**Tone:** suspicious, curt, a bit hostile at first. Talks in numbers and
market rules. Watches what you list and judges it. "Don't dump on the floor.
I'll know, and so will everyone else."
**Draws as:** someone watching you out of the corner of their eye.

### `hakase` — the silent buyer
**Is:** buys silently · shows up when there's money.
**Tone:** telegraphic. Three-word sentences. Opens a conversation with a
fish name ("Tuna.", "Swordfish.") like giving a password. Only appears when
the player has ranked up or sold something — money is what brings him.
**Draws as:** someone who doesn't blink.

### `Leaner (Unc)` — the uncle of the room
**Is:** talks people down from the ledge.
**Tone:** the warmest of the six. Speaks up when the game has hurt you: you
got wiped out, the chart turned into a cliff, the collector took your Kaiju.
Never gives optimization tips — gives human context. "It's not a loss, it's
Tuesday."
**Draws as:** someone looking at you, not at the screen.

### `tobi_04` — who already made every mistake before
**Is:** already made every mistake before you did.
**Tone:** **all lowercase**, no formal punctuation, confessional. Always
tells you about their own loss before giving advice ("i minted twelve at
peak hype once. paid twenty and got twelve back."). The only one who talks
about gas, scams, antivirus, and the traps players set for themselves.
**Draws as:** tired, a little disheveled, friendly.

### `Mr. Kaiju` — the collector
**Is:** self-appointed tax collector. **Not part of the collection** — his
own profile in the app says so in plain terms.
**Tone:** administrative threat. Doesn't shout, doesn't explain, doesn't
negotiate. Form-letter phrasing ("Audit. I don't need a reason and you have
no recourse.").
**Draws as:** the villain. He's the only one allowed to look ugly.

---

## The images

| item | value |
|---|---|
| **ideal resolution** | **320 × 320 px** |
| minimum resolution | 256 × 256 px |
| aspect ratio | **1:1 (square)** — mandatory |
| format | PNG (with or without transparency, either is fine) |
| framing | face/bust centered, with some margin at the edges |
| where it appears | 86 pt frame in the speech box · 96 pt in the "People" tab · 52 pt in the Log |

**Why 320:** the speech box frame measures `86px × var(--ui)`, and the game
can be scaled up to 1.7× (`ui-xl`). On a retina screen that's
`86 × 1.7 × 2 = 293` real pixels. 320 covers the worst case with margin to
spare and doesn't add much file weight.

**The image is cropped by `object-fit: cover`.** It fills the entire square
frame without distorting. If the art isn't square, the edges get cut off —
which is why the framing needs margin to spare.

**Missing an image breaks nothing.** A character with no art falls back to
the pixelated avatar — the **same one** they use in Kaki+ — inside the same
dark frame, with a phosphor glow and CRT scanlines on top. You can deliver
one portrait at a time without anything looking like a missing asset.

---

## Where to paste it

File: **`src/59-story-log.js`**, at the top, in the `const RETRATOS = {…}`
block. It's the only place. No other file needs to be touched.

1. Save the artwork as a square 320×320 PNG.
2. In the terminal, convert it to base64:

   ```
   base64 -w0 ina.png
   ```

3. Build the line (the prefix is mandatory):

   ```
   data:image/png;base64,PASTE_THE_RESULT_HERE
   ```

4. Paste it between the character's quotes in `RETRATOS`:

   ```js
   const RETRATOS={
     ina:    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
     oni:    '',
     hakase: '',
     sera:   '',
     tobi:   '',
     kaiju:  ''
   };
   ```

5. Run `./build.sh` from the project root. Done — the portrait shows up in
   the speech box, in the Log, and in the "People" tab profile all at once.

The keys are `ina`, `oni`, `hakase`, `sera`, `tobi`, `kaiju` — in that order,
and they don't change.

---

## What NOT to touch

- `storyPortrait()` in `src/58-story.js` — it's what decides between the
  image and the pixelated avatar. It already works; the `RETRATOS` block
  only feeds it.
- `CHARS` in `src/58-story.js` — who each character is, their subtitle, and
  the fallback icon live there. The `RETRATOS` block only writes the `art`
  field.
