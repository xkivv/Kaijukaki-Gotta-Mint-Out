/* ================= WIDGETS DE TELA =================
   Painelzinhos que ficam por cima da area de trabalho, igual a Kaiju Wallet:
   arrastaveis, com um X pra desligar, e ligados de volta pelo menu Iniciar ou
   pelo botao direito no fundo. Nao sao janelas — nao entram na barra de tarefas
   e nao roubam o foco. */
/* zoom do painel de velas: preferencia, nao estado de partida (G.prefs) */
const GV=prefView({candles:'chartZoom'});
const WGT={
  /* ---------- RELOGIO ----------
     Sem moldura, sem barra de titulo: so o dia e a hora grandes por cima da
     area de trabalho. Usa o MESMO maquinario dos outros widgets — arrastar,
     redimensionar, ligar/desligar e a posicao no save vem de graca. */
  clock:{
    title:'Clock', ico:'chart', w:250, bare:true,
    body:()=>`<div class="ck-wrap">
        <div class="ck-day" data-ckd="1"></div>
        <div class="ck-time" data-ckt="1"></div>
      </div>`,
    mount(box){
      box.classList.add('bare');
      const cv=$('.ck-wrap',box);
      if(cv)cv.addEventListener('dblclick',()=>{SFX.click();UI.openApp('profile');});
    },
    refresh(box){
      const d=$('[data-ckd]',box), h=$('[data-ckt]',box);
      if(d)d.textContent=t('DAY {0}',num(G.day));
      if(h)h.textContent=pad2(G.hour%24)+':'+pad2(G.min);
      /* passou das horas uteis: o relogio avisa sem gritar */
      box.classList.toggle('late',typeof dayIsOver==='function'&&dayIsOver());
    }
  },
  chart:{
    title:'Kaiju Charts', ico:'chart', w:236,
    body:()=>`<canvas data-wchart="1"></canvas>
      <div class="wg-foot">
        <span data-wcn="1">${GV.candles} ${t('candles')}</span>
        <span data-wcp="1"></span>
      </div>`,
    mount(box,b){
      const cv=$('[data-wchart]',box);
      /* a roda do mouse dentro do painel abre ou fecha o zoom do grafico */
      box.addEventListener('wheel',e=>{
        e.preventDefault();
        const d=e.deltaY>0?1:-1;
        setPrefSoon('chartZoom',clamp(GV.candles+d*4,6,72));
        SFX.tick();
        wgtRefresh('chart');
      },{passive:false});
      /* no celular, pinca com dois dedos faz o mesmo */
      let pinch=null;
      box.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch=Math.hypot(
        e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});
      box.addEventListener('touchmove',e=>{
        if(e.touches.length!==2||pinch==null)return;
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        if(Math.abs(d-pinch)<24)return;
        setPrefSoon('chartZoom',clamp(GV.candles+(d<pinch?4:-4),6,72));
        pinch=d;wgtRefresh('chart');
      },{passive:true});
      cv.addEventListener('dblclick',()=>{SFX.click();UI.openApp('chart');});
    },
    refresh(box){
      const cv=$('[data-wchart]',box);if(!cv)return;
      const data=(G.icandles||[]).slice(-GV.candles);
      drawMiniCandles(cv,data);
      const n=$('[data-wcn]',box);if(n)n.textContent=GV.candles+' '+t('candles');
      const p=$('[data-wcp]',box);
      if(p){
        const a=data.length?data[0].o:floorPrice(), z=data.length?data[data.length-1].c:floorPrice();
        const d=a>0?((z/a-1)*100):0;
        p.className=d>=0?'pos':'neg';
        p.textContent=money(z)+'  '+(d>=0?'+':'')+d.toFixed(1)+'%';
      }
    }
  },
  gas:{
    title:'Gas Tracker', ico:'rocket', w:236,
    body:()=>`<div class="gw-top"><span class="gw-pct" data-gwp="1">—</span><span class="gw-cash" data-gwc="1"></span></div>
      <canvas data-gwcv="1"></canvas>
      <div class="wg-foot"><span data-gwm="1"></span><span data-gwl="1"></span></div>`,
    mount(box){
      $('[data-gwcv]',box).addEventListener('dblclick',()=>{SFX.click();UI.openApp('shop');});
      /* botao de encolher: vira so uma tarja com o numero */
      const bar=$('.wg-tt',box);
      const mini=el('button','wg-min');
      mini.innerHTML='&#9644;';
      mini.title=t('Compact');
      mini.onclick=e=>{
        e.stopPropagation();SFX.click();
        prefMap('wgtMini').gas=box.classList.toggle('mini')?1:0;
        prefSave();WGT.gas.refresh(box);
        /* encolheu/cresceu: a pilha de fabrica se reencaixa no canto */
        if(typeof wgtClampAll==='function')wgtClampAll();
      };
      bar.insertBefore(mini,$('.wg-x',bar));
      if(prefMap('wgtMini').gas)box.classList.add('mini');
    },
    refresh(box){
      const p=gasPct(),mood=gasMood();
      const pe=$('[data-gwp]',box),ce=$('[data-gwc]',box);
      pe.textContent=Math.round(p*100)+'%';
      pe.className='gw-pct gm-'+mood;
      ce.textContent=money(gasFee());
      const m=$('[data-gwm]',box);
      m.className='gm-'+mood;
      m.textContent=({cheap:t('cheap — mint now'),ok:t('normal'),high:t('expensive'),insane:t('DO NOT MINT')})[mood];
      $('[data-gwl]',box).textContent='Lv '+gasLevel()+'/'+GAS_MAX_LV;
      /* na forma encolhida o titulo vira o proprio medidor */
      const ttl=$('.wg-tt span',box);
      if(box.classList.contains('mini')){
        ttl.className='wg-mini gm-'+mood;
        ttl.innerHTML=`GAS <b>${Math.round(p*100)}%</b> <i>${money(gasFee())}</i>`;
      }else{
        ttl.className='';ttl.textContent=t('Gas Tracker');
        drawGasCurve($('[data-gwcv]',box));
      }
      box.classList.toggle('alarm',mood==='insane');
    }
  }
};

/* ---------- desenho ---------- */
function drawMiniCandles(cv,data){
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=cv.clientWidth||210,H=cv.clientHeight||86;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#0a1204';g.fillRect(0,0,W,H);
  if(!data.length){
    /* VT323 desenha bem menor que o nominal: 10px dela le como ~7px. Isto e
       uma FRASE, entao vai em Tahoma e no tamanho da interface. */
    const Kv=(typeof uiScale==='function')?uiScale():1;
    g.fillStyle='#7fc417';g.font=Math.max(15,Math.round(15*Kv))+'px Tahoma, sans-serif';
    g.textAlign='center';g.textBaseline='middle';
    g.fillText(t('no data yet'),W/2,H/2);return;
  }
  let lo=Infinity,hi=-Infinity;
  data.forEach(c=>{lo=Math.min(lo,c.l);hi=Math.max(hi,c.h);});
  if(hi-lo<1e-6){hi=lo+1;lo=Math.max(0,lo-1);}
  const pad=6, y=v=>pad+(hi-v)/(hi-lo)*(H-pad*2);
  /* grade */
  g.strokeStyle='rgba(168,232,50,.10)';g.lineWidth=1;
  for(let i=1;i<4;i++){const yy=Math.round(pad+(H-pad*2)*i/4)+.5;g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke();}
  const step=W/data.length, bw=Math.max(1,Math.min(9,step*0.62));
  data.forEach((c,i)=>{
    const x=i*step+step/2, up=c.c>=c.o;
    g.strokeStyle=up?'#8ef0b2':'#d24b3a';
    g.fillStyle=up?'#4d7a14':'#8a2b20';
    g.beginPath();g.moveTo(Math.round(x)+.5,y(c.h));g.lineTo(Math.round(x)+.5,y(c.l));g.stroke();
    const a=y(c.o),b=y(c.c);
    const top=Math.min(a,b),h=Math.max(1.5,Math.abs(b-a));
    g.fillRect(Math.round(x-bw/2),top,Math.round(bw),h);
    g.strokeRect(Math.round(x-bw/2)+.5,Math.round(top)+.5,Math.round(bw)-1,Math.round(h)-1);
  });
  /* linha do ultimo preco */
  const last=data[data.length-1].c;
  g.strokeStyle='rgba(212,255,107,.45)';g.setLineDash([3,3]);
  g.beginPath();g.moveTo(0,y(last));g.lineTo(W,y(last));g.stroke();g.setLineDash([]);
}
function drawGasCurve(cv){
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const W=cv.clientWidth||210,H=cv.clientHeight||54;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#0a1204';g.fillRect(0,0,W,H);
  const h0=8,h1=dayEndHour();
  const pts=[];let mx=0.7;
  for(let h=h0;h<=h1;h+=0.25){const p=gasPct(h);pts.push([h,p]);mx=Math.max(mx,p);}
  const X=h=>(h-h0)/(h1-h0)*W, Y=p=>H-4-(p/mx)*(H-10);
  /* faixa "barato" */
  g.fillStyle='rgba(143,240,178,.10)';
  g.fillRect(0,Y(0.30),W,Math.max(1,H-4-Y(0.30)));
  g.beginPath();
  pts.forEach((p,i)=>{i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1]));});
  g.strokeStyle='#e8c060';g.lineWidth=1.6;g.stroke();
  g.lineTo(W,H);g.lineTo(0,H);g.closePath();
  g.fillStyle='rgba(232,192,96,.16)';g.fill();
  /* agora */
  const hn=G.hour+G.min/60;
  if(hn>=h0&&hn<=h1){
    const x=Math.round(X(hn))+.5;
    g.strokeStyle='#d4ff6b';g.lineWidth=1;
    g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();
    g.fillStyle='#d4ff6b';g.beginPath();g.arc(X(hn),Y(gasPct(hn)),2.6,0,6.283);g.fill();
  }
  /* mesma historia: 9px de VT323 e um borrao. Numero curto pode ficar em
     VT323, mas precisa de +6px e de uma cor que apareca no fundo escuro. */
  const Kg=(typeof uiScale==='function')?uiScale():1;
  const fg=Math.max(17,Math.round(17*Kg));
  g.font=fg+'px "VT323", monospace';g.textBaseline='alphabetic';
  g.fillStyle='rgba(10,18,4,.75)';g.fillRect(0,H-fg,W,fg);
  g.fillStyle='#9fd44a';g.textAlign='left';
  g.fillText('08h',3,H-2);g.textAlign='right';g.fillText(pad2(h1%24)+'h',W-3,H-2);
}

/* ---------- ligar, desligar, arrastar ---------- */
function wgtOn(id){
  /* MODO HISTORIA: o painel so existe depois que a historia o entregou.
     A preferencia do jogador (ligado/desligado) continua valendo DEPOIS disso
     — quem desligou o gas tracker no dia 9 nao o ve voltar sozinho no dia 10. */
  if(typeof unlocked==='function'&&!unlocked('wgt_'+id))return false;
  return !!prefMap('wgt')[id];
}
function wgtToggle(id){
  const m=prefMap('wgt');
  m[id]=wgtOn(id)?0:1;
  SFX.click();
  buildWidgets();prefSave();
  return !!m[id];
}
function wgtRefresh(id){
  const box=$('#wgt_'+id);
  if(box&&WGT[id]&&WGT[id].refresh)try{WGT[id].refresh(box);}catch(e){}
}
function refreshWidgets(){Object.keys(WGT).forEach(wgtRefresh);}
function buildWidgets(){
  /* o relogio por ultimo: no celular ele nao entra na coluna dos outros dois
     (e o empilhamento de la precisa do Kaiju Charts ja montado) */
  const ordem=Object.keys(WGT).sort((a,b)=>(a==='clock'?1:0)-(b==='clock'?1:0));
  ordem.forEach(id=>{
    const W=WGT[id];
    let box=$('#wgt_'+id);
    if(!wgtOn(id)){if(box)box.remove();return;}
    if(box)return;
    box=el('div','wgt');
    box.id='wgt_'+id;
    box.innerHTML=`<div class="wg-tt">${pixSVG(W.ico,12,'wg-ico')}<span>${t(W.title)}</span>
        <button class="wg-x" data-wx="${id}" title="${t('Close')}">×</button></div>
      <div class="wg-body">${W.body()}</div>
      <div class="wg-rs" data-wrs="1" title="${t('Resize')}"></div>`;
    const K=(typeof uiScale==='function')?uiScale():1;
    const sz=prefMap('wgtSize')[id];
    box.style.width=Math.round((sz&&sz[0]?sz[0]:W.w*K))+'px';
    if(sz&&sz[1])box.style.setProperty('--wgh',sz[1]+'px');
    const p=prefMap('wgtPos')[id];
    const B=UI.bounds();
    /* a posicao guardada e presa a tela DE AGORA pela LARGURA INTEIRA do
       painel: guardar num monitor grande e voltar num pequeno nao pode deixar
       metade do painel pra fora */
    const wpx=parseInt(box.style.width)||Math.round(W.w*K);
    if(p){box.style.left=clamp(p[0],0,Math.max(0,B.w-wpx))+'px';box.style.top=clamp(p[1],0,Math.max(0,B.h-40))+'px';box.style.right='auto';}
    else if(wgtMobile()){
      /* no celular a coluna continua nascendo NO TOPO, encostada na direita:
         embaixo fica a barra de acoes e o polegar. */
      if(id==='clock'){
        box.style.right='auto';
        box.style.left=Math.round(clamp(B.w*0.42,0,Math.max(0,B.w-wpx)))+'px';
        box.style.top=Math.round(Math.max(0,B.h-140*K))+'px';
      }else{
        const hud=document.getElementById('hud');
        const base=(hud&&hud.style.display!=='none')?(hud.getBoundingClientRect().bottom+10):14;
        const prev=document.getElementById('wgt_chart');
        const top=(id==='chart'||!prev)?base:(prev.getBoundingClientRect().bottom+8);
        box.style.right='12px';box.style.top=Math.round(top)+'px';
      }
    }
    else{
      /* nunca foi arrastado: entra na pilha de fabrica do canto de baixo a
         direita. A posicao boa so da pra calcular DEPOIS que todos existirem
         (a altura de cada painel depende do conteudo), entao aqui vai so um
         lugar provisorio ja no canto — wgtStackDefaults() arruma a pilha. */
      box.dataset.wauto='1';
      box.style.right='auto';
      box.style.left=Math.round(Math.max(0,B.w-wpx-12))+'px';
      box.style.top=Math.round(Math.max(0,B.h-160*K))+'px';
    }
    $('#screen').appendChild(box);
    $('[data-wx]',box).onclick=e=>{e.stopPropagation();SFX.close();wgtToggle(id);};
    wgtDrag(box,id);
    wgtResize(box,id,W);
    if(W.mount)W.mount(box);
    if(W.refresh)W.refresh(box);
  });
  /* agora que os painéis existem de verdade da pra medir a altura deles e
     garantir que nenhum nasceu por baixo da barra de tarefas */
  wgtClampAll();
  refreshWidgets();
}
/* ---------- a pilha de fabrica: canto de baixo a direita ----------
   Quem nunca arrastou um painel encontra os tres empilhados no canto de baixo
   a direita, alinhados pela direita e com folga da barra de tarefas: o Kaiju
   Charts encostado no canto, o RELOGIO logo acima dele e o Gas Tracker por
   cima de tudo. Painel que o jogador ja arrastou tem posicao guardada em
   prefs('wgtPos') e NAO passa por aqui — save antigo nao pula de lugar.
   A pilha e montada com os painéis que EXISTEM agora (o gas chega depois, pela
   historia), entao quem falta nao deixa buraco. */
/* ORDEM DE CHEGADA, nao ordem fixa. Com a ordem fixa (chart embaixo, relogio,
   gas) o Kaiju Charts chegava no dia 6 e se enfiava POR BAIXO do relogio que o
   jogador olhava desde o dia 1 — a pilha inteira subia um degrau. O jogador
   via a mesa dele se reorganizar sozinha. Agora quem chega primeiro fica
   embaixo e quem chega depois entra em cima; ninguem que ja estava se mexe.
   A ordem e guardada em pref('wgtOrder') pra sobreviver ao reload. */
function wgtArrival(id){
  const M=prefMap('wgtOrder');
  if(typeof M[id]==='number')return M[id];
  const n=Object.keys(M).length;
  M[id]=n;
  try{setPref('wgtOrder',M,true);}catch(e){}
  return n;
}
function wgtMobile(){
  return (typeof IS_MOB!=='undefined'&&IS_MOB)||document.body.classList.contains('mob');
}
function wgtStackDefaults(){
  if(wgtMobile())return;
  const pilha=Object.keys(WGT).map(id=>document.getElementById('wgt_'+id))
    .filter(b=>b&&b.dataset.wauto&&b.offsetWidth>0)
    .sort((a,b)=>wgtArrival(a.id.slice(4))-wgtArrival(b.id.slice(4)));
  if(!pilha.length)return;
  const B=UI.bounds();
  if(!(B.w>0&&B.h>0))return;
  const K=(typeof uiScale==='function')?uiScale():1;
  const gap=Math.round(8*K), borda=12;
  /* B.h ja desconta a barra de tarefas: o piso e a beirada de baixo da mesa */
  let piso=B.h-Math.round(10*K);
  /* a Kaiju Wallet pode ter sido arrastada pro canto de baixo. Se ela estiver
     na metade de baixo da coluna da direita, a pilha comeca ACIMA dela em vez
     de nascer escondida por baixo. */
  const hud=document.getElementById('hud');
  if(hud&&hud.offsetWidth>0&&getComputedStyle(hud).display!=='none'){
    const s=$('#screen').getBoundingClientRect(), r=hud.getBoundingClientRect();
    const hl=r.left-s.left, hr=r.right-s.left, ht=r.top-s.top, hb=r.bottom-s.top;
    const larg=Math.max.apply(null,pilha.map(b=>b.offsetWidth));
    const colL=B.w-larg-borda;
    if(hr>colL&&hl<B.w-borda&&(ht+hb)/2>B.h/2)piso=Math.min(piso,ht-gap);
  }
  let y=piso;
  pilha.forEach(box=>{
    const w=box.offsetWidth, h=box.offsetHeight;
    box.style.right='auto';
    box.style.left=Math.round(clamp(B.w-w-borda,0,Math.max(0,B.w-w)))+'px';
    box.style.top=Math.round(clamp(y-h,0,Math.max(0,B.h-Math.min(h,B.h))))+'px';
    y=y-h-gap;
  });
}
/* a tela encolheu (girar o celular, arrastar a borda da janela): nenhum painel
   pode ficar pendurado pra fora */
function wgtClampAll(){
  /* quem nunca foi arrastado volta pro canto: a pilha acompanha a tela nova */
  wgtStackDefaults();
  const B=UI.bounds();
  document.querySelectorAll('.wgt').forEach(box=>{
    const w=box.offsetWidth,h=box.offsetHeight;
    if(!w)return;
    const x=clamp(box.offsetLeft,0,Math.max(0,B.w-w));
    const y=clamp(box.offsetTop,0,Math.max(0,B.h-Math.min(h,B.h)));
    if(x!==box.offsetLeft||y!==box.offsetTop){
      box.style.right='auto';box.style.left=x+'px';box.style.top=y+'px';
    }
  });
}
function wgtDrag(box,id){
  const bar=$('.wg-tt',box);
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    e.preventDefault();
    const r=box.getBoundingClientRect();
    const ox=r.left,oy=r.top,sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    box.style.left=ox+'px';box.style.top=oy+'px';box.style.right='auto';
    box.classList.add('dragging');
    try{bar.setPointerCapture(pid);}catch(_){}
    const mv=v=>{
      if(v.pointerId!==pid)return;
      const B=UI.bounds();
      box.style.left=clamp(ox+v.clientX-sx,0,Math.max(0,B.w-box.offsetWidth))+'px';
      box.style.top=clamp(oy+v.clientY-sy,0,Math.max(0,B.h-26))+'px';
    };
    const up=v=>{
      if(v.pointerId!==pid)return;
      bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);bar.removeEventListener('pointercancel',up);
      try{bar.releasePointerCapture(pid);}catch(_){}
      box.classList.remove('dragging');
      /* saiu do lugar de fabrica: daqui pra frente a pilha nao manda mais nele */
      delete box.dataset.wauto;
      prefMap('wgtPos')[id]=[box.offsetLeft,box.offsetTop];
      prefSave();
    };
    bar.addEventListener('pointermove',mv);bar.addEventListener('pointerup',up);bar.addEventListener('pointercancel',up);
  });
}

/* ---------- redimensionar pelo canto ---------- */
function wgtResize(box,id,W){
  const h=$('[data-wrs]',box);
  if(!h)return;
  h.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    const canvas=$('canvas',box);
    const w0=box.offsetWidth, h0=canvas?canvas.getBoundingClientRect().height:86;
    const sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    box.classList.add('resizing');
    try{h.setPointerCapture(pid);}catch(_){}
    const mv=v=>{
      if(v.pointerId!==pid)return;
      const B=UI.bounds();
      const w=clamp(w0+(v.clientX-sx),150,Math.min(560,B.w-box.offsetLeft-4));
      const hh=clamp(h0+(v.clientY-sy),44,340);
      box.style.width=Math.round(w)+'px';
      box.style.setProperty('--wgh',Math.round(hh)+'px');
      if(W.refresh)W.refresh(box);
    };
    const up=v=>{
      if(v.pointerId!==pid)return;
      h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);
      try{h.releasePointerCapture(pid);}catch(_){}
      box.classList.remove('resizing');
      prefMap('wgtSize')[id]=[box.offsetWidth,parseInt(box.style.getPropertyValue('--wgh'))||0];
      prefSave();
      if(W.refresh)W.refresh(box);
      /* mudou de tamanho: a pilha de fabrica se reencaixa no canto */
      wgtClampAll();
    };
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
  });
  /* dois cliques no canto volta ao tamanho de fabrica */
  h.addEventListener('dblclick',e=>{
    e.stopPropagation();SFX.click();
    const K=(typeof uiScale==='function')?uiScale():1;
    box.style.width=Math.round(W.w*K)+'px';
    box.style.removeProperty('--wgh');
    delete prefMap('wgtSize')[id];
    prefSave();
    if(W.refresh)W.refresh(box);
    wgtClampAll();
  });
}
