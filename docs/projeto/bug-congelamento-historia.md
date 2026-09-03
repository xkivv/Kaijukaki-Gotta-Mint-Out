# O congelamento do modo história (v3.2.1)

> Documento escrito durante o desenvolvimento, para o dono do projeto. Foi
> adaptado só na forma de tratamento; o conteúdo técnico está inteiro.
> É o mais recente dos quatro — onde ele discordar de `MODO-HISTORIA.md` ou da
> seção 5 de `IMERSAO-E-PERSONAGENS.md`, **este vale**.

O relato do dono do projeto, palavras dele:

> *"kaiju wallet não aparece no dia 1, literalmente não tem o que fazer depois de
> mintar e gastar meu dinheiro, só da pra dar end day. dia seguinte também não
> aparece, ta uma merda cara."*

Reproduzido em Playwright jogando a partida inteira com cliques reais: 7 Kaiju na
carteira, nível 2, e a área de trabalho com **site, market, readme, log e
shutdown**. Nenhuma carteira. Só duas falas dispararam o jogo inteiro.

Eram **três** bugs empilhados, do mais visível pro mais profundo.

## 1. A carteira estava atrás de uma conversa

`b_wallet` destravava `hubwallet` e exigia `held()>=5`, e estava em sexto lugar
na fila de momentos do dia 1, com intervalo de 2 horas de jogo entre um e outro.
Com $40 dão ~8 mints; o dinheiro acaba por volta da hora 11 do dia 1. A conversa
nunca chegava.

**A regra que saiu disso:** a história APRESENTA as coisas, ela não decide se o
jogador pode tê-las. Existe agora uma rede de segurança em `src/58-story.js`:

```js
const SEMPRE={
  hubwallet: ()=>held()>0,
  hubmarket: ()=>held()>0,
  shutdown:  ()=>true,
  site:      ()=>true
};
```

`unlocked()` consulta essa tabela, **e** `storyTick()` aplica de verdade
(`unlock()` + `buildDesktop()`) — porque só responder "sim" em `unlocked()` não
adianta: quem desenha a mesa só roda quando algo abre, então o ícone existia na
lógica e não aparecia na tela. Esse detalhe custou uma rodada inteira de teste.

**Ao adicionar qualquer sistema novo gateado, pergunte: se esta conversa nunca
chegar, o jogador fica sem o quê?** Se a resposta for "sem nada pra fazer",
entra no `SEMPRE`.

## 2. A fila de falas congelava o motor inteiro

`storyPump()` desiste quando tem modal na tela — e tem que desistir mesmo,
ninguém quer personagem falando por cima do reveal. O problema: **quem FECHA o
modal não chamava `storyPump` de volta.** A fila ficava parada.

E como `storyTick` tratava `S.q.length>0` como "ocupado" e dava `break`, o modo
história inteiro congelava: nenhum beat novo, nenhum ícone novo, nada. Uma janela
presa e o jogo parava de progredir **pra sempre**, em silêncio.

Conserto: um vigia em `src/58-story.js`, a cada 1,5s, que chama `storyPump()` se
tem fila e não tem caixa na tela. Ele também destrava `storyBusy`, que ficava
preso se a caixa sumisse do DOM sem chamar o callback.

## 3. Avaliar não é falar — o mais fundo dos três

Enquanto alguém estava falando, o motor **nem perguntava** se tinha acontecido
mais alguma coisa: o laço dava `break` no primeiro momento maduro bloqueado.

Vários momentos usam `stMark()`, que existe justamente pra guardar uma coisa que
acontece e passa: o dinheiro acabou, a carteira encheu, a rede entupiu. Se o
momento passava com a fila ocupada, **`when()` nunca era chamado e o momento se
perdia pro resto da partida.** Era por isso que `b_broke` não disparava.

Agora `when()` roda pra TODO momento não visto, sempre. O único limite é sobre
**quem fala**:

```js
for(const b of BEATS){
  if(S.seen[b.id])continue;
  if(!b.when())continue;      // sempre avaliado: stMark precisa
  if(escolhido)continue;
  if(S.q.length)continue;     // alguem falando: ninguem interrompe
  ...cota e intervalo...
  escolhido=b;
}
```

## 4. O véu vazio (a causa por baixo do #2)

`src/25-wm.js` já tinha uma rede de segurança pro caso do véu de modal ficar
vazio e marcado como ocupado. Mas ela limpava a flag interna `modalBusy` **e não
tirava a classe `.on` do véu**.

Do lado de dentro o gerenciador achava que estava tudo livre; do lado de fora
ficava um véu ligado, invisível e vazio, para sempre. E **quem pergunta "tem
modal na tela?" pergunta pela CLASSE** (`#modalveil.on`) — o modo história, entre
outros.

**A regra: a classe é a verdade pública. Quem zera a flag zera a classe.**

## O que mais mudou junto

- **`gap` por beat.** Quando o jogador está travado (sem dinheiro, carteira
  cheia), esperar 3 horas de jogo pra alguém explicar a saída é o mesmo que não
  explicar. `b_broke` e `b_cap` têm `gap:0` e avisam na hora.
- **`b_broke` reescrito.** Dispara quando ele **não consegue mais mintar** (não
  quando chega no zero absoluto, que é tarde), desde o dia 1, e explica as duas
  saídas: vender no floor (rápido, paga **menos do que vale** — é o preço da
  pressa) ou encerrar o dia e receber a parte dos mints dos outros.
- **Cargos removidos.** "moderadora · já viu quatro coleções morrerem" embaixo do
  nome saiu da caixa de fala e da aba Gente do Kaiju Log. Palavras do dono:
  *"isso não é bom"*. Quem a pessoa é tem que sair do que ela fala.
- **A voz do Stux.** Cara de rua: minúsculo, frase curta, "bro" e "you feel me"
  no lugar de vírgula, conta caso em vez de dar aula. 32 falas reescritas.

## A ordem da abertura, hoje

| # | beat | condição | abre |
|---|---|---|---|
| 1 | `b_open` | carteira criada | site, market, shutdown, relógio |
| 2 | `b_first_mint` | 1º mint | **carteira**, tamanho da página de mint |
| 3 | `b_gas` | 1º mint | medidor de gas |
| 4 | `b_endday` | 13h ou 3 mints ou dia 2 | — |
| 5 | `b_bulk` | 2 mints | botões x2..x10 |
| 6 | `b_wallet` | 3 na mão | — (traits e rank) |
| 7 | `b_list` | 5 na mão | — (ir listar) |
| 8 | `b_market` | 6 na mão | ofertas, sweep |

## Como testar isto de novo

O teste que pegou os três vive no container de trabalho do dono e **não vem
neste pacote** — o padrão dele está descrito aqui, e é o que importa. O que ele
faz de diferente de todos os outros:

1. **Passa o assistente de carteira clicando**, não removendo o `#wizveil`.
2. **Espera o botão KEEP IT existir de verdade** antes de fechar o reveal — a
   revelação tem animação e clicar cedo não fecha nada. Fechar cedo deixa o
   reveal aberto e o teste acusa um congelamento que é dele mesmo.
3. **Fecha o level up** ("LET'S GO"). Aos 5 Kaiju o jogador sobe pra Guppy e o
   modal fica na frente de tudo.
4. **Minta até o dinheiro acabar de verdade** (`G.money < mintPrice()*saturation()+gasFee()`),
   em vez de um número fixo de mints.
5. **Depois deixa o jogo rodar parado**, sem tocar em nada — é assim que o
   relógio ocioso anda e os momentos com `gap:0` disparam.

Testar removendo o `#wizveil` e forçando estado esconde exatamente esta classe de
bug. **Se o teste não reproduz o que o dono do projeto relatou, o teste está
errado.**
