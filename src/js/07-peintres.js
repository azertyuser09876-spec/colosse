// Peintres procéduraux : robots, armes, bâtiments, défenses, géants (tout est dessiné par le code).

// ================= ASSETS : PEINTRES PROCÉDURAUX =================
const PAL = {
  ally: { body: '#34474a', body2: '#243234', plate: '#4f6669', acc: '#6fe3c8', glow: 'rgba(111,227,200,', dark: '#141c1d' },
  player: { body: '#4a3d2c', body2: '#2f271c', plate: '#6b5739', acc: '#ff8a3d', glow: 'rgba(255,138,61,', dark: '#17120c' },
  enemy: { body: '#4a2d31', body2: '#311d20', plate: '#6a3c41', acc: '#ff4d5e', glow: 'rgba(255,77,94,', dark: '#190e10' },
  boss: { body: '#3a2326', body2: '#24151a', plate: '#5c2f35', acc: '#ff2a3a', glow: 'rgba(255,42,58,', dark: '#120809' },
  human: { body: '#4b4438', body2: '#2e2a22', plate: '#5e5546', acc: '#ff5a4a', glow: 'rgba(255,90,74,', dark: '#1a1712' },
};
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ngon(c, n, r, rot = 0, ox = 0, oy = 0) { c.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; const x = ox + Math.cos(a) * r, y = oy + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); }
function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
function treads(c, x, y, w, h, P, t, sp) {
  c.fillStyle = P.dark; rr(c, x, y, w, h, Math.min(h / 2, 7)); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = Math.max(1, h * .14);
  const step = Math.max(4, h * .42); const off = (((-t * sp) % step) + step) % step;
  c.beginPath(); for (let xx = x + off; xx < x + w - 1; xx += step) { c.moveTo(xx, y + 1.5); c.lineTo(xx, y + h - 1.5); } c.stroke();
}
function glowCore(c, x, y, r, P, t) {
  const p = .55 + .45 * Math.sin(t * 3);
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#fff8e8'); g.addColorStop(.3, P.glow + (.9 * p) + ')'); g.addColorStop(1, P.glow + '0)');
  c.fillStyle = g; circ(c, x, y, r); c.fill();
}

function paintChassis(c, id, r, P, t, mv, u) {
  c.lineJoin = 'round';
  switch (id) {
    case 'crawler': {
      c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .2;
      for (let s = -1; s <= 1; s += 2) for (let i = -1; i <= 1; i++) {
        const ph = Math.sin(t * 16 + i * 2.1 + (s > 0 ? Math.PI : 0)) * mv;
        const bx = i * r * .5, by = s * r * .4, kx = bx + ph * r * .3 + i * r * .15, ky = by + s * r * .55;
        c.beginPath(); c.moveTo(bx, by); c.lineTo(kx, ky); c.lineTo(kx + i * r * .2 + ph * r * .15, ky + s * r * .38); c.stroke();
      }
      c.fillStyle = P.body; ngon(c, 6, r * .78); c.fill(); c.strokeStyle = P.plate; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.plate; ngon(c, 6, r * .42, Math.PI / 6); c.fill();
      c.fillStyle = P.acc; circ(c, r * .52, 0, r * .15); c.fill(); break;
    }
    case 'drone': {
      c.lineCap = 'round'; c.strokeStyle = P.body2; c.lineWidth = r * .2;
      for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85); c.stroke(); }
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2, x = Math.cos(a) * r * .85, y = Math.sin(a) * r * .85;
        c.fillStyle = 'rgba(210,225,220,.13)'; circ(c, x, y, r * .45); c.fill();
        const sa = t * 55 + k; c.strokeStyle = P.plate; c.lineWidth = 1.4; c.beginPath();
        c.moveTo(x + Math.cos(sa) * r * .42, y + Math.sin(sa) * r * .42); c.lineTo(x - Math.cos(sa) * r * .42, y - Math.sin(sa) * r * .42); c.stroke();
      }
      c.fillStyle = P.body; circ(c, 0, 0, r * .44); c.fill(); c.fillStyle = P.plate; circ(c, -r * .05, 0, r * .26); c.fill();
      c.fillStyle = P.acc; circ(c, r * .32, 0, r * .1); c.fill(); break;
    }
    case 'mule': {
      const L = r * 1.75, Wd = r * 1.28;
      c.fillStyle = P.dark;
      for (const [wx, wy] of [[-.55, -.64], [.5, -.64], [-.55, .64], [.5, .64]]) { rr(c, wx * r - r * .25, wy * r - r * .14, r * .5, r * .28, 3); c.fill(); }
      c.fillStyle = P.body; rr(c, -L / 2, -Wd / 2, L, Wd, r * .18); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.plate; rr(c, r * .3, -Wd * .4, r * .52, Wd * .8, 4); c.fill();
      c.fillStyle = P.acc; c.fillRect(r * .74, -Wd * .3, r * .08, Wd * .6);
      c.fillStyle = P.body2; rr(c, -L / 2 + r * .1, -Wd * .4, r * 1.1, Wd * .8, 3); c.fill();
      const f = u && u.cargoMax ? u.cargoW / u.cargoMax : .5; const n = Math.round(f * 6);
      for (let k = 0; k < n; k++) { const bx = -L / 2 + r * .18 + (k % 3) * r * .34, by = -Wd * .34 + Math.floor(k / 3) * Wd * .36; c.fillStyle = k % 2 ? '#8a7650' : '#a08a5c'; c.fillRect(bx, by, r * .28, Wd * .3); }
      break;
    }
    case 'sentry': {
      treads(c, -r * .95, -r * .98, r * 1.9, r * .4, P, t, r * 2); treads(c, -r * .95, r * .58, r * 1.9, r * .4, P, t, r * 2);
      c.fillStyle = P.body; rr(c, -r * .8, -r * .62, r * 1.6, r * 1.24, r * .25); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.plate; rr(c, -r * .58, -r * .44, r * 1.0, r * .88, r * .15); c.fill();
      c.fillStyle = P.acc; c.fillRect(r * .62, -r * .3, r * .12, r * .6); break;
    }
    case 'strider': {
      const legs = [[.45, -.4, -1], [.45, .4, 1], [-.45, -.4, -1], [-.45, .4, 1]];
      legs.forEach(([hx, hy, s], i) => {
        const ph = Math.sin(t * 7 + ((i === 0 || i === 3) ? 0 : Math.PI)) * mv;
        const HX = hx * r, HY = hy * r, FX = HX + ph * r * .35 + hx * r * .3, FY = HY + s * r * .78;
        const KX = (HX + FX) / 2 + hx * r * .3, KY = (HY + FY) / 2 + s * r * .22;
        c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .17; c.beginPath(); c.moveTo(HX, HY); c.lineTo(KX, KY); c.lineTo(FX, FY); c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = r * .07; c.beginPath(); c.moveTo(HX, HY); c.lineTo(KX, KY); c.stroke();
        c.fillStyle = P.body2; circ(c, FX, FY, r * .12); c.fill();
      });
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .75, r * .55, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .1, 0, r * .45, r * .36, 0, 0, TAU); c.fill();
      c.fillStyle = P.acc; circ(c, r * .6, 0, r * .1); c.fill(); break;
    }
    case 'goliath': {
      treads(c, -r * 1.0, -r * 1.0, r * 2.0, r * .42, P, t, r * 1.2); treads(c, -r * 1.0, r * .58, r * 2.0, r * .42, P, t, r * 1.2);
      const a = r * .86, b = r * .62, ch = r * .2;
      c.fillStyle = P.body; c.beginPath(); c.moveTo(-a + ch, -b); c.lineTo(a - ch, -b); c.lineTo(a, -b + ch); c.lineTo(a, b - ch); c.lineTo(a - ch, b); c.lineTo(-a + ch, b); c.lineTo(-a, b - ch); c.lineTo(-a, -b + ch); c.closePath(); c.fill();
      c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = P.plate; rr(c, -a * .85, -b * .78, a * .8, b * 1.56, 4); c.fill();
      c.strokeStyle = P.dark; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = -a * .78 + i * a * .15; c.beginPath(); c.moveTo(x, -b * .55); c.lineTo(x, b * .55); c.stroke(); }
      c.fillStyle = P.acc; c.fillRect(a - r * .12, -b * .7, r * .08, r * .22); c.fillRect(a - r * .12, b * .7 - r * .22, r * .08, r * .22);
      c.fillStyle = P.dark; for (const [x, y] of [[-a + ch, -b + ch * .6], [a - ch, -b + ch * .6], [-a + ch, b - ch * .6], [a - ch, b - ch * .6]]) { circ(c, x, y, r * .04); c.fill(); }
      if (u && u.spikes) { c.fillStyle = '#c9c2b4'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(a, k * r * .2 - r * .07); c.lineTo(a + r * .25, k * r * .2); c.lineTo(a, k * r * .2 + r * .07); c.fill(); } }
      break;
    }
    case 'titan': {
      for (const s of [-1, 1]) {
        const ph = Math.sin(t * 3.2 + (s > 0 ? Math.PI : 0)) * mv; const fx = ph * r * .38, fy = s * r * .42;
        c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .22; c.beginPath(); c.moveTo(0, s * r * .3); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = P.body2; rr(c, fx - r * .3, fy - r * .17, r * .64, r * .34, r * .08); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
        c.fillStyle = P.dark; for (let k = -1; k <= 1; k++) c.fillRect(fx + r * .3, fy + k * r * .1 - r * .035, r * .1, r * .07);
      }
      c.fillStyle = P.body; rr(c, -r * .46, -r * .5, r * .92, r * 1.0, r * .18); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-r * .4, -r * .3 + k * r * .2); c.lineTo(-r * .25, -r * .3 + k * r * .2); c.stroke(); }
      for (const s of [-1, 1]) { c.fillStyle = P.plate; rr(c, -r * .34, s * r * .62 - r * .21, r * .68, r * .42, r * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke(); }
      c.fillStyle = P.acc; c.beginPath(); c.moveTo(r * .4, -r * .18); c.lineTo(r * .52, -r * .1); c.lineTo(r * .52, r * .1); c.lineTo(r * .4, r * .18); c.closePath(); c.fill();
      glowCore(c, -r * .08, 0, r * .2, P, t); break;
    }
    case 'colossus': {
      const R = r;
      for (const [tx, ty] of [[.48, -.8], [.48, .8], [-.5, -.8], [-.5, .8]]) {
        treads(c, tx * R - R * .44, ty * R - R * .17, R * .88, R * .34, P, t, R * .9);
        c.fillStyle = P.body2; rr(c, tx * R - R * .3, ty * R - Math.sign(ty) * R * .02 - R * .07, R * .6, R * .14, 4); c.fill();
      }
      c.fillStyle = P.body2; rr(c, -R * .84, -R * .66, R * 1.68, R * 1.32, R * .12); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
      c.save(); rr(c, R * .72, -R * .56, R * .1, R * 1.12, 3); c.clip();
      for (let k = -14; k < 14; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.beginPath(); c.moveTo(R * .72, k * R * .08); c.lineTo(R * .82, k * R * .08 + R * .06); c.lineTo(R * .82, k * R * .08 + R * .1); c.lineTo(R * .72, k * R * .08 + R * .04); c.fill(); }
      c.restore();
      c.fillStyle = P.dark; for (let k = 0; k < 5; k++) c.fillRect(-R * .82, -R * .4 + k * R * .2, R * .1, R * .08);
      c.fillStyle = P.body; ngon(c, 8, R * .7, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
      c.fillStyle = P.plate; ngon(c, 8, R * .56, Math.PI / 8); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2;
      for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * TAU / 8; c.beginPath(); c.moveTo(Math.cos(a) * R * .2, Math.sin(a) * R * .2); c.lineTo(Math.cos(a) * R * .7, Math.sin(a) * R * .7); c.stroke(); }
      c.fillStyle = P.body2; for (const [x, y] of [[-.22, -.2], [-.22, .2], [.12, -.3], [.12, .3]]) { circ(c, x * R, y * R, R * .06); c.fill(); c.strokeStyle = P.dark; c.stroke(); }
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .44, -R * .24); c.lineTo(R * .66, -R * .16); c.lineTo(R * .66, R * .16); c.lineTo(R * .44, R * .24); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.acc; for (let k = -2; k <= 2; k++) c.fillRect(R * .58, k * R * .055 - R * .02, R * .05, R * .04);
      c.strokeStyle = P.dark; c.lineWidth = 3; c.beginPath(); c.moveTo(-R * .55, -R * .1); c.lineTo(-R * .78, -R * .2); c.moveTo(-R * .55, R * .1); c.lineTo(-R * .78, R * .25); c.stroke();
      c.fillStyle = P.acc; circ(c, -R * .78, -R * .2, R * .02 + Math.sin(t * 6) * 1.5 + 2); c.fill();
      glowCore(c, 0, 0, R * .2, P, t);
      c.strokeStyle = P.glow + '.6)'; c.lineWidth = 3; circ(c, 0, 0, R * .13); c.stroke();
      break;
    }
    default: paintChassisX(c, id, r, P, t, mv, u);
  }
}

function paintEnemy(c, type, r, P, t, mv, u) {
  switch (type) {
    case 'rodeur': case 'pillard': paintHuman(c, r, P, t, mv, type === 'pillard' ? 'rifle' : 'pistol', 0); break;
    case 'essaim': {
      const fl = Math.sin(t * 60) * .3;
      c.fillStyle = 'rgba(255,140,140,.22)'; c.beginPath(); c.ellipse(-r * .1, -r * .8, r * .7, r * (.35 + fl * .3), 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-r * .1, r * .8, r * .7, r * (.35 - fl * .3), 0, 0, TAU); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.moveTo(r * 1.1, 0); c.lineTo(-r * .8, -r * .7); c.lineTo(-r * .4, 0); c.lineTo(-r * .8, r * .7); c.closePath(); c.fill();
      c.fillStyle = P.acc; circ(c, r * .35, 0, r * .25); c.fill(); break;
    }
    case 'traqueur': {
      c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .16;
      for (let k = 0; k < 4; k++) { const s = k < 2 ? -1 : 1, fx = (k % 2 ? -.5 : .4) * r, ph = Math.sin(t * 20 + k * 1.7) * mv * r * .35; c.beginPath(); c.moveTo(fx * .5, s * r * .2); c.lineTo(fx + ph, s * r * .7); c.lineTo(fx + ph * 1.3 + (k % 2 ? -1 : 1) * r * .3, s * r * 1.05); c.stroke(); }
      c.fillStyle = '#cfd4d6'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(r * .3, s * r * .3); c.lineTo(r * 1.4, s * r * .15); c.lineTo(r * .5, s * r * .55); c.closePath(); c.fill(); }
      c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .8, 0); c.lineTo(0, -r * .5); c.lineTo(-r * .8, 0); c.lineTo(0, r * .5); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.acc; circ(c, r * .35, 0, r * .14); c.fill(); break;
    }
    case 'bastion': {
      c.fillStyle = P.body2; ngon(c, 6, r * 1.05, Math.PI / 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = P.body; ngon(c, 6, r * .8, Math.PI / 6); c.fill();
      c.fillStyle = P.dark; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; circ(c, Math.cos(a) * r * .9, Math.sin(a) * r * .9, r * .06); c.fill(); }
      c.strokeStyle = P.acc; c.lineWidth = 1.5; c.globalAlpha = .6; circ(c, 0, 0, r * .62); c.stroke(); c.globalAlpha = 1; break;
    }
    case 'mastodonte': paintChassis(c, 'goliath', r, P, t, mv, u); break;
    case 'souverain': case 'archonte': {
      for (let k = 0; k < 6; k++) {
        const side = k < 3 ? -1 : 1, idx = k % 3, base = (idx - 1) * .75;
        const a = side * (Math.PI / 2) + base * -side * -1 * 1;
        const ph = Math.sin(t * 2.6 + k * 1.3 + (idx % 2) * Math.PI) * mv;
        const hx = Math.cos(a) * r * .55, hy = Math.sin(a) * r * .55;
        const ka = a + ph * .25, kx = Math.cos(ka) * r * 1.05, ky = Math.sin(ka) * r * 1.05;
        const fa = a + ph * .4 + (idx - 1) * side * .15, fx = Math.cos(fa) * r * 1.45, fy = Math.sin(fa) * r * 1.45;
        c.lineCap = 'round'; c.strokeStyle = P.dark; c.lineWidth = r * .16; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = r * .06; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke();
        c.fillStyle = P.body2; circ(c, fx, fy, r * .1); c.fill(); c.fillStyle = P.acc; circ(c, kx, ky, r * .04); c.fill();
      }
      c.fillStyle = P.body; ngon(c, 12, r * .75, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
      c.fillStyle = P.plate; ngon(c, 12, r * .58, Math.PI / 12); c.fill();
      c.fillStyle = '#c9c2b4'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a - .08) * r * .75, Math.sin(a - .08) * r * .75); c.lineTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9); c.lineTo(Math.cos(a + .08) * r * .75, Math.sin(a + .08) * r * .75); c.fill(); }
      glowCore(c, 0, 0, r * .28, P, t);
      c.fillStyle = P.acc; for (const [x, y, s] of [[.62, 0, .07], [.55, -.12, .045], [.55, .12, .045]]) { circ(c, x * r, y * r, s * r); c.fill(); }
      break;
    }
    case 'cible': paintChassisX(c, 'cible', r, P, t, mv, u); break;
    default: { const E = ENEMIES[type]; if (E && E.painter) paintChassis(c, E.painter, r, P, t, mv, u); }
  }
}

function paintHuman(c, r, P, t, mv, gun, packF) {
  const ph = Math.sin(t * 12) * mv;
  c.fillStyle = P.dark; c.beginPath(); c.ellipse(ph * r * .5, -r * .36, r * .36, r * .2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-ph * r * .5, r * .36, r * .36, r * .2, 0, 0, TAU); c.fill();
  const pw = r * (.45 + packF * .45); c.fillStyle = P.body2; rr(c, -r * .45 - pw, -r * (.45 + packF * .2), pw, r * (.9 + packF * .4), 3); c.fill();
  if (packF > .05) { c.strokeStyle = P.dark; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * .45 - pw * .5, -r * .4); c.lineTo(-r * .45 - pw * .5, r * .4); c.stroke(); }
  c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .55, r * .88, 0, 0, TAU); c.fill();
  c.fillStyle = '#16191a';
  const gl = gun === 'rifle' || gun === 'ar' ? 1.5 : gun === 'shotgun' ? 1.3 : gun === 'plasma' ? 1.4 : 1.0;
  const gw = gun === 'plasma' ? .34 : gun === 'shotgun' ? .3 : .22;
  c.fillRect(r * .1, r * .18, r * gl, r * gw);
  if (gun === 'plasma') { c.fillStyle = '#b08bff'; c.fillRect(r * (.1 + gl - .2), r * .2, r * .2, r * .3); }
  c.fillStyle = P.body; circ(c, r * .45, r * .3, r * .22); c.fill();
  c.fillStyle = P.plate; circ(c, r * .05, 0, r * .42); c.fill();
  c.fillStyle = P.acc; c.fillRect(r * .2, -r * .22, r * .18, r * .44);
}

function paintMount(c, wid, s, P, rec, t, m) {
  c.save(); c.scale(s, s); c.translate(-rec * 2.5, 0);
  const dark = '#181c1e';
  switch (wid) {
    case 'mg': case 'e_mg': c.fillStyle = P.body2; circ(c, 0, 0, 4.5); c.fill(); c.fillStyle = dark; c.fillRect(2, -2.7, 10, 1.9); c.fillRect(2, .8, 10, 1.9); c.fillStyle = P.plate; circ(c, 0, 0, 2.6); c.fill(); break;
    case 'rifle': c.fillStyle = P.body2; rr(c, -4, -3, 8, 6, 2); c.fill(); c.fillStyle = dark; c.fillRect(2, -1, 15, 2); c.fillStyle = P.plate; c.fillRect(-1, -3.8, 6, 1.6); c.fillStyle = P.acc; c.fillRect(4, -3.8, 1.2, 1.6); break;
    case 'blades': case 'e_claw': c.fillStyle = '#d8dde0'; for (const sg of [-1, 1]) { c.save(); c.rotate(sg * (.35 - rec * .3)); c.beginPath(); c.moveTo(0, sg * 2); c.lineTo(15, sg * 1); c.lineTo(3, sg * 5); c.closePath(); c.fill(); c.restore(); } c.fillStyle = P.body2; circ(c, 0, 0, 3.5); c.fill(); break;
    case 'flamer': c.fillStyle = '#7a4a2a'; circ(c, -3, 0, 4.2); c.fill(); c.fillStyle = P.body2; c.fillRect(0, -2, 10, 4); c.fillStyle = '#ff8a2a'; c.fillRect(9, -1.5, 2.2, 3); break;
    case 'repair': c.fillStyle = P.body2; circ(c, 0, 0, 3.8); c.fill(); c.strokeStyle = '#6fb5a4'; c.lineWidth = 1.6; c.beginPath(); c.arc(1, 0, 5.5, -1.2, 1.2); c.stroke(); c.fillStyle = '#9ff0dc'; circ(c, 5, 0, 1.8); c.fill(); break;
    case 'laser': case 'e_laser': c.fillStyle = P.body2; circ(c, 0, 0, 5); c.fill(); c.fillStyle = dark; c.fillRect(2, -1.6, 9, 3.2);
      c.fillStyle = wid === 'laser' ? '#ff5fd8' : '#ff3050'; c.beginPath(); c.moveTo(9, 0); c.lineTo(12, -2.4); c.lineTo(15, 0); c.lineTo(12, 2.4); c.closePath(); c.fill(); break;
    case 'rockets': case 'e_rockets': c.fillStyle = P.body2; rr(c, -5, -6, 12, 12, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.fillStyle = dark;
      for (const [x, y] of [[4, -3], [4, 3], [0.5, -3], [0.5, 3]]) { circ(c, x, y, 1.6); c.fill(); } c.fillStyle = '#ffb020'; circ(c, 4, -3, .7); c.fill(); break;
    case 'cannon': case 'e_cannon': c.fillStyle = P.body; circ(c, 0, 0, 6.5); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke(); c.fillStyle = dark; c.fillRect(3, -2, 16, 4); c.fillRect(17, -2.8, 3.5, 5.6); c.fillStyle = P.plate; circ(c, -1, 0, 3); c.fill(); break;
    case 'rail': c.fillStyle = P.body2; rr(c, -5, -5, 10, 10, 2); c.fill(); c.fillStyle = dark; c.fillRect(0, -3.6, 25, 1.7); c.fillRect(0, 1.9, 25, 1.7);
      c.fillStyle = 'rgba(126,249,255,' + (.35 + .3 * Math.sin(t * 8)) + ')'; c.fillRect(2, -1.2, 22, 2.4); break;
    case 'mortar': case 'e_mortar': c.fillStyle = P.body2; rr(c, -6.5, -6.5, 13, 13, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.fillStyle = dark; circ(c, 2, 0, 5.2); c.fill(); c.strokeStyle = P.plate; c.lineWidth = 1.2; circ(c, 2, 0, 3.6); c.stroke(); break;
    case 'e_sting': c.fillStyle = '#ff6070'; c.fillRect(0, -.8, 6, 1.6); break;
    default: c.restore(); paintMountX(c, wid, s, P, rec, t, m); return;
  }
  c.restore();
}

function mountWorldPos(u, m) {
  const ca = Math.cos(u.ang), sa = Math.sin(u.ang);
  return [u.x + m.ox * ca - m.oy * sa, u.y + m.ox * sa + m.oy * ca];
}

// ================= ASSETS : CHÂSSIS =================
function paintChassisX(c, id, r, P, t, mv, u) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  switch (id) {
    case 'ant': {
      c.strokeStyle = P.dark; c.lineWidth = r * .16;
      for (let s = -1; s <= 1; s += 2) for (let i = -1; i <= 1; i++) {
        const ph = Math.sin(t * 22 + i * 2 + (s > 0 ? Math.PI : 0)) * mv;
        c.beginPath(); c.moveTo(i * r * .35, 0); c.lineTo(i * r * .35 + ph * r * .3 + i * r * .2, s * r * .75); c.lineTo(i * r * .55 + ph * r * .35, s * r * 1.05); c.stroke();
      }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(-r * .55, 0, r * .45, r * .36, 0, 0, TAU); c.fill();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(0, 0, r * .3, r * .28, 0, 0, TAU); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .5, 0, r * .3, r * .3, 0, 0, TAU); c.fill();
      c.strokeStyle = P.plate; c.lineWidth = r * .08; c.beginPath(); c.moveTo(r * .7, -r * .1); c.lineTo(r * 1.1, -r * .45); c.moveTo(r * .7, r * .1); c.lineTo(r * 1.1, r * .45); c.stroke();
      c.fillStyle = P.acc; circ(c, r * .62, 0, r * .1); c.fill(); break;
    }
    case 'scout': {
      c.fillStyle = P.dark;
      for (const [wx, wy] of [[-.5, -.7], [.5, -.7], [-.5, .7], [.5, .7]]) { rr(c, wx * r - r * .26, wy * r - r * .15, r * .52, r * .3, 3); c.fill(); }
      c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .95, 0); c.lineTo(r * .4, -r * .55); c.lineTo(-r * .85, -r * .5); c.lineTo(-r * .85, r * .5); c.lineTo(r * .4, r * .55); c.closePath(); c.fill();
      c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = r * .1; rr(c, -r * .5, -r * .38, r * .8, r * .76, 4); c.stroke();
      c.fillStyle = P.acc; c.fillRect(r * .75, -r * .32, r * .1, r * .14); c.fillRect(r * .75, r * .18, r * .1, r * .14);
      if (mv > .3) { c.fillStyle = 'rgba(120,110,95,.25)'; circ(c, -r * 1.1, (Math.random() - .5) * r, r * .3); c.fill(); }
      break;
    }
    case 'gunship': {
      c.fillStyle = P.body2; rr(c, -r * 1.35, -r * .1, r * .9, r * .2, 3); c.fill();
      c.save(); c.translate(-r * 1.3, 0); c.rotate(t * 30); c.strokeStyle = P.plate; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -r * .28); c.lineTo(0, r * .28); c.stroke(); c.restore();
      c.fillStyle = P.body2; rr(c, -r * .1, -r * .6, r * .4, r * 1.2, 4); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .75, r * .42, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.acc; c.beginPath(); c.ellipse(r * .42, 0, r * .22, r * .2, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, 0, 0, r * 1.25); c.fill();
      c.strokeStyle = 'rgba(220,230,226,.5)'; c.lineWidth = r * .07;
      for (let k = 0; k < 4; k++) { const a = t * 40 + k * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); c.stroke(); }
      c.fillStyle = P.dark; circ(c, 0, 0, r * .12); c.fill(); break;
    }
    case 'spider': {
      for (let k = 0; k < 6; k++) {
        const s = k < 3 ? -1 : 1, i = k % 3, bx = (1 - i) * r * .32;
        const ph = Math.sin(t * 9 + i * 2.1 + (s > 0 ? Math.PI : 0)) * mv;
        const kx = bx + (1 - i) * r * .35 + ph * r * .2, ky = s * r * .8, fx = bx + (1 - i) * r * .6 + ph * r * .3, fy = s * r * 1.15;
        c.strokeStyle = P.dark; c.lineWidth = r * .12; c.beginPath(); c.moveTo(bx, s * r * .2); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = P.acc; circ(c, kx, ky, r * .05); c.fill();
      }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(-r * .55, 0, r * .45, r * .4, 0, 0, TAU); c.fill();
      c.fillStyle = P.body; circ(c, r * .1, 0, r * .55); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; circ(c, r * .1, 0, r * .32); c.fill();
      c.fillStyle = P.acc; for (const [x, y] of [[.58, -.12], [.58, .12], [.66, 0]]) { circ(c, x * r, y * r, r * .06); c.fill(); }
      break;
    }
    case 'rhino': {
      treads(c, -r * .95, -r * .98, r * 1.8, r * .38, P, t, r * 2); treads(c, -r * .95, r * .6, r * 1.8, r * .38, P, t, r * 2);
      c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .75, -r * .6); c.lineTo(-r * .85, -r * .62); c.lineTo(-r * .85, r * .62); c.lineTo(r * .75, r * .6); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; rr(c, -r * .6, -r * .42, r * 1.0, r * .84, r * .12); c.fill();
      c.fillStyle = '#b9b2a2'; c.beginPath(); c.moveTo(r * .7, -r * .9); c.lineTo(r * 1.15, -r * .3); c.lineTo(r * 1.25, 0); c.lineTo(r * 1.15, r * .3); c.lineTo(r * .7, r * .9); c.lineTo(r * .85, 0); c.closePath(); c.fill();
      c.strokeStyle = '#5c574c'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#d8d2c2'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(r * 1.1, k * r * .32 - r * .08); c.lineTo(r * 1.45, k * r * .32); c.lineTo(r * 1.1, k * r * .32 + r * .08); c.fill(); }
      c.fillStyle = P.acc; c.fillRect(r * .45, -r * .2, r * .1, r * .4); break;
    }
    case 'reaper': {
      for (const s of [-1, 1]) {
        const ph = Math.sin(t * 5 + (s > 0 ? Math.PI : 0)) * mv, fx = ph * r * .45, fy = s * r * .32;
        c.strokeStyle = P.dark; c.lineWidth = r * .16; c.beginPath(); c.moveTo(0, s * r * .25); c.lineTo(fx - r * .15, fy + s * r * .1); c.lineTo(fx + r * .1, fy); c.stroke();
        c.fillStyle = P.body2; c.beginPath(); c.moveTo(fx + r * .45, fy); c.lineTo(fx - r * .1, fy - r * .14); c.lineTo(fx - r * .1, fy + r * .14); c.closePath(); c.fill();
      }
      c.fillStyle = P.body; ngon(c, 6, r * .45, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2.5; c.stroke();
      for (const s of [-1, 1]) { c.fillStyle = P.plate; c.beginPath(); c.moveTo(r * .3, s * r * .32); c.lineTo(-r * .3, s * r * .32); c.lineTo(-r * .2, s * r * .72); c.lineTo(r * .25, s * r * .68); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * .55, 0); c.lineTo(r * .3, -r * .16); c.lineTo(r * .3, r * .16); c.closePath(); c.fill();
      c.fillStyle = P.acc; c.fillRect(r * .38, -r * .05, r * .12, r * .1);
      glowCore(c, -r * .05, 0, r * .16, P, t); break;
    }
    case 'airship': {
      for (const s of [-1, 1]) for (const ex of [.25, -.45]) {
        const x = ex * r, y = s * r * .62;
        c.fillStyle = P.body2; rr(c, x - r * .22, y - r * .13, r * .44, r * .26, r * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
        c.fillStyle = 'rgba(210,225,220,.14)'; circ(c, x - r * .26, y, r * .2); c.fill();
        c.strokeStyle = 'rgba(220,230,226,.55)'; c.lineWidth = 2; const a = t * 35 + ex * 3; c.beginPath(); c.moveTo(x - r * .26, y - Math.cos(a) * r * .2); c.lineTo(x - r * .26, y + Math.cos(a) * r * .2); c.stroke();
        c.strokeStyle = P.dark; c.lineWidth = r * .06; c.beginPath(); c.moveTo(x, y - s * r * .13); c.lineTo(x, s * r * .32); c.stroke();
      }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .95, r * .36, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.plate; rr(c, -r * .7, -r * .2, r * 1.4, r * .4, r * .1); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * r * .2, -r * .2); c.lineTo(k * r * .2, r * .2); c.stroke(); }
      c.fillStyle = P.body2; rr(c, r * .25, -r * .3, r * .22, r * .6, 4); c.fill(); c.fillStyle = P.acc; c.fillRect(r * .4, -r * .2, r * .05, r * .4);
      c.fillStyle = P.acc; circ(c, r * .9, 0, r * .05); c.fill(); circ(c, -r * .92, 0, r * .04); c.fill(); break;
    }
    case 'behemoth': {
      for (let k = 0; k < 8; k++) {
        const s = k < 4 ? -1 : 1, i = k % 4, bx = (1.5 - i) * r * .26;
        const ph = Math.sin(t * 3.2 + i * 1.6 + (s > 0 ? Math.PI : 0)) * mv;
        const kx = bx + (1.5 - i) * r * .25 + ph * r * .18, ky = s * r * .95, fx = bx + (1.5 - i) * r * .45 + ph * r * .25, fy = s * r * 1.3;
        c.strokeStyle = P.dark; c.lineWidth = r * .1; c.beginPath(); c.moveTo(bx, s * r * .35); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = r * .04; c.beginPath(); c.moveTo(bx, s * r * .35); c.lineTo(kx, ky); c.stroke();
        c.fillStyle = P.body2; circ(c, fx, fy, r * .06); c.fill();
      }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(-r * .55, 0, r * .4, r * .45, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .05, 0, r * .62, r * .52, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.plate; for (let k = 0; k < 3; k++) { rr(c, -r * .4 + k * r * .3, -r * .38, r * .24, r * .76, r * .05); c.fill(); }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(r * .62, 0, r * .16, r * .24, 0, 0, TAU); c.fill();
      c.fillStyle = P.acc; for (const [x, y] of [[.7, -.1], [.7, .1], [.76, 0]]) { circ(c, x * r, y * r, r * .035); c.fill(); }
      glowCore(c, -r * .55, 0, r * .18, P, t); break;
    }
    case 'arche': {
      const R = r;
      for (const [x, y] of [[.62, -.62], [.62, .62], [-.62, -.62], [-.62, .62]]) {
        c.strokeStyle = P.dark; c.lineWidth = R * .07; c.beginPath(); c.moveTo(x * R * .55, y * R * .55); c.lineTo(x * R, y * R); c.stroke();
        c.fillStyle = P.body2; circ(c, x * R, y * R, R * .3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
        c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, x * R, y * R, R * .25); c.fill();
        c.strokeStyle = 'rgba(220,230,226,.45)'; c.lineWidth = R * .03;
        for (let k = 0; k < 3; k++) { const a = t * 18 + k * TAU / 3 + x; c.beginPath(); c.moveTo(x * R, y * R); c.lineTo(x * R + Math.cos(a) * R * .25, y * R + Math.sin(a) * R * .25); c.stroke(); }
        c.fillStyle = P.plate; circ(c, x * R, y * R, R * .06); c.fill();
      }
      c.fillStyle = P.body; ngon(c, 6, R * .68, Math.PI / 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
      c.fillStyle = P.plate; ngon(c, 6, R * .52, Math.PI / 6); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; c.beginPath(); c.moveTo(Math.cos(a) * R * .22, Math.sin(a) * R * .22); c.lineTo(Math.cos(a) * R * .66, Math.sin(a) * R * .66); c.stroke(); }
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .5, -R * .18); c.lineTo(R * .7, -R * .1); c.lineTo(R * .7, R * .1); c.lineTo(R * .5, R * .18); c.closePath(); c.fill();
      c.fillStyle = P.acc; for (let k = -1; k <= 1; k++) c.fillRect(R * .6, k * R * .06 - R * .02, R * .05, R * .04);
      glowCore(c, 0, 0, R * .22, P, t);
      c.strokeStyle = P.glow + '.5)'; c.lineWidth = 3; circ(c, 0, 0, R * .3); c.stroke(); break;
    }
    case 'minion': {
      c.strokeStyle = P.body2; c.lineWidth = r * .2;
      for (let k = 0; k < 3; k++) { const a = k * TAU / 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); c.fillStyle = 'rgba(210,225,220,.15)'; circ(c, Math.cos(a) * r, Math.sin(a) * r, r * .5); c.fill(); }
      c.fillStyle = P.body; circ(c, 0, 0, r * .5); c.fill(); c.fillStyle = P.acc; circ(c, r * .25, 0, r * .18); c.fill(); break;
    }
    case 'cible': {
      c.fillStyle = '#6b5a3c'; c.fillRect(-r * .2, -r * 1.1, r * .4, r * 2.2);
      c.fillStyle = '#e8dcc4'; circ(c, 0, 0, r); c.fill(); c.fillStyle = '#c8461a'; circ(c, 0, 0, r * .7); c.fill();
      c.fillStyle = '#e8dcc4'; circ(c, 0, 0, r * .42); c.fill(); c.fillStyle = '#c8461a'; circ(c, 0, 0, r * .18); c.fill(); break;
    }
    default: paintChassisY(c, id, r, P, t, mv, u);
  }
}

// ================= ASSETS : ARMES =================
function paintMountX(c, wid, s, P, rec, t, m) {
  c.save(); c.scale(s, s); c.translate(-rec * 2.5, 0);
  const dark = '#181c1e';
  switch (wid) {
    case 'mg_mini': c.fillStyle = dark; c.fillRect(0, -.8, 6, 1.6); break;
    case 'scatter': c.fillStyle = P.body2; rr(c, -4, -4, 8, 8, 2); c.fill(); c.fillStyle = dark; c.fillRect(2, -3, 9, 6); c.fillStyle = '#5a5246'; c.fillRect(10, -3.4, 2, 6.8); break;
    case 'grenade': c.fillStyle = P.body2; circ(c, 0, 0, 4.5); c.fill(); c.fillStyle = dark; c.fillRect(1, -2.4, 9, 4.8); c.fillStyle = '#c8e07a'; c.fillRect(8.5, -1.4, 1.5, 2.8); break;
    case 'tesla': case 'storm': {
      const big = wid === 'storm';
      c.fillStyle = P.body2; circ(c, 0, 0, big ? 7 : 4.5); c.fill();
      c.strokeStyle = '#c9a26a'; c.lineWidth = big ? 2.2 : 1.4; for (let k = 0; k < (big ? 4 : 3); k++) { c.beginPath(); c.arc(0, 0, (big ? 3 : 2) + k * (big ? 1.6 : 1.1), 0, TAU); c.stroke(); }
      c.fillStyle = '#d8f2ff'; circ(c, big ? 10 : 6, 0, big ? 3 : 2); c.fill();
      c.fillStyle = dark; c.fillRect(0, -1, big ? 9 : 5, 2);
      if (Math.random() < .3) { c.strokeStyle = '#bfe8ff'; c.lineWidth = .8; c.beginPath(); c.moveTo(big ? 10 : 6, 0); c.lineTo((big ? 10 : 6) + rnd(-4, 4), rnd(-4, 4)); c.stroke(); }
      break;
    }
    case 'gatling': {
      c.fillStyle = P.body2; rr(c, -5, -5, 9, 10, 2); c.fill();
      const sp = m ? (m.spinA || 0) : t * 3; c.fillStyle = dark; c.fillRect(3, -3.5, 14, 7);
      c.fillStyle = '#3a4042'; for (let k = 0; k < 3; k++) { const y = Math.sin(sp + k * 2.1) * 2.4; c.fillRect(3, y - .6, 15, 1.2); }
      c.fillStyle = '#5a5a52'; c.fillRect(15, -3.8, 2, 7.6); break;
    }
    case 'swarm': c.fillStyle = P.body2; rr(c, -6, -7, 13, 14, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.fillStyle = dark;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { circ(c, 1 + j * 4, -4.4 + i * 4.4, 1.3); c.fill(); } break;
    case 'napalm': c.fillStyle = '#6a4a2a'; circ(c, -2, 0, 5.5); c.fill(); c.fillStyle = P.body; circ(c, -2, 0, 3.2); c.fill(); c.fillStyle = dark; c.fillRect(1, -2.2, 13, 4.4); c.fillStyle = '#ff7a30'; c.fillRect(13, -1.6, 2, 3.2); break;
    case 'plasma': c.fillStyle = P.body; circ(c, 0, 0, 6); c.fill(); c.fillStyle = dark; c.fillRect(2, -2.6, 11, 5.2);
      c.fillStyle = 'rgba(176,139,255,' + (.5 + .4 * Math.sin(t * 6)) + ')'; circ(c, 12, 0, 3); c.fill(); c.strokeStyle = '#d8c8ff'; c.lineWidth = .8; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(4 + k * 3, -2.6); c.lineTo(4 + k * 3, 2.6); c.stroke(); } break;
    case 'shield': c.fillStyle = P.body2; circ(c, 0, 0, 5); c.fill(); c.strokeStyle = '#7fc8ff'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 7 + Math.sin(t * 4), -1.3, 1.3); c.stroke(); c.fillStyle = '#bfe4ff'; circ(c, 0, 0, 2.4); c.fill(); break;
    case 'bay': c.fillStyle = P.body2; rr(c, -7, -6, 14, 12, 2); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.fillStyle = dark; rr(c, -5, -4, 10, 8, 1); c.fill(); c.fillStyle = '#6fe3c8'; c.fillRect(-4, -.6, 8 * ((Math.sin(t * 2) + 1) / 2), 1.2); break;
    case 'beam': c.fillStyle = P.body2; rr(c, -7, -6, 13, 12, 3); c.fill(); c.fillStyle = dark; c.fillRect(3, -3, 16, 6); c.fillStyle = '#5a3a2a'; c.fillRect(6, -4, 2, 8); c.fillRect(11, -4, 2, 8);
      c.fillStyle = 'rgba(255,106,58,' + (.6 + .3 * Math.sin(t * 9)) + ')'; circ(c, 19, 0, 2.6); c.fill(); break;
    case 'siege': c.fillStyle = P.body; circ(c, 0, 0, 9); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke(); c.fillStyle = dark; c.fillRect(4, -3.4, 22, 6.8); c.fillRect(23, -4.6, 5, 9.2); c.fillStyle = P.plate; circ(c, -1, 0, 4.5); c.fill(); break;
    case 'cruise': c.fillStyle = P.body2; rr(c, -9, -6, 22, 12, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#d8d0c0'; rr(c, -6, -2.5, 18, 5, 2.5); c.fill(); c.fillStyle = '#c8461a'; c.fillRect(9, -2.5, 3, 5); break;
    case 'fusion': {
      const ch = m && m.chg > 0 ? 1 - m.chg / m.w.charge : 0;
      c.fillStyle = P.body2; rr(c, -10, -9, 18, 18, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = dark; c.fillRect(4, -6, 26, 3.5); c.fillRect(4, 2.5, 26, 3.5);
      c.fillStyle = `rgba(159,246,255,${.3 + .6 * ch})`; c.fillRect(6, -2.5, 24, 5);
      if (ch > 0) { c.fillStyle = `rgba(220,255,255,${ch})`; circ(c, 30, 0, 2 + ch * 7); c.fill(); }
      break;
    }
    case 'nuke': c.fillStyle = P.body2; rr(c, -11, -9, 22, 18, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#e0b030'; for (let k = 0; k < 4; k++) c.fillRect(-11 + k * 6, -9, 3, 2.5);
      c.fillStyle = '#d8d0c0'; rr(c, -7, -3.5, 18, 7, 3.5); c.fill(); c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(4, 0, 2.2, 0, TAU); c.fill();
      c.fillStyle = '#e0b030'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(4, 0); c.arc(4, 0, 2.2, k * TAU / 3, k * TAU / 3 + .7); c.fill(); } break;
    default: c.restore(); paintMountY(c, wid, s, P, rec, t, m); return;
  }
  c.restore();
}

// ================= ASSETS : BÂTIMENTS =================
function paintBuilding(c, b, t, ghost) {
  if (BUILD[b.type].def) { paintDefense(c, b, t, ghost); return; }
  const D = BUILD[b.type], x = b.tx * TILE, y = b.ty * TILE, w = D.w * TILE, h = D.h * TILE, cx = x + w / 2, cy = y + h / 2;
  const P = PAL.ally, done = b.lvl > 0, lv = Math.max(1, b.lvl);
  c.save();
  if (!ghost) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 6, y + 8, w, h); }
  c.fillStyle = '#5d5b54'; c.fillRect(x + 2, y + 2, w - 4, h - 4);
  c.fillStyle = '#6d6a62'; c.fillRect(x + 6, y + 6, w - 12, h - 12);
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  const accent = lv >= 5 ? '#f2c14e' : lv >= 3 ? '#6fe3c8' : '#c4a77a';
  switch (b.type) {
    case 'hq': {
      c.fillStyle = '#3d4446'; ngon(c, 8, w * .42, Math.PI / 8, cx, cy); c.fill(); c.strokeStyle = '#1c2122'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#4f5a5c'; ngon(c, 8, w * .3, Math.PI / 8, cx, cy); c.fill();
      for (let k = 0; k < lv; k++) { c.strokeStyle = accent; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, w * .14 + k * 4, 0, TAU); c.stroke(); }
      c.fillStyle = '#2a3132'; circ(c, cx, cy, w * .1); c.fill();
      c.strokeStyle = '#c9c2b4'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + w * .25, cy - h * .25); c.lineTo(cx + w * .38, cy - h * .45); c.stroke();
      c.fillStyle = '#c8461a'; c.beginPath(); c.moveTo(cx + w * .38, cy - h * .45); c.lineTo(cx + w * .38 + 16 + Math.sin(t * 4) * 2, cy - h * .45 + 5); c.lineTo(cx + w * .38, cy - h * .45 + 10); c.fill();
      c.fillStyle = `rgba(111,227,200,${.5 + .5 * Math.sin(t * 3)})`; circ(c, cx, cy, 5); c.fill(); break;
    }
    case 'forge': {
      c.fillStyle = '#4a4036'; c.fillRect(x + 10, y + 10, w - 20, h - 20); c.strokeStyle = '#231d17'; c.lineWidth = 2; c.strokeRect(x + 10, y + 10, w - 20, h - 20);
      c.strokeStyle = 'rgba(0,0,0,.3)'; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x + 10, y + 10 + k * (h - 20) / 5); c.lineTo(x + w - 10, y + 10 + k * (h - 20) / 5); c.stroke(); }
      const g = c.createRadialGradient(cx, cy + 10, 2, cx, cy + 10, 30); g.addColorStop(0, `rgba(255,150,60,${.7 + .2 * Math.sin(t * 7)})`); g.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = g; circ(c, cx, cy + 10, 30); c.fill();
      const ca = Math.sin(t * .8) * .8; c.strokeStyle = '#e0b030'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 18, y + 18); c.lineTo(x + 18 + Math.cos(ca) * w * .6, y + 18 + Math.sin(ca + .6) * h * .5); c.stroke();
      c.fillStyle = '#26241f'; circ(c, x + 18, y + 18, 6); c.fill();
      if (Math.random() < .15) parts.push({ type: 'spark', x: cx + rnd(-10, 10), y: cy + 10, vx: rnd(-80, 80), vy: rnd(-120, -20), life: .3, max: .3, size: 2, col: '#ffcf7a' });
      break;
    }
    case 'lab': {
      c.fillStyle = '#3a4648'; c.fillRect(x + 8, y + 8, w - 16, h - 16);
      const g = c.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, w * .32); g.addColorStop(0, 'rgba(200,240,255,.95)'); g.addColorStop(1, 'rgba(90,150,190,.65)');
      c.fillStyle = g; circ(c, cx, cy, w * .3); c.fill(); c.strokeStyle = '#1c2526'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(28,37,38,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - w * .3, cy); c.lineTo(cx + w * .3, cy); c.moveTo(cx, cy - w * .3); c.lineTo(cx, cy + w * .3); c.stroke();
      const a = t * 1.2; c.strokeStyle = '#c9c2b4'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w - 16, y + 16); c.lineTo(x + w - 16 + Math.cos(a) * 10, y + 16 + Math.sin(a) * 10); c.stroke(); c.fillStyle = '#c9c2b4'; circ(c, x + w - 16, y + 16, 4); c.fill(); break;
    }
    case 'hangar': {
      c.fillStyle = '#3e4a44'; c.fillRect(x + 6, y + 6, w - 12, h - 18);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(x + 6 + k * (w - 12) / 8, y + 6); c.lineTo(x + 6 + k * (w - 12) / 8, y + h - 12); c.stroke(); }
      for (let k = 0; k < 3; k++) { const dx = x + 14 + k * (w - 28) / 3; c.fillStyle = '#26241f'; c.fillRect(dx, y + h - 16, (w - 28) / 3 - 8, 12); c.fillStyle = '#e0b030'; for (let j = 0; j < 4; j++) c.fillRect(dx + j * ((w - 28) / 3 - 8) / 4, y + h - 16, ((w - 28) / 3 - 8) / 8, 3); }
      c.fillStyle = P.acc; for (let k = 0; k < lv; k++) c.fillRect(x + 12 + k * 9, y + 12, 6, 6); break;
    }
    case 'pad': {
      c.fillStyle = '#2f3436'; c.fillRect(x + 6, y + 6, w - 12, h - 12);
      c.save(); c.beginPath(); c.rect(x + 6, y + 6, w - 12, h - 12); c.clip();
      for (let k = -20; k < 40; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#26241f'; c.beginPath(); c.moveTo(x + 6 + k * 10, y + 6); c.lineTo(x + 16 + k * 10, y + 6); c.lineTo(x + 6 + k * 10 - 4, y + 14); c.lineTo(x - 4 + k * 10 - 4, y + 14); c.fill(); }
      c.restore();
      c.fillStyle = '#3c4244'; c.fillRect(x + 12, y + 16, w - 24, h - 28);
      c.strokeStyle = '#f2c14e'; c.lineWidth = 3; circ(c, cx, cy + 4, w * .28); c.stroke(); circ(c, cx, cy + 4, w * .14); c.stroke();
      for (let k = 0; k < 4; k++) { const on = Math.floor(t * 2 + k) % 4 === 0; c.fillStyle = on ? '#f2c14e' : '#5a5040'; const a = k * Math.PI / 2 + Math.PI / 4; circ(c, cx + Math.cos(a) * w * .38, cy + 4 + Math.sin(a) * w * .38, 4); c.fill(); }
      const g = c.createRadialGradient(cx, cy + 4, 0, cx, cy + 4, w * .28); g.addColorStop(0, `rgba(242,193,78,${.25 + .15 * Math.sin(t * 2)})`); g.addColorStop(1, 'rgba(242,193,78,0)'); c.fillStyle = g; circ(c, cx, cy + 4, w * .28); c.fill(); break;
    }
    case 'uplink': {
      c.fillStyle = '#3a3f3b'; c.fillRect(x + 10, y + 10, w - 20, h - 20);
      c.strokeStyle = '#6a706a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, y + 10); c.lineTo(x + w - 10, y + h - 10); c.moveTo(x + w - 10, y + 10); c.lineTo(x + 10, y + h - 10); c.stroke();
      c.save(); c.translate(cx, cy); c.rotate(t * .9); c.fillStyle = '#c9c2b4'; c.beginPath(); c.ellipse(0, 0, w * .32, w * .14, 0, -Math.PI / 2, Math.PI / 2); c.fill(); c.strokeStyle = '#5a5850'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#6fe3c8'; circ(c, w * .12, 0, 3); c.fill(); c.restore(); break;
    }
    case 'scrapper': {
      c.fillStyle = '#5a4a36'; for (let k = 0; k < 9; k++) { c.fillStyle = ['#7a5a3a', '#5d5f4a', '#8a6a4a'][k % 3]; c.fillRect(x + 10 + (k * 13) % (w - 26), y + 10 + ((k * 7) % 3) * 12, 12, 8); }
      c.fillStyle = '#26241f'; c.fillRect(x + 8, y + h - 22, w - 16, 10);
      c.fillStyle = '#4a4a44'; for (let k = 0; k < 6; k++) c.fillRect(x + 8 + ((k * 12 + t * 30) % (w - 20)), y + h - 20, 6, 6);
      const ca = Math.sin(t * 1.5); c.strokeStyle = '#e0b030'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + ca * 20, cy - 18); c.stroke(); c.fillStyle = '#c9c2b4'; circ(c, cx + ca * 20, cy - 18, 5); c.fill(); break;
    }
    case 'smelter': {
      const g = c.createRadialGradient(cx, cy + 6, 1, cx, cy + 6, 22); g.addColorStop(0, `rgba(255,170,60,${.8 + .2 * Math.sin(t * 5)})`); g.addColorStop(1, 'rgba(200,70,26,0)');
      c.fillStyle = '#3a3029'; c.fillRect(x + 10, y + 14, w - 20, h - 22); c.fillStyle = g; circ(c, cx, cy + 6, 22); c.fill();
      for (const k of [-1, 1]) { c.fillStyle = '#2a2724'; c.fillRect(cx + k * 18 - 6, y + 4, 12, 22); c.fillStyle = '#444'; c.fillRect(cx + k * 18 - 7, y + 4, 14, 4); if (Math.random() < .12) parts.push({ type: 'smoke', x: cx + k * 18, y: y + 4, vx: rnd(-8, 8), vy: -rnd(20, 40), life: 1.6, max: 1.6, size: 7, col: 'rgba(90,86,80,' }); }
      break;
    }
    case 'circuitfab': {
      c.fillStyle = '#26332c'; c.fillRect(x + 10, y + 10, w - 20, h - 20);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const on = (Math.floor(t * 4) + i * 3 + j * 5) % 7 < 3; c.fillStyle = on ? '#69d07f' : '#2e4a35'; c.fillRect(x + 16 + i * (w - 32) / 4, y + 16 + j * (h - 32) / 4, 6, 6); }
      c.strokeStyle = '#69d07f'; c.globalAlpha = .4; c.lineWidth = 1; c.strokeRect(x + 12, y + 12, w - 24, h - 24); c.globalAlpha = 1; break;
    }
    case 'refinery': {
      for (const k of [-1, 1]) { const tx = cx + k * 16; c.fillStyle = '#3a3248'; circ(c, tx, cy, 14); c.fill(); c.strokeStyle = '#1e1a26'; c.lineWidth = 2; c.stroke(); c.fillStyle = `rgba(195,129,255,${.5 + .3 * Math.sin(t * 2 + k)})`; circ(c, tx, cy, 9); c.fill(); }
      c.strokeStyle = '#7a7268'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 16, cy - 14); c.lineTo(cx - 16, y + 8); c.lineTo(cx + 16, y + 8); c.lineTo(cx + 16, cy - 14); c.stroke(); break;
    }
    case 'datacenter': {
      for (let k = 0; k < 3; k++) { const rx = x + 12 + k * (w - 24) / 3; c.fillStyle = '#20262e'; c.fillRect(rx, y + 10, (w - 24) / 3 - 4, h - 20); for (let j = 0; j < 6; j++) { const on = Math.random() < .5; c.fillStyle = on ? '#7fa9ff' : '#2a3a5a'; c.fillRect(rx + 3, y + 14 + j * (h - 28) / 6, 3, 3); } }
      break;
    }
    case 'corefab': {
      c.fillStyle = '#2e2a22'; c.fillRect(x + 10, y + 10, w - 20, h - 20);
      c.save(); c.translate(cx, cy); c.rotate(t); c.strokeStyle = '#e0b030'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, w * .3, 0, TAU * .8); c.stroke(); c.rotate(-t * 2.4); c.strokeStyle = '#c9a26a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, w * .2, 0, TAU * .7); c.stroke(); c.restore();
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, w * .14); g.addColorStop(0, '#fff6d0'); g.addColorStop(1, 'rgba(255,207,74,0)'); c.fillStyle = g; circ(c, cx, cy, w * .14); c.fill(); break;
    }
    case 'repairbay': {
      c.fillStyle = '#34403d'; c.fillRect(x + 10, y + 10, w - 20, h - 20);
      c.fillStyle = '#6fe3c8'; c.fillRect(cx - 16, cy - 5, 32, 10); c.fillRect(cx - 5, cy - 16, 10, 32);
      for (const k of [-1, 1]) { const a = Math.sin(t * 2 + k) * .6; c.strokeStyle = '#c9c2b4'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + k * (w * .4), y + 14); c.lineTo(cx + k * (w * .4) - k * Math.cos(a) * 22, y + 14 + Math.sin(a + 1) * 18); c.stroke(); }
      break;
    }
    case 'range': {
      c.fillStyle = '#5a5240'; c.fillRect(x + 8, y + 8, w - 16, h - 16);
      for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#4a4334' : '#635a46'; c.fillRect(x + 8 + k * (w - 16) / 4, y + 8, (w - 16) / 4, h - 16); }
      c.fillStyle = '#e8dcc4'; circ(c, cx, cy, 10); c.fill(); c.fillStyle = '#c8461a'; circ(c, cx, cy, 6); c.fill(); c.fillStyle = '#e8dcc4'; circ(c, cx, cy, 2.5); c.fill(); break;
    }
    case 'shipyard': paintShipyard(c, b, t, ghost, x, y, w, h); break;
    case 'expedition': {
      c.fillStyle = '#2f3436'; c.fillRect(x + 8, y + 8, w - 16, h - 16);
      c.strokeStyle = 'rgba(242,193,78,.5)'; c.lineWidth = 2; c.setLineDash([7, 5]); c.strokeRect(x + 14, y + 14, w - 28, h - 28); c.setLineDash([]);
      // table de navigation : une lueur par escouade en vadrouille
      const tx = x + 16, ty = y + h - 46, tw = w * .56, th = 30, ne = ghost ? 1 : (save.exps || []).length;
      c.fillStyle = '#141b1c'; c.fillRect(tx, ty, tw, th); c.strokeStyle = '#3c4a48'; c.lineWidth = 1.5; c.strokeRect(tx, ty, tw, th);
      c.strokeStyle = 'rgba(111,227,200,.22)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(tx + k * tw / 4, ty); c.lineTo(tx + k * tw / 4, ty + th); c.stroke(); }
      for (let k = 0; k < Math.max(1, Math.min(3, b.lvl || 1)); k++) { const on = k < ne, px = tx + 12 + k * (tw - 24) / 2 + (on ? Math.sin(t * .7 + k * 2) * 7 : 0), py = ty + th / 2 + (on ? Math.sin(t * 1.3 + k) * 6 : 0); c.fillStyle = on ? `rgba(111,227,200,${.6 + .4 * Math.sin(t * 5 + k)})` : '#3a4442'; circ(c, px, py, 3.5); c.fill(); }
      // antenne parabolique qui balaie le ciel
      const ax = x + w - 32, ay = y + 32, an = Math.sin(t * .5) * 1.1 - .6;
      c.fillStyle = '#3a3f3b'; c.fillRect(ax - 9, ay - 9, 18, 18);
      c.save(); c.translate(ax, ay); c.rotate(an); c.fillStyle = '#c9c2b4'; c.beginPath(); c.ellipse(3, 0, 9, 17, 0, -Math.PI / 2, Math.PI / 2); c.fill(); c.strokeStyle = '#5a5850'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#c9c2b4'; c.beginPath(); c.moveTo(3, 0); c.lineTo(20, 0); c.stroke(); c.fillStyle = '#f2c14e'; circ(c, 20, 0, 3); c.fill(); c.restore();
      // balises de rechange prêtes au départ
      for (let k = 0; k < 2; k++) { const bx = x + w - 28 - k * 18, by = y + h - 28; c.fillStyle = '#2b2f2c'; ngon(c, 6, 7, 0, bx, by); c.fill(); c.fillStyle = `rgba(242,193,78,${.5 + .5 * Math.sin(t * 4 + k)})`; circ(c, bx, by, 2.5); c.fill(); }
      break;
    }
  }
  // niveau
  if (done) for (let k = 0; k < b.lvl; k++) { c.fillStyle = accent; c.fillRect(x + 8 + k * 8, y + h - 9, 6, 4); }
  // chantier
  if (b.busy && !ghost) {
    c.fillStyle = 'rgba(30,26,20,.45)'; c.fillRect(x + 2, y + 2, w - 4, h - 4);
    c.save(); c.beginPath(); c.rect(x + 2, y + 2, w - 4, h - 4); c.clip();
    c.strokeStyle = 'rgba(224,176,48,.7)'; c.lineWidth = 2;
    for (let k = 0; k < (w + h) / 14 + 1; k++) { c.beginPath(); c.moveTo(x + 2 + k * 14, y + 2); c.lineTo(x + 2 + k * 14 - h, y + h - 2); c.stroke(); }
    c.restore();
    const tot = (b.busy - b.start) || 1, f = clamp(1 - (b.busy - Date.now()) / tot, 0, 1);
    c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(x + 8, y - 14, w - 16, 8); c.fillStyle = '#f2c14e'; c.fillRect(x + 9, y - 13, (w - 18) * f, 6);
    if (Math.random() < .08) sparks(x + rnd(10, w - 10), y + rnd(10, h - 10), 3, '#ffd27a');
  }
  c.restore();
}

// ================= ASSETS : DÉFENSES =================
function wallAt(tx, ty) { if (tx < 0 || ty < 0 || tx >= WT || ty >= WT) return false; const id = bTileMap[ty * WT + tx]; if (!id) return false; const b = save.base.b.find(x => x.id === id); return b && b.type === 'wall'; }
function paintDefense(c, b, t, ghost) {
  const D = BUILD[b.type], x = b.tx * TILE, y = b.ty * TILE, w = D.w * TILE, h = D.h * TILE, cx = x + w / 2, cy = y + h / 2;
  const lv = Math.max(1, b.lvl), accent = lv >= 5 ? '#f2c14e' : lv >= 3 ? '#6fe3c8' : '#c4a77a';
  c.save();
  if (b.type === 'wall') {
    const col = ['#7a7468', '#8a8576', '#9a9a8c', '#8f9ea0', '#b8a868'][lv - 1];
    if (!ghost) { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 8, y + 10, 28, 28); }
    c.fillStyle = col; c.fillRect(x + 7, y + 7, 26, 26);
    if (!ghost) {
      if (wallAt(b.tx + 1, b.ty)) c.fillRect(x + 30, y + 11, 14, 18);
      if (wallAt(b.tx, b.ty + 1)) c.fillRect(x + 11, y + 30, 18, 14);
    }
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x + 7, y + 7, 26, 4);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.strokeRect(x + 7, y + 7, 26, 26);
    if (lv >= 3) { c.fillStyle = accent; c.fillRect(x + 16, y + 16, 8, 8); }
    c.restore(); return;
  }
  if (b.type === 'mine') {
    if (!ghost && b.armed === false) { c.fillStyle = 'rgba(40,36,30,.6)'; circ(c, cx, cy, 9); c.fill(); c.restore(); return; }
    c.fillStyle = '#3a3a34'; circ(c, cx, cy, 11); c.fill(); c.strokeStyle = '#1e1e1a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#5a5a4e'; circ(c, cx, cy, 6); c.fill();
    c.fillStyle = Math.floor(t * 2 + b.id) % 2 ? '#ff4d5e' : '#5a2a2a'; circ(c, cx, cy, 2.5); c.fill();
    c.restore(); return;
  }
  // socle
  if (!ghost) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 6, y + 8, w - 4, h - 4); }
  c.fillStyle = '#56544c'; c.fillRect(x + 3, y + 3, w - 6, h - 6);
  c.save(); c.beginPath(); c.rect(x + 3, y + 3, w - 6, 6); c.clip();
  for (let k = -2; k < w / 8 + 2; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#26241f'; c.beginPath(); c.moveTo(x + k * 8, y + 3); c.lineTo(x + k * 8 + 8, y + 3); c.lineTo(x + k * 8 + 2, y + 9); c.lineTo(x + k * 8 - 6, y + 9); c.fill(); }
  c.restore();
  switch (b.type) {
    case 'turret_mg': case 'turret_cannon': case 'turret_tesla': case 'turret_missile':
      c.fillStyle = '#3a4042'; ngon(c, 8, w * .38, Math.PI / 8, cx, cy + 2); c.fill(); c.strokeStyle = '#1c2122'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = accent; c.lineWidth = 2; circ(c, cx, cy + 2, w * .28); c.stroke();
      if (b.type === 'turret_tesla') { c.strokeStyle = '#c9a26a'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { circ(c, cx, cy + 2, w * .1 + k * 4); c.stroke(); } }
      if (ghost) { c.fillStyle = '#2b3337'; circ(c, cx, cy + 2, w * .2); c.fill(); c.fillStyle = '#181c1e'; c.fillRect(cx, cy, w * .35, 5); }
      break;
    case 'mortar_pit':
      c.fillStyle = '#6b5f48'; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; c.beginPath(); c.ellipse(cx + Math.cos(a) * w * .38, cy + Math.sin(a) * w * .38, 9, 6, a + Math.PI / 2, 0, TAU); c.fill(); }
      c.fillStyle = '#2e2b25'; circ(c, cx, cy, w * .3); c.fill();
      if (ghost) { c.fillStyle = '#181c1e'; circ(c, cx, cy, 12); c.fill(); }
      break;
    case 'shieldgen': {
      c.fillStyle = '#2e3a44'; ngon(c, 6, w * .36, 0, cx, cy); c.fill(); c.strokeStyle = '#1a2229'; c.lineWidth = 2; c.stroke();
      const p = .5 + .5 * Math.sin(t * 3);
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, w * .3); g.addColorStop(0, `rgba(190,228,255,${.6 + .3 * p})`); g.addColorStop(1, 'rgba(127,200,255,0)'); c.fillStyle = g; circ(c, cx, cy, w * .3); c.fill();
      c.strokeStyle = `rgba(127,200,255,${.4 + .4 * p})`; c.lineWidth = 2; circ(c, cx, cy, w * .2 + p * 4); c.stroke();
      break;
    }
  }
  if (b.lvl > 0) for (let k = 0; k < b.lvl; k++) { c.fillStyle = accent; c.fillRect(x + 6 + k * 6, y + h - 8, 4, 3); }
  if (b.busy && !ghost) {
    c.fillStyle = 'rgba(30,26,20,.45)'; c.fillRect(x + 2, y + 2, w - 4, h - 4);
    const tot = (b.busy - b.start) || 1, f = clamp(1 - (b.busy - Date.now()) / tot, 0, 1);
    c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(x + 4, y - 12, w - 8, 7); c.fillStyle = '#f2c14e'; c.fillRect(x + 5, y - 11, (w - 10) * f, 5);
  }
  c.restore();
}

// ================= ASSETS : CHÂSSIS ET ENNEMIS SUPPLÉMENTAIRES =================
PAL.archon = { body: '#2a2c48', body2: '#1b1c30', plate: '#3e4170', acc: '#9f8bff', glow: 'rgba(159,139,255,', dark: '#0e0f1c' };
const CREW_PALS = [
  { body: '#3d3550', body2: '#2a2438', plate: '#594b78', acc: '#d6a8ff', glow: 'rgba(214,168,255,', dark: '#17131f' },
  { body: '#4a3042', body2: '#311f2c', plate: '#6b4060', acc: '#ff7ad9', glow: 'rgba(255,122,217,', dark: '#1c1018' },
  { body: '#47432a', body2: '#2f2c1b', plate: '#6a6236', acc: '#ffd84a', glow: 'rgba(255,216,74,', dark: '#1a180c' },
];
function paintChassisY(c, id, r, P, t, mv, u) {
  switch (id) {
    case 'mantis': {
      for (let k = 0; k < 4; k++) { const s = k < 2 ? -1 : 1, fx = (k % 2 ? -.45 : .1) * r, ph = Math.sin(t * 18 + k * 1.9) * mv * r * .3; c.strokeStyle = P.dark; c.lineWidth = r * .12; c.beginPath(); c.moveTo(fx * .4, s * r * .2); c.lineTo(fx + ph, s * r * .75); c.lineTo(fx + ph - r * .25, s * r * 1.05); c.stroke(); }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(-r * .5, 0, r * .5, r * .3, 0, 0, TAU); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(r * .15, 0, r * .4, r * .28, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#cfd4d6'; for (const s of [-1, 1]) { c.save(); c.translate(r * .4, s * r * .25); c.rotate(s * (.4 + Math.sin(t * 6) * .15 * mv)); c.beginPath(); c.moveTo(0, 0); c.lineTo(r * .9, s * r * .1); c.lineTo(r * .3, s * r * .25); c.closePath(); c.fill(); c.restore(); }
      c.fillStyle = P.acc; c.beginPath(); c.moveTo(r * .75, 0); c.lineTo(r * .5, -r * .15); c.lineTo(r * .5, r * .15); c.closePath(); c.fill(); break;
    }
    case 'tortue': {
      for (const [x, y] of [[.5, -.75], [.5, .75], [-.5, -.75], [-.5, .75]]) { const ph = Math.sin(t * 5 + x * 3 + y) * mv * r * .1; c.fillStyle = P.dark; c.beginPath(); c.ellipse(x * r + ph, y * r, r * .22, r * .16, 0, 0, TAU); c.fill(); }
      c.fillStyle = P.dark; c.beginPath(); c.ellipse(r * .85, 0, r * .25, r * .2, 0, 0, TAU); c.fill(); c.fillStyle = P.acc; circ(c, r * .95, 0, r * .07); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .85, r * .75, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.plate; ngon(c, 6, r * .3, 0); c.fill();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = k % 2 ? P.plate : P.body2; ngon(c, 6, r * .2, 0, Math.cos(a) * r * .52, Math.sin(a) * r * .45); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke(); }
      if (u && u.fortifyOn) { c.strokeStyle = P.glow + '.6)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, r * .95, r * .85, 0, 0, TAU); c.stroke(); }
      break;
    }
    case 'echassier': {
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + .5, ph = Math.sin(t * 4 + k * 2.1) * mv * .25; const fx = Math.cos(a + ph) * r * 1.3, fy = Math.sin(a + ph) * r * 1.3; c.strokeStyle = P.dark; c.lineWidth = r * .1; c.beginPath(); c.moveTo(0, 0); c.lineTo(fx * .55 + Math.cos(a + 1.2) * r * .2, fy * .55 + Math.sin(a + 1.2) * r * .2); c.lineTo(fx, fy); c.stroke(); c.fillStyle = P.body2; circ(c, fx, fy, r * .1); c.fill(); }
      c.fillStyle = P.body; ngon(c, 3, r * .5, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; circ(c, 0, 0, r * .25); c.fill(); c.fillStyle = P.acc; circ(c, r * .3, 0, r * .07); c.fill(); break;
    }
    case 'vautour': {
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * .3, 0); c.lineTo(-r * .4, -r * 1.05); c.lineTo(-r * .65, -r * 1.0); c.lineTo(-r * .35, 0); c.lineTo(-r * .65, r * 1.0); c.lineTo(-r * .4, r * 1.05); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      for (const s of [-1, 1]) { c.fillStyle = 'rgba(210,225,220,.14)'; circ(c, -r * .45, s * r * .82, r * .32); c.fill(); c.strokeStyle = 'rgba(220,230,226,.55)'; c.lineWidth = 2; const a = t * 40 + s; c.beginPath(); c.moveTo(-r * .45 + Math.cos(a) * r * .3, s * r * .82 + Math.sin(a) * r * .3); c.lineTo(-r * .45 - Math.cos(a) * r * .3, s * r * .82 - Math.sin(a) * r * .3); c.stroke(); }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .75, r * .3, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      const f = u && u.cargoMax ? u.cargoW / u.cargoMax : .4; c.fillStyle = '#8a7650'; c.fillRect(-r * .45, -r * .16, r * .7 * f + 2, r * .32);
      c.fillStyle = P.acc; c.beginPath(); c.ellipse(r * .55, 0, r * .14, r * .12, 0, 0, TAU); c.fill(); break;
    }
    case 'scolopendre': {
      const segs = 6;
      for (let k = 0; k < segs; k++) {
        const x = r * (.75 - k * .3), w2 = r * (.42 - Math.abs(k - 2) * .03);
        for (const s of [-1, 1]) { const ph = Math.sin(t * 14 + k * 1.1 + (s > 0 ? Math.PI : 0)) * mv * r * .12; c.strokeStyle = P.dark; c.lineWidth = r * .07; c.beginPath(); c.moveTo(x, s * w2 * .7); c.lineTo(x + ph, s * (w2 + r * .32)); c.stroke(); }
      }
      for (let k = segs - 1; k >= 0; k--) {
        const x = r * (.75 - k * .3), w2 = r * (.42 - Math.abs(k - 2) * .03);
        c.fillStyle = k % 2 ? P.body2 : P.body; c.beginPath(); c.ellipse(x, 0, r * .2, w2, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
        c.fillStyle = P.plate; c.fillRect(x - r * .05, -w2 * .6, r * .1, w2 * 1.2);
      }
      c.fillStyle = P.acc; circ(c, r * .9, -r * .1, r * .05); c.fill(); circ(c, r * .9, r * .1, r * .05); c.fill(); break;
    }
    case 'hive': {
      const p = .5 + .5 * Math.sin(t * 2);
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + .3, len = r * (.9 + (k % 3) * .2), w = r * .16, nx = -Math.sin(a) * w, ny = Math.cos(a) * w, bx = Math.cos(a) * r * .3, by = Math.sin(a) * r * .3, tx = Math.cos(a) * len, ty = Math.sin(a) * len;
        c.fillStyle = k % 2 ? '#7a3fb5' : '#9b5cdd'; c.beginPath(); c.moveTo(bx + nx, by + ny); c.lineTo(tx, ty); c.lineTo(bx - nx, by - ny); c.closePath(); c.fill(); c.strokeStyle = '#e6ccff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke(); }
      c.fillStyle = P.body; ngon(c, 6, r * .5, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 4; c.stroke();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = P.dark; ngon(c, 6, r * .1, 0, Math.cos(a) * r * .28, Math.sin(a) * r * .28); c.fill(); }
      glowCore(c, 0, 0, r * .25 + p * 6, P, t); break;
    }
    default: paintChassisZ(c, id, r, P, t, mv, u);
  }
}
function paintMountY(c, wid, s, P, rec, t, m) {
  c.save(); c.scale(s, s); c.translate(-rec * 2.5, 0);
  const dark = '#181c1e';
  switch (wid) {
    case 'needler': c.fillStyle = P.body2; circ(c, 0, 0, 4); c.fill(); c.fillStyle = dark; c.fillRect(1, -.8, 13, 1.6); c.fillStyle = '#c8f0ff'; c.fillRect(10, -1.2, 3, 2.4); break;
    case 'emp': case 'e_frost': c.fillStyle = P.body2; circ(c, 0, 0, 4.5); c.fill(); c.strokeStyle = wid === 'emp' ? '#8fd0ff' : '#bfe8ff'; c.lineWidth = 1.3; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(4, 0, 2 + k * 2, -.9, .9); c.stroke(); } break;
    case 'cluster': c.fillStyle = P.body2; rr(c, -6, -6, 12, 12, 2); c.fill(); c.fillStyle = dark; c.fillRect(2, -3.5, 10, 7); c.fillStyle = '#ffd27a'; for (let k = -1; k <= 1; k++) { circ(c, 11, k * 2.2, 1); c.fill(); } break;
    case 'gravity': { c.fillStyle = P.body2; circ(c, 0, 0, 9); c.fill(); c.fillStyle = dark; c.fillRect(3, -4, 20, 8); const a = t * 5; c.strokeStyle = '#b9a0ff'; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(20, 0, 2 + k * 2.2 + Math.sin(a + k) * .6, 0, TAU); c.stroke(); } break; }
    case 'orbital': c.fillStyle = P.body2; rr(c, -11, -11, 22, 22, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke(); c.save(); c.rotate(t * .8); c.strokeStyle = '#ffe6a8'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 9, 3.5, 0, 0, TAU); c.stroke(); c.restore(); c.fillStyle = '#ffe6a8'; circ(c, 0, 0, 3); c.fill(); break;
    case 'flak': c.fillStyle = P.body; circ(c, 0, 0, 7); c.fill(); c.fillStyle = dark; c.fillRect(2, -4.5, 14, 2.6); c.fillRect(2, 1.9, 14, 2.6); break;
    case 'e_acid': c.fillStyle = '#4a5a2a'; circ(c, 0, 0, 4); c.fill(); c.fillStyle = '#9fe06a'; c.fillRect(2, -1.5, 7, 3); break;
    case 'e_ram': c.fillStyle = '#c9c2b4'; c.beginPath(); c.moveTo(0, -6); c.lineTo(10, 0); c.lineTo(0, 6); c.closePath(); c.fill(); break;
    default: c.restore(); paintMountZ(c, wid, s, P, rec, t, m); return;
  }
  c.restore();
}

// ================= ASSETS : GÉANTS ET ARMES DÉMESURÉES =================
// trappe de fabrication : s'ouvre à la fin de chaque cycle
const fabDoor = u => u && u.fabP !== undefined ? clamp((u.fabP - .82) / .18, 0, 1) : 0;
function paintChassisZ(c, id, r, P, t, mv, u) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  const R = r, lw = Math.max(1.5, r * .01);
  switch (id) {
    case 'grillon': {
      const ph = Math.sin(t * 14) * mv;
      c.strokeStyle = P.dark;
      for (const s of [-1, 1]) {
        c.lineWidth = r * .16; c.beginPath(); c.moveTo(r * .3, s * r * .3); c.lineTo(r * .78 + ph * r * .2, s * r * .78); c.stroke();
        c.lineWidth = r * .22; c.beginPath(); c.moveTo(-r * .1, s * r * .35); c.lineTo(-r * .9 - ph * r * .2, s * r * .95); c.lineTo(-r * 1.25, s * r * .42); c.stroke();
      }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .85, r * .52, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .15, 0, r * .5, r * .32, 0, 0, TAU); c.fill();
      c.fillStyle = P.acc; circ(c, r * .6, -r * .18, r * .12); c.fill(); circ(c, r * .6, r * .18, r * .12); c.fill();
      c.strokeStyle = P.plate; c.lineWidth = 1; c.beginPath(); c.moveTo(r * .7, -r * .1); c.lineTo(r * 1.4, -r * .5 + ph * 2); c.moveTo(r * .7, r * .1); c.lineTo(r * 1.4, r * .5 - ph * 2); c.stroke(); break;
    }
    case 'herisson': {
      treads(c, -r * .7, -r * .92, r * 1.4, r * .3, P, t, r * 1.2); treads(c, -r * .7, r * .62, r * 1.4, r * .3, P, t, r * 1.2);
      c.fillStyle = '#c9c2b4';
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, b = r * .62, e = r * (1.02 + (k % 2) * .14); c.beginPath(); c.moveTo(Math.cos(a - .13) * b, Math.sin(a - .13) * b); c.lineTo(Math.cos(a) * e, Math.sin(a) * e); c.lineTo(Math.cos(a + .13) * b, Math.sin(a + .13) * b); c.closePath(); c.fill(); }
      c.fillStyle = P.body; circ(c, 0, 0, r * .68); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = P.plate; circ(c, 0, 0, r * .42); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * .42, Math.sin(a) * r * .42); c.lineTo(Math.cos(a) * r * .66, Math.sin(a) * r * .66); c.stroke(); }
      c.fillStyle = P.acc; circ(c, r * .5, 0, r * .1); c.fill(); break;
    }
    case 'scarabee': {
      const fl = Math.sin(t * 60) * .5 + .5;
      c.fillStyle = `rgba(210,225,220,${.1 + fl * .08})`; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(-r * .15, s * r * .62, r * .75, r * .28, s * .35, 0, TAU); c.fill(); }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(r * .5, 0, r * .3, r * .26, 0, 0, TAU); c.fill();
      for (const s of [-1, 1]) {
        c.fillStyle = P.body; c.beginPath(); c.moveTo(r * .35, 0); c.quadraticCurveTo(r * .3, s * r * .62, -r * .25, s * r * .56); c.quadraticCurveTo(-r * .82, s * r * .4, -r * .74, s * r * .04); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
        c.fillStyle = P.plate; c.beginPath(); c.ellipse(-r * .12, s * r * .3, r * .32, r * .1, s * .15, 0, TAU); c.fill();
      }
      c.strokeStyle = P.dark; c.lineWidth = 2; c.beginPath(); c.moveTo(r * .72, -r * .08); c.lineTo(r * 1, -r * .24); c.moveTo(r * .72, r * .08); c.lineTo(r * 1, r * .24); c.stroke();
      glowCore(c, r * .52, 0, r * .14, P, t); break;
    }
    case 'hydre': {
      for (const s of [-1, 1]) { const ph = Math.sin(t * 4 + s) * mv; for (let k = 0; k < 2; k++) { const bx = -r * .15 - k * r * .35; c.strokeStyle = P.dark; c.lineWidth = r * .13; c.beginPath(); c.moveTo(bx, s * r * .3); c.lineTo(bx + ph * r * .15, s * r * .7); c.stroke(); c.fillStyle = P.body2; circ(c, bx + ph * r * .15, s * r * .72, r * .1); c.fill(); } }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(-r * .25, 0, r * .55, r * .48, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.plate; for (let k = 0; k < 3; k++) { rr(c, -r * .62 + k * r * .25, -r * .3, r * .18, r * .6, r * .05); c.fill(); }
      MOUNTS.hydre.forEach(([mx, my], i) => {
        const w = Math.sin(t * 3 + i * 1.3) * r * .05 * (1 + mv);
        c.strokeStyle = P.body2; c.lineWidth = r * .16; c.beginPath(); c.moveTo(r * .15, my * r * .35); c.quadraticCurveTo(r * .45, my * r * .7 + w, mx * r, my * r); c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = r * .05; c.stroke();
        c.fillStyle = P.body; circ(c, mx * r, my * r, r * .15); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      });
      glowCore(c, -r * .25, 0, r * .2, P, t); break;
    }
    case 'wyverne': {
      const fl = Math.sin(t * 5) * .12;
      for (const s of [-1, 1]) {
        c.fillStyle = P.body2; c.beginPath(); c.moveTo(r * .25, s * r * .12); c.lineTo(r * .1, s * r * (1.05 + fl)); c.lineTo(-r * .25, s * r * (.8 + fl)); c.lineTo(-r * .45, s * r * (1 + fl)); c.lineTo(-r * .6, s * r * .6); c.lineTo(-r * .35, s * r * .12); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = r * .03; c.beginPath(); c.moveTo(r * .15, s * r * .15); c.lineTo(r * .1, s * r * (1 + fl)); c.moveTo(0, s * r * .15); c.lineTo(-r * .25, s * r * (.78 + fl)); c.moveTo(-r * .2, s * r * .15); c.lineTo(-r * .45, s * r * (.95 + fl)); c.stroke();
        c.fillStyle = P.dark; rr(c, -r * .2, s * r * .45 - r * .07, r * .35, r * .14, r * .05); c.fill(); c.fillStyle = P.glow + '.7)'; circ(c, -r * .22, s * r * .45, r * .05); c.fill();
      }
      c.strokeStyle = P.body2; c.lineWidth = r * .12; c.beginPath(); c.moveTo(-r * .4, 0); c.quadraticCurveTo(-r * .8, Math.sin(t * 3) * r * .15, -r * 1.1, 0); c.stroke();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, r * .55, r * .22, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 3; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); c.moveTo(r * .62, 0); c.lineTo(r * .32, -r * .14); c.lineTo(r * .32, r * .14); c.closePath(); c.fill();
      glowCore(c, -r * .05, 0, r * .15, P, t); break;
    }
    case 'mammouth': {
      for (const s of [-1, 1]) treads(c, -R * .78, s * R * .62 - R * .18, R * 1.56, R * .36, P, t, R * .8);
      c.fillStyle = P.body2; rr(c, -R * .82, -R * .6, R * 1.6, R * 1.2, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
      const cols = ['#5a4a32', '#4a5560', '#5c3d34', '#3f5a48'];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const x = -R * .7 + i * R * .36, y = -R * .46 + j * R * .48;
        c.fillStyle = cols[(i + j * 2) % 4]; rr(c, x, y, R * .32, R * .42, R * .03); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw; c.stroke();
        c.beginPath(); for (let k = 1; k < 4; k++) { c.moveTo(x + k * R * .08, y); c.lineTo(x + k * R * .08, y + R * .42); } c.stroke();
      }
      c.fillStyle = P.body; rr(c, R * .38, -R * .4, R * .42, R * .8, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.plate; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(R * .75, s * R * .22); c.quadraticCurveTo(R * 1.15, s * R * .36, R * 1.08, s * R * .05); c.lineTo(R * .95, s * R * .12); c.closePath(); c.fill(); }
      c.fillStyle = P.acc; for (let k = -2; k <= 2; k++) c.fillRect(R * .72, k * R * .08 - R * .025, R * .05, R * .05);
      glowCore(c, R * .55, 0, R * .14, P, t); break;
    }
    case 'rempart': {
      for (const s of [-1, 1]) for (const tx of [-.62, -.05, .48]) treads(c, tx * R - R * .26, s * R * .82 - R * .12, R * .52, R * .24, P, t, R * .5);
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .95, -R * .4); c.lineTo(R * .95, R * .4); c.lineTo(R * .72, R * .72); c.lineTo(-R * .82, R * .72); c.lineTo(-R * .92, R * .5); c.lineTo(-R * .92, -R * .5); c.lineTo(-R * .82, -R * .72); c.lineTo(R * .72, -R * .72); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.plate; for (let k = 0; k < 12; k++) { const x = -R * .8 + k * R * .135; c.fillRect(x, -R * .72, R * .08, R * .07); c.fillRect(x, R * .65, R * .08, R * .07); }
      c.fillStyle = P.dark; c.beginPath(); c.moveTo(R * .95, -R * .45); c.lineTo(R * 1.06, 0); c.lineTo(R * .95, R * .45); c.closePath(); c.fill();
      c.save(); c.beginPath(); c.moveTo(R * .95, -R * .42); c.lineTo(R * 1.04, 0); c.lineTo(R * .95, R * .42); c.closePath(); c.clip(); for (let k = -6; k < 6; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.fillRect(R * .94, k * R * .08, R * .12, R * .04); } c.restore();
      c.fillStyle = P.body; rr(c, -R * .74, -R * .56, R * 1.52, R * 1.12, R * .08); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (let k = 1; k < 6; k++) { c.moveTo(-R * .74 + k * R * .25, -R * .56); c.lineTo(-R * .74 + k * R * .25, R * .56); } c.stroke();
      c.fillStyle = P.plate; ngon(c, 8, R * .3, Math.PI / 8); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.body2; ngon(c, 8, R * .2, Math.PI / 8); c.fill();
      c.strokeStyle = P.acc; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(R * .18, -R * .32); c.stroke(); c.fillStyle = P.acc; circ(c, R * .18, -R * .32, R * .02 + Math.sin(t * 5) * R * .005); c.fill();
      c.fillStyle = P.dark; for (const s of [-1, 1]) { circ(c, -R * .8, s * R * .3, R * .06); c.fill(); }
      glowCore(c, 0, 0, R * .13, P, t); break;
    }
    case 'arachne': {
      for (let k = 0; k < 8; k++) {
        const s = k < 4 ? -1 : 1, i = k % 4, ph = Math.sin(t * 4 + i * 1.7 + (s > 0 ? Math.PI : 0)) * mv;
        const hx = R * .2 - i * R * .12, hy = s * R * .2;
        const kx = hx + (1.5 - i) * R * .34 + ph * R * .12, ky = s * R * .95;
        const fx = hx + (1.5 - i) * R * .66 + ph * R * .22, fy = s * R * 1.42;
        c.strokeStyle = P.dark; c.lineWidth = R * .07; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
        c.strokeStyle = P.plate; c.lineWidth = R * .025; c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.stroke();
        c.fillStyle = P.body2; circ(c, kx, ky, R * .05); c.fill(); c.fillStyle = P.acc; circ(c, fx, fy, R * .025); c.fill();
      }
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .45, 0, R * .5, R * .42, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.lineWidth = lw * 1.4; for (let k = 1; k < 4; k++) { c.strokeStyle = k % 2 ? 'rgba(0,0,0,.25)' : P.plate; c.beginPath(); c.ellipse(-R * .45, 0, R * (.42 - k * .09), R * (.34 - k * .07), 0, 0, TAU); c.stroke(); }
      c.fillStyle = P.acc; c.beginPath(); c.moveTo(-R * .6, 0); c.lineTo(-R * .45, -R * .1); c.lineTo(-R * .3, 0); c.lineTo(-R * .45, R * .1); c.closePath(); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .2, 0, R * .48, R * .36, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.acc; for (const [x, y] of [[.6, -.08], [.6, .08], [.55, -.18], [.55, .18], [.64, 0]]) { circ(c, x * R, y * R, R * .025); c.fill(); }
      glowCore(c, R * .15, 0, R * .14, P, t); break;
    }
    case 'portenef': {
      for (const [x, y] of [[.5, -.72], [.5, .72], [-.45, -.72], [-.45, .72]]) {
        c.strokeStyle = P.dark; c.lineWidth = R * .05; c.beginPath(); c.moveTo(x * R * .6, y * R * .5); c.lineTo(x * R, y * R); c.stroke();
        c.fillStyle = P.body2; circ(c, x * R, y * R, R * .26); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.8; c.stroke();
        c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, x * R, y * R, R * .22); c.fill();
        c.strokeStyle = 'rgba(220,230,226,.4)'; c.lineWidth = R * .025; c.beginPath(); for (let k = 0; k < 3; k++) { const a = t * 16 + k * TAU / 3 + x * 3; c.moveTo(x * R, y * R); c.lineTo(x * R + Math.cos(a) * R * .22, y * R + Math.sin(a) * R * .22); } c.stroke();
      }
      c.fillStyle = P.body; c.beginPath(); c.moveTo(R * .9, 0); c.lineTo(R * .6, -R * .38); c.lineTo(-R * .85, -R * .38); c.lineTo(-R * .95, -R * .2); c.lineTo(-R * .95, R * .2); c.lineTo(-R * .85, R * .38); c.lineTo(R * .6, R * .38); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.body2; rr(c, -R * .7, -R * .14, R * 1.3, R * .28, R * .03); c.fill();
      c.strokeStyle = 'rgba(232,220,196,.5)'; c.lineWidth = lw * 1.2; c.setLineDash([R * .07, R * .05]); c.beginPath(); c.moveTo(-R * .68, 0); c.lineTo(R * .58, 0); c.stroke(); c.setLineDash([]);
      const op = fabDoor(u); c.fillStyle = P.dark; c.fillRect(-R * .95, -R * .16, R * .08, R * .32); c.fillStyle = P.glow + (.3 + op * .6) + ')'; c.fillRect(-R * .95, -R * .16 * op, R * .05, R * .32 * op);
      c.fillStyle = P.plate; rr(c, R * .05, R * .18, R * .32, R * .16, R * .03); c.fill(); c.fillStyle = P.acc; for (let k = 0; k < 4; k++) c.fillRect(R * .09 + k * R * .07, R * .22, R * .03, R * .03);
      glowCore(c, -R * .2, 0, R * .12, P, t); break;
    }
    case 'cyclope': {
      for (const s of [-1, 1]) {
        const ph = Math.sin(t * 2.6 + (s > 0 ? Math.PI : 0)) * mv, fx = ph * R * .4, fy = s * R * .46;
        c.strokeStyle = P.dark; c.lineWidth = R * .2; c.beginPath(); c.moveTo(0, s * R * .3); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = P.body2; rr(c, fx - R * .3, fy - R * .16, R * .62, R * .32, R * .06); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
        c.fillStyle = P.dark; for (let k = -1; k <= 1; k++) c.fillRect(fx + R * .3, fy + k * R * .1 - R * .03, R * .1, R * .06);
      }
      for (const s of [-1, 1]) { c.fillStyle = P.plate; rr(c, -R * .42, s * R * .78 - R * .2, R * .78, R * .4, R * .1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) c.fillRect(-R * .36 + k * R * .18, s * R * .78 - R * .16, R * .06, R * .32); }
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, R * .5, R * .62, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(-R * .08, 0, R * .34, R * .44, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 1.2; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(-R * .4, k * R * .14); c.lineTo(-R * .15, k * R * .14); } c.stroke();
      const ey = R * .36; c.fillStyle = P.dark; circ(c, ey, 0, R * .17); c.fill();
      const g = c.createRadialGradient(ey, 0, 0, ey, 0, R * .15); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, P.glow + '.95)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; circ(c, ey, 0, R * .15); c.fill();
      c.strokeStyle = P.plate; c.lineWidth = lw * 2; circ(c, ey, 0, R * .17); c.stroke();
      glowCore(c, -R * .1, 0, R * .12, P, t); break;
    }
    case 'forgemere': {
      for (const s of [-1, 1]) for (const tx of [-.66, -.22, .22, .62]) treads(c, tx * R - R * .2, s * R * .84 - R * .1, R * .4, R * .2, P, t, R * .4);
      c.fillStyle = P.body2; rr(c, -R * .9, -R * .74, R * 1.82, R * 1.48, R * .08); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
      for (let i = 0; i < 5; i++) { const x = -R * .42 + i * R * .22; c.fillStyle = P.body; c.fillRect(x, -R * .62, R * .2, R * .72); c.fillStyle = 'rgba(160,210,220,.35)'; c.fillRect(x + R * .15, -R * .6, R * .04, R * .68); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw; c.strokeRect(x, -R * .62, R * .2, R * .72); }
      for (const [x, y] of [[-.3, .3], [-.12, .42], [.06, .3]]) { c.fillStyle = P.dark; circ(c, x * R, y * R, R * .07); c.fill(); c.fillStyle = 'rgba(255,140,60,' + (.4 + .3 * Math.sin(t * 6 + x * 10)).toFixed(2) + ')'; circ(c, x * R, y * R, R * .035); c.fill(); }
      c.fillStyle = P.dark; c.fillRect(-R * .9, -R * .5, R * .4, R * 1);
      c.strokeStyle = 'rgba(232,220,196,.25)'; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 8; k++) { const x = -R * .88 + ((k * R * .05 + t * R * .05) % (R * .38)); c.moveTo(x, -R * .48); c.lineTo(x, R * .48); } c.stroke();
      c.fillStyle = P.glow + (.25 + fabDoor(u) * .6) + ')'; c.fillRect(-R * .9, -R * .5, R * .05, R);
      c.strokeStyle = '#e0b030'; c.lineWidth = lw * 3; c.beginPath(); c.moveTo(-R * .85, -R * .56); c.lineTo(-R * .85, R * .56); c.moveTo(-R * .55, -R * .56); c.lineTo(-R * .55, R * .56); c.stroke();
      c.fillStyle = '#e0b030'; c.fillRect(-R * .88, Math.sin(t * .8) * R * .4 - R * .04, R * .36, R * .08);
      c.fillStyle = P.plate; rr(c, R * .52, -R * .42, R * .34, R * .84, R * .06); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      c.fillStyle = P.acc; for (let k = -3; k <= 3; k++) c.fillRect(R * .8, k * R * .1 - R * .02, R * .04, R * .04);
      glowCore(c, R * .68, 0, R * .1, P, t); break;
    }
    case 'aeropole': {
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU + Math.PI / 6, x = Math.cos(a) * R * .86, y = Math.sin(a) * R * .86;
        c.strokeStyle = P.dark; c.lineWidth = R * .04; c.beginPath(); c.moveTo(Math.cos(a) * R * .6, Math.sin(a) * R * .6); c.lineTo(x, y); c.stroke();
        c.fillStyle = P.body2; circ(c, x, y, R * .16); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
        c.fillStyle = 'rgba(210,225,220,.12)'; circ(c, x, y, R * .13); c.fill();
        c.strokeStyle = 'rgba(220,230,226,.4)'; c.lineWidth = R * .015; c.beginPath(); for (let j = 0; j < 3; j++) { const b = t * 14 + j * TAU / 3 + k; c.moveTo(x, y); c.lineTo(x + Math.cos(b) * R * .13, y + Math.sin(b) * R * .13); } c.stroke();
      }
      c.fillStyle = P.body; circ(c, 0, 0, R * .72); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2.5; c.stroke();
      c.fillStyle = P.body2; circ(c, 0, 0, R * .6); c.fill();
      for (let k = 0; k < 18; k++) {
        const a = k / 18 * TAU, d = R * (.38 + (k % 3) * .07), s = R * (.06 + (k * 7 % 5) * .012);
        c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(a); c.fillStyle = k % 4 ? P.plate : '#5a5850'; c.fillRect(-s, -s * .7, s * 2, s * 1.4);
        if ((k * 13) % 3 === 0) { c.fillStyle = 'rgba(255,220,150,.4)'; c.fillRect(-s * .6, -s * .3, s * .4, s * .3); } c.restore();
      }
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.moveTo(Math.cos(a) * R * .25, Math.sin(a) * R * .25); c.lineTo(Math.cos(a) * R * .6, Math.sin(a) * R * .6); } c.stroke();
      c.fillStyle = P.plate; ngon(c, 6, R * .22, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      glowCore(c, 0, 0, R * .14, P, t);
      c.fillStyle = P.acc; c.beginPath(); c.moveTo(R * .74, 0); c.lineTo(R * .64, -R * .06); c.lineTo(R * .64, R * .06); c.closePath(); c.fill(); break;
    }
    case 'villemachine': {
      const l2 = Math.max(2, R * .006);
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) treads(c, -R * .82 + k * R * .34, s * R * .86 - R * .1, R * .3, R * .2, P, t, R * .25);
      const hull = k => { c.beginPath(); c.moveTo(R * .98 * k, -R * .5 * k); c.lineTo(R * .98 * k, R * .5 * k); c.lineTo(R * .8 * k, R * .78 * k); c.lineTo(-R * .88 * k, R * .78 * k); c.lineTo(-R * .98 * k, R * .6 * k); c.lineTo(-R * .98 * k, -R * .6 * k); c.lineTo(-R * .88 * k, -R * .78 * k); c.lineTo(R * .8 * k, -R * .78 * k); c.closePath(); };
      c.fillStyle = P.body2; hull(1); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 4; c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = R * .03; hull(.92); c.stroke();
      c.fillStyle = P.dark; c.beginPath(); c.moveTo(R * .98, -R * .55); c.lineTo(R * 1.08, 0); c.lineTo(R * .98, R * .55); c.closePath(); c.fill();
      c.save(); c.beginPath(); c.moveTo(R * .98, -R * .52); c.lineTo(R * 1.06, 0); c.lineTo(R * .98, R * .52); c.closePath(); c.clip(); for (let k = -8; k < 8; k++) { c.fillStyle = k % 2 ? '#e0b030' : '#1e1c18'; c.fillRect(R * .97, k * R * .07, R * .12, R * .035); } c.restore();
      const cell = R * .17;
      for (let i = -2; i <= 4; i++) for (let j = -3; j <= 3; j++) {
        const x = i * cell, y = j * cell; if (Math.abs(x) > R * .82 || Math.abs(y) > R * .6) continue;
        const h = hash2(i + 9, j + 9, 41), w = cell * (.55 + h * .3), hh = cell * (.55 + hash2(j + 9, i + 9, 43) * .3);
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - w / 2 + cell * .08, y - hh / 2 + cell * .08, w, hh);
        c.fillStyle = h > .8 ? P.plate : h > .45 ? P.body : '#4d4b44'; c.fillRect(x - w / 2, y - hh / 2, w, hh);
        c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = l2; c.strokeRect(x - w / 2, y - hh / 2, w, hh);
        if (h > .3) { c.fillStyle = `rgba(255,214,140,${((i * 3 + j) & 1) ? (.3 + .2 * Math.sin(t * .5 + i)).toFixed(2) : '.12'})`; for (let k = 0; k < 3; k++) c.fillRect(x - w * .35 + k * w * .28, y - hh * .1, w * .12, hh * .12); }
        if (h > .9) { c.fillStyle = P.dark; circ(c, x, y, w * .22); c.fill(); c.fillStyle = P.acc; circ(c, x, y, w * .06 + Math.sin(t * 4 + j) * w * .02); c.fill(); }
      }
      c.fillStyle = P.dark; c.fillRect(-R * .86, -R * .58, R * .36, R * 1.16);
      for (let k = 0; k < 4; k++) { c.fillStyle = '#3a3c3a'; c.fillRect(-R * .84, -R * .54 + k * R * .28, R * .32, R * .22); c.fillStyle = 'rgba(160,210,220,.25)'; c.fillRect(-R * .82, -R * .52 + k * R * .28, R * .04, R * .18); }
      for (const y of [-.4, 0, .4]) { c.fillStyle = '#1a1a18'; circ(c, -R * .66, y * R, R * .05); c.fill(); c.fillStyle = `rgba(255,140,60,${(.4 + .3 * Math.sin(t * 5 + y * 7)).toFixed(2)})`; circ(c, -R * .66, y * R, R * .025); c.fill(); }
      c.fillStyle = P.glow + (.25 + fabDoor(u) * .6) + ')'; c.fillRect(-R * .98, -R * .3, R * .04, R * .6);
      c.strokeStyle = 'rgba(232,220,196,.12)'; c.lineWidth = R * .012; c.beginPath(); c.moveTo(-R * .46, 0); c.lineTo(R * .88, 0); c.moveTo(R * .2, -R * .66); c.lineTo(R * .2, R * .66); c.stroke();
      c.fillStyle = P.plate; ngon(c, 8, R * .14, Math.PI / 8, R * .2, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 3; c.stroke();
      glowCore(c, R * .2, 0, R * .1, P, t); break;
    }
    case 'astre': {
      const l2 = Math.max(2, R * .006);
      c.strokeStyle = P.dark; c.lineWidth = R * .06; circ(c, 0, 0, R * .9); c.stroke();
      c.strokeStyle = P.plate; c.lineWidth = R * .015; circ(c, 0, 0, R * .9); c.stroke();
      c.save(); c.rotate(t * .05); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; c.fillStyle = k % 3 ? P.body2 : P.acc; c.fillRect(Math.cos(a) * R * .9 - R * .02, Math.sin(a) * R * .9 - R * .02, R * .04, R * .04); } c.restore();
      c.fillStyle = P.body2; c.beginPath(); c.ellipse(0, 0, R * .84, R * .66, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 4; c.stroke();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(R * .05, 0, R * .72, R * .54, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = l2 * 1.5; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.moveTo(Math.cos(a) * R * .25, Math.sin(a) * R * .2); c.lineTo(Math.cos(a) * R * .72, Math.sin(a) * R * .54); } c.stroke();
      for (const k of [.55, .78]) { c.beginPath(); c.ellipse(R * .05, 0, R * .72 * k, R * .54 * k, 0, 0, TAU); c.stroke(); }
      const op = u && u.fabP !== undefined ? u.fabP : 0;
      for (const s of [-1, 1]) { c.fillStyle = P.dark; rr(c, -R * .4, s * R * .5 - R * .06, R * .5, R * .12, R * .03); c.fill(); c.fillStyle = P.glow + (.2 + fabDoor(u) * .6) + ')'; c.fillRect(-R * .38, s * R * .5 - R * .03, R * .46 * Math.max(.1, op), R * .06); }
      for (let k = -2; k <= 2; k++) { c.fillStyle = P.dark; circ(c, -R * .78, k * R * .13, R * .07); c.fill(); const g = c.createRadialGradient(-R * .82, k * R * .13, 0, -R * .82, k * R * .13, R * .12); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, P.glow + '.8)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; circ(c, -R * .84, k * R * .13, R * .12); c.fill(); }
      c.fillStyle = P.plate; circ(c, R * .22, 0, R * .18); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 3; c.stroke();
      c.fillStyle = 'rgba(160,210,220,.3)'; circ(c, R * .22, 0, R * .12); c.fill();
      glowCore(c, R * .22, 0, R * .09, P, t);
      c.fillStyle = P.acc; for (let k = -3; k <= 3; k++) c.fillRect(R * .74, k * R * .06 - R * .015, R * .04, R * .03); break;
    }
    // ---- géants ennemis
    case 'x_devoreur': {
      for (const s of [-1, 1]) for (const tx of [-.5, .2]) treads(c, tx * R - R * .32, s * R * .78 - R * .14, R * .64, R * .28, P, t, R * .6);
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .6, -R * .7); c.lineTo(R * .6, R * .7); c.lineTo(-R * .7, R * .62); c.lineTo(-R * .9, 0); c.lineTo(-R * .7, -R * .62); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke();
      for (const s of [-1, 1]) {
        const y0 = s * R * .33 - R * .3; c.fillStyle = '#2a2624'; rr(c, R * .55, y0, R * .36, R * .6, R * .08); c.fill();
        c.save(); rr(c, R * .55, y0, R * .36, R * .6, R * .08); c.clip(); c.fillStyle = '#c9c2b4';
        for (let k = 0; k < 8; k++) { const y = y0 + ((k * R * .085 + t * R * .3 * s) % (R * .6) + R * .6) % (R * .6); c.beginPath(); c.moveTo(R * .55, y); c.lineTo(R * .95, y + R * .03); c.lineTo(R * .55, y + R * .05); c.fill(); }
        c.restore();
      }
      c.fillStyle = 'rgba(255,90,40,' + (.35 + .25 * Math.sin(t * 7)).toFixed(2) + ')'; c.fillRect(R * .58, -R * .03, R * .3, R * .06);
      c.fillStyle = P.body; c.beginPath(); c.ellipse(-R * .1, 0, R * .55, R * .45, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 1.5; c.stroke();
      c.fillStyle = '#c9c2b4'; for (let k = 0; k < 9; k++) { const x = -R * .55 + k * R * .11, sg = k % 2 ? -1 : 1, y = sg * R * .15; c.beginPath(); c.moveTo(x - R * .04, y); c.lineTo(x, y + sg * R * .2); c.lineTo(x + R * .04, y); c.fill(); }
      glowCore(c, -R * .1, 0, R * .16, P, t); break;
    }
    case 'x_forge': {
      for (const s of [-1, 1]) treads(c, -R * .8, s * R * .8 - R * .14, R * 1.6, R * .28, P, t, R * .5);
      c.fillStyle = '#1e1a1a'; rr(c, -R * .88, -R * .7, R * 1.76, R * 1.4, R * .08); c.fill(); c.strokeStyle = P.acc; c.lineWidth = lw; c.stroke();
      for (let i = 0; i < 4; i++) { c.fillStyle = P.body2; c.fillRect(-R * .5 + i * R * .3, -R * .6, R * .26, R * 1.2); c.fillStyle = 'rgba(255,70,50,.25)'; c.fillRect(-R * .5 + i * R * .3 + R * .2, -R * .58, R * .04, R * 1.16); }
      for (const [x, y] of [[-.6, -.35], [-.6, .35], [.1, -.4], [.1, .4], [.45, 0]]) { c.fillStyle = '#121010'; circ(c, x * R, y * R, R * .1); c.fill(); c.fillStyle = `rgba(255,${(80 + 40 * Math.sin(t * 6 + x * 9)) | 0},40,.7)`; circ(c, x * R, y * R, R * .05); c.fill(); }
      c.fillStyle = 'rgba(255,60,40,' + (.3 + .3 * Math.sin(t * 2)).toFixed(2) + ')'; c.fillRect(-R * .9, -R * .25, R * .05, R * .5);
      c.fillStyle = P.plate; rr(c, R * .55, -R * .3, R * .3, R * .6, R * .05); c.fill(); glowCore(c, R * .7, 0, R * .12, P, t); break;
    }
    case 'x_leviathan': {
      const sw = Math.sin(t * 1.2) * .06;
      for (const s of [-1, 1]) { c.fillStyle = P.body2; c.beginPath(); c.moveTo(R * .1, s * R * .3); c.lineTo(-R * .25, s * R * (.95 + sw)); c.lineTo(-R * .55, s * R * (.85 + sw)); c.lineTo(-R * .4, s * R * .3); c.closePath(); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 2; c.stroke(); }
      c.fillStyle = P.body2; c.beginPath(); c.moveTo(-R * .75, 0); c.lineTo(-R * 1.05, -R * .3 + sw * R); c.lineTo(-R * .95, 0); c.lineTo(-R * 1.05, R * .3 + sw * R); c.closePath(); c.fill();
      c.fillStyle = P.body; c.beginPath(); c.ellipse(0, 0, R * .92, R * .38, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = lw * 3; c.stroke();
      c.fillStyle = P.plate; c.beginPath(); c.ellipse(-R * .05, 0, R * .7, R * .18, 0, 0, TAU); c.fill();
      c.fillStyle = P.acc; for (let k = 0; k < 14; k++) { const x = -R * .6 + k * R * .09; c.globalAlpha = (k + Math.floor(t * 4)) % 3 === 0 ? 1 : .35; c.fillRect(x, -R * .27, R * .03, R * .03); c.fillRect(x, R * .24, R * .03, R * .03); } c.globalAlpha = 1;
      const g = c.createRadialGradient(R * .85, 0, 0, R * .85, 0, R * .2); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, P.glow + '.9)'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; circ(c, R * .85, 0, R * .2); c.fill();
      glowCore(c, -R * .1, 0, R * .12, P, t); break;
    }
    case 'x_necropole': {
      const l2 = Math.max(2, R * .006);
      for (let k = 0; k < 12; k++) {
        const s = k < 6 ? -1 : 1, i = k % 6, bx = (2.5 - i) * R * .28, ph = Math.sin(t * 1.6 + i * 1.1 + (s > 0 ? Math.PI : 0)) * mv;
        const kx = bx + ph * R * .08 + (2.5 - i) * R * .05, ky = s * R * .92, fx = bx + (2.5 - i) * R * .1 + ph * R * .14, fy = s * R * 1.18;
        c.strokeStyle = '#1a1214'; c.lineWidth = R * .05; c.beginPath(); c.moveTo(bx, s * R * .5); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke(); c.fillStyle = P.body2; circ(c, kx, ky, R * .035); c.fill();
      }
      c.fillStyle = '#231a1c'; c.beginPath(); c.ellipse(0, 0, R * .95, R * .7, 0, 0, TAU); c.fill(); c.strokeStyle = P.dark; c.lineWidth = l2 * 4; c.stroke();
      const cell = R * .18;
      for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) {
        const x = i * cell, y = j * cell; if ((x * x) / (R * R * .75) + (y * y) / (R * R * .38) > 1) continue;
        const h = hash2(i + 20, j + 20, 61); if (h < .25) continue;
        const w = cell * (.4 + h * .4), hh = cell * (.4 + hash2(j + 20, i + 20, 63) * .4);
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - w / 2 + cell * .1, y - hh / 2 + cell * .1, w, hh); c.fillStyle = h > .8 ? '#4a2a2e' : '#33282a'; c.fillRect(x - w / 2, y - hh / 2, w, hh);
        if (h > .6) { c.fillStyle = `rgba(255,50,60,${(.25 + .3 * Math.abs(Math.sin(t * 2 + i * j))).toFixed(2)})`; c.fillRect(x - w * .2, y - hh * .2, w * .15, hh * .15); }
      }
      c.strokeStyle = 'rgba(255,42,58,.35)'; c.lineWidth = R * .01; for (const k of [.48, .8]) { c.beginPath(); c.ellipse(0, 0, R * .95 * k, R * .7 * k, 0, 0, TAU); c.stroke(); }
      glowCore(c, 0, 0, R * .14, P, t); break;
    }
  }
}
function paintMountZ(c, wid, s, P, rec, t, m) {
  const AL = { e_siege: 'siege', e_flame: 'flamer', e_beam: 'beam', e_storm: 'storm', e_titan: 'battle', e_mwall: 'mwall', e_nova: 'mortar' };
  if (AL[wid]) { paintMount(c, AL[wid], s, P, rec, t, m); return; }
  c.save(); c.scale(s, s); c.translate(-rec * 2.5, 0);
  const dark = '#181c1e';
  switch (wid) {
    case 'harpoon': c.fillStyle = P.body2; circ(c, 0, 0, 4.2); c.fill(); c.fillStyle = dark; c.fillRect(1, -1.4, 12, 2.8); if (!m || m.cd < .4) { c.fillStyle = '#e8e0c8'; c.beginPath(); c.moveTo(13, -2.4); c.lineTo(17, 0); c.lineTo(13, 2.4); c.closePath(); c.fill(); } break;
    case 'acidgun': c.fillStyle = '#4a5a2a'; circ(c, -1, 0, 4.6); c.fill(); c.fillStyle = '#9fe06a'; circ(c, -1, 0, 2.4); c.fill(); c.fillStyle = dark; c.fillRect(2, -1.6, 9, 3.2); c.fillStyle = '#9fe06a'; c.fillRect(10, -1.2, 2, 2.4); break;
    case 'dca': c.fillStyle = P.body; circ(c, 0, 0, 7); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1; c.stroke(); c.fillStyle = dark; for (const y of [-4.5, -1.5, 1.5, 4.5]) c.fillRect(2, y - 1, 15, 2); c.fillStyle = P.plate; circ(c, -1, 0, 3); c.fill(); break;
    case 'disc': { c.fillStyle = P.body2; rr(c, -5, -5, 10, 10, 2); c.fill(); c.fillStyle = dark; c.fillRect(2, -3.5, 10, 7); c.save(); c.translate(9, 0); c.rotate(t * 20); c.fillStyle = '#d8f4ff'; ngon(c, 6, 3.6); c.fill(); c.restore(); break; }
    case 'thermo': { c.fillStyle = P.body2; rr(c, -8, -8, 18, 16, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.2; c.stroke(); const H = [[4, -4], [4, 4], [-2, -4], [-2, 4]]; c.fillStyle = dark; for (const [x, y] of H) { circ(c, x, y, 2.8); c.fill(); } c.fillStyle = '#ff8a40'; for (const [x, y] of H) { circ(c, x + 1.6, y, 1.1); c.fill(); } break; }
    case 'lance': c.fillStyle = P.body2; circ(c, 0, 0, 7); c.fill(); c.strokeStyle = '#c8e8ff'; c.lineWidth = 1.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 2 + k * 1.6, 0, TAU); c.stroke(); } c.fillStyle = dark; c.fillRect(5, -1.5, 14, 3); c.fillStyle = '#c8e8ff'; circ(c, 19, 0, 2.2 + Math.sin(t * 9) * .6); c.fill(); break;
    case 'disint': { c.fillStyle = P.body2; rr(c, -10, -9, 22, 18, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.5; c.stroke(); c.fillStyle = dark; c.fillRect(8, -3.5, 24, 7); c.fillStyle = '#ff3a6a'; for (let k = 0; k < 4; k++) c.fillRect(11 + k * 5, -4.5, 2, 9); const p = .5 + .5 * Math.sin(t * 6); c.fillStyle = `rgba(255,58,106,${(.4 + p * .5).toFixed(2)})`; circ(c, 32, 0, 3.2); c.fill(); break; }
    case 'gauss': c.fillStyle = P.body2; rr(c, -9, -8, 18, 16, 3); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.4; c.stroke(); c.fillStyle = dark; c.fillRect(4, -5, 34, 2.4); c.fillRect(4, 2.6, 34, 2.4); c.fillStyle = '#a8f0ff'; for (let k = 0; k < 6; k++) c.fillRect(8 + k * 5, -2.4, 2, 4.8); c.fillStyle = P.plate; circ(c, -2, 0, 4); c.fill(); break;
    case 'battle': {
      c.fillStyle = P.body; rr(c, -14, -13, 26, 26, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = P.plate; rr(c, -10, -9, 16, 18, 4); c.fill();
      c.fillStyle = dark; for (const y of [-7, 0, 7]) { c.fillRect(8, y - 2.2, 34, 4.4); c.fillRect(39, y - 3, 5, 6); }
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-12, -2, 6, 4); break;
    }
    case 'mwall': {
      c.fillStyle = P.body2; rr(c, -14, -14, 28, 28, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
      const full = !m || m.cd < 1;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { c.fillStyle = dark; circ(c, -9 + i * 4.6, -7.5 + j * 5, 1.7); c.fill(); if (full) { c.fillStyle = '#ffb020'; circ(c, -9 + i * 4.6, -7.5 + j * 5, .8); c.fill(); } }
      break;
    }
    case 'annihil': {
      c.fillStyle = P.body2; circ(c, 0, 0, 14); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = dark; c.fillRect(10, -6, 32, 12); c.fillStyle = '#ff5a2a'; for (let k = 0; k < 5; k++) c.fillRect(14 + k * 5.5, -7, 2.2, 14);
      const p = .5 + .5 * Math.sin(t * 5), g = c.createRadialGradient(0, 0, 0, 0, 0, 9); g.addColorStop(0, '#fff'); g.addColorStop(.4, `rgba(255,90,42,${(.6 + p * .4).toFixed(2)})`); g.addColorStop(1, 'rgba(255,90,42,0)'); c.fillStyle = g; circ(c, 0, 0, 9); c.fill(); break;
    }
    case 'furnace': {
      c.fillStyle = '#5a3a24'; circ(c, -4, 0, 12); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = `rgba(255,${(120 + 60 * Math.sin(t * 8)) | 0},40,.8)`; circ(c, -4, 0, 6); c.fill();
      c.fillStyle = dark; c.beginPath(); c.moveTo(4, -6); c.lineTo(30, -11); c.lineTo(30, 11); c.lineTo(4, 6); c.closePath(); c.fill(); c.fillStyle = '#ff7a20'; c.fillRect(28, -9, 3, 18); break;
    }
    case 'ion': {
      c.fillStyle = P.body2; ngon(c, 6, 13, 0); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
      for (let k = 0; k < 3; k++) { const a = t * 3 + k * TAU / 3; c.fillStyle = '#9fe8ff'; circ(c, Math.cos(a) * 8, Math.sin(a) * 8, 2.2); c.fill(); }
      c.strokeStyle = '#9fe8ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(6, 0); c.lineTo(28, 0); c.stroke(); c.fillStyle = '#d8f8ff'; circ(c, 28, 0, 3.2 + Math.sin(t * 11) * .9); c.fill(); break;
    }
    case 'fighters': {
      c.fillStyle = P.body2; rr(c, -16, -12, 32, 24, 4); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = dark; c.fillRect(6, -8, 10, 16); c.fillStyle = '#6fe3c8'; for (let k = 0; k < 4; k++) c.fillRect(-12 + k * 5, -9, 3, 3);
      c.strokeStyle = 'rgba(232,220,196,.4)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(-12, 0); c.lineTo(14, 0); c.stroke(); c.setLineDash([]); break;
    }
    case 'dome': {
      c.fillStyle = P.body2; circ(c, 0, 0, 13); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 1.6; c.stroke();
      const p = .5 + .5 * Math.sin(t * 2.5); c.strokeStyle = `rgba(127,200,255,${(.4 + p * .5).toFixed(2)})`; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 4 + k * 3, 0, TAU); c.stroke(); }
      c.fillStyle = '#d8f0ff'; circ(c, 0, 0, 2.6); c.fill(); break;
    }
    case 'nanoswarm': {
      c.fillStyle = P.body2; circ(c, 0, 0, 11); c.fill(); c.strokeStyle = '#6fb5a4'; c.lineWidth = 2; c.beginPath(); c.arc(2, 0, 14, -1.1, 1.1); c.stroke();
      c.fillStyle = '#9ff0dc'; for (let k = 0; k < 6; k++) { const a = t * 2 + k; circ(c, Math.cos(a) * 7, Math.sin(a) * 7, 1.5); c.fill(); } break;
    }
    case 'fission': {
      const ch = m && m.chg > 0 ? 1 - m.chg / 2.4 : 0;
      c.fillStyle = P.body; rr(c, -18, -15, 34, 30, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = dark; c.fillRect(12, -6.5, 54, 13); c.fillStyle = P.plate; for (let k = 0; k < 7; k++) c.fillRect(16 + k * 7, -8.5, 3, 17);
      c.fillStyle = `rgba(200,255,255,${(.3 + ch * .7).toFixed(2)})`; c.fillRect(14, -2.5, 52 * Math.max(.15, ch), 5);
      const g = c.createRadialGradient(-2, 0, 0, -2, 0, 11); g.addColorStop(0, '#fff'); g.addColorStop(.4, `rgba(200,255,255,${(.5 + ch * .5).toFixed(2)})`); g.addColorStop(1, 'rgba(200,255,255,0)'); c.fillStyle = g; circ(c, -2, 0, 11); c.fill(); break;
    }
    case 'singul': {
      c.fillStyle = P.body2; circ(c, 0, 0, 16); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = dark; c.fillRect(10, -9, 34, 18);
      c.save(); c.translate(36, 0); c.rotate(t * 4); c.strokeStyle = '#b9a0ff'; c.lineWidth = 2.4; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 4 + k * 2.6, k, k + 4); c.stroke(); } c.restore();
      c.fillStyle = '#05030a'; circ(c, 36, 0, 3); c.fill(); c.strokeStyle = '#d8c8ff'; c.lineWidth = 1; circ(c, 36, 0, 3); c.stroke(); break;
    }
    case 'dusk': {
      c.fillStyle = P.body2; rr(c, -20, -18, 40, 36, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.fillStyle = dark; rr(c, -14, -12, 28, 24, 4); c.fill();
      if (!m || m.cd <= 0) { c.fillStyle = '#e8dcc4'; c.beginPath(); c.moveTo(16, 0); c.lineTo(8, -7); c.lineTo(-12, -7); c.lineTo(-12, 7); c.lineTo(8, 7); c.closePath(); c.fill(); c.fillStyle = '#ffd0a0'; c.fillRect(-4, -7, 3, 14); c.fillStyle = '#c8461a'; c.fillRect(-12, -7, 3, 14); }
      c.fillStyle = '#e0b030'; for (let k = -2; k <= 2; k++) c.fillRect(-19, k * 6 - 1.5, 3, 3); break;
    }
    case 'meteor': {
      c.fillStyle = P.body2; rr(c, -18, -18, 36, 36, 6); c.fill(); c.strokeStyle = P.dark; c.lineWidth = 2; c.stroke();
      c.save(); c.rotate(t * .6); c.strokeStyle = '#ffb070'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(0, 0, 15, 6, 0, 0, TAU); c.stroke(); c.rotate(Math.PI / 2); c.beginPath(); c.ellipse(0, 0, 15, 6, 0, 0, TAU); c.stroke(); c.restore();
      c.fillStyle = '#ffd8a8'; circ(c, 0, 0, 4.5); c.fill(); break;
    }
  }
  c.restore();
}
// le Chantier titanesque : une cale sèche, un portique, une coque en construction
function paintShipyard(c, b, t, ghost, x, y, w, h) {
  c.fillStyle = '#2b2f2f'; c.fillRect(x + 6, y + 6, w - 12, h - 12);
  c.fillStyle = '#1c2021'; c.fillRect(x + 24, y + 24, w - 48, h - 48);
  c.strokeStyle = 'rgba(242,193,78,.6)'; c.lineWidth = 3; c.setLineDash([10, 7]); c.strokeRect(x + 18, y + 18, w - 36, h - 36); c.setLineDash([]);
  const lv = Math.max(1, b.lvl || 1), hw = (w - 70) * (.5 + lv * .15), hh = (h - 80) * .55;
  c.save(); c.translate(x + w / 2, y + h / 2);
  c.fillStyle = '#3d4a4c'; rr(c, -hw / 2, -hh / 2, hw, hh, 14); c.fill();
  c.strokeStyle = 'rgba(111,227,200,.35)'; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < 6; k++) { c.moveTo(-hw / 2 + k * hw / 6, -hh / 2); c.lineTo(-hw / 2 + k * hw / 6, hh / 2); } c.stroke();
  c.fillStyle = '#2a3234'; ngon(c, 8, hh * .3, Math.PI / 8); c.fill();
  if (!ghost) for (let k = 0; k < 3; k++) { const ph = (t * 3 + k * 1.7) % 3; if (ph < .4) { const q = Math.floor(t * 3); c.fillStyle = '#fff2c8'; circ(c, Math.sin(k * 7 + q) * hw * .4, Math.cos(k * 5 + q) * hh * .35, 3 + ph * 6); c.fill(); } }
  c.restore();
  const gx = x + 30 + ((Math.sin(t * .3) + 1) / 2) * (w - 60);
  c.fillStyle = '#e0b030'; c.fillRect(gx - 7, y + 10, 14, h - 20); c.fillStyle = '#1e1c18'; for (let k = 0; k < 8; k++) c.fillRect(gx - 7, y + 14 + k * (h - 28) / 8, 14, 5);
  c.fillStyle = '#c9c2b4'; c.fillRect(gx - 16, y + h / 2 + Math.sin(t * .7) * 40 - 8, 32, 16);
  for (const [px, py] of [[x + 14, y + 14], [x + w - 14, y + 14], [x + 14, y + h - 14], [x + w - 14, y + h - 14]]) { c.fillStyle = '#e0b030'; circ(c, px, py, 6); c.fill(); }
}
// anneau de fabrication autour des géants usines
function drawFabOverlay(c, u, z) {
  if (!u.fabC || u.dead || u.team !== 0 || state === 'base') return;
  const n = (u.fabK || []).filter(v => !v.dead).length, full = n >= u.fabC.cap, p = full ? 1 : u.fabP || 0, R = u.r + 12 / z;
  c.strokeStyle = 'rgba(111,227,200,.12)'; c.lineWidth = 3 / z; circ(c, u.x, u.y, R); c.stroke();
  c.strokeStyle = full ? 'rgba(242,193,78,.55)' : 'rgba(111,227,200,.6)'; c.beginPath(); c.arc(u.x, u.y, R, -Math.PI / 2, -Math.PI / 2 + TAU * p); c.stroke();
  if (tactical || u.sel || u.piloted) { c.fillStyle = '#6fe3c8'; c.font = `600 ${12 / z}px ${FONT}`; c.textAlign = 'center'; c.fillText('Renforts ' + n + ' / ' + u.fabC.cap + (full ? '' : ' · ' + Math.ceil(Math.max(0, u.fabT || 0)) + ' s'), u.x, u.y + R + 16 / z); }
}
