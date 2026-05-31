// Stitches the per-scene narration clips into one track and muxes it onto the
// recorded video, producing a final, shareable MP4 (H.264 + AAC).
// Output: demo/out/demo.mp4
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const execFileP = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");

async function main() {
  const timings = JSON.parse(await readFile(join(OUT, "timings.json"), "utf8"));
  const padding = timings.paddingSec ?? 0;

  // Build a concat list: each scene's audio, followed by `padding` of silence,
  // so the audio timeline matches the recorder's per-scene dwell exactly.
  const silence = join(OUT, "audio", "_pad.mp3");
  await execFileP("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-t", padding.toFixed(2), "-q:a", "9", silence,
  ]);

  const lines = [];
  for (const s of timings.scenes) {
    lines.push(`file '${join(OUT, s.audio)}'`);
    if (padding > 0) lines.push(`file '${silence}'`);
  }
  const listFile = join(OUT, "audio", "concat.txt");
  await writeFile(listFile, lines.join("\n"));

  const fullAudio = join(OUT, "audio", "narration.mp3");
  await execFileP("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", fullAudio]);

  // Mux: re-encode the webm to mp4/H.264, attach the narration, stop at the
  // shorter stream so there's no trailing dead air.
  const out = join(OUT, "demo.mp4");
  await execFileP("ffmpeg", [
    "-y",
    "-i", join(OUT, "video", "raw.webm"),
    "-i", fullAudio,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart",
    out,
  ]);
  console.log(`✓ Final demo → demo/out/demo.mp4`);
}

main().catch((err) => { console.error(err); process.exit(1); });
