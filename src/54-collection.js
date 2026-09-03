/* ================= A COLECAO COMO UM MERCADO DE VERDADE =================
   Tres coisas que faltavam pro Kaiju Market parecer um lugar onde MAIS GENTE
   negocia, e nao so o jogador:
     1. volume (o quanto a colecao girou hoje e desde sempre)
     2. bids na COLECAO INTEIRA ("pago $X por qualquer Kaiju seu")
     3. o risco de perder a compra pra outra pessoa, ou pra propria rede
   Nada aqui reescreve funcao de 24-state.js: o que precisa acontecer junto com
   uma funcao existente entra por cima dela, guardando a original. Assim dois
   agentes mexendo em arquivos diferentes nao se atropelam.
   ATENCAO SAVE: os campos novos (cbids, volH, volCur, volTot) nascem em
   newGame(), e migrate() faz Object.assign(newGame(), save) — save velho sem
   eles carrega com o padrao. Mesmo assim todo acesso passa por uma funcao que
   conserta o tipo, porque save velho editado na mao existe. */

/* ---------- numero grande abreviado: $78.2K, $1.4M ---------- */
function moneyShort(n){
  n=+n||0;
  const neg=n<0;n=Math.abs(n);
  let s;
  if(n>=1e9)      s=(n/1e9).toFixed(1)+'B';
  else if(n>=1e6) s=(n/1e6).toFixed(1)+'M';
  else if(n>=1e3) s=(n/1e3).toFixed(1)+'K';
  else            s=(Math.round(n*100)/100).toFixed(2);
  return (neg?'-$':'$')+s;
}

/* ================= 1. VOLUME =================
   onHour() ja tinha um hourVol, mas ele conta MINTS (unidades) e vai pro
   candle — nao e dinheiro negociado. Aqui o que se guarda e $: uma gaveta por
   hora, 24 gavetas, mais o total de sempre. */
const VOL_HOURS=24;
function volHours(){if(!Array.isArray(G.volH))G.volH=[];return G.volH;}
function addVolume(v){
  v=+v||0;
  if(!(v>0)||!isFinite(v))return;
  G.volCur=(+G.volCur||0)+v;
  G.volTot=(+G.volTot||0)+v;
}
function vol24h(){
  volSeedOnce();
  let s=+G.volCur||0;
  volHours().forEach(x=>{s+=(+x||0);});
  return s;
}
function volTotal(){volSeedOnce();return +G.volTot||0;}
/* ---------- save que vem de antes deste sistema ----------
   Quem ja estava no dia 30 nunca teve volume registrado, e mostrar
   "TOTAL VOLUME $0.00" ao lado de um floor de $43 e mais mentira do que uma
   estimativa. Semeia UMA vez, so pra save antigo, com o que o proprio save ja
   sabe: dias jogados, quanto foi mintado e o floor de agora. Jogo novo (dia 1)
   nunca entra aqui — ele grava de verdade desde a primeira hora. */
function volDayEstimate(){
  if(!G.minted)return 0;
  const hy=clamp(G.hype/100,0,1);
  const giro=0.00035+Math.pow(hy,1.6)*0.0060;
  return G.minted*giro*floorPrice()*1.28*18;
}
function volSeedOnce(){
  if(G.volSeed)return;
  G.volSeed=1;
  if((+G.volTot||0)>0||(+G.day||1)<=1)return;
  const dia=volDayEstimate();
  if(!(dia>0))return;
  /* os primeiros dias valiam muito menos que o de hoje: 55% da media */
  G.volTot=dia*Math.max(0,G.day-1)*0.55;
  const h=volHours();
  h.length=0;
  for(let i=0;i<VOL_HOURS;i++)h.push(dia/VOL_HOURS);
  G.volCur=0;
}
function volRollHour(){
  const h=volHours();
  h.push(+G.volCur||0);
  while(h.length>VOL_HOURS)h.shift();
  G.volCur=0;
}
/* ---------- o que gira FORA da sua tela ----------
   O jogador ve 14 listagens; a colecao tem 8888 pecas e centenas de donos
   negociando entre eles. Sem isso o "24H VOLUME" mostraria so o que passou
   pela mao dele e a barra pareceria um cemiterio. Isto NAO cria dinheiro
   pra ninguem: e contabilidade, nao economia. */
function ambientVolume(){
  if(!G.minted)return 0;
  const hy=clamp(G.hype/100,0,1);
  /* fracao da colecao que troca de mao numa hora: quase zero num dia parado */
  const giro=(0.00035+Math.pow(hy,1.6)*0.0060)*todayEvent().sell;
  const trocas=G.minted*giro*rf(0.55,1.5);
  return trocas*floorPrice()*rf(1.02,1.55);
}

/* ================= 2. BIDS NA COLECAO =================
   Offer normal e num Kaiju especifico. Bid de colecao e "pago $X por qualquer
   Kaiju seu, quero N deles" — e por isso ele mora ABAIXO do floor: quem da o
   lance nao escolhe a peca, entao paga menos por isso. */
function cbids(){if(!Array.isArray(G.cbids))G.cbids=[];return G.cbids;}
/* quantos lances cabem de pe ao mesmo tempo */
function cbidSlots(){
  return clamp(1+Math.floor(G.hype/14)+Math.floor(G.minted/SUPPLY*4)
    +(G.bestLevel>=6?1:0)+(has('whale')?1:0),1,7);
}
/* o TOP OFFER da barra de cima */
function topOffer(){
  const L=cbids();
  let m=0;
  L.forEach(o=>{const p=+o.price||0;if(p>m)m=p;});
  return m;
}
function topOfferBid(){
  const L=cbids();
  let b=null;
  L.forEach(o=>{if(!b||(+o.price||0)>(+b.price||0))b=o;});
  return b;
}
/* chance, por hora, de aparecer mais um lance. Dia 1-3 e praticamente nada:
   ninguem da bid de colecao numa colecao que ninguem conhece. */
function cbidChance(){
  const ramp=clamp((G.day-2)/6,0,1);
  const hy=clamp(G.hype/100,0,1);
  let p=(0.020+Math.pow(hy,1.35)*0.62+(G.minted/SUPPLY)*0.22)*ramp*todayEvent().offer;
  /* com a fila vazia alguem se anima mais rapido: uma colecao conhecida nunca
     fica um dia inteiro sem ninguem oferecendo trocado por qualquer peca */
  if(!cbids().length)p*=2.2;
  return clamp(p,0,0.80);
}
/* Quanto do floor o lance paga. No comeco e esmola — 40% do floor por qualquer
   bicho, porque ninguem quer entrar. Com hype e colecao mintada ele sobe e
   encosta no floor: e assim que bid de colecao funciona de verdade (numa
   colecao quente o melhor lance fica a uns 8% do floor). Nunca chega no floor:
   quem da o lance esta cobrando pela conveniencia de nao escolher a peca. */
function cbidMult(){
  const base=clamp(0.40+clamp(G.hype/100,0,1)*0.58+(G.minted/SUPPLY)*0.20,0.32,0.97);
  return clamp(base*rf(0.88,1.08)*todayEvent().offer,0.22,0.97);
}
function makeCollectionBid(){
  const L=cbids();
  if(L.length>=cbidSlots())return null;
  const fp=floorPrice();
  const q=1+Math.floor(Math.random()*(1+G.hype/22+(G.minted/SUPPLY)*4));
  const o={id:'cb'+Math.random().toString(36).slice(2,9),
    who:pick(BUYERS),
    price:Math.max(0.5,fp*cbidMult()),
    qty:clamp(Math.round(q),1,12),
    ttl:ri(6,26),born:G.day,fresh:1};
  L.push(o);
  TICK.dirty=true;
  return o;
}
/* roda uma vez por hora: vence prazo, nasce lance novo e de vez em quando
   alguem cobre o melhor lance pra ficar no topo */
function cbidTick(){
  const L=cbids();
  for(let i=L.length-1;i>=0;i--){
    const o=L[i];
    o.ttl=(+o.ttl||0)-1;
    if(o.ttl<=0||(+o.qty||0)<=0){L.splice(i,1);TICK.dirty=true;}
  }
  if(chance(cbidChance()))makeCollectionBid();
  /* guerra pelo topo: so acontece quando ja tem gente na fila e o dia esta bom */
  if(L.length>1&&chance(clamp(G.hype/100*0.28,0,0.28)*todayEvent().offer)){
    const b=topOfferBid();
    if(b){b.price=Math.min(b.price*rf(1.04,1.16),floorPrice()*0.99);b.fresh=1;TICK.dirty=true;}
  }
}
/* o "mais comum" que o sistema pega quando o jogador nao escolhe: menor
   raridade, e entre iguais o de menor valor. Nunca toca no cofre nem no album. */
function cbidAutoPick(){
  const pool=sellableTokens();
  if(!pool.length)return null;
  return pool.slice().sort((a,b)=>a.rarity-b.rarity||tokenValue(a)-tokenValue(b))[0];
}
function cbidFillable(o){
  if(!o)return 0;
  return Math.min(+o.qty||0,sellableTokens().length);
}
/* aceitar vende NA HORA, pelo preco do bid. n>1 preenche varias unidades. */
function acceptCollectionBid(oid,tokenId,n){
  const L=cbids();
  const o=L.find(x=>x.id===oid);
  if(!o)return {err:'gone'};
  n=Math.max(1,Math.min(+n||1,+o.qty||0));
  const sold=[];
  let tot=0;
  for(let i=0;i<n;i++){
    let tk=null;
    if(i===0&&tokenId!=null){
      const bs=binderIds();
      tk=G.tokens.find(x=>x.id===tokenId&&!x.staked&&x.listed==null&&!bs.has(x.id))||null;
    }
    if(!tk)tk=cbidAutoPick();
    if(!tk)break;
    removeToken(tk.id);
    earn(o.price);
    tot+=o.price;sold.push(tk);
    o.qty=(+o.qty||0)-1;
  }
  if(!sold.length)return {err:'empty'};
  G.log.sold+=sold.length;G.totals.sold+=sold.length;G.per.sold=(G.per.sold||0)+sold.length;
  if(o.price>(G.bestSale||0))G.bestSale=o.price;
  addVolume(tot);
  addHype(0.10*Math.sqrt(sold.length));
  chainPush(0.7);
  if(typeof questBump==='function')questBump('sold',sold.length);
  if(o.qty<=0){const i=L.indexOf(o);if(i>=0)L.splice(i,1);}
  return {sold,total:tot,price:o.price,who:o.who,left:Math.max(0,+o.qty||0)};
}

/* ================= 3. PERDER A COMPRA =================
   O meme: voce clica em comprar e (a) alguem clicou 0,4s antes, ou (b) a
   transacao morre no caminho e voce paga o gas por nada. Sobe com o hype, com
   a pressao de rede e — principalmente — quando a listagem esta MUITO abaixo
   do justo: barganha todo mundo quer. Nos primeiros dias e zero de proposito;
   perder compra no dia 2, sem entender o jogo ainda, so afasta. */
function buyRisk(l){
  const zero={snipe:0,fail:0,total:0};
  if(!l)return zero;
  const ramp=clamp((G.day-2)/8,0,1);
  if(ramp<=0)return zero;
  const tk=buildToken(l.tk,l.born,false);
  const fair=tokenValue(tk);
  const barganha=clamp(1-l.price/Math.max(0.01,fair),0,0.6);
  let b=0.030+clamp(G.hype/100,0,1)*0.10+chainLoad()*0.35+barganha*0.55;
  b*=ramp;
  if(has('prio'))b*=0.18;              /* o perk da loja: quase mata o problema */
  b=clamp(b,0,has('prio')?0.09:0.40);
  return {snipe:b*0.62,fail:b*0.38,total:b};
}
/* uma transacao que falha ainda queima assinatura: o gas sai, o Kaiju nao vem */
function failGas(){
  return Math.max(0.25,gasFee()*0.45);
}
const BUY_FAIL_WHY=[
  {en:'insufficient priority fee',   pt:'priority fee insuficiente'},
  {en:'transaction dropped by the node', pt:'transação descartada pelo nó'},
  {en:'blockhash expired',           pt:'blockhash expirado'},
  {en:'slot skipped',                pt:'slot pulado'},
  {en:'RPC timed out',               pt:'RPC deu timeout'}
];
function buyFailWhy(){const w=pick(BUY_FAIL_WHY);return w[LANG]||w.en;}
/* apelido de quem compra na sua frente / quem aparece no feed do mercado */
function npcNick(){
  return chance(0.45)?('kaki_'+ri(1000,9999)):pick(BUYERS.concat(SELLERS));
}
/* A compra do jogador passa por aqui, nunca direto no mktBuy: as checagens que
   NAO custam nada (sumiu, carteira cheia, sem dinheiro) vem antes do sorteio,
   senao o jogador perderia gas por uma compra que nem era possivel. */
function mktBuyTry(lid){
  const L=mktList();
  const i=L.findIndex(x=>x.id===lid);
  if(i<0)return {err:'gone'};
  const l=L[i];
  if(capLeft()<=0)return {err:'full'};
  if(G.money<l.price)return {err:'money',need:l.price};
  const r=buyRisk(l);
  if(chance(r.snipe)){
    L.splice(i,1);
    addVolume(l.price);
    chainPush(0.2);
    return {err:'sniped',who:npcNick(),price:l.price,tk:l.tk,lid:l.id};
  }
  if(chance(r.fail)){
    const gas=Math.min(G.money,failGas());
    spend(gas);
    chainPush(0.6);
    return {err:'failed',gas,why:buyFailWhy(),lid:l.id};
  }
  return mktBuy(lid);
}

/* ================= 4. GENTE COMPRANDO NA SUA FRENTE =================
   As listagens da aba Buy sao de outras pessoas — e outras pessoas COMPRAM
   delas. Isto e o modelo: escolhe uma listagem (as barganhas somem primeiro),
   tira do mercado e devolve quem levou. A tela so desenha o que sai daqui. */
function npcBuyRate(){
  const ramp=clamp((G.day-1)/12,0,1);
  const hy=clamp(G.hype/100,0,1);
  const r=(0.005+Math.pow(hy,1.7)*0.55+(G.minted/SUPPLY)*0.10)*ramp*todayEvent().sell;
  return clamp(r,0,0.50);        /* compras por segundo real, com teto */
}
function npcBuyPick(){
  const L=mktList();
  if(L.length<=3)return null;    /* nunca esvazia a vitrine */
  let best=null,bw=-1;
  L.forEach(l=>{
    const tk=buildToken(l.tk,l.born,false);
    const edge=tokenValue(tk)/Math.max(0.01,l.price);
    const w=Math.pow(Math.max(0.05,edge-0.80),2.2)*Math.random();
    if(w>bw){bw=w;best=l;}
  });
  return best;
}
function npcBuyOne(){
  const l=npcBuyPick();
  if(!l)return null;
  const L=mktList();
  const i=L.indexOf(l);
  if(i<0)return null;
  L.splice(i,1);
  addVolume(l.price);
  return {lid:l.id,tk:l.tk,price:l.price,who:npcNick()};
}

/* ---------- variacao do floor em 1 dia ----------
   G.priceHist guarda UM numero por dia, empilhado no endDay(): o floor do
   fechamento. Entao "1D" e o floor de agora contra o ultimo fechamento. */
function floorChange1d(){
  const h=Array.isArray(G.priceHist)?G.priceHist:[];
  if(!h.length)return null;
  const prev=+h[h.length-1];
  if(!(prev>0))return null;
  return (floorPrice()/prev-1)*100;
}

/* ================= ENGATES =================
   Cada um destes guarda a funcao original e chama ela: nenhuma linha de
   24-state.js foi reescrita. */
(function hookCollection(){
  const _onHour=onHour;
  onHour=function(){
    const r=_onHour.apply(this,arguments);
    /* a hora que acabou de fechar recebe o giro de fora da tela, e so depois
       a gaveta vira */
    addVolume(ambientVolume());
    volRollHour();
    cbidTick();
    return r;
  };
  /* o que o jogador vendeu sozinho no tick tambem e volume */
  const _sellTick=sellTick;
  sellTick=function(){
    const antes=+TICK.soldVal||0;
    const r=_sellTick.apply(this,arguments);
    addVolume((+TICK.soldVal||0)-antes);
    return r;
  };
  /* listagem que some no mktTick com prazo ainda de pe = alguem comprou */
  const _mktTick=mktTick;
  mktTick=function(){
    const antes=new Map();
    mktList().forEach(l=>antes.set(l.id,{p:+l.price||0,ttl:+l.ttl||0}));
    const r=_mktTick.apply(this,arguments);
    const agora=new Set(mktList().map(l=>l.id));
    let v=0;
    antes.forEach((x,id)=>{if(!agora.has(id)&&x.ttl>0)v+=x.p;});
    addVolume(v);
    return r;
  };
  const _mktBuy=mktBuy;
  mktBuy=function(lid){
    const r=_mktBuy.apply(this,arguments);
    if(r&&!r.err&&r.price)addVolume(r.price);
    return r;
  };
  const _sweepFloor=sweepFloor;
  sweepFloor=function(n){
    const r=_sweepFloor.apply(this,arguments);
    if(r&&!r.err)addVolume(Math.max(0,(+r.cost||0)-(+r.fee||0)));
    return r;
  };
  const _acceptOffer=acceptOffer;
  acceptOffer=function(oid){
    const o=_acceptOffer.apply(this,arguments);
    if(o&&o.price)addVolume(o.price);
    return o;
  };
  /* um Kaiju que saiu da carteira nao pode continuar valendo um bid ja aceito:
     bid de colecao nao aponta pra token nenhum, entao so precisa sumir quando
     nao sobra nada vendavel — isso quem trata e a tela. */
})();
