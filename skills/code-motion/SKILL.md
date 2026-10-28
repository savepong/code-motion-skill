---
name: code-motion
description: Make, edit or re-render product videos as code — canvas visuals and Web Audio sound, rendered to MP4 with Remotion, styled from an AI Style Atlas prompt. Use when the user asks for a trailer, explainer, promo or social clip of their product, wants to change one, or wants a lost MP4 rendered again.
---

# Code motion

A video is two plain browser scripts plus a thin Remotion shell:

- `src/videos/<id>/visuals.js` — `draw(ctx, W, H, t)` paints the frame at time `t` (seconds).
- `src/videos/<id>/score.js` — `score(k)` schedules every sound with the style's synth kit.

Every frame is a pure function of `t` and all sound is synthesized, so the MP4 and WAV are build
output: never commit them, re-render instead.

## Pick the workflow

| Request                              | Workflow                         |
| ------------------------------------ | -------------------------------- |
| First video in this repo             | [Set up](#set-up), then New video |
| New video                            | [New video](#new-video)          |
| Change text, numbers or scenes       | [Edit](#edit-a-video)            |
| "I lost the MP4", "render it again"  | [Re-render](#re-render)          |

## Set up

Only if there is no video app yet. Ask where it should live (default `apps/video` in a monorepo,
`video/` otherwise), then ask before installing packages. Create the shell from
[REFERENCE.md](REFERENCE.md).

## New video

1. **Brief.** Get topic and audience, language, length (default 20–30 s), aspect ratio (16:9,
   9:16 or both; see REFERENCE.md), frame rate (30 by default, 60 for smoother motion), brand
   assets (logo file if any, fonts, colours), and whether they want voiceover narration (free
   Edge TTS by default, ElevenLabs if `ELEVENLABS_API_KEY` is set) on top of the synthesized
   sound, and if so the voice style (gender, accent, tone). Pick the voice and ElevenLabs model
   from the tables in REFERENCE.md. Ask once, in a single question, for whatever is missing.
2. **Style prompt.** Ask the user to pick a style on
   https://www.futurepedia.io/resources/ai-style-atlas/view, copy its prompt, and save it as
   `prompts/<style>.md`. Read all of it: its reference code, helper library and sound kit are the
   style guide. Copy the helper library and sound kit into `src/lib/` unchanged.
3. **Facts.** Take features and wording from the codebase and its docs, not from memory. Any number
   you invent is listed as illustrative in the storyboard and the README.
4. **Storyboard first.** Write an HTML page outside the repo with one canvas panel per beat (6–10),
   drawn with the style's own functions. Under each: time range, exact on-screen text, transition,
   key sounds, and the narration for that beat if there is a voiceover. Keep each beat's narration
   inside its time range (about 2.2 English words per second) and name the exact voice. Show it
   (artifact if your tools allow, else the file path) and wait for approval.
5. **Build** `src/videos/<id>/visuals.js` and `score.js` as storyboarded, and register the id in
   `src/videos/index.ts`. Sound event times must match visual event times exactly. For a
   voiceover, write `narration.json` with one entry per beat and run `bun run voiceover <id>`
   (see REFERENCE.md); fix any beat it reports as overrunning before you go on.
6. **Preview.** Run `bun run render <id> --audio`, then `bun run studio`, and tell the user they can
   scrub it at http://localhost:3000. Run the checklist below.
7. **Render** with `bun run render <id>`.
8. **Ship.** Commit on a branch. Push or open a PR only when asked. Suggest attaching the MP4 to
   the PR.

## Edit a video

Change `visuals.js`. If any event time moves, move the matching sound in `score.js` by the same
amount, and the matching `start` in `narration.json` if there is one (then run
`bun run voiceover <id>` again). Run the checklist on the changed beats, then re-render.

## Re-render

```bash
bun install
bun run voiceover <id>   # only if the video has narration.json
bun run render <id>      # writes public/<id>.wav, then out/<id>.mp4
```

For an older version, check out its commit in a worktree first. The result matches in picture and
sound but is not byte-identical (float rounding moves a few audio samples by 1 LSB).

## Checklist before every render

Render stills with `bun run stills <id> 0 <one time per beat> <last>` and look at each one:

- [ ] No text overflows its box or overlaps another label (the most common bug).
- [ ] Frame 0 is a clean cover, not half-drawn objects.
- [ ] Every font the video uses is in `public/fonts/fonts.css` and `FONT_SPECS`; otherwise it
      silently renders in a fallback font.
- [ ] Non-Latin scripts render in the intended font: no tofu boxes, no clipped marks above or below.
- [ ] The logo, if the brand has one, is the real file, not redrawn.
- [ ] Every number is real or marked illustrative.
- [ ] With a voiceover: `bun run voiceover <id>` exits 0 (no beat overruns), it used the voice the
      storyboard named, and `public/<id>-voice.mp3` is no longer than the video.
- [ ] Mix mode: a video with `voice` renders its score with `{ voiceover: true }` (ducked under
      the narration), one without renders with `{}`. Say which mode was used.
- [ ] Every sound the score asks for is supported by the sound kit in `src/lib/`; unsupported
      options are silently ignored, so listen to the WAV.

## Rules

- Deterministic frames: seeded RNG only, never `Math.random()` or `Date.now()`.
- Self-host fonts in `public/fonts/` so renders work offline and stay the same. If the style's
  fonts lack the video's script (Thai, Japanese…), add a matching font for that script only; see
  REFERENCE.md.
- Keep `prompts/` verbatim: add it to `.prettierignore`.
- Ask before installing packages. Never commit `out/`, `public/*.wav` or `public/*.mp3`.
