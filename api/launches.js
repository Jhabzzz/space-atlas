// Live launches from Launch Library 2 (The Space Devs). Cached at the edge for 15 minutes
// so the free API's rate limit (15 requests/hour) is never hit, however many people visit.
const LL2 = 'https://ll.thespacedevs.com/2.3.0/launches';
function trim(r){ const p=r.pad||{}, loc=p.location||{}; const parts=(r.name||'').split(' | ');
  return { rocket:parts[0]||r.rocket?.configuration?.name||'Rocket', mission:parts.slice(1).join(' | ')||r.mission?.name||'Unknown',
    net:r.net, status:r.status?.abbrev||'TBD', provider:r.launch_service_provider?.name||'', pad:p.name||'',
    lat:+p.latitude, lon:+p.longitude, site:loc.name||'', cc:p.country?.alpha_2_code||loc.country_code||'',
    orbit:r.mission?.orbit?.abbrev||'', desc:(r.mission?.description||'').slice(0,400), webcast:!!r.webcast_live }; }
async function get(path){ const r=await fetch(`${LL2}/${path}`,{headers:{'User-Agent':'space-atlas (vercel)'}}); if(!r.ok) throw new Error(`LL2 ${path} ${r.status}`); const j=await r.json(); return j.results.map(trim).filter(x=>Number.isFinite(x.lat)); }
export default async function handler(req,res){
  try{ const [up,past]=await Promise.all([get('upcoming/?limit=60&mode=normal'),get('previous/?limit=40&mode=normal')]);
    res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');
    res.status(200).json({source:'Launch Library 2 (The Space Devs)',fetchedAt:new Date().toISOString(),up,past}); }
  catch(e){ res.setHeader('Cache-Control','public, s-maxage=60'); res.status(502).json({error:String(e.message||e)}); }
}
