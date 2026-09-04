/* ================= SOCIAL: NUCLEO =================
   O feed e a representacao visual do hype, que ate agora so existia como uma
   barrinha. Dia 1, nada mintado: umas 25 pessoas na comunidade e tres online,
   ninguem curte nada. Mint esgotado com hype alto: 5000 na comunidade e umas
   300 pessoas online ao mesmo tempo, e o feed rolando.

   REGRA CENTRAL DAS DMs: toda mensagem tem uma urgencia 0-3, e a urgencia
   decide o CANAL, nao o conteudo.
     0 silencioso · 1 badge · 2 toast · 3 janelinha
   E a janelinha divide orcamento com os scams: no maximo 4 interrupcoes
   espontaneas por dia no jogo inteiro, nunca a menos de 2h uma da outra. */
const SOC_CAP={posts:48,threads:20,msgs:16,pops:2,gapH:4,minDay:3};
function soc(){
  if(!G.social||typeof G.social!=='object')G.social={};
  const S=G.social;
  S.posts=Array.isArray(S.posts)?S.posts:[];
  S.threads=Array.isArray(S.threads)?S.threads:[];
  S.trust=S.trust&&typeof S.trust==='object'?S.trust:{};
  S.clubs=Array.isArray(S.clubs)?S.clubs:[];
  S.votes=+S.votes||0;S.popsToday=+S.popsToday||0;S.lastPopAt=+S.lastPopAt||0;
  S.unread=+S.unread||0;S.tips=+S.tips||0;S.tipsToday=+S.tipsToday||0;
  /* com as DMs desligadas o contador some tambem em save antigo: nenhuma
     bolinha de "tem mensagem" fica acesa na bandeja. */
  if(!(typeof DM_ON!=='undefined'&&DM_ON))S.unread=0;
  S.act=S.act&&typeof S.act==='object'?S.act:{};
  return S;
}
/* ---------- quanta gente e essa comunidade ----------
   Comecava com 180 pessoas no dia 1, com zero mintado. Isso e uma cidade, nao
   um Discord recem-aberto: no primeiro dia isso aqui e um punhado de gente que
   entrou porque viu o desenho em algum lugar. A curva agora e essa:
     · a semente: umas duas dezenas, e um por dia que aparece sozinho
     · o povo: quase tudo vem do mint andando (curva acelerando, nao reta)
     · o barulho: hype so traz gente se ja existe alguma coisa pra ver — por
       isso ele multiplica o progresso do mint, nao o vazio
     · a boca a boca: cada venda no mercado traz mais ou menos meia pessoa
   Dia 1 da uns 25. Meio do mint da uns 1500. Mint esgotado com hype alto
   passa dos 5000, que e quando a palavra "comunidade" finalmente cabe. */
function communitySize(){
  const m=clamp((G.minted||0)/SUPPLY,0,1);
  /* A comunidade cresce com ADOCAO (quanto da colecao ja saiu), nao com
     barulho. Antes o hype sozinho valia ate 50 pessoas e a sala enchia na
     primeira semana sem ninguem ter mintado nada.
     O hype agora e um MULTIPLICADOR pequeno em cima de quem ja existe: ele
     traz gente pra dentro mais rapido, mas nao inventa gente do nada.
     E a semente cresce devagar: dia 1 = 14, dia 15 = ~25, dia 40 = ~44. */
  const semente=14+Math.min(46,Math.pow(Math.max(1,G.day||1),0.85)*1.4);
  const povo=4200*Math.pow(m,1.48);
  const boca=(G.totals.sold||0)*0.35;
  const base=semente+povo+boca;
  const atencao=0.82+0.60*(G.hype/100);
  return Math.round(base*atencao);
}
/* Quem esta online AGORA. Comunidade pequena e mais concentrada: numa sala de
   30 pessoas metade se conhece e passa o dia ali; num server de 5000 quase
   ninguem abre. Por isso a fracao cai conforme o lugar cresce. */
function onlineNow(){
  const n=communitySize();
  const h=G.hour+G.min/60;
  const wave=0.35+0.65*Math.max(0,Math.sin((h-6)/18*Math.PI));
  const frac=0.06+0.14/(1+n/50);
  return Math.max(3,Math.round(n*frac*wave*(0.6+G.hype/100)));
}
/* Com hype 90 isso dava 51 posts por dia e o feed virava um muro que ninguem
   acompanha. O hype agora mexe muito mais em QUEM aparece e em quanto engajam
   do que em quantidade bruta: 6 posts num dia morto, ~20 num dia fervendo. */
function postsPerHour(){return clamp(0.3+G.hype/100*1.0,0.3,1.3)*(todayEvent().npc||1);}
function trustOf(n){return clamp(+(soc().trust[n]||0),-100,100);}
function trustAdd(n,v){const S=soc();S.trust[n]=clamp(trustOf(n)+v,-100,100);}

/* ---------- MEMORIA DO QUE JA FOI DITO ----------
   Repetir a mesma frase e o que mais denuncia a maquina. A versao antiga
   guardava as ULTIMAS 70 FRASES e recusava repeti-las — um teto de contagem.
   O furo era esse: o feed nao tem volume fixo. Num dia morto saem 6 posts e
   70 frases cobrem doze dias; num dia de 'viral' com cafeteira e hype 95 saem
   50 posts e as 70 frases cobrem UM dia e meio. Medido: 109 pares de frase
   igual a menos de 3 dias em 10 dias de jogo, e o "force" da ultima tentativa
   ainda repetia a mesma foto no MESMO dia.
   Agora a regra e de TEMPO, nao de contagem: cada frase publicada guarda a
   chave dela e o dia, e "dia_atual - dia_dito < SAID_DAYS" bloqueia. A chave
   e o hash do TEMPLATE (o texto en, ou t nos memes), nao do texto final: assim
   trocar de idioma nao zera a memoria e um presente de $12 e um de $17 sao a
   mesma frase. Entradas velhas saem sozinhas na poda, entao o save nao
   engorda: no pior dia sao ~150 chavezinhas de 7 letras. */
const SAID_DAYS=3;
function saidKey(x){
  const s=(typeof x==='string')?x:((x&&(x.en||x.t))||'');
  return hash32(String(s)).toString(36);
}
/* devolve a lista ja podada e ja migrada. Save antigo tinha S.said como
   lista de STRINGS (o texto final): vira {k,d} como se dito hoje — bloquear
   70 frases por tres dias e mais seguro do que deixar o eco passar. */
function saidList(){
  const S=soc();
  const hoje=+G.day||1;
  if(!Array.isArray(S.said))S.said=[];
  S.said=S.said.map(e=>{
    if(typeof e==='string')return {k:saidKey(e),d:hoje};
    return (e&&typeof e==='object'&&e.k)?{k:String(e.k),d:+e.d||hoje}:null;
  }).filter(e=>e&&(hoje-e.d)<SAID_DAYS);
  /* a memoria paralela do eco de DM (echSaid) foi absorvida por esta */
  if(S.echSaid)delete S.echSaid;
  return S.said;
}
function saidRecently(key){return saidList().some(e=>e.k===key);}
function saidMark(key){saidList().push({k:key,d:+G.day||1});}
/* sorteia do pool uma frase que NAO foi dita nos ultimos SAID_DAYS dias.
   null quando o pool inteiro ja saiu na janela: quem chama pula o tipo ou
   troca de assunto — nunca repete, nunca posta vazio. */
function socialFresh(pool){
  if(!Array.isArray(pool)||!pool.length)return null;
  const said=saidList();
  const livres=pool.filter(l=>{const k=saidKey(l);return !said.some(e=>e.k===k);});
  return livres.length?pick(livres):null;
}

/* Publica no feed. o.key e a chave da frase (saidKey do template); sem ela a
   chave vem do texto final. O segundo parametro (o antigo "force") continua
   aceito pra nao quebrar quem chama, mas NAO fura mais a regra: a janela de
   tres dias e absoluta. Devolve true se publicou, false se recusou. */
function socialPost(o,_force){
  const S=soc();
  /* nunca posta vazio */
  if(!o||!o.txt)return false;
  /* a hora citada no texto manda: um post sobre 4 da manha e das 4 da manha */
  if(o.hour==null){
    const h=hourFromText(o.txt);
    if(h!=null)o.hour=h;
  }
  const key=o.key?String(o.key):saidKey(o.txt);
  if(saidRecently(key))return false;
  saidMark(key);
  delete o.key;   /* a chave nao precisa viver no post nem no save */
  S.posts.unshift(Object.assign({id:'p'+Math.random().toString(36).slice(2,8),
    day:G.day,hour:G.hour,up:0,down:0,my:0},o));
  /* CUIDADO: a poda antiga guardava o que tinha muito like e removia o resto.
     Como meme nasce com like alto, depois de uns dias o feed inteiro virava
     meme e as fotos sumiam. Agora sai o mais antigo, e ponto — um feed e
     cronologico, nao um ranking. */
  while(S.posts.length>SOC_CAP.posts)S.posts.pop();
  return true;
}
function feedTick(burst){
  const S=soc();
  const n=postsPerHour();
  let k=Math.floor(n)+(chance(n%1)?1:0);
  /* pular seis horas de uma vez nao pode despejar seis horas de feed: o
     jogador volta e ve um muro. O tempo passou pra todo mundo, mas o feed
     mostra o que sobreviveu. */
  if(burst)k=Math.min(k,1);
  while(k-->0){
    /* o AUTOR vem primeiro, e a personalidade dele decide o assunto */
    const who=whoPosts();
    const kind=kindFor(who);
    const foto=(kind==='flex')||chance(FOTO_RATE);
    /* ANTES: cinco tentativas sorteando do pool inteiro, e na quinta publicava
       "mesmo repetindo". Num dia cheio a lista de foto (20 frases) secava e a
       quinta tentativa despejava a mesma frase duas vezes no MESMO dia.
       AGORA: o sorteio ja vem so do que nao foi dito em tres dias. Se o pool
       do tipo sorteado secou, a pessoa fala de OUTRA coisa que a personalidade
       dela aceita (na ordem do peso). Se tudo secou pra ela, ela nao posta
       nessa hora — nunca repete, nunca posta vazio. */
    const ordem=[kind].concat(kindOrder(who).filter(x=>x!==kind));
    for(const kd of ordem){
      if(kd==='fud'&&G.hype>=45)continue;   /* ninguem faz FUD com o mercado quente */
      if(feedPostOf(who,kd,foto))break;
    }
  }
}
/* um post de um tipo, por um autor, so com frase fresca. false = pool seco. */
function feedPostOf(who,kind,foto){
  if(kind==='meme'){
    const m=socialFresh(MEMES);
    return !!m&&socialPost(memePost(who,m));
  }
  if(kind==='fud'){
    const l=socialFresh(POST_FUD);
    return !!l&&socialPost({who,kind:'fud',txt:txOf(l),key:saidKey(l)});
  }
  if(foto){
    /* mais gente mostrando o que pegou: foto e o que da vida ao feed */
    const l=socialFresh(POST_FLEX);
    if(l){
      const id=idAtMintIndex(Math.floor(Math.random()*Math.max(1,G.minted)));
      return socialPost({who,kind:'flex',txt:txOf(l),tk:id,rar:metaOf(id).rarity,key:saidKey(l)});
    }
    /* as legendas de foto secaram: quem ia so mostrar a foto fica quieto;
       quem ia falar de outra coisa fala sem foto */
    if(kind==='flex')return false;
  }
  const pool=kind==='art'?POST_ART:kind==='life'?POST_LIFE:POST_TALK;
  const l=socialFresh(pool);
  return !!l&&socialPost({who,kind:(kind==='art'||kind==='life')?kind:'talk',txt:txOf(l),key:saidKey(l)});
}
function txOf(o){return (o&&(o[LANG]||o.en))||'';}
/* ---------- personalidade ----------
   Antes o mesmo nick postava um FUD amargo e dez minutos depois um elogio
   fofo, porque o autor era sorteado por post. Agora o nome DEFINE o tipo:
   o hash do nick escolhe um perfil fixo, e o perfil escolhe do que a pessoa
   fala. O mesmo nome soa sempre como a mesma pessoa. */
function hashName(n){let h=7;for(let i=0;i<n.length;i++)h=((h<<5)-h+n.charCodeAt(i))|0;return Math.abs(h);}
/* peso de cada tipo de post por perfil: talk, art, life, flex, fud, meme */
const PERSONAS=[
 {id:'artista',  w:{art:6,life:3,talk:2,flex:1,fud:0,meme:1}},
 {id:'trader',   w:{talk:6,flex:2,fud:2,art:0,life:1,meme:1}},
 {id:'tagarela', w:{life:7,talk:2,meme:3,art:1,flex:0,fud:0}},
 {id:'azedo',    w:{fud:6,talk:3,life:1,art:0,flex:0,meme:1}},
 {id:'fa',       w:{flex:4,art:4,talk:2,life:1,fud:0,meme:2}},
 {id:'palhaco',  w:{meme:7,life:4,talk:1,art:0,flex:0,fud:0}}
];
function personaOf(who){return PERSONAS[hashName(String(who))%PERSONAS.length];}
/* sorteia o tipo de post respeitando quem esta escrevendo */
function kindFor(who){
  const w=personaOf(who).w;
  const keys=Object.keys(w);
  let tot=0;keys.forEach(k=>{tot+=w[k];});
  let r=Math.random()*tot;
  for(const k of keys){r-=w[k];if(r<=0)return k;}
  return 'talk';
}
/* os tipos que essa pessoa aceita falar, do mais provavel pro menos: e a
   fila de "sobre o que mais ela falaria" quando o assunto sorteado secou */
function kindOrder(who){
  const w=personaOf(who).w;
  return Object.keys(w).filter(k=>w[k]>0).sort((a,b)=>w[b]-w[a]);
}
/* ---------- a hora combina com o texto ----------
   "sao 4 da manha e eu to comendo cereal em pe" postado as 10:00 quebra a
   imersao. Se a frase cita uma hora, o post recebe aquela hora. */
function hourFromText(txt){
  const m=/\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b/i.exec(txt)||/\b(\d{1,2})h\b/.exec(txt);
  if(m){
    let h=parseInt(m[1],10);
    const suf=(m[2]||'').toLowerCase();
    if(suf==='pm'&&h<12)h+=12;
    if(suf==='am'&&h===12)h=0;
    if(h>=0&&h<=23)return h;
  }
  if(/madrugada|3 da manh|4 da manh|3am|4am/i.test(txt))return 3+Math.floor(Math.random()*2);
  return null;
}
/* Quem assina o post. O elenco fixo aparece com peso porque sao os que voltam
   e tem memoria; o resto da comunidade e o pano de fundo que faz o feed parecer
   um lugar, nao um roteiro de cinco pessoas. */
function whoPosts(){
  const r=Math.random();
  if(r<0.22)return pick(CAST).id;
  if(r<0.30)return pick(LOWBALL);
  return pick(CROWD);
}

/* posts anonimos: alguns muito bons, alguns muito ruins, e nunca dois do mesmo
   sinal seguidos */
function anonTick(){
  const S=soc();
  if(G.day<2)return;
  if((S.anonToday||0)>=2)return;
  if(!chance(0.10))return;
  /* o sinal sorteado vem primeiro; se as frases dele ja sairam nos ultimos
     tres dias, tenta o outro sinal; se os dois secaram, hoje nao tem anonimo */
  const bom=chance(0.5);
  let o=socialFresh(bom?ANON_GOOD:ANON_BAD),ehBom=bom;
  if(!o){o=socialFresh(bom?ANON_BAD:ANON_GOOD);ehBom=!bom;}
  if(!o)return;
  const post={who:'anon',kind:'anon',txt:txOf(o),tag:o.k,key:saidKey(o)};
  if(o.k==='tip')post.tip=1;
  if(o.k==='scam')post.scam=1;
  if(!socialPost(post))return;
  S.anonToday=(S.anonToday||0)+1;
  S.lastAnon=ehBom?1:0;
  if(o.k==='praise')addHype(2.5);
  if(o.k==='fud')addHype(-3.5);
}

/* ---------- orcamento de atencao ----------
   Compartilhado com o scam: e por isso que o jogo nao volta a ser um festival
   de pop-up. */
function attentionFree(){
  const S=soc();
  if(G.day<SOC_CAP.minDay)return false;
  if(G.social&&G.social.dnd)return false;
  if(typeof scamOpen!=='undefined'&&scamOpen>0)return false;
  if(typeof dmPopOpen!=='undefined'&&dmPopOpen)return false;
  if(typeof UI==='undefined'||UI.modalOpen())return false;
  if(typeof dayLock!=='undefined'&&dayLock)return false;
  if(typeof dayIsOver==='function'&&dayIsOver())return false;
  if($('#sysveil'))return false;
  const now=G.day*24+G.hour;
  if(now-(G.lastScamAt||0)<2)return false;
  if(S.popsToday>=SOC_CAP.pops)return false;
  if(now-(S.lastPopAt||0)<SOC_CAP.gapH)return false;
  return true;
}
function thread(who){
  const S=soc();
  let th=S.threads.find(x=>x.who===who);
  if(!th){th={who,msgs:[],lastAt:-99};S.threads.unshift(th);
    if(S.threads.length>SOC_CAP.threads)S.threads.pop();}
  return th;
}
function socialDM(who,text,urg,extra){
  /* interruptor mestre: com as DMs desligadas nada nasce — nem thread, nem
     pop-up, nem bolinha na bandeja. */
  if(!(typeof DM_ON!=='undefined'&&DM_ON))return false;
  const S=soc(), th=thread(who);
  const now=G.day*24+G.hour;
  /* nunca duas do mesmo personagem em menos de 8h */
  if(now-(th.lastAt||-99)<8)return false;
  th.lastAt=now;
  const msg=Object.assign({t:text,day:G.day,hour:G.hour,me:0},extra||{});
  th.msgs.push(msg);
  if(th.msgs.length>SOC_CAP.msgs)th.msgs.shift();
  S.unread++;
  const u=urg==null?1:urg;
  if(u>=3&&attentionFree()){dmPop(who,msg);return true;}
  if(u>=2){TICK.dm=(TICK.dm||0)+1;TICK.dmWho=who;return true;}
  if(typeof UI!=='undefined')UI.updateTray();
  return true;
}

/* ---------- reacoes ao que o jogador faz ---------- */
function reactTick(){
  const S=soc(), A=S.act;
  const listed=G.tokens.filter(x=>x.listed!=null).length;
  if(listed>=14&&!A.overlist){A.overlist=1;
    socialDM('annoying guy',txOf(pick(DM_LINES.dump)),2,{kind:'scold'});}
  if((G.log.bought||0)>=3&&!A.fair){A.fair=1;
    socialDM('artschool_dropout',txOf(pick(DM_LINES.fair)),1,{kind:'praise'});}
  if(G.day>=4&&!A.hello){A.hello=1;
    socialDM('first_day_holder',txOf(pick(DM_LINES.hello)),2,{kind:'hello'});}
  if((G.scamLoss||0)>0&&!A.rug){A.rug=1;
    socialDM('rugmuseum_curator',
      LANG==='pt'?'anotei. dia '+G.day+'. tá no arquivo agora.':'noted. day '+G.day+'. it is in the archive now.',1,{kind:'hello'});}
}
/* obcecados por raca (item 25) */
function raceFanTick(){
  const S=soc();
  const cont={};
  G.tokens.forEach(x=>{const r=raceOf(x);cont[r]=(cont[r]||0)+1;});
  const races=Object.keys(cont).filter(r=>cont[r]>=3);
  if(!races.length)return;
  if(!chance(0.22))return;
  const r=pick(races);
  const who=raceFanFor(r);
  const supply=(typeof raceSupply==='function'?raceSupply(r):300);
  const urg=supply<=99?3:supply<=208?2:1;
  const linha=txOf(pick(DM_LINES.race)).split('{r}').join(r);
  const alvo=G.tokens.filter(x=>raceOf(x)===r&&!x.staked&&x.listed==null)[0];
  socialDM(who,linha,urg,alvo?{kind:'offer',tk:alvo.id,price:tokenValue(alvo)*dmOfferMult(who)*rf(1.02,1.35)}:{kind:'hello'});
  if(cont[r]>=5&&S.clubs.indexOf(r)<0&&S.clubs.length<3){
    S.clubs.push(r);
    if(typeof UI!=='undefined')UI.toast('kaiju',t('The {0} people consider you one of them now.',r));
  }
}
/* o jogador mostrando um Kaiju dele */
function postShot(tk,texto){
  if(typeof socialPost!=='function'||!tk)return;
  /* a carteira sorteia a legenda do pool inteiro. O jogador tambem nao pode
     repetir texto em tres dias, entao se a legenda que veio ja saiu, troca
     por uma fresca aqui — a chave e sempre a do template, em qualquer idioma */
  let l=SHOT_LINES.find(x=>x.en===texto||x.pt===texto);
  if(!texto||(l&&saidRecently(saidKey(l)))||(!l&&saidRecently(saidKey(texto)))){
    l=socialFresh(SHOT_LINES);
    if(!l)return;   /* 3 fotos/dia contra 15 legendas: nao seca em 3 dias */
    texto=txOf(l);
  }
  const likes=Math.round(onlineNow()*rf(.06,.34)*(1+(repScore()-60)/100)*(1+tk.rarity*0.35));
  if(!socialPost({who:'you',kind:'shill',txt:texto,tk:tk.id,rar:tk.rarity,up:Math.max(0,likes),key:saidKey(l||texto)}))return;
  addHype(0.4+tk.rarity*0.5);
}
/* legendas da foto do jogador: 3 por dia, janela de 3 dias = 9 no minimo.
   Eram 5, entao no segundo dia ja repetia. */
const SHOT_LINES=[
 {en:'look what came out of the machine',pt:'olha o que saiu da máquina'},
 {en:'not selling this one. ever.',pt:'esse aqui eu não vendo. nunca.'},
 {en:'I did not draw it but I feel like I did',pt:'eu não desenhei mas parece que sim'},
 {en:'the traits on this one are unfair',pt:'os traits desse aqui são injustos'},
 {en:'putting this on my wall',pt:'esse vai pra parede'},
 {en:'this one stays. the binder decided.',pt:'esse fica. o binder decidiu.'},
 {en:'zoom in. I will wait.',pt:'dá zoom. eu espero.'},
 {en:'no caption. just look at it.',pt:'sem legenda. só olha.'},
 {en:'came out of the machine looking at me like that',pt:'saiu da máquina me olhando desse jeito'},
 {en:'my favorite of the week and it is monday',pt:'meu favorito da semana e é segunda'},
 {en:'the background alone. the background.',pt:'só o fundo. o fundo.'},
 {en:'I keep opening this one. no reason.',pt:'eu fico abrindo esse. sem motivo.'},
 {en:'not for sale. not for trade. not for discussion.',pt:'não vende. não troca. não discute.'},
 {en:'this face at 3am hits different',pt:'essa cara às 3 da manhã bate diferente'},
 {en:'the machine was kind to me today',pt:'a máquina foi boa comigo hoje'}
];
/* ---------- meme ----------
   O peso que o Kiv deu vira like/dislike/riso de saida, escalado pelo tamanho
   da comunidade. Um meme de nivel 6 num server grande explode. */
const FOTO_RATE=0.18;
function memePost(who,m){
  /* o feedTick ja manda um meme fresco; sem ele (chamada antiga), sorteia */
  m=m||socialFresh(MEMES)||pick(MEMES);
  const base=onlineNow();
  /* os pesos ficam guardados no post: e por eles que knFeel() sabe se a sala
     ri, curte ou revira os olhos pra essa frase */
  const p={who,kind:'meme',txt:m.t,mw:[m.l||0,m.d||0,m.f||0],key:saidKey(m)};
  if(m.l)p.up=Math.max(1,Math.round(base*0.03*m.l*rf(0.7,1.4)));
  if(m.d)p.down=Math.max(1,Math.round(base*0.03*m.d*rf(0.7,1.4)));
  if(m.f)p.haha=Math.max(1,Math.round(base*0.035*m.f*rf(0.7,1.4)));
  return p;
}
/* ---------- o presente ----------
   De vez em quando alguem da comunidade aparece e deixa dinheiro de verdade
   num post. Fica no feed por algumas horas e some. Quem estiver olhando pega. */
const GIFT_MIN=10, GIFT_MAX=20;
function giftTick(){
  const S=soc();
  if(G.day<4)return;
  if((S.giftsToday||0)>=1)return;
  const now=G.day*24+G.hour;
  if(now-(S.lastGiftAt||-99)<10)return;
  if(!chance(0.06))return;
  /* a chave e a do template: "{0} pra quem ler" com $12 e com $17 e a mesma
     frase. Se as seis ja sairam em tres dias (nao acontece com 1/dia), pula. */
  const l=socialFresh(GIFT_LINES);
  if(!l)return;
  const v=ri(GIFT_MIN,GIFT_MAX);
  if(!socialPost({who:whoPosts(),kind:'gift',txt:(l[LANG]||l.en).replace('{0}',money(v)),
              gift:v,giftTtl:3,key:saidKey(l)}))return;
  S.giftsToday=(S.giftsToday||0)+1;S.lastGiftAt=now;
  if(typeof UI!=='undefined')UI.toast('coin',t('Somebody is giving money away on Kaki+.'));
}
function claimGift(id){
  const S=soc();
  const p=S.posts.find(x=>x.id===id);
  if(!p||!p.gift||p.taken)return null;
  p.taken=1;
  const v=p.gift;
  earn(v);
  S.gifts=(S.gifts||0)+1;
  repAdd(0.2);
  return {value:v,who:p.who};
}
/* o presente expira: quem nao estava olhando perdeu */
function giftExpire(){
  const S=soc();
  S.posts.forEach(p=>{
    if(p.gift&&!p.taken){
      p.giftTtl=(p.giftTtl||0)-1;
      if(p.giftTtl<=0)p.expired=1;
    }
  });
}
/* ---------- O QUE A SALA SENTE ----------
   Reagir junto com a sala rende EXP; reagir fora do tom nao rende nada e nao
   custa nada. Nada aqui e adivinhacao — cada regra da pra explicar em uma
   frase, e e sempre a mesma:
     · FUD se responde pra baixo (isso ja segurava o hype, agora tambem ensina)
     · o link do anonimo e golpe: pra baixo tambem
     · arte, foto, presente: aplauso
     · meme e o que o autor escreveu que ele e — os pesos l/d/f de MEMES sao
       literalmente a opiniao da sala sobre aquela frase
   A RISADA (bug do dono: "reagir com risada as vezes nao conta"). O motivo era
   este: so 8 dos 47 memes tem peso f, entao a risada quase nunca passava do
   corte, e desabafo/conversa nem sequer aceitavam risada. Um MEME e uma piada
   por definicao e um desabafo de forum e humor de autodepreciacao: rir dos dois
   e a reacao humana obvia. Entao agora a risada conta em meme, desabafo,
   conversa, FUD (o classico "lol, cope") e link de golpe. Onde ela NAO conta e
   onde rir seria maldade: arte, foto de Kaiju e presente.
   Duas reacoes podem estar certas no mesmo post. Devolve uma lista de direcoes
   aceitas (1 curtir · 2 rir · -1 descurtir) com a PRINCIPAL na frente — e por
   ela que a sala se guia em knCrowd —, ou null quando nao ha o que reagir. */
function knFeel(p){
  if(!p||p.kind==='shill')return null;
  if(p.kind==='fud')return [-1,2];
  if(p.kind==='anon')return (p.tag==='scam'||p.tag==='fud')?[-1,2]:[1];
  if(p.kind==='meme'){
    let w=Array.isArray(p.mw)?p.mw:null;
    if(!w){   /* save antigo: os pesos nao foram guardados, procura pela frase */
      const m=(typeof MEMES!=='undefined')?MEMES.find(x=>x.t===p.txt):null;
      if(m)w=[m.l||0,m.d||0,m.f||0];
    }
    if(!w)return [1,2];
    const alto=Math.max(w[0],w[1],w[2]);
    if(alto<=0)return [1,2];
    const ok=[];
    /* metade do maior peso ja basta pro joinha: e assim que "l:4,f:5" aceita
       tanto curtir quanto rir, que e como a sala reagiria de verdade */
    if(w[0]>=alto*0.5)ok.push(1);
    if(w[1]>=alto*0.7)ok.push(-1);
    ok.push(2);   /* rir de uma piada nunca esta errado */
    return ok;
  }
  /* desabafo e conversa de forum: metade e piada de si mesmo */
  if(p.kind==='life'||p.kind==='talk')return [1,2];
  return [1];
}
/* quanto vale reagir certo. Responder FUD e denunciar golpe valem mais porque
   custam coragem e ajudam a casa; o resto e o EXP de estar presente. */
const XP_REACT=3, XP_REACT_BIG=5;
function knXpFor(p,dir){
  const ok=knFeel(p);
  if(!ok||ok.indexOf(dir)<0)return 0;
  if(dir===-1&&(p.kind==='fud'||p.tag==='scam'))return XP_REACT_BIG;
  return XP_REACT;
}
function socialTick(){
  const S=soc();
  giftTick();giftExpire();
  /* varias horas na mesma acao (mint em lote, dormir) contam como rajada */
  const now=G.day*24+G.hour;
  const burst=(now-(S.lastTickAt||now-1))>1;
  S.lastTickAt=now;
  feedTick(burst);anonTick();reactTick();raceFanTick();
  /* as situacoes de DM (virus, presente, seed vazada, pedido) e o eco delas
     no feed. Os dois moram em 56-dm-lines.js e 57-dm-echo.js. */
  if(typeof dmSituationTick==='function')dmSituationTick();
  if(typeof dmEchoTick==='function')dmEchoTick();
  /* clubes dao um empurrãozinho de hype: ser de dentro vale alguma coisa */
  if(S.clubs.length)addHype(0.15*S.clubs.length);
}
function socialEndDay(){
  const S=soc();
  S.votes=0;S.popsToday=0;S.anonToday=0;S.act={};S.shotsToday=0;S.repliesToday=0;S.tipsToday=0;S.giftsToday=0;
  S.sit={};
}
