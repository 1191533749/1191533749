// 自绘 GitHub 数据卡片：不依赖任何第三方图床 / Vercel 服务，产物直接提交进仓库，
// 由 .github/workflows/cards.yml 每天刷新一次。
// 需要环境变量：GITHUB_TOKEN（Actions 里用 secrets.GITHUB_TOKEN）、可选 GH_USER。
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const USER = process.env.GH_USER || '1191533749'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')

const C = {
  bg: '#12151c',
  card: '#171b24',
  line: '#262c3a',
  text: '#eef2f8',
  dim: '#93a0b4',
  accent: '#ff6a3d',
  accent2: '#ffb03a',
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const num = (n) => Number(n || 0).toLocaleString('en-US')

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'render-cards',
    },
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'User-Agent': 'render-cards', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(`graphql: ${JSON.stringify(json.errors)}`)
  return json.data
}

// 贡献日历 → 每周一列，列内 7 天（周日在最上，和 GitHub 一致）
function heatmap(weeks, total) {
  const cell = 11
  const gap = 3.6
  const left = 34
  const top = 56
  const max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)))
  const level = (n) => {
    if (n <= 0) return 0
    const r = n / max
    if (r <= 0.25) return 1
    if (r <= 0.5) return 2
    if (r <= 0.75) return 3
    return 4
  }
  const shade = ['#20252f', '#3a2a24', '#6d3a26', '#a8482a', C.accent]

  const cells = []
  weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day, di) => {
      const x = left + wi * (cell + gap)
      const y = top + di * (cell + gap)
      const lv = level(day.contributionCount)
      cells.push(
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell}" height="${cell}" rx="2.5" fill="${shade[lv]}">` +
          `<title>${day.date}：${day.contributionCount} 次</title></rect>`,
      )
    })
  })

  // 月份刻度：某月第一次出现的列上打标签
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const marks = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.contributionDays[0]
    if (!first) return
    const m = Number(first.date.slice(5, 7)) - 1
    if (m !== lastMonth) {
      lastMonth = m
      const x = left + wi * (cell + gap)
      if (wi < weeks.length - 1) {
        marks.push(`<text x="${x.toFixed(1)}" y="${top - 8}" class="ax">${months[m]}</text>`)
      }
    }
  })

  const width = left + weeks.length * (cell + gap) + 14
  const height = top + 7 * (cell + gap) + 34
  const weekday = ['', '周一', '', '周三', '', '周五', '']
    .map((t, i) => (t ? `<text x="${left - 8}" y="${top + i * (cell + gap) + 9}" class="ax" text-anchor="end">${t}</text>` : ''))
    .join('')

  const legendX = width - 176
  const legend = [0, 1, 2, 3, 4]
    .map((lv, i) => `<rect x="${legendX + 26 + i * (cell + 3)}" y="${height - 22}" width="${cell}" height="${cell}" rx="2.5" fill="${shade[lv]}"/>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}" role="img" aria-label="近一年贡献热力图">
  <style>
    .t { font-family: -apple-system, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", Roboto, sans-serif; fill: ${C.text}; }
    .ax { font-family: -apple-system, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", Roboto, sans-serif; font-size: 10px; fill: ${C.dim}; }
  </style>
  <rect x="0.5" y="0.5" width="${Math.round(width) - 1}" height="${Math.round(height) - 1}" rx="12" fill="${C.card}" stroke="${C.line}"/>
  <text x="18" y="24" class="t" font-size="13" font-weight="600">近一年贡献 ${num(total)} 次</text>
  ${marks.join('')}
  ${weekday}
  ${cells.join('')}
  <text x="${legendX - 24}" y="${height - 13}" class="ax">少</text>
  ${legend}
  <text x="${legendX + 26 + 5 * (cell + 3) + 6}" y="${height - 13}" class="ax">多</text>
</svg>
`
}

function statsCard({ name, repos, stars, forks, followers, commits, contributions, streak, langCount }) {
  const w = 495
  const h = 210
  const rowY = [92, 122, 152, 182]
  const rows = [
    ['公开仓库', num(repos)],
    ['累计星标', num(stars)],
    ['关注者', num(followers)],
    ['近一年提交', num(commits)],
  ]
  // 「经验值」：星标、贡献、关注者各占权重，算一个 0-100 的分数（自己的公式，不冒充官方排名）
  const score = Math.min(99, Math.round(Math.log10(1 + stars * 12 + contributions * 3 + followers * 25) * 22))
  const r = 34
  const circ = 2 * Math.PI * r

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="GitHub 数据">
  <style>
    .t { font-family: -apple-system, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", Roboto, sans-serif; }
    .lbl { font-size: 13px; fill: ${C.dim}; }
    .val { font-size: 20px; font-weight: 700; fill: ${C.text}; }
  </style>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.card}" stroke="${C.line}"/>
  <text x="22" y="34" class="t" font-size="14" font-weight="700" fill="${C.text}">${esc(name)} 的 GitHub 数据</text>
  <line x1="22" y1="48" x2="${w - 22}" y2="48" stroke="${C.line}"/>
  <g>
    <circle cx="404" cy="118" r="${r}" fill="none" stroke="#20252f" stroke-width="9"/>
    <circle cx="404" cy="118" r="${r}" fill="none" stroke="${C.accent}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${((circ * score) / 100).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 404 118)"/>
    <text x="404" y="114" class="t" font-size="22" font-weight="700" fill="${C.text}" text-anchor="middle">${score}</text>
    <text x="404" y="132" class="t" font-size="10" fill="${C.dim}" text-anchor="middle">活跃度</text>
  </g>
  <g class="t">
    ${rows
      .map(
        ([label, value], i) =>
          `<text x="22" y="${rowY[i]}" class="lbl">${label}</text>` +
          `<text x="150" y="${rowY[i]}" class="val">${value}</text>`,
      )
      .join('')}
  </g>
  <text x="22" y="200" class="t" font-size="11" fill="${C.dim}">近一年贡献 ${num(contributions)} 次 · 最长连续 ${streak} 天 · 语言 ${langCount} 种</text>
</svg>
`
}

function langsCard(langs) {
  const w = 495
  const h = 210
  const barX = 22
  const barY = 58
  const barW = w - 44
  const total = langs.reduce((s, l) => s + l.size, 0) || 1
  const palette = ['#ff6a3d', '#ffb03a', '#4aa8ff', '#8b8bff', '#3ddc97', '#ff5f8f', '#c0c8d8', '#7a8698']
  let x = barX
  const segs = []
  const legend = []
  langs.slice(0, 6).forEach((l, i) => {
    const frac = l.size / total
    const sw = Math.max(3, frac * barW)
    segs.push(`<rect x="${x.toFixed(1)}" y="${barY}" width="${sw.toFixed(1)}" height="14" rx="7" fill="${palette[i]}"/>`)
    legend.push(
      `<circle cx="${barX + 5}" cy="${barY + 44 + i * 18}" r="5" fill="${palette[i]}"/>` +
        `<text x="${barX + 18}" y="${barY + 48 + i * 18}" class="t" font-size="12" fill="${C.text}">${esc(l.name)}</text>` +
        `<text x="${barX + 150}" y="${barY + 48 + i * 18}" class="t" font-size="12" fill="${C.dim}">${(frac * 100).toFixed(1)}%</text>`,
    )
    x += sw
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="常用语言">
  <style>.t { font-family: -apple-system, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", Roboto, sans-serif; }</style>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="${C.card}" stroke="${C.line}"/>
  <text x="22" y="34" class="t" font-size="14" font-weight="700" fill="${C.text}">主要语言（按代码量）</text>
  <line x1="22" y1="44" x2="${w - 22}" y2="44" stroke="${C.line}"/>
  ${segs.join('')}
  ${legend.join('')}
</svg>
`
}

// 自绘徽章行：和 shields.io 的 flat-square 徽章对齐（高 20、字号 11、方角），
// 但**画在仓库里**，不依赖任何第三方服务 —— 之前用 shields 的 workflow 徽章在网页上会加载失败。
function badgesSvg({ version, stars, date }) {
  const H = 20
  const GAP = 5
  const PAD = 6
  const labelBg = '#4a5260'
  // 近似字宽：CJK 约 11px，ASCII 约 6.3px（11px Verdana 量级）
  const tw = (s) =>
    [...String(s)].reduce((n, ch) => n + (/[\u2e80-\u9fff\u3000-\u303f\uff01-\uff60]/.test(ch) ? 11 : 6.3), 0)

  const pills = [
    { label: '悠悠音乐', value: version || '未发布', valueBg: C.accent },
    { label: 'Stars', value: String(stars), valueBg: C.accent2 },
    { label: '数据卡片', value: `已刷新 ${date}`, valueBg: '#2ea44f' },
  ]

  let x = 0.5
  const parts = []
  for (const p of pills) {
    const lw = Math.round(tw(p.label) + PAD * 2)
    const vw = Math.round(tw(p.value) + PAD * 2)
    parts.push(
      `<rect x="${x}" y="0.5" width="${lw}" height="${H - 1}" fill="${labelBg}"/>`,
      `<rect x="${x + lw}" y="0.5" width="${vw}" height="${H - 1}" fill="${p.valueBg}"/>`,
      `<text x="${(x + lw / 2).toFixed(1)}" y="14" text-anchor="middle">${esc(p.label)}</text>`,
      `<text x="${(x + lw + vw / 2).toFixed(1)}" y="14" text-anchor="middle">${esc(p.value)}</text>`,
    )
    x += lw + vw + GAP
  }
  const width = Math.round(x - GAP + 0.5)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="悠悠音乐 ${esc(version || '')} · Stars ${esc(stars)} · 数据卡片已刷新 ${esc(date)}">
  <style>
    text { font-family: Verdana, "DejaVu Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif; font-size: 11px; fill: #fff; }
  </style>
  ${parts.join('')}
</svg>
`
}

function streakOf(weeks) {
  const days = weeks.flatMap((w) => w.contributionDays)
  let best = 0
  let cur = 0
  for (const d of days) {
    if (d.contributionCount > 0) cur++
    else cur = 0
    best = Math.max(best, cur)
  }
  return best
}

async function main() {
  if (!TOKEN) throw new Error('需要 GITHUB_TOKEN')
  await mkdir(OUT, { recursive: true })

  const user = await api(`/users/${USER}`)
  const repos = await api(`/users/${USER}/repos?per_page=100&sort=pushed`)
  const mine = repos.filter((r) => !r.fork)
  const stars = mine.reduce((s, r) => s + r.stargazers_count, 0)
  const forks = mine.reduce((s, r) => s + r.forks_count, 0)
  const size = mine.reduce((s, r) => s + (r.size || 0), 0)

  const langTotals = new Map()
  for (const repo of mine.filter((r) => (r.size || 0) > 0).slice(0, 30)) {
    try {
      const langs = await api(`/repos/${USER}/${repo.name}/languages`)
      for (const [k, v] of Object.entries(langs)) langTotals.set(k, (langTotals.get(k) || 0) + v)
    } catch (err) {
      console.warn(`skip ${repo.name}: ${err.message}`)
    }
  }
  const langs = [...langTotals.entries()]
    .map(([name, s]) => ({ name, size: s }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 6)

  // 用 login 查询（而不是 viewer），这样 Actions 里用内置 GITHUB_TOKEN 也能拿到同一个人贡献数据
  const data = await graphql(
    `query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
        }
      }
    }`,
    { login: USER },
  )
  const cc = data.user.contributionsCollection
  const weeks = cc.contributionCalendar.weeks

  await writeFile(join(OUT, 'stats.svg'), statsCard({
    name: user.name || USER,
    repos: user.public_repos,
    stars,
    forks,
    followers: user.followers,
    commits: cc.totalCommitContributions,
    contributions: cc.contributionCalendar.totalContributions,
    streak: streakOf(weeks),
    langCount: langTotals.size,
  }))
  await writeFile(join(OUT, 'langs.svg'), langsCard(langs.length ? langs : [{ name: 'TypeScript', size: 1 }]))
  await writeFile(join(OUT, 'contrib.svg'), heatmap(weeks, cc.contributionCalendar.totalContributions))

  // 徽章行：版本号取悠悠音乐最新 Release，星标取悠悠音乐自己的星数
  const music = repos.find((r) => r.name === 'youyou-music')
  let version = ''
  try {
    version = (await api(`/repos/${USER}/youyou-music/releases/latest`)).tag_name
  } catch {
    version = ''
  }
  const date = new Date()
    .toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' })
    .replace('/', '-')
  await writeFile(join(OUT, 'badges.svg'), badgesSvg({ version, stars: music?.stargazers_count ?? 0, date }))

  console.log(`ok  stars=${stars} forks=${forks} repos=${user.public_repos} followers=${user.followers} commits=${cc.totalCommitContributions} total=${cc.contributionCalendar.totalContributions} langs=${langs.map((l) => l.name).join('/')} size=${size} music=${version}(${music?.stargazers_count ?? 0}★) date=${date}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
