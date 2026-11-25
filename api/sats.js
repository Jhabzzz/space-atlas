// How many satellites of each constellation CelesTrak currently tracks in orbit.
// CelesTrak asks users not to re-download the same data more than every 2 hours; this is cached for 6.
const GROUPS={ active:'active', starlink:'starlink', oneweb:'oneweb', amazon:'kuiper', iridium:'iridium-NEXT', qianfan:'qianfan', guowang:'hulianwang', ast:'ast' };
async function count(g){ const r=await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(g)}&FORMAT=tle`); if(!r.ok) return null;
  const txt=await r.text(); const n=txt.split(/\r?\n/).filter(l=>l.startsWith('1 ')).length; return n>0? n : null; }
export default async function handler(req,res){
  const keys=Object.keys(GROUPS); const vals=await Promise.all(keys.map(k=>count(GROUPS[k]).catch(()=>null)));
  const counts={}; keys.forEach((k,i)=>counts[k]=vals[i]);
  const ok=counts.active||counts.starlink;
  res.setHeader('Cache-Control', ok? 'public, s-maxage=21600, stale-while-revalidate=86400' : 'no-store');
  res.status(ok?200:503).json({ source:'CelesTrak', fetchedAt:new Date().toISOString(), counts });
}
