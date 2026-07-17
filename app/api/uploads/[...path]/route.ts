import { STORED_IMAGE_FILENAME_PATTERN } from "@/lib/upload-paths";
import { readUploadedImage } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const filename = (await params).path.join("/");
  if (!STORED_IMAGE_FILENAME_PATTERN.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const image = await readUploadedImage(filename);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.bytes.length),
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
