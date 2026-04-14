import { type ExecSyncOptions, execSync } from "node:child_process";

type ExecSyncShellOptions = Omit<ExecSyncOptions, "shell">;

/**
 * Wrapper around execSync that uses the shell.
 * This always executes with shell: true for cross-platform compatibility.
 */
export const execSyncShell = (
  command: string,
  options?: ExecSyncShellOptions,
): Buffer | string => {
  // @types/node overloads type `shell` as only `string`, but Node.js
  // accepts `boolean` at runtime. Use the platform default shell path.
  const shell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
  return execSync(command, { ...options, shell });
};
