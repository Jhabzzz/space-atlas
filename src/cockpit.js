// ================= COCKPIT + VEHICLE SYSTEMS + SOUND =================
const Cockpit = (()=>{
  const NS='http://www.w3.org/2000/svg';
  let info=null, spec=null, annun=[], lastAnn='';
  const ANN=[['ign','IGNITION'],['lift','LIFTOFF'],['maxq','MAX-Q'],['bsep','BOOSTER SEP'],['meco','MECO'],['ses','STAGE 2'],['fair','FAIRING SEP'],['seco','SECO']];
  // ---- engine grid (shared by the HUD panel and the cockpit) ----
  function engineSVG(){ const pts=info.enginePts, R=info.coreR*.9; const bell=(spec.eng&&spec.eng.bell)||.4;
    const r=Math.max(.05,Math.min(.22,bell/R*.75)); let s=`<svg viewBox="-1.25 -1.25 2.5 2.5" class="eng"><circle r="1.08" class="ring"/>`;
    pts.forEach((p,i)=>{ s+=`<circle cx="${(p.x/R).toFixed(3)}" cy="${(p.z/R).toFixed(3)}" r="${r.toFixed(3)}" class="e s1" />`; });
    const nb=info.boosters.length; for(let i=0;i<nb;i++){ const a=info.boosters[i].userData.ang; s+=`<circle cx="${(Math.cos(a)*1.2).toFixed(3)}" cy="${(Math.sin(a)*1.2).toFixed(3)}" r=".1" class="e b" />`; }
    return s+`</svg>`; }
  function bar(id,label){ return `<div class="pbar"><span>${label}</span><div><i id="${id}"></i></div><b id="${id}v" class="num">100%</b></div>`; }
  function propNames(){ const f=(spec.fuel||'').toLowerCase(); const s1 = f.startsWith('liquid methane')||f.includes('methane')?'CH4': f.includes('hydrogen')&&!f.includes('rp-1')&&!f.includes('kerosene')&&!f.startsWith('solid')?'LH2': f.includes('hypergolic')?'UDMH': f.includes('solid')?'SOLID':'RP-1';
    return s1; }
  function setup(_info,_spec){ info=_info; spec=_spec; const fuel=propNames();
    $('lSys').innerHTML=`<div class="lbl">Vehicle systems</div>
      <div class="sysgrid"><div><div class="sublbl">Stage 1 engines</div>${engineSVG()}<div class="sublbl" id="sysEng">${spec.eng?spec.eng.n:1} engines, off</div></div>
      <div>${bar('p1o','S1 LOX')}${bar('p1f','S1 '+fuel)}${bar('p2o','S2 LOX')}${bar('p2f','S2 '+(fuel==='SOLID'?'LH2':fuel))}
      <div class="sublbl" style="margin-top:6px">Throttle</div><div class="readout small" id="sysThr" style="font-size:14px;padding:4px 6px">0%</div></div></div>`;
    $('ckEng').innerHTML=engineSVG(); $('ckEngTitle').textContent=`${spec.name.toUpperCase()} · STAGE 1`;
    $('ckAnn').innerHTML=ANN.filter(([k])=>k!=='bsep'||spec.boosters).filter(([k])=>k!=='fair'||_info.fairingHalves.length).map(([k,n])=>`<div class="ann" data-k="${k}">${n}</div>`).join('');
    annun=[...document.querySelectorAll('#ckAnn .ann')];
    $('ckProp').innerHTML=bar('cp1o','S1 LOX')+bar('cp1f','S1 '+fuel)+bar('cp2o','S2 LOX')+bar('cp2f','S2 '+(fuel==='SOLID'?'LH2':fuel)); }
  // ---- attitude indicator ----
  function adi(pitchDeg, rollDeg){ const g=$('adiRot'); if(!g) return; const k=2.2; g.setAttribute('transform',`rotate(${-rollDeg}) translate(0 ${pitchDeg*k})`); }
  (function buildADI(){ let ladder=''; for(let d=-90;d<=90;d+=10){ if(!d) continue; const y=-d*2.2, w=d%30?16:28; ladder+=`<line x1="${-w}" y1="${y}" x2="${w}" y2="${y}"/><text x="${w+5}" y="${y+3}">${Math.abs(d)}</text>`; }
    $('ckAdi').innerHTML=`<svg viewBox="-80 -80 160 160"><defs><clipPath id="adiClip"><circle r="72"/></clipPath></defs>
      <g clip-path="url(#adiClip)"><g id="adiRot"><rect x="-300" y="-500" width="600" height="500" fill="#2f6fa8"/><rect x="-300" y="0" width="600" height="500" fill="#6b4a2a"/>
      <line x1="-300" y1="0" x2="300" y2="0" stroke="#fff" stroke-width="1.5"/><g class="ladder">${ladder}</g></g></g>
      <circle r="72" fill="none" stroke="#000" stroke-width="3"/><path d="M-40 0h22l6 8 6-8h22" fill="none" stroke="#f2a516" stroke-width="3.5"/><circle r="2.5" fill="#f2a516"/>
      <path d="M0 -76 l-5 -8 h10z" fill="#f2a516"/></svg>`; })();
  function tape(id, v, step, fmt){ const el=$(id); if(!el) return; const px=26/step; let s=''; const base=Math.floor(v/step)*step;
    for(let k=-5;k<=5;k++){ const val=base+k*step; if(val<0) continue; const y=60-(val-v)*px; s+=`<line x1="0" y1="${y}" x2="10" y2="${y}"/><text x="14" y="${y+4}">${fmt(val)}</text>`; }
    el.innerHTML=`<svg viewBox="0 0 70 120" preserveAspectRatio="none">${s}<rect x="0" y="50" width="70" height="20" class="box"/><text x="6" y="64" class="cur">${fmt(v)}</text></svg>`; }
  function setBar(id,v){ const el=$(id); if(!el) return; el.style.width=(v*100).toFixed(1)+'%'; el.className = v<.12?'low':''; const t=$(id+'v'); if(t) t.textContent=Math.round(v*100)+'%'; }
  let comT=0;
  function update(s){
    // propellant model (fractions remaining)
    const p1 = s.t<0?1: clamp(1-s.t/157*.97,0.03,1), p2 = s.t<166?1: clamp(1-(s.t-166)/354*.96,.04,1);
    const p1v = s.stage1Gone? 0 : p1;
    [['p1o',p1v*1],['p1f',p1v*1],['p2o',p2],['p2f',p2]].forEach(([id,v])=>{ setBar(id,v); setBar('c'+id,v); });
    const thr = s.t<-3?0: s.t<0? (s.t+3)/3: s.t<157? (s.t>45&&s.t<78? .72:1) : s.t<166?0: s.t<520?1:0;
    $('sysThr').textContent=Math.round(thr*100)+'%'; $('ckThr').textContent=Math.round(thr*100)+'%'; $('ckThrBar').style.height=(thr*100)+'%';
    document.querySelectorAll('.eng .s1').forEach(c=>c.classList.toggle('on',s.s1on));
    document.querySelectorAll('.eng .b').forEach(c=>c.classList.toggle('on',s.bon));
    $('sysEng').textContent=`${spec.eng?spec.eng.n:1} engines, ${s.s1on?'running':s.stage1Gone?'stage dropped':'off'}`;
    $('ckEngState').textContent= s.s1on?'ALL ENGINES NOMINAL': s.stage1Gone? (s.s2on?'STAGE 2 ENGINE BURNING':'ENGINES SHUT DOWN'):'ENGINES SAFE';
    // cockpit only below here
    if(!$('cockpit').classList.contains('on')) return;
    adi(s.gammaDeg, Math.sin(s.t*.7)*1.2*(s.t>0&&s.t<160?1:0));
    tape('ckSpd', Math.max(0,s.v/3.6), 200, v=>Math.round(v)); tape('ckAlt', Math.max(0,s.alt), 10, v=>v.toFixed(0));
    $('ckMet').textContent=s.met; $('ckG').textContent=s.gl.toFixed(1)+' g'; $('ckDr').textContent=Math.round(s.dr)+' km';
    $('ckGfill').style.height=clamp(s.gl/5*100,0,100)+'%';
    annun.forEach(a=>{ const e=s.events.find(x=>x.k===a.dataset.k); const done=!!(e&&e.done); a.classList.toggle('lit',done); a.classList.toggle('fresh',done&&s.t-e.t<4); });
    // comms
    comT+=1; if(comT%6===0){ const st = s.t<0?['Launch control','Pad umbilical, hardline']: s.t<200?['Range tracking, Florida','S-band, line of sight']: s.t<420?['Downrange station','S-band, handover in progress']:['TDRS relay (geostationary)','S-band via relay satellite'];
      $('ckCom1').textContent=st[0]; $('ckCom2').textContent=st[1];
      const bars=Math.max(1,Math.min(5, s.t<0?5: s.t<200?5-Math.floor(s.t/60): s.t<420?2+((s.t/7|0)%2): 4)); $('ckBars').innerHTML=[1,2,3,4,5].map(i=>`<i class="${i<=bars?'on':''}" style="height:${i*4}px"></i>`).join('');
      $('ckRate').textContent= s.t<0?'10.0 Mbit/s': (2+Math.random()*1.5).toFixed(1)+' Mbit/s'; }
  }
  function show(on){ $('cockpit').classList.toggle('on',on); }
  return {setup,update,show};
})();

// ---- engine sound, synthesized (no audio files) ----
const LaunchAudio = (()=>{ let ctx=null, master=null, roarG=null, lp=null, rumbleG=null, on=false, lastBeep=99;
  function init(){ ctx=new (window.AudioContext||window.webkitAudioContext)(); master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const len=ctx.sampleRate*2, buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0); let last=0; for(let i=0;i<len;i++){ const w=Math.random()*2-1; last=(last+.02*w)/1.02; d[i]=last*3.5; }
    const src=ctx.createBufferSource(); src.buffer=buf; src.loop=true; lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400; roarG=ctx.createGain(); roarG.gain.value=0;
    src.connect(lp); lp.connect(roarG); roarG.connect(master); src.start();
    const osc=ctx.createOscillator(); osc.frequency.value=38; rumbleG=ctx.createGain(); rumbleG.gain.value=0; osc.connect(rumbleG); rumbleG.connect(master); osc.start(); }
  function toggle(){ try{ if(!ctx) init(); on=!on; if(ctx.state==='suspended') ctx.resume(); master.gain.setTargetAtTime(on?.9:0,ctx.currentTime,.1); }catch(e){ on=false; } return on; }
  function beep(f=880,d=.08){ if(!on||!ctx) return; const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=f; g.gain.value=.12; o.connect(g); g.connect(master); o.start(); g.gain.setTargetAtTime(0,ctx.currentTime+d*.6,.02); o.stop(ctx.currentTime+d+.1); }
  function update(t,thr,altKm,s2){ if(!on||!ctx) return;
    const sec=Math.ceil(t); if(t<0&&t>-10.5&&sec!==lastBeep){ lastBeep=sec; beep(sec===0?1320:880); }
    const air=1-smooth(8,70,altKm); const level = s2? .12*thr : thr*(.25+.75*air);
    roarG.gain.setTargetAtTime(level*.9,ctx.currentTime,.08); rumbleG.gain.setTargetAtTime(level*.5*air,ctx.currentTime,.1);
    lp.frequency.setTargetAtTime(200+700*thr*air+100*Math.random(),ctx.currentTime,.05); }
  function mute(){ if(ctx&&on){ master.gain.setTargetAtTime(0,ctx.currentTime,.05); } }
  function unmute(){ if(ctx&&on){ master.gain.setTargetAtTime(.9,ctx.currentTime,.1); } }
  return {toggle,update,beep,mute,unmute,get on(){return on;}};
})();
