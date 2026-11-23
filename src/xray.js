// ================= X-RAY: propellant tanks inside each rocket =================
const PROP = {
  lox:{c:0x7fd3ff,n:'Liquid oxygen, −183 °C'}, rp1:{c:0xe8b257,n:'RP-1 kerosene'}, ch4:{c:0x6fe0b8,n:'Liquid methane, −162 °C'},
  lh2:{c:0xb9a8ff,n:'Liquid hydrogen, −253 °C'}, n2o4:{c:0xc8553d,n:'Nitrogen tetroxide (oxidizer)'}, udmh:{c:0xe8d26a,n:'UDMH (hypergolic fuel)'},
  solid:{c:0x8a6f55,n:'Solid propellant'} };
// fuel per stage: s1, s2, boosters
const XRAY = { falcon9:['rp1','rp1'], falconheavy:['rp1','rp1','rp1'], starship:['ch4','ch4'], electron:['rp1','rp1'], vulcan:['ch4','lh2','solid'],
  newglenn:['ch4','lh2'], sls:['lh2','lh2','solid'], ariane6:['lh2','lh2','solid'], soyuz:['rp1','rp1','rp1'], lm5:['lh2','lh2','rp1'],
  lm2f:['hyp','hyp','hyp'], lm2d:['hyp','hyp'], pslv:['solid','hyp','solid'], lvm3:['hyp','lh2','solid'], h3:['lh2','lh2','solid'], saturnv:['rp1','lh2'], generic:['rp1','rp1'] };
const XRAY_SKIN = new THREE.MeshStandardMaterial({color:0xcfe6ff,transparent:true,opacity:.13,depthWrite:false,roughness:.3,metalness:.1,side:THREE.DoubleSide});
function flowTexture(){ const c=document.createElement('canvas'); c.width=8; c.height=64; const x=c.getContext('2d'); x.fillStyle='#3a4148'; x.fillRect(0,0,8,64);
  x.fillStyle='#ffffff'; for(let y=0;y<64;y+=16) x.fillRect(0,y,8,6); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }

function buildXray(rocket, labelsApi){
  const U=rocket.userData, key=U.key, fu=XRAY[key]||XRAY.generic; const tanks=[], flows=[], skins=[], added=[], tags=[];
  rocket.traverse(o=>{ if(o.isMesh && o.material!==MAT.bell && o.material!==MAT.engine) skins.push(o); });
  const liquid=(c)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.35,roughness:.4,transparent:true,opacity:.92});
  function tank(parent, r, y0, h, prop){ const g=new THREE.Group(); g.position.y=y0; parent.add(g); added.push(g);
    const shell=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32,1,true),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.08})); shell.position.y=h/2; g.add(shell);
    const liq=new THREE.Mesh(new THREE.CylinderGeometry(r*.97,r*.97,1,32),liquid(PROP[prop].c)); liq.position.y=.5; g.add(liq);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(r*.97,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),liquid(PROP[prop].c)); dome.scale.y=.35; g.add(dome);
    const t={g,liq,h,prop,fill:0,target:.94,phase:Math.random()*6}; tanks.push(t);
    const a=new THREE.Object3D(); a.position.set(r*1.05,h*.5,0); g.add(a); tags.push({text:PROP[prop].n,obj:a}); return t; }
  function stageTanks(stageNo, prop){ // the longest non-dark cylinder in this stage gets the tanks
    const cands=U.partMeshes.filter(m=>m.part.stage===stageNo && m.part.c!=='dark' && m.part.h>U.coreR*1.5); if(!cands.length) return;
    const pm=cands.reduce((a,b)=>a.part.h>b.part.h?a:b); const r=Math.min(pm.part.r,pm.part.r2||pm.part.r)*.9, y0=pm.y0+pm.part.h*.04, H=pm.part.h*.92, parent=U.stages[stageNo];
    if(prop==='solid'){ const s=tank(parent,r,y0,H,'solid'); return; }
    let ox='lox', fuel=prop, oxShare = prop==='lh2'? .36 : prop==='ch4'? .55 : .6;
    if(prop==='hyp'){ ox='n2o4'; fuel='udmh'; oxShare=.55; }
    const hF=H*(1-oxShare)-H*.03, hO=H*oxShare-H*.03; tank(parent,r,y0,hF,fuel); tank(parent,r,y0+hF+H*.06,hO,ox);
    // downcomer: oxidizer line running through the fuel tank to the engines
    const pipe=new THREE.Mesh(new THREE.CylinderGeometry(r*.09,r*.09,y0+hF+H*.03,10),new THREE.MeshBasicMaterial({map:flowTexture()}));
    pipe.position.y=(y0+hF+H*.03)/2; parent.add(pipe); added.push(pipe); pipe.material.map.repeat.set(1,(y0+hF)/r*1.2); flows.push(pipe); }
  stageTanks(1,fu[0]); stageTanks(2,fu[1]);
  if(fu[2]) U.boosters.forEach((b,i)=>{ const r=b.userData.r*.85, H=b.userData.h*.9;
    if(fu[2]==='solid'){ tank(b,r,b.userData.h*.05,H,'solid'); }
    else { const pr=fu[2]==='hyp'?['udmh','n2o4']:['rp1','lox']; tank(b,r,b.userData.h*.05,H*.42,pr[0]); tank(b,r,b.userData.h*.05+H*.47,H*.5,pr[1]); }
    if(i>0) tags.splice(-(fu[2]==='solid'?1:2)); });
  const origs=new Map(); added.forEach(g=>g.visible=false);
  let on=false, labelItems=[];
  return {
    set(v){ on=v; skins.forEach(m=>{ if(v){ if(!origs.has(m)) origs.set(m,m.material); m.material=XRAY_SKIN; } else if(origs.has(m)) m.material=origs.get(m); });
      added.forEach(g=>g.visible=v); tanks.forEach(t=>{ t.fill=0; });
      labelItems.forEach(i=>i.el.remove()); labelsApi.items=labelsApi.items.filter(i=>!labelItems.includes(i)); labelItems=[];
      if(v) labelItems=tags.map(tg=>{ const it=labelsApi.add(tg.text,tg.obj,{cls:'part'}); it.xr=true; return it; }); },
    update(dt,time){ if(!on) return; tanks.forEach((t,i)=>{ t.fill= t.prop==='solid'? t.target : Math.min(t.target, t.fill+dt*.22); const slosh= t.prop==='solid'?0: Math.sin(time*2.1+t.phase)*.006;
        const hh=Math.max(.001,t.h*(t.fill+slosh)); t.liq.scale.y=hh; t.liq.position.y=hh/2; });
      flows.forEach(p=>{ p.material.map.offset.y-=dt*1.5; }); },
    get on(){ return on; } };
}
