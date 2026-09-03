/* ================= HUB WINDOWS =================
   Related tools live in one window with tabs instead of five desktop icons. */
const HUB_DEF={
  hubwallet:{title:'Kaiju Wallet', icon:'wallet', w:660, h:540, tabs:[
    {id:'wallet', lbl:'Wallet',  ico:'wallet'},
    {id:'binder', lbl:'Binder',  ico:'binder', hide:()=>!unlocked('tab_binder')},
    {id:'profile',lbl:'Ranks', ico:'chart', hide:()=>!unlocked('tab_profile')}
  ]},
  /* 640 nao cabia o rotulo da resposta em portugues: "Avisar que ela foi
     hackeada" ao lado do selo de efeito ficava cortado com reticencias. */
  hubsocial:{title:'Kaki+', icon:'kaki', w:720, h:560, tabs:[
    {id:'kaijunet', lbl:'Feed',     ico:'kaki'},
    {id:'dm',       lbl:'Messages',  ico:'mail', hide:()=>!unlocked('tab_dm')}
  ]},
  hubmarket:{title:'Kaiju Market', icon:'market', w:660, h:580, tabs:[
    {id:'market', lbl:'Market',        ico:'market'},
    {id:'vault',  lbl:'Staking Vault', ico:'vault', lock:()=>!vaultUnlocked(), hide:()=>!unlocked('tab_vault')}
  ]}
};
const HUB_OF={wallet:'hubwallet',binder:'hubwallet',profile:'hubwallet',
              market:'hubmarket',vault:'hubmarket',
              kaijunet:'hubsocial',dm:'hubsocial'};

/* ---------- a aba aberta e preferencia ----------
   Fechar e reabrir a janela nao pode jogar o jogador de volta na primeira aba:
   a escolha dele mora no registrador (G.prefs.hubTab). */
function hubTabPref(hid){
  const m=(typeof prefMap==='function')?prefMap('hubTab'):{};
  const v=m[hid];
  return (v&&HUB_DEF[hid]&&HUB_DEF[hid].tabs.some(x=>x.id===v&&!(x.hide&&x.hide())))?v:'';
}
function setHubTabPref(hid,tab){
  const m=(typeof prefMap==='function')?prefMap('hubTab'):null;
  if(!m||m[hid]===tab)return;
  m[hid]=tab;
  if(typeof prefSave==='function')prefSave();
}

Object.keys(HUB_DEF).forEach(hid=>{
  const D=HUB_DEF[hid];
  APPS[hid]={
    title:D.title, icon:D.icon, w:D.w, h:D.h, status:true, hub:hid,
    build(b,ent,arg){
      ent.tab=(arg&&D.tabs.some(x=>x.id===arg))?arg:(hubTabPref(hid)||D.tabs[0].id);
      ent.mounted=null;
      b.innerHTML='<div class="hubwrap"><div class="hubtabs"></div><div class="hubbody"></div></div>';
      renderHub(hid,b,ent);
    },
    refresh(b,ent){renderHub(hid,b,ent);},
    onResize(b,ent){
      const sub=APPS[ent.tab];
      if(sub&&sub.onResize)sub.onResize($('.hubbody',b),ent);
    }
  };
});

function hubTabTo(hid,tab){
  const ent=UI.open[hid];
  if(!ent)return UI.openApp(hid,tab);
  ent.tab=tab;
  renderHub(hid,ent.body,ent);
  UI.focus(hid);
}
function renderHub(hid,b,ent){
  const D=HUB_DEF[hid];
  const tabs=$('.hubtabs',b), body=$('.hubbody',b);
  if(!tabs||!body)return;
  /* MODO HISTORIA: aba que ainda nao foi entregue nem aparece. Diferente de
     `lock`, que MOSTRA o cadeado — aqui a pessoa nem sabe que existe ainda,
     e e isso que faz a hora de aparecer valer alguma coisa. */
  const vis=D.tabs.filter(x=>!(x.hide&&x.hide()));
  const lista=vis.length?vis:[D.tabs[0]];
  const cur=lista.find(x=>x.id===ent.tab)||lista[0];
  /* aba trancada guardada no save nao pode prender a janela numa tela vazia */
  if(cur.lock&&cur.lock()){ent.tab=lista[0].id;return renderHub(hid,b,ent);}
  ent.tab=cur.id;
  setHubTabPref(hid,cur.id);
  tabs.innerHTML=lista.map(x=>{
    const locked=x.lock&&x.lock();
    return `<div class="tab hubtab${x.id===ent.tab?' on':''}${locked?' lock':''}" data-ht="${x.id}">
      ${pixSVG(x.ico,14)}<span>${t(x.lbl)}</span>${locked?'<i class="hl">&#128274;</i>':''}</div>`;
  }).join('');
  $$('[data-ht]',tabs).forEach(n=>n.onclick=()=>{
    const id=n.dataset.ht;
    const def=lista.find(x=>x.id===id);
    if(def.lock&&def.lock()){
      SFX.error();
      UI.dialog(t('Staking Vault'),
        t('The vault opens at level {0} ({1}). Hold {2} Kaiju to get there.',
          VAULT_LEVEL,LEVELS[VAULT_LEVEL-1].n,num(LEVELS[VAULT_LEVEL-1].req)),'warn');
      return;
    }
    if(id===ent.tab)return;
    SFX.click();ent.tab=id;renderHub(hid,b,ent);
  });
  const ttl=ent.win.querySelector('.ttl');
  if(ttl)ttl.textContent=t(D.title)+' — '+t(cur.lbl);
  const tb=$('#tb_'+hid);
  if(tb){const sp=tb.querySelector('.tt');if(sp)sp.textContent=t(cur.lbl);}
  const sub=APPS[ent.tab];
  if(!sub)return;
  if(ent.mounted!==ent.tab){
    body.innerHTML='';
    ent.mounted=ent.tab;
    body.className='hubbody sub-'+ent.tab;
    sub.build(body,ent);
  } else if(sub.refresh){
    sub.refresh(body,ent);
  }
}
