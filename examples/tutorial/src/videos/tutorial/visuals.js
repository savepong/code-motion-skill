// Manga Page tutorial: how to install and use the /code-motion skill.
// Drawing helpers come from the style reference via window.MANGA (src/style/manga.js).
;(function () {
  const { TAU, poly, catmull, brush, bz, focusLines, KANA, kanaStrokes, sfx, bubble, tone, gradTone, inkLoop, rrPts, ellPts, pencilRough, paper, robot, narr, mArrow } = window.MANGA;
  // ===== TUTORIAL: how to install and use the /code-motion skill =====
  // Page start times, page turns and the total length come from the shared table in timing.js.
  const { T: PG, duration: DURATION } = window.TIMING.tutorial;
  const THAI = /[฀-๿]/;
  // Thai has no glyphs in the style's Latin fonts: Mali stands in for Patrick Hand, Kanit for Archivo Black.
  const F = (size, s) => (THAI.test(s) ? `700 ${size}px "Mali"` : `400 ${size}px "Patrick Hand"`);
  const HEAVY = (size, s) => (THAI.test(s) ? `800 ${size}px "Kanit"` : `400 ${size}px "Archivo Black"`);
  const MONO = (size) => `400 ${size}px "VT323", "Mali"`;

  // narration box sized to its text, top-left at (x, y)
  function nbox(c, x, y, lines, size, sc = 1) {
    c.save(); c.font = F(size, lines.join(''));
    const w = Math.max(...lines.map((l) => c.measureText(l).width)) + size * 1.1, h = lines.length * size * 1.3 + size * 0.5;
    c.translate(x + w / 2, y + h / 2); c.scale(sc, sc);
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2.6; c.fillRect(-w / 2, -h / 2, w, h); c.strokeRect(-w / 2, -h / 2, w, h);
    c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((l, i) => c.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.3 + size * 0.06));
    c.restore(); return [w, h];
  }
  // speech balloon sized to its text
  function sbubble(c, cx, cy, tail, lines, size, r) {
    c.save(); c.font = F(size, lines.join('')); const mw = Math.max(...lines.map((l) => c.measureText(l).width)); c.restore();
    bubble(c, cx, cy, mw / 2 + size * 1.2, lines.length * size * 0.66 + size * 0.75, tail, lines, F(size, lines.join('')), size * 1.3, r);
  }
  // terminal: black bezel, white screen, scanlines, typed lines [{ s, t0, rate }]
  function term(c, x, y, w, h, lines, T, size = 34) {
    c.save();
    c.fillStyle = '#000'; c.beginPath(); c.roundRect(x + 8, y + 8, w, h, 14); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill();
    c.fillStyle = '#000'; inkLoop(c, rrPts(x, y, w, h, 14), 7);
    c.fillRect(x, y, w, 30); c.fillStyle = '#fff'; [0, 1, 2].forEach((k) => { c.beginPath(); c.arc(x + 22 + k * 22, y + 15, 6, 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(0,0,0,0.1)'; for (let yy = y + 32; yy < y + h - 4; yy += 3) c.fillRect(x + 6, yy, w - 12, 1);
    c.fillStyle = '#000'; c.font = MONO(size); c.textBaseline = 'middle'; c.textAlign = 'left';
    let cur = null;
    lines.forEach((L, i) => {
      if (T < L.t0) return;
      const n = Math.min(L.s.length, Math.floor((T - L.t0) / (L.rate || 0.04)) + 1), s = L.s.slice(0, n), ly = y + 58 + i * size * 1.1;
      c.fillText(s, x + 22, ly); cur = [x + 22 + c.measureText(s).width + 4, ly];
    });
    if (cur && Math.floor(T * 2) % 2 === 0) c.fillRect(cur[0], cur[1] - size * 0.32, size * 0.42, size * 0.64);
    c.restore();
  }
  // one style swatch card: a tiny drawing in that look, with a name tag
  function styleCard(c, x, y, rot, kind, s, r) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = '#000'; c.fillRect(-72, -62, 152, 140);
    c.fillStyle = '#fff'; c.fillRect(-80, -70, 152, 140); c.lineWidth = 3; c.strokeRect(-80, -70, 152, 140);
    c.save(); c.beginPath(); c.rect(-70, -60, 132, 88); c.clip();
    if (kind === 0) { c.fillStyle = tone(c, 0.25); c.fillRect(-70, -60, 132, 88); c.fillStyle = '#fff'; c.beginPath(); c.arc(-4, -16, 26, 0, TAU); c.fill(); c.fillStyle = '#000'; focusLines(c, -4, -16, 28, 120, 60, r, 2.5); c.lineWidth = 2.4; c.beginPath(); c.arc(-4, -16, 26, 0, TAU); c.stroke(); }
    else if (kind === 1) { c.fillStyle = '#fbfaf6'; c.fillRect(-70, -60, 132, 88); c.strokeStyle = '#000'; c.lineWidth = 2.6; const cube = (cx, cy, a) => { c.fillStyle = '#fff'; poly(c, [[cx, cy - a], [cx + a, cy - a / 2], [cx + a, cy + a / 2], [cx, cy + a], [cx - a, cy + a / 2], [cx - a, cy - a / 2]]); c.fill(); c.stroke(); c.fillStyle = tone(c, 0.3); poly(c, [[cx, cy], [cx + a, cy - a / 2], [cx + a, cy + a / 2], [cx, cy + a]]); c.fill(); c.stroke(); c.beginPath(); c.moveTo(cx - a, cy - a / 2); c.lineTo(cx, cy); c.stroke(); }; cube(-30, -10, 24); cube(24, -2, 18); }
    else { c.fillStyle = '#111'; c.fillRect(-70, -60, 132, 88); c.fillStyle = '#fff'; brush(c, bz([-52, 4], [-30, -40], [0, -40], [20, -6], 14), 4); brush(c, [[-50, 16], [40, 12]], 3); c.font = '400 26px "Patrick Hand"'; c.textAlign = 'center'; c.fillText('E=mc²', 4, -20); }
    c.restore();
    c.fillStyle = '#000'; c.font = '400 30px "Patrick Hand"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(['MANGA', 'ISO', 'CHALK'][kind], -4, 50);
    c.restore();
  }
  // round approval stamp (white knock-out, inked rings)
  function stamp(c, x, y, text, k) {
    if (k <= 0) return; const sc = 1 + 0.9 * Math.pow(1 - Math.min(1, k), 2);
    c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(sc, sc);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 112, 0, TAU); c.fill();
    c.fillStyle = '#000'; inkLoop(c, ellPts(0, 0, 112, 112, 48), 12); inkLoop(c, ellPts(0, 0, 92, 92, 44), 4);
    c.font = HEAVY(52, text); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 4);
    c.restore();
  }
  // video file card with a film-strip band
  function fileCard(c, x, y, s, label) {
    c.save(); c.translate(x, y); c.rotate(-0.06); c.scale(s, s);
    const pts = [[-90, -110], [50, -110], [90, -70], [90, 110], [-90, 110]];
    c.fillStyle = '#000'; c.save(); c.translate(10, 10); poly(c, pts); c.fill(); c.restore();
    c.fillStyle = '#fff'; poly(c, pts); c.fill(); c.fillStyle = '#000'; inkLoop(c, pts.flatMap((p, i) => { const q = pts[(i + 1) % pts.length]; return [0, 1, 2, 3].map((k) => [H.lerp(p[0], q[0], k / 4), H.lerp(p[1], q[1], k / 4)]); }), 7);
    c.fillRect(-90, -40, 180, 64); c.fillStyle = '#fff'; for (let k = 0; k < 8; k++) { c.fillRect(-82 + k * 22, -34, 12, 9); c.fillRect(-82 + k * 22, 9, 12, 9); }
    c.fillStyle = '#000'; c.beginPath(); c.moveTo(-10, -18); c.lineTo(16, -8); c.lineTo(-10, 2); c.closePath(); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = '#000'; c.font = '400 30px "Patrick Hand"'; c.textAlign = 'center'; c.fillText(label, 0, 72);
    c.restore();
  }

  function explainer(ctx, W, H_, t) {
    let tq = Math.floor(t * 12) / 12; const boil = Math.floor(t * 8), r = H.rng(77 + boil);
    const quake = (k, amp) => [Math.sin(tq * 90 + k) * amp, Math.cos(tq * 77 + k) * amp];
    const slam = (c, P, t0) => { const k = H.clamp((tq - t0) / 0.34); if (k <= 0) return false; const z = 1 + 0.14 * Math.pow(1 - k, 2), sh = Math.pow(1 - k, 2) * 7; const cc = P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length], [0, 0]); c.translate(cc[0] + Math.sin(tq * 90) * sh, cc[1] + Math.cos(tq * 77) * sh); c.scale(z, z); c.translate(-cc[0], -cc[1]); return true; };
    const pop = (c, t0, x, y, fn) => { const k = H.clamp((tq - t0) / 0.17); if (k <= 0) return; const sc = 1 + 0.6 * Math.pow(1 - k, 2); c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y); fn(); c.restore(); };
    const panel = (c, P, t0, fn) => { if (tq < t0) { pencilRough(c, P); return; } c.save(); if (!slam(c, P, t0)) { c.restore(); return; } c.save(); poly(c, P); c.clip(); c.fillStyle = '#fbfaf6'; c.fill(); fn(); c.restore(); c.lineWidth = 3.4; c.strokeStyle = '#000'; poly(c, P); c.stroke(); c.restore(); };

    // ---------- page 1: the problem, then install ----------
    const page1 = (c, T) => {
      const P1 = [[24, 24], [600, 24], [570, 696], [24, 696]], P2 = [[616, 24], [1256, 24], [1256, 696], [586, 696]];
      panel(c, P1, 0, () => {
        c.fillStyle = tone(c, 0.3); c.fillRect(0, 0, 620, 720);
        c.fillStyle = '#fbfaf6'; c.beginPath(); c.arc(300, 440, 210, 0, TAU); c.fill();
        c.fillStyle = '#000'; focusLines(c, 300, 440, 215, 760, 200, r, 4);
        // a monitor showing a crowded video-editor timeline
        c.fillStyle = '#000'; poly(c, [[70, 300], [530, 306], [524, 590], [76, 584]]); c.fill();
        c.fillStyle = '#fff'; poly(c, [[86, 316], [514, 321], [509, 574], [91, 569]]); c.fill();
        c.fillStyle = '#000'; c.fillRect(108, 336, 180, 96); c.fillStyle = tone(c, 0.5); c.fillRect(300, 336, 196, 96);
        const jr = H.rng(21);
        for (let row = 0; row < 5; row++) { let x = 108; while (x < 490) { const w = jr.range(24, 90); c.fillStyle = row % 2 ? tone(c, 0.35) : '#000'; c.fillRect(x, 448 + row * 23, Math.min(w, 494 - x), 16); x += w + jr.range(3, 10); } }
        c.fillStyle = '#000'; c.fillRect(300, 440, 3, 124);
        c.beginPath(); c.ellipse(300, 610, 70, 10, 0, 0, TAU); c.fill(); poly(c, [[284, 584], [316, 584], [322, 610], [278, 610]]); c.fill();
        if (T > 1.9) { const [a, b] = quake(1, 2.5); ['ゴ', 'ゴ', 'ゴ'].forEach((ch, i) => pop(c, 1.9 + i * 0.15, 500 - i * 8 + a, 150 + i * 70 + b, () => sfx(c, ch, 500 - i * 8 + a, 150 + i * 70 + b, 62, -0.12 + i * 0.05, -0.25, 8))); }
      });
      panel(c, P2, 2.35, () => {
        c.fillStyle = tone(c, 0.12); c.fillRect(580, 0, 700, 720);
        nbox(c, 640, 44, ['ขั้นที่ 1 · ติดตั้งในโปรเจกต์ของคุณ'], 32);
        term(c, 640, 130, 590, 300, [
          { s: '$ gh gist clone 9135d1b /tmp/cm', t0: 2.6, rate: 0.035 },
          { s: '$ cp /tmp/cm/*.md \\', t0: 3.75, rate: 0.035 },
          { s: '  .claude/skills/code-motion/', t0: 4.25, rate: 0.035 },
          { s: 'OK  skill installed', t0: 4.95, rate: 0.03 }
        ], T, 34);
        if (T > 2.7 && T < 4.9) { const [a, b] = quake(2, 2); sfx(c, 'カ', 1150 + a, 470 + b, 50, -0.2, -0.2, 7); sfx(c, 'チ', 1200 + a, 470 + b, 50, -0.1, -0.2, 7); }
        // the installed skill folder
        pop(c, 5.05, 790, 560, () => {
          c.save(); c.translate(780, 560); c.rotate(-0.04);
          c.fillStyle = '#000'; c.fillRect(-170, -50, 360, 110); c.fillStyle = '#fff'; c.fillRect(-180, -60, 360, 110); c.fillRect(-180, -80, 110, 24);
          c.fillStyle = '#000'; inkLoop(c, [[-180, -80], [-70, -80], [-60, -60], [180, -60], [180, 50], [-180, 50]], 6);
          c.font = '400 30px "Patrick Hand"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('code-motion/', -6, -10); c.fillText('SKILL.md  REFERENCE.md', -6, 24);
          c.restore();
          c.strokeStyle = '#000'; c.lineCap = 'round'; c.lineWidth = 26; c.beginPath(); c.moveTo(1010, 548); c.lineTo(1050, 590); c.lineTo(1125, 500); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 11; c.stroke();
        });
        if (T > 5.5) pop(c, 5.5, 900, 640, () => nbox(c, 640, 612, ['ใช้ได้ทั้ง Claude Code · Codex · Cursor'], 28));
      });
      // hook: the question pops, then shrinks into the corner header
      const k = H.ease.inOut(H.clamp((T - 1.8) / 0.5));
      if (T > 0.3) {
        if (k <= 0) pop(c, 0.3, 300, 160, () => sbubble(c, 300, 160, [260, 300], ['อยากได้วิดีโอแนะนำแอป', 'แต่ตัดต่อไม่เป็น?!'], 40, r));
        else { const sz = H.lerp(44, 30, k); nbox(c, H.lerp(80, 40, k), H.lerp(100, 40, k), ['ทำวิดีโอด้วยโค้ด'], sz); }
      }
    };

    // ---------- page 2: ask, pick a style, approve the storyboard ----------
    const page2 = (c, T) => {
      const Q1 = [[24, 24], [640, 24], [620, 340], [24, 340]], Q2 = [[656, 24], [1256, 24], [1256, 340], [636, 340]], Q3 = [[24, 356], [1256, 356], [1256, 696], [24, 696]];
      const ok = T > 12.3;
      panel(c, Q1, 6.75, () => {
        c.fillStyle = tone(c, 0.18); c.fillRect(0, 0, 660, 360);
        term(c, 44, 100, 380, 210, [
          { s: '> /code-motion', t0: 7.0, rate: 0.05 },
          { s: 'วิดีโอแนะนำแอป', t0: 7.75, rate: 0.06 },
          { s: 'ยาว 30 วิ', t0: 8.4, rate: 0.06 }
        ], T, 34);
        mArrow(c, bz([430, 210], [460, 190], [480, 190], [500, 200], 12), 18, (T - 8.75) / 0.2);
        robot(c, 545, 185, 0.42, T < 9.0 ? 'think' : 'happy', T);
        nbox(c, 44, 40, ['ขั้นที่ 2 · สั่งงาน'], 32);
      });
      panel(c, Q2, 9.2, () => {
        c.fillStyle = '#fbfaf6'; c.fillRect(620, 0, 660, 360);
        if (T > 10.3) { c.save(); c.fillStyle = '#000'; focusLines(c, 770, 205, 95, 520, 120, r, 3.5); c.restore(); }
        [0, 1, 2].forEach((kind) => pop(c, 9.45 + kind * 0.17, 770 + kind * 175, 205, () => styleCard(c, 770 + kind * 175, 205, [-0.08, 0.05, -0.03][kind], kind, kind === 0 && T > 10.3 ? 1.12 : 0.95, r)));
        if (T > 10.3) { const kk = H.clamp((tq - 10.3) / 0.17), sc = 1 + 0.6 * Math.pow(1 - kk, 2); c.save(); c.translate(770, 200); c.scale(sc, sc); c.fillStyle = '#000'; inkLoop(c, ellPts(0, 0, 112, 104, 40), 9, r); c.restore();
          const [a, b] = quake(4, 2.5); sfx(c, 'ド', 930 + a, 100 + b, 56, -0.2, -0.25, 8); sfx(c, 'ン', 988 + a, 104 + b, 46, 0, -0.25, 7); }
        nbox(c, 1050, 40, ['เลือกสไตล์'], 32);
      });
      panel(c, Q3, 11.0, () => {
        c.fillStyle = tone(c, 0.3); c.fillRect(0, 340, 1280, 380);
        // storyboard sheet: six frames ink in one after another
        c.fillStyle = '#000'; c.fillRect(70, 436, 760, 252); c.fillStyle = '#fff'; c.fillRect(60, 426, 760, 252);
        for (let i = 0; i < 6; i++) {
          const fx = 80 + (i % 3) * 248, fy = 442 + Math.floor(i / 3) * 116, fw = 228, fh = 104, P = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]];
          if (T < 11.35 + i * 0.22) { pencilRough(c, P); continue; }
          c.save(); poly(c, P); c.clip(); c.fillStyle = tone(c, [0.15, 0.3, 0.2, 0.4, 0.25, 0.1][i]); c.fillRect(fx, fy, fw, fh);
          c.fillStyle = '#000'; const jr = H.rng(60 + i); focusLines(c, fx + fw * 0.5, fy + fh * 0.5, 30, 160, 40, jr, 2);
          c.fillStyle = '#fff'; c.beginPath(); c.arc(fx + fw * jr.range(0.3, 0.7), fy + fh * 0.5, 24, 0, TAU); c.fill(); c.fillStyle = '#000'; inkLoop(c, ellPts(fx + fw * 0.5, fy + fh * 0.5, 24, 24, 20), 3);
          c.restore(); c.lineWidth = 3; c.strokeStyle = '#000'; poly(c, P); c.stroke();
        }
        stamp(c, 690, 560, 'อนุมัติ!', (tq - 12.3) / 0.2);
        robot(c, 1080, 560, 0.5, ok ? 'happy' : 'think', T);
        if (ok) pop(c, 12.5, 1020, 400, () => { sfx(c, 'ピ', 900, 420, 50, -0.2, -0.2, 7); sfx(c, 'ン', 945, 410, 46, -0.1, -0.2, 7); sfx(c, 'ポ', 995, 400, 50, 0, -0.2, 7); sfx(c, 'ー', 1040, 395, 44, 0, 0, 6); sfx(c, 'ン', 1085, 395, 46, 0.1, -0.2, 7); });
        nbox(c, 44, 368, ['ขั้นที่ 3 · ตรวจ storyboard'], 30);
      });
    };


    // ---------- studio page: preview before rendering ----------
    const pageS = (c, T) => {
      const Z1 = [[24, 24], [440, 24], [420, 696], [24, 696]], Z2 = [[456, 24], [1256, 24], [1256, 696], [436, 696]];
      panel(c, Z1, 15.0, () => {
        c.fillStyle = tone(c, 0.2); c.fillRect(0, 0, 460, 720);
        nbox(c, 44, 44, ['ขั้นที่ 4', 'ดูใน Remotion Studio'], 30);
        c.fillStyle = '#fbfaf6'; c.beginPath(); c.arc(220, 560, 120, 0, TAU); c.fill();
        c.fillStyle = '#000'; focusLines(c, 220, 560, 120, 420, 80, r, 3);
        term(c, 44, 200, 350, 160, [{ s: '$ bun run studio', t0: 15.35, rate: 0.04 }, { s: 'localhost:3000', t0: 16.05, rate: 0.03 }], T, 34);
        robot(c, 220, 570, 0.45, 'happy', T);
      });
      panel(c, Z2, 16.2, () => {
        c.fillStyle = tone(c, 0.12); c.fillRect(420, 0, 860, 720);
        const bx = 480, by = 60, bw = 740, bh = 480;
        c.fillStyle = '#000'; c.beginPath(); c.roundRect(bx + 9, by + 9, bw, bh, 12); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.roundRect(bx, by, bw, bh, 12); c.fill();
        c.fillStyle = '#000'; inkLoop(c, rrPts(bx, by, bw, bh, 12), 6); c.fillRect(bx, by, bw, 36);
        c.fillStyle = '#fff'; [0, 1, 2].forEach((k) => { c.beginPath(); c.arc(bx + 22 + k * 22, by + 18, 6, 0, TAU); c.fill(); });
        c.font = MONO(28); c.textBaseline = 'middle'; c.fillText('Remotion Studio', bx + 100, by + 19);
        // sidebar with the composition list
        c.fillStyle = '#000'; c.fillRect(bx + 170, by + 36, 3, bh - 36);
        c.font = '400 28px "Patrick Hand"'; c.textAlign = 'left'; c.fillText('trailer', bx + 24, by + 80);
        c.fillRect(bx + 10, by + 104, 152, 40); c.fillStyle = '#fff'; c.fillText('tutorial', bx + 24, by + 125);
        // preview: the video itself, a tiny manga page that follows the playhead
        const u = H.ease.inOut(H.clamp((T - 16.7) / 2.0)), px = bx + 196, py = by + 56, pw = 520, ph = 292;
        c.fillStyle = '#fbfaf6'; c.fillRect(px, py, pw, ph); c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        const jr = H.rng(80 + Math.floor(u * 5));
        const cells = [[0, 0, 0.48, 1], [0.5, 0, 0.5, 0.48], [0.5, 0.52, 0.5, 0.48]];
        cells.forEach(([ax, ay, aw, ah], i) => { const x0 = px + ax * pw + 6, y0 = py + ay * ph + 6, w0 = aw * pw - 12, h0 = ah * ph - 12; c.save(); c.beginPath(); c.rect(x0, y0, w0, h0); c.clip(); c.fillStyle = tone(c, [0.3, 0.15, 0.4][i]); c.fillRect(x0, y0, w0, h0); c.fillStyle = '#000'; focusLines(c, x0 + w0 / 2, y0 + h0 / 2, 34, 200, 24, jr, 1.6); c.fillStyle = '#fff'; c.beginPath(); c.arc(x0 + w0 * (0.3 + 0.4 * jr()), y0 + h0 / 2, 26, 0, TAU); c.fill(); c.restore(); c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeRect(x0, y0, w0, h0); });
        c.restore(); c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeRect(px, py, pw, ph);
        // timeline with a playhead dragged across
        const tx = bx + 196, ty = by + 372, tw = 520;
        c.fillStyle = tone(c, 0.35); c.fillRect(tx, ty, tw, 34); c.strokeRect(tx, ty, tw, 34);
        c.fillStyle = '#000'; for (let k = 0; k <= 32; k++) c.fillRect(tx + k * tw / 32, ty + 40, 2, k % 4 ? 8 : 16);
        const hx = tx + u * tw; c.fillRect(hx - 2, ty - 10, 5, 70); poly(c, [[hx - 12, ty - 22], [hx + 12, ty - 22], [hx, ty - 8]]); c.fill();
        c.font = MONO(30); c.textAlign = 'right'; c.fillText((u * DURATION).toFixed(1).padStart(4, '0') + ' s', bx + bw - 24, by + 450);
        // the viewer's cursor on the playhead
        if (T > 16.5) { c.save(); c.translate(hx + 6, ty + 30); c.fillStyle = '#fff'; poly(c, [[0, 0], [0, 40], [11, 30], [20, 48], [28, 44], [19, 27], [34, 27]]); c.fill(); c.lineWidth = 3; c.stroke(); c.restore(); }
        if (T > 17.0) pop(c, 17.0, 840, 620, () => nbox(c, 520, 586, ['เลื่อนดูทุกเฟรมได้ก่อน render'], 32));
      });
    };

    // ---------- page 3: render, get the MP4 ----------
    const FR = Math.round(DURATION * 30);
    const page3 = (c, T) => {
      const R1 = [[24, 24], [1256, 24], [1256, 450], [24, 470]], R2 = [[24, 486], [1256, 466], [1256, 696], [24, 696]];
      panel(c, R1, 15.0, () => {
        c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, 1280, 480);
        c.drawImage(gradTone(700, 480, 0.25, 0, 20, 380, 420, 690), 0, 0);
        const big = T > 19.0;
        if (big) { c.save(); c.beginPath(); c.rect(690, 0, 600, 480); c.clip(); c.fillStyle = '#000'; focusLines(c, 990, 240, 150, 800, 160, r, 5); c.restore(); }
        term(c, 60, 110, 560, 150, [{ s: '$ bun run render tutorial', t0: 15.35, rate: 0.035 }], T, 36);
        const pr = H.ease.inOut(H.clamp((T - 16.3) / 2.7));
        c.fillStyle = '#000'; c.fillRect(68, 318, 560, 56); c.fillStyle = '#fff'; c.fillRect(60, 310, 560, 56); c.fillStyle = '#000'; inkLoop(c, rrPts(60, 310, 560, 56, 4, 2), 5);
        if (pr > 0) { c.fillStyle = tone(c, 0.55); c.fillRect(66, 316, 548 * pr, 44); }
        if (pr > 0.1 && pr < 1) { const [a, b] = quake(7, 2); ['グ', 'ン', 'グ', 'ン'].forEach((ch, i) => sfx(c, ch, 120 + i * 68 + a, 420 - i * 8 + b, 52, -0.3, -0.25, 7)); }
        const v = Math.round(FR * pr), sc = big ? 1 + 0.3 * Math.pow(1 - H.clamp((tq - 19.0) / 0.25), 2) : 1;
        c.save(); c.translate(990, 240); c.scale(sc, sc);
        { const wr = H.rng(733), box = []; [[-230, -120], [230, -120], [230, 120], [-230, 120]].forEach((a, i, arr) => { const b = arr[(i + 1) % 4]; for (let k = 0; k < 8; k++) box.push([H.lerp(a[0], b[0], k / 8) + wr.range(-1.5, 1.5), H.lerp(a[1], b[1], k / 8) + wr.range(-1.5, 1.5)]); });
          c.fillStyle = '#000'; c.save(); c.translate(9, 9); poly(c, box); c.fill(); c.restore();
          c.fillStyle = '#fff'; poly(c, box); c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#000'; c.lineWidth = 5; poly(c, box); c.stroke(); }
        c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = F(36, 'เฟรม'); c.fillText('เฟรมที่ render แล้ว', 0, -76);
        c.font = '400 104px "Archivo Black"'; c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = '#fff'; c.strokeText(String(v), 0, 26); c.fillText(String(v), 0, 26);
        c.font = '400 36px "Patrick Hand"'; c.fillText('/ ' + FR, 0, 92);
        c.restore();
        nbox(c, 44, 40, ['ขั้นที่ 5 · render'], 32);
      });
      panel(c, R2, 19.9, () => {
        c.fillStyle = tone(c, 0.22); c.fillRect(0, 440, 1280, 280);
        c.fillStyle = '#fbfaf6'; c.beginPath(); c.arc(1130, 600, 120, 0, TAU); c.fill();
        c.fillStyle = '#000'; focusLines(c, 1130, 600, 120, 360, 90, r, 3);
        robot(c, 1130, 610, 0.45, 'happy', T);
        pop(c, 20.1, 190, 585, () => fileCard(c, 190, 585, 0.78, 'tutorial.mp4'));
        mArrow(c, bz([300, 585], [330, 570], [350, 570], [380, 580], 12), 20, (T - 20.4) / 0.2);
        if (T > 20.6) pop(c, 20.6, 640, 585, () => nbox(c, 420, 545, ['ได้ MP4 ไม่ต้องตัดต่อเลย!'], 44));
      });
    };

    // ---------- page 4: takeaway ----------
    const page4 = (c, T) => {
      const S = [[24, 24], [1256, 24], [1256, 696], [24, 696]];
      panel(c, S, 23.0, () => {
        c.fillStyle = tone(c, 0.2); c.fillRect(0, 0, 1280, 720);
        c.fillStyle = '#fbfaf6'; c.beginPath(); c.ellipse(640, 300, 470, 190, 0, 0, TAU); c.fill();
        c.fillStyle = '#000'; focusLines(c, 640, 300, 420, 900, 220, r, 5);
        pop(c, 23.45, 640, 250, () => { c.save(); c.font = '400 108px "Archivo Black"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#fff'; c.strokeText('/code-motion', 640, 250); c.fillStyle = '#000'; c.fillText('/code-motion', 640, 250); c.restore(); });
        const steps = ['ติดตั้ง', 'สั่ง', 'อนุมัติ', 'ดู Studio', 'render'];
        c.save(); c.font = '700 44px "Mali"'; const ws = steps.map((s) => c.measureText(s).width + 40); c.restore();
        const gap = 52, total = ws.reduce((a, b) => a + b, 0) + gap * (steps.length - 1); let x = 640 - total / 2;
        steps.forEach((s, i) => {
          const cx = x + ws[i] / 2, t0 = 24.0 + i * 0.3;
          pop(c, t0, cx, 390, () => { c.save(); c.font = '700 44px "Mali"'; const w = ws[i]; c.fillStyle = '#000'; c.fillRect(cx - w / 2 + 6, 360, w, 66); c.fillStyle = '#fff'; c.fillRect(cx - w / 2, 354, w, 66); c.lineWidth = 3; c.strokeRect(cx - w / 2, 354, w, 66); c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, cx, 389); c.restore(); });
          if (i < steps.length - 1) mArrow(c, [[x + ws[i] + 6, 387], [x + ws[i] + gap * 0.5, 387], [x + ws[i] + gap - 18, 387]], 12, (T - t0 - 0.15) / 0.12);
          x += ws[i] + gap;
        });
        robot(c, 1090, 560, 0.42, 'happy', T);
        if (T > 25.6) { c.save(); c.font = F(32, 'ก'); const msg = ['แค่ติดตั้ง skill ในโปรเจกต์ของคุณ', 'แล้วทำตามขั้นตอนที่ skill บอก ก็ได้วิดีโอ'], w = Math.max(...msg.map((m) => c.measureText(m).width)) + 35; c.restore();
          pop(c, 25.6, 640, 580, () => nbox(c, 640 - w / 2, 520, msg, 32)); }
      });
    };


    // ---------- page 4, drawn natively for the 9:16 cut ----------
    const page4V = (c, T) => {
      const S = [[24, 24], [1056, 24], [1056, 1896], [24, 1896]];
      panel(c, S, 23.0, () => {
        c.fillStyle = tone(c, 0.2); c.fillRect(0, 0, 1080, 1920);
        c.fillStyle = '#fbfaf6'; c.beginPath(); c.ellipse(540, 820, 500, 640, 0, 0, TAU); c.fill();
        c.fillStyle = '#000'; focusLines(c, 540, 820, 470, 1500, 260, r, 6);
        pop(c, 23.45, 540, 300, () => { c.save(); c.font = '400 116px "Archivo Black"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = '#fff'; c.strokeText('/code-motion', 540, 300); c.fillStyle = '#000'; c.fillText('/code-motion', 540, 300); c.restore(); });
        const steps = ['ติดตั้ง', 'สั่ง', 'อนุมัติ', 'ดู Studio', 'render'];
        steps.forEach((st, i) => {
          const cy = 500 + i * 158, t0 = 24.0 + i * 0.3;
          pop(c, t0, 540, cy, () => { c.save(); c.font = '700 64px "Mali"'; const w = c.measureText(st).width + 90; c.fillStyle = '#000'; c.fillRect(540 - w / 2 + 8, cy - 48 + 8, w, 100); c.fillStyle = '#fff'; c.fillRect(540 - w / 2, cy - 48, w, 100); c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeRect(540 - w / 2, cy - 48, w, 100); c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st, 540, cy + 2); c.restore(); });
          if (i < steps.length - 1) mArrow(c, [[540, cy + 58], [540, cy + 78], [540, cy + 92]], 16, (T - t0 - 0.15) / 0.12);
        });
        if (T > 25.6) { const msg = ['แค่ติดตั้ง skill ในโปรเจกต์ของคุณ', 'แล้วทำตามขั้นตอนที่ skill บอก', 'ก็ได้วิดีโอ']; c.save(); c.font = F(48, 'ก'); const w = Math.max(...msg.map((m) => c.measureText(m).width)) + 53; c.restore();
          pop(c, 25.6, 540, 1380, () => nbox(c, 540 - w / 2, 1270, msg, 48)); }
        robot(c, 540, 1690, 0.62, 'happy', T);
      });
    };
    page4V.native = true;

    // ---------- page turns ----------
    ctx.fillStyle = '#d9d6cf'; ctx.fillRect(0, 0, W, H_);
    // 9:16: each landscape page is drawn at 2x, then its panels are cut out and stacked in reading order
    const V = H_ > W, RS = V ? 2 : 1, LW = 1280, LH = 720;
    const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const CUTS = new Map([
      [page1, [[[24, 24], [600, 24], [570, 696], [24, 696]], [[616, 24], [1256, 24], [1256, 696], [586, 696]]]],
      [page2, [[[24, 24], [640, 24], [620, 340], [24, 340]], [[656, 24], [1256, 24], [1256, 340], [636, 340]], rect(24, 356, 836, 696), rect(836, 356, 1256, 696)]],
      [pageS, [[[24, 24], [440, 24], [420, 696], [24, 696]], [[456, 24], [1256, 24], [1256, 696], [436, 696]]]],
      [page3, [[[24, 24], [684, 24], [684, 462], [24, 470]], [[690, 24], [1256, 24], [1256, 450], [690, 460]], [[24, 486], [1256, 466], [1256, 696], [24, 696]]]]
    ]);
    const stack = (L, cuts) => {
      const out = H.layer(W, H_), c = out.getContext('2d'), M = 40, G = 30, maxW = W - M * 2;
      c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, W, H_);
      const box = cuts.map((P) => { const xs = P.map((q) => q[0]), ys = P.map((q) => q[1]); const bx = Math.min(...xs), by = Math.min(...ys); return { P, bx, by, bw: Math.max(...xs) - bx, bh: Math.max(...ys) - by }; });
      box.forEach((b) => { b.s = Math.min(maxW / b.bw, 1.6); });
      const avail = H_ - M * 2 - G * (box.length - 1), need = box.reduce((a, b) => a + b.bh * b.s, 0), k = Math.min(1, avail / need);
      let y = (H_ - (need * k + G * (box.length - 1))) / 2;
      box.forEach((b) => {
        const s = b.s * k, x = (W - b.bw * s) / 2;
        c.save(); c.translate(x, y); c.scale(s, s); c.translate(-b.bx, -b.by);
        c.save(); poly(c, b.P); c.clip(); c.drawImage(L, 0, 0, LW, LH); c.restore();
        c.lineWidth = 4 / s; c.strokeStyle = '#000'; c.lineJoin = 'round'; poly(c, b.P); c.stroke();
        c.restore(); y += b.bh * s + G;
      });
      return out;
    };
    const drawPage = (fn, T, shift = 0) => {
      T -= shift; tq = Math.floor(T * 12) / 12;
      const native = !V || fn.native, L = native ? H.layer(W, H_) : H.layer(LW * RS, LH * RS), c = L.getContext('2d');
      if (!native) c.scale(RS, RS);
      c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, LW, H_ > LH ? H_ : LH); c.lineCap = 'round'; c.lineJoin = 'round'; fn(c, T);
      return native ? L : stack(L, CUTS.get(fn) || CUTS.get(page1));
    };
    const turn = (A, B, p) => {
      ctx.drawImage(B, 0, 0);
      const fx = W * (1 - H.ease.inOut(p));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, fx, H_); ctx.clip(); ctx.drawImage(A, 0, 0); ctx.restore();
      const bw = Math.min(fx, (W - fx) * 0.5);
      if (bw > 1) {
        ctx.save(); ctx.translate(fx, 0); ctx.scale(-1, 1);
        const g = ctx.createLinearGradient(0, 0, bw, 0); g.addColorStop(0, '#d8d4ca'); g.addColorStop(0.5, '#f6f3ec'); g.addColorStop(1, '#e4e0d6');
        ctx.fillStyle = g; ctx.fillRect(0, 0, bw, H_); ctx.restore();
        const sg = ctx.createLinearGradient(fx, 0, fx + 60, 0); sg.addColorStop(0, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(fx, 0, 60, H_);
      }
    };
    const P4 = V ? page4V : page4;
    // the takeaway page doubles as the cover, drawn finished
    const cover = (c) => { tq = PG.page4.to; P4(c, PG.page4.to); };
    cover.native = P4.native;
    // [draw, absolute start, absolute end, local-to-absolute offset]
    const PAGES = [[cover, PG.cover], [page1, PG.page1], [page2, PG.page2], [pageS, PG.studio], [page3, PG.page3], [P4, PG.page4]].map(([fn, p]) => [fn, p.start, p.end, p.offset]);
    for (let i = 0; i < PAGES.length; i++) {
      const [fn, , end] = PAGES[i], next = PAGES[i + 1];
      if (t < end || !next) { ctx.drawImage(drawPage(fn, t, PAGES[i][3]), 0, 0); break; }
      if (t < next[1]) { turn(drawPage(fn, end - 0.01, PAGES[i][3]), drawPage(next[0], t, next[3]), (t - end) / 0.5); break; }
    }
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(paper(W, H_), 0, 0); ctx.restore();
    H.grain(ctx, W, H_, 0.035, 9 + boil);
  }

  window.VIDEOS = window.VIDEOS || {};
  window.VIDEOS.tutorial = { ...window.VIDEOS.tutorial, draw: explainer, duration: DURATION };
})();
