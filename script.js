'use strict';
/* ===== LUNARA Food & Drinks : demo restoran (HTML + CSS + JS, data di localStorage) ===== */
const KEY = 'lunara_state_v1';
const IN_VIEWER = !!window.claude;
const STATUS = ['Menunggu Pembayaran', 'Diproses', 'Sedang Disiapkan', 'Siap Diambil', 'Dalam Pengantaran', 'Selesai', 'Dibatalkan', 'Siap Disajikan'];
const TYPES = [['dinein', 'Dine In'], ['pickup', 'Take Away'], ['delivery', 'Delivery']];
const typeName = t => (TYPES.find(x => x[0] === t) || ['', 'Take Away'])[1];
const CATS = ['Burger', 'Chicken', 'Rice Bowl', 'Sides', 'Drinks'];
const PAYS = [
  { id: 'cash', n: 'Tunai', g: 'Bayar di kasir / ke kurir', cash: true, grp: 'Tunai' },
  { id: 'bri', n: 'Transfer BRI', g: 'Transfer bank', bank: 'BRI', grp: 'Transfer Bank' },
  { id: 'bca', n: 'Transfer BCA', g: 'Transfer bank', bank: 'BCA', grp: 'Transfer Bank' },
  { id: 'bni', n: 'Transfer BNI', g: 'Transfer bank', bank: 'BNI', grp: 'Transfer Bank' },
  { id: 'qris', n: 'QRIS', g: 'Scan kode QR', bank: 'QRIS', grp: 'E-Wallet & QRIS' },
  { id: 'dana', n: 'DANA', g: 'Transfer e-wallet', bank: 'DANA', grp: 'E-Wallet & QRIS' },
  { id: 'ovo', n: 'OVO', g: 'Transfer e-wallet', bank: 'OVO', grp: 'E-Wallet & QRIS' },
  { id: 'gopay', n: 'GoPay', g: 'Transfer e-wallet', bank: 'GoPay', grp: 'E-Wallet & QRIS' },
];
/* nomor rekening / e-wallet default hanya CONTOH; admin menggantinya di Pengaturan */
function demoQR() { /* QR contoh untuk demo (bukan QRIS asli); admin bisa mengunggah QRIS asli di Pengaturan */
  const n = 25, F = [[0, 0], [0, n - 7], [n - 7, 0]]; let x = 12345, d = '';
  const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const f = F.find(([a, b]) => r >= a && r < a + 7 && c >= b && c < b + 7); let on;
    if (f) { const rr = r - f[0], cc = c - f[1]; on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); }
    else if ((r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8)) on = false; else on = rnd() > 0.5;
    if (on) d += 'M' + c + ' ' + r + 'h1v1h-1z';
  }
  return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 29 29"><rect x="-2" y="-2" width="29" height="29" fill="#fff"/><path d="' + d + '" fill="#0F2E27"/></svg>');
}
function defaultPay() {
  const nm = 'LUNARA FOOD & DRINKS';
  return {
    bri: { no: '1234-01-000001-50-1', name: nm, ex: false }, bca: { no: '123 456 7890', name: nm, ex: false }, bni: { no: '0123456789', name: nm, ex: false },
    dana: { no: '0812-1111-2233', name: nm, ex: false }, ovo: { no: '0813-2222-3344', name: nm, ex: false }, gopay: { no: '0852-3333-4455', name: nm, ex: false },
    qris: { img: demoQR(), demo: true, name: nm, ex: false },
  };
}
const DELIV_DEFAULT = () => [
  { id: 'own', n: 'Kurir LUNARA', g: 'Kurir toko', fee: 10000, eta: '25-35 mnt', on: true },
  { id: 'grab', n: 'GrabFood', g: 'Driver Grab', fee: 13000, eta: '30-40 mnt', on: true },
  { id: 'gofood', n: 'GoFood', g: 'Driver Gojek', fee: 13000, eta: '30-40 mnt', on: true },
  { id: 'shopee', n: 'ShopeeFood', g: 'Driver Shopee', fee: 12000, eta: '30-45 mnt', on: true },
  { id: 'maxim', n: 'Maxim Food', g: 'Driver Maxim', fee: 10000, eta: '35-45 mnt', on: true },
];
function ensureBrand() {
  const b = S.brand; if (!b) return;
  if (b.instagram == null) b.instagram = '@lunara.food';
  if (b.wa == null) b.wa = '0812-0000-0000';
  if (!Array.isArray(b.deliv)) b.deliv = DELIV_DEFAULT();
  if (!b.pay || typeof b.pay !== 'object') b.pay = defaultPay();
  const d = defaultPay(); for (const k in d) if (!b.pay[k]) b.pay[k] = d[k];
}
const waNum = v => { let d = digits(v); if (d.startsWith('0')) d = '62' + d.slice(1); else if (d.startsWith('8')) d = '62' + d; return d; };
const waLink = (v, text) => { const n = waNum(v); return n ? 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '') : ''; };
const igHandle = v => String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?].*$/, '').replace(/^@/, '');
const igLink = v => igHandle(v) ? 'https://instagram.com/' + igHandle(v) : '';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const pad = n => String(n).padStart(2, '0');
const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const fmt = ts => { try { return new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return new Date(ts).toString(); } };
const fmtDay = k => { const [y, m, d] = k.split('-').map(Number); try { return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return k; } };
const parseD = (s, end) => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return end ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime() : new Date(y, m - 1, d).getTime(); };
const inPeriod = (s, e, t = Date.now()) => { const a = parseD(s), b = parseD(e, true); return (a == null || t >= a) && (b == null || t <= b); };
const num = v => { const n = Number(String(v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0; };
const digits = s => String(s || '').replace(/\D/g, '');
function hashPin(salt, pin) { let x = 2166136261; const s = salt + ':' + pin + ':lunara'; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); }

function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg; t.setAttribute('role', type === 'err' ? 'alert' : 'status');
  const root = $('#toasts'); root.appendChild(t);
  while (root.children.length > 3) root.firstChild.remove();
  setTimeout(() => t.remove(), type === 'err' ? 4600 : 3000);
}
function sheet(html) {
  $('#sheetRoot').innerHTML = `<div class="backdrop" data-act="closeSheetBg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const f = $('#sheetRoot input:not([type=hidden]),#sheetRoot select,#sheetRoot textarea'); void f;
}
function closeSheet() { $('#sheetRoot').innerHTML = ''; pendingAsk = null; }
let pendingAsk = null;
function ask(title, msg, okLabel, fn, danger = true) {
  pendingAsk = fn;
  sheet(`<div class="sheet-h"><h3>${esc(title)}</h3></div><p class="muted" style="margin-bottom:16px">${esc(msg)}</p>
  <div class="row"><button class="btn line grow" data-act="closeSheet">Batal</button><button class="btn ${danger ? 'danger' : 'primary'} grow" data-act="askOk">${esc(okLabel)}</button></div>`);
}

/* ---------- ikon ---------- */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9a8 8 0 0 1 16 0z"/><path d="M3 13h18"/><path d="M5 17h14l-1 3H6z"/></svg>',
  orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

const _ic = (p, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 2}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
Object.assign(ICON, {
  chat: _ic('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>'),
  dash: _ic('<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
  ticket: _ic('<path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/>'),
  help: _ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>'),
  edit: _ic('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>'),
  chev: _ic('<path d="M9 5l7 7-7 7"/>', 2.2),
  card: _ic('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/>'),
  truck: _ic('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  box: _ic('<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
  check: _ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
});
/* ---------- logo orisinal: mahkota + hati di atas burger minimalis ---------- */
function logoMark(size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Logo LUNARA" xmlns="http://www.w3.org/2000/svg">
<path d="M20 15L18 5l8 5 6-7 6 7 8-5-2 10z" fill="#1E6F5C"/><circle cx="18" cy="5" r="2" fill="#E2C27D"/><circle cx="32" cy="3" r="2" fill="#E2C27D"/><circle cx="46" cy="5" r="2" fill="#E2C27D"/>
<path d="M12 37Q12 21 32 21Q52 21 52 37z" fill="#0F2E27"/>
<path d="M32 34C26 30 27 25 30.5 26c1 .3 1.5 1 1.5 1s.5-.7 1.5-1C37 25 38 30 32 34z" fill="#E2C27D"/>
<ellipse cx="20" cy="28" rx="2" ry="1" fill="#F8F5EC" transform="rotate(-25 20 28)"/><ellipse cx="44" cy="28" rx="2" ry="1" fill="#F8F5EC" transform="rotate(25 44 28)"/>
<rect x="10" y="39" width="44" height="5" rx="2.5" fill="#1E6F5C"/>
<path d="M10 48q4-4 8 0t8 0t8 0t8 0t8 0t4 0" fill="none" stroke="#E2C27D" stroke-width="3" stroke-linecap="round"/>
<path d="M12 51H52Q52 59 44 59H20Q12 59 12 51z" fill="#0F2E27"/></svg>`;
}
const logoFull = (size = 44, cls = '') => `<span class="lg ${cls}">${logoMark(size)}<span class="lt"><b>LUNARA</b><i>FOOD &amp; DRINKS</i></span></span>`;
/* ===== Ilustrasi makanan orisinal (SVG) : dipakai sebagai foto bawaan produk ===== */
const INK = '#0F2E27', ROSE = '#1E6F5C', BLUSH = '#E2C27D';
function wrapImg(inner, c1 = '#FAF6EA', c2 = '#D3E6D9') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="g" cx=".5" cy=".38" r=".85"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="62" cy="54" r="30" fill="#fff" opacity=".2"/><circle cx="352" cy="246" r="46" fill="#fff" opacity=".16"/><ellipse cx="200" cy="254" rx="132" ry="14" fill="${INK}" opacity=".13"/>${inner}</svg>`;
}
function burger(layers) {
  let y = 214, s = `<path d="M96 ${y - 2}H304V${y + 8}Q304 ${y + 30} 282 ${y + 30}H118Q96 ${y + 30} 96 ${y + 8}Z" fill="#D58A35"/>`;
  for (const L of layers) {
    const [t, c] = L.split(':');
    if (t === 'patty') { y -= 24; s += `<rect x="86" y="${y}" width="228" height="30" rx="15" fill="${c}"/>`; }
    else if (t === 'cheese') { y -= 10; s += `<path d="M92 ${y}H308L294 ${y + 22}L262 ${y + 8}L236 ${y + 26}L204 ${y + 8}L172 ${y + 24}L142 ${y + 8}L110 ${y + 22}Z" fill="#F7C948"/>`; }
    else if (t === 'lettuce') { y -= 8; s += `<path d="M88 ${y + 10}q14-16 28 0t28 0t28 0t28 0t28 0t28 0t28 0t28 0V${y + 16}H88Z" fill="#7DB46C"/>`; }
    else if (t === 'tomato') { y -= 8; s += `<ellipse cx="148" cy="${y + 8}" rx="38" ry="8" fill="#E4574B"/><ellipse cx="254" cy="${y + 8}" rx="38" ry="8" fill="#E4574B"/>`; }
    else if (t === 'fish') { y -= 24; s += `<rect x="92" y="${y}" width="216" height="30" rx="10" fill="#E8B96A"/><path d="M104 ${y + 9}h192" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>`; }
  }
  const top = y - 82;
  s += `<path d="M92 ${y + 6}Q92 ${top} 200 ${top}Q308 ${top} 308 ${y + 6}Z" fill="#E3993E"/><path d="M118 ${y - 14}Q128 ${top + 16} 176 ${top + 10}" stroke="#fff" stroke-opacity=".35" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  [[160, 22], [200, 16], [240, 22], [180, 42], [222, 40], [145, 46], [258, 46]].forEach(([x, d]) => { s += `<ellipse cx="${x}" cy="${top + d}" rx="7" ry="3.5" fill="#FAF6EA" transform="rotate(-20 ${x} ${top + d})"/>`; });
  return s;
}
const drum = (x, y, r, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="40" y="-7" width="46" height="14" rx="7" fill="#F4E3D3"/><circle cx="88" cy="-9" r="9" fill="#F4E3D3"/><circle cx="88" cy="9" r="9" fill="#F4E3D3"/><path d="M60 0C60-44 0-58-40-34-70-14-60 30-26 40 8 50 60 40 60 0Z" fill="${c}"/><path d="M-30-24q20-14 44-6" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="-10" cy="10" r="3" fill="#fff" opacity=".25"/><circle cx="12" cy="22" r="2.5" fill="#fff" opacity=".25"/></g>`;
const wing = (x, y, r, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-52 4C-52-26 6-40 44-22 66-10 56 22 30 28-10 38-52 34-52 4Z" fill="${c}"/><path d="M40-20q34-4 40 12-8 14-32 16z" fill="${c}"/><path d="M-34-6q22-14 50-6" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="-4" cy="14" r="3" fill="#FAF6EA" opacity=".6"/><circle cx="18" cy="6" r="2.5" fill="#FAF6EA" opacity=".6"/></g>`;
const nugget = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-38-14Q-40-34 -8-34Q30-38 38-14Q46 14 14 26Q-26 34-38 8Z" fill="#D9963B"/><path d="M-24-18q18-10 40-4" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
const fries = () => {
  let s = ''; const hs = [92, 70, 100, 78, 108, 66, 96, 84, 74];
  hs.forEach((h, i) => { const x = 140 + i * 15; s += `<rect x="${x}" y="${150 - h}" width="12" height="${h + 10}" rx="3" fill="${i % 2 ? '#F4C84A' : '#F7D460'}" transform="rotate(${(i - 4) * 3} ${x} 150)"/>`; });
  return s + `<path d="M126 140H274L260 252H140Z" fill="#1E6F5C"/><path d="M130 160H270L267 190H133Z" fill="#fff" opacity=".9"/><path d="M200 168l4 6 7 1-5 5 1 7-7-4-7 4 1-7-5-5 7-1z" fill="#1E6F5C"/>`;
};
const bowl = (sauce) => `<path d="M96 150H304Q304 238 200 238Q96 238 96 150Z" fill="#fff"/><path d="M96 150H304Q303 170 296 186H104Q97 170 96 150Z" fill="${BLUSH}"/><ellipse cx="200" cy="150" rx="108" ry="26" fill="#FFF8EF"/><ellipse cx="200" cy="140" rx="92" ry="22" fill="#FFFDF8"/>
<rect x="146" y="112" width="52" height="32" rx="11" fill="#D98A36" transform="rotate(-12 172 128)"/><rect x="200" y="106" width="52" height="32" rx="11" fill="#C9772B" transform="rotate(10 226 122)"/><rect x="170" y="126" width="48" height="28" rx="10" fill="#E0A04A" transform="rotate(4 194 140)"/>
${sauce ? '<path d="M130 126Q200 96 270 128" stroke="#C0392B" stroke-width="9" stroke-linecap="round" fill="none" opacity=".85"/><ellipse cx="258" cy="112" rx="10" ry="5" fill="#C0392B" transform="rotate(-30 258 112)"/>' : ''}
<circle cx="128" cy="142" r="7" fill="#7DB46C"/><circle cx="276" cy="140" r="7" fill="#7DB46C"/><circle cx="150" cy="156" r="5" fill="#E4574B"/><circle cx="252" cy="158" r="5" fill="#F7C948"/>`;
const wrapFood = () => `<g transform="rotate(-16 200 160)"><rect x="104" y="108" width="196" height="92" rx="46" fill="#F1D3A5"/><rect x="104" y="108" width="196" height="92" rx="46" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3"/><circle cx="288" cy="154" r="34" fill="#F6E3C0"/><circle cx="280" cy="140" r="9" fill="#7DB46C"/><circle cx="296" cy="158" r="8" fill="#E4574B"/><rect x="272" y="150" width="22" height="14" rx="6" fill="#D98A36"/><path d="M104 150h120v50H150Q104 200 104 150z" fill="#D3E6D9" opacity=".92"/><path d="M104 176h118" stroke="#fff" stroke-opacity=".6" stroke-width="3"/></g>`;
const mac = () => {
  let s = `<path d="M100 150H300Q300 236 200 236Q100 236 100 150Z" fill="#fff"/><path d="M100 150H300Q299 168 292 184H108Q101 168 100 150Z" fill="${BLUSH}"/><ellipse cx="200" cy="150" rx="102" ry="24" fill="#F4B33D"/>`;
  [[130, 146], [158, 138], [186, 146], [214, 138], [242, 146], [268, 140], [146, 156], [176, 158], [206, 156], [236, 158], [160, 126], [196, 124], [232, 126]].forEach(([x, y], i) => { s += `<path d="M${x} ${y}a9 9 0 1 1 16 0" fill="none" stroke="${i % 3 ? '#F2B63D' : '#F7CC5E'}" stroke-width="9" stroke-linecap="round"/>`; });
  return s + `<ellipse cx="200" cy="146" rx="80" ry="12" fill="#F7C948" opacity=".45"/><circle cx="170" cy="122" r="5" fill="#C0392B"/>`;
};
const rings = () => [[200, 196, 1], [172, 150, .9], [232, 148, .9]].map(([x, y, sc]) => `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse rx="64" ry="26" fill="none" stroke="#C98A2D" stroke-width="22"/><ellipse rx="64" ry="26" fill="none" stroke="#E7AE4A" stroke-width="16"/><path d="M-50-12q30-14 60-4" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/></g>`).join('');
const sausage = () => [[200, 160, -8, '#A8432A'], [200, 206, 6, '#B94E30']].map(([x, y, r, c]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-120" y="-24" width="240" height="48" rx="24" fill="${c}"/><path d="M-90-12q40-10 110-4" stroke="#fff" stroke-opacity=".3" stroke-width="6" fill="none" stroke-linecap="round"/>${[-70, -30, 10, 50, 90].map(g => `<path d="M${g} -22l14 44" stroke="#0F2E27" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>`).join('')}</g>`).join('') + `<path d="M120 112q20-18 40 0t40 0t40 0t40 0" fill="none" stroke="#F7C948" stroke-width="7" stroke-linecap="round"/>`;
function cup(color, o = {}) {
  const cream = o.cream ? `<path d="M144 108Q148 76 200 68Q252 76 256 108Z" fill="#fff"/><path d="M160 96Q200 82 240 96" stroke="${ROSE}" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="200" cy="60" r="9" fill="#C0392B"/>` : '';
  const lemon = o.lemon ? `<circle cx="266" cy="120" r="24" fill="#F7E27A" stroke="#E8C93C" stroke-width="5"/><path d="M266 100v40M246 120h40M252 106l28 28M280 106l-28 28" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>` : '';
  const bub = o.fizz ? [[170, 180], [200, 200], [226, 170], [190, 232], [236, 214]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".45"/>`).join('') : '';
  return `<path d="M142 118H258L246 252H154Z" fill="#fff" fill-opacity=".6" stroke="${INK}" stroke-opacity=".15" stroke-width="2"/><path d="M146 150H254L246 252H154Z" fill="${color}"/>${[[176, 196], [208, 214], [226, 168], [188, 232]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="22" rx="5" fill="#fff" opacity=".28" transform="rotate(14 ${x} ${y})"/>`).join('')}${bub}<rect x="134" y="106" width="132" height="14" rx="7" fill="${INK}"/><rect x="206" y="38" width="9" height="80" rx="4" fill="${ROSE}" transform="rotate(8 210 80)"/>${cream}${lemon}`;
}
const bottle = () => `<path d="M185 54h30v24l18 26v146a14 14 0 0 1-14 14h-38a14 14 0 0 1-14-14V104l18-26z" fill="#CFE8F5" fill-opacity=".85" stroke="#fff" stroke-width="3"/><rect x="183" y="40" width="34" height="18" rx="5" fill="${ROSE}"/><path d="M168 170h64v54h-64z" fill="#fff" opacity=".85"/><path d="M174 198q8-10 16 0t16 0t16 0" fill="none" stroke="#6FB1D6" stroke-width="4" stroke-linecap="round"/><path d="M178 118v46" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
const sc = (inner, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
const KINDS = {
  'b-chicken': [() => burger(['patty:#C58A3E', 'cheese', 'lettuce', 'tomato']), '#FAF6EA', '#D3E6D9'],
  'b-double': [() => burger(['patty:#6B3A2A', 'cheese', 'patty:#6B3A2A', 'cheese', 'lettuce']), '#FBF8EF', '#D3E6D9'],
  'b-beef': [() => burger(['patty:#5A2F22', 'lettuce', 'tomato']), '#FAF6EA', '#D3E6D9'],
  'b-cc': [() => burger(['patty:#C58A3E', 'cheese', 'cheese', 'lettuce']), '#FBF8EF', '#D3E6D9'],
  'b-fish': [() => burger(['fish', 'lettuce', 'tomato']), '#F4FAFF', '#D3E6D9'],
  'crispy': [() => drum(165, 156, -22, '#C9772B') + drum(232, 176, 14, '#D98A36'), '#FAF6EA', '#EBD9A8'],
  'bbq': [() => drum(165, 156, -22, '#8E3B1F') + drum(232, 176, 14, '#A24A26'), '#FAF6EA', '#D3E6D9'],
  'wings': [() => wing(160, 150, -14, '#C9772B') + wing(246, 160, 12, '#D98A36') + wing(200, 214, -4, '#B8651F'), '#FAF6EA', '#D3E6D9'],
  'nuggets': [() => nugget(150, 170, -12) + nugget(236, 160, 14) + nugget(196, 214, 4) + `<path d="M280 190h56l-6 44h-44z" fill="#fff"/><ellipse cx="308" cy="190" rx="28" ry="8" fill="#C0392B"/>`, '#FAF6EA', '#EBD9A8'],
  'fries': [fries, '#FBF8EF', '#D3E6D9'],
  'rice-spicy': [() => bowl(true), '#FAF6EA', '#D3E6D9'],
  'ricebowl': [() => bowl(false), '#FBF8EF', '#D3E6D9'],
  'sausage': [sausage, '#FAF6EA', '#EBD9A8'],
  'wrap': [wrapFood, '#FBF8EF', '#D3E6D9'],
  'mac': [mac, '#FBF8EF', '#EBD9A8'],
  'rings': [rings, '#FAF6EA', '#D3E6D9'],
  'cup-choc': [() => cup('#6B3A2A', { cream: true }), '#FBF8EF', '#D3E6D9'],
  'cup-lemon': [() => cup('#E7A93A', { lemon: true }), '#FFF9EA', '#D3E6D9'],
  'cup-cola': [() => cup('#3A1D12', { fizz: true }), '#FAF6EA', '#D3E6D9'],
  'cup-orange': [() => cup('#F08A24', { fizz: true }), '#FBF8EF', '#EBD9A8'],
  'bottle': [bottle, '#F4FAFF', '#D3E6D9'],
  'cup-milktea': [() => cup('#C99A6B'), '#FBF8EF', '#D3E6D9'],
  'cup-straw': [() => cup('#F48FB1', { cream: true }), '#FAF6EA', '#D3E6D9'],
  'cup-vanilla': [() => cup('#FFF0D0', { cream: true }), '#FAF6EA', '#D3E6D9'],
  'bundle-solo': [() => sc(burger(['patty:#C58A3E', 'cheese', 'lettuce', 'tomato']), -34, 56, .62) + sc(fries(), 112, 56, .5) + sc(cup('#E7A93A', { lemon: false }), 176, 46, .55), '#FBF8EF', '#D3E6D9'],
  'bundle-crispy': [() => sc(drum(165, 156, -22, '#C9772B') + drum(232, 176, 14, '#D98A36'), -50, 46, .62) + sc(bowl(false), 70, 60, .52) + sc(cup('#E7A93A', {}), 182, 48, .55), '#FAF6EA', '#EBD9A8'],
  'bundle-bestie': [() => sc(burger(['patty:#C58A3E', 'cheese', 'lettuce']), -50, 56, .5) + sc(burger(['patty:#6B3A2A', 'cheese', 'lettuce']), 30, 70, .5) + sc(cup('#E7A93A', {}), 140, 50, .5) + sc(cup('#F48FB1', {}), 214, 62, .5), '#FAF6EA', '#D3E6D9'],
};
const IMG_CACHE = {};
function foodImg(kind) {
  if (IMG_CACHE[kind]) return IMG_CACHE[kind];
  const k = KINDS[kind] || KINDS['b-chicken'];
  return IMG_CACHE[kind] = 'data:image/svg+xml;utf8,' + encodeURIComponent(wrapImg(k[0](), k[1], k[2]));
}
/* Foto otomatis dari folder images/ sesuai nama menu.
   Nama file yang dicoba: "Nama Menu.jpeg", "Nama Menu .jpeg", "nama-menu.jpeg" (juga .jpg .png .webp).
   Kalau nama file Anda beda dari nama menu, tulis di IMG_MAP di bawah ini. Kalau file tidak ada, dipakai ilustrasi bawaan. */
const IMG_MAP = {
  /* 'Nama Menu': 'nama file persis.jpeg', */
  'BBQ Chicken': 'BBQ Grilled Chicken Recipe.jpeg',
  'Strawberry Milk': 'Strawberyy Milk.jpeg',
  'Crispy Chicken': '_Crispy_Chicken_.jpeg',
  'Mineral Water': '_2.jpeg',
};
const IMG_EXT = ['jpeg', 'jpg', 'png', 'webp'];
const slug = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const imgList = n => {
  const L = []; if (IMG_MAP[n]) L.push(IMG_MAP[n]);
  [n, n + ' ', slug(n)].forEach(st => IMG_EXT.forEach(x => L.push(st + '.' + x)));
  return L.map(fn => 'images/' + encodeURIComponent(fn));
};
const imgOf = p => p.img || imgList(p.name)[0];
document.addEventListener('error', e => {
  const el = e.target; if (!el || el.tagName !== 'IMG') return;
  if (!el._c) {
    const src = el.getAttribute('src') || ''; if (!/^images\//.test(src)) return;
    let stem = ''; try { stem = decodeURIComponent(src.slice(7)).replace(/\.\w+$/, ''); } catch (x) { return; }
    const all = (S.products || []).concat(S.bundles || []);
    const o = all.find(it => imgList(it.name)[0] === src) || all.find(it => slug(it.name) === slug(stem));
    if (!o) return;
    el._c = imgList(o.name); el._i = el._c.indexOf(src); el._k = o.kind || 'bundle-solo';
  }
  el._i++;
  el.src = el._i < el._c.length ? el._c[el._i] : foodImg(el._k);
}, true);
/* ===== Data awal, penyimpanan, dan sesi ===== */
const OPT = {
  part: { id: 'part', label: 'Bagian Ayam', type: 'radio', choices: [['Dada', 0], ['Sayap', 0], ['Paha', 0]] },
  sauceB: { id: 'sauce', label: 'Saus', type: 'radio', choices: [['Original', 0], ['BBQ', 0], ['Mayo Pedas', 0]] },
  cheese: { id: 'extra', label: 'Tambahan', type: 'check', choices: [['Ekstra Keju', 5000]] },
  spice: { id: 'spice', label: 'Level Pedas', type: 'radio', choices: [['Tidak Pedas', 0], ['Sedang', 0], ['Pedas', 0], ['Extra Pedas', 3000]] },
  sauceC: { id: 'sauce', label: 'Saus', type: 'radio', choices: [['Saus Sambal', 0], ['Saus Tomat', 0], ['Mayo', 0], ['Tanpa Saus', 0]] },
  size: { id: 'size', label: 'Ukuran', type: 'radio', choices: [['Regular', 0], ['Large', 5000]] },
  ice: { id: 'ice', label: 'Es', type: 'radio', choices: [['Normal', 0], ['Sedikit Es', 0], ['Tanpa Es', 0]] },
};
const CAT_OPTS = { 'Burger': ['sauceB', 'cheese'], 'Chicken': ['spice', 'sauceC'], 'Rice Bowl': ['spice'], 'Sides': ['sauceC'], 'Drinks': ['size', 'ice'] };
const CAT_KIND = { 'Burger': 'b-chicken', 'Chicken': 'crispy', 'Rice Bowl': 'ricebowl', 'Sides': 'fries', 'Drinks': 'cup-lemon' };

function seed() {
  const P = (n, name, price, cat, stock, kind, desc, o = {}) => ({
    id: 'p' + n, name, desc, price, cat, stock, kind, img: o.img || '', active: true, best: !!o.best, isNew: !!o.isNew,
    promoPrice: o.promo || 0, promoStart: '', promoEnd: '', opts: o.opts || CAT_OPTS[cat].map(k => OPT[k]),
  });
  const adminSalt = uid(), accSalt = uid();
  return {
    v: 6,
    brand: { name: 'LUNARA Food & Drinks', tagline: 'Good Food, Brighter Days.', servicePct: 10, deliveryFee: 10000, lowStock: 5, address: 'Jln Besar Tembung,Gg.arridho no70', phone: '0812-0000-0000', hours: '10.00 - 22.00', instagram: '@lunara.food', wa: '0812-0000-0000', pay: defaultPay(), deliv: DELIV_DEFAULT() },
    products: [
      P(1, 'Lunara Chicken Burger', 39000, 'Burger', 40, 'b-chicken', 'Ayam crispy, selada segar, tomat, dan saus signature dalam roti lembut.', { best: 1 }),
      P(2, 'Crispy Chicken', 26000, 'Chicken', 50, 'crispy', 'Ayam goreng tepung renyah dengan bumbu rahasia, gurih sampai gigitan terakhir. Pilih bagian: dada, sayap, atau paha.', { best: 1, opts: [OPT.part, OPT.spice, OPT.sauceC] }),
      P(3, 'Double Cheese Burger', 52000, 'Burger', 30, 'b-double', 'Dua patty daging dengan dua lapis keju leleh dan selada.', { best: 1 }),
      P(4, 'Spicy Chicken Rice', 34000, 'Rice Bowl', 35, 'rice-spicy', 'Nasi hangat dengan potongan ayam crispy dan saus pedas manis.'),
      P(5, 'French Fries', 21000, 'Sides', 60, 'fries', 'Kentang goreng renyah bertabur garam, pas untuk dibagi.', { best: 1 }),
      P(6, 'Chicken Nuggets', 29000, 'Chicken', 40, 'nuggets', 'Nugget ayam empuk berlapis tepung emas, disajikan dengan saus pilihan.'),
      P(7, 'Beef Burger', 45000, 'Burger', 30, 'b-beef', 'Patty sapi juicy dengan selada, tomat, dan saus BBQ.'),
      P(8, 'Chicken Cheese Burger', 43000, 'Burger', 28, 'b-cc', 'Ayam crispy dengan keju cheddar ganda yang meleleh.'),
      P(9, 'BBQ Chicken', 29000, 'Chicken', 32, 'bbq', 'Ayam panggang berbumbu BBQ manis asap, lembut di dalam. Pilih bagian: dada, sayap, atau paha.', { opts: [OPT.part, OPT.spice, OPT.sauceC] }),
      P(10, 'Chicken Wings', 32000, 'Chicken', 25, 'wings', 'Sayap ayam goreng dengan bumbu pedas gurih, isi lima potong.'),
      P(11, 'Grilled Sausage', 22000, 'Sides', 36, 'sausage', 'Sosis sapi panggang dengan garis bakar dan saus mustard.'),
      P(12, 'Fish Burger', 38000, 'Burger', 22, 'b-fish', 'Fillet ikan crispy dengan selada dan tartar. Harga promo bulan ini.', { isNew: 1, promo: 33000 }),
      P(13, 'Chicken Wrap', 33000, 'Chicken', 26, 'wrap', 'Tortilla hangat berisi ayam, sayuran segar, dan saus creamy.', { isNew: 1 }),
      P(14, 'Mac & Cheese', 26000, 'Sides', 3, 'mac', 'Makaroni dengan saus keju kental yang creamy.', { opts: [OPT.cheese] }),
      P(15, 'Onion Rings', 21000, 'Sides', 30, 'rings', 'Bawang bombay goreng tepung, renyah di luar manis di dalam.'),
      P(16, 'Chicken Rice Bowl', 35000, 'Rice Bowl', 34, 'ricebowl', 'Nasi dengan ayam panggang, sayuran, dan saus teriyaki ringan.'),
      P(17, 'Iced Chocolate', 22000, 'Drinks', 45, 'cup-choc', 'Cokelat dingin pekat dengan whipped cream.'),
      P(18, 'Lemon Tea', 15000, 'Drinks', 60, 'cup-lemon', 'Teh segar dengan perasan lemon, manis seimbang.'),
      P(19, 'Cola', 14000, 'Drinks', 60, 'cup-cola', 'Cola dingin bersoda yang menyegarkan.'),
      P(20, 'Orange Soda', 15000, 'Drinks', 0, 'cup-orange', 'Soda jeruk berbuih dengan rasa jeruk manis.'),
      P(21, 'Mineral Water', 8000, 'Drinks', 80, 'bottle', 'Air mineral dingin 600 ml.', { opts: [] }),
      P(22, 'Iced Milk Tea', 20000, 'Drinks', 40, 'cup-milktea', 'Teh susu dingin dengan aroma teh yang kuat.'),
      P(23, 'Strawberry Milk', 24000, 'Drinks', 38, 'cup-straw', 'Susu stroberi manis dengan potongan buah dan cream.', { isNew: 1 }),
      P(24, 'Vanilla Milkshake', 28000, 'Drinks', 30, 'cup-vanilla', 'Milkshake vanila lembut dengan whipped cream dan ceri.', { isNew: 1, best: 1 }),
    ],
    bundles: [
      { id: 'b1', name: 'Lunara Solo', desc: 'Burger, kentang, dan minuman untuk makan sendiri.', price: 65000, kind: 'bundle-solo', items: [{ pid: 'p1', qty: 1 }, { pid: 'p5', qty: 1 }, { pid: 'p18', qty: 1 }], start: '', end: '', active: true },
      { id: 'b2', name: 'Crispy Box', desc: 'Ayam crispy, nasi, dan minuman.', price: 64000, kind: 'bundle-crispy', items: [{ pid: 'p2', qty: 1 }, { pid: 'p16', qty: 1 }, { pid: 'p18', qty: 1 }], start: '', end: '', active: true },
      { id: 'b3', name: 'Bestie Combo', desc: 'Dua burger dan dua minuman untuk berdua.', price: 95000, kind: 'bundle-bestie', items: [{ pid: 'p1', qty: 2 }, { pid: 'p18', qty: 2 }], start: '', end: '', active: true },
    ],
    vouchers: [
      { code: 'LUNARA10', type: 'percent', value: 10, min: 75000, max: 25000, start: '', end: '', active: true, used: 0 },
      { code: 'HEMAT10K', type: 'flat', value: 10000, min: 90000, max: 0, start: '', end: '', active: true, used: 0 },
      { code: 'FREEONGKIR', type: 'ship', value: 0, min: 100000, max: 0, start: '', end: '', active: true, used: 0 },
      { code: 'ONGKIR50K', type: 'ship', value: 0, min: 50000, max: 0, start: '', end: '', active: true, used: 0 },
      { code: 'WELCOME20', type: 'percent', value: 20, min: 50000, max: 20000, start: '', end: '', active: true, used: 0 },
      { code: 'WEEKEND15', type: 'percent', value: 15, min: 60000, max: 30000, start: '', end: '', active: true, used: 0 },
      { code: 'HEMAT20K', type: 'flat', value: 20000, min: 150000, max: 0, start: '', end: '', active: true, used: 0 },
    ],
    users: [{ id: 'u-admin', role: 'admin', name: 'Admin LUNARA', username: 'admin', salt: adminSalt, pin: hashPin(adminSalt, '6789'), created: Date.now() }],
    orders: [], stockLog: [], favs: {}, cart: [], counter: 0, session: null, rates: {}, deviceId: uid(), access: { salt: accSalt, pin: hashPin(accSalt, '2007') },
  };
}

let S = load();
if (!S.rates || typeof S.rates !== 'object') S.rates = {};
if (!S.deviceId) S.deviceId = uid();
if (!S.access) { const sl = uid(); S.access = { salt: sl, pin: hashPin(sl, '1234') }; }
ensureBrand();
if (!S.partMig) { S.partMig = true; S.products.forEach(p => { if (p.cat === 'Chicken' && ['Crispy Chicken', 'BBQ Chicken'].includes(p.name) && !(p.opts || []).some(g => g.id === 'part')) p.opts = [OPT.part, ...(p.opts || [])]; }); }
if ((S.v || 1) < 2) { S.v = 2; S.users.forEach(u => { if (u.role === 'admin') { u.salt = uid(); u.pin = hashPin(u.salt, '2468'); } }); } /* PIN sekarang 4 angka: PIN admin lama direset ke 2468 */
if ((S.v || 1) < 3) { S.v = 3; const ad = S.users.find(u => u.id === 'u-admin') || S.users.find(u => u.role === 'admin'); if (ad) { ad.salt = uid(); ad.pin = hashPin(ad.salt, '6789'); } const sl3 = uid(); S.access = { salt: sl3, pin: hashPin(sl3, '2007') }; } /* PIN pemilik 6789, PIN pelanggan 2007 */
if ((S.v || 1) < 4) { S.v = 4; /* harga dinaikkan ala restoran cepat saji; hanya harga bawaan yang belum diubah admin */
  const NP = {p1:[25000,39000],p2:[18000,26000],p3:[32000,52000],p4:[22000,34000],p5:[12000,21000],p6:[15000,29000],p7:[27000,45000],p8:[29000,43000],p9:[22000,29000],p10:[20000,32000],p11:[14000,22000],p12:[24000,38000],p13:[20000,33000],p14:[19000,26000],p15:[13000,21000],p16:[23000,35000],p17:[12000,22000],p18:[8000,15000],p19:[8000,14000],p20:[9000,15000],p21:[5000,8000],p22:[12000,20000],p23:[14000,24000],p24:[16000,28000]};
  S.products.forEach(p => { const m = NP[p.id]; if (m && p.price === m[0]) { p.price = m[1]; if (p.id === 'p12' && p.promoPrice === 20000) p.promoPrice = 33000; }
    (p.opts || []).forEach(g => (g.choices || []).forEach(c => { if (c[0] === 'Ekstra Keju' && c[1] === 3000) c[1] = 5000; if (c[0] === 'Extra Pedas' && c[1] === 1000) c[1] = 3000; if (c[0] === 'Large' && c[1] === 3000) c[1] = 5000; })); });
  const NB = { b1: [35000, 65000], b2: [30000, 64000], b3: [59000, 95000] };
  S.bundles.forEach(b => { const m = NB[b.id]; if (m && b.price === m[0]) b.price = m[1]; });
  S.vouchers.forEach(v => { if (v.code === 'LUNARA10' && v.min === 30000) { v.min = 75000; v.max = 25000; } if (v.code === 'HEMAT5K' && v.value === 5000) { v.code = 'HEMAT10K'; v.value = 10000; v.min = 90000; } if (v.code === 'FREEONGKIR' && v.min === 40000) v.min = 100000; });
  if (S.brand.servicePct === 5) S.brand.servicePct = 10; if (S.brand.deliveryFee === 8000) S.brand.deliveryFee = 10000;
  const nd = defaultPay(), pp = S.brand.pay || {}; ['dana', 'ovo', 'gopay'].forEach(k => { if (pp[k] && pp[k].ex && pp[k].no === '0812-0000-0000') pp[k] = nd[k]; });
}
if ((S.v || 1) < 5) { S.v = 5; const pp = S.brand.pay || {}; Object.values(pp).forEach(v => { v.ex = false; }); if (pp.qris && !pp.qris.img) { pp.qris.img = demoQR(); pp.qris.demo = true; } }
if ((S.v || 1) < 6) { S.v = 6; /* voucher tambahan: gratis ongkir lebih murah, diskon pelanggan baru, akhir pekan, potongan besar */
  [{ code: 'ONGKIR50K', type: 'ship', value: 0, min: 50000, max: 0 }, { code: 'WELCOME20', type: 'percent', value: 20, min: 50000, max: 20000 }, { code: 'WEEKEND15', type: 'percent', value: 15, min: 60000, max: 30000 }, { code: 'HEMAT20K', type: 'flat', value: 20000, min: 150000, max: 0 }]
    .forEach(nv => { if (!S.vouchers.some(v => v.code === nv.code)) S.vouchers.push({ ...nv, start: '', end: '', active: true, used: 0 }); }); }
if (S.brand && (S.brand.address === 'Jl. Contoh No. 1 (alamat demo)' || S.brand.address === 'Jl. Gatot Subroto No. 112, Medan')) S.brand.address = 'Jln Besar Tembung,Gg.arridho no70';
function load() {
  try { const r = localStorage.getItem(KEY); if (r) { const j = JSON.parse(r); if (j && Array.isArray(j.products) && Array.isArray(j.users)) return j; } } catch (e) { }
  return seed();
}
let saveWarned = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (!saveWarned) { saveWarned = true; toast('Penyimpanan browser penuh atau diblokir. Data hanya bertahan selama halaman terbuka.', 'err'); } }
}

/* ---------- rating makanan ---------- */
/* Nilai awal = data contoh untuk demo. Pelanggan terdaftar bisa menambah rating sendiri (satu suara per menu). */
const RATING_SEED = { p1: [4.8, 214], p2: [4.7, 187], p3: [4.9, 165], p4: [4.6, 98], p5: [4.7, 240], p6: [4.5, 121], p7: [4.7, 102], p8: [4.8, 88], p9: [4.6, 76], p10: [4.7, 93], p11: [4.4, 54], p12: [4.5, 41], p13: [4.6, 47], p14: [4.3, 38], p15: [4.4, 63], p16: [4.7, 110], p17: [4.8, 132], p18: [4.5, 175], p19: [4.3, 96], p20: [4.4, 29], p21: [4.2, 45], p22: [4.6, 82], p23: [4.7, 58], p24: [4.9, 119] };
function ratingOf(id) {
  const b = RATING_SEED[id] || [0, 0], v = Object.values((S.rates && S.rates[id]) || {});
  const n = b[1] + v.length; if (!n) return { avg: 0, n: 0 };
  return { avg: (b[0] * b[1] + v.reduce((a, x) => a + x, 0)) / n, n };
}
function rateLine(id) {
  const r = ratingOf(id);
  if (!r.n) return `<div class="rate"><span class="muted">Belum ada rating</span></div>`;
  return `<div class="rate" role="img" aria-label="Rating ${r.avg.toFixed(1)} dari 5, ${r.n} penilaian"><span class="stars" aria-hidden="true" style="--r:${(r.avg / 5 * 100).toFixed(0)}%">&#9733;&#9733;&#9733;&#9733;&#9733;</span><b>${r.avg.toFixed(1)}</b><span>(${r.n})</span></div>`;
}
function rateBox(id) {
  const me = myId(), mine = (me && S.rates[id] && S.rates[id][me]) || 0;
  return `${rateLine(id)}<div class="myrate" role="group" aria-label="Beri rating"><span class="muted sm-t">${mine ? 'Rating kamu' : 'Beri rating'}</span>${[1, 2, 3, 4, 5].map(i => `<button type="button" class="star ${i <= mine ? 'on' : ''}" data-act="rate" data-id="${id}" data-v="${i}" aria-label="${i} bintang">&#9733;</button>`).join('')}</div>`;
}

/* sesi */
const hasAdmin = () => !!(S.session && S.session.adminId && S.users.some(u => u.id === S.session.adminId && u.role === 'admin'));
const isAdmin = () => hasAdmin() && ui.view === 'admin'; /* mode admin = sedang di dashboard; sesi yang sama bisa balik ke pelanggan */
const curUser = () => S.users.find(u => u.id === (isAdmin() ? S.session.adminId : (S.session && S.session.userId)));
const myId = () => !S.session ? null : (isAdmin() ? S.session.adminId : S.session.userId);
const myName = () => { const u = curUser(); return u ? u.name : (S.session && S.session.name) || 'Tania'; };
const pinTaken = (pin, exceptId) => (S.access && S.access.pin === hashPin(S.access.salt, pin)) || S.users.some(u => u.role === 'admin' && u.id !== exceptId && u.pin === hashPin(u.salt, pin));
function toTop() { window.scrollTo(0, 0); const sc = $('#scroll'); if (sc) sc.scrollTop = 0; }
const isFav = id => (S.favs[myId()] || []).includes(id);
/* ===== Logika: harga, keranjang, voucher, pesanan, stok ===== */
const delivList = () => (S.brand.deliv || []).filter(x => x.on);
const delivBy = id => (S.brand.deliv || []).find(x => x.id === id);
const delivFee = id => { const d = delivBy(id); return d ? d.fee : (S.brand.deliveryFee || 0); };
const prod = id => S.products.find(p => p.id === id);
const bund = id => S.bundles.find(b => b.id === id);
const promoActive = p => p.promoPrice > 0 && p.promoPrice < p.price && inPeriod(p.promoStart, p.promoEnd);
const unit = p => promoActive(p) ? p.promoPrice : p.price;
const isLow = p => p.stock > 0 && p.stock <= S.brand.lowStock;
const bundleShown = b => b.active && inPeriod(b.start, b.end);
function bundleAvail(b) {
  if (!bundleShown(b)) return 0;
  let m = Infinity;
  for (const it of b.items) { const p = prod(it.pid); if (!p || !p.active) return 0; m = Math.min(m, Math.floor(p.stock / it.qty)); }
  return m === Infinity ? 0 : m;
}
const bundleNormal = b => b.items.reduce((s, it) => { const p = prod(it.pid); return s + (p ? unit(p) * it.qty : 0); }, 0);
const bundleImg = b => imgList(b.name)[0];
const voucherText = v => v.type === 'percent' ? `Diskon ${v.value}%${v.max ? ' (maks. ' + rp(v.max) + ')' : ''}` : v.type === 'flat' ? `Potongan ${rp(v.value)}` : 'Gratis ongkir (delivery)';

/* ----- stok ----- */
function adjustStock(pid, delta, reason) {
  const p = prod(pid); if (!p) return;
  const before = p.stock; p.stock = Math.max(0, p.stock + delta);
  S.stockLog.unshift({ ts: Date.now(), pid, name: p.name, from: before, to: p.stock, delta: p.stock - before, reason, by: myName() });
  if (S.stockLog.length > 300) S.stockLog.length = 300;
}
function cartNeed(cart) {
  const need = {};
  for (const l of cart) {
    if (l.t === 'p') need[l.id] = (need[l.id] || 0) + l.q;
    else { const b = bund(l.id); if (b) for (const it of b.items) need[it.pid] = (need[it.pid] || 0) + it.qty * l.q; }
  }
  return need;
}
function stockProblem(cart) {
  const need = cartNeed(cart);
  for (const pid in need) {
    const p = prod(pid);
    if (!p || !p.active) return `Produk "${p ? p.name : 'tidak dikenal'}" sudah tidak tersedia.`;
    if (need[pid] > p.stock) return p.stock <= 0 ? `${p.name} sudah habis.` : `Stok ${p.name} tersisa ${p.stock}, jumlah di keranjang ${need[pid]}.`;
  }
  return '';
}

/* ----- keranjang ----- */
const optPrice = o => (o || []).reduce((s, x) => s + (x[2] || 0), 0);
const optKey = o => (o || []).map(x => x[0] + '=' + x[1]).join(';');
function lineInfo(l) {
  if (l.t === 'p') {
    const p = prod(l.id); if (!p || !p.active) return null;
    return { l, name: p.name, img: imgOf(p), unit: unit(p) + optPrice(l.o), opts: (l.o || []).map(x => x[1]).join(', '), p };
  }
  const b = bund(l.id); if (!b || !bundleShown(b)) return null;
  return { l, name: b.name, img: bundleImg(b), unit: b.price, opts: b.items.map(it => { const p = prod(it.pid); return (it.qty > 1 ? it.qty + 'x ' : '') + (p ? p.name : '?'); }).join(', '), b };
}
function cleanCart() { S.cart = S.cart.filter(l => lineInfo(l)); }
function addToCart(t, id, opts, q = 1) {
  const item = t === 'p' ? prod(id) : bund(id);
  if (!item) return { ok: false, msg: 'Produk tidak ditemukan.' };
  if (t === 'p' && (!item.active || item.stock <= 0)) return { ok: false, msg: item.name + ' sudah habis.' };
  if (t === 'b' && bundleAvail(item) <= 0) return { ok: false, msg: item.name + ' sedang tidak tersedia.' };
  const key = t + id + '|' + optKey(opts);
  const copy = S.cart.map(l => ({ ...l }));
  const ex = copy.find(l => l.k === key);
  if (ex) ex.q += q; else copy.push({ k: key, t, id, q, o: opts || [] });
  const prob = stockProblem(copy);
  if (prob) return { ok: false, msg: prob };
  S.cart = copy; save();
  return { ok: true };
}
function setQty(i, q) {
  const l = S.cart[i]; if (!l) return;
  if (q <= 0) { S.cart.splice(i, 1); save(); return; }
  const copy = S.cart.map(x => ({ ...x })); copy[i].q = q;
  const prob = stockProblem(copy);
  if (prob) { toast(prob, 'err'); return; }
  S.cart = copy; save();
}
const cartCount = () => S.cart.reduce((s, l) => s + l.q, 0);
function defaultOpts(p) {
  const o = [];
  for (const g of p.opts || []) if (g.type === 'radio') { const c = g.choices[0]; o.push([g.label, c[0], c[1]]); }
  return o;
}

/* ----- voucher & total ----- */
function checkVoucher(code, subtotal, type) {
  code = String(code || '').trim().toUpperCase();
  if (!code) return { v: null, msg: '' };
  const v = S.vouchers.find(x => x.code === code);
  if (!v || !v.active) return { v: null, msg: 'Kode voucher tidak ditemukan atau tidak aktif.', err: true };
  if (!inPeriod(v.start, v.end)) return { v: null, msg: 'Periode voucher ' + v.code + ' sudah berakhir atau belum dimulai.', err: true };
  if (subtotal < v.min) return { v: null, msg: `Minimal belanja ${rp(v.min)} untuk memakai ${v.code}.`, err: true };
  if (v.type === 'ship' && type !== 'delivery') return { v, msg: 'Voucher gratis ongkir berlaku untuk delivery.', err: true, soft: true };
  return { v, msg: 'Voucher ' + v.code + ' dipakai: ' + voucherText(v) + '.' };
}
function totals(type, code, dv) {
  const rows = S.cart.map(lineInfo).filter(Boolean);
  const subtotal = rows.reduce((s, r) => s + r.unit * r.l.q, 0);
  const vc = checkVoucher(code, subtotal, type);
  let discount = 0, shipOff = false;
  if (vc.v && !vc.soft) {
    if (vc.v.type === 'percent') { discount = Math.floor(subtotal * vc.v.value / 100); if (vc.v.max) discount = Math.min(discount, vc.v.max); }
    else if (vc.v.type === 'flat') discount = Math.min(vc.v.value, subtotal);
    else if (vc.v.type === 'ship') shipOff = true;
  }
  const service = Math.round((subtotal - discount) * (S.brand.servicePct || 0) / 100);
  const baseShip = type === 'delivery' ? delivFee(dv) : 0;
  const delivery = shipOff ? 0 : baseShip;
  const shipDisc = shipOff ? baseShip : 0;
  return { rows, subtotal, discount, shipDisc, service, delivery, total: subtotal - discount + service + delivery, voucher: vc.soft ? null : vc.v, vmsg: vc.msg, verr: !!vc.err };
}

/* ----- pesanan ----- */
const finalStatus = s => s === 'Selesai' || s === 'Dibatalkan';
const stageList = type => ['Menunggu Pembayaran', 'Diproses', 'Sedang Disiapkan', type === 'delivery' ? 'Dalam Pengantaran' : type === 'dinein' ? 'Siap Disajikan' : 'Siap Diambil', 'Selesai'];
const statusesFor = o => [...stageList(o.type), 'Dibatalkan'];
const payCash = o => !!(PAYS.find(p => p.id === o.pay.id) || {}).cash;
const payCls = st => st === 'Lunas' ? 's5' : st === 'Menunggu Konfirmasi' ? 's1' : st === 'Belum Dibayar' ? 's0' : 's6';
const payPill = o => `<span class="pill pc ${payCls(o.pay.status)}">${esc(o.pay.status)}</span>`;
const typeLine = o => typeName(o.type) + (o.type === 'dinein' && o.customer.table ? ' &middot; Meja ' + esc(o.customer.table) : '') + (o.type === 'delivery' && o.deliv ? ' &middot; ' + esc(o.deliv.name) : '');
function nextOrderNo(ts) { S.counter = (S.counter || 0) + 1; const d = new Date(ts); return `LNR-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(S.counter).padStart(4, '0')}`; }
function logOrder(o, text) { o.log.push({ ts: Date.now(), text }); }

function createOrder({ type, customer, note, pay, code, userId, createdAt, deliv }) {
  cleanCart();
  if (type === 'delivery' && !deliv) deliv = (delivList()[0] || {}).id;
  const dvv = type === 'delivery' ? delivBy(deliv) : null;
  if (type === 'delivery' && (!dvv || !dvv.on)) return { ok: false, msg: 'Pilih layanan pengantaran.' };
  if (!S.cart.length) return { ok: false, msg: 'Keranjang masih kosong.' };
  if (!TYPES.some(t => t[0] === type)) return { ok: false, msg: 'Pilih Dine In, Take Away, atau Delivery.' };
  if (type === 'dinein' && !String(customer.table || '').trim()) return { ok: false, msg: 'Isi nomor meja untuk Dine In.' };
  if (!PAYS.some(p => p.id === pay)) return { ok: false, msg: 'Pilih metode pembayaran.' };
  const prob = stockProblem(S.cart); if (prob) return { ok: false, msg: prob };
  const T = totals(type, code, deliv);
  const vc = checkVoucher(code, T.subtotal, type);
  if (code && vc.err && !vc.soft) return { ok: false, msg: vc.msg };
  const ts = createdAt || Date.now();
  const need = cartNeed(S.cart);
  const o = {
    id: 'o' + uid(), no: nextOrderNo(ts), userId, createdAt: ts, type,
    customer: { name: customer.name, phone: '', address: type === 'delivery' ? customer.address : '', dnote: customer.dnote || '', table: type === 'dinein' ? String(customer.table || '').trim() : '' },
    note: note || '', deliv: dvv ? { id: dvv.id, name: dvv.n, eta: dvv.eta } : null,
    items: T.rows.map(r => ({ name: r.name, opts: r.opts, unit: r.unit, qty: r.l.q, kind: r.l.t })),
    subtotal: T.subtotal, discount: T.discount, shipDisc: T.shipDisc, voucher: T.voucher ? T.voucher.code : '', service: T.service, delivery: T.delivery, total: T.total,
    pay: { id: pay, name: PAYS.find(p => p.id === pay).n, status: 'Belum Dibayar', sim: false },
    status: 'Menunggu Pembayaran', deduct: Object.entries(need).map(([pid, qty]) => ({ pid, qty })), stockDeducted: false, log: [],
  };
  logOrder(o, 'Pesanan dibuat');
  for (const d of o.deduct) adjustStock(d.pid, -d.qty, 'Pesanan ' + o.no);
  o.stockDeducted = true;
  if (T.voucher) { const v = S.vouchers.find(x => x.code === T.voucher.code); if (v) v.used = (v.used || 0) + 1; }
  S.orders.unshift(o);
  S.cart = []; save();
  return { ok: true, order: o };
}
function setPaid(o) {
  if (finalStatus(o.status)) return;
  o.pay.status = 'Lunas'; o.pay.paidAt = Date.now(); logOrder(o, (payCash(o) ? 'Pembayaran tunai diterima' : 'Pembayaran ' + o.pay.name + ' dikonfirmasi') + (isAdmin() ? ' oleh ' + myName() : ''));
  if (o.status === 'Menunggu Pembayaran') { o.status = 'Diproses'; logOrder(o, 'Status: Diproses'); }
  save();
}
function reportPay(o) {
  if (finalStatus(o.status) || o.pay.status === 'Lunas' || payCash(o)) return false;
  o.pay.status = 'Menunggu Konfirmasi'; o.pay.reportedAt = Date.now(); logOrder(o, 'Pelanggan menyatakan sudah membayar, menunggu konfirmasi admin'); save(); return true;
}
function rejectPay(o) {
  if (finalStatus(o.status) || o.pay.status === 'Lunas') return false;
  o.pay.status = 'Belum Dibayar'; logOrder(o, 'Pembayaran belum diterima admin, pelanggan diminta cek ulang'); save(); return true;
}
function cancelOrder(o, reason) {
  if (finalStatus(o.status)) return false;
  if (o.stockDeducted) { for (const d of o.deduct) adjustStock(d.pid, d.qty, 'Pesanan dibatalkan ' + o.no); o.stockDeducted = false; }
  o.pay.status = o.pay.status === 'Lunas' ? 'Refund Diproses' : 'Dibatalkan';
  o.status = 'Dibatalkan'; logOrder(o, reason || 'Pesanan dibatalkan'); save();
  return true;
}
function setStatus(o, st) {
  if (!STATUS.includes(st) || finalStatus(o.status) || st === o.status) return { ok: false, msg: finalStatus(o.status) ? 'Pesanan yang sudah selesai atau dibatalkan tidak bisa diubah.' : '' };
  if (st === 'Dibatalkan') { cancelOrder(o, 'Dibatalkan oleh admin'); return { ok: true }; }
  if (!statusesFor(o).includes(st)) return { ok: false, msg: 'Status "' + st + '" tidak dipakai untuk pesanan ' + typeName(o.type) + '.' };
  if (st !== 'Menunggu Pembayaran' && o.pay.status !== 'Lunas') { o.pay.status = 'Lunas'; logOrder(o, 'Pembayaran ditandai lunas oleh admin'); }
  o.status = st; logOrder(o, 'Status: ' + st); save();
  return { ok: true };
}
const orderQty = o => o.items.reduce((s, i) => s + i.qty, 0);
const isPaid = o => o.pay.status === 'Lunas';
const sIdx = s => STATUS.indexOf(s);

/* ---------- chat pelanggan <-> admin (tersimpan di S.chats, tanpa WhatsApp) ---------- */
function chatThread(cid, name) {
  if (!S.chats || typeof S.chats !== 'object') S.chats = {};
  const t = S.chats[cid] || (S.chats[cid] = { name: name || 'Pelanggan', msgs: [], readC: 0, readA: 0 });
  if (name) t.name = name; return t;
}
const chatTime = ts => { const d = new Date(ts); return pad(d.getHours()) + '.' + pad(d.getMinutes()); };
const unreadC = cid => { const t = (S.chats || {})[cid]; return t ? t.msgs.filter(m => m.from === 'a' && !m.sys && m.ts > (t.readC || 0)).length : 0; };
const unreadAT = t => t.msgs.filter(m => m.from === 'c' && m.ts > (t.readA || 0)).length;
const unreadA = () => Object.values(S.chats || {}).reduce((s, t) => s + unreadAT(t), 0);
function sendChat(cid, from, text, order, name) {
  text = String(text || '').trim().slice(0, 500); if (!text) return false;
  const t = chatThread(cid, name), ts = Date.now();
  t.msgs.push({ id: uid(), from, text, ts, order: order || '' }); if (from === 'c') t.readC = ts; else t.readA = ts; save(); return true;
}
const chatCid = () => isAdmin() ? (ui.achat || (orderById(ui.aorder) || {}).userId) : myId();
const bubHTML = (m, me) => `<div class="bub ${m.from === me ? 'me' : ''}">${m.order ? `<span class="otag">${esc(m.order)}</span>` : ''}<p>${esc(m.text)}</p><small>${chatTime(m.ts)}</small></div>`;
function chatMsgsHTML() {
  const adm = isAdmin(), cid = chatCid(), t = (S.chats || {})[cid]; if (!t) return '';
  if (adm ? unreadAT(t) : unreadC(cid)) { if (adm) t.readA = Date.now(); else t.readC = Date.now(); save(); }
  return t.msgs.filter(m => !m.sys).map(m => bubHTML(m, adm ? 'a' : 'c')).join('');
}
const chatForm = (form, quick) => `<div class="chips" style="margin-top:8px">${quick.map(q => `<button class="chip" data-act="quickMsg" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div><form class="chatin" data-form="${form}"><input id="chatIn" name="text" type="text" maxlength="500" placeholder="Tulis pesan..." autocomplete="off"><button class="btn primary" type="submit">Kirim</button></form>`;
function vChat() {
  const cid = myId(), t = chatThread(cid, myName()), o = ui.chatOrder ? orderById(ui.chatOrder) : null;
  const html = chatMsgsHTML();
  return `<main class="page">${backBtn('Kembali', 'back')}<h2>Chat Toko</h2>${o ? `<div class="hint">Membahas pesanan <b>${esc(o.no)}</b> <button class="link" data-act="chatClearOrder">Lepas</button></div>` : ''}
  <section class="card"><div class="chatbox" id="chatBox" role="log" aria-live="polite">${html || '<p class="muted sm-t">Belum ada pesan. Tulis pesan di bawah.</p>'}</div>${chatForm('chatSend', ['Pesananku sudah sampai mana?', 'Pembayaran sudah saya transfer', 'Apakah menu ini tersedia?'])}</section></main>`;
}
function aChat() {
  if (ui.achat) {
    const cid = ui.achat, t = chatThread(cid), html = chatMsgsHTML(), mine = S.orders.filter(o => o.userId === cid).slice(0, 3);
    return `<button class="btn line sm" data-act="achatBack" style="align-self:flex-start">${ICON.back.replace('<svg', '<svg width="18" height="18"')} Semua chat</button><h2>${esc(t.name)}</h2>
    ${mine.length ? `<div class="chips">${mine.map(o => `<button class="chip" data-act="openOrder" data-id="${o.id}">${esc(o.no)} &middot; ${o.status}</button>`).join('')}</div>` : ''}
    <section class="card"><div class="chatbox" id="chatBox" role="log">${html || '<p class="muted">Belum ada pesan.</p>'}</div>${chatForm('chatSendA', ['Pesananmu sedang kami proses.', 'Pembayaran sudah kami terima. Terima kasih!', 'Mohon maaf, menu tersebut sedang habis.', 'Pesanan sedang diantar.', 'Pesanan sudah siap diambil.'])}</section>`;
  }
  const L = Object.entries(S.chats || {}).filter(([, t]) => t.msgs.some(m => !m.sys)).sort((a, b) => b[1].msgs[b[1].msgs.length - 1].ts - a[1].msgs[a[1].msgs.length - 1].ts);
  return `<h2>Chat Pelanggan</h2><p class="muted sm-t">Pesan pelanggan masuk di sini dan dibalas langsung dari dashboard, tanpa WhatsApp.</p><section class="card">${L.length ? L.map(([cid, t]) => { const m = t.msgs[t.msgs.length - 1], u = unreadAT(t); return `<button class="crowbtn" data-act="achatOpen" data-id="${esc(cid)}"><span><b>${esc(t.name)}</b>${u ? `<span class="badge-n">${u}</span>` : ''}<span class="muted sm-t" style="display:block">${esc(m.text.slice(0, 60))}</span></span><span class="muted sm-t">${chatTime(m.ts)}</span></button>`; }).join('') : '<p class="muted">Belum ada pesan dari pelanggan.</p>'}</section>`;
}
/* ---------- bar pindah mode: Pelanggan <-> Dashboard Admin tanpa keluar ---------- */
function modeBar(cur) {
  const n = hasAdmin() ? pendConfirm() + unreadA() : 0;
  return `<div class="modebar noprint" role="group" aria-label="Pilih tampilan"><button data-act="toCust" aria-pressed="${cur === 'cust'}">${ICON.user} Pelanggan</button><button data-act="toAdmin" aria-pressed="${cur === 'admin'}">${ICON.dash} Dashboard Admin${n ? `<span class="badge-n">${n}</span>` : ''}</button></div>`;
}
function unlockSheet() {
  sheet(`<div class="sheet-h"><h3>Masuk Dashboard Admin</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div><form class="stack" data-form="adminUnlock" novalidate><p class="muted">Masukkan PIN pemilik sekali saja. Setelah itu pindah Pelanggan &harr; Admin dari bar di atas tanpa keluar.</p><label class="f" for="au_p">PIN pemilik (4 angka)<input id="au_p" name="pin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" style="-webkit-text-security:disc;letter-spacing:.5em;font-size:22px;text-align:center"></label><div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Masuk</button></form>`);
  setTimeout(() => { const i = $('#au_p'); if (i) i.focus(); }, 60);
}
/* ===== Tampilan pelanggan ===== */
const ui = {
  view: 'splash', tab: 'home', sub: null, param: null,
  cat: 'Semua', q: '', price: 'all', onlyStock: false, onlyFav: false,
  draft: { type: 'dinein', pay: 'cash', voucher: '', note: '', name: '', phone: '', address: '', dnote: '', table: '', deliv: '' },
  ocf: 'all', chatOrder: '', achat: null, det: null, loginRole: 'cust', loginMode: 'in', loginErr: '', pin: '', lf: {}, fails: 0, lockUntil: 0, shake: false, atab: 'dash', pq: '', rep: { from: '', to: '' },
};

function go(view, extra = {}) { if ((view === 'login' || view === 'splash') && !('pin' in extra)) ui.pin = ''; Object.assign(ui, { view }, extra); ui.anim = true; render(); toTop(); }
function nav(tab, sub = null, param = null) { ui.view = 'shell'; ui.tab = tab; ui.sub = sub; ui.param = param; ui.anim = true; render(); toTop(); }

function render() {
  const a = $('#app');
  if (ui.view === 'admin' && !hasAdmin()) { ui.view = S.session ? 'shell' : 'login'; ui.pin = ''; }
  if (ui.view === 'shell' && !S.session) ui.view = 'login';
  if (ui.view === 'splash' || ui.view === 'login') a.innerHTML = vLock();
  else if (ui.view === 'admin') a.innerHTML = vAdmin();
  else a.innerHTML = vShell();
  const scr = $('#screen'); if (scr) scr.classList.toggle('onlock', ui.view === 'splash' || ui.view === 'login');
  if (ui.anim) { const m = $('main.page'); if (m) m.classList.add('enter'); ui.anim = false; }
  const cb = $('#chatBox'); if (cb) cb.scrollTop = cb.scrollHeight;
  tickClock();
}
function tickClock() {
  const d = new Date(), c1 = $('#clkDate'), c2 = $('#clkTime');
  if (c1) { try { c1.textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { c1.textContent = d.toDateString(); } }
  if (c2) c2.textContent = pad(d.getHours()) + '.' + pad(d.getMinutes()) + '.' + pad(d.getSeconds()) + ' WIB';
  const sb = $('#sbTime'); if (sb) sb.textContent = d.getHours() + ':' + pad(d.getMinutes());
}

/* ---------- layar kunci (PIN 4 angka gaya iPhone) ---------- */
const KEYLET = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ' };
const LK_SUB = 'Masukkan 4 angka PIN untuk melanjutkan';
function vLock() {
  const sh = ui.shake; ui.shake = false;
  const key = d => `<button type="button" class="k" data-act="key" data-v="${d}" aria-label="${d}"><b>${d}</b><small>${KEYLET[d] || ''}</small></button>`;
  return `<main class="lock" aria-label="Layar kunci">
  ${logoFull(44, '')}
  <div><div class="lk-title">Masukkan PIN</div><div class="lk-sub ${ui.loginErr ? 'bad' : ''}" id="lkSub" role="status">${esc(ui.loginErr || LK_SUB)}</div></div>
  <div class="dots ${sh ? 'shake' : ''}" id="lkDots" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i < ui.pin.length ? 'on' : ''}"></i>`).join('')}</div>
  <div class="keypad" role="group" aria-label="Papan angka PIN">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(key).join('')}<span></span>${key(0)}<button type="button" class="k ghost" id="lkDel" data-act="keyDel" style="visibility:${ui.pin ? 'visible' : 'hidden'}">Hapus</button></div></main>`;
}
function pinSync() {
  $$('#lkDots i').forEach((d, i) => d.classList.toggle('on', i < ui.pin.length));
  const del = $('#lkDel'); if (del) del.style.visibility = ui.pin ? 'visible' : 'hidden';
  if (ui.loginErr && ui.pin.length) { ui.loginErr = ''; const sb = $('#lkSub'); if (sb) { sb.textContent = LK_SUB; sb.classList.remove('bad'); } }
}
/* PIN pemilik dan PIN pelanggan dicek di layar yang sama; tidak ada petunjuk di layar bahwa mode admin ada */
function submitPin() {
  const pin = ui.pin;
  const fail = m => { ui.loginErr = m; ui.pin = ''; ui.shake = true; render(); };
  if (ui.lockUntil > Date.now()) return fail('Coba lagi dalam ' + Math.ceil((ui.lockUntil - Date.now()) / 1000) + ' detik.');
  const reset = () => { ui.fails = 0; ui.loginErr = ''; ui.pin = ''; };
  if (!/^\d{4}$/.test(pin)) return fail('PIN harus 4 angka.');
  const adm = S.users.find(u => u.role === 'admin' && u.pin === hashPin(u.salt, pin));
  if (adm) { S.session = { userId: 'g-' + S.deviceId, role: 'guest', name: S.cname || 'Tania', adminId: adm.id }; save(); reset(); go('admin', { atab: 'dash' }); toast('Selamat datang, ' + adm.name + '.', 'ok'); return; }
  if (S.access.pin === hashPin(S.access.salt, pin)) {
    S.session = { userId: 'g-' + S.deviceId, role: 'guest', name: S.cname || 'Tania' }; save(); reset(); nav('home'); return;
  }
  ui.fails = (ui.fails || 0) + 1;
  if (ui.fails >= 5) { ui.fails = 0; ui.lockUntil = Date.now() + 30000; return fail('Terlalu banyak percobaan. Coba lagi dalam 30 detik.'); }
  fail('PIN salah, coba lagi');
}

/* ---------- shell ---------- */
function vShell() {
  cleanCart();
  let body;
  if (ui.sub === 'cart') body = vCart();
  else if (ui.sub === 'checkout') body = vCheckout();
  else if (ui.sub === 'order') body = vOrder(ui.param);
  else if (ui.sub === 'chat') body = vChat();
  else if (ui.tab === 'menu') body = vMenu();
  else if (ui.tab === 'orders') body = vOrders();
  else if (ui.tab === 'profile') body = vProfile();
  else body = vHome();
  const n = cartCount();
  const tabs = [['home', 'Home', ICON.home], ['menu', 'Menu', ICON.menu], ['orders', 'Orders', ICON.orders], ['profile', 'Profile', ICON.user]];
  const uc = unreadC(myId());
  return `<header class="hdr">${modeBar('cust')}<div class="wrap">${logoFull(36)}
    <div class="row">
    <button class="iconbtn" data-act="openCart" aria-label="Keranjang, ${n} item">${ICON.bag}${n ? `<span class="bdg">${n}</span>` : ''}</button></div></div></header>
  <div class="wrap">${body}</div>
  <nav class="nav" aria-label="Navigasi utama"><div class="in">${tabs.map(([k, l, i]) => `<button data-act="tab" data-v="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span>${k === 'profile' && uc ? '<i class="dotb"></i>' : ''}</button>`).join('')}</div></nav>`;
}
const backBtn = (label = 'Kembali', act = 'back') => `<button class="btn line sm noprint" data-act="${act}" style="align-self:flex-start">${ICON.back.replace('<svg', '<svg width="18" height="18"')} ${label}</button>`;
const emptyBox = (title, text, btn) => `<div class="empty">${ICON.bag}<h3>${title}</h3><p>${text}</p>${btn || ''}</div>`;

/* ---------- kartu produk & paket ---------- */
function labelsFor(p) {
  if (p.stock <= 0) return [['Sold Out', 'out']];
  const a = []; if (promoActive(p)) a.push(['Promo', 'promo']); if (p.best) a.push(['Best Seller', 'best']); if (p.isNew) a.push(['New Menu', 'new']);
  return a;
}
const tagsHTML = a => a.length ? `<div class="tags">${a.map(([t, c]) => `<span class="tag ${c}">${t}</span>`).join('')}</div>` : '';
function pCard(p) {
  const out = p.stock <= 0, promo = promoActive(p), fav = isFav(p.id);
  return `<article class="pcard ${out ? 'is-out' : ''}">
  <button class="pimg" data-act="openProduct" data-id="${p.id}" aria-label="Lihat detail ${esc(p.name)}"><img src="${imgOf(p)}" alt="${esc(p.name)}" loading="lazy" width="400" height="300"></button>
  ${tagsHTML(labelsFor(p))}
  <button class="favbtn ${fav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}" aria-pressed="${fav}">${ICON.heart}</button>
  <div class="pbody"><h3>${esc(p.name)}</h3>${rateLine(p.id)}<p class="pdesc">${esc(p.desc)}</p>
  <div class="pmeta"><span class="price">${rp(unit(p))}</span>${promo ? `<s>${rp(p.price)}</s>` : ''}</div>
  <div class="stockline ${isLow(p) ? 'low' : ''}">${out ? 'Stok habis' : isLow(p) ? 'Stok menipis, sisa ' + p.stock : 'Stok ' + p.stock}</div>
  <button class="btn primary sm block" data-act="addQuick" data-t="p" data-id="${p.id}" ${out ? 'disabled' : ''}>${out ? 'Sold Out' : 'Add to Cart'}</button></div></article>`;
}
function bCard(b) {
  const av = bundleAvail(b), normal = bundleNormal(b), save = normal - b.price;
  return `<article class="pcard bcard ${av <= 0 ? 'is-out' : ''}">
  <button class="pimg" data-act="openBundle" data-id="${b.id}" aria-label="Lihat detail ${esc(b.name)}"><img src="${bundleImg(b)}" alt="${esc(b.name)}" loading="lazy" width="400" height="300"></button>
  ${tagsHTML(av <= 0 ? [['Sold Out', 'out']] : [['Paket Hemat', 'promo']])}
  <div class="pbody"><h3>${esc(b.name)}</h3><p class="pdesc">${esc(b.desc)}</p>
  <div class="pmeta"><span class="price">${rp(b.price)}</span>${save > 0 ? `<s>${rp(normal)}</s>` : ''}</div>
  ${save > 0 ? `<div class="save">Hemat ${rp(save)}</div>` : ''}
  <div class="stockline">${av <= 0 ? 'Tidak tersedia' : av <= S.brand.lowStock ? 'Sisa ' + av + ' paket' : 'Tersedia'}</div>
  <button class="btn primary sm block" data-act="addQuick" data-t="b" data-id="${b.id}" ${av <= 0 ? 'disabled' : ''}>${av <= 0 ? 'Sold Out' : 'Add to Cart'}</button></div></article>`;
}

/* ---------- home ---------- */
function vHome() {
  const act = S.products.filter(p => p.active);
  const bundles = S.bundles.filter(bundleShown);
  const banners = [];
  S.vouchers.filter(v => v.active && inPeriod(v.start, v.end)).sort((x, y) => (y.type === 'ship') - (x.type === 'ship')).slice(0, 4).forEach(v => banners.push(`<button class="banner" data-act="copyCode" data-v="${esc(v.code)}"><span class="code">${esc(v.code)}</span><b>${esc(voucherText(v))}</b><small>Min. belanja ${rp(v.min)}. Ketuk untuk menyalin kode.</small></button>`));
  act.filter(promoActive).slice(0, 2).forEach(p => banners.push(`<button class="banner" data-act="openProduct" data-id="${p.id}"><span class="code">PROMO</span><b>${esc(p.name)} jadi ${rp(p.promoPrice)}</b><small>Harga normal ${rp(p.price)}.</small></button>`));
  if (bundles[0]) banners.push(`<button class="banner" data-act="catGo" data-v="Paket Hemat"><span class="code">PAKET HEMAT</span><b>${esc(bundles[0].name)} hanya ${rp(bundles[0].price)}</b><small>Lihat semua paket hemat.</small></button>`);
  const best = act.filter(p => p.best).slice(0, 6), neu = act.filter(p => p.isNew).slice(0, 6);
  const favs = act.filter(p => isFav(p.id));
  return `<main class="page">
  <section class="hello"><h1>Halo, ${esc(myName().split(' ')[0])}!</h1><p>${esc(S.brand.tagline)}</p><p class="sm-t">Buka setiap hari ${esc(S.brand.hours)}</p><button class="btn soft sm" data-act="tab" data-v="menu">Lihat Menu</button></section>
  ${banners.length ? `<section><div class="scroller" aria-label="Promo">${banners.join('')}</div></section>` : ''}
  <section><div class="sec-h"><h2>Kategori</h2></div><div class="chips">${CATS.map(c => `<button class="chip" data-act="catGo" data-v="${c}" aria-pressed="false">${c}</button>`).join('')}<button class="chip" data-act="catGo" data-v="Paket Hemat" aria-pressed="false">Paket Hemat</button></div></section>
  ${bundles.length ? `<section><div class="sec-h"><h2>Paket Hemat</h2><button class="link" data-act="catGo" data-v="Paket Hemat">Lihat semua</button></div><div class="scroller hrow">${bundles.map(bCard).join('')}</div></section>` : ''}
  ${best.length ? `<section><div class="sec-h"><h2>Best Seller</h2><button class="link" data-act="catGo" data-v="Semua">Semua menu</button></div><div class="grid">${best.map(pCard).join('')}</div></section>` : ''}
  ${neu.length ? `<section><div class="sec-h"><h2>Menu Baru</h2></div><div class="grid">${neu.map(pCard).join('')}</div></section>` : ''}
  ${favs.length ? `<section><div class="sec-h"><h2>Menu Favoritmu</h2></div><div class="grid">${favs.map(pCard).join('')}</div></section>` : ''}
  <section class="card stack-s"><h3>Hubungi & Kunjungi Kami</h3>${contactHTML()}</section>
  </main>`;
}

/* ---------- menu ---------- */
function menuItems() {
  const q = ui.q.trim().toLowerCase();
  let ps = S.products.filter(p => p.active), bs = S.bundles.filter(bundleShown);
  if (ui.cat === 'Paket Hemat') ps = [];
  else if (ui.cat !== 'Semua') { ps = ps.filter(p => p.cat === ui.cat); bs = []; }
  if (q) { ps = ps.filter(p => p.name.toLowerCase().includes(q)); bs = bs.filter(b => b.name.toLowerCase().includes(q)); }
  const pr = ui.price, inP = v => pr === 'all' || (pr === 'lt15' && v < 15000) || (pr === 'mid' && v >= 15000 && v <= 25000) || (pr === 'gt25' && v > 25000);
  ps = ps.filter(p => inP(unit(p))); bs = bs.filter(b => inP(b.price));
  if (ui.onlyStock) { ps = ps.filter(p => p.stock > 0); bs = bs.filter(b => bundleAvail(b) > 0); }
  if (ui.onlyFav) { ps = ps.filter(p => isFav(p.id)); bs = []; }
  ps.sort((a, b) => (a.stock <= 0) - (b.stock <= 0));
  return { ps, bs };
}
function menuGridHTML() {
  const { ps, bs } = menuItems();
  if (!ps.length && !bs.length) return `<div class="card">${emptyBox('Menu tidak ditemukan', 'Coba ubah kata kunci, kategori, atau filter harga.', '<button class="btn soft sm" data-act="resetFilter">Reset filter</button>')}</div>`;
  return `<p class="muted sm-t" style="margin-bottom:10px">${ps.length + bs.length} menu ditemukan</p><div class="grid">${ps.map(pCard).join('')}${bs.map(bCard).join('')}</div>`;
}
function vMenu() {
  const cats = ['Semua', ...CATS, 'Paket Hemat'];
  return `<main class="page"><div class="sticky-bar stack-s">
  <div class="search">${ICON.search}<input id="q" type="search" placeholder="Cari menu, misal: burger" value="${esc(ui.q)}" aria-label="Cari menu"></div>
  <div class="chips">${cats.map(c => `<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${ui.cat === c}">${c}</button>`).join('')}</div></div>
  <div class="filters">
    <label class="f" for="fPrice"><small>Harga</small><select id="fPrice"><option value="all" ${ui.price === 'all' ? 'selected' : ''}>Semua harga</option><option value="lt15" ${ui.price === 'lt15' ? 'selected' : ''}>Di bawah Rp15.000</option><option value="mid" ${ui.price === 'mid' ? 'selected' : ''}>Rp15.000 - Rp25.000</option><option value="gt25" ${ui.price === 'gt25' ? 'selected' : ''}>Di atas Rp25.000</option></select></label>
    <label class="chk" style="padding-top:18px"><input id="fStock" type="checkbox" ${ui.onlyStock ? 'checked' : ''}> Hanya yang tersedia</label>
    <label class="chk" style="padding-top:18px"><input id="fFav" type="checkbox" ${ui.onlyFav ? 'checked' : ''}> Favorit saja</label></div>
  <div id="menuGrid">${menuGridHTML()}</div></main>`;
}

/* ---------- detail produk / paket ---------- */
function openProduct(id) {
  const p = prod(id); if (!p) return;
  ui.det = { t: 'p', id, q: 1 };
  const out = p.stock <= 0, promo = promoActive(p);
  const groups = (p.opts || []).map(g => `<fieldset class="opt"><legend>${esc(g.label)}</legend>${g.choices.map((c, i) => `<label class="optc"><input type="${g.type === 'check' ? 'checkbox' : 'radio'}" name="o_${g.id}" value="${i}" data-p="${c[1]}" data-g="${esc(g.label)}" data-c="${esc(c[0])}" ${g.type === 'radio' && i === 0 ? 'checked' : ''}><span>${esc(c[0])}</span>${c[1] ? `<em>+${rp(c[1])}</em>` : ''}</label>`).join('')}</fieldset>`).join('');
  sheet(`<div class="sheet-h"><h3>${esc(p.name)}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <div class="stack"><div class="imgwrap"><img class="detimg" src="${imgOf(p)}" alt="${esc(p.name)}">${tagsHTML(labelsFor(p))}</div>
  <div id="rateBox" class="stack-s">${rateBox(p.id)}</div>
  <p>${esc(p.desc)}</p>
  <div class="row between"><div class="pmeta"><span class="price" style="font-size:20px">${rp(unit(p))}</span>${promo ? `<s class="muted">${rp(p.price)}</s>` : ''}</div><span class="stockline ${isLow(p) ? 'low' : ''}">${out ? 'Stok habis' : isLow(p) ? 'Sisa ' + p.stock : 'Stok ' + p.stock}</span></div>
  <div id="detOpts" class="stack-s">${groups}</div>
  <div class="row between"><div class="qty"><button data-act="detMinus" aria-label="Kurangi">&minus;</button><output id="detQ">1</output><button data-act="detPlus" aria-label="Tambah">+</button></div>
  <button class="btn primary grow" data-act="detAdd" ${out ? 'disabled' : ''}>${out ? 'Sold Out' : 'Add to Cart'} <span id="detTotal">${rp(unit(p))}</span></button></div>
  <button class="btn line block" data-act="fav" data-id="${p.id}" data-sheet="1">${isFav(p.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}</button></div>`);
}
function detCalc() {
  const d = ui.det; if (!d || d.t !== 'p') return { total: 0, opts: [] };
  const p = prod(d.id); const opts = [];
  $$('#detOpts input:checked').forEach(i => opts.push([i.dataset.g, i.dataset.c, Number(i.dataset.p) || 0]));
  return { opts, total: (unit(p) + optPrice(opts)) * d.q };
}
function detRefresh() { const c = detCalc(); const t = $('#detTotal'); if (t) t.textContent = rp(c.total); const q = $('#detQ'); if (q) q.textContent = ui.det.q; }
function openBundle(id) {
  const b = bund(id); if (!b) return;
  ui.det = { t: 'b', id, q: 1 };
  const av = bundleAvail(b), normal = bundleNormal(b);
  sheet(`<div class="sheet-h"><h3>${esc(b.name)}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <div class="stack"><div class="imgwrap"><img class="detimg" src="${bundleImg(b)}" alt="${esc(b.name)}">${tagsHTML([['Paket Hemat', 'promo']])}</div>
  <p>${esc(b.desc)}</p>
  <div class="card flat"><b>Isi paket</b><ul style="margin:6px 0 0;padding-left:18px">${b.items.map(it => { const p = prod(it.pid); return `<li>${it.qty}x ${p ? esc(p.name) : 'Produk dihapus'}</li>`; }).join('')}</ul></div>
  <div class="pmeta"><span class="price" style="font-size:20px">${rp(b.price)}</span>${normal > b.price ? `<s class="muted">${rp(normal)}</s><span class="save">Hemat ${rp(normal - b.price)}</span>` : ''}</div>
  ${b.end ? `<p class="muted sm-t">Berlaku sampai ${fmtDay(b.end)}</p>` : ''}
  <div class="row between"><div class="qty"><button data-act="detMinus" aria-label="Kurangi">&minus;</button><output id="detQ">1</output><button data-act="detPlus" aria-label="Tambah">+</button></div>
  <button class="btn primary grow" data-act="detAdd" ${av <= 0 ? 'disabled' : ''}>${av <= 0 ? 'Sold Out' : 'Add to Cart'} <span id="detTotal">${rp(b.price)}</span></button></div></div>`);
}
function detBundleRefresh() { const b = bund(ui.det.id); const t = $('#detTotal'); if (t) t.textContent = rp(b.price * ui.det.q); const q = $('#detQ'); if (q) q.textContent = ui.det.q; }

/* ---------- keranjang ---------- */
/* ----- pilihan voucher & gratis ongkir (keranjang + checkout) ----- */
function voucherPicker(T, type) {
  const L = S.vouchers.filter(v => v.active && inPeriod(v.start, v.end)).sort((x, y) => (y.type === 'ship') - (x.type === 'ship'));
  if (!L.length) return '';
  const sel = ui.draft.voucher, sub = T.subtotal;
  const items = L.map(v => {
    const on = sel === v.code && !T.verr;
    const ship = v.type === 'ship';
    const short = sub < v.min;
    const wrongType = ship && type && type !== 'delivery';
    const off = short || wrongType;
    let note;
    if (short) note = 'Belanja ' + rp(v.min - sub) + ' lagi untuk memakai voucher ini';
    else if (wrongType) note = 'Pilih Delivery untuk memakai gratis ongkir';
    else if (ship) note = 'Min. belanja ' + rp(v.min) + (type === 'delivery' ? '' : '. Berlaku untuk Delivery');
    else {
      const save = v.type === 'percent' ? Math.min(Math.floor(sub * v.value / 100), v.max || Infinity) : Math.min(v.value, sub);
      note = 'Hemat ' + rp(save) + '. Min. belanja ' + rp(v.min);
    }
    return `<button type="button" class="vopt${on ? ' on' : ''}${off ? ' off' : ''}" data-act="pickV" data-v="${esc(v.code)}" aria-pressed="${on}"${off ? ' disabled' : ''}><span class="vtag">${ship ? 'GRATIS ONGKIR' : 'DISKON'}</span><b>${esc(v.code)}</b><span class="vtxt">${esc(voucherText(v))}</span><small>${esc(note)}</small><span class="vchk">${on ? 'Dipakai' : off ? 'Belum bisa' : 'Pakai'}</span></button>`;
  }).join('');
  return `<div class="vpick" role="group" aria-label="Pilih voucher atau gratis ongkir"><div class="vpick-h"><b>Pilih voucher atau gratis ongkir</b><small>Satu voucher per pesanan. Ketuk lagi untuk melepas.</small></div><div class="vlist">${items}</div></div>`;
}
function vCart() {
  const T = totals('pickup', ui.draft.voucher);
  if (!T.rows.length) return `<main class="page">${backBtn('Lanjut belanja', 'toMenu')}<div class="card">${emptyBox('Keranjang masih kosong', 'Pilih menu favoritmu dulu, ya.', '<button class="btn primary" data-act="tab" data-v="menu">Lihat Menu</button>')}</div></main>`;
  return `<main class="page">${backBtn('Lanjut belanja', 'toMenu')}
  <div class="sec-h" style="margin:0"><h2>Keranjang</h2><button class="link" data-act="clearCart">Kosongkan</button></div>
  <section class="card">${T.rows.map(r => { const i = S.cart.indexOf(r.l); return `<div class="crow"><img src="${r.img}" alt=""><div><b>${esc(r.name)}</b>${r.opts ? `<small>${esc(r.opts)}</small>` : ''}<span class="price" style="font-size:14px">${rp(r.unit)}</span></div>
  <div class="ctl"><div class="qty"><button data-act="dec" data-i="${i}" aria-label="Kurangi ${esc(r.name)}">&minus;</button><output>${r.l.q}</output><button data-act="inc" data-i="${i}" aria-label="Tambah ${esc(r.name)}">+</button></div>
  <button class="btn danger sm" data-act="rm" data-i="${i}" aria-label="Hapus ${esc(r.name)} dari keranjang">${ICON.trash.replace('<svg', '<svg width="16" height="16"')} Hapus</button></div></div>`; }).join('')}</section>
  <section class="card stack-s"><label class="f" for="vcode">Kode voucher<span class="row"><input id="vcode" type="text" autocapitalize="characters" placeholder="Contoh: LUNARA10" value="${esc(ui.draft.voucher)}"><button class="btn soft" data-act="applyV" style="flex:none">Pakai</button></span></label>
  ${ui.draft.voucher ? (() => { const vs = S.vouchers.find(x => x.code === ui.draft.voucher); const shipOk = vs && vs.type === 'ship' && vs.active && T.subtotal >= vs.min; return `<div class="${T.verr && !shipOk ? 'err' : 'okmsg'}">${shipOk ? 'Gratis ongkir ' + esc(vs.code) + ' dipakai. Berlaku saat memilih Delivery di checkout.' : esc(T.vmsg)} <button class="link" data-act="clearV">Lepas</button></div>`; })() : ''}
  ${voucherPicker(T, null)}</section>
  <section class="card"><label class="f" for="onote">Catatan pesanan<textarea id="onote" data-draft="note" placeholder="Misal: tanpa bawang, saus dipisah">${esc(ui.draft.note)}</textarea></label></section>
  <section class="card sumrows"><div><span>Subtotal</span><span class="num">${rp(T.subtotal)}</span></div>
  <div><span>Diskon</span><span class="num neg">${T.discount ? '-' + rp(T.discount) : rp(0)}</span></div>
  <div><span>Pajak &amp; layanan (${S.brand.servicePct}%)</span><span class="num">${rp(T.service)}</span></div>
  <div class="tot"><span>Total sementara</span><span class="num">${rp(T.total)}</span></div>
  <p class="muted sm-t">Ongkos kirim dihitung di langkah berikutnya jika kamu memilih delivery.</p></section>
  <button class="btn primary lg2 block" data-act="toCheckout">Lanjut ke Checkout</button></main>`;
}

/* ---------- info pembayaran & kontak ---------- */
function payInstr(pmId, total) {
  const pm = PAYS.find(p => p.id === pmId); if (!pm) return '';
  if (pm.cash) return `<div class="hint">Bayar tunai di kasir (Dine In / Take Away) atau ke kurir (Delivery). Admin menandai lunas setelah uang diterima.</div>`;
  const info = (S.brand.pay || {})[pm.id] || {};
  const nom = total ? `<span>Nominal: <b>${rp(total)}</b></span>` : '';
  if (pm.id === 'qris') return `<div class="payinfo"><span class="bk">QRIS ${esc(S.brand.name)}</span>${info.img ? `<img class="qr" src="${info.img}" alt="Kode QRIS">${info.demo ? '<small class="muted" style="text-align:center">QR contoh (demo), bukan QRIS asli</small>' : ''}` : '<p class="muted">Kode QRIS belum diunggah admin. Pilih metode lain atau hubungi admin lewat Chat.</p>'}${info.name ? `<span>a.n. <b>${esc(info.name)}</b></span>` : ''}${nom}</div>`;
  if (!info.no) return `<div class="hint">Nomor ${esc(pm.bank)} belum diatur admin. Pilih metode lain atau hubungi admin lewat Chat.</div>`;
  const isBank = ['bri', 'bca', 'bni'].includes(pm.id);
  return `<div class="payinfo"><span class="bk">${isBank ? 'Transfer ke Bank ' : 'Transfer ke '}${esc(pm.bank)}</span><span class="acc">${esc(info.no)}</span><span>a.n. <b>${esc(info.name)}</b></span>${nom}<button type="button" class="btn soft sm" data-act="copyText" data-v="${esc(digits(info.no) || info.no)}" data-m="Nomor ${esc(pm.bank)} disalin." style="align-self:flex-start">Salin nomor</button></div>`;
}
function payPicker(d) {
  const grps = [...new Set(PAYS.map(p => p.grp))];
  return grps.map(g => `<div class="paygrp">${g}</div><div class="paygrid">${PAYS.filter(p => p.grp === g).map(p => { const inf = (S.brand.pay || {})[p.id]; const sub = p.cash || p.id === 'qris' ? p.g : (inf && inf.no ? inf.no : p.g); return `<button class="payopt" data-act="setPay" data-v="${p.id}" aria-pressed="${d.pay === p.id}">${p.n}<small>${esc(sub)}</small></button>`; }).join('')}</div>`).join('');
}
function contactHTML() {
  const b = S.brand, ig = igLink(b.instagram);
  return `<div class="stack-s"><div class="sm-t">Alamat: ${esc(b.address)}<br>Jam buka: ${esc(b.hours)}${b.phone ? '<br>Telepon: ' + esc(b.phone) : ''}${igHandle(b.instagram) ? '<br>Instagram: @' + esc(igHandle(b.instagram)) : ''}</div>
  <div class="ctc"><button class="btn soft sm" data-act="openChat">Chat Toko</button>${ig ? `<a class="btn line sm" href="${ig}" target="_blank" rel="noopener">Instagram</a>` : ''}<a class="btn line sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">Lihat Alamat</a></div></div>`;
}

/* ---------- checkout ---------- */
function delivPicker(d) {
  const L = delivList(); if (!L.length) return '<div class="err">Layanan delivery sedang tidak tersedia. Pilih Dine In atau Take Away.</div>';
  const c = delivBy(d.deliv);
  return `<div class="stack-s"><b>Layanan pengantaran</b><div class="paygrid">${L.map(x => `<button type="button" class="payopt" data-act="setDeliv" data-v="${x.id}" aria-pressed="${d.deliv === x.id}">${esc(x.n)}<small>${esc(x.g)} &middot; ${esc(x.eta)}</small><small><b>${rp(x.fee)}</b></small></button>`).join('')}</div>${c ? `<div class="hint">Diantar via <b>${esc(c.n)}</b>, estimasi ${esc(c.eta)}.</div>` : ''}</div>`;
}
function vCheckout() {
  const d = ui.draft;
  if (!delivBy(d.deliv) || !delivBy(d.deliv).on) d.deliv = (delivList()[0] || {}).id || '';
  const T = totals(d.type, d.voucher, d.deliv);
  if (!T.rows.length) return vCart();
  const u = curUser();
  if (!d.name && u) d.name = u.name;
  if (!d.name && S.cname) d.name = S.cname;
  const delivery = d.type === 'delivery', dine = d.type === 'dinein';
  const pay = PAYS.find(p => p.id === d.pay) || PAYS[0];
  return `<main class="page">${backBtn('Kembali ke keranjang', 'openCart')}<h2>Checkout</h2>
  <section class="card stack"><b>Penerimaan pesanan</b>
  <div class="seg" role="group" aria-label="Penerimaan">${TYPES.map(t => `<button data-act="setType" data-v="${t[0]}" aria-pressed="${d.type === t[0]}">${t[1]}</button>`).join('')}</div>
  <div class="fgrid"><label class="f full" for="cName">Nama<input id="cName" type="text" data-draft="name" value="${esc(d.name)}" autocomplete="name"></label>
  ${dine ? `<label class="f full" for="cTable">Nomor meja<input id="cTable" type="text" data-draft="table" value="${esc(d.table || '')}" inputmode="numeric" placeholder="Contoh: 12"></label>` : ''}
  ${delivery ? `<label class="f full" for="cAddr">Alamat pengantaran<textarea id="cAddr" data-draft="address" placeholder="Jalan, nomor, kelurahan, patokan">${esc(d.address)}</textarea></label>
  <label class="f full" for="cDnote">Catatan pengantaran <small>(opsional)</small><input id="cDnote" type="text" data-draft="dnote" value="${esc(d.dnote)}" placeholder="Misal: titip di satpam"></label>` : ''}</div>
  ${delivery ? delivPicker(d) : dine ? `<div class="hint"><b>Makan di tempat (Dine In)</b><br>Duduk di meja bernomor sesuai yang kamu isi. Pesanan diantar ke mejamu setelah siap. Lokasi: ${esc(S.brand.address)}. Buka ${esc(S.brand.hours)}.</div>` : `<div class="hint"><b>Bawa pulang (Take Away)</b><br>Ambil di ${esc(S.brand.name)}, ${esc(S.brand.address)}. Buka ${esc(S.brand.hours)}. Estimasi siap 15 menit setelah pembayaran. Tunjukkan nomor pesanan yang muncul setelah konfirmasi.</div>`}</section>
  <section class="card stack-s">${voucherPicker(T, d.type)}${d.voucher && T.verr ? `<div class="err">${esc(T.vmsg)} <button class="link" data-act="clearV">Lepas</button></div>` : ''}</section>
  <section class="card stack-s"><b>Metode pembayaran</b>${payPicker(d)}
  ${payInstr(d.pay, T.total)}
  ${pay.cash ? '' : '<div class="hint">Setelah menekan Konfirmasi Pesanan, transfer sesuai nominal lalu tekan "Saya Sudah Bayar" di halaman pesanan. Admin akan memeriksa dan mengonfirmasi pembayaranmu.</div>'}</section>
  <section class="card"><b>Ringkasan pesanan</b>${T.rows.map(r => `<div class="crow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${r.l.q}x ${esc(r.name)}</b>${r.opts ? `<small>${esc(r.opts)}</small>` : ''}<small>${rp(r.unit)} per item</small></div><b class="num">${rp(r.unit * r.l.q)}</b></div>`).join('')}
  ${d.note ? `<p class="sm-t muted" style="margin-top:8px">Catatan: ${esc(d.note)}</p>` : ''}</section>
  <section class="card sumrows"><div><span>Subtotal</span><span class="num">${rp(T.subtotal)}</span></div>
  <div><span>Diskon${T.voucher ? ' (' + esc(T.voucher.code) + ')' : ''}</span><span class="num neg">${T.discount ? '-' + rp(T.discount) : rp(0)}</span></div>
  <div><span>Pajak &amp; layanan (${S.brand.servicePct}%)</span><span class="num">${rp(T.service)}</span></div>
  ${delivery ? `<div><span>Ongkir ${esc((delivBy(d.deliv) || {}).n || '')}${T.shipDisc ? ' (gratis)' : ''}</span><span class="num">${T.shipDisc ? '<s>' + rp(T.shipDisc) + '</s> ' : ''}${rp(T.delivery)}</span></div>` : ''}
  <div class="tot"><span>Total pembayaran</span><span class="num">${rp(T.total)}</span></div></section>
  <div id="coErr" role="alert"></div>
  <button class="btn primary lg2 block" data-act="confirmOrder">Konfirmasi Pesanan - ${rp(T.total)}</button></main>`;
}

/* ---------- struk & detail pesanan ---------- */
function orderBoxHTML(o) {
  return `<section class="receipt" aria-label="Rincian pesanan"><div class="rc-h"><b style="font:700 15px var(--f-display)">Rincian Pesanan</b><span class="muted sm-t">${fmt(o.createdAt)}</span></div>
  <dl><dt>No. pesanan</dt><dd>${esc(o.no)}</dd><dt>Atas nama</dt><dd>${esc(o.customer.name)}</dd><dt>Penerimaan</dt><dd>${typeName(o.type)}</dd>${o.type === 'dinein' && o.customer.table ? `<dt>No. meja</dt><dd>${esc(o.customer.table)}</dd>` : ''}${o.type === 'delivery' ? `<dt>Layanan antar</dt><dd>${esc(o.deliv ? o.deliv.name : 'Kurir LUNARA')}</dd><dt>Alamat</dt><dd>${esc(o.customer.address)}</dd>` : ''}</dl>
  <div class="rc-items">${o.items.map(i => `<div class="rc-it"><b>${i.qty}x ${esc(i.name)}</b><b class="num">${rp(i.unit * i.qty)}</b>${i.opts ? `<small>${esc(i.opts)}</small>` : ''}<small>${rp(i.unit)} / item</small></div>`).join('')}</div>
  <dl style="margin-bottom:6px"><dt>Subtotal</dt><dd class="num">${rp(o.subtotal)}</dd>${o.discount ? `<dt>Diskon ${o.voucher ? '(' + esc(o.voucher) + ')' : ''}</dt><dd class="num">-${rp(o.discount)}</dd>` : ''}
  <dt>Pajak &amp; layanan</dt><dd class="num">${rp(o.service)}</dd>${o.type === 'delivery' ? `<dt>Ongkos kirim${o.shipDisc ? ' (gratis ongkir)' : ''}</dt><dd class="num">${rp(o.delivery)}</dd>` : ''}
  <dt style="font:700 15px var(--f-display);color:var(--espresso)">TOTAL</dt><dd class="num" style="font:700 17px var(--f-display);color:var(--rose)">${rp(o.total)}</dd></dl>
  <dl style="border-top:1.5px dashed var(--line);padding-top:10px"><dt>Metode pembayaran</dt><dd>${esc(o.pay.name)}</dd><dt>Status pembayaran</dt><dd>${esc(o.pay.status)}</dd><dt>Status pesanan</dt><dd>${esc(o.status)}</dd></dl>${o.note ? `<p class="sm-t muted">Catatan: ${esc(o.note)}</p>` : ''}</section>`;
}
function canView(o) { return o && (isAdmin() || o.userId === myId()); }
function vOrder(id) {
  const o = S.orders.find(x => x.id === id);
  if (!canView(o)) return `<main class="page">${backBtn('Kembali ke pesanan', 'toOrders')}<div class="card">${emptyBox('Pesanan tidak ditemukan', 'Pesanan ini tidak ada atau bukan milik akunmu.')}</div></main>`;
  const adm = isAdmin(), fin = finalStatus(o.status), cash = payCash(o);
  const stages = stageList(o.type), cur = stages.indexOf(o.status);
  const tl = o.status === 'Dibatalkan' ? `<ul class="tl"><li class="done">Pesanan dibuat</li><li class="done now">Dibatalkan</li></ul>`
    : `<ul class="tl">${stages.map((s, i) => `<li class="${i <= cur ? 'done' : ''} ${i === cur ? 'now' : ''}">${s}</li>`).join('')}</ul>`;
  const typeInfo = fin ? '' : adm ? (o.type === 'dinein' ? `<div class="hint noprint"><b>Dine In${o.customer.table ? ' - Meja ' + esc(o.customer.table) : ''}</b><br>Antar pesanan ke meja ini setelah siap.</div>` : o.type === 'pickup' ? `<div class="hint noprint"><b>Take Away</b><br>Pelanggan mengambil di toko. Cocokkan nomor pesanan <b>${esc(o.no)}</b> dengan nama ${esc(o.customer.name)}.</div>` : `<div class="hint noprint"><b>Delivery</b><br>Antar ke alamat pelanggan: ${esc(o.customer.address)}.</div>`) : o.type === 'pickup' ? `<div class="hint noprint"><b>Info pengambilan (Take Away)</b><br>Ambil di ${esc(S.brand.address)}. Tunjukkan nomor pesanan <b>${esc(o.no)}</b> atas nama ${esc(o.customer.name)}.</div>`
    : o.type === 'dinein' ? `<div class="hint noprint"><b>Dine In${o.customer.table ? ' - Meja ' + esc(o.customer.table) : ''}</b><br>Pesanan akan diantar ke mejamu setelah siap. Nomor pesanan <b>${esc(o.no)}</b>.</div>` : '';
  const needPay = !fin && o.pay.status !== 'Lunas';
  const payBox = needPay && !adm ? `<section class="card noprint stack-s"><b>Pembayaran</b>${payInstr(o.pay.id, o.total)}${o.pay.status === 'Menunggu Konfirmasi' ? '<div class="hint">Terima kasih. Admin sedang memeriksa pembayaranmu. Status berubah menjadi Lunas setelah dikonfirmasi.</div>' : cash ? '' : `<button class="btn primary block" data-act="reportPay" data-id="${o.id}">Saya Sudah Bayar</button><p class="muted sm-t">Transfer sesuai nominal di atas, lalu tekan tombol ini agar admin mengonfirmasi.</p>`}</section>` : '';
  const admPay = adm && needPay ? `<section class="card noprint stack-s"><b>Konfirmasi pembayaran</b><p class="muted sm-t">${esc(o.pay.name)} &middot; ${rp(o.total)} &middot; ${esc(o.pay.status)}</p><button class="btn primary block" data-act="markPaid" data-id="${o.id}">Konfirmasi Sudah Dibayar</button>${o.pay.status === 'Menunggu Konfirmasi' ? `<button class="btn line block" data-act="rejectPay" data-id="${o.id}">Pembayaran Belum Masuk</button>` : ''}</section>` : '';
  const canCancel = !fin && (adm || (o.status === 'Menunggu Pembayaran' && o.pay.status !== 'Menunggu Konfirmasi'));
  return `<main class="page">${backBtn(adm ? 'Kembali' : 'Kembali ke pesanan', 'toOrders')}
  <div class="row between wrapx noprint"><h2>Pesanan ${esc(o.no)}</h2><span class="row"><span class="pill s${sIdx(o.status)}">${o.status}</span>${payPill(o)}</span></div>
  ${typeInfo}
  ${admPay}${payBox}
  ${orderBoxHTML(o)}
  <section class="card noprint stack"><b>Status pesanan</b>${tl}</section>
  <section class="card noprint stack-s"><b>${adm ? 'Chat Pelanggan: ' + esc(o.customer.name) : 'Chat Toko'}</b><div class="chatbox" id="chatBox" role="log" aria-live="polite">${chatMsgsHTML() || '<p class="muted sm-t">Belum ada pesan. Tulis pertanyaan tentang pesanan ini di bawah.</p>'}</div>
  <form class="chatin" data-form="chatSendO" data-oid="${o.id}"><input id="chatIn" name="text" type="text" maxlength="500" placeholder="Tulis pesan..." autocomplete="off"><button class="btn primary" type="submit">Kirim</button></form></section>
  <section class="card noprint stack-s"><b>Aksi</b>
  ${adm && !fin ? `<label class="f" for="stSel">Ubah status pesanan<select id="stSel" class="status-sel" data-chg="status" data-id="${o.id}">${statusesFor(o).map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>` : ''}
  ${canCancel ? `<button class="btn danger block" data-act="cancelAsk" data-id="${o.id}">Batalkan Pesanan</button>` : ''}
  ${!adm && !fin && !canCancel ? `<p class="muted sm-t">Pembayaranmu sedang dikonfirmasi admin, jadi pesanan belum bisa dibatalkan sendiri. Hubungi admin lewat Chat.</p>` : ''}
  ${fin ? `<button class="btn danger block" data-act="deleteOrder" data-id="${o.id}">${adm ? 'Hapus Pesanan' : 'Hapus dari Riwayat'}</button>` : ''}
  ${!adm || o.userId === myId() ? `<button class="btn line block" data-act="reorder" data-id="${o.id}">Pesan Ulang</button>` : ''}</section>
  ${adm ? `<section class="card noprint"><b>Riwayat perubahan</b><ul style="margin:8px 0 0;padding-left:18px">${o.log.slice().reverse().map(l => `<li>${fmt(l.ts)} - ${esc(l.text)}</li>`).join('')}</ul></section>` : ''}
  </main>`;
}

/* ---------- daftar pesanan, profil ---------- */
const OF = [['all', 'Semua', () => true], ['pay', 'Belum Bayar', o => o.status === 'Menunggu Pembayaran'], ['proc', 'Diproses', o => ['Diproses', 'Sedang Disiapkan'].includes(o.status)], ['ship', 'Dikirim/Siap', o => ['Siap Diambil', 'Siap Disajikan', 'Dalam Pengantaran'].includes(o.status)], ['done', 'Selesai', o => o.status === 'Selesai'], ['cancel', 'Dibatalkan', o => o.status === 'Dibatalkan']];
const myOrders = () => S.orders.filter(o => o.userId === myId() && !o.hidden);
function vOrders() {
  const f = OF.find(x => x[0] === ui.ocf) || OF[0], list = myOrders().filter(f[2]);
  return `<main class="page"><h2>Pesanan Saya</h2><div class="chips">${OF.map(x => `<button class="chip" data-act="ocf" data-v="${x[0]}" aria-pressed="${f[0] === x[0]}">${x[1]} (${myOrders().filter(x[2]).length})</button>`).join('')}</div>${list.length ? `<div class="stack-s">${list.map(orderCard).join('')}</div>` : `<div class="card">${emptyBox('Belum ada pesanan', 'Pesananmu akan muncul di sini lengkap dengan status pesanan.', '<button class="btn primary" data-act="tab" data-v="menu">Mulai Pesan</button>')}</div>`}</main>`;
}
const orderCard = o => `<button class="ocard" data-act="openOrder" data-id="${o.id}"><div class="row between wrapx"><b>${esc(o.no)}</b><span class="pill s${sIdx(o.status)}">${o.status}</span></div>
<span class="muted sm-t">${fmt(o.createdAt)} &middot; ${typeLine(o)} &middot; ${orderQty(o)} item</span>
<span class="muted sm-t">${esc(o.items.slice(0, 2).map(i => i.name).join(', '))}${o.items.length > 2 ? ' +' + (o.items.length - 2) + ' lagi' : ''}</span><span class="row wrapx"><b class="price">${rp(o.total)}</b>${payPill(o)}</span></button>`;
const prof = () => { S.prof = S.prof || {}; const p = S.prof[myId()] || (S.prof[myId()] = { email: '' }); if (!p.joined) p.joined = Date.now(); return p; };
function vProfile() {
  const mine = myOrders(), spend = mine.filter(o => o.status !== 'Dibatalkan' && isPaid(o)).reduce((s, o) => s + o.total, 0);
  const tier = spend >= 1000000 ? 'Gold' : spend >= 300000 ? 'Silver' : 'Bronze', p = prof(), uc = unreadC(myId());
  const st = [['pay', 'Belum Bayar', ICON.card], ['proc', 'Diproses', ICON.box], ['ship', 'Dikirim', ICON.truck], ['done', 'Selesai', ICON.check], ['cancel', 'Batal', ICON.close]];
  const row = (act, ic, t, sub, extra = '') => `<button class="prow" data-act="${act}"${extra}>${ic}<span>${t}${sub ? `<small>${sub}</small>` : ''}</span><span class="chv">${ICON.chev}</span></button>`;
  return `<main class="page"><h2>Profil</h2>
  <section class="pfhead"><div class="av">${esc(myName().charAt(0).toUpperCase())}</div><div class="grow"><b style="font-size:18px">${esc(myName())}</b><div><small>${p.email ? esc(p.email) : 'Member LUNARA ' + tier}</small></div><small>Member ${tier} &middot; belanja ${rp(spend)}</small></div><button class="btn soft sm" data-act="editProfile" aria-label="Edit profil">${ICON.edit.replace('<svg', '<svg width="18" height="18"')}</button></section>
  <section class="card stack-s"><b>Data Akun</b><form class="stack-s" data-form="profileEdit" novalidate><label class="f" for="pf_n">Nama<input id="pf_n" name="name" type="text" value="${esc(myName())}" placeholder="Nama lengkap"></label><label class="f" for="pf_e">Email <small>(opsional)</small><input id="pf_e" name="email" type="email" value="${esc(p.email)}" placeholder="nama@email.com"></label><p class="muted sm-t">ID Pelanggan: <b>LNR-${esc(String(S.deviceId).slice(0, 5).toUpperCase())}</b> &middot; Bergabung ${fmtDay(dayKey(p.joined))}</p><button class="btn primary sm" type="submit" style="align-self:flex-start">Simpan Perubahan</button></form></section>
  <section class="card"><div class="sec-h" style="margin:0 0 6px"><h3>Pesanan Saya</h3><button class="link" data-act="ocfGo" data-v="all">Lihat Riwayat</button></div><div class="ostat">${st.map(([k, l, ic]) => { const n = mine.filter(OF.find(x => x[0] === k)[2]).length; return `<button data-act="ocfGo" data-v="${k}">${ic}${l}${n ? `<span class="badge-n">${n}</span>` : ''}</button>`; }).join('')}</div></section>
  <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="stat"><span>Pesanan</span><b>${mine.length}</b></div><div class="stat"><span>Favorit</span><b>${(S.favs[myId()] || []).length}</b></div><div class="stat"><span>Voucher Tersedia</span><b>${S.vouchers.filter(v => v.active && inPeriod(v.start, v.end)).length}</b></div></div>
  <section class="card" style="padding:6px 14px">${row('openChat', ICON.chat, 'Chat Toko', uc ? uc + ' pesan baru' : 'Tanya pesanan atau menu')}${row('vouchSheet', ICON.ticket, 'Voucher Saya', 'Kode promo yang bisa dipakai')}${row('favMenu', ICON.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="2"'), 'Menu Favorit', (S.favs[myId()] || []).length + ' menu')}${row('editProfile', ICON.user, 'Pengaturan Akun', 'Nama dan email')}${row('helpSheet', ICON.help, 'Pusat Bantuan', 'Cara pesan, bayar, delivery')}</section>
  <section class="card stack-s"><b>Tentang ${esc(S.brand.name)}</b><p class="muted">${esc(S.brand.tagline)}</p>${contactHTML()}</section>
  <button class="btn danger block" data-act="logout">Keluar</button></main>`;
}
/* ===== Dashboard admin (semua data dari localStorage, bukan angka statis) ===== */
const ATABS = [['dash', 'Ringkasan'], ['orders', 'Pesanan'], ['chat', 'Chat Pelanggan'], ['products', 'Produk'], ['promo', 'Promo'], ['report', 'Laporan'], ['settings', 'Pengaturan'], ['accounts', 'Akun']];
const liveOrders = () => S.orders.filter(o => !finalStatus(o.status));
const omzetOf = list => list.filter(o => o.status !== 'Dibatalkan' && isPaid(o)).reduce((s, o) => s + o.total, 0);

function vAdmin() {
  if (!isAdmin()) return '';
  const tab = ui.atab;
  const body = ui.aorder ? vOrder(ui.aorder) : tab === 'orders' ? aOrders() : tab === 'chat' ? aChat() : tab === 'products' ? aProducts() : tab === 'promo' ? aPromo() : tab === 'report' ? aReport() : tab === 'settings' ? aSettings() : tab === 'accounts' ? aAccounts() : aDash();
  return `<div class="adm-top"><div class="wrap">${modeBar('admin')}<div class="row between">${logoFull(34)}<div class="row"><button class="btn dark sm" data-act="logout">Keluar</button></div></div>
  <div class="tabs" role="tablist">${ATABS.map(([k, l]) => `<button role="tab" data-act="atab" data-v="${k}" aria-selected="${tab === k}">${l}${k === 'orders' && pendConfirm() ? `<span class="badge-n" aria-label="${pendConfirm()} pembayaran menunggu konfirmasi">${pendConfirm()}</span>` : ''}${k === 'chat' && unreadA() ? `<span class="badge-n">${unreadA()}</span>` : ''}</button>`).join('')}</div></div></div>
  <div class="wrap"><main class="page" style="padding-top:12px">${body}</main></div>`;
}

const pendConfirm = () => S.orders.filter(o => !finalStatus(o.status) && o.pay.status === 'Menunggu Konfirmasi').length;
function payWarn() {
  const ex = Object.entries(S.brand.pay || {}).filter(([, v]) => v.ex).map(([k]) => (PAYS.find(x => x.id === k) || { n: k }).n.replace('Transfer ', ''));
  return ex.length ? `<div class="err" role="alert">Nomor rekening / e-wallet masih contoh (${esc(ex.join(', '))}). Isi data asli di Pengaturan &gt; Rekening Bank &amp; E-Wallet sebelum pelanggan mentransfer.</div>` : '';
}

/* ----- ringkasan ----- */
function aDash() {
  const live = liveOrders(), low = S.products.filter(p => p.active && p.stock <= S.brand.lowStock).sort((a, b) => a.stock - b.stock);
  const top = topProducts(S.orders.filter(o => o.status !== 'Dibatalkan')).slice(0, 5);
  const pend = S.orders.filter(o => !finalStatus(o.status) && o.pay.status === 'Menunggu Konfirmasi'), unpaid = S.orders.filter(o => !finalStatus(o.status) && o.pay.status === 'Belum Dibayar');
  return `<h2>Ringkasan</h2>
  <section class="card"><div class="sec-h"><h3>Perlu konfirmasi pembayaran (${pend.length})</h3><span class="muted sm-t">${unpaid.length} belum bayar</span></div>${pend.length ? adminOrderList(pend) : '<p class="muted">Tidak ada pembayaran yang menunggu konfirmasi.</p>'}</section>
  <div class="stats"><div class="stat hl"><span>Omzet (sudah lunas)</span><b>${rp(omzetOf(S.orders))}</b></div><div class="stat"><span>Total pesanan</span><b>${S.orders.length}</b></div><div class="stat"><span>Pesanan berjalan</span><b>${live.length}</b></div><div class="stat"><span>Produk aktif</span><b>${S.products.filter(p => p.active).length}</b></div></div>
  ${S.orders.length === 0 ? `<div class="hint">Belum ada transaksi. Angka di dashboard ini dihitung dari pesanan yang tersimpan. Buat pesanan lewat menu pelanggan, atau pakai "Buat data uji" di tab Pengaturan.</div>` : ''}
  <section class="card"><div class="sec-h"><h3>Peringatan stok</h3><span class="muted sm-t">Batas menipis: ${S.brand.lowStock}</span></div>
  ${low.length ? low.map(p => `<div class="arow"><img src="${imgOf(p)}" alt=""><div><b>${esc(p.name)}</b><div class="sm-t muted">${p.cat}</div></div><span class="pill ${p.stock <= 0 ? 's6' : 's0'}">${p.stock <= 0 ? 'Habis' : 'Sisa ' + p.stock}</span></div>`).join('') : '<p class="muted">Semua stok aman.</p>'}</section>
  <section class="card"><div class="sec-h"><h3>Pesanan masuk</h3><button class="link" data-act="atab" data-v="orders">Semua</button></div>
  ${live.length ? adminOrderList(live.slice(0, 5)) : '<p class="muted">Tidak ada pesanan berjalan.</p>'}</section>
  <section class="card"><h3 style="margin-bottom:8px">Produk terlaris</h3>${top.length ? topTable(top) : '<p class="muted">Belum ada penjualan.</p>'}</section>`;
}
function topProducts(orders) {
  const m = {};
  orders.forEach(o => o.items.forEach(i => { const r = m[i.name] || (m[i.name] = { name: i.name, qty: 0, rev: 0 }); r.qty += i.qty; r.rev += i.qty * i.unit; }));
  return Object.values(m).sort((a, b) => b.qty - a.qty || b.rev - a.rev);
}
function topTable(rows) {
  const mx = Math.max(...rows.map(r => r.qty), 1);
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produk</th><th class="r">Terjual</th><th class="r">Pendapatan</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td class="r num">${r.qty}</td><td class="r num">${rp(r.rev)}</td><td style="width:90px"><div class="bar"><i style="width:${Math.round(r.qty / mx * 100)}%"></i></div></td></tr>`).join('')}</tbody></table></div>`;
}

/* ----- pesanan ----- */
function adminOrderList(list) {
  if (!list.length) return '<p class="muted">Tidak ada pesanan yang cocok.</p>';
  return `<div class="stack-s">${list.map(o => {
    const fin = finalStatus(o.status), need = !fin && o.pay.status === 'Menunggu Konfirmasi';
    return `<div class="card flat stack-s aocard ${need ? 'need' : ''}"><button class="ocard" style="box-shadow:none;padding:0;background:none" data-act="openOrder" data-id="${o.id}"><div class="row between wrapx"><b>${esc(o.no)}</b><span class="pill s${sIdx(o.status)}">${o.status}</span></div>
  <span class="muted sm-t">${fmt(o.createdAt)} &middot; ${esc(o.customer.name)} </span>
  <span class="muted sm-t">${typeLine(o)} &middot; ${esc(o.pay.name)} &middot; ${orderQty(o)} item</span>
  <span class="row wrapx"><b class="price">${rp(o.total)}</b>${payPill(o)}</span></button>
  <div class="row wrapx">${!fin && !isPaid(o) ? `<button class="btn primary sm" data-act="markPaid" data-id="${o.id}">Konfirmasi Lunas</button>` : ''}${need ? `<button class="btn line sm" data-act="rejectPay" data-id="${o.id}">Belum Masuk</button>` : ''}<button class="btn soft sm" data-act="chatOrder" data-id="${o.id}">Chat</button><button class="btn line sm" data-act="openOrder" data-id="${o.id}">Detail</button></div>
  ${fin ? '' : `<select class="status-sel" data-chg="status" data-id="${o.id}" aria-label="Status ${esc(o.no)}">${statusesFor(o).map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</div>`;
  }).join('')}</div>`;
}
function orderMatches(o, q) {
  q = String(q || '').trim().toLowerCase(); if (!q) return true;
  return [o.no, o.customer.name, o.deliv ? o.deliv.name : '', o.customer.table ? 'meja ' + o.customer.table : '', o.pay.name, typeName(o.type), o.status].join(' ').toLowerCase().includes(q);
}
function filteredOrders() {
  const f = ui.ofilter || 'all', t = ui.otype || 'all';
  return S.orders.filter(o => {
    const live = !finalStatus(o.status);
    const okF = f === 'all' ? true : f === 'live' ? live : f === 'confirm' ? live && o.pay.status === 'Menunggu Konfirmasi' : f === 'unpaid' ? live && o.pay.status !== 'Lunas' : o.status === f;
    return okF && (t === 'all' || o.type === t) && orderMatches(o, ui.oq);
  });
}
function orderListHTML() { const l = filteredOrders(); return `<p class="muted sm-t" style="margin-bottom:8px">${l.length} pesanan ditemukan</p>${adminOrderList(l)}`; }
function aOrders() {
  const f = ui.ofilter || 'all', t = ui.otype || 'all';
  return `<h2>Cek Pesanan & Riwayat Transaksi</h2>
  <div class="search">${ICON.search}<input id="oq" type="search" placeholder="Cari no. pesanan, nama, atau meja" value="${esc(ui.oq || '')}" aria-label="Cari pesanan"></div>
  <div class="fgrid"><label class="f" for="ofSel">Status<select id="ofSel" data-chg="ofilter"><option value="all" ${f === 'all' ? 'selected' : ''}>Semua (${S.orders.length})</option><option value="confirm" ${f === 'confirm' ? 'selected' : ''}>Perlu konfirmasi bayar (${pendConfirm()})</option><option value="unpaid" ${f === 'unpaid' ? 'selected' : ''}>Belum lunas</option><option value="live" ${f === 'live' ? 'selected' : ''}>Sedang berjalan (${liveOrders().length})</option>${['Selesai', 'Dibatalkan'].map(x => `<option ${f === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
  <label class="f" for="otSel">Tipe<select id="otSel" data-chg="otype"><option value="all">Semua tipe</option>${TYPES.map(x => `<option value="${x[0]}" ${t === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label></div>
  <div id="oList">${orderListHTML()}</div>`;
}

/* ----- produk ----- */
function aProducts() {
  const q = ui.pq.trim().toLowerCase();
  const list = S.products.filter(p => !q || p.name.toLowerCase().includes(q));
  return `<div class="row between wrapx"><h2>Produk (${S.products.length})</h2><button class="btn primary sm" data-act="prodForm" data-id="">Tambah Produk</button></div>
  <div class="search">${ICON.search}<input id="pq" type="search" placeholder="Cari produk" value="${esc(ui.pq)}" aria-label="Cari produk"></div>
  <section class="card" id="prodList">${prodRows(list)}</section>`;
}
function prodRows(list) {
  if (!list.length) return '<p class="muted">Produk tidak ditemukan.</p>';
  return list.map(p => `<div class="arow"><img src="${imgOf(p)}" alt=""><div><b>${esc(p.name)}</b> ${p.active ? '' : '<span class="pill s6">Nonaktif</span>'}<div class="sm-t muted">${p.cat} &middot; ${rp(p.price)}${promoActive(p) ? ' &middot; promo ' + rp(p.promoPrice) : ''} &middot; <b style="color:${p.stock <= 0 ? 'var(--bad)' : isLow(p) ? 'var(--warn)' : 'inherit'}">stok ${p.stock}</b></div></div>
  <div class="acts"><button class="btn soft sm" data-act="prodForm" data-id="${p.id}">Edit</button><button class="btn danger sm" data-act="prodDel" data-id="${p.id}">Hapus</button></div></div>`).join('');
}
function prodForm(id) {
  const p = id ? prod(id) : null;
  const v = p || { name: '', desc: '', price: '', cat: 'Burger', stock: 20, img: '', best: false, isNew: false, promoPrice: '', promoStart: '', promoEnd: '', active: true };
  sheet(`<div class="sheet-h"><h3>${p ? 'Edit Produk' : 'Tambah Produk'}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <form class="stack" data-form="product" novalidate><input type="hidden" name="id" value="${p ? p.id : ''}">
  <label class="f" for="pf_name">Nama produk<input id="pf_name" name="name" type="text" value="${esc(v.name)}"></label>
  <label class="f" for="pf_desc">Deskripsi<textarea id="pf_desc" name="desc">${esc(v.desc)}</textarea></label>
  <div class="fgrid"><label class="f" for="pf_price">Harga (Rp)<input id="pf_price" name="price" type="number" min="0" step="500" inputmode="numeric" value="${v.price}"></label>
  <label class="f" for="pf_stock">Stok<input id="pf_stock" name="stock" type="number" min="0" step="1" inputmode="numeric" value="${v.stock}"></label>
  <label class="f full" for="pf_cat">Kategori<select id="pf_cat" name="cat">${CATS.map(c => `<option ${v.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
  <div class="card flat stack-s"><b>Foto produk</b><div class="row"><img src="${p ? imgOf(p) : foodImg('b-chicken')}" alt="" style="width:72px;height:54px;border-radius:10px;object-fit:cover"><span class="muted sm-t">Foto bawaan berupa ilustrasi. Unggah foto sendiri atau tempel alamat gambar.</span></div>
  <label class="f" for="pf_file">Unggah foto<input id="pf_file" name="file" type="file" accept="image/*"></label>
  <label class="f" for="pf_url">atau alamat gambar (URL)<input id="pf_url" name="url" type="url" placeholder="https://..." value="${v.img && !v.img.startsWith('data:') ? esc(v.img) : ''}"></label>
  ${p && p.img ? `<label class="chk"><input type="checkbox" name="resetImg"> Kembalikan ke ilustrasi bawaan</label>` : ''}</div>
  <div class="card flat stack-s"><b>Label & promo</b><label class="chk"><input type="checkbox" name="best" ${v.best ? 'checked' : ''}> Best Seller</label><label class="chk"><input type="checkbox" name="isNew" ${v.isNew ? 'checked' : ''}> New Menu</label><label class="chk"><input type="checkbox" name="partOpt" ${(v.opts || []).some(g => g.id === 'part') ? 'checked' : ''}> Pilihan bagian ayam (Dada / Sayap / Paha), untuk kategori Chicken</label>
  <label class="f" for="pf_pp">Harga promo (Rp, kosongkan jika tidak promo)<input id="pf_pp" name="promoPrice" type="number" min="0" step="500" inputmode="numeric" value="${v.promoPrice || ''}"></label>
  <div class="fgrid"><label class="f" for="pf_ps">Promo mulai<input id="pf_ps" name="promoStart" type="date" value="${v.promoStart || ''}"></label><label class="f" for="pf_pe">Promo sampai<input id="pf_pe" name="promoEnd" type="date" value="${v.promoEnd || ''}"></label></div>
  <small class="muted">Tanggal kosong berarti promo berlaku terus selama harga promo diisi.</small></div>
  <label class="chk"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Produk aktif (tampil di menu pelanggan)</label>
  <div id="formErr" role="alert"></div>
  <button class="btn primary block" type="submit">${p ? 'Simpan Perubahan' : 'Tambah Produk'}</button></form>`);
}
function readImage(file, mx0 = 520) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Gagal membaca file.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('File bukan gambar yang valid.'));
      im.onload = () => {
        const mx = mx0, r = Math.min(1, mx / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .82));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ----- promo: paket & voucher ----- */
function aPromo() {
  return `<div class="row between wrapx"><h2>Paket Hemat</h2><button class="btn primary sm" data-act="bundleForm" data-id="">Tambah Paket</button></div>
  <section class="card">${S.bundles.length ? S.bundles.map(b => `<div class="arow"><img src="${bundleImg(b)}" alt=""><div><b>${esc(b.name)}</b> ${bundleShown(b) ? '' : '<span class="pill s6">Tidak tampil</span>'}<div class="sm-t muted">${rp(b.price)} &middot; ${b.items.map(i => { const p = prod(i.pid); return i.qty + 'x ' + (p ? esc(p.name) : '?'); }).join(', ')}<br>Periode: ${b.start ? fmtDay(b.start) : 'sejak awal'} - ${b.end ? fmtDay(b.end) : 'tanpa batas'} &middot; tersedia ${bundleAvail(b)}</div></div>
  <div class="acts"><button class="btn soft sm" data-act="bundleForm" data-id="${b.id}">Edit</button><button class="btn danger sm" data-act="bundleDel" data-id="${b.id}">Hapus</button></div></div>`).join('') : '<p class="muted">Belum ada paket hemat.</p>'}</section>
  <div class="row between wrapx"><h2>Voucher & Kupon</h2><button class="btn primary sm" data-act="voucherForm" data-id="">Tambah Voucher</button></div>
  <section class="card">${S.vouchers.length ? S.vouchers.map(v => `<div class="arow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(v.code)}</b> ${v.active && inPeriod(v.start, v.end) ? '<span class="pill s5">Aktif</span>' : '<span class="pill s6">Tidak aktif</span>'}<div class="sm-t muted">${esc(voucherText(v))} &middot; min. ${rp(v.min)}<br>Periode: ${v.start ? fmtDay(v.start) : 'sejak awal'} - ${v.end ? fmtDay(v.end) : 'tanpa batas'} &middot; dipakai ${v.used || 0}x</div></div>
  <div class="acts"><button class="btn soft sm" data-act="voucherForm" data-id="${esc(v.code)}">Edit</button><button class="btn danger sm" data-act="voucherDel" data-id="${esc(v.code)}">Hapus</button></div></div>`).join('') : '<p class="muted">Belum ada voucher.</p>'}</section>`;
}
function bundleForm(id) {
  const b = id ? bund(id) : null;
  const v = b || { name: '', desc: '', price: '', kind: 'bundle-solo', items: [], start: '', end: '', active: true };
  const rows = [0, 1, 2, 3].map(i => { const it = v.items[i] || { pid: '', qty: 1 }; return `<div class="row"><select name="pid${i}" aria-label="Produk ${i + 1}"><option value="">- pilih produk -</option>${S.products.map(p => `<option value="${p.id}" ${p.id === it.pid ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><input name="qty${i}" type="number" min="1" max="20" value="${it.pid ? it.qty : 1}" style="width:76px" aria-label="Jumlah ${i + 1}"></div>`; }).join('');
  sheet(`<div class="sheet-h"><h3>${b ? 'Edit Paket' : 'Tambah Paket'}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <form class="stack" data-form="bundle" novalidate><input type="hidden" name="id" value="${b ? b.id : ''}">
  <label class="f" for="bf_name">Nama paket<input id="bf_name" name="name" type="text" value="${esc(v.name)}"></label>
  <label class="f" for="bf_desc">Deskripsi<textarea id="bf_desc" name="desc">${esc(v.desc)}</textarea></label>
  <label class="f" for="bf_price">Harga paket (Rp)<input id="bf_price" name="price" type="number" min="0" step="500" inputmode="numeric" value="${v.price}"></label>
  <div class="stack-s"><b>Isi paket (maks. 4 produk)</b>${rows}</div>
  <label class="f" for="bf_kind">Gambar paket<select id="bf_kind" name="kind"><option value="bundle-solo" ${v.kind === 'bundle-solo' ? 'selected' : ''}>Burger + kentang + minuman</option><option value="bundle-crispy" ${v.kind === 'bundle-crispy' ? 'selected' : ''}>Ayam + nasi + minuman</option><option value="bundle-bestie" ${v.kind === 'bundle-bestie' ? 'selected' : ''}>Dua burger + dua minuman</option></select></label>
  <div class="fgrid"><label class="f" for="bf_s">Berlaku mulai<input id="bf_s" name="start" type="date" value="${v.start}"></label><label class="f" for="bf_e">Berlaku sampai<input id="bf_e" name="end" type="date" value="${v.end}"></label></div>
  <label class="chk"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Paket aktif</label>
  <div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan Paket</button></form>`);
}
function voucherForm(code) {
  const x = code ? S.vouchers.find(v => v.code === code) : null;
  const v = x || { code: '', type: 'percent', value: 10, min: 0, max: 0, start: '', end: '', active: true };
  sheet(`<div class="sheet-h"><h3>${x ? 'Edit Voucher' : 'Tambah Voucher'}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <form class="stack" data-form="voucher" novalidate><input type="hidden" name="orig" value="${x ? esc(x.code) : ''}">
  <label class="f" for="vf_code">Kode<input id="vf_code" name="code" type="text" autocapitalize="characters" value="${esc(v.code)}" placeholder="MISAL: DISKON15"></label>
  <label class="f" for="vf_type">Jenis<select id="vf_type" name="type"><option value="percent" ${v.type === 'percent' ? 'selected' : ''}>Persen (%)</option><option value="flat" ${v.type === 'flat' ? 'selected' : ''}>Potongan Rupiah</option><option value="ship" ${v.type === 'ship' ? 'selected' : ''}>Gratis ongkir (delivery)</option></select></label>
  <div class="fgrid"><label class="f" for="vf_val">Nilai<input id="vf_val" name="value" type="number" min="0" inputmode="numeric" value="${v.value}"></label><label class="f" for="vf_min">Minimal belanja (Rp)<input id="vf_min" name="min" type="number" min="0" inputmode="numeric" value="${v.min}"></label>
  <label class="f full" for="vf_max">Maks. potongan untuk persen (Rp, 0 = tanpa batas)<input id="vf_max" name="max" type="number" min="0" inputmode="numeric" value="${v.max || 0}"></label>
  <label class="f" for="vf_s">Berlaku mulai<input id="vf_s" name="start" type="date" value="${v.start}"></label><label class="f" for="vf_e">Berlaku sampai<input id="vf_e" name="end" type="date" value="${v.end}"></label></div>
  <label class="chk"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Voucher aktif</label>
  <div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan Voucher</button></form>`);
}

/* ----- laporan ----- */
function aReport() {
  const today = dayKey(Date.now()), wk = dayKey(Date.now() - 6 * 864e5);
  const from = ui.rep.from || wk, to = ui.rep.to || today;
  const a = parseD(from), b = parseD(to, true);
  const inR = S.orders.filter(o => o.createdAt >= a && o.createdAt <= b);
  const valid = inR.filter(o => o.status !== 'Dibatalkan');
  const days = {};
  valid.forEach(o => { const k = dayKey(o.createdAt); const d = days[k] || (days[k] = { n: 0, paid: 0, unpaid: 0 }); d.n++; if (isPaid(o)) d.paid += o.total; else d.unpaid += o.total; });
  const keys = Object.keys(days).sort().reverse(), mx = Math.max(...keys.map(k => days[k].paid), 1);
  return `<h2>Laporan Penjualan</h2>
  <section class="card stack"><div class="fgrid"><label class="f" for="rf">Dari tanggal<input id="rf" type="date" data-chg="repFrom" value="${from}"></label><label class="f" for="rt">Sampai tanggal<input id="rt" type="date" data-chg="repTo" value="${to}"></label></div>
  <div class="stats"><div class="stat hl"><span>Omzet lunas</span><b>${rp(omzetOf(inR))}</b></div><div class="stat"><span>Pesanan</span><b>${valid.length}</b></div><div class="stat"><span>Belum dibayar</span><b>${rp(valid.filter(o => !isPaid(o)).reduce((s, o) => s + o.total, 0))}</b></div><div class="stat"><span>Dibatalkan</span><b>${inR.length - valid.length}</b></div></div></section>
  <section class="card"><h3 style="margin-bottom:8px">Per tanggal</h3>${keys.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th class="r">Pesanan</th><th class="r">Omzet lunas</th><th class="r">Belum bayar</th><th></th></tr></thead><tbody>${keys.map(k => `<tr><td>${fmtDay(k)}</td><td class="r num">${days[k].n}</td><td class="r num">${rp(days[k].paid)}</td><td class="r num">${rp(days[k].unpaid)}</td><td style="width:90px"><div class="bar"><i style="width:${Math.round(days[k].paid / mx * 100)}%"></i></div></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Tidak ada transaksi pada rentang ini.</p>'}</section>
  <section class="card"><h3 style="margin-bottom:8px">Produk terlaris pada rentang ini</h3>${valid.length ? topTable(topProducts(valid).slice(0, 8)) : '<p class="muted">Belum ada penjualan.</p>'}</section>
  <section class="card"><h3 style="margin-bottom:8px">Catatan perubahan stok</h3>${S.stockLog.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Produk</th><th class="r">Stok</th><th>Alasan</th></tr></thead><tbody>${S.stockLog.slice(0, 25).map(l => `<tr><td>${fmt(l.ts)}</td><td>${esc(l.name)}</td><td class="r num">${l.from} &rarr; ${l.to}</td><td>${esc(l.reason)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Belum ada perubahan stok.</p>'}</section>`;
}

/* ----- pengaturan & akun ----- */
function aSettings() {
  const b = S.brand;
  return `<h2>Pengaturan</h2>
  <form class="card stack" data-form="brand" novalidate><h3>Profil & identitas brand</h3>
  <label class="f" for="bs_name">Nama brand<input id="bs_name" name="name" type="text" value="${esc(b.name)}"></label>
  <label class="f" for="bs_tag">Tagline<input id="bs_tag" name="tagline" type="text" value="${esc(b.tagline)}"></label>
  <label class="f" for="bs_addr">Alamat toko<input id="bs_addr" name="address" type="text" value="${esc(b.address)}"></label>
  <div class="fgrid"><label class="f" for="bs_ph">Telepon<input id="bs_ph" name="phone" type="text" value="${esc(b.phone)}"></label><label class="f" for="bs_h">Jam buka<input id="bs_h" name="hours" type="text" value="${esc(b.hours)}"></label>
  <label class="f" for="bs_sv">Pajak &amp; layanan (%)<input id="bs_sv" name="servicePct" type="number" min="0" max="30" step="0.5" value="${b.servicePct}"></label>
  <label class="f" for="bs_ig">Instagram<input id="bs_ig" name="instagram" type="text" value="${esc(b.instagram || '')}" placeholder="@namaakun"></label>
  <label class="f full" for="bs_low">Batas stok menipis<input id="bs_low" name="lowStock" type="number" min="0" max="100" value="${b.lowStock}"></label></div>
  <div id="formErr" role="alert"></div><button class="btn primary" type="submit">Simpan Pengaturan</button></form>
  <form class="card stack" data-form="payinfo" novalidate><h3>Rekening Bank &amp; E-Wallet</h3><p class="muted sm-t">Nomor ini tampil ke pelanggan saat memilih metode pembayaran dan di halaman pesanan. Pastikan sesuai rekening asli.</p>
  ${['bri', 'bca', 'bni', 'dana', 'ovo', 'gopay'].map(k => { const pm = PAYS.find(x => x.id === k), v = (b.pay || {})[k] || {}, bank = ['bri', 'bca', 'bni'].includes(k); return `<div class="card flat stack-s"><b>${esc(pm.bank)}</b><div class="fgrid"><label class="f" for="pi_${k}_no">${bank ? 'Nomor rekening' : 'Nomor HP / akun'}<input id="pi_${k}_no" name="${k}_no" type="text" inputmode="numeric" value="${esc(v.no || '')}"></label><label class="f" for="pi_${k}_nm">Atas nama<input id="pi_${k}_nm" name="${k}_nm" type="text" value="${esc(v.name || '')}"></label></div></div>`; }).join('')}
  <div class="card flat stack-s"><b>QRIS</b>${b.pay && b.pay.qris && b.pay.qris.img ? `<img src="${b.pay.qris.img}" alt="QRIS" style="width:120px;border-radius:10px;border:1px solid var(--line)"><label class="chk"><input type="checkbox" name="qris_del"> Hapus gambar QRIS</label>` : '<p class="muted sm-t">Belum ada gambar QRIS.</p>'}
  <label class="f" for="pi_q_nm">Nama merchant<input id="pi_q_nm" name="qris_nm" type="text" value="${esc(((b.pay || {}).qris || {}).name || '')}"></label><label class="f" for="pi_q_f">Unggah gambar QRIS<input id="pi_q_f" name="qris_file" type="file" accept="image/*"></label></div>
  <div id="payErr" role="alert"></div><button class="btn primary" type="submit" style="align-self:flex-start">Simpan Rekening &amp; E-Wallet</button></form>
  <form class="card stack" data-form="accessPin" novalidate><h3>PIN pelanggan</h3><p class="muted sm-t">PIN 4 angka yang diketik pelanggan di layar awal untuk membuka beranda. Berikan hanya ke pelanggan.</p>
  <label class="f" for="ac_p">PIN pelanggan baru (4 angka)<input id="ac_p" name="pin" type="password" inputmode="numeric" maxlength="4"></label>
  <div id="acErr" role="alert"></div><button class="btn soft" type="submit" style="align-self:flex-start">Simpan PIN pelanggan</button></form>
  <form class="card stack" data-form="adminPin" novalidate><h3>Ganti PIN pemilik (akun ini)</h3>
  <div class="fgrid"><label class="f" for="ap_old">PIN lama<input id="ap_old" name="old" type="password" inputmode="numeric" maxlength="4"></label><label class="f" for="ap_new">PIN baru (4 angka)<input id="ap_new" name="pin" type="password" inputmode="numeric" maxlength="4"></label></div>
  <div id="pinErr" role="alert"></div><button class="btn soft" type="submit" style="align-self:flex-start">Ganti PIN</button></form>
  <section class="card stack-s"><h3>Data demo</h3><p class="muted">Data uji dibuat lewat alur pesanan yang sama (stok ikut berkurang, voucher terhitung), jadi dashboard dan laporan terisi dari transaksi tersimpan.</p>
  <div class="row wrapx"><button class="btn soft" data-act="genTest">Buat data uji (6 pesanan)</button><button class="btn danger" data-act="resetAsk">Reset semua data</button></div></section>`;
}
function aAccounts() {
  const adms = S.users.filter(u => u.role === 'admin'), cust = S.users.filter(u => u.role === 'cust');
  const row = u => `<div class="arow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(u.name)}</b> ${u.id === myId() ? '<span class="pill s5">Kamu</span>' : ''}<div class="sm-t muted">${u.role === 'admin' ? 'Username: ' + esc(u.username) : 'Telepon: ' + esc(u.phone) + ' &middot; ' + S.orders.filter(o => o.userId === u.id).length + ' pesanan'}</div></div>
  <div class="acts"><button class="btn soft sm" data-act="pinForm" data-id="${u.id}">Reset PIN</button>${u.id === myId() ? '' : `<button class="btn danger sm" data-act="userDel" data-id="${u.id}">Hapus</button>`}</div></div>`;
  return `<h2>Akun</h2>
  <section class="card"><div class="sec-h"><h3>Admin (${adms.length})</h3><button class="btn primary sm" data-act="adminForm">Tambah Admin</button></div>${adms.map(row).join('')}</section>
  <section class="card"><h3 style="margin-bottom:6px">Pelanggan (${cust.length})</h3>${cust.length ? cust.map(row).join('') : '<p class="muted">Pelanggan masuk memakai PIN pelanggan (atur di Pengaturan), jadi tidak ada akun pelanggan terpisah.</p>'}</section>
  <p class="muted sm-t">Catatan keamanan: ini versi demo dengan data di browser. Untuk dipakai sungguhan, pindahkan autentikasi dan data ke server (misalnya Supabase atau Firebase).</p>`;
}
function adminFormSheet() {
  sheet(`<div class="sheet-h"><h3>Tambah Admin</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <form class="stack" data-form="newAdmin" novalidate><label class="f" for="na_n">Nama<input id="na_n" name="name" type="text"></label><label class="f" for="na_u">Username<input id="na_u" name="user" type="text" autocapitalize="none"></label>
  <label class="f" for="na_p">PIN (4 angka)<input id="na_p" name="pin" type="password" inputmode="numeric" maxlength="4"></label><div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Tambah Admin</button></form>`);
}
function pinFormSheet(id) {
  const u = S.users.find(x => x.id === id); if (!u) return;
  sheet(`<div class="sheet-h"><h3>Reset PIN ${esc(u.name)}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
  <form class="stack" data-form="resetPin" novalidate><input type="hidden" name="id" value="${u.id}"><label class="f" for="rp_p">PIN baru<input id="rp_p" name="pin" type="password" inputmode="numeric" maxlength="4"></label><div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan PIN</button></form>`);
}
/* ===== Aksi, form, dan inisialisasi ===== */
const adminOnly = fn => (...a) => { if (!isAdmin()) { toast('Aksi ini hanya untuk admin.', 'err'); return; } return fn(...a); };
const orderById = id => S.orders.find(o => o.id === id);
function copyText(text, okMsg) {
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove();
    toast(ok ? okMsg : 'Salin otomatis tidak didukung. Pilih dan salin manual.', ok ? 'ok' : 'err');
  };
  try { navigator.clipboard.writeText(text).then(() => toast(okMsg, 'ok'), fallback); } catch (e) { fallback(); }
}
function rerenderKeep() { render(); }

const actions = {
  key(t) {
    if (ui.pin.length >= 4) return;
    ui.pin += t.dataset.v; pinSync();
    if (ui.pin.length === 4) setTimeout(() => { if (ui.pin.length === 4) submitPin(); }, 130);
  },
  keyDel() { ui.pin = ui.pin.slice(0, -1); pinSync(); },
  rate(t) {
    const me = myId(); if (!me || isAdmin()) { toast('Rating hanya untuk pelanggan.', 'err'); return; }
    const id = t.dataset.id, v = Number(t.dataset.v); if (!prod(id) || !(v >= 1 && v <= 5)) return;
    (S.rates[id] = S.rates[id] || {})[me] = v; save();
    const bx = $('#rateBox'); if (bx) bx.innerHTML = rateBox(id);
    render(); toast('Terima kasih, rating kamu tersimpan.', 'ok');
  },
  logout() { ui.aorder = null; S.session = null; S.cart = []; ui.draft = { type: 'dinein', pay: 'cash', voucher: '', note: '', name: '', phone: '', address: '', dnote: '', table: '', deliv: '' }; save(); closeSheet(); go('splash', { loginErr: '', pin: '' }); toast('Layar dikunci.', 'ok'); },
  tab(t) { nav(t.dataset.v); },
  back() { nav(ui.tab); },
  toMenu() { nav('menu'); },
  toOrders() { if (isAdmin()) { ui.aorder = null; render(); toTop(); return; } nav('orders'); },
  openCart() { nav(ui.tab, 'cart'); },
  toCheckout() { cleanCart(); if (!S.cart.length) { toast('Keranjang masih kosong.', 'err'); return; } const p = stockProblem(S.cart); if (p) { toast(p, 'err'); return; } nav(ui.tab, 'checkout'); },
  openProduct(t) { openProduct(t.dataset.id); },
  openBundle(t) { openBundle(t.dataset.id); },
  addQuick(t) {
    const type = t.dataset.t, id = t.dataset.id, item = type === 'p' ? prod(id) : bund(id); if (!item) return;
    if (type === 'p' && (item.opts || []).some(g => g.id === 'part')) { openProduct(id); return; } /* menu ayam: pelanggan memilih dada / sayap / paha dulu */
    const r = addToCart(type, id, type === 'p' ? defaultOpts(item) : [], 1);
    if (!r.ok) { toast(r.msg, 'err'); return; }
    toast(item.name + ' masuk keranjang.', 'ok'); render();
  },
  fav(t) {
    const id = t.dataset.id, me = myId(); if (!me) return;
    const a = S.favs[me] || (S.favs[me] = []), i = a.indexOf(id);
    if (i >= 0) a.splice(i, 1); else a.push(id);
    save(); render(); if (t.dataset.sheet) openProduct(id);
    toast(i >= 0 ? 'Dihapus dari favorit.' : 'Ditambahkan ke favorit.', 'ok');
  },
  copyCode(t) { copyText(t.dataset.v, 'Kode ' + t.dataset.v + ' disalin. Tempel di keranjang.'); },
  catGo(t) { ui.cat = t.dataset.v; ui.q = ''; ui.onlyFav = false; nav('menu'); },
  cat(t) { ui.cat = t.dataset.v; render(); },
  resetFilter() { Object.assign(ui, { q: '', cat: 'Semua', price: 'all', onlyStock: false, onlyFav: false }); render(); },
  favMenu() { Object.assign(ui, { cat: 'Semua', q: '', onlyFav: true }); nav('menu'); },
  clearCart() { ask('Kosongkan keranjang?', 'Semua item di keranjang akan dihapus.', 'Kosongkan', () => { S.cart = []; save(); render(); }); },
  dec(t) { const i = +t.dataset.i; setQty(i, (S.cart[i] ? S.cart[i].q : 0) - 1); render(); },
  inc(t) { const i = +t.dataset.i; setQty(i, (S.cart[i] ? S.cart[i].q : 0) + 1); render(); },
  rm(t) { setQty(+t.dataset.i, 0); render(); toast('Item dihapus dari keranjang.', 'ok'); },
  applyV() {
    const code = ($('#vcode').value || '').trim().toUpperCase(); ui.draft.voucher = code;
    if (!code) { toast('Masukkan kode voucher dulu.', 'err'); return; }
    render();
  },
  clearV() { ui.draft.voucher = ''; render(); },
  pickV(t) { const c = t.dataset.v; ui.draft.voucher = ui.draft.voucher === c ? '' : c; render(); },
  setType(t) { ui.draft.type = t.dataset.v; render(); },
  setPay(t) { ui.draft.pay = t.dataset.v; render(); },
  confirmOrder() {
    const d = ui.draft, box = $('#coErr'), fail = m => { box.innerHTML = `<div class="err">${esc(m)}</div>`; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); toast(m, 'err'); };
    const name = d.name.trim();
    if (name.length < 2) return fail('Isi nama pemesan.');
    if (d.type === 'delivery' && d.address.trim().length < 8) return fail('Alamat pengantaran wajib diisi lengkap.');
    if (d.type === 'dinein' && !String(d.table || '').trim()) return fail('Isi nomor meja untuk Dine In.');
    const r = createOrder({ type: d.type, deliv: d.deliv, customer: { name, address: d.address.trim(), dnote: d.dnote.trim(), table: String(d.table || '').trim() }, note: d.note.trim(), pay: d.pay, code: d.voucher, userId: myId() });
    if (!r.ok) return fail(r.msg);
    ui.draft.voucher = ''; ui.draft.note = '';
    nav('orders', 'order', r.order.id);
    toast('Pesanan ' + r.order.no + ' dibuat.' + (PAYS.find(x => x.id === d.pay).cash ? '' : ' Silakan lakukan pembayaran.'), 'ok');
  },
  openOrder(t) { if (isAdmin()) { ui.aorder = t.dataset.id; ui.anim = true; render(); toTop(); return; } nav('orders', 'order', t.dataset.id); },
  reportPay(t) {
    const o = orderById(t.dataset.id); if (!o || !canView(o) || o.userId !== myId()) return;
    if (payCash(o)) { toast('Pembayaran tunai dikonfirmasi oleh kasir.', 'err'); return; }
    if (reportPay(o)) { render(); toast('Terima kasih. Admin akan memeriksa pembayaranmu.', 'ok'); }
  },
  copyText(t) { copyText(t.dataset.v, t.dataset.m || 'Disalin.'); },
  markPaid: adminOnly(t => { const o = orderById(t.dataset.id); if (!o) return; setPaid(o); render(); toast('Pembayaran ' + o.no + ' dikonfirmasi lunas.', 'ok'); }),
  rejectPay: adminOnly(t => { const o = orderById(t.dataset.id); if (!o) return; if (rejectPay(o)) { render(); toast('Pembayaran ' + o.no + ' ditandai belum masuk.', 'ok'); } }),
  cancelAsk(t) {
    const o = orderById(t.dataset.id); if (!o || !canView(o)) return;
    if (!isAdmin() && (o.status !== 'Menunggu Pembayaran' || o.pay.status === 'Menunggu Konfirmasi')) { toast('Pesanan yang sudah diproses atau sedang dikonfirmasi hanya bisa dibatalkan oleh admin.', 'err'); return; }
    ask('Batalkan pesanan ' + o.no + '?', 'Stok produk akan dikembalikan dan pesanan tidak bisa diaktifkan lagi.', 'Ya, batalkan', () => {
      if (!isAdmin() && (o.status !== 'Menunggu Pembayaran' || o.pay.status === 'Menunggu Konfirmasi')) return;
      if (cancelOrder(o, isAdmin() ? 'Dibatalkan oleh admin' : 'Dibatalkan oleh pelanggan')) { toast('Pesanan dibatalkan dan stok dikembalikan.', 'ok'); render(); }
    });
  },
  deleteOrder(t) {
    const o = orderById(t.dataset.id); if (!o || !canView(o) || !finalStatus(o.status)) return;
    const adm = isAdmin();
    ask('Hapus pesanan ' + o.no + '?', adm ? 'Pesanan dihapus permanen dari data dan laporan penjualan.' : 'Pesanan hilang dari riwayatmu. Toko tetap menyimpan catatan transaksinya.', 'Hapus', () => {
      if (adm) { S.orders = S.orders.filter(x => x.id !== o.id); ui.aorder = null; } else o.hidden = true;
      save(); if (adm) render(); else nav('orders'); toast('Pesanan dihapus.', 'ok');
    });
  },
  reorder(t) {
    const o = orderById(t.dataset.id); if (!o || !canView(o)) return;
    let added = 0, skipped = [];
    o.items.forEach(i => {
      const p = S.products.find(x => x.name === i.name && x.active), b = S.bundles.find(x => x.name === i.name && bundleShown(x));
      const item = p || b; if (!item) { skipped.push(i.name); return; }
      const r = p ? addToCart('p', p.id, defaultOpts(p), i.qty) : addToCart('b', b.id, [], i.qty);
      if (r.ok) added++; else skipped.push(i.name);
    });
    if (added) { toast(added + ' item masuk keranjang' + (skipped.length ? '. Tidak tersedia: ' + skipped.join(', ') : '.'), skipped.length ? '' : 'ok'); nav(ui.tab, 'cart'); }
    else toast('Item pesanan ini sedang tidak tersedia.', 'err');
  },
  /* sheet detail */
  detMinus() { if (ui.det.q > 1) { ui.det.q--; ui.det.t === 'p' ? detRefresh() : detBundleRefresh(); } },
  detPlus() { if (ui.det.q < 20) { ui.det.q++; ui.det.t === 'p' ? detRefresh() : detBundleRefresh(); } },
  detAdd() {
    const d = ui.det; if (!d) return;
    const opts = d.t === 'p' ? detCalc().opts : [];
    const r = addToCart(d.t, d.id, opts, d.q);
    if (!r.ok) { toast(r.msg, 'err'); return; }
    closeSheet(); render(); toast('Ditambahkan ke keranjang.', 'ok');
  },
  closeSheet() { closeSheet(); },
  closeSheetBg(t, e) { if (e.target === t) closeSheet(); },
  askOk() { const fn = pendingAsk; closeSheet(); if (fn) fn(); },
  /* admin */
  toAdmin() { if (hasAdmin()) { ui.aorder = null; go('admin'); return; } unlockSheet(); },
  toCust() { ui.aorder = null; nav(ui.tab || 'home'); },
  openChat() { ui.chatOrder = ''; nav(ui.tab, 'chat'); },
  chatOrder(t) { const o = orderById(t.dataset.id); if (!o || !canView(o)) return;
    if (isAdmin()) { chatThread(o.userId, o.customer.name); save(); ui.atab = 'chat'; ui.aorder = null; ui.achat = o.userId; ui.anim = true; render(); toTop(); return; }
    ui.chatOrder = o.id; nav(ui.tab, 'chat'); },
  chatClearOrder() { ui.chatOrder = ''; render(); },
  quickMsg(t) { const i = $('#chatIn'); if (i) { i.value = t.dataset.v; i.focus(); } },
  achatOpen(t) { ui.achat = t.dataset.id; render(); toTop(); },
  achatBack() { ui.achat = null; render(); },
  ocf(t) { ui.ocf = t.dataset.v; render(); },
  ocfGo(t) { ui.ocf = t.dataset.v; nav('orders'); },
  setDeliv(t) { ui.draft.deliv = t.dataset.v; render(); },
  vouchSheet() { const L = S.vouchers.filter(v => v.active && inPeriod(v.start, v.end)); sheet(`<div class="sheet-h"><h3>Voucher Saya</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div><div class="stack-s">${L.length ? L.map(v => `<div class="card flat row between"><div><b>${esc(v.code)}</b><div class="sm-t muted">${esc(voucherText(v))}. Min. belanja ${rp(v.min)}</div></div><button class="btn soft sm" data-act="copyCode" data-v="${esc(v.code)}">Salin</button></div>`).join('') : '<p class="muted">Belum ada voucher aktif.</p>'}</div>`); },
  editProfile() { const p = prof(); sheet(`<div class="sheet-h"><h3>Edit Profil</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div><form class="stack" data-form="profileEdit" novalidate><label class="f" for="pe_n">Nama<input id="pe_n" name="name" type="text" value="${esc(myName())}"></label><label class="f" for="pe_e">Email <small>(opsional)</small><input id="pe_e" name="email" type="email" value="${esc(p.email)}"></label><button class="btn primary block" type="submit">Simpan</button></form>`); },
  helpSheet() { const Q = [['Cara memesan', 'Pilih menu, masukkan ke keranjang, lalu Checkout. Pilih Dine In, Take Away, atau Delivery.'], ['Cara membayar', 'Pilih Tunai, transfer bank, e-wallet, atau QRIS. Nomor tujuan tampil di checkout; setelah transfer tekan "Saya Sudah Bayar".'], ['Delivery', 'Pilih layanan antar (Kurir LUNARA, GrabFood, GoFood, ShopeeFood, Maxim Food). Ongkir menyesuaikan layanan.'], ['Membatalkan pesanan', 'Pesanan yang belum dibayar bisa dibatalkan sendiri. Selebihnya hubungi admin lewat Chat.']]; sheet(`<div class="sheet-h"><h3>Pusat Bantuan</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div><div class="stack-s">${Q.map(q => `<details class="card flat"><summary><b>${q[0]}</b></summary><p class="muted" style="margin-top:6px">${q[1]}</p></details>`).join('')}<button class="btn primary block" data-act="openChat">Chat Toko</button></div>`); },
  atab(t) { ui.atab = t.dataset.v; ui.aorder = null; ui.achat = null; ui.anim = true; render(); toTop(); },
  prodForm: adminOnly(t => prodForm(t.dataset.id)),
  prodDel: adminOnly(t => {
    const p = prod(t.dataset.id); if (!p) return;
    ask('Hapus ' + p.name + '?', 'Produk dihapus dari menu, paket, dan keranjang. Riwayat pesanan lama tetap tersimpan.', 'Hapus', () => {
      S.products = S.products.filter(x => x.id !== p.id);
      S.bundles.forEach(b => { b.items = b.items.filter(i => i.pid !== p.id); if (!b.items.length) b.active = false; });
      cleanCart(); save(); render(); toast('Produk dihapus.', 'ok');
    });
  }),
  bundleForm: adminOnly(t => bundleForm(t.dataset.id)),
  bundleDel: adminOnly(t => { const b = bund(t.dataset.id); if (!b) return; ask('Hapus paket ' + b.name + '?', 'Paket akan hilang dari menu pelanggan.', 'Hapus', () => { S.bundles = S.bundles.filter(x => x.id !== b.id); cleanCart(); save(); render(); toast('Paket dihapus.', 'ok'); }); }),
  voucherForm: adminOnly(t => voucherForm(t.dataset.id)),
  voucherDel: adminOnly(t => { const code = t.dataset.id; ask('Hapus voucher ' + code + '?', 'Kode ini tidak bisa dipakai lagi.', 'Hapus', () => { S.vouchers = S.vouchers.filter(v => v.code !== code); save(); render(); toast('Voucher dihapus.', 'ok'); }); }),
  adminForm: adminOnly(() => adminFormSheet()),
  pinForm: adminOnly(t => pinFormSheet(t.dataset.id)),
  userDel: adminOnly(t => {
    const u = S.users.find(x => x.id === t.dataset.id); if (!u || u.id === myId()) return;
    ask('Hapus akun ' + u.name + '?', 'Akun tidak bisa masuk lagi. Riwayat pesanannya tetap tersimpan.', 'Hapus', () => { S.users = S.users.filter(x => x.id !== u.id); save(); render(); toast('Akun dihapus.', 'ok'); });
  }),
  genTest: adminOnly(() => {
    const names = ['Rani', 'Dimas', 'Salsa', 'Aldo', 'Nadia', 'Fikri'], keep = S.cart; let made = 0;
    for (let i = 0; i < 6; i++) {
      const pool = S.products.filter(p => p.active && p.stock > 3); if (pool.length < 3) break;
      S.cart = []; const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) { const p = pool[Math.floor(Math.random() * pool.length)]; addToCart('p', p.id, defaultOpts(p), 1 + Math.floor(Math.random() * 2)); }
      if (!S.cart.length) continue;
      const type = ['dinein', 'pickup', 'delivery'][i % 3], pay = PAYS[(i * 3) % PAYS.length].id;
      const r = createOrder({ type, customer: { name: names[i], phone: '08123456' + (1000 + i), address: 'Jl. Uji Coba No. ' + (i + 1), table: String(i + 3) }, note: '', pay, code: '', userId: 'g-uji', createdAt: Date.now() - (5 - i) * 864e5 - i * 36e5 });
      if (!r.ok) continue; made++; const o = r.order;
      if (i % 3 !== 2) { setPaid(o); if (i % 3 === 0) { setStatus(o, 'Sedang Disiapkan'); setStatus(o, stageList(type)[3]); setStatus(o, 'Selesai'); } }
      if (i === 4) cancelOrder(o, 'Dibatalkan (data uji)');
      if (i === 5) reportPay(o);
    }
    S.cart = keep; save(); render(); toast(made + ' pesanan uji dibuat lewat alur transaksi.', 'ok');
  }),
  resetAsk: adminOnly(() => ask('Reset semua data?', 'Produk, pesanan, akun, voucher, dan pengaturan kembali ke data awal. Aksi ini tidak bisa dibatalkan.', 'Reset', () => { S = seed(); save(); go('splash', { loginErr: '', pin: '' }); toast('Data dikembalikan ke awal.', 'ok'); })),
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const fn = actions[t.dataset.act]; if (!fn) return;
  if (t.tagName === 'A') e.preventDefault();
  fn(t, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'au_p') { t.value = t.value.replace(/\D/g, '').slice(0, 4); if (t.value.length === 4) forms.adminUnlock(t.closest('form')); }
  else if (t.id === 'q') { ui.q = t.value; const g = $('#menuGrid'); if (g) g.innerHTML = menuGridHTML(); }
  else if (t.id === 'oq' && isAdmin()) { ui.oq = t.value; const g = $('#oList'); if (g) g.innerHTML = orderListHTML(); }
  else if (t.id === 'pq' && isAdmin()) { ui.pq = t.value; const g = $('#prodList'); if (g) g.innerHTML = prodRows(S.products.filter(p => !ui.pq.trim() || p.name.toLowerCase().includes(ui.pq.trim().toLowerCase()))); }
  else if (t.dataset && t.dataset.draft) ui.draft[t.dataset.draft] = t.value;
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fPrice') { ui.price = t.value; const g = $('#menuGrid'); if (g) g.innerHTML = menuGridHTML(); }
  else if (t.id === 'fStock') { ui.onlyStock = t.checked; const g = $('#menuGrid'); if (g) g.innerHTML = menuGridHTML(); }
  else if (t.id === 'fFav') { ui.onlyFav = t.checked; const g = $('#menuGrid'); if (g) g.innerHTML = menuGridHTML(); }
  else if (t.closest && t.closest('#detOpts')) detRefresh();
  else if (t.dataset && t.dataset.chg) {
    const k = t.dataset.chg;
    if (k === 'status') {
      if (!isAdmin()) { toast('Aksi ini hanya untuk admin.', 'err'); return; }
      const o = orderById(t.dataset.id); if (!o) return;
      const r = setStatus(o, t.value);
      if (!r.ok && r.msg) toast(r.msg, 'err'); else if (r.ok) toast('Status ' + o.no + ': ' + o.status, 'ok');
      render();
    } else if (isAdmin()) {
      if (k === 'ofilter') ui.ofilter = t.value; else if (k === 'otype') ui.otype = t.value; else if (k === 'repFrom') ui.rep.from = t.value; else if (k === 'repTo') ui.rep.to = t.value;
      render();
    }
  }
});

/* ---------- form ---------- */
const forms = {
  adminUnlock(f) {
    const pin = String(new FormData(f).get('pin') || ''), box = $('#formErr'), err = m => { box.innerHTML = `<div class="err">${esc(m)}</div>`; };
    if (ui.lockUntil > Date.now()) return err('Coba lagi dalam ' + Math.ceil((ui.lockUntil - Date.now()) / 1000) + ' detik.');
    const adm = S.users.find(u => u.role === 'admin' && /^\d{4}$/.test(pin) && u.pin === hashPin(u.salt, pin));
    if (!adm) { ui.fails = (ui.fails || 0) + 1; if (ui.fails >= 5) { ui.fails = 0; ui.lockUntil = Date.now() + 30000; return err('Terlalu banyak percobaan. Coba lagi dalam 30 detik.'); } return err('PIN salah, coba lagi.'); }
    ui.fails = 0; S.session.adminId = adm.id; save(); closeSheet(); go('admin', { atab: 'dash' }); toast('Selamat datang, ' + adm.name + '.', 'ok');
  },
  chatSendO(f) { const o = orderById(f.dataset.oid); if (!o || !canView(o)) return; const adm = isAdmin();
    if (!sendChat(adm ? o.userId : myId(), adm ? 'a' : 'c', new FormData(f).get('text'), o.no, adm ? o.customer.name : myName())) return; render(); const i = $('#chatIn'); if (i) i.focus(); },
  chatSend(f) { const o = ui.chatOrder ? orderById(ui.chatOrder) : null; if (!sendChat(myId(), 'c', new FormData(f).get('text'), o ? o.no : '', myName())) return; render(); const i = $('#chatIn'); if (i) i.focus(); },
  chatSendA: adminOnly(f => { if (!ui.achat || !sendChat(ui.achat, 'a', new FormData(f).get('text'))) return; render(); const i = $('#chatIn'); if (i) i.focus(); }),
  profileEdit(f) {
    const fd = new FormData(f), n = String(fd.get('name') || '').trim(); if (n.length < 2) { toast('Nama terlalu pendek.', 'err'); return; }
    S.cname = n; if (S.session) S.session.name = n; prof().email = String(fd.get('email') || '').trim(); save(); closeSheet(); render(); toast('Profil diperbarui.', 'ok');
  },
  product: adminOnly(async f => {
    const fd = new FormData(f), err = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const id = fd.get('id'), name = String(fd.get('name') || '').trim(), price = Math.round(num(fd.get('price'))), stock = Math.round(num(fd.get('stock')));
    const pp = fd.get('promoPrice') === '' ? 0 : Math.round(num(fd.get('promoPrice')));
    if (name.length < 2) return err('Nama produk wajib diisi.');
    if (price <= 0) return err('Harga harus lebih dari 0.');
    if (stock < 0 || !Number.isFinite(stock)) return err('Stok tidak boleh negatif.');
    if (pp && pp >= price) return err('Harga promo harus lebih kecil dari harga normal.');
    const ps = String(fd.get('promoStart') || ''), pe = String(fd.get('promoEnd') || '');
    if (ps && pe && ps > pe) return err('Tanggal akhir promo harus setelah tanggal mulai.');
    if (S.products.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) return err('Sudah ada produk dengan nama itu.');
    let img = null; const file = fd.get('file'), url = String(fd.get('url') || '').trim();
    try {
      if (file && file.size) { if (file.size > 8e6) return err('Ukuran foto maksimal 8 MB.'); img = await readImage(file); }
      else if (fd.get('resetImg')) img = '';
      else if (url) { if (!/^https?:\/\//i.test(url)) return err('Alamat gambar harus diawali http:// atau https://.'); img = url; }
    } catch (ex) { return err(ex.message); }
    const cat = String(fd.get('cat'));
    const wantPart = !!fd.get('partOpt') && cat === 'Chicken';
    const setPart = o => { o.opts = (o.opts || []).filter(g => g.id !== 'part'); if (wantPart) o.opts.unshift(OPT.part); };
    let p = id ? prod(id) : null;
    if (p) {
      const oldStock = p.stock;
      if (p.cat !== cat) p.opts = CAT_OPTS[cat].map(k => OPT[k]);
      Object.assign(p, { name, desc: String(fd.get('desc') || '').trim(), price, cat, promoPrice: pp, promoStart: ps, promoEnd: pe, best: !!fd.get('best'), isNew: !!fd.get('isNew'), active: !!fd.get('active') });
      if (img !== null) p.img = img;
      setPart(p);
      if (stock !== oldStock) adjustStock(p.id, stock - oldStock, 'Edit stok oleh admin');
    } else {
      p = { id: 'p' + uid(), name, desc: String(fd.get('desc') || '').trim() || 'Menu baru LUNARA.', price, cat, stock: 0, kind: CAT_KIND[cat], img: img || '', active: !!fd.get('active'), best: !!fd.get('best'), isNew: !!fd.get('isNew'), promoPrice: pp, promoStart: ps, promoEnd: pe, opts: CAT_OPTS[cat].map(k => OPT[k]) };
      setPart(p); S.products.push(p); adjustStock(p.id, stock, 'Produk baru');
    }
    save(); closeSheet(); render(); toast('Produk "' + name + '" disimpan.', 'ok');
  }),
  bundle: adminOnly(f => {
    const fd = new FormData(f), err = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const name = String(fd.get('name') || '').trim(), price = Math.round(num(fd.get('price')));
    const items = {}; for (let i = 0; i < 4; i++) { const pid = fd.get('pid' + i); if (pid && prod(pid)) items[pid] = (items[pid] || 0) + Math.max(1, Math.min(20, Math.round(num(fd.get('qty' + i))) || 1)); }
    const list = Object.entries(items).map(([pid, qty]) => ({ pid, qty }));
    const s = String(fd.get('start') || ''), e = String(fd.get('end') || '');
    if (name.length < 2) return err('Nama paket wajib diisi.');
    if (price <= 0) return err('Harga paket harus lebih dari 0.');
    if (!list.length) return err('Pilih minimal satu produk untuk paket.');
    if (s && e && s > e) return err('Tanggal akhir harus setelah tanggal mulai.');
    const id = fd.get('id'); let b = id ? bund(id) : null;
    const data = { name, desc: String(fd.get('desc') || '').trim(), price, kind: String(fd.get('kind')), items: list, start: s, end: e, active: !!fd.get('active') };
    if (b) Object.assign(b, data); else S.bundles.push({ id: 'b' + uid(), ...data });
    save(); closeSheet(); render(); toast('Paket "' + name + '" disimpan.', 'ok');
  }),
  voucher: adminOnly(f => {
    const fd = new FormData(f), err = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const code = String(fd.get('code') || '').trim().toUpperCase(), orig = String(fd.get('orig') || ''), type = String(fd.get('type'));
    const value = Math.round(num(fd.get('value'))), min = Math.round(num(fd.get('min'))), max = Math.round(num(fd.get('max')));
    const s = String(fd.get('start') || ''), e = String(fd.get('end') || '');
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return err('Kode 3 sampai 20 huruf atau angka tanpa spasi.');
    if (S.vouchers.some(v => v.code === code && v.code !== orig)) return err('Kode voucher sudah dipakai.');
    if (type === 'percent' && (value < 1 || value > 100)) return err('Persen harus antara 1 dan 100.');
    if (type === 'flat' && value < 1) return err('Nilai potongan harus lebih dari 0.');
    if (s && e && s > e) return err('Tanggal akhir harus setelah tanggal mulai.');
    const data = { code, type, value: type === 'ship' ? 0 : value, min: Math.max(0, min), max: type === 'percent' ? Math.max(0, max) : 0, start: s, end: e, active: !!fd.get('active') };
    const ex = S.vouchers.find(v => v.code === orig);
    if (ex) Object.assign(ex, data); else S.vouchers.push({ ...data, used: 0 });
    save(); closeSheet(); render(); toast('Voucher ' + code + ' disimpan.', 'ok');
  }),
  brand: adminOnly(f => {
    const fd = new FormData(f), err = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const name = String(fd.get('name') || '').trim(); if (name.length < 2) return err('Nama brand wajib diisi.');
    const sv = num(fd.get('servicePct')), low = Math.round(num(fd.get('lowStock')));
    if (sv < 0 || sv > 30) return err('Biaya layanan antara 0 dan 30 persen.');
    Object.assign(S.brand, { name, tagline: String(fd.get('tagline') || '').trim() || S.brand.tagline, address: String(fd.get('address') || '').trim(), phone: String(fd.get('phone') || '').trim(), hours: String(fd.get('hours') || '').trim(), servicePct: sv, lowStock: Math.max(0, low), instagram: String(fd.get('instagram') || '').trim() });
    save(); render(); toast('Pengaturan disimpan.', 'ok');
  }),
  payinfo: adminOnly(async f => {
    const fd = new FormData(f), box = $('#payErr'), err = m => { box.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const next = {};
    for (const k of ['bri', 'bca', 'bni', 'dana', 'ovo', 'gopay']) {
      const no = String(fd.get(k + '_no') || '').trim(), nm = String(fd.get(k + '_nm') || '').trim(), label = PAYS.find(x => x.id === k).bank;
      if (no && digits(no).length < 6) return err('Nomor ' + label + ' tidak valid (minimal 6 angka).');
      if (no && nm.length < 2) return err('Isi nama pemilik untuk ' + label + '.');
      next[k] = { no, name: nm, ex: false };
    }
    const q = (S.brand.pay || {}).qris || {}; let img = q.img || '';
    try { const file = fd.get('qris_file'); if (file && file.size) { if (file.size > 8e6) return err('Ukuran gambar QRIS maksimal 8 MB.'); img = await readImage(file, 800); } else if (fd.get('qris_del')) img = ''; } catch (ex) { return err(ex.message); }
    next.qris = { img, name: String(fd.get('qris_nm') || '').trim(), ex: false, demo: !!q.demo && img === q.img };
    S.brand.pay = next; save(); render(); toast('Rekening & e-wallet disimpan.', 'ok');
  }),
  adminPin: adminOnly(f => {
    const fd = new FormData(f), u = curUser(), box = $('#pinErr'), err = m => { box.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    if (u.pin !== hashPin(u.salt, String(fd.get('old') || ''))) return err('PIN lama salah.');
    const pin = String(fd.get('pin') || ''); if (!/^\d{4}$/.test(pin)) return err('PIN baru harus 4 angka.'); if (pinTaken(pin, u.id)) return err('PIN itu sudah dipakai. Pilih angka lain.');
    u.salt = uid(); u.pin = hashPin(u.salt, pin); save(); f.reset(); box.innerHTML = '<div class="okmsg">PIN berhasil diganti.</div>'; toast('PIN diganti.', 'ok');
  }),
  accessPin: adminOnly(f => {
    const pin = String(new FormData(f).get('pin') || ''), box = $('#acErr'), err = m => { box.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    if (!/^\d{4}$/.test(pin)) return err('PIN pelanggan harus 4 angka.');
    if (S.users.some(u => u.role === 'admin' && u.pin === hashPin(u.salt, pin))) return err('PIN itu sudah dipakai. Pilih angka lain.');
    S.access = { salt: uid(), pin: '' }; S.access.pin = hashPin(S.access.salt, pin); save(); f.reset(); box.innerHTML = '<div class="okmsg">PIN pelanggan diganti.</div>'; toast('PIN pelanggan diganti.', 'ok');
  }),
  newAdmin: adminOnly(f => {
    const fd = new FormData(f), err = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; toast(m, 'err'); };
    const name = String(fd.get('name') || '').trim(), un = String(fd.get('user') || '').trim().toLowerCase(), pin = String(fd.get('pin') || '');
    if (name.length < 2) return err('Nama wajib diisi.');
    if (!/^[a-z0-9._-]{3,20}$/.test(un)) return err('Username 3 sampai 20 karakter (huruf kecil, angka, titik, strip).');
    if (S.users.some(x => x.username && x.username.toLowerCase() === un)) return err('Username sudah dipakai.');
    if (!/^\d{4}$/.test(pin)) return err('PIN harus 4 angka.'); if (pinTaken(pin)) return err('PIN itu sudah dipakai. Pilih angka lain.');
    const salt = uid(); S.users.push({ id: 'u' + uid(), role: 'admin', name, username: un, salt, pin: hashPin(salt, pin), created: Date.now() });
    save(); closeSheet(); render(); toast('Admin ' + name + ' ditambahkan.', 'ok');
  }),
  resetPin: adminOnly(f => {
    const fd = new FormData(f), u = S.users.find(x => x.id === fd.get('id')); if (!u) return;
    const pin = String(fd.get('pin') || ''), re = /^\d{4}$/;
    if (!re.test(pin)) { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">PIN harus 4 angka.</div>`; return; }
    if (pinTaken(pin, u.id)) { const b = $('#formErr'); if (b) b.innerHTML = '<div class="err">PIN itu sudah dipakai. Pilih angka lain.</div>'; return; }
    u.salt = uid(); u.pin = hashPin(u.salt, pin); save(); closeSheet(); toast('PIN ' + u.name + ' diperbarui.', 'ok');
  }),
};
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault(); const fn = forms[f.dataset.form]; if (fn) fn(f);
});
document.addEventListener('keydown', e => {
  if ((ui.view === 'splash' || ui.view === 'login') && !$('#sheetRoot').firstChild && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) {
    if (/^\d$/.test(e.key)) { actions.key({ dataset: { v: e.key } }); return; }
    if (e.key === 'Backspace') { actions.keyDel(); return; }
  }
  if (e.key === 'Escape' && $('#sheetRoot').firstChild) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'vcode') { e.preventDefault(); actions.applyV(); }
});

/* sinkron antar tab di browser yang sama: pesanan baru dari tab pelanggan muncul di tab admin */
addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  let j; try { j = JSON.parse(e.newValue); } catch (x) { return; }
  if (!j || !Array.isArray(j.products) || !Array.isArray(j.orders)) return;
  const before = S.orders.length, ub = unreadA(), sess = S.session, cart = S.cart, cname = S.cname;
  S = j; S.session = sess; S.cart = cart; if (cname) S.cname = cname; ensureBrand();
  if (hasAdmin() && S.orders.length > before) toast('Pesanan baru masuk.', 'ok');
  if (hasAdmin() && unreadA() > ub) toast('Pesan baru dari pelanggan.', 'ok');
  const cbx = $('#chatBox'); if (cbx) { cbx.innerHTML = chatMsgsHTML(); cbx.scrollTop = cbx.scrollHeight; return; }
  const ae = document.activeElement, busy = $('#sheetRoot').firstChild || (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
  if (busy) return;
  if (ui.view === 'admin' && (ui.atab === 'dash' || ui.atab === 'orders' || ui.atab === 'chat')) render();
  else if (ui.view === 'shell' && (ui.tab === 'orders' || ui.tab === 'profile')) render();
});

/* ---------- mulai ---------- */
(function init() {
  S.session = null; /* setiap halaman dibuka, layar PIN muncul lebih dulu */
  save();
  if (!Array.isArray(S.cart)) S.cart = [];
  const fit = () => { const d = $('#device'); if (d) d.style.setProperty('--sc', innerWidth >= 520 ? Math.min(1, (innerHeight - 24) / 960, (innerWidth - 24) / 458).toFixed(3) : 1); };
  addEventListener('resize', fit); fit();
  render();
  setInterval(tickClock, 1000);
})();

/* ==================== LUNARA PLUS: Manajemen Produk, Pemasaran, Stok, Galeri ==================== */
/* ===== LUNARA Plus: Manajemen Produk, Sistem Pemasaran, Pengelolaan Stok, Galeri Gambar =====
   Dimuat oleh lunara-plus.html SESUDAH script.js. Memakai data S, ui, actions, forms milik script.js.
   Gaya khusus ada di lunara-plus.css. File index.html / style.css / script.js asli tidak diubah. */
(function () {
  const A = adminOnly, ok = m => toast(m, 'ok'), bad = m => toast(m, 'err');
  const items = () => S.products.concat(S.bundles);
  const picked = () => Object.keys(ui.sel).map(prod).filter(Boolean);
  const ferr = m => { const b = $('#formErr'); if (b) b.innerHTML = `<div class="err">${esc(m)}</div>`; bad(m); };
  Object.assign(ui, { pf: 'Semua', pst: 'all', psort: 'name', sel: {}, gprobe: {}, gres: null, mm: { code: '', }, sf: 'all', sq: '', slog: 'all', cq: '', cseg: 'all', csort: 'spend' });
  if (!S.mkt) S.mkt = { banners: [] };
  if (!S.imgMap) S.imgMap = {};
  Object.assign(IMG_MAP, S.imgMap); /* peta nama file foto yang disimpan admin */

  /* tab baru di dashboard admin */
  ATABS.splice(ATABS.findIndex(t => t[0] === 'orders') + 1, 0, ['cust', 'Pelanggan']);
  ATABS.splice(ATABS.findIndex(t => t[0] === 'products') + 1, 0, ['stok', 'Stok']);
  ATABS.splice(ATABS.findIndex(t => t[0] === 'promo') + 1, 0, ['mkt', 'Pemasaran'], ['gal', 'Galeri']);
  window.vAdmin = function () {
    if (!isAdmin()) return '';
    const tab = ui.atab;
    const body = ui.aorder ? vOrder(ui.aorder) : tab === 'orders' ? aOrders() : tab === 'chat' ? aChat() : tab === 'products' ? aProducts() : tab === 'promo' ? aPromo() : tab === 'mkt' ? aMkt() : tab === 'gal' ? aGal() : tab === 'stok' ? aStok() : tab === 'cust' ? aCust() : tab === 'report' ? aReport() : tab === 'settings' ? aSettings() : tab === 'accounts' ? aAccounts() : aDash();
    return `<div class="adm-top"><div class="wrap">${modeBar('admin')}<div class="row between">${logoFull(34)}<div class="row"><button class="btn dark sm" data-act="logout">Keluar</button></div></div>
    <div class="tabs" role="tablist">${ATABS.map(([k, l]) => `<button role="tab" data-act="atab" data-v="${k}" aria-selected="${tab === k}">${l}${k === 'orders' && pendConfirm() ? `<span class="badge-n">${pendConfirm()}</span>` : ''}${k === 'chat' && unreadA() ? `<span class="badge-n">${unreadA()}</span>` : ''}</button>`).join('')}</div></div></div>
    <div class="wrap"><main class="page" style="padding-top:12px">${body}</main></div>`;
  };

  /* ================= 1. MANAJEMEN PRODUK ================= */
  const PST = [['all', 'Semua'], ['low', 'Menipis'], ['out', 'Habis'], ['off', 'Nonaktif'], ['promo', 'Promo']];
  const SORT = [['name', 'A-Z'], ['stock', 'Stok terendah'], ['price', 'Harga tertinggi'], ['cat', 'Kategori']];
  function pApply(list) {
    const L = list.filter(p => (ui.pf === 'Semua' || p.cat === ui.pf) && (ui.pst === 'all' || (ui.pst === 'low' && isLow(p)) || (ui.pst === 'out' && p.stock <= 0) || (ui.pst === 'off' && !p.active) || (ui.pst === 'promo' && promoActive(p))));
    const f = { name: (a, b) => a.name.localeCompare(b.name), stock: (a, b) => a.stock - b.stock, price: (a, b) => b.price - a.price, cat: (a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name) }[ui.psort];
    return L.sort(f);
  }
  window.aProducts = function () {
    const q = ui.pq.trim().toLowerCase(), list = S.products.filter(p => !q || p.name.toLowerCase().includes(q)), n = Object.keys(ui.sel).length;
    const low = S.products.filter(p => p.active && isLow(p)).length, out = S.products.filter(p => p.active && p.stock <= 0).length;
    return `<div class="row between wrapx"><h2>Produk (${S.products.length})</h2><div class="row"><button class="btn soft sm" data-act="csvOut">Ekspor CSV</button><button class="btn primary sm" data-act="prodForm" data-id="">Tambah</button></div></div>
    ${low + out ? `<div class="card flat sm-t"><b>Perlu perhatian:</b> ${out} produk habis, ${low} menipis.</div>` : ''}
    <div class="search">${ICON.search}<input id="pq" type="search" placeholder="Cari produk" value="${esc(ui.pq)}" aria-label="Cari produk"></div>
    <div class="chips">${['Semua', ...CATS].map(c => `<button class="chip" data-act="pfCat" data-v="${c}" aria-pressed="${ui.pf === c}">${c}</button>`).join('')}</div>
    <div class="chips">${PST.map(([k, l]) => `<button class="chip" data-act="pfSt" data-v="${k}" aria-pressed="${ui.pst === k}">${l}</button>`).join('')}<select id="psort" class="chip" aria-label="Urutkan">${SORT.map(([k, l]) => `<option value="${k}" ${ui.psort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="card flat row wrapx selbar"><b><span id="selN">${n}</span> dipilih</b><button class="btn line sm" data-act="selAll">Pilih semua</button><button class="btn line sm" data-act="selNone">Kosongkan</button>
    <button class="btn soft sm" data-act="bulk" data-v="on">Aktifkan</button><button class="btn soft sm" data-act="bulk" data-v="off">Nonaktifkan</button><button class="btn soft sm" data-act="bulk" data-v="promo">Diskon %</button><button class="btn soft sm" data-act="bulk" data-v="unpromo">Hapus promo</button><button class="btn danger sm" data-act="bulk" data-v="del">Hapus</button></div>
    <section class="card" id="prodList">${prodRows(list)}</section>`;
  };
  window.prodRows = function (list) {
    list = pApply(list);
    if (!list.length) return '<p class="muted">Produk tidak ditemukan.</p>';
    return list.map(p => `<div class="arow"><img src="${imgOf(p)}" alt=""><div><label class="chk"><input type="checkbox" data-act="pSel" data-id="${p.id}" ${ui.sel[p.id] ? 'checked' : ''}> <b>${esc(p.name)}</b></label> ${p.active ? '' : '<span class="pill s6">Nonaktif</span>'}
    <div class="sm-t muted">${p.cat} &middot; ${rp(p.price)}${promoActive(p) ? ' &middot; promo ' + rp(p.promoPrice) : ''} &middot; <b style="color:${p.stock <= 0 ? 'var(--bad)' : isLow(p) ? 'var(--warn)' : 'inherit'}">stok ${p.stock}</b></div>
    <div class="row wrapx" style="margin-top:6px">${[-1, 1, 10].map(d => `<button class="btn line sm" data-act="stk" data-id="${p.id}" data-d="${d}">${d > 0 ? '+' : ''}${d}</button>`).join('')}</div></div>
    <div class="acts"><button class="btn soft sm" data-act="prodForm" data-id="${p.id}">Edit</button><button class="btn soft sm" data-act="dup" data-id="${p.id}">Salin</button><button class="btn danger sm" data-act="prodDel" data-id="${p.id}">Hapus</button></div></div>`).join('');
  };
  function applyPromo(list, pct, s, e) {
    let n = 0;
    list.forEach(p => { const pr = Math.round(p.price * (100 - pct) / 100 / 500) * 500; if (pr > 0 && pr < p.price) { Object.assign(p, { promoPrice: pr, promoStart: s, promoEnd: e }); n++; } });
    return n;
  }
  function delProducts(ids) {
    S.products = S.products.filter(x => !ids.includes(x.id));
    S.bundles.forEach(b => { b.items = b.items.filter(i => !ids.includes(i.pid)); if (!b.items.length) b.active = false; });
    ids.forEach(id => delete ui.sel[id]); cleanCart();
  }
  function dl(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  Object.assign(actions, {
    pfCat(t) { ui.pf = t.dataset.v; render(); },
    pfSt(t) { ui.pst = t.dataset.v; render(); },
    pSel(t) { if (t.checked) ui.sel[t.dataset.id] = 1; else delete ui.sel[t.dataset.id]; const n = $('#selN'); if (n) n.textContent = Object.keys(ui.sel).length; },
    selAll() { pApply(S.products.filter(p => !ui.pq.trim() || p.name.toLowerCase().includes(ui.pq.trim().toLowerCase()))).forEach(p => ui.sel[p.id] = 1); render(); },
    selNone() { ui.sel = {}; render(); },
    stk: A(t => { const p = prod(t.dataset.id), d = +t.dataset.d; if (!p) return; if (p.stock + d < 0) return bad('Stok tidak boleh negatif.'); adjustStock(p.id, d, 'Penyesuaian cepat'); save(); render(); }),
    dup: A(t => {
      const p = prod(t.dataset.id); if (!p) return;
      let nm = p.name + ' (Salinan)', i = 2; while (S.products.some(x => x.name === nm)) nm = p.name + ' (Salinan ' + i++ + ')';
      S.products.push({ ...JSON.parse(JSON.stringify(p)), id: 'p' + uid(), name: nm, stock: 0, active: false, best: false, isNew: false, promoPrice: 0, promoStart: '', promoEnd: '' });
      save(); render(); ok('Disalin sebagai nonaktif, stok 0. Edit lalu aktifkan.');
    }),
    bulk: A(t => {
      const L = picked(), v = t.dataset.v; if (!L.length) return bad('Pilih produk dulu (centang di kiri nama).');
      if (v === 'on' || v === 'off') { L.forEach(p => p.active = v === 'on'); save(); render(); return ok(L.length + ' produk ' + (v === 'on' ? 'diaktifkan.' : 'dinonaktifkan.')); }
      if (v === 'unpromo') { L.forEach(p => Object.assign(p, { promoPrice: 0, promoStart: '', promoEnd: '' })); save(); render(); return ok('Promo dihapus dari ' + L.length + ' produk.'); }
      if (v === 'del') return ask('Hapus ' + L.length + ' produk?', 'Produk dihapus dari menu, paket, dan keranjang. Riwayat pesanan tetap ada.', 'Hapus', () => { delProducts(L.map(p => p.id)); save(); render(); ok('Produk dihapus.'); });
      sheet(`<div class="sheet-h"><h3>Diskon ${L.length} produk</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
      <form class="stack" data-form="bulkPromo" novalidate><label class="f" for="bp_pct">Diskon (%)<input id="bp_pct" name="pct" type="number" min="1" max="90" value="10"></label>
      <div class="fgrid"><label class="f" for="bp_s">Mulai<input id="bp_s" name="start" type="date"></label><label class="f" for="bp_e">Sampai<input id="bp_e" name="end" type="date"></label></div>
      <small class="muted">Harga promo dibulatkan ke Rp500. Tanggal kosong = berlaku terus.</small><div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Terapkan</button></form>`);
    }),
    csvOut: A(() => {
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', H = ['Nama', 'Kategori', 'Harga', 'Harga Promo', 'Stok', 'Aktif', 'Best Seller', 'Menu Baru'];
      dl('produk-lunara.csv', [H.map(q).join(',')].concat(S.products.map(p => [p.name, p.cat, p.price, p.promoPrice || '', p.stock, p.active ? 'ya' : 'tidak', p.best ? 'ya' : '', p.isNew ? 'ya' : ''].map(q).join(','))).join('\r\n'), 'text/csv;charset=utf-8');
      ok('File CSV diunduh.');
    }),
  });
  document.addEventListener('change', e => { if (e.target.id === 'psort') { ui.psort = e.target.value; render(); } });

  /* ================= 2. SISTEM PEMASARAN ================= */
  const bnr = id => S.mkt.banners.find(b => b.id === id);
  function homeBanners() {
    const L = S.mkt.banners.filter(b => b.active && inPeriod(b.start, b.end)); if (!L.length) return '';
    return `<section><div class="scroller" aria-label="Info promo">${L.map(b => `<button class="banner" ${b.code ? `data-act="copyCode" data-v="${esc(b.code)}"` : 'data-act="tab" data-v="menu"'}><span class="code">${esc(b.code || 'INFO')}</span><b>${esc(b.title)}</b><small>${esc(b.text)}${b.code ? ' Ketuk untuk menyalin kode.' : ''}</small></button>`).join('')}</div></section>`;
  }
  const _vHome = vHome;
  window.vHome = () => { const h = _vHome(), b = homeBanners(); return b ? h.replace('</section>', '</section>' + b) : h; };

  function promoText(code) {
    const v = S.vouchers.find(x => x.code === code), P = S.products.filter(p => p.active && promoActive(p)).slice(0, 5), B = S.brand;
    return [`PROMO ${B.name}!`, B.tagline, '']
      .concat(P.map(p => `- ${p.name}: ${rp(p.promoPrice)} (normal ${rp(p.price)})`))
      .concat(P.length ? [''] : [])
      .concat(v ? [`Pakai kode ${v.code}: ${voucherText(v)}, min. belanja ${rp(v.min)}.${v.end ? ' Sampai ' + fmtDay(v.end) + '.' : ''}`, ''] : [])
      .concat([`Buka ${B.hours}`, B.address, B.instagram ? 'IG ' + B.instagram : '', 'Pesan sekarang!']).filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
  }
  window.aMkt = function () {
    const active = S.vouchers.filter(v => v.active && inPeriod(v.start, v.end)), nProm = S.products.filter(promoActive).length, live = S.orders.filter(o => o.status !== 'Dibatalkan');
    const rows = S.vouchers.map(v => { const L = live.filter(o => o.voucher === v.code); return { v, n: L.length, rev: L.reduce((s, o) => s + o.total, 0), off: L.reduce((s, o) => s + (o.discount || 0) + (o.shipDisc || 0), 0) }; }).sort((a, b) => b.n - a.n);
    if (!ui.mm.code && active[0]) ui.mm.code = active[0].code;
    return `<h2>Pemasaran</h2>
    <div class="stats"><div class="stat"><span>Produk promo</span><b>${nProm}</b></div><div class="stat"><span>Voucher aktif</span><b>${active.length}</b></div><div class="stat"><span>Banner tampil</span><b>${S.mkt.banners.filter(b => b.active && inPeriod(b.start, b.end)).length}</b></div><div class="stat"><span>Total potongan</span><b>${rp(rows.reduce((s, r) => s + r.off, 0))}</b></div></div>
    <form class="card stack" data-form="flash" novalidate><h3>Flash Sale</h3><p class="muted sm-t">Diskon massal untuk produk aktif. Harga promo dibulatkan ke Rp500.</p>
    <div class="fgrid"><label class="f" for="fl_sc">Kategori<select id="fl_sc" name="scope"><option>Semua</option>${CATS.map(c => `<option>${c}</option>`).join('')}</select></label><label class="f" for="fl_p">Diskon (%)<input id="fl_p" name="pct" type="number" min="1" max="90" value="15"></label>
    <label class="f" for="fl_s">Mulai<input id="fl_s" name="start" type="date"></label><label class="f" for="fl_e">Sampai<input id="fl_e" name="end" type="date"></label></div>
    <div id="formErr" role="alert"></div><div class="row wrapx"><button class="btn primary" type="submit">Terapkan Flash Sale</button><button class="btn danger" type="button" data-act="flashStop">Hentikan semua promo</button></div></form>
    <div class="row between wrapx"><h2>Banner Beranda</h2><button class="btn primary sm" data-act="mbForm" data-id="">Tambah Banner</button></div>
    <section class="card">${S.mkt.banners.length ? S.mkt.banners.map(b => `<div class="arow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(b.title)}</b> ${b.active && inPeriod(b.start, b.end) ? '<span class="pill s5">Tampil</span>' : '<span class="pill s6">Tidak tampil</span>'}<div class="sm-t muted">${esc(b.text)}${b.code ? '<br>Kode: ' + esc(b.code) : ''}</div></div><div class="acts"><button class="btn soft sm" data-act="mbForm" data-id="${b.id}">Edit</button><button class="btn danger sm" data-act="mbDel" data-id="${b.id}">Hapus</button></div></div>`).join('') : '<p class="muted">Belum ada banner. Banner tampil di beranda pelanggan.</p>'}</section>
    <section class="card"><h3 style="margin-bottom:8px">Kinerja Voucher</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kode</th><th class="r">Dipakai</th><th class="r">Omzet</th><th class="r">Potongan</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.v.code)}</td><td class="r num">${r.n}</td><td class="r num">${rp(r.rev)}</td><td class="r num">${rp(r.off)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card stack"><h3>Pesan Promosi</h3><p class="muted sm-t">Teks siap kirim ke WhatsApp atau caption Instagram, dibuat dari promo yang sedang aktif.</p>
    <label class="f" for="mv">Sertakan voucher<select id="mv"><option value="">Tanpa voucher</option>${active.map(v => `<option ${v.code === ui.mm.code ? 'selected' : ''}>${esc(v.code)}</option>`).join('')}</select></label>
    <textarea id="mtxt" rows="9" style="width:100%">${esc(promoText(ui.mm.code))}</textarea>
    <div class="row wrapx"><button class="btn soft" data-act="mCopy">Salin teks</button><button class="btn primary" data-act="mWa">Kirim lewat WhatsApp</button></div></section>`;
  };
  function mbForm(id) {
    const b = id ? bnr(id) : null, v = b || { title: '', text: '', code: '', start: '', end: '', active: true };
    sheet(`<div class="sheet-h"><h3>${b ? 'Edit' : 'Tambah'} Banner</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
    <form class="stack" data-form="mbanner" novalidate><input type="hidden" name="id" value="${b ? b.id : ''}">
    <label class="f" for="mb_t">Judul<input id="mb_t" name="title" type="text" maxlength="60" value="${esc(v.title)}"></label>
    <label class="f" for="mb_x">Keterangan singkat<input id="mb_x" name="text" type="text" maxlength="90" value="${esc(v.text)}"></label>
    <label class="f" for="mb_c">Voucher terkait (opsional)<select id="mb_c" name="code"><option value="">Tanpa voucher</option>${S.vouchers.map(x => `<option ${x.code === v.code ? 'selected' : ''}>${esc(x.code)}</option>`).join('')}</select></label>
    <div class="fgrid"><label class="f" for="mb_s">Mulai<input id="mb_s" name="start" type="date" value="${v.start}"></label><label class="f" for="mb_e">Sampai<input id="mb_e" name="end" type="date" value="${v.end}"></label></div>
    <label class="chk"><input type="checkbox" name="active" ${v.active ? 'checked' : ''}> Tampilkan di beranda</label><div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan Banner</button></form>`);
  }
  Object.assign(actions, {
    mbForm: A(t => mbForm(t.dataset.id)),
    mbDel: A(t => ask('Hapus banner?', 'Banner hilang dari beranda pelanggan.', 'Hapus', () => { S.mkt.banners = S.mkt.banners.filter(b => b.id !== t.dataset.id); save(); render(); ok('Banner dihapus.'); })),
    flashStop: A(() => ask('Hentikan semua promo?', 'Harga promo semua produk dihapus, harga kembali normal.', 'Hentikan', () => { S.products.forEach(p => Object.assign(p, { promoPrice: 0, promoStart: '', promoEnd: '' })); save(); render(); ok('Semua promo dihentikan.'); })),
    mCopy() { const t = $('#mtxt'); if (t) copyText(t.value, 'Teks promosi disalin.'); },
    mWa() { const t = $('#mtxt'); if (t) window.open('https://wa.me/?text=' + encodeURIComponent(t.value), '_blank', 'noopener'); },
  });
  document.addEventListener('change', e => { if (e.target.id === 'mv') { ui.mm.code = e.target.value; const t = $('#mtxt'); if (t) t.value = promoText(ui.mm.code); } });
  Object.assign(forms, {
    bulkPromo: A(f => {
      const fd = new FormData(f), pct = Math.round(num(fd.get('pct'))), s = String(fd.get('start') || ''), e = String(fd.get('end') || '');
      if (pct < 1 || pct > 90) return ferr('Diskon antara 1 dan 90 persen.'); if (s && e && s > e) return ferr('Tanggal akhir harus setelah tanggal mulai.');
      const n = applyPromo(picked(), pct, s, e); save(); closeSheet(); render(); ok('Diskon ' + pct + '% diterapkan ke ' + n + ' produk.');
    }),
    flash: A(f => {
      const fd = new FormData(f), sc = String(fd.get('scope')), pct = Math.round(num(fd.get('pct'))), s = String(fd.get('start') || ''), e = String(fd.get('end') || '');
      if (pct < 1 || pct > 90) return ferr('Diskon antara 1 dan 90 persen.'); if (s && e && s > e) return ferr('Tanggal akhir harus setelah tanggal mulai.');
      const n = applyPromo(S.products.filter(p => p.active && (sc === 'Semua' || p.cat === sc)), pct, s, e);
      if (!n) return ferr('Tidak ada produk yang cocok.'); save(); render(); ok('Flash sale ' + pct + '% diterapkan ke ' + n + ' produk.');
    }),
    mbanner: A(f => {
      const fd = new FormData(f), title = String(fd.get('title') || '').trim(), s = String(fd.get('start') || ''), e = String(fd.get('end') || '');
      if (title.length < 3) return ferr('Judul banner wajib diisi.'); if (s && e && s > e) return ferr('Tanggal akhir harus setelah tanggal mulai.');
      const d = { title, text: String(fd.get('text') || '').trim(), code: String(fd.get('code') || ''), start: s, end: e, active: !!fd.get('active') }, b = bnr(fd.get('id'));
      if (b) Object.assign(b, d); else S.mkt.banners.push({ id: 'm' + uid(), ...d });
      save(); closeSheet(); render(); ok('Banner disimpan.');
    }),
  });

/* ================= 3. PENGELOLAAN STOK ================= */
  const SF = [['all', 'Semua'], ['need', 'Perlu restock'], ['out', 'Habis'], ['low', 'Menipis'], ['ok', 'Aman']];
  const HARI = 7; /* jendela hitung penjualan untuk saran restock */
  function terjual(days) { /* jumlah terjual per nama produk (pesanan tidak dibatalkan) */
    const since = Date.now() - days * 864e5, m = {};
    S.orders.forEach(o => { if (o.status === 'Dibatalkan' || o.createdAt < since) return; o.items.forEach(i => { m[i.name] = (m[i.name] || 0) + i.qty; }); });
    return m;
  }
  function sRows() {
    const q = ui.sq.trim().toLowerCase(), sl = terjual(HARI);
    return S.products.filter(p => !q || p.name.toLowerCase().includes(q)).map(p => {
      const qty = sl[p.name] || 0, per = qty / HARI, left = per > 0 ? p.stock / per : null, st = p.stock <= 0 ? 'out' : isLow(p) ? 'low' : 'ok';
      let sug = p.active ? Math.max(0, Math.ceil(per * 7) - p.stock) : 0; /* cukup untuk 7 hari */
      if (p.active && st !== 'ok' && sug < 1) sug = Math.max(1, S.brand.lowStock * 2 - p.stock);
      return { p, qty, per, left, st, sug, need: p.active && (st !== 'ok' || (left !== null && left < 3)) };
    });
  }
  const sFilter = R => R.filter(r => ui.sf === 'all' || (ui.sf === 'need' ? r.need : r.st === ui.sf)).sort((a, b) => a.p.stock - b.p.stock || a.p.name.localeCompare(b.p.name));
  function stockRows() {
    const L = sFilter(sRows()); if (!L.length) return '<p class="muted">Tidak ada produk pada filter ini.</p>';
    return L.map(r => { const p = r.p, cls = r.st === 'out' ? 's6' : r.st === 'low' ? 's0' : 's5', lb = r.st === 'out' ? 'Habis' : r.st === 'low' ? 'Menipis' : 'Aman';
      return `<div class="arow"><img src="${imgOf(p)}" alt=""><div><b>${esc(p.name)}</b> <span class="pill ${cls}">${lb}</span>${p.active ? '' : ' <span class="pill s6">Nonaktif</span>'}
      <div class="sm-t muted">${p.cat} &middot; terjual ${r.qty} dalam ${HARI} hari${r.left !== null ? ' &middot; cukup &plusmn;' + (r.left < 1 ? '<1' : Math.floor(r.left)) + ' hari' : ''}</div>
      ${r.sug ? `<div class="sm-t">Saran restock: <b>+${r.sug}</b></div>` : ''}
      <div class="row wrapx" style="margin-top:6px"><input class="skin" type="number" min="0" inputmode="numeric" data-opn="${p.id}" value="${p.stock}" aria-label="Stok ${esc(p.name)}"><button class="btn line sm" data-act="skIn" data-id="${p.id}" data-v="in">Masuk</button><button class="btn line sm" data-act="skIn" data-id="${p.id}" data-v="out">Keluar</button>${r.sug ? `<button class="btn soft sm" data-act="skIn" data-id="${p.id}" data-v="in" data-q="${r.sug}">+${r.sug}</button>` : ''}</div></div></div>`; }).join('');
  }
  function shopList() {
    const L = sRows().filter(r => r.need).sort((a, b) => a.p.name.localeCompare(b.p.name)), d = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return [`DAFTAR RESTOCK ${S.brand.name}`, d, ''].concat(L.map(r => `- ${r.p.name}: sisa ${r.p.stock}${r.sug ? ', tambah +' + r.sug : ''}`)).join('\n');
  }
  window.aStok = function () {
    const R = sRows(), act = S.products.filter(p => p.active), out = act.filter(p => p.stock <= 0).length, low = act.filter(p => isLow(p)).length, need = R.filter(r => r.need).length;
    const units = act.reduce((s, p) => s + p.stock, 0), val = act.reduce((s, p) => s + p.stock * p.price, 0);
    const log = S.stockLog.filter(l => ui.slog === 'all' || (ui.slog === 'in' ? l.delta > 0 : l.delta < 0)).slice(0, 30);
    return `<h2>Stok</h2>
    <div class="stats"><div class="stat"><span>Total unit (aktif)</span><b>${units}</b></div><div class="stat"><span>Nilai stok (harga jual)</span><b>${rp(val)}</b></div><div class="stat"><span>Habis</span><b>${out}</b></div><div class="stat"><span>Menipis</span><b>${low}</b></div></div>
    ${need ? `<div class="card flat stack"><div><b>${need} produk perlu restock.</b><div class="sm-t muted">Saran dihitung dari penjualan ${HARI} hari terakhir (penjualan langsung, belum termasuk yang lewat paket).</div></div><div class="row wrapx"><button class="btn soft sm" data-act="skCopy">Salin daftar belanja</button><button class="btn primary sm" data-act="skWa">Kirim lewat WhatsApp</button></div></div>` : ''}
    <form class="card row wrapx" data-form="skThr" novalidate><label class="f grow" for="sk_thr">Batas stok menipis<input id="sk_thr" name="low" type="number" min="0" max="100" value="${S.brand.lowStock}"></label><button class="btn soft sm" type="submit">Simpan batas</button></form>
    <div class="search">${ICON.search}<input id="sq" type="search" placeholder="Cari produk" value="${esc(ui.sq)}" aria-label="Cari produk"></div>
    <div class="chips">${SF.map(([k, l]) => `<button class="chip" data-act="skF" data-v="${k}" aria-pressed="${ui.sf === k}">${l}</button>`).join('')}</div>
    <div class="card flat row wrapx selbar"><span class="sm-t grow">Ubah angka stok langsung, lalu simpan sebagai stok opname.</span><button class="btn primary sm" data-act="skOpname">Simpan opname</button></div>
    <section class="card" id="stList">${stockRows()}</section>
    <section class="card"><div class="row between wrapx"><h3>Riwayat stok</h3><div class="row"><select id="slogf" class="chip" aria-label="Filter riwayat"><option value="all" ${ui.slog === 'all' ? 'selected' : ''}>Semua</option><option value="in" ${ui.slog === 'in' ? 'selected' : ''}>Masuk</option><option value="out" ${ui.slog === 'out' ? 'selected' : ''}>Keluar</option></select><button class="btn soft sm" data-act="skCsv">Ekspor CSV</button></div></div>
    ${log.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Produk</th><th class="r">Stok</th><th>Alasan</th><th>Oleh</th></tr></thead><tbody>${log.map(l => `<tr><td>${fmt(l.ts)}</td><td>${esc(l.name)}</td><td class="r num">${l.from} &rarr; ${l.to}</td><td>${esc(l.reason)}</td><td>${esc(l.by || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Belum ada perubahan stok.</p>'}</section>`;
  };
  function skSheet(p, mode, q) {
    const inn = mode === 'in', why = inn ? ['Pembelian dari supplier', 'Produksi sendiri', 'Retur / koreksi'] : ['Rusak', 'Kedaluwarsa', 'Dipakai sendiri / sampel', 'Koreksi'];
    sheet(`<div class="sheet-h"><h3>${inn ? 'Barang masuk' : 'Barang keluar'}: ${esc(p.name)}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
    <form class="stack" data-form="skMove" novalidate><input type="hidden" name="id" value="${p.id}"><input type="hidden" name="mode" value="${mode}">
    <p class="muted sm-t">Stok sekarang: <b>${p.stock}</b></p>
    <label class="f" for="sk_q">Jumlah<input id="sk_q" name="qty" type="number" min="1" inputmode="numeric" value="${q ? +q : ''}"></label>
    <label class="f" for="sk_r">Alasan<select id="sk_r" name="reason">${why.map(x => `<option>${x}</option>`).join('')}</select></label>
    <label class="f" for="sk_n">Catatan (opsional)<input id="sk_n" name="note" type="text" maxlength="60"></label>
    <div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan</button></form>`);
  }
  Object.assign(actions, {
    skF: A(t => { ui.sf = t.dataset.v; render(); }),
    skIn: A(t => { const p = prod(t.dataset.id); if (p) skSheet(p, t.dataset.v, t.dataset.q); }),
    skOpname: A(() => {
      let n = 0, invalid = 0;
      document.querySelectorAll('[data-opn]').forEach(i => {
        const p = prod(i.dataset.opn), v = Math.round(num(i.value)); if (!p) return;
        if (i.value.trim() === '' || v < 0) { invalid++; return; }
        if (v !== p.stock) { adjustStock(p.id, v - p.stock, 'Stok opname'); n++; }
      });
      if (invalid) return bad('Ada angka stok yang tidak valid.');
      if (!n) return toast('Tidak ada perubahan stok.');
      save(); render(); ok('Stok opname disimpan untuk ' + n + ' produk.');
    }),
    skCopy: A(() => copyText(shopList(), 'Daftar belanja disalin.')),
    skWa: A(() => window.open('https://wa.me/?text=' + encodeURIComponent(shopList()), '_blank', 'noopener')),
    skCsv: A(() => {
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', H = ['Waktu', 'Produk', 'Stok Awal', 'Stok Akhir', 'Selisih', 'Alasan', 'Oleh'];
      dl('riwayat-stok-lunara.csv', [H.map(q).join(',')].concat(S.stockLog.map(l => [fmt(l.ts), l.name, l.from, l.to, l.delta, l.reason, l.by || ''].map(q).join(','))).join('\r\n'), 'text/csv;charset=utf-8');
      ok('File CSV diunduh.');
    }),
  });
  Object.assign(forms, {
    skMove: A(f => {
      const fd = new FormData(f), p = prod(fd.get('id')), q = Math.round(num(fd.get('qty'))), inn = fd.get('mode') === 'in';
      if (!p) return ferr('Produk tidak ditemukan.');
      if (q < 1 || q > 100000) return ferr('Jumlah minimal 1.');
      if (!inn && q > p.stock) return ferr('Jumlah keluar melebihi stok (' + p.stock + ').');
      const note = String(fd.get('note') || '').trim();
      adjustStock(p.id, inn ? q : -q, (inn ? 'Masuk: ' : 'Keluar: ') + fd.get('reason') + (note ? ' - ' + note : ''));
      save(); closeSheet(); render(); ok(p.name + ': stok ' + (inn ? '+' : '-') + q + ', sekarang ' + p.stock + '.');
    }),
    skThr: A(f => {
      const v = Math.round(num(new FormData(f).get('low')));
      if (v < 0 || v > 100) return bad('Batas stok antara 0 dan 100.');
      S.brand.lowStock = v; save(); render(); ok('Batas stok menipis: ' + v + '.');
    }),
  });
  document.addEventListener('input', e => { const t = e.target; if (t.id === 'sq' && isAdmin()) { ui.sq = t.value; const g = $('#stList'); if (g) g.innerHTML = stockRows(); } });
  document.addEventListener('change', e => { if (e.target.id === 'slogf') { ui.slog = e.target.value; render(); } });

  /* ================= 3b. MANAJEMEN PELANGGAN ================= */
  /* Pelanggan belum punya akun sendiri, jadi daftar disusun dari pesanan (dikelompokkan menurut nama).
     Catatan dan tanda VIP disimpan di S.custMeta (kunci = nama huruf kecil). */
  const CSEG = [['all', 'Semua'], ['vip', 'VIP'], ['loyal', 'Langganan'], ['new', 'Baru'], ['dormant', 'Tidak Aktif']];
  const CSORT = [['spend', 'Total belanja'], ['n', 'Jumlah pesanan'], ['recent', 'Terbaru'], ['name', 'Nama (A-Z)']];
  const CLB = { vip: 'VIP', dormant: 'Tidak Aktif', loyal: 'Langganan', new: 'Baru', aktif: 'Aktif' }, CCL = { vip: 's5', dormant: 's6', loyal: 's5', new: 's0', aktif: 's0' };
  const DORMANT = 30, LOYAL = 3; /* hari tanpa pesanan = tidak aktif; minimal pesanan = langganan */
  const ckey = n => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const vlist = () => S.vouchers.filter(v => v.active && inPeriod(v.start, v.end));
  function custList() {
    const meta = S.custMeta || {}, m = {}, now = Date.now();
    S.orders.forEach(o => {
      if (o.status === 'Dibatalkan') return;
      const k = ckey(o.customer && o.customer.name); if (!k) return;
      const c = m[k] || (m[k] = { k, name: String(o.customer.name).trim(), n: 0, spend: 0, last: 0, first: Infinity, items: {}, orders: [] });
      c.n++; c.spend += o.total || 0; c.orders.push(o); c.first = Math.min(c.first, o.createdAt);
      if (o.createdAt > c.last) { c.last = o.createdAt; c.name = String(o.customer.name).trim(); }
      o.items.forEach(i => { c.items[i.name] = (c.items[i.name] || 0) + i.qty; });
    });
    return Object.values(m).map(c => {
      const mt = meta[c.k] || {}, top = Object.entries(c.items).sort((a, b) => b[1] - a[1])[0];
      c.note = mt.note || ''; c.vip = !!mt.vip; c.fav = top ? top[0] : ''; c.avg = c.spend / c.n; c.idle = Math.floor((now - c.last) / 864e5);
      c.seg = c.vip ? 'vip' : c.idle > DORMANT ? 'dormant' : c.n >= LOYAL ? 'loyal' : c.n === 1 ? 'new' : 'aktif';
      return c;
    });
  }
  function custView() {
    const q = ui.cq.trim().toLowerCase(), f = ui.cseg;
    const L = custList().filter(c => (!q || c.name.toLowerCase().includes(q)) && (f === 'all' || (f === 'vip' ? c.vip : f === 'dormant' ? c.idle > DORMANT : f === 'loyal' ? c.n >= LOYAL && c.idle <= DORMANT : c.n === 1 && c.idle <= DORMANT)));
    const by = { spend: (a, b) => b.spend - a.spend, n: (a, b) => b.n - a.n, recent: (a, b) => b.last - a.last, name: (a, b) => a.name.localeCompare(b.name) }[ui.csort] || (() => 0);
    return L.sort(by);
  }
  function custRows() {
    const L = custView(); if (!L.length) return '<p class="muted">Belum ada pelanggan pada filter ini.</p>';
    return L.map(c => `<div class="arow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(c.name)}</b> <span class="pill ${CCL[c.seg]}">${CLB[c.seg]}</span>${c.vip && c.seg !== 'vip' ? '' : ''}
      <div class="sm-t muted">${c.n} pesanan &middot; ${rp(c.spend)} &middot; terakhir ${c.idle < 1 ? 'hari ini' : c.idle + ' hari lalu'}${c.fav ? ' &middot; favorit: ' + esc(c.fav) : ''}</div>${c.note ? `<div class="sm-t">${esc(c.note)}</div>` : ''}</div>
      <div class="acts"><button class="btn soft sm" data-act="cuOpen" data-k="${esc(c.k)}">Detail</button></div></div>`).join('');
  }
  function cuMessage(c, v) {
    const b = S.brand.name;
    return `Halo kak ${c.name}! ${c.idle > DORMANT ? 'Sudah lama kami tidak melihat kakak di ' + b + '.' : 'Terima kasih sudah memesan di ' + b + '.'}` + (c.fav ? ` Menu favorit kakak, ${c.fav}, siap dipesan lagi.` : '') + (v ? ` Pakai voucher ${v.code} (${voucherText(v)}) untuk pesanan berikutnya.` : '');
  }
  window.aCust = function () {
    const all = custList(), n = all.length, active = all.filter(c => c.idle <= DORMANT).length, dorm = n - active, rep = all.filter(c => c.n >= 2).length;
    const vs = vlist();
    return `<h2>Pelanggan</h2>
    <div class="stats"><div class="stat"><span>Total pelanggan</span><b>${n}</b></div><div class="stat"><span>Aktif ${DORMANT} hari</span><b>${active}</b></div><div class="stat"><span>Tidak aktif</span><b>${dorm}</b></div><div class="stat"><span>Pesan ulang</span><b>${n ? Math.round(rep / n * 100) : 0}%</b></div></div>
    <p class="muted sm-t">Pelanggan dikenali dari nama di pesanan. Nama yang sama dianggap satu orang.</p>
    <div class="search">${ICON.search}<input id="cq" type="search" placeholder="Cari nama pelanggan" value="${esc(ui.cq)}" aria-label="Cari pelanggan"></div>
    <div class="chips">${CSEG.map(([k, l]) => `<button class="chip" data-act="cuF" data-v="${k}" aria-pressed="${ui.cseg === k}">${l}</button>`).join('')}</div>
    <div class="card flat row wrapx selbar"><select id="csort" class="chip" aria-label="Urutkan pelanggan">${CSORT.map(([k, l]) => `<option value="${k}" ${ui.csort === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn soft sm" data-act="cuCsv">Ekspor CSV</button></div>
    <div class="card flat stack"><b>Pesan promo untuk daftar di bawah</b><div class="row wrapx"><select id="cuBV" class="chip" aria-label="Voucher untuk pesan"><option value="">Tanpa voucher</option>${vs.map(v => `<option value="${esc(v.code)}">${esc(v.code)}</option>`).join('')}</select><button class="btn primary sm" data-act="cuBulk">Salin pesan + daftar nama</button></div></div>
    <section class="card" id="cuList">${custRows()}</section>`;
  };
  function cuSheet(k) {
    const c = custList().find(x => x.k === k); if (!c) return;
    const top = Object.entries(c.items).sort((a, b) => b[1] - a[1]).slice(0, 3), vs = vlist();
    sheet(`<div class="sheet-h"><h3>${esc(c.name)}</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
    <div class="stack">
    <div class="stats"><div class="stat"><span>Pesanan</span><b>${c.n}</b></div><div class="stat"><span>Total belanja</span><b>${rp(c.spend)}</b></div><div class="stat"><span>Rata-rata</span><b>${rp(c.avg)}</b></div><div class="stat"><span>Terakhir</span><b>${c.idle < 1 ? 'Hari ini' : c.idle + ' hari lalu'}</b></div></div>
    <p class="sm-t muted">Pelanggan sejak ${fmt(c.first)}. Menu favorit: ${top.length ? top.map(([n, q]) => esc(n) + ' (' + q + 'x)').join(', ') : '-'}</p>
    <form class="stack" data-form="cuNote" novalidate><input type="hidden" name="k" value="${esc(c.k)}">
      <label class="chk"><input type="checkbox" name="vip" ${c.vip ? 'checked' : ''}> Tandai sebagai pelanggan VIP</label>
      <label class="f" for="cu_n">Catatan<textarea id="cu_n" name="note" rows="3" maxlength="300">${esc(c.note)}</textarea></label>
      <div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Simpan</button></form>
    <div class="stack-s"><b>Pesan promo</b><select id="cu_v" class="chip" aria-label="Voucher"><option value="">Tanpa voucher</option>${vs.map(v => `<option value="${esc(v.code)}">${esc(v.code)} - ${esc(voucherText(v))}</option>`).join('')}</select>
      <div class="row wrapx"><button class="btn soft sm" data-act="cuCopy" data-k="${esc(c.k)}">Salin pesan</button><button class="btn line sm" data-act="cuWa" data-k="${esc(c.k)}">Buka WhatsApp</button></div></div>
    <div><b>Riwayat pesanan</b>${c.orders.slice(0, 8).map(o => `<div class="sm-t" style="padding:6px 0;border-bottom:1px solid var(--line)">${esc(o.no)} &middot; ${fmt(o.createdAt)} &middot; ${rp(o.total)} &middot; ${esc(o.status)}</div>`).join('')}${c.orders.length > 8 ? `<p class="sm-t muted">dan ${c.orders.length - 8} pesanan lainnya</p>` : ''}</div>
    </div>`);
  }
  const cuV = id => { const el = $(id), v = el ? el.value : ''; return v ? S.vouchers.find(x => x.code === v) : null; };
  Object.assign(actions, {
    cuF: A(t => { ui.cseg = t.dataset.v; render(); }),
    cuOpen: A(t => cuSheet(t.dataset.k)),
    cuCopy: A(t => { const c = custList().find(x => x.k === t.dataset.k); if (c) copyText(cuMessage(c, cuV('#cu_v')), 'Pesan disalin.'); }),
    cuWa: A(t => { const c = custList().find(x => x.k === t.dataset.k); if (c) window.open('https://wa.me/?text=' + encodeURIComponent(cuMessage(c, cuV('#cu_v'))), '_blank', 'noopener'); }),
    cuBulk: A(() => {
      const L = custView(); if (!L.length) return toast('Tidak ada pelanggan pada daftar ini.');
      const v = cuV('#cuBV'), b = S.brand.name;
      copyText(`Halo kak! Terima kasih sudah memesan di ${b}.` + (v ? ` Pakai voucher ${v.code} (${voucherText(v)}) untuk pesanan berikutnya.` : '') + `\n\nPenerima (${L.length}):\n` + L.map(c => '- ' + c.name).join('\n'), 'Pesan dan daftar nama disalin.');
    }),
    cuCsv: A(() => {
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', H = ['Nama', 'Pesanan', 'Total Belanja', 'Rata-rata', 'Pesanan Pertama', 'Pesanan Terakhir', 'Hari Sejak Terakhir', 'Menu Favorit', 'Segmen', 'VIP', 'Catatan'];
      dl('pelanggan-lunara.csv', [H.map(q).join(',')].concat(custView().map(c => [c.name, c.n, Math.round(c.spend), Math.round(c.avg), fmt(c.first), fmt(c.last), c.idle, c.fav, CLB[c.seg], c.vip ? 'Ya' : '', c.note].map(q).join(','))).join('\r\n'), 'text/csv;charset=utf-8');
      ok('File CSV diunduh.');
    }),
  });
  Object.assign(forms, {
    cuNote: A(f => {
      const fd = new FormData(f), k = String(fd.get('k')), note = String(fd.get('note') || '').trim().slice(0, 300), vip = fd.get('vip') === 'on';
      S.custMeta = S.custMeta || {};
      if (note || vip) S.custMeta[k] = { note, vip }; else delete S.custMeta[k];
      save(); closeSheet(); render(); ok('Data pelanggan disimpan.');
    }),
  });
  document.addEventListener('input', e => { const t = e.target; if (t.id === 'cq' && isAdmin()) { ui.cq = t.value; const g = $('#cuList'); if (g) g.innerHTML = custRows(); } });
  document.addEventListener('change', e => { if (e.target.id === 'csort') { ui.csort = e.target.value; render(); } });

  /* ================= 3c. PENGIRIMAN & LOGISTIK ================= */
  /* Penugasan kurir ke pesanan Delivery + kartu pelacakan untuk pelanggan.
     Data: S.couriers = [{id,name,phone}], o.courier = {id,name,phone}, o.shipAt = waktu status "Dalam Pengantaran". */
  const couriers = () => (S.couriers = Array.isArray(S.couriers) ? S.couriers : []);
  const etaRange = eta => { const n = String(eta || '').match(/\d+/g); return n ? [Number(n[0]), Number(n[n.length - 1])] : null; };
  const hm = ts => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const shipTime = o => o.shipAt || ((o.log || []).slice().reverse().find(l => l.text === 'Status: Dalam Pengantaran') || {}).ts || 0;
  const TRK_LB = ['Bayar', 'Diproses', 'Disiapkan', 'Diantar', 'Selesai'];
  const _setStatus = setStatus;
  window.setStatus = function (o, st) {
    if (o.type === 'delivery' && st === 'Dalam Pengantaran' && !o.courier && !finalStatus(o.status)) return { ok: false, msg: 'Tugaskan kurir dulu sebelum status menjadi Dalam Pengantaran.' };
    const r = _setStatus(o, st);
    if (r.ok && st === 'Dalam Pengantaran') { o.shipAt = Date.now(); save(); }
    return r;
  };
  function trackCard(o, adm) {
    const st = o.status, c = o.courier, rg = etaRange(o.deliv && o.deliv.eta), t0 = shipTime(o), steps = stageList('delivery'), cur = steps.indexOf(st);
    const pct = st === 'Dibatalkan' ? 0 : Math.max(0, cur) / (steps.length - 1) * 100;
    const msg = st === 'Dibatalkan' ? 'Pesanan dibatalkan.' : st === 'Menunggu Pembayaran' ? 'Menunggu pembayaran dikonfirmasi admin.' : st === 'Diproses' ? 'Pesanan diterima dan sedang diproses.'
      : st === 'Sedang Disiapkan' ? 'Dapur sedang menyiapkan pesanan.' + (c ? ' Kurir ' + c.name + ' akan mengantarnya.' : ' Kurir akan segera ditugaskan.')
      : st === 'Dalam Pengantaran' ? (c ? 'Kurir ' + c.name : 'Kurir') + ' sedang menuju alamat tujuan.' : 'Pesanan sudah sampai. Selamat menikmati!';
    let eta = '';
    if (st === 'Dalam Pengantaran' && rg && t0) eta = Date.now() > t0 + rg[1] * 6e4 ? 'Sedikit lebih lama dari perkiraan.' : 'Perkiraan tiba ' + hm(t0 + rg[0] * 6e4) + ' - ' + hm(t0 + rg[1] * 6e4);
    else if (!finalStatus(st) && o.deliv && o.deliv.eta) eta = 'Estimasi pengantaran ' + o.deliv.eta + ' setelah kurir berangkat.';
    const cbox = c ? `<div class="trk-cour"><div><b>${esc(c.name)}</b><div class="sm-t muted">${esc(c.phone)}</div></div><div class="row wrapx"><a class="btn soft sm" href="tel:${digits(c.phone)}">Telepon</a>${waLink(c.phone) ? `<a class="btn line sm" href="${waLink(c.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div></div>` : '<p class="muted sm-t">Kurir belum ditugaskan.</p>';
    const assign = adm && !finalStatus(st) ? `<div class="stack-s"><label class="f" for="cr_sel">Kurir pengantar<select id="cr_sel"><option value="">Pilih kurir</option>${couriers().map(x => `<option value="${x.id}" ${c && c.id === x.id ? 'selected' : ''}>${esc(x.name)} - ${esc(x.phone)}</option>`).join('')}</select></label>
      <div class="row wrapx"><button class="btn primary sm" data-act="crAssign" data-id="${o.id}">Tugaskan</button>${c && st !== 'Dalam Pengantaran' ? `<button class="btn line sm" data-act="crUnassign" data-id="${o.id}">Lepas kurir</button>` : ''}<button class="btn soft sm" data-act="crManage">Kelola kurir</button></div></div>` : '';
    return `<section class="card noprint stack trk"><div class="row between wrapx"><b>Pelacakan Pengantaran</b>${o.deliv ? `<span class="pill s0">${esc(o.deliv.name)}</span>` : ''}</div>
    <div class="trk-bar" role="progressbar" aria-label="Progres pengantaran" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>
    <div class="trk-steps">${TRK_LB.map((s, i) => `<span class="${st !== 'Dibatalkan' && i <= cur ? 'on' : ''}">${s}</span>`).join('')}</div>
    <div><b>${msg}</b>${eta ? `<div class="sm-t muted">${eta}</div>` : ''}</div>
    <div class="sm-t">Alamat: ${esc(o.customer.address || '-')}${o.customer.dnote ? ' (' + esc(o.customer.dnote) + ')' : ''}</div>
    ${cbox}${assign}</section>`;
  }
  const _vOrder = vOrder;
  window.vOrder = function (id) {
    const h = _vOrder(id), o = orderById(id);
    if (!o || o.type !== 'delivery' || !canView(o)) return h;
    const mark = '<section class="card noprint stack"><b>Status pesanan</b>';
    return h.includes(mark) ? h.replace(mark, trackCard(o, isAdmin()) + mark) : h;
  };
  function crSheet() {
    const L = couriers();
    sheet(`<div class="sheet-h"><h3>Kelola Kurir</h3><button class="iconbtn" data-act="closeSheet" aria-label="Tutup">${ICON.close}</button></div>
    <div class="stack">${L.length ? L.map(x => `<div class="arow" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(x.name)}</b><div class="sm-t muted">${esc(x.phone)}</div></div><div class="acts"><button class="btn danger sm" data-act="crDel" data-id="${x.id}">Hapus</button></div></div>`).join('') : '<p class="muted">Belum ada kurir. Tambahkan di bawah.</p>'}
    <form class="stack" data-form="crAdd" novalidate><label class="f" for="cr_n">Nama kurir<input id="cr_n" name="name" type="text" maxlength="40"></label><label class="f" for="cr_p">Nomor HP / WhatsApp<input id="cr_p" name="phone" type="tel" inputmode="tel" maxlength="20" placeholder="08xxxxxxxxxx"></label>
    <div id="formErr" role="alert"></div><button class="btn primary block" type="submit">Tambah Kurir</button></form></div>`);
  }
  Object.assign(actions, {
    crManage: A(() => crSheet()),
    crAssign: A(t => {
      const o = orderById(t.dataset.id), x = couriers().find(c => c.id === (($('#cr_sel') || {}).value));
      if (!o || finalStatus(o.status)) return;
      if (!x) return bad('Pilih kurir dulu.');
      o.courier = { id: x.id, name: x.name, phone: x.phone }; logOrder(o, 'Kurir ditugaskan: ' + x.name); save(); render(); ok('Kurir ' + x.name + ' ditugaskan.');
    }),
    crUnassign: A(t => { const o = orderById(t.dataset.id); if (!o || !o.courier || o.status === 'Dalam Pengantaran') return; const n = o.courier.name; delete o.courier; logOrder(o, 'Kurir dilepas: ' + n); save(); render(); ok('Kurir dilepas.'); }),
    crDel: A(t => { S.couriers = couriers().filter(c => c.id !== t.dataset.id); save(); render(); crSheet(); }),
  });
  Object.assign(forms, {
    crAdd: A(f => {
      const fd = new FormData(f), name = String(fd.get('name') || '').trim(), phone = String(fd.get('phone') || '').trim(), d = digits(phone);
      if (name.length < 2) return ferr('Isi nama kurir (minimal 2 huruf).');
      if (d.length < 8 || d.length > 15) return ferr('Nomor HP tidak valid.');
      if (couriers().some(c => digits(c.phone) === d)) return ferr('Nomor ini sudah terdaftar.');
      couriers().push({ id: 'c' + uid(), name, phone }); save(); render(); crSheet(); ok('Kurir ' + name + ' ditambahkan.');
    }),
  });

  /* ================= 3d. HAPUS CHAT (admin) ================= */
  const hasChats = () => Object.values(S.chats || {}).some(t => t.msgs.some(m => !m.sys));
  const _aChat = aChat;
  window.aChat = function () {
    const h = _aChat();
    return h + (ui.achat ? `<button class="btn danger sm block" data-act="chDelOne" data-id="${esc(ui.achat)}">Hapus chat ini</button>` : hasChats() ? '<button class="btn danger sm block" data-act="chDelAll">Hapus semua chat</button>' : '');
  };
  Object.assign(actions, {
    chDelAll: A(() => ask('Hapus semua chat?', 'Semua percakapan pelanggan dan admin akan dihapus dan tidak bisa dikembalikan.', 'Hapus', () => { S.chats = {}; ui.achat = null; save(); render(); ok('Semua chat dihapus.'); })),
    chDelOne: A(t => ask('Hapus chat ini?', 'Percakapan dengan pelanggan ini akan dihapus dan tidak bisa dikembalikan.', 'Hapus', () => { if (S.chats) delete S.chats[t.dataset.id]; ui.achat = null; save(); render(); ok('Chat dihapus.'); })),
  });

  /* ================= 3e. PELANGGAN BARU DI PERANGKAT YANG SAMA ================= */
  /* Identitas pelanggan = perangkat (S.deviceId), jadi semua orang yang memakai browser yang sama dianggap satu pelanggan.
     Tombol ini membuat identitas baru supaya chat, pesanan, favorit, dan profil mulai kosong. */
  const _vProfile = vProfile;
  window.vProfile = function () {
    const h = _vProfile(), mark = '<button class="btn danger block" data-act="logout">Keluar</button>';
    return h.includes(mark) ? h.replace(mark, '<button class="btn line block" data-act="newCust">Ganti ke Pelanggan Baru</button>' + mark) : h;
  };
  Object.assign(actions, {
    newCust() {
      ask('Ganti ke pelanggan baru?', 'Chat, pesanan, favorit, dan profil mulai kosong untuk pelanggan baru. Data pelanggan sebelumnya tetap tersimpan dan terlihat oleh admin, tetapi tidak bisa dibuka lagi dari perangkat ini.', 'Ganti', () => {
        const adminId = S.session && S.session.adminId;
        S.deviceId = uid(); S.cname = 'Pelanggan'; S.cart = [];
        S.session = Object.assign({ userId: 'g-' + S.deviceId, role: 'guest', name: 'Pelanggan' }, adminId ? { adminId } : {});
        ui.draft = { type: 'dinein', pay: 'cash', voucher: '', note: '', name: '', phone: '', address: '', dnote: '', table: '', deliv: '' }; ui.chatOrder = null;
        save(); nav('home'); toast('Pelanggan baru siap. Isi namamu di profil.', 'ok'); actions.editProfile();
      }, false);
    },
  });

  /* ================= 4. GALERI GAMBAR ================= */
  function probe(name) { /* cari file foto di folder images/ yang cocok dengan nama menu */
    return new Promise(res => { const L = imgList(name); let i = 0; const next = () => { if (i >= L.length) return res('none'); const im = new Image(); im.onload = () => res(L[i]); im.onerror = () => { i++; next(); }; im.src = L[i]; }; next(); });
  }
  const gKind = it => it.img ? (it.img.startsWith('data:') ? 'unggahan' : 'URL') : ui.gprobe[it.id] === 'none' ? 'ilustrasi' : ui.gprobe[it.id] ? 'folder' : 'belum dicek';
  const gCls = k => k === 'ilustrasi' ? 's6' : k === 'belum dicek' ? 's1' : 's5';
  function matchItem(fn) {
    const L = items(), base = fn.replace(/\.[^.]+$/, ''), k = slug(base);
    const byMap = L.find(it => IMG_MAP[it.name] && IMG_MAP[it.name].toLowerCase() === fn.toLowerCase()); if (byMap) return byMap;
    const sorted = L.slice().sort((a, b) => slug(b.name).length - slug(a.name).length);
    return L.find(it => slug(it.name) === k) || sorted.find(it => k.length > 3 && k.includes(slug(it.name))) || sorted.find(it => k.length > 3 && slug(it.name).includes(k)) || null;
  }
  const storePct = () => { try { return Math.min(100, Math.round(JSON.stringify(S).length / 5e4)); } catch (e) { return 0; } };
  window.aGal = function () {
    const L = items(), pct = storePct(), cnt = {}; L.forEach(it => { const k = gKind(it); cnt[k] = (cnt[k] || 0) + 1; });
    return `<h2>Galeri Gambar</h2>
    <section class="card stack"><div class="stats"><div class="stat"><span>Unggahan</span><b>${cnt.unggahan || 0}</b></div><div class="stat"><span>Dari folder</span><b>${cnt.folder || 0}</b></div><div class="stat"><span>Ilustrasi</span><b>${cnt.ilustrasi || 0}</b></div><div class="stat"><span>Penyimpanan</span><b>${pct}%</b></div></div>
    <div class="bar"><i style="width:${pct}%"></i></div><small class="muted">Perkiraan pemakaian penyimpanan browser (batas sekitar 5 MB). Foto unggahan dikompres otomatis ke 520 px.</small>
    <div class="row wrapx"><button class="btn soft" data-act="galProbe">Periksa folder images/</button><label class="btn primary">Unggah banyak foto<input type="file" accept="image/*" multiple hidden data-gal="multi"></label></div>
    <p class="muted sm-t">Unggah banyak: foto dicocokkan ke menu lewat nama file (misal <i>Crispy Chicken.jpg</i> atau <i>crispy-chicken.png</i>).</p>
    ${ui.gres ? `<div class="card flat sm-t"><b>${ui.gres.ok} foto terpasang.</b>${ui.gres.miss.length ? `<br>Tidak cocok dengan menu mana pun: ${ui.gres.miss.map(esc).join(', ')}. Ganti nama file atau pakai tombol Ganti di bawah.` : ''}</div>` : ''}</section>
    <section class="card">${L.map(it => { const k = gKind(it), isP = !!prod(it.id), cur = isP ? imgOf(it) : bundleImg(it); return `<div class="arow"><img src="${cur}" alt=""><div><b>${esc(it.name)}</b> <span class="pill ${gCls(k)}">${k}</span>${isP ? '' : ' <span class="pill s1">paket</span>'}
    <div class="row" style="margin-top:6px"><input data-gmap="${it.id}" type="text" placeholder="nama file di images/" value="${esc(IMG_MAP[it.name] || '')}" aria-label="Nama file foto ${esc(it.name)}" style="min-width:0;flex:1"><button class="btn line sm" data-act="mapSave" data-id="${it.id}">Cocokkan</button></div></div>
    <div class="acts"><label class="btn soft sm">Ganti<input type="file" accept="image/*" hidden data-gal="one" data-id="${it.id}"></label>${it.img ? `<button class="btn danger sm" data-act="galReset" data-id="${it.id}">Reset</button>` : ''}</div></div>`; }).join('')}</section>
    <p class="muted sm-t">Foto paket hemat dari unggahan memerlukan perubahan satu baris di script.js (lihat catatan). Pencocokan nama file folder sudah berfungsi untuk paket.</p>`;
  };
  function warnStore() { if (storePct() > 80) toast('Penyimpanan browser hampir penuh. Pertimbangkan memakai foto dari folder images/.', 'err'); }
  Object.assign(actions, {
    galProbe: A(async () => {
      toast('Memeriksa folder images/...');
      for (const it of items()) ui.gprobe[it.id] = await probe(it.name);
      render(); const miss = items().filter(it => !it.img && ui.gprobe[it.id] === 'none').length;
      toast(miss ? miss + ' menu belum punya foto di folder. Isi kolom nama file lalu Cocokkan.' : 'Semua menu punya foto.', miss ? 'err' : 'ok');
    }),
    mapSave: A(async t => {
      const it = items().find(x => x.id === t.dataset.id), inp = $(`[data-gmap="${t.dataset.id}"]`); if (!it || !inp) return;
      const v = inp.value.trim(); if (v && !/\.(jpe?g|png|webp)$/i.test(v)) return bad('Nama file harus berakhiran .jpg, .jpeg, .png, atau .webp.');
      if (v) { S.imgMap[it.name] = v; IMG_MAP[it.name] = v; } else { delete S.imgMap[it.name]; delete IMG_MAP[it.name]; }
      save(); ui.gprobe[it.id] = await probe(it.name); render();
      ok(ui.gprobe[it.id] === 'none' ? 'File tidak ditemukan di folder images/. Periksa penulisan nama file.' : 'Foto ' + it.name + ' cocok.');
    }),
    galReset: A(t => { const it = items().find(x => x.id === t.dataset.id); if (!it) return; it.img = ''; save(); render(); ok('Foto kustom dihapus.'); }),
  });
  document.addEventListener('change', async e => {
    const t = e.target, g = t.dataset && t.dataset.gal; if (!g || !isAdmin()) return;
    const files = [...t.files]; if (!files.length) return;
    if (g === 'one') {
      const it = items().find(x => x.id === t.dataset.id), f = files[0]; if (!it) return;
      if (f.size > 8e6) return bad('Ukuran foto maksimal 8 MB.');
      try { it.img = await readImage(f); save(); render(); ok('Foto ' + it.name + ' diganti.'); warnStore(); } catch (x) { bad(x.message); }
      return;
    }
    toast('Memproses ' + files.length + ' foto...'); let n = 0; const miss = [];
    for (const f of files) {
      const it = matchItem(f.name); if (!it || f.size > 8e6) { miss.push(f.name); continue; }
      try { it.img = await readImage(f); n++; } catch (x) { miss.push(f.name); }
    }
    ui.gres = { ok: n, miss }; save(); render(); warnStore();
  });
  /* foto URL yang rusak kembali ke ilustrasi bawaan */
  document.addEventListener('error', e => {
    const el = e.target; if (!el || el.tagName !== 'IMG' || el._f) return;
    const s = el.getAttribute('src') || ''; if (!s || /^(images\/|data:)/.test(s)) return;
    const it = items().find(x => x.img === s); if (!it) return; el._f = 1; el.src = foodImg(it.kind || 'bundle-solo');
  }, true);

  render();
})();
