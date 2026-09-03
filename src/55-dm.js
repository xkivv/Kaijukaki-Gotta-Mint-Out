/* ================= KAIJU MESSENGER — motor =================
   Toda mensagem que chega tem um TIPO, e a resposta é escolhida pelo par
   (tipo × tom). Um tipo declara quais tons existem nele: numa oferta faz
   sentido apertar o preço, num vírus não — lá as escolhas são abrir, apagar ou
   avisar a pessoa. Assim é impossível responder fora de contexto.

   O que mudou nesta versão, e por quê (feedback do dono, palavra por palavra:
   "extremamente genéricas e sem alma e sem contexto nenhum"):

   1) CONTEXTO. Toda frase passa por dmFill() com um vocabulário grande
      (dmCtx): o Kaiju em jogo com raça, raridade, rank, nome e olho; o dia;
      quantos Kaiju você tem; o floor; o hype; o gas; a hora; o que você fez
      hoje. Uma frase que não menciona nada concreto não merece existir, e as
      aberturas ainda têm condição (`if`) pra só aparecer quando são verdade
      ("vi você mintar 8 seguidos às 23h" só sai se você mintou 8 hoje).
   2) VOZ. Cada persona tem voz própria (dmVoice): vocabulário, pontuação,
      tique. Os seis da história (kiv, oni, hakase, Unc, Stux, Mr. Kaiju)
      falam aqui do mesmo jeito que falam lá. As pools por voz estão em
      56-dm-lines.js (DM_VOICE) e o tique final é dmStyle().
   3) SEM SPOILER. O botão mostra o rótulo do tom e a frase que vai ser dita.
      Nenhum selo de "+trust"/"-rep": consequência se descobre jogando. O único
      selo que sobrou é informação de mundo (quanto custa ajudar alguém).
   4) "BE FUNNY". Tom `joke` na maioria dos tipos. Alivia o clima: devolve
      paciência ao NPC, e a confiança sobe ou desce conforme o senso de humor
      da persona (campo `humor`). Quem ri, quem não ri e quem devolve piada
      está em DM_VOICE.

   O contrato de um tipo (DM_KINDS):
     tones : quais tons aparecem, em ordem. Sempre 3 ou mais.
   As FRASES ficam em 56-dm-lines.js, indexadas por tipo e tom. */

/* ---------- quem é cada um ----------
   mult     quanto acima/abaixo do valor a pessoa paga
   patience quantos apertos aguenta
   warm     multiplicador de confiança quando você é gentil
   push     desconto de confiança quando você aperta
   humor    0..1 — chance de uma piada cair bem (e quanto rende) */
const DM_PERSONAS=[
 {id:'collector', voice:'collector', mult:1.35, patience:2, warm:1.6, push:-2.2, humor:0.35,
  en:'collector', pt:'colecionador',
  enD:'Pays over floor for the right one. Haggling insults them.',
  ptD:'Paga acima do floor pelo certo. Pechinchar ofende.'},
 {id:'flipper',   voice:'flipper',   mult:0.92, patience:5, warm:0.5, push:0.4,  humor:0.6,
  en:'flipper',   pt:'flipper',
  enD:'Here to resell. Expects you to push back.',
  ptD:'Está aqui pra revender. Espera que você force.'},
 {id:'artist',    voice:'artist',    mult:1.05, patience:3, warm:2.0, push:-1.6, humor:0.8,
  en:'artist',    pt:'artista',
  enD:'In it for the drawings. Little money, a lot of goodwill.',
  ptD:'Está aqui pelo desenho. Pouco dinheiro, muita boa vontade.'},
 {id:'whale',     voice:'whale',     mult:1.60, patience:2, warm:0.4, push:0.2,  humor:0.1,
  en:'whale',     pt:'baleia',
  enD:'Deep pockets, short attention. Will not be charmed.',
  ptD:'Bolso fundo, paciência curta. Não se encanta.'},
 {id:'lurker',    voice:'lurker',    mult:1.00, patience:4, warm:1.2, push:-0.6, humor:0.7,
  en:'quiet one', pt:'discreto',
  enD:'Reads everything, says little. Warms up slowly and stays.',
  ptD:'Lê tudo, fala pouco. Esquenta devagar e fica.'}
];
/* Os personagens com nome não passam pelo hash: eles JÁ têm voz no resto do
   jogo (feed, história) e precisam soar igual aqui. */
const DM_NAMED={
 'kiv':              {id:'kiv',     voice:'kiv',     mult:1.00, patience:3, warm:1.0, push:-1.0, humor:0.5,
   en:'moderator', pt:'moderadora',
   enD:'Has watched four collections die. Not selling you anything.',
   ptD:'Já viu quatro coleções morrerem. Não te vende nada.'},
 'Anonymous Wallet': {id:'kiv',     voice:'kiv',     mult:1.00, patience:3, warm:1.0, push:-1.0, humor:0.5,
   en:'moderator', pt:'moderadora',
   enD:'Has watched four collections die. Not selling you anything.',
   ptD:'Já viu quatro coleções morrerem. Não te vende nada.'},
 'oni_of_the_floor': {id:'oni',     voice:'oni',     mult:1.10, patience:2, warm:0.6, push:-2.0, humor:0.15,
   en:'floor watcher', pt:'vigia do floor',
   enD:'Counts every listing. Does not like you yet.',
   ptD:'Conta cada listagem. Ainda não gosta de você.'},
 'hakase':           {id:'hakase',  voice:'hakase',  mult:1.70, patience:1, warm:0.3, push:0.0,  humor:0.2,
   en:'silent buyer', pt:'comprador calado',
   enD:'Three words at a time. Shows up when there is money.',
   ptD:'Três palavras por vez. Aparece quando tem dinheiro.'},
 'Leaner (Unc)':     {id:'unc',     voice:'unc',     mult:1.00, patience:4, warm:1.5, push:-1.0, humor:0.9,
   en:'the uncle', pt:'o tio',
   enD:'Talks people off the ledge. Dry as a cracker.',
   ptD:'Tira gente do parapeito. Seco feito bolacha.'},
 'Stux':             {id:'stux',    voice:'stux',    mult:0.95, patience:5, warm:1.4, push:0.0,  humor:0.85,
   en:'made every mistake first', pt:'já errou tudo antes',
   enD:'Lowercase, street, lost a wallet in march.',
   ptD:'Minúsculo, de rua, perdeu uma carteira em março.'},
 'Stux':             {id:'stux',    voice:'stux',    mult:0.95, patience:5, warm:1.4, push:0.0,  humor:0.85,
   en:'made every mistake first', pt:'já errou tudo antes',
   enD:'Lowercase, street, lost a wallet in march.',
   ptD:'Minúsculo, de rua, perdeu uma carteira em março.'},
 'Mr. Kaiju':        {id:'mrkaiju', voice:'mrkaiju', mult:1.00, patience:0, warm:0.0, push:0.0,  humor:0.0,
   en:'tax collector', pt:'cobrador',
   enD:'Not in the collection. Does not explain. Comes back.',
   ptD:'Não é da coleção. Não explica. Volta.'},
 'mr_kaiju_intern':  {id:'mrkaiju', voice:'mrkaiju', mult:1.00, patience:1, warm:0.3, push:0.0,  humor:0.1,
   en:'the intern', pt:'o estagiário',
   enD:'Speaks in forms. Nervous about it.',
   ptD:'Fala em formulário. Nervoso com isso.'},
 'artschool_dropout':{id:'artist',  voice:'artist',  mult:1.05, patience:3, warm:2.0, push:-1.6, humor:0.8,
   en:'artist', pt:'artista',
   enD:'In it for the drawings. Little money, a lot of goodwill.',
   ptD:'Está aqui pelo desenho. Pouco dinheiro, muita boa vontade.'},
 'centavo':          {id:'flipper', voice:'flipper', mult:0.85, patience:6, warm:0.5, push:0.5,  humor:0.6,
   en:'flipper', pt:'flipper',
   enD:'Here to resell. Expects you to push back.',
   ptD:'Está aqui pra revender. Espera que você force.'}
};
function dmPersona(who){
  const w=String(who||'');
  if(DM_NAMED[w])return DM_NAMED[w];
  const h=(typeof hashName==='function')?hashName(w):hash32(w);
  return DM_PERSONAS[h%DM_PERSONAS.length];
}
function dmVoice(who){return dmPersona(who).voice||'lurker';}
function dmPersonaName(who){const p=dmPersona(who);return LANG==='pt'?p.pt:p.en;}
function dmPersonaDesc(who){const p=dmPersona(who);return LANG==='pt'?p.ptD:p.enD;}
/* o que a pessoa tem de humor: 'dry' (ri por dentro), 'none', 'loud' */
function dmHumor(who){return +dmPersona(who).humor||0;}

/* ---------- os tons ----------
   cor = o vocabulário visual. verde relação, âmbar dinheiro, laranja risco,
   azul recusa, vermelho corte, cinza neutro, roxo-escuro piada. */
const DM_TONES={
  warm:  {ico:'heart',  cls:'warm', trust:6,  price:1.00, pat:0},
  firm:  {ico:'coin',   cls:'firm', trust:-1, price:1.14, pat:1},
  push:  {ico:'fire',   cls:'push', trust:-7, price:1.34, pat:2},
  hold:  {ico:'lock',   cls:'hold', trust:3,  price:1.00, pat:0},
  cold:  {ico:'xerr',   cls:'cold', trust:-12,price:1.00, pat:3},
  joke:  {ico:'mask',   cls:'joke', trust:0,  price:1.00, pat:-1},
  /* tons dos tipos especiais */
  open:  {ico:'floppy', cls:'push', trust:2,  price:1.00, pat:0},
  wipe:  {ico:'bin',    cls:'hold', trust:0,  price:1.00, pat:0},
  warn:  {ico:'warn',   cls:'warm', trust:9,  price:1.00, pat:0},
  take:  {ico:'coin',   cls:'firm', trust:-3, price:1.00, pat:0},
  give:  {ico:'gift',   cls:'warm', trust:14, price:1.00, pat:0},
  ask:   {ico:'chat',   cls:'firm', trust:2,  price:1.00, pat:0},
  /* tons das situações novas */
  vow:   {ico:'lock',   cls:'hold', trust:10, price:1.00, pat:0},
  swap:  {ico:'binder', cls:'warm', trust:8,  price:1.00, pat:0},
  post:  {ico:'star',   cls:'warm', trust:6,  price:1.00, pat:0}
};

/* ---------- os TIPOS de mensagem ----------
   Cada um declara seus próprios tons. `joke` entra em quase todos: numa seed
   vazada e num vírus não, porque ali a escolha é ação, não clima. */
const DM_KINDS={
  /* conversa */
  hello:  {tones:['warm','ask','joke','cold']},
  praise: {tones:['warm','ask','joke','cold']},
  scold:  {tones:['warm','firm','joke','cold']},
  ask:    {tones:['warm','firm','joke','cold']},
  beg:    {tones:['give','hold','joke','cold']},
  shill:  {tones:['warm','ask','joke','cold']},
  /* negócio */
  offer:  {tones:['warm','firm','push','joke','hold']},
  raise:  {tones:['warm','firm','push','joke','hold']},
  /* situações */
  gift:   {tones:['warm','take','joke','give']},
  virus:  {tones:['warn','wipe','open']},
  seed:   {tones:['warn','wipe','take']},
  nosell: {tones:['vow','ask','firm','joke','cold']},
  trade:  {tones:['swap','firm','hold','joke','cold']},
  alert:  {tones:['warm','warn','joke','cold']},
  plug:   {tones:['post','ask','hold','joke','cold']},
  accuse: {tones:['warm','ask','firm','joke','cold']},
  return: {tones:['warm','ask','joke','cold']}
};
function dmKindOf(m){
  const k=m&&m.kind;
  return DM_KINDS[k]?k:(m&&m.tk?'offer':'hello');
}

/* ---------- paciência ---------- */
function dmPatience(th){
  if(th.pat==null)th.pat=dmPersona(th.who).patience;
  return clamp(th.pat,0,9);
}
/* paciência em palavras: número na tela é spoiler de mecânica */
function dmPatienceLabel(th){
  const p=dmPatience(th);
  if(p>=4)return LANG==='pt'?'com paciência':'patient';
  if(p>=2)return LANG==='pt'?'ficando impaciente':'getting restless';
  if(p>=1)return LANG==='pt'?'quase indo embora':'one push from leaving';
  return LANG==='pt'?'cansou de negociar':'done haggling';
}

/* ---------- rótulos ----------
   O botão diz o tom e mostra a frase. O que acontece depois é do jogo. */
const DM_TONE_LABEL={
 warm:{en:'Be warm',        pt:'Ser gentil'},
 firm:{en:'Hold firm',      pt:'Segurar firme'},
 push:{en:'Push hard',      pt:'Apertar'},
 hold:{en:'Not for sale',   pt:'Não está à venda'},
 cold:{en:'Shut it down',   pt:'Cortar'},
 joke:{en:'Be funny',       pt:'Fazer piada'},
 open:{en:'Open it',        pt:'Abrir'},
 wipe:{en:'Delete it',      pt:'Apagar'},
 warn:{en:'Warn them',      pt:'Avisar'},
 take:{en:'Keep quiet',     pt:'Ficar calado'},
 give:{en:'Help them out',  pt:'Ajudar'},
 ask: {en:'Ask about it',   pt:'Perguntar'},
 vow: {en:'Give your word', pt:'Dar a palavra'},
 swap:{en:'Take the swap',  pt:'Aceitar a troca'},
 post:{en:'Post about it',  pt:'Postar'}
};
/* O MESMO tom quer nome diferente em contexto diferente: "hold" numa oferta é
   "Não está à venda", mas num pedido de ajuda isso é bobagem — ali é "Agora
   não dá". */
const DM_KIND_LABEL={
 beg:  {hold:{en:'Cannot right now',pt:'Agora não dá'},
        give:{en:'Send the money',pt:'Mandar grana'},
        cold:{en:'Tell them no',pt:'Dizer não'}},
 gift: {take:{en:'Just take it',pt:'Só aceitar'},
        give:{en:'Send it back',pt:'Devolver'},
        warm:{en:'Thank them',pt:'Agradecer'}},
 virus:{warn:{en:'They are hacked',pt:'Foi hackeada'},
        wipe:{en:'Delete it unopened',pt:'Apagar sem abrir'},
        open:{en:'Open the file',pt:'Abrir o arquivo'}},
 seed: {warn:{en:'Tell them: delete',pt:'Mandar apagar'},
        wipe:{en:'Delete and say so',pt:'Apagar e avisar'},
        take:{en:'Say nothing',pt:'Não dizer nada'}},
 scold:{firm:{en:'Stand your ground',pt:'Manter a posição'},
        warm:{en:'Admit it',pt:'Admitir'}},
 praise:{ask:{en:'Ask what else',pt:'Perguntar mais'}},
 shill:{warm:{en:'Say you will look',pt:'Vou olhar'},
        cold:{en:'Tell them to stop',pt:'Mandar parar'}},
 raise:{hold:{en:'Off the table',pt:'Tirar da mesa'}},
 nosell:{vow:{en:'Keep it',pt:'Guardar'},
        ask:{en:'Ask why',pt:'Perguntar'},
        firm:{en:'No vow',pt:'Não prometo'},
        cold:{en:'My call',pt:'Decido eu'}},
 trade:{swap:{en:'Swap',pt:'Trocar'},
        firm:{en:'Add cash',pt:'Pedir grana'},
        hold:{en:'Keep mine',pt:'Ficar com o meu'},
        cold:{en:'Shut it down',pt:'Cortar'}},
 alert:{warm:{en:'Thanks',pt:'Agradecer'},
        warn:{en:'Pass it on',pt:'Espalhar'},
        cold:{en:'Shrug',pt:'Ignorar'}},
 plug: {post:{en:'Post it',pt:'Postar'},
        ask:{en:'Ask what for',pt:'Perguntar'},
        hold:{en:'Not today',pt:'Hoje não'},
        cold:{en:'Refuse',pt:'Recusar'}},
 accuse:{warm:{en:'Stay calm',pt:'Ter calma'},
        ask:{en:'Ask proof',pt:'Pedir prova'},
        firm:{en:'Deny it',pt:'Negar'},
        cold:{en:'End it',pt:'Encerrar'}},
 return:{warm:{en:'Welcome',pt:'Receber'},
        ask:{en:'Ask where',pt:'Onde esteve'},
        cold:{en:'Be short',pt:'Ser seco'}}
};
function dmToneLabel(tone,kind){
  const o=kind&&DM_KIND_LABEL[kind]&&DM_KIND_LABEL[kind][tone];
  if(o)return LANG==='pt'?o.pt:o.en;
  const l=DM_TONE_LABEL[tone]||DM_TONE_LABEL.warm;return LANG==='pt'?l.pt:l.en;}
/* O selo de consequência ("+trust", "-rep") MORREU: o jogador descobre o que
   cada tom faz jogando. O que sobra aqui é informação de mundo — quanto custa
   mandar dinheiro pra quem pediu. Tudo mais devolve vazio. */
function dmToneTag(tone,kind,th){
  if(kind==='beg'&&tone==='give'&&th)return money(dmBegAmount(th));
  return '';
}

/* ---------- a última mensagem que ainda pede resposta ----------
   dmLast: o último balão dela, seja o que for (usado pela lista).
   dmPending: o último balão dela que ainda está ABERTO — ignora os ecos
   ("beleza.", "ok.") que ela manda depois de uma resposta sua. Sem isso uma
   piada no meio de uma oferta fazia a oferta virar "hello" e os botões de
   preço sumiam. */
function dmLast(th){
  if(!th||!Array.isArray(th.msgs))return null;
  for(let i=th.msgs.length-1;i>=0;i--){if(!th.msgs[i].me)return th.msgs[i];}
  return null;
}
function dmPending(th){
  if(!th||!Array.isArray(th.msgs))return null;
  let eco=null;
  for(let i=th.msgs.length-1;i>=0;i--){
    const m=th.msgs[i];
    if(m.me)continue;
    if(m.kind==='echo'){if(!eco)eco=m;continue;}
    if(m.dead)return eco||m;
    return m;
  }
  return eco;
}
function dmLiveOffer(th){
  if(!th||!Array.isArray(th.msgs))return null;
  for(let i=th.msgs.length-1;i>=0;i--){
    const m=th.msgs[i];
    if(m.me||!m.tk)continue;
    /* um pedido pra não vender e uma proposta de troca CARREGAM um #id sem
       serem oferta: se entrassem aqui, o balão ganhava botão de VENDER e a
       resposta caía no ramo de negociação */
    if(m.kind==='nosell'||m.kind==='trade')continue;
    if(m.dead)return null;
    if(!G.tokens.some(x=>x.id===m.tk))return null;
    return m;
  }
  return null;
}

/* ---------- as opções ----------
   Vêm do TIPO da última mensagem aberta. Geradas uma vez e guardadas: se
   fossem sorteadas no render, o texto do botão trocava a cada refresh. */
function dmOptions(th){
  const m=dmPending(th);
  let kind=dmKindOf(m);
  /* numa oferta sem paciência não dá mais pra apertar: o que sobra é aceitar
     a relação, aliviar o clima, ou fechar a porta */
  if((kind==='offer'||kind==='raise')&&dmPatience(th)<=0)
    return ['warm','joke','hold','cold'];
  /* um pedido de esmola de quem você não tem dinheiro pra ajudar */
  if(kind==='beg'&&G.money<dmBegAmount(th))
    return ['hold','warm','joke','cold'];
  /* o Kaiju da conversa saiu da carteira (vendido, listado, no cofre): não dá
     mais pra prometer nem pra trocar o que você não tem na mão */
  if(kind==='nosell'&&!dmFreeTokens().some(x=>x.id===m.tk))
    return ['ask','firm','joke','cold'];
  if(kind==='trade'&&!dmFreeTokens().some(x=>x.id===m.tk))
    return ['firm','hold','joke','cold'];
  return (DM_KINDS[kind]||DM_KINDS.hello).tones.slice();
}
function dmEnsureOpts(th){
  const of=dmLiveOffer(th), last=dmPending(th);
  const chave='v2|'+(of?'o'+of.tk+':'+Math.round(of.price*100):'c')
             +'|'+(last?last.kind||'-':'-')+'|'+th.msgs.length+'|'+LANG;
  if(th.optKey===chave&&Array.isArray(th.opts)&&th.opts.length>=3)return th.opts;
  th.optKey=chave;
  const kind=dmKindOf(last);
  th.opts=dmOptions(th).map(tone=>{
    const l=dmSayLine(kind,tone,th);
    return {tone,txt:l.txt,k:l.k};
  });
  return th.opts;
}
/* quanto custa ajudar quem pediu */
function dmBegAmount(th){
  const m=dmPending(th);
  return Math.round((m&&m.amount)||Math.max(5,mintPrice()*1.2));
}

/* ---------- responder ---------- */
const DM_REPLIES_DAY=6;
function dmReply(who,tone){
  const S=soc(), th=S.threads.find(x=>x.who===who);
  if(!th)return {err:'no'};
  if((S.repliesToday||0)>=DM_REPLIES_DAY)return {err:'cap'};
  const T=DM_TONES[tone]||DM_TONES.warm;
  const P=dmPersona(who);
  const alvo=dmPending(th)||dmLast(th)||{};
  const kind=dmKindOf(alvo);
  const of=dmLiveOffer(th);

  S.repliesToday=(S.repliesToday||0)+1;
  /* a fala é a que o botão mostrou — antes sorteava de novo aqui e o jogador
     dizia uma coisa diferente da que leu. E só a frase DITA entra na memória
     anti-repetição: as opções não escolhidas voltam pro bolo. */
  const esc=(th.opts||[]).find(o=>o.tone===tone);
  const fala=esc&&esc.txt?{txt:esc.txt,k:esc.k}:dmSayLine(kind,tone,th);
  dmUse(fala.k);
  /* a segunda piada seguida na mesma conversa já não tem graça */
  const ultMe=[...th.msgs].reverse().find(x=>x.me);
  const repetiu=tone==='joke'&&ultMe&&ultMe.tone==='joke';
  th.msgs.push({t:fala.txt,day:G.day,hour:G.hour,me:1,tone});

  const out={tone,kind,who,trust:trustOf(who)};

  /* ---- a piada: alivia o clima, e cai bem ou mal conforme a pessoa ---- */
  if(tone==='joke'){
    const h=dmHumor(who);
    const caiu=!repetiu&&(h>=0.5?chance(0.30+h*0.65):chance(h*0.8));
    th.pat=Math.min(9,dmPatience(th)+1);
    let dt=caiu?Math.round(3+h*7):(h<0.3?-4:(repetiu?-2:-1));
    trustAdd(who,dt);
    repAdd(caiu?0.4:0);
    out.acao='joke';out.caiu=caiu;out.repetiu=!!repetiu;
    out.devolve=caiu&&chance(h*0.75);
    dmEvent(caiu?'joked':'flopped',{who});
    out.trust=trustOf(who);
    const rep=dmComeback(kind,tone,out,th);
    if(rep)dmSoon(th,rep);
    timeAct(3);save();
    return out;
  }

  const dt=T.trust*(T.trust>=0?P.warm:1)+(T.trust<0?P.push:0);
  trustAdd(who,Math.round(dt));
  repAdd(T.trust>=0?0.5:-0.4);
  out.trust=trustOf(who);

  /* ---- tipos especiais ---- */
  if(kind==='virus'){
    if(tone==='open'){
      out.acao='virus';
      out.dano=dmVirusHit(th,alvo);
    } else if(tone==='wipe'){
      out.acao='wiped';alvo.dead=1;
    } else {
      out.acao='warned';alvo.dead=1;
      dmEvent('warned',{who});
    }
  } else if(kind==='seed'){
    /* a seed veio em dois balões (as palavras e o pânico dela): os dois somem
       juntos, senão a tag amarela fica pendurada pra sempre */
    th.msgs.forEach(x=>{if(x.kind==='seed')x.dead=1;});
    if(tone==='take'){
      out.acao='seedtook';alvo.dead=1;
      out.ganho=dmSeedTake(th,alvo);
    } else if(tone==='wipe'){
      out.acao='wiped';alvo.dead=1;
    } else {
      out.acao='seedwarn';alvo.dead=1;
      trustAdd(who,20);
      dmEvent('savedseed',{who});
    }
  } else if(kind==='gift'){
    if(tone==='give'){
      out.acao='refused';alvo.dead=1;
      dmEvent('refusedgift',{who});
    } else {
      out.acao='took';alvo.dead=1;
      const v=+alvo.amount||0;
      if(v>0){earn(v);out.ganho=v;}
      if(tone==='warm')dmEvent('tookgift',{who,v});
    }
  } else if(kind==='beg'){
    if(tone==='give'){
      const v=dmBegAmount(th);
      if(G.money>=v){spend(v);out.acao='gave';out.gasto=v;trustAdd(who,18);
        dmEvent('helped',{who,v});}
      else {out.acao='broke';}
      alvo.dead=1;
    } else {out.acao=tone==='cold'?'cold':'declined';alvo.dead=1;}
  } else if(kind==='nosell'){
    const tk=G.tokens.find(x=>x.id===alvo.tk);
    alvo.dead=1;
    if(tone==='vow'&&tk){
      dmVowAdd(who,alvo.tk);
      trustAdd(who,22);repAdd(1.2);
      out.acao='vow';out.tk=alvo.tk;
      dmEvent('vowmade',{who,tk:alvo.tk});
    } else if(tone==='firm'){
      out.acao='novow';
      /* quem não consegue a promessa tenta o caminho honesto: comprar. A
         recusa vira dinheiro na mesa, que é a consequência de verdade. */
      if(tk)out.oferta={tk:tk.id,price:tokenValue(tk)*dmOfferMult(who)*rf(1.05,1.45)};
      dmEvent('vowrefused',{who,tk:alvo.tk});
    } else if(tone==='cold'){
      out.acao='cold';th.pat=0;trustAdd(who,-10);repAdd(-1.2);
      dmEvent('rude',{who});
    } else out.acao='talk';
  } else if(kind==='trade'){
    if(tone==='swap'){
      const r=dmDoTrade(th,alvo);
      if(r.err){out.acao='busy';out.err=r.err;}
      else {alvo.dead=1;out.acao='swapped';out.deu=r.deu;out.pegou=r.pegou;out.ganho=r.boot;}
    } else if(tone==='firm'){
      th.pat=dmPatience(th)-1;
      if(th.pat<=0){alvo.dead=1;out.acao='walk';dmEvent('walked',{who});}
      else{
        const add=Math.round(Math.max(2,floorPrice()*rf(0.15,0.5)));
        alvo.boot=(+alvo.boot||0)+add;
        out.acao='boot';out.para=alvo.boot;
      }
    } else if(tone==='hold'){
      alvo.dead=1;out.acao='keepmine';dmEvent('tradeturned',{who,tk:alvo.tk});
    } else {alvo.dead=1;out.acao='cold';th.pat=0;dmEvent('rude',{who});}
  } else if(kind==='alert'){
    alvo.dead=1;
    if(tone==='cold'){
      out.acao='shrug';repAdd(-0.5);dmEvent('ignoredwarning',{who});
    } else {
      /* ouvir alguém vale alguma coisa: por dois dias o anexo suspeito chega
         marcado, mesmo sem antivírus instalado */
      S.tipUntil=Math.max(+S.tipUntil||0,G.day+2);
      if(tone==='warn'){out.acao='spread';repAdd(2);trustAdd(who,6);dmEvent('spreadwarning',{who});}
      else {out.acao='heed';dmEvent('heeded',{who});}
    }
  } else if(kind==='plug'){
    alvo.dead=1;
    if(tone==='post'){
      out.acao='posted';out.hype=dmDoPlug(th);
      trustAdd(who,10);
    } else if(tone==='cold'){
      out.acao='plugno';trustAdd(who,-6);repAdd(-0.6);dmEvent('refusedplug',{who});
    } else if(tone==='hold'){out.acao='later';}
    else out.acao='talk';
  } else if(kind==='accuse'){
    alvo.dead=1;
    if(tone==='ask'){
      /* pedir prova é a única saída que pode LIMPAR o seu nome — e a única que
         pode piorar tudo, porque às vezes a pessoa dobra a aposta */
      if(chance(0.55)){out.acao='cleared';trustAdd(who,14);repAdd(2);dmEvent('clearedname',{who});}
      else {out.acao='doubled';trustAdd(who,-5);repAdd(-1.5);dmEvent('accused',{who,stance:'proof'});}
    } else if(tone==='warm'){out.acao='calm';repAdd(1);dmEvent('accused',{who,stance:'calm'});}
    else if(tone==='firm'){out.acao='denied';repAdd(-0.5);dmEvent('accused',{who,stance:'deny'});}
    else {out.acao='feud';th.pat=0;trustAdd(who,-18);repAdd(-3);dmEvent('feud',{who});}
  } else if(kind==='return'){
    alvo.dead=1;
    if(tone==='warm'){out.acao='welcome';trustAdd(who,10);repAdd(0.5);
      dmEvent('welcomeback',{who,gone:+alvo.gone||0});}
    else if(tone==='cold'){out.acao='ghost';trustAdd(who,-12);dmEvent('ghosted',{who});}
    else out.acao='talk';
  } else if(of){
    th.pat=dmPatience(th)-T.pat;
    if(tone==='hold'){of.dead=1;out.acao='hold';}
    else if(tone==='cold'){of.dead=1;th.pat=0;out.acao='cold';dmEvent('rude',{who});}
    else if(th.pat<=0&&T.price>1){of.dead=1;out.acao='walk';dmEvent('walked',{who});}
    else if(T.price>1){
      const meta=metaOf(of.tk);
      const teto=tokenValue({id:of.tk,rarity:meta.rarity,traits:meta.traits})*P.mult*2.1;
      const antes=of.price||0;
      of.price=Math.min(teto,antes*(1+(T.price-1)*(0.55+P.mult*0.35)));
      out.acao='raise';out.de=antes;out.para=of.price;
    } else out.acao='warm';
  } else {
    out.acao='talk';
    if(alvo&&alvo.kind&&alvo.kind!=='echo')alvo.dead=1;
    if(tone==='cold'){th.pat=0;trustAdd(who,-6);dmEvent('rude',{who});}
    if(tone==='warm')dmEvent('kind',{who});
  }

  /* a réplica dela, coerente com o que você fez */
  const rep=dmComeback(kind,tone,out,th);
  if(rep)dmSoon(th,rep);
  /* quando a conversa VIRA negócio (recusar a promessa, por exemplo), a oferta
     entra como mensagem de verdade: com arte, preço e botão de vender */
  if(out.oferta){
    dmAdd(th,dmBuyLine(out.oferta.tk,th),{kind:'offer',tk:out.oferta.tk,price:out.oferta.price});
    th.pat=dmPersona(who).patience;
  }
  timeAct(3);
  save();
  return out;
}

/* ---------- consequências ---------- */
function dmVirusHit(th,m){
  /* o antivírus não impede o clique idiota: ele avisa antes e segura o dano */
  if(securityActive()){
    dmEvent('virusblocked',{who:th.who});
    return {blocked:1};
  }
  const perda=Math.min(G.money,Math.max(8,G.money*rf(0.10,0.24)));
  if(perda>0)spend(perda);
  G.scamLoss=(G.scamLoss||0)+perda;
  dmEvent('virushit',{who:th.who,v:perda});
  return {money:perda};
}
function dmSeedTake(th,m){
  /* pegar a seed alheia é dinheiro sujo: paga bem e custa caro em reputação,
     e a comunidade descobre */
  const v=Math.round(Math.max(30,floorPrice()*rf(3,9)));
  earn(v);
  repAdd(-22);trustAdd(th.who,-100);
  G.dirtyMoney=(G.dirtyMoney||0)+v;
  dmEvent('stole',{who:th.who,v});
  return v;
}

/* a troca acontece de verdade: um Kaiju sai da carteira e outro entra. É o
   único jeito de a troca significar alguma coisa. */
function dmDoTrade(th,m){
  const meu=G.tokens.find(x=>x.id===m.tk);
  if(!meu)return {err:'gone'};
  if(meu.staked)return {err:'staked'};
  if(meu.listed!=null)return {err:'listed'};
  try{if(typeof binderIds==='function'&&binderIds().has(meu.id))return {err:'binder'};}catch(e){}
  if(G.tokens.some(x=>x.id===m.tkThem))return {err:'dup'};
  const boot=Math.round(+m.boot||0);
  removeToken(meu.id);
  const novo=buildToken(m.tkThem,G.day,true);
  ownToken(novo);
  if(boot>0)earn(boot);
  trustAdd(th.who,14);repAdd(0.6);
  if(typeof addHype==='function')addHype(0.15);
  dmEvent('traded',{who:th.who,deu:meu.id,pegou:novo.id,v:boot,
                    rDeu:meu.rarity,rPegou:novo.rarity});
  return {deu:meu.id,pegou:novo.id,boot,rar:novo.rarity};
}
/* o shill que o jogador aceita fazer vira post de verdade no feed, assinado
   por ele. Emprestar o nome pra quem você mal conhece custa reputação. */
function dmDoPlug(th){
  const tr=trustOf(th.who);
  const h=1.0+Math.max(0,tr)/100;
  if(typeof addHype==='function')addHype(h);
  repAdd(tr>=25?0.6:-1.4);
  if(typeof socialPost==='function'&&typeof PLUG_POSTS!=='undefined'){
    const l=(typeof socialFresh==='function')?socialFresh(PLUG_POSTS):(dmFresh(PLUG_POSTS)||PLUG_POSTS[0]);
    if(l){
      dmUse(dmKey(l));
      socialPost({who:'you',kind:'shill',txt:(LANG==='pt'?l.pt:l.en),key:(typeof saidKey==='function')?saidKey(l):undefined});
    }
  }
  dmEvent('shilled',{who:th.who,trust:tr});
  return h;
}

/* ---------- a réplica dela ---------- */
function dmSoon(th,txt){
  th.msgs.push({t:txt,day:G.day,hour:G.hour,me:0,kind:'echo'});
  if(th.msgs.length>SOC_CAP.msgs)th.msgs.shift();
  th.lastAt=G.day*24+G.hour;
}
function dmCounterLine(novo,antes,th){
  const sobe=antes>0?(novo/antes-1):0;
  const V=(typeof DM_VOICE!=='undefined')&&DM_VOICE[dmVoice(th?th.who:'')];
  const own=V&&(sobe>0.25?V.counterHi:V.counterLo);
  const a=own&&own.length?own:(sobe>0.25
    ? [{en:'fine. {0} for {kj}. that is my last one.',pt:'tá. {0} pelo {kj}. essa é a última.'},
       {en:'{0}. I am going to regret this and I am going to keep the {race} anyway.',pt:'{0}. vou me arrepender e vou ficar com o {race} mesmo assim.'},
       {en:'{0}. you squeezed that out of me on a {rar}.',pt:'{0}. você espremeu isso de mim num {rar}.'},
       {en:'{0} and I stop refreshing your wallet.',pt:'{0} e eu paro de atualizar sua carteira.'},
       {en:'ok. {0}. do not tell {comm} people I paid that for a {race}.',pt:'ok. {0}. não conta pra {comm} pessoas que eu paguei isso num {race}.'},
       {en:'{0}. that is the top of what I have this week.',pt:'{0}. é o teto do que eu tenho essa semana.'}]
    : [{en:'I can go to {0} on {kj}.',pt:'consigo ir até {0} no {kj}.'},
       {en:'{0}. that is honest for a rank {rank}.',pt:'{0}. isso é honesto pra um rank {rank}.'},
       {en:'{0}, and I think that is fair with the floor at {floor}.',pt:'{0}, e acho isso justo com o floor em {floor}.'},
       {en:'how about {0}. the {race} market is not what it was.',pt:'que tal {0}. o mercado de {race} não é mais o que era.'},
       {en:'{0}. a small step, but a step.',pt:'{0}. passo pequeno, mas é um passo.'},
       {en:'{0}. meeting you closer than the floor does.',pt:'{0}. chegando mais perto que o floor.'}]);
  /* o contra-lance é o que mais aparece numa partida: passa pela memória */
  const l=dmFresh(a)||a[0];
  dmUse(dmKey(l));
  return dmStyle(dmFill((LANG==='pt'?l.pt:l.en).split('{0}').join(money(novo)),th),th?th.who:'');
}

/* ---------- o que a confiança compra ---------- */
function dmOfferMult(who){
  const tr=trustOf(who), P=dmPersona(who);
  return P.mult*(1+tr/260);
}
function dmSilenced(who){return trustOf(who)<=-45;}
/* o estado da relação em palavras: nunca número */
function dmTrustLabel(who){
  const v=trustOf(who);
  if(v>=55)return {k:'pos',en:'would sell you a kidney',pt:'venderia um rim pra você'};
  if(v>=20)return {k:'pos',en:'trusts you',pt:'confia em você'};
  if(v>-20)return {k:'dim',en:'still deciding about you',pt:'ainda te avaliando'};
  if(v>-45)return {k:'neg',en:'cooling off',pt:'esfriando'};
  return {k:'neg',en:'done with you',pt:'cansou de você'};
}

/* ---------- arquivar e apagar ---------- */
function dmArchive(who,on){
  const th=soc().threads.find(x=>x.who===who);
  if(!th)return;
  th.arch=on?1:0;save();
}
function dmDelete(who){
  const S=soc();
  S.threads=S.threads.filter(x=>x.who!==who);
  /* quem você apagou não volta a te escrever no mesmo dia */
  S.gone=S.gone&&typeof S.gone==='object'?S.gone:{};
  S.gone[who]=G.day;
  save();
}
function dmVisible(){return soc().threads.filter(x=>!x.arch);}
function dmArchived(){return soc().threads.filter(x=>x.arch);}

/* ---------- o barramento de eventos ----------
   O Kaki+ escuta isto pra comentar o que aconteceu na sua DM (57-dm-echo.js).
   Guardo numa fila no save: o comentário sai horas depois, não na hora, senão
   parece que a comunidade tem câmera na sua tela. */
function dmEvent(name,data){
  const S=soc();
  S.evq=Array.isArray(S.evq)?S.evq:[];
  S.evq.push(Object.assign({n:name,at:G.day*24+G.hour},data||{}));
  if(S.evq.length>12)S.evq.shift();
}

/* ---------- hora de mensageiro ----------
   "dia 2" solto embaixo do balão parecia log de servidor. Mensageiro de 1999
   mostra a hora; o dia vira separador entre blocos. O minuto não existe no
   estado (só a hora), então sai do hash do texto — estável entre renders. */
function dmClock(m){
  const h=clamp(Math.floor(+m.hour||0),0,23);
  const mi=hash32(String(m.t||'')+'|'+(m.day||0))%60;
  return (h<10?'0':'')+h+':'+(mi<10?'0':'')+mi;
}
function dmDayLabel(d){return LANG==='pt'?('dia '+d):('day '+d);}
