// ================= CORE =================
const $ = id => document.getElementById(id);
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
const VIEWS = {}; let current = null;
const clock = new THREE.Clock();

function ll2v(lat, lon, r=1){ const phi=(90-lat)*Math.PI/180, th=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)); }
function flag(cc){ return cc? `<span class="cc">${cc.slice(0,2).toUpperCase()}</span>`:''; }
function fmtCd(ms){ const neg=ms<0; ms=Math.abs(ms); const d=Math.floor(ms/864e5), h=Math.floor(ms/36e5)%24, m=Math.floor(ms/6e4)%60, s=Math.floor(ms/1e3)%60;
  const p=n=>String(n).padStart(2,'0'); return (neg?'T+ ':'T− ')+(d?d+'d ':'')+p(h)+':'+p(m)+':'+p(s); }
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const lerp=(a,b,t)=>a+(b-a)*t;
function glowTexture(inner='rgba(255,255,255,1)',mid='rgba(255,160,90,.9)',outer='rgba(255,122,47,0)'){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,inner); g.addColorStop(.3,mid); g.addColorStop(1,outer); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); }
const GLOW = glowTexture();
function starField(n=3000, rMin=400, rMax=800, size=1.2){ const g=new THREE.BufferGeometry(), a=new Float32Array(n*3), col=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const v=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize().multiplyScalar(rMin+Math.random()*(rMax-rMin)); a.set([v.x,v.y,v.z],i*3);
    const t=Math.random(); col.set(t<.1?[1,.85,.7]:t<.2?[.75,.85,1]:[1,1,1],i*3); }
  g.setAttribute('position',new THREE.BufferAttribute(a,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  return new THREE.Points(g,new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85,depthWrite:false})); }

// Earth texture painted from land-dot data (used in launch view & solar view)
let EARTH_TEX=null;
function earthTexture(){ if(EARTH_TEX) return EARTH_TEX;
  const W=2048,H=1024,c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1b3f6e'); g.addColorStop(.5,'#1d5ea8'); g.addColorStop(1,'#1b3f6e'); x.fillStyle=g; x.fillRect(0,0,W,H);
  const l=document.createElement('canvas'); l.width=W; l.height=H; const lx=l.getContext('2d');
  for(let i=0;i<LAND.length;i+=2){ const lat=LAND[i]/10, lon=LAND[i+1]/10; const px=(lon+180)/360*W, py=(90-lat)/180*H;
    const al=Math.abs(lat); let col = al>62?'#e8eef2': al<12?'#3f7d3a': al<35?(Math.random()<.5?'#b99a62':'#8c8a4e'):'#4e7a3e';
    lx.fillStyle=col; lx.beginPath(); lx.arc(px,py,7.5,0,6.283); lx.fill(); }
  x.filter='blur(3px)'; x.drawImage(l,0,0); x.filter='none';
  for(let i=0;i<9000;i++){ x.fillStyle=`rgba(0,0,0,${Math.random()*.05})`; x.fillRect(Math.random()*W,Math.random()*H,3,3); }
  EARTH_TEX=new THREE.CanvasTexture(c); EARTH_TEX.encoding=THREE.sRGBEncoding; EARTH_TEX.anisotropy=8; return EARTH_TEX; }
let CLOUD_TEX=null;
function cloudTexture(){ if(CLOUD_TEX) return CLOUD_TEX; const W=1024,H=512,c0=document.createElement('canvas'); c0.width=W; c0.height=H; const x=c0.getContext('2d');
  for(let i=0;i<650;i++){ const px=Math.random()*W, py=H*(.15+.7*Math.random()); const r=3+Math.random()*16; x.fillStyle=`rgba(255,255,255,${.05+Math.random()*.16})`; x.beginPath(); x.ellipse(px,py,r*2.2,r,0,0,6.283); x.fill(); }
  const c=document.createElement('canvas'); c.width=W; c.height=H; const cx=c.getContext('2d'); cx.filter='blur(6px)'; cx.drawImage(c0,0,0);
  CLOUD_TEX=new THREE.CanvasTexture(c); return CLOUD_TEX; }
function atmosphere(radius, color=[.35,.6,1], power=3, strength=1){ return new THREE.Mesh(new THREE.SphereGeometry(radius,64,64), new THREE.ShaderMaterial({
  transparent:true, side:THREE.BackSide, depthWrite:false, blending:THREE.AdditiveBlending,
  uniforms:{c:{value:new THREE.Vector3(...color)},p:{value:power},s:{value:strength}},
  vertexShader:'#include <common>\n#include <logdepthbuf_pars_vertex>\nvarying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;\n#include <logdepthbuf_vertex>\n}',
  fragmentShader:'#include <logdepthbuf_pars_fragment>\nuniform vec3 c;uniform float p;uniform float s;varying vec3 vN;varying vec3 vV;void main(){\n#include <logdepthbuf_fragment>\nfloat i=pow(clamp(1.0-abs(dot(vN,vV))*1.0,0.,1.),p)*s;gl_FragColor=vec4(c*i,i);}'
})); }

// --------- HTML labels projected from 3D ---------
const labelLayer = $('labels');
class Labels { constructor(){ this.items=[]; }
  add(text, obj, opts={}){ const el=document.createElement('div'); el.className='tag '+(opts.cls||''); el.innerHTML=text; labelLayer.appendChild(el);
    const it={el,obj,off:opts.off||new THREE.Vector3(),onClick:opts.onClick,hideBehind:opts.hideBehind,center:opts.center,prio:opts.prio==null?1e9:opts.prio}; if(opts.onClick) el.addEventListener('click',e=>{e.stopPropagation();opts.onClick();}); el.style.display='none'; this.items.push(it); return it; }
  clear(){ this.items.forEach(i=>i.el.remove()); this.items=[]; }
  hide(){ this.items.forEach(i=>i.el.style.display='none'); }
  update(camera){ const v=new THREE.Vector3(), cp=camera.position, shown=[];
    for(const it of this.items){ if(it.obj.visible===false||(it.visible===false)){ it.el.style.display='none'; continue; }
      it.obj.getWorldPosition(v); v.add(it.off);
      if(it.hideBehind){ const c=it.center||new THREE.Vector3(); const n=v.clone().sub(c).normalize(); const toCam=cp.clone().sub(v).normalize(); if(n.dot(toCam)<0.05){ it.el.style.display='none'; continue; } }
      v.project(camera); if(v.z>1||v.z<-1){ it.el.style.display='none'; continue; }
      it.sx=(v.x+1)/2*innerWidth; it.sy=(1-v.y)/2*innerHeight; it.show=true; shown.push(it); }
    // Declutter: higher-priority labels win; a label that would overlap one already placed is hidden.
    shown.sort((a,b)=>b.prio-a.prio); const placed=[];
    for(const it of shown){ if(it.el.style.display==='none'){ it.el.style.display='block'; }
      it.el.style.left=it.sx+'px'; it.el.style.top=it.sy+'px';
      if(it.w==null||it.wText!==it.el.textContent){ it.w=it.el.offsetWidth||40; it.h=it.el.offsetHeight||14; it.wText=it.el.textContent; }
      if(it.prio>=1e9){ placed.push([it.sx-it.w/2,it.sy-it.h*1.4,it.w,it.h]); continue; }
      const r=[it.sx-it.w/2-3,it.sy-it.h/2-2,it.w+6,it.h+4];
      if(placed.some(q=>r[0]<q[0]+q[2]&&r[0]+r[2]>q[0]&&r[1]<q[1]+q[3]&&r[1]+r[3]>q[1])){ it.el.style.display='none'; continue; }
      placed.push(r); } } }

// --------- data loading ---------
function fromApi(r){ const p=r.pad||{}, loc=p.location||{}; const parts=(r.name||'').split(' | ');
  return { rocket:parts[0]||'Rocket', mission:parts.slice(1).join(' | ')||'Unknown', net:r.net, status:r.status?.abbrev||'TBD',
    provider:r.launch_service_provider?.name||'', pad:p.name||'', lat:+p.latitude, lon:+p.longitude, site:loc.name||'',
    cc:p.country?.alpha_2_code||loc.country_code||'', orbit:r.mission?.orbit?.abbrev||'', desc:r.mission?.description||'' }; }
async function tryFetch(url){ const ctl=new AbortController(); setTimeout(()=>ctl.abort(),6000); const res=await fetch(url,{signal:ctl.signal}); if(!res.ok) throw 0; const j=await res.json(); return j.results.map(fromApi).filter(x=>isFinite(x.lat)); }
let DATA={up:[],past:[],hist:HISTORIC.map(h=>Object.assign({},h,{kind:'hist'}))};
// Launch data: our own API (on the deployed site) → Launch Library 2 directly → saved snapshot, in that order.
const LIVE={launches:null, iss:null, sats:null};
async function getJSON(url,ms=8000){ const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),ms); try{ const r=await fetch(url,{signal:ctl.signal,cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); } finally{ clearTimeout(tm); } }
const fresh=l=>Array.isArray(l)&&l.some(x=>isFinite(x.lat));
const LIVE_SITE='https://space-atlas-blond.vercel.app';
async function loadData(){ let got=null;
  try{ const j=await getJSON('/api/launches',20000); if(fresh(j.up)) got={up:j.up.filter(x=>isFinite(x.lat)),past:(j.past||[]).filter(x=>isFinite(x.lat)),at:j.fetchedAt}; }catch(e){}
  if(!got){ try{ const [u,p]=await Promise.all([tryFetch(API_UP),tryFetch(API_PAST)]); got={up:u,past:p,at:new Date().toISOString()}; }catch(e){} }
  if(got){ DATA.up=got.up; DATA.past=got.past; LIVE.launches=got.at; }
  else if(!LIVE.launches){ DATA.up=UPCOMING; DATA.past=PAST; }
  DATA.up.forEach(l=>l.kind='up'); DATA.past.forEach(l=>l.kind='past'); renderSource(); }
function ago(iso){ const m=Math.round((Date.now()-Date.parse(iso))/6e4); return m<1?'just now': m<60? m+' min ago' : Math.round(m/60)+' h ago'; }
function renderSource(){ const s=$('src'), live=!!LIVE.launches; s.className='lamp '+(live?'go':'amber');
  $('srcText').textContent = live? 'Live, updated '+ago(LIVE.launches) : 'Saved data from '+new Date(SNAPSHOT_DATE).toLocaleDateString(undefined,{month:'short',day:'numeric'})+', retrying';
  s.title = live? 'Launch data from The Space Devs Launch Library 2, refreshed every 10 minutes.' : 'Live data could not be reached from here, so this shows launch data saved on '+new Date(SNAPSHOT_DATE).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+'.'; }

// --------- view switching ---------
function show(name, arg){
  if(name==='learn'){ openLearn(); return; }
  if(current && VIEWS[current].hide) VIEWS[current].hide();
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('act', v.id==='v-'+name));
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('act', b.dataset.v===name));
  current=name; VIEWS[name].show(arg);
}
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.v)));
$('learnX').onclick=()=>closeLearn();
$('learn').addEventListener('click',e=>{ if(e.target.id==='learn') closeLearn(); });
$('gloss').innerHTML = GLOSSARY.map(([k,v])=>`<dl><dt>${k}</dt><dd>${v}</dd></dl>`).join('');

addEventListener('resize',()=>{ renderer.setSize(innerWidth,innerHeight); Object.values(VIEWS).forEach(v=>{ if(v.camera){ v.camera.aspect=innerWidth/innerHeight; v.camera.updateProjectionMatrix(); } }); });
function pointer(e){ return new THREE.Vector2(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); }
const tip=$('tip');
function showTip(e,html){ tip.style.display='block'; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY+14)+'px'; tip.innerHTML=html; }
function hideTip(){ tip.style.display='none'; }

function loop(){ requestAnimationFrame(loop); if(introOpen) return; const dt=Math.min(clock.getDelta(),.05);
  if(current){ const v=VIEWS[current]; v.update(dt); renderer.render(v.scene,v.camera); v.labels&&v.labels.update(v.camera); } }
