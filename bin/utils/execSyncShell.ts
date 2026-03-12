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
  // Type assertion needed due to @types/node ExecSyncOptions overload complexity
  // where shell is typed as string | boolean but overloads expect specific types
  const execOptions = {
    ...options,
    shell: true,
  } as unknown as ExecSyncOptions;
  return execSync(command, execOptions);
};
