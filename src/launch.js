// ================= LAUNCH SIMULATOR =================
VIEWS.launch = (()=>{
  const RE=6371000;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.5,5e7);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  Object.assign(controls,{enableDamping:true,dampingFactor:.1,enablePan:false,enabled:false,minDistance:10,maxDistance:4000});
  const labels=new Labels();
  // lights
  const hemi=new THREE.HemisphereLight(0xbcd7ff,0x4a4030,.75); scene.add(hemi);
  const sunL=new THREE.DirectionalLight(0xfff1dc,1.25); sunL.position.set(-3,5,4); scene.add(sunL);
  // sky dome (follows camera)
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color()},bot:{value:new THREE.Color()}},
    vertexShader:'#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);\n#include <logdepthbuf_vertex>\n}',
    fragmentShader:'#include <logdepthbuf_pars_fragment>\nuniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){\n#include <logdepthbuf_fragment>\nfloat h=clamp(vP.y*1.6+.1,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,.7)),1.);}'});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(4e7,32,16),skyMat); scene.add(sky);
  const stars=starField(2500,3e7,3.5e7,1.4); scene.add(stars);
  // Earth pivot at planet centre
  const earthPivot=new THREE.Group(); scene.add(earthPivot);
  const earthTilt=new THREE.Group(); earthPivot.add(earthTilt);
  const earth=new THREE.Mesh(new THREE.SphereGeometry(RE,128,96),new THREE.MeshStandardMaterial({roughness:.9,metalness:0})); earthTilt.add(earth);
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(RE+6000,96,64),new THREE.MeshStandardMaterial({transparent:true,depthWrite:false,opacity:0})); earthTilt.add(clouds);
  const atmo=atmosphere(RE+90000,[.35,.62,1],2.2,1.3); earthPivot.add(atmo);
  // local ground (pad area) sits on top of the planet
  const ground=new THREE.Group(); earthPivot.add(ground); ground.position.y=RE;
  function groundTex(){ const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d'); x.fillStyle='#5f6b45'; x.fillRect(0,0,512,512);
    for(let i=0;i<4000;i++){ const g=70+Math.random()*50|0; x.fillStyle=`rgba(${g+10},${g+25},${g-25},${Math.random()*.5})`; x.fillRect(Math.random()*512,Math.random()*512,4+Math.random()*14,4+Math.random()*14); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(160,160); t.anisotropy=8; return t; }
  const groundMat=new THREE.MeshStandardMaterial({map:groundTex(),roughness:1,transparent:true});
  const plane=new THREE.Mesh(new THREE.CircleGeometry(30000,64),groundMat); plane.rotation.x=-Math.PI/2; plane.position.y=.2; ground.add(plane);
  const concrete=new THREE.MeshStandardMaterial({color:0x6f6c66,roughness:.95});
  const padDisk=new THREE.Mesh(new THREE.CylinderGeometry(70,75,2,48),concrete); padDisk.position.y=1; ground.add(padDisk);
  const trench=new THREE.Mesh(new THREE.BoxGeometry(14,2.2,90),new THREE.MeshStandardMaterial({color:0x2b2a28})); trench.position.set(0,1.2,-40); ground.add(trench);
  const ocean=new THREE.Mesh(new THREE.CircleGeometry(30000,64,0,Math.PI*.9),new THREE.MeshStandardMaterial({color:0x1f4f7a,roughness:.3,metalness:.2})); ocean.rotation.x=-Math.PI/2; ocean.position.set(0,.35,0); ocean.rotation.z=-.2; ground.add(ocean);
  // tower + lightning masts, rebuilt per rocket height
  const towerG=new THREE.Group(); ground.add(towerG);
  function buildTower(h,coreR){ towerG.clear(); const steel=new THREE.MeshStandardMaterial({color:0x6d717a,metalness:.6,roughness:.5}); const red=new THREE.MeshStandardMaterial({color:0x8a3a2a,metalness:.4,roughness:.6});
    const H=h*1.12, w=Math.max(6,coreR*1.6), x0=coreR+w/2+6;
    for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const c=new THREE.Mesh(new THREE.BoxGeometry(.8,H,.8),steel); c.position.set(x0+dx*w/2,H/2+2,dz*w/2); towerG.add(c); }
    for(let y=4;y<H;y+=6){ const b=new THREE.Mesh(new THREE.BoxGeometry(w,.5,w),steel); b.position.set(x0,y,0); towerG.add(b); }
    for(let y=8;y<H;y+=12){ for(const dz of [-1,1]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.35,Math.hypot(w,12),.35),steel); d.position.set(x0,y+3,dz*w/2); d.rotation.x=Math.atan2(w,12)*(dz); towerG.add(d);} }
    const arm=new THREE.Mesh(new THREE.BoxGeometry(x0-coreR-.5,1.6,2.4),red); arm.position.set((x0+coreR)/2-.5,h*.86,0); towerG.add(arm); towerG.userData.arm=arm;
    for(const [mx,mz] of [[-90,-90],[90,-90],[-90,90],[90,90]]){ const m=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.2,H*1.25,8),steel); m.position.set(mx,H*.625,mz); towerG.add(m); } }
  // smoke particles live in the ground frame so they stay with the pad
  const SMOKE=new THREE.Group(); ground.add(SMOKE);
  const smokeTex=glowTexture('rgba(235,235,235,.9)','rgba(200,200,200,.5)','rgba(180,180,180,0)');
  const smokePool=[]; for(let i=0;i<260;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,depthWrite:false,opacity:0,color:0xdedede})); s.visible=false; SMOKE.add(s); smokePool.push({s,life:0,v:new THREE.Vector3(),g:1}); }
  let smokeIdx=0;
  function puff(pos,vel,size,life=6){ const p=smokePool[smokeIdx++%smokePool.length]; p.s.position.copy(pos); p.v.copy(vel); p.life=life; p.max=life; p.size=size; p.s.visible=true; }
  // plume
  function plumeTex(){ const c=document.createElement('canvas'); c.width=64; c.height=256; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,256);
    g.addColorStop(0,'rgba(255,255,240,1)'); g.addColorStop(.12,'rgba(255,230,150,.95)'); g.addColorStop(.4,'rgba(255,140,50,.65)'); g.addColorStop(1,'rgba(255,90,30,0)'); x.fillStyle=g; x.fillRect(0,0,64,256);
    const h=x.createLinearGradient(0,0,64,0); h.addColorStop(0,'rgba(0,0,0,1)'); h.addColorStop(.5,'rgba(0,0,0,0)'); h.addColorStop(1,'rgba(0,0,0,1)'); x.globalCompositeOperation='destination-out'; x.fillStyle=h; x.fillRect(0,0,64,256); return new THREE.CanvasTexture(c); }
  const PLUME_TEX=plumeTex();
  function makePlume(r,len){ const g=new THREE.Group(); const m=new THREE.MeshBasicMaterial({map:PLUME_TEX,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    for(let k=0;k<3;k++){ const geo=new THREE.CylinderGeometry(r,r*1.6,len,24,1,true); geo.translate(0,-len/2,0); const mesh=new THREE.Mesh(geo,m); mesh.rotation.y=k; mesh.scale.setScalar(1-k*.18); g.add(mesh); }
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffc070})); glow.scale.set(r*4,r*4,1); g.add(glow);
    g.userData={r,len}; return g; }
  // shock cone at max-Q
  const vapor=new THREE.Mesh(new THREE.ConeGeometry(1,1,40,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  // rocket rig
  const pivot=new THREE.Group(); scene.add(pivot);
  let rocket=null, info=null, L=null, detached=[], plumes={}, satellite=null;
  // mission state
  let t=-12, warp=10, camMode='chase', running=false, events=[], lastAlt=0;
  const T=540; // nominal seconds to orbit
  const prof=t=>{ const p=clamp(t/T,0,1); return { alt:200*Math.pow(Math.sin(p*Math.PI/2),1.6), v:27400*Math.pow(p,1.1)+(t>0?Math.min(t,10)*15:0), dr:1600*Math.pow(p,2.8) }; };
  function gamma(t){ if(t<=8) return Math.PI/2; const a=prof(t), b=prof(t+1); return Math.atan2(b.alt-a.alt, Math.max(1e-6,b.dr-a.dr)); }
  function eventsFor(key,spec){ const E=[]; const isF=key==='falcon9'||key==='falconheavy', ss=key==='starship';
    E.push({t:-10,k:'count',n:'Terminal count',d:'The launch computer has taken over. Propellant tanks are topped off and the vehicle switches to internal power.'});
    E.push({t:-3,k:'ign',n:'Engine ignition',d:`${spec.engines.split(' + ')[0]} roar to life while hold-down clamps keep the rocket on the pad and computers check every engine.`});
    E.push({t:0,k:'lift',n:'Liftoff!',d:`The ${spec.name} clears the tower. Thrust is now greater than weight, so it accelerates upward, slowly at first because it’s at its heaviest.`});
    E.push({t:12,k:'pitch',n:'Pitch-over / gravity turn',d:'The rocket starts tilting downrange. From here gravity gently bends its path over, trading vertical climb for horizontal speed — the speed that actually makes an orbit.'});
    E.push({t:68,k:'maxq',n:'Max-Q',d:'Maximum aerodynamic pressure: the air is still thick and the rocket is now supersonic. Engines are often throttled down here to protect the structure. Notice the vapor cone.'});
    if(spec.boosters && !spec.boosters.heavy) E.push({t:118,k:'bsep',n:key==='soyuz'?'Booster separation (Korolev Cross)':'Booster separation',d:key==='soyuz'?'The four strap-on boosters peel away together, forming the famous cross shape.':'The solid/strap-on boosters burn out and fall away. Less dead weight means more acceleration.'});
    if(spec.boosters && spec.boosters.heavy) E.push({t:150,k:'bsep',n:'Side booster separation',d:'The two side cores separate and turn around to fly back to land side by side.'});
    E.push({t:ss?160:157,k:'meco',n:ss?'Hot staging':'MECO + stage separation',d:ss?'The Ship lights its engines while still attached to the booster, pushing itself away. The vented ring absorbs the blast.':'Main engine cut-off. The empty first stage is detached by pneumatic pushers. It is roughly 60–80 km up and moving at 7,000–8,000 km/h.'});
    E.push({t:ss?162:166,k:'ses',n:ss?'Ship engines at full thrust':'Second engine start',d:'The upper stage’s vacuum-optimized engine takes over. Its huge nozzle bell is designed for the near-vacuum up here.'});
    if(isF) E.push({t:175,k:'boost',n:'Booster: boostback/entry burns',d:'Meanwhile the first stage flips around, relights its engines and heads for a drone ship or landing zone. Grid fins steer it through the atmosphere.'});
    if(ss) E.push({t:210,k:'boost',n:'Super Heavy returns',d:'The booster flips, performs a boostback burn and returns to Starbase, where the tower’s “chopstick” arms can catch it.'});
    if(L.fair) E.push({t:205,k:'fair',n:'Fairing separation',d:'The nose cone halves split off. The atmosphere is now thin enough that the payload doesn’t need protection from air friction and heating.'});
    if(isF) E.push({t:480,k:'land',n:'Booster landing',d:'The first stage lands upright, ready to be refurbished and flown again — the key to cheaper spaceflight.'});
    E.push({t:520,k:'seco',n:'SECO: orbit reached',d:'Second engine cut-off. At ~27,500 km/h the payload is falling around Earth as fast as the ground curves away beneath it. That’s orbit!'});
    E.push({t:545,k:'deploy',n:'Payload deployment',d:`The payload separates from the upper stage. ${L.mission&&L.mission!=='Unknown Payload'?L.mission+' is now in space.':'Mission accomplished.'}`});
    return E.sort((a,b)=>a.t-b.t); }
  function headingFor(l){ return /PO|SSO/.test(l.orbit)?Math.PI: Math.abs(l.lat)>40?Math.PI/3: Math.PI/2; }

  function setup(l){
    L=l; const key=rocketKey(l.rocket); const spec=ROCKETS[key];
    if(rocket) pivot.remove(rocket); detached.forEach(d=>scene.remove(d.g)); detached=[]; if(satellite){ scene.remove(satellite); satellite=null; }
    rocket=buildRocket(key); pivot.add(rocket); info=rocket.userData; L.fair = info.fairingHalves.length>0;
    // plumes
    plumes={}; const e=spec.eng||{}; const bell=(e.bell||.5);
    const clusterR = Math.max(info.coreR*.85, bell);
    plumes.s1=makePlume(clusterR, info.height*.5); plumes.s1.position.y=-bell*2.2; info.stages[1].add(plumes.s1);
    plumes.b=info.boosters.map(b=>{ const p=makePlume(b.userData.r*.8,b.userData.h*.45); p.position.y=-b.userData.r*1.1; b.add(p); return p; });
    plumes.s2=makePlume(info.coreR*.55, info.height*.6); plumes.s2.position.y=info.s1Top-info.coreR*1.3; plumes.s2.visible=false; info.stages[2].add(plumes.s2);
    vapor.scale.set(info.coreR*3.2,info.height*.35,info.coreR*3.2); vapor.position.y=info.height*.72; vapor.rotation.x=0; rocket.add(vapor);
    buildTower(info.height,info.coreR);
    // planet orientation: pad on top, downrange = +x
    const P=ll2v(l.lat,l.lon,1).normalize(); const q1=new THREE.Quaternion().setFromUnitVectors(P,new THREE.Vector3(0,1,0));
    const north=new THREE.Vector3(0,1,0).sub(P.clone().multiplyScalar(P.y)).normalize(); const east=new THREE.Vector3().crossVectors(north,P).normalize();
    const az=headingFor(l); const H=north.clone().multiplyScalar(Math.cos(az)).add(east.clone().multiplyScalar(Math.sin(az))).normalize().applyQuaternion(q1);
    const q2=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(H.x,0,H.z).normalize(),new THREE.Vector3(1,0,0));
    earthTilt.quaternion.copy(q2.multiply(q1));
    earth.material.map=earthTexture(); earth.material.needsUpdate=true; clouds.material.map=cloudTexture(); clouds.material.alphaMap=null; clouds.material.needsUpdate=true;
    // ocean on the side that is water at the coast sites (cosmetic)
    ocean.visible = /Cape|Kennedy|Vandenberg|Mahia|Wenchang|Guiana|Starbase|Satish|Tanegashima|Haiyang/.test(l.site||'');
    events=eventsFor(key,spec); events.forEach(e=>e.done=false); Cockpit.setup(info,spec);
    // UI
    $('lWho').textContent=l.provider||spec.maker; $('lName').textContent=l.mission; $('lPad').innerHTML=`${l.rocket}, ${spec.height} m tall, ${spec.stages} stages<br>${flag(l.cc)}${l.pad}, ${l.site}<br>Target orbit: ${l.orbit&&l.orbit!=='N/A'?l.orbit:'LEO'}`;
    $('lLog').innerHTML=events.map((e,i)=>`<div class="ev" id="ev${i}"><span class="tm">${fmtT(e.t)}</span><span>${e.n}</span></div>`).join('');
    restart();
  }
  function fmtT(s){ const sg=s<0?'T−':'T+'; s=Math.abs(Math.round(s)); return sg+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function restart(){ t=-12; running=true; lastAlt=0; userMoved=false;
    // reattach everything
    detached.forEach(d=>{ scene.remove(d.g); }); detached=[];
    rocket.add(info.stages[1]); rocket.add(info.stages[2]); rocket.add(info.stages[3]); info.boosters.forEach(b=>{ rocket.add(b); b.position.set(Math.cos(b.userData.ang)*(info.coreR+b.userData.r+(info.spec.boosters.gap||0)),0,Math.sin(b.userData.ang)*(info.coreR+b.userData.r+(info.spec.boosters.gap||0))); b.rotation.set(0,0,0); });
    info.stages[1].position.set(0,0,0); info.stages[1].rotation.set(0,0,0); info.stages[2].position.set(0,0,0); info.stages[3].position.set(0,0,0);
    info.fairingHalves.forEach(h=>{ h.userData.base.add(h); h.position.set(0,0,0); h.rotation.set(0,0,0); h.visible=true; });
    if(satellite){ scene.remove(satellite); satellite=null; }
    plumes.s1.visible=false; plumes.b.forEach(p=>p.visible=false); plumes.s2.visible=false;
    events.forEach((e,i)=>{ e.done=false; const el=$('ev'+i); el&&el.classList.remove('done'); });
    smokePool.forEach(p=>{p.life=0;p.s.visible=false;});
    if(towerG.userData.arm) towerG.userData.arm.rotation.y=0;
    setCam(camMode,true); drawProfile(); }
  function detach(obj, vel, spin, life=40){ obj.updateMatrixWorld(); const g=new THREE.Group(); scene.add(g);
    const wp=new THREE.Vector3(), wq=new THREE.Quaternion(), ws=new THREE.Vector3(); obj.matrixWorld.decompose(wp,wq,ws);
    g.position.copy(wp); g.quaternion.copy(wq); obj.parent.remove(obj); obj.position.set(0,0,0); obj.rotation.set(0,0,0); g.add(obj);
    detached.push({g,vel,spin,life}); return g; }
  function thrustDir(){ return new THREE.Vector3(0,1,0).applyQuaternion(pivot.quaternion); }
  function fire(e){ const up=thrustDir(); const side=new THREE.Vector3(0,0,1);
    switch(e.k){
      case 'ign': plumes.s1.visible=true; plumes.b.forEach(p=>p.visible=true); break;
      case 'lift': if(towerG.userData.arm) towerG.userData.arm.rotation.y=.9; break;
      case 'bsep': info.boosters.forEach(b=>{ const out=b.userData.out.clone().applyQuaternion(pivot.quaternion); b.children.forEach(c=>{ if(c.userData.len) c.visible=false; }); detach(b,out.multiplyScalar(6).add(up.clone().multiplyScalar(-4)),new THREE.Vector3(out.z*.4,0,-out.x*.4)); }); break;
      case 'meco': plumes.s1.visible=false; detach(info.stages[1],up.clone().multiplyScalar(-6),new THREE.Vector3(.05,0,.15)); break;
      case 'ses': plumes.s2.visible=true; break;
      case 'fair': info.fairingHalves.slice().forEach(h=>{ const dir=new THREE.Vector3(h.userData.dir,0,0).applyQuaternion(pivot.quaternion); h.parent.updateMatrixWorld(); detach(h,dir.multiplyScalar(5).add(up.clone().multiplyScalar(-3)),new THREE.Vector3(0,0,-h.userData.dir*.5)); }); break;
      case 'seco': plumes.s2.visible=false; break;
      case 'deploy': { const sat=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(info.coreR*.9,info.coreR*.5,info.coreR*.9),MAT.gold); sat.add(body);
        for(const s of [-1,1]){ const pn=new THREE.Mesh(new THREE.BoxGeometry(info.coreR*3,.05,info.coreR*.8),new THREE.MeshStandardMaterial({color:0x1b3d8f,metalness:.6,roughness:.3})); pn.position.x=s*info.coreR*2; sat.add(pn); }
        info.stages[3].add(sat); sat.position.y=info.height-info.coreR*1.2; satellite=detach(sat,up.clone().multiplyScalar(1.5),new THREE.Vector3(0,.2,0),1e9); break; }
    }
    if(['lift','maxq','meco','seco','bsep','fair','deploy','land'].includes(e.k)) toast(e.n);
    if(e.k==='lift') big('LIFTOFF'); if(e.k==='seco') big('ORBIT');
    if(['meco','bsep','fair'].includes(e.k)) flash(.22); if(e.k==='ign') flash(.12); if(e.k==='meco'||e.k==='seco') LaunchAudio.beep(660,.15); }
  let toastT=0, bigT=0;
  function toast(s){ const el=$('lToast'); el.textContent=s; el.style.opacity=1; toastT=3; }
  function big(s){ const el=$('lBig'); el.textContent=s; el.style.opacity=1; bigT=2.2; }
  function setCam(m,reset){ camMode=m; document.querySelectorAll('#lCtl [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c===m)); controls.enabled = m==='free' || m==='chase' || m==='side';
    Cockpit.show(m==='cockpit'); camera.up.set(0,1,0); if(m==='cockpit') return;
    if(reset||m!=='free'){ const h=info?info.height:60; const off = m==='side'? new THREE.Vector3(0,h*.2,h*2.6) : new THREE.Vector3(h*1.1,h*.05,h*1.5); camera.position.copy(off); controls.target.set(0,h*.5,0); } }
  document.querySelectorAll('#lCtl [data-c]').forEach(b=>b.onclick=()=>setCam(b.dataset.c));
  document.querySelectorAll('#lCtl [data-w]').forEach(b=>b.onclick=()=>{ warp=+b.dataset.w; document.querySelectorAll('#lCtl [data-w]').forEach(x=>x.classList.toggle('on',x===b)); });
  $('lRestart').onclick=()=>restart();
  $('lSound').onclick=e=>{ const on=LaunchAudio.toggle(); e.currentTarget.textContent=on?'Sound on':'Sound off'; e.currentTarget.classList.toggle('on',on); e.currentTarget.setAttribute('aria-pressed',String(on)); };
  function flash(a=.35){ const f=$('lFlash'); f.style.transition='none'; f.style.opacity=a; requestAnimationFrame(()=>{ f.style.transition='opacity .7s'; f.style.opacity=0; }); }
  $('lToHangar').onclick=()=>show('hangar',rocketKey(L.rocket));

  // ascent profile mini-chart
  const pc=$('lProf'), px=pc.getContext('2d');
  function drawProfile(){ const W=pc.width,H=pc.height; px.clearRect(0,0,W,H); px.strokeStyle='rgba(159,240,176,.12)'; px.lineWidth=1;
    for(let i=0;i<=4;i++){ px.beginPath(); px.moveTo(40,10+i*(H-40)/4); px.lineTo(W-10,10+i*(H-40)/4); px.stroke(); }
    px.fillStyle='rgba(159,240,176,.6)'; px.font='18px "B612 Mono"'; px.fillText('200 km',2,24); px.fillText('0',20,H-28); px.fillText('downrange',W-120,H-6);
    const X=d=>40+d/1650*(W-50), Y=a=>H-30-a/210*(H-40);
    px.strokeStyle='rgba(159,240,176,.3)'; px.setLineDash([6,6]); px.lineWidth=3; px.beginPath(); for(let s=0;s<=T;s+=5){ const p=prof(s); s?px.lineTo(X(p.dr),Y(p.alt)):px.moveTo(X(p.dr),Y(p.alt)); } px.stroke(); px.setLineDash([]);
    if(t>0){ px.strokeStyle='#9ff0b0'; px.lineWidth=4; px.beginPath(); for(let s=0;s<=Math.min(t,T);s+=3){ const p=prof(s); s?px.lineTo(X(p.dr),Y(p.alt)):px.moveTo(X(p.dr),Y(p.alt)); } px.stroke();
      const p=prof(Math.min(t,T)); px.fillStyle='#fff'; px.beginPath(); px.arc(X(p.dr),Y(p.alt),6,0,6.283); px.fill(); }
    events.filter(e=>['maxq','meco','fair','seco'].includes(e.k)).forEach(e=>{ const p=prof(e.t); px.fillStyle=e.done?'#ffc35a':'rgba(159,240,176,.35)'; px.beginPath(); px.arc(X(p.dr),Y(p.alt),4,0,6.283); px.fill(); }); }

  const camWorld=new THREE.Vector3(); let profAcc=0, userMoved=false; controls.addEventListener('start',()=>userMoved=true);
  function update(dt){ if(!rocket) return;
    const w = t<20 ? Math.min(warp,1.5) : warp; // liftoff always near real-time
    if(running) t+=dt*w; if(t>620){ running=false; }
    const p=prof(Math.max(t,0)); const alt=p.alt*1000, dr=p.dr*1000, g=gamma(Math.max(t,0));
    // move the world, keep rocket near origin
    const lift = t<0?0:alt;
    earthPivot.position.set(0,-RE-lift,0); earthPivot.rotation.z = dr/RE;
    pivot.rotation.z = -(Math.PI/2-g);
    // events
    events.forEach((e,i)=>{ if(!e.done&&t>=e.t){ e.done=true; $('ev'+i)?.classList.add('done'); fire(e); const now=$('lNow'); now.innerHTML=`<b>${e.n}.</b> ${e.d}`; } });
    // plume flicker & altitude expansion
    const expand=1+Math.min(alt/40000,3);
    [plumes.s1,...plumes.b,plumes.s2].forEach(pl=>{ if(!pl||!pl.visible) return; const f=.9+Math.random()*.2; const ign = t<0? clamp((t+3)/3,0,1)*.6:1; pl.scale.set(expand*f*ign,(1+(expand-1)*.6)*f*ign,expand*f*ign); });
    // detached parts drift away (relative frame)
    const acc=thrustDir().multiplyScalar(t>520?0:-(t<160?14:9)*Math.min(w,10)*.12);
    detached.forEach(d=>{ d.vel.add(acc.clone().multiplyScalar(dt)); d.g.position.add(d.vel.clone().multiplyScalar(dt*Math.min(w,10)*.6)); d.g.rotation.x+=d.spin.x*dt; d.g.rotation.y+=d.spin.y*dt; d.g.rotation.z+=d.spin.z*dt; d.life-=dt; });
    detached=detached.filter(d=>{ if(d.life<=0||d.g.position.length()>8000){ scene.remove(d.g); return false; } return true; });
    // smoke at pad
    if(t>-3&&t<14 && running){ for(let k=0;k<4;k++){ const side=Math.random()<.5?-1:1; puff(new THREE.Vector3((Math.random()-.5)*20,6,-30-Math.random()*20),new THREE.Vector3(side*(8+Math.random()*25)*(Math.random()),4+Math.random()*10,-(20+Math.random()*40)),info.coreR*5,7+Math.random()*4); } }
    if(t>0&&t<25&&running){ const base=new THREE.Vector3(0,lift+2,0); for(let k=0;k<2;k++) puff(base.clone().add(new THREE.Vector3((Math.random()-.5)*info.coreR*3,0,(Math.random()-.5)*info.coreR*3)),new THREE.Vector3((Math.random()-.5)*10,Math.random()*4,(Math.random()-.5)*10),info.coreR*4,9); }
    smokePool.forEach(pp=>{ if(pp.life<=0){ pp.s.visible=false; return; } pp.life-=dt; pp.s.position.addScaledVector(pp.v,dt); pp.v.multiplyScalar(.985); const a=pp.life/pp.max; const s=pp.size*(1+(1-a)*3.5); pp.s.scale.set(s,s,1); pp.s.material.opacity=Math.min(.75,a*.9); });
    // vapor cone around max-Q
    vapor.material.opacity = t>52&&t<82 ? .22*Math.sin((t-52)/30*Math.PI)*(0.85+Math.random()*.3) : 0;
    // sky & environment by altitude
    const ka=alt/1000; const s1=smooth(0,35,ka), s2=smooth(25,90,ka);
    const top=new THREE.Color(0x2f6fc4).lerp(new THREE.Color(0x061230),s1).lerp(new THREE.Color(0x000000),s2);
    const bot=new THREE.Color(0xbcd8f3).lerp(new THREE.Color(0x4c78b8),s1).lerp(new THREE.Color(0x02040a),s2);
    skyMat.uniforms.top.value.copy(top); skyMat.uniforms.bot.value.copy(bot); sky.position.copy(camera.position);
    stars.material.opacity=smooth(30,80,ka)*.9; stars.position.copy(camera.position);
    groundMat.opacity=1-smooth(8,30,ka); plane.visible=groundMat.opacity>0.01; towerG.visible=padDisk.visible=trench.visible=ka<40;
    clouds.material.opacity=smooth(5,40,ka)*.5; atmo.visible=ka>15;
    if(!scene.fog) scene.fog=new THREE.Fog(0xbcd8f3,1,1); scene.fog.color.copy(bot); const fk=smooth(15,30,ka); scene.fog.near=lerp(3000+ka*2000,1e9,fk); scene.fog.far=lerp(40000+ka*30000,2e9,fk);
    hemi.intensity=.75-.35*s2;
    // camera
    const H=info.height; const center=new THREE.Vector3(0,H*.5,0).applyQuaternion(pivot.quaternion);
    if(camMode==='cockpit'){ const f=thrustDir(); const gup=new THREE.Vector3(-f.y,f.x,0); const top=new THREE.Vector3(0,H*1.02,0).applyQuaternion(pivot.quaternion).add(f.clone().multiplyScalar(2));
      camera.position.copy(top); camera.up.copy(gup); camera.lookAt(top.clone().add(f.clone().applyAxisAngle(new THREE.Vector3(0,0,1),-0.42))); if(camera.fov!==72){ camera.fov=72; camera.updateProjectionMatrix(); } }
    else if(camMode==='pad'){ const padCam=new THREE.Vector3(-260,25,320); ground.localToWorld(camWorld.copy(padCam)); camera.position.copy(camWorld); camera.lookAt(center); camera.fov=lerp(camera.fov, clamp(50-Math.log10(1+alt/50)*14,3,50),.08); camera.updateProjectionMatrix(); }
    else { if(camera.fov!==50){ camera.fov=50; camera.updateProjectionMatrix(); } const delta=center.clone().sub(controls.target); controls.target.add(delta); camera.position.add(delta);
      if(camMode==='chase'&&!userMoved&&t>25){ const k=smooth(25,240,t); const off=new THREE.Vector3(lerp(H*1.1,-H*.6,k),lerp(H*.05,H*1.3,k),lerp(H*1.5,H*2.4,k)); camera.position.lerp(center.clone().add(off),.02); }
      controls.update(); }
    // HUD
    $('lClock').textContent=fmtT(t);
    $('lAlt').textContent=(t<0?0:p.alt).toFixed(p.alt<10?1:0)+' km';
    $('lSpd').textContent=Math.round(t<0?0:p.v).toLocaleString()+' km/h';
    $('lDr').textContent=Math.round(t<0?0:p.dr).toLocaleString()+' km';
    const gl = t<0?1: t<157? 1.2+t/157*2.6 : t<166? 0 : t<520? .6+(t-166)/354*3.2 : 0;
    $('lG').textContent=gl.toFixed(1)+' g';
    const st = t<-3?'On the pad, fueled': t<0?'Ignition sequence': t<157?'First stage burning': t<166?'Coasting through staging': t<520?'Second stage burning':'In orbit';
    const ls=$('lStage'); ls.textContent=st; ls.className='lamp '+(t<-3?'':t<520?'amber':'go'); $('lBar').style.width=clamp(t/545*100,0,100)+'%';
    // vehicle systems, cockpit, sound, shake
    const s1Gone=events.some(e=>e.k==='meco'&&e.done);
    const thr=Cockpit.update({t,alt:t<0?0:p.alt,v:t<0?0:p.v,dr:t<0?0:p.dr,gammaDeg:g*180/Math.PI,gl,met:fmtT(t),s1on:plumes.s1.visible,bon:plumes.b.some(x=>x.visible),s2on:plumes.s2.visible,stage1Gone:s1Gone,events})||0;
    const thrNow = t<-3?0: t<0? (t+3)/3: plumes.s1.visible? (t>45&&t<78?.72:1) : plumes.s2.visible?1:0;
    LaunchAudio.update(t,thrNow,p.alt,!plumes.s1.visible&&plumes.s2.visible);
    const shake = running? (t>-3&&t<18? .5*(1-Math.max(0,t)/18)+.15 : 0) + (t>50&&t<80? .45*Math.sin((t-50)/30*Math.PI):0) : 0;
    if(shake>0.01){ const amp = camMode==='cockpit'? .02*shake : H*.004*shake; camera.position.x+=(Math.random()-.5)*amp; camera.position.y+=(Math.random()-.5)*amp; if(camMode==='cockpit') camera.rotation.z+=(Math.random()-.5)*.006*shake;
      const d=document.querySelector('#cockpit .dash'); if(d) d.style.transform=`translate(${((Math.random()-.5)*4*shake).toFixed(1)}px,${((Math.random()-.5)*4*shake).toFixed(1)}px)`; }
    profAcc+=dt; if(profAcc>.25){ profAcc=0; drawProfile(); }
    toastT-=dt; if(toastT<=0) $('lToast').style.opacity=0; bigT-=dt; if(bigT<=0) $('lBig').style.opacity=0;
  }
  return { scene,camera,labels, _seek(s){ t=s; },
    show(l){ controls.enabled=camMode!=='cockpit'; LaunchAudio.unmute(); if(l){ setup(l); } else if(!rocket){ setup(VIEWS.earth.nextLaunch()||DATA.up[0]); } Cockpit.show(camMode==='cockpit'); },
    hide(){ controls.enabled=false; LaunchAudio.mute(); Cockpit.show(false); $('lToast').style.opacity=0; $('lBig').style.opacity=0; },
    update };
})();
