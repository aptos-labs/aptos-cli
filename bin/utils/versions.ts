import { execSyncShell } from "./execSyncShell.js";

/**
 * Determine the current SSL version
 */
export const getCurrentOpenSSLVersion = (): string => {
  const out = String(execSyncShell("openssl version", { encoding: "utf8" }));
  return out.split(" ")[1].trim();
};
