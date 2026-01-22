import { execSync } from "child_process";
import { existsSync } from "fs";
import { executableIsAvailable } from "./executableIsAvailable.js";

/**
 * Check if Homebrew is available on the system.
 */
export const isBrewAvailable = (): boolean => {
  return executableIsAvailable("brew");
};

/**
 * Check if the Aptos CLI was installed via Homebrew.
 */
export const isInstalledViaBrew = (): boolean => {
  if (!isBrewAvailable()) {
    return false;
  }
  try {
    const path = getCliPathBrew();
    return existsSync(path);
  } catch {
    return false;
  }
};

/**
 * Get the path to the Aptos CLI binary installed via Homebrew.
 * Based on the installation path of the aptos formula.
 */
export const getCliPathBrew = (): string => {
  const directory = execSync("brew --prefix aptos", {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
  return `${directory}/bin/aptos`;
};

/**
 * Install the Aptos CLI via Homebrew.
 */
export const installViaBrew = (): void => {
  console.log("Installing Aptos CLI via Homebrew...");
  execSync("brew install aptos", { stdio: "inherit" });
};

/**
 * Update the Aptos CLI via Homebrew.
 */
export const updateViaBrew = (): void => {
  console.log("Updating Aptos CLI via Homebrew...");
  execSync("brew upgrade aptos", { stdio: "inherit" });
};
