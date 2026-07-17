export const CONTENT_IMAGE_URL_PATTERN =
  /^\/(?:api\/)?uploads\/content\/[a-f\d-]+\.(?:png|jpe?g|webp)$/i;

export const MESSAGE_IMAGE_URL_PATTERN =
  /^\/(?:api\/)?uploads\/messages\/[a-f\d-]+\.(?:png|jpe?g|webp)$/i;

export const STORED_IMAGE_FILENAME_PATTERN =
  /^(?:avatars|content|messages)\/[a-f\d-]+\.(?:png|jpe?g|webp)$/i;
