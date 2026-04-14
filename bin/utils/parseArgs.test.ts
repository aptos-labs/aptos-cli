import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseArgs } from "./parseArgs.js";

describe("parseArgs", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as () => never);
    mockError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults for empty args", () => {
    const result = parseArgs([]);
    expect(result).toEqual({
      install: false,
      update: false,
      directDownload: false,
      rest: [],
    });
  });

  it("parses --install flag", () => {
    expect(parseArgs(["--install"]).install).toBe(true);
  });

  it("parses -i flag", () => {
    expect(parseArgs(["-i"]).install).toBe(true);
  });

  it("parses --update flag", () => {
    expect(parseArgs(["--update"]).update).toBe(true);
  });

  it("parses -u flag", () => {
    expect(parseArgs(["-u"]).update).toBe(true);
  });

  it("parses --direct-download flag", () => {
    expect(parseArgs(["--direct-download"]).directDownload).toBe(true);
  });

  it("parses -d flag", () => {
    expect(parseArgs(["-d"]).directDownload).toBe(true);
  });

  it("parses --binary-path with value", () => {
    expect(parseArgs(["--binary-path", "/usr/bin/aptos"]).binaryPath).toBe(
      "/usr/bin/aptos",
    );
  });

  it("parses -b with value", () => {
    expect(parseArgs(["-b", "/usr/bin/aptos"]).binaryPath).toBe(
      "/usr/bin/aptos",
    );
  });

  it("exits when --binary-path has no value", () => {
    parseArgs(["--binary-path"]);
    expect(mockError).toHaveBeenCalledWith(
      "error: --binary-path requires a path argument",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("collects unknown args as rest", () => {
    const result = parseArgs(["move", "compile", "--dev"]);
    expect(result.rest).toEqual(["move", "compile", "--dev"]);
  });

  it("separates known flags from unknown args", () => {
    const result = parseArgs(["--install", "move", "compile", "--dev"]);
    expect(result.install).toBe(true);
    expect(result.rest).toEqual(["move", "compile", "--dev"]);
  });

  it("handles mixed flags and pass-through args", () => {
    const result = parseArgs([
      "-d",
      "-b",
      "/path/to/bin",
      "node",
      "run",
      "--profile",
      "default",
    ]);
    expect(result.directDownload).toBe(true);
    expect(result.binaryPath).toBe("/path/to/bin");
    expect(result.rest).toEqual(["node", "run", "--profile", "default"]);
  });

  it("passes --help through as a rest arg", () => {
    const result = parseArgs(["--help"]);
    expect(result.rest).toEqual(["--help"]);
  });
});
