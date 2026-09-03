/* ================= MODO MOBILE =================
   O jogo continua sendo o mesmo Windows 98. O que muda:
   - todo app abre em tela cheia, com um botão VOLTAR na titlebar
   - a barra de tarefas vira: Iniciar · voltar pra área de trabalho · dinheiro · relógio
   - o botão direito vira toque longo
   - tudo que dependia de passar o mouse ganha um toque
   Nada disso roda no desktop. */

/* ---------- barra de tarefas: botão de voltar pra área de trabalho ---------- */
function mobBuildBar(){
  if(!IS_MOB||$('#mobhome'))return;
  const b=el('button');b.id='mobhome';
  b.innerHTML=pixSVG('pc',22,'ico')+'<span class="n" id="mobhome_n" style="display:none">0</span>';
  b.title=t('Show the desktop');
  b.onclick=()=>{SFX.click();haptic(10);mobShowDesktop();};
  const tb=$('#taskbar'),tr=$('#tray');
  if(tb&&tr)tb.insertBefore(b,tr);
}
function mobOpenCount(){return Object.keys(UI.open||{}).length;}
function mobSyncBar(){
  if(!IS_MOB)return;
  const n=$('#mobhome_n');if(!n)return;
  const c=mobOpenCount();
  n.style.display=c?'':'none';n.textContent=c;
}
/* esconde tudo sem fechar: os apps continuam abertos */
function mobShowDesktop(){
  Object.keys(UI.open).forEach(id=>{const e=UI.open[id];if(e&&!e.min)UI.minApp(id);});
}

/* ---------- titlebar com botão VOLTAR ---------- */
const MOB_BACK='<svg viewBox="0 0 12 10"><path d="M5 1 L1 5 L5 9 M1 5 L11 5" stroke="#000" stroke-width="1.8" fill="none" stroke-linecap="square"/></svg>';
function mobDressWindow(win,ent){
  if(!IS_MOB||!win)return;
  const bts=$('.tbtns',win);if(!bts||$('.mobback',bts))return;
  const closable=!(ent&&ent.app&&ent.app.noClose);
  const b=el('button','tb mobback');
  b.innerHTML=MOB_BACK+'<span>'+t('Back')+'</span>';
  b.onclick=e=>{
    e.stopPropagation();SFX.click();haptic(8);
    if(closable&&ent)UI.closeApp(ent.id);
    else if(ent)UI.minApp(ent.id);
  };
  bts.insertBefore(b,bts.firstChild);
}

/* ---------- toque longo = botão direito ---------- */
function longPress(node,fn,ms){
  if(!node)return;
  let tmr=null,sx=0,sy=0,fired=false,pid=null;
  const cancel=()=>{if(tmr){clearTimeout(tmr);tmr=null;}};
  node.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse')return;
    pid=e.pointerId;sx=e.clientX;sy=e.clientY;fired=false;
    cancel();
    tmr=setTimeout(()=>{
      fired=true;tmr=null;
      haptic(22);SFX.down();
      fn(sx,sy,e);
    },ms||480);
  });
  node.addEventListener('pointermove',e=>{
    if(e.pointerId!==pid)return;
    if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>10)cancel();
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>node.addEventListener(ev,e=>{
    if(e.pointerId!==pid)return;
    cancel();
    if(fired){e.preventDefault();e.stopPropagation();}
  },true));
  node.__lpFired=()=>fired;
}

/* ---------- posição dos ícones: no celular é grade, não coordenada ---------- */
function mobStripIconPos(){
  /* posições salvas num PC de 1920px jogariam todos os ícones num canto do celular */
  if(!IS_MOB)return;
  $$('.dicon').forEach(e=>{e.style.left='';e.style.top='';});
}

/* ---------- gráfico de velas: toque no lugar do mouse ---------- */
function mobWireChartTouch(cv,handler,hide){
  if(!IS_MOB||!cv)return;
  cv.style.touchAction='none';
  const go=e=>{const r=cv.getBoundingClientRect();handler({clientX:e.clientX,clientY:e.clientY,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,target:cv});};
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}go(e);});
  cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')return;if(e.buttons||e.pressure>0)go(e);});
  cv.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')return;setTimeout(()=>{if(hide)hide();},2600);});
}

/* ---------- os balões não sentam em cima dos toasts ---------- */
function mobStackFix(){
  if(!IS_MOB)return;
  const th=$('#thoughts');if(!th)return;
  const n=$$('#toasts .toast').length;
  th.classList.toggle('hastoast',n>0);
}

/* ---------- rotação / mudança de viewport ---------- */
let mobLastW=0;
function mobOnResize(){
  if(!IS_MOB)return;
  const w=mobWidth();
  if(w===mobLastW)return;
  mobLastW=w;
  Object.values(UI.open).forEach(e=>{
    if(e.min)return;
    const B=UI.bounds();
    e.win.style.left='0px';e.win.style.top='0px';
    e.win.style.width=B.w+'px';e.win.style.height=B.h+'px';
    if(e.app.onResize)e.app.onResize(e.body,e);
  });
}

/* ---------- ligação ---------- */
function mobInit(){
  if(!IS_MOB)return;
  document.body.classList.add('mob');
  mobBuildBar();
  window.addEventListener('resize',()=>setTimeout(mobOnResize,60));
  window.addEventListener('orientationchange',()=>setTimeout(()=>{mobOnResize();buildDesktop();},260));
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>setTimeout(mobOnResize,60));
  /* teclado virtual: o campo em foco não pode ficar embaixo do teclado */
  document.addEventListener('focusin',e=>{
    const t=e.target,tag=(t.tagName||'').toLowerCase();
    if(tag!=='input'&&tag!=='textarea'&&tag!=='select')return;
    setTimeout(()=>{try{t.scrollIntoView({block:'center',behavior:'smooth'});}catch(_){}},280);
  });
  /* o botão físico de voltar do Android fecha o app do topo */
  try{
    history.replaceState({kk:0},'');
    window.addEventListener('popstate',()=>{
      const ks=Object.keys(UI.open).filter(k=>!UI.open[k].min);
      history.pushState({kk:1},'');
      if(ks.length){SFX.close();UI.closeApp(ks[ks.length-1]);}
      else mobShowDesktop();
    });
    history.pushState({kk:1},'');
  }catch(e){}
}
