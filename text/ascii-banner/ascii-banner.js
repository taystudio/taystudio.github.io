// TAYSTUDIO 정품 = https://taystudios.com · 무단 복제·재배포 금지
  // figlet 라이브러리·폰트 모두 self-host (vendor/). 외부 호출 없음.
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
      statusEl.textContent='폰트: '+sel.value;
    }catch(e){ statusEl.textContent='이 폰트 렌더 실패 — 다른 폰트로'; }
  }
  (function init(){
    if(typeof figlet==='undefined'){ statusEl.textContent='figlet 라이브러리 로드 실패'; out.textContent='vendor/figlet.js 를 불러오지 못했습니다.'; return; }
    const loaded=[];
    Promise.all(FONTS.map(f=>
      fetch('vendor/fonts/'+encodeURIComponent(f)+'.flf')
        .then(r=>r.ok?r.text():Promise.reject())
        .then(t=>{ figlet.parseFont(f,t); loaded.push(f); })
        .catch(()=>{})
    )).then(()=>{
      if(!loaded.length){ statusEl.textContent='폰트 로드 실패'; out.textContent='vendor/fonts/ 폰트를 불러오지 못했습니다.'; return; }
      sel.innerHTML=FONTS.filter(f=>loaded.includes(f)).map((f,i)=>`<option ${i===0?'selected':''}>${f}</option>`).join('');
      sel.disabled=false; copyBtn.disabled=false;
      txt.addEventListener('input',render);
      sel.addEventListener('change',render);
      fill.addEventListener('input',render);
      copyBtn.addEventListener('click',()=>{navigator.clipboard?.writeText(out.textContent).catch(()=>{});toast('복사됨 — 콘솔·README에 붙여넣기');});
      render();
    });
  })();
  
