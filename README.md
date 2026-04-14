# Aptos CLI

The `@aptos-labs/aptos-cli` package allows you to use the Aptos CLI from inside a `Nodejs` project.

## Download

To install the Aptos CLI, you need to have Node.js and npm installed on your system. Then, you can install it using:

```bash
npm install @aptos-labs/aptos-cli
```

That command will download the Aptos CLI and create a Node bin file, making it available to use in a Node environment.

## Install

Once you have the package installed and the Node bin file, you can run the following command, in your project environment, to install the Aptos CLI in your project:

```bash
npx aptos --install
```

Alternatively, you can simply run the cli using the `npx aptos` command. That will install the Aptos CLI in your project if it's not already installed.

```bash
npx aptos
```

## Usage

To use the Aptos CLI, in your project environment, run the `npx aptos` command, to see the available commands.

```bash
npx aptos
```

After the binary is installed, extra arguments are forwarded to the Aptos CLI. For example:

```bash
npx aptos --help
```

```bash
npx aptos move compile --package-dir ./my-move-package
```

### Using a Custom Binary

If you already have the Aptos CLI binary installed on your system, you can specify its path to use it directly:

```bash
npx aptos --binary-path /path/to/aptos <command>
```

### Installing a Specific Version

You can install a specific version of the Aptos CLI by setting the `APTOS_CLI_VERSION` environment variable:

```bash
# Install version 4.5.0
APTOS_CLI_VERSION=4.5.0 npx aptos --install

# Or with the v prefix
APTOS_CLI_VERSION=v4.5.0 npx aptos --install
```

When `APTOS_CLI_VERSION` is set:
- The specified version is downloaded directly from GitHub releases (package managers are bypassed)
- The version is validated to ensure it exists before downloading
- This works for both `--install` and `--update` commands

This is useful for:
- Pinning to a known working version
- Testing against specific CLI versions
- Reproducible builds in CI/CD pipelines

## Updating the Aptos CLI

To update the Aptos CLI, you can run the following command within your project environment:

```bash
npx aptos --update
```

## Development

To set up the project for development:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

This will build the project and run the CLI.

## Building

To build the project:

```bash
npm run build
```

## Building Move Artifacts in CI/CD

The Aptos CLI can be used in CI/CD pipelines to build Move packages and generate deployment payloads. This is useful for automated deployments and multi-step workflows.

### Example: Building Publish Payload

```yaml
# In your GitHub Actions workflow

# Prerequisites: Set up Node.js first
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20"

- name: Install Aptos CLI npm package
  run: npm install @aptos-labs/aptos-cli

- name: Install Aptos CLI
  run: npx aptos --install

- name: Build Move package
  working-directory: your-move-project
  run: |
    ~/.local/bin/aptos move compile \
      --named-addresses your_module=0x1 \
      --save-metadata

- name: Generate publish payload
  working-directory: your-move-project
  run: |
    ~/.local/bin/aptos move build-publish-payload \
      --named-addresses your_module=0x1 \
      --json-output-file publish-payload.json \
      --assume-yes

- name: Upload artifact for later steps
  uses: actions/upload-artifact@v4
  with:
    name: move-artifacts
    path: your-move-project/publish-payload.json
```

### Example: Building Upgrade Payload (Object Code Deployment)

For upgrading existing object-deployed contracts:

```yaml
- name: Generate upgrade payload
  working-directory: your-move-project
  run: |
    ~/.local/bin/aptos move build-upgrade-payload \
      --named-addresses your_module=0x1 \
      --object-address 0xYOUR_OBJECT_ADDRESS \
      --json-output-file upgrade-payload.json \
      --assume-yes
```

### Using Artifacts in Subsequent Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # ... build steps above ...
      - uses: actions/upload-artifact@v4
        with:
          name: move-artifacts
          path: your-move-project/publish-payload.json

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: move-artifacts

      - name: Use the payload
        run: |
          # The payload JSON can be used for deployment
          cat publish-payload.json
```

See the [build-move-artifacts.yaml](.github/workflows/build-move-artifacts.yaml) workflow for a complete working example.
