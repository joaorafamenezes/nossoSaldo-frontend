const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

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

export async function createUser(payload) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function validateEmail(token) {
  const response = await fetch(`${API_URL}/usuarios/validar-email`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  })

  return parseResponse(response)
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

  if (Array.isArray(responseBody)) {
    return {
      gastos: responseBody,
      totalRegistros: responseBody.length,
    }
  }

  if (Array.isArray(responseBody?.gastos)) {
    return {
      gastos: responseBody.gastos,
      totalRegistros: Number(responseBody.totalRegistros ?? responseBody.gastos.length),
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

export async function getCreditCards(token) {
  const response = await fetch(`${API_URL}/cartoesCredito`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function createCreditCard(token, payload) {
  const response = await fetch(`${API_URL}/cartoesCredito`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function updateCreditCard(token, cardId, payload) {
  const response = await fetch(`${API_URL}/cartoesCredito/${cardId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function getCreditCardInvoices(token, cardId = '') {
  const query = cardId ? `?cartaoCreditoId=${encodeURIComponent(cardId)}` : ''
  const response = await fetch(`${API_URL}/faturasCartao${query}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function payCreditCardInvoice(token, invoiceId, payload = {}) {
  const response = await fetch(`${API_URL}/faturasCartao/${invoiceId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export async function reopenCreditCardInvoice(token, invoiceId) {
  const response = await fetch(`${API_URL}/faturasCartao/${invoiceId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function getMonthlyEvolutionReport(token, dateFrom, dateTo) {
  const response = await fetch(`${API_URL}/relatorio/evolucaoMensal/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function getMonthlyComparisonReport(token, currentMonth, previousMonth) {
  const currentMonthEnd = `${currentMonth}-31`
  const previousMonthStart = `${previousMonth}-01`
  const response = await fetch(`${API_URL}/relatorio/comparativoMensal/${currentMonthEnd}/${previousMonthStart}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function getTopCategoryReport(token, dateFrom, dateTo) {
  const response = await fetch(`${API_URL}/relatorio/topCategoria/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  const responseBody = await parseResponse(response)
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody
}

export async function getWhoSpendsMoreReport(token, dateFrom, dateTo) {
  const response = await fetch(`${API_URL}/relatorio/quemGastaMais/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
}

export async function getInsights(token, dateFrom, dateTo) {
  const response = await fetch(`${API_URL}/insights/gargalos/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  })

  return parseResponse(response)
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

export async function unlinkJointAccount(token, accountId) {
  const response = await fetch(`${API_URL}/contaConjunta/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
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

export async function reopenExpense(token, expenseId) {
  const response = await fetch(`${API_URL}/pagarGastos/${expenseId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
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

export async function reopenInstallment(token, installmentId) {
  const response = await fetch(`${API_URL}/lancamentosBase/${installmentId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
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
