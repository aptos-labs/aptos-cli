# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Node.js npm package (`@aptos-labs/aptos-cli`) that wraps the Aptos blockchain CLI, providing cross-platform installation and execution. Uses Commander.js for CLI argument parsing. Published as the `aptos` command when installed via npm.

## Commands

```bash
# Install dependencies (pnpm is the package manager, but npm works too)
pnpm install

# Build (cleans dist/ then compiles TypeScript)
pnpm run build

# Build and run the CLI
pnpm run dev

# Run all tests (single run)
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run a single test file
pnpm vitest run bin/tasks/install.test.ts

# Lint and format check
pnpm run check

# Auto-fix lint and formatting issues
pnpm run check:fix
```

Uses Biome for linting and formatting (config in `biome.json`). TypeScript strict mode (`tsc`) provides type checking. Node.js imports must use the `node:` protocol (e.g., `import { existsSync } from "node:fs"`).

## Architecture

**Entry point**: `bin/aptos.ts` — CLI wrapper using Commander.js that delegates to task modules.

**Task modules** (`bin/tasks/`):
- `install.ts` — Platform-aware installation: macOS uses Homebrew, Windows uses winget/Chocolatey, all platforms fall back to direct GitHub release download
- `run.ts` — Executes the installed binary, piping exit codes
- `update.ts` — Updates CLI to latest version

**Utilities** (`bin/utils/`):
- `getUserOs.ts` — Detects OS, architecture, and Ubuntu version; returns a `TargetPlatform` string used for GitHub release artifact naming
- `ghOperations.ts` — GitHub API interactions for fetching releases and validating versions
- `brewOperations.ts` / `windowsPackageManagers.ts` — Package manager detection and installation
- `getLocalBinPath.ts` — Resolves install path (`~/.local/bin/` on Unix, `%APPDATA%\local\bin\` on Windows)
- `consts.ts` — Shared constants

**Build output**: TypeScript in `bin/` compiles to `dist/` (ES2020 modules, strict mode, source maps, declarations).

## Testing

Tests are co-located with source files as `*.test.ts`. Uses Vitest with globals enabled (no imports needed for `describe`, `it`, `expect`). Tests heavily mock system functions (`fs`, `child_process`) using `vi.mock()` and `vi.mocked()`. Pattern: `beforeEach` clears mocks, `afterEach` restores them.

## Key Types

```typescript
type SupportedOS = "macos" | "linux" | "windows";
type SupportedArch = "x86_64" | "aarch64";
type TargetPlatform = "macos-x86_64" | "macos-arm64" | "Ubuntu-22.04-x86_64" | "Ubuntu-24.04-x86_64" | "Linux-x86_64" | "Linux-aarch64" | "Windows-x86_64";
```

## Environment Variables

- `APTOS_CLI_VERSION` — Pin a specific CLI version (e.g., "4.5.0")
- `APTOS_DIRECT_DOWNLOAD` — Set to "1" or "true" to skip package managers
- `GITHUB_TOKEN` — For GitHub API rate limiting in CI
