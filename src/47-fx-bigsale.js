/* ================= VENDA GRANDE =================
   Quando alguem paga 3x o valor justo, o jogo tem que comemorar. Mas nao pode
   virar mais um pop-up: no maximo uma por hora de jogo, nunca por cima de um
   modal aberto, e clicar em qualquer lugar fecha. Se nao puder tocar, vira
   toast — a venda nunca passa despercebida, so nao rouba a tela. */
const BIG_RATIO=2.9;
let bigLastAt=-99, bigOpen=false;
function bigSaleReady(){
  if(bigOpen)return false;
  if(typeof UI==='undefined'||UI.modalOpen())return false;
  if(typeof dayLock!=='undefined'&&dayLock)return false;
  if($('#sysveil'))return false;
  const now=G.day*24+G.hour;
  if(now-bigLastAt<1)return false;
  return true;
}
const BIG_LINES=[
 {en:'SOMEBODY ACTUALLY PAID THAT',pt:'ALGUÉM PAGOU ISSO DE VERDADE'},
 {en:'EXIT LIQUIDITY LOCATED',pt:'LIQUIDEZ DE SAÍDA LOCALIZADA'},
 {en:'THE FLOOR IS A SUGGESTION',pt:'O FLOOR É UMA SUGESTÃO'},
 {en:'PRICE DISCOVERY, THEY CALL IT',pt:'DESCOBERTA DE PREÇO, CHAMAM ISSO'},
 {en:'NO NOTES. NONE.',pt:'SEM COMENTÁRIOS. NENHUM.'}
];
function bigSaleFX(info){
  if(!info)return;
  bigOpen=true;bigLastAt=G.day*24+G.hour;
  const R=RARITY[info.rarity]||RARITY[0];
  const line=pick(BIG_LINES);
  const box=el('div','bigsale');
  box.innerHTML=`<div class="bs-ring"></div>
    <div class="bs-card" style="border-color:${R.c}">
      <canvas class="bs-art"></canvas>
      <div class="bs-id">#${info.id}</div>
    </div>
    <div class="bs-price mono" data-bsp="1">${money(0)}</div>
    <div class="bs-over">+${Math.round((info.ratio-1)*100)}% ${t('VS FAIR VALUE')}</div>
    <div class="bs-line">${line[LANG]||line.en}</div>
    <div class="bs-who">${info.who||''}</div>`;
  $('#screen').appendChild(box);
  UI.flash();
  SFX.cash(true);haptic(HAP.cash);
  const tk=G.tokens.find(x=>x.id===info.id)||{id:info.id,rarity:info.rarity};
  try{drawKaiju($('.bs-art',box),tk,140);}catch(e){}
  setTimeout(()=>UI.countUp($('[data-bsp]',box),info.price,700,money),560);
  setTimeout(()=>UI.confetti(110,[R.c,'#e8c060','#ffffff'],60),680);
  const kill=()=>{
    if(!box.isConnected)return;
    box.classList.add('out');
    setTimeout(()=>{box.remove();bigOpen=false;},380);
  };
  box.onclick=kill;
  setTimeout(kill,3200);
}

/* ================= OC STAR =================
   Uma estrela cai na area de trabalho e o jogador coleta. Nasce no onHour, nao
   num setInterval real: o tempo do jogo ja para sozinho quando tem modal
   aberto, e uma estrela nascendo por cima de um reveal seria justamente o tipo
   de interrupcao que a gente passou o dia inteiro tirando. */
function starValue(){return Math.max(8,Math.round(mintPrice()*2.5));}
function maybeStar(){
  if(!has('ocstar'))return;
  if($('#ocstar'))return;
  if(typeof UI==='undefined'||UI.modalOpen())return;
  if(typeof dayLock!=='undefined'&&dayLock)return;
  if($('#sysveil'))return;
  if(!chance(0.5))return;
  spawnStar();
}
function spawnStar(){
  if($('#ocstar'))return;
  const B=UI.bounds();
  const s=el('div');s.id='ocstar';
  s.innerHTML=pixSVG('star',Math.round(40*uiScale()),'glyph');
  s.style.left=ri(20,Math.max(30,B.w-80))+'px';
  s.style.top =ri(20,Math.max(30,B.h-80))+'px';
  s.title=t('OC Star — grab it');
  $('#desktop').appendChild(s);
  SFX.tick();
  const kill=setTimeout(()=>{
    if(!s.isConnected)return;
    s.classList.add('gone');setTimeout(()=>s.remove(),400);
  },22000);
  s.onclick=()=>{
    clearTimeout(kill);
    const v=starValue();
    earn(v);G.starsGot=(G.starsGot||0)+1;
    SFX.cash();haptic(HAP.cash);
    UI.floatFrom(s,'+'+money(v),'#e8c060');
    UI.confetti(26,['#e8c060','#ffffff','#d4ff6b']);
    UI.toast('star',t('OC Star! +{0}',money(v)));
    s.classList.add('got');setTimeout(()=>s.remove(),320);
    UI.updateTray();save();
  };
}

/* ================= CONQUISTAS =================
   Marcos que o jogador descobre jogando, nunca um pop-up: toast e um quadrado
   que acende no perfil. */
const ACHIEVEMENTS=[
 {id:'first',  ico:'coin',   en:'First sale',                 pt:'Primeira venda',              ok:()=>G.totals.sold>=1},
 {id:'triple', ico:'rocket', en:'Sold at 3x fair value',      pt:'Vendeu a 3x o valor justo',   ok:()=>(G.bestSale||0)>0&&(G.achvBig||0)>0},
 {id:'r10',    ico:'kaiju',  en:'10 races seen',              pt:'10 raças vistas',             ok:()=>(G.seenRaces||[]).length>=10},
 {id:'rall',   ico:'kaiju',  en:'Every race seen',            pt:'Todas as raças vistas',       ok:()=>(G.seenRaces||[]).length>=RACES.length},
 {id:'page',   ico:'binder', en:'A full binder page',         pt:'Uma página cheia no binder',  ok:()=>{const B=G.binder;return !!(B&&B.pages||[]).some&&(B.pages||[]).some(p=>(p.slots||[]).filter(x=>x!=null).length>=15);}},
 {id:'vault',  ico:'vault',  en:'Kept 5 Kaiju locked 10 days',pt:'Segurou 5 Kaiju 10 dias',     ok:()=>(G.achvVault||0)>=1},
 {id:'clean',  ico:'pc',     en:'No scam through day 10',     pt:'Nenhum golpe até o dia 10',   ok:()=>G.day>10&&!(G.scamLoss>0)},
 {id:'m100',   ico:'market', en:'100 mints in one day',       pt:'100 mints num dia só',        ok:()=>(G.log.mint||0)>=100},
 {id:'storm',  ico:'warn',   en:'Profited during a dump',     pt:'Lucrou durante um dump',      ok:()=>(G.achvStorm||0)>=1},
 {id:'out',    ico:'gift',   en:'MINTED OUT',                 pt:'DEU MINTOUT',                 ok:()=>!!G.mintout}
];
function repTier(){
  const r=repScore();
  return r>=78?t('Respected'):r>=45?t('Unknown'):t('Suspect');
}
function checkAchievements(){
  G.achv=Array.isArray(G.achv)?G.achv:[];
  ACHIEVEMENTS.forEach(a=>{
    if(G.achv.includes(a.id))return;
    let ok=false;try{ok=!!a.ok();}catch(e){}
    if(!ok)return;
    G.achv.push(a.id);
    if(typeof UI!=='undefined'){
      SFX.levelup&&SFX.levelup();
      UI.toast('gift',t('Achievement: {0}',LANG==='pt'?a.pt:a.en));
    }
  });
}
