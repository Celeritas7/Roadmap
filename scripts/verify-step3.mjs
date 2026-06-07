import { chromium } from 'playwright'

// Throwaway Step-3 verifier (folder cards). Removed after the run; durable
// artifacts are docs/step3-*.png. Proves the card RESKIN changed visuals only:
// filter-toggle intact, muted set == visibleProjectIds complement, count ==
// countTasksWithTag, NO done/next DOM in the card, label-above-grid stacking,
// 2-col->1-col collapse, summit/fieldguide treatments, zero console errors.
const url = process.argv[2] ?? 'http://localhost:5173'
const outDir = process.argv[3] ?? 'docs'

const ID_LABEL = {
  dx: 'DX Engineer', fullstack: 'Fullstack', lang: 'Languages', visa: 'Visa',
  food: 'Food', exercise: 'Exercise', sleep: 'Sleep', fashion: 'Fashion',
}
const IDS = Object.keys(ID_LABEL)
const ROLE_LABELS = {
  attackers: ['DX Engineer', 'Fullstack', 'Languages', 'Visa'],
  midplayers: ['Food', 'Exercise'],
  defenders: ['Sleep', 'Fashion'],
}

const results = []
const ok = (name, pass, detail) => results.push({ name, pass: !!pass, detail })

const browser = await chromium.launch()
const consoleErrors = []

function watch(page) {
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  return page
}

const readCards = () =>
  [...document.querySelectorAll('.folder-card')].map((c) => ({
    name: c.querySelector('.fc-name')?.textContent?.trim() ?? '',
    sub: c.querySelector('.fc-sub')?.textContent?.trim() ?? '',
    muted: c.classList.contains('muted'),
    on: c.classList.contains('on'),
  }))

// ── Desktop ──────────────────────────────────────────────────────────────────
const deskCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
const desk = watch(await deskCtx.newPage())
await desk.goto(url, { waitUntil: 'networkidle' })
await desk.waitForSelector('.folder-card', { timeout: 15000 })
await desk.waitForTimeout(600)

const cardCount = await desk.evaluate(() => document.querySelectorAll('.folder-card').length)
ok('8 folder cards render', cardCount === 8, `count=${cardCount}`)

// (5 adjusted) NO done/next DOM exists in the card
const v2dom = await desk.evaluate(() =>
  document.querySelectorAll(
    '.route, .route-track, .route-fill, .route-stations, .station, .fc-next, .fc-foot, .fc-count, .nx-label, .nx-title, .nx-meta'
  ).length
)
ok('no done/next DOM in card', v2dom === 0, `matches=${v2dom}`)

// label sits ABOVE the grid (the .fbar stacking point)
const stack = await desk.evaluate(() => {
  const bar = document.querySelector('.fbar')
  const label = document.querySelector('.fbar > .flabel')
  const grid = document.querySelector('.fbar > .focus-grid')
  if (!bar || !label || !grid) return { ok: false, label: !!label, grid: !!grid }
  const lb = label.getBoundingClientRect(); const gb = grid.getBoundingClientRect()
  return { ok: lb.bottom <= gb.top + 1, labelBottom: Math.round(lb.bottom), gridTop: Math.round(gb.top),
           directChildren: bar.matches(':has(> .flabel + .focus-grid)') }
})
ok('label stacked above grid', stack.ok, JSON.stringify(stack))

// count == countTasksWithTag (computed from the live store tree)
const counts = await desk.evaluate((ids) => {
  const tree = window.__roadmapStore.getState().tree
  const out = {}
  for (const id of ids) out[id] = tree.filter((r) => r.kind === 'task' && r.tags.includes(id)).length
  return out
}, IDS)
const cardsNow = await desk.evaluate(readCards)
let countOk = true; const countDetail = []
for (const id of IDS) {
  const label = ID_LABEL[id]
  const card = cardsNow.find((c) => c.name === label)
  const shown = card ? Number((card.sub.match(/(\d+)\s*stop/) ?? [])[1]) : NaN
  const match = shown === counts[id]
  if (!match) countOk = false
  countDetail.push(`${id}: card=${shown} tag=${counts[id]}${match ? '' : ' ✗'}`)
}
ok('count == countTasksWithTag', countOk, countDetail.join(' | '))

// muted set == visibleProjectIds complement, driven by selectRole
async function muteCheck(role) {
  await desk.evaluate((r) => window.__roadmapStore.getState().selectRole(r), role)
  await desk.waitForTimeout(300)
  const cards = await desk.evaluate(readCards)
  const unmuted = cards.filter((c) => !c.muted).map((c) => c.name).sort()
  const expected = [...ROLE_LABELS[role]].sort()
  const same = JSON.stringify(unmuted) === JSON.stringify(expected)
  ok(`muted complement (${role})`, same, `unmuted=[${unmuted}] expected=[${expected}]`)
  const dataRole = await desk.evaluate(() => document.querySelector('.rm')?.getAttribute('data-role'))
  return dataRole
}
const drA = await muteCheck('attackers')
await desk.screenshot({ path: `${outDir}/step3-desktop-attackers.png`, fullPage: true })
ok('data-role reflects attackers', drA === 'attackers', `data-role=${drA}`)
const drD = await muteCheck('defenders')
await desk.screenshot({ path: `${outDir}/step3-desktop-defenders.png`, fullPage: true })
ok('data-role reflects defenders', drD === 'defenders', `data-role=${drD}`)

// filter-toggle intact: clicking a card drives toggleFilter('project', id)
await desk.evaluate(() => window.__roadmapStore.setState({ selectedRole: null }))
await desk.waitForTimeout(200)
const before = await desk.evaluate(() => [...window.__roadmapStore.getState().filters.projects])
await desk.click('.folder-card:has(.fc-name:text-is("DX Engineer"))')
await desk.waitForTimeout(150)
const afterOn = await desk.evaluate(() => [...window.__roadmapStore.getState().filters.projects])
await desk.click('.folder-card:has(.fc-name:text-is("DX Engineer"))')
await desk.waitForTimeout(150)
const afterOff = await desk.evaluate(() => [...window.__roadmapStore.getState().filters.projects])
ok('filter toggle on', !before.includes('dx') && afterOn.includes('dx'), `before=[${before}] after=[${afterOn}]`)
ok('filter toggle off', !afterOff.includes('dx'), `after2=[${afterOff}]`)

// transparency: which store keys exist (proof-of-no-new-keys lives in the diff)
const storeKeys = await desk.evaluate(() => Object.keys(window.__roadmapStore.getState()).sort())

// theme treatments — setAttribute (App hardcodes trailhead); screenshot only,
// no store mutation after this so React won't re-render and reset the attr
await desk.evaluate(() => document.querySelector('.rm').setAttribute('data-theme', 'summit'))
await desk.waitForTimeout(250)
await desk.screenshot({ path: `${outDir}/step3-desktop-summit.png`, fullPage: true })
await desk.evaluate(() => document.querySelector('.rm').setAttribute('data-theme', 'fieldguide'))
await desk.waitForTimeout(250)
await desk.screenshot({ path: `${outDir}/step3-desktop-fieldguide.png`, fullPage: true })

// ── Mobile (1-col collapse) ──────────────────────────────────────────────────
const mobCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const mob = watch(await mobCtx.newPage())
await mob.goto(url, { waitUntil: 'networkidle' })
await mob.waitForSelector('.folder-card', { timeout: 15000 })
await mob.waitForTimeout(500)
const cols = await mob.evaluate(() => {
  const g = document.querySelector('.focus-grid')
  return getComputedStyle(g).gridTemplateColumns.split(' ').length
})
ok('mobile grid is 1 column', cols === 1, `columns=${cols}`)
await mob.screenshot({ path: `${outDir}/step3-mobile.png`, fullPage: false })

ok('zero console errors', consoleErrors.length === 0, consoleErrors.join(' || '))

console.log(JSON.stringify({ url, storeKeys, results, consoleErrors }, null, 2))
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} PASS` + (failed.length ? `  — FAILED: ${failed.map((f) => f.name).join(', ')}` : ''))

await browser.close()
process.exit(failed.length ? 1 : 0)
