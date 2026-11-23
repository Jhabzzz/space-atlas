// ================= SOLAR SYSTEM =================
VIEWS.solar = (()=>{
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0f2238);
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.05,5000);
  const controls=new THREE.OrbitControls(camera,renderer.domElement); Object.assign(controls,{enableDamping:true,dampingFactor:.08,enabled:false,minDistance:3,maxDistance:260,enablePan:true});
  const labels=new Labels();
  scene.add(starField(4000,900,1400,1.2));
  const S=au=>6*Math.sqrt(au);
  const J2000=Date.UTC(2000,0,1,12);
  const toV=(lonDeg,latDeg,au)=>{ const lo=lonDeg*Math.PI/180, la=latDeg*Math.PI/180, r=S(au); return new THREE.Vector3(Math.cos(la)*Math.cos(lo)*r, Math.sin(la)*r, -Math.cos(la)*Math.sin(lo)*r); };
  // sun
  const sun=new THREE.Mesh(new THREE.SphereGeometry(1.4,48,32),new THREE.MeshBasicMaterial({color:0xffd27a})); scene.add(sun);
  const corona=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgba(255,250,220,1)','rgba(255,190,80,.6)','rgba(255,140,40,0)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); corona.scale.set(9,9,1); scene.add(corona);
  scene.add(new THREE.PointLight(0xffffff,1.6,0,0)); scene.add(new THREE.AmbientLight(0xffffff,.18));
  labels.add('Sun',sun,{cls:'big',off:new THREE.Vector3(0,1.8,0)});
  // belts & heliopause
  function belt(n,a0,a1,th,col,size){ const pos=new Float32Array(n*3); for(let i=0;i<n;i++){ const v=toV(Math.random()*360,(Math.random()-.5)*th,a0+Math.random()*(a1-a0)); pos.set([v.x,v.y,v.z],i*3); } const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const p=new THREE.Points(g,new THREE.PointsMaterial({color:col,size,transparent:true,opacity:.55,depthWrite:false})); scene.add(p); return p; }
  belt(1800,2.2,3.3,8,0x9b8c7a,.06); belt(1600,30,50,14,0x6f7ea6,.12);
  const bA=new THREE.Object3D(); bA.position.copy(toV(150,-6,2.8)); scene.add(bA); labels.add('Asteroid belt',bA,{cls:'small'});
  const kA=new THREE.Object3D(); kA.position.copy(toV(60,-10,42)); scene.add(kA); labels.add('Kuiper belt (Pluto lives here)',kA,{cls:'small'});
  const hp=new THREE.Mesh(new THREE.RingGeometry(S(120)-.15,S(120)+.15,180),new THREE.MeshBasicMaterial({color:0x5a6cff,transparent:true,opacity:.35,side:THREE.DoubleSide})); hp.rotation.x=-Math.PI/2; scene.add(hp);
  const hA=new THREE.Object3D(); hA.position.copy(toV(200,0,120)); scene.add(hA); labels.add('Heliopause ~120 AU: edge of the Sun’s bubble',hA,{cls:'small'});
  // planets
  const objs=[]; let simDays=(Date.now()-J2000)/864e5, play=false;
  PLANETS.forEach(p=>{ const pts=[]; for(let i=0;i<=256;i++) pts.push(toV(i/256*360,0,p.a)); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x3a4a7a,transparent:true,opacity:.45})));
    const mat = p.n==='Earth'? new THREE.MeshStandardMaterial({map:earthTexture(),roughness:.8}) : new THREE.MeshStandardMaterial({color:p.c,roughness:.75});
    const m=new THREE.Mesh(new THREE.SphereGeometry(p.r*.6,40,30),mat); scene.add(m);
    if(p.ring){ const r=new THREE.Mesh(new THREE.RingGeometry(p.r*.85,p.r*1.45,64),new THREE.MeshBasicMaterial({color:0xd9c79a,transparent:true,opacity:.6,side:THREE.DoubleSide})); r.rotation.x=-Math.PI/2+.47; m.add(r); }
    labels.add(p.n,m,{off:new THREE.Vector3(0,p.r*.6+.5,0),onClick:()=>select({type:'planet',d:p,obj:m})});
    objs.push({type:'planet',d:p,obj:m}); });
  function planetPos(p,days){ const L=(p.L0+360*days/p.P)%360; return toV(L,0,p.a); }
  // spacecraft
  const craftTex=glowTexture('rgba(255,255,255,1)','rgba(143,224,168,.8)','rgba(143,224,168,0)');
  CRAFT.forEach(c=>{ const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:craftTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); spr.scale.set(.9,.9,1); scene.add(spr);
    labels.add(c.n,spr,{cls:'small',onClick:()=>select({type:'craft',d:c,obj:spr})});
    const o={type:'craft',d:c,obj:spr}; objs.push(o);
    if(c.at&&c.at.au>20){ const end=toV(c.at.lon,c.at.lat,c.at.au); const pts=[]; for(let i=0;i<=60;i++){ const t=i/60; pts.push(toV(c.at.lon-(1-t)*40,c.at.lat*t,Math.max(1,c.at.au*t*t))); } const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0x7dffb2,dashSize:.8,gapSize:.6,transparent:true,opacity:.6})); l.computeLineDistances(); scene.add(l); } });
  function placeAll(){ objs.forEach(o=>{ if(o.type==='planet') o.obj.position.copy(planetPos(o.d,simDays)); });
    objs.forEach(o=>{ if(o.type!=='craft') return; const c=o.d; if(c.planet){ const pl=objs.find(x=>x.type==='planet'&&x.d.n===c.planet); o.obj.position.copy(pl.obj.position).add(new THREE.Vector3(c.off[0],c.off[1],c.off[0]*.4)); } else if(c.near){ const pd=PLANETS.find(p=>p.n===c.near); const L=(pd.L0+360*simDays/pd.P)%360; o.obj.position.copy(toV(L+c.dlon,1,c.au)); } else o.obj.position.copy(toV(c.at.lon,c.at.lat,c.at.au)); }); }
  placeAll();
  // list
  const sw=c=>`<span style="width:12px;height:12px;margin-top:3px;flex-shrink:0;border-radius:50%;background:#${c.toString(16).padStart(6,'0')};border:1px solid rgba(0,0,0,.4)"></span>`;
  $('sList').innerHTML=`<div style="padding:10px 14px"><button id="sPlay" style="width:100%">Play orbits, one month per second</button></div><h4>Planets</h4>`+PLANETS.map(p=>`<div class="row" data-n="${p.n}">${sw(p.c)}<div class="main"><div class="t2">${p.n}</div><div class="t3">${p.a} AU from the Sun</div></div></div>`).join('')
    +`<h4>Active spacecraft</h4>`+CRAFT.map(c=>`<div class="row" data-n="${c.n}">${sw(0x8fe0a8)}<div class="main"><div class="t2">${c.n}</div><div class="t3">${c.agency}, ${c.planet?'at or near '+c.planet:c.near?'about '+c.au+' AU from the Sun':c.at.au+' AU out'}</div></div></div>`).join('');
  $('sList').addEventListener('click',e=>{ const r=e.target.closest('.row'); if(!r) return; const o=objs.find(x=>x.d.n===r.dataset.n); select(o); });
  setTimeout(()=>{ $('sPlay').onclick=()=>{ play=!play; $('sPlay').textContent=play?'Stop and return to today':'Play orbits, one month per second'; $('sPlay').classList.toggle('on',play); if(!play){ simDays=(Date.now()-J2000)/864e5; placeAll(); } }; });
  let follow=null, fly=null;
  function select(o){ const d=o.d; follow=o; const p=o.obj.position.clone(); const dist = o.type==='planet'? Math.max(4,d.r*7) : (d.at&&d.at.au>20? 30: 6);
    fly={fromC:camera.position.clone(),fromT:controls.target.clone(),toT:p.clone(),toC:p.clone().add(new THREE.Vector3(dist*.6,dist*.45,dist*.8)),t:0};
    const c=$('sCard'); c.style.display='block';
    let body; if(o.type==='planet'){ const yr=d.P/365.256; body=`<div class="lbl">Planet</div><h2>${d.n}</h2><div class="meta">${d.a} AU from the Sun. One orbit takes ${yr<2?Math.round(d.P)+' days':yr.toFixed(1)+' years'}, and sunlight takes ${Math.round(d.a*8.32)} minutes to arrive.</div><div class="desc">${d.info}</div>`; }
    else { body=`<div class="lbl">${d.agency}</div><h2>${d.n}</h2><div class="meta">Launched ${d.launched}${d.at?`. About ${d.at.au} AU from the Sun`:''}${d.approx?' (position on the map is approximate)':''}</div><div class="desc">${d.info}</div>`; }
    c.innerHTML=`<button class="x" id="sX">Close</button>`+body; $('sX').onclick=()=>{ c.style.display='none'; follow=null; }; }
  controls.addEventListener('start',()=>{ fly=null; });
  camera.position.set(0,45,70);
  const lightDay=25902068356, V1=CRAFT[0].live; let acc=0;
  return { scene,camera,labels,
    show(){ controls.enabled=true; },
    hide(){ controls.enabled=false; labels.hide(); },
    update(dt){ if(play){ simDays+=dt*30; placeAll(); }
      if(fly){ fly.t=Math.min(fly.t+dt*.9,1); const e=1-Math.pow(1-fly.t,3); controls.target.lerpVectors(fly.fromT,fly.toT,e); camera.position.lerpVectors(fly.fromC,fly.toC,e); if(fly.t>=1) fly=null; }
      else if(follow&&play){ controls.target.copy(follow.obj.position); }
      corona.material.rotation+=dt*.02; controls.update();
      labels.items.forEach(it=>{ const o=objs.find(x=>x.obj===it.obj); if(o&&o.type==='craft'&&!(o.d.at&&o.d.at.au>20)) it.visible = camera.position.distanceTo(o.obj.position)<45; });
      acc+=dt; if(acc>.1){ acc=0; const km=V1.km+(Date.now()-Date.parse(V1.t))/1000*V1.kms; $('sV1').textContent=Math.round(km).toLocaleString()+' km';
        const sec=km/299792.458; const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=Math.floor(sec%60);
        $('sV1b').textContent=`${(km/149597870.7).toFixed(2)} AU. One-way signal time ${h} h ${String(m).padStart(2,'0')} min ${String(s).padStart(2,'0')} s`; } } };
})();
