#!/usr/bin/env node

// On MacOS we install the CLI with brew. There are two main reasons for this:
// 1. Brew builds the CLI for the native CPU architecture for the user, which
//    eliminates any issues arising from using x86 binaries on ARM machines.
// 2. Brew handles dependency management for us. This isn't relevant right now but
//    might become necessary later if we reintroduce OpenSSL as a dep for the CLI.
//
// On Linux and Windows we just query the GH API for the latest CLI release and
// download and extract that.

import { program } from "commander";

import { parseCommandOptions } from "./utils/parseCommandOptions.js";
import { runCLI } from "./tasks/run.js";

program
  .name("aptos")
  .helpOption(false)
  .option("-i, --install", "install the latest version of the CLI")
  .option("-u, --update", "update the CLI to the latest version")
  .allowUnknownOption();

program.parse(process.argv);

const main = async () => {
  const options = {
    install: program.opts().install,
    update: program.opts().update,
  };
  const unknownOptions = program.args;

  // Manually check for `--help` and handle the CLI `--help`
  if (process.argv.includes("--help")) {
    // Forward to the CLI
    return runCLI(unknownOptions);
  }

  await parseCommandOptions(options, unknownOptions);
};

main().catch(console.error);
