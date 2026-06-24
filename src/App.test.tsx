import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('Astra smoke todo app', () => {
  test('adds a todo item', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('New todo item'), 'Write smoke test')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(screen.getByText('Write smoke test')).toBeInTheDocument()
  })

  test('does not allow empty todos and keeps submit disabled', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('New todo item')
    const addButton = screen.getByRole('button', { name: /add/i })

    expect(addButton).toBeDisabled()

    await user.type(input, '   ')
    expect(addButton).toBeDisabled()
    expect(screen.getByText('Enter a non-empty item before adding.')).not.toBeVisible()
  })

  test('toggles completion and deletes a todo', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('New todo item'), 'Smoke check')
    await user.click(screen.getByRole('button', { name: /add/i }))

    const checkbox = screen.getByLabelText(/mark smoke check as complete/i)
    await user.click(checkbox)

    expect(screen.getByText('Smoke check')).toHaveClass('todo-text completed')

    await user.click(screen.getByRole('button', { name: /delete todo smoke check/i }))
    expect(screen.queryByText('Smoke check')).not.toBeInTheDocument()
  })

  test('restores items from localStorage on load', () => {
    const persisted = [
      {
        id: 'seed-id',
        text: 'Restored item',
        completed: false
      }
    ]

    localStorage.setItem('astra-smoke-todos', JSON.stringify(persisted))

    render(<App />)

    expect(screen.getByText('Restored item')).toBeInTheDocument()
  })
})
