import { PNAME } from "./consts.js";

interface GitHubRelease {
  tag_name: string;
  [key: string]: unknown;
}

/**
 * Query the GitHub API to find the latest CLI release. We assume that the CLI is in
 * the last 100 releases so we don't paginate through the releases.
 */
export const getLatestVersionGh = async (): Promise<string> => {
  const prefix = `${PNAME}-v`;
  const url =
    "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100";

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Failed to fetch releases from GitHub: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    if (response.status === 403) {
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
  } catch (error) {
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
