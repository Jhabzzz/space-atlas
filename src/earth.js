// ================= EARTH / LAUNCH GLOBE =================
VIEWS.earth = (()=>{
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.01,2000);
  camera.position.set(0,1,3.6);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  Object.assign(controls,{enableDamping:true,dampingFactor:.08,minDistance:1.15,maxDistance:16,enablePan:false,autoRotate:true,autoRotateSpeed:.3,enabled:false});
  const labels=new Labels(); scene.background=new THREE.Color(0x0f2238);
  scene.add(starField(1800,500,900,1.1));
  scene.add(new THREE.AmbientLight(0xffffff,.65)); const sun=new THREE.DirectionalLight(0xffffff,.8); sun.position.set(5,3,4); scene.add(sun);
  const R=1, globe=new THREE.Group(); scene.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R*.995,64,64),new THREE.MeshBasicMaterial({color:0x0a1828})));
  globe.add(atmosphere(R*1.13,[.3,.5,1],2.6,1.1));
  { const n=LAND.length/2, a=new Float32Array(n*3); for(let i=0;i<n;i++){ const v=ll2v(LAND[i*2]/10,LAND[i*2+1]/10,R*1.001); a.set([v.x,v.y,v.z],i*3); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3));
    globe.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x8fa9c9,size:.0105,transparent:true,opacity:.85}))); }
  { const m=new THREE.LineBasicMaterial({color:0x5b7499,transparent:true,opacity:.22});
    for(let lat=-60;lat<=60;lat+=30){ const pts=[]; for(let lon=-180;lon<=180;lon+=4) pts.push(ll2v(lat,lon,R*1.0005)); globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),m)); }
    for(let lon=-180;lon<180;lon+=30){ const pts=[]; for(let lat=-90;lat<=90;lat+=4) pts.push(ll2v(lat,lon,R*1.0005)); globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),m)); } }

  // ---- satellite shells ----
  const satLayer=new THREE.Group(); scene.add(satLayer);
  function shell(n, altKm, incls, color, size, planes){ const r=R+altKm/6371; const pos=new Float32Array(n*3); const meta=[];
    for(let i=0;i<n;i++){ const inc=incls[i%incls.length]*Math.PI/180; const pl=planes?(i%planes):Math.floor(Math.random()*72); const raan=pl/(planes||72)*Math.PI*2; meta.push({inc,raan,ph:Math.random()*Math.PI*2}); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({color,size,transparent:true,opacity:.7,depthWrite:false}));
    pts.userData={meta,r,w:.16*Math.pow(r,-1.5)}; satLayer.add(pts); return pts; }
  const shells=[ shell(2600,550,[53,53,53,70,97.6],0xc9d8ea,.007), shell(60,20200,[55],0x8fe0a8,.03,6), shell(160,35786,[0],0xffc35a,.035,1) ];
  const tmpV=new THREE.Vector3();
  function orbitPos(m,r,ang,out){ const x=Math.cos(ang)*r, y=Math.sin(ang)*r; // in orbital plane
    const ci=Math.cos(m.inc), si=Math.sin(m.inc), cr=Math.cos(m.raan), sr=Math.sin(m.raan);
    const X=x, Y=y*ci, Z=y*si; out.set(X*cr-Y*sr, Z, X*sr+Y*cr); return out; }
  // ring labels
  const ringAnchors=[['Low Earth orbit, where Starlink flies (~550 km)',R+550/6371],['GPS and other navigation satellites (20,200 km)',R+20200/6371],['Geostationary belt (35,786 km)',R+35786/6371]].map(([t,r])=>{ const o=new THREE.Object3D(); o.position.set(r*.72,r*.72*0,r*.69); satLayer.add(o); labels.add(t,o,{cls:'small'}); return o; });
  // stations
  const stations=new THREE.Group(); scene.add(stations);
  const stn=[{n:'Tiangong (China)',inc:41.5,alt:390,raan:3.6,ph:2,c:0xffc35a}].map(s=>{
    const m={inc:s.inc*Math.PI/180,raan:s.raan,ph:s.ph}; const r=R+s.alt/6371*3; // altitude exaggerated 3x so it’s visible
    const pts=[]; for(let i=0;i<=128;i++) pts.push(orbitPos(m,r,i/128*Math.PI*2,new THREE.Vector3()));
    stations.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:s.c,transparent:true,opacity:.3})));
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:s.c,transparent:true,depthWrite:false})); spr.scale.set(.05,.05,1); stations.add(spr);
    labels.add(s.n,spr,{cls:'small',hideBehind:true}); return {m,r,spr}; });
  // ISS: real position from its orbital elements (altitude exaggerated 3x on this globe)
  const issSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgba(255,255,255,1)','rgba(255,90,70,.9)','rgba(207,59,45,0)'),transparent:true,depthWrite:false})); issSpr.scale.set(.09,.09,1); stations.add(issSpr);
  const issLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xff5a46,transparent:true,opacity:.75})); stations.add(issLine);
  labels.add('ISS, live',issSpr,{cls:'iss',hideBehind:true,onClick:()=>show('sats','iss')});
  let issLineT=0;
  function issUpdate(){ const s=issAt(new Date()); if(!s) return; issSpr.position.copy(ll2v(s.lat,s.lon,R+s.h/6371*3));
    if(Date.now()-issLineT>60000){ issLineT=Date.now(); const pts=[]; for(let m=-47;m<=47;m+=1){ const q=issAt(new Date(Date.now()+m*6e4)); if(q) pts.push(ll2v(q.lat,q.lon,R+q.h/6371*3)); } issLine.geometry.dispose(); issLine.geometry=new THREE.BufferGeometry().setFromPoints(pts); } }

  // ---- launch pads ----
  const padGroup=new THREE.Group(); globe.add(padGroup); const pickables=[]; let sites=[];
  const COL={up:0xf2a516,past:0x3f7fd1,hist:0x9a6fd0};
  let filter='up', query='', selected=null, list=[];
  const trajLine=new THREE.Group(); globe.add(trajLine);
  function visibleLaunches(){ const src = filter==='up'?DATA.up: filter==='past'?DATA.past: filter==='hist'?DATA.hist: [...DATA.up,...DATA.past,...DATA.hist];
    return src.filter(l=>!query||[l.rocket,l.mission,l.provider,l.site,l.cc,l.pad,l.orbit].join(' ').toLowerCase().includes(query)); }
  function buildPads(){ padGroup.clear(); pickables.length=0; labels.items.filter(i=>i.isPad).forEach(i=>i.el.remove()); labels.items=labels.items.filter(i=>!i.isPad);
    const map=new Map(); list.forEach(l=>{ const k=l.lat.toFixed(1)+','+l.lon.toFixed(1); if(!map.has(k)) map.set(k,{lat:l.lat,lon:l.lon,site:l.site,items:[]}); map.get(k).items.push(l); });
    sites=[...map.values()];
    sites.forEach(s=>{ const kinds=new Set(s.items.map(i=>i.kind)); const kind=kinds.has('up')?'up':kinds.has('past')?'past':'hist';
      const p=ll2v(s.lat,s.lon,R*1.003), n=p.clone().normalize();
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:COL[kind],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
      const sc=.05+Math.min(s.items.length,10)*.007; spr.position.copy(p); spr.scale.set(sc,sc,1); spr.userData={site:s,base:sc}; padGroup.add(spr); pickables.push(spr);
      const h=.04+Math.min(s.items.length,10)*.012; const beam=new THREE.Mesh(new THREE.CylinderGeometry(.0016,.0016,h,6),new THREE.MeshBasicMaterial({color:COL[kind],transparent:true,opacity:.8}));
      beam.position.copy(n.clone().multiplyScalar(R+h/2)); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),n); padGroup.add(beam);
      const anchor=new THREE.Object3D(); anchor.position.copy(n.clone().multiplyScalar(R+h+.01)); padGroup.add(anchor);
      if(s.items.length>=2||sites.length<14){ const short=s.site.split(',')[0].replace('Satellite Launch Center','').replace('Space Launch Site','').trim(); const it=labels.add(short,anchor,{cls:'small',hideBehind:true}); it.isPad=true; }
    }); }
  function stat(l){ if(l.kind==='hist') return 'Milestone'; if(l.kind==='past') return l.status==='Failure'?'Failure':'Success';
    const dt=new Date(l.net)-Date.now(); if(l.status==='Success') return 'Success'; if(dt<=0&&dt>-15*6e4) return 'Launching'; if(dt<-15*6e4) return 'Past T-0'; return l.status; }
  const LAMP={Go:'go',TBC:'amber',TBD:'',Success:'blue',Failure:'red',Milestone:'violet',Launching:'live','Past T-0':''};
  const STXT={Go:'Go',TBC:'To be confirmed',TBD:'Date not set',Success:'Success',Failure:'Failure',Milestone:'Milestone',Launching:'Launching now','Past T-0':'Awaiting result'};
  const lampOf=s=>`<span class="lamp ${LAMP[s]||''}">${STXT[s]||s}</span>`;
  function when(l){ const d=new Date(l.net); if(l.kind==='hist') return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    if(l.status==='TBD') return 'NET '+d.toLocaleDateString(undefined,{month:'short',year:'numeric'});
    return d.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
  function renderList(){ const el=$('eList'); $('eCount').textContent=list.length+' listed';
    el.innerHTML=list.map((l,i)=>{ const s=stat(l), ms=new Date(l.net)-Date.now(); const cd = l.kind==='up'&&ms>0&&l.status!=='TBD';
      return `<div class="row ${selected===l?'sel':''}" data-i="${i}"><div class="main"><div class="t1">${l.rocket}, ${l.provider}</div><div class="t2">${l.mission}</div>
      <div class="t3">${flag(l.cc)}${l.site}</div><div class="t3">${when(l)}</div>${cd?`<div class="cd" data-cd="${i}">${fmtCd(ms)}</div>`:''}</div>${lampOf(s)}</div>`; }).join('') || '<div style="padding:20px 14px;color:var(--ink-2)">Nothing matches that search. Try a rocket name like Falcon, or a country code like CN.</div>'; }
  $('eList').addEventListener('click',e=>{ const it=e.target.closest('.row'); if(it) select(list[+it.dataset.i]); });
  $('eQ').addEventListener('input',e=>{ query=e.target.value.toLowerCase().trim(); refresh(); });
  document.querySelectorAll('#eSeg button').forEach(b=>b.onclick=()=>{ filter=b.dataset.f; document.querySelectorAll('#eSeg button').forEach(x=>x.classList.toggle('on',x===b)); refresh(); });
  function refresh(){ list=visibleLaunches(); if(filter!=='up'&&filter!=='all') list.sort((a,b)=>new Date(b.net)-new Date(a.net)); else if(filter==='up') list.sort((a,b)=>new Date(a.net)-new Date(b.net)); buildPads(); renderList(); }
  function nextLaunch(){ const now=Date.now(); return DATA.up.filter(l=>new Date(l.net)>now-15*6e4&&l.status!=='TBD'&&l.status!=='Success').sort((a,b)=>new Date(a.net)-new Date(b.net))[0]; }
  function renderNext(){ const n=nextLaunch(); if(!n){ $('eNext').style.display='none'; return; }
    const live = new Date(n.net)<=Date.now();
    $('eNext').innerHTML=`<div class="lbl">${live?'Launching now':'Next launch anywhere on Earth'}</div><div class="readout amber" id="eNextCd">${fmtCd(new Date(n.net)-Date.now())}</div>
      <h3 style="margin-top:8px">${n.mission}</h3><div class="lbl">${n.rocket}, ${n.provider}</div><div class="lbl" style="margin-top:2px">${flag(n.cc)}${n.site}</div>
      <button id="eNextGo" style="margin-top:8px">Show on the globe</button>`;
    $('eNextGo').onclick=()=>select(n); }
  function renderStats(){ $('eStatGrid').innerHTML=STATS.map(s=>`<div><div class="v">${s.v}</div><div class="k">${s.k}</div><div class="s">${s.s}</div></div>`).join(''); }
  renderStats();

  let fly=null;
  function flyTo(lat,lon,dist){ fly={from:camera.position.clone(),to:ll2v(lat,lon,1).normalize().multiplyScalar(dist),t:0}; controls.autoRotate=false; }
  function headingFor(l){ return /PO|SSO/.test(l.orbit)?Math.PI: Math.abs(l.lat)>40?Math.PI/3: Math.PI/2; }
  function drawTraj(l){ trajLine.clear(); const up=ll2v(l.lat,l.lon,1).normalize(); const north=new THREE.Vector3(0,1,0).sub(up.clone().multiplyScalar(up.y)).normalize(); const east=new THREE.Vector3().crossVectors(north,up).normalize();
    const az=headingFor(l); const head=north.clone().multiplyScalar(Math.cos(az)).add(east.clone().multiplyScalar(Math.sin(az))).normalize();
    const axis=new THREE.Vector3().crossVectors(up,head).normalize(); const pts=[];
    for(let i=0;i<=120;i++){ const p=i/120; const ang=p*1.6; const alt=.004+.06*Math.pow(Math.sin(Math.min(p*2.2,1)*Math.PI/2),1.4); pts.push(up.clone().applyAxisAngle(axis,ang).multiplyScalar(R+alt)); }
    const g=new THREE.BufferGeometry().setFromPoints(pts); trajLine.add(new THREE.Line(g,new THREE.LineDashedMaterial({color:0xff9a5a,dashSize:.02,gapSize:.012,transparent:true,opacity:.9}))); trajLine.children[0].computeLineDistances(); }
  function select(l){ selected=l; renderList(); const el=document.querySelector('#eList .row.sel'), box=$('eList'); if(el&&(el.offsetTop<box.scrollTop||el.offsetTop>box.scrollTop+box.clientHeight-60)) box.scrollTop=el.offsetTop-box.clientHeight/3;
    flyTo(l.lat,l.lon,2.7); drawTraj(l); const s=stat(l); const rk=ROCKETS[rocketKey(l.rocket)];
    const card=$('eCard'); card.style.display='block';
    card.innerHTML=`<button class="x" id="eX">Close</button><div class="lbl">${l.provider}</div><h2 style="margin-top:2px">${l.mission}</h2>
      <div class="meta">${l.rocket}${rocketKey(l.rocket)!=='generic'?`, ${rk.height} m tall`:''}</div>
      <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px;align-items:center">${lampOf(s)}<span class="meta" style="margin:0">${when(l)}</span><span class="meta" style="margin:0">${flag(l.cc)}${l.pad}, ${l.site}</span>${l.orbit&&l.orbit!=='N/A'?`<span class="meta" style="margin:0">Target orbit ${l.orbit}</span>`:''}</div>
      ${l.desc?`<div class="desc">${l.desc}</div>`:''}
      <div class="acts"><button class="go" id="eWatch">Watch the launch</button><button id="eInspect">Inspect the ${rk.name}</button></div>`;
    $('eX').onclick=()=>{ card.style.display='none'; selected=null; trajLine.clear(); controls.autoRotate=true; renderList(); };
    $('eWatch').onclick=()=>show('launch',l); $('eInspect').onclick=()=>show('hangar',rocketKey(l.rocket)); }

  const ray=new THREE.Raycaster();
  renderer.domElement.addEventListener('mousemove',e=>{ if(current!=='earth') return; ray.setFromCamera(pointer(e),camera); const h=ray.intersectObjects(pickables)[0];
    if(h){ const s=h.object.userData.site; showTip(e,`<b>${s.site}</b><br><span style="color:var(--dim)">${s.items.length} launch${s.items.length>1?'es':''} in this view</span>`); renderer.domElement.style.cursor='pointer'; } else { hideTip(); renderer.domElement.style.cursor=''; } });
  renderer.domElement.addEventListener('click',e=>{ if(current!=='earth') return; ray.setFromCamera(pointer(e),camera); const h=ray.intersectObjects(pickables)[0];
    if(h){ const s=h.object.userData.site; select(s.items[0]); } });
  controls.addEventListener('start',()=>{ fly=null; });
  $('lySat').onclick=e=>{ satLayer.visible=!satLayer.visible; e.target.classList.toggle('on',satLayer.visible); };
  $('lyStn').onclick=e=>{ stations.visible=!stations.visible; e.target.classList.toggle('on',stations.visible); };

  let acc=0,time=0;
  return { scene,camera,labels,
    init(){ refresh(); renderNext(); }, reload(){ refresh(); renderNext(); }, renderStats,
    show(){ controls.enabled=true; },
    hide(){ controls.enabled=false; labels.hide(); hideTip(); },
    update(dt){ time+=dt;
      if(fly){ fly.t=Math.min(fly.t+dt*1.1,1); const e=1-Math.pow(1-fly.t,3); const len=lerp(fly.from.length(),fly.to.length(),e); camera.position.copy(fly.from.clone().normalize().lerp(fly.to.clone().normalize(),e).normalize().multiplyScalar(len)); if(fly.t>=1) fly=null; }
      if(satLayer.visible) shells.forEach(s=>{ const a=s.geometry.attributes.position.array, m=s.userData.meta; for(let i=0;i<m.length;i++){ orbitPos(m[i],s.userData.r,m[i].ph+time*s.userData.w*6,tmpV); a[i*3]=tmpV.x; a[i*3+1]=tmpV.y; a[i*3+2]=tmpV.z; } s.geometry.attributes.position.needsUpdate=true; });
      stn.forEach(s=>orbitPos(s.m,s.r,s.m.ph+time*.25,s.spr.position)); issUpdate();
      pickables.forEach(s=>{ const k=s.userData.base*(1+.25*Math.sin(time*3+s.position.x*10)); s.scale.set(k,k,1); });
      const d=camera.position.length(); ringAnchors.forEach((o,i)=>{ labels.items.find(it=>it.obj===o).visible = satLayer.visible && (i===0? d<5 : d>4); });
      labels.items.filter(i=>i.isPad).forEach(i=>i.visible=d<4.2);
      controls.update();
      acc+=dt; if(acc>1){ acc=0; document.querySelectorAll('#eList [data-cd]').forEach(el=>{ const l=list[+el.dataset.cd]; el.textContent=fmtCd(new Date(l.net)-Date.now()); }); const n=nextLaunch(), c=$('eNextCd'); if(n&&c) c.textContent=fmtCd(new Date(n.net)-Date.now()); }
    }, nextLaunch };
})();
