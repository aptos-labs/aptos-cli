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
  const execOptions: ExecSyncOptions = {
    ...options,
    shell: true as unknown as string,
  };
  return execSync(command, execOptions);
};
