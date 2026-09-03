/* ================= MODO HISTÓRIA — o motor =================
   O jogo abria com doze ícones, quatro painéis flutuantes e onze mecânicas ao
   mesmo tempo. Quem chega não sabe onde olhar, e nada disso significa nada
   antes de você ter um Kaiju na mão.

   Aqui o desktop começa com QUATRO ícones — mintar, mercado, carteira,
   encerrar o dia — e o resto do jogo chega quando faz sentido. Cada coisa que
   abre tem um MOTIVO na ficção (alguém te chamou, o imposto te achou, a
   comunidade reparou em você) e alguém aparece pra contar.

   Como funciona:
     BEATS  = a lista ordenada de momentos. Cada um tem uma condição, o que
              destrava, quem fala e o que a pessoa diz.
     G.story = {seen:{}, un:{}, q:[]}  — o que já aconteceu, o que está aberto,
              e a fila de falas esperando a vez.
     unlocked(id) = a única pergunta que o resto do jogo faz.

   REGRA: nada aqui pode travar o jogo. Se um beat quebrar, o unlock acontece
   do mesmo jeito — a fala é enfeite, o destravamento é o contrato. */

/* ---------- o elenco que te guia ----------
   Todos são gente da comunidade que já existe no jogo: ninguém foi inventado
   pra ser tutorial, e por isso eles continuam aparecendo no feed e na DM
   depois. O retrato entra em `art` quando o Kiv mandar as imagens; até lá cai
   no avatar pixelado grande, que é o mesmo que a pessoa usa no Kaki+. */
/* O `ico` e o RETRATO DE ESPERA, ate as imagens de verdade entrarem em `art`
   (ver PERSONAGENS.md e o bloco RETRATOS em 59-story-log.js). Cada um foi
   escolhido pra dizer quem e a pessoa: um monitor velho pra quem ja viu
   coisa demais, um bicho pra quem sempre erra primeiro, uma vela pra quem
   aparece quando o jogo machuca. */
const CHARS={
  ina:      {who:'kiv',              ico:'crt',   art:null,
             en:'moderator · has watched four collections die',
             pt:'moderadora · já viu quatro coleções morrerem'},
  oni:      {who:'oni_of_the_floor', ico:'chart',  art:null,
             en:'floor watcher · does not like you yet',
             pt:'vigia do floor · ainda não gosta de você'},
  hakase:   {who:'hakase',           ico:'gem',   art:null,
             en:'buys in silence · appears when there is money',
             pt:'compra calado · aparece quando tem dinheiro'},
  /* O LEANER (Unc). O tio da sala. Engracado, muito retraido, fala pouco e
     quando fala e piada seca — e de vez em quando escapa um emoticon velho
     tipo -_-' ou ¬¬. Aparece quando o jogo machuca. Duas frases no maximo:
     o Kiv reclamou que ele falava demais, e ele e justamente o cara que nao
     fala demais. */
  sera:     {who:'Leaner (Unc)',     ico:'candle',   art:null,
             en:'talks people off the ledge',
             pt:'tira gente do parapeito'},
  /* O STUX. Cara de rua, fala como cara de rua: minusculo, frase curta, "bro"
     e "you feel me" no lugar de virgula, aprendeu tudo apanhando e conta como
     quem conta caso, nao como quem da aula. Nunca poe ele falando bonito. */
  tobi:     {who:'Stux',             ico:'bug',   art:null,
             en:'made every mistake first so you do not have to',
             pt:'cometeu todo erro primeiro pra você não precisar'},
  kaiju:    {who:'Mr. Kaiju',        ico:'kaiju',  art:null, boss:1,
             en:'self-appointed tax collector',
             pt:'cobrador de impostos autonomeado'}
};
function charOf(id){return CHARS[id]||CHARS.ina;}
/* Os subtitulos ("moderadora - ja viu quatro colecoes morrerem") sairam da
   tela: cracha embaixo do nome e coisa de apresentacao de palestra, e o Kiv
   tem razao — quem e a pessoa tem que aparecer no que ela FALA, nao numa
   etiqueta. Os textos continuam no CHARS porque o Kaiju Log usa uma linha
   curta pra dizer quem e quem quando o jogador ainda nao conversou com
   aquela pessoa. */
function charSub(id){const c=charOf(id);return LANG==='pt'?c.pt:c.en;}

/* ---------- estado ---------- */
function story(){
  if(!G.story||typeof G.story!=='object')G.story={};
  const S=G.story;
  S.seen=S.seen&&typeof S.seen==='object'?S.seen:{};
  S.un=S.un&&typeof S.un==='object'?S.un:{};
  S.q=Array.isArray(S.q)?S.q:[];
  return S;
}
/* A pergunta que o resto do jogo faz. Tudo que NÃO está na lista de coisas
   destraváveis é considerado aberto — assim nenhum sistema novo nasce
   escondido por acidente. */
const LOCKABLE={
  /* ícones da área de trabalho */
  site:1, hubmarket:1, hubwallet:1, shutdown:1,
  hubsocial:1, shop:1, free:1, spot:1, media:1, tax:1, inbox:1, readme:1, bin:1,
  /* a loja abre em tres prateleiras: so o antivirus (dia 6, depois do hack),
     depois espaco e contrato (dia 7), depois tudo. Ver 33-app-vault.js. */
  shop_av:1, shop_more:1, shop_all:1,
  /* abas dentro das janelas */
  tab_binder:1, tab_profile:1, tab_dm:1, tab_vault:1,
  tab_mkt_offers:1, tab_mkt_mine:1, tab_mkt_stats:1,
  /* painéis flutuantes */
  wgt_clock:1, wgt_chart:1, wgt_gas:1,
  /* mecânicas soltas */
  m_hype:1, m_sweep:1, m_wallet_sort:1, m_collection_offers:1, m_mkt_stats:1,
  /* recursos DENTRO dos apps. Ficam registrados aqui mesmo antes de alguém
     usar: um id que não está nesta tabela é considerado aberto, então
     esquecer de registrar nunca esconde nada por acidente — o erro cai pro
     lado seguro. */
  f_bulk:1,        /* os botões x2..x10 da página de mint */
  f_queue:1,       /* o scanner da fila */
  f_referral:1,    /* o link de indicação */
  f_wgrid:1,       /* o S/M/L da carteira */
  f_stake:1,       /* travar Kaiju no cofre */
  f_boost:1,       /* o botão de comprar hype no Kaki+ */
  f_react:1,       /* reagir a post (EXP) */
  f_knsize:1,      /* o S/M/L do Kaki+ */
  f_pagesize:1,    /* o S/M/L da página de mint */
  f_hudskip:1,     /* pular uma hora pelo painel da carteira */
  f_notes:1,       /* criar bloco de notas */
  f_binder_fill:1, /* encher página do fichário de uma vez */
  f_quests:1,      /* as missões diárias */
  f_milestones:1   /* os marcos */
};
/* ---------- A REDE DE SEGURANCA ----------
   Um icone preso atras de uma conversa e uma aposta: se a conversa nao
   chegar, o jogador fica olhando pra uma tela sem nada pra fazer. Foi
   exatamente isso que aconteceu — sete Kaiju na carteira, nivel 2, e nenhuma
   carteira na area de trabalho, porque a fala que abria ela estava seis
   momentos atras na fila e o dinheiro acabou antes.

   Entao: algumas coisas NAO SAO NEGOCIAVEIS. Se a condicao aqui embaixo for
   verdade, o icone existe, com fala ou sem fala. A historia continua sendo
   quem apresenta — ela so nao e mais quem PERMITE. */
const SEMPRE={
  hubwallet: ()=>held()>0,        /* tem Kaiju? tem onde olhar pra ele. */
  hubmarket: ()=>true,            /* o mercado existe desde o primeiro segundo: e a segunda coisa da mesa */
  shutdown:  ()=>true,            /* encerrar o dia nunca pode faltar. */
  site:      ()=>true             /* nem o lugar de mintar. */
};
function unlocked(id){
  if(!LOCKABLE[id])return true;
  if(story().un[id])return true;
  const f=SEMPRE[id];
  if(f){try{if(f())return true;}catch(e){}}
  return false;
}
function unlock(id,quiet){
  const S=story();
  if(S.un[id])return false;
  S.un[id]=G.day||1;
  if(!quiet)S.fresh=id;
  return true;
}

/* ---------- situações que passam ----------
   Alguns momentos nascem de uma coisa que ACONTECE e depois some: a carteira
   encheu, o dia deu dump, a rede entupiu. Se o ritmo estiver ocupado na hora,
   o momento se perderia pra sempre e o jogador nunca ia saber daquela regra.
   `stMark` guarda que aconteceu: uma vez verdade, verdade pra sempre. */
function stMark(k,cond){
  const S=story();
  if(!S.m||typeof S.m!=='object')S.m={};
  if(S.m[k])return true;
  let ok=false;try{ok=!!cond;}catch(e){ok=false;}
  if(ok)S.m[k]=G.day||1;
  return ok;
}
/* Leitura à prova de save antigo: campo que não existe vale zero. G.log é o
   diário do DIA (zera toda noite); G.totals é de sempre. Um save de dia 30
   aberto às 8h tem log zerado e totals cheio — quem pergunta "já mintou
   alguma vez?" tem que olhar os dois. */
function stL(k){const L=G&&G.log;return L?(+L[k]||0):0;}
function stT(k){const T=G&&G.totals;return T?(+T[k]||0):0;}
function stEver(k){return stT(k)||stL(k);}

/* ---------- os momentos ----------
   `when` roda muito: mantenha barato, sem laço grande.
   `un`   o que abre.
   `say`  quem fala e o quê. Uma fala por tela; `point` acende o alvo.
   A ORDEM É A PRIORIDADE: o motor para no primeiro momento maduro que ainda
   não aconteceu. Por isso o que é reativo (quebrou, encheu, o imposto bateu)
   mora lá em cima — senão ele fica atrás da fila de ensino e chega tarde. */
const BEATS=[/* ============ DIA 1: as três coisas que importam ============ */
/* A carteira NAO abre no dia 1. O jogador nao tem o que ver dentro dela antes
   de ter Kaiju na mao, e um icone que so mostra vazio ensina errado. Ela chega
   em b_wallet, com cinco na mao, junto com o motivo de abrir. */
{id:'b_open', core:1, when:()=>G.walletMade,
 un:['site','hubmarket','shutdown','wgt_clock'],
 say:[{c:'ina',en:"Bom dia! So you found it too.",
       pt:"Bom dia! Então você também achou."},
      {c:'ina',en:"8888 hand-drawn Kaiju and almost nobody has noticed yet. Go mint one — you'll get it faster than I could explain.",
       pt:"8888 Kaiju desenhados à mão e quase ninguém reparou ainda. Vai mintar um — você vai entender mais rápido do que eu explicaria.",
       point:'[data-icon="site"]'}]},

{id:'b_first_mint', core:1, when:()=>stEver('mint')>=1||held()>=1, un:['f_pagesize','hubwallet'],
 say:[{c:'ina',en:"There it is. That one is yours and nobody else will ever have it.",
       pt:"Pronto. Esse é seu e mais ninguém vai ter."},
      {c:'ina',en:"Heads up: you paid the mint price AND gas. Gas is the network fee for signing, and it moves — check it before every mint or it eats you alive.",
       pt:"Fica ligado: você pagou o preço do mint E o gas. Gas é a taxa da rede pela assinatura, e ele muda — confere antes de cada mint ou ele te come vivo."},
      {c:'ina',en:"He is in your wallet now. That icon is where everything you own lives — open it whenever you want to look at them.",
       pt:"Ele tá na sua carteira agora. Aquele ícone é onde mora tudo que é seu — abre quando quiser olhar eles.",
       point:'[data-icon="hubwallet"]'},
      {c:'ina',en:"There is a readme.txt on that desktop too. It was there before you got here. It is short and it is honest.",
       pt:"E tem um readme.txt nessa área de trabalho. Já tava aí antes de você chegar. É curto e é honesto.",
       point:'[data-icon="readme"]'}]},

/* O pular-uma-hora vem JUNTO com a aula de gas, no dia 1. O dono acordou no
   dia 2 com gas a 400% e literalmente nada pra fazer — ficou parado olhando a
   tela. Gas e onda: a resposta pra onda alta e esperar, e esperar tem que ser
   um botao, nao um relogio de verdade. */
{id:'b_gas', core:1, when:()=>stEver('mint')>=1||held()>=1, un:['wgt_gas','f_hudskip'],
 say:[{c:'tobi',en:"yo. gas ain't a price, it's a wave — cheap in the morning, brutal at night. stick the gas meter on your desktop and mint when it's low. you feel me?",
       pt:"e aí. gas não é preço, é onda — barato de manhã, brutal de noite. prega o medidor de gas na sua mesa e minta quando tiver baixo. tá ligado?"},
      {c:'tobi',en:"and when it's high, don't sit there staring. the wallet panel has a SKIP 1 HOUR button. skip ahead, it comes back down.",
       pt:"e quando tiver alto, não fica parado encarando. o painel da carteira tem um botão de PULAR 1 HORA. pula, que ele desce de volta.",
       point:'#hud'}]},

{id:'b_endday', core:1, until:1, when:()=>G.hour>=12||stEver('mint')>=2,
 say:[{c:'ina',en:"Your day is not infinite. Every mint eats hours, and when the hours are gone you sleep.",
       pt:"Seu dia não é infinito. Cada mint come horas, e quando as horas acabam você dorme."},
      {c:'ina',en:"End the day when you are done. Nothing is lost.",
       pt:"Encerra o dia quando terminar. Nada se perde.",
       point:'[data-icon="shutdown"]'}]},

{id:'b_bulk', core:1, when:()=>stEver('mint')>=2, un:['f_bulk'],
 say:[{c:'tobi',en:"bro, you can sign up to ten in one go. gas is still per Kaiju but it saves you hours. I minted one at a time for four days before anyone told me.",
       pt:"mano, dá pra assinar até dez de uma vez. o gas continua por Kaiju mas economiza horas. eu mintei de um em um por quatro dias antes de alguém me falar."}]},

/* O momento em que a carteira finalmente vale a pena abrir: cinco na mao. Aqui
   ela CHEGA (o icone nasce agora) e o motivo de abrir vem junto — traits, rank
   e a primeira listagem. Antes isso era dois beats separados, e o segundo
   chegava tarde demais. */
/* `urg` porque a carteira nunca pode chegar atrasada: com cinco Kaiju na mao e
   nenhum lugar pra olhar eles, o jogador acha que o jogo esqueceu dele. Fura a
   cota do dia, nunca o intervalo. */
{id:'b_wallet', core:1, until:1, when:()=>held()>=3,
 say:[{c:'ina',en:"Three already. Open the wallet and compare them — the rank is what decides what each one is worth.",
       pt:"Três já. Abre a carteira e compara — o rank é o que decide quanto cada um vale.",
       point:'[data-icon="hubwallet"]'}]},

{id:'b_list', core:1, until:1, when:()=>held()>=5,
 say:[{c:'ina',en:"Five. There's always one you don't care about — that one is money. List it from the wallet, set a price, and it sells while you keep minting.",
       pt:"Cinco. Sempre tem um que você não liga — esse aí é dinheiro. Lista ele pela carteira, põe um preço, e ele vende enquanto você continua mintando.",
       point:'[data-icon="hubwallet"]'}]},
{id:'b_market', core:1, when:()=>held()>=6,
 un:['tab_mkt_offers','m_sweep'],
 say:[{c:'oni',en:"You are the one minting. I watch the floor here.",
       pt:"Você é o que tá mintando. Eu vigio o floor por aqui."},
      {c:'oni',en:"Two ways out of a Kaiju. List it and wait, or take an offer someone puts on your desk. Listing pays more and takes longer.",
       pt:"Duas saídas pra um Kaiju. Listar e esperar, ou aceitar uma oferta que põem na sua mesa. Listar paga mais e demora."},
      {c:'oni',en:"Do not dump on the floor. I will know, and so will everyone else.",
       pt:"Não despeja no floor. Eu vou saber, e todo mundo também.",
       point:'[data-icon="hubmarket"]'}]},

/* ATENÇÃO SAVE ANTIGO: G.log.mint zera toda noite. Um save de dia 30 com 200
   Kaiju na carteira responderia "nunca mintou" se a pergunta fosse só o log. */
/* ============ O MUNDO VIVO ============
   Coisas que acontecem porque o jogador FEZ alguma coisa e alguem reparou.
   Nao ensinam nada — comentam. E a diferenca entre um tutorial e uma sala com
   gente dentro. */
{id:'b_gasburn', urg:1, gap:0,
 when:()=>stMark('gasburn',(+G.lastMintGas||0)>=1.6&&!!story().seen.b_gas),
 say:[{c:'tobi',en:"bro. I just saw what you paid to mint that. you good? you're losing it.",
       pt:"mano. acabei de ver quanto você pagou pra mintar aquilo. cê tá bem? cê tá pirando."},
      {c:'tobi',en:"gas was through the roof and you signed anyway. same Kaiju would've been half price at nine in the morning. look at the meter before you sign. you feel me?",
       pt:"o gas tava nas alturas e você assinou mesmo assim. o mesmo Kaiju ia sair pela metade às nove da manhã. olha o medidor antes de assinar. tá ligado?"}]},

/* ============ REATIVOS ============
   Nada aqui dispara sozinho — só quando o jogo já machucou. Ficam no topo
   porque o motor lê em ordem: embaixo, chegariam três dias depois do fato. */
/* SEM DINHEIRO E SEM SAIDA era o pior momento do jogo: o jogador gastava os
   quarenta dolares, ficava com a tela cheia de nada e ninguem dizia o que
   fazer. Dispara quando ele NAO CONSEGUE MAIS MINTAR — nao quando chega no
   zero absoluto, que e tarde demais — e desde o dia 1. */
{id:'b_broke', urg:1, gap:0,
 when:()=>stMark('broke',held()>0&&G.money<(mintPrice()*saturation()+gasFee())),
 say:[{c:'sera',en:"broke on day one. classic. -_-' we've all been there, don't tell anyone.",
       pt:"quebrou no dia um. clássico. -_-' todo mundo já passou, não conta pra ninguém."},
      {c:'sera',en:"two options: sell one at floor (fast, but floor = less than it's worth), or just end the day and let the royalties roll in while you sleep.",
       pt:"duas opções: vende um no floor (rápido, mas floor = menos do que vale), ou encerra o dia e deixa as royalties pingarem enquanto você dorme.",
       point:'[data-icon="shutdown"]'}]},

{id:'b_cap', urg:1, gap:0,
 when:()=>stMark('cap',held()>=capacity()),
 say:[{c:'hakase',en:"Your wallet is full. Not one more mint goes in.",
       pt:"Sua carteira encheu. Não entra mais nenhum mint."},
      {c:'hakase',en:"Space is the ceiling on everything you earn. Sell one, or file one away. And when space is for sale, buy it before anything else.",
       pt:"Espaço é o teto de tudo que você ganha. Vende um, ou arquiva um. E quando espaço estiver à venda, compra antes de qualquer outra coisa."}]},

{id:'b_audit', urg:1,
 when:()=>stMark('audit',(+G.lastAuditDay||0)>0),
 say:[{c:'kaiju',en:"Audit. I do not need a reason and you do not have an appeal.",
       pt:"Auditoria. Eu não preciso de motivo e você não tem recurso."},
      {c:'kaiju',en:"The bill came due today instead of the day you were expecting. Every three days was a courtesy, not a rule.",
       pt:"A conta venceu hoje, não no dia que você esperava. Cada três dias era cortesia, não regra."}]},

{id:'b_seize', urg:1,
 when:()=>stMark('seize',(+G.taxDue||0)>0&&(G.day-(+G.lastTaxDay||0))>=2),
 say:[{c:'kaiju',en:"Your account has been open for days. I notice these things.",
       pt:"Sua conta está aberta há dias. Eu reparo nessas coisas."},
      {c:'kaiju',en:"If I have to pay myself I take Kaiju, cheapest first. What is left over rolls with interest and I come back.",
       pt:"Se eu tiver que me pagar sozinho eu levo Kaiju, o mais barato primeiro. O resto rola com juros e eu volto."},
      {c:'sera',en:"pro tip: he can't touch what's in the vault or the binder. don't ask me how I know. ¬¬",
       pt:"dica: ele não alcança o que tá no cofre ou no fichário. não pergunta como eu sei. ¬¬"}]},

/* ============ DIA 2: o relógio, o correio, o gas, o mercado ============ */
{id:'b_inbox', when:()=>G.day>=2, un:['inbox'],
 say:[{c:'ina',en:"Bom dia! Quick one: we built a small inbox app so I can reach holders directly — patch notes, news, that kind of thing. Downloading it to you now.",
       pt:"Bom dia! Rapidinho: a gente fez um app de correio pra eu falar direto com os holders — notas de atualização, novidades, essas coisas. Baixando pra você agora."},
      {dl:'inbox'},
      {c:'ina',en:"There's already something in it. Each note has a little thank-you inside.",
       pt:"Já tem coisa dentro. Cada nota tem um agradecimento pequeno dentro.",
       point:'[data-icon="inbox"]'}]},

/* ============ DIA 3: a comunidade, o trabalho, o imposto ============ */
/* A LOJA. Ninguem apresenta uma loja; a vida apresenta. Na noite do dia 5 o
   jogador e hackeado (roteirizado, 24-state.js hackTutorial), acorda com a
   tela de invasao, e ai alguem que JA PASSOU POR ISSO manda mensagem: tem
   algo que da pra fazer. So o antivirus na prateleira. O resto chega depois,
   uma coisa de cada vez, como prateleira que enche. */
{id:'b_hacked', urg:1, gap:0, when:()=>(+G.hackTut||0)>0&&G.day>=(+G.hackTut||6),
 un:['shop','shop_av'],
 say:[{c:'tobi',en:"damn, man. you got hacked. that sucks. I know exactly how that feels, I lost a whole wallet in march.",
       pt:"caramba, cara. você foi hackeado. que droga. eu sei exatamente como é, perdi uma carteira inteira em março."},
      {c:'tobi',en:"but there's something you can do. kiv rushed out a shop app and the only thing on the shelf right now is the antivirus. get it. buy it tonight.",
       pt:"mas tem uma coisa que dá pra fazer. o kiv soltou às pressas um app de loja e a única coisa na prateleira agora é o antivírus. pega. compra hoje."},
      {dl:'shop'},
      {c:'tobi',en:"it ain't a one-time thing, it runs out and you pay again. but while it's paid, they don't get in. you feel me?",
       pt:"não é coisa de uma vez só, vence e você paga de novo. mas enquanto tá pago, eles não entram. tá ligado?"}]},

{id:'b_shop_more', when:()=>G.day>=7&&unlocked('shop'), un:['shop_more','tab_profile'],
 say:[{c:'ina',en:"Bom dia! The shop restocked overnight. Two things on the shelf now: wallet space, and contract speed.",
       pt:"Bom dia! A loja reabasteceu de madrugada. Duas coisas na prateleira agora: espaço na carteira, e velocidade de contrato.",
       point:'[data-icon="shop"]'},
      {c:'ina',en:"Space first. Always space first. It is the ceiling on everything you earn.",
       pt:"Espaço primeiro. Sempre espaço primeiro. É o teto de tudo que você ganha."}]},

{id:'b_shop_all', when:()=>G.day>=9&&unlocked('shop_more'), un:['shop_all'],
 say:[{c:'ina',en:"The shop is fully stocked now. Batch minting, listing speed, gas optimizer, the queue scanner — all of it.",
       pt:"A loja está com a prateleira cheia agora. Mint em lote, velocidade de listagem, otimizador de gas, o scanner da fila — tudo.",
       point:'[data-icon="shop"]'},
      {c:'ina',en:"None of it is urgent. Space and the antivirus are. The rest is for when the money is real.",
       pt:"Nada disso é urgente. Espaço e antivírus são. O resto é pra quando o dinheiro for de verdade."}]},

{id:'b_tax', urg:1, gap:0, when:()=>(+G.taxDue||0)>0||G.day>=3, un:['tax'],
 say:[{c:'kaiju',en:"You made money. I came for my share.",
       pt:"Você ganhou dinheiro. Eu vim buscar minha parte."},
      {c:'kaiju',en:"I am not in the collection. Nobody has seen my paperwork. I come back every three days and I always come back.",
       pt:"Eu não sou da coleção. Ninguém viu meu papel. Eu volto a cada três dias e eu sempre volto."},
      {c:'sera',en:"ah, he found you. nobody knows what he is. just pay him -_-' trust me, refusing is worse.",
       pt:"ah, ele te achou. ninguém sabe o que ele é. só paga -_-' confia, recusar é pior.",
       point:'[data-icon="tax"]'}]},

/* O deboche vem DEPOIS de pagar — quando o jogador ja sentiu o preco. E nao
   entrega nada: desconfianca, nao resposta. O misterio e o personagem. */
{id:'b_tax_paid', when:()=>stT('tax')>0,
 say:[{c:'ina',en:"They told me Mr. Kaiju came to collect from you. Is that true? Unbelievable.",
       pt:"Me contaram que o Mr. Kaiju veio te cobrar. É verdade? Inacreditável."},
      {c:'ina',en:"I don't know what kind of Kaiju that is or why he does it. But honestly — word around here is that it's better to pay. I'll talk to Stux about it.",
       pt:"Não sei que tipo de Kaiju é aquele nem por que ele faz aquilo. Mas de verdade — fiquei sabendo por aí que é melhor pagar. Vou falar com o Stux sobre isso."},
      {c:'tobi',en:"yeah, kiv just messaged me about him. I went through all 8888 twice, bro. he ain't in there. don't ask me where the money goes.",
       pt:"é, o kiv acabou de me mandar mensagem sobre ele. eu passei pelos 8888 duas vezes, mano. ele não tá lá. não me pergunta pra onde vai o dinheiro."}]},

/* ============ DIA 4-6: a rotina ============ */
{id:'b_social', when:()=>(G.day>=2&&held()>=3)||G.day>=3, un:['hubsocial','m_hype','f_knsize'],
 say:[{c:'ina',en:"You started minting — and so did other people. So while you were all minting, we built something: Kaki+, a social app just for the collection.",
       pt:"Você começou a mintar — e outras pessoas também. Então enquanto vocês mintavam, a gente fez uma coisa: o Kaki+, um app social só da coleção."},
      {dl:'hubsocial'},
      {c:'ina',en:"It's small and it's ours. Post there and you build HYPE — hype is what makes strangers mint, and their mints pay you. It leaks every hour, so keep it alive.",
       pt:"É pequeno e é nosso. Poste lá e você constrói HYPE — hype é o que faz estranho mintar, e os mints deles te pagam. Ele vaza toda hora, então mantém vivo.",
       point:'[data-icon="hubsocial"]'}]},

/* Reagir e postar chegam como um UPDATE do Kaki+, anunciado por alguem, no
   dia 4 — nao como aula. Um forum que ganha recurso novo e um lugar vivo. */
{id:'b_boost', when:()=>G.day>=4&&unlocked('hubsocial'), un:['f_boost','f_react'],
 say:[{c:'ina',en:"Bom dia! Kaki+ just shipped an update. You can react to posts now, and you can post yourself.",
       pt:"Bom dia! O Kaki+ acabou de soltar um update. Agora dá pra reagir aos posts, e dá pra você postar.",
       point:'[data-icon="hubsocial"]'},
      {c:'ina',en:"Reacting is free and it gives you EXP, and EXP counts toward your rank the same as a Kaiju does.",
       pt:"Reagir é de graça e dá EXP, e EXP conta pro seu rank igual a um Kaiju na carteira."},
      {c:'ina',en:"Posting costs money and buys hype. The second post of the day returns less than the first, and the fifth is almost nothing. That is not a bug, that is attention.",
       pt:"Postar custa dinheiro e compra hype. O segundo post do dia rende menos que o primeiro, e o quinto quase nada. Não é bug, é atenção."}]},

{id:'b_spotter', when:()=>G.day>=6, un:['spot'],
 say:[{c:'ina',en:"New app from us: the Kaiju Spotter. We're cataloguing the collection before it mints out and we pay per correct entry. Not much — but it's work you can do on any day.",
       pt:"App novo nosso: o Kaiju Spotter. A gente tá catalogando a coleção antes do mintout e paga por ficha certa. Pouco — mas é trabalho que dá pra fazer em qualquer dia."},
      {dl:'spot'},
      {c:'tobi',en:"pay's insulting, bro. but after a week you'll read a bust faster than anybody in here.",
       pt:"o pagamento é ofensivo, mano. mas depois de uma semana você lê um busto mais rápido que qualquer um aqui.",
       point:'[data-icon="spot"]'}]},

{id:'b_free', when:()=>G.day>=4&&unlocked('hubsocial'), un:['free'],
 say:[{c:'ina',en:"We opened the Kakizone — one free mint every day for holders, and a few daily tasks. Sending you the app.",
       pt:"A gente abriu a Kakizone — um free mint por dia pros holders, e umas tarefas diárias. Mandando o app pra você."},
      {dl:'free'},
      {c:'tobi',en:"still costs gas though. nothing here is actually free, you feel me? but that's the closest it gets.",
       pt:"mas ainda paga gas. nada aqui é de graça de verdade, tá ligado? mas é o mais perto que chega.",
       point:'[data-icon="free"]'}]},

{id:'b_quests', when:()=>G.day>=5&&unlocked('free'), un:['f_quests','f_milestones'],
 say:[{c:'tobi',en:"the kakizone hands out chores. they pay bad on purpose, bro — that's a compass, not a faucet. it's telling you where to look.",
       pt:"a kakizone dá tarefa do dia. paga mal de propósito, mano — aquilo é bússola, não torneira. tá te dizendo onde olhar."},
      {c:'tobi',en:"the milestones under them count the MOST you ever held at once. selling never walks that bar backwards. took me a month to figure that out, bro. a month.",
       pt:"os marcos embaixo contam o MAIOR número que você já segurou de uma vez. vender não anda com a barra pra trás. levei um mês pra sacar isso, mano. um mês."}]},

{id:'b_contract', when:()=>unlocked('shop_more')&&stEver('mint')>=12,
 say:[{c:'ina',en:"You are spending your day inside the mint page. Minutes are the resource you cannot buy back.",
       pt:"Você tá passando o dia dentro da página de mint. Minuto é o recurso que não volta."},
      {c:'ina',en:"Contract Speed in the shop cuts that in half over ten steps. It pays for itself in mints, not in money.",
       pt:"A Velocidade de Contrato na loja corta isso pela metade em dez degraus. Se paga em mints, não em dinheiro."}]},

{id:'b_binder', when:()=>held()>=6, un:['tab_binder'],
 say:[{c:'ina',en:"Six of them. Time to file.",
       pt:"Seis. Hora de arquivar."},
      {c:'ina',en:"The binder is a real album. A Kaiju filed there cannot be taken from you — not by Mr. Kaiju, not by anyone.",
       pt:"O fichário é um álbum de verdade. Um Kaiju arquivado ali não pode ser tomado de você — nem pelo Mr. Kaiju."}]},

{id:'b_rarity', when:()=>stMark('rare',G.tokens.some(t=>t.rarity>=2)),
 say:[{c:'oni',en:"I saw what came out of your machine. That one is not common.",
       pt:"Eu vi o que saiu da sua máquina. Esse aí não é comum."},
      {c:'oni',en:"Rank multiplies the floor. A rare is worth two of them, a legendary seven, a mythic twenty. Same floor, different Kaiju.",
       pt:"Rank multiplica o floor. Um raro vale dois, um lendário sete, um mítico vinte. Mesmo floor, outro Kaiju."},
      {c:'oni',en:"And races run hot and cold. A race everyone wants today is worth almost double the same race last week.",
       pt:"E raça esquenta e esfria. Uma raça que todo mundo quer hoje vale quase o dobro dela mesma semana passada."}]},

{id:'b_races', when:()=>(G.seenRaces||[]).length>=5,
 say:[{c:'tobi',en:"you pulled five different races already. the machine's keeping a list of every one you've seen, bro.",
       pt:"você já tirou cinco raças diferentes. a máquina tá guardando a lista de todas que você viu, mano."},
      {c:'tobi',en:"seeing all of em is an achievement, and achievements in here ain't badges. they're proof you actually looked.",
       pt:"ver todas é uma conquista, e conquista aqui não é medalha. é prova de que você olhou de verdade."}]},

{id:'b_media', when:()=>G.day>=5, un:['media','bin'],
 say:[{c:'tobi',en:"yo, somebody from the community made a media player with a lo-fi loop. kiv put it on the server. grabbing it for you — you're gonna be here a while.",
       pt:"ó, alguém da comunidade fez um media player com um loop de lo-fi. o kiv botou no server. pegando pra você — você vai ficar aqui um tempo."},
      {dl:'media'}]},

{id:'b_scam_warn', urg:1, when:()=>G.day>=7,
 say:[{c:'tobi',en:"one more thing, since we're on the subject of getting robbed, bro.",
       pt:"mais uma coisa, já que a gente tá falando de ser roubado, mano."},
      {c:'tobi',en:"nobody real ever asks for a seed phrase. no support, no mod, no giveaway, nobody. ever. you close that with the X.",
       pt:"ninguém de verdade pede seed phrase. nem suporte, nem mod, nem sorteio, ninguém. nunca. fecha aquilo no X."},
      {c:'tobi',en:"the antivirus stops the ones who break in. it don't stop you handing them the keys. you feel me?",
       pt:"o antivírus para quem arromba. ele não para você de entregar a chave. tá ligado?"}]},

{id:'b_event', when:()=>stMark('event',G.day>=4&&!!G.event&&G.event!=='calm'),
 say:[{c:'oni',en:"Every day wakes up in a mood. Today is not yesterday and none of it is up to you.",
       pt:"Todo dia acorda com um clima. Hoje não é ontem e nada disso depende de você."},
      {c:'oni',en:"Bull run, cold market, gas spike, a whale dumping. Read the card in the morning before you decide what the day is for.",
       pt:"Bull run, mercado frio, pico de gas, baleia dumpando. Lê o card de manhã antes de decidir pra que serve o dia."}]},

{id:'b_chart', when:()=>G.bestLevel>=3||G.day>=6, un:['wgt_chart','tab_mkt_stats','m_mkt_stats'],
 say:[{c:'oni',en:"You are around enough now to want a chart.",
       pt:"Você já tá aqui o bastante pra querer um gráfico."},
      {c:'oni',en:"Floor is not the price of your Kaiju. It is the price of the CHEAPEST one. Yours is worth floor times its rank.",
       pt:"Floor não é o preço do seu Kaiju. É o preço do MAIS BARATO. O seu vale o floor vezes o rank dele."}]},

{id:'b_listing', when:()=>stEver('listed')>=1,
 say:[{c:'oni',en:"A listing is a signature too, so it burns gas — a fraction of a mint, but not zero.",
       pt:"Listar também é assinatura, então queima gas — uma fração do mint, mas não é zero."},
      {c:'oni',en:"Listing several at once is one signature for the batch. And the shop sells listing speed, which is the difference between a chore and an evening.",
       pt:"Listar vários de uma vez é uma assinatura só. E a loja vende velocidade de listagem, que é a diferença entre tarefa e noite perdida."}]},

{id:'b_sort', when:()=>held()>=10, un:['m_wallet_sort','f_wgrid'],
 say:[{c:'ina',en:"Ten of them. You cannot eyeball that any more — the wallet has a filter, a sort and a grid size. Use them.",
       pt:"Dez. Não dá mais pra olhar no olho — a carteira tem filtro, ordenação e tamanho de grade. Usa."}]},

{id:'b_dm', urg:1, when:()=>unlocked('hubsocial')&&((typeof soc==='function'&&soc().threads)||[]).length>0, un:['tab_dm'],
 say:[{c:'ina',en:"Somebody wrote to you privately. The forum has a tab for that.",
       pt:"Alguém te escreveu no privado. O fórum tem uma aba pra isso."},
      {c:'ina',en:"How you answer changes what people offer you later. Trust is a currency here and it does not show up in your wallet.",
       pt:"Como você responde muda o que te oferecem depois. Confiança é moeda aqui e não aparece na carteira."}]},

{id:'b_offers', when:()=>stEver('sold')>=1, un:['m_collection_offers','tab_mkt_mine'],
 say:[{c:'hakase',en:"You sold one. Good.",
       pt:"Você vendeu um. Bom."},
      {c:'hakase',en:"When the collection gets deeper, people bid on ALL of it at once. Below floor, always. It is liquidity with a haircut and sometimes you need it.",
       pt:"Quando a coleção ficar mais funda, tem quem dê lance na coleção INTEIRA. Sempre abaixo do floor. É liquidez com desconto."}]},

/* ============ o que o jogador faz contra si mesmo ============ */
{id:'b_saturation', when:()=>stMark('sat',stL('mint')>=25),
 say:[{c:'tobi',en:"found this one out the worst way, bro. minting a hundred in one day makes YOUR next mint more expensive.",
       pt:"descobri essa do pior jeito, mano. mintar cem num dia só faz o SEU próximo mint ficar mais caro."},
      {c:'tobi',en:"that ain't the market punishing you. that's you flooding your own machine, and the machine notices. you feel me?",
       pt:"não é o mercado te punindo. é você inundando a sua própria máquina, e ela repara. tá ligado?"},
      {c:'tobi',en:"split it across two days and the price walks right back down. collection don't care either way. your wallet does.",
       pt:"divide em dois dias e o preço desce de volta na hora. a coleção não liga de um jeito nem de outro. sua carteira liga."}]},

{id:'b_listpress', when:()=>stMark('lp',stEver('listed')>=8),
 say:[{c:'oni',en:"You have a wall of listings open at once. I can see it from here and so can the book.",
       pt:"Você tá com uma parede de listagem aberta. Eu vejo daqui e o book vê também."},
      {c:'oni',en:"A wall sells slower and drags your own floor down with it. And at the end of the day the room reads it as dumping.",
       pt:"Parede vende mais devagar e derruba o seu próprio floor junto. E de noite a sala lê aquilo como despejo."}]},

{id:'b_sweep', when:()=>G.day>=6&&npcHeld()>=60&&unlocked('hubmarket'),
 say:[{c:'oni',en:"You can buy back off the floor. Sweeping, we call it.",
       pt:"Dá pra comprar de volta do floor. Varrer, a gente chama."},
      {c:'oni',en:"Each one you take costs a little more than the one before, plus the network fee. Sweeping two hundred is not sweeping one two hundred times.",
       pt:"Cada um que você tira custa um pouco mais que o anterior, mais a taxa. Varrer duzentos não é varrer um duzentas vezes."}]},

{id:'b_binder_set', when:()=>held()>=14&&unlocked('tab_binder'), un:['f_binder_fill'],
 say:[{c:'ina',en:"A binder page filled with a single Race is a set. The album knows the difference and so does everyone who sees it.",
       pt:"Uma página do fichário cheia de uma raça só é um set. O álbum sabe a diferença e quem vê também."},
      {c:'ina',en:"Doing that by hand is punishment. There is a button that fills the page with what you already own.",
       pt:"Fazer isso na mão é castigo. Tem um botão que enche a página com o que você já tem."}]},

{id:'b_spot_rank', when:()=>((G.spot&&+G.spot.shifts)||0)>=3,
 say:[{c:'tobi',en:"you notice the shift got longer? every rank you go up adds one more entry per turn at the spotter.",
       pt:"reparou que o turno ficou mais longo? cada rank que você sobe põe mais uma ficha por turno no spotter."},
      {c:'tobi',en:"and getting them right raises your post in there, and THAT's what actually pays. I worked two weeks before anybody told me, bro.",
       pt:"e acertar sobe o seu posto lá dentro, e É ISSO que paga de verdade. trabalhei duas semanas antes de alguém me falar, mano."}]},

{id:'b_gasspike', urg:1, gap:0, when:()=>stMark('gasspike',!!story().seen.b_gas&&(G.event==='gas'||(typeof gasMood==='function'&&gasMood()==='insane'))),
 say:[{c:'tobi',en:"yo, chain's jammed. anything that needs a signature is costing stupid money right now. don't mint into that.",
       pt:"ó, a rede tá entupida. tudo que precisa de assinatura tá custando um dinheiro burro agora. não minta nisso."},
      {c:'tobi',en:"skip a couple hours from the wallet panel, or go read the forum. it drops. it always drops, bro.",
       pt:"pula umas horas pelo painel da carteira, ou vai ler o fórum. desce. sempre desce, mano.",
       point:'#hud'}]},

{id:'b_dump', when:()=>stMark('dump',G.day>=6&&(G.event==='dump'||G.event==='fud'||G.event==='cold'||G.event==='rug')),
 say:[{c:'sera',en:"chart looks like a cliff, huh. close it. it passes in a day or two — the people who sell at the bottom are the ones who kept staring. -_-'",
       pt:"o gráfico virou penhasco, né. fecha ele. passa em um ou dois dias — quem vende no fundo é quem ficou encarando. -_-'"}]},

{id:'b_security', when:()=>stMark('unsafe',((+G.scamLoss||0)>0&&G.day>=4)||(G.day>=9&&!securityActive()&&(held()>=8||(+G.money||0)>=600))),
 say:[{c:'sera',en:"you've been sleeping with the door open for days, unc. antivirus. it's rent, not a flex. ¬¬",
       pt:"você tá dormindo de porta aberta faz dias, tio. antivírus. é aluguel, não é ostentação. ¬¬"}]},

/* ============ o meio do jogo ============ */
{id:'b_queue', when:()=>G.bestLevel>=4&&unlocked('shop_all'), un:['f_queue'],
 say:[{c:'tobi',en:"I bought the queue scanner thinking it'd tell me the next number, bro. it does not.",
       pt:"comprei o scanner da fila achando que ele ia dizer o próximo número, mano. não diz."},
      {c:'tobi',en:"it gives you the ODDS of something good in the next ten. an edge, never a sure thing. still the best money I ever spent in here.",
       pt:"ele te dá a CHANCE de vir coisa boa nos próximos dez. vantagem, nunca garantia. ainda foi o melhor dinheiro que gastei aqui."}]},

{id:'b_rep', when:()=>stMark('rep',G.day>=10&&typeof repScore==='function'&&(repScore()>=78||repScore()<48)),
 say:[{c:'oni',en:"The room has an opinion about you now. It is not in your wallet and it changes what people offer.",
       pt:"A sala tem uma opinião sobre você agora. Ela não tá na carteira e muda o que te oferecem."},
      {c:'oni',en:"Dumping walls of listings drags it down. Showing up and not disappearing lifts it. That is the whole mechanic.",
       pt:"Despejar parede de listagem derruba. Aparecer e não sumir levanta. É essa a mecânica inteira."}]},

{id:'b_comfort', when:()=>G.day>=8, un:['f_notes'],
 say:[{c:'tobi',en:"you live here now, bro. right-click the desktop — you can leave notes on it. doesn't change the game. just makes it yours.",
       pt:"você mora aqui agora, mano. botão direito na mesa — dá pra deixar nota nela. não muda o jogo. só deixa ele seu."}]},

{id:'b_referral', when:()=>G.bestLevel>=5, un:['f_referral'],
 say:[{c:'hakase',en:"Tuna. Your referral link is open.",
       pt:"Tuna. Seu link de indicação abriu."},
      {c:'hakase',en:"It takes your cut on every mint that is not yours from thirty per cent to forty. That is not a small number.",
       pt:"Ele leva o seu corte em todo mint que não é seu de trinta pra quarenta por cento. Não é número pequeno."},
      {c:'hakase',en:"It also puts your name where people look for names. The ones looking are not all buyers. Keep the antivirus paid.",
       pt:"E põe seu nome onde procuram nome. Nem todo mundo que procura é comprador. Mantém o antivírus pago."}]},

{id:'b_vault', when:()=>G.bestLevel>=6, un:['tab_vault','f_stake'],
 say:[{c:'hakase',en:"Swordfish. Now we can talk.",
       pt:"Swordfish. Agora dá pra conversar."},
      {c:'hakase',en:"The vault pays you per day for locking a Kaiju away. Locked means locked — you cannot sell it, and neither can he.",
       pt:"O cofre te paga por dia pra trancar um Kaiju. Trancado é trancado — você não vende, e ele também não."}]},

{id:'b_stake', when:()=>stMark('stake',!!G.stakeOn||G.tokens.some(t=>t.staked)),
 say:[{c:'hakase',en:"The vault has a counted number of shelves. More shelves cost money, and then a great deal more money.",
       pt:"O cofre tem prateleira contada. Mais prateleira custa dinheiro, e depois muito mais dinheiro."},
      {c:'hakase',en:"Ten days is the minimum. Locking away the one you were going to sell this week is the same as losing it.",
       pt:"Dez dias é o mínimo. Trancar o que você ia vender essa semana é a mesma coisa que perder."}]},

/* ============ o fim ============ */
{id:'b_late', when:()=>G.minted>=SUPPLY*0.5,
 say:[{c:'ina',en:"Half the collection is gone. The people arriving now pay double what you paid and they think they are early.",
       pt:"Metade da coleção já saiu. Quem chega agora paga o dobro do que você pagou e acha que chegou cedo."},
      {c:'ina',en:"You were actually early. Do not give it away cheap.",
       pt:"Você chegou cedo de verdade. Não entrega barato."}]},

{id:'b_mintout', when:()=>!!G.mintout,
 say:[{c:'ina',en:"That is it. Eight thousand eight hundred and eighty eight, none left over.",
       pt:"Acabou. Oito mil oitocentos e oitenta e oito, nenhum sobrando."},
      {c:'ina',en:"Nobody will ever mint one again. From here on, everything that changes hands comes from someone who already has one.",
       pt:"Ninguém vai mintar mais nenhum. Daqui pra frente tudo que muda de mão vem de quem já tem."},
      {c:'hakase',en:"Now the part I like begins.",
       pt:"Agora começa a parte que eu gosto."}]}
];

/* ---------- o relógio da história ----------
   Chamado de todo lugar onde o mundo muda. Barato de propósito: uma passada
   na lista, sem laço aninhado. */
/* ---------- RITMO ----------
   Sem freio o dia 1 disparava SEIS momentos e dezenove falas seguidas — o
   mesmo muro de informação que este modo existe pra desmontar.
   Três regras, e elas valem mais que a vontade de contar tudo:
     1. no máximo 2 momentos por dia (3 no primeiro, que é o tutorial de fato)
     2. pelo menos 3 horas de jogo entre um e outro
     3. nada fala enquanto a fala anterior não terminou
   Um beat `urg` (o imposto batendo na porta) fura a cota do dia, nunca o
   intervalo — mas o DESTRAVAMENTO nunca espera: o ícone aparece na hora, só a
   conversa é que entra na fila. */
const STORY_DAY_CAP=2, STORY_DAY1_CAP=0, STORY_GAP_H=3;
/* O DIA 1 e so tutorial: a cota comum e ZERO. O que o jogador ve no primeiro
   dia e exatamente o caminho mintar > gas > encerrar o dia > carteira, e nada
   mais — o forum, a loja e o imposto podem esperar acordar amanha.
   Os momentos marcados `core` sao o tutorial de verdade: mintou, pagou gas,
   encheu a carteira, foi listar. Eles nao podem esperar tres dias na fila
   atras de um aviso de evento — o jogador fica sozinho na tela achando que
   quebrou alguma coisa. Entao eles tem cota e intervalo PROPRIOS, mais
   generosos, e nao gastam a cota dos outros. O reverso tambem vale: um
   momento comum nao pode furar a fila do tutorial. */
const STORY_CORE_CAP=3, STORY_CORE_CAP1=6, STORY_CORE_GAP=1;
let storyBusy=false;
function storyTick(){
  if(!G||!G.walletMade)return;
  const S=story();
  const agora=(G.day||1)*24+(G.hour||0);
  if(S.day!==G.day){S.day=G.day;S.n=0;S.cn=0;}
  let abriu=null;
  /* A REDE DE SEGURANCA, aplicada de verdade. unlocked() ja responde "sim"
     por SEMPRE, mas quem DESENHA a mesa (buildDesktop) so roda quando algo
     abre — entao o icone existia na logica e nao aparecia na tela. Aqui ele
     e registrado no save de verdade, e o redesenho acontece pelo caminho
     normal, igual a qualquer outro destravamento. */
  for(const k in SEMPRE){
    if(S.un[k])continue;
    let livre=false;
    try{livre=!!SEMPRE[k]();}catch(e){livre=false;}
    if(livre&&unlock(k,true))abriu=k;
  }
  /* ---------- AVALIAR NAO E FALAR ----------
     Antes esta varredura parava (break) no primeiro momento maduro que nao
     podia falar. Parecia economia; era um bug serio: enquanto alguem estava
     falando, o motor NEM AVALIAVA os outros momentos — e varios deles usam
     stMark(), que existe justamente pra guardar uma coisa que acontece e
     passa (o dinheiro acabou, a carteira encheu, a rede entupiu). Se o
     momento passava com a fila ocupada, ele se perdia pra sempre.

     Foi assim que o jogador ficou sem dinheiro no dia 1 e ninguem falou nada:
     b_broke nunca chegou a ser perguntado.

     Agora `when()` roda pra TODO momento nao visto, sempre — e o unico
     limite e sobre QUEM FALA. */
  let escolhido=null;
  for(const b of BEATS){
    if(S.seen[b.id])continue;
    /* VALIDADE. Uma aula de "o que e a carteira" no dia 3 nao e aula, e
       ruido — o jogador ja abriu a carteira vinte vezes. Um momento com
       `until` que nao aconteceu ate aquele dia e dado como visto, em silencio,
       e o que ele abriria abre do mesmo jeito. O dono viu exatamente isso:
       a explicacao da carteira no dia 2 e "cinco, isso ja e carteira" no
       dia 3. */
    if(typeof b.until==='number'&&(G.day||1)>b.until){
      S.seen[b.id]=G.day||1;
      (b.un||[]).forEach(u=>{if(unlock(u,true))abriu=u;});
      continue;
    }
    let ok=false;
    try{ok=!!b.when();}catch(e){ok=false;}
    if(!ok)continue;
    if(escolhido)continue;      /* ja tem um falando nesta rodada */
    if(S.q.length)continue;     /* alguem no meio de uma fala: ninguem interrompe */
    const core=!!b.core;
    const cota=core?(G.day<=1?STORY_CORE_CAP1:STORY_CORE_CAP)
                   :(G.day<=1?STORY_DAY1_CAP:STORY_DAY_CAP);
    /* Cota estourada nao para a varredura: as duas filas (tutorial e resto)
       tem cotas separadas, entao um momento de tutorial esperando a vez nao
       tranca um aviso comum atras dele, nem o contrario. */
    if((core?(S.cn||0):(S.n||0))>=cota&&!b.urg)continue;
    /* `gap` por beat: quando o jogador esta TRAVADO (sem dinheiro, carteira
       cheia), esperar tres horas de jogo pra alguem explicar a saida e o
       mesmo que nao explicar. Esses avisam na hora. */
    const espera=(typeof b.gap==='number')?b.gap:(core?STORY_CORE_GAP:STORY_GAP_H);
    if((agora-(S.at||-99))<espera)continue;
    escolhido=b;
  }
  if(escolhido){
    const b=escolhido;
    S.seen[b.id]=G.day||1;
    if(b.core)S.cn=(S.cn||0)+1; else S.n=(S.n||0)+1;
    S.at=agora;
    /* O DESTRAVAMENTO ACONTECE SEMPRE, mesmo se a fala falhar: uma fala
       quebrada nao pode prender o jogo atras de um icone que nunca aparece. */
    /* o que vai ser BAIXADO nao aparece na mesa antes do download */
    (b.say||[]).forEach(l=>{if(l&&l.dl)dlMark(l.dl);});
    (b.un||[]).forEach(u=>{if(unlock(u,true))abriu=u;});
    if(b.say&&b.say.length)S.q.push({id:b.id,i:0});
  }
  if(abriu){
    if(typeof buildDesktop==='function')buildDesktop();
    if(typeof buildWidgets==='function')buildWidgets();
    if(typeof buildStart==='function')buildStart();
  }
  save();
  storyPump();
}
function beatOf(id){return BEATS.find(b=>b.id===id);}
/* Uma fala fora da lista de momentos, agora. */
function storySay(line){
  const S=story();
  S.q.push({one:line});
  save();
  if(typeof storyPump==='function')storyPump();
}

/* ---------- O PRESENTE DO STUX ----------
   O Stux e o cara que ja errou tudo primeiro pra voce nao errar. De vez em
   quando ele paga um mint do proprio bolso e manda junto — sem pedir nada,
   sem gancho, sem "mas". E a unica coisa no jogo inteiro que acontece a favor
   do jogador sem ele ter feito por merecer, e por isso ela e rara: se cair
   toda hora vira torneira e para de significar alguma coisa.

   Regras: so depois de o jogador CONHECER o Stux (b_gas), nunca com a carteira
   cheia (o presente nao pode empurrar ninguem pro teto), e com dias de folga
   entre um e outro. O presente nao cobra gas — quem assinou foi ele. */
const STUX_CHANCE=0.07, STUX_GAP_D=4;
const STUX_LINES=[
 {en:"this one is on me bro. have fun.",              pt:"esse aqui é por minha conta, mano. se diverte."},
 {en:"paid for that one myself. no reason. have fun.",pt:"paguei esse do meu bolso. sem motivo. se diverte."},
 {en:"somebody did this for me on my third day. so. have fun.",
  pt:"alguém fez isso por mim no meu terceiro dia. então. se diverte."},
 {en:"do not thank me, check the rank on it first.",  pt:"não me agradece, olha o rank dele primeiro."},
 {en:"one extra, on me. gas was cheap and I was feeling generous.",
  pt:"um extra, por minha conta. o gas tava barato e eu tava generoso."}
];
function stuxGift(){
  try{
    if(!G||!G.walletMade)return null;
    const S=story();
    if(!S.seen||!S.seen.b_gas)return null;
    if(G.mintout||G.minted>=SUPPLY)return null;
    if(typeof capLeft==='function'&&capLeft()<=0)return null;
    const hoje=G.day||1;
    if(hoje-(+S.gift||0)<STUX_GAP_D)return null;
    if(Math.random()>=STUX_CHANCE)return null;
    const tk=buildToken(idAtMintIndex(G.minted),hoje,true);
    G.minted++;ownToken(tk);
    if(typeof mintLogAdd==='function')mintLogAdd(tk);
    S.gift=hoje;
    S.gifts=(+S.gifts||0)+1;
    const l=STUX_LINES[Math.floor(Math.random()*STUX_LINES.length)];
    if(typeof UI==='object'&&UI&&UI.toast)
      UI.toast('gift',t('{0} sent you a Kaiju',charOf('tobi').who));
    storySay({c:'tobi',en:l.en,pt:l.pt});
    save();
    return tk;
  }catch(e){return null;}
}
/* usado pelo golpe, pelo balão e por quem mais quiser interromper */
function storyTalking(){
  return typeof document!=='undefined'&&document.body.classList.contains('storytalk');
}

/* ---------- a fila de falas ----------
   Uma tela por vez. Se o jogador estiver no meio de um modal (mint, imposto,
   golpe), a fala espera — nunca empilha em cima. */
function storyPump(){
  if(storyBusy)return;
  if(typeof document==='undefined')return;
  const S=story();
  if(!S.q.length)return;
  /* Não interrompe modal, assistente de carteira, fim de dia nem reveal.
     CUIDADO: #modalveil está SEMPRE no documento — ele só é modal quando tem
     a classe .on. Testar a existência dele travava a fila pra sempre. */
  if(document.querySelector('#modalveil.on'))return;
  if(document.querySelector('#wizveil,#dayveil,.revealwrap,.lvlup,#lvlveil'))return;
  if(document.body.classList.contains('wizing'))return;
  const item=S.q[0];
  /* Fala avulsa: nao vem de um BEAT, vem de uma coisa que aconteceu agora
     (o presente do Stux). Mesma caixa, mesma fila, mesmo respeito por modal. */
  if(item.one){
    storyBusy=true;
    storyShow(item.one,()=>{storyBusy=false;S.q.shift();save();setTimeout(storyPump,120);});
    return;
  }
  const b=beatOf(item.id);
  if(!b||!b.say||item.i>=b.say.length){S.q.shift();save();return storyPump();}
  storyBusy=true;
  const linha=b.say[item.i];
  if(linha&&linha.dl){
    appDownload(linha.dl,()=>{
      storyBusy=false;item.i++;
      if(item.i>=b.say.length)S.q.shift();
      save();setTimeout(storyPump,160);
    });
    return;
  }
  storyShow(linha,()=>{
    storyBusy=false;
    item.i++;
    if(item.i>=b.say.length){
      S.q.shift();
      /* a abertura acabou de terminar: agora sim a mesa pode apontar o
         COMECE AQUI, depois de a fala ter apontado primeiro */
      if(b.id==='b_open'&&!S.q.length&&typeof buildDesktop==='function')buildDesktop();
    }
    save();
    setTimeout(storyPump,120);
  });
}
/* ---------- O VIGIA DA FILA ----------
   storyPump() desiste quando tem modal na tela — e tem que desistir mesmo,
   ninguem quer uma fala nascendo por cima do reveal. O problema e que quem
   FECHA o modal nao chama storyPump de volta. Entao a fila ficava parada, e
   como storyTick trata fila cheia como "ocupado", o modo historia inteiro
   congelava: nenhum beat novo, nenhum icone novo, nada.

   Foi assim que o jogador ficou com sete Kaiju e nenhuma carteira na mesa.

   Este vigia custa quase nada (uma leitura de array a cada 1,5s) e fecha a
   classe inteira de travamento: seja qual for o modal, quando ele sair a fala
   aparece sozinha. Tambem destrava o `storyBusy`, que ficava preso se a caixa
   sumisse do DOM sem chamar o callback (janela fechada, refresh no meio). */
let storyLimbo=0;
setInterval(function vigiaHistoria(){
  try{
    if(typeof G==='undefined'||!G||!G.story)return;
    if(typeof document==='undefined')return;
    /* o download tambem e "alguem na tela": o vigia nao pode achar que a fala
       morreu so porque a caixa deu lugar a uma barra de progresso */
    const temCaixa=!!document.querySelector('.storybox,.dlwin');
    if(storyBusy&&!temCaixa){
      /* dois ciclos sem caixa e com busy ligado = alguem morreu no meio */
      if(++storyLimbo>=2){storyBusy=false;storyLimbo=0;}
    } else storyLimbo=0;
    const q=G.story.q;
    if(Array.isArray(q)&&q.length&&!temCaixa)storyPump();
  }catch(e){}
},1500);

/* ---------- APP NOVO E APP BAIXADO ----------
   A REGRA-RAIZ DO PROJETO, palavras do dono: "TUDO, exatamente TUDO tem que
   ser uma coisa imersiva e nada deve ser sintetico. E uma simulacao."
   Um icone que aparece do nada e sintetico. Um app que o dev anuncia, que
   baixa com barra de progresso e bytes, e que so entao aparece na mesa, e
   uma coisa que aconteceu no computador do jogador. Entao: nenhum app novo
   nasce na mesa. Ele e baixado.

   Como funciona: uma linha `{dl:'hubsocial'}` dentro do `say` de um beat.
   O motor mostra o dialogo de download do Windows, ~3s, e so no fim o icone
   entra na mesa (iconLive esconde o id enquanto ele esta em S.dlq). */
const DL_NOME={hubsocial:'kakiplus.exe', shop:'kaijushop.exe', free:'kakizone.exe',
  spot:'spotter.exe', media:'kmp.exe', inbox:'kinbox.exe', hubwallet:'kwallet.exe',
  hubmarket:'kmarket.exe', story_log:'klog.exe', bin:'recycle.dll', site:'kaijukaki.url'};
const DL_KB={hubsocial:3412, shop:1180, free:640, spot:2296, media:4870, inbox:512,
  hubwallet:1024, hubmarket:1536, story_log:388, bin:96, site:12};
function dlPending(id){const S=story();return Array.isArray(S.dlq)&&S.dlq.indexOf(id)>=0;}
function dlMark(id){const S=story();if(!Array.isArray(S.dlq))S.dlq=[];if(S.dlq.indexOf(id)<0)S.dlq.push(id);}
function dlDone(id){const S=story();if(Array.isArray(S.dlq))S.dlq=S.dlq.filter(x=>x!==id);}
function appDownload(id,done){
  const scr=document.querySelector('#screen');
  if(!scr){dlDone(id);done();return;}
  const ic=(typeof DESK_ICONS!=='undefined'?DESK_ICONS:[]).find(x=>x.id===id)||{lbl:id,ico:'pc'};
  const nome=DL_NOME[id]||(id+'.exe'), kb=DL_KB[id]||900;
  const K=(typeof uiScale==='function')?uiScale():1;
  const box=el('div','win dlwin opening');
  box.innerHTML=`
    <div class="titlebar">${pixSVG('globe',14,'tico')}<span class="ttl">${t('Downloading {0}',nome)}</span></div>
    <div class="wbody dl-body">
      <div class="dl-row">${pixSVG(ic.ico||'pc',40,'dl-ico')}
        <div class="dl-txt"><b>${t(ic.lbl)}</b><div class="dl-from">${t('from')} kakizone.net/apps/${nome}</div></div></div>
      <div class="dl-anim"><i></i><i></i><i></i></div>
      <div class="prog dl-prog"><i style="width:0%"></i></div>
      <div class="dl-meta"><span data-dlb>0 KB</span> ${t('of')} ${kb.toLocaleString()} KB <span data-dlt></span></div>
      <div class="dl-foot">${t('Save to')} C:\\KAIJU\\APPS\\</div>
    </div>`;
  scr.appendChild(box);
  requestAnimationFrame(()=>box.classList.remove('opening'));
  document.body.classList.add('storytalk');
  SFX.notify&&SFX.notify();
  const bar=box.querySelector('.dl-prog i'), b=box.querySelector('[data-dlb]'), tt=box.querySelector('[data-dlt]');
  const dur=2400+Math.min(1800,kb/3);
  const t0=performance.now();
  let ultimoTick=0;
  const tick=now=>{
    let f=Math.min(1,(now-t0)/dur);
    /* download de 1999: anda em degraus, engasga no meio, dispara no fim */
    const g=f<0.55?f*0.9:(f<0.7?0.5+(f-0.55)*0.6:0.59+(f-0.7)/0.3*0.41);
    bar.style.width=(g*100).toFixed(1)+'%';
    b.textContent=Math.round(kb*g).toLocaleString()+' KB';
    const resta=Math.max(0,Math.ceil((1-g)*dur/1000));
    tt.textContent=g<1?t('· {0} sec left',resta):t('· done');
    if(now-ultimoTick>140){ultimoTick=now;if(SFX.tick&&g<1)SFX.tick();}
    if(f<1)requestAnimationFrame(tick);
    else{
      box.querySelector('.dl-anim').classList.add('done');
      setTimeout(()=>{
        dlDone(id);
        SFX.cash&&SFX.cash();
        box.classList.add('closing');
        setTimeout(()=>{box.remove();document.body.classList.remove('storytalk');
          if(typeof buildDesktop==='function')buildDesktop();
          if(typeof buildStart==='function')buildStart();
          done();},200);
      },520);
    }
  };
  requestAnimationFrame(tick);
}

/* pula o resto da conversa atual */
function storySkip(){
  const S=story();
  if(S.q.length)S.q.shift();
  save();
}

/* ---------- a caixa de fala ----------
   Vive no #screen, não é modal e não escurece a tela inteira: o jogador tem
   que conseguir OLHAR pro ícone que está sendo apontado enquanto lê. */
function storyShow(line,done){
  const scr=document.querySelector('#screen');
  if(!scr){done();return;}
  const c=charOf(line.c);
  const K=(typeof uiScale==='function')?uiScale():1;
  const box=el('div','storybox opening');
  box.innerHTML=`
    <div class="sb-por">${storyPortrait(line.c,Math.round(72*K))}</div>
    <div class="sb-main">
      <div class="sb-who"><b>${c.who}</b></div>
      <div class="sb-txt" data-sbt="1"></div>
      <div class="sb-act">
        <button class="btn sb-next" data-sbn="1">${t('OK')}</button>
        <button class="btn tight sb-skip" data-sbs="1">${t('skip')}</button>
      </div>
    </div>`;
  scr.appendChild(box);
  /* CANAIS DEMAIS AO MESMO TEMPO era o problema original: numa tela só o
     jogador levava a fala do personagem, o balão de pensamento, três toasts e
     um pop-up de golpe. Enquanto alguém está falando com ele de verdade, o
     resto espera — é uma pessoa, não um mural. */
  document.body.classList.add('storytalk');
  requestAnimationFrame(()=>box.classList.remove('opening'));

  /* o alvo pisca enquanto a fala está na tela */
  let alvo=null;
  if(line.point){
    try{alvo=document.querySelector(line.point);}catch(e){}
    if(alvo)alvo.classList.add('story-point');
  }

  /* a máquina de escrever: só o suficiente pra dar ritmo de fala.
     Clicar corta e mostra o texto inteiro — ninguém deve esperar por letra. */
  const txt=$('[data-sbt]',box);
  const full=(LANG==='pt'?line.pt:line.en)||line.en||'';
  let i=0, tid=null, pronto=false;
  const acaba=()=>{pronto=true;if(tid)clearInterval(tid);txt.textContent=full;};
  txt.textContent='';
  if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)acaba();
  else tid=setInterval(()=>{
    i+=2;txt.textContent=full.slice(0,i);
    if(i>=full.length)acaba();
  },16);

  /* Um modal pode abrir DEPOIS de a fala já estar na tela (o Mr. Kaiju
     batendo, um golpe). O véu fica em z-index 6000 e engolia a caixa. Enquanto
     houver modal a caixa se esconde e volta sozinha quando ele fecha. */
  const veiaTick=setInterval(()=>{
    if(!box.isConnected){clearInterval(veiaTick);return;}
    box.classList.toggle('behind',!!document.querySelector('#modalveil.on'));
  },220);
  const fecha=()=>{
    clearInterval(veiaTick);
    document.body.classList.remove('storytalk');
    if(tid)clearInterval(tid);
    if(alvo)alvo.classList.remove('story-point');
    box.classList.add('closing');
    setTimeout(()=>{box.remove();done();},170);
  };
  $('[data-sbn]',box).onclick=()=>{
    if(!pronto){acaba();return;}
    SFX.click();fecha();
  };
  $('[data-sbs]',box).onclick=()=>{SFX.close();storySkip();fecha();};
  box.onclick=e=>{if(e.target===box||e.target===txt){if(!pronto)acaba();}};
  SFX.notify&&SFX.notify();
}

/* ---------- o retrato ----------
   Quando o Kiv mandar as imagens, `art` de cada personagem recebe a URL (ou o
   base64) e ela aparece aqui. Até lá cai no avatar pixelado grande, que é o
   MESMO que a pessoa usa no Kaki+ — então trocar depois não muda quem é quem,
   só melhora o desenho. */
function storyPortrait(id,size){
  const c=charOf(id);
  if(c.art)return `<img class="sb-img" src="${c.art}" alt="${c.who}" width="${size}" height="${size}">`;
  const ico=c.ico||(typeof whoIco==='function'?whoIco(c.who):'kaiju');
  return `<div class="sb-fallback">${pixSVG(ico,size)}</div>`;
}

/* ---------- saves antigos ----------
   Quem já estava jogando não pode acordar num desktop com quatro ícones e a
   metade do jogo sumida. Se o save mostra alguém que já passou daquele ponto,
   o beat é marcado como visto e o que ele abre nasce aberto — sem fala. */
function storyMigrate(){
  const S=story();
  if(S.v)return;
  S.v=1;
  const veterano=(G.day||1)>1||(G.log&&(G.log.mint||0)>0)||held()>0;
  if(!veterano){save();return;}
  BEATS.forEach(b=>{
    let ok=false;
    try{ok=!!b.when();}catch(e){ok=false;}
    if(ok){S.seen[b.id]=G.day||1;(b.un||[]).forEach(u=>unlock(u,true));}
  });
  /* o que o save já provava que existia continua existindo */
  if((G.log&&G.log.sold)||G.taxDue>0)['tax','hubsocial','shop','inbox'].forEach(u=>unlock(u,true));
  if(G.wgt){if(G.wgt.chart)unlock('wgt_chart',true);if(G.wgt.gas)unlock('wgt_gas',true);
            if(G.wgt.clock)unlock('wgt_clock',true);}
  S.q=[];
  save();
}
