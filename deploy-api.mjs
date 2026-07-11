/**
 * deploy-api.mjs — deploys dist/ directly via the Vercel REST API.
 * Bypasses vercel CLI (which has an ENOENT race on .local/state/workflow-logs/).
 *
 * Usage (run from a workflow so VERCEL_TOKEN is available):
 *   node deploy-api.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

const TOKEN      = process.env.VERCEL_TOKEN
const PROJECT_ID = 'prj_BMV7iv3LZK3UhhJZJZwPlTBDWyQX'
const TEAM_ID    = 'team_v7c8RWznnO0mvyueL3r60dPH'
const DIST_DIR   = new URL('./dist', import.meta.url).pathname

if (!TOKEN) { console.error('VERCEL_TOKEN not set'); process.exit(1) }

// ── helpers ───────────────────────────────────────────────────────────────────
function apiRequest(method, urlPath, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(body)
    const payload  = isBuffer ? body : (body ? Buffer.from(JSON.stringify(body)) : null)
    const opts = {
      hostname: 'api.vercel.com',
      path: urlPath,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(payload && !isBuffer ? { 'Content-Type': 'application/json' } : {}),
        ...(payload ? { 'Content-Length': payload.length } : {}),
        ...extraHeaders,
      },
    }
    const req = https.request(opts, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString()
        try { resolve({ status: res.statusCode, body: JSON.parse(text) }) }
        catch { resolve({ status: res.statusCode, body: text }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function sha1(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex')
}

function walkDir(dir, base = dir) {
  const entries = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      entries.push(...walkDir(full, base))
    } else {
      entries.push({ full, rel: path.relative(base, full) })
    }
  }
  return entries
}

// ── main ──────────────────────────────────────────────────────────────────────
const files = walkDir(DIST_DIR)
console.log(`Found ${files.length} files in dist/`)

// 1. Upload each file (Vercel deduplicates by SHA — already-uploaded files return 200)
console.log('Uploading files…')
const fileList = []
for (const { full, rel } of files) {
  const content = fs.readFileSync(full)
  const digest  = sha1(content)
  const res = await apiRequest(
    'POST',
    '/v2/files',
    content,
    {
      'Content-Type':    'application/octet-stream',
      'x-vercel-digest': digest,
    }
  )
  if (res.status !== 200 && res.status !== 201) {
    console.error(`  ✗ ${rel} → HTTP ${res.status}`, res.body)
  } else {
    process.stdout.write('.')
  }
  fileList.push({ file: rel, sha: digest, size: content.length })
}
console.log('\nAll files uploaded.')

// 2. Create the deployment
console.log('Creating deployment…')
const deploy = await apiRequest(
  'POST',
  `/v13/deployments?teamId=${TEAM_ID}&forceNew=1`,
  {
    name:      'smartzconnectreal',
    projectId: PROJECT_ID,
    target:    'production',
    files:     fileList,
    // Tell Vercel this is a prebuilt static output — no build step needed
    builds:    [],
    routes:    [
      // SPA fallback: all non-asset requests → index.html
      { src: '/assets/(.*)', dest: '/assets/$1' },
      { src: '/(.*)',        dest: '/index.html' },
    ],
  }
)

if (deploy.status >= 400) {
  console.error('Deployment failed:', JSON.stringify(deploy.body, null, 2))
  process.exit(1)
}

const { id, url, readyState } = deploy.body
console.log(`\n✓ Deployment created: ${id}`)
console.log(`  URL:   https://${url}`)
console.log(`  State: ${readyState}`)

// 3. Poll until ready
if (readyState !== 'READY') {
  console.log('Waiting for deployment to become READY…')
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const poll = await apiRequest('GET', `/v13/deployments/${id}?teamId=${TEAM_ID}`)
    const state = poll.body.readyState
    process.stdout.write(`  ${state}\r`)
    if (state === 'READY') { console.log('\n✓ READY'); break }
    if (state === 'ERROR')  { console.error('\n✗ deployment ERROR:', poll.body.errorMessage); process.exit(1) }
  }
}

console.log('\nDone! Visit https://smartzconnect.com to verify.')
