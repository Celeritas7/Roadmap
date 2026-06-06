import { chromium } from 'playwright'

// Step-1 verification harness. Captures the redesigned `.rm` shell on desktop +
// mobile and exercises the mobile filter sheet to confirm it pins to the
// viewport bottom (the portal target is `.rm`, which only exists post-flip).
const url = process.argv[2] ?? 'http://localhost:5173'
const outDir = process.argv[3] ?? 'docs'

const browser = await chromium.launch()

const consoleErrors = []

async function newPage(ctx) {
  const page = await ctx.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message))
  return page
}

// ── Desktop ────────────────────────────────────────────────────────────────
const deskCtx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
})
const desk = await newPage(deskCtx)
await desk.goto(url, { waitUntil: 'networkidle' })
// FoldersRow (with the filter button) renders regardless of data load.
await desk.waitForSelector('.rm .rm-btn', { timeout: 15000 })
await desk.waitForTimeout(800)

// Read the resolved trailhead tokens off the live root — proves the variable
// set actually applies, not just that the attribute is present.
const tokens = await desk.evaluate(() => {
  const rm = document.querySelector('.rm')
  const cs = getComputedStyle(rm)
  return {
    dataTheme: rm.getAttribute('data-theme'),
    dataRole: rm.getAttribute('data-role'),
    canvas: cs.getPropertyValue('--canvas').trim(),
    ink: cs.getPropertyValue('--ink').trim(),
    accent: cs.getPropertyValue('--accent').trim(),
    roleH: cs.getPropertyValue('--role-h').trim(),
    bg: cs.backgroundColor,
  }
})

// Does .rm-scroll actually scroll (content taller than the viewport)?
const scroll = await desk.evaluate(() => {
  const el = document.querySelector('.rm-scroll')
  if (!el) return { found: false }
  return { found: true, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollable: el.scrollHeight > el.clientHeight }
})

await desk.screenshot({ path: `${outDir}/step1-desktop.png`, fullPage: true })

// ── Mobile + filter sheet pin check ──────────────────────────────────────────
const mobCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const mob = await newPage(mobCtx)
await mob.goto(url, { waitUntil: 'networkidle' })
await mob.waitForSelector('.rm .rm-btn', { timeout: 15000 })
await mob.waitForTimeout(500)
await mob.screenshot({ path: `${outDir}/step1-mobile.png`, fullPage: false })

// Open the filter → on mobile it portals into `.rm` as a bottom sheet.
await mob.click('.rm .rm-btn')
await mob.waitForSelector('.filter-pop', { timeout: 5000 })
await mob.waitForTimeout(400)

const sheet = await mob.evaluate(() => {
  const pop = document.querySelector('.filter-pop')
  const backdrop = document.querySelector('.filter-backdrop')
  const rm = document.querySelector('.rm')
  const box = pop.getBoundingClientRect()
  const vh = window.innerHeight
  return {
    portaledIntoRm: rm.contains(pop),
    hasBackdrop: !!backdrop,
    bottomGap: Math.round(vh - box.bottom), // ~0 ⇒ pinned to viewport bottom
    sheetTop: Math.round(box.top),
    viewportHeight: vh,
    position: getComputedStyle(pop).position,
  }
})

await mob.screenshot({ path: `${outDir}/step1-mobile-filter.png`, fullPage: false })

console.log(JSON.stringify({ url, tokens, scroll, sheet, consoleErrors }, null, 2))

await browser.close()
