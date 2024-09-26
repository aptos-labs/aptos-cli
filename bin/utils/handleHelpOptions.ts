import { spawnSync } from "child_process";
import { Command } from "commander";

/**
 * Handle the `--help` option for the Aptos CLI. This function is used to combine
 * the Aptos CLI help output with the Commander help output.
 * @param program - The Commander program instance.
 * @param unknownOptions - The unknown options passed to the CLI.
 * @returns void
 */
export const handleHelpOptions = (
  program: Command,
  unknownOptions: string[]
) => {
  // Capture the Aptos CLI help output
  const cliHelp = spawnSync(`aptos`, unknownOptions, {
    stdio: "pipe",
    encoding: "utf-8",
  });
  // Generate Commander help text
  const commanderHelp = program.helpInformation();

  // Remove the "Usage" and "Options" lines from the Commander output
  const commanderOptionsOnly = commanderHelp
    .split("\n")
    .filter((line) => !line.startsWith("Usage") && !line.startsWith("Options"))
    .join("\n");

  // Find where the CLI options start and append the Commander options to the existing CLI options
  const combinedHelp = cliHelp.stdout.replace(
    "Options:",
    `Options:\n${commanderOptionsOnly.trim()}`
  );

  // Output the combined help
  console.log(combinedHelp);
  return;
};
