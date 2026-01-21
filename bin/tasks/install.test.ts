import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all dependencies before importing the module under test
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  chmodSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("os", () => ({
  tmpdir: () => "/tmp",
  homedir: () => "/home/user",
  platform: vi.fn(() => "linux"),
  arch: vi.fn(() => "x64"),
}));

vi.mock("../utils/getUserOs.js", () => ({
  getOS: vi.fn(),
  getTargetPlatform: vi.fn(),
}));

vi.mock("../utils/getLocalBinPath.js", () => ({
  getLocalBinPath: vi.fn(),
  getBinDir: vi.fn(),
}));

vi.mock("../utils/ghOperations.js", () => ({
  getLatestVersionGh: vi.fn(),
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

import { installCli } from "./install.js";
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { getOS, getTargetPlatform } from "../utils/getUserOs.js";
import { getLocalBinPath, getBinDir } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";
import {
  isBrewAvailable,
  isInstalledViaBrew,
  installViaBrew,
} from "../utils/brewOperations.js";
import {
  isWingetAvailable,
  isChocoAvailable,
  isInstalledViaWinget,
  isInstalledViaChoco,
  installViaWinget,
  installViaChoco,
} from "../utils/windowsPackageManagers.js";

describe("install", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocalBinPath).mockReturnValue("/home/user/.local/bin/aptos");
    vi.mocked(getBinDir).mockReturnValue("/home/user/.local/bin");
    vi.mocked(getLatestVersionGh).mockResolvedValue("1.0.0");
    vi.mocked(getTargetPlatform).mockReturnValue("Linux-x86_64");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("macOS with Homebrew", () => {
    beforeEach(() => {
      vi.mocked(getOS).mockReturnValue("MacOS");
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
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));
      vi.mocked(getTargetPlatform).mockReturnValue("macos-x86_64");

      await installCli(true);

      expect(installViaBrew).not.toHaveBeenCalled();
      expect(execSync).toHaveBeenCalled();
    });
  });

  describe("Windows with winget", () => {
    beforeEach(() => {
      vi.mocked(getOS).mockReturnValue("Windows");
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
      vi.mocked(getOS).mockReturnValue("Windows");
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
      vi.mocked(getOS).mockReturnValue("Windows");
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
        expect.any(Object)
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
      vi.mocked(getOS).mockReturnValue("Linux");
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(getTargetPlatform).mockReturnValue("Ubuntu-22.04-x86_64");
    });

    it("should download directly on Linux", async () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      await installCli();

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("curl"),
        expect.any(Object)
      );
    });

    it("should create bin directory if it doesn't exist", async () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        if (path === "/home/user/.local/bin") return false;
        return false;
      });
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      await installCli();

      expect(mkdirSync).toHaveBeenCalledWith("/home/user/.local/bin", {
        recursive: true,
      });
    });
  });

  describe("already installed", () => {
    it("should skip if binary already exists", async () => {
      vi.mocked(getOS).mockReturnValue("Linux");
      vi.mocked(isBrewAvailable).mockReturnValue(false);
      vi.mocked(existsSync).mockReturnValue(true);

      await installCli();

      expect(execSync).not.toHaveBeenCalled();
      expect(getLatestVersionGh).not.toHaveBeenCalled();
    });
  });
});
