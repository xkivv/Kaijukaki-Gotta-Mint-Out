/* ================= SHELL: context menus, error boxes, gags ================= */

/* ---- classic "action not allowed" box ---- */
function errorBox(title,msg,opts){
  SFX.error();
  return UI.dialog(title,msg,'xerr',opts||{});
}

/* ---- context menu ---- */
let ctxEl=null;
function closeCtx(){if(ctxEl){ctxEl.remove();ctxEl=null;}}
function ctxMenu(x,y,items){
  closeCtx();
  const m=el('div','ctxmenu');
  m.innerHTML=items.map((i,idx)=>i.sep
    ? '<div class="ctx-sep"></div>'
    : `<div class="ctx-item${i.dis?' dis':''}${i.bold?' bold':''}" data-i="${idx}">${i.ico?pixSVG(i.ico,Math.round(16*(typeof uiScale==='function'?uiScale():1))):'<span class="ctx-gap"></span>'}<span>${i.lbl}</span>${i.sub?'<b>&#9654;</b>':''}</div>`
  ).join('');
  $('#screen').appendChild(m);
  const B=UI.bounds();
  m.style.left=Math.min(x,B.w-m.offsetWidth-4)+'px';
  m.style.top=Math.min(y,B.h-m.offsetHeight-4)+'px';
  ctxEl=m;
  $$('.ctx-item',m).forEach(n=>{
    n.onclick=()=>{
      const it=items[+n.dataset.i];
      if(!it||it.dis)return;
      SFX.click();closeCtx();
      if(it.fn)it.fn();
    };
  });
  return m;
}

/* ---- popup spam gag ---- */
const SPAM_LINES={
 en:["You cannot delete your own accountant.",
     "Mr. Kaiju has been notified of this attempt.",
     "Deleting the tax collector is, ironically, tax fraud.",
     "He is already in your wallet. Deleting the icon changes nothing.",
     "Nice try. He has your address.",
     "This action has been logged. Twice.",
     "The Kaiju Revenue Service thanks you for your cooperation.",
     "Okay, last one. Please stop."],
 pt:["Você não pode excluir o seu próprio contador.",
     "O Sr. Kaiju foi notificado dessa tentativa.",
     "Excluir o fiscal é, ironicamente, sonegação.",
     "Ele já está dentro da sua carteira. Excluir o ícone não muda nada.",
     "Boa tentativa. Ele tem o seu endereço.",
     "Essa ação foi registrada. Duas vezes.",
     "A Receita Kaiju agradece a sua colaboração.",
     "Tá, esse é o último. Para, por favor."]
};
function popupSpam(){
  const lines=(SPAM_LINES[LANG]||SPAM_LINES.en).slice();
  const B=UI.bounds();
  let left=lines.length;
  lines.forEach((line,i)=>{
    setTimeout(()=>{
      const w=el('div','win spampop popspam opening');
      const x=clamp(40+Math.random()*(B.w-300),4,Math.max(4,B.w-270));
      const y=clamp(40+Math.random()*(B.h-220),4,Math.max(4,B.h-170));
      w.style.cssText=`left:${x}px;top:${y}px;width:262px;z-index:${7000+i}`;
      w.innerHTML=`<div class="titlebar danger-bar">${pixSVG('xerr',14,'tico')}<span class="ttl">${t('Access denied')}</span>
          <div class="tbtns"><button class="tb" data-x="1"><svg viewBox="0 0 9 9"><path d="M1 1 L8 8 M8 1 L1 8" stroke="#000" stroke-width="1.6"/></svg></button></div></div>
        <div class="wbody" style="background:var(--face)">
          <div class="pad" style="display:flex;gap:10px;align-items:flex-start">
            ${pixSVG('xerr',32)}<div style="flex:1;font-size:calc(12px * var(--fs));line-height:1.5">${line}</div>
          </div>
          <div class="row" style="justify-content:center;padding:0 10px 11px"><button class="btn" data-x="1">${t('OK')}</button></div>
        </div>`;
      $('#screen').appendChild(w);
      setTimeout(()=>w.classList.remove('opening'),180);
      SFX.error();
      $$('[data-x]',w).forEach(btn=>btn.onclick=()=>{
        SFX.click();w.classList.add('closing');
        setTimeout(()=>w.remove(),140);
        if(--left<=0)setTimeout(()=>{
          UI.dialog(t('Mr. Kaiju'),t('He watched you close every single one of those.<br><br>Enjoy your audit.'),'kaiju');
        },320);
      });
    },i*260);
  });
}

/* ---- user-made desktop notes ---- */
function userNotes(){G.notes=G.notes||[];return G.notes;}
function newNote(){
  const notes=userNotes();
  let n=1,name;
  do{name=(n===1?t('New Text Document')+'.txt':t('New Text Document')+' ('+n+').txt');n++;}while(notes.some(x=>x.name===name));
  notes.push({name,text:''});
  SFX.click();buildDesktop();save();
  UI.toast('notepad',t('Created {0}',name));
}
APPS.note={
  title:'Notepad', icon:'notepad', w:400, h:300, sunken:true, menu:['File','Edit','Format ','Help'],
  build(b,ent,arg){
    ent.note=arg;
    const note=userNotes().find(x=>x.name===arg)||{name:arg,text:''};
    const ttl=ent.win.querySelector('.ttl');if(ttl)ttl.textContent=note.name+' - '+t('Notepad');
    b.style.background='#fff';
    b.innerHTML=`<textarea data-note="1" spellcheck="false" style="width:100%;height:100%;border:0;outline:0;resize:none;
      font-family:'Courier New',monospace;font-size:calc(13px * var(--fs));padding:8px;box-sizing:border-box;background:#fff;color:#111"></textarea>`;
    const ta=$('[data-note]',b);
    ta.value=note.text;
    ta.oninput=()=>{note.text=ta.value;save();};
    ta.style.userSelect='text';
  }
};

/* ---- date & time applet (blocked on purpose) ---- */
APPS.datetime={
  title:'Date/Time Properties', icon:'coin', w:320, h:300,
  build(b,ent){
    const days=['S','M','T','W','T','F','S'];
    const dim=[31,28,31,30,31,30,31,31,30,31,30,31];
    const month=(G.day-1)%12, year=1999;
    b.innerHTML=`<div class="pad">
      <div class="fieldset"><span class="lg">${t('Date & Time')}</span>
        <div class="row" style="gap:6px;margin-bottom:7px">
          <select data-dtm="1">${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>`<option ${i===month?'selected':''}>${m}</option>`).join('')}</select>
          <input type="text" data-dty="1" value="${year}" style="width:64px">
        </div>
        <table class="lst cal"><thead><tr>${days.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>
        ${(()=>{let out='',d=1;for(let r=0;r<5;r++){out+='<tr>';for(let c=0;c<7;c++){
          const show=d<=dim[month];out+=`<td class="${d===((G.day-1)%28)+1?'today':''}">${show?d:''}</td>`;if(show)d++;}
          out+='</tr>';}return out;})()}
        </tbody></table>
        <div class="row" style="margin-top:8px;justify-content:center">
          <span class="mono" style="font-size:calc(22px * var(--fs))">${pad2(G.hour%24)}:${pad2(G.min)}:00</span>
        </div>
      </div>
      <div class="row" style="justify-content:flex-end;gap:6px">
        <button class="btn" data-dtok="1">${t('OK')}</button>
        <button class="btn" data-dtcancel="1">${t('Cancel')}</button>
        <button class="btn" data-dtapply="1">${t('Apply')}</button>
      </div>
    </div>`;
    const block=()=>errorBox(t('Date/Time'),t('The system clock is controlled by the game.<br><br>Nice try, though. Time only moves when you do something.'));
    $$('[data-dtm],[data-dty]',b).forEach(x=>{x.onchange=block;x.onkeydown=e=>{e.preventDefault();block();};});
    $$('.cal td',b).forEach(td=>td.onclick=block);
    $('[data-dtok]',b).onclick=()=>{SFX.click();UI.closeApp('datetime');};
    $('[data-dtcancel]',b).onclick=()=>{SFX.click();UI.closeApp('datetime');};
    $('[data-dtapply]',b).onclick=block;
  }
};
