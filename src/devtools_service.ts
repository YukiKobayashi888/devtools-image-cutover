import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";
import { decideCompression } from "./compression_policy.js";

export const requestSchema = z.object({ filename: z.string().min(1), fileBase64: z.string().min(1), originalBytes: z.number().positive() });
export async function optimizeAsset(input: unknown) {
  const request = requestSchema.parse(input);
  const infrai = new InfraiClient();
  await infrai.createBucket(process.env.INFRAI_BUCKET ?? "devtools-assets");
  const uploaded = await infrai.upload(request.fileBase64, request.filename);
  const compressed = await infrai.compress(uploaded.id, true);
  const decision = decideCompression(request.originalBytes, compressed.size_bytes ?? request.originalBytes);
  if (decision.publish) await infrai.presign(process.env.INFRAI_BUCKET ?? "devtools-assets", request.filename);
  return { filename: request.filename, decision, compressedId: compressed.id };
}

if (process.argv[1]?.endsWith("devtools_service.ts")) {
  const input = { filename: "widget.png", fileBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==", originalBytes: 100000 };
  optimizeAsset(input).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
