# O bug da arte trocada — causa real (v1.3)

Errei o diagnóstico duas vezes antes de achar. Registro completo pra não repetir.

## Sintoma
Mintava um Knight e o jogo dizia Zomboy. Depois: aparecia um Archangel e dizia Mecha.

## A causa REAL
`drawKaiju()` tenta `localArt(id)` **antes** das folhas embutidas.
`localArt` monta o caminho com `realFileId(id)`:

```js
function realFileId(id){
  return (typeof KK_REAL!=='undefined'&&KK_REAL)?(KK_REAL[id-1]||id):id;
}
```

Na build **pública** `KK_REAL=null` (de propósito — é o que impede descobrir o
próximo mint real). Então `realFileId(id)` devolve o próprio `id`.

E o `probeArt` procurava `images/1.png` **em qualquer build**. Como o dono guarda
o jogo DENTRO da pasta `kaijukaki-collection`, a sonda achava, `ART.dir='images/'`,
e o jogo passava a carregar `images/{número do jogo}.png` — outra peça — enquanto
os traits vinham de `metaOf(id)` = os do arquivo real permutado.

## Por que os testes não pegaram
O jogo era rodado em `dist/`, onde **não existe pasta images/** ao lado. Sem ela,
`ART.dir` ficava null e o jogo caía nas folhas embutidas — que estavam corretas.
O caminho que quebrava era justamente o que nunca foi exercitado.

**Lição: testar no ambiente do usuário, não no seu.** Copiar a build para uma
pasta com `images/` ao lado fez o bug aparecer na primeira tentativa.

## Correção
`src/23-art.js`: `canReadLocalArt()` — ler PNGs de `images/` só faz sentido se a
build tiver o mapa `KK_REAL`. Sem mapa, `probeArt` nem procura a pasta e
`localArt` recusa. A build pública usa exclusivamente as folhas embutidas.

---

# SEGUNDO bug da arte trocada — só no sorteio (v1.6)

Sintoma diferente, causa diferente. **A pista que resolveu veio do dono:**
*"por mais que apareça errado no sorteio, quando vou na minha wallet ele aparece
corretamente"*. Ou seja: o dado estava certo. Só o desenho da tela do sorteio
estava errado.

## A causa
A animação do sorteio gira ~13 Kaiju aleatórios no **mesmo canvas** antes de
parar. Cada `drawKaiju()` desses registra um callback de redesenho, porque a
folha AVIF responde quando termina de decodificar, não quando é chamada.

Sequência: o giro acaba → o Kaiju real é desenhado → um dos 13 aleatórios do meio
do giro finalmente decodifica e **se pinta por cima**. O nome embaixo era o certo;
a cara não.

## Correção
`src/23-art.js` — o canvas guarda qual id ele quer e recusa qualquer outro:

```js
cv.__want=id;
const again=()=>{if(cv.isConnected&&cv.__want===id)drawKaiju(cv,tk,size);};
```

Verificado 10/10 sorteios com arte e nome do mesmo Kaiju.

## Armadilhas de teste encontradas nesta caçada
- `tileOf`/`drawKaiju` desenham um placeholder de scanline enquanto a folha
  decodifica — capturar cedo demais dá falso negativo.
- PNGs via `file://` contaminam o canvas: `getImageData`/`toDataURL` falham.
  Precisa de `--allow-file-access-from-files` no Chromium.
- Crase dentro do texto do changelog quebra a template string do `MAIL`.
  Rodar a varredura de sintaxe em todos os `src/*.js` antes de buildar.
- **Callbacks de redesenho pendentes**: qualquer canvas reaproveitado numa
  animação precisa de guarda (`cv.__want`). Testar o sorteio, não só a wallet.

## Fontes de verdade da metadata
`src/18b-meta.js` (traits + `pos`). Qualquer `meta.json` antigo que você encontre
por aí tem uma permutação **diferente** — foi essa mistura que gerou as folhas de
arte erradas na primeira vez.
