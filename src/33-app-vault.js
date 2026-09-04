/* ================= APP: Staking Vault ================= */
APPS.vault={
  title:'Staking Vault', icon:'vault', w:420, h:380, status:true,
  build(b,ent){b.innerHTML='<div class="vroot pad"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.vroot',b);if(!root)return;
    if(!vaultUnlocked()){
      root.innerHTML=`<div class="center" style="padding:26px 12px;line-height:1.8">
        ${pixSVG('vault',48)}
        <div style="margin-top:12px;font-size:calc(13px * var(--fs))"><b>&#128274; ${t('Vault sealed')}</b></div>
        <div class="tiny dim" style="margin-top:6px">${t('The vault opens at level {0} ({1}). Hold {2} Kaiju to get there.',VAULT_LEVEL,LEVELS[VAULT_LEVEL-1].n,num(LEVELS[VAULT_LEVEL-1].req))}</div>
        <div class="prog moss" style="margin:12px auto 0;max-width:240px"><i style="width:0%"></i><b>${num(held())} / ${num(LEVELS[VAULT_LEVEL-1].req)}</b></div>
      </div>`;
      UI.setProg($('.prog i',root),clamp(held()/LEVELS[VAULT_LEVEL-1].req*100,0,100));
      const s0=ent.win.querySelector('.st1');if(s0)s0.textContent=t('Locked');
      return;
    }
    /* o cofre existe mas ainda nao esta rodando: o jogador liga de propria
       vontade, sabendo que o que entrar fica 10 dias trancado */
    if(!G.stakeOn){
      root.innerHTML=`<div class="center" style="padding:22px 12px;line-height:1.8">
        ${pixSVG('vault',48)}
        <div style="margin-top:12px;font-size:calc(13px * var(--fs))"><b>${t('The vault is yours. It is not running yet.')}</b></div>
        <div class="tiny dim" style="margin-top:8px">${t('Turn it on and a locked Kaiju stays locked for <b>{0} days</b>. It cannot be sold, listed, filed in the binder, or receive offers in that time. It pays you every day, at the close.',STAKE_MIN_DAYS)}</div>
        <div class="tiny dim" style="margin-top:6px">${t('You start with {0} slots.',stakeSlots())}</div>
        <button class="btn big wide" data-vopen="1" style="margin-top:14px">${t('ACTIVATE STAKING')}</button>
      </div>`;
      $('[data-vopen]',root).onclick=()=>{
        SFX.levelup();UI.confetti(40,['#a8e832','#ffffff']);
        activateStaking();UI.toast('vault',t('Staking is live.'));UI.refresh();save();
      };
      const sv=ent.win.querySelector('.st1');if(sv)sv.textContent=t('Not running');
      return;
    }
    const st=stakedTokens();
    const perDay=stakeYieldDay();
    /* com slots limitados, encher com os mais COMUNS e o pior default possivel */
    const free=sellableTokens().sort((a,c)=>c.rarity-a.rarity||(a.seq||0)-(c.seq||0));
    const livres=stakeFree();
    const soltaveis=st.filter(x=>!stakeLocked(x)).length;
    const slotPct=clamp(st.length/stakeSlots()*100,0,100);
    root.innerHTML=`
      <div class="fieldset"><span class="lg">${t('Yield')}</span>
        <div class="row"><div class="grow">
          <div class="mono" style="font-size:calc(24px * var(--fs));color:#0a4d24">${money(perDay)}<span style="font-size:calc(12px * var(--fs))">${t('/day')}</span></div>
          <div class="tiny dim">${t('Paid at the close of every day.')}</div>
        </div>${pixSVG('vault',40)}</div>
        <div class="prog moss" style="margin-top:8px"><i style="width:0%"></i><b>${t('{0} of {1} slots used',num(st.length),num(stakeSlots()))}</b></div>
      </div>
      ${unlocked('f_stake')?`<div class="fieldset"><span class="lg">${t('Lock')}</span>
        <div class="tiny dim" style="margin-bottom:6px">${t('A locked Kaiju stays locked for {0} days and pays by rarity. It cannot be sold, listed or filed while it is in here.',STAKE_MIN_DAYS)}</div>
        <div class="row" style="gap:5px;flex-wrap:wrap">
          <button class="btn grow" data-sk="1" ${(!livres||!free.length)?'disabled':''}>${t('Lock the rarest')}</button>
          <button class="btn grow" data-sk="fill" ${(!livres||!free.length)?'disabled':''}>${t('Fill {0} free slot(s)',num(livres))}</button>
        </div>
        <div class="row" style="gap:5px;margin-top:5px">
          <button class="btn grow" data-vunall="1" ${soltaveis?'':'disabled'}>${soltaveis?t('Release the {0} that are free',num(soltaveis)):t('All {0} are still locked',num(st.length))}</button>
        </div>
        <div class="tiny dim" style="margin-top:6px">${t('Available to lock: {0} · the rarest go in first.',num(free.length))}</div>
      </div>`:''}
      ${stakeSlotItem()}
      ${has('vault')?`<div class="tiny pos">${t('★ Reinforced Vault active: +60% yield.')}</div>`:`<div class="tiny dim">${t('Buy the Reinforced Vault at the Kaiju Shop for +60%.')}</div>`}
      ${st.length?`<div class="sep"></div><div class="tiny dim" style="margin-bottom:5px">${t('Locked (showing up to 24):')}</div><div class="nftgrid" style="padding:0" data-vgrid="1"></div>`:''}`;
    UI.setProg($('.fieldset .prog i',root),slotPct);
    $$('[data-sk]',root).forEach(x=>x.onclick=()=>{
      SFX.click();
      const n=x.dataset.sk==='fill'?stakeFree():Math.min(+x.dataset.sk,stakeFree());
      const got=free.slice(0,n);
      if(!got.length)return SFX.error();
      let ok=0;got.forEach(tk=>{if(stakeToken(tk).ok)ok++;});
      if(!ok)return SFX.error();
      UI.toast('vault',t('{0} Kaiju locked for {1} days',ok,STAKE_MIN_DAYS));
      timeAct(ACT.list);UI.refresh();save();
    });
    const un=$('[data-vunall]',root);
    if(un)un.onclick=()=>{
      const soltos=stakedTokens().filter(x=>!stakeLocked(x));
      if(!soltos.length)return SFX.error();
      SFX.click();soltos.forEach(unstakeToken);
      UI.toast('vault',t('{0} Kaiju released.',num(soltos.length)));
      timeAct(ACT.list);UI.refresh();save();
    };
    const sb=$('[data-slotup]',root);
    if(sb)sb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeStakeSlots();
      if(r.err==='max')return SFX.error();
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next slot tier costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(26,['#a8e832','#ffffff']);
      UI.floatFrom(sb,'-'+money(r.cost),'#d24b3a');
      UI.toast('vault',t('The vault holds {0} Kaiju now.',r.slots));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const grid=$('[data-vgrid]',root);
    if(grid)st.slice(0,24).forEach(tk=>{
      const lock=stakeLocked(tk);
      const c=el('div','nftcard locked');
      c.dataset.tag=lock?t('{0}d',stakeDaysLeft(tk)):t('FREE');
      c.innerHTML=`<canvas></canvas><div class="nm">#${tk.id}</div>`;
      grid.appendChild(c);drawKaijuCached($('canvas',c),tk,80);
      c.onclick=()=>{SFX.click();tokenDetail(tk.id);};
    });
    const s1=ent.win.querySelector('.st1'),s2=ent.win.querySelector('.st2');
    if(s1){s1.textContent=money(perDay)+t('/day');s2.textContent=t('{0} / {1} slots',num(st.length),num(stakeSlots()));}
  }
};

/* ================= APP: Kaiju Shop =================
   A LOJA CHEGA AOS POUCOS. Despejar quinze upgrades em cima de quem acabou de
   ser hackeado e barulho; a loja obedece tres ids de destravamento que a
   historia (58-story.js) libera na ordem:
     shop_av   — so o Antivirus. E o que o jogador ve no dia 7, logo depois
                 do hack roteirizado (hackTutorial em 24-state.js).
     shop_more — + Espaco na Carteira e Velocidade de Contrato (dia 11).
     shop_4    — + lote, velocidade de listagem, otimizador de gas e um perk (dia 16).
     shop_all  — todo o resto do catalogo de perks (dia 20).
   O que esta trancado NAO aparece — nem cinza, nem com cadeado. Uma loja de
   um item so tem que parecer uma loja de um item so, nao uma loja quebrada.
   unlocked() devolve true pra id que ela nao conhece, entao enquanto a
   historia nao registrar esses ids a loja continua completa. */
/* 1 = so antivirus, 2 = + carteira e contrato, 3 = tudo. O antivirus e o
   chao da loja: shop_av so existe pra historia ter um nome pro momento, uma
   loja aberta nunca mostra menos do que ele. */
/* QUATRO PRATELEIRAS, nao tres. O dono espalhou a loja pelo calendario:
   dia 7 so o antivirus, dia 11 espaco e contrato, dia 16 mais quatro coisas,
   dia 20 o estoque inteiro. Uma prateleira que enche devagar e uma loja viva;
   uma que abre tudo de uma vez e um menu. */
function shopTier(){
  return unlocked('shop_all')?4:unlocked('shop_4')?3:unlocked('shop_more')?2:1;
}
/* os quatro que entram no dia 16 sao: lote, velocidade de listagem, otimizador
   de gas e UM perk barato — o resto do catalogo so no dia 20. */
const SHOP_T3_PERKS=['prio'];
APPS.shop={
  title:'Kaiju Shop', icon:'market', w:520, status:true,
  /* a altura da janela acompanha o estoque: com um item so, uma janela de
     470px seria um card em cima de um deserto cinza. A getter e lida no
     openApp; quem redimensionou na mao continua mandando (winRemember). */
  get h(){const k=shopTier();return k>=4?470:k===3?520:k===2?560:240;},
  build(b,ent){b.innerHTML='<div class="sroot pad"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.sroot',b);if(!root)return;
    const sec=securityActive();
    const tier=shopTier();
    root.innerHTML=`<div class="shop-item sec-item ${sec?'owned':''}">
    <div class="si-bg"></div>
        ${pixSVG(sec?'vault':'xerr',32,'si-ico')}
        <div style="flex:1;min-width:0">
          <h4>${t('Kaiju Antivirus')} ${sec?`<span class="pos">${t('— ACTIVE until day {0}',G.secUntil)}</span>`:`<span class="neg">${t('— NOT INSTALLED')}</span>`}</h4>
          <p>${t('Keeps hackers out of your machine for 7 days. Without it they come at night and take money or Kaiju.')}</p>
          <div class="row">
            <span class="mono" style="font-size:calc(15px * var(--fs));color:${G.money>=securityCost()?'#0a4d24':'#a01515'}">${money(securityCost())}</span>
            <span class="grow tiny dim">${t('7 days of protection')}</span>
            <button class="btn" data-buysec="1" ${G.money<securityCost()?'disabled':''}>${sec?t('Renew'):t('Install')}</button>
          </div>
        </div></div>`
    +(tier>=2?capItem()+contractItem():'')
    +(tier>=3?bulkItem()+listItem()+gasItem():'')
    /* enquanto falta estoque, uma linha diz que a prateleira cresce — senao
       uma loja de um item parece bug, nao roteiro */
    +(tier<4?`<div class="shop-soon tiny dim">${t('The shelves fill up as the days go by.')}</div>`:'')
    +(tier<3?[]:tier===3?UPGRADES.filter(u=>SHOP_T3_PERKS.indexOf(u.id)>=0):UPGRADES).map(u=>{
      const owned=has(u.id),lock=G.bestLevel<u.lvl,afford=G.money>=u.cost;
      return `<div class="shop-item perk-${u.id} ${owned?'owned':''}${lock?' locked':''}">
        <div class="si-bg"></div>
        ${pixSVG(u.ico,32,'si-ico')}
        <div style="flex:1;min-width:0">
          <h4>${upName(u)} ${owned?`<span class="pos">${t('— OWNED')}</span>`:''}</h4>
          <p>${upDesc(u)}</p>
          <div class="row">
            <span class="mono" style="font-size:calc(15px * var(--fs));color:${afford?'#0a4d24':'#a01515'}">${money(u.cost)}</span>
            <span class="grow tiny dim">${lock?t('Requires level {0} ({1})',u.lvl,LEVELS[u.lvl-1].n):''}</span>
            ${owned?'':`<button class="btn" data-buy="${u.id}" ${lock||!afford?'disabled':''}>${t('Buy')}</button>`}
          </div>
        </div></div>`;
    }).join('');
    const bb=$('[data-bulkup]',root);
    if(bb)bb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeBulk();
      if(r.err==='max')return SFX.error();
      if(r.err==='level'){SFX.error();UI.dialog(t('Locked'),t('This one needs level <b>{0}</b> ({1}).',r.need,LEVELS[r.need-1].n),'warn');return;}
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next batch upgrade costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(26,['#d4ff6b','#ffffff']);
      UI.floatFrom(bb,'-'+money(r.cost),'#d24b3a');
      UI.toast('rocket',t('You can mint x{0} in one go now.',r.qty));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const capb=$('[data-capup]',root);
    if(capb)capb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeCap();
      if(r.err==='max')return SFX.error();
      if(r.err==='level'){SFX.error();UI.dialog(t('Locked'),t('This one needs level <b>{0}</b> ({1}).',r.need,LEVELS[r.need-1].n),'warn');return;}
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next expansion costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(26,['#a8e832','#ffffff']);
      UI.floatFrom(capb,'-'+money(r.cost),'#d24b3a');
      UI.toast('wallet',t('The wallet holds {0} Kaiju now.',num(r.cap)));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const lb=$('[data-listup]',root);
    if(lb)lb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeList();
      if(r.err==='max')return SFX.error();
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next level costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.floatFrom(lb,'-'+money(r.cost),'#d24b3a');
      UI.toast('market',t('Listing now takes {0} min.',listMinutes(1)));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const gb=$('[data-gasup]',root);
    if(gb)gb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeGas();
      if(r.err==='max')return SFX.error();
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next gas upgrade costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(26,['#a8e832','#ffffff']);
      UI.floatFrom(gb,'-'+money(r.cost),'#d24b3a');
      UI.toast('chart',t('Gas Optimizer {0}/{1} — you now pay {2}% less gas.',r.lv,GAS_MAX_LV,Math.round((1-gasPerkMult())*100)));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const cb=$('[data-contract]',root);
    if(cb)cb.onclick=()=>{
      if(tiredGate())return;
      const r=upgradeContract();
      if(r.err==='max')return SFX.error();
      if(r.err==='money'){SFX.error();UI.dialog(t('Not enough money'),t('The next contract upgrade costs <b>{0}</b> and you have <b>{1}</b>.',money(r.need),money(G.money)),'warn');return;}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(26,['#7fe3ff','#ffffff']);
      UI.floatFrom(cb,'-'+money(r.cost),'#d24b3a');
      UI.toast('rocket',t('Contract Speed {0}/{1} — a mint now takes {2} min.',r.lv,CONTRACT_MAX,mintMinutes(1)));
      timeAct(ACT.shop);UI.refresh();save();
    };
    const sb=$('[data-buysec]',root);
    if(sb)sb.onclick=()=>{
      if(tiredGate())return;
      const c=securityCost();
      if(G.money<c)return SFX.error();
      spend(c);G.secUntil=Math.max(G.secUntil,G.day)+7;
      SFX.coin();UI.floatFrom(sb,'-'+money(c),'#d24b3a');
      UI.toast('vault',t('Antivirus active until day {0}.',G.secUntil));
      timeAct(ACT.shop);UI.refresh();save();
    };
    $$('[data-buy]',root).forEach(x=>x.onclick=()=>{
      if(tiredGate())return;
      const u=UPGRADES.find(y=>y.id===x.dataset.buy);
      if(!u||G.money<u.cost)return SFX.error();
      spend(u.cost);G.up[u.id]=1;
      if(u.id==='infl'){addHype(22);UI.hypePop('+HYPE');UI.toast('info',t('+22 hype right now.'));}
      SFX.coin();UI.confetti(24,['#e8c060','#ffffff']);
      UI.floatFrom(x,'-'+money(u.cost),'#d24b3a');
      UI.toast('coin',t('{0} bought',upName(u)));
      timeAct(ACT.shop);UI.refresh();save();
    });
    const s1=ent.win.querySelector('.st1'),s2=ent.win.querySelector('.st2');
    /* o contador "0/14" so faz sentido quando os 14 estao na prateleira */
    if(s1){s1.textContent=t('Balance: {0}',money(G.money));s2.textContent=tier>=3?Object.keys(G.up).length+'/'+UPGRADES.length:'';}
  }
};

/* ================= APP: Freemint Zone ================= */
/* ================= CODIGOS =================
   Alguns dao desconto, outros mexem no sistema. Cada um so funciona uma vez. */
const COUPONS={'KAIJU99':25,'SRKAIJU':40,'MINTOUT':15};
const CODES={
 'IGIVEMYSOULTOKAIJUKAKI':{ico:'kaiju',
   n:{en:'Soul signed away',pt:'Alma assinada'},
   m:{en:'Mr. Kaiju filed the paperwork. <b>30% off every fee, forever.</b> He did not say which fees.',
      pt:'O Mr. Kaiju arquivou o contrato. <b>30% de desconto em toda taxa, pra sempre.</b> Ele não disse quais taxas.'},
   fn(){G.feeCut=Math.max(G.feeCut||0,0.30);}},
 'INACANIHAVE5':{ico:'coin',
   n:{en:'Five dollars',pt:'Cinco pratas'},
   m:{en:'Ina is giving you <b>$5 daily</b>. Its real believe it. It\'s deposited when the day opens.',
      pt:'A Ina está te dando <b>$5 por dia</b>. É real, pode acreditar. Cai quando o dia abre.'},
   fn(){G.stipend=5;earn(5);}},
 'HAMMEREMOJI':{ico:'warn',
   n:{en:'Hammer time',pt:'Hora do martelo'},
   m:{en:'Your cursor is a hammer now. There is no way to turn it off. Enjoy.',
      pt:'Seu cursor virou um martelo. Não tem como desligar. Aproveite.'},
   fn(){G.hammer=1;applyHammer();}},
 'TEAMBOAT':{ico:'music',
   n:{en:'New track unlocked',pt:'Faixa nova liberada'},
   m:{en:'<b>Island Drift</b> is now in the Kaiju Media Player — an original 8-bit tune in that same beach-radio mood. Do not ask where it came from.',
      pt:'<b>Island Drift</b> entrou no Kaiju Media Player — uma faixa 8 bits original no mesmo clima de rádio de praia. Não pergunte de onde veio.'},
   fn(){G.tracks=Array.isArray(G.tracks)?G.tracks:[];if(!G.tracks.includes('kokomo'))G.tracks.push('kokomo');}},
 'KAKICOIN':{ico:'coin',
   n:{en:'Mystery KakiCoin',pt:'KakiCoin Misteriosa'},
   m:{en:'A single coin, warm to the touch, with Mr. Kaiju\'s face on both sides. <b>It cannot be used yet.</b> He says you will know when.',
      pt:'Uma moeda só, morna, com a cara do Mr. Kaiju dos dois lados. <b>Ainda não dá pra usar.</b> Ele diz que você vai saber quando.'},
   fn(){G.items=G.items||{};G.items.kakicoin=(G.items.kakicoin||0)+1;}},
 'FJESSPOLLA':{ico:'xerr',repeat:true,
   n:{en:'F JESS POLLA',pt:'F JESS POLLA'},
   m:{en:'The feeling has been broadcast.',pt:'O sentimento foi transmitido.'},
   fn(){jessPolla();}},
 'ILOVEOC':{ico:'gift',
   n:{en:'Ten freemints',pt:'Dez freemints'},
   m:{en:'<b>+10 freemints.</b> Somebody in the Kakizone likes you.',
      pt:'<b>+10 freemints.</b> Alguém da Kakizone gosta de você.'},
   fn(){G.freeMints+=10;}},
 'BOMDIA':{ico:'coin',
   n:{en:'Bom dia',pt:'Bom dia'},
   m:{en:'<b>+$100.</b> And from now on, every morning, the sun says hello.',
      pt:'<b>+$100.</b> E de agora em diante, toda manhã, o sol te dá bom dia.'},
   fn(){earn(100);G.bomdia=1;setTimeout(bomDia,900);}}
};
function codeName(c){const e=CODES[c];return e?(e.n[LANG]||e.n.en):'';}
function codeMsg(c){const e=CODES[c];return e?(e.m[LANG]||e.m.en):'';}
APPS.free={
  title:'Kakizone — Freemints', icon:'gift', w:440, h:480, status:true,
  build(b,ent){b.innerHTML='<div class="froot pad"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.froot',b);if(!root)return;
    const claimed=G.claimDay===G.day;
    root.innerHTML=`
      ${kakiBanner(claimed)}
      <button class="kz-claim${claimed?' done':''}" data-fclaim="1" ${claimed?'disabled':''}>
        <span class="kzc-t">${claimed?t('ALREADY CLAIMED TODAY'):t("CLAIM TODAY'S FREEMINT")}</span>
        <span class="kzc-s">${claimed?t('Come back tomorrow.'):t('Mr. Kaiju drops one a day. Grab it before you sleep.')}</span>
      </button>

      <div class="kzcard">
        <div class="kzc-h">${pixSVG('coin',Math.round(16*uiScale()))} ${t('Discount code')}</div>
        <div class="kzcode">
          <input type="text" data-fcode="1" placeholder="${t('ENTER CODE')}" spellcheck="false" autocomplete="off">
          <button class="btn" data-fgo="1">${t('Apply')}</button>
        </div>
        <div class="tiny dim" style="margin-top:calc(6px * var(--ui))">${t('Codes float around Discord and Twitter replies. Some are discounts. Some are not.')}</div>
        ${G.coupon?`<div class="kzactive">${t('Active coupon')} <b>-${G.coupon}%</b></div>`:''}
        ${G.usedCodes.length?`<div class="kzused">${G.usedCodes.map(c=>`<span>${c}</span>`).join('')}</div>`:''}
      </div>


      ${(()=>{if(typeof rollQuests!=='function')return '';
        /* MODO HISTORIA: as tarefas do dia chegam com o beat b_quests. Elas
           continuam sendo sorteadas pelo virar do dia (24-state.js), entao
           nada se perde enquanto o bloco esta escondido. */
        if(!unlocked('f_quests'))return '';
        rollQuests();questSync();
        const q=qs();
        const bloco=(arr,kind,titulo)=>`<div class="kzcard">
          <div class="kzc-h">${pixSVG(kind==='w'?'gift':'chart',Math.round(16*uiScale()))} ${titulo}</div>
          ${arr.map((it,i)=>{
            const def=QUEST_POOL.find(d=>d.id===it.id)||{en:it.id,pt:it.id};
            const pct=clamp(it.got/Math.max(1,it.need)*100,0,100);
            const val=def.money?money:num;
            return `<div class="kzgoal${it.paid?' got':it.done?' ready':''}">
              <div class="kzg-top">
                <span class="kzg-n">${it.done?'&#10004;':'&#9675;'} ${questText(def,it.need)}</span>
                <span class="grow"></span>
                ${it.paid
                  ? `<span class="kzg-done">${t('claimed')}</span>`
                  : `<span class="kzg-r">+${money(questReward(it,kind==='w'))}</span>
                     ${it.done?`<button class="btn tight kzg-b" data-q="${kind}:${i}">${t('Claim')}</button>`:''}`}
              </div>
              <div class="kzg-bar"><i style="width:${pct}%"></i><b>${val(Math.min(it.got,it.need))} / ${val(it.need)}</b></div>
            </div>`;}).join('')}
        </div>`;
        return bloco(q.d,'d',t('Today'))+bloco(q.w,'w',t('This week'));
      })()}
      ${unlocked('f_milestones')?`<div class="kzcard">
        <div class="kzc-h">${pixSVG('chart',Math.round(16*uiScale()))} ${t('Milestones')}</div>
        <div class="kzc-note">${t('These count the most Kaiju you have ever held at once — selling never takes a milestone away. One-time reward, claim it whenever.')}</div>
        ${[[10,2],[100,5],[1000,20]].map(([r,add])=>{
          /* Antes isto lia held(), o numero de Kaiju na carteira AGORA: vender
             fazia a barra andar pra tras e ninguem entendia a regra. Marco e
             marco: vale o maior numero que o jogador ja segurou de uma vez,
             que e o mesmo numero que manda no rank. */
          const mais=Math.max(held(),+G.peakHeld||0);
          const done=mais>=r,got=G.goals.includes(r);
          const pct=clamp(mais/r*100,0,100);
          return `<div class="kzgoal${got?' got':done?' ready':''}">
            <div class="kzg-top">
              <span class="kzg-n">${done?'&#10004;':'&#9675;'} ${t('{0} NFTs',num(r))}</span>
              <span class="grow"></span>
              ${got
                ? `<span class="kzg-done">${t('claimed')}</span>`
                : `<span class="kzg-r">+${add} ${t('freemints')}</span>
                   ${done?`<button class="btn tight kzg-b" data-goal="${r}">${t('Claim')}</button>`:''}`}
            </div>
            <div class="kzg-bar"><i style="width:${pct}%"></i><b>${num(Math.min(mais,r))} / ${num(r)}</b></div>
          </div>`;
        }).join('')}
      </div>`:''}`;
    $$('[data-q]',root).forEach(x=>x.onclick=()=>{
      const [kind,i]=x.dataset.q.split(':');
      const r=claimQuest(kind,+i);
      if(r.err)return SFX.error();
      SFX.coin();haptic(HAP.ok);
      UI.confetti(22,['#a8e832','#ffffff']);
      UI.floatFrom(x,'+'+money(r.value),'#0a6b2a');
      UI.toast('gift',t('Quest paid: {0}',money(r.value)));
      refreshDots();UI.refresh();save();
    });
    const cb=$('[data-fclaim]',root);
    cb.onclick=()=>{SFX.coin();G.freeMints++;G.claimDay=G.day;refreshDots();UI.confetti(20,['#8ef0b2','#fff']);
      UI.floatFrom(cb,'+1 FREEMINT','#0a6b2a');UI.toast('gift',t('+1 freemint'));UI.refresh();save();};
    const applyCode=()=>{
      const inp=$('[data-fcode]',root);
      const c=(inp.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
      const E=CODES[c];
      if(!COUPONS[c]&&!E){SFX.error();UI.dialog(t('Invalid code'),t('That code does not exist or expired.'),'warn');return;}
      const repeatable=E&&E.repeat;
      if(!repeatable&&G.usedCodes.includes(c)){SFX.error();UI.dialog(t('Already used'),t('You already used that code.'),'warn');return;}
      if(!G.usedCodes.includes(c))G.usedCodes.push(c);
      inp.value='';
      if(COUPONS[c]){
        G.coupon=COUPONS[c];SFX.coin();
        UI.toast('gift',t('Coupon applied: -{0}%',G.coupon));
        UI.refresh();save();return;
      }
      try{E.fn();}catch(e){}
      SFX.coin();haptic(HAP.ok);
      UI.confetti(30,['#a8e832','#d4ff6b','#ffffff']);
      UI.dialog(codeName(c),codeMsg(c),E.ico||'gift');
      UI.refresh();save();
    };
    $('[data-fgo]',root).onclick=applyCode;
    $('[data-fcode]',root).onkeydown=e=>{if(e.key==='Enter')applyCode();};
    $$('[data-goal]',root).forEach(x=>x.onclick=()=>{
      const r=+x.dataset.goal;if(G.goals.includes(r))return;
      G.goals.push(r);const add=r===10?2:r===100?5:20;G.freeMints+=add;
      SFX.coin();UI.confetti(30);UI.toast('gift',t('+{0} freemints',add));refreshDots();UI.refresh();save();
    });
    const s1=ent.win.querySelector('.st1');if(s1)s1.textContent=t('{0} freemint(s)',G.freeMints);
  }
};


/* ---------- Velocidade de Contrato: o unico upgrade que sobe de nivel ---------- */
function contractItem(){
  const lv=contractLevel(),maxed=lv>=CONTRACT_MAX;
  const cost=contractCost(lv),afford=G.money>=cost;
  const now=mintMinutes(1),bulk=mintMinutes(5);
  const nextMin=maxed?now:Math.max(1,Math.round(ACT.mint*contractMult(lv+1)));
  return `<div class="shop-item contract-item ${maxed?'owned':''}">
    <div class="si-bg"></div>
    ${pixSVG('rocket',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Contract Speed')} <span class="${maxed?'pos':'dim'}">${t('— level {0} of {1}',lv,CONTRACT_MAX)}</span></h4>
      <p>${t('Signing a mint takes time. Every level makes the transaction quicker. A bulk mint is one signature: it costs 1.5× a single mint, not 5×.')}</p>
      <div class="ctrack">${Array.from({length:CONTRACT_MAX},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <span class="tiny"><b>${t('Single mint')}</b> ${now} min</span>
        <span class="tiny"><b>${t('Bulk mint')}</b> ${bulk} min</span>
        ${maxed?'':`<span class="tiny pos">&rarr; ${nextMin} min</span>`}
      </div>
      <div class="row" style="margin-top:5px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':afford?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow"></span>
        ${maxed?`<span class="tiny pos">${t('Fully upgraded')}</span>`:`<button class="btn" data-contract="1" ${afford?'':'disabled'}>${t('Upgrade')}</button>`}
      </div>
    </div></div>`;
}


/* ---------- capacidade da carteira ---------- */
function capItem(){
  const lv=capLv(), maxed=capMaxed();
  const cost=capCost(), afford=G.money>=cost, need=capReqLevel();
  const lock=!maxed&&G.bestLevel<need;
  return `<div class="shop-item cap-item ${maxed?'owned':''}${lock?' locked':''}">
    <div class="si-bg"></div>
    ${pixSVG('wallet',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Wallet Space')} <span class="${maxed?'pos':'dim'}">${t('— holds {0}',num(capacity()))}</span></h4>
      <p>${t('The wallet is the real limit on how much you can hold. Every step costs more than the last.')}</p>
      <div class="ctrack">${CAP_STEPS.map((v,i)=>`<i class="${i<=lv?'on':''}" title="${v}"></i>`).join('')}</div>
      <div class="row" style="margin-top:5px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':afford&&!lock?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow tiny dim">${maxed?'':lock?t('Requires level {0}',need):t('&rarr; holds {0}',num(CAP_STEPS[lv+1]))}</span>
        ${maxed?'':`<button class="btn" data-capup="1" ${(afford&&!lock)?'':'disabled'}>${t('Expand')}</button>`}
      </div>
    </div></div>`;
}

/* ---------- slots do cofre ---------- */
function stakeSlotItem(){
  const lv=stakeSlotLv(), maxed=stakeSlotMaxed();
  const cost=stakeSlotCost(), afford=G.money>=cost;
  return `<div class="shop-item slot-item ${maxed?'owned':''}">
    <div class="si-bg"></div>
    ${pixSVG('vault',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Vault Slots')} <span class="${maxed?'pos':'dim'}">${t('— {0} slots',stakeSlots())}</span></h4>
      <p>${t('The vault only holds so many at a time. More slots, more daily yield.')}</p>
      <div class="ctrack">${STAKE_SLOT_TIERS.map((v,i)=>`<i class="${i<=lv?'on':''}" title="${v}"></i>`).join('')}</div>
      <div class="row" style="margin-top:5px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':afford?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow tiny dim">${maxed?'':t('&rarr; {0} slots',STAKE_SLOT_TIERS[lv+1])}</span>
        ${maxed?'':`<button class="btn" data-slotup="1" ${afford?'':'disabled'}>${t('Expand')}</button>`}
      </div>
    </div></div>`;
}

/* ---------- Listing Bot: velocidade de listar ---------- */
function listItem(){
  const lv=listLevel(),maxed=lv>=LIST_MAX;
  const cost=listCost(lv),afford=G.money>=cost;
  const one=listMinutes(1),many=listMinutes(20);
  const nextMin=maxed?one:Math.max(1,Math.round(ACT.list*listMult(lv+1)));
  return `<div class="shop-item list-item ${maxed?'owned':''}">
    <div class="si-bg"></div>
    ${pixSVG('market',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Listing Bot')} <span class="${maxed?'pos':'dim'}">${t('— level {0} of {1}',lv,LIST_MAX)}</span></h4>
      <p>${t('Putting a Kaiju up for sale costs time too. Every level signs faster. Listing many at once is one signature, not one per Kaiju.')}</p>
      <div class="ctrack">${Array.from({length:LIST_MAX},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <span class="tiny"><b>${t('One listing')}</b> ${one} min</span>
        <span class="tiny"><b>${t('Bulk listing')}</b> ${many} min</span>
        ${maxed?'':`<span class="tiny pos">&rarr; ${nextMin} min</span>`}
      </div>
      <div class="row" style="margin-top:5px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':afford?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow"></span>
        ${maxed?`<span class="tiny pos">${t('Fully upgraded')}</span>`:`<button class="btn" data-listup="1" ${afford?'':'disabled'}>${t('Upgrade')}</button>`}
      </div>
    </div></div>`;
}

/* ---------- Gas Optimizer: o teto do gas ---------- */
function gasItem(){
  const lv=gasLevel(),maxed=lv>=GAS_MAX_LV;
  const cost=gasPerkCost(lv),afford=G.money>=cost;
  const cut=Math.round((1-gasPerkMult())*100);
  const nextCut=maxed?cut:Math.round((1-gasPerkMult(lv+1))*100);
  const now=gasPct(),mood=gasMood();
  return `<div class="shop-item gas-item ${maxed?'owned':''}">
    <div class="si-bg"></div>
    ${pixSVG('chart',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Gas Optimizer')} <span class="${maxed?'pos':'dim'}">${t('— level {0} of {1}',lv,GAS_MAX_LV)}</span></h4>
      <p>${t('Gas is charged as a share of the mint price and it moves all day. Calm hours sit between 20% and 60%. During a spike it goes past 200% and can hit 500% — the signature costs five times the Kaiju. Every level shaves the whole curve down.')}</p>
      <div class="ctrack">${Array.from({length:GAS_MAX_LV},(_,i)=>`<i class="${i<lv?'on gasfill':''}"></i>`).join('')}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <span class="tiny"><b>${t('You pay')}</b> -${cut}%</span>
        <span class="tiny gm-${mood}"><b>${t('Right now')}</b> ${Math.round(now*100)}% ${t('of mint')} · ${money(gasFee())}</span>
        ${maxed?'':`<span class="tiny pos">&rarr; -${nextCut}%</span>`}
      </div>
      <div class="row" style="margin-top:5px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':afford?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow"></span>
        ${maxed?`<span class="tiny pos">${t('Fully upgraded')}</span>`:`<button class="btn" data-gasup="1" ${afford?'':'disabled'}>${t('Upgrade')}</button>`}
      </div>
    </div></div>`;
}


/* ---------- Mint em lote: um passo de cada vez ---------- */
function bulkItem(){
  const lv=bulkLevel(),maxed=lv>=BULK_MAX-1;
  const cost=bulkCost(lv),afford=G.money>=cost;
  const req=bulkReqLevel(lv),lock=G.bestLevel<req;
  return `<div class="shop-item bulk-item ${maxed?'owned':''}">
    <div class="si-bg"></div>
    ${pixSVG('rocket',32,'si-ico')}
    <div style="flex:1;min-width:0">
      <h4>${t('Batch Minting')} <span class="${maxed?'pos':'dim'}">${t('— up to x{0}',maxBulk())}</span></h4>
      <p>${t('How many Kaiju you can sign for in a single transaction. One step at a time, all the way to x10. A batch costs 1.5&times; the time of a single mint no matter the size.')}</p>
      <div class="btrack">${Array.from({length:BULK_MAX-1},(_,i)=>
        `<i class="${i<lv?'on':''}">${'x'+(i+2)}</i>`).join('')}</div>
      <div class="row" style="margin-top:6px">
        <span class="mono" style="font-size:calc(15px * var(--fs));color:${maxed?'#5a5a5a':lock?'#5a5a5a':afford?'#0a4d24':'#a01515'}">${maxed?t('MAX'):money(cost)}</span>
        <span class="grow tiny dim">${maxed?'':lock?t('Requires level {0} ({1})',req,LEVELS[req-1].n):t('Unlocks x{0}',maxBulk()+1)}</span>
        ${maxed?`<span class="tiny pos">${t('Fully upgraded')}</span>`
          :`<button class="btn" data-bulkup="1" ${(afford&&!lock)?'':'disabled'}>${t('Upgrade')}</button>`}
      </div>
    </div></div>`;
}


/* ---------- banner da Kakizone ---------- */
const KZ_PITCH=[
 {en:'FREE MINTS FOR THE FAITHFUL · ONE A DAY · NO CATCH*',pt:'FREEMINTS PARA OS FIÉIS · UM POR DIA · SEM PEGADINHA*'},
 {en:'* the catch is the gas. there is always gas.',pt:'* a pegadinha é o gas. sempre tem gas.'},
 {en:'MR. KAIJU IS FEELING GENEROUS TODAY (allegedly)',pt:'O MR. KAIJU ESTÁ GENEROSO HOJE (supostamente)'},
 {en:'CODES DROP IN THE DISCORD · TYPE THEM BELOW',pt:'OS CÓDIGOS CAEM NO DISCORD · DIGITE AQUI EMBAIXO'}
];
function kakiBanner(claimed){
  const p=KZ_PITCH[(G.day||1)%KZ_PITCH.length];
  return `<div class="kzbanner">
    <div class="kz-gift">${pixSVG('gift',30)}</div>
    <div class="kz-mid">
      <div class="kz-t">KAKI<span>ZONE</span></div>
      <div class="kz-s">${p[LANG]||p.en}</div>
    </div>
    <div class="kz-count">
      <b>${G.freeMints}</b><i>${t(G.freeMints===1?'freemint':'freemints')}</i>
    </div>
    ${claimed?'':`<div class="kz-flag">${t('READY')}</div>`}
  </div>`;
}
