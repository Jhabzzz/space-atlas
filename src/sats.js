// ================= SATELLITES + LIVE ISS =================
let ISS_SATREC=null, ISS_TLE_LIVE=false, ISS_EPOCH=null;
function initIssTle(l1,l2){ try{ if(typeof satellite==='undefined') return false; ISS_SATREC=satellite.twoline2satrec(l1,l2);
  const yy=+l1.slice(18,20), doy=+l1.slice(20,32); ISS_EPOCH=new Date(Date.UTC(2000+yy,0,1)+(doy-1)*864e5); return true; }catch(e){ return false; } }
initIssTle(ISS_TLE[0],ISS_TLE[1]);
let ISS_CREW_LIVE=null;
async function fetchIssTle(){
  try{ const j=await getJSON('/api/iss'); if(j.tle&&initIssTle(j.tle[0],j.tle[1])){ ISS_TLE_LIVE=true; } if(j.crew) ISS_CREW_LIVE={...j.crew,at:j.fetchedAt}; LIVE.iss=j.fetchedAt; }catch(e){}
  if(!ISS_TLE_LIVE){ try{ const ctl=new AbortController(); setTimeout(()=>ctl.abort(),6000);
    const r=await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle',{signal:ctl.signal}); if(!r.ok) throw 0;
    const lines=(await r.text()).trim().split(/\r?\n/).map(s=>s.trim()); const l1=lines.find(s=>s.startsWith('1 ')), l2=lines.find(s=>s.startsWith('2 '));
    if(l1&&l2&&initIssTle(l1,l2)) ISS_TLE_LIVE=true; }catch(e){} }
  VIEWS.sats&&VIEWS.sats.renderCrew&&VIEWS.sats.renderCrew(); }
async function fetchSatCounts(){ try{ const j=await getJSON('/api/sats',15000); if(!j.counts) return; LIVE.sats=j.fetchedAt; const day=new Date(j.fetchedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    CONSTELLATIONS.forEach(c=>{ const n=j.counts[c.id]; if(n){ c.count=n.toLocaleString(); c.countNote=`tracked in orbit by CelesTrak, ${day} (includes satellites still raising or lowering their orbits)`; c.live=true; } });
    if(j.counts.active){ STATS[0]={v:j.counts.active.toLocaleString(),k:'Active satellites',s:'CelesTrak live list, '+day}; }
    if(j.counts.starlink){ STATS[1]={v:j.counts.starlink.toLocaleString(),k:'of them Starlink',s:'tracked by CelesTrak, '+day}; }
    const sn=$('satSrcNote'); if(sn) sn.innerHTML=`Live counts from CelesTrak, updated ${ago(j.fetchedAt)}. CelesTrak counts every catalogued satellite of a constellation in orbit, so totals can run a little above “working” figures. Dots are drawn at each constellation’s real altitudes and inclinations; Starlink shows 1 dot per 4 satellites.`;
    VIEWS.sats.renderList&&VIEWS.sats.renderList(); VIEWS.earth.renderStats&&VIEWS.earth.renderStats(); }catch(e){} }
// ISS state at a date: geodetic + velocity (km/s) + position in our globe frame (unit = Earth radius)
function issAt(date){ if(!ISS_SATREC) return null; const pv=satellite.propagate(ISS_SATREC,date); if(!pv||!pv.position) return null;
  const gmst=satellite.gstime(date), geo=satellite.eciToGeodetic(pv.position,gmst);
  const lat=satellite.degreesLat(geo.latitude), lon=satellite.degreesLong(geo.longitude), h=geo.height;
  const v=pv.velocity, speed=Math.hypot(v.x,v.y,v.z);
  return {lat,lon,h,speed,date}; }
function sunDir(date){ const d=new Date(date); const start=Date.UTC(d.getUTCFullYear(),0,0); const N=(d-start)/864e5;
  const decl=-23.44*Math.cos(2*Math.PI/365*(N+10)); const hrs=d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;
  const lon=((-15*(hrs-12))+540)%360-180; return {lat:decl,lon,v:ll2v(decl,lon,1).normalize()}; }

function buildISS(){ const g=new THREE.Group(); // metres; truss along x, modules along z (flight direction), y = up
  const metal=new THREE.MeshStandardMaterial({color:0xc9ccd1,metalness:.55,roughness:.45});
  const white=new THREE.MeshStandardMaterial({color:0xeeeeea,roughness:.6});
  const wingTex=(()=>{ const c=document.createElement('canvas'); c.width=64; c.height=256; const x=c.getContext('2d'); x.fillStyle='#8a6a2a'; x.fillRect(0,0,64,256);
    x.fillStyle='#4a3514'; for(let i=0;i<64;i+=8) x.fillRect(i,0,1,256); for(let j=0;j<256;j+=8) x.fillRect(0,j,64,1); x.fillStyle='#2a3a6a'; x.fillRect(28,0,8,256); return new THREE.CanvasTexture(c); })();
  const wing=new THREE.MeshStandardMaterial({map:wingTex,metalness:.4,roughness:.5,side:THREE.DoubleSide});
  const truss=new THREE.Mesh(new THREE.BoxGeometry(109,2.2,2.2),metal); g.add(truss);
  const arrays=[];
  [-52,-41,41,52].forEach(x=>{ const pivot=new THREE.Group(); pivot.position.x=x; g.add(pivot); arrays.push(pivot);
    for(const s of [-1,1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(11.6,34),wing); p.rotation.x=-Math.PI/2; p.position.z=s*18.5; pivot.add(p);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,34,6),metal); mast.rotation.x=Math.PI/2; mast.position.z=s*18.5; pivot.add(mast); } });
  [-18,18].forEach(x=>{ for(let k=0;k<3;k++){ const r=new THREE.Mesh(new THREE.BoxGeometry(3.2,.2,13),white); r.position.set(x+(k-1)*3.6,-1.5,-9); g.add(r);} });
  const mod=(len,rad,z,x=0,y=-4,axis='z')=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,len,20),white); if(axis==='z') m.rotation.x=Math.PI/2; else m.rotation.z=Math.PI/2; m.position.set(x,y,z); g.add(m); return m; };
  mod(8.5,2.1,-14); mod(5.5,2.3,-7.5); mod(6,2.1,-1); mod(5.5,2.3,5); mod(12.5,2.0,14); mod(13,2.1,27);
  mod(11,2.2,-7.5,-9,-4,'x'); mod(7,2.1,-7.5,8,-4,'x');
  for(const s of [-1,1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(10.7,3.3),wing); p.position.set(s*7.5,-4,30); p.rotation.x=-Math.PI/2; g.add(p); }
  g.userData.arrays=arrays; return g; }

VIEWS.sats = (()=>{
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0f2238);
  const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.0005,500); camera.position.set(0,1.2,3.6);
  const controls=new THREE.OrbitControls(camera,renderer.domElement); Object.assign(controls,{enableDamping:true,dampingFactor:.08,enabled:false,minDistance:1.08,maxDistance:12,enablePan:false});
  const labels=new Labels();
  scene.add(starField(2200,200,320,1.1));
  const sunLight=new THREE.DirectionalLight(0xfff6e8,1.35); scene.add(sunLight); scene.add(new THREE.AmbientLight(0x6c86b0,.22));
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1,96,72),new THREE.MeshPhongMaterial({shininess:6,specular:0x223344})); scene.add(earth);
  scene.add(atmosphere(1.12,[.35,.6,1],2.4,1));
  // graticule, faint
  { const m=new THREE.LineBasicMaterial({color:0x9fb6d4,transparent:true,opacity:.08});
    for(let lat=-60;lat<=60;lat+=30){ const pts=[]; for(let lon=-180;lon<=180;lon+=3) pts.push(ll2v(lat,lon,1.002)); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),m)); } }
  // ---- constellations ----
  const MU=398600.4418, RE=6371; let simTime=Date.now(), warp=30;
  const groups={};
  const DOT_TEX=(()=>{ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'); x.fillStyle='#fff'; x.beginPath(); x.arc(16,16,14,0,6.283); x.fill(); return new THREE.CanvasTexture(c); })();
  CONSTELLATIONS.forEach(c=>{ const meta=[]; let made=0;
    c.shells.forEach(([alt,inc,share],si)=>{ const n=si===c.shells.length-1? c.dots-made : Math.round(c.dots*share); made+=n;
      const planes=c.planes||Math.max(6,Math.round(Math.sqrt(n)*1.4)); const per=Math.ceil(n/planes);
      for(let i=0;i<n;i++){ const pl=i%planes, k=Math.floor(i/planes); meta.push({r:1+alt/RE, inc:inc*Math.PI/180, raan:pl/planes*Math.PI*2+si*.4, ph:k/per*Math.PI*2+pl*.37, w:Math.sqrt(MU/Math.pow(RE+alt,3))}); } });
    const pos=new Float32Array(meta.length*3); const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:c.color,size:c.size*260,sizeAttenuation:false,map:DOT_TEX,alphaTest:.4,transparent:true,opacity:.95,depthWrite:false});
    const pts=new THREE.Points(geo,mat); scene.add(pts); groups[c.id]={c,pts,meta,on:true}; });
  function orbitPos(m,ang,out){ const x=Math.cos(ang)*m.r, y=Math.sin(ang)*m.r; const ci=Math.cos(m.inc), si=Math.sin(m.inc), cr=Math.cos(m.raan), sr=Math.sin(m.raan);
    const X=x, Y=y*ci, Z=y*si; return out.set(X*cr-Y*sr, Z, X*sr+Y*cr); }
  // Tiangong (approximate orbit, not tracked)
  const tg={r:1+390/RE,inc:41.5*Math.PI/180,raan:2.1,ph:1.3,w:Math.sqrt(MU/Math.pow(RE+390,3))};
  const tgSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffc35a,transparent:true,depthWrite:false})); tgSpr.scale.set(.035,.035,1); scene.add(tgSpr);
  labels.add('Tiangong (China)',tgSpr,{cls:'small',hideBehind:true});
  // ---- ISS ----
  const iss=buildISS(); const ISS_SCALE=.0009; iss.scale.setScalar(ISS_SCALE); scene.add(iss);
  const issDot=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgba(255,255,255,1)','rgba(255,90,70,.9)','rgba(207,59,45,0)'),transparent:true,depthWrite:false})); issDot.scale.set(.07,.07,1); scene.add(issDot);
  const issTag=labels.add('ISS',issDot,{cls:'iss',hideBehind:true,onClick:()=>setFollow(true)});
  const orbitLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xff5a46,transparent:true,opacity:.8})); scene.add(orbitLine);
  const trackPast=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffc35a,transparent:true,opacity:.35})); scene.add(trackPast);
  const trackNext=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color:0xffc35a,dashSize:.012,gapSize:.008})); scene.add(trackNext);
  const vis=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.55})); scene.add(vis);
  let follow=false, showTrack=true, showVis=true, lastTrack=-1e12, state=null;
  function rebuildTrack(){ const now=simTime, P=[], F=[], O=[];
    for(let m=-95;m<=95;m+=1){ const s=issAt(new Date(now+m*6e4)); if(!s) continue; const g=ll2v(s.lat,s.lon,1.003); (m<=0?P:F).push(g); if(m===0) F.unshift(g); if(Math.abs(m)<=47) O.push(ll2v(s.lat,s.lon,1+s.h/RE)); }
    // break the track where it wraps the antimeridian? (3D: no wrap issue)
    trackPast.geometry.dispose(); trackPast.geometry=new THREE.BufferGeometry().setFromPoints(P);
    trackNext.geometry.dispose(); trackNext.geometry=new THREE.BufferGeometry().setFromPoints(F); trackNext.computeLineDistances();
    orbitLine.geometry.dispose(); orbitLine.geometry=new THREE.BufferGeometry().setFromPoints(O); lastTrack=now; }
  function visCircle(lat,lon,h){ // ground area that can see the ISS above 10° elevation
    const R=RE, e=10*Math.PI/180; const lam=Math.acos(R/(R+h)*Math.cos(e))-e; const c=ll2v(lat,lon,1).normalize();
    const a=new THREE.Vector3(0,1,0).cross(c).normalize(); if(a.lengthSq()<1e-6) a.set(1,0,0); const b=new THREE.Vector3().crossVectors(c,a); const pts=[];
    for(let i=0;i<=96;i++){ const t=i/96*Math.PI*2; const dir=c.clone().multiplyScalar(Math.cos(lam)).add(a.clone().multiplyScalar(Math.sin(lam)*Math.cos(t))).add(b.clone().multiplyScalar(Math.sin(lam)*Math.sin(t))); pts.push(dir.multiplyScalar(1.004)); }
    vis.geometry.dispose(); vis.geometry=new THREE.BufferGeometry().setFromPoints(pts); return lam*180/Math.PI*111; }
  function overLand(lat,lon){ for(let i=0;i<LAND.length;i+=2){ if(Math.abs(LAND[i]/10-lat)<1.2){ let d=Math.abs(LAND[i+1]/10-lon); if(d>180) d=360-d; if(d<1.2/Math.max(.2,Math.cos(lat*Math.PI/180))) return true; } } return false; }
  // ---- UI: ISS panel ----
  const P=$('issPanel');
  P.innerHTML=`<div class="sec"><h3>International Space Station</h3><div style="margin-top:6px" id="issLive" class="lamp live">Tracking</div>
      <div class="statgrid" style="margin-top:10px">
        <div><div class="lbl">Latitude</div><div class="readout small" id="issLat">—</div></div><div><div class="lbl">Longitude</div><div class="readout small" id="issLon">—</div></div>
        <div><div class="lbl">Altitude</div><div class="readout small" id="issAlt">—</div></div><div><div class="lbl">Speed</div><div class="readout small" id="issSpd">—</div></div></div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:5px"><span id="issSun" class="lamp">—</span><span id="issOver" class="lamp">—</span><span id="issRev" class="lbl"></span></div>
      <div class="switches" style="margin-top:10px"><button id="issFollow">Follow the ISS</button><button id="issTrack" class="on">Ground track</button><button id="issVis" class="on">Who can see it</button></div>
      <p class="note" id="issVisNote"></p></div>
    <div class="sec"><div class="lbl">Clock</div><div class="readout small" id="satClock">—</div>
      <div style="display:flex;gap:4px;margin-top:8px"><button data-sw="1">Live</button><button data-sw="30" class="on">30×</button><button data-sw="200">200×</button></div></div>
    <div class="sec" id="issCrew"></div>
    <div class="sec"><table class="kv">
      <tr><td>Crewed since</td><td>Nov 2, 2000, without a break</td></tr><tr><td>Size</td><td>109 m across, about a football field</td></tr>
      <tr><td>Mass</td><td>about 420 tonnes</td></tr><tr><td>Orbits per day</td><td>about 15.5, one every 93 minutes</td></tr>
      <tr><td>Partners</td><td>NASA, Roscosmos, ESA, JAXA, CSA</td></tr><tr><td>Retirement</td><td>planned around 2030, deorbited by a SpaceX-built vehicle</td></tr></table>
      <p class="note" id="issSrc"></p></div>`;
  const setFollow=on=>{ follow=on; $('issFollow').classList.toggle('on',on); if(on){ followInit=true; } else { controls.minDistance=1.08; } };
  let followInit=false;
  $('issFollow').onclick=()=>setFollow(!follow);
  $('issTrack').onclick=e=>{ showTrack=!showTrack; e.currentTarget.classList.toggle('on',showTrack); };
  $('issVis').onclick=e=>{ showVis=!showVis; e.currentTarget.classList.toggle('on',showVis); };
  P.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{ warp=+b.dataset.sw; if(warp===1) simTime=Date.now(); P.querySelectorAll('[data-sw]').forEach(x=>x.classList.toggle('on',x===b)); lastTrack=-1e12; });
  // ---- UI: constellation list ----
  const L=$('satList'); let selected=null;
  function renderList(){ const blocks=[['private','Private companies'],['state','State-backed (China)']];
    L.innerHTML=blocks.map(([k,t])=>`<h4>${t}</h4>`+CONSTELLATIONS.filter(c=>c.kind===k).map(c=>{ const g=groups[c.id];
      return `<div class="row ${selected===c.id?'sel':''}" data-id="${c.id}"><span style="width:12px;height:12px;margin-top:3px;flex-shrink:0;background:#${c.color.toString(16).padStart(6,'0')};border:1px solid rgba(0,0,0,.4);opacity:${g.on?1:.25}"></span>
        <div class="main"><div class="t2">${c.name}</div><div class="t3">${c.owner}</div></div>
        <div style="text-align:right"><div class="num" style="font-weight:700;font-size:14px">${c.count}</div><button class="tg ${g.on?'on':''}" data-t="${c.id}" style="margin-top:4px;padding:2px 7px;font-size:11px">${g.on?'Shown':'Hidden'}</button></div></div>`; }).join('')).join(''); }
  L.addEventListener('click',e=>{ const t=e.target.closest('[data-t]'); if(t){ e.stopPropagation(); const g=groups[t.dataset.t]; g.on=!g.on; g.pts.visible=g.on; renderList(); return; }
    const r=e.target.closest('.row'); if(r) pick(r.dataset.id); });
  function pick(id){ selected = selected===id? null : id; renderList();
    Object.values(groups).forEach(g=>{ g.pts.material.opacity = !selected||g.c.id===selected ? .95 : .12; g.pts.material.size = g.c.size*260*(g.c.id===selected?1.6:1); });
    const c=CONSTELLATIONS.find(x=>x.id===id), d=$('satCard');
    if(!selected){ d.style.display='none'; return; }
    d.style.display='block';
    d.innerHTML=`<button class="x" id="satX">Close</button><div class="lbl">${c.owner}</div><h2 style="margin-top:2px">${c.name}</h2>
      <div class="meta"><span class="num" style="font-weight:700">${c.count}</span> ${c.countNote}</div>
      <div class="desc">${c.purpose}</div><div class="desc" style="color:var(--ink-2)">${c.facts}</div>
      <table class="kv" style="max-width:520px"><tr><td>Altitude</td><td>${c.alt}</td></tr><tr><td>Inclination</td><td>${c.inc}</td></tr><tr><td>Country</td><td>${c.cc}</td></tr></table>`;
    $('satX').onclick=()=>pick(id); }
  renderList();
  function renderCrew(){ const live=ISS_CREW_LIVE; const people= live? live.people.map(p=>[p.name,[p.agency,p.role&&/commander/i.test(p.role)?'commander':''].filter(Boolean).join(', ')]) : ISS_CREW;
    $('issCrew').innerHTML=`<div class="lbl">${live?'On board now'+(live.expedition?' ('+live.expedition+')':''):'On board (Expedition 75, as of Nov 23 2026)'}</div><div class="crew">${people.map(([n,a])=>`<div>${n} <span>${a}</span></div>`).join('')}</div>
      <p class="note">${live?'Live from Launch Library 2, updated '+ago(live.at)+'.':'Saved list. Live crew data could not be reached from here.'}</p>`; }
  renderCrew();

  // ---------------- SIGNAL PATHS ----------------
  const comm=new THREE.Group(); scene.add(comm);
  const GS={ny:[40.71,-74.0,'New York'],lon:[51.5,-0.12,'London'],la:[34.05,-118.24,'Los Angeles'],tok:[35.68,139.69,'Tokyo'],sp:[-23.55,-46.63,'São Paulo'],jnb:[-26.2,28.05,'Johannesburg'],syd:[-33.87,151.21,'Sydney'],sin:[1.35,103.82,'Singapore']};
  const PAIRS=[['ny','lon'],['la','tok'],['sp','jnb'],['syd','sin']];
  $('cmPair').innerHTML=PAIRS.map(([a,b],i)=>`<option value="${i}">${GS[a][2]} to ${GS[b][2]}</option>`).join('');
  const TDRS=[[-41,'TDRS East'],[-171,'TDRS West'],[85,'TDRS (Indian Ocean)']]; const WSC=[32.5,-106.61], JSC=[29.56,-95.09];
  const ASTRA=19.2, TELEPORT=[49.68,6.35,'Uplink (Luxembourg)'], TVCITIES=[[48.86,2.35,''],[52.52,13.4,'Berlin'],[40.42,-3.7,'Madrid'],[41.9,12.5,''],[52.23,21.01,''],[59.33,18.07,'Stockholm']];
  const GEO_R=1+35786/RE; const C_KMMS=299.792;
  let cm=null, cmPath=[], cmBranches=[], cmAcc=9, cmTags=[], cmFly=null;
  const pktTex=glowTexture('rgba(255,255,255,1)','rgba(255,220,120,.9)','rgba(255,170,60,0)');
  const packets=[]; for(let i=0;i<14;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:pktTex,transparent:true,depthWrite:false,depthTest:false})); s.scale.set(.045,.045,1); s.visible=false; scene.add(s); packets.push({s,u:i/14}); }
  function clearComm(){ comm.clear(); cmTags.forEach(i=>i.el.remove()); labels.items=labels.items.filter(i=>!cmTags.includes(i)); cmTags=[]; packets.forEach(p=>p.s.visible=false); cmPath=[]; cmBranches=[]; }
  function tag(text,pos,cls='small'){ const o=new THREE.Object3D(); o.position.copy(pos); comm.add(o); const it=labels.add(text,o,{cls,hideBehind:true}); cmTags.push(it); return o; }
  function station(lat,lon,name,color=0xffc35a){ const p=ll2v(lat,lon,1.004); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color,transparent:true,depthWrite:false})); s.scale.set(.05,.05,1); s.position.copy(p); comm.add(s); if(name) tag(name,p); return p; }
  function line(pts,color,opacity=.9,dashed=false){ const g=new THREE.BufferGeometry().setFromPoints(pts); const m= dashed? new THREE.LineDashedMaterial({color,dashSize:.03,gapSize:.02,transparent:true,opacity}) : new THREE.LineBasicMaterial({color,transparent:true,opacity}); const l=new THREE.Line(g,m); if(dashed) l.computeLineDistances(); comm.add(l); return l; }
  function arc(a,b,r=1.003,n=48){ const pts=[]; for(let i=0;i<=n;i++){ pts.push(a.clone().normalize().lerp(b.clone().normalize(),i/n).normalize().multiplyScalar(r)); } return pts; }
  const blocked=(a,b)=>{ const d=b.clone().sub(a), L=d.length(); d.divideScalar(L); const t=-a.dot(d); if(t<0||t>L) return false; return a.clone().add(d.multiplyScalar(t)).length()<1.0; };
  const km=v=>v*RE, pathKm=p=>{ let s=0; for(let i=1;i<p.length;i++) s+=p[i].distanceTo(p[i-1]); return km(s); };
  function flyCam(dir,dist,tgt=new THREE.Vector3()){ controls.maxDistance=Math.max(12,dist+4); cmFly={from:camera.position.clone().sub(controls.target),fromT:controls.target.clone(),tgt:tgt.clone(),to:dir.clone().normalize().multiplyScalar(dist),t:0}; setFollow(false); }
  function card(html){ const d=$('satCard'); d.style.display='block'; d.innerHTML=`<button class="x" id="satX">Close</button>`+html; $('satX').onclick=()=>setComm(null); }
  function setComm(m){ cm=m; document.querySelectorAll('[data-cm]').forEach(b=>b.classList.toggle('on',b.dataset.cm===m)); clearComm(); cmAcc=9;
    if(!m){ $('satCard').style.display='none'; controls.maxDistance=12; flyCam(camera.position.clone().sub(controls.target),3.6); return; }
    if(selected) pick(selected);
    if(m==='starlink'){ const [a,b]=PAIRS[+$('cmPair').value]; flyCam(ll2v(GS[a][0],GS[a][1]).add(ll2v(GS[b][0],GS[b][1])),2.6); if(!groups.starlink.on){ groups.starlink.on=true; groups.starlink.pts.visible=true; renderList(); } }
    if(m==='iss'){ flyCam(ll2v(62,-85),17); }
    if(m==='geo'){ flyCam(ll2v(38,92),14,ll2v(0,ASTRA,GEO_R*.42)); } }
  document.querySelectorAll('[data-cm]').forEach(b=>b.onclick=()=>setComm(cm===b.dataset.cm?null:b.dataset.cm));
  $('cmPair').onchange=()=>{ if(cm==='starlink') setComm('starlink'); };
  function routeStarlink(){ const [ka,kb]=PAIRS[+$('cmPair').value]; const A=ll2v(GS[ka][0],GS[ka][1],1.004), B=ll2v(GS[kb][0],GS[kb][1],1.004);
    const arr=groups.starlink.pts.geometry.attributes.position.array, n=arr.length/3, P=i=>new THREE.Vector3(arr[i*3],arr[i*3+1],arr[i*3+2]);
    const visFrom=(g,s)=>s.clone().sub(g).normalize().dot(g.clone().normalize())>Math.sin(25*Math.PI/180);
    let best=-1,bd=9; for(let i=0;i<n;i++){ const s=P(i); if(!visFrom(A,s)) continue; const d=s.distanceTo(A); if(d<bd){bd=d;best=i;} } if(best<0) return null;
    const hops=[P(best)]; let cur=P(best);
    for(let k=0;k<30;k++){ if(visFrom(B,cur)) break; let nb=-1, nd=cur.distanceTo(B)-.02;
      for(let i=0;i<n;i++){ const s=P(i); const l=s.distanceTo(cur); if(l>.42||l<.02||blocked(cur,s)) continue; const d=s.distanceTo(B); if(d<nd){ nd=d; nb=i; } }
      if(nb<0) break; cur=P(nb); hops.push(cur); }
    return {A,B,hops,names:[GS[ka][2],GS[kb][2]]}; }
  function buildComm(){ clearComm();
    if(cm==='starlink'){ const r=routeStarlink(); if(!r) return; const [ka,kb]=PAIRS[+$('cmPair').value]; station(GS[ka][0],GS[ka][1],r.names[0]); station(GS[kb][0],GS[kb][1],r.names[1]);
      line([r.A,r.hops[0]],0xffc35a); line(r.hops,0xff5a8a,1); line([r.hops[r.hops.length-1],r.B],0xffc35a);
      r.hops.forEach(h=>{ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xff8ab0,transparent:true,depthWrite:false})); s.scale.set(.035,.035,1); s.position.copy(h); comm.add(s); });
      line(arc(r.A,r.B,1.002),0x9fb6d4,.6,true);
      cmPath=[r.A,...r.hops,r.B]; const space=pathKm(cmPath), ms=space/C_KMMS, gc=km(r.A.angleTo(r.B)), fiber=gc*1.3/(C_KMMS/1.47);
      card(`<div class="lbl">Starlink, ${r.names[0]} to ${r.names[1]}</div><h2 style="margin-top:2px">Internet relayed by laser between satellites</h2>
        <div class="desc">Your dish talks to the nearest satellite overhead. That satellite passes the data along to its neighbours with infrared lasers (invisible in real life, drawn pink here), hop by hop, until a satellite above the destination beams it down. Light moves about 47% faster in vacuum than in glass fiber, so over long distances space can beat undersea cables.</div>
        <div class="lat"><div><div class="lbl">Laser hops</div><div class="readout">${r.hops.length-1}</div></div><div><div class="lbl">Through space</div><div class="readout">${ms.toFixed(1)} ms</div></div><div><div class="lbl">Same trip by fiber</div><div class="readout amber">${fiber.toFixed(1)} ms</div></div></div>
        <p class="note">One-way light travel time only; routers and processing add a few milliseconds. The route is recomputed as the satellites move. Fiber estimate assumes the cable runs 30% longer than the straight line.</p>`); }
    if(cm==='iss'&&state){ const I=ll2v(state.lat,state.lon,1+state.h/RE); const W=station(WSC[0],WSC[1],'White Sands ground station'), J=station(JSC[0],JSC[1],'Mission Control, Houston');
      line(arc(W,J,1.003),0xffc35a,.9,true);
      const sats=TDRS.map(([lon,n])=>({p:ll2v(0,lon,GEO_R),n})); sats.forEach(s=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x9ff0b0,transparent:true,depthWrite:false})); sp.scale.set(.25,.25,1); sp.position.copy(s.p); comm.add(sp); tag(s.n,s.p); });
      const ok=sats.filter(s=>!blocked(I,s.p)&&!blocked(W,s.p)).sort((a,b)=>a.p.distanceTo(I)-b.p.distanceTo(I))[0];
      if(ok){ line([I,ok.p],0xff5a46); line([ok.p,W],0xffc35a); cmPath=[I,ok.p,W,...arc(W,J,1.003,12)]; }
      const d = ok? km(I.distanceTo(ok.p))+km(ok.p.distanceTo(W)) : 0;
      card(`<div class="lbl">ISS communications</div><h2 style="margin-top:2px">Calling Houston through a relay 36,000 km up</h2>
        <div class="desc">The station is usually out of sight of any NASA ground antenna, so it talks through Tracking and Data Relay Satellites (TDRS) parked in geostationary orbit. The signal climbs from the ISS to a TDRS, drops to the White Sands complex in New Mexico, then travels by ground link to Mission Control in Houston.</div>
        <div class="lat"><div><div class="lbl">Relay in use</div><div class="readout small" style="font-size:13px">${ok?ok.n:'None in view'}</div></div><div><div class="lbl">Radio path</div><div class="readout">${ok?Math.round(d).toLocaleString()+' km':'—'}</div></div><div><div class="lbl">One-way delay</div><div class="readout amber">${ok?Math.round(d/C_KMMS)+' ms':'—'}</div></div></div>
        <p class="note">${ok?'That delay is why there is a short pause in every space-to-ground conversation.':'Right now no relay can see both the ISS and White Sands, a gap engineers call the zone of exclusion. Coverage returns within minutes.'} The TDRS positions are approximate.</p>`); }
    if(cm==='geo'){ const S=ll2v(0,ASTRA,GEO_R); const U=station(TELEPORT[0],TELEPORT[1],TELEPORT[2],0xff5a46);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x9ff0b0,transparent:true,depthWrite:false})); sp.scale.set(.3,.3,1); sp.position.copy(S); comm.add(sp); tag('Astra 19.2°E (geostationary)',S);
      // footprint beam
      const fc=ll2v(50,12,1.002), ring=[]; for(let i=0;i<=64;i++){ const t=i/64*Math.PI*2; ring.push(ll2v(50+15*Math.sin(t),12+24*Math.cos(t),1.003)); } line(ring,0x9ff0b0,.8);
      const cone=new THREE.BufferGeometry(); const vs=[]; for(let i=0;i<64;i++){ vs.push(S.x,S.y,S.z, ring[i].x,ring[i].y,ring[i].z, ring[i+1].x,ring[i+1].y,ring[i+1].z); } cone.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));
      comm.add(new THREE.Mesh(cone,new THREE.MeshBasicMaterial({color:0x9ff0b0,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false})));
      line([U,S],0xff5a46); cmBranches=TVCITIES.map(([la,lo,n])=>{ const p=station(la,lo,n,0x9ff0b0); return [U,S,p]; }); cmPath=cmBranches[0];
      const d=km(U.distanceTo(S))+km(S.distanceTo(cmBranches[0][2]));
      card(`<div class="lbl">Geostationary broadcast</div><h2 style="margin-top:2px">One satellite, a whole continent of dishes</h2>
        <div class="desc">A broadcaster beams channels up to a satellite hanging over the equator at 35,786 km. Because it circles Earth once a day, it seems to stand still, so millions of home dishes can point at it permanently. Its antenna spreads the signal over a footprint covering most of Europe.</div>
        <div class="lat"><div><div class="lbl">Path, up and down</div><div class="readout">${Math.round(d).toLocaleString()} km</div></div><div><div class="lbl">Delay</div><div class="readout amber">${Math.round(d/C_KMMS)} ms</div></div><div><div class="lbl">Orbit period</div><div class="readout">23 h 56 min</div></div></div>
        <p class="note">That quarter-second delay is why live satellite TV lags behind the stream on cable, and why gamers avoid geostationary internet.</p>`); }
  }
  function along(path,u){ let L=0; const seg=[]; for(let i=1;i<path.length;i++){ const l=path[i].distanceTo(path[i-1]); seg.push(l); L+=l; } let d=u*L;
    for(let i=0;i<seg.length;i++){ if(d<=seg[i]) return path[i].clone().lerp(path[i+1],d/seg[i]); d-=seg[i]; } return path[path.length-1].clone(); }
  function commUpdate(dt){ if(cmFly){ cmFly.t=Math.min(1,cmFly.t+dt*.8); const e=1-Math.pow(1-cmFly.t,3); const len=lerp(cmFly.from.length(),cmFly.to.length(),e);
      const tg=cmFly.fromT.clone().lerp(cmFly.tgt,e); controls.target.copy(tg); camera.position.copy(cmFly.from.clone().normalize().lerp(cmFly.to.clone().normalize(),e).normalize().multiplyScalar(len)).add(tg); if(cmFly.t>=1) cmFly=null; }
    if(!cm) return; cmAcc+=dt; if(cmAcc>(cm==='starlink'?1.2:3)){ cmAcc=0; buildComm(); }
    packets.forEach((p,i)=>{ const path = cmBranches.length? cmBranches[i%cmBranches.length] : cmPath; if(!path||path.length<2){ p.s.visible=false; return; }
      p.u=(p.u+dt*(cm==='starlink'?.22:.12))%1; p.s.visible=true; p.s.position.copy(along(path,p.u)); const sc=camera.position.length()>6? .16:.045; p.s.scale.set(sc,sc,1); }); }
  controls.addEventListener('start',()=>{ if(follow) userOrbit=true; cmFly=null; });
  let userOrbit=false, uiAcc=1, prevIss=null;
  const tmp=new THREE.Vector3();
  return { scene,camera,labels,
    show(arg){ controls.enabled=true; if(!earth.material.map){ earth.material.map=earthTexture(); earth.material.needsUpdate=true; }
      if(arg==='iss') setFollow(true); },
    hide(){ controls.enabled=false; labels.hide(); },
    update(dt){
      simTime += dt*1000*warp; if(warp===1) simTime=Date.now();
      const sd=sunDir(simTime); sunLight.position.copy(sd.v).multiplyScalar(10);
      // constellation motion
      const tsec=(simTime-SNAP_T0)/1000;
      Object.values(groups).forEach(g=>{ if(!g.on) return; const a=g.pts.geometry.attributes.position.array; g.meta.forEach((m,i)=>{ orbitPos(m,m.ph+tsec*m.w,tmp); a[i*3]=tmp.x; a[i*3+1]=tmp.y; a[i*3+2]=tmp.z; }); g.pts.geometry.attributes.position.needsUpdate=true; });
      orbitPos(tg,tg.ph+tsec*tg.w,tgSpr.position);
      // ISS
      state=issAt(new Date(simTime));
      if(state){ const p=ll2v(state.lat,state.lon,1+state.h/RE); const next=issAt(new Date(simTime+20000)); const pn=ll2v(next.lat,next.lon,1+next.h/RE);
        iss.position.copy(p); issDot.position.copy(p);
        const up=p.clone().normalize(), fwd=pn.clone().sub(p).normalize(), side=new THREE.Vector3().crossVectors(up,fwd).normalize(); fwd.crossVectors(side,up);
        iss.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,up,fwd));
        iss.userData.arrays.forEach(a=>a.rotation.x+=dt*.05*Math.min(warp,30));
        const camD=camera.position.distanceTo(p); issDot.visible = camD>.6; iss.visible = camD<1.6;
        if(Math.abs(simTime-lastTrack)>20000*Math.max(1,warp/30)) rebuildTrack();
        trackPast.visible=trackNext.visible=orbitLine.visible=showTrack; vis.visible=showVis;
        if(follow){ if(followInit){ followInit=false; userOrbit=false; controls.minDistance=.02; camera.position.copy(p.clone().add(up.clone().multiplyScalar(.05)).add(fwd.clone().multiplyScalar(-.12)).add(side.clone().multiplyScalar(.05))); controls.target.copy(p); }
          else { const delta=p.clone().sub(controls.target); controls.target.add(delta); camera.position.add(delta); } }
        // readouts
        uiAcc+=dt; if(uiAcc>.2){ uiAcc=0; const ns=(v,a,b)=>Math.abs(v).toFixed(2)+'° '+(v>=0?a:b);
          $('issLat').textContent=ns(state.lat,'N','S'); $('issLon').textContent=ns(state.lon,'E','W');
          $('issAlt').textContent=state.h.toFixed(1)+' km'; $('issSpd').textContent=Math.round(state.speed*3600).toLocaleString()+' km/h';
          const u=p.clone(), sdot=u.dot(sd.v); const shadow = sdot<0 && u.clone().sub(sd.v.clone().multiplyScalar(sdot)).length()<1;
          const S=$('issSun'); S.className='lamp '+(shadow?'':'amber'); S.textContent= shadow?'In Earth’s shadow (orbital night)':'In sunlight';
          const O=$('issOver'); const land=overLand(state.lat,state.lon); O.className='lamp '+(land?'go':'blue'); O.textContent= land?'Over land':'Over ocean';
          const revEpoch=+ISS_TLE[1].slice(63,68); const revs=revEpoch+Math.floor((simTime-ISS_EPOCH)/(864e5/15.4955));
          $('issRev').textContent=`Orbit number ${revs.toLocaleString()} since launch in 1998`;
          const km=visCircle(state.lat,state.lon,state.h); $('issVisNote').textContent=`Anyone within about ${Math.round(km).toLocaleString()} km of the point below it can see the station above 10° elevation, when the sky is dark and the ISS is sunlit.`;
          const live=warp===1; const lv=$('issLive'); lv.className='lamp '+(live?'live':'amber'); lv.textContent= live?'Live position':`Fast-forward ${warp}×`;
          $('satClock').textContent=new Date(simTime).toISOString().slice(0,19).replace('T',' ')+' UTC';
          $('issSrc').textContent=`Position computed with SGP4 from ${ISS_TLE_LIVE?'a fresh':'a saved'} NORAD element set (epoch ${ISS_EPOCH.toISOString().slice(0,16).replace('T',' ')} UTC). The ISS model is drawn about 5,700 times larger than life so you can see it.`; } }
      else { $('issLive').textContent='Tracking unavailable'; }
      commUpdate(dt); controls.update(); }, renderCrew, renderList };
})();
const SNAP_T0=Date.UTC(2026,10,22);
