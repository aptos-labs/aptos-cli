import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock all dependencies before importing the module under test
vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  chmodSync: vi.fn(),
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  tmpdir: () => "/tmp",
  homedir: () => "/home/user",
  platform: vi.fn(() => "linux"),
  arch: vi.fn(() => "x64"),
}));

vi.mock("../utils/getUserOs.js", () => ({
  getPlatformInfo: vi.fn(),
  getTargetPlatform: vi.fn(),
}));

vi.mock("../utils/getLocalBinPath.js", () => ({
  getLocalBinPath: vi.fn(),
  getBinDir: vi.fn(),
  invalidateBinPathCache: vi.fn(),
}));

vi.mock("../utils/ghOperations.js", () => ({
  getCliVersion: vi.fn(),
  hasUserSpecifiedVersion: vi.fn(),
}));

vi.mock("../utils/brewOperations.js", () => ({
  isBrewAvailable: vi.fn(),
  isInstalledViaBrew: vi.fn(),
  installViaBrew: vi.fn(),
}));

vi.mock("../utils/windowsPackageManagers.js", () => ({
  isWingetAvailable: vi.fn(),
  isChocoAvailable: vi.fn(),
  isInstalledViaWinget: vi.fn(),
  isInstalledViaChoco: vi.fn(),
  installViaWinget: vi.fn(),
  installViaChoco: vi.fn(),
}));

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import {
  installViaBrew,
  isBrewAvailable,
  isInstalledViaBrew,
} from "../utils/brewOperations.js";
import { getBinDir, getLocalBinPath } from "../utils/getLocalBinPath.js";
import { getPlatformInfo, getTargetPlatform } from "../utils/getUserOs.js";
import {
  getCliVersion,
  hasUserSpecifiedVersion,
} from "../utils/ghOperations.js";
import {
  installViaChoco,
  installViaWinget,
  isChocoAvailable,
  isInstalledViaChoco,
  isInstalledViaWinget,
  isWingetAvailable,
} from "../utils/windowsPackageManagers.js";
import { installCli } from "./install.js";

describe("install", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocalBinPath).mockReturnValue("/home/user/.local/bin/aptos");
    vi.mocked(getBinDir).mockReturnValue("/home/user/.local/bin");
    vi.mocked(getCliVersion).mockResolvedValue("1.0.0");
    vi.mocked(hasUserSpecifiedVersion).mockReturnValue(false);
    vi.mocked(getTargetPlatform).mockReturnValue("Linux-x86_64");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("macOS with Homebrew", () => {
    beforeEach(() => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "macos",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(true);
    });

    it("should use Homebrew when available", async () => {
      vi.mocked(isInstalledViaBrew).mockReturnValue(false);

      await installCli();

      expect(installViaBrew).toHaveBeenCalled();
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should skip if already installed via Homebrew", async () => {
      vi.mocked(isInstalledViaBrew).mockReturnValue(true);

      await installCli();

      expect(installViaBrew).not.toHaveBeenCalled();
    });

    it("should skip Homebrew when directDownload is true", async () => {
      vi.mocked(isInstalledViaBrew).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));
      vi.mocked(getTargetPlatform).mockReturnValue("macos-x86_64");

      await installCli(true);

      expect(installViaBrew).not.toHaveBeenCalled();
      expect(execFileSync).toHaveBeenCalled();
    });
  });

  describe("Windows with winget", () => {
    beforeEach(() => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "windows",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(isWingetAvailable).mockReturnValue(true);
      vi.mocked(isChocoAvailable).mockReturnValue(false);
    });

    it("should use winget when available", async () => {
      vi.mocked(isInstalledViaWinget).mockReturnValue(false);

      await installCli();

      expect(installViaWinget).toHaveBeenCalled();
      expect(installViaChoco).not.toHaveBeenCalled();
    });

    it("should skip if already installed via winget", async () => {
      vi.mocked(isInstalledViaWinget).mockReturnValue(true);

      await installCli();

      expect(installViaWinget).not.toHaveBeenCalled();
    });
  });

  describe("Windows with Chocolatey", () => {
    beforeEach(() => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "windows",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(isWingetAvailable).mockReturnValue(false);
      vi.mocked(isChocoAvailable).mockReturnValue(true);
    });

    it("should use Chocolatey when winget is not available", async () => {
      vi.mocked(isInstalledViaChoco).mockReturnValue(false);

      await installCli();

      expect(installViaChoco).toHaveBeenCalled();
      expect(installViaWinget).not.toHaveBeenCalled();
    });

    it("should skip if already installed via Chocolatey", async () => {
      vi.mocked(isInstalledViaChoco).mockReturnValue(true);

      await installCli();

      expect(installViaChoco).not.toHaveBeenCalled();
    });
  });

  describe("Windows direct download", () => {
    beforeEach(() => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "windows",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(isWingetAvailable).mockReturnValue(false);
      vi.mocked(isChocoAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(getTargetPlatform).mockReturnValue("Windows-x86_64");
    });

    it("should download directly when no package manager available", async () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      await installCli();

      expect(installViaWinget).not.toHaveBeenCalled();
      expect(installViaChoco).not.toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("powershell"),
        expect.any(Object),
      );
    });

    it("should skip package managers when directDownload is true", async () => {
      vi.mocked(isWingetAvailable).mockReturnValue(true);
      vi.mocked(isChocoAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      await installCli(true);

      expect(installViaWinget).not.toHaveBeenCalled();
      expect(installViaChoco).not.toHaveBeenCalled();
      expect(execSync).toHaveBeenCalled();
    });
  });

  describe("Linux direct download", () => {
    beforeEach(() => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "linux",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(getTargetPlatform).mockReturnValue("Ubuntu-22.04-x86_64");
    });

    it("should download directly on Linux", async () => {
      vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));

      await installCli();

      expect(execFileSync).toHaveBeenCalledWith(
        "curl",
        expect.arrayContaining(["-L"]),
        expect.any(Object),
      );
    });

    it("should create bin directory if it doesn't exist", async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        if (path === "/home/user/.local/bin") return false;
        return false;
      });
      vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));

      await installCli();

      expect(mkdirSync).toHaveBeenCalledWith("/home/user/.local/bin", {
        recursive: true,
      });
    });
  });

  describe("already installed", () => {
    it("should skip if binary already exists", async () => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "linux",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(true);

      await installCli();

      expect(execSync).not.toHaveBeenCalled();
      expect(getCliVersion).not.toHaveBeenCalled();
    });
  });

  describe("specific version via APTOS_CLI_VERSION", () => {
    beforeEach(() => {
      vi.mocked(hasUserSpecifiedVersion).mockReturnValue(true);
      vi.mocked(getCliVersion).mockResolvedValue("4.5.0");
    });

    it("should skip package managers when specific version is set", async () => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "macos",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(true);
      vi.mocked(isInstalledViaBrew).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));
      vi.mocked(getTargetPlatform).mockReturnValue("macos-x86_64");

      await installCli();

      // Should NOT use Homebrew even though it's available
      expect(installViaBrew).not.toHaveBeenCalled();
      // Should download directly
      expect(execFileSync).toHaveBeenCalled();
    });

    it("should skip winget when specific version is set on Windows", async () => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "windows",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(isWingetAvailable).mockReturnValue(true);
      vi.mocked(isChocoAvailable).mockReturnValue(true);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
      vi.mocked(getTargetPlatform).mockReturnValue("Windows-x86_64");

      await installCli();

      expect(installViaWinget).not.toHaveBeenCalled();
      expect(installViaChoco).not.toHaveBeenCalled();
      expect(execSync).toHaveBeenCalled();
    });

    it("should use specific version in download URL", async () => {
      vi.mocked(getPlatformInfo).mockReturnValue({
        os: "linux",
        arch: "x86_64",
      });
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(execFileSync).mockReturnValue(Buffer.from(""));
      vi.mocked(getTargetPlatform).mockReturnValue("Ubuntu-22.04-x86_64");

      await installCli();

      // Verify the URL contains the specific version
      expect(execFileSync).toHaveBeenCalledWith(
        "curl",
        expect.arrayContaining([expect.stringContaining("4.5.0")]),
        expect.any(Object),
      );
    });
  });
});
