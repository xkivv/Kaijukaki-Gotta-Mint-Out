# Kaijukaki — Gotta Mint Out!

Win98/CRT desktop simulator where you mint the Kaijukaki collection (8888 hand-
drawn busts). Single-file web game, no framework, no bundler.

```bash
bash build.sh                        # generates dist/kaijukaki.html (open with a double click)
node tools/extrair-arte.js           # only the 1st time: art for the desktop app
cd desktop && npm install --include=dev && npm start   # Electron version
```

**Read `START-HERE.md` before touching anything.** And `CONFIDENTIAL.md` before
sharing anything at all: the collection hasn't been minted yet.

`src/18c-real.js` is a placeholder on purpose and is in `.gitignore` — the
real file never enters this repository.
