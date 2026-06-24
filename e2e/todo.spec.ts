import { test, expect } from '@playwright/test'

test('happy path adds a todo item', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeVisible()

  await page.getByLabel('New todo item').fill('Buy coffee')
  await page.getByRole('button', { name: /add/i }).click()

  await expect(page.getByText('Buy coffee')).toBeVisible()
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeHidden()
})

test('validation prevents empty or whitespace items', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('New todo item').fill('   ')
  await expect(page.getByRole('button', { name: /add/i })).toBeDisabled()

  await page.getByLabel('New todo item').fill('')
  await expect(page.getByRole('button', { name: /add/i })).toBeDisabled()
})

test('items persist across reload', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('New todo item').fill('Persist across sessions')
  await page.getByRole('button', { name: /add/i }).click()
  await page.reload()

  await expect(page.getByText('Persist across sessions')).toBeVisible()
})

test('deletes only the targeted todo', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('New todo item').fill('Task A')
  await page.getByRole('button', { name: /add/i }).click()

  await page.getByLabel('New todo item').fill('Task B')
  await page.getByRole('button', { name: /add/i }).click()

  await page.getByRole('button', { name: /delete todo task a/i }).click()

  await expect(page.getByText('Task A')).not.toBeVisible()
  await expect(page.getByText('Task B')).toBeVisible()
})

test('is readable and usable on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /todo app/i })).toBeVisible()
  await expect(page.getByLabel('New todo item')).toBeVisible()

  await page.getByLabel('New todo item').fill('Mobile item')
  await page.getByRole('button', { name: /add/i }).click()

  await expect(page.getByText('Mobile item')).toBeVisible()
  await expect(page.getByRole('button', { name: /delete todo mobile item/i })).toBeVisible()
})
