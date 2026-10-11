// 通过 GitHub Contents API 推送文件（本机 git push 到 github.com:443 不通，只有 api.github.com 可用）
// 用法: GH_REPO=owner/repo GH_BRANCH=main node scripts/push-files.mjs <file> [file...]
//   例: $env:GH_REPO='1191533749/1191533749'; node scripts/push-files.mjs README.md assets/badges.svg
//   注意：不要从 PowerShell 命令行直接传 "owner/repo"（会被按 / 拆成两个参数），一律走 GH_REPO。
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const token = (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || (existsSync(join(ROOT, 'gh-token.txt')) ? readFileSync(join(ROOT, 'gh-token.txt'), 'utf8') : '')).trim()
if (!token) {
  console.error('缺少令牌：设置 GH_TOKEN，或把令牌写进 _gh-profile\\gh-token.txt')
  process.exit(2)
}

const repo = process.env.GH_REPO || '1191533749/1191533749'
const branch = process.env.GH_BRANCH || 'main'
const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('用法: $env:GH_REPO=<owner/repo>; node scripts/push-files.mjs <file> [file...]')
  process.exit(2)
}
console.log(`repo=${repo} branch=${branch}`)

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'youyou-profile-push',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text.slice(0, 300) }
  }
  return { status: res.status, ok: res.ok, body }
}

let failed = 0
for (const rel of files) {
  const file = join(ROOT, rel)
  if (!existsSync(file)) {
    console.log(`SKIP  ${rel}  (不存在)`)
    failed++
    continue
  }
  const content = readFileSync(file)
  const path = `/repos/${repo}/contents/${rel.split('\\').join('/')}`
  let sha
  const head = await api(`${path}?ref=${encodeURIComponent(branch)}`)
  if (head.status === 200 && head.body?.sha) sha = head.body.sha
  else if (head.status !== 404) console.log(`WARN  ${rel}  读取现有文件 sha 失败：HTTP ${head.status}`)

  const res = await api(path, {
    method: 'PUT',
    body: JSON.stringify({
      message: `chore: 更新 ${rel}`,
      content: content.toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (res.ok) console.log(`OK    ${rel}  ${content.length} B  ${res.body?.commit?.sha?.slice(0, 7)}  ${res.body?.commit?.html_url || ''}`)
  else {
    failed++
    console.log(`FAIL  ${rel}  HTTP ${res.status}  ${JSON.stringify(res.body).slice(0, 240)}`)
  }
}
process.exit(failed ? 1 : 0)
