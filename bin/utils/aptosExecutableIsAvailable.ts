import { execSyncShell } from "./execSyncShell.js";

/**
 * Only works on Unix systems. This is fine because we only need to check for brew on
 * MacOS.
 */
export const executableIsAvailable = (name) => {
  try {
    execSyncShell(`which ${name}`, { encoding: "utf8" });
    return true;
  } catch (error) {
    return false;
  }
};
