// ================= GEOGRAPHY: place names and coordinates =================
// Country borders: Natural Earth 1:50m (public domain), via world-atlas, simplified.
const COUNTRY_NAMES={ 'United States of America':'United States','Dem. Rep. Congo':'DR Congo','Central African Rep.':'Central African Republic',
  'Bosnia and Herz.':'Bosnia and Herzegovina','S. Sudan':'South Sudan','W. Sahara':'Western Sahara','Dominican Rep.':'Dominican Republic',
  'Eq. Guinea':'Equatorial Guinea','Antigua and Barb.':'Antigua and Barbuda','Br. Indian Ocean Ter.':'British Indian Ocean Territory',
  'Fr. Polynesia':'French Polynesia','Fr. S. Antarctic Lands':'French Southern Lands','Heard I. and McDonald Is.':'Heard and McDonald Islands',
  'Indian Ocean Ter.':'Christmas Island','N. Cyprus':'Northern Cyprus','N. Mariana Is.':'Northern Mariana Islands',
  'S. Geo. and the Is.':'South Georgia','St. Kitts and Nevis':'Saint Kitts and Nevis','St. Pierre and Miquelon':'Saint Pierre and Miquelon',
  'St. Vin. and Gren.':'Saint Vincent and the Grenadines','U.S. Virgin Is.':'US Virgin Islands','eSwatini':'Eswatini' };
const GEO=(()=>{
  const bin=atob(COUNTRY_PTS), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  const P=new Int16Array(u8.buffer);
  const list=COUNTRIES.map(c=>{ const name=COUNTRY_NAMES[c.n]||c.n.replace(/ Is\.$/,' Islands');
    const rings=c.k.map(([st,len])=>{ let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(let i=st;i<st+len;i+=2){ const x=P[i]/20,y=P[i+1]/20; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } return {st,len,x0,x1,y0,y1}; });
    return { name, lat:c.c[0], lon:c.c[1], area:c.a, rings }; });
  function inRing(r,lon,lat){ if(lon<r.x0||lon>r.x1||lat<r.y0||lat>r.y1) return false; let inside=false;
    for(let i=r.st, j=r.st+r.len-2; i<r.st+r.len; j=i, i+=2){ const xi=P[i]/20, yi=P[i+1]/20, xj=P[j]/20, yj=P[j+1]/20;
      if(((yi>lat)!==(yj>lat)) && (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi)) inside=!inside; } return inside; }
  function country(lat,lon){ for(const c of list) for(const r of c.rings) if(inRing(r,lon,lat)) return c; return null; }
  // Named seas and oceans by region; used only when the point is not inside a country.
  function water(lat,lon){
    const box=(a,b,c,d)=>lat>=a&&lat<=b&&lon>=c&&lon<=d;
    if(lat<=-60) return 'Southern Ocean';
    if(lat>=66) return 'Arctic Ocean';
    if(box(30,46,-6,36.5)) return 'Mediterranean Sea';
    if(box(40,47.5,27,42)) return 'Black Sea';
    if(box(36,47.5,46.5,55)) return 'Caspian Sea';
    if(box(12,30,32,44)) return 'Red Sea';
    if(box(23,30.5,47,57)) return 'Persian Gulf';
    if(box(18,31,-98,-81)) return 'Gulf of Mexico';
    if(box(9,22,-88,-60)) return 'Caribbean Sea';
    if(box(51,66,-95,-77)) return 'Hudson Bay';
    if(box(53,66,9,30)) return 'Baltic Sea';
    if(box(51,61,-4,9)) return 'North Sea';
    if(box(5,25,50,77)) return 'Arabian Sea';
    if(box(5,23,80,95)) return 'Bay of Bengal';
    if(box(-3,23,105,121)) return 'South China Sea';
    if(box(24,41,117,131)) return 'East China Sea';
    if(box(33,52,127,142)) return 'Sea of Japan';
    if(box(-12,-2,135,155)) return 'Coral Sea';
    if(box(-30,-12,145,165)) return 'Coral Sea';
    if(box(-47,-30,148,175)) return 'Tasman Sea';
    if(lon>=20&&lon<=147&&lat<30&&!(lon>120&&lat>-8)) return 'Indian Ocean';
    if(lon>-70&&lon<20) return 'Atlantic Ocean';
    if(lon>=-100&&lon<=-70&&lat>=8) return 'Atlantic Ocean';
    if(lon>=-67&&lon<=-50&&lat<-8) return 'Atlantic Ocean';
    return 'Pacific Ocean'; }
  // Distance (km) from a point to the nearest border of a country, checked only for countries whose outline is close.
  function nearCoast(lat,lon,maxKm){ const pad=maxKm/100+.2, k=Math.cos(lat*Math.PI/180); let best=null, bd=maxKm;
    for(const c of list) for(const r of c.rings){ if(lon<r.x0-pad/k||lon>r.x1+pad/k||lat<r.y0-pad||lat>r.y1+pad) continue;
      for(let i=r.st; i<r.st+r.len-2; i+=2){ const ax=(P[i]/20-lon)*k*111.2, ay=(P[i+1]/20-lat)*111.2, bx=(P[i+2]/20-lon)*k*111.2, by=(P[i+3]/20-lat)*111.2;
        const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy; const t=L? Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L)) : 0; const d=Math.hypot(ax+t*dx, ay+t*dy);
        if(d<bd){ bd=d; best=c; } } }
    return best? {c:best,km:bd} : null; }
  function region(c,lat,lon){ if(c.name==='France'&&lon<-40) return 'French Guiana (France)'; if(c.name==='France'&&lat<-15) return 'Réunion (France)'; return c.name; }
  function placeAt(lat,lon){ const c=country(lat,lon); if(c) return {name:region(c,lat,lon),water:false};
    const n=nearCoast(lat,lon,30); if(n) return {name:'Coast of '+region(n.c,lat,lon),water:false,coast:true};
    return {name:water(lat,lon),water:true}; }
  return { list, country, water, placeAt };
})();
const fmtLat=v=>Math.abs(v).toFixed(2)+'° '+(v>=0?'N':'S');
const fmtLon=v=>Math.abs(v).toFixed(2)+'° '+(v>=0?'E':'W');
const fmtLL=(lat,lon)=>fmtLat(lat)+', '+fmtLon(lon);
function v2ll(v){ const r=v.length(); const lat=90-Math.acos(v.y/r)*180/Math.PI; let lon=Math.atan2(v.z,-v.x)*180/Math.PI-180; if(lon<-180) lon+=360; return {lat,lon}; }
