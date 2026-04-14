import { existsSync, unlinkSync } from "node:fs";
import { isInstalledViaBrew, updateViaBrew } from "../utils/brewOperations.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import {
  getLocalBinPath,
  invalidateBinPathCache,
} from "../utils/getLocalBinPath.js";
import { getTargetPlatform } from "../utils/getUserOs.js";
import {
  getCliVersion,
  hasUserSpecifiedVersion,
} from "../utils/ghOperations.js";
import {
  isInstalledViaChoco,
  isInstalledViaWinget,
  updateViaChoco,
  updateViaWinget,
} from "../utils/windowsPackageManagers.js";
import { installCli } from "./install.js";

/**
 * Update the Aptos CLI to the latest version (or a specific version if APTOS_CLI_VERSION is set).
 *
 * Update methods by installation type:
 * - Homebrew: `brew upgrade aptos`
 * - winget: `winget upgrade`
 * - Chocolatey: `choco upgrade`
 * - Direct download: Compare versions and reinstall if newer/different
 *
 * Note: When APTOS_CLI_VERSION is set, package managers are skipped and the
 * specified version is downloaded directly from GitHub releases.
 *
 * @param directDownload - If true, skip package manager updates and force direct download
 */
export const updateCli = async (
  directDownload: boolean = false,
): Promise<void> => {
  invalidateBinPathCache();
  const binaryPath = getLocalBinPath();

  if (!existsSync(binaryPath)) {
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install",
    );
    return;
  }

  // If a specific version is requested, force direct download
  const useDirectDownload = directDownload || hasUserSpecifiedVersion();

  if (useDirectDownload && hasUserSpecifiedVersion()) {
    console.log(
      `Using specified version from APTOS_CLI_VERSION: ${process.env.APTOS_CLI_VERSION}`,
    );
  }

  // Check for package manager installations (unless directDownload is set or specific version requested)
  if (!useDirectDownload) {
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

  // Get target platform for version validation
  const targetPlatform = getTargetPlatform();

  // Get the target version (user-specified or latest)
  const targetVersion = await getCliVersion(targetPlatform);

  // Get the current version of the CLI
  let currentVersion: string;
  try {
    const versionOutput = String(
      execSyncShell(`"${binaryPath}" --version`, {
        encoding: "utf8",
      }),
    ).trim();
    // Extract semver from output (e.g. "aptos 4.5.0" or "aptos-cli 4.5.0")
    const match = versionOutput.match(/(\d+\.\d+\.\d+)/);
    currentVersion = match?.[1] ?? "";
  } catch {
    console.error("Warning: Could not determine current CLI version");
    currentVersion = "";
  }

  // Check if the installed version matches the target version
  if (currentVersion === targetVersion) {
    if (hasUserSpecifiedVersion()) {
      console.log(
        `CLI is already at the specified version (${currentVersion})`,
      );
    } else {
      console.log(`CLI is up to date (version ${currentVersion})`);
    }
    return;
  }

  const updateDescription = hasUserSpecifiedVersion()
    ? `Switching CLI from version ${currentVersion || "unknown"} to ${targetVersion}...`
    : `Updating CLI from version ${currentVersion || "unknown"} to ${targetVersion}...`;

  console.log(updateDescription);

  // Remove the old binary before installing the new one
  try {
    unlinkSync(binaryPath);
  } catch {
    console.error(`Warning: Could not remove old binary at ${binaryPath}`);
  }

  await installCli(useDirectDownload);
};
