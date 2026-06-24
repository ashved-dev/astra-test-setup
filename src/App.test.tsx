import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'

const STORAGE_KEY = 'astra-smoke-todos'

const renderApp = () => render(<App />)

describe('Astra smoke todo app', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const addTodo = async (text: string) => {
    const user = userEvent.setup()
    const input = screen.getByLabelText('New todo item')
    const addButton = screen.getByRole('button', { name: /add/i })
    await user.type(input, text)
    await user.click(addButton)
    return user
  }

  test('adds a trimmed todo item and persists it', async () => {
    renderApp()
    await addTodo('  Write smoke test  ')

    expect(screen.getByText('Write smoke test')).toBeInTheDocument()

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(persisted).toHaveLength(1)
    expect(persisted[0]).toMatchObject({ text: 'Write smoke test', completed: false })
  })

  test('does not create todo for empty or whitespace input', async () => {
    const user = userEvent.setup()
    renderApp()

    const input = screen.getByLabelText('New todo item')
    const addButton = screen.getByRole('button', { name: /add/i })

    expect(addButton).toBeDisabled()
    expect(screen.getByText('No todos yet. Add your first item above.')).toBeInTheDocument()

    await user.type(input, '   ')
    expect(addButton).toBeDisabled()
    await user.clear(input)
    await user.click(addButton)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
    expect(screen.getByText('No todos yet. Add your first item above.')).toBeInTheDocument()
  })

  test('toggles completion status and keeps persistence in sync', async () => {
    renderApp()

    await addTodo('Smoke check')

    const completeLabel = /mark smoke check as complete/i
    const incompleteLabel = /mark smoke check as incomplete/i
    const checkbox = screen.getByLabelText(completeLabel)

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(screen.getByRole('checkbox', { name: incompleteLabel })).toBeInTheDocument()
    expect(screen.getByText('Smoke check')).toHaveClass('todo-text completed')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')[0]).toMatchObject({
      text: 'Smoke check',
      completed: true
    })

    await userEvent.click(checkbox)
    expect(screen.getByRole('checkbox', { name: completeLabel })).toBeInTheDocument()
    expect(screen.getByText('Smoke check')).not.toHaveClass('todo-text completed')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')[0]).toMatchObject({
      text: 'Smoke check',
      completed: false
    })
  })

  test('deletes one todo without removing others', async () => {
    renderApp()

    await addTodo('Task A')
    await addTodo('Task B')

    await userEvent.click(screen.getByRole('button', { name: /delete todo task a/i }))

    expect(screen.queryByText('Task A')).not.toBeInTheDocument()
    expect(screen.getByText('Task B')).toBeInTheDocument()

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(persisted).toHaveLength(1)
    expect(persisted[0]).toMatchObject({ text: 'Task B' })
  })

  test('loads todos from localStorage on startup', () => {
    const persisted = [
      {
        id: 'seed-id',
        text: 'Restored item',
        completed: false
      },
      {
        id: 'seed-id-2',
        text: 'Completed item',
        completed: true
      }
    ]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    renderApp()

    expect(screen.getByText('Restored item')).toBeInTheDocument()
    expect(screen.getByText('Completed item')).toBeInTheDocument()
    expect(screen.getByText('Completed item')).toHaveClass('todo-text completed')
  })
})
