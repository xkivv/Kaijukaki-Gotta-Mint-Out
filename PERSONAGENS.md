# PERSONAGENS — Modo História

Seis pessoas guiam o jogador. Nenhuma foi inventada pra ser tutorial: todas
já existiam no feed e na DM do jogo, e continuam aparecendo lá depois. Por
isso o retrato de cada uma tem que ser a **mesma cara** que ela usa no Kaki+.

---

## As seis

### `Anonymous Wallet` — a moderadora
**É:** moderadora · já viu quatro coleções morrerem.
**Tom:** calma, direta, sem hype. Frases curtas e afirmativas. Não vende nada,
não promete nada, não usa gíria de cripto. É quem abre o jogo ("Então você
também achou.") e quem explica o que é estrutural: hype, fichário, rank.
**Desenha como:** alguém que já está aqui há tempo demais pra se animar.

### `oni_of_the_floor` — o vigia do floor
**É:** vigia do floor · ainda não gosta de você.
**Tom:** desconfiado, curto, meio hostil no começo. Fala em números e em
regras do mercado. Vigia o que você lista e julga. "Não despeja no floor. Eu
vou saber, e todo mundo também."
**Desenha como:** alguém que está te olhando pela lateral do olho.

### `hakase` — o comprador calado
**É:** compra calado · aparece quando tem dinheiro.
**Tom:** telegráfico. Frases de três palavras. Abre conversa com um nome de
peixe ("Tuna.", "Swordfish.") como quem dá uma senha. Só aparece quando o
jogador subiu de rank ou vendeu algo — dinheiro é o que o traz.
**Desenha como:** alguém que não pisca.

### `Leaner (Unc)` — o tio da sala
**É:** tira gente do parapeito.
**Tom:** o mais quente dos seis. Fala quando o jogo machucou: você zerou, o
gráfico virou penhasco, o cobrador levou seus Kaiju. Nunca dá dica de
otimização — dá contexto humano. "Não é derrota, é terça-feira."
**Desenha como:** alguém olhando pra você, não pra tela.

### `tobi_04` — quem já errou tudo antes
**É:** já cometeu todo erro antes, por você.
**Tom:** **tudo em minúscula**, sem pontuação formal, confessional. Sempre
conta o próprio prejuízo antes de dar o conselho ("eu mintei doze na hora do
pico uma vez. paguei vinte e recebi doze."). É o único que fala de gas,
golpe, antivírus e das armadilhas que o jogador cria sozinho.
**Desenha como:** cansado, meio bagunçado, simpático.

### `Mr. Kaiju` — o cobrador
**É:** cobrador de impostos autonomeado. **Não é da coleção** — a ficha dele
no app diz isso com todas as letras.
**Tom:** ameaça administrativa. Não grita, não explica, não negocia. Frases
de formulário ("Auditoria. Eu não preciso de motivo e você não tem recurso.").
**Desenha como:** o vilão. É o único que pode ser feio.

---

## As imagens

| item | valor |
|---|---|
| **resolução ideal** | **320 × 320 px** |
| resolução mínima | 256 × 256 px |
| proporção | **1:1 (quadrado)** — obrigatório |
| formato | PNG (com transparência ou sem, tanto faz) |
| enquadramento | rosto/busto centralizado, com uma folga nas bordas |
| onde aparece | moldura de 86 pt na caixa de fala · 96 pt na aba "Gente" · 52 pt no Registro |

**Por que 320:** a moldura da caixa de fala mede `86px × var(--ui)`, e o jogo
pode ser ampliado até 1,7× (`ui-xl`). Numa tela retina isso dá
`86 × 1,7 × 2 = 293` pixels reais. 320 cobre o pior caso com folga e não pesa
no arquivo.

**A imagem é cortada por `object-fit: cover`.** Ela preenche a moldura
quadrada inteira, sem distorcer. Se a arte não for quadrada, as bordas somem —
por isso o enquadramento tem que ter folga.

**Sem imagem não quebra nada.** Personagem sem arte cai no avatar pixelado —
o **mesmo** que ele usa no Kaki+ —, dentro da mesma moldura escura, com um
brilho de fósforo e as listras do CRT por cima. Dá pra entregar um retrato por
vez sem nada ficar com cara de arquivo faltando.

---

## Onde colar

Arquivo: **`src/59-story-log.js`**, no topo, no bloco `const RETRATOS = {…}`.
É o único lugar. Não precisa mexer em mais nenhum arquivo.

1. Salve o desenho como PNG quadrado de 320×320.
2. No terminal, transforme em base64:

   ```
   base64 -w0 ina.png
   ```

3. Monte a linha (o prefixo é obrigatório):

   ```
   data:image/png;base64,COLE_AQUI_O_RESULTADO
   ```

4. Cole entre as aspas do personagem em `RETRATOS`:

   ```js
   const RETRATOS={
     ina:    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
     oni:    '',
     hakase: '',
     sera:   '',
     tobi:   '',
     kaiju:  ''
   };
   ```

5. Rode `./build.sh` na raiz. Pronto — o retrato aparece na caixa de fala, no
   Registro e na ficha da aba "Gente" ao mesmo tempo.

As chaves são `ina`, `oni`, `hakase`, `sera`, `tobi`, `kaiju` — nessa ordem, e
elas não mudam.

---

## O que NÃO mexer

- `storyPortrait()` em `src/58-story.js` — é ela que decide entre a imagem e o
  avatar pixelado. Já funciona; o bloco `RETRATOS` só alimenta ela.
- `CHARS` em `src/58-story.js` — quem é cada um, o subtítulo e o ícone de
  fallback moram lá. O bloco `RETRATOS` escreve só o campo `art`.
