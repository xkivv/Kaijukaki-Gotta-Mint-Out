# 12 armadilhas que já custaram dias neste projeto

Todas são bugs reais que aconteceram, com a causa raiz. Vale ler antes de mexer.

**1. Tudo é UM `<script>`. Um erro de sintaxe em qualquer `src/*.js` derruba o
jogo inteiro** — tela preta, nada no DOM. Não existe isolamento de módulo. Um
`const` de mesmo nome no topo de dois arquivos é `SyntaxError` global. Caso real:
**uma crase dentro do texto de um changelog** quebrou a template string e matou o
build. *Rode `node --check` no bundle antes de entregar* (comando em `docs/01`
§3).

**2. A ordem do bundle é contrato, não estilo.** `18b-meta.js` tem que vir antes
de `22-data.js` (TDZ de `const`). `40-boot.js` tem que ser o último (o IIFE que
liga o jogo). `54-collection.js` tem que vir depois de `24-state.js` e
`31-app-market.js` (monkey-patch). No CSS, `21c-contrast` é penúltimo e
`14-mobile` é último, de propósito. Detalhes em `docs/01` §3.

**3. Canvas reaproveitado = arte errada. Foi bug real, duas vezes.** O sorteio
desenha ~13 Kaiju aleatórios no **mesmo canvas** antes de parar, e as folhas AVIF
respondem segundos depois — pintavam o Kaiju aleatório por cima do resultado.
`drawKaiju()` carimba `cv.__want = id` e o callback recusa qualquer outro
(`src/23-art.js`). **Qualquer canvas novo dentro de animação precisa da mesma
guarda**, e nunca reaproveite um canvas vivo para outro id.

**4. `tk.id` NÃO diz ordem de chegada.** A fila de mint é embaralhada. O sort
"Newest" ordenava por `tk.id` e o Kaiju recém-mintado `#412` sempre caía no fim
da página três. **Qualquer ordenação por "recente" tem que ler `seq`**, atribuído
em `ownToken()`.

**5. `G.mintOrderV` protege saves em andamento.** Um save **sem** o campo continua
no embaralhamento antigo (v1) de propósito: mudar o algoritmo da fila debaixo de
um save em andamento reescreve o futuro do jogador — e quem comprou o scanner já
viu os próximos. **O mesmo raciocínio vale para qualquer mudança futura na
geração da fila.**

**6. `getBoundingClientRect()` conta transformação de CSS.** Na virada do dia,
`#screen` fica ~1,6 s em `scaleY(.004)` (animação de desligar a TV) — e é
exatamente quando a história destrava ícone novo e chama `buildDesktop()`. A
medição devolvia 15px de altura, cabia um ícone por coluna, e a área de trabalho
virava uma fileira no topo **pelo resto da sessão**. Conserto: `deskArea()` mede
por `clientWidth`/`clientHeight` (caixa de layout, imune a transform).
**Nunca meça geometria com `getBoundingClientRect()` num elemento que pode estar
animando transform.**

**7. "Não tem modal aberto agora" ≠ "a fila de modal está vazia".** `UI.modal()`
enfileira o que não cabe e abre 170 ms depois. `showDayReport()` só olhava o
instante, então rodava `endDay()` com caixa ainda na fila; ela abria em cima do
dia novo e clicar nela **queimava um dia inteiro** — era save corrompido, não
pop-up teimoso. Relacionado: **`#modalveil` está SEMPRE no documento** — só é
modal quando tem a classe `.on`. Testar a existência dele travava a fila de
diálogo para sempre.

**8. Marcar `.out` num toast não tira do DOM na hora** — ele sai 300 ms depois.
Contar de novo dentro de um `while` **trava o navegador**. Conte uma vez.

**9. Nunca reescreva o `innerHTML` de uma janela no `refresh()`.** `UI.refresh()`
é chamado a cada ação do jogo. O feed do Kaki+ voltava para o topo no meio da
leitura. A casca é montada uma vez (`knShell`), depois o refresh só põe números
em dia e **não encosta no scroll** (`knTock`).

**10. Texto desenhado em canvas não passa por CSS e nenhuma ferramenta enxerga.**
`ctx.fillText` não tem `--fs`. Os preços do gráfico de floor e as horas do gas
tracker ficaram **meses** em 9-10px sem ninguém detectar. **Ao mexer em qualquer
canvas, procure `.font=` e confirme que o tamanho passa por `uiScale()` com piso
de 15px — 17px se for VT323.**

**11. Nome de personagem NUNCA em texto literal.** Sempre `CHARS[id].who`. Eles
já foram renomeados três vezes (`ina_lurks` → `Anonymous Wallet` → `Kiv`;
`tobi_04` → `Stux`) e cada nome hardcoded virou bug silencioso no Kaiju Log, no
changelog e no elenco do Kaki+. Detalhe relacionado: **"Bom dia!" na versão em
inglês não é erro de tradução** — a comunidade odeia gm/gn e diz *bom dia* em
português de propósito. É identidade.

**12. Nada pode vazar entre o clique em MINT e o jogador fechar o reveal.** Duas
coisas já vazaram: o NFT aparecia na carteira antes de revelar (hoje todo token
nasce `hidden=1`), e o balão de raro / toast de raça nova / level-up disparavam
junto com o mint. Hoje `doMintFlow` guarda tudo em `PENDING_REVEAL` e
`releaseHidden()` solta 210 ms depois. **Qualquer reação nova a um mint entra no
`PENDING_REVEAL`, nunca direto no `doMintFlow`.**

---

## Bônus, de teste

- **Teste no ambiente do usuário, não no seu.** O primeiro bug de arte trocada só
  aparecia com a pasta `images/` ao lado do HTML; rodando de `dist/` nunca
  reproduzia. É a lição principal registrada em
  `docs/projeto/bug-arte-trocada.md`.
- **Se o teste não reproduz o que o dono relatou, o teste está errado.** Regra
  escrita dele. Os dois furos do medidor de legibilidade foram achados
  exatamente assim.
- **PNG via `file://` contamina o canvas** — `getImageData`/`toDataURL` falham.
  Precisa de `--allow-file-access-from-files` no Chromium.
- **Fontes de verdade da metadata:** `src/18b-meta.js` (traits + `pos`). Qualquer
  `meta.json` antigo que você encontre por aí está com permutação diferente — foi
  essa mistura que gerou as folhas de arte erradas.
