/* ================= EFEITOS DOS CODIGOS =================
   Coisas bobas que ficam no sistema depois que o jogador digita o codigo. */

/* ---------- cursor de martelo ---------- */
/* Um martelo de verdade: cabeca de aco larga em cima, cabo de madeira descendo
   pra direita. O anterior parecia uma pa. */
const HAMMER_CUR="data:image/svg+xml;base64,"+btoa(
'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges">'+
/* contorno preto da cabeca */
'<path d="M2 1h10v1h1v4h-1v1H9v1H8v1H7v1H6v1H5v1H4v1H3v1H2v1H1v-2h1v-1h1v-1h1v-1h1v-1h1v-1h1V7H2V6H1V2h1z" fill="#000"/>'+
/* cabeca de aco */
'<path d="M3 2h8v4H3z" fill="#9aa4ad"/>'+
'<path d="M3 2h8v1H3z" fill="#e2e8ee"/>'+
'<path d="M3 5h8v1H3z" fill="#5d666e"/>'+
'<path d="M6 2h1v4H6z" fill="#c3ccd4"/>'+
/* cabo de madeira */
'<path d="M7 7h1v1H7zM6 8h1v1H6zM5 9h1v1H5zM4 10h1v1H4zM3 11h1v1H3zM2 12h1v1H2z" fill="#c8873c"/>'+
'<path d="M8 7h1v1H8zM7 8h1v1H7zM6 9h1v1H6zM5 10h1v1H5zM4 11h1v1H4zM3 12h1v1H3z" fill="#8f5a1e"/>'+
'<path d="M2 13h1v1H2z" fill="#5e3a10"/></svg>');
function applyHammer(){
  if(!G||!G.hammer)return;
  const st=document.getElementById('hammercss')||el('style');
  st.id='hammercss';
  st.textContent=`*{cursor:url(${HAMMER_CUR}) 3 3, auto !important}
    button,.dicon,.tab,.smi,.ctx-item,a,.nftcard,.mkcard,.bcard,.bslot,.rnode,.ibrow{cursor:url(${HAMMER_CUR}) 3 3, pointer !important}`;
  if(!st.parentNode)document.head.appendChild(st);
}

/* ---------- F JESS POLLA ---------- */
const JESS_LINES={
 en:['F JESS POLLA','JESS POLLA COULD NEVER','THIS IS FOR JESS POLLA','JESS POLLA DID THIS TO US',
     'NOBODY LIKES JESS POLLA','JESS POLLA OWES ME MONEY','JESS POLLA RUGGED THE GROUP CHAT',
     'STILL THINKING ABOUT JESS POLLA','JESS POLLA WAS NOT INVITED','I HAVE NOT FORGIVEN JESS POLLA'],
 pt:['F JESS POLLA','JESS POLLA JAMAIS','ISSO É PELO JESS POLLA','JESS POLLA FEZ ISSO COM A GENTE',
     'NINGUÉM GOSTA DO JESS POLLA','JESS POLLA ME DEVE DINHEIRO','JESS POLLA DEU RUG NO GRUPO',
     'AINDA PENSANDO NO JESS POLLA','JESS POLLA NÃO FOI CONVIDADO','EU NÃO PERDOEI O JESS POLLA']
};
function jessPolla(){
  const open=$$('.jesspop').length;
  if(open>=10){SFX.error();UI.toast('warn',t('Ten is the limit. Even for this.'));return;}
  const B=UI.bounds();
  const w=el('div','win jesspop opening');
  const line=(JESS_LINES[LANG]||JESS_LINES.en)[open%10];
  const x=clamp(24+Math.random()*(B.w-280),4,Math.max(4,B.w-250));
  const y=clamp(24+Math.random()*(B.h-200),4,Math.max(4,B.h-160));
  w.style.cssText=`left:${x}px;top:${y}px;width:min(calc(250px * var(--ui)),90vw);z-index:${7300+open}`;
  w.innerHTML=`<div class="titlebar danger-bar">${pixSVG('xerr',14,'tico')}<span class="ttl">${t('Declaration')}</span>
      <div class="tbtns"><button class="tb" data-jx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face)">
      <div class="pad center" style="padding:14px 12px">
        <div class="jesstxt">${line}</div>
      </div>
      <div class="row" style="justify-content:center;padding:0 10px 12px">
        <button class="btn" data-jok="1">${t('AGREED')}</button>
      </div>
    </div>`;
  $('#screen').appendChild(w);
  setTimeout(()=>w.classList.remove('opening'),180);
  SFX.error();haptic(HAP.deny);
  const kill=()=>{SFX.close();w.classList.add('closing');setTimeout(()=>w.remove(),140);};
  $('[data-jx]',w).onclick=kill;
  $('[data-jok]',w).onclick=()=>{SFX.click();kill();};
}

/* ---------- bom dia ---------- */
function bomDia(){
  if(!G||!G.bomdia)return;
  const old=document.getElementById('bomdia');if(old)old.remove();
  const d=el('div');d.id='bomdia';
  d.innerHTML=`<canvas id="bdsun" width="26" height="26"></canvas><span>${t('bom dia!')}</span>`;
  $('#screen').appendChild(d);
  drawSun($('#bdsun',d));
  d.onclick=()=>{SFX.click();d.classList.add('out');setTimeout(()=>d.remove(),320);};
  setTimeout(()=>{if(d.isConnected){d.classList.add('out');setTimeout(()=>d.remove(),320);}},9000);
}
function drawSun(cv){
  const g=cv.getContext('2d'),S=13,u=cv.width/S;
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*u),Math.round(y*u),Math.ceil(w*u),Math.ceil(h*u));};
  g.clearRect(0,0,cv.width,cv.height);
  const Y='#f5c518', O='#e08c10', K='#7a4a00';
  [[6,0],[6,12],[0,6],[12,6],[2,2],[10,2],[2,10],[10,10]].forEach(([x,y])=>P(x,y,1,1,Y));
  P(4,4,5,5,Y);P(5,3,3,1,Y);P(5,9,3,1,Y);P(3,5,1,3,Y);P(9,5,1,3,Y);
  P(4,4,5,1,'#ffe98a');P(4,8,5,1,O);
  P(5,6,1,1,K);P(7,6,1,1,K);P(5,7,3,1,K);
}
/* o sol volta todo dia novo */
function bomDiaTick(){if(G&&G.bomdia)setTimeout(bomDia,1400);}
