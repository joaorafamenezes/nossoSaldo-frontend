const API_VERSION = 'v2';
const API_PREFIX = `/api/${API_VERSION}`;

function normalizeApiBaseUrl(rawUrl?: string): string {
  const trimmedUrl = (rawUrl || 'http://localhost:10000').replace(/\/+$/, '');
  return trimmedUrl.endsWith(API_PREFIX) ? trimmedUrl : `${trimmedUrl}${API_PREFIX}`;
}

export const API_URL = normalizeApiBaseUrl((import.meta as any).env?.VITE_API_URL);

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body?.error ?? body;
    const details = Array.isArray(error?.details) ? ` ${error.details.join(' ')}` : '';
    throw new Error(error?.message ? `${error.message}${details}` : 'Erro ao comunicar com a API.');
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.meta ? { data: body.data, meta: body.meta } : body.data;
  }

  return body;
}

export async function login(payload: { email: string; senha: string }) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);

  return {
    token: data.accessToken,
    tokenType: data.tokenType,
    expiresIn: data.expiresIn,
  };
}

export async function createUser(payload: any) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function validateEmail(token: string) {
  const response = await fetch(`${API_URL}/usuarios/validar-email`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  return parseResponse(response);
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${API_URL}/usuarios/solicitarRedefinicaoSenha`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return parseResponse(response);
}

export async function getProfile(token: string) {
  const response = await fetch(`${API_URL}/usuarios/listarUsuarioPorId`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getIaConfiguration(token: string) {
  const response = await fetch(`${API_URL}/ia/configuracao`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function saveIaConfiguration(token: string, payload: any) {
  const response = await fetch(`${API_URL}/ia/configuracao`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function removeIaConfiguration(token: string) {
  const response = await fetch(`${API_URL}/ia/configuracao`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getIaConversationHistory(token: string) {
  const response = await fetch(`${API_URL}/ia/consultas/historico`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function clearIaConversationHistory(token: string) {
  const response = await fetch(`${API_URL}/ia/consultas/historico`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function askIa(token: string, pergunta: string) {
  const response = await fetch(`${API_URL}/ia/consultas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify({ pergunta }),
  });

  return parseResponse(response);
}

export async function getExpenses(token: string, filters: { de?: string; ate?: string; competencia?: string } = {}) {
  const query = new URLSearchParams();

  if (filters.de) {
    query.set('de', filters.de);
  }

  if (filters.ate) {
    query.set('ate', filters.ate);
  }

  if (filters.competencia) {
    query.set('competencia', filters.competencia);
  }

  const querySuffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_URL}/gastos${querySuffix}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);

  if (responseBody?.data && Array.isArray(responseBody.data)) {
    return {
      gastos: responseBody.data,
      totalRegistros: Number(responseBody.meta?.total ?? responseBody.data.length),
    };
  }

  if (Array.isArray(responseBody)) {
    return {
      gastos: responseBody,
      totalRegistros: responseBody.length,
    };
  }

  if (Array.isArray(responseBody?.gastos)) {
    return {
      gastos: responseBody.gastos,
      totalRegistros: Number(responseBody.totalRegistros ?? responseBody.gastos.length),
    };
  }

  return responseBody;
}

export async function createExpense(token: string, payload: any) {
  const response = await fetch(`${API_URL}/gastosUsuarioLogado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getExpenseById(token: string, expenseId: string) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getCategories(token: string) {
  const response = await fetch(`${API_URL}/categorias`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function getJointAccounts(token: string) {
  const response = await fetch(`${API_URL}/contaConjunta`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function getCreditCards(token: string) {
  const response = await fetch(`${API_URL}/cartoesCredito`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function createCreditCard(token: string, payload: any) {
  const response = await fetch(`${API_URL}/cartoesCredito`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateCreditCard(token: string, cardId: string, payload: any) {
  const response = await fetch(`${API_URL}/cartoesCredito/${cardId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function getCreditCardInvoices(token: string, cardId: string = '') {
  const query = cardId ? `?cartaoCreditoId=${encodeURIComponent(cardId)}` : '';
  const response = await fetch(`${API_URL}/faturasCartao${query}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function getInvoiceExtrato(token: string, invoiceId: string) {
  const response = await fetch(`${API_URL}/faturasCartao/${invoiceId}/extrato`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return responseBody?.data || responseBody;
}

export async function payCreditCardInvoice(token: string, invoiceId: string, payload: any = {}) {
  const response = await fetch(`${API_URL}/faturasCartao/${invoiceId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reopenCreditCardInvoice(token: string, invoiceId: string) {
  const response = await fetch(`${API_URL}/faturasCartao/${invoiceId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getMonthlyEvolutionReport(token: string, dateFrom: string, dateTo: string) {
  const response = await fetch(`${API_URL}/relatorio/evolucaoMensal/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function getMonthlyComparisonReport(token: string, currentMonth: string, previousMonth: string) {
  const currentMonthEnd = `${currentMonth}-31`;
  const previousMonthStart = `${previousMonth}-01`;
  const response = await fetch(`${API_URL}/relatorio/comparativoMensal/${currentMonthEnd}/${previousMonthStart}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getTopCategoryReport(token: string, dateFrom: string, dateTo: string) {
  const response = await fetch(`${API_URL}/relatorio/topCategoria/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  const responseBody = await parseResponse(response);
  return Array.isArray(responseBody?.data) ? responseBody.data : responseBody;
}

export async function getWhoSpendsMoreReport(token: string, dateFrom: string, dateTo: string) {
  const response = await fetch(`${API_URL}/relatorio/quemGastaMais/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function getInsights(token: string, dateFrom: string, dateTo: string) {
  const response = await fetch(`${API_URL}/insights/gargalos/${dateFrom}/${dateTo}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function createJointAccount(token: string, payload: any) {
  const response = await fetch(`${API_URL}/criarContaConjunta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function unlinkJointAccount(token: string, accountId: string) {
  const response = await fetch(`${API_URL}/contaConjunta/${accountId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function createCategory(token: string, payload: any) {
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updateCategory(token: string, categoryId: string, payload: any) {
  const response = await fetch(`${API_URL}/categorias/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function deleteCategory(token: string, categoryId: string) {
  const response = await fetch(`${API_URL}/categorias/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function payExpense(token: string, expenseId: string, payload: any = {}) {
  const response = await fetch(`${API_URL}/pagarGastos/${expenseId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reopenExpense(token: string, expenseId: string) {
  const response = await fetch(`${API_URL}/pagarGastos/${expenseId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function payInstallment(token: string, installmentId: string, payload: any = {}) {
  const response = await fetch(`${API_URL}/lancamentosBase/${installmentId}/pagamento`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function reopenInstallment(token: string, installmentId: string) {
  const response = await fetch(`${API_URL}/lancamentosBase/${installmentId}/reabertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function deleteExpense(token: string, expenseId: string) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
  });

  return parseResponse(response);
}

export async function updateExpense(token: string, expenseId: string, payload: any) {
  const response = await fetch(`${API_URL}/gastos/${expenseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function updatePassword(token?: string, senha?: string, recoveryToken?: string) {
  const endpoint = recoveryToken
    ? `${API_URL}/usuarios/redefinir-senha`
    : `${API_URL}/usuarios/atualizaSenha`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-access-token'] = token;
  }

  const body = recoveryToken ? { senha, token: recoveryToken } : { senha };

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}
