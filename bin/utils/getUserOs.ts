import { platform } from "os";

export type SupportedOS = "MacOS" | "Ubuntu" | "Windows";

/**
 * Determine what OS we're running on.
 * Returns a consistent OS identifier used for downloading the correct binary.
 */
export const getOS = (): SupportedOS => {
  const osPlatform = platform();
  switch (osPlatform) {
    case "darwin":
      return "MacOS";
    case "linux":
      return "Ubuntu";
    case "win32":
      return "Windows";
    default:
      throw new Error(`Unsupported OS: ${osPlatform}`);
  }
};
