import { PNAME } from "./consts.js";

/**
 * Query the GitHub API to find the latest CLI release. We assume that the CLI is in
 * the last 100 releases so we don't paginate through the releases.
 */
export const getLatestVersionGh = async () => {
  const prefix = `${PNAME}-v`;
  const response = await (
    await fetch(
      "https://api.github.com/repos/aptos-labs/aptos-core/releases?per_page=100"
    )
  ).json();
  for (const release of response) {
    if (release["tag_name"].startsWith(`${prefix}`)) {
      return release.tag_name.replace(`${prefix}`, "");
    }
  }
  throw "Could not determine latest version of Aptos CLI";
};
