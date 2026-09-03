/* ================= APP: Kaiju Inbox =================
   Onde o jogo conta o que mudou. Cada versao deixa uma carta aqui, e o
   jogo tambem escreve sozinho quando acontece algo digno de nota. */
const GAME_VERSION='1.7';
/* PATCH NOTES. Oito ate agora, curtas, e cada uma paga $1 quando o jogador
   abre. A regra do dono: NAO e porque um dia teve dez mudancas que e uma
   versao nova. Agrupa. Uma nota nova so quando um punhado de coisa se
   acumulou, e ela diz o que MUDOU pro jogador, em tres ou quatro linhas.
   Nada de diario do desenvolvedor. */
const MAIL=[
 {id:'u17', from:'kiv', ver:'1.7', gift:1, subj:{en:'Your desktop stays yours',pt:'Sua mesa continua sua'},
  tldr:{en:['Icons and panels you move never move again — new ones take the free spot.',
            'Tutorial talks less, and nothing pops up while someone is talking to you.',
            'Kaiju sheets open with traits folded. Right-click any icon to hide it.',
            'Kaki+ never repeats a post within three days.',
            'Every patch note pays $1. Collect below.'],
        pt:['Ícone e painel que você move nunca mais se mexem — os novos pegam o lugar livre.',
            'O tutorial fala menos, e nada pula na tela enquanto alguém fala com você.',
            'A ficha do Kaiju abre com os traits dobrados. Botão direito em qualquer ícone pra ocultar.',
            'O Kaki+ nunca repete um post em três dias.',
            'Toda nota de atualização paga $1. Colete aqui embaixo.']}},
 {id:'u16', from:'kiv', ver:'1.6', gift:1, subj:{en:'Story mode',pt:'Modo história'},
  tldr:{en:['The game starts with four icons. Everything else arrives when it makes sense.',
            'Six people from the community talk to you along the way: Kiv, Stux, Leaner, oni, hakase, Mr. Kaiju.',
            'Night five you get hacked. Day six the shop opens, one shelf at a time.',
            'The Kaiju Log keeps every conversation.'],
        pt:['O jogo começa com quatro ícones. O resto chega quando faz sentido.',
            'Seis pessoas da comunidade falam com você pelo caminho: Kiv, Stux, Leaner, oni, hakase, Mr. Kaiju.',
            'Na noite do dia cinco você é hackeado. No dia seis a loja abre, uma prateleira por vez.',
            'O Kaiju Log guarda toda conversa.']}},
 {id:'u15', from:'kiv', ver:'1.5', gift:1, subj:{en:'Readable',pt:'Legível'},
  tldr:{en:['Nothing in the game is small any more. Text size and interface size are in Settings.',
            'Higher contrast everywhere. Plays on a phone.',
            'Wallet setup is three steps.'],
        pt:['Nada no jogo é pequeno mais. Tamanho do texto e da interface estão em Configurações.',
            'Mais contraste em tudo. Roda no celular.',
            'Criar a carteira são três passos.']}},
 {id:'u14', from:'kiv', ver:'1.4', gift:1, subj:{en:'Collecting',pt:'Colecionar'},
  tldr:{en:['The Binder: a real album. Filed Kaiju cannot be taken from you.',
            'The Vault pays you daily for locking Kaiju away.',
            'Kaiju Charts, the Kaiju Spotter (work for money), and Kakizone quests.'],
        pt:['O Fichário: um álbum de verdade. Kaiju arquivado não pode ser tomado de você.',
            'O Cofre te paga por dia pra trancar Kaiju.',
            'Kaiju Charts, o Kaiju Spotter (trabalho por dinheiro) e as missões da Kakizone.']}},
 {id:'u13', from:'kiv', ver:'1.3', gift:1, subj:{en:'Money problems',pt:'Problemas de dinheiro'},
  tldr:{en:['Mr. Kaiju collects a tax every three days. Nobody knows what he is.',
            'Hackers come at night. Scams pop up by day. The antivirus keeps them out.',
            'The Kaiju Shop: wallet space, contract speed, batch minting and more.'],
        pt:['O Mr. Kaiju cobra imposto a cada três dias. Ninguém sabe o que ele é.',
            'Hackers vêm de noite. Golpes aparecem de dia. O antivírus segura os dois.',
            'A Kaiju Shop: espaço na carteira, velocidade de contrato, mint em lote e mais.']}},
 {id:'u12', from:'kiv', ver:'1.2', gift:1, subj:{en:'Kaki+',pt:'Kaki+'},
  tldr:{en:['A forum with people in it. Posting buys hype; hype makes strangers mint; their mints pay you.',
            'Private messages: how you answer changes what people offer you.',
            'Nobody says gm. We say bom dia.'],
        pt:['Um fórum com gente dentro. Postar compra hype; hype faz estranho mintar; os mints deles te pagam.',
            'Mensagens privadas: como você responde muda o que te oferecem.',
            'Ninguém diz gm. A gente diz bom dia.']}},
 {id:'u11', from:'kiv', ver:'1.1', gift:1, subj:{en:'The real 8888',pt:'Os 8888 de verdade'},
  tldr:{en:['Every Kaiju is the real hand-drawn one, with its real traits, race and rank.',
            'The reveal shows you what you got. Nothing leaks before you close it.',
            'Rare pulls get a reaction from the room.'],
        pt:['Todo Kaiju é o desenhado à mão de verdade, com os traits, a raça e o rank reais.',
            'O reveal mostra o que saiu. Nada vaza antes de você fechar.',
            'Puxada rara ganha reação da sala.']}},
 {id:'u10', from:'kiv', ver:'1.0', gift:1, subj:{en:'Gotta Mint Out!',pt:'Gotta Mint Out!'},
  tldr:{en:['A desktop from 1999. Mint Kaiju, watch the gas, sell on the market, end the day.',
            'Royalties: every mint that is not yours pays you a cut while you sleep.',
            'Get all 8888. Become the Big Whale.'],
        pt:['Uma área de trabalho de 1999. Minte Kaiju, olhe o gas, venda no mercado, encerre o dia.',
            'Royalties: todo mint que não é seu te paga uma parte enquanto você dorme.',
            'Pegue os 8888. Vire a Big Whale.']}}
];
function mailBody(m){return (LANG==='pt'?m.pt:m.en)||m.en;}
function mailSubj(m){
  if(!m.subj)return '';
  if(typeof m.subj==='string')return m.subj;
  return (LANG==='pt'?m.subj.pt:m.subj.en)||m.subj.en;
}
function mailRead(){if(!Array.isArray(G.mailRead))G.mailRead=[];return G.mailRead;}
/* notas ja coletadas: $1 cada, uma vez so, guardado no save */
function mailGifted(id){if(!Array.isArray(G.mailGift))G.mailGift=[];return G.mailGift.includes(id);}
/* cartas que o jogo escreve durante a partida */
function mailAll(){return MAIL.concat(Array.isArray(G.mailbox)?G.mailbox:[]);}
function mailUnread(){const r=mailRead();return mailAll().filter(m=>!r.includes(m.id)).length;}
function pushMail(id,from,subj,en,pt){
  G.mailbox=Array.isArray(G.mailbox)?G.mailbox:[];
  if(G.mailbox.some(m=>m.id===id)||MAIL.some(m=>m.id===id))return;
  G.mailbox.unshift({id,from,subj,ver:'',en,pt,day:G.day});
  if(G.mailbox.length>40)G.mailbox.pop();
  if(typeof UI!=='undefined'){UI.toast('mail',t('New message in the Inbox.'));UI.updateTray();}
}
/* markdown minimo: **negrito**, *italico* e paragrafos */
function mailTldr(m){const x=m.tldr;return x?(LANG==='pt'?x.pt:x.en)||x.en:null;}
function mailHtml(s){
  return s.split('\n\n').map(p=>
    '<p>'+p.replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/&lt;b&gt;/g,'<b>').replace(/&lt;\/b&gt;/g,'</b>')
      .replace(/&amp;rarr;/g,'&rarr;')
      .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
      .replace(/\*([^*]+)\*/g,'<i>$1</i>')
      .replace(/\n/g,'<br>')+'</p>').join('');
}
/* a mensagem aberta e do jogador: volta onde ele parou (G.prefs) */
const IV=prefView({sel:'mailSel'});
let mailFull=false;
APPS.inbox={
  title:'Kaiju Inbox', icon:'mail', w:560, h:460, status:true,
  build(b,ent){b.innerHTML='<div class="ibroot"></div>';this.refresh(b,ent);},
  refresh(b,ent){
    const root=$('.ibroot',b);if(!root)return;
    const list=mailAll();
    const read=mailRead();
    if(!IV.sel||!list.some(m=>m.id===IV.sel))IV.sel=list.length?list[0].id:'';
    const cur=list.find(m=>m.id===IV.sel);
    const naoLidas=mailUnread();
    root.innerHTML=`
      <div class="iblist">
        ${list.length?`<div class="ibtools">
          <button class="btn tight" data-ibreadall="1"${naoLidas?'':' disabled'}>${t('Read all')}</button>
        </div>`:''}
        ${list.map(m=>{
          const un=!read.includes(m.id);
          return `<button class="ibrow${m.id===IV.sel?' on':''}${un?' unread':''}" data-mail="${m.id}">
            <span class="ib-dot"></span>
            <span class="ib-txt">
              <span class="ib-from">${m.from}</span>
              <span class="ib-subj">${mailSubj(m)}</span>
            </span>
            ${m.ver?`<span class="ib-ver">v${m.ver}</span>`:m.day?`<span class="ib-ver">${t('Day {0}',m.day)}</span>`:''}
          </button>`;}).join('')}
      </div>
      <div class="ibread">
        ${cur?`<div class="ib-head"><b>${mailSubj(cur)}</b>
          <div class="tiny dim">${t('from')} ${cur.from}${cur.ver?' · v'+cur.ver:''}</div></div>
          ${mailTldr(cur)
            ? `<div class="ib-body"><ul class="ib-tldr">${mailTldr(cur).map(l=>`<li>${l}</li>`).join('')}</ul>
                 ${cur.gift?(mailGifted(cur.id)
                   ?`<div class="ib-gift done">${t('$1 collected')}</div>`
                   :`<button class="btn big ib-gift" data-ibgift="${cur.id}">${pixSVG('coin',14)} ${t('COLLECT $1')}</button>`):''}</div>`
            : `<div class="ib-body">${mailHtml(mailBody(cur))}</div>`}`
        :`<div class="center dim" style="padding:30px">${t('No messages.')}</div>`}
      </div>`;
    const ra=$('[data-ibreadall]',root);
    if(ra)ra.onclick=()=>{
      SFX.click();
      const r=mailRead();
      mailAll().forEach(m=>{if(!r.includes(m.id))r.push(m.id);});
      save();UI.updateTray();APPS.inbox.refresh(b,ent);
      UI.toast('mail',t('All messages marked as read.'));
    };
    const gf=$('[data-ibgift]',root);
    if(gf)gf.onclick=()=>{
      const id=gf.dataset.ibgift;
      if(mailGifted(id))return;
      G.mailGift.push(id);
      earn(1);SFX.cash();
      if(UI.floatFrom)UI.floatFrom(gf,'+$1');
      save();UI.refresh();APPS.inbox.refresh(b,ent);
    };
    $$('[data-mail]',root).forEach(x=>x.onclick=()=>{
      SFX.click();IV.sel=x.dataset.mail;mailFull=false;
      const r=mailRead();if(!r.includes(IV.sel)){r.push(IV.sel);save();}
      APPS.inbox.refresh(b,ent);UI.updateTray();
    });
    if(cur){const r=mailRead();if(!r.includes(cur.id)){r.push(cur.id);save();UI.updateTray();}}
    const st=ent.win.querySelector('.st1'),st2=ent.win.querySelector('.st2');
    if(st){st.textContent=t('{0} message(s)',list.length);st2.textContent=mailUnread()?t('{0} unread',mailUnread()):t('all read');}
  }
};
