import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  getCliPathBrew,
  installViaBrew,
  isBrewAvailable,
  isInstalledViaBrew,
  updateViaBrew,
} from "./brewOperations.js";
import { executableIsAvailable } from "./executableIsAvailable.js";

describe("brewOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isBrewAvailable", () => {
    it("should return true when brew is available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);

      expect(isBrewAvailable()).toBe(true);
      expect(executableIsAvailable).toHaveBeenCalledWith("brew");
    });

    it("should return false when brew is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isBrewAvailable()).toBe(false);
    });
  });

  describe("isInstalledViaBrew", () => {
    it("should return true when aptos is installed via brew", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("/opt/homebrew/Cellar/aptos");
      vi.mocked(existsSync).mockReturnValue(true);

      expect(isInstalledViaBrew()).toBe(true);
    });

    it("should return false when brew is not available", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(false);

      expect(isInstalledViaBrew()).toBe(false);
    });

    it("should return false when aptos path doesn't exist", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockReturnValue("/opt/homebrew/Cellar/aptos");
      vi.mocked(existsSync).mockReturnValue(false);

      expect(isInstalledViaBrew()).toBe(false);
    });

    it("should return false when brew --prefix throws", () => {
      vi.mocked(executableIsAvailable).mockReturnValue(true);
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("aptos not installed");
      });

      expect(isInstalledViaBrew()).toBe(false);
    });
  });

  describe("getCliPathBrew", () => {
    it("should return the correct path", () => {
      vi.mocked(execSync).mockReturnValue("/opt/homebrew/Cellar/aptos\n");

      expect(getCliPathBrew()).toBe("/opt/homebrew/Cellar/aptos/bin/aptos");
    });
  });

  describe("installViaBrew", () => {
    it("should call brew install aptos", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      installViaBrew();

      expect(execSync).toHaveBeenCalledWith("brew install aptos", {
        stdio: "inherit",
      });
    });
  });

  describe("updateViaBrew", () => {
    it("should call brew upgrade aptos", () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from(""));

      updateViaBrew();

      expect(execSync).toHaveBeenCalledWith("brew upgrade aptos", {
        stdio: "inherit",
      });
    });
  });
});
