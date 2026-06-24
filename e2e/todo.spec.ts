import { expect, Page, test } from '@playwright/test'

const STORAGE_KEY = 'astra-smoke-todos'

const getTodoRow = (page: Page, text: string) =>
  page.locator('.todo-row', { hasText: text })

const addTodo = async (page: Page, text: string) => {
  await page.getByLabel('New todo item').fill(text)
  await page.getByRole('button', { name: /add/i }).click()
  await expect(getTodoRow(page, text)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('happy path adds a todo item', async ({ page }) => {
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeVisible()
  await addTodo(page, 'Buy coffee')

  await expect(page.getByText('Buy coffee')).toBeVisible()
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeHidden()
})

test('validation prevents empty or whitespace-only submission', async ({ page }) => {
  await page.getByLabel('New todo item').fill('   ')
  await expect(page.getByRole('button', { name: /add/i })).toBeDisabled()

  await page.getByLabel('New todo item').press('Enter')
  await expect(page.getByText('No todos yet. Add your first item above.')).toBeVisible()
  await expect(page.locator('.todo-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /add/i })).toBeDisabled()
})

test('completion state is toggled and exposed through accessible checkbox controls', async ({ page }) => {
  await addTodo(page, 'Mark me')

  const todoRow = getTodoRow(page, 'Mark me')
  const checkbox = todoRow.getByRole('checkbox')
  await expect(checkbox).toBeVisible()
  await checkbox.check()

  await expect(checkbox).toBeChecked()
  await expect(page.getByText('Mark me')).toHaveClass(/completed/)
  await expect(todoRow.getByRole('checkbox')).toHaveAttribute(
    'aria-label',
    /mark mark me as incomplete/i
  )
})

test('persists todo creation and completion state after refresh', async ({ page }) => {
  await addTodo(page, 'Persist this')

  const todoRow = getTodoRow(page, 'Persist this')
  const checkbox = todoRow.getByRole('checkbox')
  await checkbox.check()

  await page.reload()

  await expect(page.getByText('Persist this')).toBeVisible()
  await expect(todoRow.getByRole('checkbox')).toBeChecked()

  const persisted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key as string) || '[]'), STORAGE_KEY)
  expect(persisted).toHaveLength(1)
  expect(persisted[0]).toMatchObject({ text: 'Persist this', completed: true })
})

test('deletes one item and keeps the others', async ({ page }) => {
  await addTodo(page, 'Task A')
  await addTodo(page, 'Task B')

  await page.getByRole('button', { name: /delete todo task a/i }).click()

  await expect(page.getByText('Task A')).not.toBeVisible()
  await expect(page.getByText('Task B')).toBeVisible()
  await expect(page.getByRole('button', { name: /delete todo task b/i })).toBeVisible()
})

test('remains readable and usable on mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await expect(page.getByRole('heading', { name: /todo app/i })).toBeVisible()
  await expect(page.getByLabel('New todo item')).toBeVisible()
  await expect(page.getByRole('button', { name: /add/i })).toBeVisible()
  await expect(page.getByRole('textbox', { name: /new todo item/i })).toBeVisible()

  await addTodo(page, 'Mobile item')
  await expect(page.getByText('Mobile item')).toBeVisible()
  await expect(page.getByRole('button', { name: /delete todo mobile item/i })).toBeVisible()

  const mobileTodoRow = getTodoRow(page, 'Mobile item')
  const mobileCheckbox = mobileTodoRow.getByRole('checkbox')
  await mobileCheckbox.check()
  await expect(mobileCheckbox).toBeChecked()

  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(page.getByRole('textbox', { name: /new todo item/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /todo app/i })).toBeVisible()
})
