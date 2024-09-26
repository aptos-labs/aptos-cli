import { execSync } from "child_process";

/**
 * Wrapper around execSync that uses the shell.
 */
export const execSyncShell = (command, options) => {
  return execSync(command, { shell: true, ...options });
};
