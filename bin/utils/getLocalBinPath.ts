import { join } from "path";
import { homedir } from "os";
import { getOS } from "./getUserOs.js";

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
 * - macOS/Linux: ~/.local/bin/aptos
 * - Windows: $USERPROFILE\.aptoscli\bin\aptos.exe
 */
export const getLocalBinPath = (): string => {
  const os = getOS();
  const binDir = getBinDir();
  const binaryName = os === "Windows" ? "aptos.exe" : "aptos";
  return join(binDir, binaryName);
};
