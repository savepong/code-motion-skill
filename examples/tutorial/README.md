# Example: code-motion tutorial

[English](README.md) | [ไทย](README.th.md)

The 34-second Thai tutorial about the `/code-motion` skill, made with the skill itself in the
[Manga Page](https://www.futurepedia.io/resources/ai-style-atlas/view) style. Two cuts:

| Composition id      | Size      | Output                       |
| ------------------- | --------- | ---------------------------- |
| `tutorial`          | 1280×720  | `out/tutorial.mp4`           |
| `tutorial-vertical` | 1080×1920 | `out/tutorial-vertical.mp4`  |

## Render it

The Manga Page style files belong to Futurepedia, so they are not in this repo. Get them from the
prompt first:

1. Open the [AI Style Atlas](https://www.futurepedia.io/resources/ai-style-atlas/view), pick
   **Manga Page**, copy its prompt and save it as `prompts/manga-page.md`.
2. Install and extract the style files:

   ```bash
   bun install
   bun run setup-style prompts/manga-page.md   # writes src/lib/harness.js, src/lib/sound.js, src/style/manga.js
   ```

3. Preview or render:

   ```bash
   bun run render tutorial --audio   # sound for the Studio
   bun run studio                    # http://localhost:3000
   bun run render tutorial           # out/tutorial.mp4
   bun run render tutorial-vertical  # out/tutorial-vertical.mp4
   ```

`prompts/`, `src/lib/` and `src/style/` are gitignored so the style files are never committed.

## How it is built

| Path                                 | What                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `src/videos/tutorial/timing.js`      | Page start times and page turns, read by both scripts |
| `src/videos/tutorial/visuals.js`     | Five manga pages, page turns, and the 9:16 panel stacking            |
| `src/videos/tutorial/score.js`       | Every sound, at the same times as the pictures                       |
| `src/videos/tutorial/vertical.js`    | Registers `tutorial-vertical` with a 1080×1920 canvas                |
| `scripts/render.ts`                  | WAV then MP4; `--audio` writes the WAV only                          |
| `scripts/stills.ts`                  | PNGs at given times, for storyboards and checks                      |
| `scripts/voiceover.ts`               | Per-beat narration from `narration.json` to `public/<id>-voice.mp3`  |
| `scripts/setup-style.ts`             | Pulls the third-party style files out of the prompt                  |
| `public/fonts/`                      | Self-hosted fonts and their OFL licences                             |

The style's fonts have no Thai, so Thai text uses Mali (hand lettering) and Kanit (heavy display).

## Voiceover (optional)

The tutorial itself has no narration, but the shell supports it. To add a voice track to a video:

1. Write `src/videos/<id>/narration.json`, one entry per beat, each starting just after its scene:

   ```json
   {
     "voice": "th-TH-PremwadeeNeural",
     "duration": 34,
     "beats": [
       { "start": 0.5, "text": "..." },
       { "start": 7.5, "text": "..." }
     ],
     "elevenlabs": { "voice": "<voice-id>", "model": "eleven_v3" }
   }
   ```

2. Generate it. Edge TTS is free and needs no key; with `ELEVENLABS_API_KEY` set, ElevenLabs is
   used instead (`eleven_v3` for Thai, since `eleven_multilingual_v2` has no Thai). Needs `ffmpeg`.

   ```bash
   bun run voiceover <id>
   ELEVENLABS_API_KEY=your_key bun run voiceover <id>
   ```

   It stops with an error if a beat's narration runs into the next beat.

3. Add `voice: "<id>-voice.mp3"` to the video's registration in `visuals.js`, then render.

A video can also set `fps: 60` in its registration for smoother motion (default 30). Prompts to
ask an agent for a narrated video are in
[prompts/voiceover-video-prompts.md](../../prompts/voiceover-video-prompts.md).
