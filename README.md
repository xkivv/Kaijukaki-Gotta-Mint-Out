# Kaijukaki — Gotta Mint Out!

Simulador de desktop Win98/CRT onde você minta a coleção Kaijukaki (8888 bustos
desenhados à mão). Jogo web single-file, sem framework, sem bundler.

```bash
bash build.sh                        # gera dist/kaijukaki.html (abre com duplo clique)
node tools/extrair-arte.js           # só na 1ª vez: arte pro app de desktop
cd desktop && npm install --include=dev && npm start   # versão Electron
```

**Leia `LEIA-PRIMEIRO.md` antes de mexer.** E `CONFIDENCIAL.md` antes de
compartilhar qualquer coisa: a coleção ainda não foi mintada.

`src/18c-real.js` é um placeholder de propósito e está no `.gitignore` — o
arquivo real nunca entra neste repositório.
