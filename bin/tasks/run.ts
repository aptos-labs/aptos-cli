import { spawn } from "child_process";
import { existsSync } from "fs";

import { getOS } from "../utils/getUserOs.js";
import { getLocalBinPath } from "../utils/getLocalBinPath.js";

export const runCLI = async (args: string[] = [], binaryPath?: string) => {
  const path = binaryPath || getLocalBinPath();
  if (!existsSync(path)) {
    if (binaryPath) {
      console.error(`Error: Binary not found at specified path: ${binaryPath}`);
      process.exit(1);
    }
    console.log(
      "Aptos CLI not installed, run `npx aptos --install` to install"
    );
    return;
  }
  const os = getOS();

  // Spawn a child process to execute the binary with the provided arguments.
  // Spawn the child process to run the real CLI executable with the forwarded arguments
  spawn(path, args, {
    stdio: "inherit", // Forward the stdio so output is visible
    shell: os === "Windows", // Use shell on Windows
  });
};
