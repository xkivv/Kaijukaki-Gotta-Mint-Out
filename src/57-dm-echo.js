/* ================= O ECO DA DM NO KAKI+ =================
   A DM é um quarto fechado: você fala com uma pessoa e ninguém vê. Isso é
   confortável demais. Um lugar pequeno tem plateia — a pessoa com quem você foi
   grosseiro vai reclamar de você em público, e alguém que nem estava lá vai
   comentar. É isso que este arquivo faz.

   TRÊS REGRAS QUE SEGURAM A COISA TODA:

   1) ATRASO. 55-dm.js empilha os eventos em S.evq com a hora absoluta. Aqui a
      gente AGENDA e publica horas depois, nunca no mesmo tick. Post instantâneo
      faz parecer que a comunidade tem câmera na tela do jogador. Fofoca ruim
      viaja mais rápido que elogio — está nas faixas d:[min,max] de cada tipo.

   2) NEM TUDO VIRA POST. Cada tipo tem sua chance, e o dia tem um teto de 2 a 4
      ecos que anda junto com o ritmo do feed (postsPerHour). O Kaki+ tem vida
      própria: a fofoca sobre o jogador é tempero, não o prato.

   3) QUEM FALA QUASE NUNCA É QUEM VIVEU. Metade da graça é o terceiro: alguém
      que não estava lá perguntando "mais alguém teve problema com fulano". Por
      isso cada evento tem duas listas — s (a pessoa envolvida) e t (terceiro) —
      e ainda existe a segunda leva, o comentário em cima do comentário.

   Tudo o que este arquivo guarda mora dentro de G.social, que já vai inteiro
   pro save. Save antigo não tem nenhum destes campos: echS() cria todos. */

/* quanto tempo a fofoca espera, quanto ela move, e como as pessoas falam dela.
     pol  polaridade: decide se o cartão é FUD (dá pra responder) ou conversa
     ch   chance de virar post
     d    atraso em horas [min,max]
     hy   empurrão no hype    rp  empurrão na reputação
     s    fala de quem viveu a cena (usa {you})
     t    fala de terceiro    (usa {who} e {you}) */
const ECHO={

/* ---- negócio ---- */
sold:{pol:1,ch:0.40,d:[3,8],hy:0.9,rp:0.3,art:1,
 s:[{en:'bought one off {you} in dms. clean, no games.',pt:'comprei um do {you} na dm. limpo, sem jogo.'},
    {en:'that was painless. {you} named a price and kept it.',pt:'foi indolor. o {you} falou o preço e manteve.'},
    {en:'got mine from {you}. still looking at it.',pt:'peguei o meu com o {you}. ainda tô olhando pra ele.'},
    {en:'paid {v} to {you} and I would do it again',pt:'paguei {v} pro {you} e faria de novo'}],
 t:[{en:'{who} says {you} actually answers dms. rare.',pt:'{who} falou que o {you} responde dm de verdade. raro.'},
    {en:'apparently {you} sold {who} one without three days of haggling',pt:'parece que o {you} vendeu um pro {who} sem três dias de pechincha'},
    {en:'if {you} is selling I want to know before {who} does',pt:'se o {you} tá vendendo eu quero saber antes do {who}'},
    {en:'so {who} got one and I got a read receipt. cool.',pt:'então o {who} pegou um e eu peguei visualizado. legal.'}]},

walked:{pol:-1,ch:0.35,d:[3,7],hy:-0.5,rp:-0.2,
 s:[{en:'walked away from {you} today. the price kept moving.',pt:'saí fora do {you} hoje. o preço não parava de mexer.'},
    {en:'I had the money ready. {you} wanted more. fine.',pt:'eu tava com o dinheiro na mão. o {you} quis mais. beleza.'},
    {en:'not paying that. {you} can keep it.',pt:'não pago isso. o {you} que fique com ele.'}],
 t:[{en:'{who} says {you} squeezes. I say that is a seller doing seller things.',pt:'o {who} diz que o {you} aperta. eu digo que é vendedor sendo vendedor.'},
    {en:'heard {you} pushed {who} off the table. bold with this floor.',pt:'ouvi que o {you} empurrou o {who} pra fora da mesa. corajoso com esse floor.'},
    {en:'the {you} and {who} thing was over about eight dollars was it not',pt:'essa treta do {you} com o {who} foi por uns oito dólares né'},
    {en:'holding out is free until it is not',pt:'segurar é de graça até não ser'}]},

traded:{pol:1,ch:0.50,d:[4,9],hy:0.7,rp:0.4,art:2,
 s:[{en:'traded with {you}. I got {kj} and I am not doing better than that today.',pt:'troquei com o {you}. peguei o {kj} e hoje eu não faço melhor que isso.'},
    {en:'clean swap with {you}. no cash, no crying.',pt:'troca limpa com o {you}. sem grana, sem choro.'},
    {en:'we both wanted what the other had. that never happens.',pt:'os dois queriam o que o outro tinha. isso nunca acontece.'}],
 t:[{en:'{who} and {you} actually swapped instead of arguing about floor. novel.',pt:'o {who} e o {you} trocaram de verdade em vez de discutir floor. inovador.'},
    {en:'trades are the only honest part of this hobby',pt:'troca é a única parte honesta desse hobby'},
    {en:'somebody swap with me. I have a very ugly one and a good attitude.',pt:'alguém troca comigo. eu tenho um bem feio e uma boa atitude.'},
    {en:'so {you} lets go of things. noted for later.',pt:'então o {you} solta as coisas. anotado pra depois.'}]},

tradeturned:{pol:0,ch:0.30,d:[4,10],hy:0,rp:0.1,
 s:[{en:'offered {you} a swap and got a polite no. it happens.',pt:'ofereci uma troca pro {you} e levei um não educado. acontece.'},
    {en:'they kept theirs. I would have kept mine too honestly.',pt:'ficou com o dele. eu também teria ficado com o meu sinceramente.'},
    {en:'no swap. no hard feelings. moving on.',pt:'sem troca. sem mágoa. seguindo.'}],
 t:[{en:'{you} turned {who} down. the attachment out here is real.',pt:'o {you} recusou o {who}. o apego aqui é real.'},
    {en:'refusing a swap is allowed. posting about it for two hours is also allowed.',pt:'recusar troca é permitido. postar sobre por duas horas também é.'},
    {en:'the ones you will not trade are the ones you actually collect',pt:'os que você não troca são os que você coleciona de verdade'},
    {en:'good. keep it. do not let this place talk you out of things.',pt:'ótimo. guarda. não deixa esse lugar te convencer de nada.'}]},

/* ---- postura ---- */
rude:{pol:-1,ch:0.55,d:[2,5],hy:-0.9,rp:-0.5,
 s:[{en:'asked {you} a normal question and got the door',pt:'fiz uma pergunta normal pro {you} e levei a porta na cara'},
    {en:'ok so {you} does not do small talk. noted.',pt:'beleza então o {you} não faz conversa fiada. anotado.'},
    {en:'I was polite. {you} was not. that is the whole story.',pt:'eu fui educado. o {you} não. a história é essa.'}],
 t:[{en:'anybody else had a problem with {you} or is it just {who}',pt:'mais alguém teve problema com o {you} ou é só o {who}'},
    {en:'{who} is not the first person to say that about {you}',pt:'o {who} não é a primeira pessoa a dizer isso do {you}'},
    {en:'reading {who} complain about {you} is my whole evening',pt:'ler o {who} reclamando do {you} é a minha noite inteira'},
    {en:'in fairness {you} probably had forty dms open',pt:'sendo justo o {you} devia ter quarenta dm abertas'}]},

kind:{pol:1,ch:0.26,d:[5,12],hy:0.5,rp:0.4,
 s:[{en:'{you} was decent to me in dms and I am telling everyone',pt:'o {you} foi gente boa comigo na dm e eu tô contando pra todo mundo'},
    {en:'small thing but {you} actually replied like a person',pt:'coisa pequena mas o {you} respondeu tipo uma pessoa'},
    {en:'ok {you} is alright. that is all I came to say.',pt:'beleza o {you} é de boa. era só isso que eu vim dizer.'}],
 t:[{en:'{who} will not shut up about {you} being nice. it is day four.',pt:'o {who} não para de falar que o {you} é gente boa. já é o quarto dia.'},
    {en:'nice to see somebody say something good about a stranger here',pt:'bom ver alguém falando bem de um estranho aqui'},
    {en:'noted that {you} treated {who} well. that costs nothing and it counts.',pt:'anotei que o {you} tratou bem o {who}. isso não custa nada e conta.'},
    {en:'we set the bar at answered politely and honestly that is fair',pt:'a régua aqui é respondeu com educação e sinceramente tá justo'}]},

feud:{pol:-1,ch:0.85,d:[2,4],hy:-1.6,rp:-1.2,
 s:[{en:'done with {you}. do not put us in the same thread.',pt:'cansei do {you}. não coloca a gente na mesma thread.'},
    {en:'me and {you} are finished. that is all anyone needs.',pt:'eu e o {you} acabou. é tudo que precisa saber.'},
    {en:'block list updated. one name.',pt:'lista de bloqueio atualizada. um nome.'}],
 t:[{en:'{who} and {you} are at war and I am here for exactly none of it',pt:'o {who} e o {you} tão em guerra e eu não vim pra nada disso'},
    {en:'can we not do this in the main feed',pt:'dá pra não fazer isso no feed principal'},
    {en:'muting both. love you both. mostly.',pt:'mutando os dois. amo os dois. mais ou menos.'},
    {en:'week three and we have a rivalry. this place is growing up.',pt:'terceira semana e já temos rivalidade. esse lugar tá crescendo.'}]},

accused:{pol:-1,ch:0.60,d:[2,5],hy:-1.0,rp:-0.7,
 s:[{en:'I said what I said about {you}. I am not editing it.',pt:'eu falei o que falei sobre o {you}. não vou editar.'},
    {en:'people keep asking me about {you}. ask {you}.',pt:'o pessoal fica me perguntando do {you}. pergunta pro {you}.'},
    {en:'still waiting on an answer from {you}, for the record',pt:'ainda esperando resposta do {you}, pro registro'}],
 t:[{en:'what exactly is {who} accusing {you} of. plain words please.',pt:'do que exatamente o {who} tá acusando o {you}. em português por favor.'},
    {en:'two people arguing and neither will post a screenshot. classic.',pt:'duas pessoas discutindo e nenhuma posta print. clássico.'},
    {en:'not picking a side until somebody shows something',pt:'não escolho lado até alguém mostrar alguma coisa'},
    {en:'the {who} and {you} thread is the most read thing here today',pt:'a treta do {who} com o {you} é a coisa mais lida daqui hoje'}]},

clearedname:{pol:1,ch:0.70,d:[3,7],hy:1.1,rp:0.9,
 s:[{en:'I was wrong about {you}. saying it here because I said the other thing here.',pt:'eu tava errado sobre o {you}. falando aqui porque eu falei a outra coisa aqui.'},
    {en:'checked it properly. {you} is clean. my fault.',pt:'checei direito. o {you} tá limpo. culpa minha.'},
    {en:'taking it back. it was not {you}.',pt:'voltando atrás. não era o {you}.'}],
 t:[{en:'so {who} took it back about {you}. that took more than most people have.',pt:'então o {who} voltou atrás sobre o {you}. isso é mais do que a maioria tem.'},
    {en:'somebody asked for proof instead of a mob. remember this day.',pt:'alguém pediu prova em vez de linchamento. guarda esse dia.'},
    {en:'retraction posted. nobody will read it. I read it.',pt:'retratação postada. ninguém vai ler. eu li.'},
    {en:'the accusation went further than the apology will. it always does.',pt:'a acusação foi mais longe do que o pedido de desculpa vai. sempre vai.'}]},

/* ---- dinheiro entre pessoas ---- */
helped:{pol:1,ch:0.60,d:[4,10],hy:0.8,rp:1.0,
 s:[{en:'{you} sent me {v} and asked nothing back. I am fine now.',pt:'o {you} me mandou {v} e não pediu nada em troca. tô bem agora.'},
    {en:'I asked around for help. one person answered. it was {you}.',pt:'eu pedi ajuda por aí. uma pessoa respondeu. foi o {you}.'},
    {en:'paying that back when I can. writing it here so I have to.',pt:'vou devolver quando der. tô escrevendo aqui pra ser obrigado.'}],
 t:[{en:'{who} says {you} covered them. that is the kind of thing I remember.',pt:'o {who} disse que o {you} cobriu ele. esse é o tipo de coisa que eu lembro.'},
    {en:'somebody gave {who} money and did not post about it. {who} posted about it.',pt:'alguém deu dinheiro pro {who} e não postou. o {who} postou.'},
    {en:'if {you} is handing out {v} I have a very sad story prepared',pt:'se o {you} tá dando {v} eu tenho uma história bem triste preparada'},
    {en:'this place is five people arguing and one person quietly paying rent',pt:'esse lugar é cinco pessoas brigando e uma pagando aluguel calada'}]},

tookgift:{pol:0,ch:0.30,d:[5,11],hy:0.2,rp:0.1,
 s:[{en:'gave {you} {v} because I wanted to. no strings. stop asking.',pt:'dei {v} pro {you} porque eu quis. sem condição. para de perguntar.'},
    {en:'sent {you} something small. they said thanks like they meant it.',pt:'mandei uma coisinha pro {you}. agradeceu como quem quis dizer.'},
    {en:'money is easier to give away than time. that is the trick.',pt:'dinheiro é mais fácil de dar que tempo. o truque é esse.'}],
 t:[{en:'so {who} is just giving {you} money now. what is the queue like.',pt:'então o {who} tá dando dinheiro pro {you} agora. como é que tá a fila.'},
    {en:'the {who} to {you} pipeline is the only economy I trust',pt:'o cano do {who} pro {you} é a única economia em que eu confio'},
    {en:'took it and said thank you. correct behaviour honestly.',pt:'aceitou e agradeceu. comportamento correto sinceramente.'},
    {en:'nobody has ever sent me anything and I have been here since the start',pt:'nunca me mandaram nada e eu tô aqui desde o começo'}]},

refusedgift:{pol:1,ch:0.45,d:[4,10],hy:0.3,rp:0.6,
 s:[{en:'tried to give {you} money and it came straight back',pt:'tentei dar dinheiro pro {you} e voltou na hora'},
    {en:'{you} refused. I do not know what to do with that.',pt:'o {you} recusou. não sei o que fazer com isso.'},
    {en:'sent it back with a whole speech. respect I guess.',pt:'devolveu com discurso e tudo. respeito, eu acho.'}],
 t:[{en:'{you} sent {who} money back. who does that.',pt:'o {you} devolveu o dinheiro pro {who}. quem faz isso.'},
    {en:'refusing free money is either principle or a very slow con',pt:'recusar dinheiro de graça ou é princípio ou é um golpe muito lento'},
    {en:'I would have taken it. I am saying that out loud.',pt:'eu teria pegado. tô falando isso em voz alta.'},
    {en:'good. we have one of those. every room needs one.',pt:'ótimo. temos um desses. toda sala precisa de um.'}]},

/* ---- segurança ---- */
warned:{pol:1,ch:0.45,d:[2,6],hy:0.6,rp:1.0,
 s:[{en:'my account was sending files. {you} told me before anyone else.',pt:'minha conta tava mandando arquivo. o {you} me avisou antes de todo mundo.'},
    {en:'changing my password. thanks {you}. sorry to whoever opened it.',pt:'trocando minha senha. valeu {you}. desculpa pra quem abriu.'},
    {en:'if you got a zip from me today, delete it. {you} caught it.',pt:'se você recebeu um zip meu hoje, apaga. o {you} pegou isso.'}],
 t:[{en:'heads up: {who} was compromised. {you} spotted it first.',pt:'aviso: a conta do {who} foi comprometida. o {you} viu primeiro.'},
    {en:'somebody warns people instead of laughing. new here?',pt:'alguém avisa em vez de rir. novo por aqui?'},
    {en:'do not open anything from {who} until they say so',pt:'não abre nada do {who} até ele mandar'},
    {en:'{you} gets one free rude comment from me for this',pt:'o {you} ganhou de mim um comentário grosseiro de graça por isso'}]},

savedseed:{pol:1,ch:0.70,d:[3,8],hy:1.0,rp:1.4,
 s:[{en:'I did something stupid and {you} told me to delete it instead of using it',pt:'eu fiz uma burrice e o {you} mandou apagar em vez de usar'},
    {en:'nothing happened to my wallet. that was luck and one honest person.',pt:'não aconteceu nada com a minha carteira. foi sorte e uma pessoa honesta.'},
    {en:'do not paste those words anywhere. not even to a friend. learned today.',pt:'não cola essas palavras em lugar nenhum. nem pra amigo. aprendi hoje.'}],
 t:[{en:'somebody had a whole wallet in their hands and gave it back. it was {you}.',pt:'alguém teve uma carteira inteira na mão e devolveu. foi o {you}.'},
    {en:'{who} got very lucky about who they messaged',pt:'o {who} teve muita sorte com quem ele mandou mensagem'},
    {en:'reminder that the words are the wallet. the words ARE the wallet.',pt:'lembrete de que as palavras são a carteira. as palavras SÃO a carteira.'},
    {en:'putting {you} on the short list of people I would trust with a key',pt:'botando o {you} na lista curta de gente em quem eu confiaria uma chave'}]},

stole:{pol:-1,ch:0.90,d:[2,5],hy:-2.4,rp:-1.5,
 s:[{en:'my wallet is empty. I know exactly who I sent those words to.',pt:'minha carteira tá vazia. eu sei exatamente pra quem eu mandei aquelas palavras.'},
    {en:'do not talk to {you}. that is all. do not talk to {you}.',pt:'não fala com o {you}. é isso. não fala com o {you}.'},
    {en:'I was an idiot and {you} was worse. both things are true.',pt:'eu fui idiota e o {you} foi pior. as duas coisas são verdade.'}],
 t:[{en:'{who} says {you} drained them. I want the other side and I am not hopeful.',pt:'o {who} diz que o {you} limpou ele. quero o outro lado e não tô otimista.'},
    {en:'if half of what {who} is saying about {you} is true, that is it for me',pt:'se metade do que o {who} tá dizendo do {you} for verdade, pra mim acabou'},
    {en:'blocking {you}. not waiting for the thread.',pt:'bloqueando o {you}. não vou esperar a treta.'},
    {en:'archiving this one. day noted. it goes in the file.',pt:'arquivando essa. dia anotado. vai pro arquivo.'}]},

virushit:{pol:-1,ch:0.55,d:[3,7],hy:-0.7,rp:-0.3,
 s:[{en:'sorry. that was not me sending it. {you} opened it and paid for my mistake.',pt:'desculpa. não era eu mandando aquilo. o {you} abriu e pagou pelo meu erro.'},
    {en:'told everyone to delete it. one person had already clicked.',pt:'mandei todo mundo apagar. uma pessoa já tinha clicado.'},
    {en:'{you} clicked it. I feel responsible and I am not, but still.',pt:'o {you} clicou. eu me sinto responsável e não sou, mas ainda assim.'}],
 t:[{en:'somebody opened the file. it was {you}. we have all been that person.',pt:'alguém abriu o arquivo. foi o {you}. todo mundo já foi essa pessoa.'},
    {en:'do not click zips. I am saying it again because {you} did.',pt:'não clica em zip. tô falando de novo porque o {you} clicou.'},
    {en:'{v} gone in one click. that is a whole week for some of us.',pt:'{v} embora num clique. isso é uma semana inteira pra alguns.'},
    {en:'the file was named like a wallpaper pack. of course it was.',pt:'o arquivo tinha nome de pacote de wallpaper. claro que tinha.'}]},

virusblocked:{pol:0,ch:0.35,d:[3,8],hy:0.1,rp:0.2,
 s:[{en:'the file did not get {you}. it got two other people.',pt:'o arquivo não pegou o {you}. pegou outras duas pessoas.'},
    {en:'apparently {you} has actual antivirus. in this economy.',pt:'parece que o {you} tem antivírus de verdade. nessa economia.'},
    {en:'one person opened it and walked away whole. good for them.',pt:'uma pessoa abriu e saiu inteira. bom pra ela.'}],
 t:[{en:'{you} clicked it and got saved by software. still counts as clicking it.',pt:'o {you} clicou e foi salvo pelo software. ainda conta como ter clicado.'},
    {en:'buy the antivirus. that is the post. ask {you}.',pt:'compra o antivírus. o post é esse. pergunta pro {you}.'},
    {en:'one of us survived that zip and it was not me',pt:'um de nós sobreviveu àquele zip e não fui eu'},
    {en:'nothing happened, which is the best possible story',pt:'não aconteceu nada, que é a melhor história possível'}]},

heeded:{pol:1,ch:0.30,d:[4,10],hy:0.3,rp:0.4,
 s:[{en:'warned {you} about the file thing and got a thanks. that is enough for me.',pt:'avisei o {you} sobre a história do arquivo e recebi um obrigado. pra mim tá bom.'},
    {en:'at least one person listened today',pt:'pelo menos uma pessoa escutou hoje'},
    {en:'told {you}. {you} said thanks. small day, good day.',pt:'falei pro {you}. o {you} agradeceu. dia pequeno, dia bom.'}],
 t:[{en:'{who} warned {you} and {you} listened. a functioning room, briefly.',pt:'o {who} avisou o {you} e o {you} escutou. uma sala funcionando, brevemente.'},
    {en:'listening is free and almost nobody does it',pt:'escutar é de graça e quase ninguém faz'},
    {en:'take the warning. you can be embarrassed later.',pt:'aceita o aviso. você pode passar vergonha depois.'},
    {en:'good. now go and tell two people.',pt:'ótimo. agora vai contar pra duas pessoas.'}]},

spreadwarning:{pol:1,ch:0.55,d:[2,6],hy:0.8,rp:1.2,
 s:[{en:'I told {you} one thing and now half the room knows. correct use of a person.',pt:'eu falei uma coisa pro {you} e agora meia sala sabe. uso correto de uma pessoa.'},
    {en:'{you} passed my warning around without adding drama to it',pt:'o {you} espalhou meu aviso sem colocar drama junto'},
    {en:'thanks for carrying that, {you}. I did not want to post it myself.',pt:'valeu por carregar isso, {you}. eu não queria postar sozinho.'}],
 t:[{en:'the warning going around came from {who} through {you}. thanks, both.',pt:'o aviso que tá rolando veio do {who} via {you}. valeu vocês dois.'},
    {en:'if you got the heads up today, that chain started in a dm',pt:'se você recebeu o aviso hoje, essa corrente começou numa dm'},
    {en:'nobody gets paid for this and it is the most useful thing here',pt:'ninguém ganha por isso e é a coisa mais útil daqui'},
    {en:'saved me a click. probably saved somebody a lot more.',pt:'me poupou um clique. provavelmente poupou muito mais de alguém.'}]},

ignoredwarning:{pol:-1,ch:0.40,d:[3,8],hy:-0.4,rp:-0.4,
 s:[{en:'warned {you} and got nothing back. fine, I tried.',pt:'avisei o {you} e não recebi nada de volta. beleza, eu tentei.'},
    {en:'next time I will let people find out on their own',pt:'da próxima eu deixo as pessoas descobrirem sozinhas'},
    {en:'{you} shrugged. it is going to be funny in about a week.',pt:'o {you} deu de ombros. daqui uma semana vai ser engraçado.'}],
 t:[{en:'{who} warned {you} and {you} shrugged. hope it stays cheap.',pt:'o {who} avisou o {you} e o {you} deu de ombros. espero que continue barato.'},
    {en:'ignoring a warning is the most expensive free thing you can do',pt:'ignorar um aviso é a coisa grátis mais cara que existe'},
    {en:'we will be back here in three days, same names',pt:'a gente volta aqui em três dias, mesmos nomes'},
    {en:'to be fair I ignore everything anyone tells me too',pt:'sendo justo eu também ignoro tudo que me falam'}]},

/* ---- a palavra dada ---- */
vowmade:{pol:1,ch:0.50,d:[4,10],hy:0.5,rp:0.7,
 s:[{en:'{you} gave me their word on {kj}. writing it down.',pt:'o {you} me deu a palavra sobre o {kj}. tô anotando.'},
    {en:'asked {you} not to sell one and got a yes. small thing, big thing.',pt:'pedi pro {you} não vender um e recebi um sim. coisa pequena, coisa grande.'},
    {en:'if {kj} shows up on the market I am going to be very loud',pt:'se o {kj} aparecer no mercado eu vou fazer muito barulho'}],
 t:[{en:'{who} got {you} to promise not to sell one. bold of both of them.',pt:'o {who} conseguiu que o {you} prometesse não vender um. corajoso dos dois.'},
    {en:'promises here last about eleven days on average',pt:'promessa aqui dura uns onze dias em média'},
    {en:'a word is a word until the floor moves',pt:'palavra é palavra até o floor mexer'},
    {en:'I hope {you} means it. genuinely.',pt:'espero que o {you} tenha falado sério. sinceramente.'}]},

vowrefused:{pol:0,ch:0.35,d:[4,10],hy:0,rp:0.2,
 s:[{en:'asked {you} to keep one. got a no. at least it was honest.',pt:'pedi pro {you} guardar um. levei não. pelo menos foi honesto.'},
    {en:'no promise, but they offered to sell it to me instead. fair.',pt:'sem promessa, mas ofereceu me vender. justo.'},
    {en:'{you} would not swear to anything. I can work with that.',pt:'o {you} não jurou nada. eu consigo trabalhar com isso.'}],
 t:[{en:'{you} would not promise {who} anything. I prefer that to a lie.',pt:'o {you} não prometeu nada pro {who}. prefiro isso a mentira.'},
    {en:'people who refuse to promise usually keep more than people who promise',pt:'quem se recusa a prometer costuma guardar mais do que quem promete'},
    {en:'asking a stranger to hold your favourite hostage is a choice, {who}',pt:'pedir pra um estranho segurar o seu favorito é uma escolha, {who}'},
    {en:'nobody owes you their wallet',pt:'ninguém te deve a carteira dele'}]},

brokevow:{pol:-1,ch:0.90,d:[2,4],hy:-1.8,rp:-1.4,
 s:[{en:'{you} gave me their word on {kj} and it is gone. that is the post.',pt:'o {you} me deu a palavra sobre o {kj} e ele sumiu. o post é esse.'},
    {en:'I am not angry about the money. I am angry about the yes.',pt:'não tô bravo pelo dinheiro. tô bravo pelo sim.'},
    {en:'said they would keep it. did not keep it. simple.',pt:'disse que ia guardar. não guardou. simples.'}],
 t:[{en:'so {you} broke their word to {who}. good to know before I ask for anything.',pt:'então o {you} quebrou a palavra com o {who}. bom saber antes de eu pedir qualquer coisa.'},
    {en:'the {you} thing is why I stopped asking people to hold',pt:'essa do {you} é por isso que eu parei de pedir pra guardarem'},
    {en:'everyone has a price. some people say it out loud first.',pt:'todo mundo tem um preço. alguns dizem em voz alta antes.'},
    {en:'noted. day noted. filed.',pt:'anotado. dia anotado. arquivado.'}]},

/* ---- emprestar o nome ---- */
shilled:{pol:0,ch:0.50,d:[2,6],hy:0.4,rp:-0.3,
 s:[{en:'thanks {you} for the post. I know that costs something here.',pt:'valeu {you} pelo post. eu sei que isso custa alguma coisa aqui.'},
    {en:'asked {you} to say something and they did. did not even ask what I paid.',pt:'pedi pro {you} falar uma coisa e ele falou. nem perguntou quanto eu pagava.'},
    {en:'one person said yes. that is all I needed.',pt:'uma pessoa disse sim. era só isso que eu precisava.'}],
 t:[{en:'that post from {you} smells like {who} asked for it',pt:'aquele post do {you} tem cheiro de que o {who} pediu'},
    {en:'lending your name out is fine. just say it is lent.',pt:'emprestar o nome é de boa. só avisa que tá emprestado.'},
    {en:'I will say nice things about anything for eleven dollars and a kind word',pt:'eu falo bem de qualquer coisa por onze dólares e uma palavra gentil'},
    {en:'do we do disclosure here or do we just vibe',pt:'a gente faz disclosure aqui ou é só no feeling'}]},

refusedplug:{pol:0,ch:0.35,d:[3,8],hy:-0.2,rp:0.3,
 s:[{en:'asked {you} to post one line. no. that is allowed.',pt:'pedi pro {you} postar uma linha. não. é permitido.'},
    {en:'guess I am doing my own promotion. as always.',pt:'acho que vou fazer minha própria divulgação. como sempre.'},
    {en:'{you} said no and did not make a speech about it. fine.',pt:'o {you} disse não e não fez discurso. beleza.'}],
 t:[{en:'{you} would not post for {who}. I respect the line and I noticed it.',pt:'o {you} não postou pro {who}. respeito o limite e eu reparei.'},
    {en:'saying no to a favour is a whole personality now',pt:'dizer não pra um favor virou personalidade'},
    {en:'asking a stranger to vouch for you on day one is a lot',pt:'pedir pra um estranho te avalizar no primeiro dia é bastante coisa'},
    {en:'nobody here owes anybody a post',pt:'ninguém aqui deve post pra ninguém'}]},

/* ---- quem some e quem volta ---- */
welcomeback:{pol:1,ch:0.35,d:[4,10],hy:0.4,rp:0.5,
 s:[{en:'came back after a while and {you} noticed. that is a real thing.',pt:'voltei depois de um tempo e o {you} reparou. isso é coisa de verdade.'},
    {en:'nobody owed me a welcome. got one anyway.',pt:'ninguém me devia boas-vindas. recebi mesmo assim.'},
    {en:'the room is bigger and {you} still said hello.',pt:'a sala tá maior e o {you} ainda deu um oi.'}],
 t:[{en:'{who} is back and {you} was the first to say something',pt:'o {who} voltou e o {you} foi o primeiro a falar alguma coisa'},
    {en:'people come back more often than you would think. say hello.',pt:'as pessoas voltam mais do que você imagina. dá um oi.'},
    {en:'good to see a name I recognise',pt:'bom ver um nome que eu reconheço'},
    {en:'welcome back {who}. the floor is exactly where you left it.',pt:'bem-vindo de volta {who}. o floor tá exatamente onde você deixou.'}]},

ghosted:{pol:-1,ch:0.40,d:[3,8],hy:-0.4,rp:-0.5,
 s:[{en:'came back and got two words from {you}. ok.',pt:'voltei e recebi duas palavras do {you}. beleza.'},
    {en:'maybe I will go away again',pt:'talvez eu suma de novo'},
    {en:'not a big deal. felt like one for a second though.',pt:'não é nada demais. pareceu por um segundo, mas não é.'}],
 t:[{en:'{who} came back and {you} could not be bothered',pt:'o {who} voltou e o {you} não quis nem saber'},
    {en:'it costs nothing to say hello. genuinely nothing.',pt:'não custa nada dar um oi. nada mesmo.'},
    {en:'this is how rooms get small',pt:'é assim que as salas ficam pequenas'},
    {en:'in fairness half of you would not know me either',pt:'sendo justo metade de vocês também não me conheceria'}]}
};

/* ---------- a segunda leva ----------
   O melhor momento de uma fofoca não é ela, é a resposta em cima dela. Como o
   feed é uma lista de cartões e não uma árvore de comentários, a resposta vem
   como um post que CITA quem falou primeiro ({w1}) — que é exatamente como um
   fórum de 2003 respondia mesmo. */
const ECHO_REPLY={
 bad:[{en:'{w1} is exaggerating. I was in that thread.',pt:'o {w1} tá exagerando. eu tava naquela thread.'},
      {en:'that is not what happened and {w1} knows it',pt:'não foi isso que aconteceu e o {w1} sabe'},
      {en:'{w1} is right though. same thing happened to me.',pt:'mas o {w1} tá certo. aconteceu a mesma coisa comigo.'},
      {en:'anybody got the actual screenshot or are we doing vibes',pt:'alguém tem o print de verdade ou a gente vai no feeling'},
      {en:'I have had zero problems with {you}. for whatever that is worth.',pt:'eu nunca tive problema com o {you}. pelo que isso valer.'},
      {en:'two sides. one post. as usual.',pt:'dois lados. um post. como sempre.'},
      {en:'{w1} posts this every week about somebody',pt:'o {w1} posta isso toda semana sobre alguém'},
      {en:'noted and moving on. I have four dms to ignore.',pt:'anotado e seguindo. eu tenho quatro dm pra ignorar.'}],
 good:[{en:'seconding {w1}. {you} has been straight with me too.',pt:'concordo com o {w1}. o {you} foi reto comigo também.'},
      {en:'nice to read something that is not a complaint',pt:'bom ler alguma coisa que não é reclamação'},
      {en:'{w1} is easily impressed but this time fair enough',pt:'o {w1} se impressiona fácil mas dessa vez tá justo'},
      {en:'we are really out here celebrating basic manners. and we should be.',pt:'a gente aqui comemorando educação básica. e a gente deve mesmo.'},
      {en:'adding {you} to the list of people who answer. short list.',pt:'botando o {you} na lista de gente que responde. lista curta.'},
      {en:'saw the same thing from my side. can confirm.',pt:'vi a mesma coisa do meu lado. confirmo.'},
      {en:'ok but what did it cost {w1} to say that',pt:'ok mas quanto custou pro {w1} falar isso'}],
 flat:[{en:'wait what happened. somebody catch me up.',pt:'peraí o que aconteceu. alguém me atualiza.'},
      {en:'scrolled back a while and I still do not know',pt:'voltei um tanto e ainda não sei'},
      {en:'is this about {you} again',pt:'isso é sobre o {you} de novo'},
      {en:'every day here has a main character and today it is not me',pt:'todo dia aqui tem um protagonista e hoje não sou eu'},
      {en:'{w1} could have said that in fewer words',pt:'o {w1} podia ter falado isso em menos palavras'},
      {en:'the archive gets a copy either way',pt:'o arquivo leva uma cópia de qualquer jeito'}]
};

/* ---------- números ---------- */
const ECHO_WAIT=2;        /* mínimo absoluto de horas: nunca no mesmo tick */
const ECHO_GAP=2;         /* horas entre dois ecos: fofoca não vem em rajada */
const ECHO_STALE=20;      /* fofoca velha morre: ninguém comenta o de anteontem */
const ECHO_Q=10;          /* teto da fila agendada */
const ECHO_CHAIN=0.45;    /* chance de alguém responder ao eco */
const ECHO_SELF=0.38;     /* chance de quem fala ser a própria pessoa envolvida */
const ECHO_HY_DAY=6;      /* teto de hype movido por fofoca num dia */
const ECHO_RP_DAY=4;      /* teto de reputação movida por fofoca num dia */

/* ---------- estado ----------
   Tudo dentro de G.social, que já vai inteiro pro save. echD carrega o DIA:
   quando o dia vira, o contador se reseta sozinho — sem precisar de gancho no
   socialEndDay, e sem quebrar save antigo que não tem nenhum destes campos. */
function echS(){
  const S=soc();
  S.evq=Array.isArray(S.evq)?S.evq:[];
  S.echoQ=Array.isArray(S.echoQ)?S.echoQ:[];
  if(!S.echD||typeof S.echD!=='object'||S.echD.d!==G.day)S.echD={d:G.day,n:0,hy:0,rp:0};
  return S;
}
/* ---------- anti-repetição ----------
   O eco tinha memória própria (echSaid, 60 hashes) separada da do feed. Duas
   memórias, dois furos: a do feed era por contagem e esta também. Agora o eco
   usa a MESMA memória do feed (saidList em 50-social.js): a chave é o hash
   do template en — o mesmo formato que o feed usa —, então uma fala de eco
   que saiu ontem não volta por três dias, igual a qualquer outro post. */
function echoKey(l){return saidKey(l);}
function echoFresh(arr){return socialFresh(arr);}

/* ---------- quem escreve ----------
   O jogador nunca assina o eco: ele é o assunto, não o autor. */
function echoBanned(e,extra){
  const b=[nickOf(),'you','anon'];
  if(e&&e.who)b.push(e.who);
  return b.concat(extra||[]);
}
function echoOther(evita){
  for(let i=0;i<12;i++){
    const w=whoPosts();
    if(w&&evita.indexOf(w)<0)return w;
  }
  return pick(CROWD);
}
/* s = quem viveu a cena · t = terceiro que só ouviu falar */
function echoAuthor(e){
  if(e.who&&chance(ECHO_SELF))return {w:e.who,m:'s'};
  return {w:echoOther(echoBanned(e)),m:'t'};
}

/* ---------- preencher a frase ---------- */
function echoFill(s,e,w1){
  return String(s)
    .split('{you}').join(nickOf())
    .split('{who}').join(e.who||'')
    .split('{w1}').join(w1||e.who||'')
    .split('{v}').join(e.v!=null?money(e.v):'')
    .split('{kj2}').join(e.pegou!=null?('#'+e.pegou):'')
    .split('{kj}').join(e.tk!=null?('#'+e.tk):(e.deu!=null?('#'+e.deu):''));
}

/* ---------- o teto do dia ----------
   Anda junto com o ritmo do feed: num dia morto (hype baixo, ~6 posts) só
   cabem 2 ecos; num dia fervendo cabem 4. A fofoca sobre o jogador nunca
   passa de um pedacinho do que a sala está falando. */
function echoCapDay(){return clamp(2+Math.floor(postsPerHour()*18/10),2,4);}

/* ---------- o feed vem primeiro ----------
   O teto do dia sozinho não basta: num dia morto (evento 'dump' ou 'fud' deixa
   o feed em dois ou três posts) dois ecos já seriam metade do que a sala falou.
   Então cada eco pede que a comunidade já tenha falado sozinha: o 1º precisa de
   2 posts orgânicos no dia, o 2º de 5, o 3º de 8. Assim a fofoca nunca passa de
   um terço do dia, e num dia silencioso ela simplesmente não sai.
   A resposta a um eco (st=2) não passa por aqui: ela é o mesmo momento. */
function echoAwake(){
  const S=echS();
  const n=S.posts.filter(p=>p&&p.day===G.day&&!p.ech).length;
  return n>=2+3*(+S.echD.n||0);
}

/* ---------- consequência ----------
   Pequena e real. E com orçamento diário, senão vira torneira: a DM inteira
   não pode mover mais que ECHO_HY_DAY de hype nem ECHO_RP_DAY de reputação
   num dia, some o que somar. */
function echoPay(hy,rp){
  const S=echS();
  let h=0,r=0;
  if(hy){const livre=Math.max(0,ECHO_HY_DAY-(S.echD.hy||0));
    h=clamp(hy,-livre,livre);S.echD.hy=(S.echD.hy||0)+Math.abs(h);}
  if(rp){const livre=Math.max(0,ECHO_RP_DAY-(S.echD.rp||0));
    r=clamp(rp,-livre,livre);S.echD.rp=(S.echD.rp||0)+Math.abs(r);}
  if(h&&typeof addHype==='function')addHype(h);
  if(r&&typeof repAdd==='function')repAdd(r);
  return {hy:h,rp:r};
}
/* quem leu esfria (ou esquenta) um pouquinho. É isto que faz a DM ter plateia:
   ser grosseiro com uma pessoa custa um pouco com as OUTRAS. Duas ou três
   pessoas por post, valor pequeno — e nunca a pessoa envolvida, que já pagou
   ou recebeu a sua parte lá na conversa. */
function echoRoom(e,pol){
  if(!pol)return [];
  const S=soc();
  const fora=echoBanned(e);
  const gente=S.threads.map(x=>x.who).filter(w=>fora.indexOf(w)<0);
  if(!gente.length)return [];
  const n=Math.min(gente.length,ri(1,3));
  const mexidos=[];
  for(let i=0;i<n;i++){
    const w=pick(gente);
    if(mexidos.indexOf(w)>=0)continue;
    trustAdd(w,pol>0?ri(2,4):-ri(2,5));
    mexidos.push(w);
  }
  return mexidos;
}

/* ---------- publicar ----------
   st=1 é a fofoca; st=2 é alguém respondendo à fofoca.
   Devolve o post publicado, ou null se o feed recusou a frase (memória de
   três dias do socialPost) — e aí nem o teto do dia nem a corrente andam. */
function echoFire(it,now){
  const S=echS();
  const e=it.e||{}, sp=ECHO[e.n];
  if(!sp)return null;
  const pol=sp.pol||0;
  let pool,aut;
  if(it.st===2){
    /* a resposta vem de mais alguém, nunca de quem já falou */
    const base=ECHO_REPLY[pol>0?'good':pol<0?'bad':'flat'];
    pool=base.concat(ECHO_REPLY.flat);
    aut={w:echoOther(echoBanned(e,[it.w1])),m:'r'};
  }else{
    aut=echoAuthor(e);
    pool=(aut.m==='s'?sp.s:sp.t)||sp.t;
  }
  let feito=null;
  /* ANTES: quatro tentativas e na última publicava FORÇADO, repetindo. Agora
     echoFresh só devolve fala que não saiu em três dias; se o pool do evento
     secou, devolve null e a fofoca simplesmente não sai nesta hora — nunca
     repete. (A fala fica na fila? Não: fofoca requentada não interessa.) */
  {
    const l=echoFresh(pool);
    if(!l)return null;
    const txt=echoFill(LANG==='pt'?l.pt:l.en,e,it.w1);
    const base=onlineNow();
    const p={who:aut.w,kind:pol<0?'fud':'talk',txt,ech:1,ev:e.n,est:it.st||1,key:echoKey(l)};
    /* o cartão não nasce morto: a sala já reagiu antes de o jogador abrir */
    if(pol<0){p.down=Math.max(2,Math.round(base*0.055*rf(0.6,1.5)));
              p.up=Math.round(base*0.014*rf(0,1.4));}
    else{p.up=Math.max(2,Math.round(base*0.050*rf(0.6,1.5)));
         p.haha=Math.round(base*0.016*rf(0,1.2));}
    /* só quem VIVEU a cena mostra a arte — e só onde um Kaiju trocou de mão */
    const id=(sp.art===1)?e.tk:(sp.art===2)?e.deu:null;
    if(aut.m==='s'&&id!=null&&chance(0.55)){
      try{p.tk=id;p.rar=metaOf(id).rarity;}catch(err){delete p.tk;}
    }
    /* socialPost responde se publicou; a memória é marcada lá dentro */
    if(socialPost(p))feito=S.posts[0];
  }
  if(!feito)return null;
  S.echD.n=(S.echD.n||0)+1;
  S.echAt=now;
  /* a consequência é da fofoca, não do comentário em cima dela */
  if(it.st!==2){
    echoPay(sp.hy||0,sp.rp||0);
    echoRoom(e,pol);
    if(chance(ECHO_CHAIN)&&S.echoQ.length<ECHO_Q)
      S.echoQ.push({e,due:now+ri(1,3),st:2,w1:aut.w});
  }
  return feito;
}

/* ---------- o tick ----------
   Chamado de socialTick() (50-social.js), uma vez por hora de jogo.
   Recolhe, agenda, e publica NO MÁXIMO UM por hora. */
function dmEchoTick(){
  const S=echS();
  const now=G.day*24+G.hour;

  /* 1) recolhe tudo que a DM empilhou e AGENDA. A fila da DM é esvaziada
        sempre, mesmo o que não vai virar post: senão ela entope. */
  while(S.evq.length){
    const e=S.evq.shift();
    if(!e||!ECHO[e.n])continue;
    const at=+e.at;
    const quando=isFinite(at)?at:now;
    if(now-quando>ECHO_STALE)continue;      /* fofoca de anteontem não interessa */
    if(!chance(ECHO[e.n].ch))continue;
    if(S.echoQ.length>=ECHO_Q)continue;
    const d=ri(ECHO[e.n].d[0],ECHO[e.n].d[1]);
    /* o max com now+ECHO_WAIT é o que garante a regra nº1: mesmo um evento que
       chegou atrasado nunca é comentado no tick em que foi recolhido */
    S.echoQ.push({e,due:Math.max(quando+d,now+ECHO_WAIT),st:1});
  }

  /* 2) o que venceu e ficou muito tempo esperando vaga simplesmente passa */
  S.echoQ=S.echoQ.filter(x=>x&&(now-(+x.due||0))<=12);

  /* 3) publica. Um por hora, respeitando o intervalo e o teto do dia. */
  if(G.day<2)return;
  if((S.echD.n||0)>=echoCapDay())return;
  if(now-(+S.echAt||-999)<ECHO_GAP)return;
  const acordada=echoAwake();
  const i=S.echoQ.findIndex(x=>(+x.due||0)<=now&&(x.st===2||acordada));
  if(i<0)return;
  const it=S.echoQ.splice(i,1)[0];
  if(echoFire(it,now)&&typeof save==='function')save();
}
