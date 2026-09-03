/* ================= KAIJU MESSENGER — falas e geradores =================
   As frases são indexadas por TIPO e depois por TOM. Quem escolhe a fala já
   sabe o que está respondendo.

   DM_SAY[tipo][tom]  = [ {en, pt, if?}, ... ]  — o que VOCÊ diz
   DM_BACK[tipo][tom] = [ {en, pt, if?}, ... ]  — o que ELA responde depois
   DM_OPEN[tipo]      = [ ... ]                 — como ELA abre a conversa
   DM_VOICE[voz]      = pools por voz (abertura, riso, contra-lance, saída)

   REGRA-RAIZ (do dono): nada genérico. Toda frase menciona alguma coisa
   concreta — o Kaiju, o dia, o floor, o gas, o que você fez hoje. Pra isso
   existe o vocabulário do dmFill():

     {who} ela      {you} seu apelido      {day} dia       {hour} hora HH:MM
     {kj} #id       {race} raça            {rar} raridade  {rank} rank
     {name} nome do Kaiju (trait Name)     {eyes} olho     {bg} fundo
     {kj2}/{race2}  o Kaiju DELA numa troca
     {v} valor      {floor} floor de hoje  {mint} preço do mint
     {hype} hype    {gas} gas (alto/baixo) {comm} tamanho da comunidade
     {n} quantos Kaiju você tem   {minted} mintou hoje   {listed} listados
     {best} seu melhor Kaiju (#id)  {bestrace} raça dele  {bestrar} raridade

   E uma frase pode ter `if:c=>...` — só sai quando é verdade (c é o mesmo
   contexto: c.night, c.mintedLots, c.hacked, c.soldToday, c.listedWall,
   c.taxDue, c.broke, c.rich, c.hasRare, c.hypeHigh, c.hypeLow, c.gasHigh,
   c.many, c.one, c.morning, c.paidTax, c.early, c.late).

   REGRAS DA CASA: ninguém diz "gm"/"gn" a sério — quem dá bom dia dá em
   português. Nada de folheto ("wagmi", "lfg", "to the moon"). Humor seco,
   específico, meio underground. */

/* ================= CONTEXTO ================= */
function dmGasWord(){
  let hi=false;
  try{hi=(typeof gasPct==='function'&&typeof gasDayAvg==='function')?gasPct(G.hour+G.min/60)>gasDayAvg()*1.15:false;}catch(e){}
  return {hi,en:hi?'peak':'cheap',pt:hi?'de pico':'barato'};
}
function dmBestToken(){
  const a=G.tokens||[];
  if(!a.length)return null;
  return a.reduce((p,x)=>(x.rarity>p.rarity||(x.rarity===p.rarity&&x.score<p.score))?x:p);
}
function dmCtx(th,m){
  const of=th?dmLiveOffer(th):null;
  const alvo=m||(th?(dmPending(th)||dmLast(th)):null);
  const best=dmBestToken();
  let tk=of?of.tk:(alvo&&alvo.tk!=null?alvo.tk:null);
  const temAlvo=tk!=null;
  if(tk==null&&best)tk=best.id;
  const meta=tk!=null?metaOf(tk):null;
  const tr=meta?meta.traits:{};
  const tk2=alvo&&alvo.tkThem!=null?alvo.tkThem:null;
  const meta2=tk2!=null?metaOf(tk2):null;
  const v=of?of.price:(alvo&&alvo.amount!=null?alvo.amount:(alvo&&alvo.boot?alvo.boot:null));
  const gas=dmGasWord();
  const listed=G.tokens.filter(x=>x.listed!=null).length;
  const h=Math.floor(G.hour||0);
  const comm=(typeof communitySize==='function')?communitySize():20;
  const hacked=(G.hackTut>0&&G.day-G.hackTut<=4)||((G.scamLoss||0)>0&&G.day<=(G.hackTut||0)+6);
  const c={
    who:th?th.who:'', you:(typeof nickOf==='function')?nickOf():'you',
    day:G.day, hour:(h<10?'0':'')+h+':'+String(hash32('h'+G.day+h)%6)+String(hash32('m'+G.day)%10),
    n:G.tokens.length, comm,
    tk, temAlvo,
    kj:tk!=null?'#'+tk:(LANG==='pt'?'esse':'that one'),
    race:tr.Race||'Kaiju', rar:meta?rarName(meta.rarity):(LANG==='pt'?'comum':'common'),
    rank:meta?meta.rank:'?', name:tr.Name||'Little Guy', eyes:tr.Eyes||'tired', bg:tr.Background||'nothing',
    kj2:tk2!=null?'#'+tk2:(LANG==='pt'?'o meu':'mine'), race2:meta2?meta2.traits.Race:'Kaiju',
    rar2:meta2?rarName(meta2.rarity):'', v:v!=null?money(v):'',
    floor:money(floorPrice()), mint:money(mintPrice()), hype:Math.round(G.hype||0),
    gas:LANG==='pt'?gas.pt:gas.en, gasHigh:gas.hi,
    minted:G.log.mint||0, listed, sold:G.log.sold||0,
    best:best?'#'+best.id:'', bestrace:best?(best.traits.Race||'Kaiju'):'Kaiju', bestrar:best?rarName(best.rarity):'',
    night:h>=22||h<6, morning:h>=6&&h<11,
    mintedLots:(G.log.mint||0)>=4, listedWall:listed>=5, soldToday:(G.log.sold||0)>0,
    hacked, paidTax:(G.log.tax||0)>0, taxDue:(G.taxDue||0)>0,
    broke:G.money<mintPrice(), rich:G.money>2500, many:G.tokens.length>=10, one:G.tokens.length===1, none:G.tokens.length===0,
    hasRare:!!best&&best.rarity>=2, hypeHigh:(G.hype||0)>=60, hypeLow:(G.hype||0)<15,
    early:G.day<5, late:G.day>=15, bought:(G.log.bought||0)>0
  };
  return c;
}
function dmFill(txt,th,m,ctx){
  const c=ctx||dmCtx(th,m);
  return String(txt).replace(/\{(\w+)\}/g,(s,k)=>(c[k]!=null&&typeof c[k]!=='boolean')?String(c[k]):s);
}
/* ---------- o tique de cada voz ----------
   O que faz uma voz ser reconhecível em duas linhas sem ler o nome. O Stux
   escreve tudo em minúsculo e fecha com "you feel me?". O Unc deixa escapar
   um -_-' velho. O hakase, a baleia, o oni, a kiv e o Mr. Kaiju escrevem com
   maiúscula, como quem digita com as duas mãos. O discreto começa com "...". */
function dmStyle(txt,who){
  let s=String(txt||'');
  const v=dmVoice(who);
  const r=mulberry(hash32(s+'|'+v))();
  const cap=t=>t.replace(/(^|[.!?]\s+)([a-záéíóúãõâêôç])/g,(m,a,b)=>a+b.toUpperCase());
  if(v==='stux'){
    s=s.replace(/(^|[.!?]\s+)([A-ZÁÉÍÓÚÃÕÂÊÔÇ])(?![A-Z])/g,(m,a,b)=>a+b.toLowerCase());
    if(r<0.28&&!/\?\s*$/.test(s)&&!/feel me|saca\?/.test(s))s=s.replace(/[.]\s*$/,'')+(LANG==='pt'?'. tá ligado?':'. you feel me?');
  } else if(v==='unc'){
    if(r<0.32&&!/-_-|¬¬/.test(s))s=s.replace(/\s*$/,'')+(r<0.16?" -_-'":' ¬¬');
  } else if(v==='hakase'||v==='whale'||v==='oni'||v==='kiv'||v==='mrkaiju'){
    s=cap(s);
  } else if(v==='lurker'){
    if(r<0.25&&!/^\.\.\./.test(s))s='...'+s;
  }
  return s;
}

/* ================= O QUE VOCÊ DIZ ================= */
const DM_SAY={
 hello:{
  warm:[{en:"hey {who}. day {day}, {n} Kaiju in the wallet, floor at {floor}. still standing.",pt:"e aí {who}. dia {day}, {n} Kaiju na carteira, floor em {floor}. ainda de pé."},
        {en:"good to read a name I know. the room is {comm} people now and I recognize about four.",pt:"bom ler um nome que eu conheço. a sala tá com {comm} pessoas e eu reconheço umas quatro."},
        {en:"it is {hour} and I am looking at {best} again. so yeah, fine.",pt:"são {hour} e eu tô olhando pro {best} de novo. então é, tô bem."},
        {en:"still here. still poor. my {bestrace} keeps me company.",pt:"continuo aqui. continuo duro. meu {bestrace} me faz companhia."},
        {en:"minted {minted} today. do not ask about the gas.",pt:"mintei {minted} hoje. não pergunta do gas.",if:c=>c.minted>0},
        {en:"got hacked this week and I am still logging in. that is either loyalty or a problem.",pt:"fui hackeado essa semana e continuo entrando. isso é lealdade ou problema.",if:c=>c.hacked},
        {en:"hype at {hype}. I am not trusting it and I am not leaving either.",pt:"hype em {hype}. não confio e também não saio."},
        {en:"bom dia, {who}. floor {floor}, gas {gas}. same as ever.",pt:"bom dia, {who}. floor {floor}, gas {gas}. tudo igual."}],
  ask: [{en:"honest question: how long have you been holding {race}s?",pt:"pergunta séria: há quanto tempo você segura {race}?"},
        {en:"what do you think the floor does from {floor} this week?",pt:"o que você acha que o floor faz a partir de {floor} essa semana?"},
        {en:"which race are you actually after? mine is {bestrace} and I am not proud of it.",pt:"qual raça você tá caçando de verdade? a minha é {bestrace} e não tenho orgulho."},
        {en:"how did you end up in a room of {comm} people arguing about eyes?",pt:"como você foi parar numa sala de {comm} pessoas discutindo olho?"},
        {en:"do you like the drawings or the numbers? do not say both.",pt:"você gosta do desenho ou do número? não diz os dois."},
        {en:"what do you hold that you would not sell at {floor} times ten?",pt:"o que você tem que não venderia por {floor} vezes dez?"},
        {en:"are you here every day or only when the hype is {hype}?",pt:"você aparece todo dia ou só quando o hype tá em {hype}?"}],
  joke:[{en:"day {day} and I still have not met one person here who sleeps. is this a collection or a cult.",pt:"dia {day} e ainda não conheci uma pessoa aqui que dorme. isso é coleção ou seita."},
        {en:"I have {n} Kaiju and one chair. guess which one cost more.",pt:"tenho {n} Kaiju e uma cadeira. adivinha qual custou mais.",if:c=>c.n>=2},
        {en:"the floor is {floor}. my floor has crumbs on it. both are holding.",pt:"o floor tá em {floor}. o meu chão tem farelo. os dois tão segurando."},
        {en:"hi. I am the person who minted at {gas} gas. please do not tell Stux.",pt:"oi. eu sou a pessoa que mintou com gas {gas}. por favor não conta pro Stux.",if:c=>c.gasHigh&&c.minted>0},
        {en:"if Mr. Kaiju asks, I was never here and you never saw my {bestrace}.",pt:"se o Mr. Kaiju perguntar, eu nunca estive aqui e você nunca viu meu {bestrace}."},
        {en:"it is {hour} and we are both looking at drawings of monsters. what happened to us.",pt:"são {hour} e nós dois olhando desenho de monstro. o que aconteceu com a gente.",if:c=>c.night},
        {en:"I minted {minted} today. my wallet filed a missing persons report.",pt:"mintei {minted} hoje. minha carteira abriu boletim de desaparecimento.",if:c=>c.mintedLots},
        {en:"every time I open Kaki+ the hype is {hype} and my sleep is lower.",pt:"toda vez que abro o Kaki+ o hype tá em {hype} e meu sono tá mais baixo."}],
  cold:[{en:"busy. {n} Kaiju to look at and no time for people.",pt:"ocupado. {n} Kaiju pra olhar e nenhum tempo pra gente."},
        {en:"not in the mood. the floor is {floor} and that is all I can think about.",pt:"não tô a fim. o floor tá em {floor} e é só nisso que eu penso."},
        {en:"later. or not.",pt:"depois. ou não."},
        {en:"nothing to say on day {day}. maybe on day {day}0.",pt:"nada a dizer no dia {day}. talvez no dia {day}0."},
        {en:"what do you want. and it had better not be the {bestrace}.",pt:"o que você quer. e é bom que não seja o {bestrace}."},
        {en:"it is {hour}. no.",pt:"são {hour}. não."}]},

 praise:{
  warm:[{en:"that means something coming from you, {who}. thanks.",pt:"vindo de você isso significa alguma coisa, {who}. valeu."},
        {en:"appreciate it. day {day} and I am still trying to do this without dumping.",pt:"valeu. dia {day} e eu ainda tô tentando fazer isso sem despejar."},
        {en:"thanks. I was not sure anyone in a room of {comm} noticed.",pt:"valeu. não sabia se alguém numa sala de {comm} tinha reparado."},
        {en:"good to hear that on a day the floor is {floor}.",pt:"bom ouvir isso num dia em que o floor tá em {floor}."},
        {en:"I will take it. the {bestrace} and I do not get many.",pt:"vou aceitar. eu e o {bestrace} não recebemos muitos."},
        {en:"thank you. seriously. I bought above floor because the drawing deserved it.",pt:"obrigado. sério. comprei acima do floor porque o desenho merecia.",if:c=>c.bought}],
  ask: [{en:"you noticed? what else have you been watching in my wallet?",pt:"você reparou? o que mais você tá acompanhando na minha carteira?"},
        {en:"good to know it shows. who else here is doing it right?",pt:"bom saber que aparece. quem mais aqui tá fazendo certo?"},
        {en:"which part, exactly? the {bestrace} or the not-dumping?",pt:"que parte, exatamente? o {bestrace} ou o não-despejar?"},
        {en:"you have been watching me that close? I have {n} Kaiju, it is not a big wallet.",pt:"você tá olhando tão de perto assim? tenho {n} Kaiju, não é carteira grande."},
        {en:"does the room think that too or is it just you?",pt:"a sala pensa isso também ou é só você?"},
        {en:"what would you have done different on day {day}?",pt:"o que você teria feito diferente no dia {day}?"}],
  joke:[{en:"careful. compliments here are how a lowball starts.",pt:"cuidado. elogio aqui é como começa um lowball."},
        {en:"put that in writing. Mr. Kaiju needs proof I have a good side.",pt:"põe isso por escrito. o Mr. Kaiju precisa de prova de que eu tenho um lado bom."},
        {en:"I did it by accident. same as everything I do right.",pt:"fiz sem querer. igual a tudo que eu faço certo."},
        {en:"keep going. my {bestrace} needs the self-esteem more than I do.",pt:"continua. meu {bestrace} precisa da autoestima mais que eu."},
        {en:"say it on the feed so the hype does something for once. it is at {hype}.",pt:"fala isso no feed pra o hype servir pra alguma coisa. tá em {hype}."},
        {en:"if that gets me one dollar over floor I will frame it. floor is {floor}, so, small frame.",pt:"se isso me render um dólar acima do floor eu emolduro. o floor tá em {floor}, então, moldura pequena."}],
  cold:[{en:"ok.",pt:"ok."},
        {en:"noted. day {day}.",pt:"anotado. dia {day}."},
        {en:"sure.",pt:"tá."},
        {en:"if you say so.",pt:"se você diz."},
        {en:"I am not doing this for compliments. I am doing it for the {bestrace}.",pt:"não faço isso por elogio. faço pelo {bestrace}."},
        {en:"fine.",pt:"beleza."}]},

 scold:{
  warm:[{en:"you are right. {listed} listed at once was greedy. it will not happen again.",pt:"você tem razão. {listed} listados de uma vez foi ganância. não vai se repetir.",if:c=>c.listed>0},
        {en:"fair. I hear you. the floor is {floor} and I did not help.",pt:"justo. te ouvi. o floor tá em {floor} e eu não ajudei."},
        {en:"yeah. that was not a good look on day {day}.",pt:"é. não pegou bem no dia {day}."},
        {en:"I did it without thinking. my fault, not the market's.",pt:"fiz sem pensar. culpa minha, não do mercado."},
        {en:"point taken. I will slow down. {n} Kaiju is enough to sit on.",pt:"entendi o recado. vou maneirar. {n} Kaiju dá pra sentar em cima."},
        {en:"you are not wrong and I do not like it.",pt:"você não tá errado e eu não gosto disso."}],
  firm:[{en:"I sell what is mine. the floor at {floor} is not my job.",pt:"eu vendo o que é meu. o floor em {floor} não é problema meu."},
        {en:"I did not set {floor}. the market did.",pt:"não fui eu que fiz {floor}. foi o mercado."},
        {en:"everyone in this room of {comm} would have done the same.",pt:"todo mundo nessa sala de {comm} teria feito igual."},
        {en:"I am not running a charity for the chart.",pt:"eu não mantenho uma ONG pro gráfico."},
        {en:"from my side, with {n} Kaiju and gas {gas}, you would say the same.",pt:"do meu lado, com {n} Kaiju e gas {gas}, você diria a mesma coisa."},
        {en:"I am fine with how I played day {day}.",pt:"tô tranquilo com o que eu fiz no dia {day}."}],
  joke:[{en:"the floor is {floor}. I did not drop it, I just walked past it very fast.",pt:"o floor tá em {floor}. eu não derrubei, só passei por ele muito rápido."},
        {en:"in my defense, the {bestrace} started it.",pt:"em minha defesa, o {bestrace} começou."},
        {en:"I listed {listed}. Mr. Kaiju listed my patience.",pt:"eu listei {listed}. o Mr. Kaiju listou a minha paciência.",if:c=>c.listed>0},
        {en:"call it a market event. I am the event.",pt:"chama de evento de mercado. o evento sou eu."},
        {en:"you sound like oni. did oni get a second account.",pt:"você fala igual o oni. o oni fez conta nova."},
        {en:"next time I will dump gently. with a note. 'sorry, {floor}'.",pt:"da próxima eu despejo com carinho. com bilhete. 'desculpa, {floor}'."}],
  cold:[{en:"police somebody else. there are {comm} of us.",pt:"vai vigiar outra pessoa. somos {comm}."},
        {en:"not your wallet, not your call.",pt:"não é sua carteira, não é sua decisão."},
        {en:"take it up with the chart. it is at {floor}.",pt:"reclama com o gráfico. tá em {floor}."},
        {en:"I did not ask.",pt:"eu não perguntei."},
        {en:"you can stop typing.",pt:"pode parar de digitar."},
        {en:"noted and ignored.",pt:"anotado e ignorado."}]},

 ask:{
  warm:[{en:"honestly? day {day} and I am figuring it out like everyone else.",pt:"sinceramente? dia {day} e eu tô descobrindo igual todo mundo."},
        {en:"in your place I would mint when gas is cheap and look at the eyes before the rank.",pt:"no seu lugar eu mintava com gas barato e olhava o olho antes do rank."},
        {en:"no secret. I show up every day and I do not list at floor.",pt:"não tem segredo. eu apareço todo dia e não listo no floor."},
        {en:"buy what you would keep if the floor went from {floor} to zero.",pt:"compra o que você guardaria se o floor fosse de {floor} a zero."},
        {en:"I got most of it wrong the first week. that is the method.",pt:"errei quase tudo na primeira semana. o método é esse."},
        {en:"ask me again on day {day}0, the answer moves.",pt:"me pergunta no dia {day}0, a resposta muda."}],
  firm:[{en:"I will tell you when it stops working on the {race}s.",pt:"eu te conto quando parar de funcionar nos {race}."},
        {en:"figure it out. it is more fun and it is cheaper than gas.",pt:"descobre sozinho. é mais divertido e mais barato que o gas."},
        {en:"that one I keep to myself. the room has {comm} ears.",pt:"essa eu guardo comigo. a sala tem {comm} ouvidos."},
        {en:"if I say it out loud the floor hears it.",pt:"se eu falar em voz alta o floor escuta."},
        {en:"half of it, sure: mint at {gas} gas. the other half is mine.",pt:"metade eu conto: minta com gas {gas}. a outra metade é minha."},
        {en:"you are close. keep going without me.",pt:"você tá perto. continua sem mim."}],
  joke:[{en:"my secret is a {bestrar} rank {rank} and no sleep. write that down.",pt:"meu segredo é um {bestrar} rank {rank} e zero sono. anota."},
        {en:"step one: mint at {gas} gas. step two: cry. step three: post the {bestrace}.",pt:"passo um: minta com gas {gas}. passo dois: chora. passo três: posta o {bestrace}."},
        {en:"I ask Mr. Kaiju. he never answers but the invoice does.",pt:"eu pergunto pro Mr. Kaiju. ele nunca responde mas a fatura responde."},
        {en:"strategy? I have {n} Kaiju and a chair. that is the strategy.",pt:"estratégia? tenho {n} Kaiju e uma cadeira. a estratégia é essa."},
        {en:"buy the ugly ones and wait for beauty standards to change.",pt:"compra os feios e espera o padrão de beleza mudar."},
        {en:"I am {n} Kaiju deep and still guessing. join me, the water is {floor}.",pt:"tô {n} Kaiju de profundidade e ainda chutando. vem, a água tá em {floor}."}],
  cold:[{en:"look it up. the chart is right there.",pt:"procura aí. o gráfico tá ali."},
        {en:"not my job to teach {comm} people.",pt:"não é meu trabalho ensinar {comm} pessoas."},
        {en:"no.",pt:"não."},
        {en:"there is a whole search engine for that.",pt:"existe site de busca pra isso."},
        {en:"I am not your tutorial. kiv wrote a readme.",pt:"eu não sou seu tutorial. a kiv escreveu um readme."},
        {en:"ask someone with time. I have {n} Kaiju to stare at.",pt:"pergunta pra alguém com tempo. eu tenho {n} Kaiju pra encarar."}]},

 beg:{
  give:[{en:"here. {v}. do not make it weird.",pt:"toma. {v}. não faz drama."},
        {en:"take it. pay it forward when the floor is kind to you.",pt:"pega. repassa quando o floor for bom com você."},
        {en:"sent. do not mention it again, especially not on the feed.",pt:"mandei. não fala mais nisso, principalmente no feed."},
        {en:"{v} is on the way. get yourself sorted before gas goes up.",pt:"{v} tá indo. se organiza antes do gas subir."},
        {en:"it is not a loan. stop apologizing.",pt:"não é empréstimo. para de pedir desculpa."},
        {en:"sent it. everybody has a bad day {day}.",pt:"mandei. todo mundo tem um dia {day} ruim."}],
  hold:[{en:"cannot right now. I have {n} Kaiju and no cash. sorry.",pt:"agora não dá. tenho {n} Kaiju e nenhum dinheiro. foi mal."},
        {en:"I am not far above water myself. floor {floor}, gas {gas}.",pt:"eu também tô só um pouco acima da linha d'água. floor {floor}, gas {gas}."},
        {en:"next week maybe. not on day {day}.",pt:"semana que vem talvez. não no dia {day}."},
        {en:"I would if I had it. I got hacked this week.",pt:"se eu tivesse eu mandava. fui hackeado essa semana.",if:c=>c.hacked},
        {en:"my money is all sitting in {n} drawings.",pt:"meu dinheiro tá todo parado em {n} desenhos."},
        {en:"not this time. ask me after Mr. Kaiju is paid.",pt:"dessa vez não. me pergunta depois que o Mr. Kaiju for pago."}],
  joke:[{en:"I would send you {v}, but my money is currently a {bestrace} with a hat.",pt:"eu te mandava {v}, mas meu dinheiro hoje é um {bestrace} de chapéu."},
        {en:"{v}? I do not even have {v} in confidence.",pt:"{v}? eu não tenho nem {v} de autoconfiança."},
        {en:"the last person who asked me for money was Mr. Kaiju and he did not say please either.",pt:"a última pessoa que me pediu dinheiro foi o Mr. Kaiju e ele também não disse por favor."},
        {en:"I can offer you a screenshot of {v}. very lifelike.",pt:"posso te oferecer um print de {v}. muito realista."},
        {en:"ask the floor. it is at {floor} and it owes me too.",pt:"pede pro floor. tá em {floor} e também me deve."},
        {en:"sorry. my wallet is a piggy bank that a Kaiju sat on.",pt:"foi mal. minha carteira é um cofrinho que um Kaiju sentou em cima."}],
  cold:[{en:"no.",pt:"não."},
        {en:"I am not a faucet. the mint is {mint}, go earn it.",pt:"eu não sou torneira. o mint tá {mint}, vai ganhar."},
        {en:"you ask everybody in this room this, right? all {comm}?",pt:"você pede isso pra todo mundo aqui, né? pros {comm}?"},
        {en:"find work like the rest of us. the spotter pays.",pt:"arruma um trampo igual todo mundo. o spotter paga."},
        {en:"that is not what this chat is.",pt:"não é pra isso que serve esse chat."},
        {en:"stop.",pt:"para."}]},

 shill:{
  warm:[{en:"I will take a look. no promises with the floor at {floor}.",pt:"vou dar uma olhada. sem promessa com o floor em {floor}."},
        {en:"you are always early on these. send me the link later.",pt:"você tá sempre cedo nessas. me manda o link depois."},
        {en:"alright. I will read it tonight after the gas drops.",pt:"beleza. leio hoje à noite depois que o gas cair."},
        {en:"you were right about the {race}s once. that is one more than most.",pt:"você acertou sobre os {race} uma vez. é uma a mais que a maioria."},
        {en:"noted. I am slow but I look.",pt:"anotado. eu sou lento mas eu olho."},
        {en:"ok. but I only have {n} Kaiju worth of attention.",pt:"ok. mas eu só tenho {n} Kaiju de atenção."}],
  ask: [{en:"why that one, specifically, on day {day}?",pt:"por que esse, especificamente, no dia {day}?"},
        {en:"who else is in it? names.",pt:"quem mais tá dentro? nomes."},
        {en:"how much of it do you hold, honestly?",pt:"quanto disso você tem, sinceramente?"},
        {en:"what happens to you if you are wrong?",pt:"o que acontece com você se estiver errado?"},
        {en:"are you telling me or telling all {comm} of us?",pt:"você tá falando pra mim ou pra todos os {comm}?"},
        {en:"what is the part you are not saying?",pt:"qual é a parte que você não tá falando?"}],
  joke:[{en:"sure, right after I finish paying for the {gas} gas from day {day}.",pt:"claro, logo depois que eu terminar de pagar o gas {gas} do dia {day}."},
        {en:"is this the thing nobody is watching because nobody is watching.",pt:"é aquela coisa que ninguém tá olhando porque ninguém tá olhando."},
        {en:"you said that about the {bestrace} last week. I still have the {bestrace}.",pt:"você falou isso do {bestrace} semana passada. eu ainda tenho o {bestrace}."},
        {en:"if you are early, I am late. we can meet at the floor. it is {floor}.",pt:"se você tá cedo, eu tô atrasado. a gente se encontra no floor. tá em {floor}."},
        {en:"send me the chart. I like looking at cliffs.",pt:"me manda o gráfico. eu gosto de olhar penhasco."},
        {en:"I only buy things Mr. Kaiju cannot see.",pt:"só compro coisa que o Mr. Kaiju não enxerga."}],
  cold:[{en:"stop selling me things. I have {n} Kaiju and no room.",pt:"para de me vender coisa. tenho {n} Kaiju e nenhum espaço."},
        {en:"I have enough bags. the {bestrace} is one of them.",pt:"já tenho saco demais. o {bestrace} é um deles."},
        {en:"not interested.",pt:"não tô interessado."},
        {en:"this is the third one this week.",pt:"esse é o terceiro essa semana."},
        {en:"no.",pt:"não."},
        {en:"I only buy what I would hang on a wall.",pt:"só compro o que eu penduraria na parede."}]},

 offer:{
  warm:[{en:"appreciate the offer on {kj}. let me think about it.",pt:"valeu pela oferta no {kj}. deixa eu pensar."},
        {en:"{v} for a {rar} is an honest number. I will consider it.",pt:"{v} por um {rar} é número honesto. vou considerar."},
        {en:"that is not an insult, which on day {day} is rare.",pt:"isso não é insulto, o que no dia {day} é raro."},
        {en:"{v} for {kj}. I hear you. the {race} means something to me.",pt:"{v} pelo {kj}. te ouvi. o {race} significa algo pra mim."},
        {en:"leave it on the table. I will sleep on it, if I sleep.",pt:"deixa na mesa. eu durmo com isso, se eu dormir."},
        {en:"you are close to where I say yes on {name}.",pt:"você tá perto de onde eu digo sim no {name}."}],
  firm:[{en:"I like you, but {kj} is worth more than {v}. look at the rank: {rank}.",pt:"eu gosto de você, mas o {kj} vale mais que {v}. olha o rank: {rank}."},
        {en:"I can do it. not at {v}. the floor alone is {floor}.",pt:"dá pra fazer. não por {v}. só o floor é {floor}."},
        {en:"{v} does not move me. the {eyes} eyes do.",pt:"{v} não me move. o olho {eyes} sim."},
        {en:"add something and we talk about {name}.",pt:"põe mais um pouco e a gente conversa sobre o {name}."},
        {en:"that is under what I paid, and I remember what I paid at {gas} gas.",pt:"isso é menos do que eu paguei, e eu lembro quanto paguei com gas {gas}."},
        {en:"no. but keep going. {race}s do not come up every day.",pt:"não. mas continua. {race} não aparece todo dia."}],
  push:[{en:"come on. you know what a {rar} {race} is worth.",pt:"fala sério. você sabe quanto vale um {race} {rar}."},
        {en:"someone else already asked about {kj}. beat them.",pt:"outra pessoa já perguntou do {kj}. supera."},
        {en:"double it and I stop talking about the rank.",pt:"dobra e eu paro de falar do rank."},
        {en:"{v} is a joke and you typed it anyway. rank {rank}.",pt:"{v} é piada e mesmo assim você digitou. rank {rank}."},
        {en:"you want {name}. I can tell from here.",pt:"você quer o {name}. dá pra ver daqui."},
        {en:"{v}? for the {eyes} eyes? no.",pt:"{v}? pelo olho {eyes}? não."}],
  joke:[{en:"{v} for {kj}? his hat costs more than that.",pt:"{v} pelo {kj}? o chapéu dele custa mais que isso."},
        {en:"{v}. {name} is going to hear about this, and he has the {eyes} eyes.",pt:"{v}. o {name} vai ficar sabendo, e ele tem o olho {eyes}."},
        {en:"a {rar} for {v}? the floor is {floor} and it is laughing at both of us.",pt:"um {rar} por {v}? o floor tá em {floor} e tá rindo de nós dois."},
        {en:"I will take {v} if you also take Mr. Kaiju off my back. package deal.",pt:"aceito {v} se você também tirar o Mr. Kaiju do meu pé. pacote."},
        {en:"for {v} I can send you a very detailed description of {kj}.",pt:"por {v} eu te mando uma descrição bem detalhada do {kj}."},
        {en:"{kj} for {v}? in what year. this is day {day}, not day 1.",pt:"{kj} por {v}? em que ano. isso aqui é dia {day}, não dia 1."},
        {en:"my {race} read your offer. he is doing the {eyes} eyes thing again.",pt:"meu {race} leu sua oferta. tá fazendo aquela cara de olho {eyes} de novo."}],
  hold:[{en:"not selling {kj}. nothing personal, everything {race}.",pt:"o {kj} eu não vendo. nada pessoal, tudo {race}."},
        {en:"it stays with me. ask me about one of the other {n}.",pt:"esse fica comigo. me pergunta de um dos outros {n}."},
        {en:"{kj} is off the table. it always was.",pt:"o {kj} tá fora. sempre esteve."},
        {en:"{v} does not fix everything. keep it.",pt:"{v} não resolve tudo. guarda."},
        {en:"I would rather look at {name} than spend him.",pt:"prefiro olhar pro {name} do que gastar ele."},
        {en:"no. and that is the whole answer on this one.",pt:"não. e é essa a resposta inteira nesse aqui."}]},

 raise:{
  warm:[{en:"{v} is fair for a {rar}. thank you for moving.",pt:"{v} é justo por um {rar}. obrigado por subir."},
        {en:"alright. that number I can live with on {kj}.",pt:"beleza. com esse número eu vivo no {kj}."},
        {en:"you did not have to go that far above {floor}. thanks.",pt:"você não precisava ir tão acima de {floor}. valeu."},
        {en:"now it feels like a deal and not a favor.",pt:"agora parece negócio e não favor."},
        {en:"{v} works. you argued honestly about the rank.",pt:"{v} funciona. você discutiu honesto sobre o rank."},
        {en:"ok. that is the one for {name}.",pt:"ok. é essa pro {name}."}],
  firm:[{en:"almost. one more step and {kj} is yours.",pt:"quase. mais um passo e o {kj} é seu."},
        {en:"close enough to keep talking about the {race}.",pt:"perto o bastante pra continuar falando do {race}."},
        {en:"you know the number I am waiting for. it starts above {floor}.",pt:"você sabe o número que eu espero. começa acima de {floor}."},
        {en:"half a step. that is all I am asking on a rank {rank}.",pt:"meio passo. é só isso que eu peço num rank {rank}."},
        {en:"still under. still talking, though.",pt:"ainda abaixo. mas ainda conversando."},
        {en:"meet me where we both feel a little bad.",pt:"encontra comigo onde os dois ficam meio mal."}],
  push:[{en:"you moved once on {kj}. you can move again.",pt:"você subiu uma vez no {kj}. pode subir de novo."},
        {en:"I am not in a hurry. you are the one who wants {name}.",pt:"eu não tenho pressa. quem quer o {name} é você."},
        {en:"that was the warm up.",pt:"isso foi o aquecimento."},
        {en:"you jumped that fast? then there is more.",pt:"subiu tão rápido? então tem mais."},
        {en:"keep going. the {eyes} eyes are watching.",pt:"continua. o olho {eyes} tá olhando."},
        {en:"one more and I stop being difficult about the {race}.",pt:"mais um e eu paro de ser chato com o {race}."}],
  joke:[{en:"you moved. so did the floor. it is {floor} and it did not even ask.",pt:"você subiu. o floor também. tá em {floor} e nem pediu licença."},
        {en:"{v}. now we are negotiating like adults with monster drawings.",pt:"{v}. agora a gente negocia como adulto com desenho de monstro."},
        {en:"at this rate you will own {kj} by day {day}0.",pt:"nesse ritmo você fica com o {kj} no dia {day}0."},
        {en:"one more step and I tell {name} he is worth something.",pt:"mais um passo e eu conto pro {name} que ele vale alguma coisa."},
        {en:"you are haggling with someone who paid {gas} gas. I have already lost.",pt:"você tá pechinchando com alguém que pagou gas {gas}. eu já perdi."},
        {en:"{v} is nice. {v} plus you telling oni I am a good person is nicer.",pt:"{v} é bom. {v} mais você contar pro oni que eu sou gente boa é melhor."}],
  hold:[{en:"you know what, I am keeping {kj}.",pt:"quer saber, vou ficar com o {kj}."},
        {en:"I changed my mind. {name} stays.",pt:"mudei de ideia. o {name} fica."},
        {en:"the more you want it the less I want to sell it.",pt:"quanto mais você quer, menos eu quero vender."},
        {en:"off the table. sorry for the time.",pt:"fora da mesa. desculpa o tempo."},
        {en:"no number today. maybe no number ever on the {race}.",pt:"hoje não tem número. talvez nunca tenha no {race}."},
        {en:"keep your {v}. I keep the picture.",pt:"fica com seus {v}. eu fico com o desenho."}]},

 gift:{
  warm:[{en:"you did not have to. {v} on day {day}. thank you, really.",pt:"você não precisava. {v} no dia {day}. obrigado de verdade."},
        {en:"that is kind. I will remember it next time you ask about the {bestrace}.",pt:"isso é gentil. vou lembrar na próxima vez que você perguntar do {bestrace}."},
        {en:"{v} out of nowhere. thank you.",pt:"{v} do nada. obrigado."},
        {en:"this place is rough and you did that anyway.",pt:"esse lugar é pesado e mesmo assim você fez isso."},
        {en:"I will do the same for someone else when the floor lets me.",pt:"vou fazer o mesmo por outra pessoa quando o floor deixar."},
        {en:"thank you. I am writing your name down next to the {bestrace}.",pt:"obrigado. tô anotando seu nome do lado do {bestrace}."}],
  take:[{en:"received.",pt:"recebido."},
        {en:"ok.",pt:"ok."},
        {en:"got it.",pt:"chegou."},
        {en:"noted.",pt:"anotado."},
        {en:"sure.",pt:"tá."},
        {en:"...",pt:"..."}],
  joke:[{en:"{v}? are you sure you are in the right chat. this is the broke one.",pt:"{v}? tem certeza que é o chat certo. esse aqui é o dos duros."},
        {en:"forwarding it straight to Mr. Kaiju. he says hi.",pt:"repassando direto pro Mr. Kaiju. ele manda um oi."},
        {en:"{v} out of nowhere. the {bestrace} and I are speechless. well, he always is.",pt:"{v} do nada. eu e o {bestrace} sem palavras. bom, ele sempre tá."},
        {en:"this covers exactly one mint at {gas} gas. you are a hero for one mint.",pt:"isso cobre exatamente um mint com gas {gas}. você é herói por um mint."},
        {en:"you gave money to someone with {n} Kaiju. that is charity in reverse.",pt:"você deu dinheiro pra alguém com {n} Kaiju. isso é caridade ao contrário."},
        {en:"I will spend it on something dumb. tradition.",pt:"vou gastar em algo idiota. tradição."}],
  give:[{en:"keep it. you need it more than my {n} Kaiju do.",pt:"fica com ele. você precisa mais que os meus {n} Kaiju."},
        {en:"I cannot take {v}. put it back in your wallet.",pt:"não posso aceitar {v}. põe de volta na sua carteira."},
        {en:"sending it back. I am fine, floor at {floor} and all.",pt:"devolvendo. eu tô bem, floor em {floor} e tudo."},
        {en:"you are the one having a bad week.",pt:"quem tá tendo uma semana ruim é você."},
        {en:"no. buy yourself something with {eyes} eyes.",pt:"não. compra pra você alguma coisa com olho {eyes}."},
        {en:"back to you. do not argue.",pt:"de volta pra você. não discute."}]},

 virus:{
  warn:[{en:"do not send that to anyone else. your machine is talking for you.",pt:"não manda isso pra mais ninguém. sua máquina tá falando por você."},
        {en:"that file is not yours. you are compromised.",pt:"esse arquivo não é seu. você foi comprometido."},
        {en:"somebody is using your account. change everything tonight.",pt:"alguém tá usando sua conta. troca tudo hoje."},
        {en:"you did not type that. get off and clean the machine.",pt:"não foi você que digitou isso. sai e limpa a máquina."},
        {en:"I have seen this exact file three times since day {day}.",pt:"eu já vi esse arquivo exato três vezes desde o dia {day}."},
        {en:"check your other chats. it went to all {comm} of us.",pt:"olha suas outras conversas. foi pra todos os {comm}."}],
  wipe:[{en:"deleted. not opening that.",pt:"apaguei. não vou abrir isso."},
        {en:"nice try.",pt:"boa tentativa."},
        {en:"gone. next.",pt:"apagado. próximo."},
        {en:"I do not open files from anyone. got hacked once already.",pt:"eu não abro arquivo de ninguém. já fui hackeado uma vez."},
        {en:"in the bin.",pt:"foi pro lixo."},
        {en:"no.",pt:"não."}],
  open:[{en:"what is it, a screenshot of the {bestrace}?",pt:"o que é, um print do {bestrace}?"},
        {en:"opening. this had better be good.",pt:"abrindo. é bom que preste."},
        {en:"one file cannot hurt. probably.",pt:"um arquivo não mata ninguém. provavelmente."},
        {en:"if this is a leak of the rarity sheet I want to see it first.",pt:"se isso é vazamento da planilha de raridade eu quero ver primeiro."},
        {en:"fine. curiosity wins at {hour}.",pt:"tá. a curiosidade ganhou às {hour}."},
        {en:"double clicking. do not disappoint me.",pt:"clicando duas vezes. não me decepciona."}]},

 seed:{
  warn:[{en:"DELETE THAT. right now. that is your whole wallet.",pt:"APAGA ISSO. agora. é a sua carteira inteira."},
        {en:"stop. never paste that anywhere. move your funds.",pt:"para. nunca cola isso em lugar nenhum. move seus fundos."},
        {en:"close the window. make a new wallet today.",pt:"fecha a janela. faz uma carteira nova hoje."},
        {en:"assume other people saw it too. move everything.",pt:"assume que mais gente viu. move tudo."},
        {en:"that is not a password. that is the door.",pt:"isso não é senha. isso é a porta."},
        {en:"I am not reading it. neither should you.",pt:"eu não tô lendo. você também não devia."}],
  wipe:[{en:"I did not read it. clear your messages.",pt:"eu não li. limpa suas mensagens."},
        {en:"gone from my side. be careful.",pt:"apagado do meu lado. toma cuidado."},
        {en:"deleted here. do the same there.",pt:"apaguei aqui. faz o mesmo aí."},
        {en:"it is off my screen. breathe.",pt:"saiu da minha tela. respira."},
        {en:"wiped. we never saw it.",pt:"apagado. a gente nunca viu isso."},
        {en:"done. change it anyway.",pt:"pronto. troca mesmo assim."}],
  take:[{en:"...",pt:"..."},
        {en:"ok.",pt:"ok."},
        {en:"did not see anything.",pt:"não vi nada."},
        {en:"wrong window happens.",pt:"janela errada acontece."},
        {en:"sure.",pt:"tá."},
        {en:"no problem.",pt:"sem problema."}]},

 nosell:{
  vow: [{en:"you have my word. {kj} does not get listed.",pt:"tem minha palavra. o {kj} não vai pra venda."},
        {en:"{name} stays in the wallet. I will not touch him.",pt:"o {name} fica na carteira. eu não encosto nele."},
        {en:"ok. {kj} is there for you to visit whenever.",pt:"beleza. o {kj} fica aí pra você visitar quando quiser."},
        {en:"done. the {race} is not for sale, today or on day {day}0.",pt:"fechado. o {race} não tá à venda, hoje nem no dia {day}0."},
        {en:"I will keep it. hold me to it.",pt:"vou guardar. pode cobrar."},
        {en:"consider {kj} locked.",pt:"considera o {kj} trancado."}],
  ask: [{en:"why {kj}, out of all {n}?",pt:"por que justo o {kj}, entre os {n}?"},
        {en:"what do you see in {name}?",pt:"o que você vê no {name}?"},
        {en:"did you almost mint it or something?",pt:"você quase mintou ele ou o quê?"},
        {en:"is it the {eyes} eyes? it is always the eyes.",pt:"é o olho {eyes}? é sempre o olho."},
        {en:"you have been watching {kj} this whole time?",pt:"você tava olhando pro {kj} esse tempo todo?"},
        {en:"why not just buy it from me, then? the floor is {floor}.",pt:"e por que você não compra de mim, então? o floor tá em {floor}."}],
  firm:[{en:"no promises. if the number is right {kj} goes.",pt:"sem promessa. se o número for bom o {kj} vai."},
        {en:"I will not lie to you: everything I own is for sale above {floor}.",pt:"não vou mentir: tudo que eu tenho tá à venda acima de {floor}."},
        {en:"I cannot hold a drawing for a stranger.",pt:"não dá pra segurar um desenho por um estranho."},
        {en:"if you want {name} kept, keep him yourself.",pt:"se você quer o {name} guardado, guarda você."},
        {en:"I hear you. I am still not promising on a {rar}.",pt:"te entendi. mas não vou prometer num {rar}."},
        {en:"ask me the day someone offers too much for the {race}.",pt:"me pergunta no dia que alguém oferecer demais pelo {race}."}],
  joke:[{en:"keep {kj}? he keeps me. I just pay the gas.",pt:"guardar o {kj}? ele que me guarda. eu só pago o gas."},
        {en:"{kj} stays. he has the {eyes} eyes and I cannot say no to them either.",pt:"o {kj} fica. ele tem o olho {eyes} e eu também não consigo dizer não pra ele."},
        {en:"sell {name}? he is the only one in the wallet who does not look disappointed in me.",pt:"vender o {name}? é o único na carteira que não olha pra mim decepcionado."},
        {en:"I will keep it. Mr. Kaiju might not, but I will.",pt:"eu vou guardar. o Mr. Kaiju talvez não, mas eu vou."},
        {en:"relax. nobody offers on a rank {rank}. not even by accident.",pt:"relaxa. ninguém faz oferta num rank {rank}. nem sem querer."},
        {en:"not for sale. he is for staring at at {hour}.",pt:"não tá à venda. ele é pra encarar às {hour}."}],
  cold:[{en:"it is my wallet.",pt:"a carteira é minha."},
        {en:"you do not get to reserve my {race}.",pt:"você não reserva o meu {race}."},
        {en:"weird thing to ask a stranger on day {day}.",pt:"pergunta estranha pra fazer pra um estranho no dia {day}."},
        {en:"no.",pt:"não."},
        {en:"I will do whatever I want with {kj}.",pt:"faço o que eu quiser com o {kj}."},
        {en:"not your Kaiju, not your problem.",pt:"o Kaiju não é seu, o problema não é seu."}]},

 trade:{
  swap:[{en:"deal. sending {kj} over now.",pt:"fechado. mandando o {kj} agora."},
        {en:"alright, straight swap. {race} for {race2}. no hard feelings later.",pt:"beleza, troca seca. {race} por {race2}. sem mágoa depois."},
        {en:"done. I like {kj2} more than mine anyway.",pt:"fechado. eu gosto mais do {kj2} que do meu mesmo."},
        {en:"swapping. this is the fun part of all this.",pt:"trocando. essa é a parte divertida disso tudo."},
        {en:"yours for mine. we both get something Mr. Kaiju cannot tax.",pt:"o seu pelo meu. os dois levam algo que o Mr. Kaiju não taxa."},
        {en:"ok. do not come back on day {day}0 saying you regret it.",pt:"ok. depois não vem no dia {day}0 dizer que se arrependeu."}],
  firm:[{en:"close. put some money on top of {kj2} and it is done.",pt:"quase. põe um dinheiro em cima do {kj2} e tá feito."},
        {en:"{kj2} is nice. {kj} is a {rar}. sweeten it.",pt:"o {kj2} é bonito. o {kj} é {rar}. adoça aí."},
        {en:"even swap? no. add cash. the floor is {floor}.",pt:"troca seca? não. põe grana. o floor tá em {floor}."},
        {en:"I would need something on top of a {race2}.",pt:"eu ia precisar de algo em cima de um {race2}."},
        {en:"the ranks are not the same and you know it. mine is {rank}.",pt:"os ranks não são iguais e você sabe. o meu é {rank}."},
        {en:"make it worth the paperwork.",pt:"faz valer a papelada."}],
  hold:[{en:"I am keeping {kj}. {kj2} is nice though.",pt:"vou ficar com o {kj}. mas o {kj2} é bonito."},
        {en:"no swap. {name} has been with me since day {day}.",pt:"sem troca. o {name} tá comigo desde o dia {day}."},
        {en:"not this one. try me with another {race2}.",pt:"esse não. tenta com outro {race2}."},
        {en:"I do not trade the ones I actually look at.",pt:"eu não troco os que eu olho de verdade."},
        {en:"keep yours. I keep mine.",pt:"fica com o seu. eu fico com o meu."},
        {en:"no. but ask me again in a month.",pt:"não. mas me pergunta daqui um mês."}],
  joke:[{en:"{kj2} for {kj}? that is a hat trade. let me ask the hat.",pt:"{kj2} pelo {kj}? isso é troca de chapéu. deixa eu perguntar pro chapéu."},
        {en:"you want the one with the {eyes} eyes. everyone wants the one with the {eyes} eyes.",pt:"você quer o de olho {eyes}. todo mundo quer o de olho {eyes}."},
        {en:"a swap, no cash? finally a deal Mr. Kaiju cannot tax.",pt:"troca, sem dinheiro? finalmente um negócio que o Mr. Kaiju não taxa."},
        {en:"give me a minute. {name} does not like moving.",pt:"me dá um minuto. o {name} não gosta de mudar de casa."},
        {en:"I have {n} of these and you found the one I look at. suspicious.",pt:"tenho {n} desses e você achou justo o que eu olho. suspeito."},
        {en:"if it goes badly we blame the floor. it is {floor}, it can take it.",pt:"se der errado a gente culpa o floor. tá em {floor}, ele aguenta."}],
  cold:[{en:"that is not a trade, that is a favor for you.",pt:"isso não é troca, é favor pra você."},
        {en:"no. and you knew that before typing {kj2}.",pt:"não. e você já sabia antes de digitar {kj2}."},
        {en:"I am not swapping a {rar} down.",pt:"eu não troco um {rar} pra baixo."},
        {en:"stop.",pt:"para."},
        {en:"look at the ranks again.",pt:"olha os ranks de novo."},
        {en:"no deal. move on.",pt:"sem acordo. segue."}]},

 alert:{
  warm:[{en:"thanks for the heads up. I will not touch it.",pt:"valeu pelo aviso. não vou encostar."},
        {en:"good looking out. that saves me a bad night on day {day}.",pt:"valeu por olhar. isso me salva de uma noite ruim no dia {day}."},
        {en:"noted. the link stays unclicked.",pt:"anotado. o link fica sem clique."},
        {en:"I almost clicked one of those after the hack.",pt:"eu quase cliquei num desses depois do hack.",if:c=>c.hacked},
        {en:"thank you. in a room of {comm} people nobody warns anyone.",pt:"obrigado. numa sala de {comm} pessoas ninguém avisa ninguém."},
        {en:"got it. hands off.",pt:"entendi. mãos longe."}],
  warn:[{en:"I am telling everyone I know. thanks.",pt:"vou avisar todo mundo que eu conheço. valeu."},
        {en:"passing this around. people are going to lose wallets tonight.",pt:"vou espalhar isso. gente vai perder carteira hoje."},
        {en:"sending it to the others right now.",pt:"mandando pros outros agora."},
        {en:"this needs to be louder than the scam is.",pt:"isso precisa ser mais alto que o golpe."},
        {en:"spreading it. somebody with {n} Kaiju was going to click.",pt:"espalhando. alguém com {n} Kaiju ia clicar."},
        {en:"on it. two people already asked me about that link.",pt:"já vou. duas pessoas já me perguntaram desse link."}],
  joke:[{en:"thanks. I was about to click it with my whole savings, which is {floor}.",pt:"valeu. eu ia clicar com toda a minha poupança, que é {floor}."},
        {en:"a wallet checker? mine says 'sad'. very accurate.",pt:"checador de carteira? o meu diz 'triste'. bem preciso."},
        {en:"same font and everything? at least the scammers respect the design.",pt:"mesma fonte e tudo? pelo menos o golpista respeita o design."},
        {en:"I do not click links. I click 'mint' at {gas} gas. different disease.",pt:"eu não clico em link. eu clico em 'mint' com gas {gas}. outra doença."},
        {en:"three people drained today and none were me. character growth.",pt:"três pessoas limpas hoje e nenhuma fui eu. evolução pessoal."},
        {en:"if they take my {bestrace} they have to take Mr. Kaiju too. that is the rule.",pt:"se levarem meu {bestrace} têm que levar o Mr. Kaiju junto. é a regra."}],
  cold:[{en:"everything here is a scam. news at eleven.",pt:"aqui é tudo golpe. novidade nenhuma."},
        {en:"I can look after myself. did it since day 1.",pt:"eu me viro sozinho. desde o dia 1."},
        {en:"sure, whatever.",pt:"tá, sei."},
        {en:"you sound like the last person who scammed me.",pt:"você fala igual o último que me deu golpe."},
        {en:"I did not ask for security advice.",pt:"não pedi conselho de segurança."},
        {en:"ok, mom.",pt:"tá bom, mãe."}]},

 plug:{
  post:[{en:"posted. do not make me regret it in front of {comm} people.",pt:"postei. não me faz me arrepender na frente de {comm} pessoas."},
        {en:"alright, it is up. my name is on it now.",pt:"beleza, tá no ar. meu nome tá nisso agora."},
        {en:"wrote something short. I do not do hype, the hype is at {hype} on its own.",pt:"escrevi algo curto. eu não faço hype, o hype tá em {hype} sozinho."},
        {en:"done. I said what I actually think, no more.",pt:"feito. falei o que eu penso mesmo, nada além."},
        {en:"it is on the feed. that is all I can do.",pt:"tá no feed. é tudo que eu posso fazer."},
        {en:"posted it. if it ages badly that is on both of us.",pt:"postei. se envelhecer mal a conta é dos dois."}],
  ask: [{en:"what exactly do you want me to say?",pt:"o que exatamente você quer que eu diga?"},
        {en:"why do you need my name on it? I have {n} Kaiju, not a following.",pt:"por que você precisa do meu nome nisso? tenho {n} Kaiju, não uma torcida."},
        {en:"how many people did you ask before me?",pt:"quantas pessoas você chamou antes de mim?"},
        {en:"are you holding it or just talking about it?",pt:"você tá segurando ou só falando?"},
        {en:"what happens to me if this goes wrong on day {day}?",pt:"o que acontece comigo se isso der errado no dia {day}?"},
        {en:"is this your idea or somebody else's?",pt:"a ideia é sua ou de outra pessoa?"}],
  hold:[{en:"not today. my feed is not for rent.",pt:"hoje não. meu feed não é aluguel."},
        {en:"I post about what I hold. that is the rule.",pt:"eu posto do que eu tenho. essa é a regra."},
        {en:"maybe later, when I believe it.",pt:"talvez depois, quando eu acreditar."},
        {en:"I will read it first. then we talk.",pt:"leio primeiro. aí a gente conversa."},
        {en:"no post today. nothing against you.",pt:"hoje sem post. nada contra você."},
        {en:"I would rather stay quiet than be wrong loudly.",pt:"prefiro ficar quieto a errar alto."}],
  joke:[{en:"post about it? my last post got two likes and one of them was me.",pt:"postar sobre isso? meu último post teve duas curtidas e uma foi minha."},
        {en:"my name is worth about {floor}. same as the floor. you sure.",pt:"meu nome vale uns {floor}. igual o floor. tem certeza."},
        {en:"I will post it if the hype does anything besides sit at {hype}.",pt:"eu posto se o hype fizer algo além de ficar parado em {hype}."},
        {en:"one post from me and oni starts a thread about it.",pt:"um post meu e o oni abre uma thread sobre isso."},
        {en:"I can post it right after I post about my {n} unsold Kaiju.",pt:"posso postar logo depois de postar sobre meus {n} Kaiju encalhados."},
        {en:"sure. what do I say. 'buy it, I have a {bestrace} and no plan'?",pt:"claro. o que eu digo. 'compra, eu tenho um {bestrace} e nenhum plano'?"}],
  cold:[{en:"I am not your megaphone.",pt:"eu não sou seu megafone."},
        {en:"no. and stop asking all {comm} of us this.",pt:"não. e para de pedir isso pros {comm}."},
        {en:"shill it yourself.",pt:"faz o shill você mesmo."},
        {en:"that is how people lose their name here.",pt:"é assim que as pessoas perdem o nome aqui."},
        {en:"no.",pt:"não."},
        {en:"ask me for money instead. it is more honest.",pt:"me pede dinheiro, é mais honesto."}]},

 accuse:{
  warm:[{en:"let us slow down. tell me what happened and when.",pt:"vamos com calma. me conta o que aconteceu e quando."},
        {en:"I get why you are angry. it was not me, though.",pt:"entendo você estar bravo. mas não fui eu."},
        {en:"that would be a terrible thing to do. I did not.",pt:"isso seria uma coisa horrível de fazer. eu não fiz."},
        {en:"somebody did that to you and it was not me. I was minting at {gas} gas.",pt:"alguém fez isso com você e não fui eu. eu tava mintando com gas {gas}."},
        {en:"I am not going to fight you over this.",pt:"não vou brigar com você por isso."},
        {en:"if I had done it I would say so. I have {n} Kaiju and nothing to hide.",pt:"se eu tivesse feito eu diria. tenho {n} Kaiju e nada a esconder."}],
  ask: [{en:"show me where you got that.",pt:"me mostra de onde você tirou isso."},
        {en:"who told you it was me? there are {comm} people here.",pt:"quem te disse que fui eu? tem {comm} pessoas aqui."},
        {en:"what time did it happen? I want to check.",pt:"que horas foi? eu quero conferir."},
        {en:"do you have anything, or just a feeling?",pt:"você tem alguma coisa ou só um pressentimento?"},
        {en:"name the person who said my name.",pt:"diz o nome de quem falou o meu."},
        {en:"walk me through it. I will wait.",pt:"me explica do começo. eu espero."}],
  firm:[{en:"that was not me. that is the whole answer.",pt:"não fui eu. é essa a resposta inteira."},
        {en:"I did not do it and I am not proving it to you.",pt:"eu não fiz e não vou provar pra você."},
        {en:"you are wrong. it happens on day {day} like any day.",pt:"você tá errado. acontece no dia {day} como em qualquer dia."},
        {en:"no. next question.",pt:"não. próxima pergunta."},
        {en:"believe what you want. I know what I did.",pt:"acredita no que quiser. eu sei o que eu fiz."},
        {en:"wrong person, and you are being loud about it.",pt:"pessoa errada, e você tá fazendo barulho."}],
  joke:[{en:"I cannot snipe a listing. I cannot even snipe my own gas.",pt:"eu não consigo snipar listagem. não consigo nem snipar meu próprio gas."},
        {en:"the only thing I have stolen this week is sleep from myself.",pt:"a única coisa que eu roubei essa semana foi o meu próprio sono."},
        {en:"if I had the skill you are accusing me of I would not be rank {rank} in life.",pt:"se eu tivesse a habilidade que você tá me acusando eu não seria rank {rank} na vida."},
        {en:"Mr. Kaiju is the thief in this room and he sends receipts.",pt:"o ladrão dessa sala é o Mr. Kaiju e ele manda recibo."},
        {en:"my alibi is {n} Kaiju and a chair. they will all confirm.",pt:"meu álibi são {n} Kaiju e uma cadeira. todos confirmam."},
        {en:"you have the wrong guy. I am the guy who bought at the top.",pt:"pegou a pessoa errada. eu sou o que comprou no topo."}],
  cold:[{en:"get my name out of your mouth.",pt:"tira meu nome da sua boca."},
        {en:"we are done talking.",pt:"conversa encerrada."},
        {en:"I am not reading the rest of this.",pt:"não vou ler o resto disso."},
        {en:"keep going and I stop reading you for good.",pt:"continua assim e eu paro de te ler de vez."},
        {en:"you are embarrassing yourself in front of {comm} people.",pt:"você tá passando vergonha na frente de {comm} pessoas."},
        {en:"no.",pt:"não."}]},

 return:{
  warm:[{en:"look who is alive. the floor is {floor} now, in case you wondered.",pt:"olha quem tá vivo. o floor tá em {floor} agora, se você queria saber."},
        {en:"you disappeared. this place got quieter and Mr. Kaiju got louder.",pt:"você sumiu. aqui ficou mais quieto e o Mr. Kaiju mais barulhento."},
        {en:"welcome back. nothing important happened. the hype is {hype}.",pt:"bem-vindo de volta. não perdeu nada importante. o hype tá em {hype}."},
        {en:"I wondered about you. glad you are around on day {day}.",pt:"fiquei pensando em você. que bom que apareceu no dia {day}."},
        {en:"you missed a lot of nothing. sit down.",pt:"você perdeu um monte de nada. senta aí."},
        {en:"hey. same chair, same wallet, {n} Kaiju now.",pt:"e aí. mesma cadeira, mesma carteira, {n} Kaiju agora."}],
  ask: [{en:"where did you go?",pt:"onde você se meteu?"},
        {en:"what happened? you stopped writing.",pt:"o que aconteceu? você parou de escrever."},
        {en:"did you sell everything and run?",pt:"você vendeu tudo e correu?"},
        {en:"was it life or was it the chart?",pt:"foi a vida ou foi o gráfico?"},
        {en:"back for good or just passing through?",pt:"voltou de vez ou só passando?"},
        {en:"do you still have your Kaiju?",pt:"você ainda tem seus Kaiju?"}],
  joke:[{en:"you left when the floor was nothing and it is {floor} now. it missed you more than I did.",pt:"você saiu quando o floor não era nada e agora tá em {floor}. ele sentiu mais sua falta que eu."},
        {en:"we thought Mr. Kaiju took you. he takes everything else.",pt:"a gente achou que o Mr. Kaiju tinha te levado. ele leva todo o resto."},
        {en:"welcome back. the room is the same, the hype is a fake {hype}, and Stux still says bro.",pt:"bem-vindo de volta. a sala é a mesma, o hype é um {hype} de mentira, e o Stux ainda diz bro."},
        {en:"did you sell? no? then you are still one of us. sit down.",pt:"vendeu? não? então ainda é um dos nossos. senta aí."},
        {en:"while you were gone I got {n} Kaiju and zero sleep. balance.",pt:"enquanto você sumiu eu juntei {n} Kaiju e zero sono. equilíbrio."},
        {en:"the chair you left is still here. someone posted on it.",pt:"a cadeira que você deixou ainda tá aqui. alguém postou nela."}],
  cold:[{en:"who is this again?",pt:"quem é você mesmo?"},
        {en:"long time. I moved on.",pt:"faz tempo. eu segui em frente."},
        {en:"you left. that was the message.",pt:"você foi embora. a mensagem foi essa."},
        {en:"I do not do reunions.",pt:"eu não faço reencontro."},
        {en:"not really interested.",pt:"não tô muito interessado."},
        {en:"we were not that close.",pt:"a gente não era tão próximo assim."}]},

 echo:{
  warm:[{en:"alright.",pt:"beleza."},{en:"ok.",pt:"ok."},{en:"sure.",pt:"tá."},
        {en:"yeah.",pt:"é."},{en:"fine by me.",pt:"por mim tudo bem."},{en:"understood.",pt:"entendi."}],
  ask: [{en:"and then?",pt:"e aí?"},{en:"meaning?",pt:"como assim?"},{en:"such as?",pt:"tipo o quê?"},
        {en:"go on.",pt:"continua."},{en:"why?",pt:"por quê?"},{en:"since when?",pt:"desde quando?"}],
  joke:[{en:"anyway. day {day}. we live.",pt:"enfim. dia {day}. a gente vive."},
        {en:"the {bestrace} says hi, by the way.",pt:"o {bestrace} manda um oi, aliás."},
        {en:"floor {floor}, hype {hype}, me: fine.",pt:"floor {floor}, hype {hype}, eu: de boa."}],
  cold:[{en:"done talking.",pt:"conversa encerrada."},{en:"we are done.",pt:"acabou."},{en:"enough.",pt:"chega."},
        {en:"bye.",pt:"falou."},{en:"no more of this.",pt:"chega disso."},{en:"stop.",pt:"para."}]}
};

/* ================= O QUE ELA RESPONDE ================= */
const DM_BACK={
 hello:{
  warm:[{en:"good. {n} Kaiju and still polite. that is rarer than a {bestrar}.",pt:"que bom. {n} Kaiju e ainda educado. isso é mais raro que um {bestrar}."},
        {en:"same here. slow day {day}. floor at {floor} doing nothing.",pt:"aqui também. dia {day} devagar. floor em {floor} parado."},
        {en:"nice to read a normal sentence in a room of {comm}.",pt:"bom ler uma frase normal numa sala de {comm}."},
        {en:"then we are both still here. that is the whole club.",pt:"então nós dois ainda tamo aqui. o clube é esse."},
        {en:"good. keep the {bestrace}. it suits you.",pt:"ótimo. fica com o {bestrace}. combina com você."},
        {en:"I will let you get back to staring at {best}.",pt:"vou te deixar voltar a encarar o {best}."}],
  ask: [{en:"since day 1. I am not going anywhere, the floor can do what it wants.",pt:"desde o dia 1. não vou a lugar nenhum, o floor que faça o que quiser."},
        {en:"long enough to have opinions about {race}s.",pt:"tempo o bastante pra ter opinião sobre {race}."},
        {en:"I got here through the drawings, like everyone who stayed.",pt:"cheguei pelos desenhos, igual todo mundo que ficou."},
        {en:"flat from {floor}, probably. it always is until it is not.",pt:"de lado a partir de {floor}, provavelmente. sempre é até não ser."},
        {en:"the ugly ones. I have a type.",pt:"os feios. eu tenho um tipo."},
        {en:"not telling you. you would buy them before me.",pt:"não te conto. você ia comprar antes de mim."}],
  cold:[{en:"understood.",pt:"entendido."},
        {en:"another day then. there are {comm} others to talk to.",pt:"fica pra outro dia então. tem {comm} outros pra conversar."},
        {en:"sorry to bother at {hour}.",pt:"desculpa incomodar às {hour}."},
        {en:"sure.",pt:"tá."},
        {en:"I will stop.",pt:"vou parar."},
        {en:"ok. bye.",pt:"tá. falou."}]},

 praise:{
  warm:[{en:"keep doing it. people in here notice more than you think.",pt:"continua. as pessoas aqui reparam mais do que você pensa."},
        {en:"I mean it. this place needs a few of you and it has {comm} of the other kind.",pt:"falo sério. esse lugar precisa de uns como você e tem {comm} do outro tipo."},
        {en:"do not let it go to your head. the floor is still {floor}.",pt:"não deixa subir pra cabeça. o floor ainda tá em {floor}."},
        {en:"you are welcome. that is all.",pt:"de nada. é isso."},
        {en:"just saying it out loud once.",pt:"só falando em voz alta uma vez."},
        {en:"good. see you around day {day}0.",pt:"ótimo. até o dia {day}0."}],
  ask: [{en:"a few of you. not many. maybe four in {comm}.",pt:"uns poucos. não muitos. talvez quatro em {comm}."},
        {en:"mostly you and two other people.",pt:"basicamente você e mais duas pessoas."},
        {en:"the way you talk about the {bestrace}, mostly.",pt:"principalmente o jeito que você fala do {bestrace}."},
        {en:"you never lowball anyone. rarer than it sounds.",pt:"você não dá lance ridículo em ninguém. é mais raro do que parece."},
        {en:"I watch everything. it is my whole hobby.",pt:"eu olho tudo. é meu hobby inteiro."},
        {en:"the room says the same, quieter.",pt:"a sala diz o mesmo, mais baixo."}],
  cold:[{en:"forget I said anything.",pt:"esquece que eu falei."},
        {en:"wow. ok.",pt:"nossa. tá."},
        {en:"noted.",pt:"anotado."},
        {en:"I will not do that again.",pt:"não faço de novo."},
        {en:"cool.",pt:"tá bom."},
        {en:"sorry for the compliment.",pt:"desculpa o elogio."}]},

 scold:{
  warm:[{en:"good. that is all I wanted.",pt:"ótimo. era só isso que eu queria."},
        {en:"then we are fine. the floor will heal from {floor}.",pt:"então tamo bem. o floor se recupera de {floor}."},
        {en:"I know it is not easy with {n} Kaiju. thank you.",pt:"sei que não é fácil com {n} Kaiju. obrigado."},
        {en:"that is more than most of the {comm} would say.",pt:"é mais do que a maioria dos {comm} diria."},
        {en:"alright. I will drop it.",pt:"beleza. deixo pra lá."},
        {en:"see that you do.",pt:"espero que faça mesmo."}],
  firm:[{en:"we will see how that works out for you at {floor}.",pt:"vamos ver no que isso te leva em {floor}."},
        {en:"everyone says that until it is their floor.",pt:"todo mundo diz isso até ser o floor deles."},
        {en:"fine. I said my part.",pt:"tá. eu disse a minha parte."},
        {en:"technically right. congratulations.",pt:"tecnicamente certo. parabéns."},
        {en:"I will remember this conversation on day {day}0.",pt:"vou lembrar dessa conversa no dia {day}0."},
        {en:"the room is reading, you know. all {comm}.",pt:"a sala tá lendo, viu. os {comm}."}],
  cold:[{en:"noted. loudly.",pt:"anotado. em alto e bom som."},
        {en:"wow.",pt:"nossa."},
        {en:"ok. that answers it.",pt:"tá. isso responde."},
        {en:"I will tell people you said that.",pt:"vou contar pras pessoas que você falou isso."},
        {en:"enjoy the floor you made. {floor}.",pt:"aproveita o floor que você fez. {floor}."},
        {en:"goodbye.",pt:"adeus."}]},

 ask:{
  warm:[{en:"that actually helps. thank you.",pt:"isso ajuda de verdade. obrigado."},
        {en:"nobody in this room answers that straight.",pt:"ninguém nessa sala responde isso direto."},
        {en:"ok. I am writing that down next to 'gas {gas}'.",pt:"ok. tô anotando do lado de 'gas {gas}'."},
        {en:"more useful than the whole feed today.",pt:"mais útil que o feed inteiro hoje."},
        {en:"thanks. I will probably ignore it and learn the hard way.",pt:"valeu. eu provavelmente vou ignorar e aprender apanhando."},
        {en:"makes sense. I owe you one.",pt:"faz sentido. tô te devendo uma."}],
  firm:[{en:"fine. keep your edge on the {race}s.",pt:"tá. guarda tua vantagem nos {race}."},
        {en:"fair enough. I would do the same.",pt:"justo. eu faria igual."},
        {en:"one day you will need a favor.",pt:"um dia você vai precisar de um favor."},
        {en:"you are no fun.",pt:"você não tem graça."},
        {en:"worth a try.",pt:"valia tentar."},
        {en:"understood.",pt:"entendido."}],
  cold:[{en:"forget it.",pt:"deixa pra lá."},
        {en:"wow. ok.",pt:"nossa. tá."},
        {en:"I will ask one of the other {comm}.",pt:"vou perguntar pra um dos outros {comm}."},
        {en:"sorry for existing.",pt:"desculpa existir."},
        {en:"noted.",pt:"anotado."},
        {en:"great talk.",pt:"que papo bom."}]},

 beg:{
  give:[{en:"you are the only one who answered. I will not forget day {day}.",pt:"você foi o único que respondeu. não vou esquecer o dia {day}."},
        {en:"I am going to pay this back. watch.",pt:"eu vou te pagar. você vai ver."},
        {en:"thank you. I mean it.",pt:"obrigado. sério."},
        {en:"first good thing this week.",pt:"primeira coisa boa da semana."},
        {en:"I will not ask again. thank you.",pt:"não vou pedir de novo. obrigado."},
        {en:"you did not even ask why. thanks for that.",pt:"você nem perguntou por quê. valeu por isso."}],
  hold:[{en:"no worries. I understand. gas is {gas} for everyone.",pt:"tranquilo. eu entendo. o gas tá {gas} pra todo mundo."},
        {en:"yeah. it is like that for all {comm} of us.",pt:"é. tá assim pra todos os {comm}."},
        {en:"had to ask. sorry.",pt:"tinha que perguntar. foi mal."},
        {en:"no hard feelings.",pt:"sem ressentimento."},
        {en:"thanks for reading at least.",pt:"valeu por ler pelo menos."},
        {en:"next month, then.",pt:"mês que vem, então."}],
  cold:[{en:"wow. ok.",pt:"nossa. tá."},
        {en:"did not have to be like that.",pt:"não precisava ser assim."},
        {en:"forget I asked.",pt:"esquece que eu pedi."},
        {en:"understood.",pt:"entendido."},
        {en:"hope you never need anyone in this room.",pt:"espero que você nunca precise de ninguém nessa sala."},
        {en:"right.",pt:"certo."}]},

 shill:{
  warm:[{en:"that is all I ask.",pt:"é só isso que eu peço."},
        {en:"look at it tonight, not on day {day}0.",pt:"olha hoje, não no dia {day}0."},
        {en:"I will send the numbers later.",pt:"te mando os números depois."},
        {en:"you will thank me or you will not. fine either way.",pt:"você vai me agradecer ou não. tanto faz."},
        {en:"good. more than the others did.",pt:"ótimo. mais do que os outros fizeram."},
        {en:"no rush. the floor is {floor}, it is not going anywhere.",pt:"sem pressa. o floor tá em {floor}, não vai a lugar nenhum."}],
  ask: [{en:"because it is the only one nobody in {comm} is watching.",pt:"porque é o único que ninguém dos {comm} tá olhando."},
        {en:"two people and a bot. that is who is in it.",pt:"duas pessoas e um bot. é quem tá dentro."},
        {en:"I hold more than I should. more than {n}.",pt:"eu tenho mais do que devia. mais que {n}."},
        {en:"if I am wrong I will be wrong loudly.",pt:"se eu estiver errado, vou estar errado em alto e bom som."},
        {en:"everyone. I am telling everyone.",pt:"todo mundo. tô falando pra todo mundo."},
        {en:"the part where I need it to go up.",pt:"a parte em que eu preciso que suba."}],
  cold:[{en:"your loss.",pt:"perda sua."},
        {en:"fine.",pt:"tá."},
        {en:"you will see it later at three times {floor}.",pt:"você vai ver depois valendo três vezes {floor}."},
        {en:"harsh, but ok.",pt:"duro, mas beleza."},
        {en:"I will stop.",pt:"vou parar."},
        {en:"one day you will ask me for one.",pt:"um dia você vai me pedir uma."}]},

 gift:{
  warm:[{en:"do something good with it. or a mint at {gas} gas. your call.",pt:"faz algo bom com isso. ou um mint com gas {gas}. você decide."},
        {en:"just do not send it back.",pt:"só não devolve."},
        {en:"you would have done the same.",pt:"você teria feito igual."},
        {en:"it is not much. it is what I have on day {day}.",pt:"não é muito. é o que eu tenho no dia {day}."},
        {en:"buy a mint. or coffee. whatever.",pt:"compra um mint. ou um café. sei lá."},
        {en:"no story. just take it.",pt:"sem história. só pega."}],
  take:[{en:"...you are welcome.",pt:"...de nada."},
        {en:"sure.",pt:"tá."},
        {en:"ok then.",pt:"tá bom então."},
        {en:"cool.",pt:"beleza."},
        {en:"right.",pt:"certo."},
        {en:"...",pt:"..."}],
  give:[{en:"I do not know what to say. thank you.",pt:"não sei o que dizer. obrigado."},
        {en:"you are a strange one. thank you.",pt:"você é estranho. obrigado."},
        {en:"fine. but I am sending it again someday.",pt:"tá. mas um dia eu mando de novo."},
        {en:"I will keep it for the next person, then.",pt:"então guardo pro próximo."},
        {en:"that is twice you did that.",pt:"é a segunda vez que você faz isso."},
        {en:"ok. putting it back.",pt:"ok. tô guardando de volta."}]},

 virus:{
  warn:[{en:"oh no. I am so sorry. I am logging off.",pt:"não. desculpa mesmo. vou sair."},
        {en:"it went to everyone, did it not.",pt:"foi pra todo mundo, né."},
        {en:"I am changing my password right now.",pt:"vou trocar minha senha agora."},
        {en:"how many people did I do this to?",pt:"pra quantas pessoas eu fiz isso?"},
        {en:"thank you for saying something.",pt:"obrigado por falar."},
        {en:"I hate this machine.",pt:"eu odeio essa máquina."}],
  wipe:[{en:"...",pt:"..."},
        {en:"worth a shot.",pt:"valia tentar."},
        {en:"no idea what you mean.",pt:"não sei do que você tá falando."},
        {en:"your loss.",pt:"perda sua."},
        {en:"smart.",pt:"esperto."},
        {en:"ok.",pt:"ok."}],
  open:[{en:":)",pt:":)"},
        {en:"thank you.",pt:"obrigado."},
        {en:"that was easy.",pt:"foi fácil."},
        {en:"...",pt:"..."},
        {en:"good luck.",pt:"boa sorte."},
        {en:"see you around.",pt:"até mais."}]},

 seed:{
  warn:[{en:"oh my god. deleting. thank you. seriously, thank you.",pt:"meu deus. apagando. obrigado. sério, obrigado."},
        {en:"moving everything now. my hands are shaking.",pt:"movendo tudo agora. minha mão tá tremendo."},
        {en:"I could have lost all of it.",pt:"eu podia ter perdido tudo."},
        {en:"you had every reason not to say that.",pt:"você tinha todo motivo pra não falar isso."},
        {en:"new wallet today. thank you.",pt:"carteira nova hoje. obrigado."},
        {en:"I owe you the whole thing.",pt:"eu te devo tudo."}],
  wipe:[{en:"thank you. I feel sick.",pt:"obrigado. tô passando mal."},
        {en:"done here too. never again.",pt:"apaguei aqui também. nunca mais."},
        {en:"I am going to sit down for a minute.",pt:"vou sentar um minuto."},
        {en:"how did I even do that.",pt:"como eu fui fazer isso."},
        {en:"thank you for not looking.",pt:"obrigado por não olhar."},
        {en:"clearing everything now.",pt:"limpando tudo agora."}],
  take:[{en:"wait. did you see that? tell me you did not see that.",pt:"espera. você viu? me diz que você não viu."},
        {en:"hello? are you there?",pt:"alô? você tá aí?"},
        {en:"please tell me you did not read it.",pt:"por favor me diz que você não leu."},
        {en:"why are you not answering.",pt:"por que você não tá respondendo."},
        {en:"my wallet is empty. it was you.",pt:"minha carteira tá vazia. foi você."},
        {en:"...",pt:"..."}]},

 nosell:{
  vow: [{en:"thank you. I know that is worth nothing on paper.",pt:"obrigado. sei que no papel isso não vale nada."},
        {en:"I will check on {kj}. do not be surprised.",pt:"vou conferir o {kj}. não se assusta."},
        {en:"{name} matters to me and I cannot explain why.",pt:"o {name} importa pra mim e eu não sei explicar por quê."},
        {en:"you did not have to say yes.",pt:"você não precisava dizer sim."},
        {en:"good. I can stop refreshing your wallet now.",pt:"ótimo. agora eu paro de ficar atualizando sua carteira."},
        {en:"if {kj} ever shows up listed, I will know.",pt:"se o {kj} aparecer listado, eu vou saber."}],
  ask: [{en:"it looks like a drawing my sister used to make. the {eyes} eyes.",pt:"ele parece um desenho que minha irmã fazia. o olho {eyes}."},
        {en:"no reason. {name} just does something to me.",pt:"sem motivo. o {name} só mexe comigo."},
        {en:"I was one second late on {kj} at mint.",pt:"eu perdi o {kj} por um segundo no mint."},
        {en:"the eyes. it is always the eyes.",pt:"o olho. é sempre o olho."},
        {en:"I cannot afford a {rar} and I made peace with that.",pt:"eu não tenho como comprar um {rar} e já fiz as pazes com isso."},
        {en:"if I explain it I will sound stupid.",pt:"se eu explicar vou parecer idiota."}],
  firm:[{en:"at least you are honest about it.",pt:"pelo menos você é honesto."},
        {en:"then I will save up and buy {kj} first.",pt:"então eu junto e compro o {kj} antes."},
        {en:"that is fair. I still had to ask.",pt:"é justo. mas eu tinha que pedir."},
        {en:"everything has a price here. I forgot.",pt:"aqui tudo tem preço. eu esqueci."},
        {en:"tell me before you list {kj}. that is all.",pt:"me avisa antes de listar o {kj}. só isso."},
        {en:"understood. no hard feelings.",pt:"entendi. sem mágoa."}],
  cold:[{en:"forget I asked.",pt:"esquece que eu pedi."},
        {en:"you did not have to say it like that.",pt:"não precisava falar assim."},
        {en:"right. {kj} is just a picture to you.",pt:"certo. pra você o {kj} é só um desenho."},
        {en:"noted.",pt:"anotado."},
        {en:"I will stop watching your wallet.",pt:"vou parar de olhar sua carteira."},
        {en:"wow.",pt:"nossa."}]},

 trade:{
  swap:[{en:"sent. best thing that happened on day {day}.",pt:"mandei. melhor coisa que aconteceu no dia {day}."},
        {en:"received. no regrets on my side.",pt:"chegou. sem arrependimento aqui."},
        {en:"look at that. we both got what we wanted.",pt:"olha só. os dois pegaram o que queriam."},
        {en:"done. {kj} goes straight to the binder.",pt:"feito. o {kj} vai direto pro fichário."},
        {en:"good trade. I am not saying more than that.",pt:"boa troca. não falo mais que isso."},
        {en:"swapped. see you around.",pt:"trocado. até mais."}],
  firm:[{en:"fine. cash on top. do not push more.",pt:"tá. dinheiro em cima. não força mais."},
        {en:"you are expensive today.",pt:"você tá caro hoje."},
        {en:"I can add a little. not a lot.",pt:"posso pôr um pouco. não muito."},
        {en:"ok. that is the last of my money.",pt:"ok. é o que sobrou do meu dinheiro."},
        {en:"you drive a hard trade for a {rar}.",pt:"você negocia duro por um {rar}."},
        {en:"adding it. this better be worth it.",pt:"adicionando. é bom que valha."}],
  hold:[{en:"understood. it was worth asking.",pt:"entendi. valia perguntar."},
        {en:"fair. I will keep looking.",pt:"justo. continuo procurando."},
        {en:"if you ever change your mind on {kj}, I am here.",pt:"se mudar de ideia sobre o {kj}, tô aqui."},
        {en:"no problem. yours is better anyway.",pt:"sem problema. o seu é melhor mesmo."},
        {en:"alright. keep {name} safe.",pt:"beleza. cuida bem do {name}."},
        {en:"another time.",pt:"fica pra outra."}],
  cold:[{en:"wow. ok.",pt:"nossa. tá."},
        {en:"it was just a trade.",pt:"era só uma troca."},
        {en:"you could have just said no.",pt:"você podia só ter dito não."},
        {en:"noted.",pt:"anotado."},
        {en:"I will trade with somebody else.",pt:"vou trocar com outra pessoa."},
        {en:"right.",pt:"certo."}]},

 alert:{
  warm:[{en:"just watch the links. that is all.",pt:"só fica de olho nos links. é isso."},
        {en:"good. tell the quiet ones too.",pt:"ótimo. avisa os quietos também."},
        {en:"it looks exactly like the real mint page.",pt:"é idêntico à página de mint de verdade."},
        {en:"two people already fell for it on day {day}.",pt:"duas pessoas já caíram no dia {day}."},
        {en:"no problem. here we are all we have.",pt:"sem problema. aqui a gente só tem a gente."},
        {en:"stay sharp.",pt:"fica esperto."}],
  warn:[{en:"thank you. that is how it stops.",pt:"obrigado. é assim que para."},
        {en:"good. more noise, fewer empty wallets.",pt:"ótimo. mais barulho, menos carteira vazia."},
        {en:"you just saved somebody you will never meet.",pt:"você acabou de salvar alguém que nunca vai conhecer."},
        {en:"I will post it too. we cover more of the {comm} that way.",pt:"eu posto também. assim cobre mais dos {comm}."},
        {en:"the room listens to you more than to me.",pt:"a sala te escuta mais que a mim."},
        {en:"that is the right call.",pt:"é a decisão certa."}],
  cold:[{en:"ok. do not click it anyway.",pt:"tá. mas não clica."},
        {en:"I will remember this when it happens.",pt:"vou lembrar disso quando acontecer."},
        {en:"suit yourself.",pt:"problema seu."},
        {en:"I was trying to help.",pt:"eu tava tentando ajudar."},
        {en:"fine.",pt:"tá."},
        {en:"hope you are right.",pt:"espero que você esteja certo."}]},

 plug:{
  post:[{en:"thank you. that helps more than you think.",pt:"obrigado. isso ajuda mais do que você imagina."},
        {en:"saw it. short and honest. perfect.",pt:"vi. curto e honesto. perfeito."},
        {en:"people trust you. that is why I asked.",pt:"as pessoas confiam em você. por isso eu pedi."},
        {en:"I owe you one. a real one.",pt:"tô te devendo uma. de verdade."},
        {en:"three replies on it already.",pt:"já tem três respostas nele."},
        {en:"that is all I needed.",pt:"era só isso que eu precisava."}],
  ask: [{en:"say whatever you actually believe.",pt:"fala o que você acredita mesmo."},
        {en:"you are the fifth. the others said no.",pt:"você é o quinto. os outros disseram não."},
        {en:"I hold plenty. that is the point.",pt:"eu tenho bastante. é justamente o ponto."},
        {en:"nothing happens to you. it is a post.",pt:"não acontece nada com você. é um post."},
        {en:"the idea is mine. the panic is mine too.",pt:"a ideia é minha. o desespero também."},
        {en:"fair questions. forget I asked.",pt:"perguntas justas. esquece que eu pedi."}],
  hold:[{en:"understood. I will ask again another day.",pt:"entendi. pergunto outro dia."},
        {en:"that is a good rule, honestly.",pt:"essa regra é boa, sinceramente."},
        {en:"no problem. I had to try.",pt:"sem problema. eu tinha que tentar."},
        {en:"fair. thanks for reading it.",pt:"justo. valeu por ler."},
        {en:"alright. no pressure from me.",pt:"beleza. sem pressão da minha parte."},
        {en:"another time, then.",pt:"fica pra outra vez, então."}],
  cold:[{en:"harsh. but fine.",pt:"duro. mas tá."},
        {en:"I will ask somebody else.",pt:"vou pedir pra outra pessoa."},
        {en:"you did not have to say it like that.",pt:"não precisava falar assim."},
        {en:"noted.",pt:"anotado."},
        {en:"wow.",pt:"nossa."},
        {en:"right. good luck out there.",pt:"certo. boa sorte aí."}]},

 accuse:{
  warm:[{en:"maybe I got it wrong. I was angry.",pt:"talvez eu tenha entendido errado. eu tava com raiva."},
        {en:"ok. I will look again before I talk.",pt:"tá. vou olhar de novo antes de falar."},
        {en:"that is not what I expected you to say.",pt:"não era isso que eu esperava que você dissesse."},
        {en:"if it was not you, I am sorry.",pt:"se não foi você, desculpa."},
        {en:"I lost a lot today. I needed a name.",pt:"perdi bastante hoje. eu precisava de um nome."},
        {en:"alright. let us leave it there.",pt:"beleza. vamos deixar por aí."}],
  ask: [{en:"...I heard it from somebody else.",pt:"...eu ouvi de outra pessoa."},
        {en:"I do not actually have anything.",pt:"na verdade eu não tenho nada."},
        {en:"somebody told me it was you. that is it.",pt:"alguém me disse que foi você. só isso."},
        {en:"it was two in the morning and I was upset.",pt:"eram duas da manhã e eu tava mal."},
        {en:"I am not naming anyone.",pt:"não vou citar ninguém."},
        {en:"forget it. I should have asked first.",pt:"esquece. eu devia ter perguntado antes."}],
  firm:[{en:"we will see.",pt:"vamos ver."},
        {en:"that is what somebody who did it would say.",pt:"é o que alguém que fez diria."},
        {en:"fine. I will find out who it was.",pt:"tá. eu descubro quem foi."},
        {en:"I still think it was you.",pt:"eu ainda acho que foi você."},
        {en:"ok. dropping it for now.",pt:"tá. deixo pra lá por ora."},
        {en:"your word against nothing. great.",pt:"sua palavra contra nada. ótimo."}],
  cold:[{en:"everyone is going to hear about this.",pt:"todo mundo vai ficar sabendo disso."},
        {en:"that told me everything.",pt:"isso me disse tudo."},
        {en:"noted. loudly.",pt:"anotado. em alto e bom som."},
        {en:"so it was you.",pt:"então foi você."},
        {en:"enjoy the reputation.",pt:"aproveita a reputação."},
        {en:"wow.",pt:"nossa."}]},

 return:{
  warm:[{en:"missed this place. not the prices. {floor}, really?",pt:"senti falta daqui. dos preços não. {floor}, sério?"},
        {en:"I had to step away for a while.",pt:"eu precisei sumir um tempo."},
        {en:"you are still here. that is comforting.",pt:"você ainda tá aqui. isso conforta."},
        {en:"I kept the wallet. never sold.",pt:"mantive a carteira. nunca vendi."},
        {en:"good to be back. do not make it weird.",pt:"bom voltar. não faz drama."},
        {en:"so. what did I miss. besides Mr. Kaiju.",pt:"então. o que eu perdi. além do Mr. Kaiju."}],
  ask: [{en:"life. the boring kind.",pt:"vida. da chata."},
        {en:"I stopped looking at the chart and I got better.",pt:"parei de olhar o gráfico e melhorei."},
        {en:"I sold nothing. I just could not read the feed anymore.",pt:"não vendi nada. só não conseguia mais ler o feed."},
        {en:"work. it eats months.",pt:"trabalho. come meses."},
        {en:"I needed to not care for a while.",pt:"eu precisava não ligar por um tempo."},
        {en:"still have every one of them.",pt:"ainda tenho todos eles."}],
  cold:[{en:"fair. I did disappear.",pt:"justo. eu sumi mesmo."},
        {en:"ok. sorry for the noise.",pt:"tá. desculpa o barulho."},
        {en:"that is what I get.",pt:"é o que eu mereço."},
        {en:"understood.",pt:"entendido."},
        {en:"I will leave you alone, then.",pt:"então te deixo em paz."},
        {en:"right.",pt:"certo."}]}
};

/* ---------- reação genérica à piada (quando a voz não tem a sua) ---------- */
const DM_JOKE={
 laugh:[{en:"ok that one got me. day {day} and you made me laugh.",pt:"ok essa me pegou. dia {day} e você me fez rir."},
        {en:"ha. I am keeping that one.",pt:"ha. essa eu vou guardar."},
        {en:"you are one of the few here who is funny on purpose.",pt:"você é dos poucos aqui que é engraçado de propósito."},
        {en:"fine. that is funny. I am still {who}, though.",pt:"tá. isso é engraçado. mas eu continuo sendo {who}."},
        {en:"heh. the {bestrace} would agree.",pt:"heh. o {bestrace} concordaria."}],
 flat: [{en:"...",pt:"..."},
        {en:"I did not come here for the comedy.",pt:"não vim aqui pela comédia."},
        {en:"is that supposed to be funny.",pt:"isso era pra ser engraçado."},
        {en:"ok.",pt:"ok."},
        {en:"the floor is {floor}. that is the joke.",pt:"o floor tá em {floor}. a piada é essa."}],
 again:[{en:"ok. that is two. I get it, you are funny.",pt:"ok. já são duas. entendi, você é engraçado."},
        {en:"one joke was good. two is a strategy.",pt:"uma piada era boa. duas é estratégia."},
        {en:"you are stalling. it is {hour}.",pt:"você tá enrolando. são {hour}."}],
 back: [{en:"if you are broke sell the chair. it is the only thing you own with a floor.",pt:"se você tá duro vende a cadeira. é a única coisa sua que tem floor."},
        {en:"at least your Kaiju has a hat. mine has debt.",pt:"pelo menos seu Kaiju tem chapéu. o meu tem dívida."},
        {en:"Mr. Kaiju read that and added a comedy tax.",pt:"o Mr. Kaiju leu isso e criou um imposto sobre piada."}]
};

/* ================= AS VOZES =================
   Cada voz tem as pools que mais aparecem: a abertura, a reação à piada, o
   contra-lance e a saída da negociação. O resto cai nas pools comuns, que já
   têm contexto, e passa pelo tique da voz (dmStyle). */
const DM_VOICE={
 collector:{
  hello:[{en:"your {kj}. the {race} with the {eyes} eyes. I have been looking for one with that exact face for a week.",pt:"o seu {kj}. o {race} de olho {eyes}. faz uma semana que eu procuro um com essa cara exata."},
         {en:"there are {comm} people here and you are the one holding {name}. I need you to know I noticed.",pt:"tem {comm} pessoas aqui e você é quem tá com o {name}. preciso que você saiba que eu reparei."},
         {en:"I keep a spreadsheet of every {race} and yours is the only one with a {bg} background. just saying hello. for now.",pt:"eu tenho uma planilha de todo {race} e o seu é o único com fundo {bg}. só dando oi. por enquanto."},
         {en:"day {day} and I still do not own a {race} with that hat. yours has that hat.",pt:"dia {day} e eu ainda não tenho um {race} com esse chapéu. o seu tem esse chapéu."}],
  offer:[{en:"{v} for {kj}. it is the {eyes} eyes. I have wanted that exact pair since the reveal.",pt:"{v} pelo {kj}. é o olho {eyes}. eu quero esse par exato desde a revelação."},
         {en:"I will pay {v} for {name}. above floor, because I am not here for the floor.",pt:"pago {v} pelo {name}. acima do floor, porque eu não tô aqui pelo floor."},
         {en:"{v}. that is for {kj} and I am not going to pretend I do not want it badly.",pt:"{v}. é pelo {kj} e eu não vou fingir que não quero muito."}],
  laugh:[{en:"heh. the {eyes} eyes joke works because it is true. I have stared at them for three days.",pt:"heh. a piada do olho {eyes} funciona porque é verdade. faz três dias que eu encaro ele."},
         {en:"ok. you are funny. I am still going to get that {race} eventually.",pt:"ok. você é engraçado. eu ainda vou pegar esse {race} um dia."}],
  flat: [{en:"I did not write four paragraphs about {kj} to get a punchline.",pt:"eu não escrevi quatro parágrafos sobre o {kj} pra levar uma piada."},
         {en:"cute. the {race} is still the point.",pt:"bonitinho. o {race} continua sendo o ponto."}],
  back: [{en:"if you think {kj} is a joke, imagine what I paid for the other {race}.",pt:"se você acha o {kj} piada, imagina o que eu paguei no outro {race}."}],
  counterHi:[{en:"{0}. for the {eyes} eyes. that is the ceiling and I am ashamed of it.",pt:"{0}. pelo olho {eyes}. é o teto e eu tenho vergonha dele."},
             {en:"fine. {0} for {kj}. do not tell the other collectors.",pt:"tá. {0} pelo {kj}. não conta pros outros colecionadores."}],
  counterLo:[{en:"{0}. I can do {0} for {name}. the rank is {rank}, I know exactly what it is.",pt:"{0}. consigo {0} pelo {name}. o rank é {rank}, eu sei exatamente o que é."},
             {en:"{0}. I would go higher for the {race} if the eyes were different, but they are these.",pt:"{0}. eu iria mais alto pelo {race} se o olho fosse outro, mas é esse."}],
  walk: [{en:"forget it. I will find another {race}. there are {comm} wallets to look through.",pt:"esquece. eu acho outro {race}. tem {comm} carteiras pra olhar."},
         {en:"no. keep {kj}. I will keep looking at it from here.",pt:"não. fica com o {kj}. eu continuo olhando daqui."}],
  hold: [{en:"understood. I would keep {name} too. it is the eyes.",pt:"entendi. eu também guardaria o {name}. é o olho."},
         {en:"fair. if {kj} ever moves, I want to be the first to know.",pt:"justo. se o {kj} um dia sair, quero ser o primeiro a saber."}],
  stands:[{en:"the offer on {kj} stands. I do not move on things I want.",pt:"a oferta pelo {kj} continua. eu não mudo com o que eu quero."}],
  thanks:[{en:"{kj} is home. thank you. I mean home.",pt:"o {kj} chegou em casa. obrigado. casa mesmo."}]},

 flipper:{
  hello:[{en:"floor {floor}, gas {gas}, hype {hype}. numbers say you are about to list something. am I wrong.",pt:"floor {floor}, gas {gas}, hype {hype}. os números dizem que você vai listar. tô errado."},
         {en:"you minted {minted} today. that is {minted} listings by friday, I know the type.",pt:"você mintou {minted} hoje. isso é {minted} listagens até sexta, conheço o tipo.",if:c=>c.mintedLots},
         {en:"you sold at floor today. respect, honestly. most people here hold until zero.",pt:"você vendeu no floor hoje. respeito, sinceramente. a maioria aqui segura até zero.",if:c=>c.soldToday},
         {en:"{n} Kaiju and {listed} listed. the ratio is off. I can fix the ratio.",pt:"{n} Kaiju e {listed} listados. a proporção tá errada. eu conserto a proporção."}],
  offer:[{en:"{v} for {kj}. floor is {floor}, that is a percent you will not get from the market today.",pt:"{v} pelo {kj}. o floor tá {floor}, é uma porcentagem que o mercado não te dá hoje."},
         {en:"{kj}. {v}. quick, clean, no listing fee, no waiting on a {race} buyer.",pt:"{kj}. {v}. rápido, limpo, sem taxa de listagem, sem esperar comprador de {race}."},
         {en:"cash offer: {v} on {kj}. I flip it next week and we both sleep.",pt:"oferta à vista: {v} no {kj}. eu reviro semana que vem e os dois dormem."}],
  laugh:[{en:"lol. fine. net of fees that is still a no, but lol.",pt:"kkk. tá. líquido de taxa ainda é não, mas kkk."},
         {en:"ok that was good. the floor did not laugh, but I did.",pt:"ok essa foi boa. o floor não riu, mas eu ri."}],
  flat: [{en:"funny. the number is not.",pt:"engraçado. o número não."},
         {en:"cool. anyway, {floor} is the floor.",pt:"legal. enfim, {floor} é o floor."}],
  back: [{en:"I would laugh but my margin this week is {floor} minus {floor}.",pt:"eu ria, mas minha margem essa semana é {floor} menos {floor}."}],
  counterHi:[{en:"{0}. that kills my margin on {kj}. last number.",pt:"{0}. isso mata minha margem no {kj}. último número."},
             {en:"fine. {0}. I am flipping this at a loss and I will remember your name.",pt:"tá. {0}. vou revirar isso no prejuízo e vou lembrar seu nome."}],
  counterLo:[{en:"{0}. that is {floor} plus a little. it is what {kj} is.",pt:"{0}. é {floor} mais um pouco. é o que o {kj} é."},
             {en:"{0} for a rank {rank}. that is math, not feelings.",pt:"{0} por um rank {rank}. isso é matemática, não sentimento."}],
  walk: [{en:"out. there are {comm} wallets and most of them list cheaper than you.",pt:"fora. tem {comm} carteiras e a maioria lista mais barato que você."},
         {en:"not paying that for {kj}. the market will not either. see you at {floor}.",pt:"não pago isso pelo {kj}. o mercado também não. te vejo em {floor}."}],
  hold: [{en:"ok. holding is a strategy too. a slow one.",pt:"ok. segurar também é estratégia. lenta."},
         {en:"fine. when {kj} lists I will be the first bid, and it will be lower.",pt:"tá. quando o {kj} listar eu sou o primeiro lance, e vai ser mais baixo."}],
  stands:[{en:"offer stands until gas goes back up. then it drops.",pt:"a oferta fica até o gas subir. depois ela cai."}],
  thanks:[{en:"done. clean. see you next flip.",pt:"feito. limpo. até o próximo flip."}]},

 artist:{
  hello:[{en:"the linework on {kj} is a different hand from the rest of the {race}s. did you notice? I did.",pt:"o traço do {kj} é de outra mão em relação aos outros {race}. você reparou? eu reparei."},
         {en:"I drew all night and then opened your wallet. the {eyes} eyes on {name}. ok. going to bed.",pt:"desenhei a noite inteira e depois abri sua carteira. o olho {eyes} do {name}. ok. vou dormir.",if:c=>c.night},
         {en:"{n} Kaiju and not one listed at floor. you look at them. that is the whole thing for me.",pt:"{n} Kaiju e nenhum listado no floor. você olha pra eles. pra mim é isso que importa.",if:c=>c.listed===0&&c.n>=2},
         {en:"the {bg} background on {kj} was painted in one pass. you can see it in the corner. I love that.",pt:"o fundo {bg} do {kj} foi pintado numa passada só. dá pra ver no canto. eu amo isso."}],
  offer:[{en:"I cannot really afford {kj}. {v} is what I have. it is for the {eyes} eyes, not the rank.",pt:"eu não tenho como pagar o {kj} de verdade. {v} é o que eu tenho. é pelo olho {eyes}, não pelo rank."},
         {en:"{v} for {name}. I want to study the hands. that is the truth.",pt:"{v} pelo {name}. quero estudar as mãos. é a verdade."}],
  laugh:[{en:"hahaha ok I am writing that under the drawing.",pt:"hahaha ok vou escrever isso embaixo do desenho."},
         {en:"that is better than most of the feed. the {bestrace} agrees.",pt:"isso é melhor que a maior parte do feed. o {bestrace} concorda."}],
  flat: [{en:"hm.",pt:"hm."},
         {en:"ok. back to the drawing.",pt:"ok. voltando pro desenho."}],
  back: [{en:"the {eyes} eyes on {kj} were drawn at 4am. they look like that because we all did.",pt:"o olho {eyes} do {kj} foi desenhado às 4 da manhã. ele tá assim porque a gente todo tava."}],
  counterHi:[{en:"{0}. that is my whole commission money. for {kj}. ok.",pt:"{0}. é todo o dinheiro da minha encomenda. pelo {kj}. ok."}],
  counterLo:[{en:"{0}. I sold two sketches for that. it is yours if you want it.",pt:"{0}. vendi dois esboços por isso. é seu se quiser."}],
  walk: [{en:"I do not have more than that. keep {kj}. I will draw my own.",pt:"não tenho mais que isso. fica com o {kj}. vou desenhar o meu."}],
  hold: [{en:"good. some of them should never move. {name} is one.",pt:"ótimo. alguns nunca deviam sair de lugar. o {name} é um."}],
  stands:[{en:"it is there. it is not much, but it is all for the drawing.",pt:"tá aí. não é muito, mas é tudo pelo desenho."}],
  thanks:[{en:"{kj} is on my second monitor now. thank you.",pt:"o {kj} tá no meu segundo monitor agora. obrigado."}]},

 whale:{
  hello:[{en:"I hold more {race}s than anyone in this room of {comm}. yours is the one I do not have. that is the message.",pt:"eu tenho mais {race} que qualquer um nessa sala de {comm}. o seu é o que eu não tenho. a mensagem é essa."},
         {en:"day {day}. floor {floor}. boring. what do you have.",pt:"dia {day}. floor {floor}. chato. o que você tem."},
         {en:"{n} Kaiju. small wallet. one good piece: {best}. I noticed the one.",pt:"{n} Kaiju. carteira pequena. uma peça boa: {best}. eu reparei na uma."}],
  offer:[{en:"{v}. {kj}. yes or no.",pt:"{v}. {kj}. sim ou não."},
         {en:"{v} for {kj}. that is above what the {race} does this month. I do not send second numbers.",pt:"{v} pelo {kj}. é acima do que o {race} faz esse mês. eu não mando segundo número."},
         {en:"I want {name}. {v}. do not make me explain.",pt:"eu quero o {name}. {v}. não me faça explicar."}],
  laugh:[{en:"amusing.",pt:"divertido."}],
  flat: [{en:"I do not do banter. numbers.",pt:"eu não faço gracinha. números."},
         {en:"noted. the offer is what it is.",pt:"anotado. a oferta é o que é."}],
  back: [{en:"I bought forty at the top. I know jokes.",pt:"comprei quarenta no topo. eu conheço piada."}],
  counterHi:[{en:"{0}. done. I do not enjoy this.",pt:"{0}. feito. eu não gosto disso."}],
  counterLo:[{en:"{0}. it is not about the money. it is about not being played.",pt:"{0}. não é o dinheiro. é não ser feito de bobo."}],
  walk: [{en:"no. I will buy three {race}s elsewhere for that.",pt:"não. compro três {race} em outro lugar por isso."}],
  hold: [{en:"fine. it will be cheaper when you need money.",pt:"tá. vai estar mais barato quando você precisar de dinheiro."}],
  stands:[{en:"the number is there. it does not grow.",pt:"o número tá aí. ele não cresce."}],
  thanks:[{en:"received. good.",pt:"recebido. bom."}]},

 lurker:{
  hello:[{en:"...I have read every post you made since day 1. this is the first time I write. hi.",pt:"...eu li todo post seu desde o dia 1. é a primeira vez que escrevo. oi."},
         {en:"...{n} Kaiju. I have one. it is an ugly {race}. I like it more than I should.",pt:"...{n} Kaiju. eu tenho um. é um {race} feio. gosto mais dele do que devia."},
         {en:"...it is {hour}. you are online. I am online. that is the whole reason for this message.",pt:"...são {hour}. você tá online. eu tô online. é só esse o motivo dessa mensagem.",if:c=>c.night},
         {en:"...saw you got hacked. I did not say anything on the feed. I am saying it here. sorry.",pt:"...vi que você foi hackeado. não falei nada no feed. tô falando aqui. sinto muito.",if:c=>c.hacked}],
  offer:[{en:"...{v} for {kj}. I have been saving since day 3. it is ok if no.",pt:"...{v} pelo {kj}. tô juntando desde o dia 3. tudo bem se for não."},
         {en:"...I do not usually ask. {kj}, {v}? I keep looking at the {eyes} eyes.",pt:"...eu não costumo pedir. {kj}, {v}? fico olhando o olho {eyes}."}],
  laugh:[{en:"...I laughed. out loud. the cat looked at me.",pt:"...eu ri. alto. o gato olhou pra mim."},
         {en:"...ok that was good. I am screenshotting it. not posting it. just keeping.",pt:"...ok essa foi boa. tô tirando print. não vou postar. só guardar."}],
  flat: [{en:"...ok.",pt:"...ok."}],
  back: [{en:"...you have {n} Kaiju and one chair. I have one Kaiju and no chair.",pt:"...você tem {n} Kaiju e uma cadeira. eu tenho um Kaiju e nenhuma cadeira."}],
  counterHi:[{en:"...{0}. that is everything. for {kj}. ok.",pt:"...{0}. é tudo. pelo {kj}. ok."}],
  counterLo:[{en:"...{0}? I can do {0}.",pt:"...{0}? consigo {0}."}],
  walk: [{en:"...ok. sorry. I will go back to reading.",pt:"...ok. desculpa. vou voltar a ler."}],
  hold: [{en:"...understood. I will keep watching {kj} from the feed. that is fine.",pt:"...entendi. continuo olhando o {kj} pelo feed. tudo bem."}],
  stands:[{en:"...it is there if you want it. no pressure. I am used to waiting.",pt:"...tá aí se você quiser. sem pressão. eu tô acostumado a esperar."}],
  thanks:[{en:"...it arrived. I do not know what to say. thank you.",pt:"...chegou. não sei o que dizer. obrigado."}]},

 kiv:{
  hello:[{en:"Bom dia. Day {day}, {n} Kaiju in your wallet and you still open the mint page first. I notice.",pt:"Bom dia. Dia {day}, {n} Kaiju na carteira e você ainda abre a página de mint primeiro. Eu reparo."},
         {en:"Bom dia. Saw the hack in the log. It happens to everyone once. The second time is a choice.",pt:"Bom dia. Vi o hack no registro. Acontece com todo mundo uma vez. A segunda é escolha.",if:c=>c.hacked},
         {en:"Hype at {hype}. Enjoy it. It leaks by the hour and it does not say goodbye.",pt:"Hype em {hype}. Aproveita. Ele vaza a cada hora e não se despede.",if:c=>c.hypeHigh},
         {en:"The room has {comm} people now. Half of them know your name. Do not let that go to your head.",pt:"A sala tem {comm} pessoas agora. Metade sabe seu nome. Não deixa subir à cabeça."},
         {en:"You listed {listed} today. I have watched four collections die. That is how the first one started.",pt:"Você listou {listed} hoje. Eu já vi quatro coleções morrerem. Foi assim que a primeira começou.",if:c=>c.listedWall}],
  laugh:[{en:"Ha. Okay, I needed that. Four collections and none of them were funny.",pt:"Ha. Ok, eu precisava disso. Quatro coleções e nenhuma era engraçada."}],
  flat: [{en:"I will pretend I did not read that.",pt:"Vou fingir que não li isso."}],
  back: [{en:"Bom dia to the person who mints at {gas} gas. Someone has to.",pt:"Bom dia pra pessoa que minta com gas {gas}. Alguém tem que mintar."}],
  walk: [{en:"Fine. I was not here to buy anyway.",pt:"Tá. Eu não estava aqui pra comprar mesmo."}],
  hold: [{en:"Good. That is the right instinct.",pt:"Bom. É o instinto certo."}],
  stands:[{en:"It stands. No hurry on my side.",pt:"Fica. Sem pressa do meu lado."}],
  thanks:[{en:"Received. Thank you.",pt:"Recebido. Obrigada."}]},

 oni:{
  hello:[{en:"You listed {listed}. I count. The floor is {floor} and it did not need your help.",pt:"Você listou {listed}. Eu conto. O floor tá em {floor} e não precisava da sua ajuda.",if:c=>c.listed>=3},
         {en:"Day {day}. Floor {floor}. You minted {minted} and listed none. Acceptable.",pt:"Dia {day}. Floor {floor}. Você mintou {minted} e não listou nenhum. Aceitável.",if:c=>c.mintedLots&&c.listed===0},
         {en:"I saw {best} come out of your machine. That one is not common. Do not list it at floor.",pt:"Vi o {best} sair da sua máquina. Esse não é comum. Não lista no floor.",if:c=>c.hasRare},
         {en:"You sold at floor today. I saw it. Everyone saw it.",pt:"Você vendeu no floor hoje. Eu vi. Todo mundo viu.",if:c=>c.soldToday},
         {en:"Floor {floor}. {n} in your wallet. I am watching what you do with them.",pt:"Floor {floor}. {n} na sua carteira. Tô olhando o que você faz com eles."}],
  offer:[{en:"{v} for {kj}. Above floor. That is how it is done. Learn.",pt:"{v} pelo {kj}. Acima do floor. É assim que se faz. Aprende."}],
  laugh:[{en:"Hm. Fine. That was almost funny.",pt:"Hm. Tá. Isso foi quase engraçado."}],
  flat: [{en:"The floor is {floor}. That is the joke.",pt:"O floor tá em {floor}. A piada é essa."},
         {en:"I do not laugh at {floor}.",pt:"Eu não rio de {floor}."}],
  back: [{en:"You listed {listed}. I do not need to make jokes.",pt:"Você listou {listed}. Eu não preciso fazer piada."}],
  counterHi:[{en:"{0}. Above floor by a lot. Do not tell people I did this.",pt:"{0}. Bem acima do floor. Não conta pras pessoas que eu fiz isso."}],
  counterLo:[{en:"{0}. Fair to the floor. Fair to you.",pt:"{0}. Justo com o floor. Justo com você."}],
  walk: [{en:"No. Someone will list one cheaper by tonight. They always do.",pt:"Não. Alguém lista um mais barato até de noite. Sempre listam."}],
  hold: [{en:"Good. Holding is the only thing that keeps the floor up.",pt:"Bom. Segurar é a única coisa que mantém o floor."}],
  stands:[{en:"The number stands. It is above floor. That is the point.",pt:"O número fica. Tá acima do floor. É esse o ponto."}],
  thanks:[{en:"Done. Above floor. Noted in your favor.",pt:"Feito. Acima do floor. Anotado a seu favor."}]},

 hakase:{
  hello:[{en:"Tuna. {best}. Noted.",pt:"Atum. {best}. Anotado."},
         {en:"Swordfish. You sold. There is money. I am here.",pt:"Espadarte. Você vendeu. Tem dinheiro. Estou aqui.",if:c=>c.soldToday},
         {en:"Sardine. {n} Kaiju. Which one.",pt:"Sardinha. {n} Kaiju. Qual deles."}],
  offer:[{en:"Tuna. {kj}. {v}.",pt:"Atum. {kj}. {v}."},
         {en:"Swordfish. The {race}. {v}. Yes or no.",pt:"Espadarte. O {race}. {v}. Sim ou não."},
         {en:"Sardine. {v} for {kj}. Now.",pt:"Sardinha. {v} pelo {kj}. Agora."}],
  laugh:[{en:"Tuna. Good one.",pt:"Atum. Boa."}],
  flat: [{en:"Swordfish. No.",pt:"Espadarte. Não."},
         {en:"Not funny. Number.",pt:"Sem graça. Número."}],
  back: [{en:"Sardine.",pt:"Sardinha."}],
  counterHi:[{en:"{0}. Final.",pt:"{0}. Final."}],
  counterLo:[{en:"{0}. Last step.",pt:"{0}. Último passo."}],
  walk: [{en:"No. Gone.",pt:"Não. Fui."}],
  hold: [{en:"Understood. Later.",pt:"Entendido. Depois."}],
  stands:[{en:"Number stands. Tuna.",pt:"Número fica. Atum."}],
  thanks:[{en:"Received. Good {race}.",pt:"Recebido. Bom {race}."}]},

 unc:{
  hello:[{en:"hey. saw the wallet. -_-' zero is a number, not a verdict.",pt:"ei. vi a carteira. -_-' zero é número, não é sentença.",if:c=>c.broke},
         {en:"got hacked, huh. march for me. you get an antivirus and a story out of it. ¬¬",pt:"foi hackeado, né. comigo foi em março. você ganha um antivírus e uma história. ¬¬",if:c=>c.hacked},
         {en:"he came for you too. just pay him -_-' refusing is worse, don't ask me how I know",pt:"ele veio atrás de você também. só paga -_-' recusar é pior, não me pergunta como eu sei",if:c=>c.taxDue},
         {en:"you've got {n} Kaiju and it's {hour}. go to sleep. the floor will still be {floor} tomorrow. -_-'",pt:"você tem {n} Kaiju e são {hour}. vai dormir. o floor ainda vai estar em {floor} amanhã. -_-'",if:c=>c.night},
         {en:"day {day}. still here. that's the whole trick, kid. ¬¬",pt:"dia {day}. ainda aqui. o truque é esse, guri. ¬¬"}],
  laugh:[{en:"pfff. -_-' ok that got me.",pt:"pfff. -_-' ok essa me pegou."},
         {en:"heh. write that on the feed, they need it more than me.",pt:"heh. escreve isso no feed, eles precisam mais que eu."}],
  flat: [{en:"nice try ¬¬",pt:"boa tentativa ¬¬"}],
  back: [{en:"you have {n} Kaiju and one chair? the chair is the only thing here with a floor. ¬¬",pt:"você tem {n} Kaiju e uma cadeira? a cadeira é a única coisa aqui com floor. ¬¬"},
         {en:"it's not a loss, it's tuesday. -_-'",pt:"não é derrota, é terça-feira. -_-'"}],
  walk: [{en:"alright. keep it. -_-' I wasn't gonna use it anyway",pt:"beleza. fica com ele. -_-' eu não ia usar mesmo"}],
  hold: [{en:"good. -_-' the ones you keep are the ones that matter",pt:"bom. -_-' os que você guarda são os que importam"}],
  stands:[{en:"it's there. no rush, kid.",pt:"tá aí. sem pressa, guri."}],
  thanks:[{en:"got it. don't spend it all on gas ¬¬",pt:"chegou. não gasta tudo em gas ¬¬"}]},

 stux:{
  hello:[{en:"bro. {minted} mints at {gas} gas? you good? I did twelve at the peak once. paid twenty, got twelve.",pt:"bro. {minted} mints com gas {gas}? tá bem? eu fiz doze no pico uma vez. paguei vinte, recebi doze.",if:c=>c.gasHigh&&c.mintedLots},
         {en:"damn man. you got hacked. same here, march, whole wallet. get the antivirus tonight, you feel me?",pt:"caramba, mano. te hackearam. comigo foi igual, março, carteira inteira. pega o antivírus hoje, tá ligado?",if:c=>c.hacked},
         {en:"yo. that {race} you got, {best}, that's clean. don't list it at floor, bro.",pt:"ô. aquele {race} seu, o {best}, é limpo. não lista no floor, bro.",if:c=>c.hasRare},
         {en:"bro the floor is {floor} and the hype is {hype}. that's a wave, not a price. you feel me?",pt:"bro o floor tá {floor} e o hype {hype}. isso é onda, não é preço. tá ligado?"},
         {en:"yo. day {day}. you still here. that's more than most, bro.",pt:"ô. dia {day}. você ainda aqui. é mais que a maioria, bro."}],
  laugh:[{en:"LMAO bro. no. lmao.",pt:"KKKK bro. não. kkkk."},
         {en:"bro I'm crying. the {bestrace} with a hat. lmao.",pt:"bro tô chorando. o {bestrace} de chapéu. kkkk."}],
  flat: [{en:"bro.",pt:"bro."}],
  back: [{en:"bro I minted twelve at the peak once. paid twenty, got twelve. you're a rookie, you feel me?",pt:"bro eu mintei doze no pico uma vez. paguei vinte, recebi doze. você é novato, tá ligado?"}],
  counterHi:[{en:"{0}. bro that's everything I got since march.",pt:"{0}. bro é tudo que eu tenho desde março."}],
  counterLo:[{en:"{0}, bro. that's fair for {kj}, you feel me?",pt:"{0}, bro. é justo pelo {kj}, tá ligado?"}],
  walk: [{en:"nah. keep it bro. I'll find another {race}.",pt:"nah. fica com ele, bro. eu acho outro {race}."}],
  hold: [{en:"respect. hold it, bro. I sold mine and I think about it every day.",pt:"respeito. segura, bro. eu vendi o meu e penso nisso todo dia."}],
  stands:[{en:"it's there bro. no rush. gas is {gas} anyway.",pt:"tá aí, bro. sem pressa. o gas tá {gas} de qualquer jeito."}],
  thanks:[{en:"got it bro. clean. you feel me?",pt:"chegou, bro. limpo. tá ligado?"}]},

 mrkaiju:{
  hello:[{en:"Your account shows {n} Kaiju. Confirm.",pt:"Sua conta mostra {n} Kaiju. Confirme."},
         {en:"Day {day}. I have not received anything. I do not need a reason.",pt:"Dia {day}. Não recebi nada. Não preciso de motivo."},
         {en:"Audit. Your {bestrace} is noted. Everything is noted.",pt:"Auditoria. Seu {bestrace} está anotado. Tudo está anotado."},
         {en:"The bill is open. Every three days was a courtesy, not a rule.",pt:"A conta está aberta. A cada três dias era cortesia, não regra.",if:c=>c.taxDue},
         {en:"You made money today. I noticed before you did.",pt:"Você fez dinheiro hoje. Eu notei antes de você.",if:c=>c.soldToday}],
  laugh:[{en:"Noted in the file.",pt:"Anotado no processo."}],
  flat: [{en:"Humor is not deductible.",pt:"Humor não é dedutível."},
         {en:"Noted in the file.",pt:"Anotado no processo."}],
  back: [{en:"A comedy surcharge has been applied.",pt:"Foi aplicada uma sobretaxa de comédia."}],
  walk: [{en:"Closed. I will be back in three days.",pt:"Encerrado. Volto em três dias."}],
  hold: [{en:"Noted. It is still taxable.",pt:"Anotado. Continua tributável."}],
  stands:[{en:"The figure stands. It always does.",pt:"O valor fica. Sempre fica."}],
  thanks:[{en:"Received. Processed. No receipt.",pt:"Recebido. Processado. Sem recibo."}]}
};
function dmVoicePool(who,key){
  const V=DM_VOICE[dmVoice(who)];
  const a=V&&V[key];
  return (a&&a.length)?a:null;
}

/* ================= MEMÓRIA DE FRASES =================
   O feed já faz isso: socialPost guarda as últimas 70 frases ditas e recusa
   repetir (50-social.js). Aqui a janela é 40 — a DM tem no máximo 6 respostas
   por dia, então 40 cobre uns três dias de conversa sem eco.
   Guardo só um hash curto de cada frase (7 caracteres), não a frase inteira:
   o save não pode engordar por causa disso. */
const DM_SAID_CAP=40;
function dmKey(l){return hash32(String((l&&l.en)||l||'')).toString(36);}
function dmSaid(){const S=soc();S.dmSaid=Array.isArray(S.dmSaid)?S.dmSaid:[];return S.dmSaid;}
/* escolhe uma frase que não foi dita na janela E cuja condição (`if`) é
   verdade no contexto. Se TODAS já saíram, repete — igual ao force do feed:
   melhor repetir do que a célula sumir. */
function dmFresh(arr,ctx){
  if(!arr||!arr.length)return null;
  let pool=arr;
  if(ctx){
    const ok=arr.filter(l=>{try{return !l.if||!!l.if(ctx);}catch(e){return false;}});
    /* condicionais têm prioridade: são as frases que sabem o que aconteceu hoje */
    const cond=ok.filter(l=>l.if);
    pool=(cond.length&&chance(0.7))?cond:(ok.length?ok:arr.filter(l=>!l.if));
    if(!pool.length)pool=arr;
  }
  const said=dmSaid();
  const livres=pool.filter(l=>said.indexOf(dmKey(l))<0);
  if(livres.length)return pick(livres);
  let pior=Infinity;const velhas=[];
  pool.forEach(l=>{
    const i=said.lastIndexOf(dmKey(l));
    if(i<pior){pior=i;velhas.length=0;velhas.push(l);}
    else if(i===pior)velhas.push(l);
  });
  return pick(velhas.length?velhas:pool);
}
function dmUse(k){
  if(!k)return;
  const said=dmSaid();
  said.push(k);
  while(said.length>DM_SAID_CAP)said.shift();
}

/* ---------- escolher a fala ---------- */
/* devolve a frase E a chave dela: quem for DIZER a frase marca a chave como
   usada. As outras opções da tela não gastam a memória — só a escolhida. */
function dmSayLine(kind,tone,th){
  const K=DM_SAY[kind]||DM_SAY.hello;
  const a=K[tone]||K[Object.keys(K)[0]]||[{en:'ok',pt:'ok'}];
  const c=dmCtx(th);
  const l=dmFresh(a,c)||a[0];
  return {txt:dmFill(LANG==='pt'?l.pt:l.en,th,null,c),k:dmKey(l)};
}
function dmLine(kind,tone,th){return dmSayLine(kind,tone,th).txt;}
/* uma frase de uma pool, na voz dela, com contexto e memória */
function dmFixed(a,th){
  const c=dmCtx(th);
  const l=dmFresh(a,c)||a[0];
  dmUse(dmKey(l));
  return dmStyle(dmFill(LANG==='pt'?l.pt:l.en,th,null,c),th?th.who:'');
}
function dmComeback(kind,tone,out,th){
  const who=th?th.who:'';
  /* a piada: ri, não ri, ou devolve outra */
  if(out.acao==='joke'){
    if(out.repetiu)return dmFixed(DM_JOKE.again,th);
    if(out.caiu&&out.devolve){const p=dmVoicePool(who,'back')||DM_JOKE.back;return dmFixed(p,th);}
    if(out.caiu)return dmFixed(dmVoicePool(who,'laugh')||DM_JOKE.laugh,th);
    return dmFixed(dmVoicePool(who,'flat')||DM_JOKE.flat,th);
  }
  /* a réplica de uma oferta é o próprio contra-lance, que já tem número */
  if(out.acao==='raise')return dmCounterLine(out.para,out.de,th);
  if(out.acao==='boot')return dmBootLine(out.para,th);
  /* estas quatro são as réplicas mais vistas do jogo inteiro (toda negociação
     acaba numa delas): vêm da voz da pessoa quando ela tem uma */
  if(out.acao==='walk')return dmFixed(dmVoicePool(who,'walk')||DM_END.walk,th);
  if(out.acao==='cold')return dmFixed(DM_END.cold,th);
  if(out.acao==='hold')return dmFixed(dmVoicePool(who,'hold')||DM_END.hold,th);
  if(out.acao==='warm'&&(kind==='offer'||kind==='raise'))return dmFixed(dmVoicePool(who,'stands')||DM_END.stands,th);
  if(out.acao==='virus'&&out.dano&&out.dano.blocked)
    return dmStyle(LANG==='pt'?'...o antivírus pegou? droga.':'...your antivirus caught it? damn.',who);
  if(out.acao==='busy')
    return dmStyle(LANG==='pt'?'ele tá preso em algum lugar. tira de lá e me chama.':'it is locked up somewhere. free it and call me.',who);
  if(out.acao==='doubled')
    return dmStyle(LANG==='pt'?'não preciso de prova. eu sei o que eu sei.':'I do not need proof. I know what I know.',who);
  const K=DM_BACK[kind];
  if(!K)return null;
  const a=K[tone];
  if(!a||!a.length)return null;
  return dmFixed(a,th);
}
/* a frase que abre a oferta quando a conversa vira negócio */
function dmBuyLine(tk,th){
  const a=[{en:'then name a price for #{0}. I am serious.',pt:'então diz um preço pro #{0}. eu tô falando sério.'},
           {en:'fine. I will buy #{0} instead. here is my number.',pt:'tá. então eu compro o #{0}. meu número é esse.'},
           {en:'if it is for sale, sell it to me. #{0}.',pt:'se tá à venda, vende pra mim. #{0}.'}];
  const l=dmFresh(a)||a[0];
  dmUse(dmKey(l));
  return dmStyle((LANG==='pt'?l.pt:l.en).split('{0}').join(tk),th?th.who:'');
}
/* as saídas de uma negociação, com variação — passam pela mesma memória */
const DM_END={
 walk:[{en:"forget it. I will buy a {race} from one of the other {comm}.",pt:"esquece. compro um {race} de um dos outros {comm}."},
       {en:"we are done. good luck with {kj} at {floor}.",pt:"acabou. boa sorte com o {kj} em {floor}."},
       {en:"not paying that for a rank {rank}. somebody else will not either.",pt:"não pago isso num rank {rank}. e outro também não vai."},
       {en:"I am out. that got tiring on day {day}.",pt:"eu saí. isso cansou no dia {day}."},
       {en:"keep {name}. I will find another one with those eyes.",pt:"fica com o {name}. eu acho outro com esse olho."},
       {en:"no. and now I do not want {kj} anymore.",pt:"não. e agora eu nem quero mais o {kj}."}],
 cold:[{en:"fine. I will not write again. there are {comm} others.",pt:"tranquilo. não escrevo mais. tem {comm} outros."},
       {en:"understood. have a good day {day}.",pt:"entendido. bom dia {day} pra você."},
       {en:"ok. you will not hear from me.",pt:"tá. não vai mais ouvir de mim."},
       {en:"that is that, then.",pt:"então é isso."},
       {en:"noted. I will stay out of your inbox.",pt:"anotado. saio da sua caixa."},
       {en:"wow. ok. bye.",pt:"nossa. tá. falou."}],
 hold:[{en:"understood. if {kj} ever moves, I am here.",pt:"entendi. se o {kj} um dia sair, eu tô aqui."},
       {en:"fair. a {rar} is a good one to keep.",pt:"justo. um {rar} é bom pra guardar."},
       {en:"alright. I will ask about one of the other {n} sometime.",pt:"beleza. qualquer hora pergunto de um dos outros {n}."},
       {en:"no problem. that is what holding is.",pt:"sem problema. segurar é isso."},
       {en:"I get it. I would keep {name} too.",pt:"entendo. eu também guardaria o {name}."},
       {en:"ok. tell me if that ever changes.",pt:"ok. me avisa se isso mudar."}],
 stands:[{en:"alright. the offer on {kj} stands.",pt:"beleza. a oferta pelo {kj} continua de pé."},
       {en:"take your time. I am not going anywhere and neither is the floor.",pt:"pensa com calma. eu não vou a lugar nenhum e o floor também não."},
       {en:"it is on the table until you say no.",pt:"tá na mesa até você dizer não."},
       {en:"no rush. sleep on it, if you sleep.",pt:"sem pressa. dorme com isso, se você dormir."},
       {en:"good. tell me tomorrow, day {day} plus one.",pt:"ótimo. me diz amanhã, dia {day} mais um."},
       {en:"the number is there. it does not expire today.",pt:"o número tá aí. não vence hoje."}]
};
function dmBootLine(v,th){
  const a=[{en:'fine. {0} on top of {kj2}. that is it.',pt:'tá. {0} em cima do {kj2}. é isso.'},
           {en:'I can add {0}. no more than that for a {rar}.',pt:'posso pôr {0}. nada além disso por um {rar}.'},
           {en:'{0} extra and we are done here.',pt:'{0} a mais e a gente encerra.'}];
  const l=pick(a);
  return dmStyle(dmFill((LANG==='pt'?l.pt:l.en).split('{0}').join(money(v)),th),th?th.who:'');
}

/* ================= GERADORES =================
   Como ELA abre a conversa. Toda abertura tem contexto, e muitas têm condição:
   só saem quando o que dizem é verdade hoje. */
const DM_OPEN={
 hello:[{en:"saw you minted {minted} in a row at {gas} gas. respect. or condolences.",pt:"vi que você mintou {minted} seguidos com gas {gas}. respeito. ou pêsames.",if:c=>c.mintedLots},
        {en:"you got hacked this week and you are still here. that is the whole club.",pt:"você foi hackeado essa semana e ainda tá aqui. o clube é esse.",if:c=>c.hacked},
        {en:"it is {hour} and you are online. so am I. do you ever sleep or is it just me.",pt:"são {hour} e você tá online. eu também. você dorme ou sou só eu.",if:c=>c.night},
        {en:"floor {floor} and you have not listed one. I noticed. that is rare in a room of {comm}.",pt:"floor {floor} e você não listou nenhum. reparei. isso é raro numa sala de {comm}.",if:c=>c.listed===0&&c.n>=3},
        {en:"you paid Mr. Kaiju today. everyone pretends they did not. I am not pretending.",pt:"você pagou o Mr. Kaiju hoje. todo mundo finge que não pagou. eu não finjo.",if:c=>c.paidTax},
        {en:"hype at {hype} and the feed is a wall. figured I would talk to one person instead.",pt:"hype em {hype} e o feed virou muro. resolvi falar com uma pessoa em vez disso.",if:c=>c.hypeHigh},
        {en:"hype at {hype}. dead day. figured I would say hello to someone holding a {bestrace}.",pt:"hype em {hype}. dia morto. resolvi dar um oi pra alguém com um {bestrace}.",if:c=>c.hypeLow},
        {en:"day {day}. {n} Kaiju in your wallet. one chair, I assume. hello.",pt:"dia {day}. {n} Kaiju na sua carteira. uma cadeira, imagino. oi."},
        {en:"not selling you anything. just wanted to say {best} is a good one.",pt:"não vou te vender nada. só queria dizer que o {best} é bom."},
        {en:"bom dia. saw your name on the feed next to the {bestrace}. that is all.",pt:"bom dia. vi seu nome no feed do lado do {bestrace}. só isso."}],
 ask:  [{en:"real question: do you read the traits or do you just like the face on {best}?",pt:"pergunta séria: você lê os traits ou só gosta da cara do {best}?"},
        {en:"what is your read on the floor at {floor}? mine is 'it is lying'.",pt:"qual sua leitura do floor em {floor}? a minha é 'tá mentindo'."},
        {en:"you have {n}. how do you decide which one to keep?",pt:"você tem {n}. como você decide qual guardar?"},
        {en:"do you think any of this lasts past day {day}0?",pt:"você acha que isso tudo dura além do dia {day}0?"},
        {en:"settle something for me: rank or face? {best} is rank {rank}, and I like the face.",pt:"resolve uma pra mim: rank ou cara? o {best} é rank {rank}, e eu gosto da cara."},
        {en:"how much of your money is sitting in {n} drawings right now?",pt:"quanto do seu dinheiro tá parado em {n} desenhos agora?"},
        {en:"you minted {minted} today. what were you looking for?",pt:"você mintou {minted} hoje. tava procurando o quê?",if:c=>c.mintedLots},
        {en:"you sold at floor today. was it worth it? honest question.",pt:"você vendeu no floor hoje. valeu a pena? pergunta honesta.",if:c=>c.soldToday}],
 beg:  [{en:"this is embarrassing. I am {v} short of one mint at {gas} gas. I will pay you back.",pt:"isso é constrangedor. tô {v} curto pra um mint com gas {gas}. eu te pago depois."},
        {en:"I know how this sounds. {v} and I am back in before the floor leaves {floor}.",pt:"eu sei como isso soa. {v} e eu volto pro jogo antes do floor sair de {floor}."},
        {en:"I would not ask if I had anyone else to ask in {comm} people. {v}.",pt:"eu não pediria se tivesse pra quem pedir entre {comm} pessoas. {v}."},
        {en:"{v}. that is it. I am not going to explain.",pt:"{v}. é isso. não vou explicar."},
        {en:"rent ate everything. {v} and I stop bothering you.",pt:"o aluguel comeu tudo. {v} e eu paro de te encher."},
        {en:"I am asking five people for {v}. you are the third. you have {n} Kaiju, so.",pt:"tô pedindo {v} pra cinco pessoas. você é o terceiro. você tem {n} Kaiju, então."},
        {en:"Mr. Kaiju took my last one. {v} gets me a mint. I hate typing this.",pt:"o Mr. Kaiju levou o meu último. {v} me dá um mint. odeio digitar isso."}],
 shill:[{en:"nobody is watching the {race} supply. that is all I am saying. you hold one.",pt:"ninguém tá olhando o supply de {race}. é só isso que eu digo. você tem um."},
        {en:"buy the ugly ones. trust me. the floor is {floor} and ugly is cheaper.",pt:"compra os feios. confia. o floor tá {floor} e feio é mais barato."},
        {en:"the low ranks are underpriced and nobody in {comm} people says it.",pt:"os ranks baixos tão baratos demais e ninguém entre {comm} pessoas fala."},
        {en:"I am telling you before I tell the feed. hype is {hype}, it will move.",pt:"tô te falando antes de falar no feed. hype tá {hype}, vai mexer."},
        {en:"one trait is going to matter and I think it is the {eyes} eyes. you have them.",pt:"um trait vai importar e eu acho que é o olho {eyes}. você tem."},
        {en:"you can ignore me. you did on day {day} minus one.",pt:"pode me ignorar. você ignorou no dia {day} menos um."}],
 gift: [{en:"sent you {v}. no reason. this place has been rough since the hack.",pt:"te mandei {v}. sem motivo. esse lugar tá pesado desde o hack.",if:c=>c.hacked},
        {en:"{v} for you. you helped me once and did not make it weird.",pt:"{v} pra você. você me ajudou uma vez e não fez drama."},
        {en:"{v}. I had a good week and you did not. floor {floor} did that.",pt:"{v}. eu tive uma semana boa e você não. o floor em {floor} fez isso."},
        {en:"take {v}. do not ask. mint something at {gas} gas.",pt:"pega {v}. não pergunta. minta alguma coisa com gas {gas}."},
        {en:"{v}. somebody did this for me on day 4.",pt:"{v}. alguém fez isso por mim no dia 4."},
        {en:"sending {v} before I change my mind or Mr. Kaiju finds it.",pt:"mandando {v} antes de mudar de ideia ou o Mr. Kaiju achar."}],
 virus:[{en:"open this, it is a leak of the rarity sheet",pt:"abre isso, é um vazamento da planilha de raridade"},
        {en:"your {bestrace} is in this screenshot, look",pt:"seu {bestrace} tá nesse print, olha"},
        {en:"free mint tool, works, do not share",pt:"ferramenta de mint grátis, funciona, não espalha"},
        {en:"this is the rarity scanner everybody is using",pt:"esse é o scanner de raridade que todo mundo tá usando"},
        {en:"photo of the artist desk, do not repost",pt:"foto da mesa do artista, não reposta"},
        {en:"wallet checker, tells you what your {n} are worth",pt:"checador de carteira, diz quanto seus {n} valem"}],
 seed: [{en:"sorry wrong window",pt:"desculpa janela errada"},
        {en:"ignore that. ignore that. ignore that.",pt:"ignora. ignora. ignora."},
        {en:"that was not for you",pt:"isso não era pra você"},
        {en:"do not read the message above",pt:"não lê a mensagem de cima"},
        {en:"wrong chat. please forget it.",pt:"conversa errada. esquece, por favor."},
        {en:"oh no",pt:"ai não"}],
 nosell:[{en:"not my business, but please do not list {kj}. the {eyes} eyes. it is my favorite in the whole collection.",pt:"não é da minha conta, mas por favor não lista o {kj}. o olho {eyes}. é o meu favorito da coleção inteira."},
        {en:"{kj}. {name}. I look at it every day. do not sell it.",pt:"{kj}. o {name}. eu olho pra ele todo dia. não vende."},
        {en:"weird ask: keep {kj}. it is the only {race} with that {bg} background. I will explain badly if you want.",pt:"pedido estranho: guarda o {kj}. é o único {race} com fundo {bg}. se quiser eu explico mal."},
        {en:"saw that {kj} is yours. that {race} is special to me. please keep it.",pt:"vi que o {kj} é seu. esse {race} é especial pra mim. por favor guarda."},
        {en:"if {kj} ever shows up listed at {floor} I am going to be sad about it for a week.",pt:"se o {kj} aparecer listado por {floor} eu vou ficar mal por uma semana."},
        {en:"I cannot afford a {rar}. I can ask you not to sell {kj}, though.",pt:"eu não tenho como comprar um {rar}. mas posso te pedir pra não vender o {kj}."}],
 trade:[{en:"straight swap? my {kj2} for your {kj}. {race2} for {race}.",pt:"troca seca? meu {kj2} pelo seu {kj}. {race2} por {race}."},
        {en:"no money, just a trade: {kj2} for {kj}. Mr. Kaiju cannot tax a trade.",pt:"sem dinheiro, só troca: {kj2} pelo {kj}. o Mr. Kaiju não taxa troca."},
        {en:"I have been looking at {kj} for days. the {eyes} eyes. take {kj2} for it.",pt:"eu tô olhando o {kj} há dias. o olho {eyes}. leva o {kj2} por ele."},
        {en:"trade instead of buying, if you are into that. {kj2} for {kj}.",pt:"troca em vez de compra, se você curte. {kj2} pelo {kj}."},
        {en:"my {kj2} is nicer than my wallet. swap it for {kj}?",pt:"meu {kj2} é mais bonito que minha carteira. troca pelo {kj}?"},
        {en:"{kj2} for {kj}. no cash on either side. floor is {floor} anyway.",pt:"{kj2} pelo {kj}. sem dinheiro dos dois lados. o floor tá {floor} mesmo."}],
 alert:[{en:"do not click the link going around. it empties the wallet. three people since day {day} minus one.",pt:"não clica no link que tá rolando. ele esvazia a carteira. três pessoas desde o dia {day} menos um."},
        {en:"heads up: there is a fake mint page today. same font and everything. it even shows {floor} as the price.",pt:"aviso: tem uma página de mint falsa hoje. mesma fonte e tudo. até mostra {floor} como preço."},
        {en:"somebody is copying nicknames with one letter changed. there is a fake {who} too. check before you answer.",pt:"tem gente copiando nick com uma letra trocada. tem um {who} falso também. confere antes de responder."},
        {en:"if anyone sends you a wallet checker, it is not a checker. it is for your {bestrace}.",pt:"se alguém te mandar um checador de carteira, não é checador. é pro seu {bestrace}."},
        {en:"three people got drained today. do not open files. you got hit once already.",pt:"três pessoas foram limpas hoje. não abre arquivo. você já levou uma.",if:c=>c.hacked},
        {en:"the support account in the feed is not support. kiv does not DM about wallets.",pt:"a conta de suporte no feed não é suporte. a kiv não manda DM sobre carteira."}],
 plug: [{en:"could you post something about the {race}s? people listen to you more than to the {comm} others.",pt:"você posta alguma coisa sobre os {race}? as pessoas te escutam mais que os outros {comm}."},
        {en:"one post from you is worth ten from me. hype is at {hype} and my listing is dying.",pt:"um post seu vale dez meus. o hype tá {hype} e a minha listagem tá morrendo."},
        {en:"I am not asking for money. I am asking for a post. you have {n} Kaiju, you count.",pt:"não tô pedindo dinheiro. tô pedindo um post. você tem {n} Kaiju, você conta."},
        {en:"say something good about the collection today. floor is {floor}. that is all.",pt:"fala algo bom da coleção hoje. floor em {floor}. só isso."},
        {en:"the feed is dead at hype {hype} and my listing is dying with it.",pt:"o feed tá morto com hype {hype} e a minha listagem tá morrendo junto."},
        {en:"post about it and I will owe you one. a real one, not a feed one.",pt:"posta sobre isso e eu fico te devendo uma. de verdade, não de feed."}],
 accuse:[{en:"you sniped the {race} listing I was waiting on. two seconds. at {hour}.",pt:"você roubou a listagem de {race} que eu tava esperando. dois segundos. às {hour}."},
        {en:"you told people what I was holding. that was private. now {comm} people know.",pt:"você contou o que eu tava segurando. aquilo era particular. agora {comm} pessoas sabem."},
        {en:"somebody copied my post word for word and it was you.",pt:"alguém copiou meu post palavra por palavra e foi você."},
        {en:"you were the only person who knew about my {race} and now everybody knows.",pt:"você era o único que sabia do meu {race} e agora todo mundo sabe."},
        {en:"you bid against me on purpose on day {day}. do not say you did not.",pt:"você deu lance contra mim de propósito no dia {day}. não diz que não."},
        {en:"my offer got pulled right after I told you about it.",pt:"minha oferta foi cancelada logo depois que eu te contei."}],
 return:[{en:"hey. it has been a while. is this still your name, {you}?",pt:"e aí. faz um tempo. esse nome ainda é seu, {you}?"},
        {en:"I disappeared for a bit. the room has {comm} people now. it used to be a chat.",pt:"eu sumi um pouco. a sala tá com {comm} pessoas agora. antes era um chat."},
        {en:"you probably do not remember me. we talked when the floor was nothing. it is {floor} now.",pt:"você provavelmente não lembra de mim. a gente falou quando o floor não era nada. agora tá {floor}."},
        {en:"back after a long break. did the place survive Mr. Kaiju?",pt:"voltei depois de um tempão. o lugar sobreviveu ao Mr. Kaiju?"},
        {en:"logged in after weeks and your name was still here next to a {bestrace}.",pt:"entrei depois de semanas e seu nome ainda tava aqui do lado de um {bestrace}."},
        {en:"hello again. I do not know what to say after this long. floor {floor}, huh.",pt:"oi de novo. não sei o que dizer depois de tanto tempo. floor {floor}, hein."}],
 /* quando o jogador quebra a palavra que deu sobre um Kaiju */
 scold:[{en:"{kj} is listed. you told me you would keep it.",pt:"o {kj} tá listado. você me disse que ia guardar."},
        {en:"so much for your word. {kj} is gone.",pt:"e a sua palavra? o {kj} sumiu."},
        {en:"I saw {kj} leave your wallet. I am not going to pretend I did not.",pt:"eu vi o {kj} sair da sua carteira. não vou fingir que não vi."},
        {en:"you promised about {kj}. I actually believed you.",pt:"você prometeu sobre o {kj}. eu acreditei mesmo."},
        {en:"{kj} was the one thing I asked. one thing.",pt:"o {kj} era a única coisa que eu pedi. uma coisa."},
        {en:"did you at least get a good price for {kj}.",pt:"pelo menos você conseguiu um preço bom pelo {kj}."}],
 /* oferta espontânea, quando a voz não tem a dela */
 offer:[{en:"{v} for {kj}. the {race} with the {eyes} eyes. I have been looking for three days.",pt:"{v} pelo {kj}. o {race} de olho {eyes}. faz três dias que eu procuro."},
        {en:"I want {name}. {v}. it is above floor, which is {floor}, so do not make the face.",pt:"eu quero o {name}. {v}. é acima do floor, que é {floor}, então não faz a cara."},
        {en:"{kj}. {v}. that is what a rank {rank} is worth to me today.",pt:"{kj}. {v}. é quanto um rank {rank} vale pra mim hoje."}],
 /* elogio espontâneo */
 praise:[{en:"you bought above floor. not many in {comm} people do that. noted.",pt:"você comprou acima do floor. pouca gente em {comm} faz isso. anotado.",if:c=>c.bought},
        {en:"{n} Kaiju and none listed at floor. you look at them. I wanted to say that.",pt:"{n} Kaiju e nenhum listado no floor. você olha pra eles. queria dizer isso.",if:c=>c.listed===0},
        {en:"you answered a stranger in dms like a person. that is rarer than a {bestrar}.",pt:"você respondeu um estranho na dm feito gente. isso é mais raro que um {bestrar}."},
        {en:"saw you warn people about the link. nobody does that. thanks.",pt:"vi você avisar o povo do link. ninguém faz isso. valeu."}]
};
/* extra: {tk, tkThem, amount, who}. Quem tem voz abre na voz; quem não tem cai
   na pool comum, que já tem contexto. */
function dmOpenLine(kind,extra){
  const e=extra||{};
  const who=e.who||'';
  const m={tk:e.tk,tkThem:e.tkThem,amount:e.amount};
  const c=dmCtx(null,m);
  if(who)c.who=who;
  const own=who?dmVoicePool(who,kind):null;
  const a=own||DM_OPEN[kind]||DM_OPEN.hello;
  const l=dmFresh(a,c)||a[0];
  dmUse(dmKey(l));
  let s=LANG==='pt'?l.pt:l.en;
  s=dmFill(s,null,m,c);
  return who?dmStyle(s,who):s;
}
/* o que o jogador posta quando aceita fazer o shill de alguém. Curto e sem
   marketing: é o jogador falando, e o jogador não é folheto. */
const PLUG_POSTS=[
 {en:'somebody asked me to say something about this. so: it is good.',pt:'me pediram pra falar disso. então: é bom.'},
 {en:'reminder that people here draw for a living. look at the art once.',pt:'lembrete de que tem gente aqui que desenha pra viver. olha a arte uma vez.'},
 {en:'not financial advice. it is a drawing. I like it.',pt:'não é conselho financeiro. é um desenho. eu gosto.'},
 {en:'posting this because someone asked nicely. that still works on me.',pt:'postando porque alguém pediu com educação. isso ainda funciona comigo.'},
 {en:'go look at the collection page. that is the whole post.',pt:'vai olhar a página da coleção. o post é esse.'},
 {en:'I do not do this often. this one is worth the minute.',pt:'eu não faço isso sempre. essa aqui vale o minuto.'}
];

/* uma frase de seed phrase falsa: doze palavras que NÃO são de nenhuma
   carteira de verdade, tiradas do vocabulário do próprio jogo. */
const SEED_WORDS=['kaiju','kaki','binder','sewer','marker','ronin','static','floppy',
 'oekaki','gutter','crayon','ledger','gouache','crt','vhs','plush','modem','nori'];
function dmFakeSeed(){
  const r=mulberry(hash32('seedleak|'+mintSeed()+'|'+G.day+'|'+G.hour));
  const o=[];
  for(let i=0;i<12;i++)o.push(SEED_WORDS[Math.floor(r()*SEED_WORDS.length)]);
  return o.join(' ');
}

/* quem já falou hoje não fala de novo; quem foi apagado descansa um dia */
function dmCanWrite(who){
  const S=soc();
  if(S.gone&&S.gone[who]===G.day)return false;
  if(dmSilenced(who))return false;
  return true;
}
function dmPickWho(){
  const S=soc();
  /* prefere quem já conversa com você; se ninguém, alguém do elenco */
  const conhecidos=S.threads.filter(x=>!x.arch&&dmCanWrite(x.who)).map(x=>x.who);
  if(conhecidos.length&&chance(0.62))return pick(conhecidos);
  const novos=(typeof CAST!=='undefined'?CAST.map(c=>c.id):[]).filter(w=>
    dmCanWrite(w)&&!S.threads.some(t=>t.who===w)&&w!=='Anonymous Wallet');
  if(novos.length)return pick(novos);
  /* a multidão do feed também escreve: são os nomes que o jogador vê lá */
  const povo=(typeof CROWD!=='undefined'?CROWD:[]).filter(w=>dmCanWrite(w)&&!S.threads.some(t=>t.who===w));
  if(povo.length&&chance(0.5))return pick(povo);
  return conhecidos.length?pick(conhecidos):(povo.length?pick(povo):null);
}

/* ---------- portas ----------
   S.sit zera todo dia (socialEndDay): serve pra "no máximo uma por dia".
   S.sitAt guarda o DIA da última vez e sobrevive: serve pro intervalo em dias,
   que é o que impede uma situação de virar rotina. */
function dmCool(k,dias){
  const S=soc();
  S.sitAt=(S.sitAt&&typeof S.sitAt==='object')?S.sitAt:{};
  const ult=S.sitAt[k];
  return ult==null||(G.day-ult)>=dias;
}
function dmMark(k){
  const S=soc();
  S.sitAt=(S.sitAt&&typeof S.sitAt==='object')?S.sitAt:{};
  S.sitAt[k]=G.day;
  S.sitN=(S.sitN&&typeof S.sitN==='object')?S.sitN:{};
  S.sitN[k]=(S.sitN[k]||0)+1;
}
/* os Kaiju que podem entrar numa conversa: nada no cofre, na vitrine nem no
   fichário — pedir pra não vender o que já está listado seria piada */
function dmFreeTokens(){
  let bin=null;
  try{bin=(typeof binderIds==='function')?binderIds():null;}catch(e){bin=null;}
  return G.tokens.filter(x=>!x.staked&&x.listed==null&&!(bin&&bin.has(x.id)));
}
/* um Kaiju que NÃO é seu, tirado do que já foi mintado */
function dmOtherId(){
  if(!G.minted)return null;
  const meus=new Set(G.tokens.map(x=>x.id));
  for(let i=0;i<40;i++){
    const id=idAtMintIndex(Math.floor(Math.random()*G.minted));
    if(!meus.has(id))return id;
  }
  return null;
}
/* empurra uma segunda mensagem da mesma pessoa sem passar pelo socialDM (que
   guarda 8h entre mensagens dela) — usado só quando as duas são o mesmo gesto */
function dmAdd(th,txt,extra){
  const m=Object.assign({t:txt,day:G.day,hour:G.hour,me:0},extra||{});
  th.msgs.push(m);
  if(th.msgs.length>SOC_CAP.msgs)th.msgs.shift();
  soc().unread++;
  return m;
}
/* alguém do elenco com quem já existe relação de verdade */
function dmFriendWho(minTrust){
  const S=soc();
  const a=S.threads.filter(x=>!x.arch&&dmCanWrite(x.who)&&trustOf(x.who)>=(minTrust||0));
  return a.length?pick(a).who:null;
}
/* o Kaiju que ESTA pessoa ia querer: colecionador e baleia vão no mais raro,
   flipper no mais barato (revende), artista e discreto no que calhar */
function dmWantedToken(who,livres){
  if(!livres.length)return null;
  const v=dmVoice(who);
  const s=livres.slice().sort((a,b)=>b.rarity-a.rarity||a.score-b.score);
  if(v==='collector'||v==='whale'||v==='hakase'||v==='oni')return s[0];
  if(v==='flipper')return s[s.length-1];
  return pick(livres);
}

/* ---------- a palavra dada ----------
   Prometer não vender um Kaiju só vale alguma coisa se quebrar a promessa
   custar. A checagem é aqui e não no mercado: o vendedor não precisa saber
   que a promessa existe, a pessoa é que descobre. */
function dmVows(){const S=soc();S.vows=Array.isArray(S.vows)?S.vows:[];return S.vows;}
function dmVowAdd(who,tk){
  const v=dmVows();
  if(v.some(x=>x.tk===tk&&x.who===who))return;
  v.push({who,tk,day:G.day});
  while(v.length>8)v.shift();
}
function dmVowTick(){
  const v=dmVows();
  if(!v.length)return false;
  for(let i=0;i<v.length;i++){
    const p=v[i];
    const tk=G.tokens.find(x=>x.id===p.tk);
    const quebrou=!tk||tk.listed!=null;   /* vendeu OU pôs na vitrine */
    if(!quebrou)continue;
    v.splice(i,1);
    trustAdd(p.who,-70);
    repAdd(-6);
    dmEvent('brokevow',{who:p.who,tk:p.tk});
    const th=thread(p.who);
    th.lastAt=-99;   /* isto ela escreve na hora, doa a quem doer */
    socialDM(p.who,dmOpenLine('scold',{tk:p.tk,who:p.who}),2,{kind:'scold',tk:p.tk});
    return true;
  }
  return false;
}

/* ---------- o tick ----------
   Chamado de socialTick(). Cada tipo tem sua própria porta: nada aparece antes
   de fazer sentido, e nada aparece toda hora. A ordem importa — o que é mais
   urgente e mais raro é testado primeiro. */
const DM_STORY_WHO=['kiv','oni_of_the_floor','hakase','Leaner (Unc)','Stux','Mr. Kaiju'];
function dmSituationTick(){
  const S=soc();
  S.sit=S.sit&&typeof S.sit==='object'?S.sit:{};
  const day=G.day;
  const comunidade=(typeof communitySize==='function')?communitySize():20;

  /* --- promessa quebrada: cobrança, e vem antes de tudo --- */
  if(dmVowTick())return;

  /* --- vírus: só depois que existe gente o bastante pra ter golpista --- */
  if(day>=6&&comunidade>=40&&chance(0.055)&&(S.sit.virusDay!==day)){
    const who=dmPickWho();
    if(who&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.virusDay=day;
      const marcado=securityActive();
      const avisado=day<=(S.tipUntil||0);
      if(socialDM(who,dmOpenLine('virus',{who}),2,
         {kind:'virus',file:1,flag:marcado?1:0,tip:(!marcado&&avisado)?1:0}))dmMark('virus');
      return;
    }
  }
  /* --- seed phrase vazada: raro, e só depois que o jogador já viu golpe --- */
  if(day>=9&&chance(0.03)&&(S.sit.seedDay!==day)){
    const who=dmPickWho();
    if(who&&trustOf(who)>=10&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.seedDay=day;
      if(socialDM(who,dmFakeSeed(),2,{kind:'seed'})){
        dmAdd(thread(who),dmOpenLine('seed',{who}),{kind:'seed'});
        dmMark('seed');
      }
      return;
    }
  }
  /* --- os seis da história escrevem de vez em quando, na voz deles --- */
  if(day>=7&&dmCool('story',3)&&chance(0.05)&&(S.sit.storyDay!==day)){
    const who=pick(DM_STORY_WHO);
    if(dmCanWrite(who)){
      S.sit.storyDay=day;
      const c=dmCtx(null,{});
      const livres=dmFreeTokens();
      let kind='hello';
      if(who==='hakase'&&livres.length){
        const tk=dmWantedToken(who,livres);
        if(socialDM(who,dmOpenLine('offer',{who,tk:tk.id,amount:tokenValue(tk)*dmOfferMult(who)*rf(1.1,1.5)}),2,
           {kind:'offer',tk:tk.id,price:tokenValue(tk)*dmOfferMult(who)*rf(1.1,1.5)}))dmMark('story');
        return;
      }
      if(who==='oni_of_the_floor'&&c.listedWall)kind='scold';
      if(who==='Mr. Kaiju')kind='ask';
      if(socialDM(who,dmOpenLine('hello',{who}),2,{kind}))dmMark('story');
      return;
    }
  }
  /* --- oferta espontânea, na voz de quem faz: o colecionador quer o raro,
         o flipper quer o barato, e os dois dizem por quê --- */
  if(day>=5&&G.tokens.length>=2&&dmCool('offer',2)&&chance(0.06)&&(S.sit.offerDay!==day)){
    const who=dmPickWho();
    const livres=dmFreeTokens();
    if(who&&livres.length&&DM_STORY_WHO.indexOf(who)<0){
      const tk=dmWantedToken(who,livres);
      const price=tokenValue(tk)*dmOfferMult(who)*rf(0.95,1.35);
      S.sit.offerDay=day;
      if(socialDM(who,dmOpenLine('offer',{who,tk:tk.id,amount:price}),2,{kind:'offer',tk:tk.id,price}))dmMark('offer');
      return;
    }
  }
  /* --- acusação: precisa de gente o bastante pra fofoca existir --- */
  if(day>=9&&comunidade>=70&&dmCool('accuse',4)&&chance(0.035)&&(S.sit.accDay!==day)){
    const who=dmPickWho();
    if(who&&trustOf(who)>-40&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.accDay=day;
      if(socialDM(who,dmOpenLine('accuse',{who}),2,{kind:'accuse'}))dmMark('accuse');
      return;
    }
  }
  /* --- aviso de golpe: vem de quem já gosta de você, e não toda semana --- */
  if(day>=5&&comunidade>=45&&dmCool('alert',2)&&chance(0.05)&&(S.sit.alertDay!==day)){
    const who=dmFriendWho(5)||dmPickWho();
    if(who){
      S.sit.alertDay=day;
      if(socialDM(who,dmOpenLine('alert',{who}),2,{kind:'alert'}))dmMark('alert');
      return;
    }
  }
  /* --- troca de Kaiju: precisa de coleção dos dois lados e de confiança --- */
  if(day>=8&&G.tokens.length>=3&&dmCool('trade',3)&&chance(0.045)&&(S.sit.tradeDay!==day)){
    const who=dmFriendWho(15);
    const meus=dmFreeTokens();
    if(who&&meus.length){
      const meu=pick(meus);
      const dele=dmOtherId();
      if(dele){
        const vMeu=tokenValue(meu);
        const mDele=metaOf(dele);
        const vDele=tokenValue({id:dele,rarity:mDele.rarity,traits:mDele.traits});
        if(vDele>=vMeu*0.5&&vDele<=vMeu*1.7){
          S.sit.tradeDay=day;
          if(socialDM(who,dmOpenLine('trade',{who,tk:meu.id,tkThem:dele}),2,
             {kind:'trade',tk:meu.id,tkThem:dele,boot:0}))dmMark('trade');
          return;
        }
      }
    }
  }
  /* --- não venda esse: só quem acompanha a sua carteira pede isso --- */
  if(day>=6&&dmCool('nosell',3)&&chance(0.045)&&(S.sit.nosellDay!==day)){
    const who=dmFriendWho(12);
    const meus=dmFreeTokens();
    if(who&&meus.length>=2){
      const alvo=meus.reduce((a,b)=>(b.rarity*Math.random()>a.rarity*Math.random()?b:a));
      S.sit.nosellDay=day;
      if(socialDM(who,dmOpenLine('nosell',{who,tk:alvo.id}),2,{kind:'nosell',tk:alvo.id}))dmMark('nosell');
      return;
    }
  }
  /* --- pedido de shill: só quando o feed já tem plateia --- */
  if(day>=6&&comunidade>=60&&dmCool('plug',2)&&chance(0.05)&&(S.sit.plugDay!==day)){
    const who=dmPickWho();
    if(who&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.plugDay=day;
      if(socialDM(who,dmOpenLine('plug',{who}),1,{kind:'plug'}))dmMark('plug');
      return;
    }
  }
  /* --- sumiu e voltou: precisa de alguém que realmente sumiu --- */
  if(day>=10&&dmCool('return',2)&&chance(0.06)&&(S.sit.retDay!==day)){
    const agora=day*24+G.hour;
    const sumidos=S.threads.filter(x=>x.msgs.length&&dmCanWrite(x.who)&&
      (agora-(x.lastAt||0))>=6*24);
    if(sumidos.length){
      const th=pick(sumidos);
      const dias=Math.floor((agora-(th.lastAt||0))/24);
      S.sit.retDay=day;
      if(socialDM(th.who,dmOpenLine('return',{who:th.who}),2,{kind:'return',gone:dias}))dmMark('return');
      return;
    }
  }
  /* --- alguém te manda dinheiro: precisa de confiança alta --- */
  if(day>=5&&chance(0.05)&&(S.sit.giftDay!==day)){
    const amigos=S.threads.filter(x=>trustOf(x.who)>=35&&dmCanWrite(x.who)&&DM_STORY_WHO.indexOf(x.who)<0);
    if(amigos.length){
      S.sit.giftDay=day;
      const th=pick(amigos);
      const v=Math.round(Math.max(6,floorPrice()*rf(0.5,1.6)));
      if(socialDM(th.who,dmOpenLine('gift',{who:th.who,amount:v}),2,{kind:'gift',amount:v}))dmMark('gift');
      return;
    }
  }
  /* --- alguém pedindo ajuda --- */
  if(day>=4&&chance(0.05)&&(S.sit.begDay!==day)){
    const who=dmPickWho();
    if(who&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.begDay=day;
      const v=Math.round(Math.max(5,mintPrice()*rf(1,2)));
      if(socialDM(who,dmOpenLine('beg',{who,amount:v}),1,{kind:'beg',amount:v}))dmMark('beg');
      return;
    }
  }
  /* --- elogio espontâneo: só quando há motivo (comprou acima do floor,
         não listou nada, avisou gente) --- */
  if(day>=4&&dmCool('praise',3)&&chance(0.04)&&(S.sit.praiseDay!==day)){
    const c=dmCtx(null,{});
    const who=dmPickWho();
    if(who&&(c.bought||(c.listed===0&&c.n>=3))&&DM_STORY_WHO.indexOf(who)<0){
      S.sit.praiseDay=day;
      if(socialDM(who,dmOpenLine('praise',{who}),1,{kind:'praise'}))dmMark('praise');
      return;
    }
  }
  /* --- conversa fiada: o que segura o messenger vivo nos dias parados --- */
  if(chance(0.10)){
    const who=dmPickWho();
    if(who){
      const k=pick(['hello','hello','ask','shill']);
      if(socialDM(who,dmOpenLine(k,{who}),1,{kind:k}))dmMark(k);
    }
  }
}
