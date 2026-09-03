# Onde um servidor encosta

Para cada ponto: a função exata, o arquivo, e **o que hoje é síncrono e teria que
virar assíncrono** — que é o trabalho real.

## 1. Salvar / carregar

| função | arquivo |
|---|---|
| `save()` / `readSave()` / `load()` | `src/24-state.js` |
| `migrate(s)` | `src/24-state.js` |
| `packToken` / `unpackToken` | `src/24-state.js` |
| `exportSave()` / `importSave(code)` | `src/24-state.js` |
| `useSlot(n)` / `slotKey(n)` | `src/24-state.js` |
| `slotInfo(n)` / `showLogin()` | `src/40-boot.js` |

**Já existe um formato de wire pronto:** `exportSave()` devolve
`'KAIJU1:' + base64(JSON({kk:1, slot, ver, g}))`. Um backend de save na nuvem
pode usar exatamente esse payload sem inventar nada.

**O que vira async:**
- `save()` é `localStorage.setItem` direto, chamado dezenas de vezes por minuto
  (ver `docs/02` §4). **Fila com debounce e write-behind é obrigatório**, não
  opcional. O `desktop/preload.js` já é essa implementação — copie o padrão.
- `load()` é síncrono e roda em dois caminhos críticos: o `init()` que liga o
  jogo, e o `logOn()`. `showLogin()` também chama `slotInfo(n)` síncrono três
  vezes só para desenhar os cards dos perfis. Todo esse caminho vira `await` +
  um estado de carregando que hoje não existe.
- **Não há resolução de conflito.** Dois dispositivos escrevendo o mesmo slot se
  sobrescrevem. Precisa de versão / vector clock — não existe nada disso.

**Onde é mais barato plugar:** no desktop, a persistência **já está abstraída**
atrás da interface do `localStorage` (`desktop/preload.js` substitui
`window.localStorage` por um shim de arquivo, e o jogo não sabe). Save na nuvem
no desktop = trocar esse shim.

⚠️ **Fricção real:** a interface do `localStorage` é **síncrona por contrato** —
`getItem` tem que retornar valor, não Promise. Um shim de rede precisa de cache
local + sync em background. O write-behind já existe; falta read-through e
conflito.

❌ **No web essa camada não existe** — lá `save()` fala direto com o
`localStorage`. Se o backend for para os dois, vale criar a mesma abstração no
lado web e ter **um único ponto de troca**.

## 2. Identidade do jogador

| função | arquivo |
|---|---|
| `walletWizard(onDone)` | `src/40-boot.js` |
| `finish()` — grava a identidade | `src/40-boot.js` |
| `nickOf()` / `cleanNick()` | `src/24-state.js` |

O wizard tem 3 telas com uma decisão cada: bem-vindo → frase de recuperação →
apelido.

⚠️ **`G.seed` é uma frase de brincadeira**, tirada de uma lista fixa. Não é chave
de nada. Há uma regra explícita no projeto de que nada no jogo pode parecer uma
seed phrase de verdade (cinco palavras BIP-39 foram removidas de propósito de
`src/56-dm-lines.js`). **Não construa autenticação em cima dela.**

**Não existe identidade estável.** O "jogador" é o slot 1, 2 ou 3 do
`localStorage` daquele navegador. `cleanNick()` sanitiza mas não garante
unicidade, e nada persiste fora do navegador.

**O que vira async:** o passo 3 chama `finish()` direto. Reservar apelido no
servidor exige um estado "verificando…" e um caminho de erro (apelido tomado) que
o wizard **não tem** — e o botão X é explicitamente inescapável, de propósito.

## 3. Leaderboard

Os números estão todos em `G` — a lista, com a confiabilidade de cada um, está em
`docs/02` §8. **Leia essa seção antes de projetar qualquer ranking.**

A tela `APPS.profile` (`src/34-app-misc.js`) já agrega tudo isso. É o mockup
pronto.

**Onde enviar:** `endDay()` ou `sleepNow()` são os pontos naturais.
⚠️ Mas veja o aviso sobre reentrância da virada do dia em `docs/02` §7: **envie
fora do lock, fire-and-forget, com fila local.**

## 4. O feed social e as DMs — 100% locais

**Nada vem de rede. Tudo é gerado no cliente.**

| camada | arquivo | linhas |
|---|---|---|
| elenco e falas | `src/49-social-data.js` | 500 |
| motor do feed | `src/50-social.js` | 418 |
| UI do feed e das DMs | `src/51-app-social.js` | 991 |
| motor das DMs | `src/55-dm.js` | 566 |
| frases das DMs | `src/56-dm-lines.js` | 1245 |
| eco público | `src/57-dm-echo.js` | 537 |

`feedTick()` escolhe o **autor** primeiro, a personalidade dele decide o assunto,
e a frase sai de um pool com anti-repetição (`S.said`, teto 70). As DMs escolhem
a resposta pelo par (tipo da mensagem × tom) — foi assim que o problema de
"respostas incoerentes" foi resolvido. `57-dm-echo.js` faz o que você conversa na
DM virar fofoca no feed, com **atraso deliberado de horas**.

⚠️ O conteúdo de `49-social-data.js` **não passa por `t()`** — é bilíngue direto
no objeto (`{en, pt}`), porque o mapa PT é lookup exato de string.

**Onde é mais barato plugar um feed de servidor:** a UI **já** está separada em
"casca montada uma vez" (`knShell`) e "só atualiza números, não encosta no
scroll" (`knTock`) — `src/51-app-social.js`. Essa separação existe porque
`UI.refresh()` é chamado a cada ação do jogo e reescrever o `innerHTML` jogava o
feed de volta pro topo no meio da leitura. **Respeite essa separação.**

## 5. A mintagem

| função | arquivo |
|---|---|
| `doMint(qty)` — o núcleo | `src/24-state.js` |
| `doMintFlow(q, btn, chained)` — a UI | `src/30-app-site.js` |
| `PENDING_REVEAL` / `releaseHidden()` | `src/30-app-site.js` |
| `idAtMintIndex(k)` | `src/24-state.js` |

`doMint` é **inteiramente síncrona e transacional num tick**: valida saldo →
`spend(cost)` → cria os tokens → `G.minted++` → `ownToken()` → log/quest/hype →
`stuxGift()` → retorna `{made, cost, free}` ou `{err:'money'|'full'}`.

**O que vira async** ao virar "reservar no servidor → confirmar → revelar":
- o retorno de `doMint` — os chamadores usam o objeto **imediatamente**
- `G.minted` deixa de ser autoridade local
- **`PENDING_REVEAL` já é o lugar certo para pendurar a espera.** Ele existe
  exatamente porque nada pode vazar entre o clique em MINT e o jogador fechar o
  reveal. Qualquer latência de rede tem que caber ali dentro, com o timeout
  mostrando erro **sem revelar nada**.

⚠️ Ver `docs/05` item 12 — dois vazamentos já aconteceram nesse caminho.

## 6. O Kaiju Spotter

`src/52-spotter.js`. Perguntas geradas de forma determinística por
`mulberry(hash32('kakispot|'+mintSeed+'|'+day))`, 3 a 8 fichas por dia conforme o
rank, com três distratores reais do mesmo trait. Estado em `G.spot`.

É o candidato mais óbvio a virar coisa de servidor (o pitch ficcional é
"catalogação colaborativa") e **simultaneamente o mais perigoso** — ver a
checklist em `docs/03`. Se as respostas forem para um servidor, mande **o `slip`
(número inventado) e o trait, nunca o `id` do token**.

## 7. A superfície de trapaça — testado, não suposto

**Resumo: total. Não existe nenhuma defesa.**

Testes executados no Chromium, com a build isolada:

| tentativa | resultado |
|---|---|
| `G.money = 1e9; save()` + reload | ✅ funciona, persiste |
| `G.level=10; G.bestLevel=10; G.peakHeld=9000` | ✅ HUD mostra rank "Big Whale" |
| `for(i<40) ownToken(buildToken(idAtMintIndex(i),1))` | ✅ 40 Kaiju de graça, **e dá pra escolher os ids** (filtrar `metaOf(id).rarity===5` = só Mythic) |
| `G.mintSeed=12345; MINT_ORDER=null; idAtMintIndex(0)` | ✅ **refaz a fila inteira** — dá pra fazer brute-force de sementes até achar uma com Mythic nos primeiros mints |
| `exportSave()` | ✅ devolve o save inteiro em base64 |

**O vetor mais fácil nem precisa de console:** `importSave()` faz `atob` +
`JSON.parse` + `migrate`, sem assinatura. Edite o JSON, re-encode, cole no
diálogo "Import save".

### No Electron — o mecanismo exato (conferido em `desktop/main.js` e `desktop/preload.js`)

O que `main.js` realmente declara em `webPreferences`:

```js
contextIsolation: false,
nodeIntegration:  false,
sandbox:          false,
```

**Correção de um erro que este documento carregava:** com `nodeIntegration:false`
a página **não** ganha `require`. Medido no Electron 32 com este mesmo `main.js`
e `preload.js`, avaliando no renderer depois do jogo carregar:

| expressão na página | resultado |
|---|---|
| `typeof require` | `undefined` |
| `typeof process` | `undefined` |
| `typeof module` | `undefined` |
| `require('fs')` | `ReferenceError: require is not defined` |
| `typeof window.KK_SAVE_DIR` | `string` (caminho absoluto da pasta de saves) |
| `window.localStorage.getItem` é nativo? | **não** — é o shim do preload |

Quem tem Node é o **preload**, e só durante a execução dele: o Electron remove os
globais de Node do `window` antes de os scripts da página rodarem.

O que `contextIsolation:false` de fato causa é outra coisa, e continua sendo um
problema: **preload e página dividem o mesmo mundo de JavaScript.** Não há
fronteira entre os dois. Na prática isso significa:

- **Tudo o que o preload deixa em `window` é da página.** Ele deixa duas coisas:
  - `window.localStorage` **substituído** por um shim que lê e escreve
    `<userData>/saves/save.json` de verdade. `setItem` da página vira gravação em
    disco (com debounce de 400 ms). O conteúdo é escolhido pela página, o caminho
    não.
  - `window.KK_SAVE_DIR` — o **caminho absoluto** da pasta de saves, entregue de
    graça a qualquer script que rodar ali.
- **Sem isolamento, o shim é adulterável — confirmado.** Da página,
  `window.localStorage.getItem = <embrulho>` funciona: dá para interceptar e
  reescrever tudo o que entra e sai do save em disco. Código injetado também
  pode trocar `window.localStorage` inteiro ou chegar nas closures do preload
  por poluição de protótipo. Com `contextIsolation:true` isso ficaria do outro
  lado da fronteira.
- **`sandbox:false`** tira o sandbox de SO do processo renderer. Uma falha de
  execução remota no Chromium não fica contida no processo — e é justamente o
  `sandbox:false` que permite ao preload usar `require` com `nodeIntegration`
  desligado.
- **F12 abre o DevTools** (habilitado de propósito em `before-input-event`), o
  que dá console livre sobre esse mesmo mundo.

O que **não** é verdade hoje: a página não tem `fs`, não tem `child_process`, não
lê nem escreve arquivo arbitrário. O alcance real é o save, o caminho dele, e a
ausência de contenção.

🔴 **Isso continua sendo o primeiro item a mudar quando entrar servidor.** Hoje é
aceitável porque nada carrega de rede: sem conteúdo remoto, não há de onde vir a
injeção. No momento em que o app buscar dados de um servidor, qualquer injeção
passa a rodar **no mesmo mundo do preload**, com o shim de disco e o caminho de
save à mão, num processo sem sandbox de SO. A ordem de correção é
`contextIsolation:true` → `sandbox:true`, e trocar isso exige repensar a
substituição do `localStorage` — provavelmente `contextBridge` expondo uma API
assíncrona, e o jogo passando a chamar `KK.save()` em vez de `localStorage`.
Isso é um refactor real em `src/24-state.js`.

### Os três caminhos realistas, em ordem de custo

1. **Vitrine, não competição.** Leaderboard explicitamente não verificado — "o
   que as pessoas dizem que fizeram" — sem prêmio. Custo baixo, honesto.
2. **Replay verificado.** O cliente manda a semente + o log de ações; o servidor
   roda a mesma simulação e confere. Viável **porque quase tudo já é
   determinístico por seed**, mas exige (a) trocar os 4 helpers de
   `src/20-util.js` por um PRNG semeado com contador persistido, e (b) extrair a
   lógica de `24-state.js` para um módulo que rode em Node — hoje ela está
   entrelaçada com `UI.*` e `SFX.*`.
3. **Servidor autoritativo** sobre a economia inteira (mint, gas, mercado,
   imposto, staking). Isso é reescrever o jogo, não plugar um backend.

Ofuscação e checksum no save encarecem e não resolvem: o bundle é um `<script>`
legível de ~19 mil linhas, sem minificação.
