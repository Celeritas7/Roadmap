import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5174'
const out = process.argv[3] ?? 'docs/m2-shell.png'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1200 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => {
  consoleErrors.push('pageerror: ' + err.message)
})

await page.goto(url, { waitUntil: 'networkidle' })
// Wait a beat for any post-paint store init (fetch from Supabase)
await page.waitForSelector('.lat .row', { timeout: 15000 })
await page.waitForTimeout(800)

await page.screenshot({ path: out, fullPage: true })

const taskCount = await page.locator('.lat .row').count()
const groupCount = await page.locator('.lat .group').count()
const logCount = await page.locator('.lat .logrow').count()

console.log(JSON.stringify({
  url,
  out,
  taskRowCount: taskCount,
  groupCount,
  logRowCount: logCount,
  consoleErrors,
}, null, 2))

await browser.close()
