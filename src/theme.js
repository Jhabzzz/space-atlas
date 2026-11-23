// ================= THEME (light / dark) =================
const THEME_SKY={light:0x0f2238,dark:0x08111d};
const ICON_MOON='<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 1.5a6.5 6.5 0 1 0 4 11.6A7 7 0 0 1 10.5 1.5z" fill="currentColor"/></svg>';
const ICON_SUN='<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4"/></g></svg>';
let THEME='light';
function setTheme(t,save){ THEME=t; document.documentElement.dataset.theme=t;
  ['earth','sats','hangar','moon','solar'].forEach(k=>{ const s=VIEWS[k]&&VIEWS[k].scene; if(s&&s.background) s.background.setHex(THEME_SKY[t]); });
  const dark=t==='dark', label=dark? ICON_SUN+'Light theme' : ICON_MOON+'Dark theme';
  [$('themeBtn'),$('introTheme')].forEach(b=>{ b.innerHTML=label; b.setAttribute('aria-pressed',String(dark)); b.title=dark?'Switch to the light theme':'Switch to the dark theme'; });
  if(save){ try{ localStorage.setItem('atlas-theme',t); }catch(e){} } }
(()=>{ let t=null; try{ t=localStorage.getItem('atlas-theme'); }catch(e){}
  if(!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(t,false);
  const flip=()=>setTheme(THEME==='dark'?'light':'dark',true);
  $('themeBtn').onclick=flip; $('introTheme').onclick=flip; })();
