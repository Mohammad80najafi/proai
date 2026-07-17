import { describe, expect, it } from "vitest";

import {
  CONTENT_IMAGE_URL_PATTERN,
  MESSAGE_IMAGE_URL_PATTERN,
  STORED_IMAGE_FILENAME_PATTERN,
} from "@/lib/upload-paths";

describe("stored upload paths", () => {
  it("accepts persisted and legacy image URLs but rejects traversal", () => {
    expect(CONTENT_IMAGE_URL_PATTERN.test("/api/uploads/content/a1-b2.webp")).toBe(true);
    expect(CONTENT_IMAGE_URL_PATTERN.test("/uploads/content/a1-b2.jpg")).toBe(true);
    expect(MESSAGE_IMAGE_URL_PATTERN.test("/api/uploads/messages/a1-b2.png")).toBe(true);
    expect(STORED_IMAGE_FILENAME_PATTERN.test("content/../../secret.png")).toBe(false);
  });
});
