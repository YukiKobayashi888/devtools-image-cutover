import assert from "node:assert/strict";
import { decideCompression } from "../src/compression_policy.js";
const accepted = decideCompression(1000, 800);
assert.equal(accepted.publish, true);
assert.equal(accepted.reason, "release threshold met");
const rejected = decideCompression(1000, 900);
assert.equal(rejected.publish, false);
console.log("compression policy test passed");
