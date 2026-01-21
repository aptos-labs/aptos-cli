import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { getLatestVersionGh } from "./ghOperations.js";

describe("ghOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
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
        })
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
        })
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
        "GitHub API rate limit exceeded"
      );
    });

    it("should throw on rate limit (429)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "GitHub API rate limit exceeded"
      );
    });

    it("should throw on other HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "GitHub API request failed with status 500"
      );
    });

    it("should throw on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Failed to fetch releases from GitHub"
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
        "Could not determine latest version of Aptos CLI"
      );
    });

    it("should throw on invalid JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Failed to parse GitHub API response"
      );
    });

    it("should throw when response is not an array", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "not an array" }),
      });

      await expect(getLatestVersionGh()).rejects.toThrow(
        "Unexpected response format"
      );
    });
  });
});
