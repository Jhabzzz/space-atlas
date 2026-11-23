// ================= INTRO (black hole) + HOW IT WORKS backdrop (rings) =================
let introOpen=true, bhUnmount=null, ringsUnmount=null;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
function openIntro(){ const el=$('intro'); el.style.display='block'; requestAnimationFrame(()=>el.style.opacity=1); introOpen=true; hideTip();
  if(!bhUnmount){ const narrow=matchMedia('(max-width: 767px)').matches;
    bhUnmount=mountComponent(BlackHoleHeroSection,{ focus:narrow?[0.5,0.76]:[0.7,0.47], scrim:narrow?'top':'left', scrimStrength:.9, distance:24,
      elevation:narrow?-7:-5.5, fov:narrow?58:42, glow:narrow?.85:1, steps:narrow?200:300, resolution:narrow?.6:.7, starBrightness:.3 },$('bhHost')); } }
function closeIntro(then){ const el=$('intro'); el.style.opacity=0; introOpen=false; clock.getDelta(); if(then) then();
  setTimeout(()=>{ if(introOpen) return; el.style.display='none'; if(bhUnmount){ bhUnmount(); bhUnmount=null; } },550); }
$('enterGlobe').onclick=()=>closeIntro();
$('enterIss').onclick=()=>closeIntro(()=>show('sats','iss'));
document.querySelector('#top .brand').addEventListener('click',openIntro);
function openLearn(){ $('learn').style.display='flex'; if(!REDUCED&&!ringsUnmount) ringsUnmount=mountComponent(ShaderAnimation,{},$('learnBg')); }
function closeLearn(){ $('learn').style.display='none'; if(ringsUnmount){ ringsUnmount(); ringsUnmount=null; } }
openIntro();
