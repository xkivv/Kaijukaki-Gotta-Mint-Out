/* ================= APP: kaijukaki.net ================= */
/* quantidade escolhida e dobras abertas moram no registrador (G.prefs) */
const SV=prefView({qty:'mintQty'});
function siteFolds(){return prefMap('siteFolds');}
const REAL_URL='https://www.scatter.art/c/kaijukaki-rh';
const SITE_HISTORY=[REAL_URL,'http://www.kaijukaki.net/','http://www.kaijukaki.net/guestbook.html'];
const isHome=v=>{
  const q=(v||'').trim().toLowerCase();
  return q===''||q.indexOf('kaiju')>=0||q.indexOf('scatter.art')>=0;
};
/* dial-up: every navigation takes a moment, like it used to */
const LOAD_STAGES={
 en:['Looking up host...','Connecting to server...','Waiting for reply...','Transferring data...','Rendering page...'],
 pt:['Procurando o host...','Conectando ao servidor...','Esperando resposta...','Transferindo dados...','Desenhando a página...']
};
/* A internet de 1999 caia. Uma vez a cada tantas visitas o modem larga no meio
   e o jogador tem que apertar TENTAR DE NOVO. Nunca na PRIMEIRA carga da
   partida — mas em toda reabertura depois dela pode, senao isso nunca acontece:
   o jogador abre o icone (first) e fica na pagina, e refresh() nao renavega. */
let siteEverLoaded=false;
/* ---------- TAMANHO DA PAGINA (S / M / L) ----------
   Mesmo padrao do S/M/L da Carteira e do Kaki+: a escolha mora em G e volta
   no reload. Aqui ela vira uma classe em .page e quem escala e o CSS — o
   heroi, a esteira, o deck e as dobras seguem juntos porque a pagina inteira
   e desenhada em calc(px * var(--ui)), e a classe troca esse --ui local.
   Nada de texto encolhe abaixo do piso de leitura: o "S" aperta o espaco e os
   numeros gigantes, nunca a frase. */
const PAGE_SIZES={s:.84,m:1,l:1.16};
function pageSize(){const v=pref('pageSize');return PAGE_SIZES[v]?v:'m';}
function pageScale(){return PAGE_SIZES[pageSize()];}
function setPageSize(v,ent){
  if(!PAGE_SIZES[v])return;
  setPref('pageSize',v);
  if(ent)ent.restored=false;
  applyPageSize(ent);
  /* mudou a altura do conteudo: o MINT tem que continuar na tela */
  fitMintButton(ent);
}
function applyPageSize(ent){
  if(!ent||!ent.body)return;
  const pg=$('.page',ent.body);
  const k=pageSize();
  if(pg){pg.classList.remove('pg-s','pg-m','pg-l');pg.classList.add('pg-'+k);}
  const bar=ent.win&&ent.win.querySelector('.brtoolbar');
  if(bar)$$('[data-pgsize]',bar).forEach(x=>x.classList.toggle('on',x.dataset.pgsize===k));
}
function pgSizeHTML(){
  /* MODO HISTORIA: o S/M/L da pagina chega junto com o primeiro mint
     (b_first_mint). Antes disso o bloco nem existe na barra do navegador —
     esconder, nunca desabilitar. */
  if(typeof unlocked==='function'&&!unlocked('f_pagesize'))return '';
  return `<div class="sizebtns pgsize">${['s','m','l'].map(k=>
    `<button class="btn tight${pageSize()===k?' on':''}" data-pgsize="${k}" title="${t('Page size')}">${k.toUpperCase()}</button>`).join('')}</div>`;
}
function connectionDrops(first){
  if(first)return false;
  if(G&&G.dropShield){G.dropShield--;return false;}   /* nunca duas seguidas */
  return Math.random()<0.18;
}
function navigateTo(b,ent,url,first){
  const home=isHome(url);
  const target=home?REAL_URL:url;
  const inp=ent.win.querySelector('[data-url]');
  if(inp&&home)inp.value=REAL_URL;
  const stages=LOAD_STAGES[LANG]||LOAD_STAGES.en;
  const willDrop=connectionDrops(first);
  ent.loading={url:target,stage:stages[0],pct:4,drop:willDrop,at:willDrop?rf(0.35,0.85):2};
  ent.err=false;ent.dropped=false;
  SFX.modem();
  APPS.site.refresh(b,ent);
  if(ent.loadTimer)clearInterval(ent.loadTimer);
  const total=first?900:ri(1100,1900);
  const t0=performance.now();
  ent.loadTimer=setInterval(()=>{
    if(!ent.loading||!ent.win.isConnected){clearInterval(ent.loadTimer);return;}
    const k=Math.min(1,(performance.now()-t0)/total);
    /* o modem larga aqui */
    if(ent.loading.drop&&k>=ent.loading.at){
      clearInterval(ent.loadTimer);
      const pct=ent.loading.pct;
      ent.loading=null;ent.dropped={url:target,pct,home};
      G.dropShield=1;
      const tb2=ent.win.querySelector('[data-throb]');if(tb2)tb2.classList.remove('spin');
      SFX.error();
      APPS.site.refresh(b,ent);
      return;
    }
    ent.loading.pct=Math.min(99,4+k*96);
    const si=Math.min(stages.length-1,Math.floor(k*stages.length));
    if(ent.loading.stage!==stages[si]){ent.loading.stage=stages[si];SFX.tick();}
    const bar=ent.win.querySelector('[data-loadbar]');
    const txt=ent.win.querySelector('[data-loadtxt]');
    if(bar)bar.style.width=ent.loading.pct.toFixed(1)+'%';
    if(txt)txt.textContent=ent.loading.stage;
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=ent.loading.stage;st2.textContent=ent.loading.pct.toFixed(0)+'%';}
    if(k>=1){
      clearInterval(ent.loadTimer);
      ent.loading=null;
      ent.url=target;
      ent.err=!home;
      const tb=ent.win.querySelector('[data-throb]');if(tb)tb.classList.remove('spin');
      if(ent.err)SFX.error();else SFX.notify();
      APPS.site.refresh(b,ent);
    }
  },90);
}
APPS.site={
  title:'Kaijukaki.net - Kaiju Explorer', icon:'globe', w:520,
  /* A janela abria com 618 de altura e o botao MINT — o unico botao que
     importa — caia embaixo da dobra: o jogador tinha que rolar pra achar o
     produto. A altura pedida agora e a da pagina inteira ate o botao, e ela e
     CORTADA pelo que cabe na tela, nunca maior que o desktop.
     CUIDADO: openApp multiplica isto por uiScale(), entao devolvemos o alvo ja
     dividido pela escala, senao com --ui 1.7 a janela nasceria fora da tela. */
  get h(){
    const K=(typeof uiScale==='function')?uiScale():1;
    let cabe=760;
    try{const B=UI.bounds();if(B&&B.h>0)cabe=B.h-14;}catch(e){}
    const quero=Math.round(792*K*pageScale());
    return Math.round(Math.max(300,Math.min(quero,cabe))/K);
  },
  status:true,
  menu:['File','Edit','View','Favorites','Help'],
  build(b,ent){
    ent.win.querySelector('.wbody').classList.add('sunken');
    const bar=el('div','brtoolbar');
    bar.innerHTML=`<button class="btn tight" data-back="1">&#8592;</button>
      <button class="btn tight" data-fwd="1">&#8594;</button>
      <div class="addrwrap">
        <div class="addrbar">${pixSVG('globe',14)}<input type="text" data-url="1" value="${REAL_URL}" spellcheck="false" autocomplete="off"></div>
        <div class="addr-drop" data-drop="1"></div>
      </div>
      <button class="btn tight go" data-go="1">GO</button>
      <button class="btn tight" data-reload="1" title="${t('Reload')}">&#8635;</button>
      ${pgSizeHTML()}
      <span class="throbber" data-throb="1">${pixSVG('globe',18)}</span>`;
    ent.win.insertBefore(bar,ent.win.querySelector('.wbody'));
    ent.url=REAL_URL;ent.err=false;ent.loading=null;
    const input=$('[data-url]',bar), drop=$('[data-drop]',bar);
    input.style.userSelect='text';

    const suggestions=()=>{
      const v=(input.value||'').trim().toLowerCase();
      return SITE_HISTORY.filter(h=>!v||h.toLowerCase().indexOf(v)>=0);
    };
    const closeDrop=()=>{drop.classList.remove('open');drop.innerHTML='';};
    const openDrop=()=>{
      const list=suggestions();
      if(!list.length){closeDrop();return;}
      drop.innerHTML=list.map((h,i)=>`<div class="ad-item${i===0?' first':''}" data-sug="${h}">${pixSVG('globe',12)}<span>${h}</span></div>`).join('');
      drop.classList.add('open');
      $$('[data-sug]',drop).forEach(n=>n.onmousedown=e=>{
        e.preventDefault();
        input.value=n.dataset.sug;closeDrop();go();
      });
    };
    const go=()=>{
      const v=(input.value||'').trim();
      closeDrop();
      navigateTo(b,ent,v===''?REAL_URL:v);
    };
    $('[data-go]',bar).onclick=go;
    $('[data-reload]',bar).onclick=()=>{SFX.click();navigateTo(b,ent,ent.url||REAL_URL);};
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        const first=$('.ad-item.first',drop);
        if(!input.value.trim()&&first)input.value=first.dataset.sug;
        go();
      } else if(e.key==='Escape')closeDrop();
    });
    input.addEventListener('input',()=>{openDrop();});
    input.addEventListener('focus',()=>{input.select();openDrop();});
    input.addEventListener('blur',()=>setTimeout(closeDrop,120));
    $('[data-back]',bar).onclick=$('[data-fwd]',bar).onclick=()=>{
      input.value=REAL_URL;navigateTo(b,ent,REAL_URL);
    };
    $$('[data-pgsize]',bar).forEach(x=>x.onclick=()=>{SFX.click();setPageSize(x.dataset.pgsize,ent);});
    b.innerHTML=`<div class="page"><div class="pgroot"></div></div>`;
    applyPageSize(ent);
    /* a primeirissima visita da partida disca tambem, e essa nunca cai */
    const firstEver=!siteEverLoaded;siteEverLoaded=true;
    navigateTo(b,ent,REAL_URL,firstEver);
  },

  refresh(b,ent){
    const root=$('.pgroot',b);if(!root)return;
    applyPageSize(ent);
    if(ent.loading){this.loadingPage(root,b,ent);return;}
    if(ent.dropped){this.dropPage(root,b,ent);return;}
    if(ent.err){this.err404(root,b,ent);return;}
    const mp=mintPrice(),gf=gasFee(),pct=G.minted/SUPPLY*100;
    /* MODO HISTORIA: sem seletor de quantidade o padrao TEM que ser 1. Um
       save que ja tinha escolhido x5 mintaria cinco sem nada na tela dizendo
       por que — o padrao errado e pior que o botao escondido. */
    const bulkOn=unlocked('f_bulk');
    const opts=bulkOn?bulkOptions():[1];
    if(!opts.includes(SV.qty))SV.qty=bulkOn?opts[opts.length-1]:1;
    const nextLock=(bulkOn&&maxBulk()<BULK_MAX)?maxBulk()+1:0;
    const nf=Math.min(G.freeMints,SV.qty);
    const total=Math.max(0,(SV.qty-nf)*mp*saturation()*(1-G.coupon/100)+SV.qty*gf);
    const freeActive=G.freeMints>0;
    const sat=saturation();
    /* MODO HISTORIA: o scanner so aparece depois do beat b_queue — e mesmo
       depois continua exigindo o item comprado na loja */
    const odds=(unlocked('f_queue')&&has('sniff'))?queueOdds():null;
    /* a previa a direita do titulo devolve o que a antiga .keyrow mostrava,
       sem gastar uma faixa inteira da pagina com numero repetido */
    const FOLD=siteFolds();
    const fold=(id,label,body,pv)=>`<div class="fold${FOLD[id]?' open':''}" data-fold="${id}">
        <button class="fold-h" data-foldbtn="${id}"><span class="fchev">&#9654;</span>${label}${pv?`<span class="fold-pv">${pv}</span>`:''}</button>
        <div class="fold-b">${body}</div></div>`;

    const fair=(typeof floorPrice==='function')?floorPrice():0;
    const bleed=(0.35+Math.pow(G.hype/100,1.45)*1.8)*todayEvent().bleed*(typeof pressure==='function'?pressure():1)*(has('mods')?0.75:1);
    const ev=todayEvent();
    const evBad=ev.floor<1||ev.hype<0||ev.gas>1.2;
    const visitas=String(1000+Math.floor(G.hype*137)+G.minted*7).padStart(7,'0');

    root.innerHTML=`
    <div class="pghero" data-hero="1"></div>
    <div class="pgwrap">
      <div class="mintdeck${freeActive?' free':''}${G.mintout?' over':''}">
        <div class="deck-scarcity">
          <div class="sc-top">
            <span class="sc-lab">${t('MINTED')}</span>
            <span class="sc-num" data-supn="1">${num(G.minted)} / ${num(SUPPLY)}</span>
            <span class="sc-pct">${pct.toFixed(2)}%</span>
          </div>
          <div class="supplybar"><i style="width:0%"></i></div>
        </div>

        ${(freeActive||G.coupon)?`<div class="deck-tags">
          ${freeActive?`<span class="evtag">${pixSVG('gift',12)} ${(typeof unlocked==='function'&&!unlocked('free'))?t('WELCOME · TAKE YOUR FIRST FREE MINT!'):t('KAKIZONE EVENT · FREE MINT ON YOUR WALLET')}</span>`:''}
          ${(G.coupon&&!freeActive)?`<span class="evtag">${pixSVG('coin',12)} ${t('COUPON ACTIVE · -{0}%',G.coupon)}</span>`:''}
        </div>`:''}

        <div class="deck-offer${(bulkOn&&opts.length>4)?' many':''}">
          ${bulkOn?`<div class="qtycol">
            <div class="qtyrow">
              ${opts.map(o=>`<button class="qbtn ${o===SV.qty?'on':''}${o>capLeft()?' nofit':''}" data-q="${o}">x${o}</button>`).join('')}
              ${/* um cadeado que leva pra uma loja que ainda nao existe e um beco sem saida */(nextLock&&(typeof unlocked!=='function'||unlocked('shop')))?`<button class="qbtn lock" data-shoplink="1" title="${t('Buy upgrades at the Kaiju Shop')}">x${nextLock} &#128274;</button>`:''}
            </div>
          </div>`:''}
          <div class="billcol">
            <div class="bill">
              <div class="bl-row">
                <span>${t('Mint')} <i class="bl-free" data-blfree="1"${nf?'':' hidden'}>${nf} ${t('free')}</i> <span data-blmx="1">${SV.qty-nf>0?`&times;${SV.qty-nf}`:''}</span></span>
                <b data-blmint="1">${SV.qty-nf>0?money(mp*sat*(1-G.coupon/100)*(SV.qty-nf)):t('FREE')}</b>
              </div>
              <div class="bl-row gas gm-${gasMood()}">
                <span>${pixSVG('rocket',12)} ${t('Gas')} <span data-blgx="1">&times;${SV.qty}</span> <i>${Math.round(gasPct()*100)}% ${t('of mint')}</i></span>
                <b data-blgas="1">${money(gf*SV.qty)}</b>
              </div>
              <div class="bl-row total">
                <span>${t('You pay')}</span>
                <b data-bltot="1">${total<=0.005?t('FREE'):money(total)}</b>
              </div>
            </div>
          </div>
        </div>

        <button class="mintbig${freeActive&&!G.mintout?' event':''}" data-mint="1" ${G.mintout?'disabled':''}>
          <span class="mb-q">${G.mintout?t("MINTOUT — IT'S OVER"):`MINT x${SV.qty}`}</span>
          ${G.mintout?'':`<span class="mb-price" data-mbprice="1">${total<=0.005?t('FREE'):money(total)}</span>`}
        </button>

        <div class="deck-foot">
          <span>${t('you')} <b>${num(G.myMinted||0)}</b></span>
          <span data-dfmin="1">${mintMinutes(SV.qty)} min</span>
          <span class="${capLeft()<=0?'bad':capLeft()<5?'warn':''}">${num(held())}/${num(capacity())}</span>
          ${SV.qty>capLeft()?`<span class="bad">${t('only {0} fit',capLeft())}</span>`:''}
        </div>
      </div>

      ${odds?`<div class="qodds heat-${odds.heat}">
        <div class="qo-h">${pixSVG('info',12)} ${t('QUEUE SCANNER · next {0} mints',odds.window)}</div>
        ${[[t('Rare or better'),odds.rare,2],[t('Epic or better'),odds.epic,3],[t('Mythic'),odds.myth,5]].map(([l,v,r])=>
          `<div class="qo-row"><span>${l}</span><div class="qo-bar r${r}"><i style="width:${(v*100).toFixed(0)}%"></i></div><b>${(v*100).toFixed(0)}%</b></div>`).join('')}
        <div class="tiny dim">${t('It reads the shape of the queue, not the cards.')}</div>
      </div>`:''}

      ${lastMintsStrip()}

      ${unlocked('m_hype')?`<div class="hyperow${G.hype<20?' low':''}">
        <div class="hr-k">${pixSVG('fire',13)} ${t('HYPE')}</div>
        <div class="hr-bar"><i style="width:${clamp(G.hype,0,100).toFixed(0)}%"></i></div>
        <div class="hr-v">${G.hype.toFixed(0)}%<i>-${bleed.toFixed(1)}/h</i></div>
        <button class="btn tight" data-tokn="1">${t('POST ON KAKI+')}</button>
      </div>`:''}

      <div class="pgstats">
        ${fold('stats',t('Numbers'),`
          <div class="iconstats">
            ${[['rocket',t('Gas per mint'),money(gf)],
               ['wallet',t('Royalty (you)'),Math.round(royaltyRate()*100)+'%'],
               ['globe',t('Mints/hour'),npcMintRate().toFixed(1)],
               ['market',t('Held by others'),num(npcHeld())],
               ['chart',t('You own'),num(held())],
               ['fire',t('Minted'),pct.toFixed(2)+'%'],
               ['warn',t('Hype drain / hour'),'-'+bleed.toFixed(1)],
               ['rocket',t('Contract speed'),t('Lv {0} · {1} min',contractLevel(),mintMinutes(SV.qty))],
               ['vault',t('Wallet slots'),num(held())+' / '+num(capacity())],
               ['warn',t('Market saturation'),'+'+Math.round((sat-1)*100)+'%']
              ].map(r=>`<div class="istat">${pixSVG(r[0],20)}<span class="is-k">${r[1]}</span><span class="is-v">${r[2]}</span></div>`).join('')}
          </div>`,money(mp))}

        ${fold('money',t('How you make money'),`
          <div class="foldtxt">${t('Every mint made by SOMEONE ELSE pays you {0} royalty. The higher the hype, the more people mint on their own. Minting yourself is expensive — it is what creates the hype.',Math.round(royaltyRate()*100)+'%')}</div>
          ${this.referralBox()}`,Math.round(royaltyRate()*100)+'%')}

        ${fold('about',t('About'),`
          <div class="foldtxt">
            ${t('Kaijukaki is 8888 hand-drawn PFP collectibles born out of hyper-violent neo-shonen: bad monsters, worse manners, drawn one by one on a machine that should have died in 1999.')}<br><br>
            ${t('No roadmap. No utility. No promises. Every Kaiju has a Race and a set of traits, and some of them are not supposed to exist.')}<br><br>
            <span style="color:var(--page-dim)">${t('Owner:')}</span> Oekaki Connect &nbsp;·&nbsp;
            <span style="color:var(--page-dim)">${t('Accountant:')}</span> Mr. Kaiju &nbsp;·&nbsp;
            <span style="color:var(--page-dim)">${t('Mint on:')}</span> scatter.art
          </div>`,'scatter.art')}
      </div>

      <div class="pgbadges">
        <div class="rosette">${pixSVG('kaiju',16)}</div>
        <div class="rz-txt">${t('SITE OF THE DAY')}<i>KAKINET 199X</i></div>
        <div class="grow"></div>
      </div>

      <div class="pgfoot">
        <span class="odo">${t('VISITORS:')} <b>${visitas.split('').map(d=>`<i>${d}</i>`).join('')}</b></span>
        <span>${t('© 199X Kaijukaki. Best with Netscape 4.')}</span>
      </div>
    </div>`;
    heroInto($('[data-hero]',root),ev,evBad,visitas);
    UI.setProg($('.supplybar i',root),pct,G._lastPct==null?0:G._lastPct);
    const supn=$('[data-supn]',root);
    if(supn&&G._lastMinted!=null&&G._lastMinted!==G.minted){
      const from=G._lastMinted,to=G.minted,t0=performance.now(),D=520;
      const tick=()=>{
        if(!supn.isConnected)return;
        const k=Math.min(1,(performance.now()-t0)/D);
        supn.textContent=num(Math.round(from+(to-from)*(1-Math.pow(1-k,3))))+' / '+num(SUPPLY);
        if(k<1)requestAnimationFrame(tick);
      };
      tick();
    }
    G._lastMinted=G.minted;
    G._lastPct=pct;
    wireStrip(root);
    /* trocar a quantidade nao pode dar refresh() inteiro: isso redesenha o
       heroi e todos os canvases. So a conta e o preco do botao mudam, e eles
       ROLAM — o clique tem que empurrar o dinheiro na frente do jogador. */
    $$('.qbtn[data-q]',root).forEach(bt=>bt.onclick=()=>{
      const antes=SV.qty, agora=+bt.dataset.q;
      if(antes===agora){SFX.click();return;}
      SFX.click();haptic(HAP.tap);
      SV.qty=agora;
      $$('.qbtn[data-q]',root).forEach(o=>o.classList.toggle('on',+o.dataset.q===SV.qty));
      quoteRoll(root,agora>antes);
    });
    const sl=$('[data-shoplink]',root);
    if(sl)sl.onclick=()=>{SFX.click();UI.openApp('shop');};
    $$('[data-foldbtn]',root).forEach(bt=>bt.onclick=()=>{
      const id=bt.dataset.foldbtn;
      const F=siteFolds();
      F[id]=F[id]?0:1;prefSave();SFX.down();
      bt.parentNode.classList.toggle('open',!!F[id]);
    });
    const mb=$('[data-mint]',root);
    if(mb)mb.onclick=()=>mintPress(root,mb,SV.qty,b,ent);
    const knb=$('[data-tokn]',root);
    if(knb)knb.onclick=e=>{e.stopPropagation();SFX.click();UI.openApp('hubsocial','kaijunet');};
    this.wireReferral(root,b,ent);
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=`${t('Floor')} ${money(floorPrice())} · ${t('{0} minted',pct.toFixed(2)+'%')}`;st2.textContent=t('Internet');}
    fitMintButton(ent);
  },

  loadingPage(root,b,ent){
    const L=ent.loading;
    root.innerHTML=`<div class="pgwrap loadwrap">
      <div class="loadglobe">${pixSVG('globe',48)}</div>
      <div class="loadtxt" data-loadtxt="1">${L.stage}</div>
      <div class="loadbar"><i data-loadbar="1" style="width:${L.pct}%"></i></div>
      <div class="loadhost">${(L.url||'').slice(0,64)}</div>
      <div class="loadmodem">${t('Connected at 56.6 Kbps')}</div>
    </div>`;
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=L.stage;st2.textContent=L.pct.toFixed(0)+'%';}
    const tb=ent.win.querySelector('[data-throb]');if(tb)tb.classList.add('spin');
  },

  referralBox(){
    /* MODO HISTORIA: antes do hakase falar do link (b_referral) a caixa nao
       existe. Nem o cadeado: quem nunca ouviu falar disso nao precisa ver. */
    if(!unlocked('f_referral'))return '';
    if(!referralUnlocked()){
      return `<div class="refbox locked">
        <div class="reflock">&#128274; ${t('Referral: unlocks at level {0} ({1})',REFERRAL_LEVEL,LEVELS[REFERRAL_LEVEL-1].n)}</div>
      </div>`;
    }
    if(!G.referral){
      return `<div class="refbox">
        <div class="reflink"><button class="refbtn" data-refgen="1">${t('GENERATE MY LINK')}</button>
        <span class="tiny" style="color:var(--page-dim)">${t('royalty 30% &rarr; 40%')}</span></div>
      </div>`;
    }
    return `<div class="refbox">
      <div class="reflink">
        <input type="text" data-reflink="1" readonly value="${REAL_URL}?ref=${G.refCode}">
        <button class="refbtn" data-refcopy="1">${t('COPY')}</button>
      </div>
      <div class="tiny" style="color:var(--page-dim);margin-top:5px">${t('Royalty 40% · {0} mints via your link',num(G.refMints))}</div>
    </div>`;
  },
  wireReferral(root,b,ent){
    const gen=$('[data-refgen]',root);
    if(gen)gen.onclick=()=>{
      G.referral=true;
      G.refCode=(G.refCode||('KAKI'+Math.random().toString(36).slice(2,6).toUpperCase()));
      SFX.coin();UI.confetti(34,['#a8e832','#d4ff6b','#ffffff']);
      UI.toast('gift',t('Referral active — royalty is now 40%.'));
      APPS.site.refresh(b,ent);save();
    };
    const cp=$('[data-refcopy]',root);
    if(cp)cp.onclick=()=>{
      const inp=$('[data-reflink]',root);
      try{inp.select();inp.setSelectionRange(0,999);document.execCommand('copy');}catch(e){}
      try{if(navigator.clipboard)navigator.clipboard.writeText(inp.value);}catch(e){}
      SFX.click();UI.toast('info',t('Link copied.'));
    };
  },

  dropPage(root,b,ent){
    const d=ent.dropped;
    root.innerHTML=`<div class="pgwrap droppage">
      <div class="drop-ico">${pixSVG('globe',44)}<span class="drop-cut"></span></div>
      <div class="drop-t">${t('CONNECTION LOST')}</div>
      <div class="drop-m">${t('The server stopped responding at {0}%.',d.pct.toFixed(0))}<br>
        <span class="dim">${pick([
          t('Somebody picked up the phone.'),
          t('The modem gave up. It happens.'),
          t('Packet loss. Or the router is on fire.'),
          t('The line dropped. Blame the weather.')
        ])}</span></div>
      <div class="drop-url">${(d.url||'').slice(0,90)}</div>
      <button class="mintbig" data-retry="1">${t('RETRY')}</button>
      <div class="tiny" style="color:#4a6a28;margin-top:16px">${t('ERR_CONNECTION_RESET · Kaijukaki Web Services')}</div>
    </div>`;
    $('[data-retry]',root).onclick=()=>{
      SFX.click();
      ent.dropped=false;
      navigateTo(b,ent,d.url);
    };
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=t('Connection lost');st2.textContent=t('Offline');}
  },
  err404(root,b,ent){
    root.innerHTML=`<div class="pgwrap" style="padding-top:26px;text-align:center">
      <canvas data-dino="1" style="width:210px;max-width:80%;height:auto;image-rendering:pixelated;display:block;margin:0 auto 14px"></canvas>
      <div style="font-family:var(--pix);font-size:calc(16px * var(--fs));color:var(--lime-hi);margin-bottom:10px">404</div>
      <div style="font-size:calc(15px * var(--fs));color:var(--page-txt);line-height:1.7">
        ${t('This page does not exist.')}<br>
        <span style="color:var(--page-dim)">${t('The Kaiju ate it. Or it was never here. Hard to say.')}</span>
      </div>
      <div style="font-family:var(--term);font-size:calc(19px * var(--fs));color:var(--page-dim);margin:14px 0;word-break:break-all">${(ent.url||'').slice(0,90)}</div>
      <button class="refbtn" data-home="1">${t('TAKE ME BACK')}</button>
      <div class="tiny" style="color:#4a6a28;margin-top:22px">${t('HTTP 404 · Kaijukaki Web Services')}</div>
    </div>`;
    const cv=$('[data-dino]',root);
    if(cv)mountDino(cv);
    $('[data-home]',root).onclick=()=>{
      SFX.click();
      const inp=ent.win.querySelector('[data-url]');if(inp)inp.value=REAL_URL;
      navigateTo(b,ent,REAL_URL);
    };
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=t('Page not found');st2.textContent=t('Internet');}
  }
};

/* ================= O BOTAO TEM QUE ESTAR NA TELA =================
   A altura pedida em APPS.site.h ja abre a janela grande, mas o conteudo muda
   de tamanho (evento do dia, scanner da fila, escala da interface). Depois que
   a pagina desenha, a gente mede: se o MINT ficou abaixo da dobra, a janela
   CRESCE ate ele aparecer — nunca alem da tela. Se nem a tela inteira resolve
   (netbook em --ui 1.7), o heroi encolhe (.page.tight) em vez de esconder o
   produto. So cresce, nunca diminui a janela do jogador. */
function fitMintButton(ent){
  if(!ent||!ent.win||!ent.win.isConnected||ent.max)return;
  /* janela reaberta do jeito que o jogador deixou: o tamanho e dele. Ele so
     volta a ser nosso quando ELE mudar o tamanho da pagina. */
  if(ent.restored)return;
  if(typeof IS_MOB!=='undefined'&&IS_MOB)return;
  const K=(typeof uiScale==='function')?uiScale():1;
  let B;try{B=UI.bounds();}catch(e){return;}
  /* o tamanho da pagina entra na assinatura: trocar S/M/L muda a altura do
     conteudo e o botao precisa ser medido de novo */
  const assinatura=K+'/'+pageSize()+'@'+Math.round(B.w)+'x'+Math.round(B.h);
  if(ent.__fit===assinatura)return;
  ent.__fit=assinatura;
  const pg=$('.page',ent.body);
  if(pg)pg.classList.remove('tight');
  requestAnimationFrame(()=>{
    if(!ent.win.isConnected||ent.max)return;
    const mb=ent.win.querySelector('.mintbig');
    if(!mb||!ent.body)return;
    const folga=Math.round(10*K);
    const sobra=()=>Math.ceil(mb.getBoundingClientRect().bottom+folga-ent.body.getBoundingClientRect().bottom);
    let falta=sobra();
    if(falta>0){
      const h0=ent.win.offsetHeight;
      const h1=Math.min(Math.max(200,B.h-8),h0+falta);
      if(h1>h0){
        ent.win.style.height=h1+'px';
        const topo=ent.win.offsetTop;
        ent.win.style.top=Math.max(0,Math.min(topo,B.h-h1-4))+'px';
        falta=sobra();
      }
    }
    /* ainda nao coube: o heroi cede espaco, o botao nao */
    if(falta>0&&pg){pg.classList.add('tight');falta=sobra();}
    /* ultimo recurso (tela de netbook em escala grande): a pagina ja abre
       rolada o tanto que falta. O botao aparece, custe o que custar. */
    if(falta>0&&ent.body.scrollHeight>ent.body.clientHeight)
      ent.body.scrollTop=Math.min(ent.body.scrollHeight,ent.body.scrollTop+falta);
  });
}

/* ---- 404 kaiju (the offline-dino gag) ---- */
function mountDino(cv){
  const S=24,W=24,H=24,dpr=Math.min(2,window.devicePixelRatio||1);
  const size=Math.min(210,cv.clientWidth||210);
  cv.width=size*dpr;cv.height=size*dpr;
  const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.imageSmoothingEnabled=false;
  const u=size/S,P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*u),Math.round(y*u),Math.ceil(w*u),Math.ceil(h*u));};
  let f=0,raf=0,last=performance.now(),acc=0;
  const body='#93b86a',dark='#4a6a28',ink='#101a08';
  const draw=()=>{
    g.clearRect(0,0,size,size);
    const hop=f%4===1?-1:f%4===3?0:0;
    const y0=6+hop;
    /* head */
    P(12,y0,8,6,body);P(12,y0,8,1,dark);P(19,y0+1,1,5,dark);
    P(17,y0+2,2,2,'#ffffff');P(18,y0+3,1,1,ink);
    P(12,y0+5,6,1,dark);
    /* horn */
    P(14,y0-2,2,2,body);P(14,y0-2,2,1,dark);
    /* jaw */
    P(15,y0+6,5,2,body);P(16,y0+7,1,1,'#ffffff');P(18,y0+7,1,1,'#ffffff');
    /* body */
    P(6,y0+6,10,8,body);P(6,y0+6,10,1,dark);P(6,y0+13,10,1,dark);
    /* spikes */
    P(7,y0+5,1,1,dark);P(9,y0+4,1,2,dark);P(11,y0+5,1,1,dark);
    /* tail */
    P(2,y0+8,4,3,body);P(1,y0+9,1,2,dark);
    /* legs */
    const step=f%2===0;
    P(7,y0+14,3,3,body);P(12,y0+14,3,3,body);
    P(step?7:12,y0+17,3,1,dark);
    /* ground dashes */
    for(let i=0;i<5;i++){const x=(i*6+f*2)%26-2;P(x,22,3,1,'#3a5a1c');}
    /* X eyes when unplugged */
  };
  const loop=now=>{
    if(!cv.isConnected){cancelAnimationFrame(raf);return;}
    acc+=now-last;last=now;
    if(acc>140){acc=0;f=(f+1)%8;draw();}
    raf=requestAnimationFrame(loop);
  };
  draw();raf=requestAnimationFrame(loop);
}

/* ---- mint + reveal ---- */
function doMintFlow(q,btn,chained){
  if(tiredGate())return;
  if(G.mintout){SFX.error();UI.dialog(t('Mintout'),t('The collection already minted out. There is nothing left to mint.'),'warn');return;}
  /* nunca mintar menos do que o jogador pediu por baixo dos panos: se nao cabe,
     ele decide se quer o que cabe, se prefere abrir espaco, ou se deixa pra la */
  const room=capLeft();
  if(q>1&&room<q){
    SFX.error();
    if(room<=0){
      const nx=nextCapUpgrade();
      UI.dialog(t('Wallet full'),
        t('Your wallet holds {0} Kaiju and it is full.<br><br>{1}',num(capacity()),
          (nx&&(typeof unlocked!=='function'||unlocked('shop')))?t('Expanding it to <b>{0}</b> costs {1} in the Kaiju Shop. Or sell something first.',num(nx.cap),money(nx.cost)):t('Sell something first.')),'warn');
      return;
    }
    UI.dialog(t('Not enough room'),
      t('You asked for <b>{0}</b> but only <b>{1}</b> more fit in the wallet ({2}/{3}).<br><br>Nothing was minted and nothing was charged.',
        q,room,num(held()),num(capacity())),'warn',
      /* so oferece a loja quando ela ja existe pro jogador */
      {buttons:[{t:t('MINT {0}',room),v:1}].concat((typeof unlocked!=='function'||unlocked('shop'))?[{t:t('Kaiju Shop'),v:2}]:[]).concat([{t:t('Cancel'),v:0}]),onDone(v){
        if(v===1)setTimeout(()=>doMintFlow(room,btn,chained),150);
        else if(v===2)UI.openApp('shop');
      }});
    return;
  }
  const r=doMint(q);
  if(!r)return;
  if(r.err==='full'){
    SFX.error();
    const nx=nextCapUpgrade();
    UI.dialog(t('Wallet full'),
      t('Your wallet holds {0} Kaiju and it is full.<br><br>{1}',num(capacity()),
        (nx&&(typeof unlocked!=='function'||unlocked('shop')))?t('Expanding it to <b>{0}</b> costs {1} in the Kaiju Shop. Or sell something first.',num(nx.cap),money(nx.cost)):t('Sell something first.')),'warn');
    return;
  }
  if(r.err==='money'){
    SFX.error();
    UI.dialog(t('Not enough money'),t((typeof unlocked==='function'&&!unlocked('free'))?'You need <b>{0}</b> and you have <b>{1}</b>.<br><br>Sell something on the Kaiju Market, or end the day and let the royalties come in.':'You need <b>{0}</b> and you have <b>{1}</b>.<br><br>Sell something on the Kaiju Market, or grab the free mint in the Kakizone.',money(r.need),money(G.money)),'warn');
    return;
  }
  if(!r.made.length)return;
  SFX.mint();haptic(HAP.mint);
  r.made.forEach(x=>{x.hidden=1;});
  timeAct(mintMinutes(q));
  if(btn){
    if(r.cost>0.005)UI.floatFrom(btn,'-'+money(r.cost),'#d24b3a');
    else UI.floatFrom(btn,'FREEMINT','#a8e832');
  }
  const best=r.made.reduce((a,b)=>b.rarity>a.rarity?b:a,r.made[0]);
  /* nothing may spoil the reveal: queue every reaction until the player closes it */
  PENDING_REVEAL=()=>{
    if(best.rarity>=3)UI.think(pick(TH('rare')),true);
    checkRaces(r.made);
    checkLevel();
  };
  if(q===1)revealOne(r.made[0],q);
  else revealMany(r.made,best,r.cost,q);
  save();
}
/* only the traits this Kaiju actually has, Race first */
function shownTraits(tk){
  const out=['Race'];
  TRAIT_LAYERS.forEach(l=>{if(l!=='Race'&&tk.traits[l])out.push(l);});
  return out;
}
let PENDING_REVEAL=null;
function releaseHidden(){
  G.tokens.forEach(x=>{if(x.hidden)delete x.hidden;});
  const f=PENDING_REVEAL;PENDING_REVEAL=null;
  if(f)setTimeout(()=>{try{f();}catch(e){}UI.refresh();save();},210);
}
function mintAgainBtn(q){
  if(!has('again'))return '';
  return `<button class="btn big" data-again="${q}">${t('MINT AGAIN')}</button>`;
}
function wireAgain(box,m){
  const a=$('[data-again]',box);
  if(!a)return;
  a.onclick=()=>{
    const q=+a.dataset.again||1;
    SFX.click();m.close();releaseHidden();
    setTimeout(()=>doMintFlow(q,$('[data-mint]'),true),120);
  };
}
const SPIN_STEPS=[52,52,55,60,66,74,86,102,124,156,202,266,350];
/* Giro curto pro que nao vale suspense. O jogador liga isso quando ja mintou
   centenas de vezes; o pico emocional continua inteiro porque Raro pra cima
   sempre leva o giro completo. */
const SPIN_QUICK=[60,70,90,130,190];
function fastReveal(){return !!pref('fastReveal');}
function spinFor(tk){return (fastReveal()&&tk&&tk.rarity<=1)?SPIN_QUICK:SPIN_STEPS;}
/* a arte e o pico emocional: num celular ela precisa encher o palco.
   408 = largura maxima do modal; 56 = molduras do .reveal + .rv-stage no mob. */
function revealSize(){
  const K=(typeof uiScale==='function')?uiScale():1;
  if(typeof IS_MOB==='undefined'||!IS_MOB)return Math.round(248*K);
  return clamp(Math.round(Math.min(mobWidth(),408*K)-46),248,360);
}
function revealOne(tk,q){
  const R=RARITY[tk.rarity];
  UI.modal(`<div class="titlebar">${pixSVG('globe',14,'tico')}<span class="ttl">${t('Revealing...')}</span>
      <div class="tbtns"><button class="tb" data-rvx="1" title="${t('Close')}"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody reveal big"><div class="rv-stage">
      <div class="rv-shroud spin"><canvas data-rvcv="1"></canvas></div>
      <div class="rv-name" data-rvname="1">?????</div>
      <div class="rv-race" data-rvrace="1">&nbsp;</div>
      <div class="rv-rar" data-rvrar="1" style="background:#3a3a3a">. . .</div>
      <div class="rv-racebox" data-rvracebox="1"><b>${t('Race')}</b><span data-rvracev="1">?????</span></div>
    </div>
    <div class="pad" style="padding:8px 9px 0"><div class="prog" data-rvprog="1"><i style="width:0%"></i></div></div>
    <div class="row" style="justify-content:center;padding:9px;gap:7px">
      <button class="btn big" data-rvok="1" disabled>${t('REVEALING...')}</button>${mintAgainBtn(q||1)}
    </div></div>`,
  'reveal',m=>{
    const box=m.box, cv=$('[data-rvcv]',box), RVSZ=revealSize();
    $('[data-rvx]',box).onclick=()=>{SFX.close();m.close();releaseHidden();UI.refresh();};
    const SPIN=spinFor(tk);
    const totalMs=SPIN.reduce((a,b)=>a+b,0);
    const pi=$('[data-rvprog] i',box);
    pi.style.transition=`width ${totalMs}ms linear`;
    requestAnimationFrame(()=>{pi.style.width='100%';});
    const ag=$('[data-again]',box);if(ag)ag.disabled=true;
    let n=0;
    const step=()=>{
      if(!box.isConnected)return;
      drawKaiju(cv,{id:randomTokenId()},RVSZ);
      SFX.tick();
      if(n<SPIN.length)setTimeout(step,SPIN[n++]);
      else settle();
    };
    /* a modal leva ~170ms pra entrar. Comecar o giro antes disso faz o som
       do sorteador tocar com a tela ainda vazia. */
    setTimeout(step,180);
    function settle(){
      const sh=$('.rv-shroud',box);
      sh.classList.remove('spin');
      drawKaiju(cv,tk,RVSZ);
      SFX.reveal(tk.rarity);
      /* baque de aterrissagem: identico pra toda raridade, senao a vibracao
         entregaria o resultado antes da pilula aparecer */
      haptic(HAP.tap);
      if(tk.rarity>=3){sh.classList.add('glow');sh.style.setProperty('--rc',R.c);}
      if(tk.rarity>=4){UI.flash();box.classList.add('shake');setTimeout(()=>box.classList.remove('shake'),340);}
      const tt=$('.ttl',box);if(tt)tt.textContent='Kaiju #'+tk.id;
      setTimeout(()=>{
        $('[data-rvname]',box).textContent=(tk.traits.Name?tk.traits.Name.toUpperCase():'KAIJUKAKI #'+tk.id);
        $('[data-rvrace]',box).textContent='#'+tk.id+' · '+t('Rank {0} of {1}',num(tk.score),num(SUPPLY));
      },130);
      const showRar=()=>{
        const rr=$('[data-rvrar]',box);rr.textContent=rarName(tk.rarity).toUpperCase();rr.style.background=R.c;
        rr.classList.remove('pop');void rr.offsetWidth;rr.classList.add('pop');
        /* a vibracao escala com a raridade e sai junto com a pilula, nunca antes */
        const hv=HAP.rar[tk.rarity];if(hv)haptic(hv);
        if(tk.rarity>=3)UI.confetti(tk.rarity>=5?150:tk.rarity>=4?80:36,[R.c,'#ffffff','#a8e832'],50);
      };
      if(tk.rarity>=5){
        setTimeout(()=>{const rr=$('[data-rvrar]',box);rr.textContent=rarName(4).toUpperCase();rr.style.background=RARITY[4].c;
          rr.classList.add('pop');SFX.tick();haptic(HAP.rar[4]);},240);
        setTimeout(()=>{UI.flash();showRar();SFX.levelup();},700);
      } else setTimeout(showRar,280);
      setTimeout(()=>{
        const rb=$('[data-rvracebox]',box);
        if(rb){rb.classList.add('tin');$('[data-rvracev]',box).textContent=raceOf(tk);}
      },380);
      setTimeout(()=>{
        pi.parentNode.parentNode.style.display='none';
        const ok=$('[data-rvok]',box);ok.disabled=false;ok.textContent=t('KEEP IT');
        ok.onclick=()=>{SFX.click();m.close();releaseHidden();UI.refresh();};
        const a2=$('[data-again]',box);if(a2)a2.disabled=false;
        wireAgain(box,m);
      },640+(tk.rarity>=5?400:0));
    }
  });
}
/* scrollIntoView rola TODOS os ancestrais rolaveis — inclusive o #modalveil,
   que e overflow:auto. Era isso que empurrava a tela inteira a cada carta que
   aterrissava no mint multiplo. Aqui a gente rola so a tira, na mao. */
function stripTo(th){
  if(!th||!th.parentNode)return;
  const s=th.parentNode;
  if(s.scrollWidth<=s.clientWidth)return;
  s.scrollLeft=th.offsetLeft-(s.clientWidth-th.offsetWidth)/2;
}
function revealMany(list,best,cost,q){
  const counts=[0,0,0,0,0,0];list.forEach(x=>counts[x.rarity]++);
  /* o melhor da leva vai por ultimo: o sorteio tem que terminar no clima alto */
  const order=list.slice().sort((a,b)=>a===best?1:b===best?-1:0);
  let cur=0;
  const revealed=new Array(order.length).fill(false);
  UI.modal(`<div class="titlebar">${pixSVG('globe',14,'tico')}<span class="ttl">${t('Revealing...')}</span>
      <div class="tbtns"><button class="tb" data-rvx="1" title="${t('Close')}"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody reveal big"><div class="rv-stage">
      <div class="rv-count" data-rvcount="1">1 / ${order.length}</div>
      <div class="rv-shroud spin"><canvas data-rvcv="1"></canvas>
        <button class="rv-arrow l" data-rvprev="1">&#8592;</button>
        <button class="rv-arrow r" data-rvnext="1">&#8594;</button>
        <div class="rv-bestmark" data-rvbest="1" style="display:none">&#9733; ${t('BEST')}</div>
      </div>
      <div class="rv-name" data-rvname="1">?????</div>
      <div class="rv-race" data-rvrace="1">&nbsp;</div>
      <div class="rv-rar" data-rvrar="1" style="background:#3a3a3a">. . .</div>
      <div class="rv-racebox" data-rvracebox="1"><b>${t('Race')}</b><span data-rvracev="1">?????</span></div>
      <div class="rv-strip" data-rvstrip="1">${order.map((x,i)=>`<button class="rv-th" data-rvgo="${i}"><canvas></canvas><i class="r${x.rarity}"></i></button>`).join('')}</div>
      <div class="rv-sum" data-rvsum="1" style="visibility:hidden">
        <div class="rv-tiers">${RARITY.map((r,i)=>counts[i]?`<span style="background:${r.c}">${rarName(i)} &times;${counts[i]}</span>`:'').join('')}</div>
        <div class="tiny dim">${t('Total cost: {0}',cost>0.005?money(cost):t('FREE'))}</div>
      </div>
    </div>
    <div class="pad" style="padding:8px 9px 0"><div class="prog" data-rvprog="1"><i style="width:0%"></i></div></div>
    <div class="row" style="justify-content:center;padding:9px;gap:7px">
      <button class="btn big" data-rvok="1">${t('SKIP')}</button>${mintAgainBtn(q||list.length)}
    </div></div>`,
  'reveal many',m=>{
    const box=m.box, cv=$('[data-rvcv]',box), RVSZ=revealSize();
    const sh=$('.rv-shroud',box), pi=$('[data-rvprog] i',box);
    let finished=false;
    const close=()=>{SFX.close();m.close();releaseHidden();UI.refresh();};
    $('[data-rvx]',box).onclick=close;
    const ag=$('[data-again]',box);if(ag)ag.disabled=true;
    $$('.rv-arrow',box).forEach(a=>a.style.display='none');

    pi.style.transition='width .12s linear';
    const bump=()=>{pi.style.width=Math.round(idx/order.length*100)+'%';};

    function paint(i,animate){
      const tk=order[i];cur=i;
      const R=RARITY[tk.rarity];
      drawKaiju(cv,tk,RVSZ);
      sh.classList.toggle('glow',tk.rarity>=3);
      sh.style.setProperty('--rc',R.c);
      $('[data-rvcount]',box).textContent=(i+1)+' / '+order.length;
      $('[data-rvname]',box).textContent=(tk.traits.Name?tk.traits.Name.toUpperCase():'KAIJUKAKI #'+tk.id);
      $('[data-rvrace]',box).textContent='#'+tk.id+' · '+t('Rank {0} of {1}',num(tk.score),num(SUPPLY));
      const rr=$('[data-rvrar]',box);
      rr.textContent=rarName(tk.rarity).toUpperCase();rr.style.background=R.c;
      if(animate){rr.classList.remove('pop');void rr.offsetWidth;rr.classList.add('pop');}
      const rb=$('[data-rvracebox]',box);
      if(animate){rb.classList.remove('tin');void rb.offsetWidth;}
      rb.classList.add('tin');
      $('[data-rvracev]',box).textContent=raceOf(tk);
      $('[data-rvbest]',box).style.display=(tk===best&&order.length>1)?'':'none';
      const tt=$('.ttl',box);if(tt)tt.textContent='Kaiju #'+tk.id;
      const ths=$$('.rv-th',box);
      ths.forEach((n,k)=>n.classList.toggle('on',k===i));
      stripTo(ths[i]);
    }
    function go(d){
      let i=cur;
      for(let k=0;k<order.length;k++){
        i=(i+d+order.length)%order.length;
        if(revealed[i]){SFX.click();haptic(HAP.tap);paint(i,true);return;}
      }
    }

    /* O sorteio inteiro cabe em uns 5 segundos, seja x5 ou x100: quanto maior a
       leva, mais rapido cada carta passa. O melhor sempre ganha o giro completo. */
    const REST=Math.max(1,order.length-1);
    const gap=clamp(2600/REST,26,260);
    const quick=order.length>6;
    /* acima de 40 o palco grande nao acompanha: as miniaturas viram o show e
       so o melhor da leva ganha o giro na tela cheia */
    const huge=order.length>40;
    const SHORT=[70,90,120,170];
    let idx=0,skipped=false;
    function spinOne(){
      if(!box.isConnected||skipped)return;
      let n=0;
      const last=idx===order.length-1;
      const steps=last?spinFor(order[idx]):(quick?[gap]:SHORT);
      if(huge&&!last){land();return;}
      sh.classList.add('spin');
      const tick=()=>{
        if(!box.isConnected||skipped)return;
        drawKaiju(cv,{id:randomTokenId()},RVSZ);
        $('[data-rvcount]',box).textContent=(idx+1)+' / '+order.length;
        if(!quick||n===0)SFX.tick();
        if(n<steps.length)setTimeout(tick,steps[n++]);
        else land();
      };
      if(idx===0)setTimeout(tick,180);else tick();
    }
    /* pular: revela tudo de uma vez e para no melhor da leva */
    function skipAll(){
      if(skipped)return;
      skipped=true;
      sh.classList.remove('spin');
      order.forEach((tk,i)=>{
        if(revealed[i])return;
        revealed[i]=true;
        const th=$$('.rv-th',box)[i];
        if(th){th.classList.add('done');drawKaiju($('canvas',th),tk,44);}
      });
      idx=order.length;bump();
      paint(order.length-1,true);
      SFX.reveal(best.rarity);
      const hv=HAP.rar[best.rarity];haptic(hv||HAP.tap);
      if(best.rarity>=3)UI.confetti(best.rarity>=5?150:70,[RARITY[best.rarity].c,'#ffffff','#a8e832'],50);
      finish();
    }
    function land(){
      if(skipped)return;
      const tk=order[idx];
      const last=idx===order.length-1;
      sh.classList.remove('spin');
      revealed[idx]=true;
      const th=$$('.rv-th',box)[idx];
      if(th){th.classList.add('done');drawKaiju($('canvas',th),tk,44);}
      if(huge&&!last){
        /* o palco grande NAO pode ficar em branco a leva inteira: desenha o
           Kaiju que acabou de cair, mesmo sem o giro completo */
        drawKaiju(cv,tk,RVSZ);
        $('[data-rvcount]',box).textContent=(idx+1)+' / '+order.length;
        const rr2=$('[data-rvrar]',box);
        rr2.textContent=rarName(tk.rarity).toUpperCase();rr2.style.background=RARITY[tk.rarity].c;
        SFX.reveal(tk.rarity);
        if(tk.rarity>=4)UI.flash();
        stripTo(th);
        idx++;bump();
        setTimeout(spinOne,tk.rarity>=4?300:60);
        return;
      }
      /* cada Kaiju que cai tem o SEU som — e o que faz o lote parecer sorteio
         e nao lista. Da pra tocar todos agora porque a cadencia ficou mais
         lenta (420ms parado por carta); antes empilhavam uns 14 juntos. */
      SFX.reveal(tk.rarity);
      paint(idx,true);
      /* o tremor e do melhor da leva, nao de cada raro: dois shakes seguidos
         em cima um do outro pareciam bug */
      if(tk.rarity>=4&&(tk===best||last)){UI.flash();box.classList.add('shake');setTimeout(()=>box.classList.remove('shake'),340);}
      else if(tk.rarity>=4)UI.flash();
      const hv=HAP.rar[tk.rarity];haptic(hv||HAP.tap);
      if(tk.rarity>=3)UI.confetti(tk.rarity>=5?150:tk.rarity>=4?80:30,[RARITY[tk.rarity].c,'#ffffff','#a8e832'],50);
      if(tk.rarity>=5)SFX.levelup();
      idx++;bump();
      /* o tempo PARADO na carta e o que da satisfacao; o giro e so suspense.
         Levas grandes encurtam o giro (gap), nunca a exibicao. */
      const hold=tk.rarity>=4?720:tk.rarity>=3?560:(quick?300:420);
      if(idx<order.length)setTimeout(spinOne,hold);
      else finish();
    }
    function finish(){
      if(finished)return;finished=true;
      /* trocar display muda a altura da caixa e o #modalveil recentraliza tudo
         de golpe. visibility/opacity nao mexem no layout. */
      pi.parentNode.parentNode.style.visibility='hidden';
      const sum=$('[data-rvsum]',box);
      sum.style.visibility='';sum.style.opacity='1';sum.style.position='';
      $$('.rv-arrow',box).forEach(a=>a.style.display='');
      const ok=$('[data-rvok]',box);ok.disabled=false;ok.textContent=t('KEEP THEM ALL');
      ok.onclick=()=>{SFX.click();m.close();releaseHidden();UI.refresh();};
      const a2=$('[data-again]',box);if(a2)a2.disabled=false;
      wireAgain(box,m);
    }
    $('[data-rvok]',box).onclick=()=>{SFX.click();skipAll();};
    $('[data-rvprev]',box).onclick=e=>{e.stopPropagation();go(-1);};
    $('[data-rvnext]',box).onclick=e=>{e.stopPropagation();go(1);};
    $$('[data-rvgo]',box).forEach(n=>n.onclick=()=>{
      const i=+n.dataset.rvgo;
      if(!revealed[i])return;
      SFX.click();haptic(HAP.tap);paint(i,true);
    });
    /* arrastar pro lado troca de Kaiju, igual numa galeria */
    let sx=null;
    sh.addEventListener('pointerdown',e=>{if(idx<order.length)return;sx=e.clientX;});
    sh.addEventListener('pointerup',e=>{
      if(sx==null)return;
      const d=e.clientX-sx;sx=null;
      if(Math.abs(d)>36)go(d<0?1:-1);
    });
    setTimeout(spinOne,160);
  });
}


/* ================= KAIJUPOST =================
   A unica alavanca do jogador contra o hype escorrendo. Fica a vista na pagina,
   nao escondido numa sanfona: e uma acao do dia a dia, nao um detalhe. */
/* REGRA DA CASA: aqui ninguem posta "gm" a serio. gm/gn e coisa de folheto e
   a comunidade tem raiva disso — gm so aparece quando esta sendo zoado, e em
   portugues a gente diz BOM DIA. O post de gm sincero que morava aqui saiu. */
const POST_TEXT=[
 {en:'8888 hand-drawn monsters. Drawn one at a time. Please look at them.',pt:'8888 monstros desenhados à mão, um de cada vez. Por favor olhem.'},
 {en:'good morning to everyone except the guy who listed his at 4x floor',pt:'bom dia pra todo mundo menos o cara que listou o dele a 4x o floor'},
 {en:'anyone who says gm in here gets nothing from me. bom dia or silence.',pt:'quem disser gm aqui não ganha nada de mim. bom dia ou silêncio.'},
 {en:'the whole collection is drawings on an old machine. that is the pitch.',pt:'a coleção inteira é desenho numa máquina velha. esse é o pitch.'},
 {en:'no discord. no roadmap. no gm. just the drawings.',pt:'sem discord. sem roadmap. sem gm. só os desenhos.'},
 {en:'I am not early. I am on time and alone.',pt:'eu não cheguei cedo. eu cheguei na hora e sozinho.'},
 {en:'look at the hands on these. somebody suffered.',pt:'olha as mãos desses. alguém sofreu.'},
 {en:'still cheaper than a coffee in this economy',pt:'ainda mais barato que um café nessa economia'},
 {en:'the art is done. the roadmap is that there is no roadmap.',pt:'a arte tá pronta. o roadmap é que não tem roadmap.'},
 {en:'nobody is talking about Kaijukaki and that is exactly the opportunity',pt:'ninguém tá falando de Kaijukaki e é exatamente essa a oportunidade'},
 {en:'floor is low. my conviction is not.',pt:'o floor tá baixo. minha convicção não.'},
 {en:'just minted another one. this is not a financial decision, it is conviction.',pt:'mintei mais um. isso nao e decisao financeira, e conviccao.'},
 {en:'reminder that these are hand drawn. zoom in. the lines wobble.',pt:'lembrete que isso é desenhado à mão. dá zoom. o traço treme.'},
 {en:'I will keep posting until somebody buys one',pt:'vou continuar postando até alguém comprar um'},
 /* O Kaki+ nao repete texto em tres dias — nem o do jogador. Eram 14 frases
    pra ate 4 posts por dia (12 em tres dias): folga nenhuma. Mais 8. */
 {en:'you do not need to buy one. you need to look at one. then you will buy one.',pt:'você não precisa comprar um. precisa olhar um. aí você compra.'},
 {en:'8888 of them and not a single one is a copy of another. go check.',pt:'8888 e nenhum é cópia de outro. vai conferir.'},
 {en:'the floor is a number. the drawing is a drawing. buy the drawing.',pt:'o floor é um número. o desenho é um desenho. compra o desenho.'},
 {en:'still here. still posting. still hand drawn.',pt:'ainda aqui. ainda postando. ainda feito à mão.'},
 {en:'if you zoom in and it gets better, it was drawn. these get better.',pt:'se você dá zoom e melhora, foi desenhado. esses melhoram.'},
 {en:'not a roadmap. a binder. the difference matters.',pt:'não é roadmap. é binder. a diferença importa.'},
 {en:'one person drew these. one. think about that for a minute.',pt:'uma pessoa desenhou isso. uma. pensa nisso um minuto.'},
 {en:'the quiet collection. the good one. you know which.',pt:'a coleção quieta. a boa. você sabe qual.'}
];
const POST_REPLY=[
 {en:['nice', 'ok', 'wen', 'is this the one with the shark', 'buying 2'],
  pt:['legal', 'ok', 'quando', 'é essa do tubarão?', 'comprando 2']},
 {en:['seen this three times today', 'bro', 'we get it', 'unfollowing'],
  pt:['já vi isso três vezes hoje', 'mano', 'entendemos', 'parei de seguir']}
];
function postFeel(){
  const n=G.shills||0;
  return n<=1?0:1;                     /* cansaram de ouvir */
}
function socialLine(){
  if(typeof onlineNow!=='function')return '';
  return `<div class="pb-live">${pixSVG('chat',12)} ${t('{0} online · {1} in the community',num(onlineNow()),num(communitySize()))}
    <button class="btn tight" data-tokn="1">${t('OPEN KAKI+')}</button></div>`;
}
function postBox(){
  /* MODO HISTORIA: comprar hype chega com b_boost. Sem ele a caixa inteira
     some — ela existe SO por causa desse botao. */
  if(typeof unlocked==='function'&&!unlocked('f_boost'))return '';
  const n=G.shills||0, cost=shillCost(), gain=shillGain();
  const bleed=(0.35+Math.pow(G.hype/100,1.45)*1.8)*todayEvent().bleed*(typeof pressure==='function'?pressure():1)*(has('mods')?0.75:1);
  const low=G.hype<20;
  const broke=G.money<cost;
  return `<div class="postbox${low?' urgent':''}">
    <div class="pb-head">
      <span class="pb-logo">${pixSVG('globe',16)} <b>Kaijupost</b></span>
      <span class="pb-hype">${t('HYPE')} <b>${G.hype.toFixed(0)}%</b> <i class="neg">-${bleed.toFixed(1)}/h</i></span>
    </div>
    <div class="pb-bar"><i style="width:${clamp(G.hype,0,100).toFixed(0)}%"></i></div>
    ${socialLine()}
    <div class="pb-txt">${low
      ? t('Nobody is looking. The floor drops with the hype — post something.')
      : t('Hype drains every hour. Posting buys it back, but people get tired: each post today costs more and gives less.')}</div>
    ${G.feed&&G.feed.length?`<div class="pb-feed">${G.feed.slice(0,2).map(f=>
      `<div class="pb-post"><div class="pb-p1">${f.txt}</div><div class="pb-p2">${f.re}</div></div>`).join('')}</div>`:''}
    <button class="pb-go" data-shill="1" ${broke?'disabled':''}>
      <span class="pb-go-t">${broke?t('NOT ENOUGH MONEY'):t('POST ABOUT THE COLLECTION')}</span>
      <span class="pb-go-s">${money(cost)} &middot; +${gain.toFixed(1)} ${t('hype')} &middot; ${t('{0} posts today',n)}</span>
    </button>
  </div>`;
}
function pushPost(){
  /* o Kaki+ recusa texto que saiu nos ultimos tres dias (50-social.js), e o
     post do jogador nao pode sumir do feed por sorteio azarado: sorteia so do
     que esta fresco. Se as 22 secaram, sorteia do pool e o feed recusa. */
  const p=(typeof socialFresh==='function'&&socialFresh(POST_TEXT))||pick(POST_TEXT);
  const set=POST_REPLY[postFeel()]||POST_REPLY[0];
  const list=(set&&(set[LANG]||set.en))||['ok'];
  const txt=(p[LANG]||p.en);
  G.feed=Array.isArray(G.feed)?G.feed:[];
  G.feed.unshift({txt,re:'&#8627; '+pick(list),day:G.day});
  if(G.feed.length>8)G.feed.pop();
  /* o post tambem entra no Kaki+ de verdade, com curtidas proporcionais ao
     tamanho da comunidade — e reputacao boa faz o marketing render mais */
  if(typeof socialPost==='function'){
    const likes=Math.round(onlineNow()*rf(.05,.30)*(1+(repScore()-60)/100));
    socialPost({who:'you',kind:'shill',txt,up:Math.max(0,likes),key:(typeof saidKey==='function')?saidKey(p):undefined});
  }
}


/* ================= A TIRA DE CINCO =================
   Eram tres cartas e sobrava um buraco na direita. Agora sao cinco, e a mesma
   tira tem duas abas: o que VOCE acabou de mintar, e o melhor que a comunidade
   tirou HOJE. As duas abas desenham cinco cartas iguais (arte, #id, raridade),
   entao a altura da pagina nao pula quando o jogador troca de aba. */
const LM_MAX=5;
/* a aba da tira (o que eu mintei / os melhores de hoje) e do jogador */
const LMV=prefView({tab:'lastMintTab'});

/* O quadro do dia NAO entra no save: ele nasce da semente da partida + o dia.
   Recarregar a pagina devolve o mesmo quadro, e nenhum byte novo e gravado
   (o save ja anda perto do limite do localStorage). O sorteio anda pela fila
   de mint ja consumida, entao so aparece Kaiju que realmente ja saiu — e
   conforme o mundo minta mais, peca melhor pode entrar no quadro, que e
   exatamente o que um placar do dia deve fazer. */
function todaysPulls(n){
  n=n||LM_MAX;
  const cap=Math.min(G.minted|0,SUPPLY);
  if(cap<1)return [];
  const r=mulberry(hash32('kakipull|'+((G&&G.mintSeed)||1)+'|'+(G.day|0)));
  const vistos={},cand=[];
  for(let i=0;i<56&&cand.length<36;i++){
    const id=(typeof idAtMintIndex==='function')?idAtMintIndex(Math.floor(r()*cap)):0;
    if(!id||vistos[id])continue;
    vistos[id]=1;
    const m=metaOf(id);
    cand.push({id,rarity:m.rarity|0,rank:m.rank|0,mine:0});
  }
  /* o que o JOGADOR mintou hoje disputa o mesmo placar */
  G.tokens.forEach(tk=>{
    if(tk.hidden||tk.day!==G.day||vistos[tk.id])return;
    vistos[tk.id]=1;
    cand.push({id:tk.id,rarity:tk.rarity|0,rank:tk.score|0,mine:1});
  });
  cand.sort((a,b)=>b.rarity-a.rarity||a.rank-b.rank||a.id-b.id);
  return cand.slice(0,n);
}
/* quem segura a peca. Se esta listada, o dono e quem listou. */
function pullListing(id){
  const meu=G.tokens.find(x=>x.id===id);
  if(meu)return meu.listed!=null?{price:meu.listed,who:t('you')}:null;
  const L=(typeof mktList==='function')?mktList():[];
  const l=L.find(x=>x.tk===id);
  return l?{price:l.price,who:l.who}:null;
}
function pullOwner(id,lst){
  if(G.tokens.some(x=>x.id===id))return t('you');
  if(lst&&lst.who)return lst.who;
  let pool=[];
  if(typeof CROWD!=='undefined'&&CROWD.length)pool=pool.concat(CROWD);
  if(typeof CAST!=='undefined'&&CAST.length)pool=pool.concat(CAST.map(c=>c.id));
  if(!pool.length)return 'anon';
  return pool[hash32('holder|'+id+'|'+((G&&G.mintSeed)||1))%pool.length];
}
/* a janelinha do placar: dono e se esta a venda agora */
function pullDetail(id){
  if(G.tokens.some(x=>x.id===id)){SFX.click();tokenDetail(id);return;}
  SFX.click();
  const m=metaOf(id), lst=pullListing(id), dono=pullOwner(id,lst);
  UI.modal(`<div class="titlebar">${pixSVG('kaiju',14,'tico')}<span class="ttl">Kaiju #${id}</span>
      <div class="tbtns"><button class="tb" data-pdx="1" title="${t('Close')}"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody pulldet">
      <div class="pd-top">
        <div class="pd-art r${m.rarity}"><canvas data-pdcv="1"></canvas></div>
        <div class="pd-info">
          <div class="pd-id">#${id}</div>
          <div class="pd-rar r${m.rarity}">${rarName(m.rarity)}</div>
          <div class="pd-k">${t('Held by')}</div>
          <div class="pd-v who">${dono}</div>
          <div class="pd-k">${t('On the market')}</div>
          <div class="pd-v ${lst?'yes':'no'}">${lst?t('listed for {0}',money(lst.price)):t('not listed right now')}</div>
        </div>
      </div>
      <div class="pd-foot">
        ${lst?`<button class="btn big" data-pdmkt="1">${t('OPEN THE MARKET')}</button>`:''}
        <button class="btn big" data-pdok="1">${t('CLOSE')}</button>
      </div>
    </div>`,'pulldetail',mm=>{
    const box=mm.box;
    const cv=$('[data-pdcv]',box);
    if(cv)drawKaijuCached(cv,{id},Math.round(120*((typeof uiScale==='function')?uiScale():1)));
    const fecha=()=>{SFX.close();mm.close();};
    $('[data-pdx]',box).onclick=fecha;
    $('[data-pdok]',box).onclick=fecha;
    const mk=$('[data-pdmkt]',box);
    if(mk)mk.onclick=()=>{SFX.click();mm.close();UI.openApp('market');};
  });
}
function pullCard(p){
  return `<div class="lm-card" data-lmid="${p.id}" data-lmtop="1">
    <div class="lm-art r${p.rarity}"><canvas data-lmart="${p.id}"></canvas>${p.mine?`<i class="lm-mine">${t('yours')}</i>`:''}</div>
    <div class="lm-id">#${p.id}</div>
    <div class="lm-r r${p.rarity}">${rarName(p.rarity)}</div>
  </div>`;
}
function lmGhost(){
  return `<div class="lm-card ghost"><div class="lm-art"><span>?</span></div>
    <div class="lm-id">&mdash;</div><div class="lm-r">${t('EMPTY')}</div></div>`;
}
/* a tira tem SEMPRE cinco bolsos: com tres cartas sobrava um buraco na direita,
   e a altura da pagina pulava conforme a carteira enchia */
function lmRow(cartas){
  const out=cartas.slice(0,LM_MAX);
  while(out.length<LM_MAX)out.push(lmGhost());
  return `<div class="lm-row">${out.join('')}</div>`;
}
function lastMintsStrip(){
  const tabs=`<div class="lm-tabs">
    <button class="lm-tab${LMV.tab==='top'?'':' on'}" data-lmtab="mine">${t('YOUR LAST MINTS')}</button>
    <button class="lm-tab${LMV.tab==='top'?' on':''}" data-lmtab="top">${t("TODAY'S BEST PULLS")}</button>
  </div>`;
  if(LMV.tab==='top'){
    const list=todaysPulls(LM_MAX);
    return `<div class="lastmints board${list.length?'':' empty'}">${tabs}
      ${lmRow(list.map(pullCard))}
      <div class="lm-note">${list.length
        ? t('the loudest pulls today. click one to see who holds it.')
        : t('nobody pulled anything worth showing today. yet.')}</div>
    </div>`;
  }
  /* Isto le o REGISTRO de mint, nao a carteira. Vender um Kaiju nao apaga o
     fato de que ele saiu da sua maquina — a carta continua na tira, marcada
     como "gone". Saves antigos nao tem registro: nesse caso cai na carteira,
     senao a tira nasceria vazia pra quem ja estava jogando. */
  const L=(typeof mintLog==='function'?mintLog():[]);
  const mine=L.length
    ? L.slice(-LM_MAX).reverse().map(e=>({id:e.id,rarity:e.r,
        tem:G.tokens.some(x=>x.id===e.id&&!x.hidden)}))
    : G.tokens.filter(x=>!x.hidden).slice(-LM_MAX).reverse()
        .map(x=>({id:x.id,rarity:x.rarity,tem:true}));
  const foram=mine.filter(x=>!x.tem).length;
  return `<div class="lastmints${mine.length?'':' empty'}">${tabs}
    ${lmRow(mine.map(tk=>`
      <div class="lm-card${tk.tem?'':' gone'}" data-lmid="${tk.id}"${tk.tem?'':' data-lmgone="1"'}>
        <div class="lm-art r${tk.rarity}"><canvas data-lmart="${tk.id}"></canvas></div>
        <div class="lm-id">#${tk.id}</div>
        <div class="lm-r r${tk.rarity}">${rarName(tk.rarity)}</div>
        ${tk.tem?'':`<span class="lm-gone">${t('GONE')}</span>`}
      </div>`))}
    <div class="lm-note">${mine.length
      ? (foram
          ? t('everything that came out of your machine. {0} already sold.',num(foram))
          : t('the last ones out of your machine. click one to open it.'))
      : t('nothing yet. the machine is right up there.')}</div>
  </div>`;
}
/* trocar de aba NAO pode chamar refresh(): isso redesenharia o heroi e os
   quatorze canvases da esteira. So a tira e trocada, e so ela e religada. */
function wireStrip(root){
  const strip=$('.lastmints',root);
  if(!strip)return;
  const K=((typeof uiScale==='function')?uiScale():1)*pageScale();
  $$('[data-lmart]',strip).forEach(c=>drawKaijuCached(c,{id:+c.dataset.lmart},Math.round(128*K)));
  $$('.lm-card[data-lmid]',strip).forEach(x=>x.onclick=()=>{
    const id=+x.dataset.lmid;
    if(x.dataset.lmtop)pullDetail(id);
    else if(G.tokens.some(y=>y.id===id)){SFX.click();tokenDetail(id);}
    else {SFX.click();pullDetail(id);}   /* ja vendido: ficha publica */
  });
  $$('[data-lmtab]',strip).forEach(bt=>bt.onclick=()=>{
    const aba=bt.dataset.lmtab;
    if(aba===LMV.tab){SFX.click();return;}
    SFX.click();haptic(HAP.tap);
    LMV.tab=aba;
    const novo=el('div',null,lastMintsStrip()).firstElementChild;
    strip.replaceWith(novo);
    wireStrip(root);
  });
}


/* ================= O TOPO DA PAGINA =================
   O produto sao 8888 bustos desenhados a mao e a pagina nao mostrava UM.
   Agora a primeira coisa que aparece e uma esteira de Kaiju andando.

   CUIDADO: cada Kaiju tem o SEU canvas, criado uma vez. Nunca reaproveitar
   um canvas vivo pra desenhar outro id — foi exatamente assim que nasceu o
   bug da arte trocada (ver cv.__want em 23-art.js). E o heroi inteiro fica
   guardado num no fora do innerHTML, senao cada refresh() redesenhava 14
   canvases a toa. */
let HERO_NODE=null, HERO_IDS=null;
function heroIds(){
  if(HERO_IDS)return HERO_IDS;
  const n=(typeof SUPPLY==='number')?SUPPLY:8888;
  const vistos={};HERO_IDS=[];
  while(HERO_IDS.length<14){
    const id=ri(1,n);
    if(vistos[id])continue;vistos[id]=1;HERO_IDS.push(id);
  }
  return HERO_IDS;
}
function buildHero(){
  const wrap=el('div','pghero-in');
  wrap.innerHTML=`
    <div class="hero-mark">
      <h1>KAIJUKAKI</h1>
      <div class="hero-bar"></div>
      <div class="hero-sub">${t('8888 hand-drawn PFP collectible inspired by hyper-violent neo-shonen aesthetics.')}</div>
    </div>
    <div class="hero-sticker">8888<i>EST 199X</i></div>
    <div class="hero-rail"><div class="hero-track" data-rail="1"></div></div>
    <div class="hero-tick">
      <span class="tick-ev" data-tickev="1"></span>
      <span class="tick-vis" data-tickvis="1"></span>
    </div>`;
  const track=$('[data-rail]',wrap);
  const ids=heroIds();
  /* duas voltas do mesmo trilho: a animacao anda -50% e emenda sem costura */
  for(let volta=0;volta<2;volta++){
    ids.forEach(id=>{
      const cell=el('div','hero-cell');
      const cv=document.createElement('canvas');
      cell.appendChild(cv);
      track.appendChild(cell);
      const m=(typeof metaOf==='function')?metaOf(id):{rarity:0};
      cell.classList.add('r'+(m.rarity||0));
      drawKaijuCached(cv,{id,rarity:m.rarity||0},72);
    });
  }
  return wrap;
}
function heroInto(slot,ev,evBad,visitas){
  if(!slot)return;
  if(!HERO_NODE)HERO_NODE=buildHero();
  slot.appendChild(HERO_NODE);
  const te=$('[data-tickev]',HERO_NODE);
  if(te){
    te.className='tick-ev'+(evBad?' bad':'');
    te.innerHTML=`<b>${t('TODAY')}</b> ${pixSVG(ev.ico,13)} ${evName(ev)}`;
  }
  const tv=$('[data-tickvis]',HERO_NODE);
  if(tv)tv.textContent=(G.hype>50?t('WE ARE PUMPING'):t('HELP THE PROJECT GROW'));
}

/* ================= A CONTA QUE ROLA =================
   Trocar x1 por x10 tem que ser causal: aperta, e o dinheiro anda. Os tres
   numeros saem escalonados pra o olho LER a soma acontecendo. */
function quoteRoll(root,subiu){
  const mp=mintPrice(), gf=gasFee(), sat=saturation();
  const nf=Math.min(G.freeMints,SV.qty);
  const linha=Math.max(0,(SV.qty-nf)*mp*sat*(1-G.coupon/100));
  const gas=gf*SV.qty;
  const total=Math.max(0,linha+gas);
  const rola=(sel,val,ms,atraso)=>{
    const n=$(sel,root);if(!n)return;
    setTimeout(()=>{if(n.isConnected)UI.countUp(n,val,ms,money);},atraso);
  };
  rola('[data-blmint]',linha,300,0);
  rola('[data-blgas]',gas,300,45);
  rola('[data-bltot]',total,340,90);
  rola('[data-mbprice]',total,380,130);
  const q=$('.mb-q',root);if(q)q.textContent='MINT x'+SV.qty;
  const mx=$('[data-blmx]',root);if(mx)mx.innerHTML=(SV.qty-nf>0)?('&times;'+(SV.qty-nf)):'';
  const gx=$('[data-blgx]',root);if(gx)gx.innerHTML='&times;'+SV.qty;
  const fr=$('[data-blfree]',root);
  if(fr){fr.hidden=!nf;if(nf)fr.textContent=nf+' '+t('free');}
  const dm=$('[data-dfmin]',root);
  if(dm){dm.textContent=mintMinutes(SV.qty)+' min';dm.classList.remove('fadein');void dm.offsetWidth;dm.classList.add('fadein');}
  if(subiu)setTimeout(()=>SFX.tick(),40);
  /* "so cabem N" e aviso, nao recusa: som macio, nunca SFX.error */
  const deck=$('.mintdeck',root);
  if(deck)deck.classList.toggle('nofit',SV.qty>capLeft());
  if(SV.qty>capLeft())SFX.down();
}

/* ================= A BATIDA =================
   timeAct e instantaneo — nao existe espera de verdade. Entao a espera e
   teatro, e o tamanho dela e escolha nossa: 620ms no contrato nivel 0 caindo
   pra ~240ms no nivel 10. Assim o upgrade de velocidade, que hoje e invisivel,
   passa a ser uma coisa que a MAO percebe. */
function mintPress(root,btn,q,b,ent){
  if(btn.__busy)return;
  const lv=(typeof contractLevel==='function')?contractLevel():0;
  /* Era 620ms de SILENCIO antes de qualquer som: o jogador apertava, nada
     acontecia, e so depois vinha o barulho do sorteio. Agora o clique
     responde na hora e a batida e curta. */
  SFX.down();haptic(HAP.tap);
  const beat=Math.max(140,260-14*lv);
  btn.__busy=1;
  btn.classList.add('working');
  const bar=$('.supplybar',root);
  if(bar)bar.classList.add('scanning');
  const t1=setTimeout(()=>SFX.tick(),Math.round(beat*0.45));
  const t2=null;
  setTimeout(()=>{
    clearTimeout(t1);
    btn.__busy=0;
    btn.classList.remove('working');
    if(bar)bar.classList.remove('scanning');
    doMintFlow(q,btn);
  },beat);
}
