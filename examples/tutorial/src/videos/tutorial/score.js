// Sound for the Manga Page tutorial. Event times are page-local, as in visuals.js; page offsets come
// from the shared table in timing.js. The picture runs on twos (12 drawings/s),
// so an event at t0 first shows on the next 1/12 s frame: on(t0).
;(function () {
  window.VIDEOS.tutorial.score = (k0) => {
    // start every sound a quarter sample past the 48 kHz grid (Chrome spikes sources that land exactly on it)
    const sn = (t) => (Math.round(t * 48000) + 0.25) / 48000
    const base = { ...k0, play: (n, t, o) => k0.play(n, sn(t), o), tone: (t, o) => k0.tone(sn(t), o), noise: (t, o) => k0.noise(sn(t), o) }
    // play the following sounds in a page's local time
    let k
    const page = ({ offset }) => { k = { ...base, play: (n, t, o) => base.play(n, t + offset, o), tone: (t, o) => base.tone(t + offset, o), noise: (t, o) => base.noise(t + offset, o) } }
    const { T: PG } = window.TIMING.tutorial
    const D = window.VIDEOS.tutorial.duration
    const on = (t0) => (Math.floor(t0 * 12 + 1e-6) + 1) / 12
    const pan = (x) => Math.max(-1, Math.min(1, x / 640 - 1)) * 0.6
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)

    const slam = (t, g = 1, p = 0, minor = false) => {
      k.play('slap', t, { gain: 0.55 * g, pan: p, minor })
      k.play('thud', t, { f: 120, gain: 0.45 * g, pan: p, minor })
    }
    const flip = (t) => {
      k.play('paper', t, { dur: 0.18, gain: 0.45, pan: 0.4 })
      k.noise(t + 0.08, { dur: 0.36, color: 'pink', filter: 'bandpass', f: [[0, 600], [0.18, 1600], [0.36, 500]], q: 0.7, gain: 0.3, a: 0.16, pan: -0.1 })
      k.play('paper', t + 0.42, { dur: 0.1, gain: 0.3, pan: -0.5 })
    }
    const dodo = (t, p) => {
      k.tone(t, { f: [[0, 90], [0.2, 48]], dur: 0.3, gain: 0.26, pan: p })
      k.noise(t, { dur: 0.22, color: 'brown', filter: 'lowpass', f: 380, gain: 0.28, pan: p })
    }
    // keys while a terminal line types: one per drawn frame that adds characters
    const typed = (t0, chars, rate, p) => {
      const end = t0 + chars * rate
      for (let f = Math.ceil(t0 * 12 + 1e-6); f / 12 < end; f++) k.play('key', f / 12, { gain: 0.6, pan: p, minor: true })
    }
    const pinpon = (t, p) => {
      k.tone(t, { f: 'E5', type: 'triangle', dur: 0.5, gain: 0.22, verb: 0.3, pan: p })
      k.tone(t, { f: 'E6', dur: 0.3, gain: 0.04, pan: p })
      k.tone(t + 0.2, { f: 'C5', type: 'triangle', dur: 0.9, gain: 0.22, verb: 0.35, pan: p })
      k.tone(t + 0.2, { f: 'C6', dur: 0.5, gain: 0.04, pan: p })
    }
    const tick = (t, f, g, p) =>
      k.withMinor(() => {
        k.noise(t, { dur: 0.03, filter: 'bandpass', f, q: 1.4, gain: 0.3 * g, a: 0.001, pan: p })
        k.tone(t, { f: f * 0.2, type: 'triangle', dur: 0.035, gain: 0.08 * g, pan: p })
      })

    k0.bed('room', 0, D, { gain: 0.3 })

    // ---- COVER: the takeaway page, held, then turned
    page(PG.cover)
    flip(PG.cover.to)

    // ---- PAGE 1: the problem, then install
    page(PG.page1)
    slam(on(0), 0.8, pan(300))
    k.play('pop', on(0.3), { f: 300, gain: 0.7, pan: pan(300) }) // question balloon
    k.noise(1.8, { dur: 0.5, color: 'brown', filter: 'bandpass', f: [[0, 250], [0.3, 500], [0.5, 280]], q: 0.6, gain: 0.15, a: 0.2, minor: true }) // shrinks to the header
    for (let i = 0; i < 3; i++) dodo(on(1.9 + i * 0.15), pan(500)) // ゴゴゴ
    slam(on(2.35), 0.8, pan(920))
    typed(2.6, 31, 0.035, pan(900))
    typed(3.75, 19, 0.035, pan(900))
    typed(4.25, 30, 0.035, pan(900))
    typed(4.95, 19, 0.03, pan(900))
    k.play('pop', on(5.05), { f: 280, gain: 0.7, pan: pan(780) }) // skill folder
    pinpon(on(5.05) + 0.05, pan(1060)) // installed ✓
    k.play('pop', on(5.5), { f: 340, gain: 0.45, pan: pan(900), minor: true }) // works with other agents

    flip(PG.page1.to)

    // ---- PAGE 2: ask, pick a style, approve
    page(PG.page2)
    slam(on(6.75), 0.8, pan(330))
    typed(7.0, 14, 0.05, pan(230))
    typed(7.75, 14, 0.06, pan(230))
    typed(8.4, 9, 0.06, pan(230))
    k.noise(8.75, { dur: 0.22, color: 'pink', filter: 'bandpass', f: [[0, 500], [0.22, 1200]], q: 0.8, gain: 0.16, a: 0.07, pan: pan(470), minor: true }) // arrow into the agent
    k.play('select', on(9.0), { gain: 0.8, pan: pan(545) }) // agent smiles
    slam(on(9.2), 0.8, pan(950))
    ;[0, 1, 2].forEach((i) => k.play('slap', on(9.45 + i * 0.17), { gain: 0.4, pan: pan(770 + i * 175), minor: true })) // style cards
    k.play('impact', on(10.3), { gain: 0.6, pan: pan(770) }) // MANGA circled
    dodo(on(10.3), pan(930))
    dodo(on(10.3) + 0.12, pan(990))
    slam(on(11.0), 0.9, pan(640))
    for (let i = 0; i < 6; i++) k.play('stroke', on(11.35 + i * 0.22), { material: 'pen', dur: 0.18, gain: 0.8, pan: pan(190 + (i % 3) * 248), minor: true }) // frames ink in
    k.play('stamp', on(12.3), { gain: 0.9, pan: pan(690) }) // อนุมัติ!
    k.play('impact', on(12.3), { gain: 0.5, pan: pan(690) })
    pinpon(on(12.5), pan(1000))

    flip(PG.page2.to)

    // ---- STUDIO PAGE: preview before rendering
    page(PG.studio)
    slam(on(15.0), 0.8, pan(220))
    typed(15.35, 16, 0.04, pan(220))
    typed(16.05, 14, 0.03, pan(220))
    slam(on(16.2), 0.8, pan(850))
    k.play('click', on(16.6), { gain: 0.8, pan: pan(680) }) // grab the playhead
    for (let f = Math.ceil(16.7 * 12); f / 12 < 18.7; f += 2) k.play('tick', f / 12, { f: 3600, gain: 0.35, pan: pan(680 + ((f / 12 - 16.7) / 2) * 520), minor: true }) // scrubbing
    k.play('click', on(18.7), { gain: 0.6, pan: pan(1200) }) // release
    k.play('pop', on(17.0), { f: 320, gain: 0.55, pan: pan(840) })

    flip(PG.studio.to)

    // ---- PAGE 3: render, get the MP4
    page(PG.page3)
    slam(on(15.0), 0.8, pan(640))
    typed(15.35, 25, 0.035, pan(340))
    // グングン: the bar fills 16.3 -> 19.0
    k.noise(16.3, { dur: 2.7, color: 'pink', filter: 'bandpass', f: [[0, 250], [2.7, 1400]], q: 1.1, gain: 0.12, a: 2.2, pan: pan(340), minor: true })
    k.tone(16.3, { f: [[0, 'C3'], [2.7, 'C4']], type: 'triangle', dur: 2.7, gain: 0.05, a: 2.2, minor: true })
    { let lastT = -1
      for (let f = Math.ceil(16.3 * 12); f / 12 < 19.0; f++) {
        const t = f / 12, u = Math.min(1, (t - 16.3) / 2.7), sp = 6 * u * (1 - u)
        if ((sp > 0.6 || f % 2 === 0) && t - lastT >= 1 / 12 - 1e-6) { tick(t, 1900 + u * 700, 0.7 + 0.3 * Math.min(1, sp), pan(990)); lastT = t }
      } }
    k.play('impact', 19.0, { gain: 1.25, pan: pan(990) }) // 840 frames: the big hit
    k.play('stamp', 19.0, { gain: 0.5, pan: pan(990) })
    slam(on(19.9), 0.8, pan(640))
    k.play('pop', on(20.1), { f: 260, gain: 0.8, pan: pan(190) }) // MP4 file
    k.noise(20.4, { dur: 0.2, color: 'pink', filter: 'bandpass', f: [[0, 500], [0.2, 1200]], q: 0.8, gain: 0.14, a: 0.06, pan: pan(340), minor: true })
    k.play('pop', on(20.6), { f: 340, gain: 0.6, pan: pan(640) })

    flip(PG.page3.to)

    // ---- PAGE 4: takeaway
    page(PG.page4)
    slam(on(23.0), 0.6, 0, true)
    k.play('stamp', on(23.45), { gain: 0.8 }) // /code-motion
    ;['C5', 'D5', 'E5', 'G5'].forEach((n, i) => {
      const t = on(24.0 + i * 0.3)
      k.play('pop', t, { f: k.hz(n) * 0.6, gain: 0.6, pan: (i - 1.5) * 0.3 })
      if (i < 3) k.noise(t + 0.15, { dur: 0.12, color: 'pink', filter: 'bandpass', f: [[0, 700], [0.12, 1500]], q: 0.8, gain: 0.08, a: 0.04, pan: (i - 1) * 0.3, minor: true })
    })
    k.play('pop', on(25.6), { f: 300, gain: 0.6 })
    ;['G4', 'C5', 'E5', 'G5'].forEach((n, i) => k.tone(on(25.6) + 0.06 + i * 0.07, { f: n, type: 'triangle', dur: 1.2 - i * 0.1, gain: 0.13, verb: 0.3, pan: (i - 1.5) * 0.2 }))
  }
})()
