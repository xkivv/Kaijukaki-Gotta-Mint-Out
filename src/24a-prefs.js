/* ================= REGISTRADOR DE PREFERENCIAS =================
   Tudo que o JOGADOR ajusta — COMO ele quer ver o jogo — mora num lugar so:
   G.prefs. Nada de partida entra aqui: dinheiro, Kaiju, dia e imposto
   continuam soltos em G. Preferencia e "como quero ver", nao "o que eu tenho".

   POR QUE isto existe: os ajustes estavam espalhados em quinze campos de G
   (ui, view, wgtPos, hudPos, iconPos...) e em umas vinte variaveis de modulo
   (mTab, wFilter, binPage, LM_TAB...) que nao entravam em save nenhum. O
   jogador reabria a janela e tudo voltava ao padrao. Com um registrador so,
   todo ajuste ganha de graca: padrao, saneamento na carga e gravacao na hora.

   CUIDADO COM SAVE ANTIGO: todo campo tem padrao e todo campo e saneado na
   carga. Save sem G.prefs abre nos padroes, em silencio. Preferencia ruim
   NUNCA pode derrubar o jogo — prefsNormalize() e a prova disso. */

/* tipos: e=lista fechada · b=liga/desliga · n=numero · s=texto ·
   xy=par de coordenadas · map=dicionario de id->valor · win=sessao */
const PREF_DEF={
  /* ---- tela e sistema ---- */
  uiSize:      {d:'l', e:['s','m','l','xl']},
  txtSize:     {d:'m', e:['s','m','l']},
  crt:         {d:true,  t:'b'},
  sound:       {d:true,  t:'b'},
  lang:        {d:'en', e:['en','pt']},
  fastReveal:  {d:false, t:'b'},

  /* ---- area de trabalho ---- */
  iconPos:     {d:{}, t:'map', v:'xy', max:80},
  iconSlot:    {d:{}, t:'map', v:'int', max:80},   /* slot fixo de cada icone na grade (ver iconSlotOf) */
  /* icones que o JOGADOR tirou da mesa (botao direito > Apps). Nada a ver
     com progressao: o app continua destravado, so nao esta na area de
     trabalho. Sem isto no registrador, a escolha morria no reload. */
  iconHide:    {d:{}, t:'map', v:'flag', max:80},
  wgt:         {d:{chart:1,gas:1,clock:1}, t:'map', v:'flag', max:24},
  wgtPos:      {d:{}, t:'map', v:'xy', max:24},
  wgtOrder:    {d:{}, t:'map', v:'int', max:24},   /* ordem de chegada dos paineis (pilha de fabrica) */
  wgtSize:     {d:{}, t:'map', v:'xy', max:24},
  wgtMini:     {d:{}, t:'map', v:'flag', max:24},
  chartZoom:   {d:24, t:'n', min:6, max:72, int:1},
  hudOff:      {d:false, t:'b'},
  hudMini:     {d:null,  t:'b', nul:1},   /* null = ainda nao decidido */
  hudPos:      {d:null,  t:'xy', nul:1},

  /* ---- carteira ---- */
  walletFilter:{d:'all', t:'s', max:32},
  walletSort:  {d:'new', e:['new','rare','old','id']},
  walletGrid:  {d:'m',   e:['s','m','l']},
  walletPage:  {d:0, t:'n', min:0, max:9999, int:1},

  /* ---- ficha de um Kaiju (carteira e mercado) ----
     A grade de traits abre fechada. O jogador decide UMA vez e a ficha
     seguinte ja abre do jeito dele — por isso mora aqui e nao numa
     variavel de modulo. */
  traitsOpen:  {d:false, t:'b'},

  /* ---- mercado ---- */
  mktTab:      {d:0, t:'n', min:0, max:3, int:1},
  mktFilter:   {d:'all', t:'s', max:32},
  mktSort:     {d:'deal', e:['deal','cheap','rare','binder']},
  mktSweepOpen:{d:false, t:'b'},
  mktSweepN:   {d:10, t:'n', min:1, max:999, int:1},
  offSize:     {d:'s', e:['s','m','l']},

  /* ---- kaijukaki.net / pagina de mint ---- */
  pageSize:    {d:'m', e:['s','m','l']},
  mintQty:     {d:1, t:'n', min:1, max:9999, int:1},
  siteFolds:   {d:{}, t:'map', v:'flag', max:12},
  lastMintTab: {d:'mine', e:['mine','top']},

  /* ---- Kaki+ ---- */
  knSize:      {d:'m', e:['s','m','l']},
  knFilter:    {d:'all', t:'s', max:32},
  dmSel:       {d:'', t:'s', max:48},

  /* ---- binder ---- */
  binPage:     {d:0, t:'n', min:0, max:59, int:1},
  binFilter:   {d:'all', t:'s', max:48},
  binSort:     {d:'rare', e:['rare','new','race']},

  /* ---- graficos ---- */
  chartScale:  {d:'h', e:['h','d']},

  /* ---- caixa de entrada ---- */
  mailSel:     {d:'', t:'s', max:64},

  /* ---- musica ---- */
  musicVol:    {d:0.5, t:'n', min:0, max:1},
  musicTrack:  {d:'', t:'s', max:24},
  musicOn:     {d:false, t:'b'},

  /* ---- abas das janelas com abas ---- */
  hubTab:      {d:{}, t:'map', v:'str', max:12},

  /* ---- a sessao: quais janelas estavam abertas, onde e como ---- */
  win:         {d:[], t:'win'},
  winFocus:    {d:'', t:'s', max:32}
};

function prefClone(v){
  if(Array.isArray(v))return v.slice();
  if(v&&typeof v==='object')return Object.assign({},v);
  return v;
}
function prefDefault(k){const D=PREF_DEF[k];return D?prefClone(D.d):undefined;}

/* ---------- saneamento ----------
   Um valor invalido vira o padrao. Nada aqui pode lancar excecao: e este
   arquivo que garante que uma preferencia corrompida nao impeca o jogo de
   abrir (o caminho de "save corrompido" fica reservado pro save de verdade). */
function prefCoerce(k,v){
  const D=PREF_DEF[k];
  if(!D)return undefined;
  try{
    if(D.e)return D.e.indexOf(v)>=0?v:prefClone(D.d);
    switch(D.t){
      case 'b':
        if(D.nul&&(v===null||v===undefined))return null;
        return !!v;
      case 'n':{
        let n=+v;
        if(!isFinite(n))return D.d;
        n=Math.min(D.max,Math.max(D.min,n));
        return D.int?Math.round(n):n;
      }
      case 's':
        if(typeof v!=='string')return prefClone(D.d);
        return v.slice(0,D.max||64);
      case 'xy':{
        if(D.nul&&(v===null||v===undefined))return null;
        if(!Array.isArray(v))return prefClone(D.d);
        const a=+v[0],b=+v[1];
        if(!isFinite(a)||!isFinite(b))return prefClone(D.d);
        return [Math.round(a),Math.round(b)];
      }
      case 'map':{
        if(!v||typeof v!=='object'||Array.isArray(v))return prefClone(D.d);
        const out={},ks=Object.keys(v).slice(0,D.max||32);
        ks.forEach(id=>{
          if(String(id).length>64)return;
          const x=v[id];
          if(D.v==='flag')out[id]=x?1:0;
          else if(D.v==='int'){const n=+x;if(!isFinite(n)||n<0)return;out[id]=Math.round(n);}
          else if(D.v==='str')out[id]=typeof x==='string'?x.slice(0,32):'';
          else if(D.v==='xy'){
            if(!Array.isArray(x))return;
            const a=+x[0],b=+x[1];
            if(!isFinite(a)||!isFinite(b))return;
            out[id]=[Math.round(a),Math.round(b)];
          }
        });
        return out;
      }
      case 'win':return prefCoerceWins(v);
    }
  }catch(e){}
  return prefClone(D.d);
}
/* uma janela guardada: id, geometria, estado e a aba que estava aberta */
function prefCoerceWins(v){
  if(!Array.isArray(v))return [];
  const out=[];
  for(let i=0;i<v.length&&out.length<10;i++){
    const w=v[i];
    if(!w||typeof w!=='object'||typeof w.id!=='string'||w.id.length>32)continue;
    const num=(x,dv)=>{const n=+x;return isFinite(n)?Math.round(n):dv;};
    out.push({
      id:w.id,
      arg:typeof w.arg==='string'?w.arg.slice(0,64):'',
      x:num(w.x,40), y:num(w.y,40),
      w:Math.max(160,Math.min(4000,num(w.w,420))),
      h:Math.max(110,Math.min(4000,num(w.h,340))),
      min:!!w.min, max:!!w.max
    });
  }
  return out;
}
function prefsDefaults(){
  const o={};
  Object.keys(PREF_DEF).forEach(k=>{o[k]=prefDefault(k);});
  return o;
}
/* chamado pelo migrate(): aceita save antigo, save novo e save torto */
function prefsNormalize(g){
  let src=null;
  try{ if(g&&g.prefs&&typeof g.prefs==='object'&&!Array.isArray(g.prefs))src=g.prefs; }catch(e){}
  const out=prefsDefaults();
  if(src)Object.keys(PREF_DEF).forEach(k=>{
    if(src[k]===undefined)return;
    const v=prefCoerce(k,src[k]);
    if(v!==undefined)out[k]=v;
  });
  return out;
}
/* ---------- saves de ANTES do registrador ----------
   Quem ja jogava tinha o tamanho da interface, o idioma, o volume e a posicao
   dos painéis guardados soltos em G. Nada disso pode se perder na virada:
   copia pra dentro de G.prefs uma unica vez e apaga o campo velho, pra nao
   ficar com duas verdades sobre a mesma coisa. */
function prefsAdopt(g){
  const P=g.prefs;
  const mv=(cond,k,v)=>{if(cond&&v!==undefined&&v!==null){const c=prefCoerce(k,v);if(c!==undefined)P[k]=c;}};
  const u=(g.ui&&typeof g.ui==='object')?g.ui:null;
  if(u){
    mv(u.size!==undefined,'uiSize',u.size);
    mv(u.text!==undefined,'txtSize',u.text);
    mv(u.grid!==undefined,'walletGrid',u.grid);
    mv(u.offSize!==undefined,'offSize',u.offSize);
    mv(u.fastReveal!==undefined,'fastReveal',!!u.fastReveal);
  }
  const w=(g.view&&typeof g.view==='object')?g.view:null;
  if(w){
    mv(w.kn!==undefined,'knSize',w.kn);
    mv(w.page!==undefined,'pageSize',w.page);
  }
  mv(g.lang!==undefined,'lang',g.lang);
  mv(g.musicVol!==undefined,'musicVol',g.musicVol);
  mv(g.iconPos!==undefined,'iconPos',g.iconPos);
  mv(g.wgt!==undefined,'wgt',g.wgt);
  mv(g.wgtPos!==undefined,'wgtPos',g.wgtPos);
  mv(g.wgtSize!==undefined,'wgtSize',g.wgtSize);
  mv(g.wgtMini!==undefined,'wgtMini',g.wgtMini);
  mv(g.hudPos!==undefined,'hudPos',g.hudPos);
  if(g.hudMini!==undefined&&g.hudMini!==null)P.hudMini=!!g.hudMini;
  if(g.hudOff!==undefined)P.hudOff=!!g.hudOff;
  ['ui','view','lang','musicVol','iconPos','wgt','wgtPos','wgtSize','wgtMini','hudPos','hudMini','hudOff']
    .forEach(k=>{delete g[k];});
  return g;
}

/* ---------- ler e escrever ---------- */
function prefsRoot(){
  if(typeof G==='undefined'||!G)return null;
  if(!G.prefs||typeof G.prefs!=='object'||Array.isArray(G.prefs))G.prefs=prefsDefaults();
  return G.prefs;
}
function pref(k){
  const P=prefsRoot();
  if(!P)return prefDefault(k);
  const v=P[k];
  return v===undefined?(P[k]=prefDefault(k)):v;
}
/* Escrever grava NA HORA — mas so quando o valor muda de verdade. Sem essa
   comparacao, um refresh que reescreve a pagina atual da carteira chamaria
   save() dezenas de vezes por minuto sem nenhum motivo. */
function setPref(k,v,quiet){
  const P=prefsRoot();
  if(!P)return;
  const c=prefCoerce(k,v);
  if(c===undefined)return;
  const old=P[k];
  const same=(old===c)||(Array.isArray(old)&&Array.isArray(c)&&old.length===c.length&&old.every((x,i)=>x===c[i]));
  P[k]=c;
  if(!same&&!quiet&&typeof save==='function')save();
}
/* dicionarios (posicao de icone, dobras da pagina...) sao mexidos no lugar:
   devolve o objeto vivo e quem mexeu chama prefSave() */
function prefMap(k){
  const P=prefsRoot();
  if(!P)return prefDefault(k)||{};
  if(!P[k]||typeof P[k]!=='object'||Array.isArray(P[k]))P[k]=prefDefault(k);
  return P[k];
}
function prefSave(){if(typeof save==='function')save();}
/* Ajuste que chega em rajada (roda do mouse, pinca): escreve na hora e grava
   uma vez so, quando a rajada para. */
let prefSoonT=0;
function setPrefSoon(k,v){
  setPref(k,v,true);
  clearTimeout(prefSoonT);
  prefSoonT=setTimeout(()=>{if(typeof save==='function')save();},420);
}
/* espelho com nomes curtos: ler e escrever no objeto mexe direto no
   registrador, entao o codigo dos apps continua parecendo variavel solta */
function prefView(map){
  const o={};
  Object.keys(map).forEach(nome=>{
    const k=map[nome];
    Object.defineProperty(o,nome,{
      enumerable:true,
      get(){return pref(k);},
      set(v){setPref(k,v);}
    });
  });
  return o;
}

/* ---------- a sessao de janelas ----------
   Guarda o que o JOGADOR deixou aberto. Janela que o jogo abre sozinho por
   evento (o Mr. Kaiju numa auditoria) fica marcada como automatica e nao
   entra — reabrir o jogo nao pode reabrir uma cobranca. */
function winRemember(){
  if(typeof UI==='undefined'||!UI.winSnapshot)return;
  try{
    const s=UI.winSnapshot();
    setPref('win',s.list,true);
    setPref('winFocus',s.focus||'',true);
  }catch(e){}
}
