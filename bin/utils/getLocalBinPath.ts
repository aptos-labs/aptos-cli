import { executableIsAvailable } from "./aptosExecutableIsAvailable.js";
import { getCliPathBrew } from "./brewOperations.js";
import { PNAME } from "./consts.js";
import { getOS } from "./getUserOs.js";

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
    path = `${__dirname}\\${PNAME}.exe`;
  } else {
    path = `${__dirname}/${PNAME}`;
  }
  return path;
};
