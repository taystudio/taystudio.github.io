// TAYSTUDIO 정품 = https://taystudios.com · 무단 복제·재배포 금지
  const CATS=[
    {k:'deco', name:'Dividers & decor', aliases:'divider line decoration aesthetic header 구분선', wide:true, items:['˗ˏˋ ★ ˎˊ˗','⋆｡˚ ☁︎ ˚｡⋆','꒰ ꒱','⊹ ࣪ ˖','⋆⑅˚₊','✧･ﾟ','·˚ ༘ ⋆｡˚','˚₊‧꒰ა ໒꒱ ‧₊˚','◜◝ ◜◝','♡⃕','◌͙','‧₊˚','┈┈┈┈┈','━━━━━','╌╌╌╌','· · · · ·','꒷꒦꒷꒦','❀ ❀ ❀','⟡','✶','✦','✧','☾','☽','❥','ㆍ','ʚɞ']},
    {k:'kao', name:'Kaomoji', aliases:'kaomoji text face emoticon japanese 카오모지', wide:true, items:['(｡•̀ᴗ-)✧','( ˶ˆᗜˆ˵ )','(◍•ᴗ•◍)','(｡♥‿♥｡)','٩(ˊᗜˋ*)و','(✿◕‿◕)','◝(ᵔᵕᵔ)◜','ʕ•ᴥ•ʔ','(•‿•)','¯\\_(ツ)_/¯','( ˘ ³˘)♡','(｡╥﹏╥｡)','ദ്ദി(ᵔᗜᵔ)','(＾▽＾)','( •̀ ω •́ )✧','(ノ◕ヮ◕)ノ','( ˙꒳​˙ )','(๑˃ᴗ˂)ﻭ','(っ˘̩╭╮˘̩)っ','(•ㅅ•)']},
    {k:'insta', name:'Instagram symbols', aliases:'instagram profile symbol bullet bio marker', items:['📍','📌','✨','🎯','☕️','📸','✈️','🌏','💌','🔖','🎀','🤍','🩷','⭐','🌙','🍀','🌷','🎧','💭','📷']},
    {k:'biotpl', name:'Bio templates', aliases:'instagram bio template profile intro', wide:true, items:['📍 Seoul · ☕️ Cafe · 📷 Daily','˗ˏˋ ✿ ˎˊ˗','⋆｡˚ ✧ since 2026 ✧ ˚｡⋆','➴ link in bio','🤍 ____ 🤍','✧･ﾟ: *✧ ____ ✧*:･ﾟ✧','📷 daily | ✈️ travel | ☕️ cafe','꒰ ⍤⍢⍤ ꒱']},
    {k:'circled', name:'Circled & roman', aliases:'circled number roman numeral enclosed', items:['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','❶','❷','❸','ⓐ','ⓑ','ⓒ','㉠','㉡','㉢','㈀','㈁','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ']},
    {k:'sup', name:'Super/subscript', aliases:'superscript subscript exponent index', items:['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','⁺','⁻','ⁿ','₀','₁','₂','₃','₄','₅','₆','₇','₈','₉']},
    {k:'greek', name:'Greek letters', aliases:'greek alpha beta gamma pi sigma omega', items:['α','β','γ','δ','ε','ζ','η','θ','λ','μ','π','ρ','σ','τ','φ','χ','ψ','ω','Δ','Σ','Ω','Φ','Ψ','Γ','Π','Θ','Λ']},
    {k:'gauge', name:'Rating bars', aliases:'rating star bar gauge score progress', items:['★★★★★','★★★★☆','★★★☆☆','★★☆☆☆','▰▰▰▱▱','▮▮▮▯▯','●●●○○','▓▓▓░░','⬛⬛⬛⬜⬜','■■■□□']},
    {k:'star', name:'Stars & hearts', aliases:'star heart love', items:['★','☆','✦','✧','⭐','✩','✪','❤','♥','♡','❥','ღ','💕','💗','💖','❣','✿','❀','♪','♫','✲']},
    {k:'arrow', name:'Arrows', aliases:'arrow direction', items:['→','←','↑','↓','↔','↕','⇒','⇐','⇔','➜','➤','➔','▶','◀','▲','▼','↻','↺','⤴','⤵','↳','»','«']},
    {k:'shape', name:'Shapes', aliases:'shape circle square triangle', items:['●','○','◆','◇','■','□','▲','△','▽','◐','◑','⬛','⬜','⚫','⚪','▪','▫','◍','◉','✔','✖','〇']},
    {k:'bracket', name:'Brackets & quotes', aliases:'bracket quote', items:['「」','『』','【】','〔〕','《》','〈〉','‹›','«»','“”','‘’','❛❜','❝❞','〖〗','⟨⟩','｟｠']},
    {k:'money', name:'Currency & units', aliases:'currency unit money', items:['₩','$','€','£','¥','₿','¢','℃','℉','°','㎏','㎝','㎜','㎡','№','℡','㈜','™','©','®']},
    {k:'math', name:'Math symbols', aliases:'math symbol', items:['±','×','÷','≠','≈','≤','≥','∞','√','∑','π','∴','∵','※','§','¶','‰','′','″','…','‥','·']},
    {k:'emoji', name:'Emoji', aliases:'emoji', items:['😀','🥹','🥰','😭','🔥','✨','🎉','✅','⭐','💡','📌','🚀','💕','👍','🙏','👀','💯','🫶','🥺','😎','🤍']},
    {k:'space', name:'Spaces & blanks', aliases:'space blank invisible nickname', wide:true, items:['ㅤ (Hangul space)','　 (full-width space)','· (middle dot)','• (bullet)','‧','∙','◦','–','—','〜','～']},
  ];
  const NAMES={'★':'star','☆':'star','❤':'heart love','♥':'heart','♡':'heart','→':'arrow right','←':'arrow left','●':'circle','■':'square','₩':'won','$':'dollar','※':'reference','✨':'sparkle','🔥':'fire','📍':'pin location','📌':'pin','π':'pi','Ω':'omega','α':'alpha'};
  const SYN={
    'face':['😀','😄','😁','😆','😊','🙂','😍','🥰','😘','😎','🤩','😐','😶','🙄','😏','😴','😭','😢','😡','🤬','😱','😳','🥺','🤔','😅'],
    'mood':['😀','😊','😍','🥰','😎','😭','😢','😡','🥺','😴','😌','🙃'],
    'happy':['😀','😄','😊','🥰','😍','🤗','☺️','😌','🥳','😆'],
    'laugh':['😀','😄','😁','😆','😂','🤣','😊','😹','🤭'],
    'lol':['😂','🤣','😆','😹','🤭','😝'],
    'cry':['😭','😢','🥺','😿','💧','🥹'],
    'sad':['😢','😭','😞','😔','🥺','😣','😩','😿','💔','🥹'],
    'angry':['😠','😡','🤬','👿','💢','😤','😾'],
    'wow':['😮','😲','😱','🤯','😳','😦','😧'],
    'omg':['😱','😲','🤯','😮','😨'],
    'wink':['😉','😜','😝','😛','🤪'],
    'kiss':['😘','😗','😙','😚','💋','🥰'],
    'love':['❤️','😍','🥰','😘','💕','💖','💗','💓','💞','😻','💝','💌'],
    'heart':['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💗','💕','💖','💘','💝'],
    'party':['🎉','🎊','🥳','👏','🎈','🎁','🍰','🥂','✨','🎆','🎇','🙌'],
    'celebrate':['🎉','🎊','🥳','👏','🎈','🥂','🍾'],
    'birthday':['🎂','🎉','🎈','🎁','🥳','🍰'],
    'christmas':['🎄','🎅','🤶','🎁','⛄','🦌','🔔','✨'],
    'newyear':['🎆','🎇','🥳','🎉','🍾','🎊','🌅'],
    'popular':['😭','😂','🤣','❤️','🥰','😍','😊','🙏','👍','🔥','✨','🥺','😅','🎉','💕','😎','😘','💯','🙌','👀'],
    'fire':['🔥','✨','💥','🎆','🎇'],
    'cool':['😎','🆒','🔥','✨','👍'],
    'ok':['👌','🆗','✅','👍'],
    'yes':['👍','✅','🙆','👌'],
    'no':['🙅','❌','👎','🚫'],
    'thumbsup':['👍','👎','🤙'],
    'best':['👍','🤩','💯','🔥','🏆','👑'],
    'clap':['👏','🙌','👐'],
    'pray':['🙏','🙇','💕'],
    'thanks':['🙏','🙇','💕','🤗','😊'],
    'sorry':['🙏','😔','🥲','😞'],
    'hi':['👋','🙋','😊'],
    'bye':['👋','✋'],
    'hand':['👋','🤚','✋','👌','👈','👉','👆','👇','✊','👊','🤛','🤜','🙏','💪','🤝','👏'],
    'dog':['🐶','🐕','🦮','🐩'],
    'cat':['🐱','🐈','😺','😸','😻','😼'],
    'animal':['🐶','🐱','🐰','🐻','🐼','🦊','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦄','🐢','🐙'],
    'food':['🍔','🍕','🍟','🌭','🍜','🍱','🍣','🍙','🍚','🍰','🍩','🍪','🍫','🍦','🍿','🥗','🍗','🍳','🥘'],
    'fruit':['🍎','🍏','🍓','🍌','🍉','🍇','🍑','🍒','🥝','🍊','🍍','🥭'],
    'dessert':['🍰','🧁','🍩','🍪','🍫','🍦','🍨','🍬','🍭'],
    'coffee':['☕','🍵','🧋'],
    'beer':['🍺','🍻','🍷','🥂','🍸','🍹','🍶','🥃'],
    'weather':['☀️','🌤️','⛅','🌥️','🌧️','⛈️','🌩️','❄️','☃️','⛄','🌈','💨','🌪️','🌫️','🌙','⭐'],
    'rain':['🌧️','⛈️','☔','🌦️','💧','☂️'],
    'snow':['❄️','☃️','⛄'],
    'sky':['☁️','⛅','🌤️','🌈','🌙','⭐','🌟'],
    'sea':['🌊','🏖️','🐚','⛱️','🏝️','🐠','🐳'],
    'nature':['🌳','🌲','🌿','🍃','🌷','🌻','🍂','🏔️'],
    'plant':['🌱','🌿','🍀','🌵','🌴','🪴','🌾'],
    'flower':['🌷','🌹','🌸','💐','🌺','🌼','🌻','🏵️'],
    'money':['💰','💵','💸','🤑','💳','🪙','🧧'],
    'music':['🎵','🎶','🎧','🎸','🎹','🎤','🥁'],
    'travel':['✈️','🧳','🗺️','🏖️','🚗','🚄','🌏','🧭','📷','🎒'],
    'car':['🚗','🚙','🏎️','🚕','🛻','🚓'],
    'sport':['🏃','💪','⚽','🏀','🏋️','🚴','🧘','🥇'],
    'work':['💼','💻','📊','📈','📋','🖥️','⌨️'],
    'study':['📚','📖','✏️','📝','🎓','🧠','💡'],
    'game':['🎮','🕹️','👾','🎯','🃏','🎲'],
    'sleep':['😴','💤','🛌','🌙'],
    'tired':['😪','😴','🥱','😩','😫','💤'],
    'sick':['🤒','🤕','🤧','😷','🥴','🤢','🤮','🩹'],
    'star':['⭐','🌟','✨','💫','🌠','★','☆'],
    'sparkle':['✨','💫','🌟','⭐','🌠','💖'],
    'time':['⏰','⌚','⏳','🕐','📅','📆'],
    'check':['✅','✔️','☑️','🟢'],
    'warning':['⚠️','🚨','❗','‼️'],
    'question':['❓','❔','🤔','🙋'],
    'luck':['🍀','🌈','⭐','🧿','🎰'],
    'cute':['🥰','😍','🐰','🐱','🐶','🐻','🌸'],
    'divider':['˗ˏˋ ★ ˎˊ˗','⋆｡˚ ☁︎ ˚｡⋆','꒰ ꒱','┈┈┈┈┈','━━━━━','✦','✧','❀'],
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
  function doCopy(raw){const txt=clean(raw);navigator.clipboard?.writeText(txt).catch(()=>{});recent=[raw,...recent.filter(x=>x!==raw)].slice(0,18);save(RK,recent);toast('Copied: '+(txt.trim()||'space'));renderTop();}
  function chip(s,wide){
    const i=FLAT.length; FLAT.push(s);
    const on=favs.includes(s)?'on':'';
    const cls='sym-chip'+((wide||s.length>2)?' txt':'');
    return `<div class="${cls}" data-i="${i}">${esc(s)}<span class="sym-fav ${on}" data-fav="${i}" title="Favorite" aria-label="Favorite">★</span></div>`;
  }
  function matches(s){if(!filter)return true;const q=filter.toLowerCase();return s.toLowerCase().includes(q)||(NAMES[s]||'').toLowerCase().includes(q);}
  function renderTop(){
    recent=load(RK);
    const rs=document.getElementById('recentSec');
    if(recent.length){rs.style.display='';document.getElementById('recentGrid').innerHTML=recent.map(s=>chip(s)).join('');}else rs.style.display='none';
    const fsec=document.getElementById('favSec');
    if(favs.length){fsec.style.display='';document.getElementById('favN').textContent=favs.length;document.getElementById('favGrid').innerHTML=favs.map(s=>chip(s)).join('');}else fsec.style.display='none';
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
      if(rec.length) html+=`<div class="sym-sec"><h3>Suggested emoji <span class="n">‘${esc(filter)}’ ${rec.length}</span></h3><div class="sym-grid">${rec.map(o=>chip(o)).join('')}</div></div>`;
    }
    html+=CATS.filter(c=>tab==='all'||c.k===tab).map(c=>{
      const catHit = q && ((c.name+' '+(c.aliases||'')).toLowerCase().includes(q));
      const its = (!q||catHit) ? c.items : c.items.filter(matches);
      if(!its.length)return '';
      return `<div class="sym-sec"><h3>${c.name} <span class="n">${its.length}</span></h3><div class="sym-grid ${c.wide?'wide':''}">${its.map(s=>chip(s,c.wide)).join('')}</div></div>`;
    }).join('');
    document.getElementById('cats').innerHTML = html || '<div class="sym-empty">No results.</div>';
  }
  tool.addEventListener('click',e=>{
    const fav=e.target.closest('[data-fav]');
    if(fav){ e.stopPropagation(); const s=FLAT[+fav.dataset.fav]; favs=favs.includes(s)?favs.filter(x=>x!==s):[s,...favs]; save(FK,favs); render(); return; }
    const c=e.target.closest('.sym-chip');
    if(c){ const s=FLAT[+c.dataset.i]; if(collectMode){ basket.value+=clean(s); toast('Added — see the box above'); } else { doCopy(s); } }
  });
  const comboBtn=document.getElementById('comboBtn'), basketBar=document.getElementById('basketBar');
  comboBtn.addEventListener('click',()=>{
    collectMode=!collectMode;
    comboBtn.classList.toggle('on',collectMode);
    basketBar.classList.toggle('show',collectMode);
    tool.classList.toggle('collect',collectMode);
    document.getElementById('comboLbl').textContent=collectMode?'Combining':'Combine';
    if(collectMode){ toast('Combine mode — tap symbols to add them'); basket.focus(); }
  });
  document.getElementById('basketCopy').addEventListener('click',()=>{ if(!basket.value){toast('Basket is empty');return;} navigator.clipboard?.writeText(basket.value).catch(()=>{}); toast('Combo copied'); });
  document.getElementById('basketClear').addEventListener('click',()=>{ basket.value=''; basket.focus(); });
  document.getElementById('tabs').innerHTML='<button class="on" data-t="all">All</button>'+CATS.map(c=>`<button data-t="${c.k}">${c.name}</button>`).join('');
  document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.t;[...e.currentTarget.children].forEach(x=>x.classList.toggle('on',x===b));render();});
  document.getElementById('q').addEventListener('input',e=>{filter=e.target.value.trim();render();});
  document.getElementById('hints').addEventListener('click',e=>{const b=e.target.closest('button[data-h]');if(!b)return;const w=b.dataset.h;document.getElementById('q').value=w;filter=w;render();});
  fetch('emoji-index.json').then(r=>r.json()).then(d=>{EMO=d;if(filter)render();}).catch(()=>{});
  render();
  
