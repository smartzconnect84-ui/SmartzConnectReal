// ═══════════════════════════════════════════════════════════════════════════
// SUFY Storage adapter — single shared owner of "object storage access" on
// the server side (see ARCHITECTURE_RESPONSIBILITY.md, gap #1).
//
// SUFY is S3-protocol compatible, so we sign requests with SigV4 using the
// lightweight `aws4fetch` client (Deno-friendly, no Node polyfills required).
// Credentials never leave this module / the edge function runtime.
// ═══════════════════════════════════════════════════════════════════════════

import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'

export interface SufyConfig {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region: string
}

export function loadSufyConfig(): SufyConfig | null {
  const accessKeyId = Deno.env.get('SUFY_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('SUFY_SECRET_ACCESS_KEY')
  const bucket = Deno.env.get('SUFY_BUCKET')
  const region = Deno.env.get('SUFY_REGION')

  if (!accessKeyId || !secretAccessKey || !bucket || !region) {
    return null
  }
  return { accessKeyId, secretAccessKey, bucket, region }
}

function objectUrl(config: SufyConfig, key: string): string {
  // Sufy virtual-hosted-style endpoint: <bucket>.mos.<region>.sufybkt.com
  return `https://${config.bucket}.mos.${config.region}.sufybkt.com/${key}`
}

/** Public URL clients should store/display once the object is uploaded. */
export function sufyPublicUrl(config: SufyConfig, key: string): string {
  return objectUrl(config, key)
}

function sufyClient(config: SufyConfig): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    service: 's3',
  })
}

/**
 * Generates a presigned PUT URL the browser can upload directly to.
 * Expires in `ttlSeconds` (default 5 minutes) — plenty for a single upload.
 */
export async function presignPutUrl(
  config: SufyConfig,
  key: string,
  contentType: string,
  ttlSeconds = 300
): Promise<string> {
  const client = sufyClient(config)
  const url = new URL(objectUrl(config, key))
  url.searchParams.set('X-Amz-Expires', String(ttlSeconds))

  const signedRequest = await client.sign(
    new Request(url, { method: 'PUT', headers: { 'content-type': contentType } }),
    { aws: { signQuery: true } }
  )
  return signedRequest.url
}

/** Deletes an object from the bucket (used when a user removes their own media). */
export async function deleteObject(config: SufyConfig, key: string): Promise<Response> {
  const client = sufyClient(config)
  const url = objectUrl(config, key)
  return client.fetch(url, { method: 'DELETE' })
}
