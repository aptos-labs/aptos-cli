import { getLatestVersionBrew } from "./brewOperations.js";
import { getOS } from "./getUserOs.js";
import { getLatestVersionGh } from "./ghOperations.js";

/**
 * Determine the latest version of the CLI.
 */
export const getLatestVersion = async () => {
  if (getOS() === "MacOS") {
    return getLatestVersionBrew();
  } else {
    return getLatestVersionGh();
  }
};
