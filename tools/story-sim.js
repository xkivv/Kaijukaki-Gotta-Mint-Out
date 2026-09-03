/* Simulação de 45 dias do MODO HISTÓRIA.
   Um bot que joga de verdade: minta, lista, vende, sobe de nível, paga
   imposto (às vezes não paga), leva golpe e quebra. A cada hora de jogo o
   storyTick() roda igual roda no jogo. Registra dia a dia o que disparou. */
const {chromium}=require('playwright');

(async()=>{
const b=await chromium.launch({executablePath:(process.env.KK_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome')});
const p=await b.newPage({viewport:{width:1366,height:900}});
const errs=[];
p.on('pageerror',e=>errs.push(String(e)));
const res=[];
p.on('console',m=>{if(m.type()==='error')res.push(m.text());});

await p.goto('file://'+require('path').resolve(__dirname,'../dist/kaijukaki.html')+'');
await p.waitForTimeout(2500);
const sr=await p.$('.slotrow');
if(sr){await sr.click();await p.waitForTimeout(400);
  await p.evaluate(()=>{const x=[...document.querySelectorAll('.btn')].find(y=>/LOG ON/i.test(y.textContent));if(x)x.click();});
  await p.waitForTimeout(4500);}
await p.evaluate(()=>{const v=document.querySelector('#wizveil');if(v)v.remove();
  document.body.classList.remove('wizing');G.walletMade=true;G.nick='kiv';save();start();});
await p.waitForTimeout(3000);

const out=await p.evaluate(()=>{
  /* silencia tudo que abre janela: o bot joga headless dentro do estado */
  const NO=()=>{};
  ['modal','dialog','levelUp','toast','confetti','think','floatTray','floatFrom','refresh','updateTray'].forEach(k=>{
    if(typeof UI==='object'&&UI)UI[k]=UI[k]?NO:NO;
  });
  UI.modalOpen=()=>false;
  UI.bounds=()=>({w:1366,h:900});
  Object.keys(SFX||{}).forEach(k=>{if(typeof SFX[k]==='function')SFX[k]=NO;});
  window.buildDesktop=NO;window.buildWidgets=NO;window.buildStart=NO;
  window.openAppAuto=NO;window.openTaxman=NO;window.spawnScam=NO;window.maybeScam=NO;
  window.storyShow=(line,done)=>{LOG.push({d:G.day,h:G.hour,c:line.c,
    txt:(line.pt||line.en||'').slice(0,150)});done();};
  window.LOG=[];
  /* zera e recomeça um jogo limpo */
  G=newGame();G.walletMade=true;G.nick='kiv';
  G.story={seen:{},un:{},q:[]};
  storyMigrate();

  const perDay=[];const said=[];
  const seenAt={};
  const antes=()=>Object.keys(G.story.seen);

  const passaHora=()=>{
    advance(60-G.min);            /* o relógio de verdade: marketTick a cada 10min + onHour */
    /* a fila de falas é drenada na unha: sem DOM, storyPump não roda */
    const S=G.story;
    let guard=0;
    while(S.q.length&&guard++<40){
      const it=S.q[0];const bt=BEATS.find(x=>x.id===it.id);
      if(!bt||!bt.say||it.i>=bt.say.length){S.q.shift();continue;}
      const l=bt.say[it.i];
      LOG.push({d:G.day,h:G.hour,beat:bt.id,c:l.c});
      it.i++;if(it.i>=bt.say.length)S.q.shift();
    }
  };

  const DIAS=120;
  for(let day=1;day<=DIAS;day++){
    const before=new Set(antes());
    const nLog=LOG.length;
    /* ---- o dia ---- */
    while(G.hour<dayEndHour()){
      const h=G.hour;
      /* mintar quando o gas está barato e cabe na carteira */
      if(capLeft()>0&&gasPct()<1.1){
        const unit=mintPrice()*saturation()+gasFee();
        let q=Math.min(maxBulk(),capLeft(),Math.floor(G.money*0.40/Math.max(0.01,unit)));
        if(q>=1){const r=doMint(q);
          /* o reveal é que registra raça nova; sem UI, registro aqui igual */
          if(r&&r.made)r.made.forEach(tk=>{const rc=raceOf(tk);
            if(G.seenRaces.indexOf(rc)<0)G.seenRaces.push(rc);});}
      }
      /* listar o que não está listado — é assim que entra dinheiro */
      if(day>=2&&h%3===0){
        const abertas=G.tokens.filter(x=>x.listed!=null).length;
        /* depois do dia 45 o bot vira holder: só vende quando o caixa aperta.
           É assim que peakHeld sobe e os ranks altos (cofre) chegam. */
        const frac=day<8?0.30:(day>=46&&G.money>1500?0.05:0.45);
        const teto=Math.max(day>=46?0:3,Math.round(held()*frac))-abertas;
        const livres=teto<=0?[]:sellableTokens().filter(x=>x.listed==null).slice(0,teto);
        livres.forEach(x=>{x.listed=tokenValue(x)*(day<8?1.02:0.99);
          G.log.listed=(G.log.listed||0)+1;G.totals.listed=(G.totals.listed||0)+1;});
      }
      /* aceitar ofertas */
      while(G.offers.length&&Math.random()<0.7)acceptOffer(G.offers[0].id);
      /* varrer o floor de vez em quando */
      if(day>=12&&h===12&&G.money>6000&&npcHeld()>50)sweepFloor(6);
      /* fase holder: varrer é o único jeito de crescer depois do mintout */
      if(day>=46&&G.money>4000&&npcHeld()>50&&capLeft()>0)sweepFloor(Math.min(25,capLeft()));
      /* postar pra manter o hype de pé */
      /* hype é o motor de renda inteiro, mas comprar hype é caro: no máximo
         três posts por dia e só com folga no caixa */
      let posts=0;
      while(posts<3&&G.money>shillCost()*6&&G.hype<hypeCap()*0.90){doShill();posts++;}
      /* turno no spotter */
      if(h===10&&G.spot){G.spot.day=G.day;G.spot.i=(G.spot.i||0)+1;
        if(G.spot.i>=3){G.spot.shifts=(G.spot.shifts||0)+1;G.spot.i=0;G.spot.rep=(G.spot.rep||0)+4;}}
      /* imposto: paga quase sempre; nos dias 9-10 e 21-22 finge que não viu */
      if(G.taxDue>0&&day!==9&&day!==10&&day!==21&&day!==22&&G.money>=G.taxDue)payTax();
      /* loja: espaço primeiro, sempre */
      /* de propósito: até o dia 11 o bot NÃO compra espaço — é assim que a
         carteira enche e o momento da capacidade acontece */
      if(day>=12&&!capMaxed()&&G.bestLevel>=capReqLevel()&&G.money>capCost()*(day>=46?1.05:1.6))upgradeCap();
      else if(G.bestLevel>=bulkReqLevel()&&G.money>bulkCost()*2.5)upgradeBulk();
      else if(G.money>contractCost()*3)upgradeContract();
      else if(G.money>listCost()*3)upgradeList();
      else if(G.money>gasPerkCost()*3&&G.bestLevel>=gasReqLevel())upgradeGas();
      UPGRADES.forEach(u=>{if(!has(u.id)&&G.bestLevel>=u.lvl&&G.money>u.cost*4){spend(u.cost);G.up[u.id]=1;}});
      /* antivírus só a partir do dia 20: antes disso o bot apanha de propósito */
      if(day>=20&&!securityActive()&&G.money>securityCost()*5){spend(securityCost());G.secUntil=G.day+7;}
      /* staking assim que o cofre abre */
      if(vaultUnlocked()&&!G.stakeOn&&G.money>200)activateStaking();
      if(stakingOn()&&stakeFree()>0){
        const liv=G.tokens.find(x=>!x.staked&&x.listed==null);
        if(liv)stakeToken(liv);
      }
      /* referral quando abre */
      if(referralUnlocked()&&!G.referral)G.referral=true;
      /* golpe: cai num no dia 14 */
      if(day===14&&h===15&&!(G.scamLoss>0)){const v=Math.min(G.money,G.money*0.15);spend(v);G.scamLoss+=v;}
      checkLevel();
      passaHora();
    }
    /* o dia 30 é de propósito um dia ruim: quebra o bot */
    if(day===29){spend(G.money-1);}
    endDay();
    checkLevel();
    storyTick();
    const depois=antes().filter(x=>!before.has(x));
    perDay.push({day,novos:depois,falas:LOG.length-nLog,
      nivel:G.bestLevel,held:held(),money:Math.round(G.money),minted:G.minted,ev:G.event});
    depois.forEach(id=>{if(!seenAt[id])seenAt[id]=day;});
  }
  /* força o mintout pra provar que o último beat é alcançável */
  const antesFim=new Set(antes());
  G.minted=SUPPLY;G.mintout=true;storyTick();
  for(let i=0;i<12;i++){passaHora();if(G.hour>=dayEndHour()){endDay();}}
  const fim=antes().filter(x=>!antesFim.has(x));

  return {perDay,log:LOG,seenAt,fim,
    todos:BEATS.map(x=>x.id),
    faltando:BEATS.filter(x=>!G.story.seen[x.id]).map(x=>x.id),
    unlocked:Object.keys(G.story.un),
    fim2:{dia:G.day,nivel:G.bestLevel,peak:G.peakHeld,held:held(),cap:capacity(),money:Math.round(G.money)},
    marks:G.story.m||{}};
});

/* ---------- relatório ---------- */
const porDia={};
out.log.forEach(l=>{if(!l.beat)return;(porDia[l.d]=porDia[l.d]||new Set()).add(l.beat);});
console.log("DIA | MOM | MOMENTOS");
console.log('-'.repeat(118));
let maxDia=0;
out.perDay.filter(d=>d.day<=45).forEach(d=>{
  const s=[...(porDia[d.day]||[])];
  maxDia=Math.max(maxDia,s.length);
  const quem={};out.log.filter(l=>l.d===d.day&&l.beat).forEach(l=>{quem[l.beat]=quem[l.beat]||new Set();quem[l.beat].add(l.c);});
  const txt=s.map(x=>x+'('+[...quem[x]].join('/')+')').join(' ');
  console.log(String(d.day).padStart(3)+' | '+String(s.length).padStart(3)+' | '+txt.padEnd(92).slice(0,92)+
    ' | '+String(d.nivel).padStart(2)+' | '+String(d.held).padStart(4)+' | '+d.money);
});
console.log('-'.repeat(118));
console.log('\nCONTINUACAO (dias 46-120, so os dias com momento):');
out.perDay.filter(d=>d.day>45).forEach(d=>{
  const s2=[...(porDia[d.day]||[])];
  if(!s2.length)return;
  maxDia=Math.max(maxDia,s2.length);
  const quem={};out.log.filter(l=>l.d===d.day&&l.beat).forEach(l=>{quem[l.beat]=quem[l.beat]||new Set();quem[l.beat].add(l.c);});
  console.log(String(d.day).padStart(3)+' | '+String(s2.length).padStart(3)+' | '+
    s2.map(x=>x+'('+[...quem[x]].join('/')+')').join(' ').padEnd(92).slice(0,92)+
    ' | '+String(d.nivel).padStart(2)+' | '+String(d.held).padStart(4)+' | '+d.money);
});
const at45=out.perDay.find(d=>d.day===45);
const d45=new Set();out.log.filter(l=>l.beat&&l.d<=45).forEach(l=>d45.add(l.beat));
console.log('\nEM 45 DIAS:',d45.size,'/',out.todos.length,'momentos');
console.log('MAX MOMENTOS NUM DIA:',maxDia,maxDia<=7?'(OK: dia 1 = 6 de tutorial + 1 urgente)':'(FALHOU)');
console.log('BEATS DISPARADOS EM 120 DIAS:',out.todos.length-out.faltando.length,'/',out.todos.length);
console.log('DISPARADOS NO ENDGAME FORÇADO:',out.fim.join(', ')||'(unlocks: nenhum novo)');
console.log('ORFAOS (nunca dispararam):',out.faltando.join(', ')||'NENHUM');
console.log('\nFALAS POR PERSONAGEM:');
const c={};out.log.forEach(l=>{if(l.beat)c[l.c]=(c[l.c]||0)+1;});
const tot=Object.values(c).reduce((a,x)=>a+x,0);
Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>
  console.log('  '+k.padEnd(8)+String(v).padStart(4)+'  '+(v/tot*100).toFixed(1)+'%  '+'#'.repeat(Math.round(v/tot*60))));
console.log('  TOTAL   '+tot);
console.log('\nESTADO FINAL:',JSON.stringify(out.fim2));
console.log('\npageerror (JS):',errs.length,errs.slice(0,5).join(' | ')||'NENHUM');
console.log('console error (recursos, nao-JS):',res.length,res.slice(0,3).join(' | '));
await b.close();
})();
