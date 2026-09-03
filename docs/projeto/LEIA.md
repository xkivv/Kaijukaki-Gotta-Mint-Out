# Documentos do projeto

Estes foram escritos ao longo do desenvolvimento, para o dono do projeto. Estão
aqui porque explicam **por que** o jogo é do jeito que é — coisa que não se
descobre lendo o código. Foram adaptados só na forma de tratamento; o conteúdo
técnico está inteiro.

## O que existe nesta pasta

| arquivo | estado |
|---|---|
| `LEIA.md` | este índice. |
| `REGRAS-DO-PROJETO.md` | **atual.** Legibilidade, anti-spoiler, camadas de tela, economia. É a leitura obrigatória das quatro. |
| `MODO-HISTORIA.md` | **em parte histórico (v3.1).** O motor, `unlocked()`, as duas filas de cota e como somar um sistema novo continuam valendo. A tabela de abertura e os nomes de personagem envelheceram — ver os dois abaixo. |
| `IMERSAO-E-PERSONAGENS.md` | **atual (v3.2)**, com uma ressalva: a seção 5 (ritmo do tutorial) foi revista na v3.2.1. Os nomes de tela e a regra "ninguém entra no PC do jogador" valem. |
| `bug-congelamento-historia.md` | **atual (v3.2.1).** O bug que travava o jogo inteiro. Traz a ordem de abertura válida hoje e a rede de segurança `SEMPRE`. |
| `bug-arte-trocada.md` | **atual.** Os dois bugs de arte trocada e a causa real de cada um. Leia antes de mexer em `src/23-art.js`. |

**A ordem de leitura sugerida:** `REGRAS-DO-PROJETO.md` →
`bug-congelamento-historia.md` → `IMERSAO-E-PERSONAGENS.md` →
`MODO-HISTORIA.md` → `bug-arte-trocada.md`.

**Quando dois documentos discordarem, o mais novo ganha.** A ordem cronológica é
`bug-arte-trocada` → `REGRAS-DO-PROJETO` → `MODO-HISTORIA` →
`IMERSAO-E-PERSONAGENS` → `bug-congelamento-historia`.

## Dois documentos que NÃO vieram

`GDD.md` (o game design document original) e `metadata-integration.md` existem no
projeto Claude do dono e **foram deixados de fora de propósito**: são históricos
e estão parcialmente errados. Se você quiser lê-los mesmo assim, **peça ao
dono** — mas leia antes o que segue, porque é exatamente o que neles está velho.

**`metadata-integration.md`** descreve um *atlas único* e arquivos
`18a-atlas.js` / `18a-noatlas.js`, com tamanhos de ~600 KB e ~13 MB. Hoje são
**35 folhas** e três slots (`18a-sheets` / `18a-nosheets` / `18a-files`) — ver
`docs/01-ARQUITETURA.md` §1, "Os três alvos". A parte sobre metadata, raridade e
a regra do reveal continua válida. A menção a Fisher-Yates também envelheceu:
virou amostragem enviesada por raridade em `MINT_ORDER_V=2`.

**`GDD.md`** é o design original e tem uma frase perigosa: *"metaOf(id) gera os
traits a partir do ID com RNG semeado"*. **Isso não é mais verdade** — hoje
`metaOf` lê o metadata real da coleção, reindexado pela permutação. As
"Pendências" no fim já foram feitas.

O comentário em `src/24-state.js` que diz *"Kaiju #N is the actual Kaiju #N"*
tem o mesmo problema: foi escrito antes do embaralhamento existir. **Não confie
nele.** A fonte de verdade sobre isso é `docs/03-SEGURANCA-ANTI-SPOILER.md`.

## Outros documentos

Existem mais documentos no projeto Claude do dono (mobile, planos de feature,
notas de rodada) que não entraram neste pacote por não serem necessários para
trabalhar no código. **Peça se precisar.**
