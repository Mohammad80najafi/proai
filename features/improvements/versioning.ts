export type VersionBump = "patch" | "minor" | "major" | "custom";

export function nextVersionLabel(current: string | null | undefined, bump: VersionBump, custom = "") {
  if (bump === "custom") {
    if (!/^[0-9A-Za-z][0-9A-Za-z._-]{0,31}$/.test(custom)) return null;
    return custom;
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current ?? "");
  const [major, minor, patch] = match ? match.slice(1).map(Number) : [1, 0, 0];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
