import { dirname } from "path";
import { executableIsAvailable } from "./aptosExecutableIsAvailable.js";
import { getCliPathBrew } from "./brewOperations.js";
import { PNAME } from "./consts.js";
import { getOS } from "./getUserOs.js";
import { fileURLToPath } from "url";

export const getLocalBinPath = () => {
  let path;
  const os = getOS();
  if (os === "MacOS") {
    // Confirm brew is installed.
    const brewInstalled = executableIsAvailable("brew");
    if (!brewInstalled) {
      throw "Please install brew to continue: https://brew.sh/";
    }
    try {
      path = getCliPathBrew();
    } catch (e) {
      path = "";
    }
  } else if (os === "Windows") {
    path = `${dirname(fileURLToPath(import.meta.url))}\\${PNAME}.exe`;
  } else {
    path = `${dirname(fileURLToPath(import.meta.url))}/${PNAME}`;
  }
  return path;
};
