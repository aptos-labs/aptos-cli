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

### Using a Custom Binary

If you already have the Aptos CLI binary installed on your system, you can use it directly without installing it again by specifying the path to the binary:

```bash
npx aptos --binary-path /path/to/aptos <command>
```

**Examples:**

If you have the Aptos CLI installed globally via brew on macOS:
```bash
npx aptos --binary-path /opt/homebrew/bin/aptos account list
```

If you have the Aptos CLI in `/usr/local/bin` on Linux:
```bash
npx aptos --binary-path /usr/local/bin/aptos init
```

You can also use the short form `-b`:
```bash
npx aptos -b /path/to/aptos move compile
```

This is useful if:
- You already have the Aptos CLI installed elsewhere on your system
- You want to use a custom build of the CLI
- You want to avoid downloading and installing multiple copies of the binary

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
