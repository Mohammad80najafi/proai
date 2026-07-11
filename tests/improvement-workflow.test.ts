import { describe, expect, it } from "vitest";

import { diffLines } from "@/features/improvements/snapshot-diff";
import { nextVersionLabel } from "@/features/improvements/versioning";

describe("improvement workflow helpers", () => {
  it("calculates semantic version choices", () => {
    expect(nextVersionLabel("1.4.2", "patch")).toBe("1.4.3");
    expect(nextVersionLabel("1.4.2", "minor")).toBe("1.5.0");
    expect(nextVersionLabel("1.4.2", "major")).toBe("2.0.0");
    expect(nextVersionLabel("1.4.2", "custom", "2.0-beta")).toBe("2.0-beta");
    expect(nextVersionLabel("1.4.2", "custom", "bad label")).toBeNull();
  });

  it("produces stable added and removed lines for review", () => {
    expect(diffLines("keep\nremove", "keep\nadd")).toEqual([
      { kind: "same", value: "keep" },
      { kind: "removed", value: "remove" },
      { kind: "added", value: "add" },
    ]);
  });
});
