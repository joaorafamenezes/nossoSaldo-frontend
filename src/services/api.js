const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function parseResponse(response) {
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = body?.error ?? body
    const details = Array.isArray(error?.details) ? ` ${error.details.join(' ')}` : ''
    throw new Error(error?.message ? `${error.message}${details}` : 'Erro ao comunicar com a API.')
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.meta ? { data: body.data, meta: body.meta } : body.data
  }

  return body
}

export async function login(payload) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(response)

  return {
    token: data.accessToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
  }
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_URL}/usuarios/solicitarRedefinicaoSenha`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  return parseResponse(response)
}

export async function getProfile(token) {
  const response = await fetch(`${API_URL}/usuarios/listarUsuarioPorId`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function getExpenses(token) {
  const response = await fetch(`${API_URL}/gastos`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)

  if (responseBody?.data && Array.isArray(responseBody.data)) {
    return {
      gastos: responseBody.data,
      totalRegistros: Number(responseBody.meta?.total ?? responseBody.data.length),
    }
  }

  return responseBody
}

export async function createExpense(token, payload) {
  const response = await fetch(`${API_URL}/gastosUsuarioLogado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function getExpenseById(token, expenseId) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function getCategories(token) {
  const response = await fetch(`${API_URL}/categorias`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function getJointAccounts(token) {
  const response = await fetch(`${API_URL}/contaConjunta`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function createJointAccount(token, payload) {
  const response = await fetch(`${API_URL}/criarContaConjunta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function createCategory(token, payload) {
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function payExpense(token, expenseId, payload = {}) {
  const response = await fetch(`${API_URL}/pagarGastos/${expenseId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function payInstallment(token, installmentId, payload = {}) {
  const response = await fetch(`${API_URL}/lancamentosBase/${installmentId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function deleteExpense(token, expenseId) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function updateExpense(token, expenseId, payload) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function updatePassword(token, senha, recoveryToken) {
  const endpoint = recoveryToken
    ? `${API_URL}/usuarios/redefinir-senha`
    : `${API_URL}/usuarios/atualizaSenha`
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['x-access-token'] = token
  }

  const body = recoveryToken ? { senha, token: recoveryToken } : { senha }

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })

  return parseResponse(response)
}
