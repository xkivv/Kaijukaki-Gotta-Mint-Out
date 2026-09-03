# Kaijukaki — Gotta Mint Out!

Pacote de código-fonte, versão **1.7**. Jogo web single-file, HTML + CSS + JS puro.
Sem framework, sem bundler, sem build step além de um `cat`.

---

## ⛔ ANTES DE QUALQUER COISA: a regra que não se quebra

A coleção Kaijukaki (8888 bustos desenhados à mão) **ainda não foi mintada na
vida real**. O jogo simula essa mintagem.

Se a ordem do jogo pudesse ser traduzida para a ordem real, alguém abriria o
jogo durante o mint de verdade e saberia se o próximo é raro. Isso arruinaria o
lançamento. Palavras do dono do projeto:

> *"como isso é sobre NFT e a coleção da kaijukaki ainda não foi mintada, não
> quero que as pessoas usem isso aqui pra descobrir qual é o próximo mint na
> vida real, ou seja, imagine que eu tô no site da scatter mintando na vida real
> e tá lá parado 3343/8888 mint e eu vou no jogo pra saber se 3344/8888 vale a
> pena. temos que dar algum tipo de shuffle entre as imagens e os dados. sem
> ferrar obviamente o sistema."*

**Isso é anterior a tudo. Se algum dia bater de frente com anti-cheat,
telemetria, leaderboard ou qualquer feature, o anti-spoiler ganha.**

Leia **`docs/03-SEGURANCA-ANTI-SPOILER.md`** inteiro antes de escrever a
primeira linha de servidor. Tem uma checklist no fim.

### O que foi removido deste pacote

`src/18c-real.js` normalmente contém `KK_REAL` — a permutação de 1..8888 que
liga o número do jogo ao arquivo real. **Ela não está aqui.** O arquivo virou um
placeholder com `KK_REAL = null`, que é exatamente o que a build pública e a
build de desktop já usam.

O jogo funciona 100% sem ela. A única coisa que falta é a build "local" do dono,
que lê os PNGs originais de 300px do disco dele. Você não precisa disso.

---

## Rodar em 30 segundos

```bash
bash build.sh                 # ~1s, sem dependência nenhuma
```

Gera três arquivos:

| arquivo | o que é |
|---|---|
| `dist/kaijukaki.html` (~15 MB) | **a build pública.** Arte embutida em base64. Abre com duplo clique, roda em `file://`, funciona offline. É esta que você usa. |
| `dist/kaijukaki-local.html` (~1,7 MB) | build sem arte embutida. Sem `KK_REAL` neste pacote, ela cai no mesmo comportamento da pública, só sem arte. Ignore. |
| `desktop/app/index.html` (~1,8 MB) | build do Electron. Lê a arte de `desktop/app/art/*.avif` — rode `node tools/extrair-arte.js` uma vez para gerar essa pasta (ela não vem no pacote porque seriam 10 MB de duplicata do base64 que já está em `src/`). |

Para rodar o desktop:
```bash
bash build.sh                              # OBRIGATÓRIO primeiro
node tools/extrair-arte.js          # so na primeira vez: gera desktop/app/art/
cd desktop && npm install --include=dev && npm start
```
⚠️ **`bash build.sh` antes, sempre.** `desktop/app/index.html` é produto de build
e **não vem neste pacote** — sem rodar o build, o Electron abre numa janela em
branco (`loadFile` de um arquivo que não existe). A pasta `desktop/app/art/`
essa sim já vem pronta.
⚠️ Se `npm install` disser "up to date" sem criar `node_modules`, é o
`NODE_ENV=production` da máquina pulando devDependencies em silêncio. Use
`--include=dev`. Está documentado em `desktop/COMO-RODAR.txt`.

Para rodar os testes (única coisa que precisa de npm na raiz):
```bash
npm install                        # só o playwright
node tools/leg2.js 1366 900        # medidor de legibilidade — tem que dar 0
```

---

## Como o projeto está organizado

```
src/            44 arquivos JS + 23 CSS + 2 .html. build.sh concatena numa ordem FIXA.
build.sh        o build inteiro, 25 linhas de bash
tools/          medidores de legibilidade (Playwright)
desktop/        app Electron (main.js + preload.js + o mesmo jogo)
docs/           o que você está lendo, e o resto
```

Dos 44 JS, **41 entram em cada build**: os 39 fixos mais um slot de arte
(`18a-sheets` / `18a-nosheets` / `18a-files`) e um slot de mapa
(`18c-noreal` / `18c-real`). Os outros 3 são as alternativas não usadas naquele
alvo.

**A ordem em `build.sh` é contrato, não estilo.** Trocar a ordem de dois
arquivos pode matar o jogo inteiro (tela preta). Está explicado em
`docs/01-ARQUITETURA.md` §3 ("Por que a ordem importa") — leia antes de mexer.

---

## Os documentos, na ordem em que valem a pena

| doc | quando ler |
|---|---|
| **`docs/03-SEGURANCA-ANTI-SPOILER.md`** | **primeiro, sempre** |
| `docs/01-ARQUITETURA.md` | antes de mexer no build ou adicionar arquivo |
| `docs/02-SAVE-E-ESTADO.md` | se o trabalho envolve save, contas ou sincronia |
| `docs/04-PONTOS-DE-INTEGRACAO.md` | onde um servidor encosta, e o que vira async |
| `docs/05-ARMADILHAS.md` | 12 bugs que já custaram dias neste projeto |
| `PERSONAGENS.md` (raiz) | quem é cada personagem, tom de voz, e onde colar os retratos. Leia antes de escrever qualquer fala nova |
| `docs/projeto/*` | as regras e o design do jogo, escritos ao longo do desenvolvimento — comece por `docs/projeto/LEIA.md` |

---

## As três coisas que mais surpreendem quem chega

**1. O jogo não faz rede.** Zero `fetch`, zero `XMLHttpRequest`, zero WebSocket.
A única requisição externa é o Google Fonts. Ele roda offline, do zero ao fim.
Persistência é `localStorage` puro.

**2. Não há versionamento de schema no save.** O campo `tv:3` é escrito e
**nunca lido**. A compatibilidade com save antigo é conquistada por
defensividade total dentro de `migrate()`, não por versão. Se você vai pôr save
num servidor, **adotar `tv` como campo lido é o passo zero** — sem isso não dá
pra escrever migração server-side segura. Detalhes em `docs/02`.

**3. Não existe nenhuma defesa contra trapaça.** `G` é um objeto global mutável.
`G.money = 1e9; save()` no console funciona e persiste. `importSave()` aceita
qualquer JSON sem assinatura. Isso é fato conhecido e aceito — o jogo é
single-player. Vira problema no minuto em que existir leaderboard. As opções
realistas estão em `docs/04` §5.

---

## Convenções do código

- **Comentários em português.** Strings de tela em inglês, sempre dentro de
  `t('...')`, com o par português em `src/19-i18n.js`. O jogo é bilíngue.
- **Legibilidade é regra número um do dono.** Nada legível pode renderizar
  abaixo de `calc(15px * var(--fs))`, e todo texto passa em contraste WCAG AA.
  `node tools/leg2.js` mede isso e **tem que dar `TOTAL FORA DA REGRA: 0`**
  antes de qualquer entrega. Detalhes em `docs/projeto/REGRAS-DO-PROJETO.md`.
- **Visual Win98 + CRT.** Bevel por `box-shadow`, nada de canto arredondado
  moderno, nada de gradiente genérico. O jogo tem identidade e ela é defendida.
- **Nome de personagem nunca em texto literal** — sempre `CHARS[id].who`. Eles já
  foram renomeados três vezes.

---

## Quem falar

Kiv (Oekaki Connect) é o dono do projeto e da coleção. Ele **não programa** —
entregue código pronto e explique em português simples o que mudou e por quê.
