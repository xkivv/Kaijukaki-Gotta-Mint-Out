# Regras do projeto — Kaijukaki Gotta Mint Out!

> Documento escrito durante o desenvolvimento, para o dono do projeto. Foi
> adaptado só na forma de tratamento; o conteúdo técnico está inteiro.

## 1. LEGIBILIDADE — a regra que não se quebra

**Nada no jogo pode ser ilegível. NUNCA.** Isto vale pra toda tela, todo app,
todo estado, todo tamanho de interface. O dono do projeto já reportou texto ruim
seis vezes; não pode haver uma sétima.

### O piso
Nenhum texto que uma pessoa precise LER pode ficar abaixo de **`calc(15px * var(--fs))`**.

Só podem ficar menores:
- rótulos decorativos em `--pix` que ninguém precisa ler (crumbs do banner, "EST 199X")
- números dentro de medidores, e ainda assim nunca abaixo de 13px

### A armadilha da VT323
`--term` (VT323) e `--pix` (Press Start 2P) **desenham muito menores que o
tamanho nominal**. 16px de VT323 lê como ~11px de Tahoma.

- **Nunca use `--term` ou `--pix` para texto corrido.** Prosa é `--uif` (Tahoma).
- `--term` serve pra NÚMERO (dinheiro, contadores, IDs) e aí precisa de
  **+4 a +6px** em relação ao que você usaria em Tahoma pro mesmo peso visual.

### A armadilha da especificidade
Já aconteceu duas vezes: uma regra somada no FIM do arquivo, mais específica que
as outras, prendeu um texto em 9px e venceu todos os aumentos feitos depois.
**Antes de dizer que aumentou um texto, procure no arquivo inteiro por outra
regra que atinja o mesmo elemento.**

### MEDIR, NÃO CHUTAR — `tools/leg2.js`
Ler o CSS não prova nada, e olhar print também não: o que vale é o que a tela
desenha. `tools/leg2.js` abre o jogo, **percorre todas as abas de todos os
apps** e reporta dois problemas de uma vez:

- **[T] tamanho** — texto abaixo de `calc(15px * var(--fs))`
- **[C] contraste** — abaixo de WCAG AA (4,5:1 normal, 3:1 pra ≥24px ou ≥19px negrito)

```
cd <pasta do projeto> && ./build.sh
node tools/leg2.js                      # 1366x900, UI Large + Texto Médio
node tools/leg2.js 1024 700
node tools/leg2.js 1366 900 ui-xl txt-l
node tools/leg2.js 393 830              # celular
```

Sai com código 1 se achar qualquer coisa. **Antes de entregar tem que dar
`TOTAL FORA DA REGRA: 0` nas quatro.** (v2.6: zerado.)

#### Dois furos que este medidor já teve — não reintroduza
1. **Só media elementos SEM filhos.** Uma frase como `…e <b>derrubar queima o
   hype</b>.` tem um filho, então a frase inteira era pulada e só o negrito era
   medido. Era exatamente onde estava o texto de que o dono reclamou. Hoje quem
   manda é o **nó de texto**, medido pelo tamanho que o pai desenha.
2. **Gradiente contado como cor sólida.** Título branco sobre barra azul era
   reportado como branco sobre cinza. Hoje, se o elemento (ou um pai) tem
   `background-image`, `text-shadow` ou `mix-blend-mode`, o contraste não é
   chutado — só o tamanho é reportado.

#### O furo que NENHUM medidor de CSS pega: texto em canvas
Rótulo desenhado com `ctx.fillText` não tem CSS, não tem `--fs`, e nenhuma
ferramenta enxerga. Ficaram meses em 9 e 10px: os preços do gráfico de floor
(`31-app-market.js`) e as horas do gas tracker (`45-widgets.js`).
**Ao mexer em qualquer canvas, procure `.font=` e confirme que o tamanho passa
por `uiScale()` e tem piso de 15px** (VT323 em canvas: piso 17).

### Contraste também é legibilidade
"Fonte pequena **e fina**" quase nunca é só tamanho. Cinza sobre cinza a 4:1
cansa em qualquer tamanho, porque o olho reconstrói cada letra — foi isso que o
dono chamou de *cansaço visual acumulado*. As correções moram em
`src/21c-contrast.css`, que carrega por último (antes só do celular).

Regra prática por fundo:
- fundo `--face` (#c0c0c0): tinta secundária no máximo **#3d3d3d**, nunca #5a5a5a
- fundo `--pg-paper` (#7d828a, a página de mint): nesse cinza **não existe texto
  "meio apagado"** — pra chegar em 4,5:1 a tinta tem que ser quase preta. O
  secundário ali é mais FRIO (`--pg-ink-dim:#171b21`), não mais claro.
- fundo escuro (binder, widgets): o secundário CLAREIA, não escurece.

### Onde os overrides moram
`21-legible.css` (página de mint + geral), `21b-leg-shell.css`,
`21b-leg-market.css`, `21b-leg-social.css`, `21b-leg-shop.css` — um por área — e
`21c-contrast.css` (cor). Todos carregam depois de `12-apps.css`/`13-fx.css`.
**Só `14-mobile.css` carrega depois**: se uma regra sua perder no celular, suba
a especificidade (`html body.mob .x{...}`).
Cor em `style=""` inline vence qualquer CSS — nesse caso conserte na origem, no JS.

### Como verificar (obrigatório antes de entregar)
1. `node tools/leg2.js` nas quatro configurações = **TOTAL FORA DA REGRA: 0**.
2. Screenshots LIDAS com os próprios olhos, incluindo as telas com gráfico.
3. Se você precisou aproximar o zoom pra ler, está errado.

## 2. O anti-spoiler (regra original do dono do projeto, verbatim)

> "como isso é sobre NFT e a coleção da kaijukaki ainda não foi mintada, não
> quero que as pessoas usem isso aqui pra descobrir qual é o próximo mint na
> vida real (...) temos que dar algum tipo de shuffle entre as imagens e os
> dados. sem ferrar obviamente o sistema."

- Os IDs do jogo são **permutados**. O mapa jogo → arquivo real é o `KK_REAL`.
- O `KK_REAL` vive SÓ em `src/18c-real.js` (build local) e no `kk-artmap.js`
  externo opcional. **Nunca** entra na build pública nem na build de desktop.
  (Neste pacote ele **não** vem: `18c-real.js` é um placeholder com
  `KK_REAL = null`.)
- Build de desktop: arquivo em disco é trivial de abrir. Continua sem `KK_REAL`.
- **Nada no jogo pode entregar a ordem do mint real.**
- Telas que mostram arte + dados (Kaiju Spotter, Today's Best Pulls) usam
  **número de ficha inventado**, nunca o número do token.

## 3. Como o dono do projeto trabalha

- Sempre 4 agentes (Planejamento, Execução, Animação & Satisfação, Polimento/Bug).
- **Nunca duvidar do feedback dele.** "Se eu trago um feedback é porque está
  acontecendo." Se o teste não reproduz, **o teste está errado** — procure o
  furo no teste, não a prova de que ele se enganou. Os dois furos do medidor de
  legibilidade foram achados exatamente assim.
- Nada de visual genérico de IA. Ele odeia roxo+amarelo. Win98 + CRT é a identidade.
- O jogo tem que ter **alma**. Feito à mão, não template.
- Não escrever demais no chat. Não pedir desculpa à toa.
- Ele não programa: entregar código pronto, sem TODO, sem meia-solução.
- Comentários no código em português. Strings de tela em inglês dentro de `t()`.

## 4. Camadas da tela (quem fica por cima de quem)

Isto já causou dois bugs, então está escrito:

| camada | z-index | quem |
|---|---|---|
| relógio da área de trabalho | 1 | `.wgt.bare` — é papel de parede, fica ATRÁS das janelas |
| janelas | 100+ | `.win`, sobe a cada foco |
| painéis | 3900 | `.wgt` (Kaiju Charts, Gas Tracker) — sempre por cima |
| carteira | 4000 | `#hud` |
| barra de tarefas | 5000 | `#taskbar` |

Como os painéis ficam por cima, **a janela nasce limitada pela coluna deles**
(`colunaLivre()` em `25-wm.js`) — senão, numa tela de 1024, o botão Install da
loja nasce escondido atrás do Gas Tracker.

## 5. Economia — o que cada número significa

- **`floorPrice()` nunca fica abaixo do custo de reposição.** Cunhar um Kaiju
  novo custa `mintPrice() + gas`. Com gas violento o floor ignorava isso e todo
  Common nascia com prejuízo garantido. Hoje o piso é
  `replaceCost() * 0.92`, com `replaceCost() = mintPrice() * (1 + gasDayAvg())`.
  Usa a **média do gas do dia**, nunca o instante — senão o floor pularia com
  cada pico de cinco minutos.
- **`tokenValue()` tem o mesmo piso** (0,90), senão uma raça fria puxava a carta
  de volta pra baixo do custo.
- **Marcos (Milestones) usam `max(held(), G.peakHeld)`**, não `held()`. Vender
  não pode andar com a barra pra trás — é a mesma base do rank.
- **`questBump('file', n)`** tem que ser chamado nos TRÊS caminhos de arquivar
  (encher página, clique, arrastar) e só quando um slot **vazio** é preenchido.
  Faltou por versões inteiras e a missão contava zero.
- **`G.mintLog`** é o registro do que saiu da máquina, independente de quem é o
  dono. O "Your Last Mints" lê ele, não a carteira.

## 6. Verificação antes de entregar (sempre)

- Sintaxe: `node --check <arquivo>` em cada `.js` mexido
- `./build.sh`
- `node tools/leg2.js` nas quatro configurações = zero
- Regressão headless com Playwright + `page.on('pageerror')` = zero erros
  (a suíte do dono vive num container descartável: `reg.js`, `mob.js`, `tax.js`,
  `uil.js`, `kk.js`, `mint.js`, `desk.js`, `spot2.js`, `shop.js`, `wiz3.js` —
  não vêm neste pacote)
- Screenshots LIDAS com os próprios olhos, em `--ui` 1 e 1.7 e no celular
- Save round-trip continua passando
- Código-fonte zipado para arquivo: o container de trabalho é descartável
