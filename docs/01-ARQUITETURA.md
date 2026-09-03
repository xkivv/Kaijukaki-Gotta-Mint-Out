# Arquitetura e build

## 1. O build

`build.sh` — 25 linhas de bash. **Não há bundler, npm build, transpilação nem
minificação.** É `cat` de arquivos numa ordem fixa dentro de um esqueleto HTML.

```
src/00-head.html          <meta>, <title>, Google Fonts
<style>  23 arquivos CSS  </style>
src/05-body.html          o DOM estático (#screen, #desktop, #hud, #taskbar, #boot)
<script> 41 arquivos JS   </script>
```

O `package.json` da raiz existe **só** para segurar o `playwright` dos testes.
O único `package.json` com build de verdade é `desktop/package.json` (Electron).

### Os três alvos

A função `build()` recebe três parâmetros: o slot de arte, a saída e o slot do
mapa real. **A diferença entre os três alvos é exatamente dois arquivos.** Todo o
resto — 5.572 linhas de CSS e ~19.000 de JS — é byte a byte idêntico.

| alvo | slot de arte | slot do mapa | tamanho |
|---|---|---|---|
| `dist/kaijukaki.html` | `18a-sheets.js` (35 folhas AVIF em base64) | `18c-noreal.js` | ~15,4 MB |
| `dist/kaijukaki-local.html` | `18a-nosheets.js` (nenhuma) | `18c-real.js` | ~1,7 MB |
| `desktop/app/index.html` | `18a-files.js` (aponta pra `art/*.avif`) | `18c-noreal.js` | ~1,7 MB + 11 MB de arte |

`src/18a-files.js` declara `KK_SHEET_DIR='art/'`, e `sheetSrc()`
(`src/23-art.js`) devolve `art/N.avif` em vez de decodificar base64. **É o único
ramo de código diferente entre web e desktop.**

## 2. As faixas de numeração

**CSS (23 arquivos, 5.572 linhas)**

| faixa | papel |
|---|---|
| `10-base` `11-window` `12-apps` `13-fx` | esqueleto Win98/CRT, janelas, apps, efeitos |
| `15` a `20` | CSS por área (market, social, mint, onboard, shop) |
| `21-legible` `21b-leg-*` | overrides de tamanho de fonte, um por área |
| `22` a `28` | telas específicas (desktop, quests, spotter, tamanho, DM, história) |
| `21c-contrast` | **penúltimo** — correções de cor |
| `14-mobile` | **último, sempre** |

⚠️ **A ordem do CSS não é numérica.** `21c-contrast` vem depois de `28`, e
`14-mobile` vem por último. É deliberado: quem escreve regra nova e é
sobrescrito no celular sobe a especificidade (`html body.mob .x{}`), não muda a
ordem.

**JS (44 arquivos em `src/`; 41 entram em cada build)**

Os 3 que sobram em cada alvo são os slots alternativos: das três variantes de
arte (`18a-sheets` / `18a-nosheets` / `18a-files`) e das duas de mapa
(`18c-noreal` / `18c-real`), o `build()` escolhe uma de cada.


| faixa | papel |
|---|---|
| `18a-*` `18b-meta` `18c-*` | dados: arte · metadata · mapa real |
| `19` a `24a` | núcleo: i18n, util, ícones, dados, arte, estado, preferências |
| `25` `26` | shell: window manager e relógio/fluxo do dia |
| `30` a `59` | um app ou sistema por arquivo |
| `40-boot.js` | **desktop + boot — vai por ÚLTIMO no bundle, apesar do número** |

Os maiores, em linhas (`wc -l`): `40-boot` 1467 · `44-app-inbox` 1327 ·
`30-app-site` 1318 · `56-dm-lines` 1245 · `51-app-social` 991 · `58-story` 863 ·
`31-app-market` 738. `24-state.js` (1521) é o maior de todos e é o coração da
economia.

## 3. Por que a ordem importa (testado, não suposto)

Tudo cai dentro de **um único `<script>`**, então todos os arquivos dividem o
mesmo escopo de topo.

1. **`const`/`let` de topo estão em TDZ.** `src/22-data.js` faz
   `const TRAIT_LAYERS = KK_META.types.slice()` **em tempo de carga**. Pôr
   `22-data.js` antes de `18b-meta.js` dá
   `Cannot access 'KK_META' before initialization` — e isso **mata o `<script>`
   inteiro**: tela preta, jogo não existe. O mesmo vale para `src/23-art.js` e
   seu IIFE `probeArt()`.
2. **`function` de topo hoistam pelo bundle inteiro.** Mover `40-boot.js` para o
   meio não dá erro. O que é sensível a ordem é: TDZ de `const`, IIFE que roda na
   carga, e monkey-patching.
3. **`40-boot.js` tem que ser o último** — é ele que contém o IIFE `init()` que
   liga o jogo (`useSlot(1); G=migrate(null); setLang('en'); boot();`). Ele
   **não** é a última coisa do arquivo: `init()` está por volta da linha 1436 e
   depois dele ainda vem o IIFE `kkVisTick()` (linha 1464), que liga o
   `visibilitychange`. O que importa é que `init()` roda na carga, então tudo o
   que ele toca já tem que existir — por isso o arquivo inteiro vai por último
   no bundle.
4. **`54-collection.js` tem que vir depois de `24-state.js` e `31-app-market.js`**
   — ele faz monkey-patch de `onHour`, `sellTick` e `mktTick`, guardando a
   original numa closure (`const _onHour=onHour; onHour=function(){...}`).
   Carregado antes, embrulha `undefined`.
5. **`22-data.js` muta `KK_META.dict` na carga** (`renameTraits()`:
   `Special`→`Secret`, `Reserve`→`Reserved`). Quem ler o dicionário antes disso vê
   os nomes originais dos arquivos da coleção.
6. **`const` duplicado no topo de dois arquivos = `SyntaxError` global.** Não há
   namespacing. **Sempre rode uma varredura de sintaxe antes de entregar:**

```bash
bash build.sh
python3 -c "
s=open('dist/kaijukaki.html',encoding='utf-8').read()
i=s.index('<script>')+8; j=s.rindex('</script>')
open('/tmp/js.js','w',encoding='utf-8').write(s[i:j])"
node --check /tmp/js.js
```

## 4. O padrão para estender sem pisar em arquivo alheio

`src/54-collection.js` é a referência. Ele adiciona um sistema inteiro (lances na
coleção, volume) sem editar `24-state.js`: guarda a função original numa closure
e substitui a global.

```js
const _onHour = onHour;
onHour = function(){ _onHour(); /* o seu tick aqui */ };
```

**Um backend deve usar exatamente esse padrão, num arquivo novo carregado no fim
do bundle.** Assim o `git diff` de quem mexe em outra coisa não colide com o seu.

## 5. Como rodar e testar

```bash
bash build.sh                          # ~1s, sem dependências
# abrir dist/kaijukaki.html — file:// funciona
npm install                            # só pra rodar os testes (playwright)
node tools/leg2.js 1366 900            # legibilidade — TEM que dar 0
node tools/leg.js site,market,wallet   # medidor por app
```

O atalho canônico para pular login + wizard dentro de um teste Playwright:

```js
await p.evaluate(()=>{
  const v=document.querySelector('#wizveil');
  if(v){v.remove(); G.walletMade=true; G.nick='kiv'; save(); start();}
});
```

⚠️ O assistente de carteira leva ~2,5 s para sair da tela de boas-vindas (tem
animação). Automação com espera curta falha sem que nada esteja quebrado.
E cuidado: `#modalveil` fica ligado depois do assistente e trava a fila de
diálogo em harness de teste — remova a classe `.on`.

## 6. O Electron

`desktop/main.js`:
- `requestSingleInstanceLock()` — duas janelas escrevendo o mesmo save = save
  corrompido
- `loadFile('app/index.html')` — sem servidor local
- `setWindowOpenHandler`: `http(s):` abre no navegador do sistema, o resto é
  negado; `will-navigate` bloqueia sair de `file://`
- `additionalArguments: ['--kk-save-dir=' + userData/saves]`
- **`contextIsolation:false`** — justificado no arquivo: o preload precisa
  **substituir** `window.localStorage`, e `contextBridge` não troca um acessor
  nativo do `window`

`desktop/preload.js` troca `window.localStorage` por um shim com a mesma
interface que lê e escreve `<userData>/saves/save.json`:
- escrita em memória na hora, em disco **400 ms depois** (debounce) — "gravar 40
  vezes por minuto destrói SSD e trava a UI"
- grava `.tmp` → copia o atual para `.bak.json` → `renameSync` (atômico)
- flush síncrono em `beforeunload` e `pagehide`
- **tem que rodar no topo do preload**: o script do jogo roda no fim do `<body>`,
  antes do `DOMContentLoaded`; esperar esse evento faria o jogo ler o
  localStorage nativo e nascer vazio toda vez

**O jogo não sabe que isso existe. Nenhuma linha de `src/` muda.**
Isso significa que **a camada de persistência já está abstraída no desktop** — ver
`docs/04`, §1.
