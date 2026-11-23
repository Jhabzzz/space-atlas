// ================= BOOT =================
(async()=>{
  await Promise.all([loadData(), fetchIssTle()]); fetchSatCounts();
  setInterval(async()=>{ await loadData(); VIEWS.earth.reload(); },10*60*1000); setInterval(renderSource,60*1000);
  VIEWS.earth.init();
  show('earth');
  const st=$('introStatus'), live=!!LIVE.launches; st.className='lamp '+(live?'go':'amber');
  st.textContent= live? 'Live data loaded' : 'Live data unavailable here, showing data saved on Nov 22';
  $('enterGlobe').disabled=false; $('enterIss').disabled=false; $('enterGlobe').focus({preventScroll:true});
  loop();
})();
