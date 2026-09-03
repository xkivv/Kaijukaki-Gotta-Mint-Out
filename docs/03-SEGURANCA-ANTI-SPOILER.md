# A regra anti-spoiler — leia inteiro

**Este é o documento mais importante do pacote.**

## O problema, em uma frase

A coleção Kaijukaki tem 8888 peças desenhadas à mão e **ainda não foi mintada**.
O jogo simula a mintagem dela, com a arte real e os traits reais. Se alguém
conseguir traduzir "o Kaiju #3344 do jogo" para "o arquivo #X da coleção", o
jogo vira um oráculo do mint real e o lançamento acaba.

## Como está resolvido hoje: três independências empilhadas

### 1. Os números estão permutados

Existe uma permutação σ de `1..8888`, bijetiva. `σ(i)` = qual arquivo real
corresponde ao Kaiju que o jogo chama de `#i`.

- **`KK_META`** (`src/18b-meta.js`, 313 KB) contém traits, tier, rank e posição
  na folha de arte dos 8888 — **reais, mas reindexados por σ**. Não é metadata
  falsa: é a metadata verdadeira com os endereços trocados.
- **A arte** (`src/18a-sheets.js`, 35 folhas AVIF de 2048², tile 128px) está
  endereçada **pelo número do jogo**, via `metaOf(id).pos`.
- Resultado: dentro do jogo, arte e traits **batem entre si** — o par (arte,
  traits) é o par real. **Só o número é fictício.**

> ⚠️ O comentário em `src/24-state.js` que diz *"Kaiju #N is the actual Kaiju
> #N"* está **obsoleto e é enganoso**. Foi escrito antes do shuffle existir. Não
> confie nele.

### 2. σ não está na build pública

`src/18c-noreal.js` é literalmente `const KK_REAL=null;`. Sem σ:
- `realFileId(id)` (`src/23-art.js`) devolve o próprio `id`
- `canReadLocalArt()` devolve `false` e o jogo nem procura a pasta `images/`

**Neste pacote σ não existe em lugar nenhum.** `src/18c-real.js` é um
placeholder.

### 3. A ordem de mint do jogo é sorteada por perfil

`mintOrder()` (`src/24-state.js`) gera a fila por amostragem de chave
exponencial, com peso por raridade, semeada por `G.mintSeed` — que é sorteada em
`newGame()`. **Cada jogador tem uma fila diferente.** Duas partidas na mesma
máquina já divergem.

### Por que isso basta

O jogador chega em `G.minted = 3343` e o jogo diz que o próximo é `#5712`. Para
virar informação sobre a Scatter faltam duas coisas que não estão no arquivo: σ
(não embarcado) e a ordem real da chain (que nem o jogo nem o dono controlam).

---

## Onde já vazou, e o que foi feito

### 🔴 `dist/kk-artmap.js` — CORRIGIDO na 3.2, mas entenda o mecanismo

A build pública injeta `<script src="kk-artmap.js">` no carregamento
(`loadArtMap()`, `src/23-art.js`). É intencional: quem tem a coleção no disco
põe esse arquivo ao lado do HTML e joga com a arte de 300px. Quem só baixou o
jogo não tem o arquivo, então nada vaza.

**O furo:** se alguém servisse a pasta `dist/` inteira num servidor estático ou
num bucket, o `kk-artmap.js` estaria na mesma origem — e o próprio jogo o
carregaria sozinho, expondo σ inteiro em `window.KK_ARTMAP` para qualquer
visitante.

Na 3.2 o carregamento passou a exigir `location.protocol === 'file:'`.
Verificado servindo `dist/` por HTTP:

```
HTTP (servidor)          {"artmap":"ausente","ARTmap":"null","realFileId_1a5":[1,2,3,4,5]}
file:// (máquina do dono) {"artmap":"len 8888","ARTmap":"set","realFileId_1a5":[aaaa,bbbb,cccc,dddd,eeee]}
```
(os valores reais estão mascarados de propósito — mesmo cinco deles são
informação protegida, e um documento sobre não vazar não pode vazar)

**Mesmo assim: nunca sirva a pasta `dist/` estaticamente. Sirva só o HTML.**
A guarda é cinto de segurança, não permissão.

### 🔴 O código-fonte contém σ — por isso ele não está aqui

`src/18c-real.js`, e por tabela `dist/kaijukaki-local.html`. Mandar o repositório
cru para alguém entrega a permutação. Foi por isso que este pacote foi montado à
mão em vez de ser um `zip -r` da pasta.

---

## Checklist para o backend

Regra-mãe: **nada, em lugar nenhum, pode correlacionar um número do jogo com um
número, arquivo, imagem ou hash real.**

- [ ] **Nunca embarcar σ (`KK_REAL` / `KK_ARTMAP`) em nada que saia da máquina do
      dono** — nem build, nem API, nem variável de ambiente, nem seed de banco.
- [ ] **Não servir `dist/` estaticamente.** Sirva só o HTML.
- [ ] **Nenhuma API de metadata.** É desnecessária — o cliente já tem os 8888
      traits offline em `KK_META`. Qualquer endpoint que devolva traits indexados
      pelo id **real** reconstrói σ por comparação com o `KK_META` público.
- [ ] **Nenhum endpoint de "próximo mint", "quantos faltam do tier X",
      "distribuição da fila".** Qualquer agregado sobre a fila é um oráculo
      parcial.
- [ ] **Não sincronizar `G.mintSeed` entre jogadores.** Hoje ela é por perfil, e
      isso é uma das três independências. Uma "fila global" servida pelo backend
      derruba três para duas.
- [ ] **Nunca renderizar thumbnail de Kaiju no servidor.** Renderizar exige o par
      (id do jogo → arquivo), ou seja σ no servidor. Se a arte precisar aparecer
      numa página server-side, mande o cliente desenhar.
- [ ] **Não guardar no banco nenhum par que ligue id do jogo a artefato externo**
      — hash de imagem, CID de IPFS, URL de metadata, token id de chain. É esse
      par, e só ele, que reconstrói σ.
- [ ] **Leaderboard: número do jogo OU arte, nunca os dois.** Hoje várias telas
      mostram `#id do jogo` junto da arte, e isso é seguro **enquanto** a arte
      real não estiver publicamente associada a números reais. **No dia do reveal
      público da coleção isso muda**: qualquer pessoa poderá casar tile ↔ imagem
      oficial e recuperar σ inteiro por inspeção. Se houver vitrine hospedada,
      ela nasce sem arte, ou com plano de desligar no reveal.
- [ ] **O Kaiju Spotter é o ponto mais delicado.** Ele mostra arte e pergunta o
      trait. A regra já está implementada: a ficha usa um **número inventado**
      (`slip`, formato `NNNN-X`, em `src/52-spotter.js`), nunca o id do token. Se
      as respostas forem para um servidor, mande **o slip e o trait, nunca o id**.
- [ ] **Telemetria:** contar mints por tier ou por raça é inofensivo (a
      distribuição já está no arquivo público). Correlacionar id do jogo com
      qualquer identificador real é o vazamento.
- [ ] **Anti-spoiler é anterior a anti-cheat.** Se um dia "provar que o jogador
      não trapaceou" exigir revelar a fila, o leaderboard morre, não a regra.

---

## O que ESTE pacote contém, e por quanto tempo isso basta

Sinceridade, porque você vai perceber sozinho: **σ está protegido, a arte e os
nomes não estão.** Este pacote traz as 8888 peças em 128 px (35 folhas AVIF, em
`src/18a-sheets.js` e em `desktop/app/art/`) e o dicionário completo de traits
de uma coleção **que ainda não foi lançada** — 20 camadas, 35 raças, 548
outfits, e 90 nomes próprios de peças 1/1.

Isso é uma decisão consciente: sem a arte o jogo não roda, e o dono preferiu que
você conseguisse rodar. **Trate o pacote inteiro como confidencial** — ver
`CONFIDENCIAL.md` na raiz. Não publique a arte, não publique a lista de nomes,
não suba isto num repositório público nem num bucket aberto.

**E a proteção tem prazo.** No dia em que a coleção for revelada publicamente, σ
passa a ser recuperável a partir deste pacote sozinho, por dois caminhos:
casando tile ↔ imagem oficial, e — mais fácil ainda — casando `KK_META` ↔
metadata oficial por impressão digital de traits, que é um `JOIN`, não visão
computacional. Depois do mint isso deixa de importar, que é justamente o ponto.
Mas **não prometa a ninguém que este arquivo é seguro para sempre**: ele é
seguro *até o reveal*, que é exatamente o tempo que precisa ser.

## Como testar que você não vazou

```bash
bash build.sh
grep -c "KK_REAL=\[" dist/kaijukaki.html     # tem que ser 0
grep -c "KK_ARTMAP" dist/kaijukaki.html      # só o loader, nunca os dados
```

E no navegador, com a build isolada numa pasta limpa:
```js
typeof KK_ARTMAP        // "undefined"
ART.map                 // null
[1,2,3,4,5].map(realFileId)   // [1,2,3,4,5]  ← identidade = sem mapa
```
