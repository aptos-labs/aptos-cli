import { existsSync } from "fs";
import { installCli } from "../tasks/install.js";
import { runCLI } from "../tasks/run.js";
import { updateCli } from "../tasks/update.js";
import { getLocalBinPath } from "./getLocalBinPath.js";

export const parseCommandOptions = async (
  options: { install: boolean; update: boolean },
  unknownOptions: string[]
) => {
  // if `--install` flag is set, only install the cli and dont run it
  if (options.install) {
    await installCli();
    return;
  }
  // if `--update` flag is set, update the cli and dont run it
  if (options.update) {
    await updateCli();
    return;
  }

  // if no flags are set, install and run the cli
  const path = getLocalBinPath();
  if (!existsSync(path)) {
    await installCli();
  }
  await runCLI(unknownOptions);
};
