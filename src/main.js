// ================= BOOT =================
function renderIntroStatus(){ const st=$('introStatus'); if(!st) return; const live=!!LIVE.launches; st.className='lamp '+(live?'go':'amber');
  if(live){ st.textContent='Live data loaded'; return; }
  if(location.origin!==LIVE_SITE){ st.innerHTML=`This preview can’t reach live data. <a href="${LIVE_SITE}" target="_blank" rel="noopener">Open the live site</a>`; return; }
  st.textContent='Connecting to live data…'; }
// Retry quickly until live data arrives, then refresh every 10 minutes.
let retryMs=15000;
async function refreshAll(){ const had=!!LIVE.launches; await loadData(); if(LIVE.launches!==null) VIEWS.earth.reload&&VIEWS.earth.reload();
  if(!ISS_TLE_LIVE||!ISS_CREW_LIVE) await fetchIssTle(); if(!LIVE.sats) fetchSatCounts();
  renderIntroStatus(); const live=!!LIVE.launches;
  setTimeout(refreshAll, live? 10*60*1000 : retryMs); if(!live) retryMs=Math.min(retryMs*2,120000); else retryMs=15000; }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&LIVE.launches&&Date.now()-Date.parse(LIVE.launches)>15*60*1000) loadData().then(()=>VIEWS.earth.reload&&VIEWS.earth.reload()); });
(async()=>{
  await Promise.all([loadData(), fetchIssTle()]); fetchSatCounts();
  setInterval(renderSource,60*1000);
  VIEWS.earth.init();
  show('earth');
  renderIntroStatus();
  setTimeout(refreshAll, LIVE.launches? 10*60*1000 : retryMs);
  $('enterGlobe').disabled=false; $('enterIss').disabled=false; $('enterGlobe').focus({preventScroll:true});
  loop();
})();
