export interface ParsedArgs {
  command: string;
  positionals: string[];
  options: Map<string, string | boolean>;
}

export function parseArgv(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const positionals: string[] = [];
  const options = new Map<string, string | boolean>();

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index];
    if (!current.startsWith("--")) {
      positionals.push(current);
      continue;
    }

    const key = current.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      options.set(key, true);
      continue;
    }

    options.set(key, next);
    index += 1;
  }

  return { command, positionals, options };
}
