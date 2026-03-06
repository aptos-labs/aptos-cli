import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { executableIsAvailable } from "./executableIsAvailable.js";

/**
 * Check if winget is available on the system.
 */
export const isWingetAvailable = (): boolean => {
  return executableIsAvailable("winget");
};

/**
 * Check if Chocolatey is available on the system.
 */
export const isChocoAvailable = (): boolean => {
  return executableIsAvailable("choco");
};

/**
 * Check if the Aptos CLI was installed via winget.
 */
export const isInstalledViaWinget = (): boolean => {
  if (!isWingetAvailable()) {
    return false;
  }
  try {
    const output = execSync("winget list --id Aptos.Aptos", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.includes("Aptos.Aptos");
  } catch {
    return false;
  }
};

/**
 * Check if the Aptos CLI was installed via Chocolatey.
 */
export const isInstalledViaChoco = (): boolean => {
  if (!isChocoAvailable()) {
    return false;
  }
  try {
    const output = execSync("choco list aptos", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.toLowerCase().includes("aptos");
  } catch {
    return false;
  }
};

/**
 * Get the path to the Aptos CLI binary installed via winget.
 * Winget typically installs to the user's local app data or program files.
 */
export const getCliPathWinget = (): string | null => {
  // Winget installs to various locations, try common ones
  const possiblePaths = [
    `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Aptos.Aptos_Microsoft.Winget.Source_8wekyb3d8bbwe\\aptos.exe`,
    `${process.env.PROGRAMFILES}\\Aptos\\aptos.exe`,
    `${process.env.LOCALAPPDATA}\\Aptos\\aptos.exe`,
  ];

  for (const path of possiblePaths) {
    if (path && existsSync(path)) {
      return path;
    }
  }

  // Try to find it via where command
  try {
    const output = execSync("where aptos", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (output && existsSync(output.split("\n")[0])) {
      return output.split("\n")[0];
    }
  } catch {
    // Not found via where
  }

  return null;
};

/**
 * Get the path to the Aptos CLI binary installed via Chocolatey.
 */
export const getCliPathChoco = (): string | null => {
  const chocoPath = `${process.env.ChocolateyInstall || "C:\\ProgramData\\chocolatey"}\\bin\\aptos.exe`;
  if (existsSync(chocoPath)) {
    return chocoPath;
  }
  return null;
};

/**
 * Install the Aptos CLI via winget.
 */
export const installViaWinget = (): void => {
  console.log("Installing Aptos CLI via winget...");
  execSync(
    "winget install --id Aptos.Aptos --silent --accept-package-agreements --accept-source-agreements",
    {
      stdio: "inherit",
    },
  );
};

/**
 * Install the Aptos CLI via Chocolatey.
 */
export const installViaChoco = (): void => {
  console.log("Installing Aptos CLI via Chocolatey...");
  execSync("choco install aptos -y", { stdio: "inherit" });
};

/**
 * Update the Aptos CLI via winget.
 */
export const updateViaWinget = (): void => {
  console.log("Updating Aptos CLI via winget...");
  execSync(
    "winget upgrade --id Aptos.Aptos --silent --accept-package-agreements --accept-source-agreements",
    {
      stdio: "inherit",
    },
  );
};

/**
 * Update the Aptos CLI via Chocolatey.
 */
export const updateViaChoco = (): void => {
  console.log("Updating Aptos CLI via Chocolatey...");
  execSync("choco upgrade aptos -y", { stdio: "inherit" });
};

/**
 * Detect which Windows package manager was used to install the CLI.
 * Returns the package manager name or null if not installed via a package manager.
 */
export const detectWindowsPackageManager = (): "winget" | "choco" | null => {
  if (isInstalledViaWinget()) {
    return "winget";
  }
  if (isInstalledViaChoco()) {
    return "choco";
  }
  return null;
};
