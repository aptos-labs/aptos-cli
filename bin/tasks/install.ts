import { execSync } from "child_process";
import { existsSync, chmodSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { GH_CLI_DOWNLOAD_URL, PNAME } from "../utils/consts.js";
import { getOS, getTargetPlatform } from "../utils/getUserOs.js";
import { getLocalBinPath, getBinDir } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";

/**
 * Install the Aptos CLI.
 * Downloads the appropriate binary for the current platform from GitHub releases.
 * Follows the same logic as the official install scripts:
 * - https://aptos.dev/scripts/install_cli.sh
 * - https://aptos.dev/scripts/install_cli.ps1
 */
export const installCli = async (): Promise<void> => {
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

  // Look up the latest version
  const latestVersion = await getLatestVersionGh();
  const targetPlatform = getTargetPlatform();

  console.log(
    `Downloading Aptos CLI version ${latestVersion} for ${targetPlatform}...`
  );

  // Build download URL matching official release artifact naming
  const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestVersion}/${PNAME}-${latestVersion}-${targetPlatform}.zip`;

  const os = getOS();
  const tempDir = tmpdir();

  try {
    if (os === "Windows") {
      // Windows installation using PowerShell
      const zipPath = join(tempDir, "aptos-cli.zip");
      execSync(
        `powershell -Command "` +
          `Invoke-WebRequest -Uri '${url}' -OutFile '${zipPath}'; ` +
          `Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force; ` +
          `Remove-Item -Path '${zipPath}' -Force"`,
        { stdio: "inherit" }
      );
    } else {
      // macOS and Linux installation using curl/unzip
      const zipPath = join(tempDir, "aptos-cli.zip");

      // Download
      execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: "inherit" });

      // Extract
      execSync(`unzip -o -q "${zipPath}" -d "${tempDir}"`, { stdio: "inherit" });

      // Move binary to bin directory
      const extractedBinary = join(tempDir, "aptos");
      execSync(`mv "${extractedBinary}" "${binaryPath}"`, { stdio: "inherit" });

      // Set executable permissions
      chmodSync(binaryPath, 0o755);

      // Clean up
      try {
        execSync(`rm -f "${zipPath}"`, { stdio: "ignore" });
      } catch {
        // Ignore cleanup errors
      }
    }

    console.log(`Aptos CLI installed successfully to ${binaryPath}`);

    // Remind user about PATH if needed
    if (os !== "Windows") {
      console.log(
        `\nMake sure ${binDir} is in your PATH. You can add it by running:`
      );
      console.log(`  export PATH="${binDir}:$PATH"`);
    }
  } catch (error) {
    throw new Error(
      `Failed to install Aptos CLI: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
