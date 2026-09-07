import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { calculateCardAvailableLimit } from '../../lib/utils';
import { CartaoCredito, FaturaCartao } from '../../types/cards';
import { Gasto } from '../../types/financial';

describe('Cálculo de Limite de Cartão de Crédito e Faturas (Regra de Recorrência)', () => {
  const mockCard: CartaoCredito = {
    id: 'card-nubank',
    descricao: 'Nubank',
    bandeira: 'mastercard',
    ultimosDigitos: 'e64a',
    diaFechamento: 10,
    diaVencimento: 17,
    valorLimite: 700,
    limiteDisponivel: 700,
    faturaAtual: 0,
    corGradiente: 'from-purple-900 to-black',
  };

  it('não deve comprometer limite dos meses subsequentes com gastos recorrentes, apenas na fatura atual', () => {
    // Fatura do mês 09/2026 está em R$ 200 + Recorrência de R$ 50 = R$ 250
    // Faturas futuras (10/2026, 11/2026, 12/2026) existem com recorrência de R$ 50 cada
    const mockInvoices: FaturaCartao[] = [
      {
        id: 'inv-2026-09',
        cartaoCreditoId: 'card-nubank',
        competencia: '2026-09',
        dataAbertura: '2026-08-11',
        dataFechamento: '2026-09-10',
        dataVencimento: '2026-09-17',
        valorTotal: 250,
        status: 'aberta',
      },
      {
        id: 'inv-2026-10',
        cartaoCreditoId: 'card-nubank',
        competencia: '2026-10',
        dataAbertura: '2026-09-11',
        dataFechamento: '2026-10-10',
        dataVencimento: '2026-10-17',
        valorTotal: 50,
        status: 'aberta',
      },
      {
        id: 'inv-2026-11',
        cartaoCreditoId: 'card-nubank',
        competencia: '2026-11',
        dataAbertura: '2026-10-11',
        dataFechamento: '2026-11-10',
        dataVencimento: '2026-11-17',
        valorTotal: 50,
        status: 'aberta',
      },
    ];

    const mockExpenses: Gasto[] = [
      {
        id: 'gst-recorrente-50',
        descricao: 'Assinatura Software',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'recorrente',
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 50,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-15',
        dataInicioRecorrencia: '2026-09-15',
        cartaoCreditoId: 'card-nubank',
        categoriaId: 'cat-1',
        responsavelId: 'usr-1',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      },
      {
        id: 'gst-avulso-200',
        descricao: 'Supermercado',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'unico',
        numeroParcelas: 1,
        naoCompartilhar: false,
        valor: 200,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-05',
        cartaoCreditoId: 'card-nubank',
        categoriaId: 'cat-1',
        responsavelId: 'usr-1',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      },
    ];

    const result = calculateCardAvailableLimit(mockCard, mockInvoices, mockExpenses, '2026-09');

    // Fatura atual do mês: R$ 250,00
    expect(result.faturaAtual).toBe(250);
    // Limite disponível: 700 - 250 = R$ 450,00 (recorrências de 10/2026 e 11/2026 NÃO ocupam limite de 09/2026)
    expect(result.limiteDisponivel).toBe(450);
  });

  it('compromete o limite de meses futuros quando houver compras parceladas (parcelado com parcelas futuras)', () => {
    // Compra de R$ 300 parcelada em 3x de R$ 100
    // Parcela 1 em 09/2026 (fatura atual: R$ 100 + R$ 50 recorrente = R$ 150)
    // Parcela 2 em 10/2026 (R$ 100)
    // Parcela 3 em 11/2026 (R$ 100)
    const mockInvoices: FaturaCartao[] = [
      {
        id: 'inv-2026-09',
        cartaoCreditoId: 'card-nubank',
        competencia: '2026-09',
        dataAbertura: '2026-08-11',
        dataFechamento: '2026-09-10',
        dataVencimento: '2026-09-17',
        valorTotal: 150,
        status: 'aberta',
      },
    ];

    const mockExpenses: Gasto[] = [
      {
        id: 'gst-parcelado-300',
        descricao: 'Smartphone',
        tipo: 'despesa',
        status: 'pendente',
        origemLancamento: 'parcelado',
        numeroParcelas: 3,
        naoCompartilhar: false,
        valor: 300,
        competencia: '2026-09-01',
        dataVencimento: '2026-09-15',
        cartaoCreditoId: 'card-nubank',
        categoriaId: 'cat-1',
        responsavelId: 'usr-1',
        lancamentosBase: [
          {
            id: 'lb-1',
            gastoId: 'gst-parcelado-300',
            descricao: 'Smartphone (1/3)',
            valorParcela: 100,
            numeroParcela: 1,
            dataVencimentoParcela: '2026-09-15',
            status: 'pendente',
            competencia: '2026-09-01',
          },
          {
            id: 'lb-2',
            gastoId: 'gst-parcelado-300',
            descricao: 'Smartphone (2/3)',
            valorParcela: 100,
            numeroParcela: 2,
            dataVencimentoParcela: '2026-10-15',
            status: 'pendente',
            competencia: '2026-10-01',
          },
          {
            id: 'lb-3',
            gastoId: 'gst-parcelado-300',
            descricao: 'Smartphone (3/3)',
            valorParcela: 100,
            numeroParcela: 3,
            dataVencimentoParcela: '2026-11-15',
            status: 'pendente',
            competencia: '2026-11-01',
          },
        ],
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
      },
    ];

    const result = calculateCardAvailableLimit(mockCard, mockInvoices, mockExpenses, '2026-09');

    // Fatura atual: R$ 150
    expect(result.faturaAtual).toBe(150);
    // Comprometido: R$ 150 (fatura atual) + R$ 200 (parcelas futuras 2 e 3) = R$ 350
    // Disponível: 700 - 350 = R$ 350,00
    expect(result.limiteDisponivel).toBe(350);
  });
});
