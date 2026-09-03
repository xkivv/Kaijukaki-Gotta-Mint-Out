# Imersão e personagens — regras que não se quebram

> Documento escrito durante o desenvolvimento, para o dono do projeto. Foi
> adaptado só na forma de tratamento; o conteúdo técnico está inteiro.
>
> Nota de leitura: o personagem `ina` **se chama Kiv na tela** — é o apelido do
> dono do projeto usado como nome de personagem. Onde este documento diz "o dono
> do projeto" está falando da pessoa; onde diz **Kiv** em negrito numa tabela de
> personagem, está falando do nome que aparece no jogo.

Entrou na v3.2, a partir de um feedback do dono do projeto que vale pro jogo
inteiro.

## 1. Ninguém entra no PC do jogador

Palavras dele: *"como ele tem acesso ao meu pc? isso deveria ser uma espécie de
'mensagem' que eu recebo (...) é pra ser 1000000% imersivo o jogo. então não faz
sentido ele criar coisas no meu PC."*

O jogo é a máquina **do jogador**. Nenhum personagem escreve arquivo, cria ícone,
liga painel ou abre aba na máquina do jogador. Eles **contam o que existe** e o
jogador vai lá.

| ❌ nunca | ✅ sempre |
|---|---|
| "deixei um readme na sua área de trabalho" | "tem um readme.txt nessa área de trabalho, já tava aí antes de você chegar" |
| "preguei o medidor aí pra você" | "tem um medidor de gas que dá pra pregar aí — põe ele" |
| "tá na sua área de trabalho agora" | "tá no servidor da kakizone, vai lá pegar" |
| "aquela aba abriu agora" | "o fórum tem uma aba pra isso" |
| "filtro e ordenação estão ligados" | "a carteira tem filtro e ordenação. usa" |

O destravamento continua igual — o que muda é a **ficção**. Um beat que abre um
ícone descreve uma coisa que sempre esteve na máquina e que o jogador só agora
tem motivo de olhar.

- `readme.txt` nasce na mesa desde o primeiro segundo, fora do `unlocked()`
  (`iconLive()` em `40-boot.js`), e não ganha selo NOVO no dia 1.
- A mesa é do jogador: **botão direito > Apps** liga e desliga cada ícone;
  `pref('iconHide')` guarda a escolha e sobrevive ao reload. **Oculto não é
  travado** — o menu Iniciar continua abrindo tudo.

Ao escrever qualquer fala nova, faça a pergunta: *essa pessoa acabou de mexer no
computador dele?* Se sim, reescreva.

## 2. Os personagens

| id no código | nome na tela | papel |
|---|---|---|
| `ina` | **Kiv** | guia principal. A primeira fala do jogo abre com **"Bom dia!"** |
| `oni` | oni_of_the_floor | preço, floor, listagem, rank, reputação |
| `tobi` | **Stux** | gas, golpe, a decisão cara. **Dá freemint de presente** |
| `hakase` | hakase | cofre, ofertas grandes, endgame |
| `sera` | sera_ok | quando o jogo machuca — nunca antes |
| `kaiju` | Mr. Kaiju | quer dinheiro. nunca amigável |

**Nunca escreva o nome de um personagem em texto, em lugar nenhum.** Sempre
`CHARS[id].who`. Eles já foram renomeados três vezes (`ina_lurks` → `Anonymous
Wallet` → `Kiv`; `tobi_04` → `Stux`) e cada nome hardcoded vira um bug silencioso
no Kaiju Log, no changelog e no elenco do Kaki+ (`49-social-data.js`).

**"Bom dia!"** não é erro de tradução na versão em inglês: a comunidade odeia
gm/gn e diz *bom dia* em português. Isso é identidade, não descuido.

## 3. O presente do Stux

`stuxGift()` em `src/58-story.js`, chamado no fim de `doMint()` (`24-state.js`).

- **7%** de chance por mint (`STUX_CHANCE`)
- mínimo **4 dias** entre um presente e outro (`STUX_GAP_D`)
- só depois de o jogador **conhecer o Stux** (`G.story.seen.b_gas`)
- **nunca** com a carteira cheia — o presente não pode empurrar ninguém pro teto
- ele paga o mint **e** o gas; o jogador não gasta nada
- cai uma fala avulsa dele na caixa de diálogo ("this one is on me bro. have fun.")

É a única coisa no jogo inteiro que acontece a favor do jogador sem ele ter feito
por merecer. Por isso é rara: se cair toda hora vira torneira e para de
significar alguma coisa. **Não aumente a chance sem o dono do projeto pedir.**

Ele usa a **fala avulsa** (`storySay(line)`), um caminho novo na fila do modo
história: `S.q` aceita `{one: line}` além de `{id, i}`. Mesma caixa, mesma fila,
mesmo respeito por modal aberto. Use isso pra qualquer coisa que acontece AGORA
e não é um momento da lista.

## 4. Bugs desta rodada — a causa raiz, pra não voltar

**Ícones pulando pro topo da tela na horizontal.** `defaultIconPos()` media a
tela com `UI.bounds()`, que é `getBoundingClientRect()` — e isso **conta
transformações de CSS**. Durante a animação de desligar a TV na virada do dia
(`.crtoff`, `scaleY(.004)`) a tela media ~15px de altura, cabia um ícone por
coluna, e a mesa virava uma fileira que ficava assim pro resto da sessão.
Conserto: `deskArea()` mede por `#desktop.clientWidth/clientHeight` (caixa de
layout, imune a transform), com guarda pra área absurda.
**Lição: nunca meça geometria com `getBoundingClientRect()` num elemento que
pode estar no meio de uma animação de transform.**

**A caixa de fim de dia sobrevivendo pro dia seguinte.** `UI.modal()` enfileira o
que não cabe (`mQueue`) e abre 170ms depois de a anterior fechar.
`showDayReport()` só olhava se havia caixa aberta **naquele instante**, então
rodava `endDay()` com uma caixa ainda na fila; ela abria depois, em cima do dia
novo, e clicar nela queimava um dia inteiro (`endDay()` de novo). Era save
corrompido, não só um pop-up teimoso.
Conserto: a espera exige tela limpa por **dois quadros seguidos** (>170ms), com
teto de 4s por relógio e teto duro de 12s, e `dayTransition()` virou no-op de
verdade quando repetido.
**Lição: "não tem modal aberto agora" não é o mesmo que "a fila de modal está
vazia".**

## 5. Ritmo do tutorial (estado atual)

Duas filas com cotas independentes (detalhe em `MODO-HISTORIA.md`):

```js
const STORY_DAY_CAP=2, STORY_DAY1_CAP=0, STORY_GAP_H=3;
const STORY_CORE_CAP=3, STORY_CORE_CAP1=6, STORY_CORE_GAP=2;
```

Dia 1 é **só tutorial** (cota comum = 0), na ordem:
`b_open` → `b_first_mint` (o aviso do gas) → `b_gas` → `b_endday` → `b_bulk` →
`b_wallet`.

`b_wallet` dispara com **5 na mão**, é `core` **e** `urg` (fura a cota do dia,
nunca o intervalo), e é ele quem entrega o ícone da carteira. A carteira **não**
existe no dia 1: um ícone que só mostra vazio ensina errado.

⚠️ **Esta seção 5 foi revista na v3.2.1.** Justamente prender a carteira atrás
de `b_wallet` causou o congelamento descrito em
`bug-congelamento-historia.md` — hoje a carteira está na rede de segurança
`SEMPRE` e `b_first_mint` é quem a apresenta. Leia aquele documento antes de
mexer no ritmo.
