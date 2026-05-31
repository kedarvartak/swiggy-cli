# AI Demo Recorder

Reproducible, narrated product-demo video for the Swiggy CLI frontend. Drives the
real app in a headless Chromium (Playwright), records it to video, and muxes an
AI voiceover on top (ffmpeg). Re-runs produce the same demo — re-record any time
the UI changes.

## How it works

```
storyboard.mjs   ── you edit this (narration + on-screen actions)
      │
      ▼
lib/narrate.mjs  ── TTS each scene → out/audio/*.mp3, out/timings.json, captions.srt
      │
      ▼
record.mjs       ── Playwright drives the app, dwelling each scene = its audio length
      │
      ▼
build.mjs        ── ffmpeg concats audio + muxes onto video → out/demo.mp4
```

The **audio is generated first** so the video can be timed to match it exactly —
no drift between picture and voice.

## One-time setup

```bash
cd demo
npm install            # Chromium binary is already cached; this is quick
```

## Record a demo

```bash
# 1. Start the app (in another terminal)
cd ../frontend && npm run dev      # serves http://localhost:5173

# 2. (optional) real AI voice — otherwise you get a silent, word-timed track
export ELEVENLABS_API_KEY=sk-...

# 3. Run the whole pipeline
cd ../demo && npm run demo         # → out/demo.mp4
```

Individual steps: `npm run demo:voice`, `npm run demo:record`, `npm run demo:build`.

## Editing the demo

Everything you care about lives in **`storyboard.mjs`**: the narration lines and a
small action list per scene (`click`, `goto`, `scroll`, `hover`, `wait`). No need
to touch the Playwright/ffmpeg plumbing.

## Outputs (`out/`, git-ignored)

- `demo.mp4` — the final narrated video
- `captions.srt` — subtitles (handy for YouTube/LinkedIn)
- `video/raw.webm` — silent screen capture
- `audio/*.mp3`, `timings.json` — intermediate artifacts
