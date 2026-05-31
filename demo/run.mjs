// One command to rule them all: narrate -> record -> build.
// Requires the frontend dev server to be running (npm run dev in ../frontend).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "./storyboard.mjs";

const execFileP = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

async function isServerUp() {
  try {
    const ctrl = AbortSignal.timeout(2000);
    const res = await fetch(config.baseUrl, { signal: ctrl });
    return res.ok;
  } catch { return false; }
}

async function step(name, file) {
  console.log(`\n=== ${name} ===`);
  const { stdout, stderr } = await execFileP("node", [join(HERE, file)], { env: process.env });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function main() {
  if (!(await isServerUp())) {
    console.error(`✗ Dev server not reachable at ${config.baseUrl}.`);
    console.error(`  Start it first:  (cd ../frontend && npm run dev)`);
    process.exit(1);
  }
  await step("1/3  Narration", "lib/narrate.mjs");
  await step("2/3  Recording", "record.mjs");
  await step("3/3  Build", "build.mjs");
  console.log("\n🎬  All done → demo/out/demo.mp4");
}

main().catch((err) => { console.error(err); process.exit(1); });
