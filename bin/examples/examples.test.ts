import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const WORKSPACE_ROOT = join(__dirname, "../..");
const EXAMPLES_DIR = join(WORKSPACE_ROOT, "examples");
const HELLO_BLOCKCHAIN_DIR = join(EXAMPLES_DIR, "hello_blockchain");

describe("Example Move Projects", () => {
  describe("hello_blockchain example", () => {
    it("should have Move.toml configuration file", () => {
      const moveTomlPath = join(HELLO_BLOCKCHAIN_DIR, "Move.toml");
      expect(existsSync(moveTomlPath)).toBe(true);

      const content = readFileSync(moveTomlPath, "utf-8");
      expect(content).toContain('[package]');
      expect(content).toContain('name = "HelloBlockchain"');
      expect(content).toContain('[addresses]');
      expect(content).toContain('hello_blockchain');
      expect(content).toContain('[dependencies.AptosFramework]');
    });

    it("should have source files", () => {
      const sourcesDir = join(HELLO_BLOCKCHAIN_DIR, "sources");
      expect(existsSync(sourcesDir)).toBe(true);

      const messageMovePath = join(sourcesDir, "message.move");
      expect(existsSync(messageMovePath)).toBe(true);
    });

    it("should have valid Move module structure", () => {
      const messageMovePath = join(HELLO_BLOCKCHAIN_DIR, "sources/message.move");
      const content = readFileSync(messageMovePath, "utf-8");

      // Verify module declaration
      expect(content).toContain("module hello_blockchain::message");

      // Verify it has required components for a deployable module
      expect(content).toContain("public entry fun");
      expect(content).toContain("has key");

      // Verify it has a test
      expect(content).toContain("#[test");
    });
  });
});

describe("Build Move Artifacts Workflow", () => {
  const workflowPath = join(WORKSPACE_ROOT, ".github/workflows/build-move-artifacts.yaml");

  it("should have the workflow file", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("should contain required workflow configuration", () => {
    const content = readFileSync(workflowPath, "utf-8");

    // Verify workflow structure
    expect(content).toContain("name: Build Move Artifacts");
    expect(content).toContain("on:");
    expect(content).toContain("jobs:");

    // Verify it installs the CLI
    expect(content).toContain("Install Aptos CLI");
    expect(content).toContain("--install");

    // Verify it builds Move package
    expect(content).toContain("Build Move package");
    expect(content).toContain("move compile");
    expect(content).toContain("--named-addresses");
    expect(content).toContain("--save-metadata");

    // Verify it generates publish payload
    expect(content).toContain("Generate publish payload");
    expect(content).toContain("build-publish-payload");
    expect(content).toContain("--json-output-file");

    // Verify artifact upload step
    expect(content).toContain("Upload build artifacts");
    expect(content).toContain("actions/upload-artifact");
  });

  it("should have artifact download job for downstream usage", () => {
    const content = readFileSync(workflowPath, "utf-8");

    // Verify there's a job that uses artifacts
    expect(content).toContain("use-artifacts");
    expect(content).toContain("needs: build-artifacts");
    expect(content).toContain("actions/download-artifact");
  });

  it("should demonstrate upgrade payload generation", () => {
    const content = readFileSync(workflowPath, "utf-8");

    // Verify upgrade payload example is present
    expect(content).toContain("build-upgrade-payload");
    expect(content).toContain("--object-address");
  });
});
