/* ================= GAME DATA ================= */
const GAME_NAME='Kaijukaki Gotta Mint Out!';
const RARITY=[
 {n:'Common',    c:'#6b6b6b', mult:1.00},
 {n:'Uncommon',  c:'#2f6b3a', mult:1.40},
 {n:'Rare',      c:'#1f5aa8', mult:2.20},
 {n:'Epic',      c:'#8a3fa0', mult:3.80},
 {n:'Legendary', c:'#b8860b', mult:7.00},
 {n:'Mythic',    c:'#a02020', mult:20.0}
];
const RARITY_PT={'Common':'Comum','Uncommon':'Incomum','Rare':'Raro','Epic':'Épico','Legendary':'Lendário','Mythic':'Mítico'};
const rarName=i=>LANG==='pt'?(RARITY_PT[RARITY[i].n]||RARITY[i].n):RARITY[i].n;

/* ---- traits come straight from the real collection metadata ---- */
const TRAIT_LAYERS=KK_META.types.slice();
const TRAIT_LABEL={};TRAIT_LAYERS.forEach(k=>{TRAIT_LABEL[k]=k;});
const RACE_LAYER='Race';
/* ---------- nomes de exibicao ----------
   "Secret" no lugar de "Special", "Reserved" no lugar de "Reserve". Trocado
   no dicionario aqui, ANTES de RACES ser copiado — assim o jogo inteiro
   (filtros, binder, feed, fas de raca) fala a mesma lingua. Os arquivos da
   colecao continuam com o nome original: isso e so a cara. */
(function renameTraits(){
  const troca=(camada,de,para)=>{
    const d=KK_META.dict[camada];if(!d)return;
    const i=d.indexOf(de);if(i>=0)d[i]=para;
  };
  troca('Race','Special','Secret');
  troca('Name','Reserve','Reserved');
})();
const RACES=KK_META.dict.Race.slice();
const raceOf=tk=>tk.traits[RACE_LAYER];
/* trait frequency, for the "x of 8888" line on a Kaiju sheet */
function traitCount(type,value){
  const i=KK_META.dict[type].indexOf(value);
  return i<0?0:KK_META.freq[type][i];
}

/* first time the player pulls each Race, the character reacts */
const RACE_LINES={
 'Harajuku':{en:"A Harajuku one! Loud, pink, impossible to ignore. Perfect.",pt:"Um Harajuku! Barulhento, rosa, impossível de ignorar. Perfeito."},
 'Emo':{en:"An Emo Kaiju. It is not a phase, mom. It is a whole Race.",pt:"Um Kaiju Emo. Não é fase, mãe. É uma Raça inteira."},
 'Asylum':{en:"Asylum. Okay this one is genuinely unsettling and I love it.",pt:"Asylum. Tá, esse aqui é perturbador de verdade e eu amo."},
 'Mecha':{en:"MECHA! Somebody built this thing to win a war.",pt:"MECHA! Construíram essa coisa pra ganhar uma guerra."},
 'Executive':{en:"An Executive. He does not mint. He acquires.",pt:"Um Executive. Ele não minta. Ele adquire."},
 'Ghost':{en:"A Ghost. Cold hands, cold floor. Beautiful.",pt:"Um Ghost. Mão gelada, floor gelado. Lindo."},
 'Hollow':{en:"A Hollow Kaiju! That is sick, kinda makes me wanna do a speedrun.",pt:"Um Kaiju Hollow! Que foda, deu até vontade de fazer uma speedrun."},
 'Ronin':{en:"A Ronin. No master, no roadmap. Relatable.",pt:"Um Ronin. Sem mestre, sem roadmap. Me identifiquei."},
 'Vampire':{en:"Vampire! Old money energy. This one has seen four bear markets.",pt:"Vampire! Energia de dinheiro velho. Esse aí já viu quatro bear markets."},
 'Cat':{en:"A Cat Kaiju. It will sell itself if it feels like it.",pt:"Um Kaiju Cat. Ele se vende sozinho se quiser."},
 'Farmer':{en:"Farmer! Honest work. Something this collection knows nothing about.",pt:"Farmer! Trabalho honesto. Coisa que essa coleção não conhece."},
 'Western':{en:"A Western one. This town ain't big enough for 8888 of us.",pt:"Um Western. Essa cidade não cabe 8888 de nós."},
 'Zomboy':{en:"Zomboy. Dead, still minting. That is the spirit.",pt:"Zomboy. Morto e mintando. É esse o espírito."},
 'Exorcist':{en:"An Exorcist. Good. Someone has to deal with the Wraiths.",pt:"Um Exorcist. Ótimo. Alguém tem que resolver os Wraith."},
 'Yakuza':{en:"Yakuza. I am not asking where the funding came from.",pt:"Yakuza. Não vou perguntar de onde veio o investimento."},
 'Archangel':{en:"An ARCHANGEL. Wings and everything. I feel judged.",pt:"Um ARCHANGEL. Com asa e tudo. Me senti julgado."},
 'Knight':{en:"A Knight! Full plate. This one is not selling below floor.",pt:"Um Knight! Armadura completa. Esse não sai abaixo do floor."},
 'Kaki':{en:"A Kaki. House Race. This is the one on the old poster.",pt:"Um Kaki. Raça da casa. Esse é o do pôster antigo."},
 'Lean':{en:"A Lean one. Moving slow, thinking slower. Chill.",pt:"Um Lean. Devagar no corpo, mais devagar na cabeça. De boa."},
 'Vice':{en:"Vice. Neon, bad decisions, great taste.",pt:"Vice. Neon, decisão ruim, gosto ótimo."},
 'Kaiju':{en:"An actual KAIJU. The name on the door. Hold this one.",pt:"Um KAIJU de verdade. O nome da porta. Segura esse."},
 'Strike':{en:"Caraca, a Kaiju Strike! So many memories in that one.",pt:"Caraca, um Kaiju Strike! Quantas memórias isso me traz."},
 'Wraith':{en:"A Wraith. It is not looking at me. It is looking through me.",pt:"Um Wraith. Não tá olhando pra mim. Tá olhando através de mim."},
 'Toon':{en:"A Toon! Physics do not apply to this one.",pt:"Um Toon! A física não se aplica a esse aí."},
 'Special':{en:"A SPECIAL. There are only 208 of these. Do not let it go.",pt:"Um SPECIAL. Só existem 208 desses. Não deixa escapar."},
 'Jock':{en:"A Jock. Peaked in high school, still worth money.",pt:"Um Jock. Auge no colégio, mas ainda vale dinheiro."},
 'Orc':{en:"An Orc! Loud, green, absolutely does not care about your floor.",pt:"Um Orc! Barulhento, verde, e nem aí pro seu floor."},
 'Cyborg':{en:"Cyborg. Half of it is warranty-voided already.",pt:"Cyborg. Metade dele já perdeu a garantia."},
 'Saiyan':{en:"A SAIYAN?! Okay that hair alone is worth the gas.",pt:"Um SAIYAN?! Só o cabelo já paga o gas."},
 'Raver':{en:"Raver. This one has not slept since the mint started.",pt:"Raver. Esse aí não dorme desde que o mint abriu."},
 'Beetle':{en:"A Beetle! Armored, winged, deeply underrated.",pt:"Um Beetle! Blindado, com asa, e muito subestimado."},
 'Wizard':{en:"A Wizard. Finally, someone who can explain the tokenomics.",pt:"Um Wizard. Enfim alguém que consegue explicar a tokenomics."},
 'Shark':{en:"A SHARK. Only 99 exist. I am shaking a little.",pt:"Um SHARK. Só existem 99. To tremendo um pouco."},
 'Otaku':{en:"An OTAKU! 99 in the whole collection and it landed here.",pt:"Um OTAKU! 99 na coleção inteira e caiu aqui."},
 'Monkey':{en:"A MONKEY. 99 of these. The floor does not deserve it.",pt:"Um MONKEY. 99 desses. O floor não merece."}
};

const LEVELS=[
 {n:'Mini Fish',   req:0,    perk:{en:"You are nobody. Yet.",            pt:"Você é ninguém. Ainda."}},
 {n:'Guppy',       req:5,    perk:{en:"Kaiju Shop upgrades unlock",      pt:"Libera os upgrades da Kaiju Shop"}},
 {n:'Sardine',     req:15,   perk:{en:"+1 offer slot",                   pt:"+1 slot de offer"}},
 {n:'Piranha',     req:40,   perk:{en:"+4 listings on the Kaiju Market", pt:"+4 listagens no Kaiju Market"}},
 {n:'Tuna',        req:100,  perk:{en:"Referral link · +1 offer slot",   pt:"Link de referral · +1 slot de offer"}},
 {n:'Swordfish',   req:250,  perk:{en:"Staking Vault opens",             pt:"O Staking Vault abre"}},
 {n:'Dolphin',     req:600,  perk:{en:"List All · offers 8% better",     pt:"List All · offers 8% melhores"}},
 {n:'Shark',       req:1500, perk:{en:"+1 offer slot",                   pt:"+1 slot de offer"}},
 {n:'Orca',        req:4000, perk:{en:"Offers 15% better",               pt:"Offers 15% melhores"}},
 {n:'Big Whale',   req:8888, perk:{en:"You ARE the market",              pt:"Você É o mercado"}}
];
const perkOf=i=>LEVELS[i].perk[LANG]||LEVELS[i].perk.en;

const UPGRADES=[
 {id:'shill',  ico:'globe',  cost:260,   lvl:3, en:['Shill Bot','+0.30 hype per hour, automatically.'],                      pt:['Shill Bot','+0.30 de hype por hora, automático.']},
 {id:'mods',   ico:'kaiju',  cost:420,   lvl:3, en:['Discord Mods','+2 offer slots.'],                                       pt:['Discord Mods','+2 slots de offer.']},
 {id:'ocstar', ico:'star',   cost:2400,  lvl:5, en:['OC Star','A star from Oekaki Connect drops on your desktop every so often. Click it before it fades and it pays you.'], pt:['OC Star','Uma estrela da Oekaki Connect cai na sua área de trabalho de vez em quando. Clique antes de ela sumir e ela te paga.']},
 {id:'sniff',  ico:'info',   cost:700,   lvl:4, en:['Mint Queue Scanner','Reads the next 10 places in the mint queue and tells you the odds of a Rare, an Epic or a Mythic coming up. It never tells you which one.'], pt:['Scanner da Fila','Lê os próximos 10 lugares da fila de mint e diz a chance de vir um Raro, um Épico ou um Mítico. Nunca diz qual.']},
 {id:'again',  ico:'rocket', cost:1100,  lvl:3, en:['Mint Again Button','Adds a MINT AGAIN button to the reveal screen. Chain mints without closing it.'], pt:['Botão Mint Again','Adiciona um botão MINT AGAIN na tela de reveal. Minta em sequência sem fechar.']},
 {id:'coffee', ico:'coin',   cost:1200,  lvl:4, en:['Industrial Coffee Machine','+4 usable hours per day.'],                 pt:['Cafeteira Industrial','+4 horas úteis por dia.']},
 {id:'infl',   ico:'market', cost:1800,  lvl:5, en:['Influencer Deal','+22 hype instantly. One-off, but the hype stays.'],   pt:['Contrato com Influencer','+22 de hype na hora. Uso único, mas o hype fica.']},
 {id:'lister', ico:'market', cost:3200,  lvl:6, en:['Auto-Lister','Listings sell twice as fast.'],                           pt:['Auto-Lister','Listagens vendem 2x mais rápido.']},
 {id:'vault',  ico:'vault',  cost:7000,  lvl:6, en:['Reinforced Vault','+60% staking yield.'],                               pt:['Cofre Reforçado','+60% de rendimento no staking.']},
 {id:'offsh',  ico:'wallet', cost:9000,  lvl:7, en:['Offshore Account',"Mr. Kaiju's tax drops from 20% to 9%."],             pt:['Conta Offshore','Imposto do Sr. Kaiju cai de 20% pra 9%.']},
 {id:'listall',ico:'market', cost:6000,  lvl:7, en:['Bulk Lister','Adds LIST ALL to the wallet: pick a price, list everything at once.'], pt:['Listador em Massa','Adiciona LISTAR TUDO na carteira: escolhe o preço e lista tudo de uma vez.']},
 {id:'sentin', ico:'marker', cost:6400,  lvl:5, en:['Sentiment Highlighter','Colours every post on Kaki+ by mood before you read it: red for panic, green for praise, purple for a joke. You stop reading the room and start reading the stripe.'], pt:['Marcador de Sentimento','Colore cada post do Kaki+ pelo humor antes de você ler: vermelho pra pânico, verde pra elogio, roxo pra piada. Você para de ler a sala e passa a ler a tarja.']},
 {id:'prio',   ico:'rocket', cost:520,   lvl:2, en:['Priority Fee','Pays the network to look at your buy before it looks at everyone else\'s. Front-runs and failed transactions get rare. The fee is charged whether it works or not, like everything else here.'], pt:['Priority Fee','Paga a rede pra olhar a sua compra antes da dos outros. Perder a compra e transação falhada ficam raros. A taxa é cobrada funcionando ou não, igual a todo o resto aqui.']},
 {id:'whale',  ico:'chart',  cost:35000, lvl:9, en:['Whale List','Offers 30% bigger and more frequent.'],                    pt:['Lista de Baleias','Offers 30% maiores e mais frequentes.']}
];
const upName=u=>(u[LANG]||u.en)[0];
const upDesc=u=>(u[LANG]||u.en)[1];

const HACKERS=['0xN1GHT','drainer.eth','not_a_bot','SeedPhraseSam','ghost_wallet','KaijuLeaks',
 'anon_rat','cold_boot','0xVOID','phish_king'];

const SCAMS={
 en:[
  {t:'CONGRATULATIONS!',m:'You are the <b>1,000,000th visitor</b> of kaijukaki.net!<br><br>Claim your prize now!',b:'CLAIM PRIZE',tell:'kaijukaki.net'},
  {t:'Wallet Connect',m:'Your session expired. Re-enter your <b>seed phrase</b> to keep minting.',b:'RECONNECT WALLET',tell:'seed phrase'},
  {t:'FREE KAIJU AIRDROP',m:'Official KaijuKakl airdrop. 5 free Kaiju waiting. Offer ends in 30 seconds!',b:'CLAIM 5 KAIJU',tell:'KaijuKakl'},
  {t:'System Message',m:'Your PC is <b>infected</b> with 47 viruses. Download KaijuCleaner Pro now.',b:'CLEAN MY PC',tell:'47 viruses'},
  {t:'Whale offer',m:'A whale wants to buy your whole wallet for <b>10x floor</b>. Approve the contract.',b:'APPROVE CONTRACT',tell:'10x floor'},
  {t:'kaijukaki-mint.net',m:'SECOND OFFICIAL MINT IS LIVE. Only on this page. Do not tell anyone.',b:'MINT NOW (FREE)',tell:'kaijukaki-mint.net'}
 ],
 pt:[
  {t:'PARABÉNS!',m:'Você é o <b>1.000.000º visitante</b> do kaijukaki.net!<br><br>Resgate seu prêmio agora!',b:'RESGATAR PRÊMIO',tell:'kaijukaki.net'},
  {t:'Wallet Connect',m:'Sua sessão expirou. Digite sua <b>seed phrase</b> de novo pra continuar mintando.',b:'RECONECTAR CARTEIRA',tell:'seed phrase'},
  {t:'AIRDROP GRÁTIS',m:'Airdrop oficial do KaijuKakl. 5 Kaiju grátis esperando. Acaba em 30 segundos!',b:'RESGATAR 5 KAIJU',tell:'KaijuKakl'},
  {t:'Mensagem do Sistema',m:'Seu PC está <b>infectado</b> com 47 vírus. Baixe o KaijuCleaner Pro agora.',b:'LIMPAR MEU PC',tell:'47 vírus'},
  {t:'Oferta de baleia',m:'Uma baleia quer comprar sua carteira inteira por <b>10x o floor</b>. Aprove o contrato.',b:'APROVAR CONTRATO',tell:'10x o floor'},
  {t:'kaijukaki-mint.net',m:'SEGUNDO MINT OFICIAL ESTÁ NO AR. Só nessa página. Não conta pra ninguém.',b:'MINTAR AGORA (GRÁTIS)',tell:'kaijukaki-mint.net'}
 ]
};

/* Quem compra no mercado. Tinha "gm_gm_gm", "MoonBoy88", "WhaleDaddy" — nome
   de folheto. Sobrou o que soa a gente de verdade, e entrou handle curto. */
const BUYERS=['0xC4FE','cyberangel','flipperzin','vik1998','nullsan','anon_9021',
 'keiko_exe','0xDEAD','SaraFlips','tez97','voidmilk','lun04','rugpull_survivor',
 'ghostpixel','ser_paperhand','0xBEEF','kaz11','ZeDaCripto','sable','floor_sweeper',
 'mari2001','denki','oxide','yori95'];

const THOUGHTS_ALL={
 en:{
  start:["Okay. $40 and a dream.","If I don't mint anything today, nobody will even know this exists.","Thirty-nine dollars and fifty cents of gas. Great."],
  broke:["I'm broke. I need to sell something.","Can't even cover gas anymore.","This is starting to feel like I rugged myself."],
  rich:["Now we're talking.","If I stop now I win. But I'm not stopping.","I'm rich. Time to mint more."],
  rare:["THIS. This one I'm not selling.","Hold that. Hold it.","Rare. Finally."],
  sale:["Sold. Next.","Money coming in.","Somebody actually paid for that. Beautiful."],
  lowhype:["Nobody is looking at the collection.","I need noise. Or an influencer.","Empty timeline. That kills projects."],
  highhype:["People are talking about us.","The floor is climbing on its own.","This thing went viral."],
  tax:["Mr. Kaiju again, seriously...","Tax. Always tax.","He always knows exactly how much I made. Always."],
  night:["It's the middle of the night already.","My eyes hurt.","One more mint and I sleep."],
  idle:["...","I should eat something.","Is this actually going to work?","The collection has to mint out. That's it."],
  mintout:["It's done. Everything minted.","8 8 8 8 8. All of them.","I did it. Kaijukaki minted out."]
 },
 pt:{
  start:["Ok. $40 e um sonho.","Se eu não mintar nada hoje, ninguém vai nem saber que isso existe.","Trinta e nove reais e cinquenta centavos de gas. Ótimo."],
  broke:["Tô liso. Preciso vender alguma coisa.","Nem pro gas dá mais.","Isso aqui tá começando a parecer um rug em mim mesmo."],
  rich:["Agora sim.","Se eu parar agora eu ganho. Mas eu não vou parar.","Tô rico. Vou mintar mais."],
  rare:["ISSO. Esse aqui eu não vendo.","Segura esse. Segura.","Raro. Finalmente."],
  sale:["Vendido. Próximo.","Dinheiro entrando.","Alguém pagou isso. Que beleza."],
  lowhype:["Ninguém tá olhando pra coleção.","Preciso de barulho. Ou de um influencer.","Timeline vazia. Isso mata projeto."],
  highhype:["Tão falando de nós.","O floor tá subindo sozinho.","Isso aqui virou febre."],
  tax:["O Sr. Kaiju de novo não...","Imposto. Sempre imposto.","Ele sempre sabe quanto eu ganhei. Sempre."],
  night:["Já é madrugada.","Meus olhos doem.","Só mais um mint e eu durmo."],
  idle:["...","Devia comer alguma coisa.","Será que isso vai dar certo?","A coleção precisa mintar out. É isso."],
  mintout:["Acabou. Mintou tudo.","8 8 8 8 8. Todos.","Eu consegui. O Kaijukaki mintou out."]
 }
};
const TH=k=>(THOUGHTS_ALL[LANG]||THOUGHTS_ALL.en)[k];

const BOOT_ALL={
 en:['KaijuBIOS v2.1  (C) 1998 Kaiju Systems Ltd.','',
  'Detecting processor ............ K6-KAIJU 233MHz',
  'Memory ......................... 32768 KB OK',
  'Detecting Primary IDE .......... KAIJU-HDD 2.1GB',
  'Detecting Secondary IDE ........ CD-ROM 24x',
  '56k Modem ...................... CONNECTED','',
  'Loading KAIJUKAKI OS...'],
 pt:['KaijuBIOS v2.1  (C) 1998 Kaiju Systems Ltda.','',
  'Detectando processador ......... K6-KAIJU 233MHz',
  'Memória ........................ 32768 KB OK',
  'Detectando IDE Primário ........ KAIJU-HDD 2.1GB',
  'Detectando IDE Secundário ...... CD-ROM 24x',
  'Modem 56k ...................... CONECTADO','',
  'Carregando KAIJUKAKI OS...']
};
