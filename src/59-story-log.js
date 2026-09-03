/* ================= KAIJU LOG — onde a historia fica guardada =================
   O MODO HISTORIA (58-story.js) fala uma vez e some. Quem pulou uma conversa,
   quem foi interrompido pelo cobrador, ou quem so quer lembrar o que disseram
   sobre o antivirus, nao tinha pra onde ir. Este app e esse lugar.

   Duas abas:
     Registro — tudo que JA foi dito, agrupado por dia (o dia mais novo em
                cima), uma LINHA por conversa. A linha abre no clique e mostra
                a fala inteira, com um botao pra reler na caixa de fala de
                verdade (storyShow, a mesma de 58-story.js). Recolher nao
                apaga: nenhuma conversa some daqui, nunca.
     Gente    — quem sao os seis, numa grade que cabe numa tela. Quem ainda
                nao apareceu na SUA partida fica como silhueta: a lista
                inteira revelada de saida entrega quem ainda vai chegar, e
                isso estraga a surpresa.

   REGRA DE OURO DESTE ARQUIVO: ele so LE o motor. Nada aqui marca beat como
   visto, nada aqui mexe na fila (S.q). Se este app quebrar, a historia
   continua andando igual. */


/* ==========================================================================
   ||                                                                      ||
   ||   OS RETRATOS — E AQUI QUE VOCE COLA AS IMAGENS. SO AQUI.            ||
   ||                                                                      ||
   ==========================================================================

   PASSO A PASSO (nao precisa saber programar):

   1. Salve o desenho de cada personagem como PNG QUADRADO, 320x320 pixels
      (proporcao 1:1). Pode ser 256x256 se preferir menor; menos que isso
      comeca a borrar na moldura grande da aba "Gente".
      Por que 320: a moldura da caixa de fala tem 86 pontos de largura, e o
      jogo pode ser ampliado ate 1,7x numa tela de retina — 86 x 1,7 x 2 = 293.
      320 cobre o pior caso com folga e nao pesa.

   2. Transforme o PNG em "data URI base64". O jogo inteiro e UM arquivo HTML,
      entao a imagem tem que morar dentro do texto. No terminal:

         base64 -w0 ina.png

      Copie o resultado (uma linha comprida) e monte assim:

         data:image/png;base64,COLE_AQUI_O_RESULTADO

   3. Cole essa linha inteira entre as aspas do personagem, aqui embaixo.
      Exemplo de como fica uma linha pronta:

         ina: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',

   4. Salve o arquivo e rode  ./build.sh  na raiz do projeto. Pronto.

   NAO PRECISA fazer os seis de uma vez. Personagem com as aspas vazias
   continua usando o avatar pixelado — que e o MESMO avatar que ele usa no
   Kaki+, entao nao fica parecendo defeito, fica parecendo escolha.

   NAO MEXA em mais nada: storyPortrait() em 58-story.js ja le CHARS[x].art, e
   e por ela que passam a caixa de fala, o Registro e a aba Gente.

   A ESQUERDA E A CHAVE DO PERSONAGEM, e ela nao muda nunca. O NOME dele pode
   mudar — o elenco ja foi rebatizado uma vez em 58-story.js — entao o
   comentario ao lado diz QUEM E A PESSOA, nao como ela se chama hoje. Pra ver
   o nome atual de cada chave, abra a aba "Gente" do proprio Kaiju Log: e a
   mesma ordem desta lista. */
const RETRATOS={
  ina:    '',   /* a moderadora, ja viu colecao morrer          */
  oni:    '',   /* o vigia do floor, ainda nao gosta de voce    */
  hakase: '',   /* o que compra calado                          */
  sera:   '',   /* a que tira gente do parapeito                */
  tobi:   '',   /* o que ja errou tudo antes, por voce          */
  kaiju:  ''    /* o cobrador — o unico que nao e da comunidade */
};
/* A unica linha que aplica o bloco acima. Aspas vazias = fallback pixelado. */
Object.keys(RETRATOS).forEach(k=>{
  const v=String(RETRATOS[k]||'').trim();
  if(v&&typeof CHARS!=='undefined'&&CHARS[k])CHARS[k].art=v;
});


/* ==========================================================================
   O ASSUNTO DE CADA CONVERSA
   O motor guarda `id` e as falas, nao um titulo. Agora que cada conversa e
   uma linha recolhida, este titulo E a conversa na tela: e a unica coisa que
   o jogador le pra decidir se abre. Beat sem titulo aqui cai na primeira
   frase cortada, entao acrescentar beat novo em 58-story.js nunca quebra.
   ========================================================================== */
const LOG_TOPIC={
 b_open:       {en:'What this place actually is',       pt:'O que este lugar é de verdade'},
 b_first_mint: {en:'Your first one, the price and the gas', pt:'O primeiro, o preço e o gas'},
 b_wallet:     {en:'Traits and rank',                   pt:'Traits e rank'},
 b_broke:      {en:'Hitting zero',                      pt:'Chegar no zero'},
 b_cap:        {en:'The wallet is full',                pt:'A carteira encheu'},
 b_audit:      {en:'An audit with no warning',          pt:'Auditoria sem aviso'},
 b_seize:      {en:'What he takes when you do not pay', pt:'O que ele leva quando você não paga'},
 b_endday:     {en:'The day is not infinite',           pt:'O dia não é infinito'},
 b_inbox:      {en:'Mail from the person who draws',    pt:'Correio de quem desenha'},
 b_gas:        {en:'Gas is a wave, not a price',        pt:'Gas é onda, não é preço'},
 b_market:     {en:'Two ways out of a Kaiju',           pt:'Duas saídas pra um Kaiju'},
 b_social:     {en:'Hype is the engine',                pt:'Hype é o motor'},
 b_boost:      {en:'Paid posts, free reactions',        pt:'Post pago, reação de graça'},
 b_spotter:    {en:'Cataloguing for insulting pay',     pt:'Catalogar por um pagamento ofensivo'},
 /* `c` = "ponha o nome desta pessoa no {0}". Nome de personagem NUNCA fica
    escrito aqui: quem manda e CHARS[id].who, que muda quando o elenco e
    rebatizado. Sem isto este titulo continuaria chamando o cobrador pelo
    nome antigo depois de uma troca em 58-story.js. */
 b_tax:        {c:'kaiju', en:'{0} comes for his share', pt:'O {0} vem buscar a parte dele'},
 b_free:       {en:'The free mint still pays gas',      pt:'O freemint ainda paga gas'},
 b_quests:     {en:'Chores and milestones',             pt:'Tarefas do dia e marcos'},
 b_shop:       {en:'A rank opens things',               pt:'Rank abre coisa'},
 b_bulk:       {en:'Signing ten at once',               pt:'Assinar dez de uma vez'},
 b_contract:   {en:'Minutes you cannot buy back',       pt:'Minuto que não volta'},
 b_binder:     {en:'The binder cannot be taken',        pt:'O fichário não pode ser tomado'},
 b_rarity:     {en:'Rank multiplies the floor',         pt:'Rank multiplica o floor'},
 b_races:      {en:'The list of races you have seen',   pt:'A lista de raças que você já viu'},
 b_media:      {en:'A lo-fi loop on the server',        pt:'Um loop de lo-fi no server'},
 b_scam_warn:  {en:'Nobody real asks for a seed phrase',pt:'Ninguém de verdade pede seed phrase'},
 b_event:      {en:'Every day wakes up in a mood',      pt:'Todo dia acorda com um clima'},
 b_chart:      {en:'Floor is the price of the cheapest',pt:'Floor é o preço do mais barato'},
 b_listing:    {en:'Listing burns gas too',             pt:'Listar também queima gas'},
 b_sort:       {en:'Ten of them: filter and sort',      pt:'Dez: filtro e ordenação'},
 b_dm:         {en:'Trust does not show in your wallet',pt:'Confiança não aparece na carteira'},
 b_offers:     {en:'Bids on the whole collection',      pt:'Lance na coleção inteira'},
 b_saturation: {en:'Flooding your own machine',         pt:'Inundar a sua própria máquina'},
 b_listpress:  {en:'A wall of listings',                pt:'Uma parede de listagem'},
 b_sweep:      {en:'Sweeping the floor',                pt:'Varrer o floor'},
 b_binder_set: {en:'A page of one Race is a set',       pt:'Página de uma raça só é um set'},
 b_spot_rank:  {en:'Longer shifts at the Spotter',      pt:'Turno mais longo no Spotter'},
 b_gasspike:   {en:'The chain is jammed',               pt:'A rede está entupida'},
 b_dump:       {en:'The chart turned into a cliff',     pt:'O gráfico virou penhasco'},
 b_security:   {en:'The antivirus is rent, not upgrade',pt:'O antivírus é aluguel, não upgrade'},
 b_queue:      {en:'The queue scanner gives odds',      pt:'O scanner da fila dá chance'},
 b_rep:        {en:'The room has an opinion about you', pt:'A sala tem uma opinião sobre você'},
 b_comfort:    {en:'Skip an hour, leave notes',         pt:'Pular uma hora, deixar notas'},
 b_referral:   {en:'Referral: thirty per cent to forty',pt:'Indicação: de trinta pra quarenta'},
 b_vault:      {en:'The vault pays you per day',        pt:'O cofre te paga por dia'},
 b_stake:      {en:'Ten days is the minimum',           pt:'Dez dias é o mínimo'},
 b_late:       {en:'Half the collection is gone',       pt:'Metade da coleção já saiu'},
 b_mintout:    {en:'8888, none left over',              pt:'8888, nenhum sobrando'}
};
function logTopic(b){
  const T=LOG_TOPIC[b.id];
  if(T){
    const txt=(LANG==='pt'?T.pt:T.en)||T.en||'';
    return T.c?txt.split('{0}').join(charOf(T.c).who):txt;
  }
  /* beat novo que ninguem titulou: a primeira frase serve de titulo */
  const l=((b.say||[]).find(x=>x&&x.c))||null;
  const s=l?((LANG==='pt'?l.pt:l.en)||l.en||''):b.id;
  return s.length>52?s.slice(0,50)+'…':s;
}


/* ==========================================================================
   O QUE JA ACONTECEU
   `S.seen[id]` guarda o DIA em que o beat rolou. A ordem da tela e o dia e,
   dentro do dia, a ordem de BEATS — que e a ordem em que o motor le. Beat
   que nunca aconteceu NAO ENTRA AQUI: o Registro nao pode entregar o futuro.
   ========================================================================== */
function logEntries(){
  if(typeof story!=='function'||typeof BEATS==='undefined')return [];
  const S=story();
  const out=[];
  BEATS.forEach((b,i)=>{
    const d=S.seen[b.id];
    if(!d)return;                       /* nao aconteceu: nao existe */
    if(!b.say||!b.say.length)return;     /* beat mudo nao vira registro */
    out.push({b:b,i:i,day:(+d||1)});
  });
  out.sort((x,y)=>(x.day-y.day)||(x.i-y.i));
  return out;
}
/* o meu canto do save. O motor (58-story.js) nao encosta em S.lg. */
function logState(){
  const S=story();
  if(!S.lg||typeof S.lg!=='object')S.lg={};
  if(!S.lg.rd||typeof S.lg.rd!=='object')S.lg.rd={};
  return S.lg;
}
function logUnread(){
  const L=logState();
  return logEntries().filter(e=>!L.rd[e.b.id]).length;
}
function logMarkRead(){
  const L=logState();
  let mudou=false;
  logEntries().forEach(e=>{if(!L.rd[e.b.id]){L.rd[e.b.id]=1;mudou=true;}});
  if(mudou)save();
  return mudou;
}
/* quem ja falou com voce alguma vez */
function logMet(){
  const met={};
  logEntries().forEach(e=>(e.b.say||[]).forEach(l=>{if(l.c)met[l.c]=1;}));
  return met;
}
/* as conversas de uma pessoa, com dia e assunto */
function logByChar(id){
  return logEntries().filter(e=>(e.b.say||[]).some(l=>l.c===id));
}
/* ---------- O AGRUPAMENTO POR DIA ----------
   Uma lista corrida de 48 conversas nao tem onde o olho descansar: tudo tem o
   mesmo peso e nada diz "voce esta aqui". O dia e a unica divisao que o
   jogador ja tem na cabeca, entao ele vira o cabecalho. O dia MAIS NOVO fica
   em cima: o que ele quer reler quase sempre e o que acabou de acontecer, e
   antes disso estava a 23 telas de rolagem do topo. Dentro do dia a ordem
   continua sendo a ordem em que as coisas foram ditas — uma conversa costuma
   responder a anterior, e inverter isso quebraria a leitura. */
function logByDay(){
  const out=[];let atual=null;
  logEntries().forEach(e=>{
    if(!atual||atual.day!==e.day){atual={day:e.day,itens:[]};out.push(atual);}
    atual.itens.push(e);
  });
  return out.reverse();
}


/* ==========================================================================
   A HORA DE APARECER NA MESA
   O icone NAO nasce com o jogo: um caderno vazio no dia 1 e um icone a mais
   pra ignorar, e este modo existe pra tirar icone da tela. Ele chega quando
   existe a primeira coisa pra ler — ou seja, quando a primeira conversa
   TERMINA (fila vazia), pra nao pipocar por cima da ina falando.

   `story_log` nao esta no LOCKABLE de 58-story.js (que nao e meu arquivo),
   entao ele nasceria aberto. Registrar aqui e o caminho mais simples e mais
   seguro: uma linha, sem tocar no motor, e o resto do jogo (icone, menu
   Iniciar, area de trabalho) ja pergunta unlocked() sozinho.
   ========================================================================== */
if(typeof LOCKABLE!=='undefined')LOCKABLE.story_log=1;

function logGate(quieto){
  if(typeof G==='undefined'||!G||typeof story!=='function')return false;
  if(typeof unlocked==='function'&&unlocked('story_log'))return false;
  const S=story();
  if(S.q&&S.q.length)return false;                  /* alguem ainda esta falando */
  if(!logEntries().length)return false;             /* nada pra ler ainda */
  if(typeof unlock!=='function')return false;
  unlock('story_log',true);
  /* o que chegou junto com o icone ja nasce lido: o selo de aviso e pra
     conversa NOVA depois disso, nao pra bagagem que veio de fabrica */
  logMarkRead();
  save();
  if(!quieto&&typeof buildDesktop==='function'){buildDesktop();if(typeof buildStart==='function')buildStart();}
  return true;
}

/* a bolinha do icone: acesa enquanto houver conversa nao lida, apaga ao abrir.
   Nao passa pelo dotState() de 24-state.js (que nao e meu arquivo) — o unico
   dono desta bolinha e esta funcao. */
function logDotSync(){
  if(typeof document==='undefined')return;
  const n=document.querySelector('#ndot_story_log');
  if(!n)return;
  n.style.display=logUnread()>0?'':'none';
}

/* ---------- os tres ganchos ----------
   storyMigrate: save antigo abre com o caderno ja na mesa, sem selo NOVO e
                 sem animacao de chegada — o icone e desenhado na mesma
                 passada que o resto (start() chama migrate e DEPOIS desenha).
   storyPump:    a conversa acabou de terminar; e a hora exata da chegada.
   UI.refresh:   rede de seguranca + a bolinha, que muda o tempo todo. */
if(typeof storyMigrate==='function'){
  const _logMigrate=storyMigrate;
  storyMigrate=function(){const r=_logMigrate.apply(this,arguments);try{logGate(true);}catch(e){}return r;};
}
if(typeof storyPump==='function'){
  const _logPump=storyPump;
  storyPump=function(){const r=_logPump.apply(this,arguments);try{logGate();logDotSync();}catch(e){}return r;};
}
if(typeof UI!=='undefined'&&UI&&typeof UI.refresh==='function'){
  const _logRefresh=UI.refresh;
  UI.refresh=function(){const r=_logRefresh.apply(this,arguments);try{logGate();logDotSync();}catch(e){}return r;};
}


/* ==========================================================================
   RELER UMA CONVERSA
   Reaproveita storyShow() de 58-story.js — a caixa de fala e UMA so no jogo
   inteiro. Duas armadilhas, as duas resolvidas aqui:
     1. a fila real (storyPump) podia abrir uma segunda caixa por cima:
        `storyBusy` segura ela parada enquanto a releitura roda.
     2. o botao "pular" da caixa chama storySkip(), que joga fora o PRIMEIRO
        item da fila REAL — pular uma releitura apagaria uma conversa que o
        jogador ainda nem viu. Durante a releitura o botao passa a cortar a
        releitura, e volta ao normal no fim.
   Nada aqui marca beat, destrava nada nem grava save. E so leitura.
   ========================================================================== */
let logReplaying=false;
function logReplay(id){
  if(typeof beatOf!=='function'||typeof storyShow!=='function')return;
  const b=beatOf(id);
  if(!b||!b.say||!b.say.length)return;
  if(logReplaying||document.querySelector('.storybox')){
    SFX.error();
    UI.toast('info',t('Someone is talking. Wait for them to finish.'));
    return;
  }
  logReplaying=true;
  const busyAntes=storyBusy;      storyBusy=true;
  const skipAntes=storySkip;      let parar=false;
  storySkip=function(){parar=true;};
  let i=0;
  const passo=()=>{
    if(parar||i>=b.say.length){
      storySkip=skipAntes;
      storyBusy=busyAntes;
      logReplaying=false;
      setTimeout(()=>{try{storyPump();}catch(e){}},150);
      return;
    }
    const ln=b.say[i++]; if(!ln||!ln.c){passo();return;}   /* linha de download nao se rele */
    storyShow(ln,()=>setTimeout(passo,90));
  };
  passo();
}



/* ==========================================================================
   O APP

   O QUE ESTAVA CANSANDO (medido com 15 dias de historia guardada, 48
   conversas): o Registro abria TODA fala de TODO momento ao mesmo tempo —
   108 paragrafos, 48 botoes "Reler", 48 selos de dia, 11.500px de conteudo
   dentro de uma area de 485px. Vinte e tres telas de rolagem, e a conversa
   de ontem era a ultima delas.

   O QUE MUDOU:
     1. Uma conversa = UMA LINHA recolhida (quem falou + o assunto). O texto
        aparece quando o jogador pede. Recolher nao apaga: continua tudo aqui.
     2. Agrupado por dia, com o dia mais NOVO em cima — o que ele quer reler
        e quase sempre o que acabou de acontecer.
     3. O botao "Reler" saiu das 48 linhas e virou um so, dentro da conversa
        que esta aberta.
     4. Saiu o paragrafo de explicacao no topo das duas abas: quem abre o
        caderno pela decima vez ja sabe o que ele e, e aquilo era a primeira
        coisa que ele tinha que pular todo dia.
     5. A aba Gente virou uma grade de seis retratos, uma linha por pessoa,
        em vez de seis blocos com a lista inteira de assuntos de cada um.
   ========================================================================== */
/* a aba escolhida e da sessao, nao do save: abrir o caderno de novo no dia
   seguinte deve cair no Registro, que e pra isso que ele serve */
let KLtab='log';
/* O QUE ESTAVA MARCADO COMO NOVO QUANDO ESTA JANELA ABRIU.
   O relogio do jogo chama UI.refresh() varias vezes por minuto, e a janela
   se redesenha junto. Se o selo NOVO saisse do save, ele sumia da tela um
   segundo depois de o jogador abrir o app — exatamente enquanto ele procura
   o que o aviso prometeu. Entao o selo vive AQUI, na sessao da janela: some
   quando o app fecha e abre de novo, nao no meio da leitura. */
let KLfresh={};
/* QUAIS CONVERSAS ESTAO ABERTAS. Tambem da sessao da janela, de proposito:
   fechar e abrir o caderno devolve a lista limpa. Se isso morasse no save,
   ele voltaria dias depois com quinze conversas escancaradas — que e
   exatamente o problema que este arquivo esta resolvendo. */
let KLopen={};
let KLauto=false;   /* ja abri sozinho o que chegou de novo nesta janela? */
/* ONDE A LISTA ESTAVA ROLADA. refresh() reconstroi a janela inteira (abas
   incluidas) a cada batida do relogio do jogo, entao a caixa que rola e
   destruida e refeita varias vezes por minuto. Sem guardar isto aqui fora,
   quem estivesse lendo a conversa do dia 7 voltava pro topo sozinho. */
let KLscroll=0;

/* a moldura do retrato. Mesmo caminho da caixa de fala: storyPortrait() le
   CHARS[x].art. Sem imagem vem o avatar pixelado, e a moldura escura + o
   brilho fazem ele parecer um retrato de propósito, nao um erro.
   `cls` deixa a linha do Registro pedir a versao pequena, sem o brilho e sem
   as listras do CRT: a 26px aquilo vira sujeira, nao retrato. */
function logPortrait(id,px,cls){
  const K=(typeof uiScale==='function')?uiScale():1;
  return `<div class="kl-por${cls?' '+cls:''}" style="width:calc(${px}px * var(--ui));height:calc(${px}px * var(--ui))">
    ${storyPortrait(id,Math.round((px-6)*K))}</div>`;
}
/* a silhueta de quem ainda nao apareceu. Sempre o MESMO desenho pros seis:
   usar o icone proprio de cada um ja seria uma pista de quem e. */
function logSilhouette(px){
  const K=(typeof uiScale==='function')?uiScale():1;
  return `<div class="kl-por unknown" style="width:calc(${px}px * var(--ui));height:calc(${px}px * var(--ui))">
    <div class="kl-sil">${pixSVG('kaiju',Math.round((px-6)*K))}</div></div>`;
}
/* quem fala numa conversa, sem repetir nome. NUNCA hardcode: os nomes mudam
   (o guia virou Kiv, o tobi_04 virou Stux) e quem manda e CHARS[id].who. */
function logWho(b){
  const q=[];(b.say||[]).forEach(l=>{if(l.c&&q.indexOf(l.c)<0)q.push(l.c);});
  return q;
}
/* o texto de uma conversa, montado so quando ela abre */
function logBody(b){
  if(!b||!b.say)return '';
  const quem=logWho(b);let ult=null;
  return `<div class="kl-b">
    ${(b.say||[]).filter(l=>l&&l.c).map(l=>{
      const troca=(l.c!==ult);ult=l.c;
      const txt=(LANG==='pt'?l.pt:l.en)||l.en||'';
      return `<p class="kl-ln">${troca&&quem.length>1?`<b class="kl-sp">${charOf(l.c).who}</b>`:''}${txt}</p>`;
    }).join('')}
    <button class="btn kl-re" data-klre="${b.id}">${t('Read again')}</button>
  </div>`;
}

APPS.story_log={
  title:'Kaiju Log', icon:'chat', w:560, h:540, status:true,
  build(b,ent){KLfresh={};KLopen={};KLauto=false;KLscroll=0;
    b.innerHTML='<div class="klroot"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.klroot',b);if(!root)return;
    /* guarda o lugar ANTES de destruir a caixa que rola */
    const rolando=$('.kl-list',root);
    if(rolando)KLscroll=rolando.scrollTop;
    const ent2=logEntries();
    /* o que ainda nao foi lido entra no selo e NUNCA sai enquanto a janela
       estiver aberta — inclusive conversa que chega com o app ja aberto */
    const L0=logState();
    ent2.forEach(e=>{if(!L0.rd[e.b.id])KLfresh[e.b.id]=1;});
    const met=logMet();
    const nMet=Object.keys(CHARS).filter(k=>met[k]).length;
    const nao=logUnread();
    root.innerHTML=`
      <div class="tabs">
        <div class="tab ${KLtab==='log'?'on':''}" data-klt="log">${t('Log ({0})',ent2.length)}${nao&&KLtab!=='log'?`<i class="kl-dot"></i>`:''}</div>
        <div class="tab ${KLtab==='who'?'on':''}" data-klt="who">${t('People ({0}/{1})',nMet,Object.keys(CHARS).length)}</div>
      </div>
      <div class="tabbody kl-body" data-klbody="1"></div>`;
    $$('[data-klt]',root).forEach(x=>x.onclick=()=>{
      SFX.click();KLtab=x.dataset.klt;this.refresh(b,ent);
    });
    const body=$('[data-klbody]',root);
    if(KLtab==='log')this.log(body,b,ent,ent2);
    else this.who(body,met);
    /* Abriu o Registro = leu, e a bolinha do icone apaga na hora. Os selos
       NOVO desta tela NAO somem no meio da leitura — quem abriu quer ver o
       que chegou. Eles ja nascem sem selo na proxima vez que o app abrir. */
    if(KLtab==='log'&&ent2.length){logMarkRead();logDotSync();}
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st)st.textContent=t('{0} conversations recorded',ent2.length);
    if(st2)st2.textContent=t('{0}/{1} people',nMet,Object.keys(CHARS).length);
  },

  /* ---------- ABA 1: REGISTRO ---------- */
  log(body,b,ent,list){
    if(!list.length){
      body.innerHTML=`<div class="kl-empty">${pixSVG('chat',44)}
        <p>${t('Nobody has told you anything yet.')}</p>
        <span>${t('Everything anyone says to you is written down here, word for word.')}</span></div>`;
      return;
    }
    /* O QUE ABRE SOZINHO: so o que chegou de novo, e no maximo tres. Quem
       clicou no aviso quer ver a novidade sem mais um clique — mas um save
       que acumulou trinta conversas nao lidas nao pode escancarar as trinta,
       senao a tela volta a ser o paredao. As demais ficam a um clique.
       So na PRIMEIRA vez que esta janela desenha: depois disso quem manda no
       que esta aberto e no lugar da rolagem e o jogador, nao o relogio. */
    const primeira=!KLauto;
    if(primeira){
      KLauto=true;
      const novas=list.filter(e=>KLfresh[e.b.id]);
      novas.slice(-3).forEach(e=>KLopen[e.b.id]=1);
    }
    body.innerHTML=`<div class="kl-list">${logByDay().map(g=>`
      <div class="kl-day">${t('Day {0}',g.day)}</div>
      ${g.itens.map(e=>{
        const b2=e.b, novo=!!KLfresh[b2.id], aberto=!!KLopen[b2.id];
        const quem=logWho(b2);
        return `<div class="kl-r${novo?' fresh':''}${aberto?' open':''}" data-kle="${b2.id}">
          <div class="kl-h" data-kltog="${b2.id}">
            ${logPortrait(quem[0],26,'mini')}
            <span class="kl-x">
              <span class="kl-t">${logTopic(b2)}</span>
              <span class="kl-w">${quem.map(q=>charOf(q).who).join(' · ')}${novo?`<span class="kl-new">${t('NEW')}</span>`:''}</span>
            </span>
          </div>${aberto?logBody(b2):''}</div>`;
      }).join('')}`).join('')}</div>`;

    const listaEl=$('.kl-list',body);
    /* devolve o jogador pro lugar onde ele estava lendo (ver KLscroll) */
    if(listaEl&&!primeira)listaEl.scrollTop=KLscroll;
    /* abrir e fechar mexe SO na linha clicada: redesenhar a lista inteira
       jogava a rolagem pro topo e o jogador perdia o lugar */
    const ligaReler=el=>{const r=$('[data-klre]',el);
      if(r)r.onclick=ev=>{ev.stopPropagation();SFX.click();logReplay(r.dataset.klre);};};
    $$('[data-kltog]',body).forEach(h=>h.onclick=()=>{
      const id=h.dataset.kltog, linha=h.parentElement;
      SFX.click();
      if(KLopen[id]){
        delete KLopen[id];linha.classList.remove('open');
        const c=$('.kl-b',linha);if(c)c.remove();
      }else{
        KLopen[id]=1;linha.classList.add('open');
        linha.insertAdjacentHTML('beforeend',logBody(beatOf(id)));
        ligaReler(linha);
      }
    });
    $$('.kl-r.open',body).forEach(ligaReler);
    /* Se chegou conversa nova enquanto o app estava fechado, ela pode estar
       num dia que nao e o de cima. Levar o olho ate ela e o minimo — UMA vez,
       na abertura. Fazer isso a cada redesenho puxaria a lista de volta pra
       conversa nova toda vez que ele tentasse rolar pra longe dela. */
    const prim=primeira?list.filter(e=>KLfresh[e.b.id]).slice(-3)[0]:null;
    if(prim&&listaEl){
      const alvo=$(`[data-kle="${prim.b.id}"]`,body);
      if(alvo)requestAnimationFrame(()=>{try{alvo.scrollIntoView({block:'center'});}catch(e){}});
    }
  },

  /* ---------- ABA 2: GENTE ----------
     Seis pessoas cabem numa tela so. Antes cada uma trazia junto a lista
     inteira dos assuntos dela (48 botoes espalhados por seis blocos), e a
     pergunta que a aba responde — "quem sao essas pessoas?" — ficava a cinco
     telas de rolagem. Os assuntos ja moram no Registro, que agora e facil de
     percorrer; aqui ficou o que so esta aqui: a cara, o nome e o que a
     pessoa e. */
  who(body,met){
    body.innerHTML=`<div class="kl-people">${Object.keys(CHARS).map(k=>{
      if(!met[k]){
        return `<div class="kl-p unknown">
          ${logSilhouette(64)}
          <div class="kl-pi">
            <div class="kl-pn">???</div>
            <div class="kl-ps">${t('Not met yet')}</div>
          </div></div>`;
      }
      const c=CHARS[k], conv=logByChar(k).length;
      return `<div class="kl-p">
        ${logPortrait(k,64)}
        <div class="kl-pi">
          <div class="kl-pn">${c.who}${c.boss?`<span class="kl-boss">${t('not one of us')}</span>`:''}</div>
          <div class="kl-pc">${t('{0} conversations',conv)}</div>
        </div></div>`;
    }).join('')}</div>`;
  }
};
