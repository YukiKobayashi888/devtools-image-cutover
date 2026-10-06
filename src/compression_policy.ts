export type AssetDecision = { publish: boolean; reason: string };
export function decideCompression(originalBytes: number, compressedBytes: number): AssetDecision {
  if (compressedBytes <= 0 || originalBytes <= 0) return { publish: false, reason: "invalid sizes" };
  const savings = 1 - compressedBytes / originalBytes;
  return savings >= 0.15 ? { publish: true, reason: "release threshold met" } : { publish: false, reason: "release threshold not met" };
}
