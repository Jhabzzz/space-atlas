// ISS orbital elements (CelesTrak, NORAD 25544) and the crew on board (Launch Library 2).
async function tle(){ const r=await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle'); if(!r.ok) throw new Error('celestrak '+r.status);
  const lines=(await r.text()).trim().split(/\r?\n/).map(s=>s.trim()); const l1=lines.find(s=>s.startsWith('1 ')), l2=lines.find(s=>s.startsWith('2 ')); if(!l1||!l2) throw new Error('no TLE'); return [l1,l2]; }
async function crew(){ const r=await fetch('https://ll.thespacedevs.com/2.3.0/space_stations/4/?mode=detailed',{headers:{'User-Agent':'space-atlas (vercel)'}}); if(!r.ok) throw new Error('ll2 '+r.status);
  const j=await r.json(); const ex=(j.active_expeditions||[]); const people=[]; const names=new Set();
  ex.forEach(e=>(e.crew||[]).forEach(c=>{ const n=c.astronaut?.name; if(!n||names.has(n)) return; names.add(n);
    people.push({name:n, agency:c.astronaut?.agency?.abbrev||c.astronaut?.agency?.name||'', role:c.role?.role||''}); }));
  return { expedition: ex.map(e=>e.name).join(', '), people }; }
export default async function handler(req,res){
  const [t,c]=await Promise.allSettled([tle(),crew()]);
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=7200');
  res.status(t.status==='fulfilled'||c.status==='fulfilled'?200:502).json({ fetchedAt:new Date().toISOString(),
    tle: t.status==='fulfilled'? t.value : null, tleError: t.status==='rejected'? String(t.reason) : undefined,
    crew: c.status==='fulfilled' && c.value.people.length? c.value : null, crewError: c.status==='rejected'? String(c.reason) : undefined });
}
