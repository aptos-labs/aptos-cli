# Changelog

All notable changes to `@aptos-labs/aptos-cli` npm package will be documented in this file.

## [3.0.0] - 2026-04-14

### Breaking

- **Zero production dependencies**: Removed `commander` in favor of native `process.argv` parsing. CLI behavior is unchanged, but programmatic usage of the argument parser (if any) is not backwards-compatible.
- **Major version bump**: 2.0.0 → 3.0.0

### Changed

- **Native arg parsing**: Replaced Commander.js with a lightweight `parseArgs()` utility (`bin/utils/parseArgs.ts`) that extracts known flags and collects pass-through args for the underlying Aptos CLI binary.
- **ESM clean script**: Replaced CJS `require()` workaround in the `clean` script with ESM `import()`.
- **tsconfig cleanup**: Removed unnecessary `esModuleInterop` and `preserveConstEnums` options; added explicit `types: ["node"]`.
- **Build output**: Test files (`*.test.ts`) are no longer compiled to `dist/` or shipped in the npm package.

### Added

- New `bin/utils/parseArgs.ts` — native CLI argument parser with full test coverage (14 tests).

## [2.0.0] - 2026-03-26

### Breaking

- **Node.js 22+ required**: Minimum engine version raised from Node 18 to Node 22.
- **ESM-only package**: Package is now `"type": "module"` with no CommonJS fallback.

### Changed

- **Biome for linting/formatting**: Replaced ESLint + Prettier with Biome.
- **CI/CD improvements**: Added GitHub Actions workflows for testing, linting, and publishing.
- **CLAUDE.md**: Added project documentation for Claude Code.

## [1.2.0] - 2026-01-27

### Added

- **Custom binary path support**: Added `--binary-path` option to use an existing Aptos CLI binary instead of downloading one ([#26](https://github.com/aptos-labs/aptos-cli/pull/26))
- **Specific version installation**: Added support for `APTOS_CLI_VERSION` environment variable to install or update to a specific CLI version ([#30](https://github.com/aptos-labs/aptos-cli/pull/30))
- **CI/CD artifact support**: Added example Move project and GitHub Actions workflow for building Move artifacts (publish/upgrade payloads) in CI/CD pipelines ([#29](https://github.com/aptos-labs/aptos-cli/pull/29))

### Fixed

- **Exit code piping**: Non-zero exit codes from the Aptos CLI are now properly forwarded to the parent process ([#28](https://github.com/aptos-labs/aptos-cli/pull/28))

### Improved

- **Cross-platform compatibility**: Major improvements to support more platforms ([#27](https://github.com/aptos-labs/aptos-cli/pull/27))
  - Added proper architecture detection (x86_64 vs ARM64) for macOS and Linux
  - Added support for macOS ARM64 (Apple Silicon) with `macos-arm64` target
  - Added support for Linux ARM64 with `Linux-aarch64` target
  - Detect Ubuntu version from `/etc/os-release` (22.04, 24.04, or generic Linux)
  - Aligned installation with official Aptos install scripts from aptos.dev
  - Fixed Windows temp directory handling (uses `%TEMP%` instead of hardcoded path)
  - Added cleanup of temporary files after installation
  - Improved error handling for network errors

## [1.1.0]

- Initial stable release with Homebrew support on macOS
- GitHub direct download for Linux and Windows
- Auto-upgrade functionality via `--update` flag
- Auto-install functionality via `--install` flag
