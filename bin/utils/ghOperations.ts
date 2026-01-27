import { PNAME, GH_CLI_DOWNLOAD_URL } from "./consts.js";

interface GitHubRelease {
  tag_name: string;
  [key: string]: unknown;
}

/**
 * Build headers for GitHub API requests.
 * Uses GITHUB_TOKEN environment variable if available for authenticated requests.
 */
const getGitHubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "aptos-cli-npm",
  };

  // Use GITHUB_TOKEN if available for higher rate limits
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Get the user-specified CLI version from environment variable.
 * Returns undefined if not set.
 */
export const getUserSpecifiedVersion = (): string | undefined => {
  const version = process.env.APTOS_CLI_VERSION;
  if (!version) {
    return undefined;
  }
  // Strip 'v' prefix if present (e.g., "v1.2.3" -> "1.2.3")
  return version.replace(/^v/, "");
};

/**
 * Check if a user has specified a CLI version via environment variable.
 */
export const hasUserSpecifiedVersion = (): boolean => {
  return !!process.env.APTOS_CLI_VERSION;
};

/**
 * Validate that a specific version exists by checking if the release assets are accessible.
 * Uses a HEAD request to avoid downloading the actual file.
 *
 * @param version - The version to validate (without 'v' prefix)
 * @param targetPlatform - The target platform string (e.g., "Ubuntu-22.04-x86_64")
 */
export const validateVersionExists = async (
  version: string,
  targetPlatform: string
): Promise<boolean> => {
  const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${version}/${PNAME}-${version}-${targetPlatform}.zip`;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: getGitHubHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get the CLI version to use.
 * If APTOS_CLI_VERSION is set, returns that version (after validation).
 * Otherwise, returns the latest version from GitHub.
 *
 * @param targetPlatform - Optional target platform for version validation
 */
export const getCliVersion = async (
  targetPlatform?: string
): Promise<string> => {
  const userVersion = getUserSpecifiedVersion();

  if (userVersion) {
    // If a target platform is provided, validate the version exists
    if (targetPlatform) {
      const exists = await validateVersionExists(userVersion, targetPlatform);
      if (!exists) {
        throw new Error(
          `Specified version ${userVersion} does not exist or is not available for ${targetPlatform}. ` +
            `Check https://github.com/aptos-labs/aptos-core/releases for available versions.`
        );
      }
    }
    return userVersion;
  }

  return getLatestVersionGh();
};

/**
 * Query the GitHub API to find the latest CLI release. We assume that the CLI is in
 * the last 100 releases so we don't paginate through the releases.
 *
 * Set GITHUB_TOKEN environment variable for higher rate limits.
 */
export const getLatestVersionGh = async (): Promise<string> => {
  const prefix = `${PNAME}-v`;
  const url =
    "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100";

  let response: Response;
  try {
    response = await fetch(url, { headers: getGitHubHeaders() });
  } catch (error) {
    throw new Error(
      `Failed to fetch releases from GitHub: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error(
        "GitHub API rate limit exceeded. Please try again later or set a GITHUB_TOKEN environment variable."
      );
    }
    throw new Error(
      `GitHub API request failed with status ${response.status}: ${response.statusText}`
    );
  }

  let releases: GitHubRelease[];
  try {
    releases = await response.json();
  } catch {
    throw new Error("Failed to parse GitHub API response as JSON");
  }

  if (!Array.isArray(releases)) {
    throw new Error("Unexpected response format from GitHub API");
  }

  for (const release of releases) {
    if (release.tag_name?.startsWith(prefix)) {
      return release.tag_name.replace(prefix, "");
    }
  }

  throw new Error(
    "Could not determine latest version of Aptos CLI. No matching release found in the last 100 releases."
  );
};
