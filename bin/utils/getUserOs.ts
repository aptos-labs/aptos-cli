import { existsSync, readFileSync } from "node:fs";
import { arch, platform } from "node:os";

export type SupportedOS = "macos" | "linux" | "windows";
export type SupportedArch = "x86_64" | "aarch64";

export interface PlatformInfo {
  os: SupportedOS;
  arch: SupportedArch;
}

/**
 * Target strings that match the official Aptos CLI release artifacts.
 * These are derived from the official install scripts at:
 * - https://aptos.dev/scripts/install_cli.sh
 * - https://aptos.dev/scripts/install_cli.ps1
 */
export type TargetPlatform =
  | "macos-x86_64"
  | "macos-arm64"
  | "Ubuntu-22.04-x86_64"
  | "Ubuntu-24.04-x86_64"
  | "Linux-x86_64"
  | "Linux-aarch64"
  | "Windows-x86_64";

/**
 * Get basic OS and architecture information.
 */
export const getPlatformInfo = (): PlatformInfo => {
  const osPlatform = platform();
  const osArch = arch();

  let os: SupportedOS;
  switch (osPlatform) {
    case "darwin":
      os = "macos";
      break;
    case "linux":
      os = "linux";
      break;
    case "win32":
      os = "windows";
      break;
    default:
      throw new Error(`Unsupported operating system: ${osPlatform}`);
  }

  let architecture: SupportedArch;
  switch (osArch) {
    case "x64":
    case "x86_64":
      architecture = "x86_64";
      break;
    case "arm64":
    case "aarch64":
      architecture = "aarch64";
      break;
    default:
      throw new Error(`Unsupported architecture: ${osArch}`);
  }

  return { os, arch: architecture };
};

/**
 * Parse /etc/os-release file to get distribution info.
 * Returns null if file doesn't exist or can't be parsed.
 */
const getLinuxDistroInfo = (): { id: string; versionId: string } | null => {
  const osReleasePath = "/etc/os-release";
  if (!existsSync(osReleasePath)) {
    return null;
  }

  try {
    const content = readFileSync(osReleasePath, "utf8");
    const lines = content.split("\n");

    let id = "";
    let versionId = "";

    for (const line of lines) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");

      if (key === "ID") {
        id = value.toLowerCase();
      } else if (key === "VERSION_ID") {
        versionId = value;
      }
    }

    return { id, versionId };
  } catch {
    return null;
  }
};

/**
 * Determine the target platform string for downloading the CLI binary.
 * This matches the naming convention used in official Aptos CLI releases.
 */
export const getTargetPlatform = (): TargetPlatform => {
  const { os, arch: architecture } = getPlatformInfo();

  switch (os) {
    case "macos":
      // macOS supports both x86_64 and arm64
      return architecture === "aarch64" ? "macos-arm64" : "macos-x86_64";

    case "linux": {
      // Check for ARM64 first
      if (architecture === "aarch64") {
        return "Linux-aarch64";
      }

      // For x86_64, check if we're on Ubuntu and what version
      const distroInfo = getLinuxDistroInfo();
      if (distroInfo?.id === "ubuntu") {
        if (distroInfo.versionId.startsWith("24.04")) {
          return "Ubuntu-24.04-x86_64";
        }
        if (distroInfo.versionId.startsWith("22.04")) {
          return "Ubuntu-22.04-x86_64";
        }
      }

      // Default to generic Linux for non-Ubuntu or older Ubuntu versions
      return "Linux-x86_64";
    }

    case "windows":
      // Windows ARM64 uses x86_64 binary via built-in emulation
      return "Windows-x86_64";

    default:
      throw new Error(`Unsupported OS: ${os}`);
  }
};
