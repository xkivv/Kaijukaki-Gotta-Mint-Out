/* ================= APP: Kaiju Market ================= */
/* que aba do mercado corresponde a que id da historia. Usado pra marcar a
   chegada (animacao + ponto NOVO) — ver stTagTabs em 40-boot.js. */
const MKT_TAB_LOCK={'1':'tab_mkt_offers','2':'tab_mkt_mine','3':'tab_mkt_stats'};
/* aba, filtro, ordenacao e a gaveta do sweep sao do JOGADOR: registrador */
const MV=prefView({tab:'mktTab',swN:'mktSweepN',swOpen:'mktSweepOpen',filter:'mktFilter',sort:'mktSort'});
function quickSellHaircut(n){return clamp(0.88-0.0018*n,0.55,0.88);}
/* ---------- tamanho da arte nas ofertas ----------
   Mesmo esquema do grid da carteira: fica no registrador (G.prefs). */
const OFF_ART={s:58,m:92,l:140};
function offArtSize(){const v=pref('offSize');return OFF_ART[v]?v:'s';}
function setOffArtSize(v){if(OFF_ART[v])setPref('offSize',v);}
APPS.market={
  title:'Kaiju Market', icon:'market', w:470, h:430, status:true,
  build(b,ent){b.innerHTML='<div class="mkroot" style="padding:7px;box-sizing:border-box"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.mkroot',b);if(!root)return;
    G.offers=G.offers.filter(o=>G.tokens.some(t=>t.id===o.tk));
    /* o mercado respira sozinho e chama refresh() varias vezes por minuto: se
       o scroll voltasse pro topo em cada uma, ninguem conseguiria ler a lista
       ate o fim. Guarda antes de trocar o HTML, devolve depois de desenhar. */
    const antes=$('[data-body]',root);
    const sc=antes?antes.scrollTop:0;
    /* MODO HISTORIA: o mercado do dia 1 e uma vitrine, so isso. Ofertas,
       "minhas listagens" e as estatisticas chegam quando o jogo ja deu motivo.
       Com uma aba so nao existe barra de abas: uma aba sozinha nao e aba. */
    const tabDef=[
      {i:0,lbl:t('Buy ({0})',mktList().length)},
      {i:1,lbl:t('Offers ({0})',G.offers.length+cbids().length),un:'tab_mkt_offers'},
      {i:2,lbl:t('My listings'),un:'tab_mkt_mine'},
      {i:3,lbl:t('Stats'),un:'tab_mkt_stats'}
    ].filter(x=>!x.un||unlocked(x.un));
    if(!tabDef.some(x=>x.i===MV.tab))MV.tab=tabDef[0].i;
    root.innerHTML=(unlocked('m_mkt_stats')?mktStatsBar():'')+
      (tabDef.length>1?`<div class="tabs">${tabDef.map(x=>`<div class="tab ${x.i===MV.tab?'on':''}" data-t="${x.i}">${x.lbl}</div>`).join('')}</div>`:'')+
      `<div class="tabbody" data-body="1"></div>`;
    $$('.tabs .tab',root).forEach(t=>t.onclick=()=>{SFX.click();MV.tab=+t.dataset.t;APPS.market.refresh(b,ent);});
    /* a aba que acabou de chegar entra com animacao e fica com o ponto NOVO */
    if(typeof stTagTabs==='function')stTagTabs($('.tabs',root),'t',MKT_TAB_LOCK,String(MV.tab));
    const body=$('[data-body]',root);
    if(MV.tab===0)this.buy(body,b,ent);
    else if(MV.tab===1)this.offers(body,b,ent);
    else if(MV.tab===2)this.listings(body,b,ent);
    else this.market(body,b,ent);
    if(sc)body.scrollTop=sc;
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=`${t('Floor')} ${money(floorPrice())} · ${t('Hype')} ${G.hype.toFixed(0)}%`;st2.textContent=num(held())+' NFTs';}
  },
  buy(body,b,ent){
    const L=mktList();
    if(!L.length){
      /* o banner fica MESMO no vazio: sem as abas e sem a barra de numeros
         (que so chegam mais tarde) a janela do dia 1 abria completamente em
         branco, com a frase solta no meio do nada */
      body.innerHTML=mktBanner()+`<div class="center dim" style="padding:26px 10px;line-height:1.7">
        ${pixSVG('market',32)}<br>${t('Nothing listed by anyone right now.')}<br>
        <span class="tiny">${t('Other holders list their Kaiju as the day goes on. Come back in an hour.')}</span></div>`;
      return;
    }
    const fp=floorPrice();
    let rows=L.map(l=>{
      const tk=buildToken(l.tk,l.born,false);
      const fair=tokenValue(tk);
      return {l,tk,fair,d:(l.price/fair-1)*100};
    });
    /* o binder deixa de ser album decorativo e vira lista de compras */
    const brc=typeof binderRaceCount==='function'?binderRaceCount():{};
    const wantOf=r=>mkWantOf(r.tk,brc);
    if(MV.filter==='b:missing')rows=rows.filter(r=>!brc[raceOf(r.tk)]);
    else if(MV.filter!=='all')rows=rows.filter(r=>MV.filter.startsWith('r:')?r.tk.rarity===+MV.filter.slice(2):raceOf(r.tk)===MV.filter.slice(2));
    if(MV.sort==='binder')rows.sort((a,b)=>{
      const wa=wantOf(a),wb=wantOf(b);
      const k=x=>x?(x.kind==='need'?2+x.n:1):0;
      return k(wb)-k(wa)||a.d-b.d;
    });
    else if(MV.sort==='cheap')rows.sort((a,b)=>a.l.price-b.l.price);
    else if(MV.sort==='deal')rows.sort((a,b)=>a.d-b.d);
    else if(MV.sort==='rare')rows.sort((a,b)=>b.tk.rarity-a.tk.rarity||a.d-b.d);
    else rows.sort((a,b)=>b.l.price-a.l.price);
    body.innerHTML=`
      ${mktBanner()}
      <div class="row mkbar" style="gap:5px;flex-wrap:wrap;margin-bottom:7px">
        <select data-mkf="1">
          <option value="all">${t('Everything ({0})',L.length)}</option>
          <option value="b:missing">${t('Missing from binder')}</option>
          ${RARITY.map((r,i)=>`<option value="r:${i}">${rarName(i)}</option>`).join('')}
          ${RACES.map(r=>`<option value="c:${r}">${r}${typeof raceHeatMark==='function'&&raceHeatMark(r)?' '+raceHeatMark(r):''}</option>`).join('')}
        </select>
        <select data-mks="1">
          <option value="deal">${t('Best deal first')}</option>
          <option value="binder">${t('Fills my binder first')}</option>
          <option value="cheap">${t('Cheapest')}</option>
          <option value="rare">${t('Rarest')}</option>
          <option value="rich">${t('Most expensive')}</option>
        </select>
        <div class="grow"></div>
        <span class="tiny dim" data-mkfloor="1">${t('Floor {0}',money(fp))}</span>
      </div>
      <div class="mktape" data-mktape="1"><span class="mt-dot"></span><span class="mt-txt" data-mktapetxt="1">${mkTapeIdle()}</span></div>
      ${rows.length?`<div class="mkgrid" data-mkgrid="1">${rows.map(r=>mkCardHTML(r.l,brc)).join('')}</div>`
        :`<div class="center dim" style="padding:22px">${t('Nothing matches that filter.')}</div>`}
      ${unlocked('m_sweep')?`<div class="fold mksweep${MV.swOpen?' open':''}" data-swfold="1">
        <button class="fold-h" data-swtog="1"><span class="fchev">&#9654;</span>${t('Sweep the floor')}<span class="sw-sum" data-swsum="1"></span></button>
        <div class="fold-b">
          <div class="tiny dim" style="margin-bottom:7px">${t('Buy Kaiju straight from other holders. Each unit costs a bit more than the last, and buying pressure <b>raises hype</b>.')}</div>
          <div class="swrow">
            <input type="range" data-swn="1" min="1" max="${maxSweep()}" value="${clamp(MV.swN,1,maxSweep())}" class="grow">
            <b class="mono" data-swnv="1">${clamp(MV.swN,1,maxSweep())}</b>
          </div>
          <div class="bill" data-swbill="1"></div>
          <button class="btn big wide" data-swgo="1">${t('SWEEP')}</button>
          <div class="tiny dim" style="margin-top:5px">${t('Held by other people: {0} · you own {1} of {2} minted',num(npcHeld()),num(held()),num(G.minted))}</div>
        </div>
      </div>`:''}`;
    L.forEach(l=>delete l.fresh);
    /* o quote redesenha so a caixinha: refresh() inteiro redesenha ate 22
       canvases e engasga enquanto arrasta o slider */
    const swr=$('[data-swn]',body);
    if(swr){
      const paint=()=>{
        const q=sweepQuote(MV.swN);
        $('[data-swnv]',body).textContent=q.n;
        const sum=$('[data-swsum]',body);
        if(sum)sum.textContent=q.n>0?t('{0} for {1}',num(q.n),money(q.cost)):t('nobody selling');
        $('[data-swbill]',body).innerHTML=
          `<div class="bl-row"><span>${t('Kaiju')}</span><b>${num(q.n)}</b></div>
           <div class="bl-row"><span>${t('Price')}</span><b>${money(q.gross)}</b></div>
           <div class="bl-row"><span>${t('Network fee')}</span><b>${money(q.fee)}</b></div>
           <div class="bl-row"><span>${t('Royalties 3%')} <i>${t('back to you')}</i></span><b>${money(q.roy)}</b></div>
           <div class="bl-row total"><span>${t('You pay')}</span><b>${money(q.cost)}</b></div>`;
        const go=$('[data-swgo]',body);
        if(go)go.disabled=q.n<=0||q.cost>G.money;
      };
      /* arrastar o slider nao pode gravar o save a cada pixel: escreve calado
         e so grava quando o dedo sai */
      swr.oninput=()=>{setPref('mktSweepN',+swr.value,true);paint();};
      swr.onchange=()=>save();
      paint();
      $('[data-swtog]',body).onclick=()=>{SFX.click();MV.swOpen=!MV.swOpen;$('[data-swfold]',body).classList.toggle('open',MV.swOpen);};
      $('[data-swgo]',body).onclick=()=>{
        if(tiredGate())return;
        const r=sweepFloor(MV.swN);
        if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('Sweeping {0} costs <b>{1}</b>.',MV.swN,money(r.need)),'warn');return;}
        if(r.err){SFX.error();UI.toast('warn',t('Nobody is selling right now.'));return;}
        SFX.coin();UI.floatFrom($('[data-swgo]',body),'-'+money(r.cost),'#d24b3a');
        UI.toast('market',t('Swept {0} Kaiju for {1}',r.got.length,money(r.cost)));
        UI.hypePop('+HYPE');
        timeAct(ACT.sweep);checkRaces(r.got);checkLevel();UI.refresh();save();
      };
    }
    const f=$('[data-mkf]',body),so=$('[data-mks]',body);
    f.value=MV.filter;so.value=MV.sort;
    f.onchange=e=>{MV.filter=e.target.value;SFX.click();APPS.market.refresh(b,ent);};
    so.onchange=e=>{MV.sort=e.target.value;SFX.click();APPS.market.refresh(b,ent);};
    $$('[data-mk]',body).forEach(c=>wireMkCard(c,b,ent));
  },
  offers(body,b,ent){
    /* lances na COLECAO INTEIRA moram em cima: sao poucos, valem menos que o
       floor e nao apontam pra nenhum Kaiju — quem escolhe a peca e voce. */
    const cbHTML=cbidSection();
    if(!G.offers.length){
      body.innerHTML=cbHTML+`<div class="center dim" style="padding:26px 10px;line-height:1.7">
        ${pixSVG('coin',32)}<br>${t('No offers on a specific Kaiju right now.')}<br>
        <span class="tiny">${t('Offers arrive on their own as time passes and hype rises. Slots: {0}',offerSlots())}</span></div>`;
      wireCbids(body,b,ent);
      return;
    }
    /* agrupado por Kaiju: um mitico pode juntar uma fila de interessados, e
       o melhor lance fica no topo. Aceitar um derruba os outros. */
    const grupos={};
    G.offers.forEach(o=>{(grupos[o.tk]=grupos[o.tk]||[]).push(o);});
    /* S/M/L: no L a linha vira arte em cima e a ficha embaixo, senao a arte
       grande espremia o texto num canto */
    const sz=offArtSize();
    const head=`<div class="row offhead">
      <span class="tiny dim">${t('{0} offers waiting',G.offers.length)}</span>
      <div class="grow"></div>
      <span class="tiny dim">${t('Art')}</span>
      <div class="osz">${['s','m','l'].map(k=>
        `<button class="btn tight${sz===k?' on':''}" data-osz="${k}" title="${t('Art size')}">${k.toUpperCase()}</button>`).join('')}</div>
    </div>`;
    body.innerHTML=cbHTML+head+`<div class="offwrap os-${sz}">`+Object.keys(grupos).map(tid=>{
      const tk=G.tokens.find(x=>x.id===+tid);if(!tk)return '';
      const list=grupos[tid].slice().sort((a,b)=>b.price-a.price);
      const fair=tokenValue(tk);
      return `<div class="ogroup${list.length>1?' war':''}">
        ${list.length>1?`<div class="og-h">${pixSVG('coin',12)} ${t('{0} buyers want Kaiju #{1}',list.length,tk.id)}</div>`:''}
        ${list.map((o,i)=>{
          const d=(o.price/fair-1)*100;
          const cls='offer'+(o.fresh?' new':'')+(list.length>1&&i===0?' best':'')+(i===0?' has-art':'');
          return `<div class="${cls}" data-o="${o.id}">
            ${i===0?`<canvas data-tk="${tk.id}"></canvas>`:'<div class="o-sp"></div>'}
            <div class="oi">
              <div class="who">${o.who}${list.length>1&&i===0?` <span class="og-best">${t('BEST')}</span>`:''}</div>
              <div class="tiny"><span class="rt${tk.rarity}">${rarName(tk.rarity)}</span> · Kaiju #${tk.id}</div>
              <div class="tiny dim">${t('Fair {0}',money(fair))} · <span class="${d>=0?'pos':'neg'}">${d>=0?'+':''}${d.toFixed(0)}%</span> · ${t('expires in {0}h',o.ttl)}</div>
              ${o.line?`<div class="o-line">&ldquo;${o.line}&rdquo;</div>`:''}
            </div>
            <div class="oact">
              <div class="mono o-price">${money(o.price)}</div>
              <div class="o-btns">
                <button class="btn tight" data-acc="${o.id}">${t('Accept')}</button>
                <button class="btn tight" data-rej="${o.id}">${t('Decline')}</button>
              </div>
            </div></div>`;}).join('')}
      </div>`;
    }).join('')+`</div>`;
    G.offers.forEach(o=>delete o.fresh);
    wireCbids(body,b,ent);
    /* arte no tamanho REAL de tela x dpr — antes desenhava 46px e o CSS
       esticava pra 58+, e em --ui 1.7 virava borrao */
    const px=Math.round(OFF_ART[sz]*((typeof uiScale==='function')?uiScale():1));
    $$('canvas[data-tk]',body).forEach(c=>{const tk=G.tokens.find(x=>x.id==c.dataset.tk);if(tk)drawKaijuCached(c,tk,px);});
    $$('[data-osz]',body).forEach(x=>x.onclick=()=>{
      SFX.click();setOffArtSize(x.dataset.osz);APPS.market.refresh(b,ent);
    });
    $$('[data-acc]',body).forEach(x=>x.onclick=()=>{
      if(tiredGate())return;
      const row=x.closest('.offer');
      const o=acceptOffer(x.dataset.acc);
      if(!o){UI.refresh();return;}
      row.classList.add('gone');
      SFX.cash(o.price>200);haptic(HAP.cash);UI.floatFrom(x,'+'+money(o.price),'#0a6b2a');
      UI.think(pick(TH('sale')));   /* THOUGHTS nao existe: quebrava aqui e o save() nunca rodava */
      timeAct(ACT.offer);
      setTimeout(()=>{checkLevel();UI.refresh();save();},250);
    });
    $$('[data-rej]',body).forEach(x=>x.onclick=()=>{
      SFX.click();x.closest('.offer').classList.add('gone');
      G.offers=G.offers.filter(o=>o.id!==x.dataset.rej);
      setTimeout(()=>UI.refresh(),250);save();
    });
  },
  listings(body,b,ent){
    const ls=G.tokens.filter(t=>t.listed!=null);
    body.innerHTML=`<div class="row" style="margin-bottom:7px">
      <button class="btn" data-addlist="1">${t('List NFT...')}</button>
      <div class="grow tiny dim">${t('{0} listed. They sell on their own over time — cheaper sells faster. Listing does not hurt hype.',ls.length)}</div></div>
      ${ls.length?`<table class="lst"><thead><tr><th>${t('ID')}</th><th class="hidem">${t('Rarity')}</th><th>${t('Price')}</th><th>${t('vs Fair')}</th><th></th></tr></thead><tbody>
      ${ls.map(tk=>{const fair=tokenValue(tk),d=(tk.listed/fair-1)*100;
        return `<tr><td class="rt${tk.rarity}">#${tk.id}</td><td class="hidem rt${tk.rarity}">${rarName(tk.rarity)}</td><td>${money(tk.listed)}</td>
        <td class="${d<=0?'pos':'neg'}">${d>=0?'+':''}${d.toFixed(0)}%</td>
        <td><button class="btn tight" data-unl="${tk.id}">${t('Cancel')}</button></td></tr>`}).join('')}
      </tbody></table>`:`<div class="center dim" style="padding:22px">${t('Nothing listed.')}</div>`}`;
    $('[data-addlist]',body).onclick=()=>{SFX.click();UI.openApp('wallet');UI.toast('info',t("Pick a Kaiju in the wallet and hit 'List for...'."));};
    $$('[data-unl]',body).forEach(x=>x.onclick=()=>{SFX.click();
      const tk=G.tokens.find(y=>y.id==x.dataset.unl);if(tk)tk.listed=null;UI.refresh();save();});
  },
  market(body,b,ent){
    const fp=floorPrice();
    const sellable=sellableTokens();
    body.innerHTML=`
      <div class="statgrid" style="grid-template-columns:1fr 1fr;gap:7px;margin-bottom:9px">
        <div class="fieldset"><span class="lg">${t('Floor')}</span><div class="mono" style="font-size:calc(22px * var(--fs))">${money(fp)}</div></div>
        <div class="fieldset"><span class="lg">${t('Hype')}</span><div class="prog ${G.hype>60?'hot':'moss'}" style="margin-top:2px"><i style="width:0%"></i><b>${G.hype.toFixed(1)}%</b></div></div>
      </div>
      <div class="fieldset"><span class="lg">${t('Floor history')}</span><canvas data-chart="1" style="width:100%;height:70px;display:block"></canvas></div>
      <div class="fieldset"><span class="lg">${t('Quick sell (dump)')}</span>
        <div class="tiny dim" style="margin-bottom:6px">${t('Dumps at floor instantly. The bigger the batch, the worse the price — and dumping <b>hurts hype</b>.')}</div>
        <div class="row">
          ${[1,10,100].map(n=>`<button class="btn" data-qs="${n}" ${sellable.length<n?'disabled':''}>${t('Sell {0} ({1}%)',n,(quickSellHaircut(n)*100).toFixed(0))}</button>`).join('')}
        </div>
        <div class="tiny dim" style="margin-top:5px">${t('Always sells the most common first. Available: {0}',num(sellable.length))}</div>
      </div>`;
    UI.setProg($('.prog i',body),G.hype);
    drawChart($('[data-chart]',body));
    $$('[data-qs]',body).forEach(x=>x.onclick=()=>{
      if(tiredGate())return;
      const n=+x.dataset.qs;
      const pool=sellableTokens().sort((a,b)=>a.rarity-b.rarity).slice(0,n);
      if(!pool.length)return SFX.error();
      const hc=quickSellHaircut(pool.length);
      let tot=0;pool.forEach(tk=>{tot+=tokenValue(tk)*hc;removeToken(tk.id);});
      earn(tot);G.log.sold+=pool.length;G.totals.sold+=pool.length;
      G.hype=clamp(G.hype-0.25*Math.sqrt(pool.length),0,100);
      SFX.cash(tot>200);haptic(HAP.cash);UI.floatFrom(x,'+'+money(tot),'#0a6b2a');
      UI.toast('coin',t('Dumped {0} for {1}',pool.length,money(tot)));
      if(pool.length>=10)UI.hypePop('-HYPE');
      timeAct(ACT.sell);checkLevel();UI.refresh();save();
    });
  }
};
function drawChart(cv){
  if(!cv)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=cv.clientWidth||260,h=70;
  cv.width=w*dpr;cv.height=h*dpr;const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
  const data=(G.priceHist.length?G.priceHist:[floorPrice()]).concat([floorPrice()]);
  const mx=Math.max(...data)*1.12,mn=Math.min(...data)*.9;
  g.strokeStyle='#e0e0e0';g.lineWidth=1;
  for(let i=1;i<4;i++){g.beginPath();g.moveTo(0,h*i/4);g.lineTo(w,h*i/4);g.stroke();}
  g.strokeStyle='#2f6b3a';g.lineWidth=2;g.beginPath();
  data.forEach((v,i)=>{const x=data.length>1?i/(data.length-1)*(w-4)+2:2;
    const y=h-4-((v-mn)/Math.max(.01,mx-mn))*(h-10);
    i?g.lineTo(x,y):g.moveTo(x,y);});
  g.stroke();
  g.fillStyle='rgba(47,107,58,.14)';g.lineTo(w-2,h);g.lineTo(2,h);g.closePath();g.fill();
  /* Texto em canvas nao passa por CSS nenhum: nenhum medidor de legibilidade
     enxerga isto, e por isso ficou em 10px cinza-claro esse tempo todo. Agora
     acompanha a escala da interface e tem contraste de verdade. */
  const K=(typeof uiScale==='function')?uiScale():1;
  const fp=Math.max(15,Math.round(15*K));
  g.font='bold '+fp+'px Tahoma, sans-serif';
  g.textBaseline='top';
  const rot=(txt,y)=>{
    const w2=g.measureText(txt).width;
    g.fillStyle='rgba(255,255,255,.86)';g.fillRect(2,y-2,w2+8,fp+5);
    g.fillStyle='#20402a';g.fillText(txt,5,y+1);
  };
  rot(money(mx),3);
  rot(money(mn),h-fp-6);
}


/* ================= A DOBRA DOS TRAITS =================
   POR QUE: a ficha de um Kaiju abria com a grade INTEIRA de traits (ate uns
   quinze quadradinhos). Quem so queria olhar a cara do bicho levava uma
   parede de texto na tela toda vez. O Kaue pediu isto com essas palavras:
   "muita informacao assim quando eu abro de cara".

   O QUE FICA DE FORA DA DOBRA: a Raca. E ela, com a raridade e o rank que
   ja estao ao lado do desenho, que diz o que o Kaiju E e quanto ele vale.
   Todo o resto (cabelo, olhos, fundo, acessorio...) e detalhe e desce.

   A ESCOLHA E DO JOGADOR E FICA: abrir uma vez abre TODAS as fichas
   seguintes, inclusive depois de fechar o jogo (pref traitsOpen). O padrao
   e fechado.

   USADO POR: mktDetail() aqui e tokenDetail() na carteira. Se aparecer uma
   terceira ficha de Kaiju, ela chama estas duas funcoes tambem — a dobra
   nao pode ser diferente em cada janela. */
function traitCell(tk,l,tip){
  const n=traitCount(l,tk.traits[l]);
  return `<div style="background:#eee;border-color:#999;color:#222"`+
    (tip?` title="${n} / ${SUPPLY}"`:'')+
    `><b style="color:#666">${t(l)} · ${(n/SUPPLY*100).toFixed(1)}%</b>${tk.traits[l]}</div>`;
}
/* A ficha ja diz `Race: Otaku` e `Rarity rank` em cima, em letra grande. A
   caixa de RACE repetia a mesma palavra dois centimetros abaixo — era a
   primeira coisa que sobrava numa tela que ja tinha coisa demais. Entao a
   dobra guarda a lista INTEIRA e o cabecalho continua respondendo o que
   importa antes de qualquer clique. */
function traitsFold(tk,tip){
  const rest=shownTraits(tk);
  const open=(typeof pref==='function')?!!pref('traitsOpen'):false;
  if(!rest.length)return '';
  return `<div class="tfold${open?' open':''}" data-tfold="1">
    <button class="tfbar" data-tfbtn="1" aria-expanded="${open?'true':'false'}">
      <span class="tfchev">&#9654;</span>
      <span class="tflabel">${open?t('Hide traits'):t('Expand traits ({0})',rest.length)}</span>
    </button>
    <div class="rv-traits sheet tf-body">${rest.map(l=>traitCell(tk,l,tip)).join('')}</div>
  </div>`;
}
function wireTraitsFold(box){
  const f=$('[data-tfold]',box);if(!f)return;
  const bt=$('[data-tfbtn]',f), lb=$('.tflabel',f);
  const n=$$('.tf-body > div',f).length;
  if(!bt)return;
  bt.onclick=()=>{
    const open=!f.classList.contains('open');
    f.classList.toggle('open',open);
    bt.setAttribute('aria-expanded',open?'true':'false');
    if(lb)lb.textContent=open?t('Hide traits'):t('Expand traits ({0})',n);
    if(typeof setPref==='function')setPref('traitsOpen',open);
    if(typeof SFX!=='undefined'&&SFX.tick)SFX.tick();
  };
}

/* ficha de um Kaiju que ainda nao e seu */
function mktDetail(l,b,ent){
  const tk=buildToken(l.tk,l.born,false);
  const fair=tokenValue(tk),d=(l.price/fair-1)*100;
  UI.modal(`<div class="titlebar">${pixSVG('market',14,'tico')}<span class="ttl">Kaiju #${tk.id}</span>
    <div class="tbtns"><button class="tb" data-mdx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(330px * var(--ui)),93vw)">
      <div class="pad" style="display:flex;gap:11px">
        <div><canvas data-mdcv="1" style="image-rendering:pixelated"></canvas>
          <div class="rr r${tk.rarity}" style="color:#fff;text-align:center;font-size:calc(10px * var(--fs));padding:2px 0;margin-top:3px">${rarName(tk.rarity)}</div></div>
        <div style="flex:1;font-size:calc(11px * var(--fs));line-height:1.75">
          <div><b>${t('Race')}:</b> <span style="color:#1e5a28;font-weight:bold">${raceOf(tk)}</span></div>
          ${tk.traits.Name?`<div><b>${t('Name')}:</b> ${tk.traits.Name}</div>`:''}
          <div><b>${t('Rarity rank:')}</b> ${t('#{0} of {1}',num(tk.score),num(SUPPLY))}</div>
          <div><b>${t('Seller:')}</b> ${l.who}</div>
          <div><b>${t('Fair value:')}</b> <span class="pos">${money(fair)}</span></div>
          <div><b>${t('Asking:')}</b> <span class="${d<=0?'pos':'neg'}">${money(l.price)} (${d>=0?'+':''}${d.toFixed(0)}%)</span></div>
          <div><b>${t('Delisted in:')}</b> ${t('{0}h',l.ttl)}</div>
        </div>
      </div>
      <div class="pad" style="padding-top:0">
        ${traitsFold(tk,false)}
        <div class="sep"></div>
        <div class="row" style="gap:6px">
          <button class="btn big grow" data-mdbuy="1" ${G.money<l.price?'disabled':''}>${G.money<l.price?t('NOT ENOUGH MONEY'):t('BUY FOR {0}',money(l.price))}</button>
        </div>
      </div>
    </div>`,'',m=>{
    drawKaiju($('[data-mdcv]',m.box),tk,120);
    wireTraitsFold(m.box);
    $('[data-mdx]',m.box).onclick=()=>{SFX.close();m.close();};
    const bb=$('[data-mdbuy]',m.box);
    if(bb)bb.onclick=()=>{
      if(tiredGate())return;
      const r=mktBuyTry(l.id);
      if(r.err){
        m.close();
        mkBuyFailed(r,bb,b,ent);
        return;}
      SFX.cash();haptic(HAP.cash);UI.confetti(22,['#a8e832','#ffffff']);
      UI.toast('market',t('Bought Kaiju #{0} from {1} for {2}',r.tk.id,r.who,money(r.price)));
      checkRaces([r.tk]);
      m.close();timeAct(ACT.offer);checkLevel();UI.refresh();save();
    };
  });
}


/* ---------- banner de promocao, direto de 2003 ---------- */
const MK_PITCH=[
 {en:'8888 HAND-DRAWN MONSTERS · BUY THE DIP · NO REFUNDS',pt:'8888 MONSTROS DESENHADOS À MÃO · COMPRE NA QUEDA · SEM REEMBOLSO'},
 {en:'CLICK HERE!! REAL HOLDERS ARE SELLING RIGHT NOW!!',pt:'CLIQUE AQUI!! TEM GENTE DE VERDADE VENDENDO AGORA!!'},
 {en:'LOWEST FLOOR ON THE WHOLE INTERNET (probably)',pt:'O MENOR FLOOR DA INTERNET INTEIRA (provavelmente)'},
 {en:'WARNING: PRICES CHANGE EVERY HOUR. THAT IS THE POINT.',pt:'AVISO: OS PREÇOS MUDAM TODA HORA. É ESSE O PONTO.'},
 {en:'NO ROADMAP · NO UTILITY · JUST BAD MONSTERS',pt:'SEM ROADMAP · SEM UTILIDADE · SÓ MONSTRO FEIO'}
];
function mktBanner(){
  const p=MK_PITCH[(G.day||1)%MK_PITCH.length];
  const ev=todayEvent();
  const hot=ev.floor>1;
  return `<div class="mkbanner${hot?' hot':''}">
    <div class="mkb-stars">${'&#9733; '.repeat(3)}</div>
    <div class="mkb-mid">
      <div class="mkb-t">Kaijukaki <span>MARKET</span></div>
      <div class="mkb-s">${p[LANG]||p.en}</div>
    </div>
    <div class="mkb-blink">${hot?t('HOT!'):t('OPEN')}</div>
  </div>`;
}


/* ================= A VIDA DO MERCADO NA TELA =================
   Tudo daqui pra baixo existe pra que a aba Buy nao seja uma tabela parada:
   outras pessoas compram na sua frente, o topo mostra os numeros da colecao e
   os lances na colecao inteira ficam junto das offers.
   REGRA DESTA PARTE: nada aqui pode redesenhar a lista inteira. Carta que sai
   sai sozinha, carta que entra entra no fim, e o scroll do jogador nao se
   mexe — foi exatamente esse o bug que o Kaki+ tinha. */

/* o que a carta do mercado quer dizer sobre o seu binder */
function mkWantOf(tk,brc){
  const race=raceOf(tk);
  if(!brc||!brc[race])return {kind:'new'};
  const need=typeof binderNeedFor==='function'?binderNeedFor(race):0;
  return need?{kind:'need',n:need}:null;
}
/* uma carta, sempre montada aqui: a lista inicial e as que chegam ao vivo
   passam pelo mesmo molde, senao as duas metades divergem com o tempo */
function mkCardHTML(l,brc){
  brc=brc||(typeof binderRaceCount==='function'?binderRaceCount():{});
  const tk=buildToken(l.tk,l.born,false);
  const fair=tokenValue(tk);
  const deal=(l.price/fair-1)*100<=-12;
  const w=mkWantOf(tk,brc);
  return `<div class="mkcard${l.fresh?' isnew':''}${deal?' deal':''}" data-mk="${l.id}">
    <div class="mk-art r${tk.rarity}"><canvas data-mktk="${tk.id}"></canvas></div>
    <div class="mk-id">#${tk.id}</div>
    <div class="mk-p">${money(l.price)}</div>
    ${w?(w.kind==='new'
      ? `<span class="mk-bflag new" title="${t('You have no {0} in your binder.',raceOf(tk))}">${t('NOT IN BINDER')}</span>`
      : `<span class="mk-bflag need" title="${t('{0} more to finish a full {1} page.',w.n,raceOf(tk))}">${t('{0} TO A PAGE',w.n)}</span>`)
      /* carta sem tag ganha a mesma faixa vazia: a grade fica alinhada */
      :`<span class="mk-bflag void" aria-hidden="true"></span>`}
    <button class="btn mk-buy" data-mkbuy="${l.id}" ${G.money<l.price?'disabled':''}>${t('BUY')}</button>
    ${deal?`<span class="mk-flag">${t('DEAL')}</span>`:''}
  </div>`;
}
function wireMkCard(card,b,ent){
  const cv=card.querySelector('canvas[data-mktk]');
  if(cv)drawKaijuCached(cv,{id:+cv.dataset.mktk},Math.round(132*((typeof uiScale==='function')?uiScale():1)));
  const bt=card.querySelector('[data-mkbuy]');
  if(bt)bt.onclick=e=>{
    e.stopPropagation();
    if(tiredGate())return;
    const r=mktBuyTry(bt.dataset.mkbuy);
    if(r.err){mkBuyFailed(r,bt,b,ent);return;}
    SFX.cash();haptic(HAP.cash);
    UI.floatFrom(bt,'-'+money(r.price),'#d24b3a');
    UI.toast('market',t('Bought Kaiju #{0} from {1} for {2}',r.tk.id,r.who,money(r.price)));
    checkRaces([r.tk]);
    timeAct(ACT.offer);checkLevel();UI.refresh();save();
  };
  card.onclick=e=>{
    if(e.target.closest('[data-mkbuy]'))return;
    const l=mktList().find(x=>x.id===card.dataset.mk);if(!l)return;
    SFX.click();mktDetail(l,b,ent);
  };
}
/* a carta sai sozinha, com animacao curta. Ninguem redesenha a grade. */
function mkFadeCard(b,lid){
  const card=b&&b.querySelector('.mkcard[data-mk="'+lid+'"]');
  if(!card)return;
  card.classList.add('sold');
  setTimeout(()=>{if(card.parentNode)card.remove();},420);
}
/* o contador da aba e do filtro andam junto com a lista, sem redesenhar nada */
function mkCountSync(b){
  const root=b&&b.querySelector('.mkroot');
  if(!root)return;
  const n=mktList().length;
  const tab=root.querySelector('.tabs .tab[data-t="0"]');
  if(tab)tab.textContent=t('Buy ({0})',n);
  const opt=root.querySelector('[data-mkf] option[value="all"]');
  if(opt)opt.textContent=t('Everything ({0})',n);
}

/* ---------- a fita: quem levou o que ---------- */
function mkTapeIdle(){
  return t('LIVE · {0} listings from other holders',num(mktList().length));
}
function mkTapeSay(b,txt){
  const tape=b&&b.querySelector('[data-mktape]');
  if(!tape)return;
  const n=tape.querySelector('[data-mktapetxt]');
  if(n)n.textContent=txt;
  tape.classList.remove('hit');void tape.offsetWidth;tape.classList.add('hit');
}

/* ---------- a barra de cima: os numeros da colecao ---------- */
function mktStatItems(){
  const ch=(typeof floorChange1d==='function')?floorChange1d():null;
  const to=(typeof topOffer==='function')?topOffer():0;
  return [
    {k:'floor',lbl:t('FLOOR PRICE'), v:money(floorPrice()), cls:''},
    {k:'d1',   lbl:t('1D FLOOR %'),  v:ch==null?'—':((ch>=0?'+':'')+ch.toFixed(1)+'%'), cls:ch==null?'':(ch>=0?'up':'down')},
    {k:'top',  lbl:t('TOP OFFER'),   v:to>0?money(to):'—', cls:''},
    {k:'v24',  lbl:t('24H VOLUME'),  v:moneyShort(vol24h()), cls:''},
    {k:'vtot', lbl:t('TOTAL VOLUME'),v:moneyShort(volTotal()), cls:''}
  ];
}
function mktStatsBar(){
  /* a moldura de fora existe so pra ser o CONTAINER da consulta de tamanho:
     e ela que decide se cabem cinco colunas, tres ou duas. Ver 15-market.css. */
  return `<div class="mkstatswrap"><div class="mkstats" data-mkstats="1">${mktStatItems().map(x=>
    `<div class="ms-c"><span class="ms-k">${x.lbl}</span><b class="ms-v${x.cls?' '+x.cls:''}" data-ms="${x.k}">${x.v}</b></div>`).join('')}</div></div>`;
}
/* atualiza so os cinco numeros: chamado pela vida do mercado, que nao pode
   redesenhar a tela toda a cada venda. Leva junto o "Floor $x" do filtro e a
   barra de status — senao a mesma tela mostraria dois floors diferentes. */
function mktStatsSync(b,ent){
  if(!b)return;
  const bar=b.querySelector('[data-mkstats]');
  if(bar)mktStatItems().forEach(x=>{
    const n=bar.querySelector('[data-ms="'+x.k+'"]');
    if(!n)return;
    n.textContent=x.v;
    n.className='ms-v'+(x.cls?' '+x.cls:'');
  });
  const fl=b.querySelector('[data-mkfloor]');
  if(fl)fl.textContent=t('Floor {0}',money(floorPrice()));
  const st=ent&&ent.win&&ent.win.querySelector('.st1');
  if(st)st.textContent=`${t('Floor')} ${money(floorPrice())} · ${t('Hype')} ${G.hype.toFixed(0)}%`;
}

/* ---------- quando a compra da errado ---------- */
function mkBuyFailed(r,node,b,ent){
  if(r.err==='full'){SFX.error();
    UI.dialog(t('Wallet full'),t('Your wallet holds {0} Kaiju and it is full.<br><br>Sell something first.',num(capacity())),'warn');return;}
  if(r.err==='money'){SFX.error();
    UI.dialog(t('Not enough money'),t('You need <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
  if(r.err==='sniped'){
    SFX.error();haptic(HAP.deny);
    mkFadeCard(b,r.lid);
    mkTapeSay(b,t('{0} bought #{1} for {2}',r.who,r.tk,money(r.price)));
    UI.toast('warn',t('{0} bought it {1}s before you. Your money never left the wallet.',r.who,(0.1+Math.random()*0.7).toFixed(1)));
    mkCountSync(b);mktStatsSync(b,ent);save();
    return;
  }
  if(r.err==='failed'){
    SFX.error();haptic(HAP.deny);
    if(node)UI.floatFrom(node,'-'+money(r.gas),'#d24b3a');
    UI.dialog(t('Transaction failed'),
      t('The network took your signature, thought about it for a while, and threw it away: <b>{0}</b>.<br><br>The Kaiju is still listed. The gas is not coming back.<br><br>Burned for nothing: <b>{1}</b>',r.why,money(r.gas)),
      'xerr');
    UI.updateTray();save();
    return;
  }
  SFX.error();
  UI.toast('warn',t('Somebody else bought it first.'));
  if(b&&ent&&APPS.market)APPS.market.refresh(b,ent);
}

/* ================= BIDS NA COLECAO INTEIRA ================= */
function cbidSection(){
  /* MODO HISTORIA: lance na colecao inteira e assunto do hakase depois da
     primeira venda (b_offers). Antes disso nem o estado vazio aparece —
     um cabecalho explicando o que nao existe e so mais uma coisa na tela. */
  if(typeof unlocked==='function'&&!unlocked('m_collection_offers'))return '';
  const L=cbids().slice().sort((a,b)=>b.price-a.price);
  const fp=floorPrice();
  const head=`<div class="cbhead">
      <span class="cb-h-t">${t('COLLECTION OFFERS')}</span>
      <span class="cb-h-s">${t('A fixed price for ANY Kaiju you own. You choose which one leaves.')}</span>
    </div>`;
  if(!L.length)
    return `<div class="cbwrap">${head}<div class="cb-empty">${t('Nobody is bidding on the whole collection yet. That starts when people want in and do not care which one they get.')}</div></div>`;
  const ic=Math.round(20*((typeof uiScale==='function')?uiScale():1));
  return `<div class="cbwrap">${head}`+L.map(o=>{
    const d=(o.price/fp-1)*100;
    const can=cbidFillable(o);
    return `<div class="cbid${o.fresh?' new':''}" data-cb="${o.id}">
      ${pixSVG('coin',ic,'cb-ic')}
      <div class="cb-i">
        <div class="cb-who">${o.who}</div>
        <div class="cb-sub">${t('wants {0}',o.qty)} · ${t('expires in {0}h',o.ttl)} ·
          <span class="${d>=0?'pos':'neg'}">${d>=0?'+':''}${d.toFixed(0)}% ${t('vs floor')}</span></div>
      </div>
      <div class="cb-act">
        <div class="cb-p">${money(o.price)}</div>
        <div class="cb-btns">
          <button class="btn tight" data-cbsell="${o.id}"${can<1?' disabled':''}>${t('SELL 1')}</button>
          <button class="btn tight" data-cbpick="${o.id}"${can<1?' disabled':''}>${t('Pick one...')}</button>
          ${o.qty>1?`<button class="btn tight" data-cball="${o.id}"${can<2?' disabled':''}>${t('SELL {0}',can>=2?can:o.qty)}</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('')+`</div>`;
}
function wireCbids(body,b,ent){
  cbids().forEach(o=>delete o.fresh);
  $$('[data-cbsell]',body).forEach(x=>x.onclick=()=>cbidSell(x.dataset.cbsell,null,1,x.closest('.cbid'),b,ent));
  $$('[data-cball]',body).forEach(x=>x.onclick=()=>{
    const o=cbids().find(y=>y.id===x.dataset.cball);
    cbidSell(x.dataset.cball,null,o?cbidFillable(o):1,x.closest('.cbid'),b,ent);
  });
  $$('[data-cbpick]',body).forEach(x=>x.onclick=()=>cbidPickModal(x.dataset.cbpick,b,ent));
}
function cbidSell(oid,tokenId,n,node,b,ent){
  if(tiredGate())return;
  const r=acceptCollectionBid(oid,tokenId,n);
  if(r.err==='empty'){SFX.error();
    UI.dialog(t('Nothing to hand over'),t('Every Kaiju you own is staked, listed or filed in the binder. None of them can be sold right now.'),'warn');return;}
  if(r.err){SFX.error();UI.toast('warn',t('That offer is gone.'));UI.refresh();return;}
  SFX.cash(r.total>200);haptic(HAP.cash);
  if(node&&r.left<=0)node.classList.add('gone');
  UI.floatFrom(node||$('#m_money'),'+'+money(r.total),'#0a6b2a');
  UI.toast('coin',r.sold.length>1
    ? t('Sold {0} Kaiju to {1} for {2}',r.sold.length,r.who,money(r.total))
    : t('Sold Kaiju #{0} to {1} for {2}',r.sold[0].id,r.who,money(r.total)));
  UI.think(pick(TH('sale')));
  timeAct(ACT.offer);
  setTimeout(()=>{checkLevel();UI.refresh();save();},260);
}
/* escolher a peca: o preco do bid e o mesmo pra qualquer uma, entao a unica
   pergunta que importa e "qual delas vale menos que isso" */
function cbidPickModal(oid,b,ent){
  const o=cbids().find(x=>x.id===oid);
  if(!o)return;
  const pool=sellableTokens().slice().sort((a,c)=>a.rarity-c.rarity||tokenValue(a)-tokenValue(c));
  if(!pool.length){SFX.error();
    UI.dialog(t('Nothing to hand over'),t('Every Kaiju you own is staked, listed or filed in the binder. None of them can be sold right now.'),'warn');return;}
  const px=Math.round(72*((typeof uiScale==='function')?uiScale():1));
  UI.modal(`<div class="titlebar">${pixSVG('coin',14,'tico')}<span class="ttl">${t('Pick one for {0}',o.who)}</span>
    <div class="tbtns"><button class="tb" data-cbx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(440px * var(--ui)),94vw)"><div class="pad">
      <div class="cbpick-h">${t('{0} pays <b>{1}</b> for any single Kaiju. Green means the offer beats what it is worth.',o.who,money(o.price))}</div>
      <div class="cbpick">${pool.slice(0,80).map(tk=>{
        const v=tokenValue(tk);
        return `<div class="cbp-c ${o.price>=v?'good':'bad'}" data-cbp="${tk.id}" title="${rarName(tk.rarity)}">
          <canvas data-cbpcv="${tk.id}"></canvas>
          <div class="cbp-id">#${tk.id}</div>
          <div class="cbp-v">${money(v)}</div>
        </div>`;}).join('')}</div>
    </div></div>`,'',m=>{
    $$('canvas[data-cbpcv]',m.box).forEach(c=>{
      const tk=G.tokens.find(x=>x.id==c.dataset.cbpcv);
      if(tk)drawKaijuCached(c,tk,px);
    });
    $('[data-cbx]',m.box).onclick=()=>{SFX.close();m.close();};
    $$('[data-cbp]',m.box).forEach(x=>x.onclick=()=>{
      const id=+x.dataset.cbp;
      m.close();
      setTimeout(()=>cbidSell(oid,id,1,null,b,ent),120);
    });
  });
}

/* ================= GENTE COMPRANDO ENQUANTO VOCE OLHA =================
   Um relogio so, criado uma vez. Ele nao guarda janela nenhuma: a cada batida
   procura a aba Buy aberta e visivel, e se nao achar nao faz nada. Com a
   janela fechada, minimizada, noutra aba do navegador (body.hid) ou com um
   modal por cima, o mercado nao anda. */
let MK_LIVE_T=0;
function mkLiveTick(){
  const now=Date.now();
  const dt=clamp((now-(MK_LIVE_T||now))/1000,0,2);
  MK_LIVE_T=now;
  if(typeof G==='undefined'||!G||!G.tokens)return;
  if(document.body.classList.contains('hid'))return;
  if(typeof dayLock!=='undefined'&&dayLock)return;
  if(typeof dayIsOver==='function'&&dayIsOver())return;
  if(UI.modalOpen&&UI.modalOpen())return;
  if(MV.tab!==0)return;
  const ent=UI.open&&UI.open.hubmarket;
  if(!ent||ent.min||ent.tab!=='market')return;
  const b=ent.body&&ent.body.querySelector('.hubbody.sub-market');
  if(!b)return;
  const grid=b.querySelector('[data-mkgrid]');
  if(!grid||!grid.offsetParent)return;
  const esperado=npcBuyRate()*dt;
  let n=Math.floor(esperado)+(chance(esperado%1)?1:0);
  n=Math.min(n,2);
  let fez=0;
  for(let i=0;i<n;i++)if(mkLiveBuy(b,ent))fez++;
  if(fez){mkCountSync(b);mktStatsSync(b,ent);}
}
function mkLiveBuy(b,ent){
  const r=npcBuyOne();
  if(!r)return false;
  mkTapeSay(b,t('{0} bought #{1} for {2}',r.who,r.tk,money(r.price)));
  mkFadeCard(b,r.lid);
  /* saiu uma, entra outra: a vitrine nao pode secar so porque o jogador ficou
     olhando. A carta nova entra NO FIM da grade — nada acima dela se mexe, o
     scroll fica onde estava. */
  const grid=b.querySelector('[data-mkgrid]');
  if(grid&&mktList().length<mktSlots()){
    const l=makeMktListing();
    if(l){
      const box=document.createElement('div');
      box.innerHTML=mkCardHTML(l);
      const card=box.firstElementChild;
      delete l.fresh;
      if(card){grid.appendChild(card);wireMkCard(card,b,ent);}
    }
  }
  return true;
}
setInterval(mkLiveTick,900);
