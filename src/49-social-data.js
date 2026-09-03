/* ================= SOCIAL: ELENCO E FALAS =================
   Tudo aqui e conteudo autoral bilingue {en,pt}. NAO passa pelo t(): o mapa PT
   e lookup exato de string e encheria de centenas de chaves geradas. */

/* ---------- lowballers (item 3) ----------
   Ofertas absurdas com nick de gente que voce reconhece de qualquer server.
   Nada de "wagmi"/"gmgm": o humor e de quem vive arte e NFT de verdade. */
const LOWBALL=[
 /* metade curta, metade nome-frase: a piada funciona melhor quando nao e
    todo mundo fazendo a mesma piada */
 'rclick','traced_it_myself','fakekaki','bucket_tool','dvart_04','1of1',
 'deviantart_refugee','zoom_in_on_the_eyes','flatten_all','apraiser_lol',
 'derivado','supremacist_09','procreate_martyr','i_had_this_idea_first',
 'no_taste','aa_hater','ape2020','kaki_but_worse','sold_the_shark_lol',
 'unrevealed','still_up_from_mint','xerox','mid_curve','offer_or_leave'
];
const RACE_HATERS=['{r}_race_hater','{r}_slander_acct','{r}_is_mid','{r}_phase_ended','anti_{r}_league'];
const LOWBALL_LINES=[
 {en:'doing you a favor honestly',pt:'tô te fazendo um favor sinceramente'},
 {en:'the eyes are lazy on this one. take it.',pt:'os olhos desse aqui são preguiçosos. aceita.'},
 {en:'I have 400 of these already',pt:'já tenho 400 desses'},
 {en:'final offer (I will send this again tomorrow)',pt:'oferta final (mando de novo amanhã)'},
 {en:'this is above floor in my opinion',pt:'na minha opinião isso é acima do floor'},
 {en:'I collect the ugly ones',pt:'eu coleciono os feios'},
 {en:'no disrespect to whoever drew it',pt:'sem desrespeito a quem desenhou'},
 {en:'my analyst says this is generous',pt:'meu analista diz que isso é generoso'}
];
function lowballNick(tk){
  if(chance(0.35)&&tk)
    return pick(RACE_HATERS).split('{r}').join(String(raceOf(tk)||'kaki').toLowerCase());
  return pick(LOWBALL);
}
function lowballLine(){const l=pick(LOWBALL_LINES);return l[LANG]||l.en;}

/* ---------- elenco fixo ----------
   Gente que volta, lembra do que voce fez, e reage a sua reputacao. */
/* O elenco fixo. Metade tinha nome-frase de folheto de NFT
   ("paperhand_therapist", "grail_or_nothing") — engraçado uma vez, cansativo
   no dia 20. Os cinco piores viraram handle curto; o papel de cada um (arq)
   é o mesmo. Trocar o nome troca a personalidade junto, porque personaOf()
   sai do hash do nome. */
const CAST=[
 {id:'first_day_holder', ico:'kaiju',  arq:'novato'},
 {id:'Anonymous Wallet',  ico:'crt',    arq:'mod'},
 {id:'oni_of_the_floor', ico:'chart',  arq:'vigia'},
 {id:'hakase', ico:'coin',   arq:'baleia'},
 {id:'centavo',     ico:'market', arq:'lowball'},
 {id:'Leaner (Unc)',ico:'info', arq:'terapeuta'},
 {id:'rugmuseum_curator',ico:'warn',   arq:'arquivista'},
 {id:'artschool_dropout',ico:'notepad',arq:'arte'},
 {id:'mopcore', ico:'bin',    arq:'faxina'},
 {id:'Stux',      ico:'bug',    arq:'azarado'},
 {id:'mr_kaiju_intern',  ico:'coin',   arq:'estagiario'}
];
/* ---------- o resto da comunidade ----------
   Gente que aparece no feed sem virar personagem fixo. Sao 120 e pouco nomes,
   escritos como gente de server de arte e de NFT escreve de verdade: piada
   interna, autodepreciacao, referencia de ateliê, e uns poucos insuportaveis.
   Nada de wagmi/gm — isso e nome de folheto, nao de pessoa. */
const CROWD=[
 /* ---------- handles curtos ----------
    A sala estava toda em nome-frase ("o_perspective_police", "canvas_too_
    ambitious"). Uma piada dessas é boa; cento e trinta viram ruído, e ninguém
    escolhe apelido assim. Server de arte de verdade é a maioria com handle
    curto — palavra composta, ano de nascimento, .exe — e uns poucos com
    nome-frase pra fazer graça. A proporção agora é essa.
    Cada nome carrega a personalidade dele pelo hash (personaOf), então trocar
    o nome troca a natureza junto. */
 'cyberangel','vik1998','nullsan','voidmilk','keiko_exe','glasshour',
 'mari2001','tez97','lun04','plumfog','kaz11','nori7','bonesoup','shizu_00',
 'oxide','marrow','ghostpixel','yuu_txt','sable','ferrite','kirin_99',
 'lowres','mio_gif','denki','umbra','saltcrt','hex_87','pale_moth',
 'ren2000','tsuki_dat','moss','vhsrot','ayame','kobal','drx_02','luma',
 'nine_volt','shoji','ame','crt_burn','yori95','blank_st','kuro_exe',
 'petrichor','wren','sixthstreet','halogen','miku_offline','anon_ito',
 'lys','tanuki_bmp','feral_ok','oyasumi','sena_88','graphite',
 /* ---------- gente de ateliê ---------- */
 'gouache_goblin','the_undo_stack','ctrl_z_and_pray','ink_gremlin',
 'madame_smudge','anatomy_optional','the_perspective_police',
 'one_more_pass_i_swear','finished_it_at_dawn','warmups_are_a_myth',
 'my_sketchbook_hates_me','value_study_hermit','rimlight_apologist',
 /* ---------- crypto, mas gente ---------- */
 'holds_out_of_spite','duchess_of_the_dip','archduke_of_regret',
 'minted_and_confused','gas_fee_martyr','spreadsheet_shaman','trait_lawyer',
 'bought_high_stayed_high','the_quiet_accumulator','never_posts_always_buys',
 'the_patient_one','thinks_hes_early','professional_refresher',
 /* ---------- referência e nonsense ---------- */
 'catboy_actuary','lukewarm_ramen','beans_on_everything','microwave_at_3am',
 'the_cereal_standing_up','mildly_haunted','possibly_a_lizard',
 'seventeen_tabs_deep','my_cat_typed_this','trumpet_neighbour',
 'plant_still_alive','the_good_bread_is_gone','said_you_too',
 /* ---------- insuportáveis (mas divertidos) ---------- */
 'ackshually_the_supply','i_called_it_in_march','not_financial_advice_but',
 'ive_been_here_since','source_trust_me','the_actual_alpha',
 'quietly_correcting_you','erm_the_metadata',
 /* ---------- madrugada ---------- */
 'awake_and_unwell','three_am_thesis','sleep_is_a_rumour',
 'doomscroll_curator','insomnia_correspondent','tomorrow_me_problem',
 /* ---------- colecionadores de nicho ---------- */
 'only_the_ugly_ones','buys_the_sad_ones','hat_maximalist',
 'wings_or_nothing_lad','bucket_helmet_enjoyer','eyebags_appreciation',
 'background_archaeologist','i_zoom_on_everything',
 /* ---------- nome de pessoa mesmo ---------- */
 'kenji_offline','old_gus','little_thom','yuki_probably','marta_but_online',
 'second_alt_sorry','main_is_private','lurker_no_more','muted_but_present',
 'wrong_hemisphere','timezone_of_pain'
];
/* fas de raca: os que importam tem nome proprio, o resto e gerado */
const RACE_FANS={
 Beetle:'beetlebrood', Otaku:'otaku_supply_99', Harajuku:'harajuku_pilled',
 Shark:'chum_in_the_water', Monkey:'99_monke_only', Secret:'honorary_only',
 Wraith:'wraithposter', Mecha:'panel_lines_guy', Knight:'full_plate_andy',
 Saiyan:'hair_alone_worth_it', Vampire:'old_money_fangs', Kaki:'house_race_purist'
};
function raceFanFor(race){
  if(RACE_FANS[race])return RACE_FANS[race];
  const suf=['_floor_watch','_only_acct','_pilled','_defender','_maxi_99'];
  const h=String(race).split('').reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,7);
  return String(race).toLowerCase()+suf[Math.abs(h)%suf.length];
}

/* ---------- posts do feed ---------- */
/* ---------- o que as pessoas falam ----------
   Regra: ninguem aqui fala como folheto. Sao colecionadores, artistas, gente
   que perdeu dinheiro, gente que so gosta do desenho, e um ou outro insuportavel.
   Cada linha tem que soar como alguem digitando de madrugada. */
const POST_TALK=[
 {en:'does anybody actually know how many of these are left',pt:'alguém sabe de verdade quantos faltam desses'},
 {en:'the linework on the older ones is different. am I crazy',pt:'o traço dos antigos é diferente. eu tô louco'},
 {en:'floor moved again. I am not selling',pt:'o floor mexeu de novo. eu não vou vender'},
 {en:'genuinely the only collection I check every day',pt:'única coleção que eu abro todo dia sinceramente'},
 {en:'whoever drew the Ronin ones needs a raise',pt:'quem desenhou os Ronin merece aumento'},
 {en:'I sold too early. that is the whole post',pt:'vendi cedo demais. é isso o post'},
 {en:'my wallet is 90% commons and I am at peace',pt:'minha carteira é 90% comum e eu tô em paz'},
 {en:'gas is criminal today',pt:'o gás tá um crime hoje'},
 {en:'first time I minted I got a Zomboy and quit for a week',pt:'primeira vez que mintei veio um Zomboy e eu parei uma semana'},
 {en:'zoom in on the eyes. go on. every single pair is different.',pt:'dá zoom nos olhos. pode dar. cada par é diferente.'},
 {en:'I have been refreshing this page for forty minutes and nothing happened',pt:'faz quarenta minutos que eu atualizo essa página e não aconteceu nada'},
 {en:'the Ghost ones look better small. that is a compliment',pt:'os Ghost ficam melhor pequenos. isso é elogio'},
 {en:'okay who is buying at this price and what do they know',pt:'ok quem tá comprando nesse preço e o que essa pessoa sabe'},
 {en:'my whole thesis is that the ugly ones age better',pt:'minha tese inteira é que os feios envelhecem melhor'},
 {en:'took me four days to notice the background changes per race',pt:'levei quatro dias pra reparar que o fundo muda por raça'},
 {en:'not financial advice but I moved my grocery money',pt:'não é conselho financeiro mas eu mexi no dinheiro do mercado'},
 {en:'this floor is held up by about four stubborn people and I am one',pt:'esse floor tá de pé por umas quatro pessoas teimosas e eu sou uma'},
 {en:'somebody explain the Hollow ones to me like I am five',pt:'alguém me explica os Hollow como se eu tivesse cinco anos'},
 {en:'I keep opening the binder just to look. no reason.',pt:'eu fico abrindo o binder só pra olhar. sem motivo.'},
 {en:'the Vice ones have a whole different palette and nobody talks about it',pt:'os Vice têm uma paleta completamente diferente e ninguém fala disso'},
 {en:'day 3 of not selling. send help or conviction',pt:'dia 3 sem vender. mandem ajuda ou convicção'},
 {en:'I paid above floor on purpose. I want the artists to eat.',pt:'paguei acima do floor de propósito. eu quero que os artistas comam.'},
 {en:'nobody tell my wife how many of these I have',pt:'ninguém conta pra minha esposa quantos desses eu tenho'},
 {en:'the Wraith eyes are unsettling in a good way',pt:'os olhos dos Wraith são perturbadores no bom sentido'},
 {en:'is it just me or did the gas fix itself at like 4am',pt:'é impressão minha ou o gás se consertou sozinho umas 4 da manhã'},
 {en:'I do not understand the ranking system and I am doing fine',pt:'eu não entendo o sistema de ranking e tô indo bem'},
 {en:'sold one to buy two. explain the math. you cannot.',pt:'vendi um pra comprar dois. explica a matemática. não dá.'},
 {en:'the Beetle supply being 149 keeps me awake',pt:'o supply de 149 dos Beetle me tira o sono'},
 {en:'unpopular take: the commons have the best compositions',pt:'opinião impopular: os comuns têm as melhores composições'},
 {en:'checked the floor eleven times today. eleven.',pt:'olhei o floor onze vezes hoje. onze.'},
 {en:'my favorite one is worth nothing and I do not care',pt:'meu favorito não vale nada e eu não ligo'},
 {en:'anyone else just here for the art at this point',pt:'mais alguém tá aqui só pela arte a essa altura'},
 {en:'the Exorcist ones scared my cat. real review.',pt:'os Exorcist assustaram meu gato. review de verdade.'},
 {en:'I would like to formally apologize for panic selling',pt:'gostaria de me desculpar formalmente por ter vendido no pânico'},
 {en:'holding through this because I am stubborn, not because I am smart',pt:'segurando isso por teimosia, não por inteligência'},
 {en:'the Archangel wings render differently at 300px. worth looking.',pt:'as asas dos Archangel renderizam diferente em 300px. vale olhar.'},
 {en:'someone listed 40 at once and the floor felt it immediately',pt:'alguém listou 40 de uma vez e o floor sentiu na hora'},
 {en:'I made a spreadsheet. I am not okay but the spreadsheet is good.',pt:'fiz uma planilha. eu não tô bem mas a planilha tá boa.'},
 {en:'there are alchemy symbols tattooed on some faces. saturn. mercury. sulfur. why.',pt:'tem símbolos de alquimia tatuados em alguns rostos. saturno. mercúrio. enxofre. por quê.'},
 {en:'stop asking when. there is no when. there is only mint out.',pt:'para de perguntar quando. não tem quando. tem mintout.'},
 {en:'I bought at the top and I am still here. respect me.',pt:'comprei no topo e ainda tô aqui. me respeitem.'},
 {en:'the Toon ones came out of a completely different hand and I love it',pt:'os Toon saíram de uma mão completamente diferente e eu amo'},
 {en:'my rarest one is a Mythic I got on day two and I have told nobody',pt:'o meu mais raro é um Mítico que eu peguei no dia dois e eu não contei pra ninguém'},
 {en:'somebody is running a bot on the offers and it is obvious',pt:'alguém tá rodando bot nas ofertas e tá na cara'},
 {en:'imagine explaining to your bank that you bought a monster',pt:'imagina explicar pro seu banco que você comprou um monstro'},
 {en:'the Saiyan hair alone justifies the whole race',pt:'o cabelo dos Saiyan sozinho já justifica a raça inteira'},
 {en:'I dreamed about the mint page. that is a bad sign.',pt:'eu sonhei com a página de mint. isso é mau sinal.'},
 {en:'nobody is going to tell you when the bottom was. that is the whole game.',pt:'ninguém vai te avisar quando foi o fundo. é isso o jogo inteiro.'},
 {en:'half these backgrounds are whole scenes. somebody drew a supermarket aisle.',pt:'metade desses fundos são cenas inteiras. alguém desenhou um corredor de supermercado.'},
 {en:'listing at 4x and going to sleep. see you in the morning.',pt:'listando a 4x e vou dormir. vejo vocês de manhã.'},
 {en:'I do not think people realize how few Sharks there are',pt:'acho que as pessoas não percebem quão poucos Shark existem'},
 {en:'quietly accumulating. that is it. that is the strategy.',pt:'acumulando na surdina. é isso. é essa a estratégia.'},
 {en:'the Cyborg plating catches light differently. somebody sat down and did that.',pt:'a blindagem dos Cyborg pega luz diferente. alguém sentou e fez isso.'},
 {en:'we are so early it is embarrassing',pt:'a gente tá tão cedo que é vergonhoso'},
 {en:'okay the Monkey ones are genuinely funny and I said what I said',pt:'ok os Monkey são genuinamente engraçados e eu falei o que falei'},
 {en:'floor down 8% and the group chat went silent. cowards.',pt:'floor caiu 8% e o grupo ficou mudo. covardes.'},
 {en:'I check the rarity page more than my email',pt:'eu abro a página de raridade mais que meu email'},
 {en:'the Wizard hoods swallow the whole head and I find that funny',pt:'os capuzes de Wizard engolem a cabeça inteira e eu acho isso engraçado'},
 {en:'someone bought my listing three seconds after I posted it. suspicious. thank you.',pt:'alguém comprou minha listagem três segundos depois de eu postar. suspeito. obrigado.'},
 {en:'I am not a collector I am a person with a problem',pt:'eu não sou colecionador eu sou uma pessoa com um problema'},
 {en:'the Raver ones look like a poster I had in 2003',pt:'os Raver parecem um pôster que eu tinha em 2003'},
 {en:'every time gas drops I remember I have no money left',pt:'toda vez que o gás cai eu lembro que não tenho mais dinheiro'},
 {en:'the Emo fringe covering one eye is a choice and it was the right one',pt:'a franja dos Emo cobrindo um olho é uma escolha e foi a certa'},
 {en:'reminder that the supply does not go back up',pt:'lembrete de que o supply não volta a subir'},
 {en:'I am going to be normal about this collection starting tomorrow',pt:'eu vou ser normal sobre essa coleção a partir de amanhã'},
 {en:'some of these are wearing a literal bucket as a helmet and it rules',pt:'alguns desses estão com um balde literal de capacete e é sensacional'},
 {en:'made money, put it back in, made less money. classic.',pt:'ganhei dinheiro, coloquei de volta, ganhei menos. clássico.'},
 {en:'the fact that Honorary exists and nobody can mint it drives me insane',pt:'o fato de Honorary existir e ninguém poder mintar me deixa louco'},
 {en:'sorting by rarity and just scrolling. this is my evening.',pt:'ordenando por raridade e só rolando. é essa a minha noite.'},
 {en:'if this mints out I am framing one. physically. on a wall.',pt:'se isso der mintout eu vou emoldurar um. fisicamente. numa parede.'},
 {en:'the Orc ones have the smuggest expressions in the whole set',pt:'os Orc têm as expressões mais convencidas da coleção inteira'},
 {en:'I have never seen a Special in the wild. do they exist.',pt:'eu nunca vi um Special no mercado. eles existem mesmo.'},
 {en:'buying one more and then stopping. (I have said this six times)',pt:'compro mais um e paro. (já falei isso seis vezes)'},
 {en:'the Vampire palette is basically two colors and it works perfectly',pt:'a paleta dos Vampire é basicamente duas cores e funciona perfeitamente'},
 {en:'whoever is holding the floor up right now: thank you, personally',pt:'quem está segurando o floor agora: obrigado, pessoalmente'},
 {en:'my strategy is vibes and my vibes have been wrong for three days',pt:'minha estratégia é intuição e minha intuição errou três dias seguidos'},
 {en:'the Mecha panel lines are hand placed. you can tell by the imperfections.',pt:'as linhas de painel dos Mecha foram colocadas à mão. dá pra ver pelas imperfeições.'},
 {en:'somebody explain why the Kaki race feels different from the rest',pt:'alguém explica por que a raça Kaki parece diferente das outras'},
 {en:'checked. still poor. still holding.',pt:'conferido. ainda pobre. ainda segurando.'},
 {en:'the Jock ones look like they are about to ask what team you support',pt:'os Jock parecem que vão te perguntar pra que time você torce'},
 {en:'I only buy the ones that look tired. it is a whole aesthetic.',pt:'eu só compro os que parecem cansados. é uma estética inteira.'},
 {en:'floor is a suggestion until somebody actually pays it',pt:'floor é sugestão até alguém pagar de fato'},
 {en:'the Strike race grew on me. took two weeks. worth it.',pt:'a raça Strike foi crescendo em mim. levou duas semanas. valeu.'},
 {en:'we need a group chat that is just people posting their commons',pt:'a gente precisa de um grupo que seja só gente postando os comuns'},
 {en:'watching the gas curve like it is a sport now',pt:'olhando a curva do gás como se fosse esporte agora'},
 {en:'the Western backgrounds have cacti at three different distances. depth. in a pfp.',pt:'os fundos Western têm cactos em três distâncias diferentes. profundidade. numa pfp.'},
 {en:'sold my best one. have not recovered emotionally.',pt:'vendi o meu melhor. não me recuperei emocionalmente.'},
 {en:'reminder: the number on your Kaiju is not the number in the collection',pt:'lembrete: o número no seu Kaiju não é o número na coleção'},
 {en:'I like that nobody here pretends this is serious',pt:'eu gosto que ninguém aqui finge que isso é sério'},
 {en:'the Asylum ones are genuinely unsettling and I mean that as praise',pt:'os Asylum são genuinamente perturbadores e eu falo isso como elogio'},
 {en:'is there a term for buying a thing to avoid regret. asking for me.',pt:'existe um termo pra comprar uma coisa pra evitar arrependimento. é pra mim mesmo.'},
 {en:'the Lean palette hurts my eyes and I bought three',pt:'a paleta do Lean machuca meus olhos e eu comprei três'},
 {en:'I have opinions about the Hat trait distribution and nobody wants them',pt:'eu tenho opiniões sobre a distribuição do trait Hat e ninguém quer ouvir'},
 {en:'the whole point is that it is drawn. that is the whole point.',pt:'o ponto inteiro é que foi desenhado. é esse o ponto inteiro.'},
 {en:'watched the supply tick up by one and felt something',pt:'vi o supply subir em um e senti alguma coisa'},
 {en:'the Archangel and the Wraith in the same page looks incredible',pt:'o Archangel e o Wraith na mesma página fica incrível'},
 {en:'my portfolio is down and my binder is beautiful. net positive.',pt:'meu portfólio caiu e meu binder tá lindo. saldo positivo.'},
 {en:'nobody warned me the reveal animation would do this to me',pt:'ninguém me avisou que a animação de reveal ia fazer isso comigo'},
 {en:'the Cat ones are dangerous. I have four. I wanted zero.',pt:'os Cat são perigosos. eu tenho quatro. eu queria zero.'},
 {en:'somebody made a rarity tool and it is wrong. do not use it.',pt:'alguém fez uma ferramenta de raridade e tá errada. não usem.'},
 {en:'I trust the people holding more than the people posting',pt:'eu confio mais em quem segura do que em quem posta'},
 {en:'the Zomboy teeth. that is it. that is the post.',pt:'os dentes do Zomboy. é isso. é esse o post.'},
 {en:'four hours in the binder and I moved two cards',pt:'quatro horas no binder e eu movi duas cartas'},
 {en:'the Harajuku supply is 455 and it still feels rare because they are all good',pt:'o supply de Harajuku é 455 e ainda parece raro porque são todos bons'},
 {en:'stop refreshing. it does not make it go faster. (I am refreshing)',pt:'para de atualizar. não faz ir mais rápido. (eu tô atualizando)'},
 {en:'the Executive suits have lapels that actually fold correctly',pt:'os ternos dos Executive têm lapelas que dobram corretamente'},
 {en:'every collection says hand drawn. this one you can actually verify.',pt:'toda coleção diz feito à mão. essa aqui dá pra verificar.'},
 {en:'somebody bought the exact one I was watching. this is personal now.',pt:'alguém comprou exatamente o que eu tava olhando. agora é pessoal.'},
 {en:'the Fur rendering on the Monkey pieces is unreasonable for a pfp',pt:'a renderização do pelo nos Monkey é irracional pra uma pfp'},
 {en:'I am up. I will not be up tomorrow. I am enjoying today.',pt:'eu tô no lucro. não vou estar amanhã. tô aproveitando hoje.'},
 {en:'the Ronin scars are in a different place on every single one',pt:'as cicatrizes dos Ronin ficam num lugar diferente em cada um'},
 {en:'nothing happened today and that is also information',pt:'não aconteceu nada hoje e isso também é informação'},
 {en:'imagine being early and selling. couldnt be me. was me last week.',pt:'imagina chegar cedo e vender. não seria eu. fui eu semana passada.'},
 {en:'the Ghost ones fade out at the bottom and it never looks cheap',pt:'os Ghost desbotam embaixo e nunca fica barato'},
 {en:'my entry was bad, my conviction is good, we will see',pt:'minha entrada foi ruim, minha convicção é boa, vamos ver'},
 {en:'somebody in here has 200 of these and never says anything',pt:'tem alguém aqui com 200 desses que nunca fala nada'},
 {en:'the Vice neon actually glows against the dark backgrounds',pt:'o neon dos Vice brilha de verdade contra os fundos escuros'},
 {en:'came for the flip, stayed for the monsters',pt:'vim pelo flip, fiquei pelos monstros'},
 {en:'if you are reading this at 3am we are the same',pt:'se você tá lendo isso às 3 da manhã a gente é igual'}
];
const POST_FLEX=[
 {en:'pulled something I am not going to post yet',pt:'tirei uma coisa que eu não vou postar ainda'},
 {en:'four in a row. four.',pt:'quatro seguidos. quatro.'},
 {en:'up bad but the art is good',pt:'no prejuízo mas a arte é boa'},
 {en:'look at this thing. look at it.',pt:'olha essa coisa. olha só.'},
 {en:'I have been waiting all week for a pull like this',pt:'eu esperei a semana inteira por um assim'},
 {en:'not the rarest but easily my favorite',pt:'não é o mais raro mas é disparado meu favorito'},
 {en:'this one is going straight into the binder and never leaving',pt:'esse vai direto pro binder e não sai mais'},
 {en:'gas was brutal and it was worth every cent',pt:'o gás tava brutal e valeu cada centavo'},
 {en:'told myself one more mint. this is why.',pt:'falei pra mim mesmo mais um mint. é por isso.'},
 {en:'the trait combination on this is absurd',pt:'a combinação de traits desse é absurda'},
 {en:'first one of this race for me. small moment.',pt:'primeiro dessa raça pra mim. momentinho.'},
 {en:'I am not selling this. do not ask. people will ask.',pt:'eu não vou vender esse. não perguntem. vão perguntar.'},
 {en:'been hunting this race for days and it finally showed up',pt:'tava caçando essa raça faz dias e finalmente apareceu'},
 {en:'sniped this off the floor and I feel like a criminal',pt:'peguei esse do floor e me sinto um criminoso'},
 {en:'this is the one. the rest were practice.',pt:'é esse. os outros foram treino.'},
 {en:'my hands were shaking during the reveal and I am an adult',pt:'minhas mãos tremeram no reveal e eu sou adulto'},
 {en:'somebody offered me 3x already and I said no',pt:'já me ofereceram 3x e eu disse não'},
 {en:'the background on this one alone was worth the mint',pt:'só o fundo desse já valeu o mint'},
 {en:'page complete. one race. fifteen slots. done.',pt:'página completa. uma raça. quinze espaços. feito.'},
 {en:'I will be posting this again tomorrow. warning you now.',pt:'eu vou postar isso de novo amanhã. já tô avisando.'},
 /* Eram 20 legendas de foto. Num dia de 'viral' com hype alto a foto e um
    quinto do feed (~30 em tres dias), e a regra agora e "nada se repete em
    tres dias" — 20 secava no segundo dia e a foto sumia. Mais 16 abaixo. */
 {en:'no thoughts. just this one.',pt:'sem pensamentos. só esse.'},
 {en:'the eyes on this one follow you. I checked.',pt:'os olhos desse te seguem. eu conferi.'},
 {en:'minted at 2am and this is what 2am gives you',pt:'mintei às 2 da manhã e é isso que as 2 da manhã te dão'},
 {en:'okay this one changed my floor opinion',pt:'ok esse aqui mudou minha opinião sobre o floor'},
 {en:'I have nine of these and this is the one I would keep in a fire',pt:'tenho nove desses e esse é o que eu salvaria num incêndio'},
 {en:'the background on this is a whole afternoon',pt:'o fundo desse é uma tarde inteira'},
 {en:'not posting the traits. figure it out.',pt:'não vou postar os traits. descobre.'},
 {en:'came for a common and got this. thanks machine.',pt:'vim atrás de um comum e veio isso. valeu máquina.'},
 {en:'this one has a face I recognise from somewhere. concerning.',pt:'esse tem uma cara que eu reconheço de algum lugar. preocupante.'},
 {en:'listed it. unlisted it. it stays.',pt:'listei. deslistei. fica.'},
 {en:'my best pull and I am telling exactly one group chat',pt:'meu melhor pull e eu tô contando pra exatamente um grupo'},
 {en:'this is the one I show people who ask what I do all day',pt:'esse é o que eu mostro pra quem pergunta o que eu faço o dia todo'},
 {en:'the hat. I just need to talk about the hat.',pt:'o chapéu. eu só preciso falar do chapéu.'},
 {en:'got outbid on one and then pulled this. the universe apologised.',pt:'perdi um lance e aí veio esse. o universo pediu desculpa.'},
 {en:'small one. tired one. mine.',pt:'pequeno. cansado. meu.'},
 {en:'the reveal froze for a second and I saw my life flash by. then this.',pt:'o reveal travou um segundo e eu vi minha vida passar. aí veio isso.'}
];
const POST_FUD=[
 {en:'this is going to zero and you all know it',pt:'isso vai pra zero e vocês sabem'},
 {en:'no roadmap, no team, no utility. discuss.',pt:'sem roadmap, sem time, sem utilidade. discutam.'},
 {en:'holders here are the exit liquidity, sorry',pt:'os holders aqui são a liquidez de saída, foi mal'},
 {en:'the floor is held up by like four people',pt:'o floor tá de pé por causa de umas quatro pessoas'},
 {en:'volume is fake and half of you know it',pt:'o volume é falso e metade de vocês sabe'},
 {en:'the art is fine. the price is not. those are different things.',pt:'a arte é boa. o preço não. são coisas diferentes.'},
 {en:'every collection looks hand drawn until you zoom in',pt:'toda coleção parece feita à mão até você dar zoom'},
 {en:'name one thing that happened this week. one.',pt:'cita uma coisa que aconteceu essa semana. uma.'},
 {en:'you are not early. you are late and coping.',pt:'você não chegou cedo. você chegou tarde e tá lidando.'},
 {en:'I have seen this exact chart shape before and it did not end well',pt:'eu já vi exatamente esse formato de gráfico antes e não acabou bem'},
 {en:'the people telling you to hold are the ones who need you to hold',pt:'quem te manda segurar é quem precisa que você segure'},
 {en:'supply is not scarcity. 8888 is a lot of monsters.',pt:'supply não é escassez. 8888 é muito monstro.'},
 {en:'good art, bad market. it happens constantly.',pt:'arte boa, mercado ruim. acontece o tempo todo.'},
 {en:'the silence in here when it drops says everything',pt:'o silêncio aqui quando cai diz tudo'},
 {en:'wait for the unlock. you will see what I mean.',pt:'espera o unlock. você vai ver o que eu digo.'},
 /* eram 15: com hype baixo e dia longo o azedo posta ~9 FUDs em tres dias,
    e a janela de tres dias precisa de folga. Mais 8. */
 {en:'the floor went up because two people bought. that is not a market.',pt:'o floor subiu porque duas pessoas compraram. isso não é mercado.'},
 {en:'ask yourself who is buying at this hour and why',pt:'se pergunta quem tá comprando a essa hora e por quê'},
 {en:'nice drawings. that is where my compliments end.',pt:'desenhos bonitos. meus elogios acabam aí.'},
 {en:'the chart looks like every chart that ended badly',pt:'o gráfico parece todo gráfico que acabou mal'},
 {en:'mint out is not a plan. what happens after.',pt:'mintout não é plano. o que acontece depois.'},
 {en:'everyone in here is a holder until the first red day',pt:'todo mundo aqui é holder até o primeiro dia vermelho'},
 {en:'I will be here to say I told you so. I do not enjoy it.',pt:'eu vou estar aqui pra dizer que avisei. não é por prazer.'},
 {en:'the quiet ones already sold. you are talking to the ones who could not.',pt:'os quietos já venderam. você tá falando com os que não conseguiram.'}
];

/* ---------- o que a arte REALMENTE tem ----------
   Sao bustos chibi: cabeca grande, olhos enormes, do peito pra cima. Fundo
   e cena inteira. NAO tem mao aparecendo em lugar nenhum — piada sobre mao
   aqui e piada de quem nunca abriu a colecao. */
const POST_ART=[
 {en:'the head is like 40% of the whole piece and it somehow works',pt:'a cabeça é tipo 40% da peça inteira e de alguma forma funciona'},
 {en:'the eyes carry every single one of these. everything else is support.',pt:'os olhos carregam cada um desses. o resto é coadjuvante.'},
 {en:'just found one with a mugshot background. height ruler and everything.',pt:'achei um com fundo de ficha policial. régua de altura e tudo.'},
 {en:'there is one wearing a slice of cheese as a hat and I need it',pt:'tem um usando uma fatia de queijo como chapéu e eu preciso dele'},
 {en:'somebody drew a whole barbed wire fence for a background nobody zooms into',pt:'alguém desenhou uma cerca de arame inteira num fundo que ninguém dá zoom'},
 {en:'the red party cup shows up in like nine of these and it always kills me',pt:'o copo vermelho de festa aparece em uns nove desses e sempre me mata'},
 {en:'the cat hood with the little ears. that is it. that is my whole thesis.',pt:'o capuz de gato com as orelhinhas. é isso. é essa a minha tese inteira.'},
 {en:'one of them is in a supermarket aisle. groceries and all. why. I love it.',pt:'um deles tá num corredor de supermercado. compras e tudo. por quê. eu amo.'},
 {en:'the pink fluffy hat one looks personally offended to be wearing it',pt:'o do gorro rosa peludo parece pessoalmente ofendido de estar usando aquilo'},
 {en:'the lab coat ones look like they are about to explain something to me',pt:'os de jaleco parecem que vão me explicar alguma coisa'},
 {en:'the ones with a cig in the mouth have a completely different energy',pt:'os com cigarro na boca têm uma energia completamente diferente'},
 {en:'eye bags are a trait. somebody sat down and drew tired.',pt:'olheira é um trait. alguém sentou e desenhou cansaço.'},
 {en:'the buddy trait is the best one. a tiny bird just standing there. no reason.',pt:'o trait de buddy é o melhor. um passarinho ali parado. sem motivo.'},
 {en:'the mecha ones have visor glare and the human ones do not. attention to detail.',pt:'os mecha têm reflexo no visor e os humanos não. isso é atenção.'},
 {en:'the desert backgrounds have actual cacti at different distances',pt:'os fundos de deserto têm cactos de verdade em distâncias diferentes'},
 {en:'you can tell the mouth was drawn last on every one of these',pt:'dá pra ver que a boca foi desenhada por último em cada um desses'},
 {en:'the hair silhouettes alone tell you the race before you read anything',pt:'só a silhueta do cabelo já te diz a raça antes de você ler qualquer coisa'},
 {en:'the wings are drawn behind the shoulders, not pasted on. small thing. big thing.',pt:'as asas são desenhadas atrás dos ombros, não coladas por cima. detalhe pequeno. detalhe enorme.'},
 {en:'the scar traits sit differently on every face shape. somebody redrew them.',pt:'as cicatrizes ficam em lugares diferentes em cada formato de rosto. alguém redesenhou.'},
 {en:'the ones with a helmet covering the whole face still manage to look annoyed',pt:'os com capacete cobrindo o rosto inteiro ainda conseguem parecer irritados'},
 {en:'the aura traits glow OUTWARD. it is not a circle behind the head.',pt:'as auras brilham PRA FORA. não é um círculo atrás da cabeça.'},
 {en:'somebody is holding a katana behind their shoulder like it weighs nothing',pt:'alguém tá com uma katana atrás do ombro como se não pesasse nada'},
 {en:'the tone variants are not filters. the shading is redone for each one.',pt:'as variações de tom não são filtro. o sombreado é refeito em cada uma.'},
 {en:'I like that the sad ones look genuinely sad and not cute-sad',pt:'eu gosto que os tristes parecem tristes de verdade, não fofo-triste'},
 {en:'the fur rendering on the animal ones is unreasonable for something this small',pt:'a renderização de pelo nos bichos é irracional pra uma coisa desse tamanho'},
 {en:'the overlay traits put a TV frame over the whole thing. bold choice. it works.',pt:'os overlays põem uma moldura de TV por cima de tudo. escolha ousada. funciona.'},
 {en:'the vampires have a specific red that does not show up anywhere else',pt:'os vampiros têm um vermelho específico que não aparece em nenhum outro lugar'},
 {en:'you can see the brush pressure on the hair strands if you get close',pt:'dá pra ver a pressão do pincel nos fios de cabelo se você chegar perto'},
 {en:'the halos are not perfect circles and that is the correct decision',pt:'as auréolas não são círculos perfeitos e essa é a decisão certa'},
 {en:'the ones with stitched mouths should not be as charming as they are',pt:'os de boca costurada não deveriam ser tão charmosos quanto são'},
 {en:'every single background is a different place. not a palette. a place.',pt:'cada fundo é um lugar diferente. não uma paleta. um lugar.'},
 {en:'the tiny robot buddy has its own little face. its own. little. face.',pt:'o robozinho de buddy tem a carinha dele. dele. carinha. própria.'},
 {en:'the sunglasses ones reflect the background. I only noticed today.',pt:'os de óculos escuros refletem o fundo. eu só reparei hoje.'},
 {en:'the moth wings are dusty and translucent and I am not okay',pt:'as asas de mariposa são empoeiradas e translúcidas e eu não tô bem'},
 {en:'some of these are just a guy. a normal guy. and it is the best one.',pt:'alguns desses são só um cara. um cara normal. e é o melhor de todos.'}
];

/* ---------- gente sendo gente ----------
   Server nao e so mercado. Metade do que rola num chat de verdade nao tem
   nada a ver com o motivo do chat existir. */
const POST_LIFE=[
 {en:'my cat walked across the keyboard and bought something. we will see.',pt:'meu gato andou no teclado e comprou alguma coisa. vamos ver.'},
 {en:'it is 4am and I am eating cereal standing up. anyway',pt:'são 4 da manhã e eu tô comendo cereal em pé. enfim'},
 {en:'my landlord raised the rent so I am going to be very quiet this month',pt:'meu senhorio aumentou o aluguel então eu vou ficar bem quietinho esse mês'},
 {en:'does anybody else eat the same lunch every single day or is that a me thing',pt:'mais alguém almoça a mesma coisa todo santo dia ou é coisa minha'},
 {en:'my headphones died mid-song and I finished it out loud like an animal',pt:'meu fone morreu no meio da música e eu terminei em voz alta como um animal'},
 {en:'I have three unread messages from my dentist and I will not be opening them',pt:'tenho três mensagens não lidas do meu dentista e eu não vou abrir'},
 {en:'the bus was late so I walked. thirty minutes. I saw a heron.',pt:'o ônibus atrasou então eu fui a pé. trinta minutos. eu vi uma garça.'},
 {en:'somebody in my building is learning trumpet. day nineteen.',pt:'alguém no meu prédio tá aprendendo trompete. dia dezenove.'},
 {en:'made soup. too much soup. soup for four days.',pt:'fiz sopa. sopa demais. sopa pra quatro dias.'},
 {en:'I have been putting off a haircut for so long it is becoming a hairstyle',pt:'eu tô adiando o corte de cabelo faz tanto tempo que virou penteado'},
 {en:'my chair broke. I am sitting on a stack of books. it is fine.',pt:'minha cadeira quebrou. tô sentado numa pilha de livros. tá tudo bem.'},
 {en:'went to bed early. woke up at 2am. incredible system.',pt:'fui dormir cedo. acordei às 2 da manhã. sistema incrível.'},
 {en:'my brother asked what I do all day and I could not answer in one sentence',pt:'meu irmão perguntou o que eu faço o dia todo e eu não consegui responder numa frase'},
 {en:'I bought a plant. the plant is fine. this is a big update for me.',pt:'comprei uma planta. a planta tá bem. isso é uma grande atualização pra mim.'},
 {en:'do not talk to me until my coffee and also after, I am busy',pt:'não fala comigo antes do café e depois também, tô ocupado'},
 {en:'found a receipt from 2019 in a jacket. I was a different man.',pt:'achei um recibo de 2019 num casaco. eu era outro homem.'},
 {en:'the store was out of the good bread. entire day recalibrated.',pt:'acabou o pão bom no mercado. dia inteiro recalibrado.'},
 {en:'I laughed at my own message before sending it. that is a bad sign right',pt:'eu ri da minha própria mensagem antes de mandar. isso é mau sinal né'},
 {en:'somebody parked across my driveway and I have chosen violence (a note)',pt:'alguém estacionou na frente da minha garagem e eu escolhi a violência (um bilhete)'},
 {en:'it rained for six days and today the sun came out and I did not go outside',pt:'choveu seis dias e hoje o sol apareceu e eu não saí de casa'},
 {en:'my phone autocorrected something into a war crime. apologies to my aunt.',pt:'meu celular corrigiu uma coisa pra um crime de guerra. desculpas à minha tia.'},
 {en:'I reheated the same coffee three times. it is a relationship now.',pt:'esquentei o mesmo café três vezes. já é um relacionamento.'},
 {en:'my mother called and I answered on video by accident. she was thrilled.',pt:'minha mãe ligou e eu atendi em vídeo sem querer. ela ficou radiante.'},
 {en:'trying to be a morning person. day one. it is 11:40am.',pt:'tentando ser uma pessoa matinal. dia um. são 11h40.'},
 {en:'why do I own four identical black shirts and no clean ones',pt:'por que eu tenho quatro camisetas pretas idênticas e nenhuma limpa'},
 {en:'I have not seen the sun in a way that a doctor would approve of',pt:'eu não vejo o sol de um jeito que um médico aprovaria'},
 {en:'ordered food. cancelled it. ordered it again. same restaurant. same food.',pt:'pedi comida. cancelei. pedi de novo. mesmo restaurante. mesma comida.'},
 {en:'my neighbour waved at me and I panicked and waved with both arms',pt:'meu vizinho acenou pra mim e eu entrei em pânico e acenei com os dois braços'},
 {en:'genuinely believe the second week of a month does not exist',pt:'eu acredito sinceramente que a segunda semana do mês não existe'},
 {en:'washed a mug I have been using for eight days. felt like a promotion.',pt:'lavei uma caneca que eu usava há oito dias. me senti promovido.'},
 {en:'my friend got a real job and now talks about mortgage rates. we lost him.',pt:'meu amigo arrumou um emprego de verdade e agora fala de taxa de financiamento. perdemos ele.'},
 {en:'stared at the ceiling for twenty minutes. productive.',pt:'encarei o teto por vinte minutos. produtivo.'},
 {en:'the pen I liked ran out and no other pen is correct',pt:'a caneta que eu gostava acabou e nenhuma outra caneta serve'},
 {en:'my sleep schedule is not a schedule, it is a rumour',pt:'meu horário de sono não é um horário, é um boato'},
 {en:'I am the person who says we should meet up and then never follows up. sorry.',pt:'eu sou a pessoa que diz vamos marcar e nunca marca. desculpa.'},
 {en:'convinced the microwave is running slightly fast to spite me',pt:'convencido de que o micro-ondas anda um pouco rápido só pra me irritar'},
 {en:'someone at work said good morning and I said you too. we do not speak now.',pt:'alguém no trabalho disse bom dia e eu disse pra você também. a gente não se fala mais.'},
 {en:'my grandmother sends me photos of her flowers every day and it is the best part',pt:'minha avó me manda foto das flores dela todo dia e é a melhor parte'},
 {en:'the dog has been staring at the wall for ten minutes. I checked. nothing there.',pt:'o cachorro tá encarando a parede há dez minutos. eu conferi. não tem nada.'},
 {en:'I bought noise cancelling headphones to hear nothing and now I hear my thoughts',pt:'comprei fone com cancelamento pra não ouvir nada e agora eu ouço meus pensamentos'},
 {en:'made a to-do list. lost the list. made a list to find the list.',pt:'fiz uma lista de tarefas. perdi a lista. fiz uma lista pra achar a lista.'},
 {en:'watched a forty minute video about a bridge collapse. I do not build bridges.',pt:'assisti quarenta minutos sobre um desabamento de ponte. eu não construo pontes.'},
 {en:'my keyboard is loud and my roommate has said nothing which is worse',pt:'meu teclado é barulhento e meu colega de quarto não falou nada, o que é pior'},
 {en:'told myself I would sleep after this. this has been going for two hours.',pt:'falei que ia dormir depois disso. isso já tá indo há duas horas.'},
 {en:'somebody left a whole cake in the office kitchen. no note. I am suspicious and full.',pt:'alguém deixou um bolo inteiro na cozinha do escritório. sem bilhete. tô desconfiado e cheio.'},
 {en:'my printer works. I am not touching anything. nobody move.',pt:'minha impressora funcionou. não tô mexendo em nada. ninguém se mexa.'},
 {en:'realised I have been humming the same four notes since Tuesday',pt:'percebi que eu tô cantarolando as mesmas quatro notas desde terça'},
 {en:'went to reply to a message from three weeks ago. it is too late. it is forever now.',pt:'fui responder uma mensagem de três semanas atrás. é tarde. agora é pra sempre.'},
 {en:'the elevator in my building plays one song. one. I know it now. we all do.',pt:'o elevador do meu prédio toca uma música. uma. eu sei ela agora. todos sabemos.'},
 {en:'my keys were in my hand while I looked for my keys',pt:'minha chave tava na minha mão enquanto eu procurava minha chave'},
 {en:'I described a movie plot so badly my friend watched a different film',pt:'descrevi o enredo de um filme tão mal que meu amigo assistiu outro filme'},
 {en:'starting to think the gym membership is just a monthly donation',pt:'começando a achar que a mensalidade da academia é só uma doação mensal'},
 {en:'the wifi is fine everywhere except the one chair I like',pt:'o wifi funciona em tudo menos na única cadeira que eu gosto'},
 {en:'somebody explain why every hotel pillow is either a brick or a rumour of a pillow',pt:'alguém explica por que todo travesseiro de hotel é ou um tijolo ou o boato de um travesseiro'},
 {en:'I am not tired I am just horizontal by preference',pt:'eu não tô cansado eu só sou horizontal por preferência'},
 {en:'day four of the leftovers. we are in the endgame now.',pt:'dia quatro das sobras. estamos no fim dos tempos.'},
 {en:'saw a bird do something clever and thought about it for the rest of the day',pt:'vi um passarinho fazer algo esperto e pensei nisso o resto do dia'},
 {en:'my browser has 60 tabs and I am afraid of all of them equally',pt:'meu navegador tem 60 abas e eu tenho medo de todas igualmente'},
 {en:'apparently you are supposed to change the water filter. news to me.',pt:'aparentemente você tem que trocar o filtro de água. novidade pra mim.'},
 {en:'I have a favourite spoon and I will not be elaborating',pt:'eu tenho uma colher favorita e eu não vou detalhar'},
 {en:'thought about going out. remembered people are there. staying in.',pt:'pensei em sair. lembrei que tem gente lá. vou ficar.'},
 {en:'my resolution was to read more so I have bought eleven books and read none',pt:'minha meta era ler mais então eu comprei onze livros e não li nenhum'},
 {en:'the smoke alarm chirped once at 3am and has been silent since. it is toying with me.',pt:'o alarme de fumaça apitou uma vez às 3 da manhã e ficou mudo desde então. tá brincando comigo.'},
 {en:'somebody said good luck and I said you too before they even did anything',pt:'alguém disse boa sorte e eu disse pra você também antes da pessoa fazer nada'},
 {en:'been meaning to fix that. for a year. it is part of the room now.',pt:'tô pra consertar aquilo. faz um ano. já faz parte do cômodo.'},
 {en:'I do not trust a fridge that does not hum a little',pt:'eu não confio numa geladeira que não zumbe um pouquinho'},
 {en:'took the long way home for no reason and it was the right call',pt:'peguei o caminho longo pra casa sem motivo e foi a escolha certa'},
 {en:'my back hurts and I am at the age where I say that out loud now',pt:'minhas costas doem e eu tô na idade em que eu falo isso em voz alta'},
 {en:'wrote a whole message. read it back. deleted it. sent a thumbs up.',pt:'escrevi uma mensagem inteira. reli. apaguei. mandei um joinha.'},
 {en:'the good chip flavour was discontinued and nobody has apologised to me',pt:'o sabor bom de salgadinho foi descontinuado e ninguém pediu desculpa pra mim'},
 {en:'my houseplant is thriving and I have done nothing. I am afraid of it.',pt:'minha planta tá prosperando e eu não fiz nada. eu tenho medo dela.'},
 {en:'fell asleep with the light on and dreamt I was awake. rude.',pt:'dormi com a luz acesa e sonhei que tava acordado. sem noção.'}
];

/* ---------- os memes da comunidade ----------
   Escritos pelo Kiv. Cada um tem o peso de like que ele definiu (l), e alguns
   sao pra rir (f) ou pra irritar (d). Sao piada interna: nao traduzir, gente
   nao traduz meme dentro do proprio server. */
const MEMES=[
 {t:'Ina can I have $5',l:2},
 {t:"I'm team boat",l:3},
 {t:'The green wizard is our saviour',l:3},
 {t:'Janklerz4life',l:2},
 {t:'WizardGange',l:1},
 {t:'dont ever address me in a threating manner you little fuck you have no idea what i am, have some respect and keep your mouth',l:4,f:5},
 {t:'Shout out to Kiki',l:2},
 {t:'Wheres Golo',l:1},
 {t:'I LOVE KEMONOKAKI!!!!!!!!!!!!!!!!',l:2},
 {t:'Til I Kaki',l:2},
 {t:'Love that guy with hammer.',l:1},
 {t:'Bom Dia ❤️',l:2},
 {t:'Bom Dia!',l:2},
 {t:'Bom Dia chat',l:1},
 {t:'Nft Bottom Pokemon on Top',l:2},
 {t:"I'm team gas station",l:2},
 {t:'New ina art just dropped',l:2},
 {t:'flabberghasted',l:2},
 {t:'whats a melio',l:1},
 {t:'im green apple wizard gange',l:3},
 {t:'I have a theory. First we had the Green Wizard and he was one of the most mysterious one, and now we are on the RobinHood chain. Like, what did he knows.',l:5,f:2},
 {t:'Can I talk to the team?',d:2},
 {t:'GM',d:3},
 {t:'Jumón minted out again',l:2},
 {t:'I ❤️ H8!!!!',l:2},
 {t:'sbbu the goat',l:1},
 {t:'I love Stuxneet',l:3},
 {t:'wheres stux.',l:2},
 {t:'Sotepom pom',l:1},
 {t:'I miss 64 Creatures',l:1},
 {t:'65 Creatures when',l:1},
 {t:'67!!!!!!',l:2},
 {t:'I am interested in the new kekokaki thing',l:3},
 {t:'Where are the mods in this animal sanctuary?',l:4,f:3},
 {t:'I just peed myself.',l:6,f:5},
 {t:"I cant believe we're going to have Kaijukaki in GTA 6.",l:1},
 {t:'Tummy full of soup.',l:1},
 {t:'Does my kaiju have feets? where is the rest of their bodies?',l:1,f:1},
 {t:'WHEN KAKIZONE',l:1},
 {t:'Trading Pokémon Cards for Kaijukakis, DM.',l:1},
 {t:'I love Kittykaki. With all my heart.',l:2},
 {t:'Kaijukaki to 1 ETH !!!',l:6},
 {t:'Just Minted 15. Not a single Kaiju. Fuck this man.',l:1,f:3},
 {t:'Trading a Cat for a Wraith, DM.',l:1},
 {t:'whats a oekaki',l:1},
 {t:"how they made all these traits? I'm calling this AI.",d:3},
 {t:'0.3 Eth gone from my Kaijukaki... why...',f:5}
];

/* alguem deixando dinheiro no feed */
const GIFT_LINES=[
 {en:'made a bit on a flip. first {0} to reply gets it. no strings.',pt:'lucrei num flip. os primeiros {0} pra quem responder. sem pegadinha.'},
 {en:'dropping {0} for whoever is still awake. yes really.',pt:'largando {0} pra quem ainda tiver acordado. sim, de verdade.'},
 {en:'someone helped me when I started. paying it forward: {0}.',pt:'alguém me ajudou quando eu comecei. passando pra frente: {0}.'},
 {en:'{0} for the next person who reads this. do not overthink it.',pt:'{0} pra próxima pessoa que ler isso. não pensa demais.'},
 {en:'my Kaiju sold. {0} to the community. go on.',pt:'meu Kaiju vendeu. {0} pra comunidade. vai lá.'},
 {en:'birthday today. giving away {0} instead of asking for anything.',pt:'aniversário hoje. dando {0} em vez de pedir alguma coisa.'}
];
const ANON_GOOD=[
 {k:'praise', en:'been drawing 12 years. this is hand-drawn, I can tell. carry on.',
              pt:'desenho há 12 anos. isso é feito à mão, dá pra ver. continuem.'},
 {k:'tip',    en:'my brother works at the exchange. tomorrow is going to be interesting.',
              pt:'meu irmão trabalha na corretora. amanhã vai ser interessante.'},
 {k:'praise', en:'the trait rarity here is actually honest. that is rare.',
              pt:'a raridade dos traits aqui é honesta de verdade. isso é raro.'},
 /* eram 3+3 pra ate 2 anonimos por dia: em tres dias o pool inteiro saia e
    a regra de tres dias calava o anonimo no terceiro dia. Mais 2 de cada. */
 {k:'praise', en:'I moderate a bigger server than this. this one is healthier. do not tell them.',
              pt:'eu modero um server maior que esse. esse aqui é mais saudável. não conta pra eles.'},
 {k:'praise', en:'I quit this hobby twice. the drawings brought me back. that is all.',
              pt:'larguei esse hobby duas vezes. os desenhos me trouxeram de volta. é só isso.'}
];
const ANON_BAD=[
 {k:'fud',  en:'I know the team. I would not hold this. that is all I will say.',
            pt:'eu conheço o time. eu não seguraria isso. é só o que eu vou dizer.'},
 {k:'fud',  en:'somebody is about to dump and it is not going to be pretty',
            pt:'alguém vai despejar e não vai ser bonito'},
 {k:'scam', en:'MINT IS LIVE ON THE MIRROR SITE, ONLY 200 LEFT >> click',
            pt:'O MINT ABRIU NO SITE ESPELHO, SÓ FALTAM 200 >> clique'},
 {k:'fud',  en:'a wallet with 300 of these moved to an exchange an hour ago. do what you want with that.',
            pt:'uma carteira com 300 desses mandou tudo pra uma corretora uma hora atrás. faz o que quiser com isso.'},
 {k:'scam', en:'AIRDROP FOR HOLDERS, VERIFY YOUR WALLET BEFORE MIDNIGHT >> link',
            pt:'AIRDROP PRA HOLDERS, VERIFICA SUA CARTEIRA ANTES DA MEIA-NOITE >> link'}
];
const DM_LINES={
 hello:[{en:'hey. you have been minting a lot. respect.',pt:'e aí. você tá mintando muito. respeito.'},
        {en:'is it just me or is the floor holding better than last week',pt:'é impressão minha ou o floor tá segurando melhor que semana passada'}],
 dump: [{en:'saw you list 30 at once. what are you doing to us',pt:'te vi listar 30 de uma vez. o que você tá fazendo com a gente'},
        {en:'you know the floor is not a garbage can right',pt:'você sabe que o floor não é lixeira né'}],
 fair: [{en:'you bought above floor. not many people do that. noted.',pt:'você comprou acima do floor. pouca gente faz isso. anotado.'},
        {en:'thanks for not dumping. seriously.',pt:'valeu por não despejar. sério.'}],
 offer:[{en:'I want that one. name is on the offer.',pt:'eu quero aquele. o nome tá na oferta.'},
        {en:'私 want it. I will pay above floor, quietly.',pt:'eu quero. pago acima do floor, na surdina.'}],
 race: [{en:'you have a {r}. I collect {r}. this is not a coincidence, this is my life.',
         pt:'você tem um {r}. eu coleciono {r}. isso não é coincidência, é a minha vida.'},
        {en:'name your price on the {r}. I am serious and I am not well.',
         pt:'faz teu preço no {r}. tô falando sério e não tô bem.'}]
};
