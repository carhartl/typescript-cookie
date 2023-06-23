import { test, expect } from '@playwright/test'

test.describe('E2E test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8099/test/browser.e2e.html')
  })

  test('setting a cookie', async ({ context }) => {
    const [cookie] = await context.cookies()
    expect(cookie.name).toBe('test')
    expect(cookie.value).toBe('foo')
    expect(cookie.path).toBe('/')
  }, 5000)
})
