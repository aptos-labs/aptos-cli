import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Create a mock child process that can emit events
const createMockChildProcess = () => {
  const emitter = new EventEmitter();
  return emitter;
};

let mockChildProcess: EventEmitter;

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockChildProcess),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("../utils/getUserOs.js", () => ({
  getPlatformInfo: vi.fn(() => ({ os: "linux", arch: "x64" })),
}));

vi.mock("../utils/getLocalBinPath.js", () => ({
  getLocalBinPath: vi.fn(() => "/home/user/.local/bin/aptos"),
}));

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { runCLI } from "./run.js";

describe("run", () => {
  const mockExit = vi.fn<(code?: number) => never>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockChildProcess = createMockChildProcess();
    vi.stubGlobal("process", {
      ...process,
      exit: mockExit,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("runCLI", () => {
    it("should spawn the CLI with provided arguments", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["info", "--verbose"]);

      expect(spawn).toHaveBeenCalledWith(
        "/home/user/.local/bin/aptos",
        ["info", "--verbose"],
        expect.objectContaining({
          stdio: "inherit",
        }),
      );
    });

    it("should use custom binary path when provided", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["info"], "/custom/path/aptos");

      expect(spawn).toHaveBeenCalledWith(
        "/custom/path/aptos",
        ["info"],
        expect.any(Object),
      );
    });

    it("should exit with non-zero code when child process exits with non-zero code", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["invalid-command"]);

      // Simulate child process exiting with code 1
      mockChildProcess.emit("exit", 1);

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should exit with the exact exit code from child process", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["some-command"]);

      // Simulate child process exiting with code 42
      mockChildProcess.emit("exit", 42);

      expect(mockExit).toHaveBeenCalledWith(42);
    });

    it("should not call process.exit when child process exits with code 0", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["info"]);

      // Simulate child process exiting with code 0 (success)
      mockChildProcess.emit("exit", 0);

      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should not call process.exit when child process exits with null code", async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await runCLI(["info"]);

      // Simulate child process exiting with null (e.g., killed by signal)
      mockChildProcess.emit("exit", null);

      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should print error and exit if custom binary path does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await runCLI(["info"], "/nonexistent/path/aptos");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error: Binary not found at specified path: /nonexistent/path/aptos",
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(spawn).not.toHaveBeenCalled();
    });

    it("should print install message if default binary does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await runCLI(["info"]);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Aptos CLI not installed, run `npx aptos --install` to install",
      );
      expect(spawn).not.toHaveBeenCalled();
    });
  });
});
