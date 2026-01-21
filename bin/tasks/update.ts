import { existsSync, unlinkSync } from "fs";

import { getLocalBinPath } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import { installCli } from "./install.js";
import { isInstalledViaBrew, updateViaBrew } from "../utils/brewOperations.js";

/**
 * Update the Aptos CLI to the latest version.
 *
 * If installed via Homebrew, uses `brew upgrade aptos`.
 * Otherwise, compares the currently installed version with the latest release
 * on GitHub and reinstalls if a newer version is available.
 */
export const updateCli = async (): Promise<void> => {
  const binaryPath = getLocalBinPath();

  if (!existsSync(binaryPath)) {
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }

  // If installed via Homebrew, use brew upgrade
  if (isInstalledViaBrew()) {
    updateViaBrew();
    return;
  }

  const latestVersion = await getLatestVersionGh();

  // Get the current version of the CLI
  let currentVersion: string;
  try {
    const versionOutput = String(
      execSyncShell(`"${binaryPath}" --version`, {
        encoding: "utf8",
      })
    ).trim();
    // Version output format: "aptos X.Y.Z"
    currentVersion = versionOutput.split(" ")[1] || "";
  } catch {
    console.error("Warning: Could not determine current CLI version");
    currentVersion = "";
  }

  // Check if the installed version is the latest version
  if (currentVersion === latestVersion) {
    console.log(`CLI is up to date (version ${currentVersion})`);
    return;
  }

  console.log(
    `Updating CLI from version ${currentVersion || "unknown"} to ${latestVersion}...`
  );

  // Remove the old binary before installing the new one
  try {
    unlinkSync(binaryPath);
  } catch {
    console.error(`Warning: Could not remove old binary at ${binaryPath}`);
  }

  await installCli();
};
