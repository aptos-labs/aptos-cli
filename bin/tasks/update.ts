import { existsSync, unlinkSync } from "fs";

import { getLocalBinPath } from "../utils/getLocalBinPath.js";
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
    execSyncShell("brew upgrade aptos", { stdio: "inherit" });
    return;
  } else {
    const latestVersion = await getLatestVersionGh();
    // Get the current version of the CLI.
    const currentVersion = String(
      execSyncShell(`"${path}" --version`, {
        encoding: "utf8",
      })
    )
      .trim()
      .split(" ")[1];
    // Check if the installed version is the latest version.
    if (currentVersion !== latestVersion) {
      console.log(
        `A newer version of the CLI is available: ${latestVersion}, installing...`
      );
      // Remove the old binary before installing the new one
      try {
        unlinkSync(path);
      } catch (error) {
        console.error(`Warning: Could not remove old binary at ${path}`);
      }
      await installCli();
    } else {
      console.log(`CLI is up to date`);
    }
  }
};
