// Generates one audio clip per scene and records its exact duration.
//   - With ELEVENLABS_API_KEY set  -> real AI voiceover (mp3 per scene).
//   - Without a key                -> a silent clip sized by word count, so the
//                                     video still builds and can be dubbed later.
// Output: demo/out/audio/<id>.mp3  +  demo/out/timings.json  +  demo/out/captions.srt
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config, scenes } from "../storyboard.mjs";

const execFileP = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "out");
const AUDIO_DIR = join(OUT, "audio");

async function ffprobeDuration(file) {
  const { stdout } = await execFileP("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return parseFloat(stdout.trim());
}

// Synthesize one scene's narration into `file`. Returns nothing; writes the file.
async function synthElevenLabs(text, file, apiKey) {
  const { voiceId, modelId } = config.voice;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

// Build a silent mp3 of `seconds` length as a stand-in when there is no TTS key.
async function synthSilence(seconds, file) {
  await execFileP("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-t", seconds.toFixed(2), "-q:a", "9", file,
  ]);
}

function estimateSeconds(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, (words / config.fallbackWpm) * 60);
}

function srtTimestamp(totalSec) {
  const ms = Math.round((totalSec % 1) * 1000);
  const s = Math.floor(totalSec) % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(ms, 3)}`;
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const useTTS = config.voice.provider === "elevenlabs" && apiKey;
  console.log(useTTS ? "🎙  Using ElevenLabs voice." : "🔇 No TTS key — generating silent, word-timed track.");

  const timings = [];
  const srt = [];
  let clock = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const text = scene.narration?.trim() || "";
    const file = join(AUDIO_DIR, `${scene.id}.mp3`);

    if (text === "TODO" || text === "") {
      console.warn(`⚠  Scene "${scene.id}" has no narration yet — using a 3s silent placeholder.`);
      await synthSilence(3, file);
    } else if (useTTS) {
      process.stdout.write(`   → ${scene.id} … `);
      await synthElevenLabs(text, file, apiKey);
      console.log("done");
    } else {
      await synthSilence(estimateSeconds(text), file);
    }

    const dur = await ffprobeDuration(file);
    const dwell = dur + config.paddingSec;
    timings.push({ id: scene.id, audio: `audio/${scene.id}.mp3`, durationSec: dur, dwellSec: dwell });

    if (text && text !== "TODO") {
      srt.push(`${i + 1}\n${srtTimestamp(clock)} --> ${srtTimestamp(clock + dur)}\n${text}\n`);
    }
    clock += dwell;
  }

  await writeFile(join(OUT, "timings.json"), JSON.stringify({ paddingSec: config.paddingSec, scenes: timings }, null, 2));
  await writeFile(join(OUT, "captions.srt"), srt.join("\n"));
  console.log(`\n✓ Narration ready. Total ≈ ${clock.toFixed(1)}s across ${scenes.length} scenes.`);
  console.log(`  timings.json + captions.srt written to demo/out/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
