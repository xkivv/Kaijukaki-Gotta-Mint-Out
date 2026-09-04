/* ================= STATE + ECONOMY ================= */
const SUPPLY=8888;
let SLOT=1;
const slotKey=n=>'kaijukaki_slot_'+n;
let SAVEKEY=slotKey(1);
/* Trocar de perfil zera o marcador da copia de seguranca: senao um jogo novo
   no dia 1 nao gravava _bak (o marcador ainda dizia "dia 1 ja foi") e a copia
   antiga do perfil deletado ficava valendo como "ontem" de um jogo que nem
   comecou ainda. */
function useSlot(n){SLOT=n;SAVEKEY=slotKey(n);lastBackupDay=-1;}
/* minutes each action eats out of the day */
/* metade do que era: o dia rende o dobro de acoes, e o relogio anda na metade */
const ACT={mint:22,list:15,listAll:30,offer:10,sell:10,sweep:20,shop:22};

/* ---------- VELOCIDADE DE CONTRATO ----------
   O mint comeca 30% mais lento do que era e vai ate 2x mais rapido, em 10
   niveis de upgrade. Mintar em lote nao custa o tempo de cada um: a assinatura
   e uma so, entao a leva inteira sai por 1,5x o tempo de um mint sozinho. */
const CONTRACT_MAX=10;
const CONTRACT_SLOW=1.30, CONTRACT_FAST=0.50;
function contractLevel(){return clamp(Math.floor(+(G&&G.contract)||0),0,CONTRACT_MAX);}
function contractMult(lv){
  lv=lv==null?contractLevel():lv;
  return CONTRACT_SLOW+(CONTRACT_FAST-CONTRACT_SLOW)*(lv/CONTRACT_MAX);
}
function contractCost(lv){
  lv=lv==null?contractLevel():lv;
  return Math.round(90*Math.pow(2.05,lv));
}
function mintMinutes(q){
  const base=ACT.mint*contractMult();
  return Math.max(1,Math.round(base*((q||1)>1?1.5:1)));
}
function upgradeContract(){
  const lv=contractLevel();
  if(lv>=CONTRACT_MAX)return {err:'max'};
  const c=contractCost(lv);
  if(G.money<c)return {err:'money',need:c};
  spend(c);
  G.contract=lv+1;
  return {lv:lv+1,cost:c,from:mintMinutes(1)};
}
/* ---------- VELOCIDADE DE LISTAGEM ----------
   Listar 40 Kaiju um por um no dia 16 e RSI, nao jogo. O tempo por listagem
   cai pela metade em 10 niveis, e listar em lote e uma assinatura so — o
   mesmo raciocinio do contrato. */
const LIST_MAX=10;
const LIST_SLOW=1.00, LIST_FAST=0.32;
function listLevel(){return clamp(Math.floor(+(G&&G.listLv)||0),0,LIST_MAX);}
function listMult(lv){
  lv=lv==null?listLevel():lv;
  return LIST_SLOW+(LIST_FAST-LIST_SLOW)*(lv/LIST_MAX);
}
function listCost(lv){
  lv=lv==null?listLevel():lv;
  return Math.round(120*Math.pow(1.98,lv));
}
function listMinutes(n){
  const base=((n||1)>1?ACT.listAll:ACT.list)*listMult();
  return Math.max(1,Math.round(base));
}
/* quanto tempo de RELOGIO a animacao de assinatura leva */
function listMs(n){return clamp(listMinutes(n)*42,520,2400);}
function upgradeList(){
  const lv=listLevel();
  if(lv>=LIST_MAX)return {err:'max'};
  const c=listCost(lv);
  if(G.money<c)return {err:'money',need:c};
  spend(c);
  G.listLv=lv+1;
  return {lv:lv+1,cost:c,from:listMinutes(1)};
}
/* the clock also drifts on its own, so a day passes even while you read */
/* parado, uma hora de jogo levava 210s reais. Agora 135s: o mercado anda
   sozinho sem o jogador precisar clicar em nada. */
const IDLE_TICK_MS=4500, IDLE_TICK_MIN=2;
let G=null;
/* accumulator for everything that happens while time passes — flushed once by timeAct */
let TICK={roy:0,stake:0,sold:0,soldVal:0,offers:0,mintedNow:0,npc:0,mktNew:0,mktGone:0,dirty:false};

function newGame(){
  return {
    money:40, day:1, hour:8, min:0,
    hype:2, minted:0,
    tokens:[], offers:[], up:{}, freeMints:1, coupon:0,
    level:1, bestLevel:1, peakHeld:0, taxPeriodNet:0, lastTaxDay:0, taxDue:0,
    event:'calm', shills:0, mkt:[], contract:0, gasLv:0, bulk:0, listLv:0, feeCut:0,
    items:{}, mailRead:[], mailbox:[], feed:[], bin:[],
    stipend:0, hammer:0, bomdia:0, tracks:[], seq:0, warned:{}, starsGot:0, bestSale:0, achv:[], achvBig:0, achvVault:0, achvStorm:0, quests:null, heat:{}, eventRace:null, social:{},
    stakeOn:false, stakeSlotLv:0, capLv:0, rep:60, per:{mints:0,sold:0,bought:0,listed:0}, taxRows:[], lastAuditDay:0, binder:{pages:[]},
    gasSeed:(Math.random()*0xFFFFFFFF)>>>0,
    referral:false, refMints:0, mintSeed:(Math.random()*0xFFFFFFFF)>>>0, mintOrderV:MINT_ORDER_V,
    /* hackTut: o dia em que o hack roteirizado aconteceu (0 = ainda nao).
       Ver hackTutorial(). A historia le isso pra apresentar a loja. */
    secUntil:0, lastHack:null, hackTut:0, scamLoss:0, playMs:0,
    candles:[], icandles:[], curCandle:null,
    log:{spent:0,earned:0,mint:0,sold:0,tax:0,royal:0,bought:0,stake:0},
    hist:[], totals:{spent:0,earned:0,mint:0,sold:0,tax:0,royal:0,bought:0,stake:0},
    usedCodes:[], goals:[], claimDay:0, seenRaces:[],
    /* TUDO que o jogador ajusta mora aqui — ver 24a-prefs.js */
    prefs:prefsDefaults(),
    seenIntro:false, mintout:false, best:40, priceHist:[],
    /* a carteira: apelido do jogador, a seed de brincadeira, e se a carteira
       ja foi criada. O apelido e o nome dele no Kaki+ e no slot de save. */
    nick:'', seed:'', walletMade:false, netSeen:false,
    /* EXP do Kaki+: reagir certo da um pouco. Ver xpBonus(). */
    xp:0, mintLog:[], chainLoad:0,
    /* turno de catalogacao — ver 52-spotter.js */
    spot:{day:0,i:0,ok:0,rep:0,best:0,shifts:0,ans:[]},
    /* mercado da colecao — ver 54-collection.js: lances na colecao inteira e
       o volume negociado (24 gavetas de uma hora + o total de sempre) */
    cbids:[], volH:[], volCur:0, volTot:0, volSeed:0
  };
}
const EMPTY_LOG={spent:0,earned:0,mint:0,sold:0,tax:0,royal:0,bought:0,stake:0,listed:0};

/* ================= THE REAL COLLECTION =================
   Traits, races and rarity come from the official Kaijukaki metadata baked
   into KK_META. Kaiju #N is the actual Kaiju #N. */
const B64A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64I=(()=>{const m={};for(let i=0;i<64;i++)m[B64A[i]]=i;return m;})();
function dec2(str,i){return (B64I[str[i*2]]<<6)|B64I[str[i*2+1]];}
function dec3(str,i){const o=i*3;return (B64I[str[o]]<<12)|(B64I[str[o+1]]<<6)|B64I[str[o+2]];}
/* sparse columns are decoded once into lookup maps.
   The token id needs 3 chars (18 bits) — 8888 does not fit in 12. */
const SPARSE={};
function sparseMap(tt){
  if(SPARSE[tt])return SPARSE[tt];
  const m=Object.create(null), s=KK_META.col[tt].s;
  for(let i=0;i<s.length;i+=5){
    const id=(B64I[s[i]]<<12)|(B64I[s[i+1]]<<6)|B64I[s[i+2]];
    const v=(B64I[s[i+3]]<<6)|B64I[s[i+4]];
    m[id]=v;
  }
  SPARSE[tt]=m;return m;
}
const META=Object.create(null);
function metaOf(id){
  let m=META[id];
  if(m)return m;
  const i=id-1;
  const T={};
  KK_META.types.forEach(tt=>{
    const col=KK_META.col[tt];
    let vi=-1;
    if(col.m==='d'){const v=dec2(col.s,i);if(v>0)vi=v-1;}
    else {const mm=sparseMap(tt);if(mm[i]!==undefined)vi=mm[i];}
    if(vi>=0)T[tt]=KK_META.dict[tt][vi];
  });
  m={traits:T,rarity:+KK_META.tier[i],rank:dec3(KK_META.rank,i),pos:dec3(KK_META.pos,i)};
  META[id]=m;return m;
}
function buildToken(id,day,fresh){
  const m=metaOf(id);
  return {id,traits:m.traits,rarity:m.rarity,score:m.rank,staked:false,stakedDay:0,listed:null,day:day||1,seq:0,fresh:fresh?1:0};
}
function rankOf(id){return metaOf(id).rank;}
/* A ordem de mint e embaralhada, entao o id NAO diz o que chegou primeiro.
   Todo token que entra na carteira leva um numero de chegada. E isso, e so
   isso, que o filtro "Newest" deve olhar. */
function ownToken(tk){tk.seq=(G.seq=(G.seq||0)+1);G.tokens.push(tk);return tk;}

/* ---- mint order ----
   Real mints do not hand out #1, #2, #3 in a row — and this collection keeps
   the Honorary and Reserve pieces at the low ids, so sequential minting would
   hand the player twenty identical Specials. One fixed shuffle, same for every
   player, decided once. */
let MINT_ORDER=null, MINT_ORDER_SEED=null;
function mintSeed(){
  if(!G.mintSeed)G.mintSeed=(Math.random()*0xFFFFFFFF)>>>0;
  return G.mintSeed;
}
/* A chance de Rare+ era 25.3% do dia 1 ao mintout — plana. Com bulk x10 o
   jogador via um Rare+ em quase toda leva e a raridade parava de significar
   coisa. Agora a fila e enviesada: raro tende pro FIM. A colecao inteira ainda
   sai (mintout continua possivel, os ids nao mudam), e o endgame ganha uma
   recompensa propria.
   CUIDADO COM SAVES: G.mintOrderV guarda qual algoritmo gerou a fila. Save sem
   o campo continua no embaralhamento uniforme, senao a fila muda debaixo do
   jogador — e quem tem o scanner ja viu os proximos. */
const RARE_BIAS=[1.00,0.88,0.58,0.36,0.20,0.14];
const MINT_ORDER_V=2;
function mintOrderV(){return Math.floor(+(G&&G.mintOrderV)||1);}
function mintOrder(){
  const seed=mintSeed(), ver=mintOrderV();
  const key=seed+'/'+ver;
  if(MINT_ORDER&&MINT_ORDER_SEED===key)return MINT_ORDER;
  const n=KK_META.n;
  let a;
  if(ver>=2){
    /* amostragem por chave exponencial: peso maior sai antes */
    const r=mulberry(seed);
    const keyed=new Array(n);
    for(let i=0;i<n;i++){
      const w=RARE_BIAS[+KK_META.tier[i]]||1;
      keyed[i]=[i+1,-Math.log(Math.max(1e-9,r()))/w];
    }
    keyed.sort((x,y)=>x[1]-y[1]);
    a=new Int32Array(n);
    for(let i=0;i<n;i++)a[i]=keyed[i][0];
  } else {
    a=new Int32Array(n);
    for(let i=0;i<n;i++)a[i]=i+1;
    const r=mulberry(seed);
    for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}
  }
  MINT_ORDER=a;MINT_ORDER_SEED=key;return a;
}
function idAtMintIndex(k){const o=mintOrder();return o[clamp(k,0,o.length-1)];}

/* ---------- save / load ---------- */
function packToken(t){return [t.id,t.staked?1:0,t.listed==null?-1:+t.listed,t.day,t.seq|0,t.stakedDay|0];}
function unpackToken(a){
  const t=buildToken(a[0],a[3]);
  t.staked=!!a[1];t.listed=a[2]<0?null:a[2];t.fresh=0;
  t.seq=a[4]|0;t.stakedDay=a[5]|0;
  return t;
}
let saveWarned=false,lastBackupDay=-1;
function save(){
  try{
    const o=Object.assign({},G,{tv:3,tokens:G.tokens.map(packToken)});
    const str=JSON.stringify(o);
    localStorage.setItem(SAVEKEY,str);
    /* copia de seguranca trocada uma vez por dia: se o save principal corromper,
       da pra voltar pro comeco do dia em vez de perder a partida inteira */
    if(G.day!==lastBackupDay){lastBackupDay=G.day;localStorage.setItem(SAVEKEY+'_bak',str);}
  }catch(e){
    if(!saveWarned&&typeof UI!=='undefined'){saveWarned=true;UI.toast('warn',t('Save failed (storage full).'));}
  }
}
function readSave(key){
  const s=localStorage.getItem(key);if(!s)return null;
  const o=JSON.parse(s);if(!o||!Array.isArray(o.tokens))return null;
  o.tokens=o.tokens.map(unpackToken);
  return o;
}
/* ---------- O BUG DO SAVE QUE VOLTAVA DO TUMULO ----------
   Deletar um perfil apagava so a chave principal e deixava a copia de
   seguranca (_bak) no lugar. Na proxima vez que o jogador entrava naquele
   perfil, load() nao achava a principal, caia na copia — e "recuperava"
   sozinho o jogo que ele tinha acabado de deletar. O dono viu isso toda vez
   que tentou comecar do zero.

   Duas regras agora:
   1. A copia so vale quando a principal EXISTE e esta ilegivel. Principal
      ausente = perfil vazio, ponto. Isso conserta inclusive os _bak orfaos
      que ja estao na maquina de quem jogou versoes antigas.
   2. Deletar apaga as duas (wipe / o botao de deletar perfil). */
function load(){
  let bruto=null;
  try{bruto=localStorage.getItem(SAVEKEY);}catch(e){}
  if(bruto===null||bruto===undefined)return null;   /* nao existe: nao ha o que recuperar */
  try{const o=readSave(SAVEKEY);if(o)return o;}catch(e){}
  try{
    const bak=readSave(SAVEKEY+'_bak');
    if(bak){
      if(typeof UI!=='undefined')setTimeout(()=>UI.toast('warn',t('Main save was unreadable — restored yesterday\'s backup.')),1800);
      return bak;
    }
  }catch(e){}
  return null;
}

/* ---------- levar o save de uma build pra outra ----------
   O navegador guarda o progresso preso ao lugar de onde o arquivo foi aberto.
   Trocar de pasta ou de navegador e comecar do zero. Um codigo resolve isso. */
function exportSave(){
  const o=Object.assign({},G,{tv:3,tokens:G.tokens.map(packToken)});
  const json=JSON.stringify({kk:1,slot:SLOT,ver:(typeof GAME_VERSION!=='undefined'?GAME_VERSION:'0'),g:o});
  /* base64 seguro pra acentos */
  return 'KAIJU1:'+btoa(unescape(encodeURIComponent(json))).replace(/=+$/,'');
}
function importSave(code){
  try{
    let c=(code||'').trim().replace(/\s+/g,'');
    if(!c)return {err:'empty'};
    if(c.indexOf('KAIJU1:')===0)c=c.slice(7);
    while(c.length%4)c+='=';
    const o=JSON.parse(decodeURIComponent(escape(atob(c))));
    if(!o||!o.g||!Array.isArray(o.g.tokens))return {err:'bad'};
    const g=o.g;
    g.tokens=g.tokens.map(unpackToken);
    const ng=migrate(g);
    return {g:ng,ver:o.ver||'?'};
  }catch(e){return {err:'bad'};}
}
/* a pagina hospedada nao consegue entregar arquivo pro visitante: la o codigo
   copiado e o unico caminho, entao nem mostramos um botao que nao funciona */
function canDownload(){try{return location.protocol==='file:';}catch(e){return false;}}
function saveIODialog(mode){
  const isOut=mode==='out';
  const code=isOut?exportSave():'';
  UI.modal(`<div class="titlebar">${pixSVG('notepad',14,'tico')}<span class="ttl">${isOut?t('Export save'):t('Import save')}</span>
      <div class="tbtns"><button class="tb" data-a="x"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
    <div class="wbody" style="background:var(--face);width:min(calc(420px * var(--ui)),94vw)"><div class="pad">
      <div class="tiny dim" style="line-height:1.6;margin-bottom:8px">${isOut
        ? (canDownload()
            ? t('This is your whole run in one line. Copy it somewhere safe, or download it as a file. On another build, use <b>Import save</b> and paste it back.')
            : t('This is your whole run in one line. Copy it and paste it into a text file you keep. On another build, use <b>Import save</b> and paste it back.'))
        : t('Paste a code from <b>Export save</b>. It replaces the profile you are logged into right now.')}</div>
      <textarea data-code="1" class="savecode" spellcheck="false" ${isOut?'readonly':''} placeholder="KAIJU1:...">${code}</textarea>
      <div class="row" style="margin-top:9px;gap:6px;flex-wrap:wrap">
        ${isOut
          ? `<button class="btn grow" data-copy="1">${t('COPY')}</button>${canDownload()?`<button class="btn grow" data-dl="1">${t('DOWNLOAD FILE')}</button>`:''}`
          : `<button class="btn grow" data-file="1">${t('LOAD FROM FILE')}</button><button class="btn grow" data-imp="1">${t('IMPORT')}</button>`}
        <button class="btn" data-close="1">${t('Close')}</button>
      </div>
      <div class="tiny" data-msg="1" style="margin-top:7px;min-height:15px"></div>
      <input type="file" data-fi="1" accept=".kaiju,.txt,text/plain" style="display:none">
    </div></div>`,'',m=>{
    const box=m.box, ta=$('[data-code]',box), msg=$('[data-msg]',box);
    const say=(s,cls)=>{msg.className='tiny '+(cls||'dim');msg.textContent=s;};
    $('.tb',box).onclick=()=>{SFX.close();m.close();};
    $('[data-close]',box).onclick=()=>{SFX.click();m.close();};
    const cp=$('[data-copy]',box);
    if(cp)cp.onclick=()=>{
      try{ta.select();ta.setSelectionRange(0,999999);document.execCommand('copy');}catch(e){}
      try{if(navigator.clipboard)navigator.clipboard.writeText(ta.value);}catch(e){}
      SFX.coin();say(t('Copied. Paste it somewhere you will find it again.'),'pos');
    };
    const dl=$('[data-dl]',box);
    if(dl)dl.onclick=()=>{
      try{
        const blob=new Blob([ta.value],{type:'text/plain'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='kaijukaki-day'+G.day+'-slot'+SLOT+'.kaiju';
        document.body.appendChild(a);a.click();
        setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);
        SFX.coin();say(t('Saved as a file. Keep it next to the game.'),'pos');
      }catch(e){say(t('This browser blocked the download. Use COPY instead.'),'neg');}
    };
    const fi=$('[data-fi]',box), fb=$('[data-file]',box);
    if(fb)fb.onclick=()=>fi.click();
    if(fi)fi.onchange=()=>{
      const f=fi.files&&fi.files[0];if(!f)return;
      const r=new FileReader();
      r.onload=()=>{ta.value=String(r.result||'');say(t('File loaded. Now hit IMPORT.'),'dim');};
      r.readAsText(f);
    };
    const ib=$('[data-imp]',box);
    if(ib)ib.onclick=()=>{
      const r=importSave(ta.value);
      if(r.err){SFX.error();say(r.err==='empty'?t('Paste a code first.'):t('That code is not a Kaijukaki save.'),'neg');return;}
      SFX.click();
      m.close();
      setTimeout(()=>{
        UI.dialog(t('Replace this profile?'),
          t('Profile {0} will be overwritten with the imported run: <b>day {1}</b>, <b>{2}</b>, <b>{3}</b> Kaiju.<br><br>This cannot be undone.',
            SLOT,r.g.day,money(r.g.money),num(r.g.tokens.length)),'warn',
          {buttons:[{t:t('IMPORT'),v:1},{t:t('Cancel'),v:0}],onDone(v){
            if(!v)return;
            G=r.g;save();
            SFX.cash();
            UI.dialog(t('Save imported'),t('Reloading the game with your run.'),'info',
              {buttons:[{t:t('OK')}],onDone(){location.reload();}});
          }});
      },200);
    };
    if(isOut)setTimeout(()=>{try{ta.focus();ta.select();}catch(e){}},120);
  });
}

function wipe(){
  try{
    localStorage.removeItem(SAVEKEY);
    localStorage.removeItem(SAVEKEY+'_bak');
    localStorage.removeItem('kaijukaki_os_v1');
  }catch(e){}
  lastBackupDay=-1;
}
/* apaga um perfil por numero — usado pela tela de login */
function wipeSlot(n){
  try{
    localStorage.removeItem(slotKey(n));
    localStorage.removeItem(slotKey(n)+'_bak');
  }catch(e){}
  if(n===SLOT)lastBackupDay=-1;
}
function migrate(s){
  const g=Object.assign(newGame(),s||{});
  /* o registrador vem antes de tudo: save antigo (sem G.prefs) recebe os
     padroes e adota os campos soltos que ele ja tinha, sem perder nada */
  g.prefs=prefsNormalize(g);
  prefsAdopt(g);
  g.up=g.up||{};g.offers=Array.isArray(g.offers)?g.offers:[];
  g.tokens=Array.isArray(g.tokens)?g.tokens:[];
  g.log=Object.assign({},EMPTY_LOG,g.log);
  g.totals=Object.assign({},EMPTY_LOG,g.totals);
  g.usedCodes=Array.isArray(g.usedCodes)?g.usedCodes:[];
  g.goals=Array.isArray(g.goals)?g.goals:[];
  g.seenRaces=Array.isArray(g.seenRaces)?g.seenRaces:[];
  g.hist=Array.isArray(g.hist)?g.hist:[];
  g.priceHist=Array.isArray(g.priceHist)?g.priceHist:[];
  g.nick=cleanNick(g.nick);
  g.seed=typeof g.seed==='string'?g.seed.slice(0,80):'';
  g.walletMade=!!g.walletMade;g.netSeen=!!g.netSeen;
  g.mailGift=Array.isArray(g.mailGift)?g.mailGift.filter(x=>typeof x==='string').slice(0,64):[];
  g.xp=Math.max(0,Math.floor(+g.xp||0));
  g.money=+g.money||0;g.hype=clamp(+g.hype||0,0,100);
  g.minted=clamp(Math.floor(+g.minted||0),0,SUPPLY);
  g.day=Math.max(1,Math.floor(+g.day||1));
  g.hour=clamp(Math.floor(+g.hour||8),0,34);g.min=clamp(Math.floor(+g.min||0),0,59);
  g.level=clamp(Math.floor(+g.level||1),1,LEVELS.length);
  g.bestLevel=clamp(Math.floor(+g.bestLevel||g.level),1,LEVELS.length);
  /* saves antigos nao tinham peakHeld: reconstroi do nivel ja alcancado */
  g.peakHeld=Math.max(+g.peakHeld||0,g.tokens.length,LEVELS[g.bestLevel-1].req);
  g.level=Math.max(g.level,g.bestLevel,levelOf(g.peakHeld));
  g.bestLevel=g.level;
  g.mintout=g.minted>=SUPPLY;
  if(!g.event||!EVENTS.some(e=>e.id===g.event))g.event='calm';
  g.shills=Math.max(0,Math.floor(+g.shills||0));
  g.contract=clamp(Math.floor(+g.contract||0),0,CONTRACT_MAX);
  g.gasLv=clamp(Math.floor(+g.gasLv||0),0,GAS_MAX_LV);
  g.bulk=clamp(Math.floor(+g.bulk||0),0,BULK_MAX-1);
  /* saves antigos compraram Fast Fingers / Mint Macro / Farm / Server na loja */
  if(g.up&&(g.up.bulk5||g.up.bulk10||g.up.bulk25||g.up.bulk100)){
    const old=g.up.bulk100?9:g.up.bulk25?7:g.up.bulk10?5:4;
    g.bulk=Math.max(g.bulk,old);
    delete g.up.bulk5;delete g.up.bulk10;delete g.up.bulk25;delete g.up.bulk100;
  }
  if(g.up&&(g.up.gas1||g.up.gas2)){
    g.gasLv=Math.max(g.gasLv,g.up.gas2?6:3);
    delete g.up.gas1;delete g.up.gas2;
  }
  g.feeCut=clamp(+g.feeCut||0,0,0.6);
  g.items=g.items&&typeof g.items==='object'?g.items:{};
  g.mailRead=Array.isArray(g.mailRead)?g.mailRead:[];
  g.mailbox=Array.isArray(g.mailbox)?g.mailbox:[];
  g.feed=Array.isArray(g.feed)?g.feed:[];
  g.bin=Array.isArray(g.bin)?g.bin:[];
  delete g.noScam;
  g.tracks=Array.isArray(g.tracks)?g.tracks:[];
  g.stipend=Math.max(0,+g.stipend||0);
  /* save antigo sem o campo fica em 0; como hackTutorial() so dispara na
     igualdade G.day===HACK_TUT_DAY, ninguem e hackeado retroativamente */
  g.hackTut=Math.max(0,Math.floor(+g.hackTut||0));
  g.warned=g.warned&&typeof g.warned==='object'?g.warned:{};
  g.listLv=clamp(Math.floor(+g.listLv||0),0,LIST_MAX);
  /* converte as 5 expansoes antigas na escada nova, sem tirar slots de ninguem */
  if(g.up&&(g.up.cap1||g.up.cap2||g.up.cap3||g.up.cap4||g.up.cap5)){
    const old=g.up.cap5?10:g.up.cap4?8:g.up.cap3?6:g.up.cap2?4:2;
    g.capLv=Math.max(+g.capLv||0,old);
    ['cap1','cap2','cap3','cap4','cap5'].forEach(k=>{delete g.up[k];});
  }
  g.capLv=clamp(Math.floor(+g.capLv||0),0,CAP_STEPS.length-1);
  g.rep=clamp(g.rep==null?60:+g.rep||0,0,100);
  g.per=Object.assign({mints:0,sold:0,bought:0,listed:0},g.per&&typeof g.per==='object'?g.per:{});
  g.taxRows=Array.isArray(g.taxRows)?g.taxRows:[];
  g.lastAuditDay=Math.max(0,Math.floor(+g.lastAuditDay||0));
  g.starsGot=Math.max(0,Math.floor(+g.starsGot||0));
  g.bestSale=Math.max(0,+g.bestSale||0);
  g.achv=Array.isArray(g.achv)?g.achv:[];
  if(g.quests&&typeof g.quests!=='object')g.quests=null;
  g.heat=g.heat&&typeof g.heat==='object'?g.heat:{};
  g.social=g.social&&typeof g.social==='object'?g.social:{};
  /* quem ja usava staking sob as regras antigas continua com ele ligado, e
     nada fica preso retroativamente (stakedDay=0 => ja passou dos 10 dias). */
  g.stakeOn=!!g.stakeOn||g.tokens.some(x=>x.staked);
  g.stakeSlotLv=clamp(Math.floor(+g.stakeSlotLv||0),0,STAKE_SLOT_TIERS.length-1);
  /* teto de slots retroativo: solta o excesso, do mais comum pro mais raro */
  const _stk=g.tokens.filter(x=>x.staked).sort((a,b)=>a.rarity-b.rarity);
  const _cap=STAKE_SLOT_TIERS[g.stakeSlotLv];
  for(let i=0;i<_stk.length-_cap;i++){_stk[i].staked=false;_stk[i].stakedDay=0;}
  /* o binder virou parte da economia: sanitiza aqui em vez de esperar o app */
  if(!g.binder||!Array.isArray(g.binder.pages))g.binder={pages:[]};
  const _own=new Set(g.tokens.map(x=>x.id)), _seen=new Set();
  const _sset=new Set(g.tokens.filter(x=>x.staked).map(x=>x.id));
  g.binder.pages=g.binder.pages.slice(0,60).map(p=>({
    name:String((p&&p.name)||'').slice(0,28),
    slots:(Array.isArray(p&&p.slots)?p.slots:[]).slice(0,15)
      .map(id=>(id!=null&&_own.has(id)&&!_seen.has(id)&&!_sset.has(id))?(_seen.add(id),id):null)
      .concat(new Array(15).fill(null)).slice(0,15)
  }));
  BIN_CACHE=null;
  g.mkt=Array.isArray(g.mkt)?g.mkt.filter(l=>l&&l.tk>=1&&l.tk<=SUPPLY&&!g.tokens.some(x=>x.id===l.tk)):[];
  if(!g.gasSeed)g.gasSeed=(Math.random()*0xFFFFFFFF)>>>0;
  if(!g.mintSeed)g.mintSeed=(Math.random()*0xFFFFFFFF)>>>0;
  /* save antigo mantem a fila que ele ja conhece */
  g.mintOrderV=Math.floor(+g.mintOrderV||1);
  g.tokens=g.tokens.filter(x=>x&&x.id>=1&&x.id<=SUPPLY);
  g.offers=g.offers.filter(o=>o&&g.tokens.some(x=>x.id===o.tk));
  g.tokens.forEach(x=>{if(x.staked)x.listed=null;});
  /* Saves antigos nao tinham numero de chegada — mas a ordem do array E a ordem
     em que os tokens entraram na carteira, entao o backfill e exato. */
  let mx=0;
  g.tokens.forEach((x,i)=>{if(!x.seq)x.seq=i+1;if(x.seq>mx)mx=x.seq;x.stakedDay=x.staked?(x.stakedDay|0):0;});
  g.seq=Math.max(+g.seq||0,mx);
  return g;
}

/* ---------- derived ---------- */
const has=id=>!!G.up[id];
function mintPrice(){return 4+46*Math.pow(G.minted/SUPPLY,1.2);}
/* ================= GAS =================
   O gas nao e um valor fixo: e uma PORCENTAGEM do preco do mint, e ela anda
   o dia inteiro. Numa hora calma fica entre 20% e 60%. Em hora de pico, ou num
   dia de congestionamento, passa de 200% e chega a 500% — a assinatura custa
   cinco vezes o Kaiju. Nessas horas o certo e esperar, nao mintar.
   O Gas Optimizer e o unico jeito de baixar o teto. */
const GAS_MAX_LV=10;
const GAS_FLOOR=0.06, GAS_CEIL=5.00;
function gasLevel(){return clamp(Math.floor(+(G&&G.gasLv)||0),0,GAS_MAX_LV);}
function gasPerkMult(lv){lv=lv==null?gasLevel():lv;return 1-0.052*lv;}
/* era o unico dos tres perks nivelados SEM trava de nivel, e $70 comprava
   -6.5% de gas pra sempre no dia 2 */
function gasPerkCost(lv){lv=lv==null?gasLevel():lv;return Math.round(240*Math.pow(2.2,lv));}
function gasReqLevel(lv){lv=lv==null?gasLevel():lv;return Math.min(8,1+Math.floor(lv*0.8));}
function upgradeGas(){
  const lv=gasLevel();
  if(lv>=GAS_MAX_LV)return {err:'max'};
  if(G.bestLevel<gasReqLevel(lv))return {err:'level',need:gasReqLevel(lv)};
  const c=gasPerkCost(lv);
  if(G.money<c)return {err:'money',need:c};
  spend(c);G.gasLv=lv+1;
  return {lv:lv+1,cost:c};
}
function gasWave(hourFloat){
  const s=((G.gasSeed||1)^(G.day*2654435761))>>>0;
  const r=mulberry(s);
  const a=r()*6.283,b=r()*6.283,c=r()*6.283;
  const h=hourFloat;
  const w=0.55*Math.sin(h*0.42+a)+0.30*Math.sin(h*1.15+b)+0.15*Math.sin(h*2.3+c);
  return clamp((w+1)/2,0,1);
}
function gasSpikes(){
  const s=((G.gasSeed||1)^(G.day*40503)^0x5bf03635)>>>0;
  const r=mulberry(s);
  const n=r()<0.34?0:(r()<0.72?1:2);
  const out=[];
  for(let i=0;i<n;i++){
    const start=8+Math.floor(r()*(dayEndHour()-9));
    const len=1+Math.floor(r()*3);
    const peak=3.2+r()*4.6;
    out.push({start,end:start+len,peak});
  }
  return out;
}
function gasSpikeNow(hourFloat){
  const h=hourFloat==null?(G.hour+G.min/60):hourFloat;
  let m=1;
  gasSpikes().forEach(sp=>{
    if(h>=sp.start&&h<sp.end){
      const k=(h-sp.start)/Math.max(0.5,sp.end-sp.start);
      m=Math.max(m,1+(sp.peak-1)*Math.sin(Math.PI*clamp(k,0,1)));
    }
  });
  return m;
}
function gasPct(hourFloat){
  const h=hourFloat==null?(G.hour+G.min/60):hourFloat;
  let p=0.20+0.40*gasWave(h);
  p*=gasSpikeNow(h);
  p*=todayEvent().gas;
  p*=gasPerkMult();
  p*=(1-(G.feeCut||0));
  p*=(1+chainLoad());               /* uso da rede empurra o gas */
  return clamp(p,GAS_FLOOR,GAS_CEIL);
}
function gasFee(hourFloat){return mintPrice()*gasPct(hourFloat);}
/* ---------- PRESSAO DE REDE ----------
   Toda assinatura na chain (mint, listagem, compra, aceitar oferta) empurra o
   gas um pouquinho pra cima, e a pressao vaza sozinha ao longo do dia. O Kaiju
   Spotter e o Kaki+ NAO tocam na chain — sao offchain, entao nao mexem no gas.
   O teto e baixo de proposito: isto e tempero, nao um segundo sistema. */
const CHAIN_DECAY=0.86, CHAIN_MAX=0.55;
function chainPush(n){
  G.chainLoad=clamp((+G.chainLoad||0)+0.018*(n||1),0,CHAIN_MAX);
}
function chainLoad(){return clamp(+G.chainLoad||0,0,CHAIN_MAX);}
/* ---------- QUANTO CUSTA LISTAR ----------
   Listar era literalmente de graca: dava pra listar tudo, cancelar, relistar
   mais caro, de graca, o dia inteiro. Agora a assinatura custa gas, so que
   uma fracao do que um mint custa — listar nao cunha nada. Em lote a
   assinatura e uma so, entao o lote sai bem mais barato por item. */
const LIST_GAS_SHARE=0.30;
function listFee(n){
  n=Math.max(1,n||1);
  const um=mintPrice()*gasPct()*LIST_GAS_SHARE;
  /* 1 item = 1x. Em lote: uma assinatura + 35% por item extra. */
  return um*(1+(n-1)*0.35);
}
function gasMood(){
  const p=gasPct();
  if(p<0.30)return 'cheap';
  if(p<0.75)return 'ok';
  if(p<1.60)return 'high';
  return 'insane';
}
/* ---------- CUSTO DE REPOSICAO ----------
   Cunhar um Kaiju novo AGORA custa o preco do mint mais o gas. Enquanto o gas
   estava calmo isso nem aparecia, mas com gas violento o jogador pagava $7 e o
   "fair" dizia $5,96 — ou seja, todo common nascia com prejuizo garantido, e
   isso desanima antes do jogo comecar.
   Uso a MEDIA do gas do dia, nao o instante: se fosse o instante, o floor
   pularia junto com cada pico de cinco minutos e o mercado ficaria histerico.
   Fica em cache por hora porque isso e chamado em toda carta da tela. */
let _gasRef={d:-1,h:-1,v:0};
function gasDayAvg(){
  if(_gasRef.d===G.day&&_gasRef.h===G.hour)return _gasRef.v;
  let soma=0,n=0;
  for(let h=8;h<=dayEndHour();h+=2){soma+=gasPct(h);n++;}
  _gasRef={d:G.day,h:G.hour,v:n?soma/n:gasPct()};
  return _gasRef.v;
}
/* o que custa por um Kaiju novo na mao, num dia normal */
function replaceCost(){return mintPrice()*(1+gasDayAvg());}

function floorPrice(){
  const lp=typeof listPressure==='function'?listPressure():0;
  const bruto=mintPrice()*(0.80+G.hype/100*1.70)*todayEvent().floor*(1-0.055*Math.min(3,lp));
  /* ninguem lista abaixo do que custa criar um novo. Nao e regra de lucro
     garantido — e 92%, entao um common ainda pode sair no vermelho de leve —
     mas o floor deixa de ignorar o gas. */
  return Math.max(bruto,replaceCost()*0.92);
}
function tokenValue(t){
  const v=floorPrice()*RARITY[t.rarity].mult*raceHeat(raceOf(t));
  /* raceHeat de uma raca fria chega a puxar abaixo do custo; o piso vale
     pro token tambem, senao a garantia do floor nao chega na carta */
  return Math.max(v,replaceCost()*0.90);
}
function npcMintRate(){return Math.max(0.05,Math.pow(Math.max(0,G.hype)/10,2.6)/6*todayEvent().npc);}
/* o corte cai conforme a colecao enche: 30% -> 16.5% no mintout. Ataca o motor
   de renda direto, sem mexer em mais nada. */
function royaltyRate(){
  const base=G.referral?0.40:0.30;
  return base*(1-0.18*(G.minted/SUPPLY));
}
/* ---------- O QUE SAIU DA MAQUINA ----------
   O "Your last mints" lia a carteira, entao vender um Kaiju apagava ele da
   tira — como se nunca tivesse sido mintado. Isto aqui e um REGISTRO: guarda
   os ultimos que sairam da sua maquina, e eles ficam mesmo depois de vendidos.
   Guardo so id/raridade/dia: o resto sai de metaOf() na hora de desenhar. */
const MINTLOG_MAX=24;
function mintLog(){
  if(!Array.isArray(G.mintLog))G.mintLog=[];
  return G.mintLog;
}
function mintLogAdd(tk){
  const L=mintLog();
  L.push({id:tk.id,r:tk.rarity,d:G.day});
  if(L.length>MINTLOG_MAX)G.mintLog=L.slice(-MINTLOG_MAX);
}
/* ---------- AS BOLINHAS DE AVISO ----------
   Uma bolinha diz "TEM COISA NOVA TE ESPERANDO AQUI DENTRO", nunca "voce
   possui alguma coisa". A do Kakizone acendia porque G.freeMints>0 — e o
   freemint continua no bolso depois de resgatado, entao ela nunca apagava.
   Tudo que acende bolinha passa por aqui, e so por aqui. */
function dotState(){
  if(!G)return {};
  const marcoPronto=[10,100,1000].some(r=>
    Math.max(held(),+G.peakHeld||0)>=r&&!(G.goals||[]).includes(r));
  return {
    free: (G.claimDay!==G.day)                       /* freemint do dia ainda nao resgatado */
       || (typeof questsPending==='function'&&questsPending()>0)  /* missao pronta pra receber */
       || marcoPronto,                               /* marco batido e nao resgatado */
    tax:  G.taxDue>0,
    spot: typeof spotOpenShift==='function'&&spotOpenShift(),
    hubmarket: (G.offers||[]).length>0,
    hubsocial: !!(G.social&&+G.social.unread>0)
  };
}
/* chamado por quem MUDA o estado, pra bolinha apagar na hora e nao "quando der" */
function refreshDots(){
  if(typeof UI==='undefined'||typeof document==='undefined')return;
  const st=dotState();
  Object.keys(st).forEach(k=>{
    const n=document.querySelector('#ndot_'+k);
    if(n)n.style.display=st[k]?'':'none';
  });
}
function held(){return G.tokens.length;}
function npcHeld(){return Math.max(0,G.minted-G.tokens.length);}
function levelOf(n){let l=1;for(let i=0;i<LEVELS.length;i++)if(n>=LEVELS[i].req)l=i+1;return l;}

/* ---------- APELIDO DA CARTEIRA ----------
   So minusculas, letras e numeros, ate 16. Sem acento, sem simbolo: e o nome
   que aparece no Kaki+ e no slot de save, e tem que caber em qualquer lugar. */
const NICK_MAX=16;
function cleanNick(v){
  return String(v==null?'':v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'')
    .slice(0,NICK_MAX);
}
function nickOf(){return G&&G.nick?G.nick:'you';}

/* ---------- EXP DO KAKI+ ----------
   Reagir certo no feed rende EXP. O EXP vale nivel, mas devagar e com teto:
   90 de EXP equivale a ter mais um Kaiju, ate no maximo XP_CAP. Nao da pra
   subir de nivel so lendo o feed — da pra encostar. */
const XP_PER_STEP=90, XP_CAP=12;
function xpBonus(){return Math.min(XP_CAP,Math.floor((+G.xp||0)/XP_PER_STEP));}
function xpNext(){
  const b=xpBonus();
  if(b>=XP_CAP)return null;
  return XP_PER_STEP-((+G.xp||0)%XP_PER_STEP);
}
function xpAdd(v){
  G.xp=Math.max(0,Math.floor((+G.xp||0)+v));
  return checkLevel();
}
/* ---------- MINT EM LOTE ----------
   Um upgrade de cada vez: x2, x3, x4 ... ate x10. Cada nivel custa mais que o
   anterior, e o jogador ve exatamente qual e o proximo. */
const BULK_MAX=10;
function bulkLevel(){return clamp(Math.floor(+(G&&G.bulk)||0),0,BULK_MAX-1);}
function maxBulk(){return 1+bulkLevel();}
function bulkCost(lv){lv=lv==null?bulkLevel():lv;return Math.round(110*Math.pow(1.92,lv));}
function bulkReqLevel(lv){lv=lv==null?bulkLevel():lv;return Math.min(9,1+Math.floor(lv*0.9));}
function upgradeBulk(){
  const lv=bulkLevel();
  if(lv>=BULK_MAX-1)return {err:'max'};
  if(G.bestLevel<bulkReqLevel(lv))return {err:'level',need:bulkReqLevel(lv)};
  const c=bulkCost(lv);
  if(G.money<c)return {err:'money',need:c};
  spend(c);G.bulk=lv+1;
  return {lv:lv+1,cost:c,qty:maxBulk()};
}
function bulkOptions(){
  const m=maxBulk();
  const out=[];
  for(let i=1;i<=m;i++)out.push(i);
  return out;
}
/* 16h uteis eram pouco pra quem tem carteira grande. 18h, 23h com a cafeteira.
   ATENCAO: o clamp da hora no migrate tem que caber nisso (34), senao um save
   gravado depois das 28h volta truncado e o dia "acaba" na hora errada. */
function dayEndHour(){return 26+(has('coffee')?5:0);}
function offerSlots(){return 3+(G.bestLevel>=3?1:0)+(G.bestLevel>=5?1:0)+(G.bestLevel>=8?1:0)+(has('mods')?2:0);}
/* ---------- STAKING ----------
   Rende por DIA, nao por hora: renda passiva nao pode depender de quantas
   horas o jogador queimou. Valor fixo por raridade, com um piso ligado ao
   floor pra nao ficar irrelevante no late game — e NAO ligado ao mintPrice,
   senao escala junto com o supply e vira renda infinita. */
const STAKE_SLOT_TIERS=[5,8,12,18,25,40];
const STAKE_SLOT_COST=[0,3500,9000,22000,55000,140000];
const STAKE_DAY=[1.2,2.0,4.0,9.0,22.0,70.0];
const STAKE_MIN_DAYS=10;
function stakeSlotLv(){return clamp(Math.floor(+(G&&G.stakeSlotLv)||0),0,STAKE_SLOT_TIERS.length-1);}
function stakeSlots(){return STAKE_SLOT_TIERS[stakeSlotLv()];}
function stakeSlotCost(lv){lv=lv==null?stakeSlotLv():lv;return STAKE_SLOT_COST[Math.min(lv+1,STAKE_SLOT_COST.length-1)];}
function stakeSlotMaxed(){return stakeSlotLv()>=STAKE_SLOT_TIERS.length-1;}
function stakeDaily(tk){
  const base=STAKE_DAY[tk.rarity]||STAKE_DAY[0];
  const soft=1+Math.min(1.5,floorPrice()/40);
  return base*soft*(has('vault')?1.6:1);
}
function stakeRate(t){return stakeDaily(t)/16;}   /* compat: mostrado por hora em telas antigas */
function stakedTokens(){return G.tokens.filter(t=>t.staked);}
function stakeYieldDay(){return stakedTokens().reduce((a,x)=>a+stakeDaily(x),0);}
function stakeFree(){return Math.max(0,stakeSlots()-stakedTokens().length);}
function stakeFull(){return stakeFree()<=0;}
function stakingOn(){return vaultUnlocked()&&!!G.stakeOn;}
function activateStaking(){
  if(!vaultUnlocked())return {err:'level'};
  if(G.stakeOn)return {err:'already'};
  G.stakeOn=true;return {ok:1};
}
function stakeDaysLeft(tk){
  if(!tk||!tk.staked)return 0;
  return Math.max(0,STAKE_MIN_DAYS-(G.day-(tk.stakedDay||G.day)));
}
function stakeLocked(tk){return !!(tk&&tk.staked)&&stakeDaysLeft(tk)>0;}
function stakeToken(tk){
  if(!stakingOn())return {err:'off'};
  if(!tk||tk.staked)return {err:'already'};
  if(stakeFull())return {err:'slots'};
  if(binderIds().has(tk.id))return {err:'binder'};
  tk.staked=true;tk.stakedDay=G.day;tk.listed=null;
  G.offers=G.offers.filter(o=>o.tk!==tk.id);
  return {ok:1,until:G.day+STAKE_MIN_DAYS};
}
function unstakeToken(tk){
  if(!tk||!tk.staked)return {err:'no'};
  if(stakeLocked(tk))return {err:'locked',left:stakeDaysLeft(tk)};
  tk.staked=false;tk.stakedDay=0;
  return {ok:1};
}
function upgradeStakeSlots(){
  if(stakeSlotMaxed())return {err:'max'};
  const c=stakeSlotCost();
  if(G.money<c)return {err:'money',need:c};
  spend(c);G.stakeSlotLv=stakeSlotLv()+1;
  return {lv:stakeSlotLv(),cost:c,slots:stakeSlots()};
}

/* ---------- BINDER ----------
   inBinder() em 38-app-binder.js chama binder(), que MUTA G.binder e chama
   t(). Nao da pra chamar isso de dentro do sellTick/offerTick, que rodam 6x
   por hora. Esta versao e pura e cacheada. */
let BIN_CACHE=null;
function binderDirty(){BIN_CACHE=null;}
function binderIds(){
  if(BIN_CACHE)return BIN_CACHE;
  const s=new Set();
  const B=G&&G.binder;
  if(B&&Array.isArray(B.pages))
    B.pages.forEach(p=>{if(Array.isArray(p.slots))p.slots.forEach(id=>{if(id!=null)s.add(id);});});
  BIN_CACHE=s;return s;
}
function binderTokens(){const s=binderIds();return G.tokens.filter(t=>s.has(t.id));}
/* livre pra qualquer coisa: nem no cofre, nem listado, nem arquivado.
   Um Kaiju no binder e uma peca de colecao, nao estoque. */
function sellableTokens(){
  const s=binderIds();
  return G.tokens.filter(t=>!t.staked&&t.listed==null&&!s.has(t.id));
}
/* 20 -> 60 por $150 era +200% de uma vez, e a carteira deixava de ser uma
   restricao interessante ja no dia 3. Agora e uma escada: o primeiro passo e
   20 -> 32, e cada degrau custa mais que o anterior. */
const CAP_STEPS=[20,32,48,70,110,180,320,600,1200,2600,SUPPLY];
function capLv(){return clamp(Math.floor(+(G&&G.capLv)||0),0,CAP_STEPS.length-1);}
function capacity(){return CAP_STEPS[capLv()];}
function capMaxed(){return capLv()>=CAP_STEPS.length-1;}
function capCost(lv){lv=lv==null?capLv():lv;return Math.round(120*Math.pow(2.25,lv));}
function capReqLevel(lv){lv=lv==null?capLv():lv;return Math.min(9,1+Math.floor(lv*0.85));}
function upgradeCap(){
  const lv=capLv();
  if(capMaxed())return {err:'max'};
  if(G.bestLevel<capReqLevel(lv))return {err:'level',need:capReqLevel(lv)};
  const c=capCost(lv);
  if(G.money<c)return {err:'money',need:c};
  spend(c);G.capLv=lv+1;
  return {lv:lv+1,cost:c,cap:capacity()};
}
const CAP_TIERS=[];
function capLeft(){return Math.max(0,capacity()-held());}
function nextCapUpgrade(){return capMaxed()?null:{lv:capLv()+1,cap:CAP_STEPS[capLv()+1],cost:capCost()};}
/* minting too much in one day floods your own market */
/* O jogo ficava facil depois do dia 3 porque NADA custava mais conforme o
   jogador crescia. Esta e a escada: entra no bleed, no piso do gas e na conta
   do Mr. Kaiju. */
function pressure(){
  return 1+Math.min(0.55,Math.max(0,G.day-3)*0.010+Math.max(0,G.bestLevel-2)*0.028);
}
/* joelho em 80 mints/dia (era 200) e teto 2.8x (era 2x): mintar muito num dia
   so encarece o SEU proprio mint mais rapido */
function saturation(){return 1+Math.min(1.35,Math.pow(Math.max(0,G.log.mint)/130,1.15));}
function securityActive(){return G.day<=G.secUntil;}
function securityCost(){return Math.max(35,Math.round(floorPrice()*7));}
const VAULT_LEVEL=6, REFERRAL_LEVEL=5, LISTALL_LEVEL=7;
/* LISTAR EM LOTE saia no nivel 3 e chegava no dia 3 — cedo demais: o jogador
   pulava a fase de escolher preco item a item, que e onde ele aprende o
   mercado. Nivel 5. */
function listAllUnlocked(){return G.bestLevel>=LISTALL_LEVEL&&has('listall');}
/* O meio-termo entre listar de um em um e despejar a carteira inteira. E aqui
   que mora a decisao interessante: "listo meus 40 commons a floor e seguro os
   raros". Libera antes do List All, que continua sendo so conveniencia. */
const LISTSOME_LEVEL=5;
function listSomeUnlocked(){return G.bestLevel>=LISTSOME_LEVEL;}
function vaultUnlocked(){return G.bestLevel>=VAULT_LEVEL;}
function referralUnlocked(){return G.bestLevel>=REFERRAL_LEVEL;}
/* the next ids waiting in the mint queue (Mint Queue Scanner upgrade) */
function queuePreview(n){
  const out=[];
  for(let i=0;i<n&&G.minted+i<SUPPLY;i++){
    const id=idAtMintIndex(G.minted+i);
    out.push({id,rarity:metaOf(id).rarity});
  }
  return out;
}
/* O scanner nao le a fila, le a PRESSAO dela: a chance de sair algo bom nos
   proximos N mints. Nunca diz qual. Ver "#4412 MYTHIC" antes de pagar mata a
   tensao inteira do reveal — e o perk custa $700 justamente pra dar vantagem,
   nao certeza. */
const QUEUE_WINDOW=10;
function queueOdds(n){
  n=n||QUEUE_WINDOW;
  const cnt=[0,0,0,0,0,0];let m=0;
  for(let i=0;i<n&&G.minted+i<SUPPLY;i++){cnt[metaOf(idAtMintIndex(G.minted+i)).rarity]++;m++;}
  if(!m)return null;
  const rare=(cnt[2]+cnt[3]+cnt[4]+cnt[5])/m;
  const epic=(cnt[3]+cnt[4]+cnt[5])/m;
  const myth=cnt[5]/m;
  return {window:m,rare,epic,myth,
    heat: myth>0?'myth':epic>=0.2?'hot':rare>=0.3?'warm':rare>0?'ok':'cold'};
}

/* ---------- money ---------- */
function earn(v){G.money+=v;G.log.earned+=v;G.totals.earned+=v;G.taxPeriodNet+=v;if(G.money>G.best)G.best=G.money;}
function spend(v){G.money-=v;G.log.spent+=v;G.totals.spent+=v;G.taxPeriodNet-=v;}
/* ninguem e famoso antes de ser grande. O teto sobe com a colecao e com o
   rank — e isso corta pela raiz o descontrole do npcMintRate, que e
   exponencial no hype. */
function hypeCap(){return clamp(62+38*(G.minted/SUPPLY)+G.bestLevel*1.8,62,100);}
function addHype(v){
  const cap=hypeCap();
  if(v>0)v*=Math.pow(1-clamp(G.hype/cap,0,1),1.15);
  const before=G.hype;
  G.hype=clamp(G.hype+v,0,Math.max(cap,G.hype));
  return G.hype-before;
}

/* ---------- time ---------- */
function candleOpen(){
  const fp=floorPrice();
  G.curCandle={o:fp,h:fp,l:fp,c:fp,v:0,hour:G.hour};
}
function candleTouch(){
  if(!G.curCandle)candleOpen();
  const c=G.curCandle;
  /* market noise: cosmetic wicks around the real floor, never touches the economy */
  const fp=floorPrice(), n=fp*(1+(Math.random()-0.5)*0.024);
  if(n>c.h)c.h=n; if(n<c.l)c.l=n;
  c.c=fp;
  if(fp>c.h)c.h=fp; if(fp<c.l)c.l=fp;
}
function candleClose(vol){
  if(!G.curCandle)candleOpen();
  const c=G.curCandle;c.v=(c.v||0)+(vol||0);
  G.icandles.push(c);
  if(G.icandles.length>72)G.icandles.shift();
  candleOpen();
}
function advance(mins){
  let end=false;
  for(let i=0;i<mins;i++){
    if(G.hour>=dayEndHour()){end=true;break;}
    G.min++;
    if(G.min%5===0)candleTouch();
    G._mkAcc=(G._mkAcc||0)+1;
    if(G._mkAcc>=MKT_STEP){G._mkAcc=0;marketTick();}
    if(G.min>=60){G.min=0;G.hour++;onHour();}
    if(G.hour>=dayEndHour()){G.hour=dayEndHour();G.min=0;end=true;break;}
  }
  candleTouch();
  return end;
}
/* the clock stops at the end of the day. it never puts the player to bed by itself. */
function dayIsOver(){return G.hour>=dayEndHour();}
function onHour(){
  if(typeof storyTick==='function')storyTick();
  /* a pressao de rede vaza sozinha: um dia parado devolve o gas ao normal */
  G.chainLoad=clamp((+G.chainLoad||0)*CHAIN_DECAY,0,CHAIN_MAX);
  let hourVol=0;
  if(!G.mintout){
    const rate=npcMintRate();
    let n=Math.floor(rate)+(chance(rate%1)?1:0);
    n=Math.min(n,SUPPLY-G.minted);
    if(n>0){
      G.minted+=n;hourVol+=n;
      G.npcMinted=(G.npcMinted||0)+n;
      TICK.npc=(TICK.npc||0)+n;
      if(G.referral)G.refMints+=n;
      const roy=n*mintPrice()*royaltyRate();
      earn(roy);G.log.royal+=roy;G.totals.royal+=roy;TICK.roy+=roy;
      if(typeof questBump==='function')questBump('royal',roy);
    }
    if(G.minted>=SUPPLY){G.minted=SUPPLY;G.mintout=true;onMintout();}
  }
  if(has('shill'))addHype(.30);
  /* o interesse nao para de pé sozinho: quanto mais alto, mais rapido escorre */
  const ev=todayEvent();
  /* segurar hype alto tem que dar trabalho: em 90 o vazamento quase dobrou */
  const bleed=(0.35+Math.pow(G.hype/100,1.45)*1.8)*ev.bleed*pressure()*(has('mods')?0.75:1);
  G.hype=clamp(G.hype-bleed,0,100);

  /* prazos sao contados em horas: vencem aqui, nao no tick de mercado */
  const L=mktList();
  for(let i=L.length-1;i>=0;i--){if(--L[i].ttl<=0)L.splice(i,1);}
  const before=G.offers.length;
  G.offers=G.offers.filter(o=>{o.ttl--;return o.ttl>0;});
  if(G.offers.length!==before)TICK.dirty=true;
  candleClose(hourVol+(TICK.mintedNow||0));TICK.mintedNow=0;
  if(typeof socialTick==='function')socialTick();
  if(typeof maybeStar==='function')maybeStar();
  if(maybeAudit()){SFX.tax&&SFX.tax();openAppAuto('tax');}
  maybeScam();
}


/* ================= O MERCADO REAGE =================
   Antes o jogo era uma linha reta pra cima: mintar sempre valia a pena.
   Agora cada dia tem um clima proprio, o hype vaza sozinho, o gas oscila
   dentro do dia e o floor cai junto quando o interesse some. */
const EVENTS=[
  {id:'pump', ico:'fire',   floor:1.06, sell:1.10, offer:1.05, gas:1.10, npc:1.10, hype:3,   bleed:0.9, race:1,
   n:{en:'Race pump',        pt:'Pump de raça'},
   d:{en:'Somebody decided one race is the good one today. It is not up to you.',
      pt:'Alguém decidiu que uma raça é a boa hoje. Não depende de você.'}},
  {id:'rug',  ico:'warn',   floor:0.94, sell:0.88, offer:0.90, gas:1.00, npc:0.90, hype:-4,  bleed:1.2, race:-1,
   n:{en:'Race dumped',      pt:'Raça dumpada'},
   d:{en:'One race got dumped into the floor. Everyone is pretending they saw it coming.',
      pt:'Uma raça foi despejada no floor. Todo mundo fingindo que viu vir.'}},
  {id:'wash', ico:'chart',  floor:1.26, sell:1.15, offer:1.10, gas:1.15, npc:1.10, hype:2,   bleed:1.0,
   n:{en:'Wash trading',     pt:'Wash trading'},
   d:{en:'The volume is fake and the floor is not real. Enjoy it while it lasts.',
      pt:'O volume é falso e o floor não é real. Aproveite enquanto dura.'}},
  {id:'cartel',ico:'market',floor:1.10, sell:0.80, offer:1.20, gas:1.00, npc:0.95, hype:0,   bleed:1.0,
   n:{en:'Holders agreed',   pt:'Os holders combinaram'},
   d:{en:'Somebody made a group chat. Nobody is listing below a number today.',
      pt:'Alguém fez um grupo. Ninguém lista abaixo de um número hoje.'}},
  {id:'calm', ico:'info',   floor:1.00, sell:1.00, offer:1.00, gas:1.00, npc:1.00, hype:0,   bleed:1.0, early:1,
   n:{en:'Quiet day',        pt:'Dia parado'},
   d:{en:'Nothing is happening. Nobody is looking at the collection.',
      pt:'Não está acontecendo nada. Ninguém está olhando pra coleção.'}},
  {id:'bull', ico:'fire',   floor:1.28, sell:1.45, offer:1.12, gas:1.20, npc:1.35, hype:6,   bleed:0.5, early:1,
   n:{en:'Bull run',         pt:'Bull run'},
   d:{en:'Everything is green. People are buying anything with a face on it.',
      pt:'Tudo verde. As pessoas estão comprando qualquer coisa com uma cara desenhada.'}},
  {id:'cold', ico:'warn',   floor:0.76, sell:0.50, offer:0.88, gas:0.80, npc:0.55, hype:-4,  bleed:1.7, early:0,
   n:{en:'Cold market',      pt:'Mercado frio'},
   d:{en:'Volume dried up. Listings are going to sit there for a while.',
      pt:'O volume secou. As listagens vão ficar paradas por um tempo.'}},
  {id:'dump', ico:'xerr',   floor:0.60, sell:0.62, offer:0.72, gas:1.00, npc:0.35, hype:-14, bleed:2.2, early:0,
   n:{en:'Whale dumped',     pt:'Baleia dumpou'},
   d:{en:'Somebody sold 300 Kaiju into the floor. The chart looks like a cliff.',
      pt:'Alguém jogou 300 Kaiju no floor. O gráfico virou um penhasco.'}},
  {id:'gas',  ico:'rocket', floor:1.00, sell:0.92, offer:1.00, gas:3.60, npc:0.70, hype:0,   bleed:1.2, early:0,
   n:{en:'Gas spike',        pt:'Pico de gas'},
   d:{en:'The whole chain is congested. Every transaction costs a fortune today.',
      pt:'A rede inteira está congestionada. Toda transação custa uma fortuna hoje.'}},
  {id:'fud',  ico:'warn',   floor:0.84, sell:0.72, offer:0.80, gas:1.00, npc:0.45, hype:-8,  bleed:2.8, early:0,
   n:{en:'FUD wave',         pt:'Onda de FUD'},
   d:{en:'Some account with a cartoon avatar is calling the project a rug. It is working.',
      pt:'Uma conta com foto de desenho está chamando o projeto de rug. E está funcionando.'}},
  {id:'viral',ico:'globe',  floor:1.14, sell:1.20, offer:1.06, gas:1.30, npc:1.70, hype:16,  bleed:0.6, early:1,
   n:{en:'Went viral',       pt:'Viralizou'},
   d:{en:'A post about the art blew up overnight. New people are showing up.',
      pt:'Um post sobre a arte estourou de madrugada. Gente nova está aparecendo.'}},
  {id:'whale',ico:'wallet', floor:1.16, sell:1.10, offer:1.34, gas:1.00, npc:1.15, hype:4,   bleed:0.8, early:0,
   n:{en:'A whale is buying',pt:'Uma baleia está comprando'},
   d:{en:'Someone with real money is sweeping. Offers are unusually generous.',
      pt:'Alguém com dinheiro de verdade está varrendo. As ofertas estão generosas.'}},
  {id:'audit',ico:'kaiju',  floor:0.94, sell:0.90, offer:0.94, gas:1.00, npc:0.85, hype:-3,  bleed:1.4, early:0,
   n:{en:'Mr. Kaiju is watching', pt:'Mr. Kaiju está de olho'},
   d:{en:'The accountant is going through the books. Everything feels slower.',
      pt:'O contador está passando os livros a limpo. Tudo parece mais lento.'}}
];
const EV=id=>EVENTS.find(e=>e.id===id)||EVENTS[0];
function todayEvent(){return EV(G.event||'calm');}
/* ---------- CALOR POR RACA (item 39) ----------
   O filtro por raca no market e na carteira era decorativo. Com o calor ele
   vira ferramenta de decisao: uma raca quente vale ate 1.9x, uma dumpada 0.45x.
   NUNCA entra no mintPrice — o custo de mintar nao pode depender da raca. */
function raceHeat(r){
  const h=(G.heat||{})[r];
  return h?clamp(+h.m||1,0.45,1.90):1;
}
function raceHeatMark(r){
  const m=raceHeat(r);
  return m>=1.25?'\u{1F525}':m<=0.8?'\u2744':'';
}
function heatTick(){
  if(!G.heat||typeof G.heat!=='object'){G.heat={};return;}
  Object.keys(G.heat).forEach(k=>{
    G.heat[k].ttl=(G.heat[k].ttl||0)-1;
    if(G.heat[k].ttl<=0)delete G.heat[k];
  });
}
function evName(e){return (e.n[LANG]||e.n.en);}
function evDesc(e){return (e.d[LANG]||e.d.en);}
/* Nos primeiros dias so entram climas suaves: o jogador ainda esta aprendendo. */
function rollEvent(){
  const soft=G.day<=3;
  const pool=EVENTS.filter(e=>soft?e.early:true);
  /* dias ruins ficam mais provaveis quanto mais alto o hype: o que sobe apanha */
  const w=pool.map(e=>{
    let k=1;
    if(e.id==='calm')k=2.2;
    if(e.floor<1)k*= (0.6+G.hype/100*1.9);
    if(e.floor>1)k*= (1.5-G.hype/100*0.8);
    if(e.id==='dump'&&G.day<6)k=0;
    return Math.max(0,k);
  });
  const tot=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot;
  for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0)return armEvent(pool[i]);}
  return 'calm';
}
/* alguns eventos escolhem uma raca alvo — e e essa raca que aparece no card */
function armEvent(e){
  if(e&&e.race){
    const r=pick(RACES);
    G.heat=G.heat&&typeof G.heat==='object'?G.heat:{};
    G.heat[r]={m:e.race>0?1.85:0.50,ttl:e.race>0?2:3};
    G.eventRace=r;
  } else G.eventRace=null;
  return e.id;
}
/* O gas passeia dentro do dia: mintar as 9h nao custa o mesmo que as 20h. */

/* A divulgacao e a unica alavanca do jogador contra o hype caindo — e cansa. */
/* ---------- COMPRAR HYPE ----------
   Estava roubado: $6,40 por +9 de hype no dia 1, e o hype e o motor de renda
   inteiro (o npcMintRate cresce na potencia 2,6 em cima dele). Comprar hype
   rendia mais que mintar, e mintar e o que o jogo pede pra voce fazer.
   Tres freios, todos leves:
   - o primeiro post do dia custa 3x o preco do mint, nao 1,6x
   - o ganho comeca em 6 pontos, nao 9, e cai mais rapido a cada post
   - e o post custa mais caro quanto MAIOR ja esta o hype: empurrar de 20 pra
     30 e barato, de 60 pra 70 e caro. Isso e o que acontece de verdade —
     atencao no topo custa mais. */
function shillCost(){
  const n=G.shills||0;
  /* Medido num bot de 45 dias: a primeira versao deste nerf (3,0x + queda de
     0,70) cortou o mint da colecao em 40% e a comunidade em 63% — nao corrigiu
     o exploit, travou o jogo inteiro. O que estava errado nao era o hype
     existir, era comprar hype render MAIS que mintar. Entao o freio ficou no
     lugar certo: o preco sobe com o hype que voce JA tem. Empurrar de 20 pra
     30 continua barato; de 60 pra 70 custa caro, que e onde o abuso morava. */
  const caro=1+Math.pow(Math.max(0,G.hype)/100,1.6)*1.2;
  return Math.max(7,mintPrice()*2.0*(1+n*0.55)*caro);
}
function shillGain(){return Math.max(2.2,7.5*Math.pow(0.78,G.shills||0));}
function doShill(){
  const c=shillCost();
  if(G.money<c)return {err:'money',need:c};
  spend(c);
  G.shills=(G.shills||0)+1;
  const got=addHype(shillGain());
  return {cost:c,got};
}

/* ---------- MR. KAIJU (item 34) ----------
   Era uma aliquota plana sobre lucro liquido, com tres linhas de UI e nenhuma
   explicacao. E o Offshore ($9000) derrubava de 20% pra 9%, praticamente
   desligando o unico sink do jogo. Agora a aliquota SOBE com o tamanho do
   jogador, e a fatura mostra de onde veio cada centavo. */
function emptyPer(){return {mints:0,sold:0,bought:0,listed:0};}
/* NERF DE 20% (pedido do Kiv: "ele ta tomando muito dinheiro da galera").
   O Mr. Kaiju e um Kaiju FALSO que cobra taxa de gente que nunca concordou
   com nada — satira de plataforma que vive de fee. A piada so funciona se
   doer um pouco, nao se quebrar o jogador. Toda a escada leva o mesmo corte,
   entao a forma da progressao continua igual, so mais leve. */
const TAX_NERF=0.80;
function taxRate(){
  const base=has('offsh')?0.11:0.20;
  const prog=0.022*Math.max(0,G.bestLevel-2)+0.07*(G.minted/SUPPLY);
  return clamp((base+prog)*TAX_NERF,0,0.46*TAX_NERF);
}
const TAX_LABEL={
  tx:   {en:'Transactions',    pt:'Transações'},
  power:{en:'Electricity',     pt:'Energia elétrica'},
  comm: {en:'Community',       pt:'Comunidade'},
  liq:  {en:'Liquidity',       pt:'Liquidez'},
  rent: {en:'Rent',            pt:'Aluguel'},
  inc:  {en:'Tax on profit',   pt:'Imposto sobre o lucro'}
};
function taxBill(part){
  const p=G.per||emptyPer(), mp=mintPrice();
  /* limita o periodo retroativo: um save antigo nao leva fatura de 40 dias */
  const d=Math.max(1,Math.min(6,G.day-(G.lastTaxDay||0)));
  const k=part||1;
  const rows=[
    ['tx',    0.04*mp*((p.mints||0)+(p.sold||0)+(p.bought||0)), (p.mints||0)+(p.sold||0)+(p.bought||0)],
    ['power', d*(4+0.9*Math.max(0,dayEndHour()-24))*pressure(), d],
    ['comm',  0.30*G.hype*(1+G.bestLevel*0.16)*d/3, Math.round(G.hype)],
    ['liq',   6*listPressure()*d, p.listed||0],
    ['rent',  (16+5*Math.floor(G.day/5))*d/3, d],
    ['inc',   Math.max(0,G.taxPeriodNet)*taxRate()/TAX_NERF, Math.round(taxRate()*100)]
  ].map(r=>[r[0],r[1]*k,r[2]]);
  /* o NERF de 20% vale pra fatura INTEIRA, nao so pro imposto sobre lucro.
     Metade da conta do Mr. Kaiju e taxa fixa inventada (luz, aluguel, "taxa de
     comunidade") — se so a aliquota cai, o jogador quase nao sente. */
  const total=rows.reduce((a,r)=>a+r[1],0)*TAX_NERF;
  return {rows:rows.map(r=>[r[0],r[1]*TAX_NERF,r[2]]),total:Math.max(5,total)};
}
/* de vez em quando ele aparece sem avisar. O evento 'audit' finalmente serve
   pra alguma coisa alem de mexer em multiplicadores. */
function maybeAudit(){
  if(G.taxDue>0||G.day<8)return;
  if(G.day-(G.lastAuditDay||0)<4)return;
  if(!chance(G.event==='audit'?0.045:0.015))return;
  G.lastAuditDay=G.day;
  const B=taxBill(0.55);
  G.taxDue=B.total;G.taxRows=B.rows;
  G.taxPeriodNet*=0.45;              /* cobra metade, nao zera o ciclo normal */
  return true;
}

/* ---------- PRESSAO DE LISTAGEM (item 14) ----------
   Listar nao custava NADA antes — nem na velocidade de venda, nem no floor,
   nem na percepcao da comunidade. Isso deixava a estrategia dominante ser
   "lista tudo, espera, repete". Agora a sua propria parede de listagens afoga
   o book: vende mais devagar e derruba o proprio floor. */
function listPressure(){
  const L=G.tokens.filter(x=>x.listed!=null).length;
  const depth=Math.max(10,npcHeld()*0.03+10);
  return clamp(L/depth,0,4);
}
function repScore(){return clamp(+G.rep||60,0,100);}
function repAdd(v){G.rep=clamp(repScore()+v,0,100);}

/* ---------- market ----------
   O mercado nao pode andar so de hora em hora. Parado, uma hora de jogo leva
   3min30 reais — o jogador achava que o jogo so vendia quando ele clicava. E
   como todas as listagens rolavam no mesmo instante, quando vendia, jorrava
   tudo junto. Agora roda a cada 10 minutos de jogo, com a probabilidade
   convertida direito (nao dividida) e um teto por passo. */
const MKT_STEP=10;
function perStep(pHour){return 1-Math.pow(1-clamp(pHour||0,0,0.999),MKT_STEP/60);}
function marketTick(){
  sellTick();
  mktTick();
  offerTick();
}
function sellTick(){
  const fp=floorPrice();
  const listed=G.tokens.filter(x=>!x.staked&&x.listed!=null);
  if(!listed.length)return;
  const cap=Math.max(1,Math.ceil(listed.length*0.30));
  let n=0,tot=0;
  listed.forEach(x=>{
    const fair=fp*RARITY[x.rarity].mult;
    /* teto por passo: o mercado pinga, nao jorra */
    if(n>=cap)return;
    const p=clamp(0.42*Math.pow(fair/x.listed,2.6),0,.8)*(0.22+G.hype/100)*(has('lister')?2:1)*todayEvent().sell
            /(1+0.55*listPressure())*(0.55+repScore()/100*0.75);
    if(chance(perStep(p))){
      const price=x.listed, ratio=price/Math.max(0.01,fair);
      if(ratio>=2.9){TICK.big=(TICK.big||0)+1;TICK.bigOne={id:x.id,rarity:x.rarity,price,ratio};G.achvBig=(G.achvBig||0)+1;}
      if(price>(G.bestSale||0))G.bestSale=price;
      removeToken(x.id);earn(price);tot+=price;n++;G.per.sold=(G.per.sold||0)+1;
    }
  });
  if(n){
    G.log.sold+=n;G.totals.sold+=n;addHype(.15*Math.sqrt(n));
    if(typeof questBump==='function')questBump('sold',n);
    TICK.sold+=n;TICK.soldVal+=tot;TICK.dirty=true;
  }
}

/* ================= O MERCADO SECUNDARIO =================
   Os 8888 Kaiju que nao estao na sua carteira pertencem a outras pessoas, e
   elas listam. Cada listagem tem dono, preco e prazo. Umas sao pechincha,
   outras sao gente sonhando alto. O clima do dia mexe nos dois lados. */
/* Mesma faxina dos compradores: fora o nome de folheto ("gm_gm_gm",
   "mint_or_die"), dentro handle curto de gente de server de arte. */
const SELLERS=['0xC0FFEE','glasshour','floorSweep','notArugpull','0xDEADBEEF','shonen.eth','ronin_09',
 'paperhands','nori7','0xF00D','plumfog','whale.eth','anon_4412','luma','tsuki_dat',
 'Stux','0xBADD','sushi_dev','coldstorage','ame'];
function mktSlots(){return 10+(G.bestLevel>=4?4:0)+(G.bestLevel>=7?4:0)+(has('mods')?4:0);}
function mktList(){if(!Array.isArray(G.mkt))G.mkt=[];return G.mkt;}
/* um id que ja foi mintado e nao e seu */
function freeMintedId(){
  if(G.minted<=0)return null;
  const mine=new Set(G.tokens.map(x=>x.id));
  const taken=new Set(mktList().map(l=>l.tk));
  for(let i=0;i<80;i++){
    const id=idAtMintIndex(Math.floor(Math.random()*G.minted));
    if(!mine.has(id)&&!taken.has(id))return id;
  }
  return null;
}
function makeMktListing(){
  const id=freeMintedId();
  if(id==null)return null;
  const tk=buildToken(id,G.day,false);
  const fair=tokenValue(tk);
  const ev=todayEvent();
  /* a maioria pede acima do justo. As pechinchas existem, mas sao raras — e
     ficam mais comuns quando o mercado esta frio. */
  const r=Math.random();
  let mult;
  if(r<0.10*(2-ev.floor))      mult=rf(0.55,0.82);   /* pechincha */
  else if(r<0.55)              mult=rf(0.88,1.20);   /* preco de mercado */
  else if(r<0.88)              mult=rf(1.20,1.85);   /* pedindo caro */
  else                         mult=rf(1.85,3.40);   /* sonhador */
  mult*=(0.85+ev.floor*0.15);
  const l={id:'m'+Math.random().toString(36).slice(2,9),tk:id,
    price:Math.max(0.5,fair*mult),who:pick(SELLERS),ttl:ri(4,14),born:G.day,fresh:1};
  mktList().push(l);
  return l;
}
function mktTick(){
  const L=mktList();
  /* prazos vencem, e outras pessoas tambem compram — o que esta barato some */
  for(let i=L.length-1;i>=0;i--){
    const l=L[i];
    if(l.ttl<=0){L.splice(i,1);continue;}
    const tk=buildToken(l.tk,l.born,false);
    const edge=tokenValue(tk)/Math.max(0.01,l.price);
    const p=clamp((edge-0.95)*0.55,0,0.7)*(0.25+G.hype/100)*todayEvent().sell;
    if(chance(perStep(p))){L.splice(i,1);TICK.mktGone=(TICK.mktGone||0)+1;}
  }
  const want=mktSlots();
  let add=0;
  while(L.length<want&&add<4){if(!makeMktListing())break;add++;}
  if(add)TICK.mktNew=(TICK.mktNew||0)+add;
}
function mktBuy(lid){
  const L=mktList();
  const i=L.findIndex(x=>x.id===lid);
  if(i<0)return {err:'gone'};
  const l=L[i];
  if(capLeft()<=0)return {err:'full'};
  if(G.money<l.price)return {err:'money',need:l.price};
  spend(l.price);
  L.splice(i,1);
  const tk=buildToken(l.tk,G.day,true);
  ownToken(tk);
  G.log.bought=(G.log.bought||0)+1;G.totals.bought=(G.totals.bought||0)+1;G.per.bought=(G.per.bought||0)+1;
  if(typeof questBump==='function')questBump('buy',1);
  if(typeof chainPush==='function')chainPush(0.8);
  addHype(.12);
  return {tk,price:l.price,who:l.who};
}

function offerTick(){
  if(!sellableTokens().length)return;
  if(offerTokens()>=offerSlots()&&G.offers.length>=offerSlots()*2)return;
  const base=(0.10+G.hype/100*0.55+(has('mods')?.12:0)+(has('whale')?.15:0))*(0.55+repScore()/100*0.75);
  if(!chance(perStep(base)))return;
  makeOffer(true);
}
/* Um mitico so podia ter um interessado por vez, o que e absurdo. Agora os
   slots contam TOKENS distintos, e o mesmo Kaiju pode juntar uma fila de
   lances — cada concorrente sobe a aposta. Aceitar um derruba os outros. */
function maxOffersFor(tk){return tk.rarity>=5?4:tk.rarity>=4?3:tk.rarity>=2?2:1;}
function offerTokens(){return new Set(G.offers.map(o=>o.tk)).size;}
function makeOffer(silent){
  const pool=sellableTokens();
  if(!pool.length)return null;
  const cheio=offerTokens()>=offerSlots();
  const conta=id=>G.offers.filter(o=>o.tk===id).length;
  /* elegiveis: quem ainda cabe mais um lance. Com os slots cheios, so quem ja
     tem oferta pode receber outra — e ai a disputa se concentra nos raros,
     que sao os unicos com teto acima de 1. */
  const elig=pool.filter(tk=>conta(tk.id)<maxOffersFor(tk)&&(!cheio||conta(tk.id)>0));
  if(!elig.length)return null;
  const x=elig.reduce((a,b)=>(RARITY[b.rarity].mult*Math.random()>RARITY[a.rarity].mult*Math.random()?b:a));
  const cur=conta(x.id);
  let mult=rf(.72,1.06);
  if(G.bestLevel>=7)mult*=1.08; if(G.bestLevel>=9)mult*=1.15; if(has('whale'))mult*=1.30;
  mult*=todayEvent().offer;
  if(cur>0)mult*=(1.09+0.055*cur);   /* guerra de lances */
  /* de vez em quando chega uma oferta insultuosa, com nick e frase a altura —
     e ela fica MAIS comum quando a sua reputacao esta ruim */
  const insulto=typeof lowballNick==='function'&&chance(clamp(0.42-repScore()/100*0.32,0.05,0.5));
  if(insulto)mult=rf(0.06,0.34);
  const o={id:'o'+Math.random().toString(36).slice(2,8),tk:x.id,
    who:insulto?lowballNick(x):pick(BUYERS),line:insulto?lowballLine():null,
    price:Math.max(1,tokenValue(x)*mult),ttl:cur>0?ri(2,5):ri(3,9),fresh:1};
  G.offers.push(o);TICK.offers++;TICK.dirty=true;
  if(!silent&&typeof UI!=='undefined'){SFX.notify();UI.toast('coin',t('New offer from {0}',o.who));UI.refresh();}
  return o;
}
function removeToken(id){
  const i=G.tokens.findIndex(x=>x.id===id);if(i>=0)G.tokens.splice(i,1);
  G.offers=G.offers.filter(o=>o.tk!==id);
}

/* ---------- sweeping the floor (buy back from holders) ---------- */
/* varrer o floor tem taxa de rede e 3% de royalty do time — que, como o time e
   a Oekaki e voce e holder, volta pra colecao. O sink real e a taxa. */
const SWEEP_ROY=0.03;
function maxSweep(){return Math.max(1,Math.min(npcHeld(),capLeft(),300));}
function sweepQuote(n){
  const avail=Math.min(npcHeld(),capLeft());
  n=Math.min(Math.max(0,Math.floor(n||0)),avail);
  if(n<=0)return {n:0,gross:0,fee:0,roy:0,cost:0};
  const fp=floorPrice();
  let gross=0;
  for(let i=0;i<n;i++)gross+=fp*(1.06+0.0016*i);
  const fee=n*gasFee()*0.35;
  const roy=gross*SWEEP_ROY;
  return {n,gross,fee,roy,cost:gross+fee+roy};
}
function sweepFloor(n){
  const q=sweepQuote(n);
  if(q.n<=0)return {err:'empty'};
  if(q.cost>G.money+1e-9)return {err:'money',need:q.cost};
  spend(q.cost);
  const ownedIds=new Set(G.tokens.map(x=>x.id));
  const got=[];
  let guard=0;
  while(got.length<q.n&&guard<q.n*60+400){
    guard++;
    const id=idAtMintIndex(Math.floor(Math.random()*G.minted));
    if(ownedIds.has(id))continue;
    ownedIds.add(id);
    const tk=buildToken(id,G.day,true);
    ownToken(tk);got.push(tk);
  }
  /* se o guard cortou antes de completar, devolve o que nao foi entregue —
     antes o jogador pagava por n e recebia menos */
  if(got.length<q.n){
    const back=q.cost*(1-got.length/q.n);
    if(back>0.005)earn(back);
  }
  /* o royalty do time volta pra voce: voce E holder da colecao */
  if(q.roy>0.005){earn(q.roy);G.log.royal+=q.roy;G.totals.royal+=q.roy;}
  addHype(0.12*Math.sqrt(got.length));
  G.log.bought+=got.length;G.totals.bought+=got.length;
  G.per.bought=(G.per.bought||0)+got.length;
  return {got,cost:q.cost,roy:q.roy,fee:q.fee};
}

/* ---------- actions ---------- */
function doMint(qty){
  if(G.mintout||G.minted>=SUPPLY){G.mintout=true;return null;}
  qty=Math.max(1,Math.min(qty,SUPPLY-G.minted));
  if(capLeft()<=0)return {err:'full'};
  if(qty>capLeft())qty=capLeft();
  const sat=saturation();
  const mp=mintPrice()*sat,gf=gasFee();
  const free=Math.min(G.freeMints,qty);
  const disc=G.coupon>0?(1-G.coupon/100):1;
  /* o freemint dispensa o preco do mint, nunca o gas: a rede cobra do mesmo jeito */
  const cost=(qty-free)*mp*disc+qty*gf;
  if(cost>G.money+1e-9)return {err:'money',need:cost};
  spend(cost);G.freeMints-=free;if(G.coupon>0&&qty>free)G.coupon=0;
  const made=[];
  for(let i=0;i<qty;i++){
    const tk=buildToken(idAtMintIndex(G.minted),G.day,true);
    G.minted++;ownToken(tk);made.push(tk);G.per.mints=(G.per.mints||0)+1;
    mintLogAdd(tk);
    if(typeof questBump==='function')questBump('mint',1);
  }
  chainPush(qty*0.9);
  G.log.mint+=qty;G.totals.mint+=qty;G.myMinted=(G.myMinted||0)+qty;
  addHype(Math.min(3.5,Math.max(0.8,0.35*Math.sqrt(qty)))/(1+(sat-1)*0.5));
  TICK.mintedNow+=qty;
  if(G.minted>=SUPPLY){G.minted=SUPPLY;G.mintout=true;onMintout();}
  /* o gas que ESTE mint pagou, pra alguem poder comentar depois: "vi quanto
     voce pagou pra mintar isso". O mundo reage ao que o jogador faz. */
  G.lastMintGas=gasPct();
  if(typeof storyTick==='function')storyTick();
  /* de vez em quando o Stux paga um do bolso dele e manda junto */
  if(typeof stuxGift==='function')stuxGift();
  return {made,cost,free};
}
function acceptOffer(oid){
  const o=G.offers.find(x=>x.id===oid);if(!o)return null;
  const tk=G.tokens.find(x=>x.id===o.tk);
  G.offers=G.offers.filter(x=>x.id!==oid);
  if(!tk)return null;
  removeToken(tk.id);earn(o.price);G.log.sold++;G.totals.sold++;addHype(.18);chainPush(0.7);
  return o;
}
/* O nivel vem do MAIOR numero de Kaiju que o jogador ja segurou, nunca do
   numero atual. Antes ele caia toda vez que o jogador vendia — e vender e o
   jeito de ganhar dinheiro — entao o jogo anunciava "nivel 3" pra sempre. */
function checkLevel(){
  G.peakHeld=Math.max(G.peakHeld||0,held());
  const nl=levelOf(G.peakHeld+xpBonus());
  const prev=Math.max(1,G.bestLevel||1);
  G.level=Math.max(nl,prev);
  G.bestLevel=G.level;
  if(G.level>prev){
    if(typeof UI!=='undefined')UI.levelUp(prev,G.level);
    /* subir de rank e o gatilho mais forte da historia: e onde a loja, o
       fichario e o cofre chegam. Espera a tela de nivel sair antes de falar. */
    if(typeof storyTick==='function')setTimeout(storyTick,2600);
    return true;
  }
  if(typeof storyTick==='function')storyTick();
  return false;
}

/* ---------- day / tax ---------- */
function dailyCandle(){
  const day=G.icandles.slice(-(dayEndHour()-8));
  if(!day.length)return;
  const c={o:day[0].o,c:day[day.length-1].c,
    h:Math.max.apply(null,day.map(x=>x.h)),
    l:Math.min.apply(null,day.map(x=>x.l)),
    v:day.reduce((a,x)=>a+(x.v||0),0),day:G.day};
  G.candles.push(c);
  if(G.candles.length>60)G.candles.shift();
}
/* ---------- O PRIMEIRO HACK E ROTEIRIZADO ----------
   A Kaiju Shop nao se apresenta sozinha: o jogador precisa de um MOTIVO pra
   abrir a loja, e o motivo e acordar no dia 6 com menos dinheiro. A noite do
   dia 5 pro 6 e sempre um hack, de dinheiro (perder Kaiju no tutorial e cruel),
   e a historia (58-story.js) le G.hackTut pra saber que pode falar disso.
   Antes dessa noite NAO existe hack aleatorio: o roteirizado tem que ser o
   primeiro, senao a fala "voce foi hackeado!" chega atrasada. */
const HACK_TUT_DAY=7;   /* o dia em que o jogador ACORDA hackeado — o hack mudou pro dia 7 quando o dono espalhou o calendario */
const HACK_TUT_MIN=4;   /* piso da mordida, em $ */
function hackTutorial(){
  /* rollHack roda depois de G.day++, entao G.day ja e a manha seguinte. Um
     save antigo que ja passou do dia 6 sem o campo nunca cai aqui: a
     igualdade estrita e a prova de retroativo. */
  if(G.day!==HACK_TUT_DAY||G.hackTut)return null;
  G.hackTut=G.day;
  /* a mordida tem que doer sem arruinar: 25% a 40%, nunca menos de $4 (com
     $8 no bolso, 25% seria $2 e ninguem sentiria). Quem tem pouco leva o que
     der, mas o jogador nunca acorda com menos de $1 — precisa mintar. */
  const bite=Math.max(HACK_TUT_MIN,G.money*rf(.25,.40));
  const amount=Math.max(0,Math.min(bite,G.money-1));
  if(amount>0)spend(amount);
  return {kind:'money',amount,who:pick(HACKERS),tut:1};
}
function rollHack(){
  /* o roteirizado ignora antivirus e sorte — ele E o roteiro */
  const tut=hackTutorial();
  if(tut)return tut;
  if(securityActive())return null;
  let p=0.20;
  if(G.referral)p+=0.06;
  if(G.money>20000)p+=0.06;
  /* nada de sorte antes da noite roteirizada (que e G.day===HACK_TUT_DAY) */
  if(G.day<=HACK_TUT_DAY)p=0;
  if(!chance(p))return null;
  const kind=chance(.55)?'money':'nft';
  if(kind==='money'){
    const amount=Math.min(G.money,G.money*rf(.08,.22));
    if(amount<1)return null;
    spend(amount);
    return {kind:'money',amount,who:pick(HACKERS)};
  }
  const pool=G.tokens.filter(x=>!x.staked);
  if(!pool.length)return null;
  const n=Math.min(pool.length,ri(1,4));
  const taken=[];
  for(let i=0;i<n;i++){const x=pick(pool);if(taken.indexOf(x.id)<0){taken.push(x.id);removeToken(x.id);}}
  return {kind:'nft',ids:taken,who:pick(HACKERS)};
}
function endDay(){
  dailyCandle();
  const l=Object.assign({},G.log);
  l.day=G.day;l.net=l.earned-l.spent-l.tax;
  G.hist.push(l);if(G.hist.length>40)G.hist.shift();
  G.priceHist.push(Math.round(floorPrice()*100)/100);if(G.priceHist.length>30)G.priceHist.shift();
  /* Spam de listagem cobra no fechamento: o mercado te ve como quem despeja.
     Listar com conta continua de graca — o soft cap sobe com o rank. */
  const _soft=8+G.bestLevel*4;
  const _over=Math.max(0,(G.log.listed||0)-_soft);
  if(_over>0){
    const hit=Math.min(12,_over*0.22);
    G.hype=clamp(G.hype-hit,0,100);
    repAdd(-Math.min(9,_over*0.15));
    G.spamDay={n:G.log.listed||0,hit:+hit.toFixed(1),cap:_soft};
  } else {repAdd(1.2);G.spamDay=null;}
  heatTick();
  if(typeof socialEndDay==='function')socialEndDay();
  if(typeof checkAchievements==='function')checkAchievements();
  if(typeof rollQuests==='function'){rollQuests();questSync();}
  /* conquistas: lucrou apesar de um evento ruim? */
  if(todayEvent().floor<1&&(G.log.earned-G.log.spent)>0)G.achvStorm=(G.achvStorm||0)+1;
  if(stakedTokens().filter(x=>G.day-(x.stakedDay||G.day)>=10).length>=5)G.achvVault=1;
  /* staking paga uma vez por dia, no fechamento */
  const _sy=stakeYieldDay();
  if(_sy>0){earn(_sy);G.log.stake=(G.log.stake||0)+_sy;G.totals.stake=(G.totals.stake||0)+_sy;}
  G.day++;G.hour=8;G.min=0;G.overWarned=0;G.warned={};
  /* FURO: G.shills=0 fazia o jogador recomprar o primeiro shill barato com
     ganho cheio todo santo dia, pra sempre. A fadiga agora atravessa o dia. */
  G.shills=Math.floor((G.shills||0)*0.30);
  G.log=Object.assign({},EMPTY_LOG);
  G.event=rollEvent();
  if(G.stipend>0){earn(G.stipend);G.log.earned=G.log.earned;}
  /* FURO: o hype de evento entrava cru, entao um 'viral' dava +16 mesmo com
     hype 95, onde qualquer outra fonte daria +0.4. Positivo agora amortece;
     negativo continua cru — quem sobe apanha. */
  {const eh=EV(G.event).hype;
   if(eh>0)addHype(eh); else G.hype=clamp(G.hype+eh,0,100);}
  G.freeMints++;
  G.hype=Math.max(1.2,G.hype*0.94);   /* piso 1.2, decai 6% por noite */
  G.lastHack=rollHack();
  G.scamsToday=0;
  if(G.day-G.lastTaxDay>=3&&!G.taxDue){
    const B=taxBill();
    G.taxDue=B.total;G.taxRows=B.rows;
    G.lastTaxDay=G.day;G.taxPeriodNet=0;G.per=emptyPer();
  }
  return l;
}
function payTax(){
  if(G.money<G.taxDue)return false;
  const owed=G.taxDue;
  spend(owed);G.log.tax+=owed;G.totals.tax+=owed;
  /* quanto foi a ULTIMA cobranca — o Stux devolve 30% dela na primeira vez
     (ver b_tax_paid e stuxTaxHelp em 58-story.js) */
  G.lastTaxPaid=owed;
  G.taxDue=0;save();return true;
}
/* Um Kaiju trancado no cofre ou arquivado no album nao pode ser tomado — a
   trava tem que valer pros dois lados. Mas "staka tudo" nao pode virar uma
   forma de sonegar: o que sobrar da divida ROLA pro proximo ciclo com juros,
   e o hype apanha junto. Devendo, o Mr. Kaiju so aperta mais. */
const TAX_ROLL=1.18;
function seizeForTax(){
  let owed=G.taxDue,taken=0;
  const bs=binderIds();
  const order=G.tokens.filter(x=>!stakeLocked(x)&&!bs.has(x.id))
                      .sort((a,b)=>(a.staked?1:0)-(b.staked?1:0)||a.rarity-b.rarity);
  while(owed>0&&order.length){
    const x=order.shift();const v=tokenValue(x)*.7;
    removeToken(x.id);owed-=v;taken++;
  }
  let cash=0;
  if(owed>0&&G.money>0){cash=Math.min(G.money,owed);spend(cash);owed-=cash;}
  const settled=G.taxDue-Math.max(0,owed);
  G.log.tax+=settled;G.totals.tax+=settled;
  const rolled=owed>0?owed*TAX_ROLL:0;
  G.taxDue=rolled;
  G.hype=clamp(G.hype-(rolled>0?16:9),0,100);
  return {taken,cash,rolled};
}
