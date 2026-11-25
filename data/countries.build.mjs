import fs from 'fs'; import * as topo from 'topojson-client'; import * as simp from 'topojson-simplify'; import * as d3 from 'd3-geo';
const t=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const ps=simp.presimplify(t); const s=simp.simplify(ps, +process.argv[2]||0.01);
const fc=topo.feature(s,s.objects.countries); const full=topo.feature(t,t.objects.countries);
const out=[];
fc.features.forEach((f,i)=>{ const name=f.properties.name; if(!f.geometry) return;
  const polys=(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);
  // label at centroid of the largest polygon (by area), from full-res geometry
  const fp=full.features[i].geometry; const fpolys=fp.type==='Polygon'?[fp.coordinates]:fp.coordinates;
  let best=null,ba=-1; fpolys.forEach(p=>{ const a=d3.geoArea({type:'Polygon',coordinates:p}); if(a>ba){ba=a;best=p;} });
  const c=d3.geoCentroid({type:'Polygon',coordinates:best}); const area=d3.geoArea(full.features[i])*6371*6371;
  const rr=polys.map(p=>p[0]).filter(r=>r.length>=4); const sz=r=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; r.forEach(([x,y])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}); return (x1-x0)*(y1-y0);}; const mx=Math.max(...rr.map(sz)); const rings=rr.filter(r=>sz(r)===mx||sz(r)>0.01).map(r=>r.map(([x,y])=>[Math.round(x*20)/20,Math.round(y*20)/20]).flat());
  out.push({n:name,c:[Math.round(c[1]*100)/100,Math.round(c[0]*100)/100],a:Math.round(area),r:rings});
});
// pack rings as Int16 (degrees*20), base64
const nums=[]; out.forEach(o=>{ o.k=o.r.map(r=>{ const st=nums.length; r.forEach(v=>nums.push(Math.round(v*20))); return [st,r.length]; }); delete o.r; });
const buf=Buffer.from(new Int16Array(nums).buffer).toString('base64');
const js='const COUNTRIES='+JSON.stringify(out)+';\nconst COUNTRY_PTS="'+buf+'";';
fs.writeFileSync('countries.js',js); console.log(out.length,'countries',(js.length/1024).toFixed(0)+'KB');
