import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { getCliPathBrew, isInstalledViaBrew } from "./brewOperations.js";
import { getOS } from "./getUserOs.js";
import {
  getCliPathChoco,
  getCliPathWinget,
  isInstalledViaChoco,
  isInstalledViaWinget,
} from "./windowsPackageManagers.js";

/**
 * Path to the cached binary location file.
 * Avoids expensive shell spawns (brew --prefix, winget list) on every run.
 */
const getCachePath = (): string => {
  if (getOS() === "Windows") {
    return join(homedir(), ".aptoscli", ".bin-path-cache");
  }
  return join(homedir(), ".local", "share", "aptos-cli", ".bin-path-cache");
};

const readCachedBinPath = (): string | undefined => {
  try {
    const cached = readFileSync(getCachePath(), "utf8").trim();
    if (cached && existsSync(cached)) {
      return cached;
    }
  } catch {
    // No cache or unreadable
  }
  return undefined;
};

const writeCachedBinPath = (binPath: string): void => {
  try {
    const cachePath = getCachePath();
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, binPath, "utf8");
  } catch {
    // Non-fatal — caching is best-effort
  }
};

/**
 * Invalidate the cached binary path.
 * Call this when install or update changes the binary location.
 */
export const invalidateBinPathCache = (): void => {
  try {
    unlinkSync(getCachePath());
  } catch {
    // No cache to invalidate
  }
};

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
 * Uses a file-based cache to avoid expensive shell spawns (brew --prefix,
 * winget list) on every invocation. The cache is invalidated by install
 * and update tasks.
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
  // Fast path: return cached binary location if still valid
  const cached = readCachedBinPath();
  if (cached) {
    return cached;
  }

  const os = getOS();

  // On macOS, prefer Homebrew installation if it exists
  if (os === "MacOS") {
    if (isInstalledViaBrew()) {
      try {
        const brewPath = getCliPathBrew();
        writeCachedBinPath(brewPath);
        return brewPath;
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
        writeCachedBinPath(wingetPath);
        return wingetPath;
      }
    }

    if (isInstalledViaChoco()) {
      const chocoPath = getCliPathChoco();
      if (chocoPath) {
        writeCachedBinPath(chocoPath);
        return chocoPath;
      }
    }
  }

  const binDir = getBinDir();
  const binaryName = os === "Windows" ? "aptos.exe" : "aptos";
  const defaultPath = join(binDir, binaryName);
  writeCachedBinPath(defaultPath);
  return defaultPath;
};
