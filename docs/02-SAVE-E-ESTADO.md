# Save, estado e persistência

Os números aqui foram **medidos** (Chromium headless serializando com o próprio
`save()` do jogo), não estimados — **com uma exceção explicitamente marcada como
estimativa** na tabela da §3. Tamanho de save depende do id, do dia e do apelido,
então os valores marcados com `≈` vêm com a medição que os produziu.

## 1. O objeto `G`

`let G = null` — `src/24-state.js`. **Uma variável global solta.** Não há classe,
não há schema, não há validação de tipo além do `migrate()`.

- `newGame()` cria **91 campos de primeiro nível**
- `migrate(s)` = `Object.assign(newGame(), s||{})` + ~110 linhas de saneamento.
  **Todo save passa por aqui**, inclusive save novo (`G=migrate(null)` no boot)
- Um save vivo chega a 99-100 campos (alguns nascem em runtime)

### Grupos

| grupo | campos |
|---|---|
| **tempo** | `day`, `hour` (0-34, não 0-23!), `min`, `warned`, `overWarned` |
| **dinheiro** | `money`, `best`, `hype`, `taxPeriodNet`, `taxDue`, `taxRows`, `lastTaxDay`, `lastAuditDay`, `per`, `feeCut`, `stipend`, `chainLoad`, `scamLoss` |
| **coleção** | `tokens`, `seq`, `minted`, `myMinted`, `npcMinted`, `mintout`, `mintLog` (≤24), `binder` (≤60 páginas × 15 slots) |
| **mercado** | `mkt`, `offers`, `cbids`, `event`, `eventRace`, `heat`, `shills` |
| **gráficos** | `curCandle`, `icandles` (≤72), `candles` (≤60), `hist` (≤40), `priceHist` (≤30), `volH`/`volCur`/`volTot`/`volSeed` |
| **progressão** | `level`, `bestLevel`, `peakHeld`, `up`, `contract`, `gasLv`, `bulk`, `listLv`, `capLv`, `stakeOn`, `stakeSlotLv`, `xp` |
| **social** | `social` (o maior campo do save), `rep`, `feed` (≤8), `mailbox` (≤40), `mailRead`, `netSeen` |
| **história** | `story`, `quests`, `spot`, `achv`, `achvBig`/`achvVault`/`achvStorm`, `goals`, `seenRaces`, `seenIntro` |
| **segurança** | `secUntil`, `lastHack`, `scamsToday`, `lastScamAt`, `dropShield`, `dirtyMoney`, `spamDay` |
| **identidade** | `nick` (≤16, `[a-z0-9]`), `seed` (frase **cosmética**), `walletMade`, `refCode` |
| **sementes** | `gasSeed`, `mintSeed`, `mintOrderV` |
| **preferências** | `prefs` — 45 chaves em `PREF_DEF` (`src/24a-prefs.js`), 693 bytes constantes |

`G.social` é normalizado em `soc()` (`src/50-social.js`):
`{posts (≤48), threads (≤20), trust, clubs, said (≤70), votes, popsToday, lastPopAt, unread, tips, tipsToday, act}`.

⚠️ **`hour` vai até 31, não 23.** `dayEndHour()` = `26 + (has('coffee') ? 5 : 0)`.
O clamp em `migrate` permite 0-34 por causa disso.

⚠️ **Lixo de UI que vaza pro save:** `_mkAcc`, `_lastMinted`, `_lastPct`. São
estado de animação que acaba persistido porque `save()` copia `G` inteiro.
Inofensivos — um servidor deve ignorá-los.

## 2. O token — só 6 números precisam persistir

`buildToken(id, day, fresh)` produz um objeto de **≈287 bytes**, e `packToken()`
reduz para **17 bytes**, um array de 6 posições:

> Medido com `buildToken(1234, 1, false)`: 287 B como objeto,
> `[1234,0,-1,1,0,0]` = 17 B empacotado. **O tamanho depende do id e do dia**,
> porque os traits têm nomes de comprimentos diferentes e o dia entra como
> dígitos: numa amostra de 400 ids o objeto vai de **147 a 366 B** (mediana 280)
> e o pacote de **14 a 17 B** (mediana 16,9). A ordem de grandeza — ~17 vezes
> menor — é que é o ponto.

```js
[ id, staked?1:0, listed==null?-1:listed, day, seq, stakedDay ]
```

| # | campo | significado |
|---|---|---|
| 0 | `id` | qual Kaiju (1..8888) |
| 1 | `staked` | trancado no cofre |
| 2 | `listed` | preço listado (`-1` = null) |
| 3 | `day` | dia em que entrou na carteira |
| 4 | `seq` | **ordem de chegada** — é isto, e só isto, que o filtro "Newest" usa |
| 5 | `stakedDay` | dia em que foi trancado (trava de 10 dias) |

**Tudo o resto é derivado do `id` via `metaOf(id)`, que lê `KK_META`:** os traits
(20 camadas possíveis), a raridade (0-5) e o rank. Um servidor guarda 6 números
por Kaiju e deriva o resto — **desde que tenha a mesma cópia de `KK_META`**.

⚠️ Se `KK_META` mudar (reordenação, renomeação), todos os traits derivados mudam
retroativamente. E note que `renameTraits()` (`src/22-data.js`) troca
`Special→Secret` e `Reserve→Reserved` **em memória, depois de carregado** — é
camada de apresentação, o servidor não deve replicar isso cegamente.

## 3. Tamanho medido

| cenário | bytes | tokens |
|---|---|---|
| dia 1, carteira recém-criada | **≈2.114** | 0 |
| fim do dia 1 | 8.471 | 9 |
| fim do dia 10 | 36.337 | 30 |
| fim do dia 30 | **43.969** | 106 |
| extremo: mintout, carteira com 7.288 Kaiju | **~196.000 (estimativa)** | 7.288 |

⚠️ **Duas ressalvas nesta tabela.**

**`dia 1` remedido:** deu **2.114 B** com apelido de 3 letras
(`migrate(null)` + `walletMade` + `save()`, cinco repetições: 2.113–2.114). O
apelido é o que mais mexe: 2.111 B com 1 letra, 2.125 B com 14. O valor antigo
(2.194) não foi reproduzido em nenhuma configuração e é de uma versão anterior.

**A linha do mintout é estimativa, não medição.** Reproduzir um save de mintout
de verdade exige jogar centenas de dias, e forçar o estado no console produz um
save com `social`, `icandles` e `candles` vazios — o que mede o piso, não o
caso. O que **foi** medido: os 7.288 tokens empacotados sozinhos ocupam
**135.179 B**, e um save de teste carregando esses tokens sobre um estado pouco
povoado deu **141.566 B**. Somando a esses tokens o resto de um save maduro de
dia 30 (~42 KB fora dos tokens) chega-se à ordem dos 180–200 KB. **Trate o
número como ordem de grandeza**; o que importa para dimensionamento é que o
save de pior caso fica na casa das centenas de KB, não dos MB.

Composição de um save de dia 30: `social` 39%, `icandles` 18%, `hist` 13%,
`candles` 7%, `mkt` 3%, `prefs` 2%, tokens ~4%.

**O save não cresce sem limite** — quase tudo é lista com teto rígido. O único
termo linear é `tokens`: **≈18 B por Kaiju** numa carteira grande. Medido pelo
crescimento do JSON sobre o mesmo `G`: **16,6 B/Kaiju** com 100 tokens,
**17,6 B** com 1.000 e **18,6 B** com 7.288 (cresce porque ids e dias maiores
gastam mais dígitos).

`exportSave()` embrulha em base64 → ×1,33.

## 4. Persistência

**Só `localStorage`. Zero sessionStorage, zero IndexedDB, zero rede.**

| chave | conteúdo |
|---|---|
| `kaijukaki_slot_1` / `_2` / `_3` | o save do perfil, JSON puro |
| `kaijukaki_slot_N_bak` | cópia trocada **uma vez por dia de jogo** |
| `kaijukaki_os_v1` | **chave morta**, legado. Nada escreve nela |

Pior caso: 6 blobs disputando a cota de ~5 MB do domínio.

**Sem compressão. Sem serialização custom além do `packToken`. JSON puro.**

`save()`: `Object.assign({}, G, {tv:3, tokens: G.tokens.map(packToken)})` →
`JSON.stringify` → `setItem`. Envolvido em `try/catch`: em `QuotaExceededError`
mostra um toast **uma vez** e **segue jogando só com o estado em memória**.

`load()`: tenta a chave principal; se `JSON.parse` explodir ou `tokens` não for
array, cai no `_bak` e avisa. Se os dois falharem, jogo novo.

⚠️ Deletar perfil (`removeItem`) e `wipe()` **não removem o `_bak`** — fica órfão.

### Frequência de escrita — o número que importa

**Com a aba aberta e parada, o save inteiro é escrito a cada 4,5 segundos.**

- `startClock()` (`src/26-flow.js`): `setInterval(..., IDLE_TICK_MS=4500)` →
  `timeAct(2)` → `advance` + `save()`
- `timeAct()` é chamado por **toda ação do jogador** (mintar, listar, vender,
  comprar, upgrade)
- mais um `setInterval(...,20000)` em `src/40-boot.js`
- mais `pagehide`, `beforeunload`, `visibilitychange`

Com um save de 200 KB isso é ~44 KB/s de escrita síncrona no thread principal.
**Um save remoto precisa obrigatoriamente de fila com debounce e write-behind.**
O `desktop/preload.js` já implementa exatamente esse padrão (400 ms, temp+rename,
backup) — copie ele.

## 5. Versionamento de schema: NÃO EXISTE

Esta é a informação mais importante deste documento.

- **`tv:3` é escrito no save e NUNCA é lido.** Não existe `if (o.tv < 3)` em
  lugar nenhum do código. É um número decorativo.
- `GAME_VERSION` ('3.2.1', em `src/44-app-inbox.js`) entra no `exportSave()` e
  **não é conferido no import**.
- Não existe `schemaVersion`, nem lista de migrações versionadas.
- Os únicos dois números de versão realmente **lidos** são de subsistema:
  `G.mintOrderV` (1 ou 2) e `G.story.v` (1).

A compatibilidade é conquistada por **defensividade total** dentro de
`migrate()`: `Object.assign(newGame(), s)` faz campo novo nascer com default
automaticamente, e depois ~55 linhas de `Array.isArray(x)?x:[]`, `+x||0`,
`clamp(...)`. `migrate()` é idempotente e roda por inteiro em todo save, sempre.

**Consequência: não dá para saber a idade de um save olhando o save.**

⚠️ **O formato de token é assumido incondicionalmente.** Um save gravado por uma
build futura com 7 posições seria lido e o 7º campo descartado em silêncio. Um
save antigo com token como objeto daria `metaOf(undefined)` → token inválido →
filtrado no `migrate` → **perda silenciosa da carteira inteira**.

> **Passo zero de qualquer trabalho de servidor:** adotar `tv` (ou um novo
> `schemaVersion`) como campo **lido**, e carimbar todo save existente como
> versão 3. Sem isso não há como escrever migração server-side segura nem
> detectar um save adulterado por formato.

### O que o `migrate()` já faz (e você não precisa refazer)

Conversões de mecânica antiga → nova, com deleção do campo velho
(`up.bulk5/10/25/100` → `bulk`, `up.gas1/2` → `gasLv`, `up.cap1..5` → `capLv`);
reconstrução de `peakHeld` e de `seq`; saneamento referencial (binder perde slots
inválidos, `mkt` perde listagens de tokens que você possui, tokens fora de
1..8888 são descartados); semeadura de PRNG faltante; e `prefsAdopt()`, que migra
os antigos campos soltos (`g.ui`, `g.lang`, `g.iconPos`…) para dentro de
`G.prefs` **e apaga os originais**, para não haver duas verdades.

## 6. Aleatoriedade — o que dá e o que não dá para re-simular

Duas fontes: **`Math.random()` puro (49 chamadas em 15 arquivos)** e
**`mulberry(seed)`**, um PRNG determinístico de 32 bits (`src/20-util.js`).

### Determinístico (um servidor consegue reproduzir)

| sistema | semente |
|---|---|
| **ordem de mint** — qual id sai no k-ésimo mint | `G.mintSeed` + `G.mintOrderV` |
| onda e picos de gas do dia | `G.gasSeed ^ (day * const)` |
| turno do Kaiju Spotter | `hash32('kakispot\|'+mintSeed+'\|'+day)` |
| sorteio do Kakizone | `hash32('kakipull\|'+mintSeed+'\|'+day)` |
| dono fictício de um id | `hash32('holder\|'+id+'\|'+mintSeed)` |
| traits/raridade/rank | não é aleatório — é `KK_META` |

**O reveal do mint é 100% determinístico.** Dado `mintSeed`, `mintOrderV` e
`minted`, dá para reproduzir exatamente qual Kaiju sai.

### NÃO determinístico (`Math.random()` direto)

Mercado secundário (qual id aparece, o multiplicador de preço, se some, se
vende), ofertas (qual token, o valor, o ttl, se é lowball), golpes (se aparece,
qual, quanto leva, quais Kaiju leva), o clima do dia, as missões diárias, o feed
social, os lances na coleção, o `sweepFloor`. E `gasSeed`/`mintSeed`/`refCode`
nascem de `Math.random()` — sem CSPRNG.

**Um leaderboard baseado em re-simulação é impossível hoje.**

**A boa notícia:** a maioria dos 49 usos passa por **quatro helpers centralizados
em `src/20-util.js`** — `ri`, `rf`, `pick`, `chance`. Trocá-los por um PRNG único
semeado, com o contador de chamadas persistido no save, é uma mudança cirúrgica
que cabe num arquivo.

## 7. Tempo

**O estado não guarda nenhum timestamp.** Não existe progresso offline: fechar a
aba e voltar em três dias não avança nada. Isso é ótimo para o servidor.

Mas há **três** pontos onde o relógio real alimenta mutação de estado:

1. **`startClock()`** (`src/26-flow.js`) — a cada 4,5 s reais, 2 minutos de jogo
   passam sozinhos. **Taxa de câmbio implícita: 1 h de jogo ≈ 135 s reais
   parado.** O mercado anda, o gas oscila, os NPCs mintam.
2. **`mkLiveTick()`** (`src/31-app-market.js`, `setInterval` 900 ms) — **o mais
   perigoso.** Usa `dt` de `Date.now()` real e efetivamente **remove listagens de
   `G.mkt` e cria novas**. Só roda com a aba de mercado aberta e visível.
   Portanto **o conteúdo de `G.mkt` depende de quanto tempo real o jogador deixou
   a janela do mercado aberta.** Um servidor não tem como reconstruir isso.
3. **`G.playMs`** — o único campo medido em ms reais.

Todo o resto de `Date.now()` é cosmético (throttle de duplo clique, anti-spam de
erro, animações) e não toca `G`.

### A virada do dia — `endDay()`

Ordem exata: consolida candles → empurra `log` em `hist` → penalidade de spam de
listagem → `heatTick` + `socialEndDay` + `checkAchievements` + `rollQuests` →
conquistas → **staking paga aqui, uma vez por dia** → `day++`, `hour=8` → fadiga
de hype atravessa o dia (×0,30) → zera `log` → sorteia o clima de amanhã →
mesada + decaimento de hype (×0,94, piso 1,2) → `freeMints++` → hack noturno → a
cada 3 dias, gera a fatura do Mr. Kaiju.

⚠️ **A virada do dia tem histórico de bug de reentrância** (`dayLock`,
`reportBusy`, `outroBusy`, e até uma rede de segurança em `setInterval`). Enfiar
um `await` de rede nesse caminho é exatamente o tipo de mudança que faz voltar o
bug de "encerrou dois dias de uma vez / save corrompido". **Envie fora do lock,
fire-and-forget, com fila local.**

## 8. Os números que um leaderboard usaria

| campo | confiável? |
|---|---|
| `G.bestLevel` | **monotônico por construção** (`Math.max(novo, anterior)`). O mais estável — mas é derivado, não fonte |
| `G.peakHeld` | monotônico, **com um furo**: o `migrate` faz `max(peakHeld, tokens.length, LEVELS[bestLevel-1].req)` — um `bestLevel` inflado **eleva `peakHeld` retroativamente** |
| `G.minted` | **não é métrica do jogador** — é o supply global (você + NPCs). Quem você mintou está em `G.myMinted`. E `stuxGift()` incrementa `G.minted` **sem** passar por `doMint`, então os contadores divergem legitimamente |
| `G.money` | ponto de escrita único (`earn`/`spend`), mas é saldo instantâneo. `G.best` é o pico e **é monotônico** |
| `G.totals.*` | monotônicos, mas **os pontos de escrita estão espalhados por 6 arquivos** — `totals.sold` sozinho tem 6 lugares. Qualquer caminho de venda novo que esqueça de somar cria divergência silenciosa |
| `G.playMs` | conta 5.000 ms por tick sem verificar drift; aba escondida não conta. Aproximação |

### Por que nenhum é confiável hoje

1. **O save é texto puro editável.** `localStorage` sem assinatura, sem hash,
   sem ofuscação.
2. **`importSave()` aceita qualquer coisa**: base64 → `JSON.parse` → checa só que
   `tokens` é array → `migrate()`. **Sem HMAC, sem checksum.**
3. `migrate()` sanea **tipo, não valor**. `g.money = +g.money || 0` — **sem teto
   nenhum**. `totals`, `best`, `bestSale`, `xp` também sem teto.
4. **Existem códigos de trapaça oficiais no jogo** (`CODES` em
   `src/33-app-vault.js`), rastreados em `G.usedCodes`: `-30%` em toda taxa
   permanente, mesada diária, +10 freemints. Um leaderboard precisa decidir se
   `usedCodes` desqualifica ou marca a entrada.
