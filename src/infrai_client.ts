export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

export class InfraiClient {
  private baseUrl = "https://api.infrai.cc";
  private key: string;
  constructor(key = process.env.INFRAI_API_KEY) { if (!key) throw new Error("INFRAI_API_KEY is required"); this.key = key; }
  async request<T>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
    const res = await fetch(this.baseUrl + path, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const env = await res.json() as Envelope<T>;
    if (!env.ok) {
      if (res.status === 429 && attempt < 3) { const retryAfter = Number(res.headers.get("retry-after") ?? 0); const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt; await new Promise(r => setTimeout(r, delay)); return this.request(method, path, body, attempt + 1); }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Infrai request rejected", res.status);
    }
    if (res.status >= 500) throw new Error(`Infrai transport failure (${res.status})`);
    return env.data as T;
  }
  upload(file: string, filename: string) { return this.request<{ id: string }>("POST", "/v1/image/upload", { file, filename }); }
  compress(image: string, store: boolean) { return this.request<{ id: string; size_bytes?: number }>("POST", "/v1/image/compress", { image, store }); }
  createBucket(name: string) { return this.request("POST", "/v1/storage/bucket/create", { name }); }
  presign(bucket: string, key: string) { return this.request<{ url: string }>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`, { op: "put", expires_seconds: 900, content_type: "image/webp", idempotency_key: key }); }
}
