/* ================= APP: My Wallet ================= */
/* pagina, filtro e ordenacao sao do JOGADOR: ficam no registrador (G.prefs),
   entao fechar a janela — ou o jogo — nao devolve tudo pro padrao */
const WV=prefView({page:'walletPage',filter:'walletFilter',sort:'walletSort'});
const GRID_SIZES={s:[74,64],m:[104,92],l:[142,128]};
function gridSize(){return pref('walletGrid');}
function setGridSize(v){setPref('walletGrid',v);}
const PAGE=48;
APPS.wallet={
  title:'My Wallet', icon:'wallet', w:480, h:430, status:true,
  build(b,ent){b.innerHTML='<div class="wroot"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.wroot',b);if(!root)return;
    /* MODO HISTORIA: filtro/ordenacao (b_sort) e o S/M/L da grade chegam
       quando a carteira fica grande demais pra olhar no olho. Enquanto nao
       chegam, a carteira se comporta como se estivesse no padrao — nao adianta
       esconder o controle e continuar filtrando pelo que ficou gravado. */
    const sortOn=unlocked('m_wallet_sort'), gridOn=unlocked('f_wgrid');
    const fil=sortOn?WV.filter:'all', srt=sortOn?WV.sort:'new';
    let list=G.tokens.filter(x=>!x.hidden);
    if(fil==='free')list=list.filter(x=>!x.staked&&x.listed==null);
    else if(fil==='staked')list=list.filter(x=>x.staked);
    else if(fil==='listed')list=list.filter(x=>x.listed!=null);
    else if(fil==='binder'){const bs=binderIds();list=list.filter(x=>bs.has(x.id));}
    else if(fil.indexOf('r:')===0)list=list.filter(x=>x.rarity===+fil.slice(2));
    else if(fil.indexOf('c:')===0)list=list.filter(x=>x.traits.Race===fil.slice(2));
    /* seq = ordem de chegada na carteira. O id NAO serve pra isso: a fila de
       mint e embaralhada, entao o ultimo mintado pode ser o #412. */
    if(srt==='new')list.sort((a,c)=>(c.seq||0)-(a.seq||0)||c.id-a.id);
    else if(srt==='rare')list.sort((a,c)=>c.rarity-a.rarity||a.score-c.score);
    else if(srt==='id')list.sort((a,c)=>a.id-c.id);
    else list.sort((a,c)=>(a.seq||0)-(c.seq||0)||a.id-c.id);
    /* chegou coisa nova e o filtro e por recencia: ela tem que estar visivel */
    if(srt==='new'&&list.some(x=>x.fresh))WV.page=0;
    const pages=Math.max(1,Math.ceil(list.length/PAGE));
    WV.page=clamp(WV.page,0,pages-1);
    const slice=list.slice(WV.page*PAGE,WV.page*PAGE+PAGE);
    const valAll=G.tokens.reduce((a,x)=>a+tokenValue(x),0);
    let gs=GRID_SIZES[gridOn?gridSize():'m']||GRID_SIZES.m;
    if(typeof IS_MOB!=='undefined'&&IS_MOB)gs=[Math.min(gs[0],112),Math.min(gs[1],100)];
    const capPct=clamp(held()/capacity()*100,0,100);
    /* A barra so nasce se tiver alguma coisa pra por nela. No dia 1, sem
       filtro, sem grade e com uma pagina so, ela seria uma faixa vazia com
       borda — exatamente o entulho que este modo existe pra tirar. */
    const pag=pages>1;
    const partes=[];
    if(sortOn)partes.push(`<select data-wf="1">
        <option value="all">${t('All ({0})',num(G.tokens.length))}</option>
        <option value="free">${t('Available')}</option><option value="listed">${t('Listed')}</option><option value="staked">${t('Staked')}</option><option value="binder">${t('In binder')}</option>
        ${RARITY.map((r,i)=>`<option value="r:${i}">${rarName(i)}</option>`).join('')}
        ${RACES.map(r=>`<option value="c:${r}">${r}${typeof raceHeatMark==='function'&&raceHeatMark(r)?' '+raceHeatMark(r):''}</option>`).join('')}
      </select>
      <select data-ws="1"><option value="new">${t('Newest')}</option><option value="rare">${t('Rarest')}</option><option value="old">${t('Oldest')}</option><option value="id">${t('By number')}</option></select>`);
    if(gridOn)partes.push(`<div class="sizebtns">${['s','m','l'].map(k=>`<button class="btn tight ${gridSize()===k?'on':''}" data-wsize="${k}" title="${t('Grid size')}">${k.toUpperCase()}</button>`).join('')}</div>`);
    if(listSomeUnlocked())partes.push(`<button class="btn tight" data-wlistsome="1">${t('LIST&hellip;')}</button>`);
    if(listAllUnlocked())partes.push(`<button class="btn tight" data-wlistall="1">${t('LIST ALL')}</button>`);
    if(pag)partes.push(`<div class="grow"></div>
      <button class="btn tight" data-wprev="1">&#8592;</button>
      <span class="tiny">${WV.page+1}/${pages}</span>
      <button class="btn tight" data-wnext="1">&#8594;</button>`);
    const ferramentas=partes.length
      ?`<div class="row wtoolbar" style="padding:6px 7px;gap:5px;flex-wrap:wrap">${partes.join('')}</div>`:'';
    root.innerHTML=`${walletBanner()}<div class="capbar ${capPct>=100?'full':capPct>85?'hot':''}">
        <div class="prog ${capPct>=100?'hot':'moss'}"><i style="width:0%"></i><b>${t('Wallet {0}/{1}',num(held()),num(capacity()))}</b></div>
        ${nextCapUpgrade()?`<button class="btn tight" data-wcap="1">${t('Expand')}</button>`:''}
      </div>
      ${ferramentas}
    ${slice.length?`<div class="nftgrid" data-wgrid="1" style="grid-template-columns:repeat(auto-fill,minmax(${gs[0]}px,1fr))"></div>`:`<div class="center dim" style="padding:34px 10px;line-height:1.7">${pixSVG('wallet',32)}<br>${t('Wallet is empty.')}<br><span class="tiny">${t('Open kaijukaki.net and mint something.')}</span></div>`}`;
    /* tudo daqui pra baixo tem que aguentar o elemento NAO existir */
    const wf=$('[data-wf]',root),ws=$('[data-ws]',root);
    if(wf){wf.value=fil;wf.onchange=e=>{WV.filter=e.target.value;WV.page=0;SFX.click();APPS.wallet.refresh(b,ent);};}
    if(ws){ws.value=srt;ws.onchange=e=>{WV.sort=e.target.value;WV.page=0;SFX.click();APPS.wallet.refresh(b,ent);};}
    $$('[data-wsize]',root).forEach(x=>x.onclick=()=>{SFX.click();setGridSize(x.dataset.wsize);APPS.wallet.refresh(b,ent);});
    const wc=$('[data-wcap]',root);
    /* so leva pra loja quando a loja ja existe pro jogador */
    if(wc&&(typeof unlocked!=='function'||unlocked('shop')))wc.onclick=()=>{SFX.click();UI.openApp('shop');};
    const wla=$('[data-wlistall]',root);
    if(wla)wla.onclick=()=>listAllPrompt(b,ent);
    const wls=$('[data-wlistsome]',root);
    if(wls)wls.onclick=()=>listSomePrompt(b,ent);
    UI.setProg($('.capbar .prog i',root),capPct);
    const wp=$('[data-wprev]',root),wn=$('[data-wnext]',root);
    if(wp)wp.onclick=()=>{SFX.click();WV.page=Math.max(0,WV.page-1);APPS.wallet.refresh(b,ent);};
    if(wn)wn.onclick=()=>{SFX.click();WV.page=Math.min(pages-1,WV.page+1);APPS.wallet.refresh(b,ent);};
    const grid=$('[data-wgrid]',root);
    if(grid){
      let fi=0;
      const bset=binderIds();
      slice.forEach(tk=>{
        const inBin=bset.has(tk.id);
        const c=el('div','nftcard'+(tk.staked?' locked':tk.listed!=null?' listed':inBin?' inbinder':'')+(tk.fresh?' fresh':''));
        if(tk.staked)c.dataset.tag=stakeLocked(tk)?t('{0}d',stakeDaysLeft(tk)):t('FREE');
        if(tk.fresh)c.style.animationDelay=(fi++*22)+'ms';
        c.innerHTML=`<canvas></canvas><div class="nm">#${tk.id}</div><div class="rr r${tk.rarity}">${rarName(tk.rarity)}</div>`;
        grid.appendChild(c);
        drawKaijuCached($('canvas',c),tk,gs[1]);
        c.onclick=()=>{SFX.click();tokenDetail(tk.id);};
      });
      list.forEach(tk=>delete tk.fresh);
    }
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=t('{0} Kaiju · est. value {1}',num(G.tokens.length),money(valAll));st2.textContent='Lv'+G.level;}
  }
};
/* ---------- assinatura ----------
   Listar era instantaneo e comia 15 minutos do dia sem dizer nada. Agora tem
   uma janelinha de assinatura de contrato, que dura menos conforme o perk de
   velocidade sobe. Passa pela fila de UI.modal — o relogio do jogo ja para
   sozinho enquanto tem modal aberto, entao o tempo nao anda duas vezes. */
/* Listar era de graca. Dava pra listar tudo, cancelar, relistar mais caro, o
   dia inteiro, sem custo nenhum — o mercado nao tinha atrito. A assinatura
   agora custa gas de verdade (uma fracao do gas de um mint: listar nao cunha
   nada) e empurra a pressao da rede pra cima, igual qualquer uso da chain.
   Este e o unico funil: os quatro caminhos de listagem passam por aqui. */
function signingModal(label,n,then){
  const taxa=listFee(n);
  if(G.money<taxa-1e-9){
    SFX.error();
    UI.dialog(t('Not enough for gas'),
      t('Signing this listing costs <b>{0}</b> in gas and you have {1}.<br><br>Gas is cheaper in the calm hours — check the Gas Tracker.',money(taxa),money(G.money)),'warn');
    return;
  }
  spend(taxa);
  if(typeof chainPush==='function')chainPush(0.5+0.12*Math.max(0,n-1));
  const ms=listMs(n);
  const stages=LANG==='pt'
    ? ['Assinando a transacao...','Enviando pro contrato...','Esperando confirmacao...','Listado.']
    : ['Signing transaction...','Submitting to contract...','Waiting for confirmation...','Listed.'];
  UI.modal(`<div class="titlebar">${pixSVG('market',14,'tico')}<span class="ttl">${label}</span></div>
    <div class="wbody" style="background:var(--face);width:min(calc(300px * var(--ui)),92vw)">
      <div class="pad center">
        <div class="signspin">${pixSVG('rocket',Math.round(30*uiScale()))}</div>
        <div class="signtxt" data-sgt="1">${stages[0]}</div>
        <div class="prog moss" style="margin-top:8px"><i data-sgb="1" style="width:0%"></i></div>
        <div class="tiny dim" style="margin-top:6px">${n>1?t('{0} Kaiju · {1} min',num(n),listMinutes(n)):t('{0} min of your day',listMinutes(1))}</div>
        <div class="tiny" style="margin-top:4px"><b>${t('Gas')}</b> <span class="neg">-${money(taxa)}</span></div>
      </div></div>`,'signing',m=>{
    const bar=$('[data-sgb]',m.box), txt=$('[data-sgt]',m.box);
    bar.style.transition=`width ${ms}ms linear`;
    requestAnimationFrame(()=>{bar.style.width='100%';});
    stages.forEach((st,i)=>setTimeout(()=>{
      if(!m.box||!m.box.isConnected)return;
      txt.textContent=st;if(i)SFX.tick();
    },ms*i/stages.length));
    setTimeout(()=>{
      if(m.box&&m.box.isConnected){SFX.coin();m.close();}
      if(then)then();
    },ms+110);
  });
}
function tokenDetail(id){
  const tk=G.tokens.find(x=>x.id===id);if(!tk)return;
  const fair=tokenValue(tk);
  const inBin=binderIds().has(tk.id);
  const binPage=typeof binderPageOf==='function'?binderPageOf(tk.id):null;
  UI.modal(`<div class="titlebar">${pixSVG('wallet',14,'tico')}<span class="ttl">Kaiju #${tk.id}</span>
    <div class="tbtns"><button class="tb" data-tdx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(330px * var(--ui)),93vw)">
      <div class="pad" style="display:flex;gap:11px">
        <div><canvas data-tdcv="1" style="image-rendering:pixelated"></canvas>
          <div class="rr r${tk.rarity}" style="color:#fff;text-align:center;font-size:calc(10px * var(--fs));padding:2px 0;margin-top:3px">${rarName(tk.rarity)}</div></div>
        <div style="flex:1;font-size:calc(11px * var(--fs));line-height:1.75">
          <div><b>${t('Race')}:</b> <span style="color:#1e5a28;font-weight:bold">${raceOf(tk)}</span></div>
          ${tk.traits.Name?`<div><b>${t('Name')}:</b> ${tk.traits.Name}</div>`:''}
          <div><b>${t('Rarity rank:')}</b> ${t('#{0} of {1}',num(tk.score),num(SUPPLY))}</div>
          <div><b>${t('Minted:')}</b> ${t('day {0}',tk.day)}</div>
          <div><b>${t('Fair value:')}</b> <span class="pos">${money(fair)}</span></div>
          <div><b>${t('Status:')}</b> ${tk.staked?(stakeLocked(tk)?t('staked · {0} day(s) left',stakeDaysLeft(tk)):t('staked · free to take out')):inBin?t('in the binder'):tk.listed!=null?t('listed for {0}',money(tk.listed)):t('free')}</div>
          ${stakingOn()?`<div><b>${t('Staking:')}</b> ${money(stakeDaily(tk))}${t('/day')}</div>`:''}
        </div>
      </div>
      <div class="pad" style="padding-top:0">
        ${traitsFold(tk,true)}
        <div class="sep"></div>
        ${inBin?`<div class="warnbar">${pixSVG('binder',14)}
          <span>${t('This Kaiju is filed in your binder ({0}). Selling it would leave a hole in the page.',binPage?binPage.name:t('a page'))}</span>
          <button class="btn tight" data-tdunbind="1">${t('Take it out')}</button></div>`:''}
        ${(unlocked('hubsocial')&&unlocked('f_boost'))?`<button class="btn wide" data-tdshot="1" style="margin-bottom:calc(6px * var(--ui))">${pixSVG('chat',14)} ${t('Post it on Kaki+')}</button>`:''}
        <div class="tdacts">
          ${tk.staked?(stakeLocked(tk)
            ? `<button class="btn big wide" disabled>&#128274; ${t('Locked for {0} more day(s)',stakeDaysLeft(tk))}</button>`
            : `<button class="btn big wide" data-tdunstake="1">${pixSVG('vault',16)} ${t('Take out of staking')}</button>`)
          :inBin?`<button class="btn big wide" disabled>${pixSVG('binder',16)} ${t('In the binder — take it out to sell')}</button>`:`
            <button class="btn big wide" data-tdsell="1">${pixSVG('coin',16)} ${t('Sell at floor ({0})',money(fair*.88))}</button>
            ${tk.listed!=null
              ? `<button class="btn big wide" data-tdunlist="1">${pixSVG('market',16)} ${t('Cancel listing')}</button>`
              : `<button class="btn big wide" data-tdlist="1">${pixSVG('market',16)} ${t('List for sale')}<span class="bgas gm-${gasMood()}">${t('est. gas {0}',money(listFee(1)))}</span></button>`}
            ${!unlocked('f_stake')
              /* MODO HISTORIA: antes do hakase abrir o cofre (b_vault) o cofre
                 nao existe pro jogador. O botao cinza com cadeado era um anuncio
                 de sistema que ninguem tinha visto ainda. */
              ? ''
              : !stakingOn()
              ? `<button class="btn big wide" data-tdvault="1">${pixSVG('vault',16)} ${t('Turn staking on first')}</button>`
              : stakeFull()
              ? `<button class="btn big wide" disabled>${pixSVG('vault',16)} ${t('All {0} vault slots are full',stakeSlots())}</button>`
              : `<button class="btn big wide" data-tdstake="1">${pixSVG('vault',16)} ${t('Send to staking ({0} days)',STAKE_MIN_DAYS)}</button>`}`}
        </div>
        <!-- a janela desce e o preco e escolhido aqui mesmo -->
        <div class="pricepane" data-pricepane="1" hidden>
          <div class="pp-row">
            <button class="pp-step down" data-ppm="-25" title="-25%">&minus;</button>
            <div class="pp-field"><span>$</span><input type="number" data-lpv="1" step="0.5" min="0.5" value="${fair.toFixed(2)}"></div>
            <button class="pp-step up" data-ppm="25" title="+25%">+</button>
          </div>
          <div class="pp-vs" data-ppvs="1"></div>
          <div class="pp-gas gm-${gasMood()}" data-ppgas="1"></div>
          <button class="btn pp-fairbtn" data-ppreset="1">${t('FAIR VALUE')} · ${money(fair)}</button>
          <div class="pp-row2">
            <button class="btn pp-m down" data-ppm="-50">&minus;50%</button>
            <button class="btn pp-m" data-ppm="50">+50%</button>
            <button class="btn pp-m" data-ppm="200">+200%</button>
          </div>
          <div class="pp-foot">
            <button class="btn" data-ppcancel="1">${t('Cancel')}</button>
            <button class="btn big grow" data-ppok="1">${t('LIST IT')}</button>
          </div>
        </div>
      </div>
    </div>`,'',m=>{
    const box=m.box;
    drawKaiju($('[data-tdcv]',box),tk,120);
    wireTraitsFold(box);
    $('[data-tdx]',box).onclick=()=>{SFX.close();m.close();};
    const close=()=>{m.close();UI.refresh();save();};
    const bs=$('[data-tdsell]',box);if(bs)bs.onclick=()=>{if(tiredGate())return;const v=fair*.88;removeToken(tk.id);earn(v);G.log.sold++;G.totals.sold++;
      SFX.cash();haptic(HAP.cash);UI.floatFrom(bs,'+'+money(v),'#0a6b2a');timeAct(5);checkLevel();close();};
    /* ---- painel de preco embutido ----
       Cada clique num multiplicador soma aquela fatia do valor JUSTO ao preco.
       Clicar +200% tres vezes pede seis vezes o valor justo. */
    const pane=$('[data-pricepane]',box), inp=$('[data-lpv]',box), vs=$('[data-ppvs]',box);
    const gasl=$('[data-ppgas]',box);
    const setP=v=>{
      const val=Math.max(0.5,Math.round(v*100)/100);
      inp.value=val.toFixed(2);
      const d=(val/fair-1)*100;
      vs.className='pp-vs '+(d<=2?'good':d<=60?'mid':'far');
      vs.textContent=(d>=0?'+':'')+d.toFixed(0)+'% '+t('vs fair')+' · '+
        (d<=2?t('sells fast'):d<=60?t('takes a while'):t('might never sell'));
      /* O QUE ELE QUER SABER ANTES DE APERTAR: quanto a assinatura queima de
         gas, e o que sobra se o Kaiju vender por esse preco. O gas sai agora,
         o preco entra depois — por isso "est.": o gas anda com a hora do dia. */
      if(gasl){
        const gs=listFee(1);
        gasl.className='pp-gas gm-'+gasMood();
        gasl.textContent=t('est. gas {0} · you net {1}',money(gs),money(Math.max(0,val-gs)));
      }
    };
    const openPane=()=>{
      if(tiredGate())return;
      pane.hidden=false;
      $('.tdacts',box).classList.add('folded');
      setP(fair);
      SFX.down();
      setTimeout(()=>{try{inp.focus();inp.select();}catch(e){}},120);
    };
    const bl=$('[data-tdlist]',box);if(bl)bl.onclick=openPane;
    if(pane){
      $$('[data-ppm]',pane).forEach(x=>x.onclick=()=>{
        SFX.click();haptic(HAP.tap);
        setP((parseFloat(inp.value)||fair)+fair*(+x.dataset.ppm/100));
      });
      $('[data-ppreset]',pane).onclick=()=>{SFX.click();setP(fair);};
      inp.oninput=()=>{const v=parseFloat(inp.value);if(v>0)setP(v);};
      $('[data-ppcancel]',pane).onclick=()=>{SFX.close();pane.hidden=true;$('.tdacts',box).classList.remove('folded');};
      $('[data-ppok]',pane).onclick=()=>{
        const v=parseFloat(inp.value);
        if(!(v>0)){SFX.error();return;}
        close();
        signingModal(t('Listing Kaiju #{0}',tk.id),1,()=>{
          tk.listed=v;G.log.listed=(G.log.listed||0)+1;G.totals.listed=(G.totals.listed||0)+1;
          haptic(HAP.ok);
          UI.toast('market',t('#{0} listed for {1}',tk.id,money(v)));
          timeAct(listMinutes(1));UI.refresh();save();
        });
      };
    }
    const bu=$('[data-tdunlist]',box);if(bu)bu.onclick=()=>{SFX.click();tk.listed=null;close();};
    /* o botao ja nao aparece travado, mas nao confia so no HTML */
    /* os botoes ja aparecem travados, mas nunca confia so no HTML */
    const bk=$('[data-tdstake]',box);if(bk)bk.onclick=()=>{
      const r=stakeToken(tk);
      if(r.err==='off'){SFX.error();UI.dialog(t('Staking is off'),t('Open the Staking Vault and turn it on first.'),'warn');return;}
      if(r.err==='slots'){SFX.error();UI.dialog(t('No free slots'),t('{0} of {1} slots are in use. Expand the vault or wait for a lock to expire.',num(stakedTokens().length),num(stakeSlots())),'warn');return;}
      if(r.err==='binder'){SFX.error();UI.dialog(t('It is in the binder'),t('Take Kaiju #{0} out of the binder page first.',tk.id),'warn');return;}
      if(r.err){SFX.error();return;}
      SFX.click();UI.toast('vault',t('Kaiju #{0} locked for {1} days',tk.id,STAKE_MIN_DAYS));close();
    };
    const bvt=$('[data-tdvault]',box);if(bvt)bvt.onclick=()=>{SFX.click();close();setTimeout(()=>UI.openApp('vault'),160);};
    const bun=$('[data-tdunstake]',box);if(bun)bun.onclick=()=>{
      const r=unstakeToken(tk);
      if(r.err==='locked'){SFX.error();UI.dialog(t('Still locked'),t('Kaiju #{0} has <b>{1}</b> day(s) left in the vault.',tk.id,r.left),'warn');return;}
      SFX.click();close();
    };
    const bsh=$('[data-tdshot]',box);
    if(bsh)bsh.onclick=()=>{
      if(typeof postShot!=='function')return SFX.error();
      const S=soc();
      if((S.shotsToday||0)>=3){SFX.error();UI.toast('warn',t('You have posted enough photos today.'));return;}
      S.shotsToday=(S.shotsToday||0)+1;
      const l=pick(SHOT_LINES);
      postShot(tk,l[LANG]||l.en);
      SFX.coin();haptic(HAP.ok);
      UI.toast('chat',t('Posted #{0} on Kaki+.',tk.id));
      timeAct(3);close();UI.refresh();save();
    };
    const bub=$('[data-tdunbind]',box);if(bub)bub.onclick=()=>{
      if(typeof binderRemove==='function'&&binderRemove(tk.id)){
        SFX.click();UI.toast('binder',t('Kaiju #{0} is out of the binder.',tk.id));
        save();close();setTimeout(()=>tokenDetail(tk.id),180);
      } else SFX.error();
    };
  });
}
function listPrompt(id,fair){
  const tk=G.tokens.find(x=>x.id===id);if(!tk)return;
  UI.modal(`<div class="titlebar">${pixSVG('market',14,'tico')}<span class="ttl">${t('List Kaiju #{0}',id)}</span></div>
    <div class="wbody" style="background:var(--face);width:min(calc(300px * var(--ui)),92vw)"><div class="pad">
      <div class="tiny dim" style="margin-bottom:8px">${t('Fair value: {0}. Below that sells fast, above that takes longer.',money(fair))}</div>
      <div class="row"><span>${t('Price $')}</span><input type="number" data-lpv="1" class="grow" value="${(fair*1.15).toFixed(2)}" step="0.5" min="0.5"></div>
      <div class="row" style="margin-top:7px;gap:5px">
        <button class="btn grow" data-mm="0.85">-15%</button><button class="btn grow" data-mm="1">${t('Fair')}</button>
        <button class="btn grow" data-mm="1.5">+50%</button><button class="btn grow" data-mm="3">+200%</button></div>
      <div class="sep"></div>
      <div class="row" style="justify-content:flex-end;gap:6px"><button class="btn" data-lpc="1">${t('Cancel')}</button><button class="btn" data-lpo="1">${t('List')}</button></div>
    </div></div>`,'',m=>{
    const box=m.box;
    $$('[data-mm]',box).forEach(x=>x.onclick=()=>{SFX.click();$('[data-lpv]',box).value=(fair*+x.dataset.mm).toFixed(2);});
    $('[data-lpc]',box).onclick=()=>{SFX.close();m.close();};
    $('[data-lpo]',box).onclick=()=>{const v=parseFloat($('[data-lpv]',box).value);
      if(!(v>0)){SFX.error();return;}
      SFX.click();m.close();
      signingModal(t('Listing Kaiju #{0}',id),1,()=>{
        tk.listed=v;G.log.listed=(G.log.listed||0)+1;G.totals.listed=(G.totals.listed||0)+1;
        UI.toast('market',t('#{0} listed for {1}',id,money(v)));
        timeAct(listMinutes(1));UI.refresh();save();
      });};
  });
}

/* ---------- listar em lote, escolhendo quais ----------
   Tres perguntas: quais, quantos, e por quanto. Os mais comuns saem primeiro,
   que e o que o jogador quer 9 vezes em 10. */
let lsPick='common', lsN=0, lsMult=1;
function lsPool(kind){
  let p=sellableTokens();
  if(kind==='common')p=p.filter(x=>x.rarity<=0);
  else if(kind==='unc')p=p.filter(x=>x.rarity<=1);
  else if(kind==='rare')p=p.filter(x=>x.rarity<=2);
  else if(kind.indexOf('c:')===0)p=p.filter(x=>x.traits[RACE_LAYER]===kind.slice(2));
  /* mais comum primeiro: e o que se lista sem pensar */
  return p.sort((a,c)=>a.rarity-c.rarity||(a.seq||0)-(c.seq||0));
}
function listSomePrompt(b,ent){
  if(tiredGate())return;
  if(!sellableTokens().length){SFX.error();UI.toast('warn',t('Nothing available to list.'));return;}
  const MULTS=[[0.85,'-15%'],[1,t('Fair')],[1.5,'+50%'],[2.5,'+150%'],[4,'+300%']];
  const races=[...new Set(sellableTokens().map(x=>x.traits[RACE_LAYER]))].sort();
  UI.modal(`<div class="titlebar">${pixSVG('market',14,'tico')}<span class="ttl">${t('List a batch')}</span></div>
    <div class="wbody lsmodal" style="background:var(--face);width:min(calc(360px * var(--ui)),94vw)"><div class="pad">
      <div class="lsrow"><span class="ls-l">${t('Which')}</span>
        <select data-lsk="1" class="grow">
          <option value="common">${t('Commons only')}</option>
          <option value="unc">${t('Up to Uncommon')}</option>
          <option value="rare">${t('Up to Rare')}</option>
          <option value="all">${t('Everything available')}</option>
          ${races.map(r=>`<option value="c:${r}">${t('Race:')} ${r}</option>`).join('')}
        </select></div>
      <div class="lsrow"><span class="ls-l">${t('How many')}</span>
        <input type="range" data-lsn="1" min="1" max="2" value="1" class="grow">
        <b data-lsnv="1" class="mono">1</b></div>
      <div class="lsrow"><span class="ls-l">${t('Price')}</span>
        <div class="row grow" style="gap:4px;flex-wrap:wrap">
          ${MULTS.map(([v,l])=>`<button class="btn tight lsm" data-lsm="${v}">${l}</button>`).join('')}
        </div></div>
      <div class="sep"></div>
      <div class="bill lightbill" data-lsbill="1"></div>
      <div class="row" style="justify-content:flex-end;gap:6px;margin-top:9px">
        <button class="btn" data-lsc="1">${t('Cancel')}</button>
        <button class="btn big" data-lso="1">${t('LIST THEM')}</button>
      </div>
    </div></div>`,'',m=>{
    const box=m.box, sel=$('[data-lsk]',box), rng=$('[data-lsn]',box);
    lsPick='common';lsMult=1;
    const sync=()=>{
      const pool=lsPool(lsPick);
      rng.max=Math.max(1,pool.length);
      lsN=clamp(lsN||pool.length,1,Math.max(1,pool.length));
      rng.value=lsN;
      $('[data-lsnv]',box).textContent=lsN+' / '+pool.length;
      $$('.lsm',box).forEach(x=>x.classList.toggle('on',+x.dataset.lsm===lsMult));
      const take=pool.slice(0,lsN);
      const tot=take.reduce((a,tk)=>a+tokenValue(tk)*lsMult,0);
      const mins=listMinutes(take.length);
      /* O LOTE E UMA ASSINATURA SO — e essa e a vantagem real de listar em
         lote, entao ela fica escrita ao lado do proprio numero do gas, e nao
         num paragrafo que ninguem le. O gas sai agora; o dinheiro da venda
         entra depois, se entrar: por isso o total e liquido do gas. */
      const gas=listFee(take.length);
      $('[data-lsbill]',box).innerHTML=
        `<div class="bl-row"><span>${t('Listing')}</span><b>${num(take.length)} Kaiju</b></div>
         <div class="bl-row gas gm-${gasMood()}"><span>${t('Gas')} <i>${t('est. &middot; one signature')}</i></span><b>-${money(gas)}</b></div>
         <div class="bl-row"><span>${t('Time it costs')}</span><b>${mins} min</b></div>
         <div class="bl-row total"><span>${t('If all sell, you net')}</span><b>${money(tot-gas)}</b></div>`;
      $('[data-lso]',box).disabled=!take.length;
    };
    sel.onchange=()=>{lsPick=sel.value;lsN=0;SFX.click();sync();};
    rng.oninput=()=>{lsN=+rng.value;sync();};
    $$('.lsm',box).forEach(x=>x.onclick=()=>{lsMult=+x.dataset.lsm;SFX.click();sync();});
    $('[data-lsc]',box).onclick=()=>{SFX.close();m.close();};
    $('[data-lso]',box).onclick=()=>{
      const take=lsPool(lsPick).slice(0,lsN);
      if(!take.length){SFX.error();return;}
      SFX.click();m.close();
      signingModal(t('Listing {0} Kaiju',num(take.length)),take.length,()=>{
        take.forEach(tk=>{tk.listed=tokenValue(tk)*lsMult;});
        G.log.listed=(G.log.listed||0)+take.length;G.totals.listed=(G.totals.listed||0)+take.length;
        UI.toast('market',t('{0} Kaiju listed.',num(take.length)));
        timeAct(listMinutes(take.length));UI.refresh();save();
      });
    };
    sync();
  });
}
function listAllPrompt(b,ent){
  if(tiredGate())return;
  const pool=sellableTokens();
  if(!pool.length){SFX.error();UI.toast('warn',t('Nothing available to list.'));return;}
  UI.modal(`<div class="titlebar">${pixSVG('market',14,'tico')}<span class="ttl">${t('List all')}</span></div>
    <div class="wbody lsmodal" style="background:var(--face);width:min(calc(380px * var(--ui)),93vw)"><div class="pad">
      <div class="tiny dim" style="margin-bottom:9px">${t('Lists all {0} available Kaiju at once. Each price is set from that Kaiju&rsquo;s own fair value.',num(pool.length))}</div>
      <div class="row" style="gap:5px;flex-wrap:wrap">
        ${[[0.85,'-15%'],[1,t('Fair')],[1.5,'+50%'],[2.5,'+150%'],[4,'+300%']].map(([v,l])=>{
          const tot=pool.reduce((a,tk)=>a+tokenValue(tk)*v,0);
          return `<button class="btn grow" data-lam="${v}" style="flex:1 1 30%;min-width:0"><b>${l}</b><br><span class="tiny dim">${money(tot)}</span></button>`;}).join('')}
      </div>
      <!-- a vantagem de listar tudo de uma vez E ser uma assinatura so: ela
           fica escrita ao lado do proprio numero do gas, linha inteira, e o
           valor nao se separa do rotulo quando a linha quebra -->
      <div class="lagas gm-${gasMood()}" data-lagas="1">${t('One signature')} &middot; <span class="nobrk">${t('est. gas {0}',money(listFee(pool.length)))}</span></div>
      <div class="sep"></div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn" data-lac="1">${t('Cancel')}</button>
      </div>
    </div></div>`,'',m=>{
    const box=m.box;
    $('[data-lac]',box).onclick=()=>{SFX.close();m.close();};
    $$('[data-lam]',box).forEach(x=>{
      const mult=+x.dataset.lam;
      const tot=pool.reduce((a,tk)=>a+tokenValue(tk)*mult,0);
      x.onclick=()=>{
        SFX.click();m.close();
        signingModal(t('Listing {0} Kaiju',num(pool.length)),pool.length,()=>{
          pool.forEach(tk=>{tk.listed=tokenValue(tk)*mult;});
          G.log.listed=(G.log.listed||0)+pool.length;G.totals.listed=(G.totals.listed||0)+pool.length;
          UI.toast('market',t('{0} Kaiju listed.',num(pool.length)));
          timeAct(listMinutes(pool.length));UI.refresh();save();
        });
      };
    });
  });
}


/* ---------- faixa de identidade da carteira ----------
   Mesmo espirito do banner do Market, mas sem promocao nenhuma: aqui e so o
   inventario se apresentando. */
function walletBanner(){
  const n=held(),cap=capacity(),pct=cap?Math.round(n/cap*100):0;
  const val=G.tokens.reduce((a,x)=>a+tokenValue(x),0);
  const st=stakedTokens().length, ls=G.tokens.filter(x=>x.listed!=null).length;
  const races=new Set(G.tokens.map(raceOf)).size;
  return `<div class="wbanner">
    <div class="wb-left">
      <div class="wb-t">Kaiju <span>WALLET</span></div>
      <div class="wb-s">${t('{0} of {1} slots used · {2} races',num(n),num(cap),num(races))}</div>
    </div>
    <div class="wb-stats">
      <div><i>${t('VALUE')}</i><b>${money(val)}</b></div>
      <div><i>${t('LISTED')}</i><b>${num(ls)}</b></div>
      <div><i>${t('STAKED')}</i><b>${num(st)}</b></div>
    </div>
    <div class="wb-gauge"><i style="height:${pct}%"></i><span>${pct}%</span></div>
  </div>`;
}
