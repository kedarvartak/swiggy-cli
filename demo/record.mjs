// Drives the app in a real browser and records it to video, dwelling on each
// scene for the duration computed by narrate.mjs (out/timings.json).
// Output: demo/out/video/raw.webm
import { readFile, mkdir, rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { config, scenes } from "./storyboard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const VIDEO_DIR = join(OUT, "video");

// --- action interpreter: maps the storyboard's declarative actions to Playwright
async function runAction(page, action) {
  switch (action.type) {
    case "goto":
      await page.evaluate((h) => { window.location.hash = h; }, action.hash);
      break;
    case "click": {
      // Try a real on-camera click; fall back silently if the selector drifted.
      // Prefer a button role (the Hero CTA wraps its label in a <span>), then
      // any element containing the text. Wait for it and scroll it into view so
      // entrance animations don't make the click flaky.
      const byRole = page.getByRole("button", { name: action.text });
      const el = (await byRole.count()) ? byRole.first()
        : page.getByText(action.text, { exact: false }).first();
      try {
        await el.waitFor({ state: "visible", timeout: 5000 });
        await el.scrollIntoViewIfNeeded();
        await el.click({ timeout: 5000 });
      } catch { console.warn(`   (click "${action.text}" missed — relying on goto fallback)`); }
      break;
    }
    case "hover":
      try { await page.getByText(action.text, { exact: false }).first().hover({ timeout: 2500 }); } catch {}
      break;
    case "scroll": {
      const target = action.to === "bottom" ? "document.body.scrollHeight"
        : action.to === "top" ? "0" : String(Number(action.to) || 0);
      await page.evaluate((t) => window.scrollTo({ top: eval(t), behavior: "smooth" }), target);
      break;
    }
    case "wait":
      await page.waitForTimeout(action.ms ?? 500);
      break;
    default:
      console.warn(`   (unknown action type: ${action.type})`);
  }
}

async function main() {
  await mkdir(VIDEO_DIR, { recursive: true });

  let timings;
  try {
    timings = JSON.parse(await readFile(join(OUT, "timings.json"), "utf8"));
  } catch {
    console.error("✗ out/timings.json not found. Run `npm run demo:voice` first.");
    process.exit(1);
  }
  const dwellById = Object.fromEntries(timings.scenes.map((s) => [s.id, s.dwellSec]));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: config.viewport,
    recordVideo: { dir: VIDEO_DIR, size: config.viewport },
  });
  const page = await context.newPage();

  // Clear any prior capture so a stale file can never be muxed by mistake.
  await rm(join(VIDEO_DIR, "raw.webm"), { force: true });

  console.log(`▶  Recording ${scenes.length} scenes at ${config.baseUrl} …`);
  await page.goto(config.baseUrl, { waitUntil: "networkidle" });

  for (const scene of scenes) {
    // Each scene must occupy EXACTLY its audio segment (dwellSec) so the video
    // stays frame-aligned with the narration. Actions consume real wall-clock
    // time, so we subtract that from the hold rather than adding it on top.
    const dwellMs = Math.round((dwellById[scene.id] ?? 3) * 1000);
    const start = Date.now();
    for (const action of scene.actions ?? []) await runAction(page, action);
    const remaining = dwellMs - (Date.now() - start);
    if (remaining < 0) console.warn(`   ! ${scene.id} actions (${-remaining}ms) overran its narration window`);
    console.log(`   • ${scene.id}  (scene ${(dwellMs / 1000).toFixed(1)}s, hold ${(Math.max(0, remaining) / 1000).toFixed(1)}s)`);
    await page.waitForTimeout(Math.max(0, remaining));
  }

  // Ask Playwright for THIS session's exact video path (it uses a random hash
  // name); the file is only flushed to disk once the context closes.
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  await rename(videoPath, join(VIDEO_DIR, "raw.webm"));
  console.log(`✓ Recorded → demo/out/video/raw.webm`);
}

main().catch((err) => { console.error(err); process.exit(1); });
