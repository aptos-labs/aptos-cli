import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  getCliVersion,
  getLatestVersionGh,
  getUserSpecifiedVersion,
  hasUserSpecifiedVersion,
  validateVersionExists,
} from "./ghOperations.js";

describe("ghOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.APTOS_CLI_VERSION;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getLatestVersionGh", () => {
    it("should return the latest version", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { tag_name: "aptos-cli-v1.2.3" },
            { tag_name: "aptos-cli-v1.2.2" },
          ]),
      });

      const version = await getLatestVersionGh();

      expect(version).toBe("1.2.3");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "aptos-cli-npm",
          }),
        }),
      );
    });

    it("should use GITHUB_TOKEN when available", async () => {
      process.env.GITHUB_TOKEN = "test-token";

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ tag_name: "aptos-cli-v1.0.0" }]),
      });

      await getLatestVersionGh();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should skip non-CLI releases", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { tag_name: "other-release-v2.0.0" },
            { tag_name: "aptos-cli-v1.5.0" },
          ]),
      });

      const version = await getLatestVersionGh();

      expect(version).toBe("1.5.0");
    });

    it("should throw on rate limit (403)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "GitHub API rate limit exceeded",
      );
    });

    it("should throw on rate limit (429)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "GitHub API rate limit exceeded",
      );
    });

    it("should throw on other HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "GitHub API request failed with status 500",
      );
    });

    it("should throw on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Failed to fetch releases from GitHub",
      );
    });

    it("should throw when no CLI release found", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { tag_name: "other-release-v1.0.0" },
            { tag_name: "another-release-v2.0.0" },
          ]),
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Could not determine latest version of Aptos CLI",
      );
    });

    it("should throw on invalid JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Failed to parse GitHub API response",
      );
    });

    it("should throw when response is not an array", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "not an array" }),
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Unexpected response format",
      );
    });
  });

  describe("getUserSpecifiedVersion", () => {
    it("should return undefined when APTOS_CLI_VERSION is not set", () => {
      delete process.env.APTOS_CLI_VERSION;
      expect(getUserSpecifiedVersion()).toBeUndefined();
    });

    it("should return the version when APTOS_CLI_VERSION is set", () => {
      process.env.APTOS_CLI_VERSION = "1.2.3";
      expect(getUserSpecifiedVersion()).toBe("1.2.3");
    });

    it("should strip v prefix from version", () => {
      process.env.APTOS_CLI_VERSION = "v1.2.3";
      expect(getUserSpecifiedVersion()).toBe("1.2.3");
    });

    it("should handle version without v prefix", () => {
      process.env.APTOS_CLI_VERSION = "2.0.0";
      expect(getUserSpecifiedVersion()).toBe("2.0.0");
    });

    it("should accept pre-release versions", () => {
      process.env.APTOS_CLI_VERSION = "v1.2.3-rc.1";
      expect(getUserSpecifiedVersion()).toBe("1.2.3-rc.1");
    });

    it("should reject invalid version strings", () => {
      process.env.APTOS_CLI_VERSION = "not-a-version";
      expect(() => getUserSpecifiedVersion()).toThrow(
        "Invalid APTOS_CLI_VERSION",
      );
    });

    it("should reject version with shell metacharacters", () => {
      process.env.APTOS_CLI_VERSION = '1.0.0"; rm -rf /; echo "';
      expect(() => getUserSpecifiedVersion()).toThrow(
        "Invalid APTOS_CLI_VERSION",
      );
    });
  });

  describe("hasUserSpecifiedVersion", () => {
    it("should return false when APTOS_CLI_VERSION is not set", () => {
      delete process.env.APTOS_CLI_VERSION;
      expect(hasUserSpecifiedVersion()).toBe(false);
    });

    it("should return true when APTOS_CLI_VERSION is set", () => {
      process.env.APTOS_CLI_VERSION = "1.0.0";
      expect(hasUserSpecifiedVersion()).toBe(true);
    });

    it("should return false when APTOS_CLI_VERSION is empty string", () => {
      process.env.APTOS_CLI_VERSION = "";
      expect(hasUserSpecifiedVersion()).toBe(false);
    });
  });

  describe("validateVersionExists", () => {
    it("should return true when version exists", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await validateVersionExists("1.0.0", "Linux-x86_64");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://github.com/aptos-labs/aptos-core/releases/download/aptos-cli-v1.0.0/aptos-cli-1.0.0-Linux-x86_64.zip",
        expect.objectContaining({ method: "HEAD" }),
      );
    });

    it("should return false when version does not exist", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await validateVersionExists("99.99.99", "Linux-x86_64");

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await validateVersionExists("1.0.0", "Linux-x86_64");

      expect(result).toBe(false);
    });

    it("should use GITHUB_TOKEN when available", async () => {
      process.env.GITHUB_TOKEN = "test-token";
      mockFetch.mockResolvedValue({ ok: true });

      await validateVersionExists("1.0.0", "Linux-x86_64");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
  });

  describe("getCliVersion", () => {
    it("should return latest version when APTOS_CLI_VERSION is not set", async () => {
      delete process.env.APTOS_CLI_VERSION;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ tag_name: "aptos-cli-v2.0.0" }]),
      });

      const version = await getCliVersion();

      expect(version).toBe("2.0.0");
    });

    it("should return user-specified version when APTOS_CLI_VERSION is set", async () => {
      process.env.APTOS_CLI_VERSION = "1.5.0";
      // Don't validate when no targetPlatform is provided
      const version = await getCliVersion();

      expect(version).toBe("1.5.0");
      // Should not call fetch for releases API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should validate version when targetPlatform is provided", async () => {
      process.env.APTOS_CLI_VERSION = "1.5.0";
      mockFetch.mockResolvedValue({ ok: true });

      const version = await getCliVersion("Linux-x86_64");

      expect(version).toBe("1.5.0");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("1.5.0"),
        expect.objectContaining({ method: "HEAD" }),
      );
    });

    it("should throw error when specified version does not exist", async () => {
      process.env.APTOS_CLI_VERSION = "99.99.99";
      mockFetch.mockResolvedValue({ ok: false });

      await expect(getCliVersion("Linux-x86_64")).rejects.toThrow(
        "Specified version 99.99.99 does not exist",
      );
    });

    it("should strip v prefix and validate version", async () => {
      process.env.APTOS_CLI_VERSION = "v1.5.0";
      mockFetch.mockResolvedValue({ ok: true });

      const version = await getCliVersion("Linux-x86_64");

      expect(version).toBe("1.5.0");
    });
  });
});
