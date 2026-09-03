# 06 — Unlock schedule

One unlock per day. Never two.

The owner played the build and the verdict was blunt: three or four new things
were landing on the same in-game day, and nothing had time to become a habit
before the next novelty buried it. This document is the contract that fixes
that. It is enforced in `src/58-story.js`, in the `when:` clause of each beat.

## The calendar

| Day | Beat | What arrives |
|----|------|--------------|
| 1  | `b_open`, `b_first_mint`, `b_gas`, `b_endday`, `b_bulk`, `b_wallet`, `b_list`, `b_market` | The tutorial lane: minting, gas, the wallet, the market, ending the day |
| 2  | `b_inbox` | Kaiju Inbox — the mail app |
| 3  | `b_social` | Kaki+ — the social app |
| 4  | `b_tax` | Mr. Kaiju starts collecting |
| 5  | `b_boost` | Kaki+ update: reactions and posting |
| 6  | `b_hacked` | The scripted hack, and the Kaiju Shop with the antivirus on the shelf |
| 7  | `b_free` | The Kakizone — one free mint a day |
| 8  | `b_spotter` | Kaiju Spotter — catalogue work |
| 9  | `b_media` | KMP — the media player |
| 10 | `b_quests` | Kakizone update: daily tasks and milestones |
| 11 | `b_shop_more` | Shop restock — shelf 2 |
| 12 | `b_comfort` | Desktop notes |
| 13 | `b_shop_all` | The shop, fully stocked |
| 14 | `b_chart` | The chart and market statistics |

## Rules

1. **One delivery per day.** If you add a new beat that unlocks something,
   pick an empty day. Do not stack it on a day that already has an owner.
2. **Only one character speaks per delivery.** Two NPCs announcing the same
   thing reads as two people talking over each other. Pick one voice.
3. **Every app arrives as a download.** A `{dl:'<appid>'}` line inside the
   beat's `say` array plays the download animation and only then does the icon
   appear on the desktop. Icons never materialise out of nowhere.
4. **Reactive beats are not on this calendar.** `b_broke`, `b_cap`,
   `b_audit`, `b_gasburn`, `b_seize` and friends answer something the player
   did and can land on any day. The calendar governs *deliveries* only.
5. **The story presents; it does not permit.** The `SEMPRE` safety net in
   `58-story.js` force-unlocks anything the player provably needs (the wallet
   once they hold a Kaiju, the market, the mint page, ending the day) even if
   its beat never fired. A player can never be locked out by a missed line.

## Shelved features

`DM_ON` in `src/55-dm.js` is the master switch for direct messages inside
Kaki+. It is currently `0`: no threads are created, no popup appears, and the
Messages tab is not offered. The whole system is intact behind that switch —
set it to `1` to bring the feature back exactly as it was.
