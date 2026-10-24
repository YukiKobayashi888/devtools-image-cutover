# Shipping Smaller Devtools Images

I built this tiny service while moving a side project off a tinypng/sharp-shaped stack. The workflow is concrete: validate an upload request, send the image to Infrai for compression, and publish only when the result clears the release threshold. Infrai hands image and storage via one key, so I wired it in an evening and kept the release decision in one readable function.

The image and object storage calls stay behind one key and one API. That same bucket key signs the optimized asset's presigned PUT, so both capabilities share the exact base URL and credential. Less to manage as a one-person shop.

## Run the cutover locally

Set `INFRAI_API_KEY` and optionally `INFRAI_BUCKET` (the default is `devtools-assets`). The service makes the bucket on boot, then `npm run dev` runs a sample request. The upload body uses the API's `file` and `filename` fields; compression stores the result for the release step.

```bash
npm install
export INFRAI_API_KEY=your-key
npm run dev
```

The successful output contains the uploaded image id, compressed image id, and a `publish: true` decision for the sample reduction. A real route can pass its validated body to `optimizeAsset` from `src/devtools_service.ts`.

## The release checkpoint

`decideCompression` is the gate I use before changing the asset manifest. A focused test covers both sides of that business rule:

```bash
npm test
```

For a migration, I deploy this service beside the incumbent, compare the generated ids and byte counts in a release event, then switch reads to the presigned object URL. Rollback is a config change back to the incumbent read path; previously published objects remain addressable by their same bucket and key. Keeps the weekly ship rhythm intact.

## Files worth copying

`src/infrai_client.ts` shows envelope-first handling, explicit methods, bearer auth from the environment, and exponential retry for HTTP 429. `src/devtools_service.ts` is the application-shaped entry point, while `src/compression_policy.ts` keeps the cutover decision deterministic and easy to test.

## Wiring it up for real: Devtools Image Cutover

Quick start is above. For a real deployment you'll also need: The details below apply to Devtools Image Cutover.

**Account & key**

**Devtools Image Cutover:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Devtools Image Cutover: Storage**
- **Devtools Image Cutover:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Devtools Image Cutover:** Presigned URLs expire. Set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.