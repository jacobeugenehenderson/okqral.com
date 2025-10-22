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

document.addEventListener("DOMContentLoaded", () => {
  // Sync with system preference on load
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }

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
}); 
    
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
    };
  }

// after manifest = ... is set
window.manifest = manifest;

// optional helpers (put them right here too)
window.getTypeFields = (t) => (manifest.types?.[t]) || (manifest[t]) || [];
window.getPresets    = (t) => (manifest.presets?.[t]) || [];
  
  // --- Field metadata (labels, input types, options, placeholders) ---
  const FIELD_META = {
    // URL
    urlData:      {label:'URL',        type:'text',    placeholder:'Your URL Here'},

    // Payment
    payMode:      {label:'Mode',       type:'select',  options:['Generic Link','Stripe Payment Link','PayPal.me','Venmo','Cash App']},
    payUser:      {label:'Username / Handle', type:'text', placeholder:'@name or $cashtag'},
    payLink:      {label:'Direct Link', type:'text',  placeholder:'https://…'},
    payAmount:    {label:'Amount',     type:'number',  step:'0.01', placeholder:'Optional'},
    payNote:      {label:'Note',       type:'text',    placeholder:'Optional'},

    // WiFi
    wifiSsid:     {label:'SSID',       type:'text'},
    wifiPwd:      {label:'Password',   type:'text'},
    wifiSec:      {label:'Security',   type:'select',  options:['WPA','WEP','nopass']},
    wifiHidden:   {label:'Hidden network', type:'checkbox'},

    // Contact
    vFirst:       {label:'First',      type:'text'},
    vLast:        {label:'Last',       type:'text'},
    vOrg:         {label:'Org',        type:'text'},
    vTitle:       {label:'Title',      type:'text'},
    vPhone1:      {label:'Phone 1',    type:'text'},
    vPhone1Type:  {label:'Type',       type:'select',  options:['CELL','WORK','HOME','MAIN']},
    vPhone2:      {label:'Phone 2',    type:'text'},
    vPhone2Type:  {label:'Type',       type:'select',  options:['WORK','HOME','CELL','MAIN']},
    vEmail1:      {label:'Email 1',    type:'email'},
    vEmail1Type:  {label:'Type',       type:'select',  options:['INTERNET','WORK','HOME']},
    vEmail2:      {label:'Email 2',    type:'email'},
    vEmail2Type:  {label:'Type',       type:'select',  options:['WORK','HOME','INTERNET']},
    vWebsite:     {label:'Website',    type:'url'},
    vBday:        {label:'Birthday',   type:'text',    placeholder:'YYYY-MM-DD'},
    vStreet:      {label:'Street',     type:'text'},
    vCity:        {label:'City',       type:'text'},
    vRegion:      {label:'State/Region', type:'text'},
    vPostal:      {label:'Postal',     type:'text'},
    vCountry:     {label:'Country',    type:'text'},
    vNote:        {label:'Notes',      type:'textarea', rows:2},

    // Message
    msgMode:      {label:'Mode',       type:'select',  options:['Personal','Resistbot']},
    smsNumber:    {label:'Phone #',    type:'text'},
    smsText:      {label:'Message',    type:'text'},

    // Event
    evtTitle:     {label:'Title',      type:'text'},
    evtStart:     {label:'Starts (UTC)', type:'text',  placeholder:'YYYY-MM-DD HH:MM:SS'},
    evtEnd:       {label:'Ends (UTC)',   type:'text',  placeholder:'YYYY-MM-DD HH:MM:SS'},
    evtLoc:       {label:'Location',   type:'text'},
    evtDet:       {label:'Details',    type:'text'},
    evtStyle:     {label:'Link style', type:'select',  options:['Google Calendar','Hosted .ics (embedded)']},

    // Map
    mapQuery:     {label:'Query / Address', type:'text'},
    mapLat:       {label:'Lat',        type:'text'},
    mapLng:       {label:'Lng',        type:'text'},
    mapProvider:  {label:'Provider',   type:'select',  options:['Google','Apple','geo']}
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
    const meta = FIELD_META[id];
    if(!meta){ return null; }
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
    
    const frag = document.createDocumentFragment();

    // Simple heuristic grouping for prettier layout
    const grid = el('div', {class:'grid gap-3'});
    ids.forEach(fid => {
      grid.appendChild(buildField(fid));
    });
    frag.appendChild(grid);
    details.appendChild(frag);

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
  captionFontFamily = 'Work Sans, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, "Helvetica Neue", "Noto Sans", sans-serif'
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
const showStroke   = !!transparentBg;             // show frame only when BG is transparent
const inset        = Math.round(size * 0.04);     // margin from SVG edge (staging boundary)
const strokeWidth  = Math.max(1, Math.round(size * 0.02));
const cornerRadius = Math.round(size * 0.07);

// If caption is ON => portrait (size × totalH); OFF => square (size × size)
const cardX = inset;
const cardY = inset;
const cardW = size - inset * 2;
const cardH = showCaption ? totalH : size;

// Filled background (only when not transparent)
if (!transparentBg) {
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
  frame.setAttribute('x', cardX);
  frame.setAttribute('y', cardY);
  frame.setAttribute('width',  cardW);
  frame.setAttribute('height', cardH);
  frame.setAttribute('rx', cornerRadius);
  frame.setAttribute('ry', cornerRadius);
  frame.setAttribute('fill', 'none');
  frame.setAttribute('stroke', 'rgba(139,92,246,.8)');     // your frame color
  frame.setAttribute('stroke-width', String(strokeWidth));  // scales with size
  frame.setAttribute('filter', ensureGlowDef());            // subtle glow
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

// --- Draw into #qrMount using qrcode.js ---
function render() {
  window.render = render;
  wireDesignGatesOnce();

  const preview = document.getElementById('qrPreview');
  const mount   = document.getElementById('qrMount');
  if (!preview || !mount) return;

// Frame style mirrors “Transparent” checkbox
const isTransparent = !!document.getElementById('bgTransparent')?.checked;
preview.classList.toggle('card--stroke', isTransparent);
preview.classList.toggle('card--fill', !isTransparent);

// --- Width-driven sizing (stable: use the card width) ---
const rect = preview.getBoundingClientRect();
const cardWidth = Math.max(rect.width || preview.clientWidth || 320, 320);

// Choose how big the QR square should be *inside the card width*
const QR_FRACTION = 0.65;           // tweak 0.60–0.72 to taste
const inner = Math.max(16, Math.floor(cardWidth * QR_FRACTION));

// Safety guard
if (!inner || inner < 16) {
  requestAnimationFrame(render);
  return;
}

// --- Build QR ---
const captionOn = document.getElementById('showCaption')?.checked;
const ecc = document.getElementById('ecc')?.value || 'M';

let svg;
try {
  svg = buildQrSvg({
    text:           buildText(),
    size:           inner,           // ← use the ONE inner
    level:          ecc,

      // shapes & colors
      modulesShape:   document.getElementById('moduleShape')?.value || 'Square',
      bodyColor:      colorHex('bodyColor',   '#000000'),
      bgColor:        colorHex('bgColor',     '#FFFFFF'),
      transparentBg:  isTransparent,
      eyeRingColor:   colorHex('eyeRingColor',   '#000000'),
      eyeCenterColor: colorHex('eyeCenterColor', '#000000'),
      eyeRingShape:   document.getElementById('eyeRingShape')?.value   || 'Square',
      eyeCenterShape: document.getElementById('eyeCenterShape')?.value || 'Square',

      // module fill
      modulesMode:    document.getElementById('modulesMode')?.value || 'Shape',
      modulesScale:   parseFloat(document.getElementById('modulesScale')?.value || '0.9'),
      modulesEmoji:   document.getElementById('modulesEmoji')?.value || '😀',

      // center content
      centerMode:     document.getElementById('centerMode')?.value || 'None',
      centerScale:    2 * parseFloat(document.getElementById('centerScale')?.value || '1'),
      centerEmoji:    document.getElementById('centerEmoji')?.value || '😊',

      // caption
      showCaption:    captionOn,
      captionText:    document.getElementById('campaign')?.value || 'ENGAGE',
      captionColor:   colorHex('captionColor', '#000000'),
      captionFontFamily: getComputedStyle(document.body).fontFamily
    });
  } catch (e) {
    console.error('buildQrSvg failed; retry next frame:', e);
    requestAnimationFrame(render);
    return;
  }

  mount.innerHTML = '';
  mount.appendChild(svg);

  // one-time event wiring
  if (!render._wired) {
    document.addEventListener('input', () => {
      clearTimeout(render._t);
      render._t = setTimeout(render, 30);
    });
    document.addEventListener('change', () => render());
    window.addEventListener('resize', () => render());
    document.getElementById('qrType')?.addEventListener('change', () => setTimeout(render, 0));
    render._wired = true;
  }
}

// ---- Design panel gating (modules vs emoji, center content) ----
function refreshModulesMode(){
  const mode = document.getElementById('modulesMode')?.value || 'Shape';
  const emojiInp = document.getElementById('modulesEmoji');
  const scaleInp = document.getElementById('modulesScale');

  const emojiRow = emojiInp?.closest('label');
  const scaleRow = scaleInp?.closest('label');

  const emojiOn = (mode === 'Emoji');

  // enable/disable + visual mute
  if (emojiInp) emojiInp.disabled = !emojiOn;
  if (emojiRow) emojiRow.classList.toggle('field-muted', !emojiOn);

  // scale is always active
  if (scaleInp) scaleInp.disabled = false;
  if (scaleRow) scaleRow.classList.toggle('field-muted', false);
}

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

// --- Export helpers ---
function getCurrentSvgNode() {
  return document.querySelector('#qrMount svg');
}

// --- SVG download
function downloadSvg(filename = 'qr.svg') {
  const svg = getCurrentSvgNode();
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// --- PNG download (paint SVG to canvas)
async function downloadPng(filename = 'qr.png', scale = 3) {
  const svg = getCurrentSvgNode();
  if (!svg) return;

  // optional: solid background if transparent not checked
  const wantTransparent = document.getElementById('bgTransparent')?.checked;
  const bg = wantTransparent ? null : colorHex('bgColor', '#FFFFFF');

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

  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
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

// --- Hook up the Finish / Generate button ---
document.getElementById('exportBtn')?.addEventListener('click', async () => {
  const wantPng = document.getElementById('wantPng')?.checked;
  const wantSvg = document.getElementById('wantSvg')?.checked;

  // get caption or default
  const caption = document.getElementById('campaign')?.value?.trim() || 'LGBTQRCode';

  // sanitize filename (remove illegal chars, trim spaces)
  const safeName = caption
    .replace(/[^\w\d-_]+/g, '_')   // replace spaces/punctuation with _
    .replace(/^_+|_+$/g, '')       // trim leading/trailing underscores
    .substring(0, 40);             // limit to 40 chars max

  const base = safeName || 'LGBTQRCode';

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

  // Utility: compute maxHeight for the open panel so Finish stays visible
  function computeMaxPanelHeight(idx) {
    const rectRoot  = root.getBoundingClientRect();
    const stylesFin = getComputedStyle(finishEl);

    const finishH   = finishEl.offsetHeight
                    + parseFloat(stylesFin.marginTop || '0')
                    + parseFloat(stylesFin.marginBottom || '0');

    const stickyBottom = parseFloat(stylesFin.bottom || '0') || 0; // Tailwind bottom-4, etc.
    const extraGap     = 24; // breathing room
    const reserve      = finishH + stickyBottom + extraGap;

    // Expose the reserve as a CSS var for spacing if you want to use it in CSS
    root.style.setProperty('--finish-reserve', reserve + 'px');

    // Available height for the open panel's scroll frame
    const headerH = headers[idx]?.offsetHeight || 0;
    return Math.max(160, window.innerHeight - rectRoot.top - reserve - headerH);
  }

  function openOnly(index) {
    panels.forEach((p, i) => {
      const card = headers[i]?.parentElement; // the card wrapper that contains the header
      const isOpen = i === index;

      // show/hide panel
      p.style.display = isOpen ? 'block' : 'none';

      // highlight card
      if (card) card.classList.toggle('is-open', isOpen);

      // scroll-frame for large panels only (Design/Mechanicals),
      // keep Caption & Finish free of inner scroll
      p.classList.remove('scroll-frame');
      p.style.maxHeight = '';

      const isBig = isOpen && i > 0 && i < panels.length - 1;
      if (isBig) {
        p.classList.add('scroll-frame');
        p.style.maxHeight = computeMaxPanelHeight(i) + 'px';
      }
    });

    // Optional: keep focus sensible
    headers[index]?.focus({ preventScroll: true });
  }

  // Wire clicks (accordion behavior)
  headers.forEach((h, i) => {
    h.addEventListener('click', () => openOnly(i));
    // lil’ quality-of-life: double-click to jump to next
    h.addEventListener('dblclick', () => openOnly((i + 1) % panels.length));
  });

  // Keep sizes correct on resize
  window.addEventListener('resize', () => {
    const openIndex = panels.findIndex(p => p.style.display !== 'none');
    if (openIndex >= 0) openOnly(openIndex);
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
