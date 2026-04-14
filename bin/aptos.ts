#!/usr/bin/env node

// Installation priorities by platform:
//
// macOS:
//   1. Homebrew (if available) - builds for native CPU architecture
//   2. Direct download from GitHub releases
//
// Windows:
//   1. winget (if available)
//   2. Chocolatey (if available)
//   3. Direct download from GitHub releases
//
// Linux:
//   - Direct download from GitHub releases (with Ubuntu version detection)
//
// Use --direct-download or set APTOS_DIRECT_DOWNLOAD=1 to skip package managers.

import { runCLI } from "./tasks/run.js";
import { parseArgs } from "./utils/parseArgs.js";
import { parseCommandOptions } from "./utils/parseCommandOptions.js";

const { install, update, binaryPath, directDownload, rest } = parseArgs(
  process.argv.slice(2),
);

const main = async () => {
  const options = {
    install,
    update,
    binaryPath,
    directDownload:
      directDownload ||
      process.env.APTOS_DIRECT_DOWNLOAD === "1" ||
      process.env.APTOS_DIRECT_DOWNLOAD === "true",
  };

  // Forward --help to the underlying CLI binary
  if (process.argv.includes("--help")) {
    return runCLI(rest, options.binaryPath);
  }

  await parseCommandOptions(options, rest);
};

main().catch(console.error);
