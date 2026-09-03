/* ================= KAIJU SPOTTER — o turno de catalogação =================
   O comeco do jogo e parado de proposito: $40, um mint por vez, e horas
   sobrando. Mas "parado de proposito" nao pode virar "nao tem nada pra fazer".
   Isto aqui e o que o jogador faz enquanto espera dinheiro entrar.

   A ideia: a comunidade esta catalogando a colecao ANTES do mint e paga uma
   ninharia por tag conferida. O jogador olha a arte e diz o que ta vendo.
   Seis entradas por dia, quatro minutos cada. Paga pouco de proposito —
   e distracao com troco, nao torneira. Por volta do dia 12 o royalty de uma
   venda paga o turno inteiro, e ai o Spotter vira o que tem que ser: uma
   coisa que voce fazia quando era pobre.

   O que ele DA de verdade nao e dinheiro: e olho. Depois de uma semana o
   jogador reconhece um Archangel de longe e para de vender rank baixo achando
   que era raro. Isso vale mais que os $17 do turno.

   SPOILER — regra do projeto: aqui NAO aparece o numero do token. A entrada
   tem um numero de ficha falso, tirado do proprio embaralhamento. O jogo
   publico nao carrega o mapa id->arte, entao nem essa tela nem nenhuma outra
   diz qual e o proximo mint da vida real. */

/* ---------- O TAMANHO DO TURNO ----------
   Comecava com seis fichas pagando $2,90 — muito dinheiro pra quem tem $40 na
   carteira, e o turno inteiro de cara. Agora o turno CRESCE com voce: tres
   fichas no nivel 1, mais uma a cada rank, ate oito. A fila de catalogacao
   confiar mais em quem ja provou que sabe ler a colecao e a desculpa, e a
   mecanica e a recompensa de subir de rank.
   O pagamento tambem desceu: $1,32 por tag no dia 1, um turno perfeito paga
   pouco mais que um mint. */
const SPOT_MIN=4, SPOT_MIN_ROUNDS=3, SPOT_MAX_ROUNDS=8;
function spotRounds(){
  return clamp(2+(+G.bestLevel||1),SPOT_MIN_ROUNDS,SPOT_MAX_ROUNDS);
}
/* quantas fichas o turno DE HOJE tem — fica congelado no dia, senao subir de
   nivel no meio do turno mudaria o alvo debaixo do pe do jogador */
function spotN(){
  const s=spotState();
  return clamp(+s.n||spotRounds(),SPOT_MIN_ROUNDS,SPOT_MAX_ROUNDS);
}

/* Eixos que a ARTE mostra. Nada de "Name" (nao da pra ver) nem "Background"
   (321 nomes parecidos demais — vira loteria, e loteria irrita). */
/* Quanto da colecao TEM cada traco (medido em cima dos 8888):
   Race 100% · Tone 54% · Held 35% · Hat 30% · Accessory 29% · Face 14% ·
   Buddy 5,5% · Fur 4,5% · Armor 3,9% · Wings 3,2% · Aura 2,2%.
   Os raros entram pouco de proposito: a graca deles e serem raros. */
const SPOT_AXES=[
  {k:'Race',   w:26, q:'Which race is this one?',        qp:'Qual é a raça dessa?'},
  {k:'Held',   w:15, q:'What is it holding?',            qp:'O que ela está segurando?'},
  {k:'Hat',    w:14, q:'What is on its head?',           qp:'O que tem na cabeça dela?'},
  {k:'Accessory',w:12,q:'Which accessory is it wearing?',qp:'Que acessório ela está usando?'},
  {k:'Tone',   w:9,  q:'What tone is the skin?',         qp:'Qual é o tom da pele?'},
  {k:'Face',   w:8,  q:'What is on its face?',           qp:'O que tem no rosto dela?'},
  {k:'Buddy',  w:5,  q:'Who is tagging along?',          qp:'Quem está junto?'},
  {k:'Wings',  w:4,  q:'What kind of wings?',            qp:'Que tipo de asa?'},
  {k:'Fur',    w:3,  q:'What colour is the fur?',        qp:'Qual é a cor do pelo?'},
  {k:'Armor Primary', w:2, q:'Primary armor colour?',    qp:'Cor primária da armadura?'},
  {k:'Aura',   w:2,  q:'What is the aura?',              qp:'Qual é a aura?'}
];

/* ---------- reputacao ----------
   Sobe 1 por tag certa e nunca desce. So mexe no pagamento, e pouco: o teto
   e 1,75x de uma quantia que ja e pequena. Serve pra ter um numero subindo. */
const SPOT_TIERS=[
  {at:0,   mult:1.00, en:'Intern',      pt:'Estagiário'},
  {at:25,  mult:1.15, en:'Tagger',      pt:'Etiquetador'},
  {at:70,  mult:1.30, en:'Cataloguer',  pt:'Catalogador'},
  {at:150, mult:1.50, en:'Curator',     pt:'Curador'},
  {at:300, mult:1.75, en:'Archivist',   pt:'Arquivista'}
];
function spotTier(){
  const r=spotState().rep;
  let out=SPOT_TIERS[0];
  SPOT_TIERS.forEach(x=>{if(r>=x.at)out=x;});
  return out;
}
function spotTierName(){const x=spotTier();return LANG==='pt'?x.pt:x.en;}
function spotNextTier(){
  const r=spotState().rep;
  return SPOT_TIERS.find(x=>r<x.at)||null;
}

function spotState(){
  if(!G.spot||typeof G.spot!=='object')G.spot={day:0,i:0,ok:0,rep:0,best:0,shifts:0,ans:[]};
  const s=G.spot;
  s.rep=+s.rep||0; s.best=+s.best||0; s.shifts=+s.shifts||0;
  s.i=+s.i||0; s.ok=+s.ok||0;
  if(!Array.isArray(s.ans))s.ans=[];
  return s;
}
/* pagamento por tag certa: pequeno, e amarrado ao preco do mint so pra nao
   virar literalmente zero no dia 30. Dia 1: ~$2,90. */
function spotPay(){return (0.6+0.18*mintPrice())*spotTier().mult;}
function spotBonus(){return spotPay()*1.5;}

/* ---------- as seis fichas do dia ----------
   Determinístico: mesma semente, mesmo dia, mesmas fichas. Recarregar a pagina
   nao sorteia perguntas mais faceis. */
function spotRoll(){
  const s=spotState();
  if(s.day===G.day&&Array.isArray(s.q)&&s.q.length===spotN())return s.q;
  const r=mulberry(hash32('kakispot|'+mintSeed()+'|'+G.day));
  const qs=[], usados={}, conta={};
  let guard=0;
  const sorteiaEixo=()=>{
    /* no maximo DOIS do mesmo eixo por turno: seis perguntas de raca seguidas
       nao e turno, e teste de paciencia */
    const livres=SPOT_AXES.filter(a=>(conta[a.k]||0)<2);
    const pool=livres.length?livres:SPOT_AXES;
    const tot=pool.reduce((a,b)=>a+b.w,0);
    let n=r()*tot;
    for(const a of pool){n-=a.w;if(n<=0)return a;}
    return pool[pool.length-1];
  };
  const N=spotRounds();
  while(qs.length<N&&guard++<900){
    let ax=sorteiaEixo();
    /* acha um token que TENHA esse traco. Aura aparece em 2% da colecao, entao
       200 tentativas — e se mesmo assim nao achar, cai pra Race, que todo mundo
       tem. Melhor uma pergunta a mais de raca do que um turno de cinco fichas. */
    let id=0, val='';
    for(let k=0;k<200;k++){
      const cand=1+Math.floor(r()*KK_META.n);
      const v=metaOf(cand).traits[ax.k];
      if(v&&!usados[cand]){id=cand;val=v;break;}
    }
    if(!id){
      ax=SPOT_AXES[0];
      for(let k=0;k<200&&!id;k++){
        const cand=1+Math.floor(r()*KK_META.n);
        if(!usados[cand]){id=cand;val=metaOf(cand).traits.Race||'';}
      }
      if(!id||!val)continue;
    }
    /* tres distratores reais do mesmo traco — nome inventado denunciaria a
       resposta na hora */
    const alt=[];
    for(let k=0;k<400&&alt.length<3;k++){
      const v=metaOf(1+Math.floor(r()*KK_META.n)).traits[ax.k];
      if(v&&v!==val&&alt.indexOf(v)<0)alt.push(v);
    }
    if(alt.length<3){
      const dict=KK_META.dict[ax.k]||[];
      for(let k=0;k<dict.length*3&&alt.length<3;k++){
        const v=dict[Math.floor(r()*dict.length)];
        if(v&&v!==val&&alt.indexOf(v)<0)alt.push(v);
      }
    }
    if(alt.length<3)continue;
    usados[id]=1;conta[ax.k]=(conta[ax.k]||0)+1;
    const opts=alt.concat([val]);
    for(let k=opts.length-1;k>0;k--){const j=Math.floor(r()*(k+1));const tmp=opts[k];opts[k]=opts[j];opts[j]=tmp;}
    /* ficha de arquivo: NAO e o id do token. So um numero bonito e estavel.
       Regra do projeto: nada nesta tela pode ligar arte a numero de mint. */
    const slip=String(1000+Math.floor(r()*8999))+'-'+'ABCDEFGH'[Math.floor(r()*8)];
    qs.push({id,ax:ax.k,val,opts,slip});
  }
  s.day=G.day;s.q=qs;s.n=qs.length;s.i=0;s.ok=0;s.ans=[];s.pend=null;
  save();
  return qs;
}
function spotAxis(k){return SPOT_AXES.find(a=>a.k===k)||SPOT_AXES[0];}
function spotDone(){const s=spotState();return s.day===G.day&&s.i>=spotN();}
function spotOpenShift(){const s=spotState();return !(s.day===G.day&&s.i>=spotN());}

/* ---------- linhas de sabor ----------
   Ninguem le a mesma frase seis vezes por dia sem odiar o jogo. */
const SPOT_YAY={
 en:['Logged.','Matches the sheet.','Clean tag.','That one was obvious and you still get paid.',
     'Confirmed by two other taggers.','Nice eye.','Filed.','Right on the first look.'],
 pt:['Registrado.','Bate com a planilha.','Tag limpa.','Essa era óbvia e você ganha igual.',
     'Confirmado por outros dois.','Bom olho.','Arquivado.','Certo de primeira.']
};
const SPOT_NAY={
 en:['Not this one.','Someone will fix it later.','Close. Not it.','The sheet disagrees.',
     'Rejected by review.','Wrong, but honestly fair.','No pay for that one.'],
 pt:['Essa não.','Alguém corrige depois.','Perto. Não é.','A planilha discorda.',
     'Recusado na revisão.','Errado, mas justo.','Essa não paga.']
};
const SPOT_HELLO={
 en:["Six entries came in overnight. Same rate as always.",
     "The queue never empties. Take six.",
     "Nobody is paying much for this. You are here anyway.",
     "Six untagged busts. Tag what you can actually see.",
     "The catalogue is behind. It is always behind."],
 pt:["Chegaram seis entradas de madrugada. Mesma taxa de sempre.",
     "A fila nunca esvazia. Pega seis.",
     "Ninguém paga bem por isso. Você está aqui do mesmo jeito.",
     "Seis bustos sem tag. Marca o que der pra ver mesmo.",
     "O catálogo está atrasado. Sempre está."]
};

/* O resultado de uma ficha mora no SAVE, nao no DOM.
   Isto aqui foi um bug de verdade: responder chama timeAct() -> flushTick() ->
   UI.refresh(), que re-renderiza o app inteiro. O "Certo! +$2,90" e o botao
   PROXIMA FICHA sumiam meio segundo depois de aparecer, e o clique seguinte
   caia num lock preso. Com o resultado em G.spot.pend, re-renderizar quantas
   vezes quiser mostra sempre a mesma coisa — e fechar o jogo no meio da ficha
   devolve o jogador exatamente onde ele estava. */
function spotAnswer(sel){
  const s=spotState(), qs=spotRoll();
  if(s.pend||s.i>=spotN())return null;
  const q=qs[s.i];
  const ok=(sel===q.val);
  let paid=0;
  if(ok){
    paid=spotPay();
    earn(paid);
    s.ok++;s.rep++;
    xpAdd(2);
  }
  s.ans.push({sel,ok:ok?1:0,pay:paid});
  s.i++;
  let bonus=0;
  const N=spotN();
  if(s.i>=N){
    s.shifts++;
    if(s.ok>s.best)s.best=s.ok;
    if(s.ok===N){bonus=spotBonus();earn(bonus);xpAdd(8);}
  }
  /* a frase de sabor tambem e sorteada UMA vez e guardada: se ela fosse
     escolhida no render, cada refresh trocaria o texto na cara do jogador */
  s.pend={sel,ok:ok?1:0,pay:paid,bonus,fim:s.i>=N,
          say:pick(ok?(LANG==='pt'?SPOT_YAY.pt:SPOT_YAY.en):(LANG==='pt'?SPOT_NAY.pt:SPOT_NAY.en)),
          val:q.val,opts:q.opts,slip:q.slip,ax:q.ax,art:q.id};
  timeAct(SPOT_MIN);
  save();
  return s.pend;
}
function spotNext(){
  const s=spotState();
  s.pend=null;save();
}

/* ================= APP ================= */
APPS.spot={
  title:'Kaiju Spotter', icon:'book', w:440, h:600,
  build(b,ent){
    b.innerHTML='<div class="sproot"></div>';
    this.refresh(b,ent);
    if(spotOpenShift())UI.think(pick(LANG==='pt'?SPOT_HELLO.pt:SPOT_HELLO.en),true);
  },
  refresh(b,ent){
    const root=$('.sproot',b);if(!root)return;
    const s=spotState(), qs=spotRoll();
    const prox=spotNextTier();
    const N=spotN();
    const feito=Math.min(N,s.i);
    const head=`<div class="sp-head">
        <div class="sp-hl">
          <b class="sp-ttl">${t('CATALOGUING SHIFT')}</b>
          <span class="sp-rep">${t('Rep')}: <b>${spotTierName()}</b></span>
        </div>
        <div class="sp-pips">${qs.map((q,i)=>{
          const a=s.ans[i];
          return `<i class="${i<s.i?(a&&a.ok?'hit':'miss'):(i===s.i?'now':'')}"></i>`;
        }).join('')}</div>
        <div class="sp-sub">${t('{0} of {1} tagged today',feito,N)} · ${t('{0} per correct tag',money(spotPay()))}${
          spotRounds()<SPOT_MAX_ROUNDS?' · '+t('next rank: {0} entries',spotRounds()+1):''}</div>
      </div>`;

    /* ---------- 1. tem uma ficha respondida esperando o OK do jogador ---------- */
    if(s.pend){
      const P=s.pend, ax=spotAxis(P.ax);
      root.innerHTML=head+`<div class="sp-card">
          <div class="sp-art"><canvas data-spart="1"></canvas></div>
          <div class="sp-slip">${t('ENTRY')} ${P.slip} · <i class="${P.ok?'okk':'nok'}">${P.ok?t('tagged'):t('rejected')}</i></div>
          <div class="sp-q">${LANG==='pt'?ax.qp:ax.q}</div>
          <div class="sp-opts">${P.opts.map(o=>{
            const cls=o===P.val?'right':(o===P.sel?'wrong':'mute');
            return `<button class="btn sp-o ${cls}" disabled>${o}</button>`;}).join('')}</div>
          <div class="sp-say ${P.ok?'good':'bad'}">
            <b>${P.say}</b> ${P.ok?'+'+money(P.pay):t('It was')+' <u>'+P.val+'</u>.'}
          </div>
          <button class="btn big sp-next" data-spnext="1">${P.fim?t('FINISH SHIFT'):t('NEXT ENTRY')}</button>
        </div>`;
      const cv=$('[data-spart]',root);
      if(cv)drawKaiju(cv,{id:P.art},240);
      const nb=$('[data-spnext]',root);
      nb.onclick=()=>{SFX.click();spotNext();APPS.spot.refresh(b,ent);UI.refresh();};
      setTimeout(()=>{try{nb.focus();}catch(e){}},40);
      return;
    }

    /* ---------- 2. turno encerrado ---------- */
    if(s.i>=N){
      const ganho=s.ans.reduce((a,x)=>a+(x.pay||0),0);
      const perf=s.ok===N;
      root.innerHTML=head+`<div class="sp-end">
        <div class="sp-endbig ${perf?'perf':''}">${s.ok} / ${N}</div>
        <div class="sp-endl">${perf?t('Perfect shift. They noticed.'):
          s.ok>=Math.ceil(N*0.66)?t('Good shift. The sheet is a little less wrong.'):
          t('Rough shift. The busts do not make it easy.')}</div>
        <div class="sep"></div>
        <div class="dr-row"><span>${t('Paid today')}</span><b class="pos">${money(ganho)}</b></div>
        ${perf?`<div class="dr-row"><span>${t('Perfect-shift bonus')}</span><b class="pos">${money(spotBonus())}</b></div>`:''}
        <div class="dr-row"><span>${t('Reputation')}</span><b>${num(s.rep)} · ${spotTierName()}</b></div>
        ${prox?`<div class="dr-row"><span>${t('Next rank at')}</span><b>${num(prox.at)} ${t('tags')}</b></div>`
               :`<div class="dr-row"><span>${t('Rank')}</span><b class="pos">${t('maxed')}</b></div>`}
        <div class="dr-row"><span>${t('Shifts worked')}</span><b>${num(s.shifts)}</b></div>
        <div class="sep"></div>
        <div class="sp-note">${t('The queue refills overnight. Come back tomorrow.')}</div>
      </div>`;
      return;
    }

    /* ---------- 3. ficha aberta ---------- */
    const q=qs[s.i], ax=spotAxis(q.ax);
    root.innerHTML=head+`<div class="sp-card">
        <div class="sp-art"><canvas data-spart="1"></canvas></div>
        <div class="sp-slip">${t('ENTRY')} ${q.slip} · <i>${t('untagged')}</i></div>
        <div class="sp-q">${LANG==='pt'?ax.qp:ax.q}</div>
        <div class="sp-opts">${q.opts.map((o,oi)=>
          `<button class="btn sp-o" data-oi="${oi}">${o}</button>`).join('')}</div>
        <div class="sp-say"></div>
      </div>`;
    const cv=$('[data-spart]',root);
    if(cv)drawKaiju(cv,{id:q.id},240);

    $$('.sp-o',root).forEach(btn=>{
      btn.onclick=()=>{
        if(typeof tiredGate==='function'&&tiredGate())return;
        const r=spotAnswer(q.opts[+btn.dataset.oi]);
        if(!r)return;
        if(r.ok){SFX.coin();UI.floatFrom(btn,'+'+money(r.pay),'#a7e021');}
        else SFX.error();
        APPS.spot.refresh(b,ent);
        if(r.fim&&r.bonus>0){SFX.cash(1);UI.toast('star',t('Perfect shift \u2014 bonus {0}',money(r.bonus)));}
        UI.refresh();
      };
    });
  }
};
