import { existsSync } from "fs";

import { execSyncShell } from "../utils/execSyncShell.js";
import { getLatestVersion } from "../utils/getAptosCliLatestVersion.js";
import { installCli } from "./install.js";
import { getLocalBinPath } from "../utils/getLocalBinPath.js";

export const updateCli = async () => {
  const path = getLocalBinPath();
  if (!existsSync(path)) {
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }
  // Look up the latest version.
  const latestVersion = await getLatestVersion();
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
};
