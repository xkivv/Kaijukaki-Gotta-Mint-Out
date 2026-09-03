/* ================= APP: KAIJUNET ================= */
let dmPopOpen=false;
/* filtro do feed e conversa aberta sao do jogador: registrador (G.prefs) */
const KV=prefView({filter:'knFilter',dm:'dmSel'});
/* a janela aberta do Kaki+. Antes knRow() rechamava knWire(null,null,...) e o
   botao redesenhado perdia o acesso a janela; agora quem esta aberto mora aqui. */
let KN_B=null, KN_ENT=null;
/* ---------- a foto de perfil ----------
   O forum inteiro tinha uma cara so: quem nao fosse do elenco fixo recebia o
   mesmo desenho verde do Kaiju. Agora o hash do nick (o MESMO que ja escolhe a
   personalidade de quem posta) escolhe entre cinquenta objetos, e uma pessoa a
   cada quatro assina com a inicial do proprio nick. Mesmo nome, mesma foto,
   sempre — nao ha sorteio nenhum aqui dentro. */
const KN_AVATARS=['floppy','cd','mug','tape','tv','phone','cam','book','pencil','marker',
 'clock','lamp','plant','cat','dog','frog','ghost','skull','robot','alien','bug','fish',
 'bird','moon','sun','cloud','umbrella','key','lock','dice','heart','burger','joystick',
 'star2','mouse','bulb','note2','ufo','ring','snail','candle','crown','mask','rain',
 'mailbox','flame2','gem','crt','bone','donut'];
function whoIco(who){
  const c=CAST.find(x=>x.id===who);
  if(c)return c.ico;
  if(who==='anon')return 'xerr';
  const n=String(who||'');
  if(!n)return 'kaiju';
  /* o jogador usa a marca da casa */
  if(n==='you'||(typeof nickOf==='function'&&n===nickOf()))return 'kaki';
  const h=(typeof hashName==='function')?hashName(n):0;
  const m=n.match(/[a-z]/i);
  const ini=m?m[0].toUpperCase():'';
  if(ini&&h%4===0&&ICONS['ltr_'+ini])return 'ltr_'+ini;
  return KN_AVATARS[h%KN_AVATARS.length];
}
/* ---------- a cor por tipo de post ----------
   A tarja vermelha entregava que o post era FUD antes de o jogador ler uma
   palavra, e isso e spoiler de como reagir. A cor agora e o Marcador de
   Sentimento, comprado na Kaiju Shop; sem ele todo cartao e branco. A classe
   mora no <body> porque as regras de cor estao em dois arquivos de CSS. */
function knTint(){
  const on=(typeof has==='function')&&has('sentin');
  document.body.classList.toggle('kntint',!!on);
}
/* ---------- TAMANHO DE VISUALIZACAO (S / M / L) ----------
   Mesma ideia do GRID_SIZES da Carteira: a escolha mora em G e volta no
   reload. A diferenca e COMO ela e aplicada. O feed do Kaki+ e montado uma
   vez (knShell) e so remendado depois (knTock); redesenhar por causa do
   tamanho jogaria a leitura pro topo — foi exatamente esse o bug antigo.
   Entao trocar de tamanho aqui e uma CLASSE no container (.kn-s/.kn-m/.kn-l)
   e o resto e CSS: nenhum no do feed e recriado, o scrollTop nao se mexe. */
const KN_SIZES=['s','m','l'];
function knSize(){const v=pref('knSize');return KN_SIZES.indexOf(v)>=0?v:'m';}
function setKnSize(v){
  if(KN_SIZES.indexOf(v)<0)return;
  setPref('knSize',v);
  knApplySize();
}
/* pinta a classe em TODA raiz aberta do Kaki+ — feed e mensagens moram em
   abas diferentes da mesma janela, e as duas seguem a mesma escolha */
function knApplySize(){
  const k=knSize();
  $$('.knroot,.dmroot').forEach(n=>{
    n.classList.remove('kn-s','kn-m','kn-l');
    n.classList.add('kn-'+k);
  });
  $$('[data-knsize]').forEach(b=>b.classList.toggle('on',b.dataset.knsize===k));
}
function knSizeHTML(){
  /* MODO HISTORIA: o S/M/L do feed chega junto com o Kaki+ (b_social). Se um
     dia ele se separar, some da barra em vez de ficar cinza. */
  if(typeof unlocked==='function'&&!unlocked('f_knsize'))return '';
  return `<div class="sizebtns knsize">${KN_SIZES.map(k=>
    `<button class="btn tight${knSize()===k?' on':''}" data-knsize="${k}" title="${t('Post size')}">${k.toUpperCase()}</button>`).join('')}</div>`;
}
function knWireSize(root){
  $$('[data-knsize]',root).forEach(b=>{
    if(b.__w)return;b.__w=1;
    b.onclick=()=>{SFX.click();setKnSize(b.dataset.knsize);};
  });
}
APPS.kaijunet={
  title:'Kaki+', icon:'kaki', w:600, h:540, status:true,
  build(b,ent){b.innerHTML='<div class="knroot"></div>';ent.seen=null;this.refresh(b,ent);},
  onClose(ent){if(ent&&ent.liveT)clearInterval(ent.liveT);KN_B=null;KN_ENT=null;return true;},
  /* CUIDADO — foi daqui que saiu o "a pagina atualiza sozinha e vai pro topo".
     UI.refresh() chama este refresh a CADA acao do jogo (reagir gasta 5 minutos
     e o relogio andando dispara refresh), e antes ele reescrevia o innerHTML
     inteiro: o feed voltava pro topo no meio da leitura. A casca e montada UMA
     vez; depois disso o refresh so poe os numeros em dia e nao encosta no
     scroll. */
  refresh(b,ent){
    const root=$('.knroot',b);if(!root)return;
    KN_B=b;KN_ENT=ent;
    knTint();
    if(!$('.knbar',root))knShell(b,ent,root);
    else knTock(b,ent,root);
  }
};
/* monta a janela do zero: banner, barra, feed. So no build e se a casca sumir */
function knShell(b,ent,root){
  root.innerHTML=`
      ${knBanner()}
      <div class="knbar">
        <span class="kn-live"><i></i>${t('{0} online',num(onlineNow()))}</span>
        <select data-knf="1">
          <option value="all">${t('Everything')}</option>
          <option value="mine">${t('My posts')}</option>
          <option value="art">${t('About the art')}</option>
          <option value="anon">${t('Anonymous')}</option>
        </select>
        ${knSizeHTML()}
        <span class="grow"></span>
        ${knBoostHTML()}
      </div>
      <div class="knwrap">
        <div class="kncol">
          <div class="knfeedwrap">
            <div class="knnew" data-knnew="1" hidden></div>
            <div class="knfeed" data-knfeed="1"></div>
          </div>
        </div>
      </div>`;
  const art=$('[data-knart]',root);
  if(art)art.appendChild(knArtNode());
  const f=$('[data-knf]',root);f.value=KV.filter;
  /* trocar o filtro E uma troca de conteudo: aqui redesenhar tudo e o certo */
  f.onchange=e=>{
    KV.filter=e.target.value;SFX.click();
    ent.seen=null;knPaint(b,ent,true);
    const bar=$('[data-knnew]',root);if(bar){bar.hidden=true;bar.dataset.n=0;}
    knStatus(ent);
  };
  knWireBoost(b,ent,root);
  knWireSize(root);knApplySize();
  knPaint(b,ent,true);
  /* o feed chega devagar, sozinho: enquanto a janela esta aberta, post novo
     desliza pro topo. Antes so aparecia tudo de uma vez no refresh, e ai
     parecia um blog atualizado em lote. */
  if(ent.liveT)clearInterval(ent.liveT);
  ent.liveT=setInterval(()=>{
    if(!ent.win||!ent.win.isConnected){clearInterval(ent.liveT);return;}
    /* trocar pra aba Messages tira este root do documento; sem isto o tique
       continuaria pintando num no solto e queimando os posts novos */
    if(ent.min||!root.isConnected)return;
    knTock(b,ent,root);
    knCrowd($('[data-knfeed]',root));
  },5200);
  knStatus(ent);
}
/* o pulso: numeros em dia e os posts novos que chegaram. NUNCA mexe no scroll */
function knTock(b,ent,root){
  /* MODO HISTORIA: quando as reacoes chegam (b_boost) os posts que JA estao na
     tela precisam ganhar os botoes. O remendo normal so mexe nos posts novos,
     entao aqui a chegada pede um repinte inteiro — uma vez so. */
  const rx=(typeof unlocked==='function')?unlocked('f_react'):true;
  if(ent.rx===undefined)ent.rx=rx;
  if(ent.rx!==rx){ent.rx=rx;ent.seen=null;knPaint(b,ent,true);}
  else knPaint(b,ent,false);
  const on=$('.kn-live',root);
  if(on)on.innerHTML='<i></i>'+t('{0} online',num(onlineNow()));
  const mem=$('[data-knmembers]',root);
  if(mem)mem.textContent=t('{0} members',num(communitySize()));
  knRefreshBar(root,b,ent);
  knStatus(ent);
}
function knStatus(ent){
  if(!ent||!ent.win)return;
  const st=ent.win.querySelector('.st1'),s2=ent.win.querySelector('.st2');
  if(st)st.textContent=t('{0} online',num(onlineNow()));
  if(s2)s2.textContent=t('{0} posts',num(knList().length));
}
function knList(){
  const S=soc();
  let l=S.posts;
  if(KV.filter==='mine')l=l.filter(p=>p.kind==='shill');
  else if(KV.filter==='anon')l=l.filter(p=>p.kind==='anon');
  else if(KV.filter==='art')l=l.filter(p=>p.kind==='art'||p.kind==='flex');
  return l;
}
/* ---------- a barra de divulgacao ----------
   Antes so dava pra "postar sobre a colecao" la na pagina de mint, que e o
   lugar errado: o feed e aqui. A barra fica presa no topo do Kaki+, mostra o
   hype de agora, o que custa e o que rende, e chama exatamente as mesmas
   funcoes da pagina de mint — a economia nao muda em nada. */
/* ---------- o banner ----------
   Todo forum de 2003 tinha um: ceu estrelado, o nome do lugar em letra grande
   com sombra dura, um subtitulo pretensioso e uma fileira de links que ninguem
   clicava. E isso que faz parecer um LUGAR e nao uma caixa de mensagens. */
const KN_CRUMBS=['HOME','MEMBERS','SEARCH','FAQ','RULES'];
/* a arte do banner: quatro caras da colecao, tortas, sumindo pra esquerda.
   Feita UMA vez e guardada — o refresh do feed acontece toda hora e nao pode
   redesenhar canvas a toa. Cada Kaiju no seu proprio canvas: reaproveitar um
   canvas vivo pra outro id e como nasceu o bug da arte trocada. */
let KNART_NODE=null;
function knArtNode(){
  if(KNART_NODE)return KNART_NODE;
  const wrap=el('div','knart-in');
  const n=(typeof SUPPLY==='number')?SUPPLY:8888;
  const vistos={};
  for(let i=0;i<4;i++){
    let id;do{id=ri(1,n);}while(vistos[id]);vistos[id]=1;
    const cell=el('div','knart-c');
    const cv=document.createElement('canvas');
    cell.appendChild(cv);wrap.appendChild(cell);
    drawKaijuCached(cv,{id,rarity:(typeof metaOf==='function'?metaOf(id).rarity:0)},96);
  }
  KNART_NODE=wrap;
  return wrap;
}
function knBanner(){
  return `<div class="knban">
    <div class="knban-stars"></div>
    <div class="knban-in">
      <div class="knban-mark">
        <h1>Kaki<i>+</i></h1>
        <div class="knban-sub">${t('the kaijukaki community &middot; since the first mint')}</div>
      </div>
      <div class="knban-art" data-knart="1"></div>
    </div>
    <div class="knban-nav">
      ${KN_CRUMBS.map(c=>`<span>${c}</span>`).join('<em>&middot;</em>')}
      <span class="grow"></span>
      <span class="knban-me" data-knmembers="1">${t('{0} members',num(communitySize()))}</span>
    </div>
  </div>`;
}
function knBoostHTML(){
  const n=G.shills||0, cost=shillCost(), gain=shillGain();
  const broke=G.money<cost;
  /* Era um painel inteiro no topo do feed empurrando os posts pra baixo.
     Agora e um botao na barra, do lado do medidor de hype: mesma acao,
     um quinto do espaco, e da pra ver o hype sem rolar nada. */
  /* MODO HISTORIA: o medidor de hype vem com o Kaki+; o BOOST e o EXP chegam
     um beat depois (b_boost). Um medidor de EXP que nao da pra ganhar e um
     numero morto na barra, entao ele espera as reacoes. */
  return `${unlocked('m_hype')?`<span class="kn-hype${G.hype<20?' low':''}" title="${t('Hype')}">
      <i class="knh-bar"><b style="width:${clamp(G.hype,0,100).toFixed(0)}%"></b></i>
      <em>${G.hype.toFixed(0)}%</em>
    </span>`:''}
    ${unlocked('f_react')?knXpHTML():''}
    ${unlocked('f_boost')?`<button class="kn-shill${broke?' broke':''}" data-knshill="1"
      title="${t('{0} post(s) from you today. Each one costs more and gives less.',n)}">
      ${pixSVG('rocket',Math.round(12*uiScale()))}
      <b>${broke?t('NO MONEY'):t('BOOST')}</b>
      <em>${money(cost)} &middot; +${gain.toFixed(1)}</em>
    </button>`:''}`;
}
/* ---------- o EXP na barra ----------
   O jogador precisa ver onde ele esta antes de decidir se vale reagir. Fica na
   mesma linha do hype: uma responde "como a sala esta", a outra "quanto eu ja
   ganhei ficando nela". A barrinha e o quanto falta pro proximo degrau. */
function knXpHTML(){
  const falta=(typeof xpNext==='function')?xpNext():null;
  const bon=(typeof xpBonus==='function')?xpBonus():0;
  const pct=(falta==null)?100:100-(falta/XP_PER_STEP*100);
  const dica=(falta==null)
    ? t('That is the ceiling. Reacting still passes the time.')
    : t('{0} EXP to the next step.',num(falta));
  return `<span class="kn-xp${falta==null?' max':''}" data-knxp="1"
      title="${t('React the way the room feels and you get EXP. It counts as {0} Kaiju towards your level.',bon)} ${dica}">
      <b>EXP</b>
      <i class="knx-bar"><u style="width:${pct.toFixed(0)}%"></u></i>
      <em>${num(G.xp||0)}</em>
    </span>`;
}
function knWireBoost(b,ent,root){
  const sb=$('[data-knshill]',root);
  if(!sb||sb.__w)return;
  sb.__w=1;
  sb.onclick=()=>{
    if(tiredGate())return;
    const r=doShill();
    if(r.err){SFX.error();UI.dialog(t('Not enough money'),t('Posting costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
    SFX.coin();haptic(HAP.ok);
    UI.floatFrom(sb,'-'+money(r.cost),'#d24b3a');
    UI.hypePop('+'+r.got.toFixed(1));
    pushPost();
    UI.toast('globe',t('You posted about the collection. +{0} hype.',r.got.toFixed(1)));
    if((G.shills||0)>=4)UI.think(pick(["Nobody is reading these anymore.","I am becoming that guy.","Posting again feels desperate."].map(t)));
    timeAct(12);checkLevel();
    /* o post do jogador tem que aparecer no feed na hora, nao no proximo tick */
    if(b&&ent){ent.seen=null;knPaint(b,ent,true);}
    knRefreshBar(root,b,ent);
    UI.refresh();save();
  };
}
/* repinta so a direita da barra (hype + EXP + botao), sem mexer no feed */
function knRefreshBar(root,b,ent){
  root=root||(KN_B&&$('.knroot',KN_B));
  const bar=root&&$('.knbar',root);if(!bar)return;
  /* nada disso na barra (tudo ainda trancado): nao ha o que repintar e nao
     ha onde inserir — sair aqui evita empilhar os blocos no lugar errado */
  const velhos=$$('.kn-hype,.kn-xp,.kn-shill',bar);
  if(!velhos.length)return;
  const d=el('div',null,knBoostHTML());
  const novos=[...d.children];
  novos.forEach(n=>bar.insertBefore(n,velhos[0]));
  velhos.forEach(n=>n.remove());
  knWireBoost(b||KN_B,ent||KN_ENT,root);
}
/* ---------- desenhar/atualizar o feed ---------- */
function knPaint(b,ent,full){
  const root=$('.knroot',b);if(!root)return;
  const feed=$('[data-knfeed]',root);if(!feed)return;
  const list=knList();
  if(!list.length){
    if(full)feed.innerHTML=`<div class="center dim" style="padding:30px 12px;line-height:1.7">${pixSVG('globe',30)}<br>
      ${t('Quiet in here.')}<br><span class="tiny">${t('The feed wakes up as hype goes up.')}</span></div>`;
    return;
  }
  if(full){
    feed.innerHTML=list.slice(0,40).map(p=>knPost(p)).join('');
    ent.seen=list[0].id;
    feed.scrollTop=0;
    knWire(feed);
    knArt(feed);
    return;
  }
  /* incremental: so o que chegou desde a ultima vez */
  const i=list.findIndex(p=>p.id===ent.seen);
  const novos=(i<0)?list.slice(0,3):list.slice(0,i);
  if(!novos.length)return;
  ent.seen=list[0].id;
  /* ---- A COMPENSACAO DO SCROLL ----
     Enfiar cartao acima de onde a pessoa esta lendo empurra tudo pra baixo, e
     e isso que o dono sentiu como "a pagina pulou". A gente mede quanto o
     primeiro cartao antigo desceu e devolve exatamente esse tanto pro
     scrollTop: o post que estava sob os olhos fica onde estava, no pixel. */
  const ref=feed.firstElementChild;
  const t0=feed.scrollTop, y0=ref?ref.offsetTop:0;
  const frag=document.createElement('div');
  frag.innerHTML=novos.map(p=>knPost(p,true)).join('');
  const nodes=[...frag.children];
  nodes.reverse().forEach(n=>feed.insertBefore(n,feed.firstChild));
  knWire(feed);
  knArt(feed);
  const dy=ref?(ref.offsetTop-y0):0;
  if(t0>0&&dy>0)feed.scrollTop=t0+dy;
  /* a poda vem DEPOIS da compensacao: ela mexe so no fim da lista */
  while(feed.children.length>44)feed.removeChild(feed.lastChild);
  if(t0>0&&dy>0)feed.scrollTop=t0+dy;
  SFX.tick&&SFX.tick();
  if(t0>0){
    const bar=$('[data-knnew]',root);
    if(bar){
      const n=(+bar.dataset.n||0)+novos.length;
      bar.dataset.n=n;
      bar.hidden=false;
      bar.textContent=t('{0} new post(s) &uarr;',n).replace('&uarr;','↑');
      bar.onclick=()=>{SFX.click();feed.scrollTop=0;bar.hidden=true;bar.dataset.n=0;};
    }
  }
}
/* 10:00 nao existe num feed. Hora de gente e 10 AM. */
function knHour(h){
  h=((h%24)+24)%24;
  const ap=h<12?'AM':'PM';
  let k=h%12;if(k===0)k=12;
  return k+' '+ap;
}
function knPost(p,fresco){
  const meu=p.kind==='shill';
  /* MODO HISTORIA: reagir chega com b_boost. No post do proprio jogador, sem
     reacao e sem gorjeta, a barra de acoes inteira sai — barra vazia com uma
     borda solta em baixo do texto e pior que nada. */
  const reagir=unlocked('f_react');
  const av=Math.round(18*uiScale());
  return `<div class="kn-post k-${p.kind}${fresco?' kn-in':''}${p.gift&&!p.taken&&!p.expired?' k-gift':''}" data-p="${p.id}">
    <div class="kn-head">
      <span class="kn-av">${pixSVG(whoIco(p.who),av)}</span>
      <b class="kn-who">${p.who==='anon'?t('anonymous'):p.who}</b>
      <span class="kn-when">${knHour(p.hour)}</span>
      ${p.tipped?`<span class="kn-tipped" title="${t('You tipped this')}">${pixSVG('coin',Math.round(11*uiScale()))}</span>`:''}
    </div>
    <div class="kn-inner">
      <div class="kn-txt">${p.txt}</div>
      ${p.gift?`<div class="kn-gift${p.taken?' got':p.expired?' gone':''}">
        ${pixSVG('coin',Math.round(15*uiScale()))}
        <span>${p.taken?t('You took it. {0}',money(p.gift)):p.expired?t('Somebody else got there first.'):t('{0} sitting there',money(p.gift))}</span>
        ${(!p.taken&&!p.expired)?`<button class="btn tight" data-gift="${p.id}">${t('TAKE IT')}</button>`:''}
      </div>`:''}
      ${p.tk?`<div class="kn-shot r${p.rar||0}" data-shot="${p.tk}">
        <canvas data-knc="${p.tk}"></canvas><span class="kn-shot-id">#${p.tk}</span></div>`:''}
      ${p.scam?`<button class="btn tight kn-link" data-scam="${p.id}">${t('open the link')}</button>`:''}
      ${p.mkt?`<button class="btn tight kn-link" data-tomkt="1">${t('SEE IT ON THE MARKET')}</button>`:''}
    </div>
    ${(reagir||!meu)?`<div class="kn-acts">
      ${reagir?`<button class="kn-act kn-up${p.my===1?' on':''}" data-up="${p.id}" title="${t('Good post')}">
        <b>&#9650;</b><span>${p.up||0}</span></button>
      <button class="kn-act kn-haha${p.my===2?' ha':''}" data-ha="${p.id}" title="${t('That is funny')}">
        <b>&#9786;</b><span>${p.haha||0}</span></button>
      <button class="kn-act kn-dn${p.my===-1?' dn':''}" data-dn="${p.id}" title="${t('Bad post')}">
        <b>&#9660;</b><span>${p.down||0}</span></button>`:''}
      <span class="grow"></span>
      ${meu?'':`<button class="kn-act kn-tipb${p.tipped?' done':''}" data-tip="${p.id}" title="${t('Send $1')}"${p.tipped?' disabled':''}>
        ${pixSVG('coin',Math.round(13*uiScale()))}<span>$1</span></button>`}
    </div>`:''}
  </div>`;
}
function knArt(feed){
  $$('canvas[data-knc]',feed).forEach(c=>{
    if(c.__done)return;c.__done=1;
    const id=+c.dataset.knc;
    drawKaijuCached(c,{id,rarity:metaOf(id).rarity},Math.round(220*((typeof uiScale==='function')?uiScale():1)));
  });
}
/* ---------- REAGIR ----------
   Toda reacao custa 5 minutos do dia, acertando ou nao: o feed e um lugar
   pra se distrair quando nao ha o que fazer, e distrair custa tempo. Reagir
   junto com a sala (knFeel) da um pouco de EXP; fora do tom nao da nada e
   nao tira nada — sem bronca, sem som de erro. O jogo so nao concorda. */
function knVote(feed,btn,id,dir){
  const S=soc();
  if(typeof tiredGate==='function'&&tiredGate())return;
  if(S.votes>=SOC_CAP_VOTES){SFX.error();UI.toast('warn',t('You are out of votes for today.'));return;}
  const p=S.posts.find(x=>x.id===id);if(!p||p.my===dir)return;
  if(p.my===1)p.up=Math.max(0,(p.up||0)-1);
  if(p.my===-1)p.down=Math.max(0,(p.down||0)-1);
  if(p.my===2)p.haha=Math.max(0,(p.haha||0)-1);
  p.my=dir;S.votes++;
  if(dir===1)p.up=(p.up||0)+1+Math.round(onlineNow()*rf(0.02,0.10));
  else if(dir===2)p.haha=(p.haha||0)+1+Math.round(onlineNow()*rf(0.02,0.08));
  else p.down=(p.down||0)+1;
  if(dir===-1&&p.kind==='fud'&&!p.answered){p.answered=1;addHype(1.0);}
  if(CAST.some(c=>c.id===p.who))trustAdd(p.who,dir===1?2:-4);
  /* ---- O EXP SE PAGA UMA VEZ SO, PRA SEMPRE ----
     Dava pra reagir, tirar a reacao e reagir de novo pra farmar EXP no mesmo
     post. Agora o post ganha a marca p.xpd na primeira vez que paga e nunca
     mais paga — mudar de ideia continua liberado, so nao rende mais nada.
     A marca mora no proprio post (G.social.posts), entao atravessa o save. */
  const cabia=knXpFor(p,dir);
  const jaPago=!!p.xpd;
  const ganho=jaPago?0:cabia;
  SFX.click();haptic(HAP.tap);
  /* o botao e atualizado NO LUGAR: redesenhar o post inteiro (era o que knRow
     fazia) matava a animacao antes dela comecar */
  const alvo=knSync(feed,p,dir)||btn;
  if(dir===2)knLaughBurst(alvo);         /* so o jogador ri em cima da tela */
  if(ganho){
    p.xpd=1;
    UI.floatFrom(alvo,'+'+ganho+' EXP','#2f6b3a');
    SFX.notify();
    xpAdd(ganho);                        /* checkLevel() ja sobe o nivel sozinho */
  }else if(jaPago){
    UI.floatFrom(alvo,t('already counted'),'#8a8a8a');
  }else{
    UI.floatFrom(alvo,t('no EXP'),'#8a8a8a');
    /* uma vez por dia, e so isso: nada de sermao a cada clique */
    if(!S.act.noxp){S.act.noxp=1;
      UI.think(t('The room did not feel that one. Nobody is keeping score.'));}
  }
  timeAct(5);
  knRefreshBar(null,KN_B,KN_ENT);
  save();
}
function knWire(feed){
  $$('[data-up]',feed).forEach(x=>{if(!x.__w){x.__w=1;x.onclick=()=>knVote(feed,x,x.dataset.up,1);}});
  $$('[data-dn]',feed).forEach(x=>{if(!x.__w){x.__w=1;x.onclick=()=>knVote(feed,x,x.dataset.dn,-1);}});
  $$('[data-ha]',feed).forEach(x=>{if(!x.__w){x.__w=1;x.onclick=()=>knVote(feed,x,x.dataset.ha,2);}});
  $$('[data-gift]',feed).forEach(x=>{if(x.__w)return;x.__w=1;
    x.onclick=()=>{
      const r=claimGift(x.dataset.gift);
      if(!r){SFX.error();return;}
      SFX.cash(true);haptic(HAP.cash);
      UI.confetti(30,['#e8c060','#ffffff']);
      UI.floatFrom(x,'+'+money(r.value),'#0a6b2a');
      UI.toast('coin',t('{0} gave you {1}.',r.who,money(r.value)));
      const p=soc().posts.find(y=>y.id===x.dataset.gift);
      knRow(feed,p.id,p);save();UI.updateTray();
    };});
  $$('[data-tip]',feed).forEach(x=>{if(x.__w)return;x.__w=1;
    x.onclick=()=>{
      const S=soc();
      const p=S.posts.find(y=>y.id===x.dataset.tip);
      if(!p||p.tipped)return;
      if(G.money<TIP_VALUE){SFX.error();UI.toast('warn',t('You do not have $1.'));return;}
      if((S.tipsToday||0)>=TIP_DAY){SFX.error();UI.toast('warn',t('That is enough generosity for one day.'));return;}
      spend(TIP_VALUE);
      p.tipped=1;S.tips=(S.tips||0)+1;S.tipsToday=(S.tipsToday||0)+1;
      p.up=(p.up||0)+1;
      /* dinheiro nao compra reputacao em escala, mas gentileza e lembrada */
      if(CAST.some(c=>c.id===p.who))trustAdd(p.who,6);
      repAdd(0.35);addHype(0.15);
      SFX.coin();haptic(HAP.ok);
      UI.floatFrom(x,'-$1','#d24b3a');
      UI.toast('coin',t('{0} got your dollar.',p.who==='anon'?t('anonymous'):p.who));
      knRow(feed,p.id,p);save();UI.updateTray();
    };});
  $$('[data-shot]',feed).forEach(x=>{if(x.__w)return;x.__w=1;
    x.onclick=()=>{const id=+x.dataset.shot;SFX.click();
      if(G.tokens.some(y=>y.id===id))tokenDetail(id);else knShot(id);};});
  $$('[data-scam]',feed).forEach(x=>{if(x.__w)return;x.__w=1;
    x.onclick=()=>{SFX.error();
      if(typeof spawnScam==='function')spawnScam();
      else UI.dialog(t('Nothing there'),t('The page never loads. Of course it does not.'),'warn');};});
  $$('[data-tomkt]',feed).forEach(x=>{if(x.__w)return;x.__w=1;
    x.onclick=()=>{SFX.click();UI.openApp('hubmarket','market');};});
}
/* poe UMA linha em dia depois de gorjeta ou presente. Recriar o cartao (era o
   que esta funcao fazia) troca o no por outro de altura ligeiramente diferente
   e o feed dava um tranco debaixo do dedo. Agora remenda so o que mudou. */
function knRow(feed,id,p){
  const node=feed&&feed.querySelector(`[data-p="${id}"]`);
  if(!node||!p)return;
  /* pegar o presente apaga o botao TAKE IT e o cartao encolhe. Se ele estava
     ACIMA de onde a pessoa esta lendo, tudo abaixo sobe — o mesmo tranco de
     antes, por outro caminho. Mede a altura antes e devolve a diferenca. */
  const h0=node.offsetHeight, y0=node.offsetTop, t0=feed.scrollTop;
  /* a moedinha "voce deu gorjeta" no cabecalho */
  const head=$('.kn-head',node);
  if(head&&p.tipped&&!$('.kn-tipped',head))
    head.insertAdjacentHTML('beforeend',
      `<span class="kn-tipped" title="${t('You tipped this')}">${pixSVG('coin',Math.round(11*uiScale()))}</span>`);
  const tb=$('[data-tip]',node);
  if(tb&&p.tipped){tb.classList.add('done');tb.disabled=true;}
  /* o presente: muda o texto e some com o botao */
  const g=$('.kn-gift',node);
  if(g&&p.gift){
    g.classList.toggle('got',!!p.taken);
    g.classList.toggle('gone',!p.taken&&!!p.expired);
    const sp=g.querySelector('span');
    if(sp)sp.textContent=p.taken?t('You took it. {0}',money(p.gift))
      :p.expired?t('Somebody else got there first.')
      :t('{0} sitting there',money(p.gift));
    const gb=$('[data-gift]',g);
    if(gb&&(p.taken||p.expired))gb.remove();
  }
  node.classList.toggle('k-gift',!!(p.gift&&!p.taken&&!p.expired));
  /* os contadores: a gorjeta soma um joinha, entao esse ate anima */
  knSync(feed,p,p.tipped?1:0);
  const dh=node.offsetHeight-h0;
  if(dh&&y0<t0)feed.scrollTop=t0+dh;
}
/* ---------- O NUMERO GANHA VIDA ----------
   Um contador que troca de 0 pra 3 sem avisar nao e uma reacao, e uma
   planilha. Aqui o numero SOBE contando e a setinha da um pulo: pra cima no
   joinha, pra baixo no descurtir, um tremelique no risinho. */
function knStill(){
  try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}
}
function knBump(btn,to,dir){
  if(!btn)return;
  const sp=btn.querySelector('span'), gl=btn.querySelector('b');
  if(!sp)return;
  to=Math.max(0,Math.round(to||0));
  const de=parseInt(sp.textContent,10)||0;
  if(knStill()){sp.textContent=to;return;}
  const cls=dir===-1?'knk-dn':dir===2?'knk-ha':'knk-up';
  if(gl){
    gl.classList.remove('knk-up','knk-dn','knk-ha');void gl.offsetWidth;
    gl.classList.add(cls);
    clearTimeout(gl.__kt);gl.__kt=setTimeout(()=>gl.classList.remove(cls),760);
  }
  sp.classList.remove('knpop');void sp.offsetWidth;sp.classList.add('knpop');
  clearTimeout(sp.__pt);sp.__pt=setTimeout(()=>sp.classList.remove('knpop'),540);
  if(de===to){sp.textContent=to;return;}
  if(btn.__ct)cancelAnimationFrame(btn.__ct);
  const t0=performance.now(), dur=Math.min(720,260+Math.abs(to-de)*28);
  const passo=n=>{
    const k=Math.min(1,(n-t0)/dur), e=1-Math.pow(1-k,3);
    sp.textContent=Math.round(de+(to-de)*e);
    if(k<1)btn.__ct=requestAnimationFrame(passo);
    else{sp.textContent=to;btn.__ct=0;}
  };
  btn.__ct=requestAnimationFrame(passo);
}
/* poe os tres botoes do post em dia sem recriar nada; anima so o que mudou */
function knSync(feed,p,dir){
  const node=feed&&feed.querySelector(`[data-p="${p.id}"]`);
  if(!node)return null;
  const bu=$('[data-up]',node), bh=$('[data-ha]',node), bd=$('[data-dn]',node);
  if(bu)bu.classList.toggle('on',p.my===1);
  if(bh)bh.classList.toggle('ha',p.my===2);
  if(bd)bd.classList.toggle('dn',p.my===-1);
  [[bu,p.up||0,1],[bh,p.haha||0,2],[bd,p.down||0,-1]].forEach(par=>{
    const b=par[0];if(!b)return;
    if(par[2]===dir)knBump(b,par[1],dir);
    else{const s=b.querySelector('span');if(s)s.textContent=Math.max(0,Math.round(par[1]));}
  });
  return dir===1?bu:dir===2?bh:bd;
}
/* ---------- A SALA TAMBEM REAGE ----------
   Um feed onde nada se move enquanto voce le e um jornal. A cada tique umas
   poucas reacoes chegam de outras pessoas, nos posts que estao na tela, e
   sempre do jeito que a sala sente (o mesmo knFeel que da o EXP — e assim que
   o jogador aprende olhando). O ritmo segue quem esta online: sala vazia
   quase nao se mexe, sala cheia se mexe duas vezes por tique. Nunca mais que
   isso: isso aqui e um lugar, nao um caca-niquel. */
function knOnScreen(feed){
  const fr=feed.getBoundingClientRect();
  return [...feed.children].filter(n=>{
    if(!n.dataset||!n.dataset.p)return false;
    const r=n.getBoundingClientRect();
    return r.bottom>fr.top+4&&r.top<fr.bottom-4;
  });
}
function knCrowd(feed){
  if(!feed||!feed.isConnected)return;
  const S=soc();
  const taxa=clamp(onlineNow()/70,0.12,2);
  let k=Math.floor(taxa)+(chance(taxa%1)?1:0);
  if(k<=0)return;
  const vis=knOnScreen(feed);
  if(!vis.length)return;
  let mexeu=false;
  while(k-->0){
    const node=pick(vis);
    const p=S.posts.find(x=>x.id===node.dataset.p);
    if(!p||p.expired)continue;
    /* teto por post: deixar a janela aberta dez minutos nao pode transformar
       um post parado num sucesso. A sala se anima, nao enlouquece. */
    if((p.crowd||0)>=8)continue;
    p.crowd=(p.crowd||0)+1;
    const ok=knFeel(p)||[1];
    /* uma em cada seis pessoas reage fora do tom, porque gente e assim */
    /* a lista vem com a reacao principal na frente: a sala segue ela na
       maioria das vezes, senao um feed de conversa viraria so risada */
    let dir=chance(0.16)?pick([1,2,-1]):(chance(0.62)?ok[0]:pick(ok));
    if(p.kind==='shill')dir=chance(0.85)?1:2;   /* no post do jogador a sala e boazinha */
    if(dir===1)p.up=(p.up||0)+1;
    else if(dir===2)p.haha=(p.haha||0)+1;
    else p.down=(p.down||0)+1;
    mexeu=true;
    knSync(feed,p,dir);
  }
  if(mexeu)save();
}
/* ---------- A RISADA ----------
   Quando o JOGADOR ri (e so ele), um punhado de carinhas sai voando do botao.
   O rosto e desenhado aqui em pixel, nao com emoji de fonte: fonte muda de
   maquina pra maquina e a cara do Windows 98 ia embora junto. */
const KN_FACE=[
"                ",
"     kkkkkk     ",
"   kkYYYYYYkk   ",
"  kYYYYYYYYYYk  ",
" kYYYYYYYYYYYYk ",
" kYYkkYYYYkkYYk ",
" kYYkkYYYYkkYYk ",
" kYYYYYYYYYYYYk ",
" kYkkkkkkkkkkYk ",
" kYkwwwwwwwwkYk ",
" kYkkRRRRRRkkYk ",
"  kYkkkkkkkkYk  ",
"  kYYYYYYYYYYk  ",
"   kkYYYYYYkk   ",
"     kkkkkk     ",
"                "];
const KN_FPAL={k:'#0a0a0a',Y:'#e8c060',y:'#c8901c',w:'#ffffff',R:'#d24b3a'};
function knFaceSVG(size){
  let r='';
  for(let y=0;y<16;y++){
    const row=KN_FACE[y];let x=0;
    while(x<16){
      const ch=row[x]||' ';
      if(!KN_FPAL[ch]){x++;continue;}
      let w=1;while(x+w<16&&row[x+w]===ch)w++;
      r+=`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${KN_FPAL[ch]}"/>`;
      x+=w;
    }
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
}
function knLaughBurst(btn){
  if(!btn||knStill())return;
  const scr=$('#screen');if(!scr)return;
  const r=btn.getBoundingClientRect();
  if(!r.width)return;
  const u=(typeof uiScale==='function')?uiScale():1;
  /* o container e fixo em cima de tudo e nao entra no fluxo de nada:
     nao empurra o post, nao rola o feed, e some sozinho */
  const box=el('div','knburst');
  box.style.left=(r.left+r.width/2)+'px';
  box.style.top=(r.top+r.height/2)+'px';
  const n=ri(7,9), tam=Math.round(rf(15,19)*u);
  for(let i=0;i<n;i++){
    const f=el('i','knlf',knFaceSVG(Math.round(tam*rf(0.8,1.25))));
    f.style.setProperty('--dx',Math.round(rf(-58,58)*u)+'px');
    f.style.setProperty('--dy',Math.round(rf(-96,-38)*u)+'px');
    f.style.setProperty('--rot',Math.round(rf(-70,70))+'deg');
    f.style.animationDelay=(i*26)+'ms';
    box.appendChild(f);
  }
  scr.appendChild(box);
  setTimeout(()=>box.remove(),1000);
}
const TIP_VALUE=1, TIP_DAY=10;
const SOC_CAP_VOTES=12;

/* ver de perto um Kaiju que nao e seu, direto do feed */
function knShot(id){
  const m=metaOf(id);
  UI.modal(`<div class="titlebar">${pixSVG('chat',14,'tico')}<span class="ttl">Kaiju #${id}</span>
      <div class="tbtns"><button class="tb" data-ksx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(300px * var(--ui)),92vw)"><div class="pad center">
      <canvas data-kscv="1" style="width:100%;max-width:calc(220px * var(--ui));image-rendering:pixelated;display:block;margin:0 auto"></canvas>
      <div class="rr r${m.rarity}" style="display:inline-block;margin-top:8px">${rarName(m.rarity)}</div>
      <div class="tiny dim" style="margin-top:5px">${m.traits[RACE_LAYER]||''} · ${t('Rank {0} of {1}',num(m.rank),num(SUPPLY))}</div>
      <div class="tiny dim" style="margin-top:7px">${t('Somebody else holds this one.')}</div>
    </div></div>`,'',mm=>{
    const cv=$('[data-kscv]',mm.box);cv.width=220;cv.height=220;
    drawKaijuCached(cv,{id,rarity:m.rarity},220);
    $('.tb',mm.box).onclick=()=>{SFX.close();mm.close();};
  });
}

/* ================= APP: KAIJU MESSENGER =================
   Limpo de propósito. A versão anterior tinha, ao mesmo tempo: cabeçalho,
   linha de temperamento, barra "na mesa", medidor de paciência, quatro cartões
   de três linhas e um rodapé de aviso. Era informação demais pra uma decisão
   simples.
   Agora: uma linha de cabeçalho que diz tudo (quem, temperamento, confiança),
   a conversa, e as escolhas em uma linha cada. O resto virou tooltip. */
APPS.dm={
  title:'Kaiju Messenger', icon:'mail', w:620, h:520, status:true,
  build(b,ent){b.innerHTML='<div class="dmroot"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.dmroot',b);if(!root)return;
    /* interruptor mestre: com as DMs desligadas o app nao desenha nada. A
       aba tambem nao e listada, entao ninguem chega aqui — isto e so a
       ultima trava, pra nada quebrar se alguem abrir por outro caminho. */
    if(!(typeof DM_ON!=='undefined'&&DM_ON)){root.innerHTML='';return;}
    const S=soc();
    const vis=dmVisible(), arq=dmArchived();
    if(!S.threads.length){
      root.innerHTML=`<div class="dm-empty">
        ${pixSVG('mail',Math.round(38*uiScale()))}
        <b>${t('Nobody has written to you yet.')}</b>
        <span>${t('People start reaching out once they notice what you hold.')}</span></div>`;
      knApplySize();
      return;
    }
    const lista=KV.dmArch?arq:vis;
    if(!lista.length&&KV.dmArch)KV.dmArch=0;
    const pool=KV.dmArch?arq:vis;
    if(!KV.dm||!pool.some(x=>x.who===KV.dm))KV.dm=pool.length?pool[0].who:S.threads[0].who;
    const th=S.threads.find(x=>x.who===KV.dm);
    const of=dmLiveOffer(th);
    const tl=dmTrustLabel(th.who);
    const K=Math.round(20*uiScale());
    const restam=Math.max(0,DM_REPLIES_DAY-(S.repliesToday||0));

    const linhas=pool.map(x=>{
      const last=x.msgs[x.msgs.length-1];
      const tx=trustOf(x.who);
      const alvo=dmLiveOffer(x);
      const ultimo=dmLast(x);
      const uk=(ultimo&&ultimo.kind)||'';
      const marca=alvo?'offer':(/virus|seed|alert/.test(uk)?'alert':
        uk==='gift'?'gift':uk==='trade'?'trade':uk==='nosell'?'keep':'');
      return `<button class="dmrow${x.who===KV.dm?' on':''}" data-th="${x.who}">
        <span class="dm-av">${pixSVG(whoIco(x.who),K)}</span>
        <span class="dm-n">
          <b>${x.who}</b>
          <i>${marca?`<em class="dm-flag ${marca}">${marca==='offer'?t('OFFER'):marca==='gift'?t('GIFT'):
            marca==='trade'?t('SWAP'):marca==='keep'?t('ASK'):'!'}</em>`:''}${last?String(last.t).slice(0,40):''}</i>
        </span>
        <span class="dm-pip ${tx>=20?'up':tx<=-20?'down':'mid'}" title="${LANG==='pt'?tl.pt:tl.en}"></span>
      </button>`;}).join('');

    /* uma troca mostra os DOIS Kaiju: sem ver os dois lado a lado a escolha
       vira aposta no escuro */
    const swapBox=(m,morta)=>`<div class="dm-swap${morta?' dead':''}">
        <span class="dm-sw"><canvas class="dm-oart" data-dmart="${m.tkThem}"></canvas>
          <span class="dm-ol"><b>#${m.tkThem}</b><i>${rarName(metaOf(m.tkThem).rarity)}</i>
            <em class="get">${t('you get')}</em></span></span>
        <span class="dm-swx">&#8645;</span>
        <span class="dm-sw"><canvas class="dm-oart" data-dmart="${m.tk}"></canvas>
          <span class="dm-ol"><b>#${m.tk}</b><i>${rarName(metaOf(m.tk).rarity)}</i>
            <em class="give">${t('you give')}</em></span></span>
        ${m.boot>0?`<span class="dm-swb">+ ${money(m.boot)}</span>`:''}
      </div>`;
    /* um pedido pra guardar mostra o Kaiju e NENHUM botao: nao ha nada pra
       aceitar, so pra prometer ou nao */
    const keepBox=(m,morta)=>`<div class="dm-off keep${morta?' dead':''}">
        <canvas class="dm-oart" data-dmart="${m.tk}"></canvas>
        <span class="dm-ol"><b>#${m.tk}</b><i>${rarName(metaOf(m.tk).rarity)}</i></span>
        <span class="dm-okeep">${morta?t('gone'):t('not for sale?')}</span>
      </div>`;
    /* separador de dia entre balões, como num mensageiro de 1999 */
    let diaAnt=null;
    const sepDia=m=>{ if(m.day===diaAnt)return ''; diaAnt=m.day;
      return `<div class="dm-sep"><span>${dmDayLabel(m.day)}</span></div>`; };
    const balao=m=>{
      const meu=!!m.me;
      const morta=m.tk&&(m.dead||!G.tokens.some(x=>x.id===m.tk));
      const susp=m.kind==='virus', semente=m.kind==='seed';
      return `<div class="dm-b${meu?' me':''}${m.tone?' t-'+m.tone:''}">
        ${meu?'':`<span class="dm-bav">${pixSVG(whoIco(th.who),Math.round(16*uiScale()))}</span>`}
        <div class="dm-bx${susp?' sus':''}${semente?' seed':''}">
          ${susp&&!m.dead?`<div class="dm-tag ${m.flag?'flag':m.tip?'tip':'raw'}">${m.flag
              ? t('&#9888; KAIJU ANTIVIRUS: this attachment is suspicious')
              : m.tip
              ? t('&#9888; somebody warned you about files like this')
              : t('&#128206; attachment')}</div>`:''}
          ${semente&&!m.dead?`<div class="dm-tag seedtag">${t('&#9888; that looks like a seed phrase')}</div>`:''}
          <div class="dm-t${semente?' mono':''}">${m.t}</div>
          ${m.amount&&m.kind==='gift'&&!m.dead?`<div class="dm-money">${money(m.amount)}</div>`:''}
          ${m.kind==='trade'?swapBox(m,morta):m.kind==='nosell'?keepBox(m,morta):
            m.tk?`<div class="dm-off${morta?' dead':''}">
            <canvas class="dm-oart" data-dmart="${m.tk}"></canvas>
            <span class="dm-ol"><b>#${m.tk}</b><i>${rarName(metaOf(m.tk).rarity)}</i></span>
            <span class="dm-op">${money(m.price||0)}</span>
            ${morta?`<span class="dm-ogone">${t('gone')}</span>`
                   :`<button class="btn dm-oacc" data-dmacc="${m.tk}">${t('SELL IT')}</button>`}
          </div>`:''}
          <div class="dm-when">${meu?(G.nick||t('you')):th.who} &middot; ${dmClock(m)}</div>
        </div>
      </div>`;};

    const opts=dmEnsureOpts(th);
    const kindAtual=dmKindOf(dmLast(th));
    const podeFalar=restam>0&&!dmSilenced(th.who);
    const escolhas=opts.map((o,i)=>{
      const T=DM_TONES[o.tone]||DM_TONES.warm;
      const tag=dmToneTag(o.tone,kindAtual,th);
      /* o jogador escolhe pelo que VAI DIZER, nao por um rotulo abstrato:
         a frase fica visivel no botao. Sem selo de consequencia — isso se
         descobre jogando. */
      return `<button class="dmopt ${T.cls}" data-dmopt="${i}"${podeFalar?'':' disabled'}>
        <span class="dmo-h">${pixSVG(T.ico,Math.round(15*uiScale()))}<span class="dmo-l">${dmToneLabel(o.tone,kindAtual)}</span>${tag?`<span class="dmo-g">${tag}</span>`:''}</span>
        <span class="dmo-p">&ldquo;${o.txt}&rdquo;</span>
      </button>`;}).join('');

    root.innerHTML=`
      <div class="dmlist">
        <div class="dml-h">
          <button class="btn tight${KV.dmArch?'':' on'}" data-dmtab="0">${t('Inbox')} ${vis.length}</button>
          <button class="btn tight${KV.dmArch?' on':''}" data-dmtab="1">${t('Archived')} ${arq.length}</button>
        </div>
        <div class="dml-b">${linhas||`<div class="dml-none">${t('Nothing here.')}</div>`}</div>
      </div>
      <div class="dmchat">
        <div class="dm-head">
          <button class="btn tight dm-back" data-dmback="1">&#8592;</button>
          <span class="dm-av">${pixSVG(whoIco(th.who),Math.round(22*uiScale()))}</span>
          <span class="dm-who" title="${dmPersonaDesc(th.who)}">
            <b>${th.who}</b>
            <i>${dmPersonaName(th.who)} &middot; <span class="${tl.k}">${LANG==='pt'?tl.pt:tl.en}</span></i>
          </span>
          <span class="grow"></span>
          ${of?`<span class="dm-chip" title="${t('How much more pushing they will take')}">${t('patience')} ${dmPatience(th)}</span>`:''}
          ${knSizeHTML()}
          <button class="btn tight" data-dmarch="1" title="${th.arch?t('Move back to inbox'):t('Archive this chat')}">${th.arch?'&#8617;':'&#128230;'}</button>
          <button class="btn tight" data-dmdel="1" title="${t('Delete this chat')}">&#128465;</button>
        </div>
        <div class="dm-body" data-dmbody="1">${th.msgs.map(m=>sepDia(m)+balao(m)).join('')}</div>
        <div class="dm-foot">
          <div class="dmopts">${escolhas}</div>
          <div class="dm-cap">${dmSilenced(th.who)
            ? t('{0} has stopped reading your messages.',th.who)
            : t('{0} replies left today',num(restam))}</div>
        </div>
      </div>`;

    knWireSize(root);knApplySize();
    if(IS_MOB)root.classList.toggle('chatopen',!!KV.dmOpen);
    $$('[data-dmart]',root).forEach(c=>drawKaijuCached(c,{id:+c.dataset.dmart},Math.round(46*uiScale())));
    const body=$('[data-dmbody]',root);
    if(body)body.scrollTop=body.scrollHeight;

    $$('[data-th]',root).forEach(x=>x.onclick=()=>{
      SFX.click();KV.dm=x.dataset.th;KV.dmOpen=1;APPS.dm.refresh(b,ent);});
    $$('[data-dmtab]',root).forEach(x=>x.onclick=()=>{
      SFX.click();KV.dmArch=+x.dataset.dmtab;APPS.dm.refresh(b,ent);});
    const bk=$('[data-dmback]',root);
    if(bk)bk.onclick=()=>{SFX.click();KV.dmOpen=0;APPS.dm.refresh(b,ent);};
    S.unread=0;UI.updateTray();

    $('[data-dmarch]',root).onclick=()=>{
      SFX.click();dmArchive(th.who,!th.arch);
      UI.toast('mail',th.arch?t('Archived.'):t('Back in the inbox.'));
      APPS.dm.refresh(b,ent);};
    $('[data-dmdel]',root).onclick=()=>{
      UI.dialog(t('Delete this chat?'),
        t('The whole conversation with <b>{0}</b> goes away. They can write again another day.',th.who),'warn',
        {buttons:[{t:t('Delete'),v:1},{t:t('Cancel'),v:0}],onDone(v){
          if(!v)return;SFX.close();dmDelete(th.who);KV.dm=null;APPS.dm.refresh(b,ent);}});};

    $$('[data-dmacc]',root).forEach(x=>x.onclick=()=>{
      if(tiredGate())return;
      const id=+x.dataset.dmacc;
      const m=dmLiveOffer(th);
      const tk=G.tokens.find(y=>y.id===id);
      if(!m||m.tk!==id||!tk)return SFX.error();
      if(tk.staked){SFX.error();UI.dialog(t('It is in the vault'),t('Kaiju #{0} is staked.',id),'warn');return;}
      if(binderIds().has(id)){SFX.error();UI.dialog(t('It is in the binder'),t('Take Kaiju #{0} out of the binder first.',id),'warn');return;}
      const price=m.price||tokenValue(tk);
      removeToken(id);earn(price);
      G.log.sold++;G.totals.sold++;if(price>(G.bestSale||0))G.bestSale=price;
      addHype(.18);trustAdd(th.who,25);m.dead=1;
      if(typeof chainPush==='function')chainPush(0.7);
      if(typeof dmEvent==='function')dmEvent('sold',{who:th.who,v:price,tk:id});
      SFX.cash(price>200);haptic(HAP.cash);
      UI.floatFrom(x,'+'+money(price),'#0a6b2a');
      UI.toast('coin',t('{0} paid {1}',th.who,money(price)));
      dmSoon(th,LANG==='pt'?'chegou. obrigado de verdade.':'received. thank you, really.');
      timeAct(ACT.offer);checkLevel();APPS.dm.refresh(b,ent);UI.refresh();save();
    });

    $$('[data-dmopt]',root).forEach(x=>x.onclick=()=>{
      if(x.disabled)return;
      if(tiredGate())return;
      const o=opts[+x.dataset.dmopt];if(!o)return;
      const r=dmReply(th.who,o.tone);
      if(r.err==='cap'){SFX.error();UI.toast('warn',t('You have said enough for today.'));return;}
      if(r.err)return SFX.error();
      SFX.click();
      dmFeedback(r,x,th);
      APPS.dm.refresh(b,ent);UI.refresh();
    });

    const st=ent.win.querySelector('.st1');
    if(st)st.textContent=t('{0} conversation(s)',num(vis.length));
    const st2=ent.win.querySelector('.st2');
    if(st2)st2.textContent=of?t('offer on the table'):'';
  }
};

/* o retorno de cada escolha, num lugar só */
function dmFeedback(r,btn,th){
  switch(r.acao){
    case 'raise': SFX.coin();UI.floatFrom(btn,'+'+money(r.para-r.de),'#0a6b2a');
      UI.toast('coin',t('{0} went up to {1}',th.who,money(r.para)));break;
    case 'walk':  SFX.error();UI.toast('warn',t('{0} walked away from the deal.',th.who));break;
    case 'cold':  SFX.close();UI.toast('warn',t('{0} will not write again.',th.who));break;
    case 'virus':
      if(r.dano&&r.dano.blocked){SFX.notify();
        UI.toast('info',t('Kaiju Antivirus blocked it. That is what you paid for.'));}
      else {SFX.error();UI.confetti&&0;
        UI.dialog(t('You opened it'),
          t('It was not a screenshot. Something ran, your fans spun up, and <b>{0}</b> left your wallet.<br><br>Kaiju Antivirus would have caught this.',money((r.dano||{}).money||0)),'xerr');}
      break;
    case 'wiped':  SFX.close();UI.toast('info',t('Deleted.'));break;
    case 'warned': SFX.ok&&SFX.ok();UI.toast('kaiju',t('You warned them. People remember that.'));break;
    case 'seedtook':
      SFX.cash(1);
      UI.dialog(t('You took it'),
        t('You swept <b>{0}</b> out of a wallet that trusted you.<br><br>The money is real. So is what it costs you.',money(r.ganho||0)),'warn');
      break;
    case 'seedwarn': SFX.notify();UI.toast('kaiju',t('You told them to delete it. They will not forget.'));break;
    case 'took':   if(r.ganho){SFX.cash();UI.floatFrom(btn,'+'+money(r.ganho),'#0a6b2a');}break;
    case 'refused':SFX.notify();UI.toast('gift',t('You sent it back.'));break;
    case 'gave':   SFX.coin();UI.floatFrom(btn,'-'+money(r.gasto),'#a03020');
      UI.toast('gift',t('You helped {0} out.',th.who));break;
    case 'broke':  SFX.error();UI.toast('warn',t('You do not have it to give.'));break;
    case 'vow':    SFX.notify();UI.toast('kaiju',t('You gave your word on Kaiju #{0}.',r.tk));break;
    case 'novow':  SFX.click();UI.toast('info',t('You promised nothing.'));break;
    case 'swapped':
      SFX.cash(0);
      UI.dialog(t('Swapped'),
        t('Kaiju #{0} left your wallet and #{1} took its place.',r.deu,r.pegou),'kaiju');
      break;
    case 'boot':   SFX.coin();UI.floatFrom(btn,'+'+money(r.para),'#0a6b2a');
      UI.toast('coin',t('{0} put {1} on top of the swap.',th.who,money(r.para)));break;
    case 'busy':   SFX.error();UI.toast('warn',t('That Kaiju is locked up. Free it first.'));break;
    case 'keepmine':SFX.close();UI.toast('info',t('You kept yours.'));break;
    case 'heed':   SFX.notify();UI.toast('info',t('You will see suspicious files flagged for two days.'));break;
    case 'spread': SFX.notify();UI.toast('kaiju',t('You passed the warning around.'));break;
    case 'shrug':  SFX.close();UI.toast('warn',t('You brushed off the warning.'));break;
    case 'posted': SFX.ok&&SFX.ok();UI.toast('kaiju',t('You posted about it. Your name is on it now.'));break;
    case 'plugno': SFX.close();UI.toast('info',t('You kept your feed to yourself.'));break;
    case 'cleared':SFX.notify();UI.toast('kaiju',t('{0} took it back.',th.who));break;
    case 'doubled':SFX.error();UI.toast('warn',t('{0} is not letting it go.',th.who));break;
    case 'feud':   SFX.error();UI.toast('warn',t('That one is going to be repeated.'));break;
    case 'welcome':SFX.notify();UI.toast('mail',t('{0} is back.',th.who));break;
    case 'ghost':  SFX.close();UI.toast('warn',t('{0} will not try again.',th.who));break;
  }
}

/* ---------- a aba Messages fora do Kaki+ ----------
   O hub declara as abas em 42-hubs.js e aquele arquivo nao e meu: em vez de
   editar la, o hide() da aba dm ganha aqui uma condicao a mais. Com o
   interruptor desligado a aba nao e listada e o app nao e alcancavel;
   voltando DM_ON pra 1 a aba reaparece com a regra antiga (tab_dm). */
if(typeof HUB_DEF!=='undefined'&&HUB_DEF.hubsocial&&Array.isArray(HUB_DEF.hubsocial.tabs)){
  HUB_DEF.hubsocial.tabs.forEach(tb=>{
    if(!tb||tb.id!=='dm')return;
    const _hide=tb.hide;
    tb.hide=()=>!(typeof DM_ON!=='undefined'&&DM_ON)||(typeof _hide==='function'&&!!_hide());
  });
}

/* ---------- a janelinha de DM ----------
   Copia estrutural do scam: vive no #screen, nao escurece a tela, nao entra na
   fila de modal, e some sozinha. */
function dmPop(who,msg){
  if(!(typeof DM_ON!=='undefined'&&DM_ON))return;
  if(dmPopOpen)return;
  const S=soc();
  dmPopOpen=true;S.popsToday++;S.lastPopAt=G.day*24+G.hour;
  const w=el('div','win dmpop scamwin opening');
  w.innerHTML=`<div class="titlebar"><span class="ttl">${pixSVG('mail',12,'tico')} ${who}</span>
      <div class="tbtns"><button class="tb" data-dmx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody"><div class="pad">
      <div class="dmp-t">${msg.t}</div>
      ${msg.tk?`<div class="dmp-off">${t('for Kaiju #{0}',msg.tk)} <b>${money(msg.price||0)}</b></div>`:''}
      <div class="row" style="gap:5px;margin-top:9px">
        ${msg.tk?`<button class="btn grow" data-dmy="1">${t('ACCEPT')}</button>`:''}
        <button class="btn grow" data-dmo="1">${t('OPEN CHAT')}</button>
        <button class="btn" data-dmn="1">${t('Later')}</button>
      </div>
    </div></div>`;
  $('#screen').appendChild(w);
  setTimeout(()=>w.classList.remove('opening'),180);
  SFX.notify();
  const close=()=>{if(!w.isConnected)return;w.classList.add('closing');
    setTimeout(()=>{w.remove();dmPopOpen=false;},160);};
  $('[data-dmx]',w).onclick=$('[data-dmn]',w).onclick=()=>{SFX.close();close();};
  $('[data-dmo]',w).onclick=()=>{SFX.click();KV.dm=who;close();UI.openApp('hubsocial','dm');};
  const y=$('[data-dmy]',w);
  if(y)y.onclick=()=>{
    close();KV.dm=who;UI.openApp('hubsocial','dm');
    setTimeout(()=>{const btn=$('[data-dmacc]');if(btn)btn.click();},420);
  };
  setTimeout(close,30000);
}
