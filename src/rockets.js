// ================= 3D ROCKET BUILDER =================
const MAT = (()=>{
  const m = (c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.45,metalness:.15},o));
  function bandTex(){ const c=document.createElement('canvas'); c.width=256; c.height=64; const x=c.getContext('2d');
    x.fillStyle='#f1f3f6'; x.fillRect(0,0,256,64); x.fillStyle='#16181c'; x.fillRect(0,0,32,64); x.fillRect(128,0,32,64);
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
  function steelTex(){ const c=document.createElement('canvas'); c.width=256; c.height=256; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,256,0); g.addColorStop(0,'#8c939b'); g.addColorStop(.5,'#d6dbe0'); g.addColorStop(1,'#8c939b'); x.fillStyle=g; x.fillRect(0,0,256,256);
    x.strokeStyle='rgba(60,60,70,.35)'; x.lineWidth=1; for(let y=0;y<256;y+=16){ x.beginPath(); x.moveTo(0,y); x.lineTo(256,y); x.stroke(); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,6); return t; }
  function foamTex(){ const c=document.createElement('canvas'); c.width=128; c.height=128; const x=c.getContext('2d'); x.fillStyle='#d4762f'; x.fillRect(0,0,128,128);
    for(let i=0;i<900;i++){ x.fillStyle=`rgba(${120+Math.random()*80|0},${60+Math.random()*40|0},20,${Math.random()*.25})`; x.fillRect(Math.random()*128,Math.random()*128,2+Math.random()*3,2+Math.random()*3); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,8); return t; }
  return {
    white:m(0xf1f3f6), dark:m(0x1f232a,{roughness:.6}), black:m(0x17191d,{roughness:.55,metalness:.3}),
    steel:m(0xffffff,{map:steelTex(),metalness:.85,roughness:.32}), orange:m(0xffffff,{map:foamTex(),roughness:.85}),
    orange2:m(0xd8732c,{roughness:.6}), tan:m(0xd28a44,{roughness:.7}), grey:m(0x9aa49a,{roughness:.55}),
    whiteblack:m(0xffffff,{map:bandTex()}), engine:m(0x2a2d33,{metalness:.8,roughness:.35}), bell:m(0x55524e,{metalness:.9,roughness:.3,side:THREE.DoubleSide}),
    fin:m(0x26292f), leg:m(0x1a1c20,{metalness:.4}), gold:m(0xd4a64a,{metalness:.9,roughness:.3})
  };
})();

function textTex(txt){ const c=document.createElement('canvas'); c.width=512; c.height=96; const x=c.getContext('2d');
  x.clearRect(0,0,512,96); x.fillStyle='#14161a'; x.font='bold 64px "Space Grotesk",Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(txt,256,52);
  const t=new THREE.CanvasTexture(c); return t; }

function ogive(r,h,seg=32,phiStart=0,phiLen=Math.PI*2){ const pts=[];
  for(let i=0;i<=20;i++){ const t=i/20; const y=t*h; const rr=r*Math.sqrt(Math.max(0,1-Math.pow(t,1.9))); pts.push(new THREE.Vector2(Math.max(rr,.001),y)); }
  return new THREE.LatheGeometry(pts,seg,phiStart,phiLen); }

function buildRocket(key){
  const spec = ROCKETS[key]||ROCKETS.generic;
  const root = new THREE.Group();
  const stages = {1:new THREE.Group(),2:new THREE.Group(),3:new THREE.Group()};
  Object.values(stages).forEach(g=>root.add(g));
  const coreR = spec.parts[0].r;
  let y = 0; const labels=[]; const partMeshes=[];
  const fairingHalves=[];
  spec.parts.forEach(p=>{
    const g = stages[p.stage]; const mat = MAT[p.c]||MAT.white;
    if(p.fairing){
      const cylH=p.h*.5, noseH=p.h*.5, base=new THREE.Group(); base.position.y=y;
      // boat-tail from core radius to fairing radius
      const prev = coreR; const bt = p.r>prev*1.05 ? Math.min(1.2,p.h*.08) : 0;
      for(let s=0;s<2;s++){ const half=new THREE.Group();
        if(bt){ const tg=new THREE.CylinderGeometry(p.r,Math.min(prev,p.r),bt,24,1,true,s*Math.PI,Math.PI); const tm=new THREE.Mesh(tg,mat); tm.position.y=bt/2; half.add(tm); }
        const cg=new THREE.CylinderGeometry(p.r,p.r,cylH-bt,32,1,true,s*Math.PI,Math.PI); const cm=new THREE.Mesh(cg,mat); cm.position.y=bt+(cylH-bt)/2; half.add(cm);
        const og=ogive(p.r,noseH,32,s*Math.PI,Math.PI); const om=new THREE.Mesh(og,mat); om.position.y=cylH; half.add(om);
        half.userData.dir = s===0?1:-1; half.userData.base=base; base.add(half); fairingHalves.push(half); }
      g.add(base);
    } else if(p.nose){
      const m=new THREE.Mesh(ogive(p.r,p.h),mat); m.position.y=y; g.add(m);
    } else if(p.tower){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(p.r*.35,p.r,p.h*.75,12),mat); t.position.y=y+p.h*.375; g.add(t);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(p.r*.5,p.h*.25,12),MAT.dark); tip.position.y=y+p.h*.875; g.add(tip);
    } else {
      const geo=new THREE.CylinderGeometry(p.r,p.r2||p.r,p.h,40); const m=new THREE.Mesh(geo,mat); m.position.y=y+p.h/2; m.castShadow=true; g.add(m); partMeshes.push({mesh:m,part:p,y0:y});
      if(p.c==='whiteblack'&&mat.map){ mat.map.repeat.set(1,1); }
    }
    if(p.label) labels.push({text:p.label,y:y+p.h/2,stage:p.stage});
    y += p.h;
  });
  const top = y;
  const s1Top = spec.parts.filter(p=>p.stage===1).reduce((a,p)=>a+p.h,0);
  // engines
  const e=spec.eng||{n:1,layout:'one',bell:.3};
  const pos=[]; const R=coreR*.68;
  if(e.layout==='octaweb'){ pos.push([0,0]); for(let i=0;i<8;i++) pos.push([Math.cos(i/8*6.283)*R,Math.sin(i/8*6.283)*R]); }
  else if(e.layout==='rings'){ for(let i=0;i<3;i++) pos.push([Math.cos(i/3*6.283)*R*.18,Math.sin(i/3*6.283)*R*.18]); for(let i=0;i<10;i++) pos.push([Math.cos(i/10*6.283)*R*.5,Math.sin(i/10*6.283)*R*.5]); for(let i=0;i<20;i++) pos.push([Math.cos(i/20*6.283)*R*1.02,Math.sin(i/20*6.283)*R*1.02]); }
  else if(e.layout==='ring'){ pos.push([0,0]); for(let i=0;i<e.n-1;i++) pos.push([Math.cos(i/(e.n-1)*6.283)*R,Math.sin(i/(e.n-1)*6.283)*R]); }
  else if(e.layout==='square'){ for(let i=0;i<4;i++) pos.push([Math.cos(i/4*6.283+.785)*R*.75,Math.sin(i/4*6.283+.785)*R*.75]); }
  else if(e.layout==='line'){ pos.push([-R*.5,0],[R*.5,0]); }
  else if(e.layout==='cross'){ pos.push([0,0]); for(let i=0;i<4;i++) pos.push([Math.cos(i/4*6.283)*R*.8,Math.sin(i/4*6.283)*R*.8]); }
  else pos.push([0,0]);
  const bellH=e.bell*2.2; const enginePts=[];
  pos.forEach(([x,z])=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(e.bell*.35,e.bell,bellH,20,1,true),MAT.bell); b.position.set(x,-bellH/2,z); stages[1].add(b); enginePts.push(new THREE.Vector3(x,-bellH,z)); });
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(coreR*.98,coreR*.98,.3,32),MAT.engine); plate.position.y=.15; stages[1].add(plate);
  // second-stage vacuum engine (hidden inside interstage visually)
  const vac=new THREE.Mesh(new THREE.CylinderGeometry(coreR*.15,coreR*.55,coreR*1.4,20,1,true),MAT.bell); vac.position.y=s1Top-coreR*.6; stages[2].add(vac);
  // boosters
  const boosters=[];
  if(spec.boosters){ const b=spec.boosters;
    for(let i=0;i<b.n;i++){ const g=new THREE.Group(); const ang = b.n===2? i*Math.PI : i/b.n*Math.PI*2 + (b.n===4?Math.PI/4:0);
      const dist = coreR + b.r + b.gap; g.position.set(Math.cos(ang)*dist,0,Math.sin(ang)*dist);
      const bm = MAT[b.c]||MAT.white;
      if(b.cone){ const body=new THREE.Mesh(new THREE.CylinderGeometry(b.r*.35,b.r,b.h,24),bm); body.position.y=b.h/2; g.add(body); g.userData.body=body; }
      else { const body=new THREE.Mesh(new THREE.CylinderGeometry(b.r,b.r,b.h,24),bm); body.position.y=b.h/2; g.add(body); g.userData.body=body;
        const nose=new THREE.Mesh(b.heavy?new THREE.ConeGeometry(b.r,b.nose,24):ogive(b.r,b.nose,24),bm); nose.position.y=b.heavy?b.h+b.nose/2:b.h; g.add(nose); }
      const nb = b.heavy?9:1; for(let k=0;k<nb;k++){ const a=k/Math.max(1,nb-1)*6.283; const rr=k===0?0:b.r*.6; const bell=new THREE.Mesh(new THREE.CylinderGeometry(b.r*.12,b.r*(b.heavy?.22:.45),b.r*(b.heavy?1.1:1.2),14,1,true),MAT.bell); bell.position.set(Math.cos(a)*rr,-b.r*.55,Math.sin(a)*rr); g.add(bell); }
      if(b.heavy){ addGridfins(g,b.r,b.h-1.5); addLegs(g,b.r,4); }
      Object.assign(g.userData,{ang, out:new THREE.Vector3(Math.cos(ang),0,Math.sin(ang)), r:b.r, h:b.h});
      root.add(g); boosters.push(g); }
  }
  if(spec.legs) addLegs(stages[1],coreR,spec.legs);
  if(spec.gridfins) addGridfins(stages[1],coreR,s1Top-(key==='starship'?3:1.2), key==='starship'?3.5:1);
  if(spec.flaps){ // starship flaps
    const shipBase=s1Top; const shipTop=top;
    [[shipBase+3,9,3.5],[shipTop-10,6,2.6]].forEach(([fy,h,w],j)=>{ for(let s=-1;s<=1;s+=2){ const f=new THREE.Mesh(new THREE.BoxGeometry(.25,h,w),MAT.dark); f.position.set(s*(coreR+.15),fy,0); f.rotation.z=s*.05; stages[2].add(f);} });
    // black heat-shield tiles on one side
    const hs=new THREE.Mesh(new THREE.CylinderGeometry(coreR*1.005,coreR*1.005,top-s1Top-2,40,1,true,-Math.PI/2,Math.PI),MAT.black); hs.position.y=s1Top+(top-s1Top-2)/2; stages[2].add(hs);
  }
  if(spec.fins){ for(let i=0;i<4;i++){ const a=i/4*6.283+.785; const f=new THREE.Mesh(new THREE.BoxGeometry(3.6,7,.35),MAT.fin); f.position.set(Math.cos(a)*(coreR+1.4),3.5,Math.sin(a)*(coreR+1.4)); f.rotation.y=-a; stages[1].add(f);
    const shroud=new THREE.Mesh(new THREE.ConeGeometry(.9,4,12),MAT.fin); shroud.position.set(Math.cos(a)*(coreR+.2),2,Math.sin(a)*(coreR+.2)); shroud.rotation.x=Math.PI; stages[1].add(shroud);} }
  if(spec.strakes){ for(let s=-1;s<=1;s+=2){ const f=new THREE.Mesh(new THREE.BoxGeometry(.2,5,2.2),MAT.dark); f.position.set(s*(coreR+1),s1Top-6,0); stages[1].add(f);} }
  if(spec.logo){ const t=textTex(spec.logo); const w=Math.min(spec.parts[0].h*.45,coreR*7), h=w*96/512;
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
    pl.rotation.z=Math.PI/2; pl.position.set(0,spec.parts[0].h*.55,coreR*1.01); stages[1].add(pl); }
  root.userData={key,spec,stages,boosters,fairingHalves,height:top,s1Top,coreR,labels,enginePts,partMeshes};
  return root;
}
function addGridfins(g,r,y,scale=1){ for(let i=0;i<4;i++){ const a=i/4*6.283+.785; const f=new THREE.Mesh(new THREE.BoxGeometry(1.2*scale,1.4*scale,.12*scale),MAT.leg); f.position.set(Math.cos(a)*(r+.3*scale),y,Math.sin(a)*(r+.3*scale)); f.rotation.y=-a; g.add(f);} }
function addLegs(g,r,n){ for(let i=0;i<n;i++){ const a=i/n*6.283+(n===4?.785:0); const l=new THREE.Mesh(new THREE.BoxGeometry(.5,Math.max(3,r*4),.18),MAT.leg); l.position.set(Math.cos(a)*(r+.05),r*2+.4,Math.sin(a)*(r+.05)); l.rotation.y=-a+Math.PI/2; g.add(l);} }
