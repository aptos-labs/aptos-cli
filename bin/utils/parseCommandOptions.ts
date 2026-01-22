import { existsSync } from "fs";
import { installCli } from "../tasks/install.js";
import { runCLI } from "../tasks/run.js";
import { updateCli } from "../tasks/update.js";
import { getLocalBinPath } from "./getLocalBinPath.js";

interface CommandOptions {
  install: boolean;
  update: boolean;
  binaryPath?: string;
  directDownload?: boolean;
}

/**
 * Parse and handle command options for the Aptos CLI wrapper.
 * @param options - The parsed command options
 * @param unknownOptions - Additional arguments to pass through to the CLI
 */
export const parseCommandOptions = async (
  options: CommandOptions,
  unknownOptions: string[]
): Promise<void> => {
  // if `--install` flag is set, only install the cli and don't run it
  if (options.install) {
    await installCli(options.directDownload);
    return;
  }
  // if `--update` flag is set, update the cli and don't run it
  if (options.update) {
    await updateCli(options.directDownload);
    return;
  }

  // if no flags are set, install and run the cli
  const path = options.binaryPath || getLocalBinPath();
  if (!options.binaryPath && !existsSync(path)) {
    await installCli(options.directDownload);
  }
  await runCLI(unknownOptions, options.binaryPath);
};
