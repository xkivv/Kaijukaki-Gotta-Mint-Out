/* ================= APP: Mr. Kaiju (tax) ================= */
APPS.tax={
  title:'Mr. Kaiju — Collection', icon:'kaiju', w:430, h:600, danger:true, noMin:true,
  onClose(){ if(G.taxDue>0){UI.toast('warn',t('Mr. Kaiju is not leaving until he gets paid.'));return false;} return true; },
  build(b,ent){
    b.innerHTML=`<div class="paintbar">${['#141414','#ffffff','#b5342a','#6f9c3a','#2c2f33','#d8b64a','#9a6b34','#7fb8d8'].map(c=>`<i style="background:${c}"></i>`).join('')}</div>
      <div class="doodle-stage"><canvas data-doodle="1"></canvas><div class="speech" data-say="1"></div></div>
      <div class="txroot pad"></div>`;
    ent.win.classList.add('doodle-pop','enter');
    setTimeout(()=>ent.win.classList.remove('enter'),460);
    mountDoodle($('[data-doodle]',b),400,230);
    this.refresh(b,ent);SFX.tax();
    UI.think(pick(TH('tax')),true);},
  refresh(b,ent){
    const root=$('.txroot',b);if(!root)return;
    const say=$('[data-say]',b);
    if(say)say.textContent=G.taxDue>0?pick(TAX_LINES[LANG]||TAX_LINES.en):t('Nothing to pay right now.');
    if(G.taxDue<=0){
      root.innerHTML=`<div class="center" style="padding:12px 8px;line-height:1.7">
        <div class="tiny dim">${t('Mr. Kaiju comes back every 3 days. He always comes back.')}</div>
        <div class="tiny dim" style="margin-top:6px;line-height:1.6">${t('He is not a real Kaiju. He is not in the collection. He just found out that if you send an invoice with enough line items on it, most people pay.')}</div>
        <div class="sep"></div><button class="btn" data-txbye="1">${t('Close')}</button></div>`;
      $('[data-txbye]',root).onclick=()=>UI.closeApp('tax');
      return;
    }
    root.innerHTML=`<div class="tiny dim center" style="margin-bottom:6px">${t('— Mr. Kaiju, self-appointed tax collector of the underworld')}</div>
      <div class="tiny dim center" style="margin-bottom:7px;line-height:1.6;opacity:.85">
        ${t('Nobody knows which collection he is from. Nobody has ever seen the paperwork. He shows up, itemises things you never agreed to, and leaves.')}</div>
      <div class="fieldset"><span class="lg">${t('Day {0} collection',G.day)}</span>
        ${(Array.isArray(G.taxRows)&&G.taxRows.length?G.taxRows:[]).map(([k,v,n])=>{
          const L=TAX_LABEL[k]||{en:k,pt:k};
          const note={tx:t('{0} signatures',num(n)),power:t('{0} day(s)',n),comm:t('avg hype {0}%',n),
                      liq:t('{0} listings',num(n)),rent:t('{0} day(s)',n),inc:t('{0}% of profit',n)}[k]||'';
          return `<div class="dr-row"><span>${LANG==='pt'?L.pt:L.en} <i class="tiny dim">${note}</i></span><b class="neg">${money(v)}</b></div>`;
        }).join('')}
        <div class="dr-row"><span>${t('Your balance')}</span><b class="${G.money>=G.taxDue?'pos':'neg'}">${money(G.money)}</b></div>
        <div class="dr-row tot"><span>${t('OWED')}</span><b class="neg">${money(G.taxDue)}</b></div>
      </div>
      <div class="row txacts" style="gap:6px">
        <button class="btn big grow pay" data-txpay="1" ${G.money<G.taxDue?'disabled':''}>${t('PAY {0}',money(G.taxDue))}</button>
        <button class="btn big grow" data-txno="1">${t("I DON'T HAVE IT")}</button>
      </div>
      <div class="tiny dim" style="margin-top:7px">${t('Half of these fees are invented. The <i>community fee</i> goes to the community, he says. He is the community.')}</div>
      <div class="tiny dim" style="margin-top:5px">${t("If you don't pay, he takes Kaiju from your wallet and whatever is left comes out of your cash. He cannot touch what is locked in the vault or filed in your binder — but anything he cannot collect carries over with interest, and hype drops harder.")}</div>`;
    const owed=G.taxDue;
    const pb=$('[data-txpay]',root);
    pb.onclick=()=>{
      if(payTax()){SFX.cash();UI.floatFrom(pb,'-'+money(owed),'#d24b3a');
        UI.toast('kaiju',t('Tax paid. He is gone.'));UI.closeApp('tax');UI.refresh();save();nextDayThought();}
      else SFX.error();
    };
    $('[data-txno]',root).onclick=()=>{
      UI.dialog(t('Are you sure?'),t('He takes NFTs from your wallet (vault included) and whatever is left comes out of your cash. And hype drops 9 points.'),'warn',
        {buttons:[{t:t('Let him take it'),v:1},{t:t('Hold on'),v:0}],onDone(v){
          if(!v)return;
          const r=seizeForTax();SFX.tax();
          UI.dialog(t('Seized'),
            t('He took <b>{0}</b> Kaiju{1} and vanished into the sewer.',r.taken,r.cash>0.01?t(' and {0} from your cash',money(r.cash)):'')
            +(r.rolled>0.01?'<br><br>'+t('He could not touch what is locked in the vault or filed in your binder. <b>{0}</b> is still owed, and it carries over with interest.',money(r.rolled)):''),
            'kaiju',{onDone(){
            UI.closeApp('tax');checkLevel();UI.refresh();save();}});
        }});
    };
  }
};

const TAX_LINES={
 en:["You made a profit. I came for my share.",
     "Nice collection. Would be a shame if it was seized.",
     "I do not read whitepapers. I read balance sheets.",
     "Every founder says the same thing. Pay anyway.",
     "I counted. Do not make me count again."],
 pt:["Você lucrou. Eu vim buscar minha parte.",
     "Coleção bonita. Seria uma pena se fosse confiscada.",
     "Eu não leio whitepaper. Eu leio balanço.",
     "Todo fundador fala a mesma coisa. Paga assim mesmo.",
     "Eu contei. Não me faça contar de novo."]
};

/* ================= APP: readme.txt ================= */
const README={
en:()=>`==========================================
  KAIJUKAKI: GOTTA MINT OUT! - README
==========================================

YOU DID NOT DRAW THESE. YOU ARE EARLY.

8,888 hand-drawn monsters by Oekaki Connect.
Almost nobody has noticed yet. You have $40,
an old PC, and the feeling that this one is
actually different.

THE GOAL: BE HOLDING WHEN IT MINTS OUT.

------------------------------------------
HOW YOU MAKE MONEY
------------------------------------------
Every mint made by SOMEONE ELSE pays you a
cut. You mint to create hype; hype brings
people; people pay you.

Minting for yourself costs more than it
returns at first. That is normal. You are
buying attention, not profit.

------------------------------------------
THE THREE COSTS
------------------------------------------
MONEY  the mint price, and it climbs as the
       supply gets taken.
GAS    a share of the mint price. It moves
       all day, from cheap to brutal. Learn
       the curve. Mint in the calm hours.
       A free mint still pays gas.
TIME   signing a mint eats a real chunk of
       your day. Contract Speed cuts it.

------------------------------------------
A DAY
------------------------------------------
Hype leaks every hour. Post on Kaijupost to
buy it back - each post that day costs more
and gives less.

The day ends and you sleep. Every 3 days
MR. KAIJU comes for his tax.

------------------------------------------
RANKS
------------------------------------------
${LEVELS.map((l,i)=>` ${String(i+1).padStart(2)}. ${l.n.padEnd(11)} ${String(l.req).padStart(5)} NFTs`).join('\n')}

------------------------------------------
FIVE THINGS PEOPLE LEARN LATE
------------------------------------------
- The wallet holds 20. Expand it or you
  stop cold.
- Minting a lot in one day raises your own
  mint price. Spread it out.
- Staking pays while the clock runs.
- Buy KAIJU ANTIVIRUS. Without it they come
  at night and take things.
- Nobody official will ever ask for a seed
  phrase. Close it with the X.
- The KAIJU SPOTTER pays pocket change for
  six tags a day. The money is nothing. The
  eye you build is not.

(end of file)`,
pt:()=>`==========================================
  KAIJUKAKI: GOTTA MINT OUT! - LEIA-ME
==========================================

VOCE NAO DESENHOU NADA. VOCE CHEGOU CEDO.

8.888 monstros desenhados a mao pela Oekaki
Connect. Quase ninguem reparou ainda. Voce
tem $40, um PC velho, e a sensacao de que
esse aqui e diferente de verdade.

O OBJETIVO: ESTAR SEGURANDO NO MINTOUT.

------------------------------------------
COMO VOCE GANHA DINHEIRO
------------------------------------------
Todo mint feito por OUTRA PESSOA te paga uma
parte. Voce minta pra criar hype; o hype
traz gente; a gente te paga.

Mintar pra voce custa mais do que retorna no
comeco. Isso e normal. Voce esta comprando
atencao, nao lucro.

------------------------------------------
OS TRES CUSTOS
------------------------------------------
DINHEIRO  o preco do mint, e ele sobe
          conforme o supply vai saindo.
GAS       uma fatia do preco do mint. Muda o
          dia inteiro, do barato ao absurdo.
          Aprenda a curva. Minte nas horas
          calmas. Freemint tambem paga gas.
TEMPO     assinar um mint come um pedaco de
          verdade do seu dia. A Velocidade de
          Contrato reduz isso.

------------------------------------------
UM DIA
------------------------------------------
O hype vaza toda hora. Poste no Kaijupost pra
comprar ele de volta - cada post do dia custa
mais e rende menos.

O dia acaba e voce dorme. A cada 3 dias o
MR. KAIJU vem buscar o imposto dele.

------------------------------------------
RANKS
------------------------------------------
${LEVELS.map((l,i)=>` ${String(i+1).padStart(2)}. ${l.n.padEnd(11)} ${String(l.req).padStart(5)} NFTs`).join('\n')}

------------------------------------------
CINCO COISAS QUE TODO MUNDO APRENDE TARDE
------------------------------------------
- A carteira segura 20. Expanda ou voce
  trava de vez.
- Mintar muito num dia so aumenta o SEU
  proprio preco de mint. Espalhe.
- O staking paga enquanto o relogio anda.
- Compre o KAIJU ANTIVIRUS. Sem ele eles vem
  de noite e levam coisa.
- Ninguem oficial vai pedir sua seed phrase.
  Feche no X.
- O KAIJU SPOTTER paga trocado por seis tags
  por dia. O dinheiro nao e nada. O olho que
  voce ganha e.

(fim do arquivo)`
};
APPS.readme={
  title:'readme.txt - Notepad', icon:'notepad', w:520, h:480, sunken:true,
  menu:['File','Edit','Format ','Help'],
  build(b,ent){this.refresh(b,ent);},
  refresh(b){
    b.style.background='#fff';
    b.innerHTML=`<pre style="font-family:'Courier New',monospace;font-size:calc(15px * var(--fs));line-height:1.55;padding:10px;margin:0;white-space:pre-wrap">${(README[LANG]||README.en)()}</pre>`;
  }
};

/* ================= APP: Profile / Ranks ================= */
APPS.profile={
  title:'My Profile', icon:'chart', w:400, h:430, status:true,
  build(b,ent){b.innerHTML='<div class="proot pad"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.proot',b);if(!root)return;
    const n=held(),L=G.level,cur=LEVELS[L-1],nx=LEVELS[L];
    const p=nx?clamp((n-cur.req)/(nx.req-cur.req)*100,0,100):100;
    const races=RACES;
    root.innerHTML=`
      <div class="fieldset"><span class="lg">${t('Current rank')}</span>
        <div class="row" style="gap:11px">
          <canvas data-pfish="1"></canvas>
          <div style="flex:1">
            <div class="pixh" style="font-size:calc(12px * var(--fs))">${cur.n.toUpperCase()}</div>
            <div class="tiny dim" style="margin:3px 0 6px">${t('Level {0} of 10',L)} · ${perkOf(L-1)}</div>
            <div class="prog moss"><i style="width:0%"></i><b>${nx?num(n)+' / '+num(nx.req):t('MAX')}</b></div>
            ${nx?`<div class="tiny dim" style="margin-top:4px">${t('{0} more Kaiju to reach {1}.',num(Math.max(0,nx.req-n)),nx.n)}</div>`:''}
          </div>
        </div>
      </div>
      <div class="fieldset"><span class="lg">${t('Rank tree')}</span>
        <div class="tiny dim" style="margin-bottom:7px">${t('Every rank unlocks something on its own. Hold more Kaiju to climb.')}</div>
        ${rankTree()}
      </div>
      <div class="fieldset"><span class="lg">${t('Race collection')}</span>
        <div class="tiny dim" style="margin-bottom:5px">${t('Races found: {0}/{1}',G.seenRaces.length,races.length)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;max-height:96px;overflow:auto">
          ${races.map(r=>{const got=G.seenRaces.includes(r);
            return `<span class="tiny" title="${got?r:t('Not found yet')}" style="padding:2px 6px;border:1px solid ${got?'#2f6b3a':'#aaa'};background:${got?'#e2f2e6':'#e8e8e8'};color:${got?'#1e5a28':'#5c5c5c'}">${got?r:'???'}</span>`;}).join('')}
        </div>
      </div>
      <div class="fieldset"><span class="lg">${t('Standing')}</span>
        <div class="tiny dim" style="margin-bottom:6px">${t('How the market sees you. Listing with restraint and buying fairly build it; dumping burns it.')}</div>
        <div class="prog ${repScore()>=60?'moss':''}"><i style="width:0%" data-repbar="1"></i><b>${repTier()}</b></div>
        <div class="tiny dim" style="margin-top:5px">${
          repScore()>=78?t('Offers come in richer and your listings move faster.'):
          repScore()>=45?t('Nobody has an opinion about you yet.'):
          t('Lowballers smell blood. Offers are worse and sales are slower.')}</div>
      </div>
      <div class="fieldset"><span class="lg">${t('Achievements')}</span>
        <div class="achgrid">${ACHIEVEMENTS.map(a=>{
          const got=(G.achv||[]).includes(a.id);
          return `<div class="ach${got?' got':''}" title="${got?(LANG==='pt'?a.pt:a.en):t('Locked')}">
            ${pixSVG(a.ico,Math.round(20*uiScale()))}
            <span>${got?(LANG==='pt'?a.pt:a.en):'???'}</span></div>`;}).join('')}</div>
        <div class="tiny dim" style="margin-top:5px">${t('{0} of {1} unlocked',(G.achv||[]).length,ACHIEVEMENTS.length)}</div>
      </div>
      ${itemsBox()}
      <div class="fieldset"><span class="lg">${t('Lifetime numbers')}</span>
        <div class="dr-row"><span>${t('Time played')}</span><b>${typeof playtime==='function'?playtime(G.playMs||0):'—'}</b></div>
        <div class="dr-row"><span>${t('Kaiju in wallet')}</span><b>${num(n)}</b></div>
        <div class="dr-row"><span>${t('Total minted by you')}</span><b>${num(G.totals.mint)}</b></div>
        <div class="dr-row"><span>${t('Total sold')}</span><b>${num(G.totals.sold)}</b></div>
        <div class="dr-row"><span>${t('Bought on the Market')}</span><b>${num(G.totals.bought||0)}</b></div>
        <div class="dr-row"><span>${t('Listings made')}</span><b>${num(G.totals.listed||0)}</b></div>
        <div class="dr-row"><span>${t('Best single sale')}</span><b class="pos">${money(G.bestSale||0)}</b></div>
        ${has('ocstar')?`<div class="dr-row"><span>${t('OC Stars caught')}</span><b>${num(G.starsGot||0)}</b></div>`:''}
        <div class="dr-row"><span>${t('Mint royalties')}</span><b class="pos">${money(G.totals.royal||0)}</b></div>
        <div class="dr-row"><span>${t('Total revenue')}</span><b class="pos">${money(G.totals.earned)}</b></div>
        <div class="dr-row"><span>${t('Total spent')}</span><b class="neg">${money(G.totals.spent)}</b></div>
        <div class="dr-row"><span>${t('Tax paid')}</span><b class="neg">${money(G.totals.tax)}</b></div>
        <div class="dr-row tot"><span>${t('Net profit')}</span><b class="${G.totals.earned-G.totals.spent-G.totals.tax>=0?'pos':'neg'}">${money(G.totals.earned-G.totals.spent-G.totals.tax)}</b></div>
      </div>`;
    UI.setProg($('.prog i',root),p);
    UI.setProg($('[data-repbar]',root),repScore());
    drawFish($('[data-pfish]',root),L,72);
    wireRankTree(root);
    const s1=ent.win.querySelector('.st1');if(s1)s1.textContent=cur.n;
  }
};


/* ================= ARVORE DE RANKS =================
   Dez quadradinhos, um por nivel. O jogador ve de longe o que ja tem, o que
   esta perto e o que ainda esta trancado — sem precisar descobrir jogando. */
const RANK_UNLOCKS=[
  [],
  [['coin','Kaiju Shop upgrades unlock','Libera os upgrades da Kaiju Shop'],['wallet','Wallet Expansion I','Expansão de Carteira I']],
  [['market','+1 offer slot','+1 slot de offer']],
  [['market','+4 listings on the Kaiju Market','+4 listagens no Kaiju Market']],
  [['globe','Referral link (royalty 30% → 40%)','Link de referral (royalty 30% → 40%)'],['market','+1 offer slot','+1 slot de offer']],
  [['vault','Staking Vault','Staking Vault']],
  [['market','List All','List All'],['coin','Offers 8% better','Offers 8% melhores'],['market','+4 listings on the Market','+4 listagens no Market']],
  [['market','+1 offer slot','+1 slot de offer']],
  [['coin','Offers 15% better','Offers 15% melhores']],
  [['kaiju','You ARE the market','Você É o mercado']]
];
function rankUnlockText(u){return LANG==='pt'?u[2]:u[1];}
function rankTree(){
  const L=G.level,n=held();
  return `<div class="rtree">${LEVELS.map((l,i)=>{
    const lv=i+1;
    const state=lv<L?'got':lv===L?'now':(lv===L+1?'next':'lock');
    return `<button class="rnode ${state}" data-rank="${lv}" title="${l.n}">
      <span class="rn-n">${lv}</span>
      <canvas class="rn-f" data-rfish="${lv}"></canvas>
      <span class="rn-name">${l.n}</span>
      <span class="rn-req">${lv===1?'—':num(l.req)}</span>
    </button>`;}).join('')}</div>
    <div class="rdetail" data-rdetail="1"></div>`;
}
function rankDetail(lv){
  const l=LEVELS[lv-1],n=held(),got=G.bestLevel>=lv;
  const us=RANK_UNLOCKS[lv-1]||[];
  return `<div class="rd-head"><b>${lv}. ${l.n}</b>
      <span class="tiny ${got?'pos':'dim'}">${got?t('UNLOCKED'):t('needs {0} Kaiju',num(l.req))}</span></div>
    <div class="tiny dim" style="margin:3px 0 6px">${perkOf(lv-1)}</div>
    ${us.length?`<div class="rd-list">${us.map(u=>`<div class="rd-item ${got?'':'off'}">${pixSVG(u[0],14)}<span>${rankUnlockText(u)}</span></div>`).join('')}</div>`:''}
    ${!got&&l.req>n?`<div class="tiny" style="margin-top:6px;color:#a01515">${t('{0} more Kaiju to go.',num(l.req-n))}</div>`:''}`;
}
function wireRankTree(root){
  const d=$('[data-rdetail]',root);
  if(!d)return;
  $$('[data-rfish]',root).forEach(c=>drawFish(c,+c.dataset.rfish,26));
  const show=lv=>{
    d.innerHTML=rankDetail(lv);
    $$('.rnode',root).forEach(b=>b.classList.toggle('sel',+b.dataset.rank===lv));
  };
  $$('[data-rank]',root).forEach(b=>b.onclick=()=>{SFX.click();show(+b.dataset.rank);});
  show(Math.min(LEVELS.length,G.level));
}


/* ---------- itens estranhos que o jogador ganhou ---------- */
const ITEMS={
  kakicoin:{ico:'coin',
    n:{en:'Mystery KakiCoin',pt:'KakiCoin Misteriosa'},
    d:{en:'Warm to the touch. Mr. Kaiju\'s face on both sides. It is not for anything yet.',
       pt:'Morna. A cara do Mr. Kaiju dos dois lados. Ainda não serve pra nada.'}}
};
function itemsBox(){
  const it=G.items||{};
  const ks=Object.keys(ITEMS).filter(k=>it[k]>0);
  if(!ks.length)return '';
  return `<div class="fieldset"><span class="lg">${t('Items')}</span>
    ${ks.map(k=>{const I=ITEMS[k];
      return `<div class="itemrow">
        ${pixSVG(I.ico,28)}
        <div style="flex:1;min-width:0">
          <div><b>${I.n[LANG]||I.n.en}</b> ${it[k]>1?`<span class="mono">×${it[k]}</span>`:''}</div>
          <div class="tiny dim">${I.d[LANG]||I.d.en}</div>
        </div>
        <span class="itemlock">${t('LOCKED')}</span>
      </div>`;}).join('')}
  </div>`;
}


/* ================= APP: Sobre ================= */
APPS.about={
  title:'About Kaijukaki', icon:'kaiju', w:380, h:500, status:false, noMin:true,
  build(b,ent){
    b.innerHTML=`<div class="aboutroot">
      <div class="ab-hero">
        <canvas data-abcv="1"></canvas>
        <div class="ab-title">Kaijukaki</div>
        <div class="ab-sub">${t('Gotta Mint Out!')}</div>
      </div>
      <div class="ab-body">
        <div class="ab-call">
          <div class="ab-call-t">${t('Having fun?')}</div>
          <div class="ab-call-m">${t('Then go and mint your real Kaijukaki!!!')}</div>
          <button class="ab-go" data-abgo="1">${pixSVG('globe',14)} <span>scatter.art/c/kaijukaki-rh</span></button>
          <div class="ab-url" data-aburl="1">${REAL_URL}</div>
        </div>
        <div class="ab-sep"></div>
        <div class="ab-credits">
          <div class="ab-by">${t('Game made by')} <b>Kiv</b></div>
          <div class="ab-org">Oekaki Connect</div>
          <canvas class="ab-heart" data-abheart="1"></canvas>
        </div>
        <div class="ab-ver">v${GAME_VERSION} &middot; ${t('8888 hand-drawn Kaiju')}</div>
      </div>
    </div>`;
    drawKaiju($('[data-abcv]',b),{id:randomTokenId()},Math.round(96*((typeof uiScale==='function')?uiScale():1)));
    drawHeart($('[data-abheart]',b));
    const go=$('[data-abgo]',b);
    go.onclick=()=>{
      SFX.click();haptic(HAP.ok);
      UI.confetti(40,['#a8e832','#d4ff6b','#ffffff','#ff8aa0']);
      try{window.open(REAL_URL,'_blank','noopener');}
      catch(e){}
      UI.toast('globe',t('Opening scatter.art — mint one for real.'));
    };
    const u=$('[data-aburl]',b);
    if(u)u.onclick=()=>{
      try{if(navigator.clipboard)navigator.clipboard.writeText(REAL_URL);}catch(e){}
      SFX.coin();UI.toast('info',t('Link copied.'));
    };
  }
};
/* coracaozinho pixelado, batendo */
function drawHeart(cv){
  if(!cv)return;
  const S=11,px=Math.round(3*((typeof uiScale==='function')?uiScale():1));
  cv.width=S*px;cv.height=S*px;
  cv.style.width=(S*px)+'px';cv.style.height=(S*px)+'px';
  const g=cv.getContext('2d');
  const M=[
    '..XX...XX..',
    '.XooX.XooX.',
    'XooooXooooX',
    'XoooooooooX',
    'XoooooooooX',
    '.XooooooeX.',
    '..XooooeX..',
    '...XooeX...',
    '....XeX....',
    '.....X.....',
    '...........'];
  M.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='.')return;
    g.fillStyle=c==='X'?'#8a1020':c==='o'?'#e8384f':'#ff8aa0';
    g.fillRect(x*px,y*px,px,px);
  }));
}
