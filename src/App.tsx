import { FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

type Todo = {
  id: string
  text: string
  completed: boolean
}

const STORAGE_KEY = 'astra-smoke-todos'

function getStoredTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (item): item is Todo =>
          typeof item?.id === 'string' &&
          typeof item?.text === 'string' &&
          typeof item?.completed === 'boolean'
      )
      .map((item) => ({
        id: item.id,
        text: item.text,
        completed: item.completed
      }))
  } catch {
    return []
  }
}

function createTodo(text: string): Todo {
  return {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    text,
    completed: false
  }
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => getStoredTodos())
  const [inputValue, setInputValue] = useState('')
  const [showValidationError, setShowValidationError] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const canSubmit = useMemo(() => inputValue.trim().length > 0, [inputValue])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = inputValue.trim()

    if (!trimmed) {
      setShowValidationError(true)
      return
    }

    setTodos((prev) => [
      ...prev,
      {
        id: createTodo(trimmed).id,
        text: trimmed,
        completed: false
      }
    ])
    setInputValue('')
    setShowValidationError(false)
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <main className="page-shell">
      <section className="todo-shell">
        <header className="header">
          <p className="eyebrow">Astra Smoke Test</p>
          <h1>Todo App</h1>
          <p className="subtitle">One-page delivery smoke flow for add, toggle, and delete.</p>
        </header>

        <form onSubmit={handleSubmit} className="add-form" aria-label="Add todo">
          <label htmlFor="todo-input">New todo item</label>
          <div className="add-row">
            <input
              id="todo-input"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value)
                if (showValidationError) {
                  setShowValidationError(false)
                }
              }}
              placeholder="What needs doing?"
              autoComplete="off"
              aria-describedby="todo-validation"
            />
            <button type="submit" disabled={!canSubmit}>
              Add
            </button>
          </div>
          <p
            id="todo-validation"
            role="status"
            aria-live="polite"
            className="validation"
            hidden={!showValidationError}
          >
            Enter a non-empty item before adding.
          </p>
        </form>

        <section className="list-section" aria-live="polite">
          {todos.length === 0 ? (
            <p className="empty-state">No todos yet. Add your first item above.</p>
          ) : (
            <ul>
              {todos.map((todo) => (
                <li key={todo.id} className="todo-row">
                  <label className="todo-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
                    />
                    <span className={todo.completed ? 'todo-text completed' : 'todo-text'}>{todo.text}</span>
                  </label>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label={`Delete todo ${todo.text}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}
