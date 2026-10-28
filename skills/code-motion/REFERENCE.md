# Code motion: Remotion shell

The shell is the same for every video and every style. Create these files once. Versions were
current when written; use what the repo already pins if it has them.

```text
<video-app>/
  package.json
  tsconfig.json
  .gitignore
  scripts/render.ts          # bun run render <id>: WAV first, then MP4 (--audio: WAV only)
  scripts/stills.ts          # bun run stills <id> <t1> <t2>...: PNGs for storyboards and checks
  scripts/voiceover.ts       # optional: bun run voiceover <id>: narration.json -> public/<id>-voice.mp3
  src/index.ts               # registerRoot
  src/config.ts              # default size, fps, fonts, logo
  src/Root.tsx               # one video + one audio composition per id
  src/VideoCanvas.tsx        # draws visuals.js on a canvas each frame
  src/videos/index.ts        # imports every video's scripts
  src/videos/<id>/visuals.js # window.VIDEOS[id] = { draw, duration, width?, height?, fps?, voice? }
  src/videos/<id>/score.js   # window.VIDEOS[id].score = (k) => ...
  src/videos/<id>/narration.json # optional: voiceover text per beat
  src/lib/                   # helper library + sound kit, copied from the style prompt
  prompts/<style>.md         # style prompt, verbatim
  public/fonts/              # self-hosted fonts + fonts.css
  public/logo.svg            # optional
  public/<id>-voice.mp3      # optional voiceover audio (build output)
```

## package.json

```json
{
  "name": "video",
  "private": true,
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "bun scripts/render.ts",
    "stills": "bun scripts/stills.ts",
    "voiceover": "bun scripts/voiceover.ts"
  },
  "dependencies": {
    "@remotion/bundler": "4.0.530",
    "@remotion/cli": "4.0.530",
    "@remotion/renderer": "4.0.530",
    "msedge-tts": "^2.1.0",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "remotion": "4.0.530"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "allowJs": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["bun"]
  },
  "include": ["src", "scripts"]
}
```

## .gitignore

```text
out/
public/*.wav
public/*.mp3
node_modules/
```

`msedge-tts` and the `voiceover` script are only needed for narration; leave them out otherwise.

## src/index.ts

```ts
import { registerRoot } from "remotion"
import { Root } from "./Root"

registerRoot(Root)
```

## src/config.ts

```ts
export const FPS = 30 // default; a video can set its own fps (e.g. 60 for smooth motion)
export const WIDTH = 1280
export const HEIGHT = 720
export const SAMPLE_RATE = 48000
// Every weight the videos use; rendering waits for each one.
export const FONT_SPECS = ['800 84px "Noto Sans"', '600 28px "Noto Sans"', '400 18px "Noto Sans"']
// Text that covers the scripts on screen, so the right font files load.
export const FONT_SAMPLE = "AaZz09"
// Logo file in public/, or "" for videos without one.
export const LOGO = "logo.svg"
```

## src/videos/index.ts

```ts
// Plain browser scripts that publish window globals. Order matters: lib first.
import "../lib/harness.js"
import "../lib/sound.js"
import "./trailer/visuals.js"
import "./trailer/score.js"

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
type OfflineResult = { inter: Float32Array; peak: number; sr: number }

declare global {
  interface Window {
    VIDEOS: Record<
      string,
      { draw: Draw; duration: number; score: unknown; width?: number; height?: number; fps?: number; voice?: string }
    >
    SOUND: {
      renderOffline: (score: unknown, duration: number, sampleRate: number, opts: object) => Promise<OfflineResult>
    }
    LOGO: HTMLImageElement | null
  }
}

export const VIDEOS = window.VIDEOS
```

Adapt `SOUND.renderOffline` to the sound kit's real API if the style prompt names it differently.

## Video script contract

```js
// src/videos/<id>/visuals.js
;(function () {
  const draw = (ctx, W, H, t) => {
    /* pure function of t */
  }
  window.VIDEOS = window.VIDEOS || {}
  // width, height, fps and voice are optional; see "Several sizes", "Frame rate" and "Voiceover".
  window.VIDEOS["<id>"] = { ...window.VIDEOS["<id>"], draw, duration: 25 }
})()

// src/videos/<id>/score.js
;(function () {
  window.VIDEOS["<id>"].score = (k) => {
    /* k.play / k.tone / k.noise at the same times as visuals.js */
  }
})()
```

## src/VideoCanvas.tsx

```tsx
import { useEffect, useRef, useState } from "react"
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { FONT_SAMPLE, FONT_SPECS, LOGO } from "./config"
import { VIDEOS } from "./videos"

const FONT_CSS = staticFile("fonts/fonts.css")

const loadAssets = async () => {
  if (!document.querySelector(`link[href="${FONT_CSS}"]`)) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = FONT_CSS
    document.head.appendChild(link)
    await new Promise((resolve) => link.addEventListener("load", resolve, { once: true }))
  }
  await Promise.all(FONT_SPECS.map((spec) => document.fonts.load(spec, FONT_SAMPLE)))
  if (!LOGO) return
  const logo = new Image()
  logo.src = staticFile(LOGO)
  await logo.decode()
  window.LOGO = logo
}

export const VideoCanvas = ({ id, withAudio, voiceAudio }: { id: string; withAudio: boolean; voiceAudio?: string }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [handle] = useState(() => delayRender("Loading fonts and logo"))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadAssets().then(() => {
      setReady(true)
      continueRender(handle)
    })
  }, [handle])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ready || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, width, height)
    VIDEOS[id]!.draw(ctx, width, height, frame / fps)
  }, [id, frame, fps, ready, width, height])

  return (
    <AbsoluteFill>
      <canvas ref={canvasRef} width={width} height={height} />
      {withAudio ? <Audio src={staticFile(`${id}.wav`)} /> : null}
      {voiceAudio ? <Audio src={staticFile(voiceAudio)} /> : null}
    </AbsoluteFill>
  )
}
```

## src/Root.tsx

The `<id>-audio` composition renders the score inside the browser and hands the PCM back to Node
through `calculateMetadata` props, because Web Audio only exists in the browser.

```tsx
import { Composition } from "remotion"
import { FPS, HEIGHT, SAMPLE_RATE, WIDTH } from "./config"
import { VideoCanvas } from "./VideoCanvas"
import { VIDEOS } from "./videos"

const renderScore = async (id: string) => {
  const video = VIDEOS[id]!
  // With narration, voiceover mode ducks the score under the voice.
  const r = await window.SOUND.renderOffline(video.score, video.duration, SAMPLE_RATE, { voiceover: !!video.voice })
  const norm = r.peak > 0.98 ? 0.98 / r.peak : 1
  const pcm = new Int16Array(r.inter.length)
  for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-1, Math.min(1, r.inter[i]! * norm)) * 32767
  const bytes = new Uint8Array(pcm.buffer)
  let bin = ""
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return { pcm: btoa(bin), sampleRate: r.sr }
}

export const Root = () => (
  <>
    {Object.entries(VIDEOS).map(([id, video]) => (
      <div key={id}>
        <Composition
          id={id}
          component={VideoCanvas}
          durationInFrames={Math.round(video.duration * (video.fps ?? FPS))}
          fps={video.fps ?? FPS}
          width={video.width ?? WIDTH}
          height={video.height ?? HEIGHT}
          defaultProps={{ id, withAudio: true, voiceAudio: video.voice }}
        />
        <Composition
          id={`${id}-audio`}
          component={() => null}
          durationInFrames={1}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ pcm: "", sampleRate: SAMPLE_RATE }}
          calculateMetadata={async () => ({ props: await renderScore(id) })}
        />
      </div>
    ))}
  </>
)
```

Video ids must match `[a-zA-Z0-9-]+`.

## Several sizes (16:9 and 9:16)

Each video can set its own canvas size; `config.ts` WIDTH/HEIGHT is the default. Register the same
drawing and score again under a new id with a portrait size:

```js
// src/videos/<id>/vertical.js, imported after score.js in src/videos/index.ts
;(function () {
  window.VIDEOS["<id>-vertical"] = { ...window.VIDEOS["<id>"], width: 1080, height: 1920 }
})()
```

`draw(ctx, W, H, t)` then gets 1080×1920, so branch on `H > W`. A quick way to reuse a landscape
page: draw it at 2× on an offscreen canvas, then clip each panel and stack the panels top to bottom
in reading order, splitting very wide panels in two. Redraw title and summary pages natively.
Render with `bun run render <id>-vertical`.

## Frame rate

`config.ts` FPS (30) is the default. Set `fps: 60` in a video's registration for smoother motion;
`draw` still gets `t` in seconds, so nothing else changes. 60 fps doubles render time and roughly
doubles file size. Make film grain, flicker or other per-frame noise step on a fixed clock (for
example `Math.floor(t * 24)`) so it looks the same at any frame rate.

## scripts/render.ts

```ts
// bun run render <id>: renders the score to public/<id>.wav, then the video to out/<id>.mp4.
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { bundle } from "@remotion/bundler"
import { renderMedia, selectComposition } from "@remotion/renderer"

const id = process.argv[2]
if (!id) throw new Error("Usage: bun run render <id>")

const root = join(import.meta.dir, "..")
const entryPoint = join(root, "src/index.ts")
// A pen-heavy score can take longer than the default 28 s to render offline.
const timeoutInMilliseconds = 10 * 60 * 1000

const audio = await selectComposition({
  serveUrl: await bundle({ entryPoint }),
  id: `${id}-audio`,
  timeoutInMilliseconds,
})
const { pcm, sampleRate } = audio.props as { pcm: string; sampleRate: number }
const data = Buffer.from(pcm, "base64")
const header = Buffer.alloc(44)
header.write("RIFF", 0)
header.writeUInt32LE(36 + data.length, 4)
header.write("WAVEfmt ", 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20) // PCM
header.writeUInt16LE(2, 22) // stereo
header.writeUInt32LE(sampleRate, 24)
header.writeUInt32LE(sampleRate * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write("data", 36)
header.writeUInt32LE(data.length, 40)
writeFileSync(join(root, `public/${id}.wav`), Buffer.concat([header, data]))
if (process.argv.includes("--audio")) {
  console.log(`Wrote public/${id}.wav`)
  process.exit(0)
}

// Bundle again so the new WAV is in the served public folder.
const serveUrl = await bundle({ entryPoint })
const composition = await selectComposition({ serveUrl, id, timeoutInMilliseconds })
mkdirSync(join(root, "out"), { recursive: true })
const outputLocation = join(root, `out/${id}.mp4`)
await renderMedia({ serveUrl, composition, codec: "h264", outputLocation, timeoutInMilliseconds })
console.log(`Wrote public/${id}.wav and ${outputLocation}`)
```

This assumes the sound kit returns interleaved stereo (`inter`). If it returns mono, set channels
to 1 and the byte rate and block align to `sampleRate * 2` and `2`.

## scripts/stills.ts

Bundles once and renders many frames, much faster than one `remotion still` call per frame.

```ts
// bun run stills <id> <t1> <t2> ...: one PNG per time (seconds), for storyboards and checks.
import { join } from "node:path"
import { bundle } from "@remotion/bundler"
import { renderStill, selectComposition } from "@remotion/renderer"

const [id, ...times] = process.argv.slice(2)
if (!id || times.length === 0) throw new Error("Usage: bun run stills <id> <t1> <t2> ...")

const root = join(import.meta.dir, "..")
const inputProps = { id, withAudio: false }
const timeoutInMilliseconds = 10 * 60 * 1000 // the default 28 s is too short for heavy scenes
const serveUrl = await bundle({ entryPoint: join(root, "src/index.ts") })
const composition = await selectComposition({ serveUrl, id, inputProps, timeoutInMilliseconds })
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(t) * composition.fps))
  await renderStill({ serveUrl, composition, frame, output: join(root, `out/${id}-${t}.png`), inputProps, timeoutInMilliseconds })
  console.log(`out/${id}-${t}.png`)
}
```

## Remotion Studio

`bun run studio` opens the Studio in the browser (http://localhost:3000): pick the video in the
sidebar, scrub the timeline, and every saved edit to `visuals.js` reloads at once. It plays
`public/<id>.wav`, so run `bun run render <id> --audio` first and again after changing `score.js`.

## Fonts for other scripts

A style's fonts often cover Latin only. For Thai, Japanese, Arabic and so on, pick a font with the
same feel per role (hand-lettered, heavy display, mono) and switch to it only for text in that
script, for example:

```js
const THAI = /[\u0E00-\u0E7F]/
const F = (size, s) => (THAI.test(s) ? `700 ${size}px "Mali"` : `400 ${size}px "Patrick Hand"`)
```

Add those faces to `FONT_SPECS` and a sample of the script to `FONT_SAMPLE` so rendering waits for
them.

## Self-hosting fonts

Fetch the Google Fonts CSS with a browser User-Agent so it returns woff2, download the files for
the subsets you need into `public/fonts/`, and rewrite the `url(...)` entries to the local file
names in `public/fonts/fonts.css`. Keep the font's licence (most Google Fonts are SIL OFL 1.1,
which allows this).

## Voiceover narration (optional)

Spoken narration is generated once into `public/<id>-voice.mp3` and played over the score.
Edge TTS (free, no key) is the default; if `ELEVENLABS_API_KEY` is set, ElevenLabs is used instead.
Needs `ffmpeg` and `ffprobe` on the PATH.

Generate **one clip per beat** and place each at its beat's start time. One long clip for the whole
video drifts out of sync with the scenes, and if it is longer than the video the end is cut off.

1. Write `src/videos/<id>/narration.json` with the approved transcript:

   ```json
   {
     "voice": "en-GB-RyanNeural",
     "rate": "+0%",
     "gap": 0.4,
     "duration": 90,
     "beats": [
       { "start": 0.6, "text": "First beat's narration." },
       { "start": 9.4, "text": "Second beat's narration." }
     ],
     "elevenlabs": { "voice": "<voice-id>", "model": "eleven_multilingual_v2" }
   }
   ```

   - `voice`: the Edge voice. Always name it explicitly (see the table below).
   - `rate`: Edge speaking rate (`"+10%"`, `"-5%"`). Prefer shortening text over going above +15%.
   - `gap`: seconds of silence required before the next beat starts.
   - `start`: a little after the scene cut (about 0.4–0.6 s) so the picture lands first.
   - `elevenlabs` (optional): used only when `ELEVENLABS_API_KEY` is set. `voice` is a voice ID
     from your ElevenLabs library; `model` defaults to `eleven_multilingual_v2`.
   - Budget: English Edge voices speak about 2.1–2.5 words per second at `+0%`, so a 10 s beat
     holds about 20 words. Thai runs at roughly 4–5 syllables per second. Check with a test run.
2. Run `bun run voiceover <id>`. It prints where each clip ends and exits with code 2 if any clip
   runs into the next beat. Shorten that beat's text (or nudge `rate`) and run it again.
3. Add `voice: "<id>-voice.mp3"` to the video's registration in `visuals.js`. Remotion mixes it
   over `<id>.wav` in Studio and in the MP4. Keep the score quieter under speech.

### Picking a voice

Edge TTS voices that suit narration (from the `msedge-tts` voice list):

| Style                          | Edge voice                                        |
| ------------------------------ | ------------------------------------------------- |
| Documentary, authoritative     | `en-US-ChristopherNeural` (M), `en-GB-RyanNeural` (M), `en-GB-SoniaNeural` (F) |
| News, confident                | `en-US-GuyNeural` (M), `en-US-AriaNeural` (F), `en-US-MichelleNeural` (F) |
| Warm, conversational product   | `en-US-AndrewNeural` (M), `en-US-AvaNeural` (F), `en-US-EmmaNeural` (F) |
| Casual, social clip            | `en-US-BrianNeural` (M), `en-US-RogerNeural` (M, lively), `en-US-JennyNeural` (F) |
| Thai                           | `th-TH-NiwatNeural` (M), `th-TH-PremwadeeNeural` (F) |

ElevenLabs models for this offline, per-beat generation:

| Model                    | Use it for                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| `eleven_multilingual_v2` | Default. Stable, natural long-form narration in its 29 languages. **No Thai.** |
| `eleven_v3`              | Most expressive delivery, and needed for Thai and other languages v2 lacks. Check each clip: it varies more between runs. |
| `eleven_flash_v2_5`      | Not needed here; its advantage is low latency for real-time use.           |

### scripts/voiceover.ts

```ts
// bun run voiceover <id>: one TTS clip per beat, each placed at its beat start, mixed into
// public/<id>-voice.mp3 trimmed to the video length. Narration can't drift or run past the end.
//
// Reads src/videos/<id>/narration.json:
//   { voice, rate?, gap?, duration, beats: [{ start, text }], elevenlabs?: { voice, model? } }
//
// Uses Edge TTS (free, no key) with `voice` (an Edge voice name such as "th-TH-PremwadeeNeural").
// If ELEVENLABS_API_KEY is set, uses ElevenLabs instead with `elevenlabs.voice` (a voice ID) and
// `elevenlabs.model` (default eleven_multilingual_v2; use eleven_v3 for Thai and other languages
// multilingual_v2 does not cover). Flags override the file: --engine edge|elevenlabs, --voice, --model.
import { execFileSync } from "node:child_process"
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

const args = process.argv.slice(2)
const id = args[0]
if (!id || id.startsWith("-")) {
  console.log("Usage: bun run voiceover <id> [--engine edge|elevenlabs] [--voice <name or id>] [--model <elevenlabs model>]")
  process.exit(1)
}
const getArg = (flag: string) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

const root = join(import.meta.dir, "..")
const specPath = join(root, `src/videos/${id}/narration.json`)
if (!existsSync(specPath)) throw new Error(`Missing ${specPath}`)
const spec = JSON.parse(readFileSync(specPath, "utf8")) as {
  voice?: string // Edge TTS voice name
  rate?: string // Edge TTS speaking rate, e.g. "+10%"
  gap?: number // seconds a clip must end before the next clip starts (default 0.4)
  duration: number
  beats: { start: number; text: string }[]
  elevenlabs?: { voice?: string; model?: string }
}
const gap = spec.gap ?? 0.4

const engine = getArg("--engine") ?? (process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "edge")
if (engine === "elevenlabs" && !process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not set")
const voice =
  getArg("--voice") ??
  (engine === "elevenlabs" ? spec.elevenlabs?.voice ?? "21m00Tcm4TlvDq8ikWAM" : spec.voice ?? "en-US-AriaNeural")
const model = getArg("--model") ?? spec.elevenlabs?.model ?? "eleven_multilingual_v2"
const workDir = join(root, `out/voice-${id}`)
mkdirSync(workDir, { recursive: true })
mkdirSync(join(root, "public"), { recursive: true })

const probe = (file: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim())

async function edgeClip(text: string, out: string) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = new MsEdgeTTS()
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
      const { audioStream } = tts.toStream(text, spec.rate ? { rate: spec.rate } : undefined)
      const file = createWriteStream(out)
      // msedge-tts 2.1.0 raises "Expected 101 status code" from a WebSocket error event that
      // no stream listener sees, so catch it as an uncaught exception while the clip is pending.
      await new Promise<void>((resolve, reject) => {
        process.once("uncaughtException", reject)
        audioStream.pipe(file)
        file.on("finish", () => resolve())
        file.on("error", reject)
        audioStream.on("error", reject)
      }).finally(() => {
        process.removeAllListeners("uncaughtException")
        tts.close?.()
      })
      if (probe(out) > 0.5) return
      throw new Error("empty clip")
    } catch (err) {
      if (attempt === 4) throw err
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}

async function elevenClip(text: string, out: string) {
  // eleven_v3 only accepts stability 0, 0.5 or 1.
  const voice_settings = model === "eleven_v3" ? { stability: 0.5 } : { stability: 0.55, similarity_boost: 0.8 }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, voice_settings }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  writeFileSync(out, Buffer.from(await res.arrayBuffer()))
}

console.log(`[voiceover] ${id}: ${spec.beats.length} beats, engine=${engine}, voice=${voice}${engine === "elevenlabs" ? `, model=${model}` : ""}`)
const clips: { file: string; start: number }[] = []
let overruns = 0
for (const [i, beat] of spec.beats.entries()) {
  const file = join(workDir, `beat-${String(i + 1).padStart(2, "0")}.mp3`)
  if (engine === "elevenlabs") await elevenClip(beat.text, file)
  else {
    try {
      await edgeClip(beat.text, file)
    } catch (err) {
      console.error(`[voiceover] Edge TTS failed on beat ${i + 1} after 4 attempts: ${err instanceof Error ? err.message : err}`)
      console.error("[voiceover] Edge TTS may be refusing the connection. Retry later, or set ELEVENLABS_API_KEY.")
      process.exit(1)
    }
  }
  const len = probe(file)
  const slotEnd = (spec.beats[i + 1]?.start ?? spec.duration) - gap
  const slot = slotEnd - beat.start
  const flag = len > slot ? "  OVERRUNS SLOT" : ""
  if (len > slot) overruns++
  console.log(`  beat ${i + 1}: ${beat.start.toFixed(1)}s -> ends ${(beat.start + len).toFixed(2)}s (clip ${len.toFixed(2)}s / slot ${slot.toFixed(2)}s)${flag}`)
  clips.push({ file, start: beat.start })
}

// Place every clip at its start time, mix (no level normalisation), and trim to the video length.
const inputs = clips.flatMap((c) => ["-i", c.file])
const delays = clips.map((c, i) => `[${i}:a]adelay=${Math.round(c.start * 1000)}:all=1[a${i}]`).join(";")
const mix = `${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0,apad,atrim=0:${spec.duration}[out]`
const output = join(root, `public/${id}-voice.mp3`)
execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", `${delays};${mix}`, "-map", "[out]", "-ar", "48000", "-b:a", "128k", output])
console.log(`Wrote ${output} (${probe(output).toFixed(2)}s)`)
if (overruns) {
  console.error(`${overruns} clip(s) run longer than their slot. Shorten that text or move the next beat's start.`)
  process.exit(2)
}
process.exit(0)
```

Bun may print an "unexpected-response" warning from the Edge connection; the retry loop handles it.
