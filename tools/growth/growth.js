/**
 * 영유아·소아 성장 백분위 계산기 — LMS(Box-Cox) 정식 방식
 * 데이터: CDC 2000 + WHO(영아) 성장도표 공식 L/M/S (미 공공도메인, 17 U.S.C. §105)
 *   tools/growth/growth-data.js (window.GROWTH_LMS)
 * 방법: z = ((X/M)^L − 1)/(L·S)  (L≈0이면 ln(X/M)/S) → 정규분포로 백분위. Cole & Green 1992.
 * 최종 검증: 2026-06-16
 */
const D = window.GROWTH_LMS || {};
const $ = (id) => document.getElementById(id);

/* ── 통계 ── */
function erf(x){const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+0.3275911*x);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return s*y;}
const normCDF = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function invNorm(p){
  if(p<=0)return -6; if(p>=1)return 6;
  const a=[-3.969683028665376e1,2.209460984245205e2,-2.759285104469687e2,1.38357751867269e2,-3.066479806614716e1,2.506628277459239];
  const b=[-5.447609879822406e1,1.615858368580409e2,-1.556989798598866e2,6.680131188771972e1,-1.328068155288572e1];
  const c=[-7.784894002430293e-3,-3.223964580411365e-1,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
  const d=[7.784695709041462e-3,3.224671290700398e-1,2.445134137142996,3.754408661907416];
  const pl=0.02425;let q,r;
  if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p<=1-pl){q=p-0.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
  q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}
function lmsZ(X,L,M,S){ return Math.abs(L)<1e-7 ? Math.log(X/M)/S : (Math.pow(X/M,L)-1)/(L*S); }
function lmsValueAt(p,L,M,S){ const z=invNorm(p); return Math.abs(L)<1e-7 ? M*Math.exp(S*z) : M*Math.pow(1+L*S*z,1/L); }

/* ── 실 데이터 보간 (월 단위 사이 선형) ── */
function lmsAt(meas,sex,age){
  const arr = D[meas] && D[meas][sex];
  if(!arr || !arr.length) return null;
  const a = Math.max(arr[0][0], Math.min(arr[arr.length-1][0], age));
  let lo=arr[0], hi=arr[arr.length-1];
  for(let i=0;i<arr.length-1;i++){ if(a>=arr[i][0] && a<=arr[i+1][0]){ lo=arr[i]; hi=arr[i+1]; break; } }
  if(lo[0]===hi[0]) return {L:lo[1],M:lo[2],S:lo[3]};
  const f=(a-lo[0])/(hi[0]-lo[0]);
  return { L:lo[1]+(hi[1]-lo[1])*f, M:lo[2]+(hi[2]-lo[2])*f, S:lo[3]+(hi[3]-lo[3])*f };
}
function ageRange(meas,sex){ const arr=D[meas]&&D[meas][sex]; return arr&&arr.length?[arr[0][0],arr[arr.length-1][0]]:[0,240]; }

const UNIT = { height:'cm', weight:'kg', head:'cm', bmi:'kg/m²' };
const MEASNAME = { height:'키', weight:'몸무게', head:'머리둘레', bmi:'BMI' };
const SEXNAME = { M:'남아', F:'여아' };

/* ── UI 상태 ── */
let sex='M', meas='height';
function setSeg(seg,v){ [...seg.querySelectorAll('button')].forEach(b=>b.classList.toggle('on', b.dataset.v===v)); }
$('sexSeg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ sex=b.dataset.v; setSeg($('sexSeg'),sex); }});
$('measSeg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ meas=b.dataset.v; setSeg($('measSeg'),meas); $('valLbl').textContent=MEASNAME[meas]+' ('+UNIT[meas]+')'; updateBmiHint(); }});
function updateBmiHint(){ const h=$('bmiHint'); if(h) h.style.display = (meas==='bmi'?'block':'none'); }

const pctLabel = (p)=>{ if(p<3)return'매우 작음/적음 (<3)'; if(p<15)return'작은 편'; if(p<=85)return'또래 평균권'; if(p<=97)return'큰 편'; return'매우 큼/많음 (>97)'; };
let lastResult=null;

function calc(){
  const age=+$('age').value, X=+$('val').value;
  const [aMin,aMax]=ageRange(meas,sex);
  if(!(age>=0 && age<=240) || !(X>0)){ alert('나이(0~240개월)와 측정값을 정확히 입력하세요.'); return; }
  if(age<aMin || age>aMax){ alert(`${MEASNAME[meas]}는 이 도표에서 ${aMin}~${aMax}개월만 지원합니다.`); return; }
  const p=lmsAt(meas,sex,age);
  if(!p){ alert('데이터를 불러오지 못했습니다.'); return; }
  const z=lmsZ(X,p.L,p.M,p.S), pct=Math.max(0.1,Math.min(99.9,normCDF(z)*100));
  $('pct').textContent=pct.toFixed(1)+'백분위';
  $('gaugeMark').style.left=pct+'%';
  $('pctSub').textContent=`${SEXNAME[sex]} · ${age}개월 · 중앙값(50%) ${p.M.toFixed(1)}${UNIT[meas]} · z=${z.toFixed(2)} · ${pctLabel(pct)}`;
  lastResult={age,X,meas,sex,unit:UNIT[meas]};
  $('result').style.display='block';
  drawChart(age,X);
  renderTrack();
  $('result').scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('calc').addEventListener('click',calc);

/* ── 성장곡선 차트 ── */
function drawChart(childAge,childX){
  const cv=$('chart'),c=cv.getContext('2d'),W=cv.width,H=cv.height,padL=46,padB=28,padT=14,padR=14;
  const [aMin,aMax0]=ageRange(meas,sex);
  const maxAge = childAge<=36 ? Math.min(36,aMax0) : aMax0;
  c.clearRect(0,0,W,H);
  const pcts=[0.03,0.15,0.50,0.85,0.97];
  const ages=[]; const step0=Math.max(1,Math.round((maxAge-aMin)/60));
  for(let a=aMin;a<=maxAge;a+=step0) ages.push(a);
  let ymin=1e9,ymax=-1e9;
  const curves=pcts.map(pp=>ages.map(a=>{const q=lmsAt(meas,sex,a);const v=lmsValueAt(pp,q.L,q.M,q.S);ymin=Math.min(ymin,v);ymax=Math.max(ymax,v);return v;}));
  ymin=Math.min(ymin,childX);ymax=Math.max(ymax,childX);const yr=ymax-ymin||1;ymin-=yr*0.08;ymax+=yr*0.08;
  const X2=a=>padL+((a-aMin)/(maxAge-aMin))*(W-padL-padR), Y2=v=>H-padB-((v-ymin)/(ymax-ymin))*(H-padT-padB);
  c.strokeStyle='rgba(128,128,128,.18)';c.lineWidth=1;c.fillStyle=getComputedStyle(document.body).getPropertyValue('--muted')||'#888';c.font='10px sans-serif';
  for(let i=0;i<=4;i++){const v=ymin+(ymax-ymin)*i/4,y=Y2(v);c.beginPath();c.moveTo(padL,y);c.lineTo(W-padR,y);c.stroke();c.fillText(v.toFixed(0),5,y+3);}
  const xstep=maxAge<=36?6:(maxAge<=72?12:24);for(let a=aMin;a<=maxAge;a+=xstep){c.fillText(a+'',X2(a)-5,H-10);}
  const cols=['#cbd5e1','#93c5fd','#2563eb','#93c5fd','#cbd5e1'],labels=['3','15','50','85','97'];
  curves.forEach((cu,i)=>{c.strokeStyle=cols[i];c.lineWidth=i===2?2.2:1.3;c.beginPath();cu.forEach((v,j)=>{const x=X2(ages[j]),y=Y2(v);j?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.fillStyle=cols[i];c.font='10px sans-serif';c.fillText(labels[i],W-padR-2,Y2(cu[cu.length-1])+3);});
  const saved=loadTrack().filter(t=>t.meas===meas&&t.sex===sex).sort((a,b)=>a.age-b.age);
  if(saved.length){c.strokeStyle='#10b981';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();saved.forEach((t,j)=>{const x=X2(t.age),y=Y2(t.X);j?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.setLineDash([]);c.fillStyle='#10b981';saved.forEach(t=>{c.beginPath();c.arc(X2(t.age),Y2(t.X),3.5,0,7);c.fill();});}
  c.fillStyle='#e11d48';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(X2(childAge),Y2(childX),6,0,7);c.fill();c.stroke();
}

/* ── localStorage 성장 추적 ── */
const TKEY='taystudio.growth.track';
const loadTrack=()=>{try{return JSON.parse(localStorage.getItem(TKEY)||'[]');}catch(e){return[];}};
const saveTrack=(a)=>localStorage.setItem(TKEY,JSON.stringify(a));
$('save').addEventListener('click',()=>{ if(!lastResult)return; const a=loadTrack(); a.push({...lastResult,ts:Date.now()}); saveTrack(a); renderTrack(); drawChart(lastResult.age,lastResult.X); });
function renderTrack(){
  const a=loadTrack().filter(t=>t.meas===meas&&t.sex===sex).sort((x,y)=>x.age-y.age);
  const box=$('trackBox'),ul=$('trackList');
  if(!a.length){box.style.display='none';return;}
  box.style.display='block';
  ul.innerHTML=a.map(t=>`<li><span>${t.age}개월 · ${t.X}${t.unit}</span><button class="del" data-ts="${t.ts}">삭제</button></li>`).join('');
  ul.querySelectorAll('.del').forEach(b=>b.addEventListener('click',()=>{ saveTrack(loadTrack().filter(x=>x.ts!=b.dataset.ts)); renderTrack(); if(lastResult)drawChart(lastResult.age,lastResult.X); }));
}
updateBmiHint();
