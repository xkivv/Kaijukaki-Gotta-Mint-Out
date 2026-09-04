/* ================= WINDOW MANAGER + UI ================= */
const APPS={};
/* Janela aberta pelo JOGO (auditoria do Mr. Kaiju) nao entra na sessao
   guardada: reabrir o jogo nao pode reabrir uma cobranca. Quem abre por
   evento passa por aqui. */
let WM_AUTO=false;
function openAppAuto(id,arg){
  WM_AUTO=true;
  try{return UI.openApp(id,arg);}finally{WM_AUTO=false;}
}
const UI=(()=>{
  let z=100;const open={};
  /* durante a restauracao da sessao nao tem som de abrir janela: seriam seis
     "click" de uma vez no boot */
  let silent=false;
  const deskEl=()=>$('#screen');

  /* A TELA MEDIDA PELO LAYOUT, NUNCA PELO RETANGULO PINTADO.
     getBoundingClientRect() conta transformacao de CSS. Na virada do dia a
     tela faz o desligamento de TV (#screen em scaleY(.004) por ~1,6s) — e e
     exatamente quando a historia destrava painel e icone novo e tudo e
     reposicionado. Com a tela "medindo" 3px de altura, wgtClampAll() puxava
     TODOS os paineis pro topo, inclusive os que o jogador tinha arrastado, e
     ele acordava com a mesa reorganizada. clientWidth/clientHeight sao a
     caixa de layout: transformacao nao encosta neles. E uma medida absurda
     (menor que 120px de altura) nunca vira geometria: vale a ultima boa. */
  let BOUNDS_OK=null;
  function bounds(){
    const sc=$('#screen'), tb=$('#taskbar');
    let w=sc?sc.clientWidth:0, h=sc?sc.clientHeight:0;
    const th=tb?(tb.offsetHeight||30):30;
    h=h-th;
    if(w>=200&&h>=120){BOUNDS_OK={w,h};return {w,h};}
    if(BOUNDS_OK)return {w:BOUNDS_OK.w,h:BOUNDS_OK.h};
    return {w:Math.max(200,w),h:Math.max(120,h)};
  }

  /* qual janela esta na frente — o ESC precisa saber */
  let topId=null;
  function focus(id){
    if(!id||!open[id])return;
    topId=id;
    Object.keys(open).forEach(k=>{
      open[k].win.classList.toggle('blur',k!==id);
      const b=$('#tb_'+k);if(b)b.classList.toggle('active',k===id);
    });
    if(open[id]){open[id].win.style.zIndex=++z;}
  }

  /* onde comeca a coluna de paineis que fica por cima de tudo */
  function colunaLivre(B){
    let x=B.w;
    document.querySelectorAll('#hud,.wgt').forEach(e=>{
      if(e.classList.contains('bare'))return;      /* o relogio fica ATRAS */
      const cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden')return;
      const r=e.getBoundingClientRect();
      if(r.width<4||r.left>B.w)return;
      if(r.left<x)x=r.left;
    });
    return Math.max(360,x);
  }
  function openApp(id,arg){
    if(typeof HUB_OF!=='undefined'&&HUB_OF[id])return openApp(HUB_OF[id],id);
    const A=APPS[id];if(!A)return;
    /* Um app trancado nao abre, venha o clique de onde vier. A historia e quem
       apresenta cada app; qualquer atalho que fure isso quebra a simulacao. */
    if(!open[id]&&typeof iconLive==='function'&&!iconLive(id)){
      if(typeof SFX!=='undefined'&&SFX.error)SFX.error();
      return;
    }
    if(open[id]){
      if(open[id].min){restore(id);}
      focus(id);SFX.click();
      if(A.hub&&arg&&APPS[arg])open[id].tab=arg;
      if(A.refresh)A.refresh(open[id].body,open[id]);
      if(typeof winRemember==='function')winRemember();
      return open[id];
    }
    if(!silent)SFX.open();
    const B=bounds();
    const mobile=(typeof IS_MOB!=='undefined'&&IS_MOB)||B.w<720;
    const K=(typeof uiScale==='function')?uiScale():1;
    /* Os painéis da direita (carteira, gráfico, gás) ficam SEMPRE por cima das
       janelas — é o certo pra eles, mas numa tela de 1024 a janela nascia
       larga o bastante pra passar por baixo e o botão "Install" da loja ficava
       escondido atrás do Gas Tracker. A janela nasce respeitando essa coluna;
       o jogador ainda pode arrastar ou redimensionar por cima se quiser. */
    const n=Object.keys(open).length;
    /* onde a janela quer nascer, antes de saber a largura */
    const x0=mobile?0:24+n*22+(B.w>760?60:0);
    /* e ate onde ela pode ir sem passar por baixo dos paineis */
    const lim=mobile?B.w:Math.max(x0+Math.round(B.w*0.42),colunaLivre(B));
    const w=mobile?B.w:Math.min(Math.round((A.w||420)*K),B.w-14,Math.max(320,lim-x0-6)),
          h=mobile?B.h:Math.min(Math.round((A.h||340)*K),B.h-14);
    const x=mobile?0:clamp(x0,4,Math.max(4,B.w-w-4));
    const y=mobile?0:clamp(18+n*20,4,Math.max(4,B.h-h-4));
    const win=el('div','win opening');
    win.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${++z}`;
    if(A.danger)win.classList.add('danger');
    win.innerHTML=`<div class="titlebar">${pixSVG(A.icon,14,'tico')}<span class="ttl">${t(A.title)}</span>
      <div class="tbtns">
        ${A.noMin?'':'<button class="tb" data-a="min" title="'+t('Minimize')+'"><svg viewBox="0 0 9 9"><rect x="1" y="6" width="7" height="2" fill="#000"/></svg></button>'}
        <button class="tb" data-a="max" title="${t('Maximize')}"><svg viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" fill="#000"/><rect x="1" y="2" width="7" height="6" fill="#c0c0c0"/></svg></button>
        ${A.noClose?'':'<button class="tb" data-a="close" title="'+t('Close')+'"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button>'}
      </div></div>
      ${A.menu?`<div class="menubar">${A.menu.map(m=>`<span>${t(m)}</span>`).join('')}</div>`:''}
      <div class="wbody${A.sunken?' sunken':''}"></div>
      ${A.status?'<div class="statusbar"><div class="st1"></div><div class="st2"></div></div>':''}
      ${A.noResize?'':'<div class="rs n" data-d="n"></div><div class="rs s" data-d="s"></div><div class="rs w" data-d="w"></div><div class="rs e" data-d="e"></div><div class="rs nw" data-d="nw"></div><div class="rs ne" data-d="ne"></div><div class="rs sw" data-d="sw"></div><div class="rs se" data-d="se"></div>'}`;
    deskEl().appendChild(win);
    setTimeout(()=>win.classList.remove('opening'),180);
    const body=$('.wbody',win);
    const ent={id,win,body,app:A,min:false,max:mobile,auto:WM_AUTO,arg:(typeof arg==='string'?arg:'')};
    if(mobile){ent.prev=['24px','20px',(A.w||420)+'px',(A.h||340)+'px'];win.classList.add('maxed');}
    open[id]=ent;
    if(typeof mobDressWindow==='function')mobDressWindow(win,ent);
    A.build(body,ent,arg);
    addTask(id,A);
    drag(win,$('.titlebar',win),ent);
    $$('.rs',win).forEach(h=>resize(win,h,ent,h.dataset.d));
    win.addEventListener('mousedown',()=>focus(id),true);
    win.addEventListener('touchstart',()=>focus(id),{passive:true,capture:true});
    $$('.tb',win).forEach(b=>b.onclick=e=>{
      e.stopPropagation();const a=b.dataset.a;
      if(a==='close')closeApp(id); else if(a==='min')minApp(id); else if(a==='max')maxApp(id);
    });
    focus(id);
    if(typeof mobSyncBar==='function')mobSyncBar();
    if(!silent&&typeof winRemember==='function'){winRemember();if(typeof save==='function')save();}
    return ent;
  }

  function closeApp(id){
    const e=open[id];if(!e)return;
    if(e.app.onClose&&e.app.onClose(e)===false){e.win.classList.add('shake');SFX.error();setTimeout(()=>e.win.classList.remove('shake'),340);return;}
    SFX.close();e.win.classList.add('closing');
    const b=$('#tb_'+id);if(b)b.remove();
    setTimeout(()=>{e.win.remove();delete open[id];
      const ks=Object.keys(open);if(ks.length)focus(ks[ks.length-1]);else topId=null;
      if(typeof mobSyncBar==='function')mobSyncBar();
      if(typeof winRemember==='function'){winRemember();if(typeof save==='function')save();}},135);
  }
  function restore(id){
    const e=open[id];if(!e)return;
    e.min=false;e.geo=null;e.win.style.display='flex';
    const B=bounds();
    e.win.style.left=clamp(e.win.offsetLeft,0,Math.max(0,B.w-70))+'px';
    e.win.style.top=clamp(e.win.offsetTop,0,Math.max(0,B.h-24))+'px';
    const kf=flyKF(e.win,$('#tb_'+id),true);
    if(kf&&e.win.animate){e.win.style.transformOrigin='top left';
      e.win.animate(kf,{duration:170,easing:'cubic-bezier(0,0,.3,1)'});}
    else{e.win.classList.add('restoring');setTimeout(()=>e.win.classList.remove('restoring'),190);}
    focus(id);
    if(e.app.refresh)e.app.refresh(e.body,e);
    if(typeof winRemember==='function'){winRemember();if(typeof save==='function')save();}
  }
  function flyKF(win,btn,rev){
    const w=win.getBoundingClientRect(),b=btn?btn.getBoundingClientRect():null;
    /* no celular #tasks fica escondido: o botao existe mas mede 0x0.
       Voar pra um alvo de tamanho zero jogava a janela no canto superior
       esquerdo. Sem alvo valido, cai na animacao em CSS. */
    if(!b||!b.width||!b.height||!w.width)return null;
    const a=[{transform:'none',opacity:1},
      {transform:`translate(${b.x-w.x}px,${b.y-w.y}px) scale(${Math.max(.05,b.width/w.width)},${Math.max(.05,b.height/w.height)})`,opacity:.25}];
    return rev?a.reverse():a;
  }
  function minApp(id){
    const e=open[id];if(!e)return;SFX.close();
    const kf=flyKF(e.win,$('#tb_'+id));
    /* display:none zera offsetWidth — sem isto a sessao guardaria 0x0 e a
       janela voltaria do tamanho minimo */
    e.geo=[e.win.offsetLeft,e.win.offsetTop,e.win.offsetWidth,e.win.offsetHeight];
    const fin=()=>{e.win.style.transform='';e.win.style.opacity='';e.win.style.display='none';e.min=true;
      const b=$('#tb_'+id);if(b)b.classList.remove('active');
      if(typeof winRemember==='function'){winRemember();if(typeof save==='function')save();}};
    if(kf&&e.win.animate){
      e.win.style.transformOrigin='top left';
      const an=e.win.animate(kf,{duration:165,easing:'cubic-bezier(.4,0,1,1)'});
      an.onfinish=fin;an.oncancel=fin;
    } else {
      e.win.classList.add('minimizing');
      setTimeout(()=>{e.win.classList.remove('minimizing');fin();},175);
    }
  }
  const GLYPH_MAX='<svg viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" fill="#000"/><rect x="1" y="2" width="7" height="6" fill="#c0c0c0"/></svg>';
  const GLYPH_RES='<svg viewBox="0 0 9 9"><rect x="2" y="0" width="7" height="6" fill="#000"/><rect x="3" y="2" width="5" height="3" fill="#c0c0c0"/><rect x="0" y="3" width="7" height="6" fill="#000"/><rect x="1" y="5" width="5" height="3" fill="#c0c0c0"/></svg>';
  function maxApp(id){
    const e=open[id];if(!e)return;SFX.click();
    const B=bounds();
    e.win.classList.add('anim');
    setTimeout(()=>e.win.classList.remove('anim'),160);
    if(!e.max){e.prev=[e.win.style.left,e.win.style.top,e.win.style.width,e.win.style.height];
      e.win.style.left='0px';e.win.style.top='0px';e.win.style.width=B.w+'px';e.win.style.height=B.h+'px';e.max=true;}
    else{const p=e.prev||['40px','40px','420px','340px'];
      e.win.style.left=p[0]||'40px';e.win.style.top=p[1]||'40px';
      e.win.style.width=p[2]||'420px';e.win.style.height=p[3]||'340px';e.max=false;}
    const mb=e.win.querySelector('.tb[data-a="max"]');if(mb)mb.innerHTML=e.max?GLYPH_RES:GLYPH_MAX;
    e.win.classList.toggle('maxed',e.max);
    if(typeof winRemember==='function'){winRemember();if(typeof save==='function')save();}
    setTimeout(()=>{if(e.app.onResize)e.app.onResize(e.body,e);},170);
  }
  function addTask(id,A){
    const b=el('button','tbtn');b.id='tb_'+id;
    b.innerHTML=pixSVG(A.icon,14,'tico')+`<span class="tt">${t(A.title)}</span>`;
    b.onclick=()=>{const e=open[id];if(!e)return;SFX.click();
      if(e.min){restore(id);return;}
      if(e.win.classList.contains('blur'))focus(id);else minApp(id);};
    $('#tasks').appendChild(b);
  }

  /* ---- drag / resize ---- */
  function ptr(e){return e.touches?e.touches[0]:e;}
  /* Pointer-Events based drag/resize.
     Each gesture captures its own pointerId on its own handle, so several
     windows can be dragged / resized at the same time (multi-touch or
     mouse + touch). Native page panning, text selection and image dragging
     are suppressed so the host page never moves with the window. */
  function isPrimaryButton(e){return e.pointerType!=='mouse'||e.button===0;}

  function drag(win,handle,ent){
    let lastTap=0;
    handle.addEventListener('pointerdown',e=>{
      if(e.target.closest('.tb'))return;
      if(!isPrimaryButton(e))return;
      focus(ent.id);
      const now=Date.now();
      if(now-lastTap<340){lastTap=0;e.preventDefault();maxApp(ent.id);return;}
      lastTap=now;
      if(ent.max)return;                       /* maximized windows don't move */
      e.preventDefault();
      const sx=e.clientX,sy=e.clientY,ox=win.offsetLeft,oy=win.offsetTop,pid=e.pointerId;
      try{handle.setPointerCapture(pid);}catch(_){}
      win.classList.add('dragging');
      const mv=ev=>{
        if(ev.pointerId!==pid)return;
        ev.preventDefault();
        const B=bounds();
        /* A barra de tarefas fica em z-index 5000, ou seja, SEMPRE por cima —
           e isso e o certo pra ela. O que estava errado era deixar a janela
           descer por baixo: o jogador arrastava pra baixo e a barra comia o
           rodape da janela, com os botoes dentro. Agora a janela simplesmente
           nao passa do chao da area de trabalho. Janela mais alta que a tela
           fica colada no topo, que e o unico lugar onde ela cabe. */
        win.style.left=clamp(ox+ev.clientX-sx,-win.offsetWidth+70,B.w-40)+'px';
        win.style.top=clamp(oy+ev.clientY-sy,0,Math.max(0,B.h-win.offsetHeight))+'px';
      };
      const up=ev=>{
        if(ev.pointerId!==pid)return;
        win.classList.remove('dragging');
        handle.removeEventListener('pointermove',mv);
        handle.removeEventListener('pointerup',up);
        handle.removeEventListener('pointercancel',up);
        try{handle.releasePointerCapture(pid);}catch(_){}
        if(typeof winRemember==='function')winRemember();
        save();
      };
      handle.addEventListener('pointermove',mv);
      handle.addEventListener('pointerup',up);
      handle.addEventListener('pointercancel',up);
    });
  }

  function resize(win,h,ent,dir){
    dir=dir||'se';
    h.addEventListener('pointerdown',e=>{
      if(!isPrimaryButton(e))return;
      if(ent&&ent.max)return;
      if(ent)focus(ent.id);
      e.preventDefault();e.stopPropagation();
      const sx=e.clientX,sy=e.clientY,pid=e.pointerId;
      const ow=win.offsetWidth,oh=win.offsetHeight,ox=win.offsetLeft,oy=win.offsetTop;
      try{h.setPointerCapture(pid);}catch(_){}
      win.classList.add('dragging');
      const mv=ev=>{
        if(ev.pointerId!==pid)return;
        ev.preventDefault();
        const B=bounds(),dx=ev.clientX-sx,dy=ev.clientY-sy;
        let w=ow,ht=oh,x=ox,y=oy;
        if(dir.includes('e'))w=clamp(ow+dx,240,B.w+200);
        if(dir.includes('s'))ht=clamp(oh+dy,150,B.h+200);
        if(dir.includes('w')){w=clamp(ow-dx,240,B.w+200);x=ox+(ow-w);}
        if(dir.includes('n')){ht=clamp(oh-dy,150,B.h+200);y=oy+(oh-ht);}
        win.style.width=w+'px';win.style.height=ht+'px';
        win.style.left=x+'px';win.style.top=Math.max(0,y)+'px';
      };
      const up=ev=>{
        if(ev.pointerId!==pid)return;
        win.classList.remove('dragging');
        h.removeEventListener('pointermove',mv);
        h.removeEventListener('pointerup',up);
        h.removeEventListener('pointercancel',up);
        try{h.releasePointerCapture(pid);}catch(_){}
        const id=Object.keys(open).find(k=>open[k].win===win);
        if(id&&open[id].app.onResize)open[id].app.onResize(open[id].body,open[id]);
        if(id&&open[id].app.refresh)open[id].app.refresh(open[id].body,open[id]);
        if(typeof winRemember==='function')winRemember();
        save();
      };
      h.addEventListener('pointermove',mv);
      h.addEventListener('pointerup',up);
      h.addEventListener('pointercancel',up);
    });
  }

  /* ---- dialogs ---- */
  /* dialog e so um modal com cara de caixa de aviso. Precisa passar pela MESMA
     fila do modal: antes ele limpava o veil por fora e deixava modalBusy preso
     em true — dali pra frente nenhum modal aparecia mais no jogo. */
  function dialog(title,msg,icon,opts){
    opts=opts||{};
    const html=`<div class="titlebar">${pixSVG(icon||'info',14,'tico')}<span class="ttl">${title}</span>
      <div class="tbtns"><button class="tb" data-a="x"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
      <div class="wbody" style="background:var(--face);overflow:visible">
        <div class="pad" style="display:flex;gap:12px;align-items:flex-start">
          ${pixSVG(icon||'info',32)}<div style="flex:1;line-height:1.5;font-size:calc(12px * var(--fs))">${msg}</div>
        </div>
        <div class="row" style="justify-content:center;padding:0 10px 12px;gap:8px">
          ${(opts.buttons||[{t:t('OK')}]).map((b,i)=>`<button class="btn" data-i="${i}">${b.t}</button>`).join('')}
        </div></div>`;
    const api=modal(html,'dlg',m=>{
      if(icon==='warn'||icon==='xerr')SFX.error();
      const done=v=>{m.close();if(opts.onDone)opts.onDone(v);};
      $$('.btn',m.box).forEach(b=>b.onclick=()=>{
        SFX.click();
        const bb=(opts.buttons||[{}])[+b.dataset.i];
        done(bb&&bb.v!==undefined?bb.v:true);
        if(bb&&bb.fn)bb.fn();
      });
      const x=$('.tb',m.box);if(x)x.onclick=()=>{SFX.close();done(false);};
    });
    return api.box;
  }
  let modalBusy=false;const mQueue=[];
  function drainModals(){
    if(modalBusy||!mQueue.length)return;
    const [h,c,r]=mQueue.shift();
    setTimeout(()=>modal(h,c,r),170);
  }
  function modal(html,cls,onReady){
    const veil=$('#modalveil');
    if(modalBusy){
      const stub={box:null,queued:true,cancelled:false,
        close(){stub.cancelled=true;const i=mQueue.findIndex(q=>q[3]===stub);if(i>=0)mQueue.splice(i,1);}};
      mQueue.push([html,cls,onReady,stub]);
      return stub;
    }
    modalBusy=true;
    veil.classList.add('on');veil.innerHTML='';
    const box=el('div','win opening '+(cls||''));
    box.innerHTML=html;veil.appendChild(box);
    setTimeout(()=>box.classList.remove('opening'),180);
    let done=false;
    const api={box,close(){
      if(done)return;                       /* fechar duas vezes nao pode travar a fila */
      done=true;
      veil.removeEventListener('pointerdown',outside);
      document.removeEventListener('keydown',onEsc,true);
      veil.classList.remove('on');veil.innerHTML='';modalBusy=false;
      drainModals();
    }};
    /* clicar no escuro em volta fecha, igual em qualquer lugar. O reveal e o
       relatorio do dia sao os unicos que exigem o botao: eles decidem coisa. */
    const sticky=/reveal|lvlup|dayrep|signing/.test(cls||'');
    function dismiss(){
      if(sticky)return;
      const x=$('[data-rvx],[data-evx],.tb[data-a="x"]',box);
      SFX.close();
      if(x&&x.onclick)x.onclick(new Event('click'));
      else api.close();
    }
    function outside(e){if(e.target===veil)dismiss();}
    function onEsc(e){if(e.key==='Escape'&&!done){e.stopPropagation();dismiss();}}
    veil.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',onEsc,true);
    if(onReady)onReady(api);
    return api;
  }
  function modalOpen(){return modalBusy;}
  /* fecha o que estiver aberto sem deixar a fila travada */
  function closeModal(){
    if(!modalBusy)return false;
    const veil=$('#modalveil');
    const x=$('[data-rvx],[data-evx],.tb[data-a="x"],[data-tdx],[data-mdx]',veil);
    if(x&&x.onclick){try{x.onclick(new Event('click'));}catch(e){}}
    if(modalBusy){veil.classList.remove('on');veil.innerHTML='';modalBusy=false;drainModals();}
    return true;
  }
  /* ---------- REDE DE SEGURANCA DO VEU ----------
     Se por qualquer motivo o veu ficar VAZIO mas ainda marcado como ocupado, a
     fila destrava sozinha em vez de o jogo parar de mostrar janelas.

     ATENCAO — este bloco ja teve um furo que travou o jogo inteiro: ele
     limpava a flag `modalBusy` mas NAO tirava a classe `.on` do veu. Do lado
     de dentro o gerenciador achava que estava tudo livre; do lado de fora
     ficava um veu ligado, invisivel e vazio, para sempre. E quem pergunta
     "tem modal na tela?" pergunta pela CLASSE (`#modalveil.on`) — o modo
     historia, entre outros. Resultado: a fila de falas congelava, nenhum
     momento novo disparava, nenhum icone novo aparecia, e o jogador ficava
     com sete Kaiju e uma area de trabalho sem carteira.

     A regra: a classe e a verdade publica. Quem zera a flag zera a classe. */
  setInterval(()=>{
    const veil=$('#modalveil');
    if(!veil)return;
    const vazio=!veil.firstChild;
    if(vazio&&(modalBusy||veil.classList.contains('on'))){
      veil.classList.remove('on');
      veil.innerHTML='';
      if(modalBusy){modalBusy=false;drainModals();}
    }
  },600);

  /* ---- feedback ---- */
  /* ---------- SILENCIO NO TUTORIAL ----------
     Enquanto alguem esta falando com o jogador, e durante a primeira manha
     (ate ele ouvir como se encerra o dia), nenhum aviso, dica ou pensamento
     entra na tela. O jogador esta LENDO; um "Nova raca descoberta!" no canto
     rouba o olho da unica coisa que importa naquele momento. Os avisos de
     tempo ("uma hora pra acabar o dia") passam, porque sao acao, nao ruido.
     Quem pede o silencio: o dono, depois de ver o dia 1 virar uma feira. */
  function quietNow(icon,txt){
    try{
      if(typeof storyTalking==='function'&&storyTalking())return true;
      if(typeof G!=='undefined'&&G&&G.day===1&&G.story&&G.story.seen&&!G.story.seen.b_endday){
        if(icon==='clock'||/hour|minutes left|day is over|hora|minutos|dia acabou/i.test(txt||''))return false;
        return true;
      }
    }catch(e){}
    return false;
  }
  function toast(icon,txt){
    if(quietNow(icon,txt))return;
    const host=$('#toasts');
    const same=$$('.toast',host).find(x=>x.dataset.k===txt&&!x.classList.contains('out'));
    if(same){
      const n=(+same.dataset.n||1)+1;same.dataset.n=n;
      let b=$('.cnt',same);if(!b){b=el('b','cnt');b.style.cssText='margin-left:auto;font-size:calc(10px * var(--fs));color:#5a5a5a';same.appendChild(b);}
      b.textContent='×'+n;
      same.style.animation='none';void same.offsetWidth;same.style.animation='tin .2s';
      clearTimeout(+same.dataset.t);
      same.dataset.t=setTimeout(()=>{same.classList.add('out');setTimeout(()=>same.remove(),300);},3600);
      return;
    }
    const t=el('div','toast',pixSVG(icon,16,'ic')+`<span>${txt}</span>`);
    t.dataset.k=txt;
    host.appendChild(t);
    t.dataset.t=setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300);},3600);
    const list=$$('.toast',host);
    /* CUIDADO: marcar .out nao tira o elemento do DOM na hora — ele so sai 300ms
       depois. Contar de novo dentro de um while trava o navegador. Conta uma vez. */
    const live=$$('.toast',host).filter(x=>!x.classList.contains('out'));
    for(let i=0;i<live.length-3;i++){
      const old=live[i];
      old.classList.add('out');
      setTimeout(()=>old.remove(),300);
    }
    if(typeof mobStackFix==='function')mobStackFix();
  }
  let thoughtLock=0;
  function think(txt,force){
    if(quietNow('think',txt))return;
    const now=Date.now();if(!force&&now-thoughtLock<11000)return;thoughtLock=now;
    const th=el('div','thought',`<span class="who">${t('YOU')}</span>${txt}`);
    $('#thoughts').appendChild(th);
    setTimeout(()=>{th.classList.add('out');setTimeout(()=>th.remove(),320);},5200);
    const l=$$('#thoughts .thought');while(l.length>1){l.shift().remove();}
    if(typeof mobStackFix==='function')mobStackFix();
  }
  function floatMoney(txt,color,x,y){
    const B=bounds();
    const f=el('div','fmoney',txt);f.style.color=color||'#0a6b2a';
    f.style.left=clamp(x!=null?x:B.w-160,4,B.w-90)+'px';
    f.style.top=clamp(y!=null?y:B.h-90,4,B.h-30)+'px';
    $('#screen').appendChild(f);setTimeout(()=>f.remove(),1100);
    const mm=$('#m_money');if(mm){mm.classList.remove('pop');void mm.offsetWidth;mm.classList.add('pop');}
  }
  function floatFrom(node,txt,color){
    if(!node||!node.getBoundingClientRect){floatMoney(txt,color);return;}
    const r=node.getBoundingClientRect();
    if(!r.width){floatMoney(txt,color);return;}
    floatMoney(txt,color,r.x+r.width/2-30,r.y-14);
  }
  function floatTray(txt,color){
    floatFrom($('#m_money'),txt,color);
  }
  function confetti(n,colors,cx){
    const c=$('#confetti');
    /* num celular a tela e estreita e o pixel e minusculo: papel maior e
       espalhado na largura toda, senao o confete vira poeira no meio da tela */
    const MOB=(typeof IS_MOB!=='undefined'&&IS_MOB);
    const SC=MOB?1.45:1, SPREAD=MOB?32:16;
    /* a mesma contagem numa tela de 393px vira uma nevasca que tapa a arte:
       menos papel, maior, e caindo mais espalhado no tempo */
    if(MOB)n=Math.max(10,Math.round(n*0.42));
    for(let i=0;i<n;i++){
      const p=el('i','cfp');
      p.style.left=(cx!=null?clamp(cx+rf(-SPREAD,SPREAD),0,100):rf(0,100))+'%';
      p.style.top=rf(-14,-2)+'px';
      p.style.background=pick(colors||['#8ef0b2','#e8c060','#d24b3a','#7fe3ff','#ffffff']);
      p.style.width=Math.round(pick([4,6,6,9])*SC)+'px';
      p.style.height=Math.round(pick([4,6,10,7])*SC)+'px';
      if(chance(.22))p.style.borderRadius='50%';
      p.style.setProperty('--dx',rf(-130,130).toFixed(0)+'px');
      p.style.setProperty('--rot',ri(360,1440)+'deg');
      p.style.animationDuration=rf(1.2,2.4)+'s';p.style.animationDelay=rf(0,MOB?1:.45)+'s';
      c.appendChild(p);setTimeout(()=>p.remove(),3200);
    }
  }
  function levelUp(from,to){
    confetti(70);
    const pill=$('#m_lvl');
    if(pill){pill.classList.remove('bump');void pill.offsetWidth;pill.classList.add('bump');
      setTimeout(()=>pill.classList.remove('bump'),1600);}
    modal(`<div class="titlebar">${pixSVG('coin',14,'tico')}<span class="ttl">${t('New level!')}</span></div>
      <div class="wbody lvlup"><div class="stage">
        <canvas class="fish" id="lvfish"></canvas>
        <h2 id="lvnum">${t('LEVEL {0}',from)}</h2><div class="rank" id="lvname">${LEVELS[from-1].n.toUpperCase()}</div>
        <div style="margin-top:10px;font-size:calc(12px * var(--fs));color:#b8ecc8" id="lvperk">&nbsp;</div>
      </div><div class="row" style="justify-content:center;padding:10px;gap:6px"><button class="btn big" id="lvtree">${t('SEE THE TREE')}</button><button class="btn big" id="lvok">${t("LET'S GO")}</button></div></div>`,
      'lvlup',m=>{
        let cur=from,alive=true;
        m.box.addEventListener('DOMNodeRemovedFromDocument',()=>{alive=false;});
        const step=()=>{
          if(!alive||!m.box.isConnected)return;
          cur++;
          drawFish($('#lvfish'),cur,96);
          $('#lvnum').textContent=t('LEVEL {0}',cur);
          const L=LEVELS[cur-1];
          $('#lvname').textContent=L.n.toUpperCase();
          $('#lvperk').textContent=perkOf(cur-1);
          const st=m.box.querySelector('.stage');
          st.style.animation='none';void st.offsetWidth;st.style.animation='rarpop .38s cubic-bezier(.2,1.6,.4,1)';
          SFX.levelup();haptic(HAP.level);
          if(cur<to)setTimeout(step,620);
        };
        drawFish($('#lvfish'),from,96);
        setTimeout(step,180);
        $('#lvok').onclick=()=>{SFX.click();m.close();refresh();};
        /* o momento em que o jogador MAIS quer ver a arvore e agora */
        $('#lvtree').onclick=()=>{SFX.click();m.close();refresh();setTimeout(()=>openApp('profile'),180);};
      });
  }

  /* ---- a sessao: como o jogador deixou a mesa ----
     Guarda so o que ELE abriu, com geometria e estado. O que o jogo abriu
     sozinho (ent.auto) fica de fora. */
  function winSnapshot(){
    const list=[];
    Object.keys(open).forEach(id=>{
      const e=open[id];
      if(!e||e.auto)return;
      if(!APPS[id]||APPS[id].noRestore)return;
      const w=e.win;
      /* maximizada guarda o tamanho de ANTES, senao ela volta colada na tela */
      const p=e.max?(e.prev||[]):null;
      const px=v=>{const n=parseInt(v,10);return isFinite(n)?n:null;};
      /* Minimizada mede 0x0 (display:none): usa a geometria guardada na hora
         de esconder, senao ela voltaria do tamanho minimo. */
      if(e.min&&e.geo&&!e.max){
        list.push({id,arg:APPS[id].hub?'':(e.arg||''),
          x:e.geo[0],y:e.geo[1],w:e.geo[2],h:e.geo[3],min:true,max:false});
        return;
      }
      /* janela com abas guarda a aba no proprio registrador (hubTab), nao aqui */
      list.push({
        id, arg:APPS[id].hub?'':(e.arg||''),
        x:(p&&px(p[0])!=null)?px(p[0]):w.offsetLeft,
        y:(p&&px(p[1])!=null)?px(p[1]):w.offsetTop,
        w:(p&&px(p[2])!=null)?px(p[2]):w.offsetWidth,
        h:(p&&px(p[3])!=null)?px(p[3]):w.offsetHeight,
        min:!!e.min, max:!!e.max
      });
    });
    return {list,focus:(topId&&open[topId]&&!open[topId].auto)?topId:''};
  }
  /* Reabre a mesa. Tudo passa por clamp contra a tela DE AGORA: quem jogou em
     1920x1080 e voltou num 1024x700 nao pode achar a janela fora da tela. */
  function restoreSession(list,focusId){
    if(!Array.isArray(list)||!list.length)return 0;
    const mobile=(typeof IS_MOB!=='undefined'&&IS_MOB)||bounds().w<720;
    let n=0;
    silent=true;
    try{
      list.forEach(st=>{
        try{
          const A=APPS[st.id];
          if(!A||open[st.id])return;
          if(typeof winRestoreOk==='function'&&!winRestoreOk(st))return;
          const ent=openApp(st.id,st.arg||undefined);
          if(!ent)return;
          n++;
          if(mobile)return;                 /* no celular a janela e a tela inteira */
          const B=bounds();
          const w=Math.max(240,Math.min(st.w,B.w-8));
          const h=Math.max(150,Math.min(st.h,B.h-8));
          const x=clamp(st.x,0,Math.max(0,B.w-w));
          const y=clamp(st.y,0,Math.max(0,B.h-h));
          ent.win.style.left=x+'px';ent.win.style.top=y+'px';
          ent.win.style.width=w+'px';ent.win.style.height=h+'px';
          if(st.max){
            ent.prev=[x+'px',y+'px',w+'px',h+'px'];
            ent.win.style.left='0px';ent.win.style.top='0px';
            ent.win.style.width=B.w+'px';ent.win.style.height=B.h+'px';
            ent.max=true;ent.win.classList.add('maxed');
            const mb=ent.win.querySelector('.tb[data-a="max"]');if(mb)mb.innerHTML=GLYPH_RES;
          }
          ent.restored=true;               /* o tamanho e do jogador, nao do app */
          if(A.onResize)A.onResize(ent.body,ent);
          if(st.min){
            /* guarda a geometria antes de esconder: escondida ela mede 0x0 */
            ent.geo=[ent.win.offsetLeft,ent.win.offsetTop,ent.win.offsetWidth,ent.win.offsetHeight];
            ent.min=true;ent.win.style.display='none';
            const b=$('#tb_'+st.id);if(b)b.classList.remove('active');
          }
        }catch(err){console.error(err);}
      });
      if(focusId&&open[focusId]&&!open[focusId].min)focus(focusId);
      else{const ks=Object.keys(open).filter(k=>!open[k].min);if(ks.length)focus(ks[ks.length-1]);}
    }catch(err){console.error(err);}
    silent=false;
    return n;
  }

  /* ---- global refresh ---- */
  let rafPending=false;
  function refresh(){
    if(typeof refreshWidgets==='function')refreshWidgets();
    if(rafPending)return;rafPending=true;
    requestAnimationFrame(()=>{
      rafPending=false;
      Object.values(open).forEach(e=>{if(e.app.refresh&&!e.min){try{e.app.refresh(e.body,e);}catch(err){console.error(err);}}});
      updateTray();
    });
  }
  function refreshOne(id){
    const e=open[id];if(e&&e.app.refresh&&!e.min)e.app.refresh(e.body,e);
    updateTray();
  }
  function updateTray(){
    $('#m_money').textContent=money(G.money);
    $('#m_lvl').textContent=(typeof IS_MOB!=='undefined'&&IS_MOB)
      ? 'Lv'+G.level
      : 'Lv'+G.level+' '+LEVELS[G.level-1].n;
    const lp=$('#m_lvl');
    lp.title=LEVELS[G.level-1].n+' — '+t('open the rank tree');
    lp.style.cursor='pointer';
    if(!lp.__wired){lp.__wired=1;lp.onclick=()=>{SFX.click();openApp('profile');};}
    const ck=$('#clock');
    if(typeof dayIsOver==='function'&&dayIsOver()){
      ck.textContent=t('Day {0} · END DAY',G.day);
      ck.classList.add('sleepnow');
      ck.title=t('The day is over. Click to close it.');
      ck.onclick=()=>{if(typeof dayLock!=='undefined'&&dayLock)return;SFX.click();if(typeof sleepNow==='function')sleepNow();};
    } else {
      /* o dia acabava do nada. Agora o relogio conta pra tras a partir de 2h:
         fica laranja, depois vermelho, e mostra quanto falta. */
      const left=typeof dayEndHour==='function'?(dayEndHour()-G.hour)*60-G.min:999;
      const hh=Math.floor(left/60), mm=left%60;
      ck.textContent=left<=120
        ? t('Day {0} · {1}:{2} · {3} left',G.day,pad2(G.hour%24),pad2(G.min),(hh?hh+'h':'')+pad2(mm))
        : t('Day {0} · {1}:{2}',G.day,pad2(G.hour%24),pad2(G.min));
      ck.classList.remove('sleepnow');
      ck.classList.toggle('late',left<=120&&left>45);
      ck.classList.toggle('critical',left<=45);
      ck.title=left<=120?t('{0} minutes left today.',left):'';
      ck.onclick=null;
    }
    const hb=$('#m_hypebar');
    if(hb){hb.classList.toggle('hot',G.hype>60);$('i',hb).style.width=G.hype.toFixed(1)+'%';
      hb.parentNode.title='Hype: '+G.hype.toFixed(1)+'%';}
    /* MODO HISTORIA: a aba de ofertas so chega no b_market. Ate la o contador
       vermelho no icone do mercado mandava o jogador procurar uma tela que
       ainda nao existe. As ofertas continuam chegando e esperam la. */
    const b=$('#dbadge_mkt');
    const verOfertas=(typeof unlocked!=='function')||unlocked('tab_mkt_offers');
    if(b){b.style.display=(G.offers.length&&verOfertas)?'':'none';b.textContent=G.offers.length;}
    const mb=$('#dbadge_mail');
    if(mb&&typeof mailUnread==='function'){const u=mailUnread();mb.style.display=u?'':'none';mb.textContent=u;}
    /* bolinhas: vermelho = tem coisa te esperando, amarelo = tem dinheiro na mesa */
    /* AS BOLINHAS.
       Elas estavam mentindo: ficavam acesas depois de o jogador ja ter pego a
       recompensa. Dois motivos, os dois consertados aqui.
       1) A condicao do Kakizone era "tem freemint OU tem cupom" — mas o
          freemint do dia continua no bolso depois de resgatado, entao a
          bolinha nunca apagava. Bolinha e "TEM COISA NOVA TE ESPERANDO", nao
          "voce tem alguma coisa".
       2) Varios caminhos que mudam esse estado (resgatar, pagar, comprar) nao
          chamavam UI.refresh(), entao a bolinha so apagava quando outra coisa
          qualquer redesenhava a tela. Agora existe dotState(), e quem muda o
          estado chama refreshDots(). */
    const st=dotState();
    Object.keys(st).forEach(k=>{const n2=$('#ndot_'+k);if(n2)n2.style.display=st[k]?'':'none';});
    const hm=$('#hud_money');
    if(hm){
      const txt=money(G.money);
      if(hm.textContent!==txt){hm.textContent=txt;hm.classList.remove('flash');void hm.offsetWidth;hm.classList.add('flash');}
      $('#hud_day').textContent=t('Day {0}',G.day)+' · '+pad2(G.hour%24)+':'+pad2(G.min);
      $('#hud_lvl').textContent=LEVELS[G.level-1].n;
      $('#hud_held').textContent=num(held());
      $('#hud_hype').textContent=G.hype.toFixed(0)+'%';
      hudSkip();
    }
  }
  /* ---------- MODO HISTORIA: pular uma hora ----------
     O tobi entrega isso no b_comfort ("voce mora aqui agora"). Antes disso o
     botao nao existe: ele nasce e morre aqui dentro, sem passar pelo HTML da
     pagina, que e o que "esconder, nao desabilitar" quer dizer neste painel. */
  function hudSkip(){
    const body=$('#hud .hud-body');
    if(!body)return;
    /* o update da carteira tambem chega instalando: enquanto a janelinha de
       instalacao esta na tela o botao ainda nao existe. */
    const baixando=(typeof dlPending==='function')&&dlPending('f_hudskip');
    const on=((typeof unlocked!=='function')||unlocked('f_hudskip'))&&!baixando;
    let b=$('#hud_skip');
    if(!on){if(b)b.remove();return;}
    if(!b){
      b=el('button','hud-skip');b.id='hud_skip';
      b.onclick=e=>{
        e.stopPropagation();
        if(typeof dayIsOver==='function'&&dayIsOver()){SFX.error();return;}
        SFX.click();
        if(typeof timeAct==='function')timeAct(60);
      };
      body.appendChild(b);
    }
    const acabou=(typeof dayIsOver==='function')&&dayIsOver();
    b.textContent=acabou?t('DAY IS OVER'):t('SKIP 1 HOUR');
    b.disabled=acabou;
  }
  function hypePop(txt){
    const w=$('#m_hypewrap');if(!w)return;
    w.classList.remove('pulse');void w.offsetWidth;w.classList.add('pulse');
    if(txt)floatFrom(w,txt,'#b8860b');
  }
  function setProg(node,pct,from){
    if(!node)return;
    node.style.width=(from!=null?from:0)+'%';
    requestAnimationFrame(()=>{node.style.width=clamp(pct,0,100)+'%';});
  }
  function countUp(node,to,ms,fmt){
    if(!node)return;const t0=performance.now();
    const s=n=>{const k=Math.min(1,(n-t0)/ms);node.textContent=fmt(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(s);};
    requestAnimationFrame(s);
  }
  function flash(){
    const f=el('div');f.id='flash';$('#screen').appendChild(f);setTimeout(()=>f.remove(),280);
  }
  return {get topId(){return open[topId]?topId:null;},modalOpen,closeModal,openApp,winSnapshot,restoreSession,closeApp,minApp,maxApp,restore,focus,dialog,modal,toast,think,floatMoney,floatFrom,floatTray,confetti,levelUp,refresh,refreshOne,updateTray,hypePop,setProg,countUp,flash,bounds,open};
})();
