import { execSyncShell } from "./execSyncShell.js";

/**
 * Check if an executable is available on the system.
 * Uses `which` on Unix systems (macOS/Linux) and `where` on Windows.
 */
export const executableIsAvailable = (name: string): boolean => {
  try {
    const command =
      process.platform === "win32" ? `where ${name}` : `which ${name}`;
    execSyncShell(command, { encoding: "utf8", stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
};
