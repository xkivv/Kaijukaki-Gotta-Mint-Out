/* ================= DESKTOP + BOOT ================= */
const DESK_ICONS=[
 {id:'site',      ico:'globe',  lbl:'Kaijukaki.net'},
 {id:'hubmarket', ico:'market', lbl:'Kaiju Market', badge:'mkt', dot:'warn'},
 {id:'hubwallet', ico:'wallet', lbl:'Kaiju Wallet'},
 {id:'hubsocial', ico:'kaki', lbl:'Kaki+', badge:'dm', dot:'dm'},
  {id:'shop',      ico:'coin',   lbl:'Kaiju Shop'},
 {id:'free',      ico:'gift',   lbl:'Kakizone', dot:'alert'},
 {id:'spot',      ico:'book',   lbl:'Kaiju Spotter', dot:'alert'},
 {id:'media',     ico:'music',  lbl:'Kaiju Media Player'},
 {id:'tax',       ico:'kaiju',  lbl:'Mr. Kaiju', dot:'alert'},
 {id:'inbox',     ico:'mail',   lbl:'Kaiju Inbox', badge:'mail'},
 {id:'readme',    ico:'notepad',lbl:'readme.txt'},
 /* APP DE FABRICA: o Kaiju Log ja vem com o computador. Ninguem apresenta,
    ninguem fala dele, nao tem bolinha e nao ocupa lugar na mesa — quem quiser
    reler as conversas abre pelo menu Iniciar. `stock` e o que o tira da mesa. */
 {id:'story_log', ico:'chat',   lbl:'Kaiju Log', stock:1},
 {id:'bin',       ico:'bin',    lbl:'Recycle Bin'},
 {id:'shutdown',  ico:'power',  lbl:'End the day'}
];
/* A GRADE DOS ICONES escala com a interface E com o texto. So com a interface,
   em Interface Large + Texto Large o rotulo crescia 22% e a grade nao: os
   icones se colavam e "Kaijukaki.net" quebrava em "Kaijukaki.n / et". A largura
   da coluna tem que caber o rotulo mais largo do jogo numa linha, em qualquer
   combinacao; a altura precisa de duas linhas de rotulo mais respiro. */
const ICON_W0=104, ICON_H0=98;
const TXT_SCALE={s:.88,m:1,l:1.22};
function txtScale(){try{return TXT_SCALE[textSize()]||1;}catch(e){return 1;}}
function iconW(){const u=(typeof uiScale==='function'?uiScale():1);return Math.round(ICON_W0*u*txtScale());}
function iconH(){const u=(typeof uiScale==='function'?uiScale():1);return Math.round(ICON_H0*u*txtScale());}
/* ---------- A MESA MEDIDA PELO LAYOUT, NUNCA PELO RETANGULO PINTADO ----------
   O BUG QUE ISTO CONSERTA (icones na horizontal, no topo da tela):
   na virada do dia a tela faz o desligamento de TV — #screen ganha .crtoff,
   que e um scaleY(.004) de ~1,6s (26-flow.js, dayTransition). E o momento em
   que a historia destrava icone novo e chama buildDesktop(). Acontece que
   getBoundingClientRect() CONTA a transformacao: no meio da animacao
   UI.bounds() devolvia altura de ~15px. Com 15px de altura cabe UM icone por
   coluna, entao a coluna da esquerda virava uma FILEIRA no topo — e como nada
   redesenha a mesa depois, ela ficava assim o resto da sessao.
   clientWidth/clientHeight sao caixa de LAYOUT: transformacao de CSS nao
   encosta neles. E, por garantia, area menor que dois icones nunca vira
   geometria: a ultima medida boa vale mais do que uma medida absurda. */
let DESK_OK={w:0,h:0};
function deskArea(){
  const d=$('#desktop');
  let w=d?d.clientWidth:0, h=d?d.clientHeight:0;
  if(!(w>1)||!(h>1)){try{const B=UI.bounds();w=B.w;h=B.h;}catch(e){}}
  if(w>=iconW()&&h>=iconH()*2){DESK_OK={w,h};return {w,h};}
  if(DESK_OK.h)return {w:DESK_OK.w,h:DESK_OK.h};
  return {w:Math.max(iconW(),w||iconW()),h:Math.max(iconH()*2,h||iconH()*2)};
}
/* A REGRA DA MESA: uma coluna a esquerda, de cima pra baixo. Quando nao cabe
   mais, comeca uma SEGUNDA COLUNA a direita da primeira. Nunca uma fileira. */
function defaultIconPos(i){
  const A=deskArea();
  const perCol=Math.max(1,Math.floor((A.h-16)/iconH()));
  return [8+Math.floor(i/perCol)*iconW(), 10+(i%perCol)*iconH()];
}
/* ---------- NINGUEM SE MEXE ----------
   Antes, quem nao tinha posicao salva recebia defaultIconPos(indice) — e o
   indice mudava toda vez que a historia entregava um icone novo no meio da
   lista. Resultado: destravar o Kakizone empurrava a Lixeira, o readme e o
   Iniciar-o-dia um degrau pra baixo, e a mesa que o jogador conhecia virava
   outra. Agora cada icone recebe um SLOT da grade na primeira vez que aparece
   e guarda esse slot pra sempre. Icone novo ocupa o primeiro buraco livre.
   Icone arrastado tem posicao em pixel e manda mais que o slot. */
function iconSlotOf(id,tomados){
  const M=prefMap('iconSlot');
  if(typeof M[id]==='number'){tomados.add(M[id]);return M[id];}
  let k=0; while(tomados.has(k))k++;
  M[id]=k; tomados.add(k);
  try{setPref('iconSlot',M,true);}catch(e){}
  return k;
}
/* o slot que uma posicao em pixel ocupa na grade — pra icone arrastado
   reservar o lugar dele e ninguem nascer em cima */
function slotOfPx(p){
  const A=deskArea();
  const perCol=Math.max(1,Math.floor((A.h-16)/iconH()));
  const col=Math.max(0,Math.round((p[0]-8)/iconW()));
  const row=Math.max(0,Math.min(perCol-1,Math.round((p[1]-10)/iconH())));
  return col*perCol+row;
}
/* o retangulo pontilhado que mostra a celula de destino durante o arrasto */
function deskGhost(slot){
  let g=document.querySelector('.dghost');
  if(slot==null){if(g)g.remove();return;}
  if(!g){g=el('div','dghost');const d=$('#desktop');if(d)d.appendChild(g);}
  const p=defaultIconPos(slot);
  g.style.left=p[0]+'px';g.style.top=p[1]+'px';
  g.style.width=iconW()+'px';g.style.height=iconH()+'px';
}
let ICON_TOMADOS=null;
function iconPos(id,i){
  const p=prefMap('iconPos')[id];
  if(p)return p;
  if(!ICON_TOMADOS)ICON_TOMADOS=new Set();
  return defaultIconPos(iconSlotOf(id,ICON_TOMADOS));
}
/* ---------- O QUE A HISTORIA JA ENTREGOU ----------
   MODO HISTORIA: a area de trabalho comeca pequena e cresce. Ver 58-story.js.
   Um id que nao esta em LOCKABLE passa direto, entao icone novo nunca nasce
   escondido por acidente.
   EXCECAO, DE PROPOSITO: o readme.txt. Antes ele chegava quando um
   personagem dizia "deixei um bloco de notas na sua area de trabalho" — o que
   quer dizer que um estranho mexeu no PC do jogador. Isso quebra a imersao
   inteira do jogo. O arquivo e SEU e sempre foi: nasce na mesa junto com os
   quatro primeiros, no primeiro segundo. */
function iconLive(id){
  if(id==='readme')return true;
  /* app ainda baixando nao esta na mesa */
  if(typeof dlPending==='function'&&dlPending(id))return false;
  return typeof unlocked!=='function'||unlocked(id);
}
/* ---------- O QUE O JOGADOR ESCOLHEU MANTER NA MESA ----------
   Isto NAO e progressao: e arrumacao. Um app escondido continua destravado —
   ele so nao esta em cima da mesa, e o menu Iniciar continua abrindo tudo. */
function iconHidden(id){
  try{return !!prefMap('iconHide')[id];}catch(e){return false;}
}
/* todos os icones que a historia ja entregou, escondidos ou nao */
function deskAppList(){return DESK_ICONS.filter(i=>iconLive(i.id));}
/* ================= MODO HISTORIA: AS BOLINHAS SO ANUNCIAM O QUE JA EXISTE =================
   dotState() (24-state.js, nao e meu arquivo) decide o que acende cada
   bolinha da mesa, e ele nao sabe que a historia entrega as coisas aos poucos.
   O BUG: o Kakizone chegava no dia 4 com a bolinha vermelha acesa porque uma
   missao diaria ja tinha sido cumprida — mas o cartao de missoes so aparece
   no dia 5 (f_quests). O jogador abria, nao achava nada pra receber e a
   bolinha continuava la. O mesmo valia pra oferta antes da aba de ofertas,
   pra DM antes da aba de mensagens, pro marco antes dos marcos.
   A REGRA: uma bolinha so acende se o APP e o RECURSO que ela anuncia ja
   foram destravados. Nao e a chegada do icone (o icone nem existe antes de
   unlocked(app)) — e o que tem DENTRO dele. Quem muda o estado continua
   chamando refreshDots()/UI.refresh(): os dois perguntam dotState() pelo
   nome, entao embrulhar aqui alcanca todo mundo. 40-boot.js carrega por
   ultimo, por isso o embrulho mora aqui e nao la. */
const DOT_GATE={
  /* Kakizone: o freemint do dia e o app em si; missao e marco sao cartoes
     que chegam depois (b_quests) e cada um tem a sua chave */
  free:      ()=>unlocked('free'),
  tax:       ()=>unlocked('tax'),
  spot:      ()=>unlocked('spot'),
  hubmarket: ()=>unlocked('hubmarket')&&unlocked('tab_mkt_offers'),   /* a bolinha amarela e "tem oferta" */
  hubsocial: ()=>unlocked('hubsocial')&&unlocked('tab_dm')            /* a bolinha e "tem DM nao lida" */
};
if(typeof dotState==='function'&&typeof unlocked==='function'){
  const _dotState=dotState;
  dotState=function(){
    const st=_dotState()||{};
    if(!G)return st;
    try{
      Object.keys(DOT_GATE).forEach(k=>{if(st[k]&&!DOT_GATE[k]())st[k]=false;});
      /* O Kakizone tem tres motivos pra acender e o dotState() devolve so o
         OU deles. Refaz a conta por partes: freemint do dia (o app), missao
         pronta (f_quests) e marco batido (f_milestones), cada uma atras da
         propria chave. */
      if(st.free){
        const dia=G.claimDay!==G.day;
        const missao=unlocked('f_quests')&&typeof questsPending==='function'&&questsPending()>0;
        const marco=unlocked('f_milestones')&&[10,100,1000].some(r=>
          Math.max(held(),+G.peakHeld||0)>=r&&!(G.goals||[]).includes(r));
        st.free=dia||missao||marco;
      }
    }catch(e){}
    return st;
  };
}
function desktopItems(){
  /* os apps de fabrica (stock) nunca vao pra mesa: existem, abrem pelo menu
     Iniciar, e nao pedem apresentacao nenhuma. */
  return deskAppList().filter(i=>!i.stock&&!iconHidden(i.id))
    .concat(userNotes().map(n=>({id:'note:'+n.name,ico:'notepad',lbl:n.name,note:true})));
}
/* ================= MODO HISTORIA: A HORA DE APARECER =================
   Um icone que so existe no proximo desenho da mesa nao vale nada. O que a
   historia entrega tem que CHEGAR: entra com animacao, faz um som curto e
   fica com um selo NOVO ate o jogador abrir aquilo uma vez.
   O estado mora em G.story, em campos que sao meus (o motor de 58-story.js
   nao encosta neles):
     kn = o que a interface ja mostrou alguma vez — e assim que da pra saber
          o que e chegada NOVA e o que sempre esteve la
     nw = o que chegou e ainda nao foi aberto — o selo
   Serve pra icone da mesa e pra aba de janela, que e o mesmo problema. */
function stNew(){
  if(typeof story!=='function')return null;
  const S=story();
  if(!S.kn||typeof S.kn!=='object')S.kn={};
  if(!S.nw||typeof S.nw!=='object')S.nw={};
  return S;
}
/* Devolve quais destes ids estao chegando AGORA.
   A primeira passada de um save nao anuncia nada: storyMigrate abre o jogo
   inteiro de uma vez pra quem ja jogava, e acordar com dezoito selos NOVO na
   cara seria pior do que nao ter selo nenhum. */
function stArrivals(ids){
  const S=stNew();if(!S)return [];
  if(!S.knv){
    S.knv=1;
    Object.keys(S.un||{}).forEach(k=>{S.kn[k]=1;});
    ids.forEach(id=>{S.kn[id]=1;});
    return [];
  }
  const novos=ids.filter(id=>!S.kn[id]);
  if(!novos.length)return [];
  /* O QUE O PRIMEIRO MOMENTO ENTREGA NAO GANHA SELO.
     No dia 1 tudo e novo por definicao: os quatro icones de abertura sao o
     estado inicial do jogo, nao uma chegada, e quatro selos NOVO na primeira
     tela sao exatamente o barulho que este modo existe pra tirar. Eles entram
     com a animacao do mesmo jeito — so nao ficam marcados. */
  const base={readme:1};   /* o readme e estado inicial, nao chegada */
  try{
    const ab=BEATS.find(x=>x.id==='b_open');
    if(ab)(ab.un||[]).forEach(u=>{base[u]=1;});
  }catch(e){}
  novos.forEach(id=>{S.kn[id]=1;if(!base[id])S.nw[id]=G.day||1;});
  return novos;
}
/* O selo NOVO vencia: quem ignorou o Spotter ficava com a etiqueta na mesa pra
   sempre, e dez selos permanentes viram exatamente o ruido que este modo
   existe pra tirar. Tres dias e o bastante pra reparar; depois disso o app
   simplesmente faz parte da mesa. */
const NEW_TAG_DAYS=3, NEW_TAG_MAX=3;
function stIsNew(id){
  const S=stNew();
  if(!S||!S.nw[id])return false;
  const d=+S.nw[id]||1;
  if((G.day||1)-d>NEW_TAG_DAYS){delete S.nw[id];return false;}
  /* TETO DE TRES SELOS NA TELA.
     Num ritmo normal chegam um ou dois por dia e isso nunca aperta. Mas quem
     volta depois de sumir, ou joga rapido, podia acordar com dez etiquetas na
     mesa — que e exatamente o ruido que este modo existe pra tirar. Ficam as
     TRES MAIS RECENTES; o resto continua contando como nao aberto (o app
     ainda e novo pro jogador), so nao grita. */
  const vivos=Object.keys(S.nw)
    .filter(k=>(G.day||1)-(+S.nw[k]||1)<=NEW_TAG_DAYS)
    .sort((a,b)=>(+S.nw[b]||0)-(+S.nw[a]||0));
  if(vivos.length<=NEW_TAG_MAX)return true;
  return vivos.slice(0,NEW_TAG_MAX).indexOf(id)>=0;
}
/* abriu uma vez: o selo some e nao volta */
function stOpened(id){
  const S=stNew();
  if(!S||!S.nw[id])return false;
  delete S.nw[id];
  save();
  return true;
}
/* ---------- as abas ----------
   Uma aba que nasce dentro de uma janela ja aberta tem o mesmo direito de
   chegar que um icone. Serve pro hub (data-ht) e pro mercado (data-t). */
function stTagTabs(box,attr,mapa,atual){
  if(!box)return;
  const nos=[...box.querySelectorAll('.tab')].filter(n=>mapa[n.dataset[attr]]);
  if(!nos.length)return;
  const chegando=stArrivals(nos.map(n=>mapa[n.dataset[attr]]));
  /* a aba aberta na cara do jogador ja conta como vista */
  if(atual&&mapa[atual])stOpened(mapa[atual]);
  nos.forEach(n=>{
    const id=mapa[n.dataset[attr]];
    if(chegando.indexOf(id)>=0)n.classList.add('tab-arrive');
    if(stIsNew(id)&&!$('.newdot',n))n.insertAdjacentHTML('beforeend','<i class="newdot"></i>');
  });
  if(chegando.length)SFX.open();
}
/* que aba do hub corresponde a que id da historia. renderHub() mora em
   42-hubs.js e nao e meu arquivo: em vez de editar la, a funcao e embrulhada
   aqui embaixo — o hub desenha do jeito dele e a marcacao entra depois. */
const HUB_TAB_LOCK={binder:'tab_binder',profile:'tab_profile',dm:'tab_dm',vault:'tab_vault'};
if(typeof renderHub==='function'){
  const _renderHub=renderHub;
  renderHub=function(hid,b,ent){
    _renderHub(hid,b,ent);
    try{
      stTagTabs($('.hubtabs',b),'ht',HUB_TAB_LOCK,ent&&ent.tab);
      /* Uma aba sozinha nao e aba: a barra some pelo CSS e o titulo para de
         repetir a si mesmo ("Kaiju Wallet — Wallet"). Quando a segunda aba
         chega, os dois voltam juntos. */
      const n=$$('.hubtab',b).length;
      const ttl=ent&&ent.win&&ent.win.querySelector('.ttl');
      if(ttl&&n<2&&HUB_DEF[hid])ttl.textContent=t(HUB_DEF[hid].title);
    }catch(e){}
  };
}
/* a conversa de abertura ja aconteceu e ninguem esta falando? */
function storyOpened(){
  try{
    const S=G&&G.story; if(!S||!S.seen||!S.seen.b_open)return false;
    return !(Array.isArray(S.q)&&S.q.length);
  }catch(e){return false;}
}
function buildDesktop(stagger){
  const d=$('#desktop');d.innerHTML='';
  /* deskArea(), nao UI.bounds(): ver o comentario em defaultIconPos */
  const B=deskArea();
  const itens=desktopItems();
  const chegando=stArrivals(itens.filter(i=>!i.note).map(i=>i.id));
  /* reserva primeiro os lugares de quem foi arrastado e de quem ja tem slot,
     pra o icone novo nascer num buraco de verdade */
  ICON_TOMADOS=new Set();
  try{
    const PX=prefMap('iconPos'), SL=prefMap('iconSlot');
    itens.forEach(i=>{ if(typeof SL[i.id]==='number')ICON_TOMADOS.add(SL[i.id]); if(PX[i.id])ICON_TOMADOS.add(slotOfPx(PX[i.id])); });
  }catch(e){}
  itens.forEach((i,idx)=>{
    const locked=false;
    const e=el('div','dicon'+(locked?' locked':''));
    if(!(typeof IS_MOB!=='undefined'&&IS_MOB)){
      const p=iconPos(i.id,idx);
      e.style.left=clamp(p[0],0,Math.max(0,B.w-iconW()))+'px';
      e.style.top=clamp(p[1],0,Math.max(0,B.h-iconH()))+'px';
    }
    e.dataset.icon=i.id;
    /* carteira criada, site ainda nao visitado E a conversa de abertura ja
       terminou: so ai o icone pede pra ser aberto. Antes a etiqueta nascia
       junto com a mesa, antes de alguem ter dito uma palavra — e a fala
       de abertura termina justamente apontando pra este icone. Dois avisos
       ao mesmo tempo, um deles antes da hora. */
    const nudge=i.id==='site'&&G.walletMade&&!G.netSeen&&storyOpened();
    if(nudge)e.classList.add('nudge');
    e.innerHTML=pixSVG(i.ico,52,'glyph')+`<span class="lbl">${t(i.lbl)}</span>`+
      (i.badge?`<span class="badge" id="dbadge_${i.badge}" style="display:none">0</span>`:'')+
      (i.dot?`<span class="ndot ${i.dot}" id="ndot_${i.id}" style="display:none"></span>`:'')+
      /* o selo NOVO nao se acumula com o COMECE AQUI: dois avisos no mesmo
         icone viram dois avisos que ninguem le */
      ((stIsNew(i.id)&&!nudge)?`<span class="newtag">${t('NEW')}</span>`:'')+
      (nudge?`<span class="nudgetag">${t('START HERE')}</span>`:'');
    /* a chegada manda mais que o stagger do boot: quem acabou de aparecer
       entra com a animacao propria, um atras do outro */
    const chega=chegando.indexOf(i.id);
    if(chega>=0){e.classList.add('arriving');e.style.animationDelay=(chega*110)+'ms';}
    else if(stagger){e.classList.add('popin');e.style.animationDelay=(idx*70)+'ms';}
    let last=0,moved=false;
    e.addEventListener('click',()=>{
      if(moved){moved=false;return;}
      $$('.dicon').forEach(x=>x.classList.remove('sel'));e.classList.add('sel');
      SFX.down();
      const now=Date.now();
      if(e.__lpFired&&e.__lpFired())return;
      if(now-last<420||(typeof IS_MOB!=='undefined'&&IS_MOB)){haptic(10);launch(i.id);last=0;}
      else last=now;
    });
    e.addEventListener('dblclick',()=>launch(i.id));
    e.addEventListener('contextmenu',ev=>{
      ev.preventDefault();ev.stopPropagation();
      $$('.dicon').forEach(x=>x.classList.remove('sel'));e.classList.add('sel');
      iconMenu(ev.clientX,ev.clientY,i);
    });
    if(typeof longPress==='function')longPress(e,(x,y)=>{
      $$('.dicon').forEach(x2=>x2.classList.remove('sel'));e.classList.add('sel');
      iconMenu(x,y,i);ctxTouchGuard();
    });
    /* drag to rearrange */
    e.addEventListener('pointerdown',ev=>{
      if(typeof IS_MOB!=='undefined'&&IS_MOB)return;
      if(ev.pointerType==='mouse'&&ev.button!==0)return;
      const sx=ev.clientX,sy=ev.clientY,ox=e.offsetLeft,oy=e.offsetTop,pid=ev.pointerId;
      let started=false;
      /* ---- POR QUE ISTO EXISTE ----
         Arrastar QUALQUER icone pra lixeira nao fazia nada: o icone arrastado
         anda junto com o cursor, entao elementFromPoint devolvia ELE mesmo e
         nunca a lixeira embaixo. O icone so ficava por cima do outro. Aqui a
         gente tira o proprio icone do teste de acerto por um instante — o
         tempo de perguntar o que tem embaixo dele. */
      const embaixo=(x,y)=>{
        const pe=e.style.pointerEvents;
        e.style.pointerEvents='none';
        const n=document.elementFromPoint(x,y);
        e.style.pointerEvents=pe;
        return n;
      };
      const mv=v=>{
        if(v.pointerId!==pid)return;
        if(!started&&Math.abs(v.clientX-sx)+Math.abs(v.clientY-sy)<7)return;
        if(!started){started=true;moved=true;e.classList.add('dragging-icon');
          try{e.setPointerCapture(pid);}catch(_){}}
        v.preventDefault();
        const BB=deskArea();
        e.style.left=clamp(ox+v.clientX-sx,0,Math.max(0,BB.w-iconW()))+'px';
        e.style.top=clamp(oy+v.clientY-sy,0,Math.max(0,BB.h-iconH()))+'px';
        /* o fantasma da celula: o jogador ve ONDE o icone vai cair antes de
           soltar. Grade de verdade, nao pixel solto. */
        deskGhost(slotOfPx([e.offsetLeft,e.offsetTop]));
        /* a lixeira acende quando o icone passa por cima */
        const el2=embaixo(v.clientX,v.clientY);
        const b2=el2&&el2.closest?el2.closest('[data-icon="bin"]'):null;
        $$('.dicon.bin-hot').forEach(x=>{if(x!==b2)x.classList.remove('bin-hot');});
        if(b2)b2.classList.add('bin-hot');
      };
      const up=v=>{
        if(v.pointerId!==pid)return;
        e.removeEventListener('pointermove',mv);
        e.removeEventListener('pointerup',up);
        e.removeEventListener('pointercancel',up);
        try{e.releasePointerCapture(pid);}catch(_){}
        if(started){
          e.classList.remove('dragging-icon');
          $$('.dicon.bin-hot').forEach(x=>x.classList.remove('bin-hot'));
          /* soltou em cima da lixeira? */
          const over=embaixo(v.clientX,v.clientY);
          const bin=over&&over.closest?over.closest('[data-icon="bin"]'):null;
          deskGhost(null);
          if(bin){binDrop(i,e);return;}
          /* SOLTAR ENCAIXA NA GRADE. Um icone nunca fica "meio fora": ele
             ocupa uma celula. Se a celula ja tem dono, os dois trocam de
             lugar — previsivel, e ninguem some. Posicao em pixel deixa de
             existir: a grade e a unica verdade. */
          const alvo=slotOfPx([e.offsetLeft,e.offsetTop]);
          const SL=prefMap('iconSlot'), IP=prefMap('iconPos');
          const meu=(typeof SL[i.id]==='number')?SL[i.id]:null;
          const dono=Object.keys(SL).find(k=>k!==i.id&&SL[k]===alvo&&iconLive(k)&&!iconHidden(k));
          if(dono!=null){ if(meu!=null)SL[dono]=meu; else{let k=0;const usados=new Set(Object.values(SL));while(usados.has(k))k++;SL[dono]=k;} delete IP[dono]; }
          SL[i.id]=alvo; delete IP[i.id];
          setPref('iconSlot',SL,true);setPref('iconPos',IP,true);
          SFX.down();prefSave();
          buildDesktop();
          setTimeout(()=>{moved=false;},60);
        }
      };
      e.addEventListener('pointermove',mv);
      e.addEventListener('pointerup',up);
      e.addEventListener('pointercancel',up);
    });
    d.appendChild(e);
  });
  /* No celular os icones estao numa grade, nao em coordenadas salvas.
     Um atraso linear de 70ms vira uma fila lenta descendo a coluna;
     medindo a posicao real de cada icone da pra fazer uma onda diagonal,
     que e como um handheld de verdade acorda: canto de cima primeiro. */
  if(stagger&&typeof IS_MOB!=='undefined'&&IS_MOB){
    const ics=$$('.dicon',d);
    if(ics.length){
      const rows=[],cols=[];
      ics.forEach(e=>{
        if(rows.indexOf(e.offsetTop)<0)rows.push(e.offsetTop);
        if(cols.indexOf(e.offsetLeft)<0)cols.push(e.offsetLeft);
      });
      rows.sort((a,b)=>a-b);cols.sort((a,b)=>a-b);
      ics.forEach(e=>{
        const r=rows.indexOf(e.offsetTop),c=cols.indexOf(e.offsetLeft);
        e.style.animationDelay=(60+r*46+c*34)+'ms';
      });
    }
  }
  d.addEventListener('mousedown',e=>{if(e.target===d)$$('.dicon').forEach(x=>x.classList.remove('sel'));});
  d.addEventListener('contextmenu',e=>{
    if(e.target!==d)return;
    e.preventDefault();
    $$('.dicon').forEach(x=>x.classList.remove('sel'));
    desktopMenu(e.clientX,e.clientY);
  });
  if(typeof longPress==='function')longPress(d,(x,y,ev)=>{
    if(ev&&ev.target!==d)return;
    $$('.dicon').forEach(n2=>n2.classList.remove('sel'));
    desktopMenu(x,y);ctxTouchGuard();
  });
  /* Os icones nascem com as bolinhas apagadas (style="display:none") e quem
     acende e o UI.refresh(). Se o desktop e reconstruido DEPOIS do ultimo
     refresh — que e o que acontece no boot — o mint gratis e o turno do
     Spotter ficavam sem aviso ate o jogador mexer em alguma coisa. */
  if(typeof UI!=='undefined'&&UI.refresh)setTimeout(()=>{try{UI.refresh();}catch(e){}},0);
  /* uma coisa chegou na mesa: um som curto, uma vez so pra a leva inteira */
  if(chegando.length){SFX.open();save();}
}

/* ---------- context menus ---------- */
/* ---------- TOQUE LONGO: O MENU NASCE EMBAIXO DO DEDO ----------
   No celular o menu de contexto abre enquanto o dedo ainda esta na tela. Ao
   levantar, o navegador dispara o "click" de compatibilidade no que estiver
   naquele ponto — e o longPress (43-mobile.js) so cancela o pointerup, que
   nao segura esse click. Com o menu do icone isso passava despercebido (o
   dedo cai na borda do menu); com o menu da mesa nao: ele e alto, o ctxMenu
   sobe ele pra caber na tela, e o dedo solta em cima de um item. O jogador
   dava um toque longo na mesa e o "Refresh" rodava sozinho — o menu sumia
   antes de ele ler. O menu fica surdo ate o dedo levantar, mais um instante
   pro click sintetico passar; nunca mais do que isso. */
function ctxTouchGuard(){
  const m=$('.ctxmenu');if(!m)return;
  m.style.pointerEvents='none';
  let feito=false;
  const solta=()=>{if(feito)return;feito=true;setTimeout(()=>{m.style.pointerEvents='';},140);};
  document.addEventListener('pointerup',solta,{once:true,capture:true});
  document.addEventListener('pointercancel',solta,{once:true,capture:true});
  setTimeout(solta,1500);   /* rede de seguranca: surdo pra sempre seria pior que o bug */
}
const UNDELETABLE=['site','hubmarket','hubwallet','shop','free','readme','media','chart'];
function desktopMenu(x,y){
  ctxMenu(x,y,[
    /* Apps: quais icones ficam na mesa. Primeiro item porque a mesa e o
       assunto do menu — os paineis vem depois. */
    {ico:'pc',lbl:t('Apps'),sub:1,fn:()=>appsMenu(x,y)},
    {sep:1},
    {ico:'chart',lbl:(wgtOn('chart')?'✔ ':'○ ')+t('Chart widget'),fn:()=>wgtToggle('chart')},
    {ico:'rocket',lbl:(wgtOn('gas')?'✔ ':'○ ')+t('Gas widget'),fn:()=>wgtToggle('gas')},
    {sep:1},
    {lbl:t('Refresh'),ico:'globe',fn:()=>refreshDesktop()},
    {sep:1},
    /* MODO HISTORIA: as notas chegam com o beat do conforto (b_comfort). Ate
       la a linha nem existe — nada de item cinza no menu. */
    ...(unlocked('f_notes')?[
      {lbl:t('New Text Document'),ico:'notepad',fn:newNote},
      {lbl:t('New Folder'),ico:'vault',fn:()=>errorBox(t('New Folder'),t('Folders are for people who finish things.'))},
      {sep:1}]:[]),
    /* Arrumar: esquece pixel e slot de todo mundo e refaz a coluna com os
       icones VISIVEIS, na ordem da casa. Icone oculto nao segura buraco. */
    {lbl:t('Arrange icons'),fn:()=>{SFX.down();setPref('iconPos',{},true);setPref('iconSlot',{},true);prefSave();buildDesktop(true);}},
    {lbl:t('Paste'),dis:true},
    {sep:1},
    {lbl:t('About Kaijukaki'),ico:'kaiju',bold:true,fn:()=>UI.openApp('about')},
    {sep:1},
    {lbl:t('Display Properties'),ico:'pc',fn:()=>UI.dialog(t('Display Properties'),
      t('Resolution: 800x600<br>Colors: 256<br>Refresh rate: whatever this thing can manage<br><br>Wallpaper: <i>Kaiju Green (Solid)</i>'),'pc')},
    {lbl:t('Date & Time'),ico:'coin',fn:()=>UI.openApp('datetime')}
  ]);
}
/* ---------- Apps: o jogador arruma a propria mesa ----------
   Cada linha e um icone que a historia JA entregou, com marca de selecao.
   Clicou, liga ou desliga aquele icone — e o menu se redesenha no lugar, pra
   dar pra mexer em varios de uma vez. A escolha mora no registrador
   (24a-prefs.js, iconHide) e volta igual depois de recarregar.
   O que a historia ainda NAO entregou simplesmente nao esta na lista: nada
   aqui pode ser confundido com progressao.
   Nao e um menu que voa pro lado — o ctxMenu do 37-shell.js e uma folha so,
   entao isto e uma descida com volta, do jeito que o Iniciar faz. */
function appsMenu(x,y){
  const lista=deskAppList();
  const H=prefMap('iconHide');
  const escondidos=lista.filter(i=>H[i.id]).length;
  const tudoOff=lista.length>0&&escondidos>=lista.length;
  const redesenha=()=>{prefSave();buildDesktop();if(typeof buildStart==='function')buildStart();};
  ctxMenu(x,y,[
    {ico:'pc',lbl:'\u2039 '+t('Desktop'),fn:()=>desktopMenu(x,y)},
    {sep:1},
    {ico:tudoOff?'globe':'bin',bold:true,
     lbl:tudoOff?t('Show all icons'):t('Hide all icons'),
     fn:()=>{
       lista.forEach(i=>{if(tudoOff)delete H[i.id];else H[i.id]=1;});
       SFX.down();redesenha();
     }},
    {sep:1},
    ...lista.map(i=>({ico:i.ico,
      lbl:(H[i.id]?'\u25cb ':'\u2714 ')+t(i.lbl),
      fn:()=>{
        if(H[i.id])delete H[i.id];else H[i.id]=1;
        SFX.down();redesenha();
        /* o menu volta aberto no mesmo lugar: da pra desligar tres de uma vez */
        appsMenu(x,y);
      }}))
  ]);
}
function iconMenu(x,y,item){
  const isNote=!!item.note;
  ctxMenu(x,y,[
    {lbl:t('Open'),bold:true,ico:item.ico,fn:()=>launch(item.id)},
    {sep:1},
    {lbl:t('Delete'),ico:'bin',fn:()=>deleteIcon(item)},
    {lbl:t('Rename'),dis:!isNote,fn:isNote?()=>renameNote(item):null},
    /* Ocultar da area de trabalho: o mesmo interruptor do menu Apps (botao
       direito na mesa), so que no proprio icone. E arrumacao, nao exclusao:
       o app continua no Iniciar e volta pelo Apps. Fica junto do Excluir e do
       Renomear porque e do mesmo grupo — coisas que mexem no icone, nao no
       app. Uma nota do jogador nao e app: ela vai pra Lixeira, nunca se
       esconde. */
    ...(isNote?[]:[{lbl:t('Hide from desktop'),ico:'pc',fn:()=>hideIcon(item)}]),
    {sep:1},
    {lbl:t('Properties'),ico:'info',fn:()=>UI.dialog(t('{0} Properties',item.lbl),
      t('Type: {0}<br>Location: C:\\KAIJU\\DESKTOP<br>Size: {1} KB<br>Created: a long time ago',
        isNote?t('Text Document'):t('Application'),ri(4,996)),'info')}
  ]);
}
function deleteIcon(item){
  if(item.note){
    UI.dialog(t('Delete file'),t('Send <b>{0}</b> to the Recycle Bin?',item.lbl),'bin',
      {buttons:[{t:t('Yes'),v:1},{t:t('No'),v:0}],onDone(v){
        if(!v)return;
        /* o aviso promete a Lixeira: entao vai pra Lixeira, e da pra voltar */
        if(!noteToBin(item.lbl))return;
        SFX.close();buildDesktop();save();
        UI.toast('bin',t('{0} moved to the Recycle Bin.',item.lbl));
      }});
    return;
  }
  if(item.id==='bin'){
    errorBox(t('Recycle Bin'),t('Started using a computer today? Where exactly do you think the Recycle Bin goes if you delete it?'));
    return;
  }
  if(item.id==='tax'){
    popupSpam();
    return;
  }
  if(UNDELETABLE.includes(item.id)){
    errorBox(t('Cannot delete'),t('Alright smart ass, you really thought you could delete the main part of the game?'));
    return;
  }
  errorBox(t('Cannot delete'),t('This item is in use by the system.'));
}
/* ---------- ocultar da area de trabalho ----------
   Grava no mesmo registrador que o menu Apps le (iconHide, 24a-prefs.js), entao
   desmarcar la e ocultar aqui sao a mesma coisa e o Apps ja mostra o icone
   desmarcado. O icone encolhe e some (a mesma saida do arrastar-pra-lixeira) e
   a mesa e redesenhada depois — sem isso o icone sumia num piscar e parecia
   bug. Um toast, uma vez so, diz o caminho de volta: quem escondeu pela
   primeira vez precisa saber que existe um. */
function hideIcon(item){
  if(!item||item.note)return;
  const H=prefMap('iconHide');
  if(H[item.id])return;
  H[item.id]=1;prefSave();
  SFX.down();
  const node=$(`.dicon[data-icon="${item.id}"]`);
  if(node)node.classList.add('to-bin');
  setTimeout(()=>{
    buildDesktop();
    if(typeof buildStart==='function')buildStart();
    if(!G.hideTipSeen){G.hideTipSeen=1;save();
      UI.toast('pc',t('{0} is off the desktop. Desktop menu → Apps brings it back.',t(item.lbl)));}
  },220);
}
/* ---------- arrastar pra lixeira ----------
   Notas do jogador vao pra lixeira e ficam la. Icones do sistema recusam com a
   mesma piada de sempre. */
/* tira a nota da area de trabalho e guarda na lixeira, com o texto dentro.
   Um caminho so pros dois jeitos de mandar pra lixeira (arrastar e o menu),
   senao um deles apagava a nota de vez e o outro nao. */
function noteToBin(name){
  const note=userNotes().find(n=>n.name===name);
  if(!note)return false;
  G.bin=Array.isArray(G.bin)?G.bin:[];
  G.bin.unshift({name,text:note.text||'',day:G.day});
  if(G.bin.length>30)G.bin.pop();
  G.notes=(G.notes||[]).filter(n=>n.name!==name);
  /* a janela do Bloco de Notas dessa nota nao pode ficar aberta editando um
     arquivo que nao esta mais na mesa. UI.open.note.note guarda o nome. */
  const w=UI.open&&UI.open.note;
  if(w&&w.note===name)UI.closeApp('note');
  return true;
}
function binDrop(item,node){
  if(item.note){
    const name=item.lbl;
    if(!noteToBin(name)){buildDesktop();return;}
    SFX.close();haptic(HAP.ok);
    node.classList.add('to-bin');
    setTimeout(()=>{buildDesktop();save();UI.toast('bin',t('{0} moved to the Recycle Bin.',name));},220);
    return;
  }
  SFX.error();
  buildDesktop();
  errorBox(t('Cannot delete'),UNDELETABLE.includes(item.id)
    ? t('Alright smart ass, you really thought you could delete the main part of the game?')
    : t('This item is in use by the system.'));
}
function renameNote(item){
  const note=userNotes().find(n=>n.name===item.lbl);if(!note)return;
  UI.modal(`<div class="titlebar">${pixSVG('notepad',14,'tico')}<span class="ttl">${t('Rename')}</span></div>
    <div class="wbody" style="background:var(--face);width:min(calc(290px * var(--ui)),92vw)"><div class="pad">
      <input type="text" data-rn="1" class="grow" style="width:100%" value="${note.name}">
      <div class="row" style="justify-content:flex-end;gap:6px;margin-top:10px">
        <button class="btn" data-rnc="1">${t('Cancel')}</button><button class="btn" data-rno="1">${t('OK')}</button></div>
    </div></div>`,'',m=>{
      const inp=$('[data-rn]',m.box);inp.style.userSelect='text';setTimeout(()=>inp.select(),40);
      $('[data-rnc]',m.box).onclick=()=>{SFX.close();m.close();};
      $('[data-rno]',m.box).onclick=()=>{
        const v=(inp.value||'').trim();
        if(v){note.name=v;buildDesktop();save();}
        SFX.click();m.close();
      };
    });
}
function launch(id){
  /* MODO HISTORIA: abriu uma vez, o selo NOVO daquele icone some pra sempre */
  if(typeof stOpened==='function'&&stOpened(id))setTimeout(buildDesktop,0);
  if(id&&id.indexOf('note:')===0){
    const name=id.slice(5);
    if(UI.open.note){UI.closeApp('note');setTimeout(()=>UI.openApp('note',name),160);}
    else UI.openApp('note',name);
    return;
  }
  if(id==='bin'){
    const b=Array.isArray(G.bin)?G.bin:[];
    if(!b.length){SFX.error();UI.dialog(t('Recycle Bin'),t('The bin is empty. Like your Discord.'),'bin');return;}
    binWindow();return;
  }
  if(id==='site')netVisited();
  /* desligar o PC = encerrar o dia. Reaproveita o caminho de sempre:
     se o dia ainda nao acabou, tiredGate() nao serve (ele so fala quando
     JA acabou), entao aqui a gente pergunta com as horas na mao. */
  if(id==='shutdown'){deskShutdown();return;}
  UI.openApp(id);
}
/* O icone do Kaijukaki.net chama atencao ate a primeira visita. Depois disso
   nunca mais: G.netSeen fica gravado no save. */
/* a primeira fala espera a mesa terminar de nascer: falar por cima da
   animacao de entrada e comecar o jogo atropelando o jogador */
function storyKick(delay){
  if(typeof storyTick!=='function')return;
  setTimeout(()=>{try{storyTick();}catch(e){console.error(e);}},delay||900);
}
function netVisited(){
  if(G.netSeen)return;
  G.netSeen=true;save();
  $$('.dicon.nudge').forEach(e=>e.classList.remove('nudge'));
  $$('.dicon .nudgetag').forEach(e=>e.remove());
}
function binWindow(){
  const b=Array.isArray(G.bin)?G.bin:[];
  UI.modal(`<div class="titlebar">${pixSVG('bin',14,'tico')}<span class="ttl">${t('Recycle Bin')}</span>
      <div class="tbtns"><button class="tb" data-a="x"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(340px * var(--ui)),94vw)">
      <div class="pad">
        <div class="tiny dim" style="margin-bottom:7px">${t('{0} item(s). Nothing here is really gone until you empty it.',b.length)}</div>
        <div class="binlist">${b.map((x,i)=>`<div class="binrow">
          ${pixSVG('notepad',Math.round(16*uiScale()))}
          <span class="bn-n">${x.name}</span>
          <span class="tiny dim">${t('day {0}',x.day)}</span>
          <button class="btn tight" data-restore="${i}">${t('Restore')}</button>
        </div>`).join('')}</div>
      </div>
      <div class="row" style="justify-content:space-between;padding:0 10px 12px;gap:6px">
        <button class="btn" data-empty="1">${t('Empty bin')}</button>
        <button class="btn big" data-binok="1">${t('CLOSE')}</button>
      </div>
    </div>`,'',m=>{
    const c=()=>{SFX.click();m.close();};
    $('[data-binok]',m.box).onclick=c;$('.tb',m.box).onclick=c;
    $$('[data-restore]',m.box).forEach(n=>n.onclick=()=>{
      const i=+n.dataset.restore,x=G.bin[i];if(!x)return;
      G.bin.splice(i,1);
      G.notes=G.notes||[];
      let nm=x.name,k=2;
      while(G.notes.some(z=>z.name===nm))nm=x.name.replace(/\.txt$/,'')+' ('+(k++)+').txt';
      G.notes.push({name:nm,text:x.text||''});
      SFX.coin();buildDesktop();save();
      UI.toast('notepad',t('{0} is back on the desktop.',nm));
      m.close();
    });
    $('[data-empty]',m.box).onclick=()=>{
      SFX.error();
      m.close();
      setTimeout(()=>UI.dialog(t('Empty the bin?'),t('Everything in there goes away for good.'),'warn',
        {buttons:[{t:t('Empty it'),v:1},{t:t('Cancel'),v:0}],onDone(v){
          if(!v)return;G.bin=[];save();SFX.close();UI.toast('bin',t('Bin emptied.'));}}),180);
    };
  });
}
function buildStart(){
  /* Menu curto: os apps, quatro acoes, e uma janela de Configuracoes que guarda
     tudo que antes virava linha aqui dentro. */
  const items=[
    /* 'shutdown' sai daqui: a acao Encerrar o dia ja tem linha propria mais
       embaixo, e no dia 1 — quando a mesa tem quatro icones — as duas ficavam
       coladas uma na outra, com o mesmo nome. */
    /* iconLive(), nao unlocked(): o menu Iniciar mostra o que EXISTE, mesmo o
       que o jogador tirou da mesa — esconder icone nao pode trancar o app. */
    ...DESK_ICONS.filter(i=>i.id!=='bin'&&i.id!=='shutdown'&&iconLive(i.id)).map(i=>({ico:i.ico,lbl:t(i.lbl),fn:()=>launch(i.id)})),
    ...(unlocked('tab_profile')?[{ico:'chart',lbl:t('Ranks & Perks'),fn:()=>launch('profile')}]:[]),
    ...(unlocked('wgt_chart')?[{ico:'chart',lbl:t('Kaiju Charts'),fn:()=>launch('chart')}]:[]),
    {sep:1},
    ...(unlocked('f_notes')?[{ico:'notepad',lbl:t('New Text Document'),fn:()=>newNote()}]:[]),
    {ico:'info',lbl:t('Date & Time'),fn:()=>launch('datetime')},
    {ico:'power',lbl:t('End the day'),fn:()=>{
      if(dayLock)return;
      UI.dialog(t('End the day?'),t("You'll see today's results, then sleep. Anything listed keeps selling overnight."),'info',
      {buttons:[{t:t('END DAY'),v:1},{t:t('Not yet'),v:0}],onDone(v){if(!v||dayLock)return;
        const left=(dayEndHour()-G.hour)*60-G.min;
        if(left>0)advance(left);
        sleepNow();}});
    }},
    {sep:1},
    {ico:'pc',lbl:t('Settings...'),bold:true,fn:()=>settingsDialog()},
    {ico:'kaiju',lbl:t('About Kaijukaki'),fn:()=>launch('about')}
  ];
  const c=$('#smitems');c.innerHTML='';
  items.forEach(i=>{
    if(i.sep){c.appendChild(el('div','smsep'));return;}
    const e=el('div','smi'+(i.bold?' bold':''),pixSVG(i.ico,Math.round(22*uiScale()))+`<span class="lb">${i.lbl}</span>`);
    e.onclick=ev=>{SFX.click();closeStart();i.fn(ev);};
    c.appendChild(e);
  });
  const sb=$('#startbtn');
  if(sb)sb.lastElementChild.textContent=t('Start');
}

/* ---------- Configuracoes: tudo que era linha do menu ---------- */
function settingsDialog(){
  const row=(ico,label,val,act)=>`<div class="setrow" data-set="${act}">
      ${pixSVG(ico,Math.round(18*uiScale()))}
      <span class="set-l">${label}</span>
      <button class="btn tight set-v">${val}</button>
    </div>`;
  const draw=m=>{
    const hudOn=!(document.getElementById('hud')&&document.getElementById('hud').style.display==='none');
    $('[data-setbody]',m.box).innerHTML=
      `<div class="setgrp">${t('Display')}</div>`+
      row('pc',t('Interface size'),t(UI_LABEL[uiSize()]),'ui')+
      row('notepad',t('Text size'),t(TEXT_LABEL[textSize()]),'txt')+
      row('pc',t('CRT effect'),document.body.classList.contains('nocrt')?t('off'):t('on'),'crt')+
      row('rocket',t('Quick reveal'),pref('fastReveal')?t('on'):t('off'),'fastrv')+
      `<div class="setgrp">${t('Desktop panels')}</div>`+
      row('chart',t('Chart panel'),wgtOn('chart')?t('on'):t('off'),'wchart')+
      row('rocket',t('Gas panel'),wgtOn('gas')?t('on'):t('off'),'wgas')+
      row('wallet',t('Wallet panel'),hudOn?t('on'):t('off'),'whud')+
      `<div class="setgrp">${t('Wallet')}</div>`+
      row('wallet',t('Wallet name'),nickOf(),'nick')+
      row('kaiju',t('Recovery phrase'),t('show'),'seed')+
      `<div class="setgrp">${t('System')}</div>`+
      row('info',t('Sound'),SFX.muted?t('off'):t('on'),'snd')+
      row('globe',t('Language'),LANG==='pt'?'Português':'English','lang')+
      row('notepad',t('Save file'),t('export / import'),'save')+
      row('warn',t('Start over'),t('format'),'wipe');
    $$('[data-set]',m.box).forEach(n=>n.onclick=()=>{
      const a=n.dataset.set;SFX.click();
      if(a==='ui'){const o=['s','m','l','xl'];setUiSize(o[(o.indexOf(uiSize())+1)%o.length]);}
      else if(a==='txt'){const o=['s','m','l'];setTextSize(o[(o.indexOf(textSize())+1)%3]);}
      /* o efeito CRT e o som eram os dois unicos ajustes que NAO voltavam:
         reabrir o jogo acendia a tela de novo e o som voltava ligado */
      else if(a==='crt')setCrt(document.body.classList.contains('nocrt'));
      /* so o comum e encurtado — Raro pra cima sempre leva o giro completo */
      else if(a==='fastrv')setPref('fastReveal',!pref('fastReveal'));
      else if(a==='wchart')wgtToggle('chart');
      else if(a==='wgas')wgtToggle('gas');
      else if(a==='whud'){const h=document.getElementById('hud');const off=h.style.display==='none';
        h.style.display=off?'':'none';setPref('hudOff',!off);}
      else if(a==='seed'){m.close();setTimeout(seedDialog,180);return;}
      else if(a==='nick'){m.close();setTimeout(nickDialog,180);return;}
      else if(a==='snd')setSound(SFX.muted);
      else if(a==='lang'){setLang(LANG==='pt'?'en':'pt');buildStart();buildDesktop();UI.refresh();save();
        m.close();setTimeout(settingsDialog,180);return;}
      else if(a==='save'){m.close();setTimeout(()=>saveIODialog('out'),180);return;}
      else if(a==='wipe'){m.close();setTimeout(()=>UI.dialog(t('Format disk?'),
        t('This erases <b>all</b> your progress and restarts on day 1 with $40.'),'warn',
        {buttons:[{t:t('Format'),v:1},{t:t('Cancel'),v:0}],onDone(v){if(v){wipe();location.reload();}}}),180);return;}
      draw(m);
    });
  };
  UI.modal(`<div class="titlebar">${pixSVG('pc',14,'tico')}<span class="ttl">${t('Settings')}</span>
      <div class="tbtns"><button class="tb" data-a="x"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(340px * var(--ui)),94vw)">
      <div class="pad" data-setbody="1"></div>
      <div class="row" style="justify-content:center;padding:0 10px 12px">
        <button class="btn big" data-setok="1">${t('CLOSE')}</button></div>
    </div>`,'',m=>{
    draw(m);
    const c=()=>{SFX.click();m.close();};
    $('[data-setok]',m.box).onclick=c;
    $('.tb',m.box).onclick=c;
    /* importar fica escondido atras do exportar, pra nao lotar a lista */
    const im=el('div','tiny dim center');
    im.style.cssText='padding:0 10px 8px;cursor:pointer;text-decoration:underline';
    im.textContent=t('import a save code');
    im.onclick=()=>{m.close();setTimeout(()=>saveIODialog('in'),180);};
    $('[data-setbody]',m.box).after(im);
  });
}
function closeStart(){$('#startmenu').classList.remove('open');$('#startbtn').classList.remove('on');}
function toggleStart(){
  const o=$('#startmenu').classList.toggle('open');
  $('#startbtn').classList.toggle('on',o);SFX.click();
}

/* ---------- tamanho da interface ----------
   --fs mexe so no texto. --ui mexe no tamanho das janelas, dos pop-ups, dos
   icones e da arte: e o zoom do sistema inteiro. */
const UI_LABEL={s:'Small',m:'Normal',l:'Large',xl:'Huge'};
const UI_SCALE={s:.9,m:1,l:1.3,xl:1.7};
/* padrao da casa: interface Large. No 'm' tudo ficava apertado demais numa
   tela grande, e a maioria nunca abre as configuracoes pra descobrir isso. */
function uiSize(){return pref('uiSize');}
function uiScale(){return UI_SCALE[uiSize()]||1;}
function setUiSize(v){
  const kAnt=uiScale();
  setPref('uiSize',v,true);
  document.body.classList.remove('ui-s','ui-m','ui-l','ui-xl');
  document.body.classList.add('ui-'+v);
  SFX.click();save();
  /* as janelas ja abertas acompanham na hora */
  Object.values(UI.open).forEach(e=>{
    if(e.min)return;
    const B=UI.bounds(),k=uiScale();
    if(!e.max){
      /* ANTES: toda janela voltava pro tamanho de fabrica do app, e quem tinha
         esticado a Carteira perdia o ajuste so por mudar a escala. Agora o
         tamanho DELE acompanha a escala, na mesma proporcao. */
      const r=k/(kAnt||1);
      e.win.style.width=Math.min(Math.round(e.win.offsetWidth*r),B.w-8)+'px';
      e.win.style.height=Math.min(Math.round(e.win.offsetHeight*r),B.h-8)+'px';
      e.win.style.left=clamp(Math.round(e.win.offsetLeft*r),0,Math.max(0,B.w-e.win.offsetWidth))+'px';
      e.win.style.top=clamp(Math.round(e.win.offsetTop*r),0,Math.max(0,B.h-e.win.offsetHeight))+'px';
    }
    if(e.app.onResize)e.app.onResize(e.body,e);
  });
  buildDesktop();
  UI.refresh();
  if(typeof winRemember==='function'){winRemember();save();}
}

/* ---------- efeito CRT e som ----------
   Os dois viviam so no DOM: desligar e recarregar acendia tudo de novo.
   Agora sao preferencia como qualquer outra, e applyLook() e o unico lugar
   que sabe traduzir o registrador em classe de <body>. */
function setCrt(on){
  setPref('crt',!!on);
  document.body.classList.toggle('nocrt',!on);
}
function setSound(on){
  setPref('sound',!!on);
  SFX.toggle(!on);
}
/* pinta no <body> tudo que e visual e vem do registrador */
function applyLook(){
  document.body.classList.remove('txt-s','txt-m','txt-l','ui-s','ui-m','ui-l','ui-xl');
  document.body.classList.add('txt-'+textSize());
  document.body.classList.add('ui-'+uiSize());
  document.body.classList.toggle('nocrt',!pref('crt'));
  SFX.toggle(!pref('sound'));
}

/* ---------- text size ---------- */
const TEXT_LABEL={s:'Small',m:'Medium',l:'Large'};
function textSize(){return pref('txtSize');}
function setTextSize(v){
  setPref('txtSize',v,true);
  document.body.classList.remove('txt-s','txt-m','txt-l');
  document.body.classList.add('txt-'+v);
  SFX.click();save();
  UI.refresh();
}

/* ---------- a musica como ele deixou ----------
   Faixa e volume voltam na hora. Tocar exige um toque do jogador — navegador
   nao deixa audio comecar sozinho — entao a retomada espera o primeiro clique
   e nunca mente dizendo que esta tocando. */
function restoreMusic(){
  try{
    const tr=pref('musicTrack');
    if(tr&&MUSIC.tracks()[tr])MUSIC.setTrack(tr);
    MUSIC.setVol(pref('musicVol'));
    if(!pref('musicOn'))return;
    const go=()=>{
      document.removeEventListener('pointerdown',go,true);
      document.removeEventListener('keydown',go,true);
      try{if(pref('musicOn')&&!MUSIC.playing)MUSIC.play();}catch(e){}
    };
    document.addEventListener('pointerdown',go,true);
    document.addEventListener('keydown',go,true);
  }catch(e){}
}

/* ---------- reabrir a sessao ----------
   So janelas que o JOGADOR abriu, com posicao, tamanho e estado. A restauracao
   e sempre presa a tela DE AGORA (UI.restoreSession clampa tudo), entao quem
   jogou num monitor grande e voltou num pequeno acha tudo dentro da tela.
   Nada aqui pode impedir o jogo de abrir: erro vira console e segue o baile. */
function winRestoreOk(st){
  if(!st||!st.id)return false;
  /* nota apagada nao volta como janela vazia */
  if(st.id==='note')return !!(st.arg&&userNotes().some(n=>n.name===st.arg));
  return true;
}
function restoreDesk(){
  const list=pref('win');
  if(!Array.isArray(list)||!list.length)return;
  UI.restoreSession(list,pref('winFocus'));
}

/* ---------- idle thoughts ---------- */
function idleThoughts(){
  setInterval(()=>{
    if(!G||dayLock)return;
    if(G.hour>=22)UI.think(pick(TH('night')));
    else if(G.money<10)UI.think(pick(TH('broke')));
    else if(G.hype<6&&G.day>1)UI.think(pick(TH('lowhype')));
    else if(G.hype>70)UI.think(pick(TH('highhype')));
    else if(chance(.5))UI.think(pick(TH('idle')));
  },48000);
}

/* ---------- boot ---------- */
function boot(){
  const log=$('#bootlog');let i=0;
  const lines=BOOT_ALL[LANG]||BOOT_ALL.en;
  const step=()=>{
    if(i<lines.length){
      log.textContent+=lines[i]+'\n';
      if(lines[i])SFX.tick();
      i++;setTimeout(step,i<3?230:130);
    } else {
      setTimeout(()=>{
        SFX.boot();
        $('#boot').classList.add('done');
        const f=$('#pwrflash');if(f){f.style.display='';setTimeout(()=>f.remove(),520);}
        const sc=$('#screen');sc.classList.add('poweron');
        setTimeout(()=>sc.classList.remove('poweron'),460);
        setTimeout(()=>{const bt=$('#boot');if(bt)bt.remove();showLogin();},380);
      },420);
    }
  };
  step();
}
function start(){
  try{ startInner(); }
  catch(err){
    console.error(err);
    try{
      document.body.insertAdjacentHTML('beforeend',
        '<div style="position:fixed;inset:20% 10% auto;background:#c0c0c0;padding:16px;z-index:99999;font-family:Tahoma,sans-serif">'+
        '<b>'+t('Save file is corrupted.')+'</b><br><br>'+t('Your saved progress could not be read.')+'<br><br>'+
        '<button onclick="wipe();location.reload()" style="padding:6px 14px">'+t('Start over')+'</button></div>');
    }catch(e){}
  }
}
function startInner(){
  if(typeof mobInit==='function')mobInit();
  buildStart();
  $('#startico').innerHTML=pixSVG('kaiju',18);
  $('#startbtn').onclick=e=>{e.stopPropagation();toggleStart();};
  document.addEventListener('pointerdown',e=>{
    if(!e.target.closest('#startmenu')&&!e.target.closest('#startbtn'))closeStart();
    if(!e.target.closest('.ctxmenu'))closeCtx();
  });
  document.addEventListener('contextmenu',e=>{
    if(e.target.closest('#desktop')||e.target.closest('.dicon'))return;
    if(e.target.closest('textarea')||e.target.closest('input'))return;
    e.preventDefault();
  });
  const clk=$('#clock');
  if(clk){clk.style.cursor='pointer';clk.title=t('Date & Time');
    clk.addEventListener('dblclick',()=>UI.openApp('datetime'));
    if(typeof longPress==='function')longPress(clk,()=>UI.openApp('datetime'));}
  document.addEventListener('mousedown',()=>SFX.warm(),{once:true});
  document.addEventListener('dragstart',e=>e.preventDefault());
  /* ESC fecha o que estiver na frente. A ordem importa: modal primeiro (ele
     tem o proprio ESC), depois menu Iniciar, depois menu de contexto, e so
     entao a janela de topo — senao o ESC fecharia a janela atras do menu. */
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(UI.modalOpen())return;
    const tg=(e.target&&e.target.tagName||'').toLowerCase();
    if(tg==='input'||tg==='textarea')return;
    const sm=$('#startmenu');
    if(sm&&sm.classList.contains('open')){SFX.close();closeStart();return;}
    if($('.ctxmenu')){SFX.close();closeCtx();return;}
    const id=UI.topId;if(!id)return;
    const ent=UI.open[id];
    if(!ent||ent.min)return;
    UI.closeApp(id);
  });

  /* typing anywhere in the OS clicks like a real keyboard */
  let lastKey=0;
  document.addEventListener('keydown',e=>{
    const t=e.target;
    if(!t)return;
    const tag=(t.tagName||'').toLowerCase();
    if(tag!=='input'&&tag!=='textarea')return;
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    /* every distinct press clicks; only a held-down key gets throttled */
    const now=performance.now();
    if(e.repeat&&now-lastKey<45)return;
    lastKey=now;
    const k=e.key;
    if(k==='Enter')SFX.key('enter');
    else if(k===' '||k==='Spacebar')SFX.key('space');
    else if(k==='Backspace'||k==='Delete')SFX.key('back');
    else if(k.length===1||k==='Tab')SFX.key();
  },true);
  document.addEventListener('gesturestart',e=>e.preventDefault());
  document.addEventListener('contextmenu',e=>{if(e.target.closest('.titlebar,.resize,.dicon'))e.preventDefault();});
  const hud=$('#hud');
  const hudBtn=$('[data-hudmin]',hud);
  if(hudBtn)hudBtn.onclick=e=>{e.stopPropagation();SFX.click();hud.classList.toggle('mini');setPref('hudMini',hud.classList.contains('mini'));};
  const hudP=pref('hudPos');
  if(hudP&&!(typeof IS_MOB!=='undefined'&&IS_MOB)){
    const HB=UI.bounds();
    hud.style.left=clamp(hudP[0],0,Math.max(0,HB.w-120))+'px';
    hud.style.top=clamp(hudP[1],0,Math.max(0,HB.h-40))+'px';hud.style.right='auto';}
  if(pref('hudMini')===true)hud.classList.add('mini');
  else if(window.matchMedia('(max-width:720px)').matches&&pref('hudMini')!==false)hud.classList.add('mini');
  const hbar=$('.hud-tt',hud);
  hbar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    e.preventDefault();
    const r=hud.getBoundingClientRect();
    const ox=r.left,oy=r.top,sx=e.clientX,sy=e.clientY,pid=e.pointerId;
    hud.style.left=ox+'px';hud.style.top=oy+'px';hud.style.right='auto';
    hud.classList.add('dragging');
    try{hbar.setPointerCapture(pid);}catch(_){}
    const mv=ev=>{
      if(ev.pointerId!==pid)return;ev.preventDefault();
      const B=UI.bounds();
      hud.style.left=clamp(ox+ev.clientX-sx,0,Math.max(0,B.w-hud.offsetWidth))+'px';
      hud.style.top=clamp(oy+ev.clientY-sy,0,Math.max(0,B.h-24))+'px';
    };
    const up=ev=>{
      if(ev.pointerId!==pid)return;
      hud.classList.remove('dragging');
      hbar.removeEventListener('pointermove',mv);hbar.removeEventListener('pointerup',up);hbar.removeEventListener('pointercancel',up);
      try{hbar.releasePointerCapture(pid);}catch(_){}
      setPref('hudPos',[hud.offsetLeft,hud.offsetTop]);
    };
    hbar.addEventListener('pointermove',mv);hbar.addEventListener('pointerup',up);hbar.addEventListener('pointercancel',up);
  });
  hbar.addEventListener('dblclick',()=>{SFX.click();hud.classList.toggle('mini');setPref('hudMini',hud.classList.contains('mini'));});
  applyLook();
  restoreMusic();
  if(pref('hudOff'))hud.style.display='none';
  buildWidgets();
  if(typeof applyHammer==='function')applyHammer();
  if(typeof bomDiaTick==='function')bomDiaTick();
  UI.updateTray();
  idleThoughts();
  startClock();
  /* a mesa e conferida junto com o save periodico: uma varredura de duas ou
     tres janelas a cada 20s, nada por tick */
  setInterval(()=>{winRemember();save();},20000);
  /* fechar a aba tem que guardar a mesa como ela esta agora */
  const flush=()=>{try{winRemember();save();}catch(e){}};
  window.addEventListener('pagehide',flush);
  window.addEventListener('beforeunload',flush);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
  setInterval(()=>{if(!document.hidden){G.playMs=(G.playMs||0)+5000;}},5000);
  window.addEventListener('resize',()=>{
    const B=UI.bounds();
    Object.values(UI.open).forEach(e=>{
      if(e.min)return;
      if(e.max){e.win.style.left='0px';e.win.style.top='0px';
        e.win.style.width=B.w+'px';e.win.style.height=B.h+'px';return;}
      if(e.win.offsetWidth>B.w-8)e.win.style.width=Math.max(240,B.w-8)+'px';
      if(e.win.offsetHeight>B.h-8)e.win.style.height=Math.max(150,B.h-8)+'px';
      e.win.style.left=clamp(e.win.offsetLeft,0,Math.max(0,B.w-70))+'px';
      e.win.style.top=clamp(e.win.offsetTop,0,Math.max(0,B.h-24))+'px';
    });
    if(typeof wgtClampAll==='function')wgtClampAll();
  });
  /* a historia decide o que existe na mesa ANTES de desenhar a mesa */
  if(typeof storyMigrate==='function')storyMigrate();
  buildDesktop(true);
  const iconTime=desktopItems().length*70+260;
  /* ---------- a mesa volta como o jogador deixou ----------
     Depois dos icones, pra ela nascer por cima deles e nao no meio da onda. */
  setTimeout(()=>{try{restoreDesk();}catch(e){console.error(e);}},iconTime+120);
  /* A area de trabalho abre limpa. Nada de tres janelas na cara do jogador —
     ele descobre o que quiser abrir. So um empurrao discreto na primeira vez. */
  if(!G.seenIntro){
    G.seenIntro=true;
    setTimeout(()=>UI.toast('info',(typeof IS_MOB!=='undefined'&&IS_MOB)
      ?t('Tip: tap an icon to open it, hold it for the menu.')
      :t('Tip: double-click the icons on the desktop.')),iconTime+1400);
  } else {
    setTimeout(()=>UI.think(pick(TH('idle')),true),iconTime+700);
  }
  /* quem dá as boas-vindas agora é gente, não uma dica de rodapé */
  storyKick(iconTime+700);
  if(G.taxDue>0)setTimeout(openTaxman,iconTime+900);
  /* build nova: so um aviso. A caixa de entrada abre se o jogador quiser. */
  /* MODO HISTORIA: no dia 1 a Caixa de Entrada ainda nao existe na mesa —
     avisar que "tem carta te esperando" mandava o jogador procurar um icone
     que nao esta la. O aviso espera o icone chegar. */
  if(typeof GAME_VERSION!=='undefined'&&G.seenVersion!==GAME_VERSION&&unlocked('inbox')){
    const first=!G.seenVersion;
    G.seenVersion=GAME_VERSION;
    setTimeout(()=>{
      UI.toast('mail',first?t('Welcome. There is mail waiting for you.'):t('Version {0} — see what changed in the Inbox.',GAME_VERSION));
    },iconTime+(G.taxDue>0?2200:900));
  }
  save();
}
/* ================= MR. KAIJU WALLET — CRIACAO DA CARTEIRA =================
   Roda uma unica vez, num save novo, entre o LOG ON e a area de trabalho.
   Save antigo (walletMade) pula tudo e cai direto no desktop.

   POR QUE SO TRES PASSOS: isto e o PRIMEIRO MINUTO do jogo, antes de o
   jogador saber o que e um Kaiju. Eram quatro telas e duas delas pediam duas
   coisas ao mesmo tempo — revelar a frase E marcar uma caixa; e depois montar
   um quebra-cabeca de tres palavras embaralhadas so pra passar adiante. Nada
   disso ensina o jogo; tudo isso adia o jogo.
   Agora sao tres telas com UMA decisao cada:
     1. Boas-vindas  -> clicar em CRIAR CARTEIRA
     2. A frase      -> clicar pra revelar
     3. O apelido    -> escrever um nome
   Quem termina: G.nick, G.seed, G.walletMade=true, save(), start(). */

/* As frases sao piada e tem que SOAR como piada: nada aqui pode ser confundido
   com uma seed de verdade. Minusculas, seis a nove palavras, sempre carinhosas. */
const WALLET_SEEDS=[
  'i give my soul to mr kaiju kaki',
  'i love oekaki connect so much dude',
  'i just wanna play a fun game please',
  'i will be minting everything if thats okay',
  'please let me hold all the little monsters',
  'my wallet is a shoebox and i trust it',
  'mr kaiju took my lunch money again today',
  'every kaiju in here was drawn by hand',
  'i am not a whale but i am trying',
  'the floor is lava and i am buying',
  'hand drawn monsters are better than everything else',
  'i promise to never sell my favourite one',
  'gas fees cannot stop me i have snacks',
  'wake me up when the mint is out',
  'tell my mother i minted with real conviction',
  'one more mint and then i sleep forever',
  'i came for the art and stayed broke',
  'kaijukaki forever and also please lower the tax'
];
/* A barrinha falsa entre o passo 1 e o 2. Eram quatro linhas e quase dois
   segundos de nada: sobraram as duas que tem a piada. */
const WIZ_GEN=[
  'allocating entropy...',
  'permission granted, reluctantly.'
];

function walletWizard(onDone){
  /* as classes de escala so entram no start(); o assistente vem antes dele e
     ja precisa delas, senao ele apareceria sempre no tamanho normal */
  applyLook();
  document.body.classList.add('wizing');
  if(typeof IS_MOB!=='undefined'&&IS_MOB)document.body.classList.add('mob');

  const seed=pick(WALLET_SEEDS), words=seed.split(' ');
  let step=1, revealed=false, nick='';
  let busy=false, nagAt=0, typing=0;

  const veil=el('div');veil.id='wizveil';
  veil.innerHTML='<div class="win wizwin opening">'+
    '<div class="titlebar">'+pixSVG('wallet',14,'tico')+
      '<span class="ttl">'+t('Mr. Kaiju Wallet Setup')+'</span>'+
      '<div class="tbtns"><button class="tb" data-wizx="1" title="'+t('Close')+'">'+
      '<svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>'+
    '<div class="wizsteps" data-steps="1"></div>'+
    '<div class="wiz-main">'+
      '<div class="wiz-band">'+pixSVG('kaiju',64,'wb-ico')+
        '<b class="wb-t"><span>MR.</span><span>KAIJU</span><span>WALLET</span></b>'+
        '<span class="wb-v">v0.98</span></div>'+
      '<div class="wiz-body" data-body="1"></div>'+
    '</div>'+
    '<div class="wiz-foot">'+
      '<span class="wiz-note" data-note="1"></span>'+
      '<button class="btn" data-back="1">&lt; '+t('Back')+'</button>'+
      '<button class="btn big" data-next="1">'+t('Next')+' &gt;</button>'+
    '</div></div>';
  $('#screen').appendChild(veil);
  const box=$('.wizwin',veil);
  setTimeout(()=>box.classList.remove('opening'),200);
  SFX.open();

  const STEPS=[t('Welcome'),t('Phrase'),t('Name')];
  const LAST=STEPS.length;
  const bodyEl=()=>$('[data-body]',veil);
  const nextBtn=()=>$('[data-next]',veil);
  const backBtn=()=>$('[data-back]',veil);

  function shake(){
    box.classList.remove('shake');void box.offsetWidth;box.classList.add('shake');
    setTimeout(()=>box.classList.remove('shake'),340);
  }
  function nag(msg){
    const n=Date.now();
    $('[data-note]',veil).textContent=msg;
    if(n-nagAt>500){nagAt=n;SFX.error();}
    shake();
  }
  function drawSteps(){
    $('[data-steps]',veil).innerHTML=STEPS.map((s,i)=>{
      const n=i+1,st=n<step?'done':(n===step?'on':'todo');
      return '<span class="wstep '+st+'"><i>'+(n<step?'&#10003;':n)+'</i><b>'+s+'</b></span>';
    }).join('');
  }

  /* ---------- passo 1: boas-vindas ---------- */
  function step1(){
    /* uma frase, um botao. O resto da piada das taxas foi pro passo nenhum:
       tela de abertura nao e lugar de dois paragrafos. */
    bodyEl().innerHTML=
      '<div class="wiz-h">'+t('Mr. Kaiju Wallet')+'</div>'+
      '<div class="wiz-sub">'+t('non-custodial &middot; probably fine')+'</div>'+
      '<p class="wiz-p">'+t('No wallet, no Kaiju. I prepared one for you.')+'</p>'+
      '<div class="wiz-gen" data-gen="1" style="display:none"><div class="prog"><i style="width:0%"></i></div><span data-genl="1"></span></div>';
  }
  /* a barrinha falsa entre o passo 1 e o 2: quatro linhas e some */
  function generate(){
    if(busy)return;
    busy=true;
    const g=$('[data-gen]',veil);g.style.display='';
    nextBtn().disabled=true;backBtn().disabled=true;
    SFX.modem();
    let i=0;
    const bar=$('.prog i',g),lbl=$('[data-genl]',g);
    const tickLine=()=>{
      if(i<WIZ_GEN.length){
        lbl.textContent=t(WIZ_GEN[i]);
        bar.style.width=Math.round((i+1)/WIZ_GEN.length*100)+'%';
        SFX.tick();i++;setTimeout(tickLine,i===1?420:300);
      } else setTimeout(()=>{busy=false;go(2);},260);
    };
    tickLine();
  }

  /* ---------- passo 2: a frase ---------- */
  function step2(){
    /* UMA decisao nesta tela: revelar. A caixinha "eu anotei, juro" pedia uma
       segunda acao pra liberar o mesmo botao — e ninguem anota mesmo. A frase
       fica guardada no save e o rodape diz onde encontra ela de novo. */
    bodyEl().innerHTML=
      '<div class="wiz-h">'+t('Your secret recovery phrase')+'</div>'+
      '<div class="wiz-sub">'+t('You get what you get.')+'</div>'+
      '<div class="seedbox">'+
        '<div class="seed-w" data-words="1"></div>'+
        '<button class="seed-cover" data-cover="1"><span>'+t('CLICK TO REVEAL')+'</span>'+
          '<em>'+t('nobody behind you?')+'</em></button>'+
      '</div>'+
      '<div class="fieldset wiz-warn"><span class="lg">'+t('Careful')+'</span>'+
        t('Anyone with these words can empty your wallet. Anyone includes me.')+'</div>';
    const wrap=$('[data-words]',veil);
    if(revealed){
      wrap.innerHTML=words.map((w,i)=>'<i><b>'+(i+1)+'</b>'+w+'</i>').join('');
      $('[data-cover]',veil).classList.add('off');
    }
    $('[data-cover]',veil).onclick=()=>{if(!revealed)reveal();};
  }
  function reveal(){
    const cov=$('[data-cover]',veil),wrap=$('[data-words]',veil);
    cov.classList.add('off');SFX.down();haptic(HAP.ok);
    revealed=true;typing=1;
    let i=0;
    const put=()=>{
      if(i<words.length){
        const n=el('i');n.innerHTML='<b>'+(i+1)+'</b>'+words[i];
        wrap.appendChild(n);SFX.key();i++;setTimeout(put,110);
      } else {typing=0;drawFoot();}
    };
    setTimeout(put,180);
    drawFoot();
  }

  /* ---------- passo 3: apelido ----------
   O passo de re-digitar a frase embaralhada saiu daqui. Era o unico
   quebra-cabeca do jogo inteiro que aparecia ANTES do jogo, e errar uma ficha
   zerava a linha. A frase continua no save e em Iniciar > Configuracoes. */
  function step3(){
    bodyEl().innerHTML=
      '<div class="wiz-h">'+t('Name your wallet')+'</div>'+
      '<div class="wiz-sub">'+t('Goes on your save slot and your Kaki+ profile.')+'</div>'+
      '<div class="nick-wrap">'+
        '<input type="text" class="nick-in" data-nick="1" spellcheck="false" autocomplete="off" '+
          'maxlength="'+NICK_MAX+'" placeholder="'+t('nickname')+'" value="'+nick+'">'+
        '<span class="nick-cnt" data-cnt="1">'+nick.length+'/'+NICK_MAX+'</span>'+
      '</div>'+
      /* a "previa" repetia, em duas linhas de fieldset, exatamente o que a
         pessoa acabou de digitar no campo logo acima. Saiu. */
      '<div class="nick-rule" data-rule="1">'+t('lowercase letters and numbers &middot; 2 to {0}',NICK_MAX)+'</div>';
    const inp=$('[data-nick]',veil);
    inp.style.userSelect='text';
    const sync=()=>{
      const raw=inp.value, cl=cleanNick(raw);
      if(raw!==cl){
        inp.value=cl;
        const r=$('[data-rule]',veil);
        r.classList.remove('bad');void r.offsetWidth;r.classList.add('bad');
        const n=Date.now();
        if(n-nagAt>450){nagAt=n;SFX.error();}
        setTimeout(()=>r.classList.remove('bad'),700);
      }
      nick=cl;
      $('[data-cnt]',veil).textContent=nick.length+'/'+NICK_MAX;
      drawFoot();
    };
    inp.addEventListener('input',sync);
    inp.addEventListener('paste',()=>setTimeout(sync,0));
    sync();
    setTimeout(()=>{try{inp.focus();}catch(e){}},90);
  }

  /* ---------- rodape / navegacao ---------- */
  function nextLabel(){
    return step===1?t('CREATE WALLET'):step===LAST?t('FINISH'):t('Next')+' &gt;';
  }
  function canNext(){
    if(busy||typing)return false;
    if(step===2)return revealed;
    if(step===3)return nick.length>=2;
    return true;
  }
  function noteFor(){
    if(step===1)return t('No cancel button. I checked.');
    if(step===2)return revealed?t('Written down or not, it lives in Settings.')
                              :t('Reveal the phrase.');
    return nick.length>=2?t('Ready. Welcome aboard, {0}.',nick):t('At least 2 characters.');
  }
  function drawFoot(){
    const n=nextBtn(),b=backBtn();
    n.innerHTML=nextLabel();
    n.disabled=!canNext();
    /* instalador de verdade mostra o Voltar apagado no primeiro passo, nao
       esconde: assim os botoes nao pulam de lugar entre as telas */
    b.disabled=(step===1||busy);
    $('[data-note]',veil).textContent=noteFor();
  }
  function go(n){
    step=n;drawSteps();
    if(n===1)step1();else if(n===2)step2();else step3();
    bodyEl().scrollTop=0;
    drawFoot();
  }
  function onNext(){
    if(!canNext()){nag(noteFor());return;}
    SFX.click();haptic(HAP.tap);
    if(step===1){generate();return;}
    if(step<LAST){go(step+1);return;}
    finish();
  }
  function onBack(){
    if(step===1||busy)return;
    SFX.close();go(step-1);
  }
  nextBtn().onclick=onNext;
  backBtn().onclick=onBack;
  $('[data-wizx]',veil).onclick=()=>nag(t('There is no closing this. You need a wallet and I need a taxpayer.'));

  function onKey(e){
    if(e.key==='Enter'){e.preventDefault();e.stopPropagation();onNext();}
    else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();
      nag(t('There is no cancel button. I checked twice.'));}
  }
  document.addEventListener('keydown',onKey,true);

  /* ---------- fim ---------- */
  function finish(){
    busy=true;
    G.nick=cleanNick(nick);
    G.seed=seed;
    G.walletMade=true;
    save();
    SFX.levelup();haptic(HAP.level);
    UI.confetti(70,['#a8e832','#7fe3ff','#e8c060','#ffffff','#d24b3a']);
    bodyEl().innerHTML='<div class="wiz-done">'+pixSVG('wallet',56)+
      '<b>'+t('WALLET CREATED')+'</b>'+
      '<span>'+t('welcome aboard, {0}',G.nick)+'</span>'+
      '<em>'+t('Your phrase lives in Settings if you lose the paper.')+'</em></div>';
    $('.wiz-band',veil).classList.add('lit');
    $('[data-steps]',veil).innerHTML='';
    $('.wiz-foot',veil).innerHTML='<span class="wiz-note">'+t('Closing setup...')+'</span>';
    setTimeout(()=>{
      document.removeEventListener('keydown',onKey,true);
      document.body.classList.remove('wizing');
      veil.classList.add('gone');
      setTimeout(()=>{
        veil.remove();
        if(onDone)onDone();
        /* a carteira existe: a historia pode comecar */
        if(typeof storyKick==='function')storyKick(700);
      },260);
    },1500);
  }

  go(1);
}

/* A frase de recuperacao nao pode sumir depois do assistente: fica no save e
   aparece em Iniciar > Configuracoes > Carteira > Frase de recuperacao. */
function seedDialog(){
  const w=(G.seed||'').split(' ').filter(Boolean);
  UI.dialog(t('Secret recovery phrase'),
    (G.seed
      ? '<div class="seedbox mini"><div class="seed-w">'+w.map((x,i)=>'<i><b>'+(i+1)+'</b>'+x+'</i>').join('')+'</div></div>'+
        '<div class="tiny dim" style="margin-top:8px">'+t('Wallet: <b>{0}</b>. Same words you were given at setup. Still not a real one.',nickOf())+'</div>'
      : t('This save has no phrase. It was made before Mr. Kaiju started handing them out.')),
    'wallet');
}

/* Trocar o apelido depois. Mesma regra do assistente: cleanNick manda. */
function nickDialog(){
  UI.modal('<div class="titlebar">'+pixSVG('wallet',14,'tico')+'<span class="ttl">'+t('Wallet name')+'</span></div>'+
    '<div class="wbody" style="background:var(--face);width:min(calc(300px * var(--ui)),92vw)"><div class="pad">'+
      '<div class="nick-wrap"><input type="text" class="nick-in" data-nk="1" spellcheck="false" autocomplete="off" '+
        'maxlength="'+NICK_MAX+'" value="'+(G.nick||'')+'">'+
        '<span class="nick-cnt" data-nc="1"></span></div>'+
      '<div class="nick-rule" data-nr="1">'+t('lowercase letters and numbers only &middot; 2 to {0} characters &middot; no spaces, no accents, no symbols',NICK_MAX)+'</div>'+
      '<div class="row" style="justify-content:flex-end;gap:6px;margin-top:10px">'+
        '<button class="btn" data-nkc="1">'+t('Cancel')+'</button>'+
        '<button class="btn" data-nko="1">'+t('OK')+'</button></div>'+
    '</div></div>','',m=>{
    const inp=$('[data-nk]',m.box),ok=$('[data-nko]',m.box);
    inp.style.userSelect='text';
    const sync=()=>{
      const cl=cleanNick(inp.value);
      if(inp.value!==cl){inp.value=cl;const r=$('[data-nr]',m.box);
        r.classList.remove('bad');void r.offsetWidth;r.classList.add('bad');
        SFX.error();setTimeout(()=>r.classList.remove('bad'),700);}
      $('[data-nc]',m.box).textContent=cl.length+'/'+NICK_MAX;
      ok.disabled=cl.length<2;
    };
    inp.addEventListener('input',sync);
    inp.addEventListener('paste',()=>setTimeout(sync,0));
    sync();setTimeout(()=>{try{inp.focus();inp.select();}catch(e){}},60);
    $('[data-nkc]',m.box).onclick=()=>{SFX.close();m.close();};
    ok.onclick=()=>{
      const v=cleanNick(inp.value);
      if(v.length<2){SFX.error();return;}
      G.nick=v;save();SFX.click();m.close();
      UI.toast('wallet',t('Wallet renamed to {0}.',v));
      if(typeof UI.refresh==='function')UI.refresh();
    };
  });
}

/* ---------- profiles / log on ---------- */
/* Refresh de verdade: a area de trabalho apaga e os icones voltam um por um,
   e depois os painezinhos, igual um Windows lento acordando. */
let refreshing=false;
function refreshDesktop(){
  if(refreshing)return;
  refreshing=true;
  SFX.down();
  const d=$('#desktop');
  d.classList.add('wiping');
  /* os widgets somem primeiro */
  const ids=Object.keys(WGT).filter(wgtOn);
  ids.forEach(id=>{const w=$('#wgt_'+id);if(w){w.classList.add('wgt-out');}});
  setTimeout(()=>{
    ids.forEach(id=>{const w=$('#wgt_'+id);if(w)w.remove();});
    d.classList.remove('wiping');
    buildDesktop(true);                 /* stagger dos icones */
    const n=desktopItems().length;
    const iconTime=n*70+240;
    /* cada painel volta no seu tempo, depois dos icones */
    ids.forEach((id,i)=>setTimeout(()=>{
      buildWidgets();
      const w=$('#wgt_'+id);
      if(w){w.classList.remove('wgt-out');w.classList.add('wgt-in');setTimeout(()=>w.classList.remove('wgt-in'),420);}
      SFX.tick();
    },iconTime+i*260));
    setTimeout(()=>{refreshing=false;UI.refresh();},iconTime+ids.length*260+300);
  },260);
}
function slotInfo(n){
  try{
    const raw=localStorage.getItem(slotKey(n));
    if(!raw)return {n,exists:false};
    const o=JSON.parse(raw);
    return {n,exists:true,day:o.day||1,level:clamp(o.level||1,1,10),
      minted:o.minted||0,held:(o.tokens||[]).length,playMs:o.playMs||0,
      money:o.money||0,name:cleanNick(o.nick||o.userName||''),lang:o.lang||'en'};
  }catch(e){return {n,exists:false};}
}
function playtime(ms){
  const m=Math.floor((ms||0)/60000);
  return (m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'min';
}
function showLogin(){
  const slots=[1,2,3].map(slotInfo);
  let sel=slots.findIndex(s=>s.exists);if(sel<0)sel=0;
  const veil=el('div');veil.id='loginveil';
  veil.innerHTML=`<div class="win loginbox opening">
    <div class="titlebar"><span class="ttl">${t('Welcome to Kaijukaki OS')}</span></div>
    <div class="wbody" style="background:var(--face)">
      <div class="pad">
        <div class="logintop">
          ${pixSVG('kaiju',36)}
          <div><b>${t('Choose a profile')}</b><div class="tiny dim">${t('Your progress is saved in this profile only.')}</div></div>
        </div>
        <div class="slotlist">
          ${slots.map((s,i)=>`<div class="slotrow${i===sel?' sel':''}" data-slot="${i}">
            <canvas class="slotpic" data-pic="${s.n}"></canvas>
            <div class="slotinfo">
              <div class="slotname">${s.exists?(s.name||t('Kaiju User {0}',s.n)):t('Empty slot {0}',s.n)}</div>
              ${s.exists
                ? `<div class="tiny dim">${t('Day {0}',s.day)} · ${LEVELS[s.level-1].n} · ${playtime(s.playMs)}</div>
                   <div class="slotprog"><i style="width:${(s.minted/SUPPLY*100).toFixed(1)}%"></i><b>${(s.minted/SUPPLY*100).toFixed(1)}%</b></div>`
                : `<div class="tiny dim">${t('New game — $40 and a dream')}</div>`}
            </div>
            ${s.exists?`<button class="btn slotdel" data-del="${s.n}" title="${t('Delete profile')}">×</button>`:''}
          </div>`).join('')}
        </div>
        <div class="row" style="justify-content:flex-end;gap:6px;margin-top:11px">
          <button class="btn big" data-logon="1">${t('LOG ON')}</button>
        </div>
      </div>
    </div></div>`;
  $('#screen').appendChild(veil);
  slots.forEach(s=>{
    const cv=$('[data-pic="'+s.n+'"]',veil);
    if(!cv)return;
    if(s.exists)drawKaiju(cv,buildToken(1+((s.minted*7+s.n*131)%SUPPLY),1),52);
    else{const g=cv.getContext('2d');cv.width=52;cv.height=52;g.fillStyle='#2a2a2a';g.fillRect(0,0,52,52);
      g.fillStyle='#666';g.font='28px Tahoma';g.textAlign='center';g.fillText('?',26,36);}
  });
  const pick2=i=>{sel=i;$$('.slotrow',veil).forEach((r,j)=>r.classList.toggle('sel',j===i));};
  $$('.slotrow',veil).forEach((r,i)=>{
    r.onclick=e=>{if(e.target.closest('[data-del]'))return;SFX.down();pick2(i);};
    r.ondblclick=e=>{if(e.target.closest('[data-del]'))return;pick2(i);logOn();};
  });
  $$('[data-del]',veil).forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const n=+btn.dataset.del;
    SFX.error();
    if(!window.confirm(t('Delete profile {0}? This cannot be undone.',n)))return;
    /* as DUAS chaves: a principal e a copia de seguranca. Apagar so a
       principal fazia o perfil voltar sozinho na proxima entrada. */
    wipeSlot(n);
    veil.remove();showLogin();
  });
  $('[data-logon]',veil).onclick=logOn;
  function logOn(){
    SFX.click();
    const n=slots[sel].n;
    useSlot(n);
    G=migrate(load());
    setLang(pref('lang'));
    veil.classList.add('gone');
    setTimeout(()=>veil.remove(),260);
    /* save novo: a carteira vem antes da area de trabalho. Save antigo pula. */
    if(!G.walletMade)setTimeout(()=>walletWizard(()=>start()),300);
    else start();
  }
}
(function init(){
  useSlot(1);
  G=migrate(null);
  setLang('en');
  document.title=GAME_NAME;
  boot();
})();

/* ---------- desligar o computador ---------- */
function deskShutdown(){
  if(!G)return;
  if(typeof dayLock!=='undefined'&&dayLock)return;   /* ja esta encerrando */
  if(dayIsOver()){SFX.click();sleepNow();return;}
  const sobra=Math.max(0,dayEndHour()-(G.hour+G.min/60));
  SFX.down();
  UI.dialog(t('Shut down'),
    t('It is {0}:{1}. You still have <b>{2}h</b> of today left.<br><br>Close the day anyway?',
      pad2(G.hour%24),pad2(G.min),sobra.toFixed(1)),'warn',
    {buttons:[{t:t('END DAY'),v:1},{t:t('Not yet'),v:0}],onDone(v){
      if(!v)return;
      /* pula pro fim do dia e usa o mesmo relatorio de sempre */
      G.hour=dayEndHour();G.min=0;
      if(typeof announceDayOver==='function')announceDayOver();
      sleepNow();
    }});
}

/* aba escondida = nada de animacao rodando a toa */
(function kkVisTick(){
  const set=()=>document.body.classList.toggle('hid',document.hidden);
  document.addEventListener('visibilitychange',set);set();
})();
