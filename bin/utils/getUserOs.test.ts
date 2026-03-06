import type * as os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We need to mock the os module before importing the module under test
vi.mock("os", async () => {
  const actual = await vi.importActual<typeof os>("os");
  return {
    ...actual,
    platform: vi.fn(),
    arch: vi.fn(),
  };
});

// We need to mock fs for the Linux distro detection
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import { existsSync, readFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { getOS, getPlatformInfo, getTargetPlatform } from "./getUserOs.js";

describe("getUserOs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPlatformInfo", () => {
    it("should detect macOS x86_64", () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(arch).mockReturnValue("x64");

      const result = getPlatformInfo();
      expect(result).toEqual({ os: "macos", arch: "x86_64" });
    });

    it("should detect macOS ARM64", () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(arch).mockReturnValue("arm64");

      const result = getPlatformInfo();
      expect(result).toEqual({ os: "macos", arch: "aarch64" });
    });

    it("should detect Linux x86_64", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");

      const result = getPlatformInfo();
      expect(result).toEqual({ os: "linux", arch: "x86_64" });
    });

    it("should detect Linux ARM64", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("arm64");

      const result = getPlatformInfo();
      expect(result).toEqual({ os: "linux", arch: "aarch64" });
    });

    it("should detect Windows x86_64", () => {
      vi.mocked(platform).mockReturnValue("win32");
      vi.mocked(arch).mockReturnValue("x64");

      const result = getPlatformInfo();
      expect(result).toEqual({ os: "windows", arch: "x86_64" });
    });

    it("should throw for unsupported OS", () => {
      vi.mocked(platform).mockReturnValue("freebsd");
      vi.mocked(arch).mockReturnValue("x64");

      expect(() => getPlatformInfo()).toThrow("Unsupported operating system");
    });

    it("should throw for unsupported architecture", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("mips");

      expect(() => getPlatformInfo()).toThrow("Unsupported architecture");
    });
  });

  describe("getTargetPlatform", () => {
    it("should return macos-x86_64 for Intel Mac", () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(arch).mockReturnValue("x64");

      expect(getTargetPlatform()).toBe("macos-x86_64");
    });

    it("should return macos-arm64 for Apple Silicon Mac", () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(arch).mockReturnValue("arm64");

      expect(getTargetPlatform()).toBe("macos-arm64");
    });

    it("should return Ubuntu-24.04-x86_64 for Ubuntu 24.04", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        'ID=ubuntu\nVERSION_ID="24.04"\n',
      );

      expect(getTargetPlatform()).toBe("Ubuntu-24.04-x86_64");
    });

    it("should return Ubuntu-22.04-x86_64 for Ubuntu 22.04", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        'ID=ubuntu\nVERSION_ID="22.04"\n',
      );

      expect(getTargetPlatform()).toBe("Ubuntu-22.04-x86_64");
    });

    it("should return Linux-x86_64 for non-Ubuntu Linux", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('ID=fedora\nVERSION_ID="39"\n');

      expect(getTargetPlatform()).toBe("Linux-x86_64");
    });

    it("should return Linux-x86_64 when /etc/os-release doesn't exist", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getTargetPlatform()).toBe("Linux-x86_64");
    });

    it("should return Linux-aarch64 for ARM64 Linux", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("arm64");
      vi.mocked(existsSync).mockReturnValue(false);

      expect(getTargetPlatform()).toBe("Linux-aarch64");
    });

    it("should return Windows-x86_64 for Windows", () => {
      vi.mocked(platform).mockReturnValue("win32");
      vi.mocked(arch).mockReturnValue("x64");

      expect(getTargetPlatform()).toBe("Windows-x86_64");
    });

    it("should throw for Windows ARM64", () => {
      vi.mocked(platform).mockReturnValue("win32");
      vi.mocked(arch).mockReturnValue("arm64");

      expect(() => getTargetPlatform()).toThrow(
        "Windows ARM64 is not currently supported",
      );
    });
  });

  describe("getOS", () => {
    it("should return MacOS for darwin", () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(arch).mockReturnValue("x64");

      expect(getOS()).toBe("MacOS");
    });

    it("should return Linux for linux", () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(arch).mockReturnValue("x64");

      expect(getOS()).toBe("Linux");
    });

    it("should return Windows for win32", () => {
      vi.mocked(platform).mockReturnValue("win32");
      vi.mocked(arch).mockReturnValue("x64");

      expect(getOS()).toBe("Windows");
    });
  });
});
