// ================= tiny React shim =================
// Lets the two React components (BlackHoleHeroSection, ShaderAnimation) run unchanged
// in this plain-HTML page: refs, one-shot effects, and JSX → DOM.
const __hooks = { effects: null };
function useRef(v){ return { current: v }; }
function useEffect(fn){ __hooks.effects.push(fn); }
const React = {};
function h(tag, props, ...kids){
  const el=document.createElement(tag); props=props||{};
  for(const k in props){ const v=props[k];
    if(k==='ref'){ if(v) v.current=el; }
    else if(k==='className'){ el.className=v; }
    else if(k==='style'){ Object.assign(el.style,v); }
    else if(k==='children'||v==null||v===false||typeof v==='function'||typeof v==='object') continue;
    else el.setAttribute(k,v); }
  kids.flat().forEach(c=>{ if(c==null||c===false) return; el.appendChild(c instanceof Node? c : document.createTextNode(String(c))); });
  return el; }
/** Mount a component into host. Returns an unmount function. */
function mountComponent(Comp, props, host){
  __hooks.effects=[]; const el=Comp(props||{}); const fx=__hooks.effects; __hooks.effects=null;
  host.appendChild(el); const cleanups=fx.map(f=>f()).filter(f=>typeof f==='function');
  return ()=>{ cleanups.forEach(c=>{ try{ c(); }catch(e){} }); el.remove(); }; }
