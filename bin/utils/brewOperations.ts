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
