/* ================= ENEMIES: scams, hackers, security ================= */
let scamOpen=0;
/* Um golpe e engracado. Quatro numa hora e barulho. Regras:
   um por vez na tela, no maximo 2 por dia, nunca menos de 3 horas depois do
   ultimo, e nada nos tres primeiros dias. NAO da pra desligar: pagar pela
   ciberseguranca so faz sentido se o perigo existir sempre. */
function maybeScam(){
  if(G.day<3||scamOpen>=1)return;
  /* pop-up de golpe por cima de alguem falando com o jogador e ruido, nao
     tensao. Ele volta na proxima hora. */
  if(typeof storyTalking==='function'&&storyTalking())return;
  if((G.scamsToday||0)>=2)return;
  const since=(G.day*24+G.hour)-(G.lastScamAt||0);
  if(since<3)return;
  const p=securityActive()?0.02:0.07;
  if(!chance(p))return;
  G.scamsToday=(G.scamsToday||0)+1;
  G.lastScamAt=G.day*24+G.hour;
  setTimeout(spawnScam,ri(400,1600));
}
function spawnScam(){
  if(scamOpen>=1)return;
  if(typeof storyTalking==='function'&&storyTalking())return;
  const list=SCAMS[LANG]||SCAMS.en;
  const s=pick(list);
  const B=UI.bounds();
  const w=el('div','win scampop scamwin opening');
  const x=clamp(30+Math.random()*(B.w-320),4,Math.max(4,B.w-290));
  const y=clamp(30+Math.random()*(B.h-240),4,Math.max(4,B.h-200));
  w.style.cssText=`left:${x}px;top:${y}px;width:290px;z-index:7600`;
  w.innerHTML=`<div class="titlebar scam-bar">${pixSVG('warn',14,'tico')}<span class="ttl">${s.t}</span>
      <div class="tbtns"><button class="tb" data-scamx="1" title="${t('Close')}"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face)">
      <div class="pad" style="display:flex;gap:10px;align-items:flex-start">
        ${pixSVG('coin',32)}<div style="flex:1;font-size:calc(12px * var(--fs));line-height:1.5">${s.m}</div>
      </div>
      <div class="row" style="justify-content:center;padding:0 10px 11px;gap:8px">
        <button class="btn big scam-go" data-scamgo="1">${s.b}</button>
      </div>
      <div class="scam-foot">${s.tell}</div>
    </div>`;
  $('#screen').appendChild(w);
  setTimeout(()=>w.classList.remove('opening'),180);
  SFX.notify();
  scamOpen++;
  let done=false;
  const kill=safe=>{
    if(done)return;done=true;scamOpen=Math.max(0,scamOpen-1);
    w.classList.add('closing');setTimeout(()=>w.remove(),140);
    if(safe){UI.think(pick(DODGE[LANG]||DODGE.en));}
  };
  $('[data-scamx]',w).onclick=()=>{SFX.click();kill(true);};
  $('[data-scamgo]',w).onclick=()=>{kill(false);runScam();};
  setTimeout(()=>kill(true),26000);
}
const DODGE={
 en:["Not falling for that one.","I have seen that link before.","Almost. Almost got me."],
 pt:["Nessa eu não caio.","Já vi esse link antes.","Quase. Quase me pegou."]
};
function runScam(){
  SFX.error();
  const moneyHit=chance(.6)||!G.tokens.length;
  if(moneyHit){
    const amount=Math.max(1,Math.min(G.money,G.money*rf(.10,.22)));
    spend(amount);G.scamLoss+=amount;
    UI.dialog(t('You got drained'),
      t('The contract you approved moved <b>{0}</b> out of your wallet.<br><br>Nobody is coming to help.',money(amount)),'xerr',
      {onDone(){UI.refresh();save();}});
  } else {
    const pool=G.tokens.filter(x=>!x.staked);
    const n=Math.min(pool.length,ri(1,3));
    const ids=[];
    for(let i=0;i<n;i++){const x=pick(pool);if(ids.indexOf(x.id)<0){ids.push(x.id);removeToken(x.id);}}
    UI.dialog(t('You got drained'),
      t('They took <b>{0}</b> Kaiju from your wallet: {1}.<br><br>Nobody is coming to help.',ids.length,ids.map(i=>'#'+i).join(', ')),'xerr',
      {onDone(){checkLevel();UI.refresh();save();}});
  }
  UI.floatTray('SCAMMED','#d24b3a');
}

/* ---- the morning security report ---- */
function hackReport(){
  const h=G.lastHack;
  G.lastHack=null;
  if(!h)return false;
  /* o hack roteirizado (24-state.js) acontece mesmo com o bolso vazio; nesse
     caso a tela nao pode dizer "levou $0,00" — ela diz que nao sobrou nada */
  const body=h.kind==='money'
    ? (h.amount>0
        ? t('<b>{0}</b> got into your machine overnight and moved <b>{1}</b> out.',h.who,money(h.amount))
        : t('<b>{0}</b> got into your machine overnight. There was nothing left to take. This time.',h.who))
    : t('<b>{0}</b> got into your machine overnight and took <b>{1}</b> Kaiju: {2}.',h.who,h.ids.length,h.ids.map(i=>'#'+i).join(', '));
  UI.modal(`<div class="titlebar danger"><span class="ttl">${t('SECURITY BREACH')}</span></div>
    <div class="wbody" style="background:var(--face);width:min(calc(340px * var(--ui)),92vw)">
      <div class="pad" style="display:flex;gap:11px;align-items:flex-start">
        ${pixSVG('xerr',40)}<div style="flex:1;font-size:calc(12px * var(--fs));line-height:1.6">${body}</div>
      </div>
      <div class="pad" style="padding-top:0">
        <div class="tiny dim">${t('Kaiju Antivirus keeps them out. Buy it in the Kaiju Shop before you sleep.')}</div>
      </div>
      <div class="row" style="justify-content:center;padding:0 10px 12px"><button class="btn big" data-hackok="1">${t('DAMN IT')}</button></div>
    </div>`,'',m=>{
      SFX.error();
      m.box.classList.add('shake');setTimeout(()=>m.box.classList.remove('shake'),400);
      m.box.querySelector('[data-hackok]').onclick=()=>{SFX.click();m.close();checkLevel();UI.refresh();save();};
    });
  return true;
}
