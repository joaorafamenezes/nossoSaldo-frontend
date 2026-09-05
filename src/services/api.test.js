import { beforeEach, describe, expect, it, vi } from 'vitest'
import { askIa, getExpenses, login } from './api'

function mockResponse(body, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  }
}

describe('servico de API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('faz login na API versionada e normaliza o token', async () => {
    fetch.mockResolvedValue(mockResponse({
      data: {
        accessToken: 'token-de-teste',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    }))

    await expect(login({ email: 'joao@example.com', senha: 'segredo' })).resolves.toEqual({
      token: 'token-de-teste',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:10000/api/v2/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'joao@example.com', senha: 'segredo' }),
    })
  })

  it('envia filtros de periodo e preserva a quantidade total de gastos', async () => {
    fetch.mockResolvedValue(mockResponse({
      data: [{ id: 'gasto-1' }],
      meta: { total: 12 },
    }))

    await expect(getExpenses('token', {
      de: '2026-08-01',
      ate: '2026-08-31',
      competencia: '2026-08',
    })).resolves.toEqual({
      gastos: [{ id: 'gasto-1' }],
      totalRegistros: 12,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:10000/api/v2/gastos?de=2026-08-01&ate=2026-08-31&competencia=2026-08',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': 'token',
        },
      },
    )
  })

  it('envia uma pergunta financeira autenticada para a rota da IA', async () => {
    fetch.mockResolvedValue(mockResponse({ data: { resposta: 'R$ 100,00' } }))

    await expect(askIa('token', 'Quanto gastei neste mes?')).resolves.toEqual({
      resposta: 'R$ 100,00',
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:10000/api/v2/ia/consultas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': 'token',
      },
      body: JSON.stringify({ pergunta: 'Quanto gastei neste mes?' }),
    })
  })

  it('converte erros da API em uma mensagem utilizavel pela interface', async () => {
    fetch.mockResolvedValue(mockResponse({
      error: {
        message: 'Acesso negado.',
        details: ['Token expirado.'],
      },
    }, false))

    await expect(login({ email: 'joao@example.com', senha: 'segredo' }))
      .rejects.toThrow('Acesso negado. Token expirado.')
  })
})
