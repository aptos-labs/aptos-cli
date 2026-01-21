import { join } from "path";
import { homedir } from "os";
import { getOS } from "./getUserOs.js";
import { isInstalledViaBrew, getCliPathBrew } from "./brewOperations.js";
import {
  isInstalledViaWinget,
  isInstalledViaChoco,
  getCliPathWinget,
  getCliPathChoco,
} from "./windowsPackageManagers.js";

/**
 * Get the binary directory path where the CLI should be installed.
 * Matches the official Aptos CLI install scripts:
 * - macOS/Linux: ~/.local/bin
 * - Windows: $USERPROFILE\.aptoscli\bin
 */
export const getBinDir = (): string => {
  const os = getOS();

  if (os === "Windows") {
    // Match official Windows script: $env:USERPROFILE\.aptoscli\bin
    return join(homedir(), ".aptoscli", "bin");
  }

  // Match official Unix script: $HOME/.local/bin
  return join(homedir(), ".local", "bin");
};

/**
 * Get the full path to the Aptos CLI binary.
 *
 * Checks for package manager installations first:
 * - macOS: Homebrew
 * - Windows: winget, then Chocolatey
 *
 * Otherwise uses the standard paths:
 * - macOS/Linux: ~/.local/bin/aptos
 * - Windows: $USERPROFILE\.aptoscli\bin\aptos.exe
 */
export const getLocalBinPath = (): string => {
  const os = getOS();

  // On macOS, prefer Homebrew installation if it exists
  if (os === "MacOS") {
    if (isInstalledViaBrew()) {
      try {
        return getCliPathBrew();
      } catch {
        // Fall through to default path
      }
    }
  }

  // On Windows, check for winget or Chocolatey installations
  if (os === "Windows") {
    if (isInstalledViaWinget()) {
      const wingetPath = getCliPathWinget();
      if (wingetPath) {
        return wingetPath;
      }
    }

    if (isInstalledViaChoco()) {
      const chocoPath = getCliPathChoco();
      if (chocoPath) {
        return chocoPath;
      }
    }
  }

  const binDir = getBinDir();
  const binaryName = os === "Windows" ? "aptos.exe" : "aptos";
  return join(binDir, binaryName);
};
