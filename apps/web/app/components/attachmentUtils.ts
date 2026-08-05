import { Attachment } from "@mail-agent/shared";

export type AttachmentKind =
  | "archive"
  | "audio"
  | "code"
  | "document"
  | "image"
  | "other"
  | "video";

export interface ComposerAttachmentItem {
  id: string;
  kind: AttachmentKind;
  mimeType: string;
  name: string;
  previewUrl?: string;
  size: number;
}

export const COMPOSER_ATTACHMENT_WARNING_SIZE = 10 * 1024 * 1024;
export const COMPOSER_ATTACHMENT_HARD_SIZE = 25 * 1024 * 1024;

const cautionExtensions = new Set(["exe", "app", "bat", "cmd", "msi", "dmg", "pkg", "sh"]);

const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "avif"]);
const videoExtensions = new Set(["mp4", "mov", "webm", "m4v", "avi", "mkv"]);
const audioExtensions = new Set(["mp3", "wav", "m4a", "ogg", "aac", "flac"]);
const archiveExtensions = new Set(["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"]);
const codeExtensions = new Set([
  "js",
  "ts",
  "tsx",
  "jsx",
  "json",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "css",
  "scss",
  "html",
  "md",
  "yml",
  "yaml",
  "sh",
  "sql"
]);

function getExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function getAttachmentExtension(filename: string) {
  return getExtension(filename);
}

export function getAttachmentKind(filename: string, mimeType: string): AttachmentKind {
  const extension = getExtension(filename);
  const normalizedType = mimeType.toLowerCase();

  if (normalizedType.startsWith("image/") || imageExtensions.has(extension)) {
    return "image";
  }

  if (normalizedType.startsWith("video/") || videoExtensions.has(extension)) {
    return "video";
  }

  if (normalizedType.startsWith("audio/") || audioExtensions.has(extension)) {
    return "audio";
  }

  if (
    normalizedType.includes("zip") ||
    normalizedType.includes("compressed") ||
    archiveExtensions.has(extension)
  ) {
    return "archive";
  }

  if (
    normalizedType.startsWith("text/") ||
    normalizedType.includes("json") ||
    normalizedType.includes("javascript") ||
    normalizedType.includes("typescript") ||
    normalizedType.includes("xml") ||
    codeExtensions.has(extension)
  ) {
    return "code";
  }

  if (
    normalizedType.includes("pdf") ||
    normalizedType.includes("document") ||
    normalizedType.includes("sheet") ||
    normalizedType.includes("presentation")
  ) {
    return "document";
  }

  return "other";
}

export function getAttachmentKindLabel(kind: AttachmentKind) {
  switch (kind) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "archive":
      return "Archive";
    case "code":
      return "Code";
    case "document":
      return "Document";
    default:
      return "File";
  }
}

export function getAttachmentTone(kind: AttachmentKind) {
  switch (kind) {
    case "image":
    case "video":
      return "active" as const;
    case "archive":
      return "warning" as const;
    case "code":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export function toComposerAttachmentItem(file: File): ComposerAttachmentItem {
  const mimeType = file.type || "application/octet-stream";
  const kind = getAttachmentKind(file.name, mimeType);

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    kind,
    mimeType,
    name: file.name,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    size: file.size
  };
}

export function revokeComposerAttachmentPreview(attachment: ComposerAttachmentItem) {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

export function getAttachmentSummary(attachment: Attachment | ComposerAttachmentItem) {
  const filename = "filename" in attachment ? attachment.filename : attachment.name;
  const mimeType = attachment.mimeType;
  const kind = "kind" in attachment ? attachment.kind : getAttachmentKind(filename, mimeType);

  return {
    filename,
    extension: getAttachmentExtension(filename),
    kind,
    kindLabel: getAttachmentKindLabel(kind),
    mimeType,
    tone: getAttachmentTone(kind)
  };
}

export function getComposerAttachmentWarnings(attachment: ComposerAttachmentItem) {
  const warnings: string[] = [];
  const extension = getAttachmentExtension(attachment.name);

  if (attachment.size >= COMPOSER_ATTACHMENT_HARD_SIZE) {
    warnings.push("Exceeds 25 MB recommended send size");
  } else if (attachment.size >= COMPOSER_ATTACHMENT_WARNING_SIZE) {
    warnings.push("Large file");
  }

  if (cautionExtensions.has(extension)) {
    warnings.push(`Potentially risky .${extension} file`);
  }

  return warnings;
}
