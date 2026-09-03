/* ================= MR. KAIJU — MS PAINT DOODLE =================
   Hand-drawn look: every stroke is re-jittered between 3 fixed variants at
   ~8fps, which is the "boiling line" trick from paper animation. Nothing is
   pre-rendered, so it never looks like a pasted asset. */
function dRnd(seed){return mulberry(hash32('doodle'+seed));}

function doodleScene(cv,W,H){
  const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=W*dpr;cv.height=H*dpr;
  cv.style.width='100%';cv.style.aspectRatio=W+'/'+H;
  const g=cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  g.lineJoin='round';g.lineCap='round';
  return g;
}
/* wobbly polyline: pts = [[x,y],...] */
function wpath(g,pts,seed,amp){
  const r=dRnd(seed);amp=amp==null?1.6:amp;
  g.beginPath();
  pts.forEach((p,i)=>{
    const x=p[0]+(r()-.5)*amp*2, y=p[1]+(r()-.5)*amp*2;
    i?g.lineTo(x,y):g.moveTo(x,y);
  });
}
function wblob(g,cx,cy,rx,ry,seed,amp,n){
  const r=dRnd(seed);n=n||16;amp=amp==null?3:amp;
  g.beginPath();
  for(let i=0;i<=n;i++){
    const a=i/n*Math.PI*2;
    const k=1+(r()-.5)*amp*0.05;
    const x=cx+Math.cos(a)*rx*k, y=cy+Math.sin(a)*ry*k;
    i?g.lineTo(x,y):g.moveTo(x,y);
  }
  g.closePath();
}
function inkFill(g,fill,stroke,w){
  if(fill){g.fillStyle=fill;g.fill();}
  g.lineWidth=w||3.4;g.strokeStyle=stroke||'#141414';g.stroke();
}

function drawMrKaiju(g,W,H,st){
  const boil=st.boil, bob=Math.sin(st.t*2.1)*4, breathe=1+Math.sin(st.t*2.1)*0.012;
  g.clearRect(0,0,W,H);
  /* paper */
  g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
  /* scribbled floor line */
  g.lineWidth=2.4;g.strokeStyle='#c9c9c9';
  wpath(g,[[10,H-22],[W*0.3,H-26],[W*0.62,H-20],[W-12,H-25]],boil+91,2.2);g.stroke();

  g.save();
  g.translate(W*0.52,bob);
  g.save();g.translate(0,H*0.5);g.scale(1,breathe);g.translate(0,-H*0.5);

  /* --- briefcase (behind arm) --- */
  g.save();g.translate(-150,H*0.62+Math.sin(st.t*2.1+0.6)*3);g.rotate(-0.05);
  wpath(g,[[-34,-24],[34,-26],[36,26],[-36,24],[-34,-24]],boil+7,1.8);
  inkFill(g,'#9a6b34','#141414',3.4);
  wpath(g,[[-36,-4],[36,-6]],boil+8,1.5);g.lineWidth=2.6;g.stroke();
  wpath(g,[[-10,-26],[-9,-38],[9,-38],[10,-26]],boil+9,1.5);g.lineWidth=3;g.stroke();
  g.fillStyle='#141414';g.font='bold 15px Tahoma, sans-serif';g.textAlign='center';
  g.fillText('TAX',0,10);
  g.restore();

  /* --- suit body --- */
  wpath(g,[[-92,H*0.98],[-70,H*0.52],[-34,H*0.44],[0,H*0.50],[34,H*0.44],[70,H*0.52],[92,H*0.98]],boil+2,2.2);
  inkFill(g,'#2c2f33','#141414',3.6);
  /* shirt */
  wpath(g,[[-26,H*0.46],[0,H*0.72],[26,H*0.46],[14,H*0.44],[0,H*0.56],[-14,H*0.44],[-26,H*0.46]],boil+3,1.6);
  inkFill(g,'#f2f2ee','#141414',3);
  /* tie */
  wpath(g,[[0,H*0.52],[10,H*0.60],[4,H*0.86],[-4,H*0.86],[-10,H*0.60],[0,H*0.52]],boil+4,1.5);
  inkFill(g,'#b5342a','#141414',3);

  /* --- pointing arm --- */
  const wave=Math.sin(st.t*3.1)*0.16;
  g.save();g.translate(64,H*0.56);g.rotate(-0.5+wave);
  wpath(g,[[0,0],[62,-6],[64,14],[2,20],[0,0]],boil+5,1.8);
  inkFill(g,'#2c2f33','#141414',3.4);
  g.save();g.translate(66,4);
  wblob(g,0,0,17,15,boil+6,3,12);inkFill(g,'#6f9c3a','#141414',3.4);
  wpath(g,[[8,-2],[34,-6]],boil+61,1.4);g.lineWidth=7;g.strokeStyle='#6f9c3a';g.stroke();
  g.lineWidth=3.2;g.strokeStyle='#141414';
  wpath(g,[[8,-8],[34,-11],[36,-1],[9,3]],boil+62,1.4);g.stroke();
  g.restore();
  g.restore();

  /* --- head --- */
  g.save();g.translate(0,H*0.30);
  /* horns */
  wpath(g,[[-52,-38],[-70,-84],[-38,-56]],boil+11,2);inkFill(g,'#d8cba6','#141414',3.4);
  wpath(g,[[52,-38],[70,-84],[38,-56]],boil+12,2);inkFill(g,'#d8cba6','#141414',3.4);
  /* skull */
  wblob(g,0,0,76,64,boil+13,3.2,18);inkFill(g,'#6f9c3a','#141414',3.8);
  /* cheek shading */
  g.save();g.globalAlpha=.30;wblob(g,34,18,26,20,boil+14,4,10);g.fillStyle='#4a7222';g.fill();g.restore();
  /* brows */
  g.lineWidth=4.4;g.strokeStyle='#141414';
  wpath(g,[[-52,-24],[-16,-10]],boil+15,1.6);g.stroke();
  wpath(g,[[52,-24],[16,-10]],boil+16,1.6);g.stroke();
  /* eyes */
  const blink=st.blink;
  if(blink){
    g.lineWidth=3.6;
    wpath(g,[[-42,-2],[-16,-2]],boil+17,1.2);g.stroke();
    wpath(g,[[16,-2],[42,-2]],boil+18,1.2);g.stroke();
  } else {
    wblob(g,-29,-2,15,13,boil+17,3,12);inkFill(g,'#ffffff','#141414',3.2);
    wblob(g,29,-2,15,13,boil+18,3,12);inkFill(g,'#ffffff','#141414',3.2);
    const lx=Math.sin(st.t*1.3)*3;
    g.fillStyle='#141414';
    g.beginPath();g.arc(-27+lx,0,6,0,7);g.fill();
    g.beginPath();g.arc(31+lx,0,6,0,7);g.fill();
  }
  /* snout + mouth */
  const open=6+Math.abs(Math.sin(st.t*2.6))*14;
  wpath(g,[[-46,26],[-20,22],[0,26],[20,22],[46,26],
           [38,26+open],[0,34+open],[-38,26+open],[-46,26]],boil+19,2);
  inkFill(g,'#4a1f1a','#141414',3.6);
  /* teeth */
  g.fillStyle='#f6f4ec';g.strokeStyle='#141414';g.lineWidth=2.4;
  for(let i=-3;i<=3;i++){
    const x=i*13;
    wpath(g,[[x-5,26],[x+5,26],[x,26+9]],boil+20+i,1.1);
    g.fill();g.stroke();
  }
  /* nostrils */
  g.fillStyle='#141414';
  g.beginPath();g.ellipse(-12,16,3.4,2.4,0,0,7);g.fill();
  g.beginPath();g.ellipse(12,16,3.4,2.4,0,0,7);g.fill();
  g.restore();
  g.restore();
  g.restore();

  /* --- floating coins --- */
  for(let i=0;i<3;i++){
    const ph=st.t*1.5+i*2.1;
    const x=W*0.14+i*26, y=H*0.42+Math.sin(ph)*16;
    g.save();g.translate(x,y);g.scale(Math.cos(ph*0.8),1);
    wblob(g,0,0,11,11,boil+40+i,3,10);inkFill(g,'#d8b64a','#141414',3);
    g.fillStyle='#141414';g.font='bold 12px Tahoma, sans-serif';g.textAlign='center';g.fillText('$',0,4);
    g.restore();
  }
}

function mountDoodle(cv,W,H){
  const g=doodleScene(cv,W,H);
  const st={t:0,boil:0,blink:false};
  let raf=0,last=performance.now(),boilAcc=0,blinkAt=1.8+Math.random()*2;
  const loop=now=>{
    if(!cv.isConnected){cancelAnimationFrame(raf);return;}
    const dt=Math.min(.05,(now-last)/1000);last=now;
    st.t+=dt;boilAcc+=dt;
    if(boilAcc>0.125){boilAcc=0;st.boil=(st.boil+1)%3;}
    if(st.t>blinkAt){st.blink=st.t<blinkAt+0.13;if(st.t>blinkAt+0.13){blinkAt=st.t+1.6+Math.random()*2.4;st.blink=false;}}
    drawMrKaiju(g,W,H,st);
    raf=requestAnimationFrame(loop);
  };
  raf=requestAnimationFrame(loop);
  return {stop(){cancelAnimationFrame(raf);}};
}
