// ═══════════════════════════════════════════════════════════════════════════
// SUFY Storage adapter (Express port of the former Supabase Edge Function
// `_shared/sufyStorage.ts`). SUFY is S3-protocol compatible, so requests are
// signed with AWS SigV4 using plain Node `crypto` (no extra dependency).
// Credentials never leave this module / the server process.
// ═══════════════════════════════════════════════════════════════════════════

import crypto from "crypto";

export interface SufyConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

export function loadSufyConfig(): SufyConfig | null {
  const accessKeyId = process.env.SUFY_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUFY_SECRET_ACCESS_KEY;
  const bucket = process.env.SUFY_BUCKET;
  const region = process.env.SUFY_REGION;

  if (!accessKeyId || !secretAccessKey || !bucket || !region) return null;
  return { accessKeyId, secretAccessKey, bucket, region };
}

function objectUrl(config: SufyConfig, key: string): string {
  return `https://${config.bucket}.mos.${config.region}.sufybkt.com/${key}`;
}

export function sufyPublicUrl(config: SufyConfig, key: string): string {
  return objectUrl(config, key);
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function amzDate(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

/**
 * Generates a presigned PUT URL the browser can upload directly to.
 * Expires in `ttlSeconds` (default 5 minutes) — plenty for a single upload.
 */
export async function presignPutUrl(
  config: SufyConfig,
  key: string,
  contentType: string,
  ttlSeconds = 300,
): Promise<string> {
  const service = "s3";
  const { amzDate: xAmzDate, dateStamp } = amzDate();
  const host = `${config.bucket}.mos.${config.region}.sufybkt.com`;
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": xAmzDate,
    "X-Amz-Expires": String(ttlSeconds),
    "X-Amz-SignedHeaders": "content-type;host",
  };

  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&");

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const canonicalRequest = [
    "PUT",
    `/${key}`,
    canonicalQuery,
    canonicalHeaders,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    xAmzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, config.region, service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return `https://${host}/${key}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** Deletes an object from the bucket (used when a user removes their own media). */
export async function deleteObject(config: SufyConfig, key: string): Promise<Response> {
  const service = "s3";
  const { amzDate: xAmzDate, dateStamp } = amzDate();
  const host = `${config.bucket}.mos.${config.region}.sufybkt.com`;
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const payloadHash = sha256Hex("");

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${xAmzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["DELETE", `/${key}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", xAmzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, config.region, service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${host}/${key}`, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": xAmzDate,
    },
  });
}
