import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AiQuestionComposer from './AiQuestionComposer'

function renderComposer(overrides = {}) {
  const props = {
    question: 'Quanto gastei?',
    isSending: false,
    onChange: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    ...overrides,
  }

  render(<AiQuestionComposer {...props} />)
  return props
}

describe('AiQuestionComposer', () => {
  it('submete a pergunta ao pressionar Enter sem Shift', () => {
    const props = renderComposer()
    const textarea = screen.getByRole('textbox', { name: 'Pergunta para o assistente financeiro' })
    const form = textarea.closest('form')
    const requestSubmit = vi.spyOn(form, 'requestSubmit')

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(requestSubmit).toHaveBeenCalledTimes(1)
    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })

  it('preserva a quebra de linha ao pressionar Shift+Enter', () => {
    const props = renderComposer()
    const textarea = screen.getByRole('textbox', { name: 'Pergunta para o assistente financeiro' })
    const form = textarea.closest('form')
    const requestSubmit = vi.spyOn(form, 'requestSubmit')

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(requestSubmit).not.toHaveBeenCalled()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('desabilita o envio durante a consulta ou para texto curto', () => {
    const { rerender } = render(<AiQuestionComposer question="Oi" isSending={false} onChange={vi.fn()} onSubmit={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Perguntar' })

    expect(button).toBeDisabled()

    rerender(<AiQuestionComposer question="Quanto gastei?" isSending onChange={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Consultando...' })).toBeDisabled()
  })
})
