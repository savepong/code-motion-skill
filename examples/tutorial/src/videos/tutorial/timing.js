// Page timing for the tutorial, read by visuals.js and score.js. Each page keeps the local times it
// was drawn and scored at (from..to); its absolute start is the previous page's end plus a page turn,
// so lengthening or inserting a page moves every later page in picture and sound together.
;(function () {
  const TURN = 0.5 // page-turn length (s)
  const pages = [
    { id: 'cover', from: 0, to: 1.0 }, // the takeaway page, held, then turned
    { id: 'page1', from: 0, to: 6.4 }, // the problem, then install
    { id: 'page2', from: 6.9, to: 14.6 }, // ask, pick a style, approve
    { id: 'studio', from: 15.1, to: 19.1 }, // preview before rendering
    { id: 'page3', from: 15.1, to: 22.6 }, // render, get the MP4
    { id: 'page4', from: 23.1, to: 28 }, // takeaway
  ]
  const r6 = (x) => Math.round(x * 1e6) / 1e6 // keep 1.5 exactly 1.5, so 12 fps frame steps don't slip
  const layout = () => {
    let end = -TURN
    for (const p of pages) {
      p.start = r6(end + TURN) // absolute
      p.offset = r6(p.start - p.from) // add to a local time to get absolute time
      p.end = end = r6(p.offset + p.to)
    }
    return end
  }
  const T = Object.fromEntries(pages.map((p) => [p.id, p]))
  const timing = { pages, T, TURN, duration: layout() }
  // Lengthen a page by dt seconds (local `to` grows); every later page starts dt later.
  timing.shift = (id, dt) => {
    T[id].to += dt
    timing.duration = layout()
  }
  window.TIMING = window.TIMING || {}
  window.TIMING.tutorial = timing
})()
