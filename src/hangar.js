// ================= ROCKET HANGAR =================
const DEFAULT_SITE = {
  falcon9:['SLC-40','Cape Canaveral SFS, FL, USA',28.5619,-80.5774,'US'], falconheavy:['LC-39A','Kennedy Space Center, FL, USA',28.6083,-80.6041,'US'],
  starship:['Orbital Launch Pad 2','SpaceX Starbase, TX, USA',25.99677,-97.15799,'US'], electron:['Launch Complex 1A','Mahia Peninsula, New Zealand',-39.2628,177.8645,'NZ'],
  vulcan:['SLC-41','Cape Canaveral SFS, FL, USA',28.5834,-80.583,'US'], newglenn:['LC-36','Cape Canaveral SFS, FL, USA',28.4704,-80.5376,'US'],
  sls:['LC-39B','Kennedy Space Center, FL, USA',28.6272,-80.6208,'US'], ariane6:['ELA-4','Guiana Space Centre, French Guiana',5.2563,-52.7868,'GF'],
  soyuz:['Site 31/6','Baikonur Cosmodrome, Kazakhstan',45.996,63.564,'KZ'], lm5:['LC-101','Wenchang Space Launch Site, China',19.6145,110.951,'CN'],
  lm2f:['Launch Area 91 (921)','Jiuquan Satellite Launch Center, China',40.958,100.291,'CN'], lm2d:['Launch Area 94','Jiuquan Satellite Launch Center, China',40.9605,100.298,'CN'],
  pslv:['First Launch Pad','Satish Dhawan Space Centre, India',13.7333,80.2350,'IN'], lvm3:['Second Launch Pad','Satish Dhawan Space Centre, India',13.7199,80.2304,'IN'],
  h3:['Yoshinobu LC','Tanegashima Space Center, Japan',30.4009,130.975,'JP'], saturnv:['LC-39A','Kennedy Space Center, FL, USA',28.6083,-80.6041,'US'], generic:['SLC-40','Cape Canaveral SFS, FL, USA',28.5619,-80.5774,'US']};
function demoLaunch(key){ const s=ROCKETS[key], d=DEFAULT_SITE[key]||DEFAULT_SITE.generic;
  const real=[...DATA.up].filter(l=>rocketKey(l.rocket)===key&&new Date(l.net)>Date.now()).sort((a,b)=>new Date(a.net)-new Date(b.net))[0]; if(real) return real;
  return {rocket:s.name,mission:key==='saturnv'?'Apollo-style lunar mission':'Demo flight',provider:s.maker,pad:d[0],site:d[1],lat:d[2],lon:d[3],cc:d[4],orbit:'LEO',net:new Date().toISOString(),status:'Go',kind:'demo'}; }

VIEWS.hangar = (()=>{
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0f2238);
  const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,5000);
  const controls=new THREE.OrbitControls(camera,renderer.domElement); Object.assign(controls,{enableDamping:true,dampingFactor:.08,enabled:false,autoRotate:true,autoRotateSpeed:.8,enablePan:true});
  const labels=new Labels();
  scene.add(new THREE.HemisphereLight(0xcfe0ff,0x20232b,.7));
  const key1=new THREE.DirectionalLight(0xffffff,1.1); key1.position.set(60,120,90); scene.add(key1);
  const rim=new THREE.DirectionalLight(0xff9a5a,.6); rim.position.set(-80,40,-60); scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(400,64),new THREE.MeshStandardMaterial({color:0x0d111b,roughness:.85,metalness:.2})); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const grid=new THREE.GridHelper(600,60,0x2a3555,0x161d30); grid.position.y=.05; scene.add(grid);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(14,16,1.2,48),new THREE.MeshStandardMaterial({color:0x2a2f3a,metalness:.5,roughness:.4})); platform.position.y=.6; scene.add(platform);
  const holder=new THREE.Group(); scene.add(holder); holder.position.y=1.2;
  let key='falcon9', rocket=null, info=null, showParts=true, exploded=false, lineup=false, explodeT=0, xr=null, xOn=false, htime=0;
  const lineupG=new THREE.Group(); scene.add(lineupG);
  const order=Object.keys(ROCKETS).filter(k=>k!=='generic');
  $('hRows').innerHTML=order.map(k=>`<div class="row" data-k="${k}"><div class="main"><div class="t2" style="font-size:13px">${ROCKETS[k].name}</div><div class="t3">${flag(ROCKETS[k].country)}${ROCKETS[k].maker.split(' / ')[0].split(' (')[0]}</div></div><div class="num" style="font-size:12px">${ROCKETS[k].height} m</div></div>`).join('');
  $('hRows').addEventListener('click',e=>{ const r=e.target.closest('.row'); if(r){ if(lineup) toggleLineup(false); pick(r.dataset.k); } });
  function frame(h){ const d=h*1.55+12; camera.position.set(d*.75,h*.55,d*.85); controls.target.set(0,h*.48,0); controls.minDistance=h*.25; controls.maxDistance=h*5; }
  function pick(k){ key=k; if(rocket) holder.remove(rocket); labels.clear(); rocket=buildRocket(k); info=rocket.userData; holder.add(rocket);
    const engDrop=(ROCKETS[k].eng?.bell||.5)*2.2; rocket.position.y=engDrop+(ROCKETS[k].boosters?ROCKETS[k].boosters.r*.6:0);
    platform.scale.setScalar(Math.max(.4,info.coreR/3+ (info.boosters.length? .5:0)));
    info.labels.forEach(l=>{ const a=new THREE.Object3D(); a.position.set(info.coreR*1.05,l.y,0); info.stages[l.stage].add(a); const it=labels.add(l.text,a,{cls:'part'}); it.part=true; });
    if(info.boosters.length){ const b=info.boosters[0]; const a=new THREE.Object3D(); a.position.set(b.userData.r,b.userData.h*.5,0); b.add(a); labels.add(ROCKETS[k].boosters.heavy?'Side booster (reusable)':'Strap-on booster',a,{cls:'part'}).part=true; }
    xr=buildXray(rocket,labels); if(xOn){ xr.set(true); } applyPartVis();
    frame(info.height); exploded=false; explodeT=0; $('hExplode').classList.remove('on');
    document.querySelectorAll('#hRows .row').forEach(r=>r.classList.toggle('sel',r.dataset.k===k)); renderSpec(); }
  function renderSpec(){ const s=ROCKETS[key];
    const ups=DATA.up.filter(l=>rocketKey(l.rocket)===key).length, pasts=DATA.past.filter(l=>rocketKey(l.rocket)===key).length;
    $('hSpec').innerHTML=`<div class="sec"><div class="lbl">${s.maker}</div><h2 style="margin-top:2px">${s.name}</h2>
      <table class="kv" style="margin-top:10px">
      <tr><td>Height</td><td><b>${s.height} m</b>, ${Math.round(s.height*3.281)} ft, roughly a ${Math.round(s.height/3)}-storey building</td></tr>
      <tr><td>Diameter</td><td>${s.dia} m</td></tr><tr><td>Liftoff mass</td><td>${s.mass}</td></tr>
      <tr><td>Payload to LEO</td><td>${s.leo}</td></tr><tr><td>Payload to GTO</td><td>${s.gto}</td></tr>
      <tr><td>Engines</td><td>${s.engines}</td></tr><tr><td>Propellant</td><td>${s.fuel}</td></tr>
      <tr><td>Stages</td><td>${s.stages}</td></tr><tr><td>First flight</td><td>${s.first}</td></tr><tr><td>Reusability</td><td>${s.reuse}</td></tr>
      ${ups||pasts?`<tr><td>In the launch list</td><td>${ups} upcoming, ${pasts} recent</td></tr>`:''}
      </table><div class="fact">${s.fact}</div>${xOn?`<div class="sec" style="padding:10px 0 0"><div class="lbl">What’s inside</div><p style="font-size:12px;margin-top:4px">Most of a rocket is tank. Liquid rockets carry an oxidizer (usually liquid oxygen) and a fuel in separate tanks; the striped pipe is the feed line carrying oxidizer down through the fuel tank to the engines. Solid boosters are packed with rubbery propellant that burns from a hollow core outward.</p><div class="legend" style="flex-direction:column;gap:4px">${[...new Set((XRAY[key]||XRAY.generic).flatMap(f=>f==='hyp'?['n2o4','udmh']:f==='solid'?['solid']:['lox',f]))].map(k=>`<span style="display:flex;gap:6px;align-items:center;font-size:11.5px"><i style="width:12px;height:12px;background:#${PROP[k].c.toString(16).padStart(6,'0')};border:1px solid rgba(0,0,0,.4)"></i>${PROP[k].n}</span>`).join('')}</div></div>`:''}<p class="note">The 3D models are simplified. Specs are approximate public figures.</p></div>`; }
  function toggleLineup(on){ if(on&&xOn){ xOn=false; xr&&xr.set(false); $('hXray').classList.remove('on'); } lineup=on; $('hLineup').classList.toggle('on',on); lineupG.clear(); labels.items.filter(i=>i.lineup).forEach(i=>i.el.remove()); labels.items=labels.items.filter(i=>!i.lineup);
    holder.visible=platform.visible=!on; $('hSpec').style.display=on?'none':''; labels.items.forEach(i=>i.visible=!on&&showParts);
    if(!on){ frame(info.height); controls.autoRotate=true; return; }
    const ks=[...order].sort((a,b)=>ROCKETS[a].height-ROCKETS[b].height); let x=0; const gap=10;
    ks.forEach(k=>{ const r=buildRocket(k); const w=Math.max(ROCKETS[k].dia, (r.userData.coreR*2)); x+=w/2+gap/2; r.position.set(x,(ROCKETS[k].eng?.bell||.5)*2.2,0); lineupG.add(r);
      const a=new THREE.Object3D(); a.position.set(x,r.userData.height+r.position.y+3,0); lineupG.add(a); const it=labels.add(`<b>${ROCKETS[k].name}</b><br><span class="mono">${ROCKETS[k].height} m</span>`,a,{cls:'small'}); it.lineup=true; it.el.style.textAlign='center'; x+=w/2+gap/2; });
    // reference: Statue of Liberty (93 m incl. pedestal) and a person
    const lineMat=new THREE.LineDashedMaterial({color:0xffc35a,dashSize:3,gapSize:2}); const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20,93,0),new THREE.Vector3(x+20,93,0)]),lineMat); l.computeLineDistances(); lineupG.add(l);
    const a=new THREE.Object3D(); a.position.set(-12,93,0); lineupG.add(a); const it=labels.add('Statue of Liberty with its pedestal, 93 m',a,{cls:'small'}); it.lineup=true; it.el.style.color='#ffc35a';
    const person=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,1.8,8),new THREE.MeshStandardMaterial({color:0xffd166})); person.position.set(-6,.9,0); lineupG.add(person);
    const pa=new THREE.Object3D(); pa.position.set(-6,4,0); lineupG.add(pa); const it2=labels.add('A person, 1.8 m',pa,{cls:'small'}); it2.lineup=true;
    lineupG.position.x=-x/2; controls.autoRotate=false; controls.maxDistance=1200; camera.position.set(0,75,x*1.05+40); controls.target.set(0,48,0); }
  function applyPartVis(){ labels.items.forEach(i=>{ if(i.part) i.visible=showParts&&!lineup&&!xOn; }); }
  $('hParts').onclick=()=>{ showParts=!showParts; $('hParts').classList.toggle('on',showParts); applyPartVis(); };
  $('hXray').onclick=()=>{ if(lineup) toggleLineup(false); xOn=!xOn; $('hXray').classList.toggle('on',xOn); xr&&xr.set(xOn); applyPartVis(); renderSpec(); };
  $('hExplode').onclick=()=>{ if(lineup) toggleLineup(false); exploded=!exploded; $('hExplode').classList.toggle('on',exploded); };
  $('hLineup').onclick=()=>toggleLineup(!lineup);
  $('hFly').onclick=()=>show('launch',demoLaunch(key));
  return { scene,camera,labels,
    show(k){ controls.enabled=true; if(k&&ROCKETS[k]){ if(lineup) toggleLineup(false); pick(k); } else if(!rocket) pick(key); },
    hide(){ controls.enabled=false; labels.hide(); },
    update(dt){ htime+=dt; xr&&xr.update(dt,htime); if(info){ explodeT=lerp(explodeT,exploded?1:0,.08); const h=info.height;
      info.stages[2].position.y=explodeT*h*.12; info.stages[3].position.y=explodeT*h*.26;
      info.fairingHalves.forEach(f=>f.position.x=explodeT*f.userData.dir*info.coreR*1.6);
      info.boosters.forEach(b=>{ const base=info.coreR+b.userData.r+(info.spec.boosters.gap||0); const d=base+explodeT*b.userData.r*3; b.position.set(Math.cos(b.userData.ang)*d,0,Math.sin(b.userData.ang)*d); }); }
      controls.update(); } };
})();
