// TAYSTUDIO 정품 = https://taystudios.com · 무단 복제·재배포 금지
  const CATS=[
    {k:'deco', name:'감성 구분선·꾸미기', aliases:'구분선 꾸미기 감성 라인 divider line', wide:true, items:['˗ˏˋ ★ ˎˊ˗','⋆｡˚ ☁︎ ˚｡⋆','꒰ ꒱','⊹ ࣪ ˖','⋆⑅˚₊','✧･ﾟ','·˚ ༘ ⋆｡˚','˚₊‧꒰ა ໒꒱ ‧₊˚','◜◝ ◜◝','♡⃕','◌͙','‧₊˚','┈┈┈┈┈','━━━━━','╌╌╌╌','· · · · ·','꒷꒦꒷꒦','❀ ❀ ❀','⟡','✶','✦','✧','☾','☽','❥','ㆍ','ʚɞ']},
    {k:'kao', name:'카오모지·텍대', aliases:'카오모지 텍대 이모티콘 표정 kaomoji 감정', wide:true, items:['(｡•̀ᴗ-)✧','( ˶ˆᗜˆ˵ )','(◍•ᴗ•◍)','(｡♥‿♥｡)','٩(ˊᗜˋ*)و','(✿◕‿◕)','◝(ᵔᵕᵔ)◜','ʕ•ᴥ•ʔ','(•‿•)','¯\\_(ツ)_/¯','( ˘ ³˘)♡','(｡╥﹏╥｡)','ദ്ദി(ᵔᗜᵔ)','(＾▽＾)','( •̀ ω •́ )✧','(ノ◕ヮ◕)ノ','( ˙꒳​˙ )','(๑˃ᴗ˂)ﻭ','(っ˘̩╭╮˘̩)っ','(•ㅅ•)']},
    {k:'insta', name:'인스타 심볼', aliases:'인스타 프로필 심볼 이모지 불릿 bio 마커', items:['📍','📌','✨','🎯','☕️','📸','✈️','🌏','💌','🔖','🎀','🤍','🩷','⭐','🌙','🍀','🌷','🎧','💭','📷']},
    {k:'biotpl', name:'bio 템플릿', aliases:'인스타 bio 템플릿 프로필 소개 자기소개', wide:true, items:['📍 Seoul · ☕️ Cafe · 📷 Daily','˗ˏˋ ✿ ˎˊ˗','⋆｡˚ ✧ since 2026 ✧ ˚｡⋆','➴ link in bio','🤍 ____ 🤍','✧･ﾟ: *✧ ____ ✧*:･ﾟ✧','📷 일상 | ✈️ 여행 | ☕️ 카페','꒰ ⍤⍢⍤ ꒱']},
    {k:'circled', name:'원문자·로마', aliases:'원문자 동그라미숫자 번호 로마숫자 number circled', items:['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','❶','❷','❸','ⓐ','ⓑ','ⓒ','㉠','㉡','㉢','㈀','㈁','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']},
    {k:'sup', name:'위·아래첨자', aliases:'첨자 위첨자 아래첨자 지수 superscript subscript', items:['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','⁺','⁻','ⁿ','₀','₁','₂','₃','₄','₅','₆','₇','₈','₉']},
    {k:'greek', name:'그리스 문자', aliases:'그리스 알파 베타 감마 파이 그리스문자 greek', items:['α','β','γ','δ','ε','ζ','η','θ','λ','μ','π','ρ','σ','τ','φ','χ','ψ','ω','Δ','Σ','Ω','Φ','Ψ','Γ','Π','Θ','Λ']},
    {k:'gauge', name:'별점·게이지', aliases:'별점 게이지 점수 진행 막대 rating bar', items:['★★★★★','★★★★☆','★★★☆☆','★★☆☆☆','▰▰▰▱▱','▮▮▮▯▯','●●●○○','▓▓▓░░','⬛⬛⬛⬜⬜','■■■□□']},
    {k:'star', name:'별·하트', aliases:'별 하트 스타 사랑 heart star', items:['★','☆','✦','✧','⭐','✩','✪','❤','♥','♡','❥','ღ','💕','💗','💖','❣','✿','❀','♪','♫','✲']},
    {k:'arrow', name:'화살표', aliases:'화살표 방향 arrow', items:['→','←','↑','↓','↔','↕','⇒','⇐','⇔','➜','➤','➔','▶','◀','▲','▼','↻','↺','⤴','⤵','↳','»','«']},
    {k:'shape', name:'도형', aliases:'도형 동그라미 네모 세모 원 사각 shape', items:['●','○','◆','◇','■','□','▲','△','▽','◐','◑','⬛','⬜','⚫','⚪','▪','▫','◍','◉','✔','✖','〇']},
    {k:'bracket', name:'괄호·따옴표', aliases:'괄호 따옴표 인용 bracket quote', items:['「」','『』','【】','〔〕','《》','〈〉','‹›','«»','“”','‘’','❛❜','❝❞','〖〗','⟨⟩','｟｠']},
    {k:'money', name:'화폐·단위', aliases:'화폐 단위 통화 돈 money', items:['₩','$','€','£','¥','₿','¢','℃','℉','°','㎏','㎝','㎜','㎡','№','℡','㈜','™','©','®']},
    {k:'math', name:'수학·기호', aliases:'수학 기호 math', items:['±','×','÷','≠','≈','≤','≥','∞','√','∑','π','∴','∵','※','§','¶','‰','′','″','…','‥','·']},
    {k:'emoji', name:'이모지', aliases:'이모지 emoji', items:['😀','🥹','🥰','😭','🔥','✨','🎉','✅','⭐','💡','📌','🚀','💕','👍','🙏','👀','💯','🫶','🥺','😎','🤍']},
    {k:'space', name:'공백·자모', aliases:'공백 투명 빈칸 닉네임 space', wide:true, items:['ㅤ (한글 공백)','　 (전각 공백)','· (가운뎃점)','• (불릿)','‧','∙','◦','–','—','〜','～']},
  ];
  const NAMES={'★':'별 star','☆':'별 star','❤':'하트 heart','♥':'하트 heart','♡':'하트 heart','→':'화살표 arrow','←':'화살표 arrow','●':'원 circle','■':'사각 square','₩':'원 won','$':'달러 dollar','※':'참고','✨':'반짝 sparkle','🔥':'불 fire','📍':'위치 핀','📌':'핀','π':'파이 pi','Ω':'오메가','α':'알파 alpha'};
  const SYN={
    '표정':['😀','😄','😁','😆','😊','🙂','😍','🥰','😘','😎','🤩','😐','😶','🙄','😏','😴','😭','😢','😡','🤬','😱','😳','🥺','🤔','😅'],
    '얼굴':['😀','😄','😊','😍','😎','😭','😡','😱','🥺','😴','🤔','😏'],
    '기분':['😀','😊','😍','🥰','😎','😭','😢','😡','🥺','😴','😌','🙃'],
    '웃음':['😀','😄','😁','😆','😂','🤣','😊','🙂','😍','🤩','😹'],
    '축하':['🎉','🎊','🥳','👏','🎈','🎁','🍰','🥂','✨','🎆','🎇','🙌'],
    '사랑':['❤️','😍','🥰','😘','💕','💖','💗','💓','💞','😻','💝','💌'],
    '하트':['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💗','💕','💖','💘','💝'],
    '슬픔':['😢','😭','😞','😔','🥺','😣','😩','😿','💔','🥹'],
    '화남':['😠','😡','🤬','👿','💢','😤','😾'],
    '날씨':['☀️','🌤️','⛅','🌥️','🌧️','⛈️','🌩️','❄️','☃️','⛄','🌈','💨','🌪️','🌫️','🌙','⭐'],
    '음식':['🍔','🍕','🍟','🌭','🍜','🍱','🍣','🍙','🍚','🍰','🍩','🍪','🍫','🍦','🍿','🥗','🍗','🍳','🥘'],
    '동물':['🐶','🐱','🐰','🐻','🐼','🦊','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐢','🐙'],
    '강아지':['🐶','🐕','🦮','🐩'],
    '고양이':['🐱','🐈','😺','😸','😻','😼'],
    '커피':['☕','🍵','🧋'],
    '여행':['✈️','🧳','🗺️','🏖️','🚗','🚄','🌏','🧭','📷','🎒'],
    '돈':['💰','💵','💸','🤑','💳','🪙','🧧'],
    '운동':['🏃','💪','⚽','🏀','🏋️','🚴','🧘','🥇'],
    '음악':['🎵','🎶','🎧','🎸','🎹','🎤','🥁'],
    '별':['⭐','🌟','✨','💫','🌠','★','☆'],
    '불':['🔥','✨','💥','🎆','🎇'],
    '꽃':['🌷','🌹','🌸','💐','🌺','🌼','🌻','🏵️'],
    '시간':['⏰','⌚','⏳','🕐','📅','📆'],
    '인기':['😭','😂','🤣','❤️','🥰','😍','😊','🙏','👍','🔥','✨','🥺','😅','🎉','💕','😎','😘','💯','🙌','👀'],
    '자주':['😭','😂','❤️','🥰','😍','😊','🙏','👍','🔥','✨','🥺','🎉','💕','😎','💯'],
    '행복':['😀','😄','😊','🥰','😍','🤗','☺️','😌','🥳','😆'],
    '기쁨':['😀','😄','😁','😊','🥳','🤩','😆','🙌'],
    '우울':['😔','😞','😟','🥺','😢','😩','😣','🥲'],
    '짜증':['😤','😠','😑','😒','🙄','😣','😖'],
    '피곤':['😪','😴','🥱','😩','😫','💤'],
    '놀람':['😮','😲','😱','🤯','😳','😦','😧'],
    '윙크':['😉','😜','😝','😛','🤪'],
    '키스':['😘','😗','😙','😚','💋','🥰'],
    '박수':['👏','🙌','👐'],
    '엄지':['👍','👎','🤙'],
    '최고':['👍','🤩','💯','🔥','🏆','👑'],
    '오케이':['👌','🆗','✅','👍'],
    '손':['👋','🤚','✋','👌','👈','👉','👆','👇','✊','👊','🤛','🤜','🙏','💪','🤝','👏'],
    '인사':['👋','🙇','🤗','😊'],
    '감사':['🙏','🙇','💕','🤗','😊'],
    '미안':['🙏','😔','🥲','😞'],
    '응원':['💪','🙌','📣','🔥','✊','🥹'],
    '화이팅':['💪','🔥','✊','🙌'],
    '생일':['🎂','🎉','🎈','🎁','🥳','🍰'],
    '크리스마스':['🎄','🎅','🤶','🎁','⛄','🦌','🔔','✨'],
    '새해':['🎆','🎇','🥳','🎉','🍾','🎊','🌅'],
    '술':['🍺','🍻','🍷','🥂','🍸','🍹','🍶','🥃'],
    '맥주':['🍺','🍻'],
    '디저트':['🍰','🧁','🍩','🍪','🍫','🍦','🍨','🍬','🍭'],
    '과일':['🍎','🍏','🍓','🍌','🍉','🍇','🍑','🍒','🥝','🍊','🍍','🥭'],
    '잠':['😴','💤','🛌','🌙'],
    '아픔':['🤒','🤕','🤧','😷','🥴','🤢','🤮','🩹'],
    '비':['🌧️','⛈️','☔','🌦️','💧','☂️'],
    '눈꽃':['❄️','☃️','⛄'],
    '하늘':['☁️','⛅','🌤️','🌈','🌙','⭐','🌟'],
    '바다':['🌊','🏖️','🐚','⛱️','🏝️','🐠','🐳'],
    '자연':['🌳','🌲','🌿','🍃','🌷','🌻','🍂','🏔️'],
    '식물':['🌱','🌿','🍀','🌵','🌴','🪴','🌾'],
    '자동차':['🚗','🚙','🏎️','🚕','🛻','🚓'],
    '게임':['🎮','🕹️','👾','🎯','🃏','🎲'],
    '공부':['📚','📖','✏️','📝','🎓','🧠','💡'],
    '일':['💼','💻','📊','📈','📋','🖥️','⌨️'],
    '반짝':['✨','💫','🌟','⭐','🌠','💖'],
    '체크':['✅','✔️','☑️','🟢'],
    '금지':['🚫','⛔','❌','🔞'],
    '경고':['⚠️','🚨','❗','‼️'],
    '질문':['❓','❔','🤔','🙋'],
    '행운':['🍀','🌈','⭐','🧿','🎰'],
    '웃겨':['😂','🤣','😆','😹','🤭'],
    '귀여움':['🥰','😍','🐰','🐱','🐶','🐻','🌸'],
    '슬퍼':['😢','😭','🥺','😔','💔'],
    'ㅠㅠ':['😭','😢','🥺','😿','💧','🥹'],
    'ㅜㅜ':['😭','😢','🥺','😿','💧','🥹'],
    'ㅋㅋ':['😂','🤣','😆','😹','🤭','😝'],
    'ㅎㅎ':['😊','😄','🙂','😁','☺️','😆'],
    'ㅇㅇ':['👍','✅','🙆','👌'],
    'ㄴㄴ':['🙅','❌','👎','🚫'],
    'ㅎㅇ':['👋','🙋','😊'],
    'ㅂㅂ':['👋','✋'],
    'ㄱㅅ':['🙏','🙇','💕'],
    'ㅊㅋ':['🎉','🥳','🎊','👏'],
    'ㅈㅅ':['🙏','😅','🥲'],
    'ㅡㅡ':['😑','😒','🙄','😤'],
    'ㄷㄷ':['😨','😱','🥶','😰'],
    '헐':['😱','😨','🤯','😳'],
    '대박':['😱','🤩','🔥','💯','👏'],
    '굿':['👍','👌','💯','🙆'],
    '졸려':['😴','💤','🥱'],
    '심쿵':['😍','🥰','😻','💕','💘'],
  };
  const FK='sns.symbols.fav', RK='sns.symbols.recent';
  const load=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  let favs=load(FK), recent=load(RK), filter='', tab='all', collectMode=false;
  let FLAT=[], EMO=[];
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const clean=s=>s.replace(/ \(.*\)$/,'');
  const tool=document.getElementById('symTool');
  const basket=document.getElementById('basket');
  let tg;
  function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tg);tg=setTimeout(()=>t.classList.remove('show'),1200);}
  function doCopy(raw){const txt=clean(raw);navigator.clipboard?.writeText(txt).catch(()=>{});recent=[raw,...recent.filter(x=>x!==raw)].slice(0,18);save(RK,recent);toast('복사됨: '+(txt.trim()||'공백문자'));renderTop();}
  function chip(s,wide){
    const i=FLAT.length; FLAT.push(s);
    const on=favs.includes(s)?'on':'';
    const cls='sym-chip'+((wide||s.length>2)?' txt':'');
    return `<div class="${cls}" data-i="${i}">${esc(s)}<span class="sym-fav ${on}" data-fav="${i}" title="즐겨찾기" aria-label="즐겨찾기">★</span></div>`;
  }
  function matches(s){if(!filter)return true;const q=filter.toLowerCase();return s.toLowerCase().includes(q)||(NAMES[s]||'').toLowerCase().includes(q);}
  function renderTop(){
    recent=load(RK);
    const rs=document.getElementById('recentSec');
    if(recent.length){rs.style.display='';document.getElementById('recentGrid').innerHTML=recent.map(s=>chip(s)).join('');}else rs.style.display='none';
    const fsec=document.getElementById('favSec');
    if(favs.length){fsec.style.display='';document.getElementById('favN').textContent=favs.length+'개';document.getElementById('favGrid').innerHTML=favs.map(s=>chip(s)).join('');}else fsec.style.display='none';
  }
  function render(){
    FLAT=[]; renderTop();
    const q=filter.toLowerCase();
    let html='';
    if(q){
      let rec=[];
      const sk=SYN[q]?q:Object.keys(SYN).find(k=>q.includes(k)||k.includes(q));
      if(sk) rec=SYN[sk].slice();
      if(EMO.length) EMO.forEach(o=>{ if(o.k.includes(q)&&!rec.includes(o.e)) rec.push(o.e); });
      rec=rec.slice(0,42);
      if(rec.length) html+=`<div class="sym-sec"><h3>추천 이모지 <span class="n">‘${esc(filter)}’ ${rec.length}</span></h3><div class="sym-grid">${rec.map(o=>chip(o)).join('')}</div></div>`;
    }
    html+=CATS.filter(c=>tab==='all'||c.k===tab).map(c=>{
      const catHit = q && ((c.name+' '+(c.aliases||'')).toLowerCase().includes(q));
      const its = (!q||catHit) ? c.items : c.items.filter(matches);
      if(!its.length)return '';
      return `<div class="sym-sec"><h3>${c.name} <span class="n">${its.length}</span></h3><div class="sym-grid ${c.wide?'wide':''}">${its.map(s=>chip(s,c.wide)).join('')}</div></div>`;
    }).join('');
    document.getElementById('cats').innerHTML = html || '<div class="sym-empty">검색 결과가 없어요.</div>';
  }
  tool.addEventListener('click',e=>{
    const fav=e.target.closest('[data-fav]');
    if(fav){ e.stopPropagation(); const s=FLAT[+fav.dataset.fav]; favs=favs.includes(s)?favs.filter(x=>x!==s):[s,...favs]; save(FK,favs); render(); return; }
    const c=e.target.closest('.sym-chip');
    if(c){ const s=FLAT[+c.dataset.i]; if(collectMode){ basket.value+=clean(s); toast('담음 — 위 칸 확인'); } else { doCopy(s); } }
  });
  const comboBtn=document.getElementById('comboBtn'), basketBar=document.getElementById('basketBar');
  comboBtn.addEventListener('click',()=>{
    collectMode=!collectMode;
    comboBtn.classList.toggle('on',collectMode);
    basketBar.classList.toggle('show',collectMode);
    tool.classList.toggle('collect',collectMode);
    document.getElementById('comboLbl').textContent=collectMode?'담는 중':'조합';
    if(collectMode){ toast('조합 모드 — 기호를 탭하면 바구니에 담겨요'); basket.focus(); }
  });
  document.getElementById('basketCopy').addEventListener('click',()=>{ if(!basket.value){toast('바구니가 비어있어요');return;} navigator.clipboard?.writeText(basket.value).catch(()=>{}); toast('조합 복사됨'); });
  document.getElementById('basketClear').addEventListener('click',()=>{ basket.value=''; basket.focus(); });
  document.getElementById('tabs').innerHTML='<button class="on" data-t="all">전체</button>'+CATS.map(c=>`<button data-t="${c.k}">${c.name}</button>`).join('');
  document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.t;[...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===b));render();});
  document.getElementById('q').addEventListener('input',e=>{filter=e.target.value.trim();render();});
  document.getElementById('hints').addEventListener('click',e=>{const b=e.target.closest('button[data-h]');if(!b)return;const w=b.dataset.h;document.getElementById('q').value=w;filter=w;render();});
  fetch('emoji-index.json').then(r=>r.json()).then(d=>{EMO=d;if(filter)render();}).catch(()=>{});
  render();
  
