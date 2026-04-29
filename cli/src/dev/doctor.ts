#!/usr/bin/env node

import process from "node:process";

/**
 * Prints a readable validation report for the CLI to backend connection.
 */
async function main(): Promise<number> {
  const baseUrl = process.env.SWIGGY_BACKEND_URL?.trim() || "http://127.0.0.1:8000";

  process.stdout.write("Swiggy CLI Environment Doctor\n");
  process.stdout.write("============================\n");
  process.stdout.write(`Configured backend URL: ${baseUrl}\n`);

  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      process.stdout.write("Status: FAILED\n");
      process.stdout.write(`Reason: Backend returned HTTP ${response.status}.\n`);
      process.stdout.write("Action: Start the backend service and verify SWIGGY_BACKEND_URL.\n");
      return 1;
    }

    const body = (await response.json()) as { status?: string };
    process.stdout.write(`Backend health: ${body.status ?? "unknown"}\n`);
    process.stdout.write("Status: OK\n");
    return 0;
  } catch (error) {
    process.stdout.write("Status: FAILED\n");
    process.stdout.write(
      `Reason: ${error instanceof Error ? error.message : "Unable to reach backend."}\n`,
    );
    process.stdout.write("Action: Start the backend service and verify SWIGGY_BACKEND_URL.\n");
    return 1;
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
