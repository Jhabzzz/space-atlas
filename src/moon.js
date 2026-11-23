// ================= MOON =================
VIEWS.moon = (()=>{
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0f2238);
  const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.01,3000);
  const controls=new THREE.OrbitControls(camera,renderer.domElement); Object.assign(controls,{enableDamping:true,dampingFactor:.08,enabled:false,minDistance:1.3,maxDistance:8,enablePan:false,autoRotate:true,autoRotateSpeed:.25});
  const labels=new Labels();
  scene.add(starField(2500,400,800,1.2));
  scene.add(new THREE.AmbientLight(0xffffff,.28)); const sun=new THREE.DirectionalLight(0xfff4e6,1.05); sun.position.set(4,1.5,3); scene.add(sun);
  function moonTex(){ const W=2048,H=1024,c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
    x.fillStyle='#9c9a96'; x.fillRect(0,0,W,H);
    for(let i=0;i<20000;i++){ const v=130+Math.random()*60|0; x.fillStyle=`rgba(${v},${v},${v-4},${Math.random()*.12})`; x.fillRect(Math.random()*W,Math.random()*H,2+Math.random()*4,2+Math.random()*4); }
    const P=(lat,lon)=>[(lon+180)/360*W,(90-lat)/180*H];
    const maria=[[33,-16,190,150],[28,17,95,80],[8.5,31,110,85],[17,59,70,60],[-8,51,80,90],[-15,35,55,50],[-21,-17,90,70],[18,-57,260,330],[56,1,230,40],[-24,-39,55,55],[-10,-23,60,50],[13,4,45,35],[7,-31,70,45],[27,148,40,35],[-53,-169,260,140]];
    const mc=document.createElement('canvas'); mc.width=W; mc.height=H; const mx=mc.getContext('2d');
    maria.forEach(([la,lo,rw,rh],i)=>{ const [px,py]=P(la,lo); mx.fillStyle=i===14?'rgba(70,70,72,.3)':'rgba(48,48,52,.8)'; mx.beginPath(); mx.ellipse(px,py,rw*1.1,rh,0,0,6.283); mx.fill(); });
    x.filter='blur(10px)'; x.drawImage(mc,0,0); x.filter='none';
    for(let i=0;i<1100;i++){ const px=Math.random()*W, py=H*.05+Math.random()*H*.9; const r=Math.pow(Math.random(),3)*22+1.5; x.strokeStyle=`rgba(215,215,210,${.04+Math.random()*.1})`; x.lineWidth=Math.max(1,r*.18); x.beginPath(); x.arc(px,py,r,0,6.283); x.stroke(); x.fillStyle=`rgba(70,70,72,${.06+Math.random()*.12})`; x.beginPath(); x.arc(px+r*.15,py+r*.15,r*.8,0,6.283); x.fill(); }
    [[-43,-11],[9.6,-20],[8,-38]].forEach(([la,lo])=>{ const [px,py]=P(la,lo); for(let k=0;k<18;k++){ const a=k/18*6.283+Math.random()*.3, L=60+Math.random()*180; x.strokeStyle='rgba(240,240,235,.045)'; x.lineWidth=2+Math.random()*3; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*L*1.4,py+Math.sin(a)*L*.7); x.stroke(); } x.fillStyle='rgba(250,250,245,.9)'; x.beginPath(); x.arc(px,py,7,0,6.283); x.fill(); });
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t; }
  const tex=moonTex();
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1,128,96),new THREE.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:.015,roughness:1})); scene.add(moon);
  const earth=new THREE.Mesh(new THREE.SphereGeometry(.9,64,48),new THREE.MeshStandardMaterial({roughness:.8})); earth.position.set(40,8,-20); scene.add(earth); earth.add(atmosphere(.98,[.35,.6,1],2.5,1.2));
  const eLbl=new THREE.Object3D(); eLbl.position.set(0,1.4,0); earth.add(eLbl); labels.add('Earth, 384,400 km away (distance not to scale)',eLbl,{cls:'small'});
  const COLORS={crew:0xf2a516,robot:0x5a9be8,next:0xcf3b2d}; const sites=[];
  function addSite(s,kind){ const p=ll2v(s.lat,s.lon,1.004); const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:COLORS[kind],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); spr.position.copy(p); spr.scale.set(kind==='crew'?.09:.07,kind==='crew'?.09:.07,1); moon.add(spr);
    const it=labels.add(s.n+(s.y?` <span style="opacity:.7">${s.y}</span>`:''),spr,{cls:kind==='crew'?'big':'small',hideBehind:true,onClick:()=>select(s,kind)}); sites.push({s,kind,spr}); }
  MOON.forEach(s=>addSite(s,s.crew?'crew':'robot')); MOON_NEXT.forEach(s=>addSite(s,'next'));
  const col={crew:'amber',robot:'blue',next:'red'};
  $('mList').innerHTML = `<h4>Crewed (Apollo)</h4>`+MOON.filter(s=>s.crew).map(s=>row(s,'crew')).join('')+`<h4>Robotic landers</h4>`+MOON.filter(s=>!s.crew).map(s=>row(s,'robot')).join('')+`<h4>Next targets</h4>`+MOON_NEXT.map(s=>row(s,'next')).join('');
  function row(s,k){ return `<div class="row" data-n="${s.n}"><span class="lamp ${col[k]}" style="margin-top:3px"></span><div class="main"><div class="t2">${s.n}</div><div class="t3">${s.y?s.y+', ':''}${s.who}</div></div></div>`; }
  $('mList').addEventListener('click',e=>{ const r=e.target.closest('.row'); if(!r) return; const f=sites.find(x=>x.s.n===r.dataset.n); select(f.s,f.kind); });
  let fly=null;
  function select(s,kind){ controls.autoRotate=false; const target=ll2v(s.lat,s.lon,1).applyQuaternion(moon.quaternion).normalize().multiplyScalar(2.2); fly={from:camera.position.clone(),to:target,t:0};
    const c=$('mCard'); c.style.display='block'; const far=Math.abs(s.lon)>90;
    c.innerHTML=`<button class="x" id="mX">Close</button><div class="lbl">${s.who}${s.y?', '+s.y:''}</div><h2 style="margin-top:2px">${s.n}</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px"><span class="lamp ${col[kind]}">${kind==='crew'?'Crewed landing':kind==='next'?'Upcoming target':'Robotic lander'}</span><span class="meta" style="margin:0">${Math.abs(s.lat).toFixed(1)}°${s.lat>=0?'N':'S'}, ${Math.abs(s.lon).toFixed(1)}°${s.lon>=0?'E':'W'}</span><span class="meta" style="margin:0">${far?'Far side, never visible from Earth':'Near side'}${Math.abs(s.lat)>65?', south polar region':''}</span></div><div class="desc">${s.d}</div>`;
    $('mX').onclick=()=>{ c.style.display='none'; controls.autoRotate=true; }; }
  controls.addEventListener('start',()=>fly=null);
  return { scene,camera,labels,
    show(){ controls.enabled=true; if(!earth.material.map){ earth.material.map=earthTexture(); earth.material.needsUpdate=true; camera.position.set(3.2,.6,.4); } },
    hide(){ controls.enabled=false; labels.hide(); },
    update(dt){ if(fly){ fly.t=Math.min(fly.t+dt*1.1,1); const e=1-Math.pow(1-fly.t,3); const len=lerp(fly.from.length(),fly.to.length(),e); camera.position.copy(fly.from.clone().normalize().lerp(fly.to.clone().normalize(),e).normalize().multiplyScalar(len)); if(fly.t>=1) fly=null; }
      earth.rotation.y+=dt*.05; controls.update(); } };
})();
