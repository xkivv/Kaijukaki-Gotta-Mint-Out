/* ================= TIME / FLOW ================= */
let dayLock=false;
function flushTick(){
  const k=TICK;
  TICK={roy:0,stake:0,sold:0,soldVal:0,offers:0,mintedNow:0,npc:0,mktNew:0,mktGone:0,big:0,bigOne:null,dm:0,dmWho:'',dirty:false};
  /* MODO HISTORIA: a aba Mensagens do Kaki+ chega no b_dm. Antes disso o
     aviso mandava o jogador procurar uma tela que ainda nao existe — a
     mensagem fica guardada e a bolinha do Kaki+ acende quando a aba chegar. */
  const verDM=(typeof unlocked!=='function')||(unlocked('hubsocial')&&unlocked('tab_dm'));
  if(k.dm&&verDM){SFX.notify();UI.toast('mail',k.dm>1?t('{0} new messages',k.dm):t('{0} sent you a message',k.dmWho));}
  const passive=k.roy+k.stake;
  if(passive>0.01){
    UI.floatTray('+'+money(passive),'#0a6b2a');
    if(passive>0.5)SFX.coin();
    if(k.roy>0.01&&k.stake>0.01)UI.toast('coin',t('Royalties {0} · Staking {1}',money(k.roy),money(k.stake)));
    else if(k.roy>0.01)UI.toast('coin',t('Mint royalties: {0}',money(k.roy)));
    else if(k.stake>0.01)UI.toast('vault',t('Staking paid {0}',money(k.stake)));
  }
  if(k.sold){
    /* a comemoracao grande substitui o toast; se nao puder tocar, o toast fica */
    if(k.big&&k.bigOne&&typeof bigSaleReady==='function'&&bigSaleReady()){
      bigSaleFX(k.bigOne);
    } else {
      SFX.cash(k.soldVal>200);haptic(HAP.cash);UI.floatTray('+'+money(k.soldVal),'#0a6b2a');
      if(k.big)UI.toast('coin',t('Sold {0}% above fair value!',Math.round((k.bigOne?k.bigOne.ratio:3-1)*100-100)));
    }
    UI.toast('market',t('{0} NFT(s) sold for {1}',k.sold,money(k.soldVal)));
    UI.think(pick(TH('sale')));
  }
  /* MODO HISTORIA: a aba de ofertas chega no b_market. Antes disso o aviso
     mandava procurar uma tela que ainda nao existe — o lance fica guardado e
     o jogador descobre quando o oni explicar as duas saidas de um Kaiju. */
  if(k.offers&&((typeof unlocked!=='function')||unlocked('tab_mkt_offers'))){
    SFX.notify();UI.toast('coin',k.offers>1?t('{0} new offers',k.offers):t('New offer received'));}
  /* Os mints dos outros NAO viram toast. "3 pessoas mintaram enquanto voce
     estava ocupado" e ruido: nao pede nada do jogador e o dinheiro que isso
     rende ja chega pelo aviso de royalty logo acima. O que fica e o "+N"
     subindo da barra de supply — so aparece com o site aberto, e e a propria
     barra contando. */
  if(k.npc>0){
    const bar=$('.supplybar');
    if(bar)UI.floatFrom(bar,'+'+k.npc,'#4d7a14');
  }
  if(k.dirty||k.sold||k.offers)UI.refresh();
}
function timeAct(mins){
  const ended=advance(mins);
  flushTick();
  UI.updateTray();
  if(typeof refreshWidgets==='function')refreshWidgets();
  if(!ended)warnDayEnding();
  if(ended&&!G.overWarned){G.overWarned=1;announceDayOver();}
  if(typeof storyTick==='function')storyTick();
  save();
}
/* O dia acabava sem aviso nenhum e isso incomodava. Tres marcos, cada um uma
   vez por dia. O relogio da bandeja tambem muda de cor a partir de 2h. */
function warnDayEnding(){
  const left=(dayEndHour()-G.hour)*60-G.min;
  G.warned=G.warned&&typeof G.warned==='object'?G.warned:{};
  const W=G.warned;
  if(left<=180&&left>60&&!W.h3){W.h3=1;UI.toast('info',t('Three hours left today.'));}
  else if(left<=60&&left>25&&!W.h1){
    W.h1=1;SFX.notify();
    UI.toast('warn',t('One hour left. Finish what matters.'));
    UI.think(pick([t('One hour. What still needs doing today?'),t('The day is nearly gone.')]),true);
  }
  else if(left<=25&&left>0&&!W.m20){
    W.m20=1;SFX.notify();
    UI.toast('warn',t('{0} minutes left today.',left));
  }
}
/* the day running out never takes the screen away — it just closes the shop */
function announceDayOver(){
  SFX.notify();
  UI.toast('coin',t('The day is over. Hit END DAY when you are ready.'));
  UI.think(pick(["That's it for today. My eyes are done.","Shops are closed. Time to sleep.","No more hours left in this day."].map(t)),true);
  document.body.classList.add('day-over');
  UI.updateTray();
}
/* Ordem: aviso -> END DAY -> relatorio -> SLEEP -> uma animacao so -> dia novo.
   Antes a tela desligava, mostrava o relatorio e desligava de novo. */
function sleepNow(){
  if(dayLock||reportBusy||reportPending||!G||!dayIsOver())return;   /* so encerra um dia por vez, e so quando ele acabou */
  dayLock=true;
  document.body.classList.remove('day-over');
  SFX.notify();
  showDayReport();
}
/* Um aviso de cada vez. Clicar cinco vezes numa acao nao pode enfileirar cinco
   caixas de "END DAY" — cada uma delas encerraria um dia quando fosse respondida. */
let tiredOpen=false;
function tiredGate(){
  if(!G||!dayIsOver())return false;
  if(dayLock)return true;               /* o dia ja esta encerrando */
  if(tiredOpen){SFX.error();return true;}
  tiredOpen=true;
  SFX.error();
  UI.dialog(t('Out of hours'),
    t('It is already {0}:{1} and there is nothing left of today.<br><br>Close the day to open day {2}.',pad2(G.hour%24),pad2(G.min),num(G.day+1)),'warn',
    {buttons:[{t:t('END DAY'),v:1},{t:t('Not yet'),v:0}],onDone(v){
      tiredOpen=false;
      if(v&&dayIsOver()&&!dayLock)sleepNow();
    }});
  return true;
}
/* the world keeps moving while the player reads, browses or just sits there */
function startClock(){
  setInterval(()=>{
    if(!G||dayLock||document.hidden)return;
    if($('#modalveil').classList.contains('on'))return;
    if($('#sysveil'))return;
    if(dayIsOver())return;
    timeAct(IDLE_TICK_MIN);
  },IDLE_TICK_MS);
}

/* ---------- shutdown / boot between days ---------- */
function sysScreen(html,cls){
  let v=$('#sysveil');
  if(!v){v=el('div');v.id='sysveil';$('#screen').appendChild(v);}
  v.className=cls||'';
  v.innerHTML=html;
  return v;
}
function killSys(){const v=$('#sysveil');if(v)v.remove();}
let outroBusy=false;
/* Uma transicao so, nao duas.
   O bug antigo: dayOutro fazia remove('crtoff') — a tela voltava ao tamanho
   cheio de estalo, aparecia a area de trabalho por um frame — e ai dayIntro
   recolapsava, porque a animacao 'pwr' comeca em scaleY(.004). Duas apagadas.
   Aqui a tela colapsa UMA vez, o conteudo troca no escuro, e ela volta. O
   remove('crtoff') e o add('poweron') acontecem no mesmo frame: crtoff termina
   em scaleY(.004) e pwr comeca em scaleY(.004), entao a emenda e invisivel. */
/* FURO: o pedido repetido (dois cliques no SLEEP) reagendava o 'then' pra 2s
   depois e o dia seguinte era montado DUAS vezes — dois cards de evento, dois
   openTaxman, dois save(). Uma transicao por vez quer dizer UMA continuacao. */
function dayTransition(then){
  if(outroBusy)return;
  outroBusy=true;
  const sc=$('#screen');
  const head=`<div class="syslogo">KAIJUKAKI OS</div>`;
  sysScreen(`<div class="sysbox">${head}
      <div class="systxt">${t('Closing the day...')}</div>
      <div class="sysbar"><i></i></div>
    </div>`,'on');
  SFX.close();
  if(typeof MUSIC!=='undefined'&&MUSIC.fadeOut)MUSIC.fadeOut(760);
  setTimeout(()=>{const bar=$('#sysveil .sysbar i');if(bar)bar.style.width='100%';},40);
  setTimeout(()=>{
    sc.classList.add('crtoff');
    SFX.tone&&SFX.tone(220,.2,'triangle',.12);
  },820);
  /* a tela esta colapsada aqui. Troca o texto as escuras, sem killSys. */
  setTimeout(()=>{
    const v=$('#sysveil');
    if(v)v.innerHTML=`<div class="sysbox">${head}
      <div class="systxt">${t('Booting day {0}...',G.day)}</div>
      <div class="sysbar"><i></i></div>
      <div class="sysnote">${securityActive()?t('Kaiju Antivirus: ACTIVE'):t('Kaiju Antivirus: NOT INSTALLED')}</div>
      <div class="sysev ev-${G.event||'calm'}">${evName(todayEvent())}</div>
    </div>`;
    setTimeout(()=>{const bar=$('#sysveil .sysbar i');if(bar)bar.style.width='100%';},30);
  },1340);
  setTimeout(()=>{
    killSys();
    sc.classList.remove('crtoff');
    sc.classList.add('poweron');
    SFX.boot();
    if(typeof MUSIC!=='undefined'&&MUSIC.fadeIn)MUSIC.fadeIn(1500);
    setTimeout(()=>sc.classList.remove('poweron'),460);
    outroBusy=false;
    /* se a montagem do dia seguinte estourar, a tela ja voltou e o jogo segue */
    if(then){try{then();}catch(e){console.error(e);}}
  },1980);
}
let reportBusy=false;      /* o relatorio do dia esta na tela */
let reportPending=false;   /* um laco de espera rodando — nunca dois */
let reportSince=0,reportClear=0,reportSawClear=false;
/* Existe UM relatorio por dia. Um pedido novo enquanto ele esta vivo (ou a
   caminho) nao faz nada: nao enfileira, nao abre outro, nao chama endDay() de
   novo — endDay() vira o dia e mexe no save, rodar duas vezes rouba um dia
   inteiro do jogador. */
function showDayReport(){
  if(reportBusy||reportPending)return;
  reportPending=true;
  reportSince=Date.now();
  reportClear=0;reportSawClear=false;
  waitDayReport();
}
/* endDay() muda o estado do jogo, entao o relatorio nao pode ir pra fila atras
   de outra janela: o dia viraria antes de o jogador ver o resultado.
   FURO ANTIGO: bastava a tela estar limpa pra ele nascer — mas o UI abre a
   proxima caixa da fila 170ms DEPOIS de fechar a anterior. Um "End the day?"
   que tinha ficado na fila (o jogador pediu por cima de outro pop-up) nascia
   atras do relatorio e sobrevivia a virada: no dia seguinte a caixa continuava
   la, e clicar nela encerrava o dia novo na hora. Agora a tela precisa ficar
   limpa por dois quadros seguidos — fila vazia de verdade — e o que a fila
   cuspir depois disso e sobra: fecha na hora. */
function waitDayReport(){
  if(!reportPending)return;
  const waited=Date.now()-reportSince;
  if(UI.modalOpen()){
    reportClear=0;
    /* nada pode prender o jogador num dia que ja acabou */
    if(waited>12000){reportPending=false;openDayReport();return;}
    /* sobra da fila (a tela ja tinha ficado limpa) ou pop-up esquecido: some */
    if(reportSawClear||waited>4000)UI.closeModal();
    setTimeout(waitDayReport,120);
    return;
  }
  reportSawClear=true;
  if(reportClear<2&&waited<12000){reportClear++;setTimeout(waitDayReport,120);return;}
  reportPending=false;
  openDayReport();
}
function openDayReport(){
  if(reportBusy)return;
  reportBusy=true;
  releaseHidden();
  const before=G.minted/SUPPLY*100;
  const l=endDay();
  SFX.notify();
  const rows=[
    [t('Mints made'),l.mint,num,''],
    [t('NFTs sold'),l.sold,num,''],
    [t('Mint royalties'),l.royal||0,money,'pos'],
    [t('Staking yield'),l.stake||0,money,'pos'],
    [t('Received today (total)'),l.earned,money,'pos'],
    [t('Spent today'),l.spent,money,'neg'],
    [t('Tax paid'),l.tax,money,'neg']
  ];
  const net=l.earned-l.spent-l.tax;
  const pct=G.minted/SUPPLY*100;
  UI.modal(`<div class="titlebar">${pixSVG('chart',14,'tico')}<span class="ttl">${t('Day {0} results',l.day)}</span></div>
    <div class="wbody" style="background:var(--face);width:min(calc(340px * var(--ui)),92vw)">
      <div class="pad">
        <div class="dr-hd">${t('— DAY {0} CLOSING —',l.day)}</div>
        ${rows.map((r,i)=>`<div class="dr-row" data-r="${i}" style="opacity:0"><span>${r[0]}</span><b class="${r[3]}">0</b></div>`).join('')}
        <div class="dr-row tot" data-r="tot" style="opacity:0"><span>${t('RESULT')}</span><b class="${net>=0?'pos':'neg'}">0</b></div>
        <div class="sep"></div>
        <div class="tiny dim">${t('Hype {0}% · Floor {1} · Supply {2}/{3}',G.hype.toFixed(1),money(floorPrice()),num(G.minted),num(SUPPLY))}</div>
        <div class="prog moss" style="margin-top:6px"><i style="width:0%"></i><b>${t('{0} minted',pct.toFixed(2)+'%')}</b></div>
      </div>
      <div class="row" style="justify-content:center;padding:0 10px 12px"><button class="btn big" data-drok="1">${t('SLEEP')}</button></div>
    </div>`,'dayrep',m=>{
      const box=m.box;
      rows.forEach((r,i)=>setTimeout(()=>{
        const row=box.querySelector(`[data-r="${i}"]`);if(!row)return;
        row.style.transition='opacity .18s';row.style.opacity='1';
        SFX.tick();UI.countUp(row.querySelector('b'),r[1],320,r[2]);
      },130+i*110));
      setTimeout(()=>{
        const row=box.querySelector('[data-r="tot"]');if(!row)return;
        row.style.transition='opacity .2s';row.style.opacity='1';
        UI.countUp(row.querySelector('b'),net,420,money);
        if(net>=0)SFX.cash();else{SFX.error();box.classList.add('shake');setTimeout(()=>box.classList.remove('shake'),340);}
      },130+rows.length*110+120);
      UI.setProg(box.querySelector('.prog i'),pct,before);
      let slept=false;
      box.querySelector('[data-drok]').onclick=()=>{
        if(slept)return;   /* dois cliques em SLEEP nao podem montar dois dias */
        slept=true;
        SFX.click();m.close();reportBusy=false;
        dayTransition(()=>{
          dayLock=false;tiredOpen=false;
          checkLevel();
          if(typeof checkAchievements==='function')checkAchievements();
          UI.refresh();save();
          if(typeof bomDiaTick==='function')bomDiaTick();
          if(G.stipend>0)setTimeout(()=>UI.toast('coin',t('Daily allowance: +{0}',money(G.stipend))),700);
          if(G.spamDay&&G.spamDay.n){
            const sd=G.spamDay;G.spamDay=null;
            setTimeout(()=>UI.toast('warn',t('You listed {0} yesterday. The floor noticed: -{1} hype.',sd.n,sd.hit)),1200);
          }
          const hacked=hackReport();
          setTimeout(showEventCard,hacked?1500:260);
          if(G.taxDue>0)setTimeout(openTaxman,hacked?2600:1800);
          else if(!hacked)setTimeout(nextDayThought,2200);
        });
      };
    });
}
/* Rede de seguranca: se a caixa do relatorio sumir sem passar pelo SLEEP,
   reportBusy e dayLock ficariam presos em true e o jogador nunca mais
   encerraria um dia. Aqui isso se desfaz sozinho. */
setInterval(()=>{
  if(!reportBusy||reportPending||outroBusy)return;
  if(typeof UI==='undefined'||UI.modalOpen())return;      /* relatorio ainda na fila */
  if(document.querySelector('#modalveil .dayrep'))return; /* esta na tela, tudo certo */
  reportBusy=false;dayLock=false;tiredOpen=false;
},2000);
function nextDayThought(){
  if(G.money<12)UI.think(pick(TH('broke')),true);
  else if(G.hype<8)UI.think(pick(TH('lowhype')),true);
  else if(G.hype>65)UI.think(pick(TH('highhype')),true);
  else if(G.money>6000)UI.think(pick(TH('rich')),true);
  else UI.think(pick(TH('idle')),true);
}
function openTaxman(){
  const sc=$('#screen');sc.classList.add('dread');setTimeout(()=>sc.classList.remove('dread'),3100);
  openAppAuto('tax');
}
/* first time the player sees a Race */
function checkRaces(list){
  for(const tk of list){
    const r=raceOf(tk);
    if(G.seenRaces.indexOf(r)<0){
      G.seenRaces.push(r);
      const line=RACE_LINES[r];
      if(line){
        setTimeout(()=>UI.think((line[LANG]||line.en),true),900);
        UI.toast('gift',t('New Race discovered: {0}',r));
      }
      return;
    }
  }
}
function onMintout(){
  setTimeout(()=>{
    SFX.levelup();UI.confetti(180);
    UI.think(pick(TH('mintout')),true);
    UI.modal(`<div class="titlebar">${pixSVG('kaiju',14,'tico')}<span class="ttl">MINTOUT</span></div>
      <div class="wbody lvlup" style="width:min(calc(380px * var(--ui)),92vw)"><div class="stage">
        <h2>${t('MINTOUT!')}</h2>
        <div class="rank">8.888 / 8.888</div>
        <div style="margin-top:12px;font-size:calc(12px * var(--fs));color:#b8ecc8;line-height:1.6">
          ${t('Kaijukaki minted out.')}<br>${t('You started with $40 and an ugly website.')}<br>
          ${t('Now you have <b>{0}</b>, {1} Kaiju in the wallet and the title of <b>{2}</b>.',money(G.money),num(held()),LEVELS[G.level-1].n)}
        </div>
        <div style="margin-top:10px;font-size:calc(11px * var(--fs));color:#7fb894">${t('The secondary market is still open. Go be a Big Whale.')}</div>
      </div><div class="row" style="justify-content:center;padding:10px"><button class="btn big" data-mook="1">${t('CONTINUE')}</button></div></div>`,'lvlup',
      m=>{m.box.querySelector('[data-mook]').onclick=()=>{SFX.click();m.close();};});
  },500);
}

/* ---------- o clima do dia ---------- */
function showEventCard(){
  const e=todayEvent();
  if(e.id==='calm'&&chance(.5)){UI.toast('info',evName(e));return;}
  const good=e.floor>=1&&e.hype>=0;
  const rows=[];
  const pct=v=>Math.round((v-1)*100);
  if(Math.abs(e.floor-1)>0.01)rows.push([t('Floor price'),(pct(e.floor)>0?'+':'')+pct(e.floor)+'%',e.floor>=1]);
  if(Math.abs(e.sell-1)>0.01)rows.push([t('Sale speed'),(pct(e.sell)>0?'+':'')+pct(e.sell)+'%',e.sell>=1]);
  if(Math.abs(e.offer-1)>0.01)rows.push([t('Offer prices'),(pct(e.offer)>0?'+':'')+pct(e.offer)+'%',e.offer>=1]);
  if(Math.abs(e.gas-1)>0.01)rows.push([t('Gas'),(pct(e.gas)>0?'+':'')+pct(e.gas)+'%',e.gas<=1]);
  if(Math.abs(e.npc-1)>0.01)rows.push([t('Other people minting'),(pct(e.npc)>0?'+':'')+pct(e.npc)+'%',e.npc>=1]);
  if(e.bleed>1.05)rows.push([t('Hype drain'),'×'+e.bleed.toFixed(1),false]);
  if(e.bleed<0.95)rows.push([t('Hype drain'),'×'+e.bleed.toFixed(1),true]);
  /* quando o evento alveja uma raca, ela e a informacao mais importante do card */
  if(G.eventRace){
    const m=raceHeat(G.eventRace);
    rows.push([t('{0} value',G.eventRace),(m>1?'+':'')+Math.round((m-1)*100)+'%',m>=1]);
  }
  UI.modal(`<div class="titlebar${good?'':' bad'}">${pixSVG(e.ico,14,'tico')}<span class="ttl">${t('Day {0} · {1}',G.day,evName(e))}</span>
      <div class="tbtns"><button class="tb" data-evx="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(340px * var(--ui)),92vw)"><div class="pad">
      <div class="evcard ev-${e.id}">
        <div class="evico">${pixSVG(e.ico,32)}</div>
        <div class="evtxt">${evDesc(e)}</div>
      </div>
      ${rows.length?`<div class="evrows">${rows.map(r=>`<div class="evrow"><span>${r[0]}</span><b class="${r[2]?'pos':'neg'}">${r[1]}</b></div>`).join('')}</div>`
        :`<div class="tiny dim center" style="padding:8px">${t('No effect on the market today.')}</div>`}
    </div>
    <div class="row" style="justify-content:center;padding:0 10px 12px"><button class="btn big" data-evok="1">${t('OK')}</button></div>
    </div>`,'evcard',m=>{
      SFX.notify();
      const done=()=>{SFX.click();m.close();};
      $('[data-evok]',m.box).onclick=done;
      $('[data-evx]',m.box).onclick=done;
    });
}
