// bun run voiceover <id>: one TTS clip per beat, each placed at its beat start, mixed into
// public/<id>-voice.mp3 trimmed to the video length. Narration can't drift or run past the end.
//
// Reads src/videos/<id>/narration.json:
//   { voice, rate?, gap?, duration, beats: [{ start, text }], elevenlabs?: { voice, model? } }
//
// Tries Edge TTS first (free, no key) with `voice` (an Edge voice name such as "th-TH-PremwadeeNeural").
// If Edge fails and ELEVENLABS_API_KEY is set, it regenerates every beat with ElevenLabs, so the
// video keeps one voice, using `elevenlabs.voice` (a voice ID) and `elevenlabs.model` (default
// eleven_multilingual_v2; use eleven_v3 for Thai and other languages multilingual_v2 does not cover).
// Flags override the file: --engine edge|elevenlabs (one engine, no fallback), --voice, --model.
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

const forced = getArg("--engine")
const hasKey = Boolean(process.env.ELEVENLABS_API_KEY)
if (forced === "elevenlabs" && !hasKey) throw new Error("ELEVENLABS_API_KEY is not set")
let engine = forced ?? "edge"
// --voice names a voice for the first engine only; a fallback uses the file's elevenlabs.voice.
const voiceFor = (e: string, flag?: string) =>
  flag ?? (e === "elevenlabs" ? spec.elevenlabs?.voice ?? "21m00Tcm4TlvDq8ikWAM" : spec.voice ?? "en-US-AriaNeural")
let voice = voiceFor(engine, getArg("--voice"))
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
  if (res.status === 402) {
    // Library voices need a paid plan; premade voices work on the free plan.
    throw new Error(`ElevenLabs 402 (voice ${voice} needs a paid plan, pick a premade voice): ${await res.text()}`)
  }
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  writeFileSync(out, Buffer.from(await res.arrayBuffer()))
}

async function makeClips() {
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
        throw new Error(`beat ${i + 1} after 4 attempts: ${err instanceof Error ? err.message : err}`)
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
  return { clips, overruns }
}

let result: Awaited<ReturnType<typeof makeClips>>
try {
  result = await makeClips()
} catch (err) {
  if (engine !== "edge") throw err
  console.error(`[voiceover] Edge TTS failed on ${err instanceof Error ? err.message : err}`)
  if (forced || !hasKey) {
    console.error("[voiceover] Edge TTS may be refusing the connection. Retry later, or set ELEVENLABS_API_KEY in .env.")
    process.exit(1)
  }
  // Redo every beat so the whole video uses one voice.
  console.error("[voiceover] Falling back to ElevenLabs for every beat.")
  engine = "elevenlabs"
  voice = voiceFor(engine)
  result = await makeClips()
}
const { clips, overruns } = result

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
