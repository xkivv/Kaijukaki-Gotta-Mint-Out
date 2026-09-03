# Modo História — como funciona

> Documento escrito durante o desenvolvimento, para o dono do projeto. Foi
> adaptado só na forma de tratamento; o conteúdo técnico está inteiro.
>
> ⚠️ Este documento é da v3.1. A ordem de abertura e alguns gatilhos mudaram na
> v3.2.1 — a lista válida hoje está em `bug-congelamento-historia.md`.

Entrou na v3.0. Antes disso o jogo abria com doze ícones, quatro painéis
flutuantes e onze sistemas ao mesmo tempo, e nada disso significa nada antes de
o jogador ter um Kaiju na mão.

## O contrato, em uma linha

`unlocked(id)` é a única pergunta que o resto do jogo faz.
Tudo que **não** está em `LOCKABLE` é considerado aberto — então esquecer de
registrar um sistema novo nunca o esconde por acidente. O erro cai pro lado
seguro.

## Os arquivos

| arquivo | o que é |
|---|---|
| `src/58-story.js` | o motor: `BEATS`, `CHARS`, `LOCKABLE`, `story()`, `storyTick`, `storyPump`, `storyShow`, `storyMigrate` |
| `src/56-dm-lines.js` | (DM, não confundir) |
| `src/59-story-log.js` | o app **Kaiju Log** e o bloco `RETRATOS` onde as imagens dos personagens entram |
| `src/27-story.css` | a caixa de fala e o anel que aponta |
| `src/28-storylog.css` | o app do log |
| `PERSONAGENS.md` (raiz) | quem é cada um, tom de voz, e onde colar as imagens |

## O ritmo — DUAS FILAS (mudou na v3.1)

Na v3.0 havia uma cota só pro dia inteiro, e isso criou o bug que o dono do
projeto reportou: **depois do primeiro mint a moderadora sumia por dois dias.**
Os momentos de tutorial (gas, batch mint, carteira, ir listar) disputavam a mesma
cota que "o mercado tá frio hoje" — e perdiam.

A partir da v3.1 existem **duas filas com cotas independentes**:

| fila | marca | cota dia 1 | cota depois | intervalo |
|---|---|---|---|---|
| tutorial | `core:1` | 5 | 3 | 2 horas de jogo |
| resto | (nada) | **0** | 2 | 3 horas de jogo |

- **O dia 1 é só tutorial** (cota comum = 0). O jogador vê exatamente
  mintar → gas → encerrar o dia → carteira, e nada mais. Fórum, loja e imposto
  esperam ele acordar.
- Cota estourada **não para a varredura**: `if(cheio&&!cedo&&!ocupado)continue`.
  Sem isso, um momento de tutorial esperando a vez tranca todos os outros atrás
  dele (e vice-versa) — era essa a causa raiz do silêncio.
- Intervalo e fila em andamento **param tudo**, porque são sobre a TELA.
- `urg:1` fura a cota do dia, **nunca o intervalo**.
- Um beat adiado **não destrava nada** — a fala e o destravamento andam juntos.

Constantes em `src/58-story.js`:
```js
const STORY_DAY_CAP=2, STORY_DAY1_CAP=0, STORY_GAP_H=3;
const STORY_CORE_CAP=3, STORY_CORE_CAP1=5, STORY_CORE_GAP=2;
```

### A abertura, na ordem exata

| # | beat | condição | abre |
|---|---|---|---|
| 1 | `b_open` | carteira criada | site, market, wallet, shutdown, relógio |
| 2 | `b_first_mint` | 1º mint | readme, tamanho da página de mint |
| 3 | `b_gas` | 1º mint | medidor de gas |
| 4 | `b_endday` | 13h **ou** 3 mints **ou** dia 2 | — |
| 5 | `b_wallet` | 2 na mão | — |
| 6 | `b_bulk` | 2 mints | os botões x2..x10 |
| 7 | `b_market` | 3 na mão | ofertas, sweep |
| 8 | `b_list` | **5 na mão** | — (manda abrir a carteira e listar) |

`b_gas` era `dia>=2`; `b_bulk` era `nível 2 + 6 mints`; `b_market` era
`dia>=2 + 2 na mão`. Todos perdiam a janela em que o ensinamento importa.

## Um canal de cada vez

Enquanto alguém fala (`body.storytalk`):
- o balão de pensamento some
- os toasts sobem pra cima da caixa
- pop-up de golpe **não nasce** (`maybeScam` recusa)
- se um modal abrir por cima, a caixa se esconde e volta quando ele fechar

## O selo NOVO

- aparece quando algo chega e some quando o jogador abre aquilo uma vez
- **vence sozinho em 3 dias**
- **no máximo 3 na tela**, os mais recentes
- o que o **primeiro** momento entrega não ganha selo

## Save antigo

`storyMigrate()` roda uma vez. Se o save mostra alguém que já passou de um
momento (`when()` é verdade), o beat é marcado como visto e o que ele abre nasce
aberto, **sem fala**. Ninguém acorda com quatro ícones.

## Como somar um sistema novo ao jogo

1. Registre o id em `LOCKABLE` (`58-story.js`).
2. Escreva um beat com `when`, `un:['seu_id']` e 1–3 falas na voz de quem faz sentido.
3. Se aquilo faz parte do **caminho de aprender a jogar**, marque `core:1`.
   Se é comentário sobre o mundo, deixe sem marca.
4. No app, envolva o recurso em `if(unlocked('seu_id'))`. **Esconder, não desabilitar.**
5. Garanta que o app fica coerente sem aquilo: sem buraco de layout, sem barra vazia.
6. Rode `node tstory-sim.js` e confirme que o beat é alcançável.

## Os seis

| id | quem | quando fala |
|---|---|---|
| `ina` | **Anonymous Wallet**, moderadora, viu quatro coleções morrerem | o essencial, o onboarding, o fim |
| `oni` | oni_of_the_floor, vigia | preço, floor, listagem, rank, reputação |
| `tobi` | tobi_04, erra primeiro por você | gas, golpe, lote, a decisão cara |
| `hakase` | baleia, fala pouco | cofre, ofertas grandes, endgame |
| `sera` | sera_ok, tira gente do parapeito | quando o jogo machuca — nunca antes |
| `kaiju` | Mr. Kaiju | quer dinheiro. nunca amigável |

O handle `ina_lurks` foi aposentado na v3.1 — o dono do projeto quis algo mais
misterioso. O nome mudou no motor, no elenco do Kaki+ (`49-social-data.js`), no
changelog e no `PERSONAGENS.md`. Equilíbrio medido: ina 32%, tobi 27%, oni 17%,
hakase 11%, sera 7%, Mr. Kaiju 6%.

(Os nomes de tela desta tabela são os da v3.1. Na v3.2 `ina` virou **Kiv** e
`tobi` virou **Stux** — ver `IMERSAO-E-PERSONAGENS.md`.)

## Retratos

Um lugar só: o bloco `RETRATOS` no topo de `src/59-story-log.js`.
**320×320 PNG, quadrado 1:1** (mínimo 256 — a moldura é `86px × var(--ui)`, com
`--ui` até 1,7 e retina ×2). `object-fit:cover`, então enquadre com folga.
Pode entregar um por vez: aspas vazias caem no avatar pixelado dentro da mesma
moldura escura.

## Fato da coleção (não erre de novo)

Os **8888 são desenhados à mão, um por um** — isso é a identidade inteira e
aparece em 27 lugares. Mas **não foi uma pessoa só**. Qualquer linha do tipo
"eu desenhei todos", "uma pessoa e uma caneta", "the artist" no singular está
errada. Corrigido na v3.1 em `58-story.js` (b_open), `30-app-site.js`
(POST_TEXT), `49-social-data.js` e `34-app-misc.js` (readme).

## Verificação antes de entregar

```
node tstory-sim.js    # 120 dias: momentos por dia, órfãos, equilíbrio de vozes
node st4.js           # 16 dias: quantos momentos por dia, o que abriu
node jorn.js          # jornada real clicando nas falas, dia 1 ao 20
node tools/leg2.js    # + 1024 700 + 393 830  → zero nos três
```
(Os três primeiros são scripts do container de trabalho do dono e **não vêm
neste pacote**; ficam aqui como descrição do que precisa ser coberto.)

E o caminho de primeira vez de verdade: o assistente da carteira leva ~2,5s pra
sair da tela de boas-vindas (tem animação) — automação com espera curta falha
sem que nada esteja quebrado. Cuidado também com `#modalveil.on`: ele fica
ligado depois do assistente e trava `storyPump` em harness de teste.
