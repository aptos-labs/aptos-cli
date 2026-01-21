import { execSync } from "child_process";
import { existsSync, chmodSync, mkdirSync, unlinkSync } from "fs";
import { dirname } from "path";

import { GH_CLI_DOWNLOAD_URL, PNAME } from "../utils/consts.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import { getCurrentOpenSSLVersion } from "../utils/versions.js";
import { getOS } from "../utils/getUserOs.js";
import { getLocalBinPath } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";

/**
 * Clean up temporary files created during installation.
 */
const cleanupTempFiles = (os: string): void => {
  try {
    if (os === "Windows") {
      // Clean up Windows temp files
      if (existsSync("C:\\tmp\\aptos.zip")) {
        unlinkSync("C:\\tmp\\aptos.zip");
      }
    } else {
      // Clean up Unix temp files
      if (existsSync("/tmp/aptos.zip")) {
        unlinkSync("/tmp/aptos.zip");
      }
    }
  } catch (error) {
    // Ignore cleanup errors - not critical
  }
};

/**
 * Install the CLI.
 */
export const installCli = async (): Promise<void> => {
  const path = getLocalBinPath();
  if (existsSync(path)) {
    console.log("Aptos CLI is already installed");
    return;
  }

  // Ensure the parent directory exists
  const parentDir = dirname(path);
  if (parentDir && !existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  // Look up the latest version.
  const latestCLIVersion = await getLatestVersionGh();
  console.log(`Downloading aptos CLI version ${latestCLIVersion}`);
  const os = getOS();

  try {
    if (os === "Windows") {
      const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestCLIVersion}/${PNAME}-${latestCLIVersion}-${os}-x86_64.zip`;
      // Download the zip file, extract it, and move the binary to the correct location.
      // Use $env:TEMP for a more reliable temp directory on Windows
      execSync(
        `powershell -Command "$tmpDir = $env:TEMP; ` +
          `Invoke-RestMethod -Uri '${url}' -OutFile '$tmpDir\\aptos.zip'; ` +
          `Expand-Archive -Path '$tmpDir\\aptos.zip' -DestinationPath '$tmpDir' -Force; ` +
          `Move-Item -Path '$tmpDir\\aptos.exe' -Destination '${path}' -Force; ` +
          `Remove-Item -Path '$tmpDir\\aptos.zip' -Force"`,
        { stdio: "inherit" }
      );
    } else if (os === "MacOS") {
      // Install the CLI with brew.
      execSyncShell("brew install aptos", { stdio: "inherit" });
    } else {
      // On Linux, we check what version of OpenSSL we're working with to figure out
      // which binary to download.
      let osVersion = "x86_64";
      let opensSslVersion = "1.0.0";
      try {
        opensSslVersion = getCurrentOpenSSLVersion();
      } catch (error) {
        console.log(
          "Could not determine OpenSSL version, assuming older version (1.x.x)"
        );
      }

      if (opensSslVersion.startsWith("3.")) {
        osVersion = "22.04-x86_64";
      }
      console.log(`Downloading CLI binary ${os}-${osVersion}`);
      const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestCLIVersion}/${PNAME}-${latestCLIVersion}-${os}-${osVersion}.zip`;
      // Download the zip file, extract it, and move the binary to the correct location.
      execSyncShell(
        `curl -L -o /tmp/aptos.zip "${url}" && unzip -o -q /tmp/aptos.zip -d /tmp && mv /tmp/aptos "${path}"`,
        { stdio: "inherit" }
      );
      // Set executable permissions on the binary
      chmodSync(path, 0o755);
      // Clean up temp files
      cleanupTempFiles(os);
    }
  } catch (error) {
    // Clean up on failure
    cleanupTempFiles(os);
    throw error;
  }
};
