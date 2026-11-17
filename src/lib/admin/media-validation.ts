import { validateUpload } from "@/lib/catalog/validation";
const extensions: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
};
export function validateMediaFile(
  file: { name: string; type: string; size: number },
  kind: string,
) {
  const invalid = validateUpload(file, kind);
  if (invalid) return invalid;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !extensions[file.type]?.includes(extension))
    return "Ekstensi file tidak sesuai dengan tipe file.";
  return null;
}
export function storedPathValid(path: string, appId: string, type: string) {
  const extension = path.split(".").pop() ?? "";
  return (
    new RegExp("^" + appId + "/[a-f0-9-]+\\.(jpg|png|webp|mp4|webm)$").test(
      path,
    ) && Boolean(extensions[type]?.includes(extension))
  );
}
export function matchesFileSignature(bytes: Uint8Array, type: string) {
  const at = (...values: number[]) => values.every((v, i) => bytes[i] === v);
  const text = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  switch (type) {
    case "image/png":
      return at(137, 80, 78, 71, 13, 10, 26, 10);
    case "image/jpeg":
      return at(255, 216, 255);
    case "image/webp":
      return text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
    case "video/mp4":
      return text(4, 8) === "ftyp";
    case "video/webm":
      return at(26, 69, 223, 163);
    default:
      return false;
  }
}
