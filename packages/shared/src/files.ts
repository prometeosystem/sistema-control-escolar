/** Límite por archivo: 10 MB (PDF, docs, imágenes). Links no pesan. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedFileMime = (typeof ALLOWED_FILE_MIME_TYPES)[number];

export function isAllowedFileMime(mime: string): mime is AllowedFileMime {
  return (ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(mime);
}
