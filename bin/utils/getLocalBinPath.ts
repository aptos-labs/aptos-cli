import { dirname, join } from "path";
import { executableIsAvailable } from "./aptosExecutableIsAvailable.js";
import { getCliPathBrew } from "./brewOperations.js";
import { PNAME } from "./consts.js";
import { getOS } from "./getUserOs.js";
import { fileURLToPath } from "url";

/**
 * Get the path to the locally installed Aptos CLI binary.
 * - On macOS: Uses Homebrew installation path
 * - On Windows: Binary stored in the dist directory with .exe extension
 * - On Linux: Binary stored in the dist directory
 */
export const getLocalBinPath = (): string => {
  const os = getOS();

  if (os === "MacOS") {
    // Confirm brew is installed.
    const brewInstalled = executableIsAvailable("brew");
    if (!brewInstalled) {
      throw new Error("Please install brew to continue: https://brew.sh/");
    }
    try {
      return getCliPathBrew();
    } catch {
      return "";
    }
  }

  // For Windows and Linux, store the binary in the same directory as this script
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const binaryName = os === "Windows" ? `${PNAME}.exe` : PNAME;
  return join(scriptDir, binaryName);
};
