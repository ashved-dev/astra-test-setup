import { expect, Page, test } from '@playwright/test'

const STORAGE_KEY = 'astra-smoke-todos'

const addTodo = async (page: Page, text: string) => {
  await page.getByLabel('New todo item').fill(text)
  await page.getByRole('button', { name: /add/i }).click()
}

test('happy path adds a todo item', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('No todos yet. Add your first item above.')).toBeVisible()
  await addTodo(page, 'Buy coffee')

  await expect(page.getByText('Buy coffee')).toBeVisible()
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeHidden()
})

test('validation prevents empty or whitespace-only submission', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('New todo item').fill('   ')
  await expect(page.getByRole('button', { name: /add/i })).toBeDisabled()
  await page.getByLabel('New todo item').fill('')

  await page.getByRole('button', { name: /add/i }).click({ force: true })
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeVisible()
  await expect(page.locator('.todo-row')).toHaveCount(0)
})

test('persists items from localStorage and reflects them on load', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(
    ([key]) =>
      localStorage.setItem(
        key,
        JSON.stringify([
          { id: 'seed-a', text: 'Seeded task', completed: false },
          { id: 'seed-b', text: 'Seeded completed task', completed: true }
        ])
      ),
    [STORAGE_KEY]
  )

  await page.reload()

  await expect(page.getByText('Seeded task')).toBeVisible()
  await expect(page.getByText('Seeded completed task')).toBeVisible()

  const persisted = await page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key as string) || '[]')
  }, STORAGE_KEY)

  expect(persisted).toHaveLength(2)
  expect(persisted[1].completed).toBe(true)
})

test('deletes one item and keeps the others', async ({ page }) => {
  await page.goto('/')

  await addTodo(page, 'Task A')
  await addTodo(page, 'Task B')

  await page.getByRole('button', { name: /delete todo task a/i }).click()

  await expect(page.getByText('Task A')).not.toBeVisible()
  await expect(page.getByText('Task B')).toBeVisible()
})

test('remains readable and usable on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /todo app/i })).toBeVisible()
  await expect(page.getByLabel('New todo item')).toBeVisible()
  await addTodo(page, 'Mobile item')
  await expect(page.getByText('Mobile item')).toBeVisible()
  await expect(page.getByRole('button', { name: /delete todo mobile item/i })).toBeVisible()
})
