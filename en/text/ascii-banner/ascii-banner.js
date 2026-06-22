// TAYSTUDIO 정품 = https://taystudios.com · 무단 복제·재배포 금지
  const FONTS=['Standard','Big','Slant','ANSI Shadow','Doom','Ghost','Small','Banner3'];
  const sel=document.getElementById('abFont'), txt=document.getElementById('abTxt'), fill=document.getElementById('abFill'),
        out=document.getElementById('abOut'), statusEl=document.getElementById('abStatus'), copyBtn=document.getElementById('abCopy');
  let tg;
  function toast(m){const t=document.getElementById('abToast');t.textContent=m;t.classList.add('show');clearTimeout(tg);tg=setTimeout(()=>t.classList.remove('show'),1200);}
  function applyFill(s){const f=fill.value;return f? s.replace(/[^\s]/g,f): s;}
  function render(){
    try{
      const data=figlet.textSync(txt.value||' ',{font:sel.value});
      out.textContent=applyFill(data.replace(/\s+$/,''));
      statusEl.textContent='Font: '+sel.value;
    }catch(e){ statusEl.textContent='This font failed to render — try another'; }
  }
  (function init(){
    if(typeof figlet==='undefined'){ statusEl.textContent='figlet library failed to load'; out.textContent='Could not load vendor/figlet.js'; return; }
    const loaded=[];
    Promise.all(FONTS.map(f=>
      fetch('vendor/fonts/'+encodeURIComponent(f)+'.flf')
        .then(r=>r.ok?r.text():Promise.reject())
        .then(t=>{ figlet.parseFont(f,t); loaded.push(f); })
        .catch(()=>{})
    )).then(()=>{
      if(!loaded.length){ statusEl.textContent='Failed to load fonts'; out.textContent='Could not load fonts from vendor/fonts/'; return; }
      sel.innerHTML=FONTS.filter(f=>loaded.includes(f)).map((f,i)=>`<option ${i===0?'selected':''}>${f}</option>`).join('');
      sel.disabled=false; copyBtn.disabled=false;
      txt.addEventListener('input',render);
      sel.addEventListener('change',render);
      fill.addEventListener('input',render);
      copyBtn.addEventListener('click',()=>{navigator.clipboard?.writeText(out.textContent).catch(()=>{});toast('Copied — paste into your console / README');});
      render();
    });
  })();
  
