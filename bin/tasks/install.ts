import { execFileSync, execSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  installViaBrew,
  isBrewAvailable,
  isInstalledViaBrew,
} from "../utils/brewOperations.js";
import { GH_CLI_DOWNLOAD_URL, PNAME } from "../utils/consts.js";
import {
  getBinDir,
  getLocalBinPath,
  invalidateBinPathCache,
} from "../utils/getLocalBinPath.js";
import { getPlatformInfo, getTargetPlatform } from "../utils/getUserOs.js";
import {
  getCliVersion,
  hasUserSpecifiedVersion,
} from "../utils/ghOperations.js";
import {
  installViaChoco,
  installViaWinget,
  isChocoAvailable,
  isInstalledViaChoco,
  isInstalledViaWinget,
  isWingetAvailable,
} from "../utils/windowsPackageManagers.js";

/**
 * Install the Aptos CLI.
 *
 * Installation priority:
 *
 * macOS:
 *   1. Homebrew (if available)
 *   2. Direct download from GitHub releases
 *
 * Windows:
 *   1. winget (if available)
 *   2. Chocolatey (if available)
 *   3. Direct download from GitHub releases
 *
 * Linux:
 *   - Direct download from GitHub releases
 *
 * Note: When APTOS_CLI_VERSION is set, package managers are skipped and the
 * specified version is downloaded directly from GitHub releases.
 *
 * @param directDownload - If true, skip package managers and download directly
 */
export const installCli = async (
  directDownload: boolean = false,
): Promise<void> => {
  invalidateBinPathCache();
  const { os } = getPlatformInfo();

  // If a specific version is requested, force direct download
  // Package managers don't support installing specific versions
  const useDirectDownload = directDownload || hasUserSpecifiedVersion();

  if (useDirectDownload && hasUserSpecifiedVersion()) {
    console.log(
      `Using specified version from APTOS_CLI_VERSION: ${process.env.APTOS_CLI_VERSION}`,
    );
  }

  // Skip package managers if directDownload is set or specific version requested
  if (!useDirectDownload) {
    // On macOS, prefer Homebrew if available
    if (os === "macos" && isBrewAvailable()) {
      if (isInstalledViaBrew()) {
        console.log("Aptos CLI is already installed via Homebrew");
        return;
      }
      installViaBrew();
      return;
    }

    // On Windows, prefer winget, then Chocolatey
    if (os === "windows") {
      if (isWingetAvailable()) {
        if (isInstalledViaWinget()) {
          console.log("Aptos CLI is already installed via winget");
          return;
        }
        installViaWinget();
        return;
      }

      if (isChocoAvailable()) {
        if (isInstalledViaChoco()) {
          console.log("Aptos CLI is already installed via Chocolatey");
          return;
        }
        installViaChoco();
        return;
      }
    }
  }

  // Direct download installation
  const binaryPath = getLocalBinPath();
  if (existsSync(binaryPath)) {
    console.log("Aptos CLI is already installed");
    return;
  }

  // Ensure the bin directory exists
  const binDir = getBinDir();
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }

  // Get target platform first for version validation
  const targetPlatform = getTargetPlatform();

  // Get the version to install (user-specified or latest)
  const version = await getCliVersion(targetPlatform);

  console.log(
    `Downloading Aptos CLI version ${version} for ${targetPlatform}...`,
  );

  // Build download URL matching official release artifact naming
  const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${version}/${PNAME}-${version}-${targetPlatform}.zip`;

  const tempDir = tmpdir();

  try {
    if (os === "windows") {
      // Windows installation using PowerShell with argument array (no shell interpolation)
      const zipPath = join(tempDir, "aptos-cli.zip");
      const psScript = [
        `Invoke-WebRequest -Uri '${url}' -OutFile '${zipPath}'`,
        `Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force`,
        `Remove-Item -Path '${zipPath}' -Force`,
      ].join("; ");
      execSync(`powershell -Command "${psScript}"`, { stdio: "inherit" });
    } else {
      // macOS (without Homebrew) and Linux installation using curl/unzip
      const zipPath = join(tempDir, "aptos-cli.zip");

      // Download (argument array avoids shell injection)
      execFileSync("curl", ["-L", "-o", zipPath, url], { stdio: "inherit" });

      // Extract
      execFileSync("unzip", ["-o", "-q", zipPath, "-d", tempDir], {
        stdio: "inherit",
      });

      // Move binary to bin directory
      const extractedBinary = join(tempDir, "aptos");
      renameSync(extractedBinary, binaryPath);

      // Set executable permissions
      chmodSync(binaryPath, 0o755);

      // Clean up
      try {
        execFileSync("rm", ["-f", zipPath], { stdio: "ignore" });
      } catch {
        // Ignore cleanup errors
      }
    }

    console.log(`Aptos CLI installed successfully to ${binaryPath}`);

    // Remind user about PATH if needed
    if (os !== "windows") {
      console.log(
        `\nMake sure ${binDir} is in your PATH. You can add it by running:`,
      );
      console.log(`  export PATH="${binDir}:$PATH"`);
    }
  } catch (error) {
    throw new Error(
      `Failed to install Aptos CLI: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
