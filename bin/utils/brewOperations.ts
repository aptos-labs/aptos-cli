import { execSyncShell } from "./execSyncShell.js";

/**
 * Based on the installation path of the aptos formula, determine the path where the
 * CLI should be installed.
 */
export const getCliPathBrew = () => {
  const directory = execSyncShell("brew --prefix aptos", { encoding: "utf8" })
    .toString()
    .trim();
  return `${directory}/bin/aptos`;
};

/**
 * Use brew to find the latest version of the CLI. Make sure to confirm that brew
 * is installed before calling this function.
 */
export const getLatestVersionBrew = () => {
  const out = JSON.parse(
    execSyncShell("brew info --json aptos", { encoding: "utf8" })
  );
  return out[0].versions.stable;
};
