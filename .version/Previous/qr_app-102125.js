"use strict";
// This file runs in the browser.  No <script> or HTML tags belong here.

(function loadQRCodeOnce(){
  if (window.QRCode && window.QRCode.CorrectLevel) return; // already loaded

  function use(url, onload){
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = onload;
    s.onerror = function(){
      if (!/cdnjs/.test(url)) {
        use('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', onload);
      } else {
        console.error('Failed to load QRCode library from both sources.');
      }
    };
    document.head.appendChild(s);
  }

  // try local first, then CDN
  use('vendor/qrcode.min.js', function () {
  if (typeof window.render === 'function') requestAnimationFrame(window.render);
});

})();


  // Add listener to toggle manually via menu later
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  }

  // --- Footer year ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
    
    // -------- Emoji picker (catalog + search) --------
    const EMOJI_BIG = ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","🙂","🙃","☺️","😋","😌","😍","🥰","😘","😗","😙","😚","😜","🤪","😝","😛","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😶‍🌫️","😏","😒","🙄","😬","🤥","😴","😪","😮‍💨","😌","😮","😯","😲","😳","🥵","🥶","😱","😨","😰","😥","😢","😭","😤","😡","😠","🤬","🤯","😷","🤒","🤕","🤢","🤮","🤧","🥴","😵","😵‍💫","🤠","🥳","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","🤷","🤷‍♂️","🤷‍♀️","💪","👋","🤝","👍","👎","👏","🙌","👐","🤲","🤟","✌️","🤘","👌","🤌","🤏","👈","👉","☝️","👆","👇","✋","🖐️","🖖","✊","👊","💋","❤️","🩷","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","🌈","🏳️‍🌈","🏳️‍⚧️","⭐️","✨","🔥","⚡️","💥","🌟","☀️","🌙","🪐","🌍","🌎","🌏","🌊","⛰️","🏙️","🗽","🚗","✈️","🚀","⌚️","📱","💻","🖥️","🖨️","🎧","🎤","🎬","📷","📸","📝","📚","🔖","📎","🔬","🔧","⚙️","🍎","🍉","🍇","🍓","🍑","🍍","🥑","🌮","🍣","🍰","🍫","🍩","🍿","🍺","🍷","🍸","🎉","🎊","🎈","🎮","🎯","🏆","🏵️","✊🏿","✊🏾","✊🏽","✊🏼","✊🏻","👍🏿","👍🏾","👍🏽","👍🏼","👍🏻","👋🏿","👋🏾","👋🏽","👋🏼","👋🏻","🏁","🚩","🏳️","🏴","🏳️‍🌈","🏳️‍⚧️","🇺🇸","🇨🇦","🇬🇧","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇧🇷","🇯🇵","🇰🇷","🇨🇳","🇮🇳","🇿🇦"];
    const emojiModal = document.getElementById('emojiModal');
    const emojiGrid  = document.getElementById('emojiGrid');
    const emojiSearch= document.getElementById('emojiSearch');
    const emojiClose = document.getElementById('emojiClose');
    window.emojiTarget = null;
    function openEmoji(targetId){ window.emojiTarget = document.getElementById(targetId); emojiSearch.value=''; renderEmojiGrid(''); emojiModal.classList.remove('hidden'); emojiSearch.focus(); }
    
    function closeEmoji(){
    window.emojiModal.classList.add('hidden');
    window.emojiTarget = null;

  // force a fresh preview on close as a safety net
  if (typeof render === 'function') render();
}
window.closeEmoji = closeEmoji;
    function renderEmojiGrid(q){ const norm=q.trim().toLowerCase(); emojiGrid.innerHTML=''; EMOJI_BIG.filter(e => !norm || e.toLowerCase().includes(norm)).forEach(e=>{ const b=document.createElement('button'); b.type='button'; b.className='h-9 text-lg rounded-md border hover:bg-neutral-50'; b.textContent=e; b.addEventListener('click', ()=>{
  if (window.emojiTarget) {
    window.emojiTarget.value = e;
    // fire 'input' so live preview updates immediately
    window.emojiTarget.dispatchEvent(new Event('input', { bubbles:true }));
  }
  closeEmoji();
});

emojiGrid.appendChild(b); }); }
    document.querySelectorAll('[data-emoji-target]').forEach(btn=> btn.addEventListener('click', ()=> openEmoji(btn.getAttribute('data-emoji-target'))));
    emojiSearch.addEventListener('input', ()=> renderEmojiGrid(emojiSearch.value));
    emojiClose.addEventListener('click', closeEmoji);
    emojiModal.addEventListener('click', (e)=>{ if(e.target===emojiModal) closeEmoji(); });

    // -------- Scale clickers --------
    function clamp(val,min,max){ return Math.min(max,Math.max(min,val)); }
    document.querySelectorAll('[data-stepper]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const targetId = btn.getAttribute('data-stepper');
        const delta = parseFloat(btn.getAttribute('data-delta')||'0');
        const input = document.getElementById(targetId);
        const v = parseFloat(input.value||'0') || 0;
        const step = parseFloat(input.step||'0.05') || 0.05;
        const min = parseFloat(input.min||'0.1') || 0.1;
        const max = parseFloat(input.max||'1') || 1;
        const next = clamp((Math.round((v + (delta||step))*100)/100), min, max);
        input.value = next.toFixed(2);
        input.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });

(async function(){

  // --- Load manifest (with inline fallback) ---
  let manifest;
  try {
    const res = await fetch('qr_type_manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest not found');
    manifest = await res.json();
  } catch (e) {
  // Fallback to a baked-in copy (keeps UI working if fetch fails)
  manifest = {
    types: {
      "URL": ["urlData"],
      "Payment": ["payMode","payUser","payLink","payAmount","payNote"],
      "WiFi": ["wifiSsid","wifiPwd","wifiSec","wifiHidden"],
      "Contact": [
        "vFirst","vLast","vOrg","vTitle",
        "vPhone1","vPhone1Type","vPhone2","vPhone2Type",
        "vEmail1","vEmail1Type","vEmail2","vEmail2Type",
        "vWebsite","vBday","vStreet","vCity","vRegion","vPostal","vCountry","vNote"
      ],
      "Message": ["msgMode","smsNumber","smsText"],
      "Event": ["evtTitle","evtStart","evtEnd","evtLoc","evtDet","evtStyle"],
      "Map": ["mapQuery","mapLat","mapLng","mapProvider"]
    },

    // ← THIS is the piece that makes buildField() happy
    fields: {
      urlData:    { type:'url',   label:'URL', placeholder:'https://example.org' },

      payMode:    { type:'select',label:'Payment Type',
                    options:['Venmo','Cash App','PayPal.me','Generic Link','Stripe Payment Link'] },
      payUser:    { type:'text',  label:'Username / $Cashtag / @handle', placeholder:'@yourname' },
      payLink:    { type:'url',   label:'Payment Link', placeholder:'https://…' },
      payAmount:  { type:'number',label:'Amount', step:'0.01', placeholder:'Optional' },
      payNote:    { type:'text',  label:'Note',   placeholder:'Optional' },

      wifiSsid:   { type:'text',  label:'Network (SSID)' },
      wifiPwd:    { type:'text',  label:'Password' },
      wifiSec:    { type:'select',label:'Security', options:['WPA','WEP','nopass'] },
      wifiHidden: { type:'checkbox', label:'Hidden SSID' },

      vFirst:     { type:'text',  label:'First name' },
      vLast:      { type:'text',  label:'Last name' },
      vOrg:       { type:'text',  label:'Organization' },
      vTitle:     { type:'text',  label:'Title' },
      vPhone1:    { type:'tel',   label:'Phone' },
      vPhone1Type:{ type:'select',label:'Phone type', options:['CELL','WORK','HOME','MAIN'] },
      vPhone2:    { type:'tel',   label:'Phone 2' },
      vPhone2Type:{ type:'select',label:'Phone 2 type', options:['CELL','WORK','HOME','MAIN'] },
      vEmail1:    { type:'email', label:'Email' },
      vEmail1Type:{ type:'select',label:'Email type', options:['INTERNET','WORK','HOME'] },
      vEmail2:    { type:'email', label:'Email 2' },
      vEmail2Type:{ type:'select',label:'Email 2 type', options:['INTERNET','WORK','HOME'] },
      vWebsite:   { type:'url',   label:'Website', placeholder:'https://…' },
      vBday:      { type:'date',  label:'Birthday' },
      vStreet:    { type:'text',  label:'Street' },
      vCity:      { type:'text',  label:'City' },
      vRegion:    { type:'text',  label:'State/Region' },
      vPostal:    { type:'text',  label:'Postal code' },
      vCountry:   { type:'text',  label:'Country' },
      vNote:      { type:'textarea', rows:3, label:'Notes' },

      msgMode:    { type:'select',label:'Message Type', options:['SMS','Resistbot'] },
      smsNumber:  { type:'tel',   label:'Phone number', placeholder:'+1…' },
      smsText:    { type:'textarea', rows:2, label:'Message' },

      evtTitle:   { type:'text',  label:'Title' },
      evtStart:   { type:'text',  label:'Start (YYYY-MM-DD HH:MM:SS)' },
      evtEnd:     { type:'text',  label:'End (YYYY-MM-DD HH:MM:SS)' },
      evtLoc:     { type:'text',  label:'Location' },
      evtDet:     { type:'textarea', rows:3, label:'Details' },
      evtStyle:   { type:'select',label:'Style', options:['Basic'] },

      mapQuery:   { type:'text',  label:'Search query', placeholder:'Statue of Liberty' },
      mapLat:     { type:'text',  label:'Latitude', placeholder:'40.6892' },
      mapLng:     { type:'text',  label:'Longitude', placeholder:'-74.0445' },
      mapProvider:{ type:'select',label:'Provider', options:['google','geo'] }
    }
  };
}

// after manifest = ... is set
window.manifest = manifest;

// optional helpers (put them right here too)
window.getTypeFields = (t) => {
  const root = (manifest.types && typeof manifest.types === 'object')
              ? manifest.types
              : manifest;
  const want = String(t || '').trim().toLowerCase();
  const key  = Object.keys(root).find(k => k.toLowerCase() === want) || t;
  return root[key] || [];
};

window.getPresets = (t) => {
  const presets = manifest.presets || {};
  const want    = String(t || '').trim().toLowerCase();
  const key     = Object.keys(presets).find(k => k.toLowerCase() === want) || t;
  return presets[key] || [];
};

  // --- helpers to create inputs ---
  function el(tag, props={}, children=[]){
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k,v])=>{
      if(k==='class') n.className = v;
      else if(k==='text') n.textContent = v;
      else if(k==='html') n.innerHTML = v;
      else if(v!==undefined && v!==null) n.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).forEach(c => { if(c) n.appendChild(c); });
    return n;
  }

  function buildField(id){
  const meta = (window.manifest?.fields || {})[id];
  if (!meta) { console.warn('No field meta for', id); return null; }
    const wrap = el('label', {class:'text-sm block'});
    const title = el('span', {class:'block mb-1', text: meta.label});
    let input;

    if(meta.type === 'select'){
      input = el('select', {id: id, class:'w-full rounded-md border px-3 py-2'});
      (meta.options||[]).forEach(opt => input.appendChild(el('option', {text: opt})));
    } else if(meta.type === 'checkbox'){
      // Inline checkbox layout
      const row = el('label', {class:'inline-flex items-center gap-2'});
      const cb  = el('input', {id:id, type:'checkbox', class:'rounded border'});
      row.appendChild(cb);
      row.appendChild(el('span', {class:'text-sm', text: meta.label}));
      return row; // checkbox returns its own row and skips "title"
    } else if(meta.type === 'textarea'){
      input = el('textarea', {id:id, rows: String(meta.rows||2), class:'w-full rounded-md border px-3 py-2'});
      if(meta.placeholder) input.setAttribute('placeholder', meta.placeholder);
    } else {
      // text / email / number / url
      input = el('input', {id:id, type: meta.type||'text', class:'w-full rounded-md border px-3 py-2'});
      if(meta.placeholder) input.setAttribute('placeholder', meta.placeholder);
      if(meta.step)        input.setAttribute('step', meta.step);
    }

    wrap.appendChild(title);
    wrap.appendChild(input);
    return wrap;
  }

  // --- render the form for a given Type ---
  const typeSel = document.getElementById('qrType');
  const details = document.getElementById('detailsPanel');

  function renderTypeForm(type){
    details.innerHTML = '';
    const ids = getTypeFields(type);
    console.log('renderTypeForm:', type, ids);
    
    if (!ids.length) {
  console.warn('[qr] Unknown type for manifest:', type);
}

    const frag = document.createDocumentFragment();

    // Simple heuristic grouping for prettier layout
    const grid = el('div', {class:'grid gap-3'});
    ids.forEach(fid => {
      grid.appendChild(buildField(fid));
    });
    frag.appendChild(grid);
    details.appendChild(frag);
    window.reflowStepper && window.reflowStepper();
  }

    // (Re)wire gates now that the form is present
    wireDesignGatesOnce._done = false;
    wireDesignGatesOnce();

    // Wire type-specific behaviors

    // ========= Subtype (Preset) wiring =========
const presetsByType = manifest.presets || {};
const currentPresetIdx = new Map();



function getPresets(type) {
  const list = presetsByType[type];
  return Array.isArray(list) ? list : [];
}

function setValAndFire(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') {
    el.checked = !!value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    el.value = String(value ?? '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function applyPreset(type, index = 0) {
  const list = getPresets(type);
  if (!list.length) return;

  // safe modulo
  const idx = ((index % list.length) + list.length) % list.length;
  currentPresetIdx.set(type, idx);
  const p = list[idx];

  // Map preset keys → control IDs (only set what’s present)
  if (p.campaign)            setValAndFire('campaign', p.campaign);
  if (p.captionColor)        setValAndFire('captionColor', p.captionColor);
  if (p.bodyColor)           setValAndFire('bodyColor', p.bodyColor);
  if (p.eyeRingColor)        setValAndFire('eyeRingColor', p.eyeRingColor);
  if (p.eyeCenterColor)      setValAndFire('eyeCenterColor', p.eyeCenterColor);
  if (p.bgColor)             setValAndFire('bgColor', p.bgColor);
  if (typeof p.bgTransparent === 'boolean')
                             setValAndFire('bgTransparent', p.bgTransparent);

  if (p.moduleShape)         setValAndFire('moduleShape', p.moduleShape);
  if (p.eyeRingShape)        setValAndFire('eyeRingShape', p.eyeRingShape);
  if (p.eyeCenterShape)      setValAndFire('eyeCenterShape', p.eyeCenterShape);

  if (p.modulesMode)         setValAndFire('modulesMode', p.modulesMode);
  if (p.modulesEmoji)        setValAndFire('modulesEmoji', p.modulesEmoji);
  if (p.modulesScale != null)setValAndFire('modulesScale', p.modulesScale);

  if (p.centerMode)          setValAndFire('centerMode', p.centerMode);
  if (p.centerEmoji)         setValAndFire('centerEmoji', p.centerEmoji);
  if (p.centerScale != null) setValAndFire('centerScale', p.centerScale);

  // Re-apply any UI gating then re-render
  if (typeof refreshModulesMode === 'function') refreshModulesMode();
  if (typeof refreshCenter === 'function')      refreshCenter();
  if (typeof render === 'function')             render();
}

// After the existing type-change listener (form rebuild), apply last/first preset
typeSel.addEventListener('change', () => {
  const t = typeSel.value;
  if (!currentPresetIdx.has(t)) currentPresetIdx.set(t, 0);
  applyPreset(t, currentPresetIdx.get(t));
});

// Arrow handlers
const prevBtn = document.getElementById('prevSubtype');
const nextBtn = document.getElementById('nextSubtype');

function cyclePreset(dir) {
  const t = typeSel?.value;
  if (!t) return;
  const list = getPresets(t);
  if (!list.length) return;

  const cur  = currentPresetIdx.get(t) ?? 0;
  const next = (cur + dir + list.length) % list.length;
  applyPreset(t, next);
}

prevBtn?.addEventListener('click', () => cyclePreset(-1));
nextBtn?.addEventListener('click', () => cyclePreset(1));

// Initial apply for the default type (after first renderTypeForm call)
const initialType = typeSel?.value;
if (initialType && getPresets(initialType).length) {
  currentPresetIdx.set(initialType, 0);
  applyPreset(initialType, 0);
}

    // Payment: toggle user vs link by mode
    const payMode = document.getElementById('payMode');
    const payUser = document.getElementById('payUser');
    const payLink = document.getElementById('payLink');
    function refreshPaymentMode(){
      if(!payMode) return;
      const m = payMode.value;
      const needsLink = (m==='Generic Link' || m==='Stripe Payment Link');
      if(payLink){ payLink.closest('label').style.display = needsLink ? 'block' : 'none'; }
      if(payUser){ payUser.closest('label').style.display = needsLink ? 'none'  : 'block'; }
    }
    if(payMode){
      payMode.addEventListener('change', refreshPaymentMode);
      refreshPaymentMode();
    }

    // Message: Resistbot preset
    const msgMode = document.getElementById('msgMode');
    const smsNumber = document.getElementById('smsNumber');
    const smsText = document.getElementById('smsText');
    let personalNumber = '';
    function applyResistbot(){
      if(smsNumber && smsNumber.value && smsNumber.value !== '50409'){ personalNumber = smsNumber.value; }
      if(smsNumber){ smsNumber.value = '50409'; smsNumber.setAttribute('disabled','disabled'); }
      if(smsText && !smsText.value){ smsText.value = 'RESIST'; }
    }
    function restorePersonalIfNeeded(){
      if(!smsNumber) return;
      smsNumber.removeAttribute('disabled');
      if(smsNumber.value==='50409'){ smsNumber.value = personalNumber; }
    }
    if(msgMode){
      msgMode.addEventListener('change', ()=>{
        if(msgMode.value === 'Resistbot'){ applyResistbot(); }
        else { restorePersonalIfNeeded(); }
      });
    
  }

  // Initial render + on change
  renderTypeForm(typeSel.value);
  typeSel.addEventListener('change', ()=> renderTypeForm(typeSel.value));
})();

(function () {
  const $ = (id) => document.getElementById(id);

  // expose to the later script
  window.$ = $;
  window.preview = $("qrPreview");
  window.typeSel = $("qrType");

  window.colorHex = function (id, fallback) {
    const node = $(id);
    const v = (node && node.value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : (fallback || "#000000");
  };

  window.val = function (id) {
    const n = $(id);
    return n ? (n.type === "checkbox" ? n.checked : (n.value || "")) : "";
  };
})();

  // --- Build QR "text" for each Type (simple, pragmatic encoders for preview) ---
  function buildText(){
    const t = typeSel.value;
    switch(t){
      case "URL": {
        const u = val("urlData") || "https://example.org";
        return u;
      }
      case "Payment": {
        const mode = val("payMode");
        const user = val("payUser");
        const link = val("payLink");
        const amt  = val("payAmount");
        const note = val("payNote");
        const q = new URLSearchParams();
        if(amt) q.set("amount", amt);
        if(note) q.set("note", note);

        if(mode==="Generic Link" || mode==="Stripe Payment Link"){
          return link || "https://pay.example.com/your-link";
        }
        if(mode==="PayPal.me"){
          return `https://paypal.me/${(user||"yourname").replace(/^@/,"")}${amt?"/"+amt:""}`;
        }
        if(mode==="Venmo"){
          // venmo:// is not universally supported in scanners; https fallback:
          const u = (user||"yourname").replace(/^@/,"");
          return q.toString()
            ? `https://venmo.com/${u}?${q.toString()}`
            : `https://venmo.com/${u}`;
        }
        if(mode==="Cash App"){
          const u = (user||"$yourname");
          return q.toString()
            ? `https://cash.app/${u.replace(/^\$/,"$")}?${q.toString()}`
            : `https://cash.app/${u.replace(/^\$/,"$")}`;
        }
        return link || "https://example.org/pay";
      }
      case "WiFi": {
        const ssid = val("wifiSsid");
        const pwd  = val("wifiPwd");
        const sec  = val("wifiSec") || "WPA";
        const hid  = $("wifiHidden")?.checked ? "true" : "false";
        // WIFI:T:WPA;S:mynetwork;P:mypass;H:true;;
        return `WIFI:T:${sec};S:${ssid};P:${pwd};H:${hid};;`;
      }
      case "Contact": {
        // Minimal vCard 3.0 (keeps preview simple)
        const first = val("vFirst"), last = val("vLast");
        const org   = val("vOrg"),   title= val("vTitle");
        const phone = val("vPhone1"), email= val("vEmail1");
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${last||""};${first||""};;;`,
          `FN:${[first,last].filter(Boolean).join(" ")}`,
          org ? `ORG:${org}` : "",
          title ? `TITLE:${title}` : "",
          phone ? `TEL;TYPE=CELL:${phone}` : "",
          email ? `EMAIL;TYPE=INTERNET:${email}` : "",
          "END:VCARD"
        ].filter(Boolean).join("\n");
      }
      case "Message": {
        const num = val("smsNumber") || "5551234567";
        const txt = encodeURIComponent(val("smsText") || "Hello");
        // SMS URI (broadly supported): sms:+15551234567?&body=Hello
        return `sms:${num}?&body=${txt}`;
      }
      case "Event": {
        // Very light VEVENT for preview
        const title = val("evtTitle") || "Event";
        const start = (val("evtStart") || "2025-10-16 12:00:00").replace(/[-: ]/g,"").slice(0,14)+"Z";
        const end   = (val("evtEnd")   || "2025-10-16 13:00:00").replace(/[-: ]/g,"").slice(0,14)+"Z";
        const loc   = val("evtLoc") || "";
        const det   = val("evtDet") || "";
        return [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `SUMMARY:${title}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          loc ? `LOCATION:${loc}` : "",
          det ? `DESCRIPTION:${det}` : "",
          "END:VEVENT",
          "END:VCALENDAR"
        ].filter(Boolean).join("\n");
      }
      case "Map": {
        const q   = val("mapQuery");
        const lat = val("mapLat");
        const lng = val("mapLng");
        const prov= val("mapProvider");
        if(lat && lng){
          if(prov==="geo"){ return `geo:${lat},${lng}`; }
          // default to Google maps link
          return `https://maps.google.com/?q=${lat},${lng}`;
        }
        return q ? `https://maps.google.com/?q=${encodeURIComponent(q)}` : "https://maps.google.com";
      }
      default:
        return "LGBTQRCode";
    }
  }

// === Custom QR → SVG helpers ============================================

// Build a boolean matrix from qrcode.js (rows × cols)
function getMatrix(text, level) {
  if (!window.QRCode || !QRCode.CorrectLevel) {
    console.warn("QRCode lib not ready");
    return null;
  }
  const tmp = document.createElement('div');
  const lvl = QRCode.CorrectLevel[level] ? level : 'M';
  let inst;
  try {
    inst = new QRCode(tmp, { text, width: 1, height: 1, correctLevel: QRCode.CorrectLevel[lvl] });
  } catch (e) {
    console.error("QRCode ctor failed:", e);
    return null;
  }
  const qrm = inst && inst._oQRCode;
  if (!qrm || typeof qrm.getModuleCount !== 'function') {
    console.error("QRCode matrix missing (_oQRCode undefined)");
    return null;
  }
  const n = qrm.getModuleCount();
  const mat = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => qrm.isDark(r, c))
  );
  tmp.remove();
  return mat;
}

// ---------- caption helpers ----------
function normalizeCaption(s){
  return (s || "").replace(/\s+/g, " ").trim();
}

function measureSvgText(ns, family, weight, sizePx, text){
  // create a tiny offscreen SVG just for measuring
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.opacity = '0';
  svg.style.pointerEvents = 'none';

  const t = document.createElementNS(ns, 'text');
  t.setAttribute('x', '0');
  t.setAttribute('y', '0');
  t.setAttribute('font-family', family);
  t.setAttribute('font-weight', weight || '600');
  t.setAttribute('font-size', String(sizePx));
  t.textContent = text;

  svg.appendChild(t);
  document.body.appendChild(svg);
  const w = t.getBBox().width;   // now reliable
  svg.remove();
  return w;
}

function layoutCaptionLines(ns, {
  text,
  family,
  weight = '600',
  maxWidth,
  startSize,
  minSize,
  maxLines = 2,
  charBudget = 25,       // total characters across all lines
  twoLineTrigger = 14    // if > this, prefer wrapping first
}) {
  const raw   = (text || '').replace(/\s+/g, ' ').trim();
  // enforce the *total* char budget first so layout stays predictable
  const s     = charBudget > 0 ? raw.slice(0, charBudget) : raw;

  const measure = (fs, str) => measureSvgText(ns, family, weight, fs, str);

  // Greedy wrap (<= maxLines) at a given font size
  function wrapAt(fs) {
    const words = s.split(' ');
    const lines = [];
    let line = '';

    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (measure(fs, test) <= maxWidth) {
        line = test;
      } else {
        if (line) { lines.push(line); line = words[i]; }
        else      { lines.push(words[i]); line = ''; } // single long “word”
      }
      if (lines.length === maxLines) {
        // shove the remainder into the last line and ellipsize if needed
        let rest = [line].concat(words.slice(i + 1)).filter(Boolean).join(' ');
        let clip = rest;
        while (clip && measure(fs, clip + '…') > maxWidth) clip = clip.slice(0, -1);
        lines[maxLines - 1] = clip ? (clip + '…') : (lines[maxLines - 1] + '…');
        return { ok: true, fs, lines };
      }
    }

    if (line) lines.push(line);

    const fits = lines.length <= maxLines &&
                 lines.every(l => measure(fs, l) <= maxWidth);

    return fits ? { ok: true, fs, lines } : { ok: false };
  }

  // Strategy: if “long-ish”, try wrapping first; else try single line first
  if (s.length > twoLineTrigger) {
    for (let fs = startSize; fs >= minSize; fs--) {
      const r = wrapAt(fs);
      if (r.ok) return { fontSize: r.fs, lines: r.lines };
    }
    for (let fs = startSize; fs >= minSize; fs--) {
      if (measure(fs, s) <= maxWidth) {
        return { fontSize: fs, lines: [s] };
      }
    }
  } else {
    for (let fs = startSize; fs >= minSize; fs--) {
      if (measure(fs, s) <= maxWidth) {
        return { fontSize: fs, lines: [s] };
      }
    }
    for (let fs = startSize; fs >= minSize; fs--) {
      const r = wrapAt(fs);
      if (r.ok) return { fontSize: r.fs, lines: r.lines };
    }
  }

  // Final fallback at min size: single clipped line
  let clip = s;
  while (clip && measure(minSize, clip + '…') > maxWidth) clip = clip.slice(0, -1);
  return { fontSize: minSize, lines: [clip ? clip + '…' : ''] };
}// Build an SVG element for the QR, including background, modules, and eyes
function buildQrSvg({
  text, size, level,
  modulesShape, bodyColor,
  bgColor, transparentBg,
  eyeRingColor, eyeCenterColor,
  eyeRingShape = 'Square',
  eyeCenterShape = 'Square',

  // Module fill mode + scale + emoji
  modulesMode = 'Shape',         // 'Shape' | 'Emoji'
  modulesScale = 0.9,            // 0.1..1
  modulesEmoji = '😀',

  // Center content
  centerMode = 'None',           // 'None' | 'Blank' | 'Emoji'
  centerScale = 0.9,             // 0.1..1
  centerEmoji = '😊',

  // NEW: caption-in-SVG
  showCaption = false,
  captionText = '',
  captionColor = '#000000',
  captionFontFamily = 'Work Sans, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", "Noto Sans", sans-serif',
  bare = false
}) {
  const ns   = "http://www.w3.org/2000/svg";
  const mat  = getMatrix(text, level);
  if (!mat) { throw new Error('QR matrix not ready'); }
  const n    = mat.length;
  const cell = Math.floor(size / n);
  const pad  = Math.floor((size - cell * n) / 2);
  const rRnd = Math.round(cell * 1); // rounded corner radius for modules/eyes

  const svg  = document.createElementNS(ns, 'svg');
  
  // ---- Caption pre-layout (compute height before drawing bg/modules) ----
const lineGap   = 1.12;
const marginX   = Math.round(size * 0.08);
const startSize = Math.round(size * 0.18);
const minSize   = Math.round(size * 0.10);

let capLayout = null;
let capPadTop = 0, capPadBot = 0;
let totalH = size;

if (showCaption) {
  const maxWidth = size - marginX * 2;
  capLayout = layoutCaptionLines(ns, {
    text:   captionText || "",
    family: captionFontFamily,
    weight: "600",
    maxWidth,
    maxLines: 2,
    startSize,
    minSize,
    charBudget: 30,
    twoLineTrigger: 14
  });

  capPadTop = Math.round(size * 0.18);
  capPadBot = Math.round(size * 0.08);
  const blockH = Math.round(capLayout.fontSize * (capLayout.lines.length * lineGap));
  totalH = size + capPadTop + blockH + capPadBot;
}

// Set canvas dimensions now that we know total height
svg.setAttribute('width',  size);
svg.setAttribute('height', totalH);
svg.setAttribute('viewBox', `0 0 ${size} ${totalH}`);
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

// ----- Card background + decorative frame stroke -----
const inset       = Math.round(size * 0.04);
const strokeWidth = Math.max(1, Math.round(size * 0.02));

// Derive corner radius from CSS so the SVG card matches the purple outline
let cornerRadius = Math.round(size * 0.07); // fallback
const host = document.getElementById('qrPreview');
if (host) {
  const cs    = getComputedStyle(host);
  const w     = host.clientWidth || parseFloat(cs.width) || size;
  const token = parseFloat(cs.getPropertyValue('--shape-corner-lg')) ||
                parseFloat(cs.borderTopLeftRadius) || 0;
  if (w > 0 && token > 0) {
    const scale = size / w;                 // CSS px → SVG units
    cornerRadius = Math.round(token * scale);
  }
}
// HARD CLAMP so rx never exceeds half the drawable side
const drawable = size - (inset + strokeWidth) * 2;
cornerRadius   = Math.max(1, Math.min(cornerRadius, Math.floor(drawable / 2)));

// If caption is ON => portrait (size × totalH); OFF => square (size × size)
const cardX = inset;
const cardY = inset;
const cardW = size - inset * 2;
const cardH = showCaption ? totalH : size;
// Filled background (skip if bare)
if (!bare && !transparentBg) {
   const bg = document.createElementNS(ns, 'rect');
   bg.setAttribute('x', cardX);
   bg.setAttribute('y', cardY);
   bg.setAttribute('width',  cardW);
   bg.setAttribute('height', cardH);
   bg.setAttribute('rx', cornerRadius);
   bg.setAttribute('ry', cornerRadius);
   bg.setAttribute('fill', bgColor);
   svg.appendChild(bg);
}

// Optional: a soft outer glow for the stroke
function ensureGlowDef() {
  let defs = svg.querySelector('defs');
  if (!defs) { defs = document.createElementNS(ns, 'defs'); svg.appendChild(defs); }
  let f = svg.querySelector('#frameGlow');
  if (!f) {
    f = document.createElementNS(ns, 'filter');
    f.setAttribute('id', 'frameGlow');
    f.innerHTML = `
      <feDropShadow dx="0" dy="0" stdDeviation="${Math.max(1, Math.round(size*0.02))}"
        flood-color="rgba(139,92,246,.35)" flood-opacity="1"/>
    `;
    defs.appendChild(f);
  }
  return 'url(#frameGlow)';
}

// Stroke frame (only when transparent background)
if (transparentBg) {
  const frame = document.createElementNS(ns, 'rect');
  frame.setAttribute('class', 'qr-frame');
  frame.setAttribute('x', cardX);
  frame.setAttribute('y', cardY);
  frame.setAttribute('width',  cardW);
  frame.setAttribute('height', cardH);
  frame.setAttribute('rx', cornerRadius);
  frame.setAttribute('ry', cornerRadius);
  frame.setAttribute('fill', 'none');
  svg.appendChild(frame);
}

// Helpers for drawing shapes
  const drawRect = (x, y, w, h, fill, rx = 0, ry = 0) => {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    if (rx || ry) { r.setAttribute('rx', rx); r.setAttribute('ry', ry); }
    r.setAttribute('fill', fill);
    return r;
  };
  const drawCircle = (cx, cy, r, fill) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', fill);
    return c;
  };

// --- Center cutout in *module* coordinates (odd size => whole cells, centered)
const cut = (() => {
  if (centerMode === 'None') return null;

  const baseFrac = 0.25;                  // <= fixed % of the QR
  const s = Math.max(1, Math.round(n * baseFrac));

  // force odd so we never bisect modules
  const side  = s % 2 ? s : (s - 1 || 1);
  const start = Math.floor((n - side) / 2);

  return {
    startRow: start,
    endRow:   start + side - 1,
    startCol: start,
    endCol:   start + side - 1,
    side
  };
})();

  // Data modules (skip the 3 finder 7×7 areas)
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('fill', bodyColor);

    const inFinder = (r, c) =>
    (r <= 6 && c <= 6) ||           // TL
    (r <= 6 && c >= n - 7) ||       // TR
    (r >= n - 7 && c <= 6);         // BL

    const inCenterCut = cut
        ? (r, c) =>
            r >= cut.startRow && r <= cut.endRow &&
            c >= cut.startCol && c <= cut.endCol
        : () => false;


    for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
        if (!mat[r][c] || inFinder(r, c) || inCenterCut(r, c)) continue;

        const x  = pad + c * cell;
        const y  = pad + r * cell;
        const cx = x + cell / 2;
        const cy = y + cell / 2;

        if (modulesMode === 'Emoji') {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', cx);
        t.setAttribute('y', cy);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        const fs = Math.max(1, cell * modulesScale);
        t.setAttribute('font-size', String(fs));
        t.setAttribute('fill', bodyColor); // fallback if emoji renders as glyph
        t.setAttribute(
            'font-family',
            'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui, sans-serif'
        );
        t.textContent = modulesEmoji || '😀';
        g.appendChild(t);
        } else {
        // Shape mode with scale
        if (modulesShape === 'Circle') {
            const rScaled = (cell * 0.5) * modulesScale * 0.9; // small inset
            g.appendChild(drawCircle(cx, cy, rScaled, bodyColor));
        } else {
            const w  = cell * modulesScale;
            const h  = cell * modulesScale;
            const rx = modulesShape === 'Rounded' ? Math.min(rRnd, w * 0.3) : 0;
            g.appendChild(drawRect(cx - w/2, cy - h/2, w, h, bodyColor, rx, rx));
        }
        }
    }
    }
    svg.appendChild(g);

    // --- Center emoji (optional, no background) ---
    if (centerMode === 'Emoji' && cut) {
    const cx = size / 2;
    const cy = size / 2;

    // base width is the cleared square (in pixels) — fixed (~25% via cut)
    const cw = cut.side * cell;

    // cosmetic scale: allow 0.1 .. 1.5 (150%)
    const cScale = Math.max(0.1, Math.min(3, parseFloat(centerScale) || 1));

    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', cx);
    t.setAttribute('y', cy);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');

    // scale the emoji relative to the cleared square
    t.setAttribute('font-size', String(Math.floor(cw * 0.7 * cScale)));

    t.setAttribute(
        'font-family',
        'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui, sans-serif'
    );
    t.textContent = centerEmoji || '😊';
    svg.appendChild(t);
    }

// --- Caption (multi-line, auto-fit, ellipsized) ---
if (showCaption && capLayout) {
  const y0 = size + capPadTop + capLayout.fontSize; // baseline of first line
  capLayout.lines.forEach((ln, i) => {
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", String(size / 2));
    t.setAttribute("y", String(y0 + i * capLayout.fontSize * lineGap));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "alphabetic");
    t.setAttribute("font-size", String(capLayout.fontSize));
    t.setAttribute("font-weight", "600");
    t.setAttribute("fill", captionColor);
    t.setAttribute("font-family", captionFontFamily);
    t.textContent = ln;
    svg.appendChild(t);
  });
}

function drawEye(atCol, atRow) {
  const x = pad + atCol * cell;
  const y = pad + atRow * cell;

  // Unique ids per-eye
  const uid = `eye_${atCol}_${atRow}`;
  const defs = (function ensureDefs(){
    let d = svg.querySelector('defs');
    if (!d) { d = document.createElementNS(ns, 'defs'); svg.appendChild(d); }
    return d;
  })();

  // --- ClipPath: confine all drawing to the 7×7 finder area
  let clip = svg.querySelector(`#clip_${uid}`);
  if (!clip) {
    clip = document.createElementNS(ns, 'clipPath');
    clip.setAttribute('id', `clip_${uid}`);
    const cp = document.createElementNS(ns, 'rect');
    cp.setAttribute('x', x);
    cp.setAttribute('y', y);
    cp.setAttribute('width',  7*cell);
    cp.setAttribute('height', 7*cell);
    defs.appendChild(clip);
    clip.appendChild(cp);
  }

  // --- Mask: outer shape = white (kept), inner shape = black (hole)
  let mask = svg.querySelector(`#mask_${uid}`);
  if (!mask) {
    mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', `mask_${uid}`);
    defs.appendChild(mask);

    // Paint the 7×7 area white first (mask "on")
    const on = document.createElementNS(ns, 'rect');
    on.setAttribute('x', x);
    on.setAttribute('y', y);
    on.setAttribute('width',  7*cell);
    on.setAttribute('height', 7*cell);
    on.setAttribute('fill', '#fff');
    mask.appendChild(on);

    // Inner hole (black = mask "off")
    if (eyeRingShape === 'Circle') {
      const hole = document.createElementNS(ns, 'circle');
      hole.setAttribute('cx', x + cell*3.5);
      hole.setAttribute('cy', y + cell*3.5);
      hole.setAttribute('r',  cell*2.5);    // inner edge
      hole.setAttribute('fill', '#000');
      mask.appendChild(hole);
    } else {
      const hole = document.createElementNS(ns, 'rect');
      hole.setAttribute('x', x + cell);
      hole.setAttribute('y', y + cell);
      hole.setAttribute('width',  5*cell);
      hole.setAttribute('height', 5*cell);
      const rx = (eyeRingShape === 'Rounded') ? rRnd : 0;
      if (rx) { hole.setAttribute('rx', rx); hole.setAttribute('ry', rx); }
      hole.setAttribute('fill', '#000');
      mask.appendChild(hole);
    }
  }

  // --- Group everything for this eye, clip to 7×7
  const gEye = document.createElementNS(ns, 'g');
  gEye.setAttribute('clip-path', `url(#clip_${uid})`);
  svg.appendChild(gEye);

  // Draw the ring as a FILLED shape, masked to create the hole
  if (eyeRingShape === 'Circle') {
    const outer = document.createElementNS(ns, 'circle');
    outer.setAttribute('cx', x + cell*3.5);
    outer.setAttribute('cy', y + cell*3.5);
    outer.setAttribute('r',  cell*3.5); // outer edge
    outer.setAttribute('fill', eyeRingColor);
    outer.setAttribute('mask', `url(#mask_${uid})`);
    gEye.appendChild(outer);
  } else {
    const outer = document.createElementNS(ns, 'rect');
    outer.setAttribute('x', x);
    outer.setAttribute('y', y);
    outer.setAttribute('width',  7*cell);
    outer.setAttribute('height', 7*cell);
    const rx = (eyeRingShape === 'Rounded') ? rRnd : 0;
    if (rx) { outer.setAttribute('rx', rx); outer.setAttribute('ry', rx); }
    outer.setAttribute('fill', eyeRingColor);
    outer.setAttribute('mask', `url(#mask_${uid})`);
    gEye.appendChild(outer);
  }

  // Center block stays exactly as before (no bleed)
  if (eyeCenterShape === 'Circle') {
    gEye.appendChild(drawCircle(x + cell*3.5, y + cell*3.5, cell*1.5, eyeCenterColor));
  } else {
    const rx = eyeCenterShape === 'Rounded' ? rRnd : 0;
    gEye.appendChild(drawRect(x + cell*2, y + cell*2, cell*3, cell*3, eyeCenterColor, rx, rx));
  }
}

  // TL, TR, BL
  drawEye(0, 0);
  drawEye(n - 7, 0);
  drawEye(0, n - 7);

  // keep the SVG centered and inside the mount
svg.style.display = 'block';
svg.style.maxWidth = '100%';
svg.style.height = 'auto';

  return svg;
}

// --- New: compose one portrait card SVG with bg/stroke, QR, and caption ---
function composeCardSvg({
  cardWidth,
  transparentBg,
  bgColor,
  captionText,
  captionColor,
  ecc,
  // QR look:
  modulesShape, bodyColor,
  eyeRingColor, eyeCenterColor,
  eyeRingShape, eyeCenterShape,
  modulesMode, modulesScale, modulesEmoji,
  centerMode, centerScale, centerEmoji,
}) {
  const NS = "http://www.w3.org/2000/svg";

  // Geometry constants (tweak safely)
  const CARD_ASPECT = 10 / 16;                     // 10:16 portrait
  const cardHeight  = Math.round(cardWidth / CARD_ASPECT);

  const OUTER_PAD   = Math.round(cardWidth * 0.06); // frame inset
  const QR_FRACTION = 0.62;                         // ~25–35% smaller than full-width
  const CAP_SIDE    = Math.round(cardWidth * 0.08);
  const CAP_TOPPAD  = Math.round(cardWidth * 0.05);
  const CAP_BOTPAD  = Math.round(cardWidth * 0.06);

  // Corner radius: read from CSS token so it matches the purple outline
  let RADIUS = Math.round(cardWidth * 0.07); // fallback
  const host2 = document.getElementById('qrPreview');
  if (host2) {
  const cs2    = getComputedStyle(host2);
  const w2     = host2.clientWidth || parseFloat(cs2.width) || cardWidth;
  const token2 = parseFloat(cs2.getPropertyValue('--shape-corner-lg')) ||
                 parseFloat(cs2.borderTopLeftRadius) || 0;

  if (w2 > 0 && token2 > 0) {
    const scale     = cardWidth / w2;                 // CSS px → SVG units
    const drawable  = cardWidth - OUTER_PAD * 2;      // inner rect width/height
    const maxRx     = Math.floor(drawable / 2);       // never exceed half
    RADIUS = Math.max(1, Math.min(Math.round(token2 * scale), maxRx));
  }
}

  // Outer SVG (the card)
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width',  String(cardWidth));
  svg.setAttribute('height', String(cardHeight));
  svg.setAttribute('viewBox', `0 0 ${cardWidth} ${cardHeight}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Background or stroke-only frame
  const frame = document.createElementNS(NS, 'rect');
  frame.setAttribute('class', 'qr-frame');
  frame.setAttribute('x', String(OUTER_PAD));
  frame.setAttribute('y', String(OUTER_PAD));
  frame.setAttribute('width',  String(cardWidth  - OUTER_PAD*2));
  frame.setAttribute('height', String(cardHeight - OUTER_PAD*2));
  frame.setAttribute('rx', String(RADIUS));
  frame.setAttribute('ry', String(RADIUS));
  if (!transparentBg) {
    frame.setAttribute('fill', bgColor);
  } else {
    frame.setAttribute('fill', 'none');
    // no inline stroke; CSS will style .qr-frame under .card--stroke
  }
  svg.appendChild(frame);

  // QR square placement (top-centered)
  const qrSize = Math.round(cardWidth * QR_FRACTION);
  const qrX = Math.round((cardWidth - qrSize) / 2);
  const qrY = OUTER_PAD;

  // Build the *inner* QR SVG with no caption and no background
  const innerQR = buildQrSvg({
    text: buildText(),
    size: qrSize,
    level: ecc,

    modulesShape, bodyColor,
    eyeRingColor, eyeCenterColor,
    eyeRingShape, eyeCenterShape,

    modulesMode, modulesScale, modulesEmoji,
    centerMode,  centerScale,  centerEmoji,

    // We compose the card/caption externally:
    showCaption:    false,
    transparentBg:  true,    // QR background off (we already drew the card)
    bgColor:        '#000000',// ignored when transparent
    bare:          true     // <- no bg, no stroke on the inner QR
  });

  // Place the inner <svg> at (x,y) inside the card
  innerQR.setAttribute('x', String(qrX));
  innerQR.setAttribute('y', String(qrY));
  innerQR.setAttribute('width',  String(qrSize));
  innerQR.setAttribute('height', String(qrSize));
  svg.appendChild(innerQR);

  // Caption region = everything under the QR down to the bottom inset
  const capY0     = qrY + qrSize + CAP_TOPPAD;
  const capX      = CAP_SIDE;
  const capWidth  = cardWidth - CAP_SIDE*2;
  const capMaxH   = (cardHeight - OUTER_PAD) - CAP_BOTPAD - capY0;

  // Fit up to two lines at the largest size that fits the width
  const lineGap   = 1.12;
  const startSize = Math.round(cardWidth * 0.16);
  const minSize   = Math.round(cardWidth * 0.095);

  const layout = layoutCaptionLines(NS, {
    text: captionText || '',
    family: getComputedStyle(document.body).fontFamily,
    weight: '600',
    maxWidth: capWidth,
    maxLines: 2,
    startSize,
    minSize,
    charBudget: 60,          // allow long captions
    twoLineTrigger: 16
  });

  // If two lines overflow the available height, reduce one step
  const neededH = layout.fontSize * (layout.lines.length * lineGap);
  if (neededH > capMaxH && layout.fontSize > minSize) {
    const layout2 = layoutCaptionLines(NS, {
      text: captionText || '',
      family: getComputedStyle(document.body).fontFamily,
      weight: '600',
      maxWidth: capWidth,
      maxLines: 2,
      startSize: layout.fontSize - 1,
      minSize,
      charBudget: 60,
      twoLineTrigger: 16
    });
    layout.fontSize = layout2.fontSize;
    layout.lines    = layout2.lines;
  }

  // Draw caption lines, centered
  if (layout.lines.length && layout.lines[0]) {
    const firstBase = capY0 + layout.fontSize; // baseline of line 1
    layout.lines.forEach((ln, i) => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(cardWidth/2));
      t.setAttribute('y', String(firstBase + i*layout.fontSize*lineGap));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'alphabetic');
      t.setAttribute('font-size', String(layout.fontSize));
      t.setAttribute('font-weight', '600');
      t.setAttribute('fill', captionColor || '#000');
      t.setAttribute('font-family', getComputedStyle(document.body).fontFamily);
      t.textContent = ln;
      svg.appendChild(t);
    });
  }

  return svg;
}

// --- One-time wiring for Background controls ---
let _bg_wired = false;
function wireBackgroundBindingsOnce() {
  if (_bg_wired) return;

  const pick  = document.getElementById('bgColor');
  const check = document.getElementById('bgTransparent');

  pick?.addEventListener('input',  updatePreviewBackground);
  pick?.addEventListener('change', updatePreviewBackground);
  check?.addEventListener('change', updatePreviewBackground);

  _bg_wired = true;
}

let _right_wired = false;
function wireRightAccordionBehaviorOnce() {
  if (_right_wired) return;

  const right = document.getElementById('stepper');
  if (!right) return;

  const captionCard     = right.querySelector('.step-card[data-step="caption"]');
  const designCard      = right.querySelector('.step-card[data-step="design"]');
  const mechanicalsCard = right.querySelector('.step-card[data-step="mechanicals"]');
  const finishCard      = right.querySelector('.step-card[data-step="finish"]');

  const designBtn      = designCard?.querySelector('[data-step-toggle]');
  const mechanicalsBtn = mechanicalsCard?.querySelector('[data-step-toggle]');
  const finishBtn      = finishCard?.querySelector('[data-step-toggle]');

  function setMode(mode) {
    right.classList.toggle('mech-active',   mode === 'mechanicals');
    right.classList.toggle('finish-active', mode === 'finish');
    if (mode === 'design') right.classList.remove('mech-active', 'finish-active');
  }

  const isOpen = (card) => {
  const panel = card?.querySelector('[data-step-panel]');
  // visible if it participates in layout
  return !!panel && panel.offsetParent !== null;
};

  designBtn     ?.addEventListener('click', () => setMode('design'));
  mechanicalsBtn?.addEventListener('click', () => setMode('mechanicals'));
  finishBtn     ?.addEventListener('click', () => setMode('finish'));

  setMode(isOpen(mechanicalsCard) ? 'mechanicals'
       : isOpen(finishCard)       ? 'finish'
       : 'design');

  _right_wired = true;
}

// ---- Start the app (single, centralized boot) ----
function boot() {
  // 1) Wire one-time bindings
  wireBackgroundBindingsOnce();
  wireRightAccordionBehaviorOnce();

// After your existing boot wiring:
refreshModulesMode?.();   // enables Emoji + Scale when “Emoji” is selected
refreshCenter?.();        // enables center Emoji + Scale when “Emoji” is selected
refreshBackground?.();    // applies Transparent toggle to the preview frame

document.getElementById('url')?.addEventListener('input', render);
document.getElementById('modulesMode')?.addEventListener('change', () => { refreshModulesMode?.(); render(); });
document.getElementById('centerMode')?.addEventListener('change',  () => { refreshCenter?.();     render(); });
document.getElementById('bgTransparent')?.addEventListener('change', () => { refreshBackground?.(); render(); });
document.getElementById('bgColor')?.addEventListener('input', () => { refreshBackground?.(); render(); });

  // 2) First-pass UI state (so fields/labels enable/disable correctly)
  try { refreshModulesMode?.(); } catch {}
  try { refreshBackground?.(); }  catch {}
  try { refreshCenter?.(); }      catch {}

  // 3) First render (next frame avoids layout thrash)
  requestAnimationFrame(() => {
    if (typeof render === 'function') render();
    // 4) Now allow focus styles/transitions
    document.documentElement.classList.add('ui-ready');
  });
}

// Run after DOM is ready (once)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

  // Toggle visual style on the preview card (for CSS glow/inset)
function render() {
  const preview = document.getElementById('qrPreview');
  const mount   = document.getElementById('qrMount');
  if (!preview || !mount) return;

  // Capture caption state early
const showCap = !!document.getElementById('showCaption')?.checked;
const caption = (document.getElementById('campaign')?.value || '').trim();

  // Toggle visual style (stroke vs fill card)
  const isTransparent = !!document.getElementById('bgTransparent')?.checked;
  preview.classList.toggle('card--stroke', isTransparent);
  preview.classList.toggle('card--fill',  !isTransparent);

  // Stable card width (height via CSS aspect-ratio)
  const rect      = preview.getBoundingClientRect();
  const cardWidth = Math.max(rect.width || preview.clientWidth || 320, 320);

  // Build composed SVG
  const ecc = document.getElementById('ecc')?.value || 'M';
  const svg = composeCardSvg({
    cardWidth,
    transparentBg: isTransparent,
    bgColor:        colorHex('bgColor', '#FFFFFF'),
    captionText:    showCap ? caption : '',      // ← only when checked
    captionColor:   colorHex('captionColor', '#000000'),
    ecc,

    // look controls
    modulesShape:   document.getElementById('moduleShape')?.value || 'Square',
    bodyColor:      colorHex('bodyColor',   '#000000'),
    eyeRingColor:   colorHex('eyeRingColor',   '#000000'),
    eyeCenterColor: colorHex('eyeCenterColor', '#000000'),
    eyeRingShape:   document.getElementById('eyeRingShape')?.value   || 'Square',
    eyeCenterShape: document.getElementById('eyeCenterShape')?.value || 'Square',

    modulesMode:    document.getElementById('modulesMode')?.value || 'Shape',
    modulesScale:   parseFloat(document.getElementById('modulesScale')?.value || '0.9'),
    modulesEmoji:   document.getElementById('modulesEmoji')?.value || '😀',

    centerMode:     document.getElementById('centerMode')?.value || 'None',
    centerScale:    parseFloat(document.getElementById('centerScale')?.value || '1'),
    centerEmoji:    document.getElementById('centerEmoji')?.value || '😊',
  });

  // MOUNT DEBUG
  console.log('✅ render() running:', { svg, cardWidth });

  // Paint
  mount.innerHTML = '';
  mount.appendChild(svg);
}

  // One-time lightweight listeners that re-render
  if (!render._wired) {
    document.addEventListener('input',  () => { clearTimeout(render._t); render._t = setTimeout(render, 30); });
    document.addEventListener('change', () => render());
    window.addEventListener('resize',  () => render());
    document.getElementById('qrType')?.addEventListener('change', () => setTimeout(render, 0));
    render._wired = true;
  }

// ----- Design panel gating (modules vs emoji) -----
function refreshModulesMode(){
  const mode      = document.getElementById('modulesMode')?.value || 'Shape';
  const emojiInp  = document.getElementById('modulesEmoji');   // emoji picker input
  const scaleInp  = document.getElementById('modulesScale');   // emoji scale input

  // Module "shape" control (whatever your id is — try these in order)
  const shapeSel  =
    document.getElementById('modules') ||
    document.getElementById('modulesShape') ||
    document.querySelector('[name="modules"]');

  // BODY color pair (hex + swatch). Use whatever ids you already have.
  const bodyHex   =
    document.getElementById('bodyHex') ||
    document.querySelector('[data-field="body"] input[type="text"]');
  const bodySwatch=
    document.getElementById('bodyColor') ||
    document.querySelector('[data-field="body"] input[type="color"]');

  // Rows for visual muting
  const emojiRow  = emojiInp?.closest('label');
  const scaleRow  = scaleInp?.closest('label');
  const shapeRow  = shapeSel?.closest('label');
  const bodyRow   = (bodyHex?.closest('label')) || (bodySwatch?.closest('label'));

  const isEmoji = (mode === 'Emoji');

  // Enable Emoji controls only in Emoji mode
  if (emojiInp)  emojiInp.disabled  = !isEmoji;
  if (emojiRow)  emojiRow.classList.toggle('field-muted', !isEmoji);
 

  // Disable SHAPE + BODY when Emoji is selected
  if (shapeSel)  shapeSel.disabled  = isEmoji;
  if (shapeRow)  shapeRow.classList.toggle('field-muted', isEmoji);

  if (bodyHex)    bodyHex.disabled   = isEmoji;
  if (bodySwatch) bodySwatch.disabled= isEmoji;
  if (bodyRow)    bodyRow.classList.toggle('field-muted', isEmoji);
}

function updatePreviewBackground() {
  const card = document.getElementById('qrPreview');
  const col  = document.getElementById('bgColor')?.value || '#FFFFFF';
  const isTransparent = !!document.getElementById('bgTransparent')?.checked;

  if (isTransparent) {
    card.classList.add('card--stroke');
    card.classList.remove('card--fill');
    card.style.removeProperty('--frame-color');
  } else {
    card.classList.add('card--fill');
    card.classList.remove('card--stroke');
    card.style.setProperty('--frame-color', col);
  }
}

// ----- Background gating (transparent toggle) -----
function refreshBackground() {
  // controls (be forgiving about the id spelling)
  const tgl    = document.getElementById('bgTransparent');
  const swatch = document.getElementById('bgColor');
  const hex    = document.getElementById('bgColorHex')
               || document.getElementById('bgHex')
               || document.getElementById('bghex');

  const isTransparent = !!tgl?.checked;

  // 1) Disable inputs
  if (hex)    hex.disabled    = isTransparent;
  if (swatch) swatch.disabled = isTransparent;

  // 2) Find the row that contains BOTH the color controls and the checkbox
  let row = swatch?.parentElement || hex?.parentElement || null;
  while (row && !row.querySelector?.('#bgTransparent')) row = row.parentElement;

  // 3) Mute just the left label and the color/hex pair (not the checkbox cell)
  const nameEl = row?.children?.[0] || null;
  const pairEl = (hex && swatch && hex.parentElement === swatch.parentElement)
    ? hex.parentElement
    : (hex?.parentElement || swatch?.parentElement || null);

  if (nameEl) nameEl.classList.toggle('field-muted', isTransparent);
  if (pairEl) pairEl.classList.toggle('field-muted', isTransparent);

  // 4) Update the preview card (fills vs stroke outline)
  updatePreviewBackground();
}

// wire once
document.getElementById('bgTransparent')?.addEventListener('change', () => {
  refreshBackground();
  if (typeof render === 'function') render();
});

function refreshCenter(){
  const mode = document.getElementById('centerMode')?.value || 'None';
  const emojiInp = document.getElementById('centerEmoji');
  const scaleInp = document.getElementById('centerScale');

  const emojiRow = emojiInp?.closest('label');
  const scaleRow = scaleInp?.closest('label');

  const isEmoji = (mode === 'Emoji');

  if (emojiInp) emojiInp.disabled = !isEmoji;
  if (scaleInp) scaleInp.disabled = !isEmoji;

  if (emojiRow) emojiRow.classList.toggle('field-muted', !isEmoji);
  if (scaleRow) scaleRow.classList.toggle('field-muted', !isEmoji);
}


// Gate wiring for “Modules fill” and “Center content” controls.
// It only marks _done AFTER the controls exist. If the form
// isn’t in the DOM yet (first paint / type switch), it retries.

function wireDesignGatesOnce() {
  if (wireDesignGatesOnce._done) return;

  const mm = document.getElementById('modulesMode');
  const cm = document.getElementById('centerMode');

  // Form not injected yet → try again next frame
  if (!mm || !cm) {
    requestAnimationFrame(wireDesignGatesOnce);
    return;
  }

  // Listeners (passive, and re-render after gating)
  mm.addEventListener('change', () => { refreshModulesMode(); render(); }, { passive: true });
  cm.addEventListener('change', () => { refreshCenter();      render(); }, { passive: true });

  const bt = document.getElementById('bgTransparent');
  bt?.addEventListener('change', () => { refreshBackground(); render(); }, { passive: true });

  // Initial gate state
  refreshModulesMode();
  refreshCenter();

  wireDesignGatesOnce._done = true;
}

// ---- Stable boot: after DOM and at next frame
window.addEventListener('DOMContentLoaded', () => {
  const mount   = document.getElementById('qrMount');
  const preview = document.getElementById('qrPreview');

  requestAnimationFrame(() => {
    if (typeof render === 'function') render();
  });
});

document.documentElement.classList.add('ui-ready');

// ----------------------------------------------------------
// Helper: add phone background to a *copy* of the SVG for export
// ----------------------------------------------------------
function applyPhoneBackgroundForExport(svgEl) {
  const card = document.getElementById('qrPreview');
  const cs   = getComputedStyle(card);

  const isTransparent = !!document.getElementById('bgTransparent')?.checked;
  const fillColor     = (cs.getPropertyValue('--frame-color') || '').trim() || '#FFFFFF';
  const radius        = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0;

  // Clean any previous rect we might have added (in case of repeated exports)
  svgEl.querySelector('[data-export-bg]')?.remove();

  if (isTransparent) return; // transparent preview => transparent export

  // Size from viewBox (fallback to DOM size if needed)
  const vb = (svgEl.getAttribute('viewBox') || `0 0 ${svgEl.clientWidth} ${svgEl.clientHeight}`)
               .split(/\s+/).map(Number);
  const [, , w, h] = vb;

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('data-export-bg', '1');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width',  String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(radius));
  rect.setAttribute('ry', String(radius));
  rect.setAttribute('fill', fillColor);

  // Ensure it’s the backmost node
  svgEl.insertBefore(rect, svgEl.firstChild);
}

// --- Export helpers ---
function getCurrentSvgNode() {
  return document.querySelector('#qrMount svg');
}

// --- SVG download
function downloadSvg(filename = 'qr.svg') {
  const src = getCurrentSvgNode();
  if (!src) return;

  const svg = src.cloneNode(true);       // don’t touch the live preview
  applyPhoneBackgroundForExport(svg);    // add background if needed

  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// --- PNG download (paint SVG to canvas)
async function downloadPng(filename = 'qr.png', scale = 3) {
  const src = getCurrentSvgNode();
  if (!src) return;

  const svg = src.cloneNode(true);
  applyPhoneBackgroundForExport(svg);    // <- inject here before serialization

  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));

  const img = new Image();

  // important for SVG-in-canvas
  img.crossOrigin = 'anonymous';

  await new Promise(res => { img.onload = res; img.src = url; });

  const w = img.naturalWidth  || parseInt(svg.getAttribute('width'))  || 512;
  const h = img.naturalHeight || parseInt(svg.getAttribute('height')) || 512;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    const dl = document.createElement('a');
    dl.href = URL.createObjectURL(blob);
    dl.download = filename;
    dl.click();
    URL.revokeObjectURL(dl.href);
  }, 'image/png');
}  

  // get caption or default
  const caption = document.getElementById('campaign')?.value?.trim() || 'LGBTQRCode';

  // sanitize filename (remove illegal chars, trim spaces)
  const safeName = caption
    .replace(/[^\w\d-_]+/g, '_')   // replace spaces/punctuation with _
    .replace(/^_+|_+$/g, '')       // trim leading/trailing underscores
    .substring(0, 40);             // limit to 40 chars max

  const base = safeName || 'okQRal';

// --- Sheets reporter (anonymous, no PII) ---
const REPORT_URL = 'https://script.google.com/macros/s/AKfycby5kbQ1oEM6WedWRn5jwVVreSXp84njT797uZloY_Zpcw96kYjfBD--wsVv7u3iQ67cTA/exec';

// tiny anon IDs (local/session only)
function getAnonIds(){
  const LS = window.localStorage;
  let uid = LS.getItem('okqral_uid');
  if (!uid) { uid = Math.random().toString(36).slice(2) + Date.now().toString(36); LS.setItem('okqral_uid', uid); }
  // new session when tab opened
  if (!window.__okqral_sid) window.__okqral_sid = Math.random().toString(36).slice(2);
  return { uid, sid: window.__okqral_sid };
}

function getUtm(){
  const p = new URLSearchParams(location.search);
  const g = s => (p.get(s) || '');
  return {
    source: g('utm_source'), medium: g('utm_medium'), campaign: g('utm_campaign'),
    term: g('utm_term'), content: g('utm_content')
  };
}

function uaHints(){
  const uad = navigator.userAgentData || null;
  const brands = uad?.brands?.map(b => `${b.brand} ${b.version}`).join(', ') || '';
  return {
    brands,
    mobile: !!uad?.mobile,
    platform: uad?.platform || navigator.platform || '',
    ua: navigator.userAgent || '' // fallback string (fine for internal analytics)
  };
}

function netHints(){
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    downlink: c?.downlink ?? null,           // Mbps (approx)
    effectiveType: c?.effectiveType || '',   // '4g','3g'…
    rtt: c?.rtt ?? null,                      // ms (approx)
    saveData: !!c?.saveData
  };
}

function accPrefs(){
  return {
    darkPref: window.matchMedia?.('(prefers-color-scheme: dark)').matches || false,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
  };
}

function pwaState(){
  const m1 = window.matchMedia?.('(display-mode: standalone)').matches;
  const m2 = window.navigator?.standalone; // iOS
  return !!(m1 || m2);
}

async function reportExport() {
  try {
    const { uid, sid } = getAnonIds();

    const payload = {
      event: 'export',
      ts: Date.now(),

      // visit/session
      uid, sid,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      lang: navigator.language || '',
      langs: navigator.languages || [],

      // page + acquisition
      page: location.pathname,
      host: location.hostname,
      ref: document.referrer ? new URL(document.referrer).origin : '',
      utm: getUtm(),

      // theme + a11y prefs + runtime theme
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      prefs: accPrefs(),
      pwa: pwaState(),

      // device / env
      device: {
        ...uaHints(),
        hw: {
          memGB: navigator.deviceMemory ?? null,
          cores: navigator.hardwareConcurrency ?? null
        },
        touchPoints: navigator.maxTouchPoints ?? 0
      },

      // screen & viewport
      screen: {
        w: window.screen?.width ?? null,
        h: window.screen?.height ?? null,
        availW: window.screen?.availWidth ?? null,
        availH: window.screen?.availHeight ?? null,
        colorDepth: window.screen?.colorDepth ?? null,
      },
      viewport: {
        w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1,
        orient: (screen.orientation && screen.orientation.type) || ''
      },

      // network
      net: netHints(),

      // QR structure only (no design/mechanicals)
      qr: {
        type: document.getElementById('qrType')?.value || '',
        ecc:  document.getElementById('ecc')?.value  || '',
        modulesMode: document.getElementById('modulesMode')?.value || '',
        centerMode:  document.getElementById('centerMode')?.value  || '',
        showCaption: !!document.getElementById('showCaption')?.checked
      },

      // outputs
      outputs: {
        png: !!document.getElementById('wantPng')?.checked,
        svg: !!document.getElementById('wantSvg')?.checked
      }
    };

    // no-cors text/plain keeps it fire-and-forget
    await fetch(REPORT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (_) {
    /* silent */
  }
}

document.getElementById('exportBtn')?.addEventListener('click', async () => {
  const wantPng = document.getElementById('wantPng')?.checked;
  const wantSvg = document.getElementById('wantSvg')?.checked;

  // get caption or default
  const caption = document.getElementById('campaign')?.value?.trim() || 'okQRal';

  // sanitize filename
  const safeName = caption
    .replace(/[^\w\d-_]+/g, '_')   // replace spaces/punct with _
    .replace(/^_+|_+$/g, '')       // trim leading/trailing _
    .substring(0, 40);             // max 40 chars

  const base = safeName || 'okQRal';

  // log to Sheets (non-blocking)
  reportExport().catch(() => { /* silent */ });

  // then download(s)
  if (wantSvg) downloadSvg(`${base}.svg`);
  if (wantPng) downloadPng(`${base}.png`);
});

// ---------- Stepper / Accordion: one open at a time + inner scroll ----------
(function wireStepper() {
  const root     = document.getElementById('stepper');
  const finishEl = document.getElementById('finishCard');
  if (!root || !finishEl) return;

  const headers = Array.from(root.querySelectorAll('[data-step-toggle]'));
  const panels  = Array.from(root.querySelectorAll('[data-step-panel]'));

  function computeMaxPanelHeight() {
  // Try the CSS token first
  const css = getComputedStyle(document.documentElement);
  const park = parseFloat(css.getPropertyValue('--park-h')) || 520;

  // Constrain to viewport so it never overflows
  const safe = Math.max(240, Math.min(window.innerHeight - 120, park));
  return Math.round(safe);
}

function openOnly(index, opts = {}) {
  const focusHeader = opts.focusHeader ?? true;

  panels.forEach((p, i) => {
    const card   = headers[i]?.parentElement; // the card wrapper that contains the header
    const isOpen = i === index;

    // show/hide panel
    p.style.display = isOpen ? 'block' : 'none';

    // highlight card
    if (card) card.classList.toggle('is-open', isOpen);

    // scroll-frame for large panels only (Design/Mechanicals)
    // keep Caption & Finish free of inner scroll
    p.classList.remove('scroll-frame');
    p.style.maxHeight = '';

    const isBig = isOpen && i > 0 && i < panels.length - 1;
    if (isBig) {
      p.classList.add('scroll-frame');
      p.style.maxHeight = computeMaxPanelHeight() + 'px';
    }
  });

  // Optional: keep focus sensible
  if (focusHeader) headers[index]?.focus({ preventScroll: true });
}

    // Wire clicks (accordion behavior)
  headers.forEach((h, i) => {
    h.addEventListener('click',     () => openOnly(i));
    h.addEventListener('dblclick',  () => openOnly((i + 1) % panels.length));
  });

  // Keep sizes correct on resize (don’t steal focus)
  window.addEventListener('resize', () => {
    const openIndex = panels.findIndex(p => p.style.display !== 'none');
    if (openIndex >= 0) openOnly(openIndex, { focusHeader: false });
  });

  // Initial state (Caption open)
  openOnly(0); 
})();

// --- Safe boot: wait until both QRCode and render() exist ---
(function boot(tries = 0) {
  if (window.QRCode && typeof window.render === "function") {
    console.log("✅ booting render()");
    return window.render();
  }
  if (tries > 150) {
    console.error("Still waiting for QRCode/render() — check script order.");
    return;
  }
  setTimeout(() => boot(tries + 1), 80);
})();

// =======================================================
// Color picker ⇄ hex text sync (robust pairing, DOM-safe)
// =======================================================
(function bindColorHexSync(){
  const ready = () => {
    const toHex = (v) => {
      if (!v) return null;
      v = v.trim();
      // #RGB -> #RRGGBB
      const short = /^#([0-9a-f]{3})$/i;
      const full  = /^#([0-9a-f]{6})$/i;
      if (short.test(v)) {
        return '#' + v.slice(1).split('').map(c => c + c).join('').toUpperCase();
      }
      if (full.test(v)) return v.toUpperCase();
      return null;
    };

    // For each color input, find the best matching text input nearby
    document.querySelectorAll('input[type="color"]').forEach(colorEl => {
      // Try common wrappers first, then siblings
      const wrapper =
        colorEl.closest('.color-field, .field, .control, .form-row, .flex, .grid, div') || colorEl.parentElement;

      let textEl = wrapper && wrapper.querySelector('input[type="text"]');
      if (!textEl) {
        // Walk forward through siblings until we find a text input (covers many layouts)
        let n = colorEl.nextElementSibling;
        while (n) {
          if (n.matches?.('input[type="text"]')) { textEl = n; break; }
          const inner = n.querySelector?.('input[type="text"]');
          if (inner) { textEl = inner; break; }
          n = n.nextElementSibling;
        }
      }
      if (!textEl) return; // no pair found; skip silently

      // Initialize hex field from color if empty/invalid
      const initHex = toHex(textEl.value) || colorEl.value.toUpperCase();
      textEl.value = initHex;

      // Color → Hex
      colorEl.addEventListener('input', () => {
        textEl.value = colorEl.value.toUpperCase();
        if (typeof render === 'function') render();
      });

      // Hex → Color (on input/change/blur)
      const applyHex = () => {
        const hx = toHex(textEl.value);
        if (hx) {
          colorEl.value = hx;
          textEl.value = hx;
          if (typeof render === 'function') render();
        }
      };
      textEl.addEventListener('input',  applyHex);
      textEl.addEventListener('change', applyHex);
      textEl.addEventListener('blur',   applyHex);
    });
  };

    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();