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

import { program } from "commander";

import { parseCommandOptions } from "./utils/parseCommandOptions.js";
import { runCLI } from "./tasks/run.js";

program
  .name("aptos")
  .helpOption(false)
  .option("-i, --install", "install the latest version of the CLI")
  .option("-u, --update", "update the CLI to the latest version")
  .option("-b, --binary-path <path>", "path to an existing Aptos CLI binary")
  .option(
    "-d, --direct-download",
    "skip package managers and download directly from GitHub"
  )
  .allowUnknownOption();

program.parse(process.argv);

const main = async () => {
  const options = {
    install: program.opts().install,
    update: program.opts().update,
    binaryPath: program.opts().binaryPath,
    directDownload:
      program.opts().directDownload ||
      process.env.APTOS_DIRECT_DOWNLOAD === "1" ||
      process.env.APTOS_DIRECT_DOWNLOAD === "true",
  };
  const unknownOptions = program.args;

  // Manually check for `--help` and handle the CLI `--help`
  if (process.argv.includes("--help")) {
    // Forward to the CLI
    return runCLI(unknownOptions, options.binaryPath);
  }

  await parseCommandOptions(options, unknownOptions);
};

main().catch(console.error);
