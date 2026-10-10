// Outils : mathématiques, aléas, dessin de base, accès au DOM.

// ================= VERSION ET JOURNAL DES INCIDENTS =================
const VERSION = '__VERSION__'; // remplacée par celle de package.json à la construction
// Les erreurs ne bloquent jamais le jeu : elles sont notées (sans doublon) et consultables dans Réglages → À propos.
const ERRLOG = { list: [], n: 0, shownT: -1e9,
  add(kind, msg, where) {
    msg = String(msg || '?').slice(0, 300); this.n++;
    const o = this.list.find(e => e.msg === msg);
    if (o) { o.count++; o.last = Date.now(); return; }
    this.list.push({ kind, msg, where: String(where || '').slice(0, 300), count: 1, first: Date.now(), last: Date.now(), state: typeof state !== 'undefined' ? state : '?' });
    if (this.list.length > 30) this.list.shift();
    const now = Date.now();
    if (now - this.shownT > 60000 && typeof toast === 'function') { this.shownT = now; try { toast(TL('Incident technique : la partie continue (détails dans Réglages → À propos).')); } catch (e) { } }
  },
  report() { return 'Colosse ' + VERSION + ' · ' + navigator.userAgent + '\n' + this.list.map(e => `[${new Date(e.first).toISOString()}] ${e.kind} ×${e.count} (${e.state}) ${e.msg}${e.where ? '\n    ' + e.where : ''}`).join('\n'); },
};
window.addEventListener('error', e => ERRLOG.add('erreur', e.message, e.error && e.error.stack ? e.error.stack.split('\n').slice(1, 3).join(' | ') : (e.filename || '') + ':' + (e.lineno || '')));
window.addEventListener('unhandledrejection', e => { const r = e.reason; if (r && r.name === 'AbortError') return; ERRLOG.add('promesse', r && r.message || r, r && r.stack ? r.stack.split('\n').slice(1, 3).join(' | ') : ''); });

// ================= UTILITAIRES =================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[(Math.random() * a.length) | 0];
const d2 = (ax, ay, bx, by) => { const x = ax - bx, y = ay - by; return x * x + y * y; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return d; }
function turnTo(a, b, max) { const d = angDiff(a, b); return Math.abs(d) <= max ? b : a + Math.sign(d) * max; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function makeNoise(seed) {
  const r = mulberry32(seed); const P = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) P[i] = r();
  const v = (ix, iy) => P[((ix & 255) << 8) | (iy & 255)];
  function n(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(v(ix, iy), v(ix + 1, iy), sx), lerp(v(ix, iy + 1), v(ix + 1, iy + 1), sx), sy);
  }
  return function (x, y, oct = 4) { let s = 0, a = .5, f = 1, t = 0; for (let i = 0; i < oct; i++) { s += n(x * f, y * f) * a; t += a; a *= .5; f *= 2.03; } return s / t; };
}
function fmt(n) { n = Math.floor(n); return n >= 100000 ? Math.round(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); }
function mmss(t) { t = Math.max(0, Math.floor(t)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
