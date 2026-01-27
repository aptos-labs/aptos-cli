import { spawn } from "child_process";
import { existsSync } from "fs";

import { getPlatformInfo } from "../utils/getUserOs.js";
import { getLocalBinPath } from "../utils/getLocalBinPath.js";

/**
 * Run the Aptos CLI with the provided arguments.
 * @param args - Arguments to pass to the CLI
 * @param binaryPath - Optional path to a custom binary
 */
export const runCLI = async (
  args: string[] = [],
  binaryPath?: string
): Promise<void> => {
  const cliPath = binaryPath || getLocalBinPath();

  if (!existsSync(cliPath)) {
    if (binaryPath) {
      console.error(`Error: Binary not found at specified path: ${binaryPath}`);
      process.exit(1);
    }
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }

  const { os } = getPlatformInfo();

  // Spawn a child process to run the real CLI executable with the forwarded arguments
  const child = spawn(cliPath, args, {
    stdio: "inherit", // Forward the stdio so output is visible
    shell: os === "windows", // Use shell on Windows for proper path handling
  });

  // Forward the exit code from the child process to the parent
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      process.exit(code);
    }
  });
};
