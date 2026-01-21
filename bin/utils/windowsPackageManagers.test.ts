import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { existsSync } from "fs";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("./executableIsAvailable.js", () => ({
  executableIsAvailable: vi.fn(),
}));

import {
  isWingetAvailable,
  isChocoAvailable,
  isInstalledViaWinget,
  isInstalledViaChoco,
  getCliPathWinget,
  getCliPathChoco,
  installViaWinget,
  installViaChoco,
  updateViaWinget,
  updateViaChoco,
  detectWindowsPackageManager,
} from "./windowsPackageManagers.js";
import { executableIsAvailable } from "./executableIsAvailable.js";

describe("windowsPackageManagers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default environment variables
    process.env.LOCALAPPDATA = "C:\\Users\\Test\\AppData\\Local";
    process.env.PROGRAMFILES = "C:\\Program Files";
    process.env.ChocolateyInstall = "C:\\ProgramData\\chocolatey";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isWingetAvailable", () => {
    it("should return true when winget is available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);

      expect(isWingetAvailable()).toBe(true);
      expect(executableIsAvailable).toHaveBeenCalledWith("winget");
    });

    it("should return false when winget is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isWingetAvailable()).toBe(false);
    });
  });

  describe("isChocoAvailable", () => {
    it("should return true when choco is available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);

      expect(isChocoAvailable()).toBe(true);
      expect(executableIsAvailable).toHaveBeenCalledWith("choco");
    });

    it("should return false when choco is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isChocoAvailable()).toBe(false);
    });
  });

  describe("isInstalledViaWinget", () => {
    it("should return true when aptos is installed via winget", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("Aptos.Aptos  1.0.0");

      expect(isInstalledViaWinget()).toBe(true);
    });

    it("should return false when winget is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isInstalledViaWinget()).toBe(false);
    });

    it("should return false when aptos is not in winget list", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("No packages found");

      expect(isInstalledViaWinget()).toBe(false);
    });

    it("should return false when winget list throws", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("winget error");
      });

      expect(isInstalledViaWinget()).toBe(false);
    });
  });

  describe("isInstalledViaChoco", () => {
    it("should return true when aptos is installed via choco", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("aptos 1.0.0");

      expect(isInstalledViaChoco()).toBe(true);
    });

    it("should return false when choco is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isInstalledViaChoco()).toBe(false);
    });

    it("should return false when aptos is not in choco list", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("0 packages installed");

      expect(isInstalledViaChoco()).toBe(false);
    });
  });

  describe("getCliPathWinget", () => {
    it("should return path when found via where command", () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === "C:\\found\\aptos.exe";
      });
      vi.mocked(execSync).mockReturnValue("C:\\found\\aptos.exe\n");

      expect(getCliPathWinget()).toBe("C:\\found\\aptos.exe");
    });

    it("should return null when not found", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("not found");
      });

      expect(getCliPathWinget()).toBeNull();
    });
  });

  describe("getCliPathChoco", () => {
    it("should return path when exists", () => {
      vi.mocked(existsSync).mockReturnValue(true);

      expect(getCliPathChoco()).toBe(
        "C:\\ProgramData\\chocolatey\\bin\\aptos.exe"
      );
    });

    it("should return null when not found", () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getCliPathChoco()).toBeNull();
    });
  });

  describe("installViaWinget", () => {
    it("should call winget install", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      installViaWinget();

      expect(execSync).toHaveBeenCalledWith(
        "winget install --id Aptos.Aptos --silent --accept-package-agreements --accept-source-agreements",
        { stdio: "inherit" }
      );
    });
  });

  describe("installViaChoco", () => {
    it("should call choco install", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      installViaChoco();

      expect(execSync).toHaveBeenCalledWith("choco install aptos -y", {
        stdio: "inherit",
      });
    });
  });

  describe("updateViaWinget", () => {
    it("should call winget upgrade", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      updateViaWinget();

      expect(execSync).toHaveBeenCalledWith(
        "winget upgrade --id Aptos.Aptos --silent --accept-package-agreements --accept-source-agreements",
        { stdio: "inherit" }
      );
    });
  });

  describe("updateViaChoco", () => {
    it("should call choco upgrade", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      updateViaChoco();

      expect(execSync).toHaveBeenCalledWith("choco upgrade aptos -y", {
        stdio: "inherit",
      });
    });
  });

  describe("detectWindowsPackageManager", () => {
    it("should return winget when installed via winget", () => {
      vi.mocked(executableIsAvailable).mockImplementation((name) => {
        return name === "winget";
      });
      vi.mocked(execSync).mockReturnValue("Aptos.Aptos  1.0.0");

      expect(detectWindowsPackageManager()).toBe("winget");
    });

    it("should return choco when installed via choco", () => {
      vi.mocked(executableIsAvailable).mockImplementation((name) => {
        if (name === "winget") return false;
        if (name === "choco") return true;
        return false;
      });
      vi.mocked(execSync).mockReturnValue("aptos 1.0.0");

      expect(detectWindowsPackageManager()).toBe("choco");
    });

    it("should return null when not installed via package manager", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(detectWindowsPackageManager()).toBeNull();
    });
  });
});
