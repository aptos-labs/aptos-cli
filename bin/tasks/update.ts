import { existsSync, unlinkSync } from "fs";

import { getLocalBinPath } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import { installCli } from "./install.js";
import { isInstalledViaBrew, updateViaBrew } from "../utils/brewOperations.js";
import {
  isInstalledViaWinget,
  isInstalledViaChoco,
  updateViaWinget,
  updateViaChoco,
} from "../utils/windowsPackageManagers.js";

/**
 * Update the Aptos CLI to the latest version.
 *
 * Update methods by installation type:
 * - Homebrew: `brew upgrade aptos`
 * - winget: `winget upgrade`
 * - Chocolatey: `choco upgrade`
 * - Direct download: Compare versions and reinstall if newer
 *
 * @param directDownload - If true, skip package manager updates and force direct download
 */
export const updateCli = async (
  directDownload: boolean = false
): Promise<void> => {
  const binaryPath = getLocalBinPath();

  if (!existsSync(binaryPath)) {
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }

  // Check for package manager installations (unless directDownload is set)
  if (!directDownload) {
    // If installed via Homebrew, use brew upgrade
    if (isInstalledViaBrew()) {
      updateViaBrew();
      return;
    }

    // If installed via winget, use winget upgrade
    if (isInstalledViaWinget()) {
      updateViaWinget();
      return;
    }

    // If installed via Chocolatey, use choco upgrade
    if (isInstalledViaChoco()) {
      updateViaChoco();
      return;
    }
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

  await installCli(directDownload);
};
