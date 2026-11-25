// Live launches from Launch Library 2 (The Space Devs).
// The CDN keeps a fresh copy for 10 minutes and keeps serving the last good copy for up to a day
// while it refreshes in the background, so visitors never wait on (or get blocked by) the API.
// If the main API is down or rate limited, the same data is read from The Space Devs' mirror.
const SOURCES = [
  { name: 'Launch Library 2 (The Space Devs)', base: 'https://ll.thespacedevs.com/2.3.0/launches' },
  { name: 'Launch Library 2 mirror (The Space Devs)', base: 'https://lldev.thespacedevs.com/2.3.0/launches' },
];
function trim(r){ const p=r.pad||{}, loc=p.location||{}; const parts=(r.name||'').split(' | ');
  return { rocket:parts[0]||r.rocket?.configuration?.name||'Rocket', mission:parts.slice(1).join(' | ')||r.mission?.name||'Unknown',
    net:r.net, status:r.status?.abbrev||'TBD', provider:r.launch_service_provider?.name||'', pad:p.name||'',
    lat:+p.latitude, lon:+p.longitude, site:loc.name||'', cc:p.country?.alpha_2_code||loc.country_code||'',
    orbit:r.mission?.orbit?.abbrev||'', desc:(r.mission?.description||'').slice(0,400), webcast:!!r.webcast_live }; }
async function get(base, path){
  const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),9000);
  try{ const r=await fetch(`${base}/${path}`,{headers:{'User-Agent':'space-atlas (vercel)'},signal:ctl.signal});
    if(!r.ok) throw new Error(`${r.status}`); const j=await r.json();
    return (j.results||[]).map(trim).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)); }
  finally{ clearTimeout(tm); } }
export default async function handler(req,res){
  const errors=[];
  for(const s of SOURCES){
    try{ const [up,past]=await Promise.all([get(s.base,'upcoming/?limit=60&mode=normal'),get(s.base,'previous/?limit=40&mode=normal')]);
      if(!up.length) throw new Error('empty');
      res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=86400');
      return res.status(200).json({source:s.name,fetchedAt:new Date().toISOString(),up,past}); }
    catch(e){ errors.push(`${s.name}: ${e.message||e}`); }
  }
  // Never cache a failure, so the CDN keeps the last good copy.
  res.setHeader('Cache-Control','no-store');
  res.status(503).json({error:errors.join('; ')});
}
