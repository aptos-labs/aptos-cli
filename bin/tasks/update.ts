import { existsSync } from "fs";

import { getLocalBinPath } from "../utils/getLocalBinPath.js";
import { execSync } from "child_process";
import { getOS } from "../utils/getUserOs.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import { installCli } from "./install.js";

export const updateCli = async () => {
  const path = getLocalBinPath();

  if (!existsSync(path)) {
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }

  if (getOS() === "MacOS") {
    // Upgrade aptos via brew.
    return execSync("brew upgrade aptos");
  } else {
    const latestVersion = await getLatestVersionGh();
    // Get the current version of the CLI.
    const currentVersion = execSyncShell(`${path} --version`, {
      encoding: "utf8",
    })
      .trim()
      .split(" ")[1];
    // Check if the installed version is the latest version.
    if (currentVersion !== latestVersion) {
      console.log(
        `A newer version of the CLI is available: ${latestVersion}, installing...`
      );
      installCli();
    } else {
      console.log(`CLI is up to date`);
    }
  }
};
