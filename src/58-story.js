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
  /* O KIV. O dev — o dono do jogo, em pessoa. Fala como brasileiro que abriu o
     computador pra te mostrar uma coisa: caloroso, direto, "Bom dia!" no
     comeco do dia. Ele apresenta o que a equipe fez; nunca da bronca. */
  kiv:      {who:'kiv',              ico:'crt',   art:null,
             en:'the dev · builds this with you watching',
             pt:'o dev · constrói isso com você olhando'},
  /* A INA. Fofa, boa amiga, muito engracada, e adora recompensar os outros —
     e ela quem traz o que e de graca. Usa kaomoji DE VEZ EM QUANDO, nunca em
     toda frase: (｡•̀ᴗ-)✧ , (っ˘ω˘ς) , ٩(◕‿◕)۶ , (´｡• ᵕ •｡`) . Nunca poe ela
     dando aula ou repreendendo: se ela abre a boca e pra dar alguma coisa. */
  ina:      {who:'ina',              ico:'gift',  art:null,
             en:'gives things away · keeps track of who was here first',
             pt:'dá as coisas · sabe quem chegou primeiro'},
  /* O ANNOYING GUY. O cara que existe em TODA colecao: vive de olho no floor,
     esta sempre certo sobre o mercado, e nao cala a boca sobre isso. A
     informacao dele e boa — e por isso que o jogador aguenta. O jeito e que
     cansa: ele repete, ele lembra que ja tinha falado, ele explica o obvio
     com paciencia de quem acha que voce nao entendeu.
     Marcas da voz: "as I've been saying", "again:", "like I told you",
     "everyone always learns this the hard way". Nunca e agressivo nem
     ameacador — e chato, que e outra coisa. E NUNCA esta errado sobre numero:
     tirar a razao dele tiraria o motivo de ele estar no jogo. */
  oni:      {who:'annoying guy',     ico:'chart', art:null,
             en:'always right about the floor · will not stop telling you',
             pt:'sempre certo sobre o floor · e não para de te contar'},
  /* O TUBI. Engracado, divertido, e faz piada com o proprio ingles o tempo
     todo — troca o final das palavras de proposito: "chaine" no lugar de
     "chain", "yeag" no lugar de "yes", "moneys", "walleto". Ele SABE que fala
     errado e acha graca nisso. E o que compra calado quando tem dinheiro na
     mesa, entao o que ele diz de mercado esta certo mesmo com a palavra
     torta. Em portugues a piada e a mesma: ele erra o INGLES, nao o portugues. */
  hakase:   {who:'tubi',             ico:'gem',   art:null,
             en:'buys in silence · mangles every word on purpose',
             pt:'compra calado · entorta toda palavra de propósito'},
  /* O LEANER (Unc). O tio da sala. Engracado, muito retraido, fala pouco e
     quando fala e piada seca — e de vez em quando escapa um emoticon velho
     tipo -_-' ou ¬¬. Aparece quando o jogo machuca. Duas frases no maximo:
     o kiv reclamou que ele falava demais, e ele e justamente o cara que nao
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
function charOf(id){return CHARS[id]||CHARS.kiv;}
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
  /* a LIXEIRA saiu da lista: ela e movel de fabrica do Windows, igual ao
     Kaiju Log. Ninguem apresenta uma lixeira. */
  hubsocial:1, shop:1, free:1, spot:1, media:1, tax:1, inbox:1, readme:1,
  /* a loja abre em tres prateleiras: so o antivirus (dia 6, depois do hack),
     depois espaco e contrato (dia 7), depois tudo. Ver 33-app-vault.js. */
  shop_av:1, shop_more:1, shop_4:1, shop_all:1,
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
  f_track_unc:1,   /* a primeira musica extra do player, feita pelo Leaner */
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
/* ---------- CALENDARIO DE DESBLOQUEIO ----------
   O dono jogou e a reclamacao foi direta: MASSIVO E CHATO. Chegavam tres, as
   vezes quatro coisas no mesmo dia, e nada tinha tempo de virar habito antes
   da proxima novidade cobrir a anterior.

   REGRA: UM desbloqueio por dia, nunca dois. Cada dia da semana tem UMA coisa
   nova e so. Se voce for acrescentar um beat novo, escolha um dia VAZIO — nao
   empilhe em cima de um dia que ja tem dono.

     dia  2 -> b_inbox      (o correio)
     dia  3 -> b_social     (o Kaki+)
     dia  4 -> b_tax        (o imposto)
     dia  5 -> b_boost      (update do Kaki+: reagir e postar)
     dia  6 -> b_hacked     (o hack e a loja com o antivirus)
     dia  7 -> b_free       (a Kakizone)  /  b_dump (so se o dia der queda)
     dia  8 -> b_spotter    (o Kaiju Spotter)
     dia  9 -> b_media      (o media player)
     dia 10 -> b_quests     (update da Kakizone: tarefas e marcos)
              b_security so cobra o antivirus a partir daqui
     dia 11 -> b_shop_more  (prateleira 2 da loja)  /  b_sweep (varrer o floor)
     dia 12 -> b_comfort    (notas na area de trabalho)
     dia 13 -> b_shop_all   (a loja inteira)
     dia 14 -> b_chart      (o grafico e as estatisticas)

   Os beats REATIVOS (b_broke, b_cap, b_audit, b_gasburn, b_seize...) nao
   Todo momento DO CALENDARIO leva `urg:1`. Nao e porque ele e urgente: e
   porque a cota diaria de falas comuns e 2, e num dia em que o jogador
   quebrou e tomou um pico de gas os dois avisos reativos comiam a cota e
   EMPURRAVAM a entrega do dia pra frente — o media player caiu no dia 6 no
   lugar do dia 4. O calendario e contrato: ele fura a cota, mas continua
   respeitando o intervalo de horas entre uma fala e outra.

   Os beats REATIVOS (b_broke, b_cap, b_audit, b_gasburn, b_seize...) nao
   entram nesse calendario: eles respondem a uma coisa que o jogador fez e
   podem cair em qualquer dia. O calendario e so das ENTREGAS. */
const BEATS=[/* ============ DIA 1: as três coisas que importam ============ */
{id:'b_open', core:1, when:()=>G.walletMade,
 un:['site','hubmarket','shutdown','wgt_clock'],
 say:[{c:'kiv',en:"Bom dia! So you found it too.",
       pt:"Bom dia! Então você também achou."},
      {c:'kiv',en:"8888 hand-drawn Kaiju and almost nobody has noticed yet. Go mint one — you'll get it faster than I could explain.",
       pt:"8888 Kaiju desenhados à mão e quase ninguém reparou ainda. Vai mintar um — você vai entender mais rápido do que eu explicaria.",
       point:'[data-icon="site"]'}]},

{id:'b_first_mint', core:1, when:()=>stEver('mint')>=1||held()>=1, un:['f_pagesize','hubwallet'],
 say:[{c:'kiv',en:"There it is. That one is yours and nobody else will ever have it.",
       pt:"Pronto. Esse é seu e mais ninguém vai ter."},
      {c:'kiv',en:"Heads up: you paid the mint price AND gas. Gas is the network fee for signing, and it moves — check it before every mint or it eats you alive.",
       pt:"Fica ligado: você pagou o preço do mint E o gas. Gas é a taxa da rede pela assinatura, e ele muda — confere antes de cada mint ou ele te come vivo."},
      {c:'kiv',en:"He is in your wallet now. That icon is where everything you own lives — open it whenever you want to look at them.",
       pt:"Ele tá na sua carteira agora. Aquele ícone é onde mora tudo que é seu — abre quando quiser olhar eles.",
       point:'[data-icon="hubwallet"]'},
      {c:'kiv',en:"There is a readme.txt on that desktop too. It was there before you got here. It is short and it is honest.",
       pt:"E tem um readme.txt nessa área de trabalho. Já tava aí antes de você chegar. É curto e é honesto.",
       point:'[data-icon="readme"]'}]},

/* O pular-uma-hora vem JUNTO com a aula de gas, no dia 1. O dono acordou no
   dia 2 com gas a 400% e literalmente nada pra fazer — ficou parado olhando a
   tela. Gas e onda: a resposta pra onda alta e esperar, e esperar tem que ser
   um botao, nao um relogio de verdade. */
{id:'b_list', core:1, until:1, when:()=>held()>=2,
 say:[{c:'kiv',en:"Two. There is always one you care less about — that one is money. List it from the wallet, set a price, and it sells while you keep minting.",
       pt:"Dois. Sempre tem um que você liga menos — esse aí é dinheiro. Lista ele pela carteira, põe um preço, e ele vende enquanto você continua mintando.",
       point:'[data-icon="hubwallet"]'}]},

{id:'b_gas', core:1, when:()=>held()>=3||stEver('mint')>=3, un:['wgt_gas','f_hudskip'],
 say:[{c:'kiv',en:"One more thing about gas, because it is the thing that gets people: it is not a price, it is a wave. Cheap in the morning, brutal at night.",
       pt:"Mais uma coisa sobre o gas, porque é isso que pega as pessoas: ele não é preço, é onda. Barato de manhã, brutal de noite."},
      {c:'kiv',en:"We made a little meter for it so you never have to guess. Sending it to your desktop now.",
       pt:"A gente fez um medidor pra ele pra você nunca ter que adivinhar. Mandando pra sua área de trabalho agora."},
      {dl:'wgt_gas'},
      {c:'kiv',en:"Keep it where you can see it and mint when it is low. And when it is high, do not sit there staring at it.",
       pt:"Deixa ele onde você consiga ver e minta quando estiver baixo. E quando estiver alto, não fica parado encarando."},
      {c:'kiv',en:"We pushed a small update to the Kaiju Wallet for exactly that. Installing it for you.",
       pt:"A gente soltou um update pequeno do Kaiju Wallet exatamente pra isso. Instalando pra você."},
      {dl:'f_hudskip'},
      {c:'kiv',en:"There is a SKIP 1 HOUR button in the wallet panel now. Skip ahead and the gas comes back down on its own.",
       pt:"Agora tem um botão de PULAR 1 HORA no painel da carteira. Pula, que o gas desce de volta sozinho.",
       point:'#hud'}]},

/* O AVISO DE FIM DE DIA chega quando FALTA UMA HORA — nao no meio da tarde.
   No meio da tarde ele e informacao solta; com uma hora no relogio ele e a
   coisa que o jogador tem que fazer a seguir. */
/* `urg` E OBRIGATORIO AQUI: no dia 1 a cota do tutorial (6) ja esta cheia
   quando falta uma hora. Sem furar a cota este aviso simplesmente nunca
   apareceria — e ele e o unico que diz como o dia termina. */
{id:'b_endday', core:1, until:1, urg:1, gap:0,
 when:()=>{
   try{
     if(typeof dayEndHour!=='function')return (G.hour||0)>=12;
     const falta=(dayEndHour()-(G.hour||0))*60-(G.min||0);
     return falta<=60;
   }catch(e){return (G.hour||0)>=12;}
 },
 say:[{c:'kiv',en:"You have about an hour of today left. Your day is not infinite — every mint eats hours.",
       pt:"Você tem mais ou menos uma hora de hoje. Seu dia não é infinito — cada mint come horas."},
      {c:'kiv',en:"You can end the day by turning off your PC. Nothing is lost.",
       pt:"Você pode encerrar o dia desligando o PC. Nada se perde.",
       point:'[data-icon="shutdown"]'}]},

/* A carteira NAO abre no dia 1 antes do primeiro mint. O jogador nao tem o que
   ver dentro dela sem Kaiju na mao, e um icone que so mostra vazio ensina
   errado. Ela chega em b_first_mint, junto com o motivo de abrir. */
{id:'b_bulk', urg:1, core:1, when:()=>G.day>=8, un:['f_bulk'],
 say:[{c:'tobi',en:"bro, you can sign up to ten in one go. gas is still per Kaiju but it saves you hours. I minted one at a time for four days before anyone told me.",
       pt:"mano, dá pra assinar até dez de uma vez. o gas continua por Kaiju mas economiza horas. eu mintei de um em um por quatro dias antes de alguém me falar."}]},

/* O momento em que a carteira finalmente vale a pena abrir: cinco na mao. Aqui
   ela CHEGA (o icone nasce agora) e o motivo de abrir vem junto — traits, rank
   e a primeira listagem. Antes isso era dois beats separados, e o segundo
   chegava tarde demais. */
/* b_wallet SAIU: "tres ja, abre a carteira e compara" incomodava o dono e nao
   ensinava nada que b_first_mint ja nao tivesse dito. A carteira continua
   chegando em b_first_mint e o SEMPRE garante o icone assim que ha um Kaiju. */
{id:'b_market', core:1, when:()=>held()>=6&&G.day>=2,
 un:['tab_mkt_offers','m_sweep'],
 say:[{c:'oni',en:"You mint them, I watch the floor. I've said that before, and it is still the arrangement.",
       pt:"Você minta, eu vigio o floor. Eu já falei isso antes, e continua sendo o combinado."},
      {c:'oni',en:"Nobody asked, but there are two ways out of a Kaiju: list it and wait, or take an offer someone puts on your desk. Listing pays more and takes longer.",
       pt:"Ninguém perguntou, mas tem duas saídas pra um Kaiju: listar e esperar, ou aceitar uma oferta que põem na sua mesa. Listar paga mais e demora mais."},
      {c:'oni',en:"And again: do not dump on the floor. It shows in the numbers, and everyone here reads the same numbers I do.",
       pt:"E de novo: não despeja no floor. Isso aparece nos números, e todo mundo aqui lê os mesmos números que eu.",
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
 say:[{c:'hakase',en:"Your walleto is full! Not one more mint goes inside.",
       pt:"Seu walleto encheu! Não entra mais nem um mint."},
      {c:'hakase',en:"Space is the roof on all your moneys. Sell one, or file one away. And when space is for sale, you buy it firsty — before anything.",
       pt:"Espaço é o teto de todos os seus moneys. Vende um, ou arquiva um. E quando tiver espaço à venda, compra ele firsty — antes de tudo."}]},

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
{id:'b_inbox', urg:1, when:()=>G.day>=2, un:['inbox'],
 say:[{c:'kiv',en:"Bom dia! Quick one: we built a small inbox app so I can reach holders directly — patch notes, news, that kind of thing. Downloading it to you now.",
       pt:"Bom dia! Rapidinho: a gente fez um app de correio pra eu falar direto com os holders — notas de atualização, novidades, essas coisas. Baixando pra você agora."},
      {dl:'inbox'},
      {c:'kiv',en:"There's already something in it. Each note has a little thank-you inside.",
       pt:"Já tem coisa dentro. Cada nota tem um agradecimento pequeno dentro.",
       point:'[data-icon="inbox"]'}]},

/* ============ DIA 3: a comunidade, o trabalho, o imposto ============ */
/* A LOJA. Ninguem apresenta uma loja; a vida apresenta. Na noite do dia 5 o
   jogador e hackeado (roteirizado, 24-state.js hackTutorial), acorda com a
   tela de invasao, e ai alguem que JA PASSOU POR ISSO manda mensagem: tem
   algo que da pra fazer. So o antivirus na prateleira. O resto chega depois,
   uma coisa de cada vez, como prateleira que enche. */
{id:'b_hacked', urg:1, gap:0, when:()=>(+G.hackTut||0)>0&&G.day>=(+G.hackTut||7),
 un:['shop','shop_av'],
 say:[{c:'tobi',en:"damn, man. you got hacked. I lost a whole wallet in march, I know how that feels. but there's something you can do: kiv rushed out a shop app and the only thing on the shelf right now is the antivirus.",
       pt:"caramba, cara. você foi hackeado. perdi uma carteira inteira em março, eu sei como é. mas tem uma coisa que dá pra fazer: o kiv soltou às pressas um app de loja e a única coisa na prateleira agora é o antivírus."},
      {dl:'shop'},
      {c:'tobi',en:"buy it tonight, bro. it ain't a one-time thing, it runs out and you pay again. but while it's paid, they don't get in. you feel me?",
       pt:"compra hoje, mano. não é coisa de uma vez só, vence e você paga de novo. mas enquanto tá pago, eles não entram. tá ligado?"}]},

{id:'b_shop_more', urg:1, when:()=>G.day>=11&&unlocked('shop'), un:['shop_more','tab_profile'],
 say:[{c:'kiv',en:"Bom dia! We updated the site overnight — the shop has new things on the shelf: wallet space, and contract speed.",
       pt:"Bom dia! A gente atualizou o site de madrugada — a loja tem coisas novas na prateleira: espaço na carteira, e velocidade de contrato.",
       point:'[data-icon="shop"]'},
      {c:'kiv',en:"Space first. Always space first. It is the ceiling on everything you earn.",
       pt:"Espaço primeiro. Sempre espaço primeiro. É o teto de tudo que você ganha."}]},

{id:'b_shop_4', urg:1, when:()=>G.day>=16&&unlocked('shop_more'), un:['shop_4'],
 say:[{c:'kiv',en:"Site update: four new things went up on the shop overnight. Batch minting, listing speed, a gas optimiser, and one small perk.",
       pt:"Update do site: quatro coisas novas subiram na loja de madrugada. Mint em lote, velocidade de listagem, um otimizador de gas, e um perk pequeno.",
       point:'[data-icon="shop"]'},
      {c:'kiv',en:"None of it is urgent. Buy it when the money is real, not before.",
       pt:"Nada disso é urgente. Compra quando o dinheiro for de verdade, não antes."}]},

{id:'b_shop_all', urg:1, when:()=>G.day>=20&&unlocked('shop_4'), un:['shop_all'],
 say:[{c:'kiv',en:"The shop is fully stocked now. Batch minting, listing speed, gas optimizer, the queue scanner — all of it.",
       pt:"A loja está com a prateleira cheia agora. Mint em lote, velocidade de listagem, otimizador de gas, o scanner da fila — tudo.",
       point:'[data-icon="shop"]'},
      {c:'kiv',en:"None of it is urgent. Space and the antivirus are. The rest is for when the money is real.",
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
/* O DEBOCHE VEM DEPOIS DE PAGAR — quando o jogador ja sentiu o preco. E o
   Stux nao entrega so conversa: ele manda 30% do que foi cobrado de volta,
   do proprio bolso. E a segunda unica coisa no jogo que acontece a favor do
   jogador sem ele ter feito por merecer (a outra e o presente do Stux), e
   vale uma vez so — dinheiro que chega toda vez vira renda, nao gesto. */
{id:'b_tax_paid', when:()=>stT('tax')>0,
 say:[{c:'kiv',en:"They told me Mr. Kaiju came to collect from you. Is that true? Unbelievable.",
       pt:"Me contaram que o Mr. Kaiju veio te cobrar. É verdade? Inacreditável."},
      {c:'kiv',en:"I don't know what kind of Kaiju that is or why he does it. But honestly — word around here is that it's better to pay. I'll talk to Stux about it.",
       pt:"Não sei que tipo de Kaiju é aquele nem por que ele faz aquilo. Mas de verdade — fiquei sabendo por aí que é melhor pagar. Vou falar com o Stux sobre isso."},
      {c:'tobi',en:"yeah, kiv messaged me. I went through all 8888 twice, bro. he ain't in there. don't ask me where the money goes.",
       pt:"é, o kiv me mandou mensagem. eu passei pelos 8888 duas vezes, mano. ele não tá lá. não me pergunta pra onde vai o dinheiro."},
      {gift:'tax30'},
      {c:'tobi',en:"here, take it. it's 30% of what he taken from you, out of my own pocket, and don't argue with me about it.",
       pt:"toma, pega. é 30% do que ele tirou de você, do meu bolso, e não discute comigo sobre isso."},
      {c:'tobi',en:"and mark this down, bro: he come back every three days. every three. count them, because he counts.",
       pt:"e anota isso, mano: ele volta a cada três dias. a cada três. conta os dias, porque ele conta."}]},

{id:'b_social', urg:1, when:()=>G.day>=4, un:['hubsocial','m_hype','f_knsize'],
 say:[{c:'kiv',en:"Since you started minting a lot of Kaijus, other people started too. So while you were all minting, we built something: Kaki+, a social app just for the collection.",
       pt:"Desde que você começou a mintar um monte de Kaiju, outras pessoas começaram também. Então enquanto vocês mintavam, a gente fez uma coisa: o Kaki+, um app social só da coleção."},
      {dl:'hubsocial'},
      {c:'kiv',en:"It's small and it's ours. Post there and you build HYPE — hype is what makes strangers mint, and their mints pay you. It leaks every hour, so keep it alive.",
       pt:"É pequeno e é nosso. Poste lá e você constrói HYPE — hype é o que faz estranho mintar, e os mints deles te pagam. Ele vaza toda hora, então mantém vivo.",
       point:'[data-icon="hubsocial"]'}]},

/* Reagir e postar chegam como um UPDATE do Kaki+, anunciado por alguem, no
   dia 4 — nao como aula. Um forum que ganha recurso novo e um lugar vivo. */
{id:'b_boost', urg:1, when:()=>G.day>=5&&unlocked('hubsocial'), un:['f_boost','f_react'],
 say:[{c:'kiv',en:"Bom dia! Kaki+ just shipped an update. You can react to posts now, and you can post yourself.",
       pt:"Bom dia! O Kaki+ acabou de soltar um update. Agora dá pra reagir aos posts, e dá pra você postar.",
       point:'[data-icon="hubsocial"]'},
      {c:'kiv',en:"Reacting is free and it gives you EXP, and EXP counts toward your rank the same as a Kaiju does.",
       pt:"Reagir é de graça e dá EXP, e EXP conta pro seu rank igual a um Kaiju na carteira."},
      {c:'kiv',en:"Posting costs money and buys hype. The second post of the day returns less than the first, and the fifth is almost nothing. That is not a bug, that is attention.",
       pt:"Postar custa dinheiro e compra hype. O segundo post do dia rende menos que o primeiro, e o quinto quase nada. Não é bug, é atenção."}]},

{id:'b_spotter', urg:1, when:()=>G.day>=6, un:['spot'],
 say:[{c:'kiv',en:"New app from us: the Kaiju Spotter. We're cataloguing the collection before it mints out and we pay per correct entry. Not much — but it's work you can do on any day.",
       pt:"App novo nosso: o Kaiju Spotter. A gente tá catalogando a coleção antes do mintout e paga por ficha certa. Pouco — mas é trabalho que dá pra fazer em qualquer dia.",
       point:'[data-icon="spot"]'},
      {dl:'spot'}]},

{id:'b_free', urg:1, when:()=>G.day>=9&&unlocked('hubsocial'), un:['free'],
 say:[{c:'ina',en:"The Kakizone is open! For now it hands you one free mint a day, for being one of the oldest holders we have — thank you for that, really.",
       pt:"A Kakizone está aberta! Por enquanto ela te dá um free mint por dia, por você ser um dos holders mais antigos que a gente tem — obrigada por isso, de verdade."},
      {dl:'free'},
      {c:'ina',en:"And we're working to make it even better than this. Enjoy it — the mint still eats gas, nothing here is free free, but the Kaiju is on me (｡•̀ᴗ-)✧",
       pt:"E a gente tá trabalhando pra deixar ela ainda melhor que isso. Aproveita — o mint ainda come gas, nada aqui é de graça de graça, mas o Kaiju é por minha conta (｡•̀ᴗ-)✧"}]},

{id:'b_quests', urg:1, when:()=>G.day>=12&&unlocked('free'), un:['f_quests','f_milestones'],
 say:[{c:'ina',en:"My Kakizone got an update! It has daily tasks and milestones in it now, go look.",
       pt:"A minha Kakizone ganhou um update! Agora tem tarefas diárias e marcos lá dentro, vai ver.",
       point:'[data-icon="free"]'},
      {c:'ina',en:"The tasks pay little on purpose — I'm the one paying, hehe — they're a compass, not a faucet: they tell you where to look. And the milestones count the MOST you ever held at once, so selling never walks that bar backwards.",
       pt:"As tarefas pagam pouquinho de propósito — quem paga sou eu, hehe — elas são bússola, não torneira: dizem onde olhar. E os marcos contam o MAIOR número que você já segurou de uma vez, então vender nunca anda com a barra pra trás."}]},

{id:'b_contract', when:()=>unlocked('shop_more')&&stEver('mint')>=12,
 say:[{c:'kiv',en:"You are spending your day inside the mint page. Minutes are the resource you cannot buy back.",
       pt:"Você tá passando o dia dentro da página de mint. Minuto é o recurso que não volta."},
      {c:'kiv',en:"Contract Speed in the shop cuts that in half over ten steps. It pays for itself in mints, not in money.",
       pt:"A Velocidade de Contrato na loja corta isso pela metade em dez degraus. Se paga em mints, não em dinheiro."}]},

/* O FICHARIO CHEGA COMO UPDATE DA CARTEIRA, nao como sermao.
   "Seis. Hora de arquivar" mandava o jogador fazer uma coisa que ele nao tinha
   pedido. Agora e uma ferramenta que o dev entrega, instalando, e o jogador
   usa SE quiser. */
{id:'b_binder', urg:1, when:()=>G.day>=2, un:['tab_binder'],
 say:[{c:'kiv',en:"You have six of them now, so here is something we built for the Kaiju Wallet: a binder. A real album, if you like having things in order.",
       pt:"Você já tem seis, então tem uma coisa que a gente fez pro Kaiju Wallet: um fichário. Um álbum de verdade, se você gosta de ter as coisas organizadas."},
      {dl:'tab_binder'},
      {c:'kiv',en:"Nobody has to use it. But a Kaiju filed in there cannot be taken from you — not by Mr. Kaiju, not by anyone.",
       pt:"Ninguém é obrigado a usar. Mas um Kaiju arquivado ali não pode ser tomado de você — nem pelo Mr. Kaiju, nem por ninguém.",
       point:'[data-icon="hubwallet"]'}]},

{id:'b_rarity', when:()=>stMark('rare',G.tokens.some(t=>t.rarity>=2)),
 say:[{c:'oni',en:"I saw what came out of your machine. That one's not common — I do watch, in case that was not clear.",
       pt:"Eu vi o que saiu da sua máquina. Esse aí não é comum — eu acompanho, caso não tenha ficado claro."},
      {c:'oni',en:"Like I told you: rank multiplies the floor. A rare is worth two of them, a legendary seven, a mythic twenty. Same floor, different Kaiju.",
       pt:"Como eu já tinha falado: rank multiplica o floor. Um raro vale dois, um lendário sete, um mítico vinte. Mesmo floor, outro Kaiju."},
      {c:'oni',en:"And races run hot and cold — I'll say it again, because people forget: a race everyone wants today is worth almost double what it was last week.",
       pt:"E raça esquenta e esfria — vou repetir, porque todo mundo esquece: uma raça que todo mundo quer hoje vale quase o dobro do que valia semana passada."}]},

/* b_races SAIU: "voce tirou cinco racas" chegava fora de hora e nao servia pra
   nada — o jogador ja tinha visto as cinco, e a conquista se anuncia sozinha. */
{id:'b_media', urg:1, when:()=>G.day>=4, un:['media','f_track_unc'],
 say:[{c:'kiv',en:"It's a bit quiet in here, isn't it? How about some music. Leaner made a track and let us put it on the server — here, take the player and the tape.",
       pt:"Tá meio quieto por aqui, né? Que tal uma música. Leaner fez uma faixa e deixou a gente botar no server — toma, o player e a fita."},
      {dl:'media'},
      {c:'kiv',en:"Two tracks in there now. Leave it running while you mint — you're going to be here a while.",
       pt:"Duas faixas aí dentro agora. Deixa rodando enquanto você minta — você vai ficar aqui um tempo.",
       point:'[data-icon="media"]'}]},

{id:'b_event', when:()=>stMark('event',G.day>=4&&!!G.event&&G.event!=='calm'),
 say:[{c:'oni',en:"As I've been saying: every day wakes up in a mood. Today isn't yesterday, and none of it is up to you.",
       pt:"Como eu venho dizendo: todo dia acorda com um clima. Hoje não é ontem, e nada disso depende de você."},
      {c:'oni',en:"Bull run, cold market, gas spike, a whale dumping. Read the card in the morning, then decide what the day is for. Everyone learns this the hard way.",
       pt:"Bull run, mercado frio, pico de gas, baleia dumpando. Lê o card de manhã e aí decide pra que serve o dia. Todo mundo aprende isso do jeito difícil."}]},

{id:'b_chart', urg:1, /* dia 14 e dia 14: o dono fixou o calendario e o atalho por nivel furava ele */
 when:()=>G.day>=14, un:['wgt_chart','tab_mkt_stats','m_mkt_stats'],
 say:[{c:'oni',en:"You've been around long enough to want a chart. Here it is. I was wondering when you would get there.",
       pt:"Você já tá aqui tempo o bastante pra querer um gráfico. Toma. Eu tava esperando você chegar nisso."},
      {c:'oni',en:"Again: floor isn't the price of your Kaiju. It's the price of the CHEAPEST one. Yours is worth floor times its rank.",
       pt:"De novo: floor não é o preço do seu Kaiju. É o preço do MAIS BARATO. O seu vale o floor vezes o rank dele."}]},

{id:'b_listing', when:()=>stEver('listed')>=1,
 say:[{c:'oni',en:"A listing is a signature too, so it burns gas — a fraction of a mint, but never zero. Not that anyone listens the first time.",
       pt:"Listar também é assinatura, então queima gas — uma fração do mint, mas nunca zero. Não que alguém escute na primeira vez."},
      {c:'oni',en:"I'll say it again: listing several at once is one signature for the whole batch. And the shop sells listing speed — the difference between a chore and a whole evening.",
       pt:"Vou repetir: listar vários de uma vez é uma assinatura só pro lote inteiro. E a loja vende velocidade de listagem — a diferença entre uma tarefa e uma noite perdida."}]},

{id:'b_sort', when:()=>held()>=10, un:['m_wallet_sort','f_wgrid'],
 say:[{c:'kiv',en:"Ten of them. You cannot eyeball that any more — the wallet has a filter, a sort and a grid size. Use them.",
       pt:"Dez. Não dá mais pra olhar no olho — a carteira tem filtro, ordenação e tamanho de grade. Usa."}]},

{id:'b_offers', when:()=>stEver('sold')>=1, un:['m_collection_offers','tab_mkt_mine'],
 say:[{c:'hakase',en:"You sell one! Very nice-o.",
       pt:"Você vendeu um! Very nice-o."},
      {c:'hakase',en:"When the collectione gets deep, people bid on ALL of it at one time. Below floor, always. Is liquidity with a haircut, and sometimes you need it.",
       pt:"Quando a coleção ficar mais funda, tem gente que dá lance na collectione INTEIRA. Sempre abaixo do floor. É liquidez com desconto, e às vezes você precisa."}]},

/* ============ o que o jogador faz contra si mesmo ============ */
{id:'b_saturation', when:()=>stMark('sat',stL('mint')>=25),
 say:[{c:'tobi',en:"found this one out the worst way, bro. minting a hundred in one day makes YOUR next mint more expensive.",
       pt:"descobri essa do pior jeito, mano. mintar cem num dia só faz o SEU próximo mint ficar mais caro."},
      {c:'tobi',en:"that ain't the market punishing you. that's you flooding your own machine, and the machine notices. you feel me?",
       pt:"não é o mercado te punindo. é você inundando a sua própria máquina, e ela repara. tá ligado?"},
      {c:'tobi',en:"split it across two days and the price walks right back down. collection don't care either way. your wallet does.",
       pt:"divide em dois dias e o preço desce de volta na hora. a coleção não liga de um jeito nem de outro. sua carteira liga."}]},

{id:'b_listpress', when:()=>stMark('lp',stEver('listed')>=8),
 say:[{c:'oni',en:"You've got a wall of listings open at once. I can see it from here, and so can the order book. I did warn you about this.",
       pt:"Você tá com uma parede de listagem aberta. Eu vejo daqui, e o book também. Eu tinha avisado sobre isso."},
      {c:'oni',en:"A wall sells slower and drags your own floor down with it. And by the end of the day the room reads it as dumping. Everyone learns this the hard way.",
       pt:"Parede vende mais devagar e derruba o seu próprio floor junto. E no fim do dia a sala lê aquilo como despejo. Todo mundo aprende isso do jeito difícil."}]},

{id:'b_sweep', when:()=>G.day>=14&&npcHeld()>=60&&unlocked('hubmarket'),
 say:[{c:'oni',en:"You can buy back off the floor. We call it sweeping — I have explained this before, so I will keep it short.",
       pt:"Dá pra comprar de volta do floor. A gente chama de varrer — eu já expliquei isso antes, então vou ser breve."},
      {c:'oni',en:"Each one you take costs a little more than the one before, plus the network fee. Sweeping two hundred isn't sweeping one two hundred times. Read that twice.",
       pt:"Cada um que você tira custa um pouco mais que o anterior, mais a taxa de rede. Varrer duzentos não é varrer um duzentas vezes. Lê isso duas vezes."}]},

{id:'b_binder_set', when:()=>held()>=14&&unlocked('tab_binder'), un:['f_binder_fill'],
 say:[{c:'kiv',en:"A binder page filled with a single Race is a set. The album knows the difference and so does everyone who sees it.",
       pt:"Uma página do fichário cheia de uma raça só é um set. O álbum sabe a diferença e quem vê também."},
      {c:'kiv',en:"Doing that by hand is punishment. There is a button that fills the page with what you already own.",
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

{id:'b_dump', when:()=>stMark('dump',G.day>=7&&(G.event==='dump'||G.event==='fud'||G.event==='cold'||G.event==='rug')),
 say:[{c:'sera',en:"chart looks like a cliff, huh. close it. it passes in a day or two — the people who sell at the bottom are the ones who kept staring. -_-'",
       pt:"o gráfico virou penhasco, né. fecha ele. passa em um ou dois dias — quem vende no fundo é quem ficou encarando. -_-'"}]},

{id:'b_security', when:()=>stMark('unsafe',((+G.scamLoss||0)>0&&G.day>=4)||(G.day>=10&&!securityActive()&&(held()>=8||(+G.money||0)>=600))),
 say:[{c:'sera',en:"you've been sleeping with the door open for days, unc. antivirus. it's rent, not a flex. ¬¬",
       pt:"você tá dormindo de porta aberta faz dias, tio. antivírus. é aluguel, não é ostentação. ¬¬"}]},

/* ============ o meio do jogo ============ */
{id:'b_queue', when:()=>G.bestLevel>=4&&unlocked('shop_all'), un:['f_queue'],
 say:[{c:'tobi',en:"I bought the queue scanner thinking it'd tell me the next number, bro. it does not.",
       pt:"comprei o scanner da fila achando que ele ia dizer o próximo número, mano. não diz."},
      {c:'tobi',en:"it gives you the ODDS of something good in the next ten. an edge, never a sure thing. still the best money I ever spent in here.",
       pt:"ele te dá a CHANCE de vir coisa boa nos próximos dez. vantagem, nunca garantia. ainda foi o melhor dinheiro que gastei aqui."}]},

{id:'b_rep', when:()=>stMark('rep',G.day>=10&&typeof repScore==='function'&&(repScore()>=78||repScore()<48)),
 say:[{c:'oni',en:"The room has an opinion about you now. It isn't in your wallet, and it changes what people offer you. Yes, it is real.",
       pt:"A sala tem uma opinião sobre você agora. Ela não tá na carteira, e muda o que te oferecem. Sim, é de verdade."},
      {c:'oni',en:"Again: dumping walls of listings drags it down. Showing up and not disappearing lifts it. That's the whole mechanic.",
       pt:"De novo: despejar parede de listagem derruba. Aparecer e não sumir levanta. É essa a mecânica inteira."}]},

{id:'b_comfort', urg:1, when:()=>G.day>=15, un:['f_notes'],
 say:[{c:'tobi',en:"you live here now, bro. right-click the desktop — you can leave notes on it. doesn't change the game. just makes it yours.",
       pt:"você mora aqui agora, mano. botão direito na mesa — dá pra deixar nota nela. não muda o jogo. só deixa ele seu."}]},

{id:'b_referral', when:()=>G.bestLevel>=5, un:['f_referral'],
 say:[{c:'hakase',en:"Tuna! Your referral linky is open now.",
       pt:"Tuna! Seu referral linky abriu agora."},
      {c:'hakase',en:"It take your cut on every mint that is not yours from thirty per cent to forty. That is not a small numbers.",
       pt:"Ele leva o seu corte em todo mint que não é seu de trinta pra quarenta por cento. Isso não é um number pequeno."},
      {c:'hakase',en:"Also it puts your name where people look for names. And not everybody looking is a buyer, yeag. Keep the antivirus paid!",
       pt:"E põe seu nome onde procuram nome. E nem todo mundo que procura é buyer, yeag. Mantém o antivírus pago!"}]},

{id:'b_vault', when:()=>G.bestLevel>=6, un:['tab_vault','f_stake'],
 say:[{c:'hakase',en:"Swordfish! Now we can talky.",
       pt:"Swordfish! Agora dá pra talky."},
      {c:'hakase',en:"The vaulto pays you every day for locking a Kaiju inside. Locked is locked — you cannot sell it, and he cannot take it too.",
       pt:"O vaulto te paga por dia pra trancar um Kaiju lá dentro. Trancado é trancado — você não vende, e ele também não tira."}]},

{id:'b_stake', when:()=>stMark('stake',!!G.stakeOn||G.tokens.some(t=>t.staked)),
 say:[{c:'hakase',en:"The vaulto has a counted number of shelfs. More shelfs cost moneys, and then very much more moneys.",
       pt:"O vaulto tem prateleira contada. Mais prateleira custa moneys, e depois muito mais moneys."},
      {c:'hakase',en:"Ten days is the minimum, yeag. Lock away the one you was going to sell this week and is the same as losing it.",
       pt:"Dez dias é o mínimo, yeag. Trancar o que você ia vender essa semana é a mesma coisa que perder."}]},

/* ============ o fim ============ */
{id:'b_late', when:()=>G.minted>=SUPPLY*0.5,
 say:[{c:'kiv',en:"Half the collection is gone. The people arriving now pay double what you paid and they think they are early.",
       pt:"Metade da coleção já saiu. Quem chega agora paga o dobro do que você pagou e acha que chegou cedo."},
      {c:'kiv',en:"You were actually early. Do not give it away cheap.",
       pt:"Você chegou cedo de verdade. Não entrega barato."}]},

{id:'b_mintout', when:()=>!!G.mintout,
 say:[{c:'kiv',en:"That is it. Eight thousand eight hundred and eighty eight, none left over.",
       pt:"Acabou. Oito mil oitocentos e oitenta e oito, nenhum sobrando."},
      {c:'kiv',en:"Nobody will ever mint one again. From here on, everything that changes hands comes from someone who already has one.",
       pt:"Ninguém vai mintar mais nenhum. Daqui pra frente tudo que muda de mão vem de quem já tem."},
      {c:'hakase',en:"Now begins the parte I likes.",
       pt:"Agora começa a parte que eu gosto. The good parte."}]}
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
/* ---------- OS PRESENTES DENTRO DE UMA CONVERSA ----------
   `{gift:'tax30'}` no meio do `say` de um momento. Nao abre janela: cai o
   dinheiro na carteira com o aviso de sempre, no meio da conversa, e a fala
   seguinte comenta. Cada presente acontece UMA VEZ (S.gifted guarda). */
function storyGift(tipo){
  const S=story();
  S.gifted=S.gifted&&typeof S.gifted==='object'?S.gifted:{};
  if(S.gifted[tipo])return;
  if(tipo==='tax30'){
    const base=+G.lastTaxPaid||0;
    const v=Math.max(1,Math.round(base*0.30));
    if(!base)return;
    S.gifted[tipo]=G.day||1;
    /* NAO passa por earn(): earn() joga o valor no lucro do periodo e o
       Mr. Kaiju cobraria imposto em cima do dinheiro que o Stux mandou pra
       pagar o imposto. Presente nao e lucro. */
    G.money=(+G.money||0)+v;
    G.log.earned+=v;G.totals.earned+=v;
    if(G.money>G.best)G.best=G.money;
    if(typeof UI==='object'&&UI&&UI.toast)
      UI.toast('gift',t('{0} sent you {1}',charOf('tobi').who,money(v)));
    if(typeof SFX==='object'&&SFX&&SFX.cash)SFX.cash();
    save();
  }
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
  /* uma linha de PRESENTE nao fala: ela faz a coisa acontecer e sai da frente.
     E assim que o Stux devolve 30% do imposto sem virar mais um pop-up. */
  if(linha&&linha.gift){
    storyBusy=false;
    try{storyGift(linha.gift);}catch(e){}
    item.i++;
    if(item.i>=b.say.length)S.q.shift();
    save();setTimeout(storyPump,260);
    return;
  }
  if(linha&&linha.dl){
    appDownload(linha.dl,()=>{
      storyBusy=false;item.i++;
      if(item.i>=b.say.length)S.q.shift();
      save();setTimeout(storyPump,160);
    });
    return;
  }
  /* a caixa anda sozinha pelas falas seguidas do mesmo momento; ela para
     antes de uma linha de download, que precisa da propria janela. */
  /* O BUG DA CAIXA VAZIA: nem toda linha do `say` e uma FALA. `{dl:...}` abre
     a janela de download e `{gift:...}` cai dinheiro na carteira — as duas sao
     acoes, nao texto. A caixa andava pra cima delas assim mesmo e desenhava um
     balao sem nome e sem frase. Agora ela so anda pra linha que tem `c`; o que
     nao e fala volta pro storyPump, que sabe o que fazer com cada uma. */
  const falada=n=>!!(n&&n.c);
  const nav={
    more(){return !!b.say[item.i+1];},
    peek(){const n=b.say[item.i+1];return falada(n)?n:null;},
    take(){const n=b.say[item.i+1];if(!falada(n))return null;item.i++;save();return n;}
  };
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
  },nav);
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
/* ---------- O QUE NAO E UM ICONE TAMBEM CHEGA BAIXANDO ----------
   Um painel que nasce sozinho no canto da tela e tao sintetico quanto um icone
   que nasce sozinho na mesa. O medidor de gas e um WIDGET, o botao de pular
   uma hora e um UPDATE da carteira — nenhum dos dois esta em DESK_ICONS, entao
   eles se descrevem aqui. `kind` so muda a moldura da janela: 'app' baixa,
   'widget' baixa, 'update' INSTALA. */
const DL_META={
  wgt_gas:   {lbl:'Gas Tracker',  ico:'gas',    file:'gastracker.wgt',    kb:214, kind:'widget', wgt:'gas'},
  wgt_chart: {lbl:'Kaiju Charts', ico:'chart',  file:'kaijucharts.wgt',   kb:392, kind:'widget', wgt:'chart'},
  f_hudskip: {lbl:'Kaiju Wallet', ico:'wallet', file:'kwallet-patch.exe', kb:96,  kind:'update'},
  tab_binder:{lbl:'Kaiju Wallet', ico:'binder', file:'kbinder-patch.exe',  kb:344, kind:'update'}
};
function dlPending(id){const S=story();return Array.isArray(S.dlq)&&S.dlq.indexOf(id)>=0;}
function dlMark(id){const S=story();if(!Array.isArray(S.dlq))S.dlq=[];if(S.dlq.indexOf(id)<0)S.dlq.push(id);}
function dlDone(id){const S=story();if(Array.isArray(S.dlq))S.dlq=S.dlq.filter(x=>x!==id);}
function appDownload(id,done){
  const scr=document.querySelector('#screen');
  if(!scr){dlDone(id);done();return;}
  const M=DL_META[id];
  const ic=M||((typeof DESK_ICONS!=='undefined'?DESK_ICONS:[]).find(x=>x.id===id))||{lbl:id,ico:'pc'};
  const kind=(M&&M.kind)||'app';
  const nome=(M&&M.file)||DL_NOME[id]||(id+'.exe'), kb=(M&&M.kb)||DL_KB[id]||900;
  const pasta=kind==='widget'?'kakizone.net/widgets/':kind==='update'?'kakizone.net/updates/':'kakizone.net/apps/';
  const titulo=kind==='update'?t('Installing {0}',nome):t('Downloading {0}',nome);
  const destino=kind==='widget'?'C:\\KAIJU\\PANELS\\':kind==='update'?'C:\\KAIJU\\APPS\\':'C:\\KAIJU\\APPS\\';
  const K=(typeof uiScale==='function')?uiScale():1;
  const box=el('div','win dlwin opening dl-'+kind);
  box.innerHTML=`
    <div class="titlebar">${pixSVG('globe',14,'tico')}<span class="ttl">${titulo}</span></div>
    <div class="wbody dl-body">
      <div class="dl-row">${pixSVG(ic.ico||'pc',40,'dl-ico')}
        <div class="dl-txt"><b>${t(ic.lbl)}</b><div class="dl-from">${t('from')} ${pasta}${nome}</div></div></div>
      <div class="dl-anim"><i></i><i></i><i></i></div>
      <div class="prog dl-prog"><i style="width:0%"></i></div>
      <div class="dl-meta"><span data-dlb>0 KB</span> ${t('of')} ${kb.toLocaleString()} KB <span data-dlt></span></div>
      <div class="dl-foot">${t('Save to')} ${destino}</div>
    </div>`;
  scr.appendChild(box);
  requestAnimationFrame(()=>box.classList.remove('opening'));
  document.body.classList.add('storytalk');
  SFX.notify&&SFX.notify();
  const bar=box.querySelector('.dl-prog i'), b=box.querySelector('[data-dlb]'), tt=box.querySelector('[data-dlt]');
  /* O dono achou a chegada rapida demais: um download que termina antes de o
     olho pousar nele nao e uma coisa que aconteceu, e uma transicao. */
  const dur=3600+Math.min(2400,kb/2.2);
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
          if(typeof buildWidgets==='function')buildWidgets();
          if(typeof buildStart==='function')buildStart();
          if(typeof UI==='object'&&UI&&UI.refresh)UI.refresh();
          dlArrive(id);
          done();},200);
      },520);
    }
  };
  requestAnimationFrame(tick);
}

/* ---------- A CHEGADA, DEVAGAR ----------
   Depois que o download fecha, a coisa nova entra na tela com calma: o painel
   cresce do nada e pisca uma vez, o icone da mesa faz o mesmo. Sem isso o
   jogador ve o resultado, nunca o acontecimento — foi exatamente a queixa do
   dono ("ta muito rapido"). A classe cai sozinha; nada depende dela. */
function dlArrive(id){
  try{
    const M=DL_META[id];
    let alvo=null;
    if(M&&M.wgt)alvo=document.getElementById('wgt_'+M.wgt);
    if(!alvo)alvo=document.querySelector('[data-icon="'+id+'"]');
    if(!alvo&&id==='f_hudskip')alvo=document.getElementById('hud_skip');
    if(!alvo)return;
    alvo.classList.remove('arriving');
    void alvo.offsetWidth;                       /* reinicia a animacao */
    alvo.classList.add('arriving');
    setTimeout(()=>{try{alvo.classList.remove('arriving');}catch(e){}},2200);
  }catch(e){}
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
function storyShow(line,done,nav){
  const scr=document.querySelector('#screen');
  if(!scr){done();return;}
  const K=(typeof uiScale==='function')?uiScale():1;
  const box=el('div','storybox opening');
  box.innerHTML=`
    <div class="sb-por" data-sbp="1"></div>
    <div class="sb-main">
      <div class="sb-who"><b data-sbw="1"></b></div>
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

  const por=$('[data-sbp]',box), quem=$('[data-sbw]',box),
        txt=$('[data-sbt]',box), btn=$('[data-sbn]',box);

  /* ---------- UMA CAIXA, A CONVERSA INTEIRA ----------
     Antes cada linha do mesmo personagem abria e fechava uma caixa nova: tres
     falas seguidas eram tres pop-ups piscando na tela. Agora a caixa fica, o
     botao vira ">" enquanto houver proxima linha e so vira OK na ultima.
     Quem sabe o que vem depois e a fila (storyPump), entao ela passa `nav`;
     sem `nav` a caixa se comporta exatamente como antes. */
  let atual=null, alvo=null, tid=null, pronto=false;

  const soltaAlvo=()=>{if(alvo){alvo.classList.remove('story-point');alvo=null;}};
  const acaba=()=>{pronto=true;if(tid){clearInterval(tid);tid=null;}
    txt.textContent=(LANG==='pt'?atual.pt:atual.en)||atual.en||'';};

  function render(l,primeira){
    atual=l;
    const c=charOf(l.c);
    por.innerHTML=storyPortrait(l.c,Math.round(72*K));
    quem.textContent=c.who;
    soltaAlvo();
    if(l.point){
      try{alvo=document.querySelector(l.point);}catch(e){alvo=null;}
      if(alvo)alvo.classList.add('story-point');
    }
    /* o rotulo olha se vem QUALQUER coisa depois — inclusive um download.
       Um "OK" na fala que antecede a barra de progresso mente: da a entender
       que a conversa acabou ali. */
    const temMais=!!(nav&&(nav.more?nav.more():(nav.peek&&nav.peek())));
    btn.textContent=temMais?'>':t('OK');
    btn.classList.toggle('sb-more',temMais);
    /* a máquina de escrever: só o suficiente pra dar ritmo de fala.
       Clicar corta e mostra o texto inteiro — ninguém deve esperar por letra. */
    const full=(LANG==='pt'?l.pt:l.en)||l.en||'';
    pronto=false;
    if(tid){clearInterval(tid);tid=null;}
    txt.textContent='';
    if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)acaba();
    else{let i=0;tid=setInterval(()=>{
      i+=2;txt.textContent=full.slice(0,i);
      if(i>=full.length)acaba();
    },16);}
    if(!primeira){
      /* a troca de fala tem que ser VISIVEL: sem isso o jogador clica e nao
         tem certeza de que alguma coisa mudou. */
      box.classList.remove('sb-turn');void box.offsetWidth;box.classList.add('sb-turn');
      SFX.click&&SFX.click();
    }
  }

  /* Um modal pode abrir DEPOIS de a fala já estar na tela (o Mr. Kaiju
     batendo, um golpe). O véu fica em z-index 6000 e engolia a caixa. Enquanto
     houver modal a caixa se esconde e volta sozinha quando ele fecha. */
  const veiaTick=setInterval(()=>{
    if(!box.isConnected){clearInterval(veiaTick);return;}
    box.classList.toggle('behind',!!document.querySelector('#modalveil.on'));
  },220);
  /* FECHAR DUAS VEZES NAO PODE ACONTECER. Dois cliques rapidos no mesmo botao
     (ou um clique com o dedo tremendo no celular) chamavam `done()` duas
     vezes, e cada `done()` anda uma linha na fila: a conversa PULAVA a linha
     seguinte. Foi assim que o presente do Stux (a linha {gift:'tax30'}) foi
     saltado e o dinheiro nunca caiu. */
  let fechando=false;
  const fecha=()=>{
    if(fechando)return;
    fechando=true;
    clearInterval(veiaTick);
    document.body.classList.remove('storytalk');
    if(tid)clearInterval(tid);
    soltaAlvo();
    box.classList.add('closing');
    setTimeout(()=>{box.remove();done();},170);
  };
  btn.onclick=()=>{
    if(fechando)return;
    if(!pronto){acaba();return;}
    if(nav&&nav.peek&&nav.peek()){
      const prox=nav.take();
      if(prox){render(prox,false);return;}
    }
    SFX.click();fecha();
  };
  $('[data-sbs]',box).onclick=()=>{if(fechando)return;SFX.close();storySkip();fecha();};
  box.onclick=e=>{if(e.target===box||e.target===txt){if(!pronto)acaba();}};
  render(line,true);
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
