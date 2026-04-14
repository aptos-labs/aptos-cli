export interface ParsedArgs {
  install: boolean;
  update: boolean;
  binaryPath?: string;
  directDownload: boolean;
  rest: string[];
}

/**
 * Parse CLI arguments, extracting known flags and collecting
 * everything else as pass-through args for the underlying binary.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    install: false,
    update: false,
    directDownload: false,
    rest: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-i":
      case "--install":
        result.install = true;
        break;
      case "-u":
      case "--update":
        result.update = true;
        break;
      case "-d":
      case "--direct-download":
        result.directDownload = true;
        break;
      case "-b":
      case "--binary-path": {
        const next = argv[++i];
        if (!next) {
          console.error("error: --binary-path requires a path argument");
          process.exit(1);
        }
        result.binaryPath = next;
        break;
      }
      default:
        result.rest.push(arg);
    }
  }

  return result;
}
