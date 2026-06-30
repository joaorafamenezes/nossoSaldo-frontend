import { useEffect, useState } from 'react'
import './App.css'
import nossoSaldoLogo from './assets/nossosaldo-logo.png'
import {
  createCreditCard,
  createExpense,
  createJointAccount,
  createCategory,
  createUser,
  deleteExpense,
  getCategories,
  getCreditCards,
  getCreditCardInvoices,
  getExpenseById,
  getExpenses,
  getJointAccounts,
  getInsights,
  getMonthlyComparisonReport,
  getMonthlyEvolutionReport,
  getTopCategoryReport,
  getWhoSpendsMoreReport,
  getProfile,
  login,
  payCreditCardInvoice,
  payInstallment,
  payExpense,
  reopenExpense,
  reopenCreditCardInvoice,
  requestPasswordReset,
  unlinkJointAccount,
  updateExpense,
  updateCreditCard,
  updatePassword,
  validateEmail,
} from './services/api'

const isDevelopmentEnvironment = import.meta.env.DEV
const THEME_STORAGE_KEY = 'nossosaldo.theme'

const initialForm = {
  email: '',
  senha: '',
}

const initialRegisterForm = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

const initialPasswordForm = {
  senha: '',
  confirmarSenha: '',
}

const initialCategoryForm = {
  descricao: '',
  iconName: '🏷️',
}

const initialJointAccountForm = {
  nomeConta: '',
  usuarioConjunto: '',
}

const initialCreditCardForm = {
  descricao: '',
  diaFechamento: '',
  diaVencimento: '',
  valorLimite: '',
  observacoes: '',
}

const CATEGORY_ICON_OPTIONS = [
  { icon: '🍔', label: 'Alimentacao' },
  { icon: '🛒', label: 'Compras' },
  { icon: '🚗', label: 'Transporte' },
  { icon: '🏠', label: 'Casa' },
  { icon: '💡', label: 'Contas' },
  { icon: '💊', label: 'Saude' },
  { icon: '🎓', label: 'Educacao' },
  { icon: '🎉', label: 'Lazer' },
  { icon: '💼', label: 'Trabalho' },
  { icon: '💰', label: 'Receita' },
  { icon: '📦', label: 'Geral' },
  { icon: '🏷️', label: 'Categoria' },
]

function getCategoryDisplayIcon(category) {
  if (category?.iconName) {
    return category.iconName
  }

  const description = String(category?.descricao ?? '').toLowerCase()

  if (description.includes('alim') || description.includes('merc') || description.includes('rest')) return '🍔'
  if (description.includes('trans') || description.includes('comb') || description.includes('uber')) return '🚗'
  if (description.includes('casa') || description.includes('morad')) return '🏠'
  if (description.includes('luz') || description.includes('agua') || description.includes('internet')) return '💡'
  if (description.includes('saud') || description.includes('farm')) return '💊'
  if (description.includes('educ') || description.includes('curso')) return '🎓'
  if (description.includes('lazer') || description.includes('divers')) return '🎉'
  if (description.includes('sal') || description.includes('receit')) return '💰'

  return '🏷️'
}

function getCurrentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  return {
    dateFrom: firstDay.toISOString().slice(0, 10),
    dateTo: lastDay.toISOString().slice(0, 10),
    status: 'abertos',
    tipo: 'todos',
    cartaoCreditoId: 'todos',
  }
}

function getCurrentMonthDateRange() {
  const { dateFrom, dateTo } = getCurrentMonthRange()
  return { dateFrom, dateTo }
}

function getPreviousMonthDateRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    dateFrom: firstDay.toISOString().slice(0, 10),
    dateTo: lastDay.toISOString().slice(0, 10),
  }
}

function getLastThirtyDaysRange() {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 29)

  return {
    dateFrom: startDate.toISOString().slice(0, 10),
    dateTo: endDate.toISOString().slice(0, 10),
  }
}

function shiftMonthDateRange(range, monthOffset) {
  const referenceDate = range?.dateFrom ? new Date(`${range.dateFrom}T00:00:00`) : new Date()

  if (Number.isNaN(referenceDate.getTime())) {
    return getCurrentMonthDateRange()
  }

  const targetYear = referenceDate.getFullYear()
  const targetMonth = referenceDate.getMonth() + monthOffset
  const firstDay = new Date(targetYear, targetMonth, 1)
  const lastDay = new Date(targetYear, targetMonth + 1, 0)

  return {
    dateFrom: firstDay.toISOString().slice(0, 10),
    dateTo: lastDay.toISOString().slice(0, 10),
  }
}

function formatMonthYearLabel(dateValue) {
  if (!dateValue) {
    return 'Periodo personalizado'
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Periodo personalizado'
  }

  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(parsedDate)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getDefaultMonthlyReportRange() {
  const now = new Date()
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    dateFrom: firstMonth.toISOString().slice(0, 10),
    dateTo: lastMonth.toISOString().slice(0, 10),
  }
}

function getDefaultComparisonMonths() {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  return {
    currentMonth: currentMonth.toISOString().slice(0, 7),
    previousMonth: previousMonth.toISOString().slice(0, 7),
  }
}

function getCurrentCompetenceMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getInitialExpenseForm() {
  return {
    descricao: '',
    tipo: 'despesa',
    status: 'pendente',
    origemLancamento: 'unico',
    numeroParcelas: '2',
    naoCompartilhar: false,
    valor: '',
    competencia: getCurrentCompetenceMonth(),
    dataVencimento: '',
    dataFimRecorrencia: '',
    observacao: '',
    categoriaId: '',
    cartaoCreditoId: '',
  }
}

function formatCurrencyInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  const numberValue = Number(digits) / 100

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue)
}

function formatCurrencyAmount(value) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue)
}

function parseCurrencyInput(value) {
  if (!value) {
    return 0
  }

  const normalizedValue = value.replace(/\./g, '').replace(',', '.')
  return Number(normalizedValue)
}

function formatDateForInput(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatCompetenceForInput(value) {
  if (!value) {
    return getCurrentCompetenceMonth()
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}/.test(value)) {
    return value.slice(0, 7)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return getCurrentCompetenceMonth()
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function normalizeCompetenceForPayload(value) {
  if (!value) {
    return null
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`
  }

  return value
}

function getCompetenceMonthFromDueDate(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}/.test(value)) {
    return value.slice(0, 7)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthlyReference(reference) {
  if (!reference) {
    return ''
  }

  const [year, month] = String(reference).split('-')

  if (!year || !month) {
    return reference
  }

  const date = new Date(Number(year), Number(month) - 1, 1)

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatCompetenceDisplay(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}/.test(value)) {
    return formatMonthlyReference(value.slice(0, 7))
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return formatMonthlyReference(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
}

function formatDateToIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function getClampedMonthDay(year, monthIndex, day) {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(Math.max(Number(day) || 1, 1), lastDayOfMonth)
}

function calculateCreditCardInvoiceDueDate(card, referenceDate = new Date()) {
  const closingDay = Number(card?.diaFechamento)
  const dueDay = Number(card?.diaVencimento)

  if (!Number.isInteger(closingDay) || !Number.isInteger(dueDay) || closingDay <= 0 || dueDay <= 0) {
    return null
  }

  const reference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  const closingDate = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    getClampedMonthDay(reference.getFullYear(), reference.getMonth(), closingDay),
  )
  const closingPassed = reference > closingDate
  const cycleBaseDate = new Date(
    reference.getFullYear(),
    reference.getMonth() + (closingPassed ? 1 : 0),
    1,
  )
  const dueMonthOffset = dueDay <= closingDay ? 1 : 0
  const dueBaseDate = new Date(
    cycleBaseDate.getFullYear(),
    cycleBaseDate.getMonth() + dueMonthOffset,
    1,
  )
  const dueDate = new Date(
    dueBaseDate.getFullYear(),
    dueBaseDate.getMonth(),
    getClampedMonthDay(dueBaseDate.getFullYear(), dueBaseDate.getMonth(), dueDay),
  )

  return {
    dueDate,
    dueDateValue: formatDateToIso(dueDate),
    closingPassed,
  }
}

function getInvoiceDueMonth(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}/.test(value)) {
    return value.slice(0, 7)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getInstallmentEffectiveStatus(installment) {
  if (installment?.status === 'pago' || installment?.status === 'cancelado') {
    return installment.status
  }

  if (!installment?.dataVencimentoParcela) {
    return installment?.status ?? ''
  }

  const dueDate = new Date(installment.dataVencimentoParcela)

  if (Number.isNaN(dueDate.getTime())) {
    return installment?.status ?? ''
  }

  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

  if (dueDateOnly < todayOnly) {
    return 'atrasado'
  }

  return installment.status
}

function formatInvoiceDueMonthOption(value) {
  if (!value) {
    return 'Todos os vencimentos'
  }

  const [year, month] = String(value).split('-')

  if (!year || !month) {
    return value
  }

  const date = new Date(Number(year), Number(month) - 1, 1)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function isCurrentCompetence(reference) {
  if (!reference) {
    return false
  }

  return String(reference).slice(0, 7) === getCurrentCompetenceMonth()
}

function normalizeExpenseForm(expense) {
  return {
    descricao: expense.descricao ?? '',
    tipo: expense.tipo ?? 'despesa',
    status: expense.status ?? 'pendente',
    origemLancamento: expense.origemLancamento ?? 'unico',
    numeroParcelas: expense.numeroParcelas != null ? String(expense.numeroParcelas) : '2',
    naoCompartilhar: Boolean(expense.naoCompartilhar),
    valor: expense.valor != null ? formatCurrencyAmount(expense.valor) : '',
    competencia: formatCompetenceForInput(expense.competencia),
    dataVencimento: formatDateForInput(expense.dataVencimento),
    dataFimRecorrencia: formatDateForInput(expense.dataFimRecorrencia),
    observacao: expense.observacao ?? '',
    categoriaId: expense.categoriaId ?? '',
    cartaoCreditoId: expense.cartaoCreditoId ?? '',
  }
}

function getEffectiveExpenseStatus(expense) {
  if (expense.status === 'pago' || expense.status === 'cancelado') {
    return expense.status
  }

  if (!expense.dataVencimento) {
    return expense.status
  }

  const dueDate = new Date(expense.dataVencimento)

  if (Number.isNaN(dueDate.getTime())) {
    return expense.status
  }

  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

  if (dueDateOnly < todayOnly) {
    return 'atrasado'
  }

  return expense.status
}

function isDateInRange(value, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) {
    return true
  }

  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const dateOnly = date.toISOString().slice(0, 10)
  const isAfterStart = !dateFrom || dateOnly >= dateFrom
  const isBeforeEnd = !dateTo || dateOnly <= dateTo

  return isAfterStart && isBeforeEnd
}

function hasInstallmentDueInRange(expense, dateFrom, dateTo) {
  if (!Array.isArray(expense.lancamentosBase)) {
    return false
  }

  return expense.lancamentosBase.some((installment) => (
    isDateInRange(installment.dataVencimentoParcela, dateFrom, dateTo)
  ))
}

function areAllInstallmentsPaid(expense) {
  if (expense.origemLancamento !== 'parcelado') {
    return true
  }

  if (!Array.isArray(expense.lancamentosBase) || expense.lancamentosBase.length === 0) {
    return false
  }

  return expense.lancamentosBase.every((installment) => installment.status === 'pago')
}

function getExpensePeriodAmount(expense, dateFrom, dateTo) {
  if (expense.origemLancamento === 'parcelado' && Array.isArray(expense.lancamentosBase)) {
    return expense.lancamentosBase
      .filter((installment) => isDateInRange(installment.dataVencimentoParcela, dateFrom, dateTo))
      .reduce((accumulator, installment) => accumulator + Number(installment.valorParcela ?? 0), 0)
  }

  if (!isDateInRange(expense.dataVencimento, dateFrom, dateTo)) {
    return 0
  }

  return Number(expense.valor ?? 0)
}

function isInvoiceOpen(status) {
  return !['paga', 'cancelada'].includes(String(status ?? '').toLowerCase())
}

function buildCreditCardUsageMap(expenses) {
  const usageByCard = new Map()
  const recurringSeriesByCard = new Map()

  expenses.forEach((expense) => {
    if (!expense?.cartaoCreditoId || expense.tipo !== 'despesa' || expense.status === 'cancelado') {
      return
    }

    if (expense.origemLancamento === 'parcelado') {
      if (!Array.isArray(expense.lancamentosBase)) {
        return
      }

      const totalInstallments = expense.lancamentosBase.reduce((total, installment) => {
        if (!installment?.faturaCartaoId || !isInvoiceOpen(installment.faturaCartaoStatus)) {
          return total
        }

        return total + Number(installment.valorParcela ?? 0)
      }, 0)

      if (totalInstallments <= 0) {
        return
      }

      const currentUsage = usageByCard.get(expense.cartaoCreditoId) ?? 0
      usageByCard.set(expense.cartaoCreditoId, currentUsage + totalInstallments)
      return
    }

    if (!expense.faturaCartaoId || !isInvoiceOpen(expense.faturaCartaoStatus)) {
      return
    }

    if (expense.origemLancamento === 'recorrente') {
      const seriesKey = expense.recorrenciaPaiId || expense.id
      const cardSeriesKey = `${expense.cartaoCreditoId}:${seriesKey}`
      const existingSeriesExpense = recurringSeriesByCard.get(cardSeriesKey)
      const expenseDueTime = expense.dataVencimento ? new Date(expense.dataVencimento).getTime() : Number.MAX_SAFE_INTEGER
      const existingDueTime = existingSeriesExpense?.dataVencimento
        ? new Date(existingSeriesExpense.dataVencimento).getTime()
        : Number.MAX_SAFE_INTEGER

      if (!existingSeriesExpense || expenseDueTime < existingDueTime) {
        recurringSeriesByCard.set(cardSeriesKey, expense)
      }

      return
    }

    const currentUsage = usageByCard.get(expense.cartaoCreditoId) ?? 0
    usageByCard.set(expense.cartaoCreditoId, currentUsage + Number(expense.valor ?? 0))
  })

  recurringSeriesByCard.forEach((expense) => {
    const currentUsage = usageByCard.get(expense.cartaoCreditoId) ?? 0
    usageByCard.set(expense.cartaoCreditoId, currentUsage + Number(expense.valor ?? 0))
  })

  return usageByCard
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [status, setStatus] = useState({
    type: 'idle',
    message: 'Entre com seu e-mail e senha para acessar seu painel financeiro.',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('nossosaldo.token') ?? '')
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [jointAccounts, setJointAccounts] = useState([])
  const [creditCards, setCreditCards] = useState([])
  const [creditCardInvoices, setCreditCardInvoices] = useState([])
  const [invoiceFilters, setInvoiceFilters] = useState({ cartaoCreditoId: 'todos', dueMonth: '', sortOrder: 'desc' })
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [jointAccountForm, setJointAccountForm] = useState(initialJointAccountForm)
  const [creditCardForm, setCreditCardForm] = useState(initialCreditCardForm)
  const [selectedCreditCard, setSelectedCreditCard] = useState(null)
  const [expenseForm, setExpenseForm] = useState(() => getInitialExpenseForm())
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingJointAccounts, setIsLoadingJointAccounts] = useState(false)
  const [isLoadingCreditCards, setIsLoadingCreditCards] = useState(false)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isSavingJointAccount, setIsSavingJointAccount] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [isSavingCreditCard, setIsSavingCreditCard] = useState(false)
  const [isPayingInvoice, setIsPayingInvoice] = useState(false)
  const [isReopeningInvoice, setIsReopeningInvoice] = useState(false)
  const [isReopeningExpense, setIsReopeningExpense] = useState(false)
  const [isPayingExpense, setIsPayingExpense] = useState(false)
  const [isPayingInstallment, setIsPayingInstallment] = useState(false)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)
  const [isUnlinkingJointAccount, setIsUnlinkingJointAccount] = useState(false)
  const [isLoadingExpenseDetails, setIsLoadingExpenseDetails] = useState(false)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceModalMode, setInvoiceModalMode] = useState(null)
  const [selectedInstallment, setSelectedInstallment] = useState(null)
  const [selectedJointAccount, setSelectedJointAccount] = useState(null)
  const [creditCardLimitWarning, setCreditCardLimitWarning] = useState(null)
  const [creditCardDueDateNotice, setCreditCardDueDateNotice] = useState(null)
  const [pendingExpensePayload, setPendingExpensePayload] = useState(null)
  const [loginErrorMessage, setLoginErrorMessage] = useState('')
  const [jointAccountErrorMessage, setJointAccountErrorMessage] = useState('')
  const [expenseModalMode, setExpenseModalMode] = useState(null)
  const [expenseSuccessMessage, setExpenseSuccessMessage] = useState('')
  const [expenseFilters, setExpenseFilters] = useState(() => getCurrentMonthRange())
  const [insightsFilters, setInsightsFilters] = useState(() => ({
    ...getCurrentMonthDateRange(),
    preset: 'mes-atual',
  }))
  const [insightsData, setInsightsData] = useState(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false)
  const [monthlyReportFilters, setMonthlyReportFilters] = useState(() => getDefaultMonthlyReportRange())
  const [monthlyReportRange, setMonthlyReportRange] = useState(() => getDefaultMonthlyReportRange())
  const [monthlyReportItems, setMonthlyReportItems] = useState([])
  const [isLoadingMonthlyReport, setIsLoadingMonthlyReport] = useState(false)
  const [comparisonReportFilters, setComparisonReportFilters] = useState(() => getDefaultComparisonMonths())
  const [comparisonReport, setComparisonReport] = useState(null)
  const [isLoadingComparisonReport, setIsLoadingComparisonReport] = useState(false)
  const [topCategoryFilters, setTopCategoryFilters] = useState(() => getDefaultMonthlyReportRange())
  const [topCategoryItems, setTopCategoryItems] = useState([])
  const [isLoadingTopCategoryReport, setIsLoadingTopCategoryReport] = useState(false)
  const [expandedTopCategoryNames, setExpandedTopCategoryNames] = useState({})
  const [whoSpendsMoreFilters, setWhoSpendsMoreFilters] = useState(() => getDefaultMonthlyReportRange())
  const [whoSpendsMoreReport, setWhoSpendsMoreReport] = useState(null)
  const [isLoadingWhoSpendsMoreReport, setIsLoadingWhoSpendsMoreReport] = useState(false)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState({})
  const [expandedInstallmentIds, setExpandedInstallmentIds] = useState({})
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState({})
  const [route, setRoute] = useState(() => window.location.pathname)
  const [search, setSearch] = useState(() => window.location.search)
  const [dashboardSection, setDashboardSection] = useState('gastos')
  const [reportSection, setReportSection] = useState('evolucao-mensal')
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) ?? 'light')
  const reportMenuItems = [
    {
      id: 'evolucao-mensal',
      title: 'Evolucao mensal de gastos',
      description: 'Compare a variacao dos gastos por mes dentro do periodo escolhido.',
    },
    {
      id: 'comparativo-mensal',
      title: 'Comparativo mensal',
      description: 'Visualize diferencas de desempenho entre meses consecutivos.',
    },
    {
      id: 'top-categorias',
      title: 'Top categorias',
      description: 'Descubra quais categorias mais concentram saidas no periodo.',
    },
    {
      id: 'quem-gasta-mais',
      title: 'Quem gasta mais',
      description: 'Compare a participacao de gasto entre os usuarios da conta conjunta.',
    },
    {
      id: 'comportamento',
      title: 'Comportamento',
      description: 'Leia padroes de gasto, recorrencia e sazonalidade do usuario.',
    },
  ]
  const resetParams = new URLSearchParams(search)
  const recoveryToken = resetParams.get('token') ?? ''
  const isPasswordResetRoute = route === '/redefinir-senha' || route === '/trocar-senha'
  const isRegisterRoute = route === '/cadastro'
  const isEmailValidationRoute = route === '/validar-email'
  const emailValidationToken = isEmailValidationRoute ? recoveryToken : ''
  const isRecoveryFlow = isPasswordResetRoute && Boolean(recoveryToken)
  const isExpenseCreateRoute = route === '/dashboard/gastos/novo'
  const expenseEditMatch = route.match(/^\/dashboard\/gastos\/([^/]+)$/)
  const editingExpenseId = expenseEditMatch?.[1] ?? ''
  const isExpenseEditRoute = Boolean(expenseEditMatch) && !isExpenseCreateRoute
  const isDashboardRoute = route === '/dashboard' || isExpenseEditRoute || isExpenseCreateRoute

  useEffect(() => {
    const syncRoute = () => {
      setRoute(window.location.pathname)
      setSearch(window.location.search)
    }

    window.addEventListener('popstate', syncRoute)

    return () => {
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    const normalizedTheme = themeMode === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.theme = normalizedTheme
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  }, [themeMode])

  useEffect(() => {
    if (!token) {
      setProfile(null)
      setExpenses([])
      setCategories([])
      setJointAccounts([])
      setCreditCards([])
      setCreditCardInvoices([])
      setInsightsData(null)
      return
    }

    let isMounted = true

    const hydrateProfile = async () => {
      try {
        const usuario = await getProfile(token)

        if (isMounted) {
          setProfile(usuario)
          setStatus({
            type: 'success',
            message: `Sessao ativa para ${usuario.nome}.`,
          })
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        localStorage.removeItem('nossosaldo.token')
        setToken('')
        setProfile(null)
        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel validar a sessao salva.',
        })
      }
    }

    hydrateProfile()

    return () => {
      isMounted = false
    }
  }, [token])

  useEffect(() => {
    const shouldHydrateExpenseData = ['gastos', 'diagnostico'].includes(dashboardSection)

    if (!token || !profile || !isDashboardRoute || !shouldHydrateExpenseData || isExpenseEditRoute || isExpenseCreateRoute) {
      return
    }

    let isMounted = true

    const hydrateExpenses = async () => {
      setIsLoadingExpenses(true)

      try {
        const expensesResponse = await getExpenses(token)

        if (!isMounted) {
          return
        }

        setExpenses(Array.isArray(expensesResponse.gastos) ? expensesResponse.gastos : [])

        const [categoriesResult, creditCardsResult] = await Promise.allSettled([
          getCategories(token),
          getCreditCards(token),
        ])

        if (!isMounted) {
          return
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(Array.isArray(categoriesResult.value) ? categoriesResult.value : [])
        }

        if (creditCardsResult.status === 'fulfilled') {
          setCreditCards(Array.isArray(creditCardsResult.value) ? creditCardsResult.value : [])
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar os gastos do dashboard.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingExpenses(false)
        }
      }
    }

    hydrateExpenses()

    return () => {
      isMounted = false
    }
  }, [
    token,
    profile,
    isDashboardRoute,
    dashboardSection,
    isExpenseEditRoute,
    isExpenseCreateRoute,
    expenseFilters.dateFrom,
    expenseFilters.dateTo,
    expenseFilters.status,
    expenseFilters.tipo,
    expenseFilters.cartaoCreditoId,
  ])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'gastos' || isExpenseEditRoute || isExpenseCreateRoute) {
      return
    }

    let isMounted = true

    const hydrateInsights = async () => {
      const { dateFrom, dateTo } = insightsFilters

      if (!dateFrom || !dateTo || dateTo < dateFrom) {
        return
      }

      setIsLoadingInsights(true)

      try {
        const response = await getInsights(token, dateFrom, dateTo)

        if (!isMounted) {
          return
        }

        setInsightsData(response)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar a analise do Radar.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingInsights(false)
        }
      }
    }

    hydrateInsights()

    return () => {
      isMounted = false
    }
  }, [token, profile, isDashboardRoute, dashboardSection, isExpenseEditRoute, isExpenseCreateRoute])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'relatorios') {
      return
    }

    if (reportSection === 'evolucao-mensal') {
      loadMonthlyReport(monthlyReportFilters)
      return
    }

    if (reportSection === 'comparativo-mensal') {
      loadComparisonReport(comparisonReportFilters)
      return
    }

    if (reportSection === 'top-categorias') {
      loadTopCategoryReport(topCategoryFilters)
      return
    }

    if (reportSection === 'quem-gasta-mais') {
      loadWhoSpendsMoreReport(whoSpendsMoreFilters)
    }
  }, [token, profile, isDashboardRoute, dashboardSection])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'categorias') {
      return
    }

    let isMounted = true

    const hydrateCategories = async () => {
      setIsLoadingCategories(true)

      try {
        const response = await getCategories(token)

        if (!isMounted) {
          return
        }

        setCategories(Array.isArray(response) ? response : [])
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar as categorias do dashboard.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    hydrateCategories()

    return () => {
      isMounted = false
    }
  }, [token, profile, isDashboardRoute, dashboardSection])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'conta-conjunta') {
      return
    }

    let isMounted = true

    const hydrateJointAccounts = async () => {
      setIsLoadingJointAccounts(true)

      try {
        const response = await getJointAccounts(token)

        if (!isMounted) {
          return
        }

        setJointAccounts(Array.isArray(response) ? response : [])
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar a conta conjunta.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingJointAccounts(false)
        }
      }
    }

    hydrateJointAccounts()

    return () => {
      isMounted = false
    }
  }, [token, profile, isDashboardRoute, dashboardSection])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'cartoes') {
      return
    }

    let isMounted = true

    const hydrateCreditCards = async () => {
      setIsLoadingCreditCards(true)

      try {
        const [cardsResponse, invoicesResponse] = await Promise.all([
          getCreditCards(token),
          getCreditCardInvoices(token).catch(() => []),
        ])

        if (!isMounted) {
          return
        }

        setCreditCards(Array.isArray(cardsResponse) ? cardsResponse : [])
        if (Array.isArray(invoicesResponse)) {
          setCreditCardInvoices(invoicesResponse)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar os cartoes de credito.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingCreditCards(false)
        }
      }
    }

    hydrateCreditCards()

    return () => {
      isMounted = false
    }
  }, [token, profile, isDashboardRoute, dashboardSection])

  useEffect(() => {
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'faturas') {
      return
    }

    let isMounted = true

    const hydrateInvoices = async () => {
      setIsLoadingInvoices(true)

      try {
        const selectedCardId = invoiceFilters.cartaoCreditoId === 'todos' ? '' : invoiceFilters.cartaoCreditoId
        const [cardsResponse, invoicesResponse, expensesResponse] = await Promise.all([
          creditCards.length === 0 ? getCreditCards(token) : Promise.resolve(creditCards),
          getCreditCardInvoices(token, selectedCardId),
          getExpenses(token),
        ])

        if (!isMounted) {
          return
        }

        setCreditCards(Array.isArray(cardsResponse) ? cardsResponse : [])
        setCreditCardInvoices(Array.isArray(invoicesResponse) ? invoicesResponse : [])
        setExpenses(Array.isArray(expensesResponse?.gastos) ? expensesResponse.gastos : [])
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar as faturas dos cartoes.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingInvoices(false)
        }
      }
    }

    hydrateInvoices()

    return () => {
      isMounted = false
    }
  }, [token, profile, isDashboardRoute, dashboardSection, invoiceFilters.cartaoCreditoId])

  useEffect(() => {
    if (!token || !profile || !isExpenseCreateRoute) {
      return
    }

    let isMounted = true

    const hydrateCreateDependencies = async () => {
      setIsLoadingExpenseDetails(true)

      try {
        const [categoriesResponse, jointAccountsResponse, creditCardsResponse] = await Promise.all([
          categories.length === 0 ? getCategories(token) : Promise.resolve(categories),
          jointAccounts.length === 0 ? getJointAccounts(token) : Promise.resolve(jointAccounts),
          creditCards.length === 0 ? getCreditCards(token) : Promise.resolve(creditCards),
        ])

        if (!isMounted) {
          return
        }

        setExpenseForm(getInitialExpenseForm())

        if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse)
        }

        if (Array.isArray(jointAccountsResponse)) {
          setJointAccounts(jointAccountsResponse)
        }

        if (Array.isArray(creditCardsResponse)) {
          setCreditCards(creditCardsResponse)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel preparar o formulario de novo gasto.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingExpenseDetails(false)
        }
      }
    }

    hydrateCreateDependencies()

    return () => {
      isMounted = false
    }
  }, [token, profile, isExpenseCreateRoute])

  useEffect(() => {
    if (!token || !profile || !isExpenseEditRoute || !editingExpenseId) {
      return
    }

    let isMounted = true

    const hydrateExpenseDetails = async () => {
      setIsLoadingExpenseDetails(true)

      try {
        const [expenseResponse, categoriesResponse, jointAccountsResponse, creditCardsResponse] = await Promise.all([
          getExpenseById(token, editingExpenseId),
          categories.length === 0 ? getCategories(token) : Promise.resolve(categories),
          jointAccounts.length === 0 ? getJointAccounts(token) : Promise.resolve(jointAccounts),
          creditCards.length === 0 ? getCreditCards(token) : Promise.resolve(creditCards),
        ])

        if (!isMounted) {
          return
        }

        if (expenseResponse.responsavelId !== profile.id) {
          blockSharedExpenseEdition()
          return
        }

        if (getEffectiveExpenseStatus(expenseResponse) === 'pago') {
          blockPaidExpenseEdition()
          return
        }

        setExpenseForm(normalizeExpenseForm(expenseResponse))

        if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse)
        }

        if (Array.isArray(jointAccountsResponse)) {
          setJointAccounts(jointAccountsResponse)
        }

        if (Array.isArray(creditCardsResponse)) {
          setCreditCards(creditCardsResponse)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel carregar a despesa selecionada.',
        })
      } finally {
        if (isMounted) {
          setIsLoadingExpenseDetails(false)
        }
      }
    }

    hydrateExpenseDetails()

    return () => {
      isMounted = false
    }
  }, [token, profile, isExpenseEditRoute, editingExpenseId])

  const handleChange = ({ target }) => {
    const { name, value } = target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleRegisterChange = ({ target }) => {
    const { name, value } = target
    setRegisterForm((current) => ({ ...current, [name]: value }))
  }

  const handlePasswordChange = ({ target }) => {
    const { name, value } = target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  const handleCategoryChange = ({ target }) => {
    const { name, value } = target
    setCategoryForm((current) => ({ ...current, [name]: value }))
  }

  const handleJointAccountChange = ({ target }) => {
    const { name, value } = target
    setJointAccountForm((current) => ({ ...current, [name]: value }))
  }

  const handleCreditCardChange = ({ target }) => {
    const { name, value } = target
    setCreditCardForm((current) => ({
      ...current,
      [name]: name === 'valorLimite' ? formatCurrencyInput(value) : value,
    }))
  }

  const openCreditCardEdit = (card) => {
    if (card.origemCartao === 'conta_conjunta') {
      setStatus({
        type: 'error',
        message: 'Somente o titular do cartao pode editar este cadastro.',
      })
      return
    }

    setSelectedCreditCard(card)
    setCreditCardForm({
      descricao: card.descricao ?? '',
      diaFechamento: card.diaFechamento != null ? String(card.diaFechamento) : '',
      diaVencimento: card.diaVencimento != null ? String(card.diaVencimento) : '',
      valorLimite: card.valorLimite != null ? formatCurrencyAmount(card.valorLimite) : '',
      observacoes: card.observacoes ?? '',
    })
  }

  const cancelCreditCardEdit = () => {
    setSelectedCreditCard(null)
    setCreditCardForm(initialCreditCardForm)
  }

  const handleExpenseFormChange = ({ target }) => {
    const { checked, name, type, value } = target
    setExpenseForm((current) => {
      if (name === 'origemLancamento') {
        return {
          ...current,
          origemLancamento: value,
          numeroParcelas: value === 'parcelado' ? current.numeroParcelas || '2' : '2',
          dataFimRecorrencia: value === 'recorrente' ? current.dataFimRecorrencia : '',
        }
      }

      if (name === 'cartaoCreditoId') {
        const selectedCard = creditCards.find((card) => card.id === value)

        if (!selectedCard) {
          return {
            ...current,
            cartaoCreditoId: value,
          }
        }

        const invoiceDueDate = calculateCreditCardInvoiceDueDate(selectedCard)

        if (!invoiceDueDate?.dueDateValue) {
          return {
            ...current,
            cartaoCreditoId: value,
          }
        }

        if (invoiceDueDate.closingPassed) {
          setCreditCardDueDateNotice({
            cardDescription: selectedCard.descricao || 'Cartao de credito',
            dueDate: invoiceDueDate.dueDate,
          })
        }

        return {
          ...current,
          cartaoCreditoId: value,
          dataVencimento: invoiceDueDate.dueDateValue,
          competencia: getCompetenceMonthFromDueDate(invoiceDueDate.dueDateValue) || current.competencia,
        }
      }

      if (name === 'dataVencimento') {
        return {
          ...current,
          dataVencimento: value,
          competencia: getCompetenceMonthFromDueDate(value) || current.competencia,
        }
      }

      return {
        ...current,
        [name]: type === 'checkbox' ? checked : name === 'valor' ? formatCurrencyInput(value) : value,
      }
    })
  }

  const handleExpenseFilterChange = ({ target }) => {
    const { name, value } = target
    setExpenseFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }


  const handleExpenseMonthNavigation = (monthOffset) => {
    setExpenseFilters((current) => ({
      ...current,
      ...shiftMonthDateRange(current, monthOffset),
    }))
  }

  const handleResetExpenseMonthNavigation = () => {
    setExpenseFilters((current) => ({
      ...current,
      ...getCurrentMonthDateRange(),
    }))
  }
  const handleInsightsFilterChange = ({ target }) => {
    const { name, value } = target
    setInsightsFilters((current) => ({
      ...current,
      [name]: value,
      preset: name === 'preset' ? value : 'personalizado',
    }))
  }

  const handleInvoiceFilterChange = ({ target }) => {
    const { name, value } = target
    setInvoiceFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleMonthlyReportFilterChange = ({ target }) => {
    const { name, value } = target
    setMonthlyReportFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleComparisonReportFilterChange = ({ target }) => {
    const { name, value } = target
    setComparisonReportFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleTopCategoryFilterChange = ({ target }) => {
    const { name, value } = target
    setTopCategoryFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleWhoSpendsMoreFilterChange = ({ target }) => {
    const { name, value } = target
    setWhoSpendsMoreFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const toggleTopCategoryDetails = (categoryName) => {
    setExpandedTopCategoryNames((current) => ({
      ...current,
      [categoryName]: !current[categoryName],
    }))
  }

  const normalizeMonthlyReportItems = (response) => {
    if (!Array.isArray(response)) {
      return []
    }

    return response.map((item) => ({
      referencia: item.referencia ?? item.mes ?? '',
      total: Number(item.total ?? item.total_gasto ?? 0),
    }))
  }

  const loadMonthlyReport = async (range, options = {}) => {
    if (!token) {
      return
    }

    const { dateFrom, dateTo } = range

    if (!dateFrom || !dateTo) {
      setStatus({
        type: 'error',
        message: 'Informe a data inicial e a data final para gerar o relatorio.',
      })
      return
    }

    if (dateTo < dateFrom) {
      setStatus({
        type: 'error',
        message: 'A data final deve ser maior ou igual a data inicial.',
      })
      return
    }

    setIsLoadingMonthlyReport(true)

    try {
      const response = await getMonthlyEvolutionReport(token, dateFrom, dateTo)

      setMonthlyReportItems(normalizeMonthlyReportItems(response))
      setMonthlyReportRange(range)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel gerar o relatorio de evolucao mensal.',
      })
    } finally {
      setIsLoadingMonthlyReport(false)
    }
  }

  const handleMonthlyReportSubmit = async (event) => {
    event.preventDefault()
    await loadMonthlyReport(monthlyReportFilters)
  }

  const loadComparisonReport = async (filters) => {
    if (!token) {
      return
    }

    const { currentMonth, previousMonth } = filters

    if (!currentMonth || !previousMonth) {
      setStatus({
        type: 'error',
        message: 'Informe o mes atual e o mes anterior para gerar o comparativo.',
      })
      return
    }

    if (currentMonth < previousMonth) {
      setStatus({
        type: 'error',
        message: 'O mes atual deve ser maior ou igual ao mes anterior.',
      })
      return
    }

    setIsLoadingComparisonReport(true)

    try {
      const response = await getMonthlyComparisonReport(token, currentMonth, previousMonth)
      setComparisonReport({
        mesAtual: Number(response?.mesAtual ?? 0),
        mesAnterior: Number(response?.mesAnterior ?? 0),
        variacao: response?.variacao ?? '0.0%',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel gerar o relatorio comparativo mensal.',
      })
    } finally {
      setIsLoadingComparisonReport(false)
    }
  }

  const handleComparisonReportSubmit = async (event) => {
    event.preventDefault()
    await loadComparisonReport(comparisonReportFilters)
  }

  const loadTopCategoryReport = async (range) => {
    if (!token) {
      return
    }

    const { dateFrom, dateTo } = range

    if (!dateFrom || !dateTo) {
      setStatus({
        type: 'error',
        message: 'Informe a data inicial e a data final para gerar o top de categorias.',
      })
      return
    }

    if (dateTo < dateFrom) {
      setStatus({
        type: 'error',
        message: 'A data final deve ser maior ou igual a data inicial.',
      })
      return
    }

    setIsLoadingTopCategoryReport(true)

    try {
      const [response, expensesResponse, categoriesResponse] = await Promise.all([
        getTopCategoryReport(token, dateFrom, dateTo),
        getExpenses(token),
        categories.length === 0 ? getCategories(token) : Promise.resolve(categories),
      ])

      setExpenses(Array.isArray(expensesResponse?.gastos) ? expensesResponse.gastos : [])
      if (Array.isArray(categoriesResponse)) {
        setCategories(categoriesResponse)
      }

      setTopCategoryItems(Array.isArray(response)
        ? response.map((item) => ({
          categoria: item.categoria ?? 'Sem categoria',
          total: Number(item.total_gasto ?? item.total ?? 0),
        }))
        : [])
      setExpandedTopCategoryNames({})
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel gerar o relatorio de top categorias.',
      })
    } finally {
      setIsLoadingTopCategoryReport(false)
    }
  }

  const handleTopCategoryReportSubmit = async (event) => {
    event.preventDefault()
    await loadTopCategoryReport(topCategoryFilters)
  }

  const loadWhoSpendsMoreReport = async (range) => {
    if (!token) {
      return
    }

    const { dateFrom, dateTo } = range

    if (!dateFrom || !dateTo) {
      setStatus({
        type: 'error',
        message: 'Informe a data inicial e a data final para gerar o ranking entre usuarios.',
      })
      return
    }

    if (dateTo < dateFrom) {
      setStatus({
        type: 'error',
        message: 'A data final deve ser maior ou igual a data inicial.',
      })
      return
    }

    setIsLoadingWhoSpendsMoreReport(true)

    try {
      const response = await getWhoSpendsMoreReport(token, dateFrom, dateTo)
      setWhoSpendsMoreReport(response)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel gerar o ranking entre usuarios.',
      })
    } finally {
      setIsLoadingWhoSpendsMoreReport(false)
    }
  }

  const handleWhoSpendsMoreReportSubmit = async (event) => {
    event.preventDefault()
    await loadWhoSpendsMoreReport(whoSpendsMoreFilters)
  }

  const loadInsights = async (filters) => {
    if (!token) {
      return
    }

    const { dateFrom, dateTo } = filters

    if (!dateFrom || !dateTo) {
      setStatus({
        type: 'error',
        message: 'Informe a data inicial e a data final para o Radar analisar seus gastos.',
      })
      return
    }

    if (dateTo < dateFrom) {
      setStatus({
        type: 'error',
        message: 'A data final do Radar deve ser maior ou igual a data inicial.',
      })
      return
    }

    setIsLoadingInsights(true)

    try {
      const response = await getInsights(token, dateFrom, dateTo)
      setInsightsData(response)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel atualizar a analise do Radar.',
      })
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleInsightsSubmit = async (event) => {
    event.preventDefault()
    await loadInsights(insightsFilters)
  }

  const handleInsightsPresetSelect = async (preset) => {
    const nextRange = preset === 'ultimos-30-dias'
      ? getLastThirtyDaysRange()
      : preset === 'mes-anterior'
        ? getPreviousMonthDateRange()
        : getCurrentMonthDateRange()
    const nextFilters = {
      ...nextRange,
      preset,
    }

    setInsightsFilters(nextFilters)
    await loadInsights(nextFilters)
  }

  const handleInsightsAction = (action) => {
    if (!action?.tipo) {
      return
    }

    const payload = action.payload || {}

    if (action.tipo === 'abrir_gastos' || action.tipo === 'filtrar_gastos') {
      setDashboardSection('gastos')
      setExpenseFilters((current) => ({
        ...current,
        dateFrom: payload.dateFrom || insightsFilters.dateFrom,
        dateTo: payload.dateTo || insightsFilters.dateTo,
        status: payload.status || 'todos',
        tipo: payload.tipo || current.tipo,
        cartaoCreditoId: payload.cartaoCreditoId || current.cartaoCreditoId,
      }))
      navigateTo('/dashboard')
      return
    }

    if (action.tipo === 'abrir_relatorio') {
      const nextFilters = {
        dateFrom: payload.dateFrom || insightsFilters.dateFrom,
        dateTo: payload.dateTo || insightsFilters.dateTo,
      }

      setDashboardSection('relatorios')
      setReportSection(payload.reportSection || 'top-categorias')

      if ((payload.reportSection || 'top-categorias') === 'top-categorias') {
        setTopCategoryFilters(nextFilters)
      }

      if (payload.reportSection === 'quem-gasta-mais') {
        setWhoSpendsMoreFilters(nextFilters)
      }

      if (payload.reportSection === 'evolucao-mensal') {
        setMonthlyReportFilters(nextFilters)
      }

      navigateTo('/dashboard')
    }
  }

  const fallbackInsightsActions = [
    {
      tipo: 'abrir_gastos',
      label: 'Ver gastos do periodo',
      payload: {
        status: 'todos',
        dateFrom: insightsFilters.dateFrom,
        dateTo: insightsFilters.dateTo,
      },
    },
    {
      tipo: 'abrir_gastos',
      label: 'Ver atrasados',
      payload: {
        status: 'atrasado',
        dateFrom: insightsFilters.dateFrom,
        dateTo: insightsFilters.dateTo,
      },
    },
    {
      tipo: 'abrir_gastos',
      label: 'Ver pendentes',
      payload: {
        status: 'abertos',
        dateFrom: insightsFilters.dateFrom,
        dateTo: insightsFilters.dateTo,
      },
    },
    {
      tipo: 'abrir_relatorio',
      label: 'Abrir top categorias',
      payload: {
        reportSection: 'top-categorias',
        dateFrom: insightsFilters.dateFrom,
        dateTo: insightsFilters.dateTo,
      },
    },
  ]
  const insightsActions = Array.isArray(insightsData?.acoes) && insightsData.acoes.length > 0
    ? insightsData.acoes
    : fallbackInsightsActions

  const currentDateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const buildCreditCardLimitWarning = async (payload) => {
    if (!payload.cartaoCreditoId || payload.tipo !== 'despesa') {
      return null
    }

    const selectedCard = creditCards.find((card) => card.id === payload.cartaoCreditoId)

    if (!selectedCard) {
      return null
    }

    const limit = Number(selectedCard.valorLimite ?? 0)

    if (!Number.isFinite(limit) || limit <= 0) {
      return null
    }

    const openBalance = Number(buildCreditCardUsageMap(expenses).get(selectedCard.id) ?? 0)
    const projectedExpenseValue = Number(payload.valor ?? 0)
    const projectedBalance = openBalance + projectedExpenseValue
    const currentPercent = (openBalance / limit) * 100
    const projectedPercent = (projectedBalance / limit) * 100
    const availableLimit = Math.max(limit - openBalance, 0)
    const cardOwner = selectedCard.origemCartao === 'conta_conjunta'
      ? `Cartao de ${selectedCard.usuarioNome || 'usuario compartilhado'}`
      : 'Meu cartao'

    const baseWarning = {
      competence: 'Saldo total em aberto',
      currentTotal: openBalance,
      projectedTotal: projectedBalance,
      projectedPercent,
      limit,
      availableLimit,
      installmentLabel: payload.origemLancamento === 'parcelado'
        ? `compra parcelada em ${payload.numeroParcelas}x`
        : 'gasto unico',
    }

    const warnings = []

    if (projectedBalance >= limit) {
      warnings.push({
        ...baseWarning,
        level: 'critical',
        title: 'Limite atingido ou ultrapassado',
        description: `O saldo em aberto do cartao sairá de ${currencyFormatter.format(openBalance)} para ${currencyFormatter.format(projectedBalance)}, atingindo ${Math.round(projectedPercent)}% do limite total.`,
      })
    } else if (currentPercent < 80 && projectedPercent >= 80) {
      warnings.push({
        ...baseWarning,
        level: 'high',
        title: 'Aviso de 80% do limite',
        description: `O saldo em aberto do cartao sairá de ${currencyFormatter.format(openBalance)} para ${currencyFormatter.format(projectedBalance)}, equivalente a ${Math.round(projectedPercent)}% do limite total.`,
      })
    } else if (currentPercent < 50 && projectedPercent >= 50) {
      warnings.push({
        ...baseWarning,
        level: 'medium',
        title: 'Aviso de 50% do limite',
        description: `O saldo em aberto do cartao sairá de ${currencyFormatter.format(openBalance)} para ${currencyFormatter.format(projectedBalance)}, equivalente a ${Math.round(projectedPercent)}% do limite total.`,
      })
    }

    if (warnings.length === 0) {
      return null
    }

    return {
      card: selectedCard,
      cardOwner,
      limit,
      warnings,
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const effectiveStatus = getEffectiveExpenseStatus(expense)
    const matchesStatus =
      expenseFilters.status === 'todos' ||
      (expenseFilters.status === 'abertos' && ['pendente', 'atrasado'].includes(effectiveStatus)) ||
      effectiveStatus === expenseFilters.status
    const matchesTipo = expenseFilters.tipo === 'todos' || expense.tipo === expenseFilters.tipo
    const matchesCreditCard =
      expenseFilters.cartaoCreditoId === 'todos' ||
      (expenseFilters.cartaoCreditoId === 'sem-cartao' && !expense.cartaoCreditoId) ||
      expense.cartaoCreditoId === expenseFilters.cartaoCreditoId

    if (!matchesStatus || !matchesTipo || !matchesCreditCard) {
      return false
    }

    return (
      isDateInRange(expense.dataVencimento, expenseFilters.dateFrom, expenseFilters.dateTo) ||
      hasInstallmentDueInRange(expense, expenseFilters.dateFrom, expenseFilters.dateTo)
    )
  })
  const filteredRevenueValue = filteredExpenses
    .filter((expense) => expense.tipo === 'receita')
    .reduce((accumulator, expense) => (
      accumulator + getExpensePeriodAmount(expense, expenseFilters.dateFrom, expenseFilters.dateTo)
    ), 0)
  const filteredCostValue = filteredExpenses
    .filter((expense) => expense.tipo === 'despesa')
    .reduce((accumulator, expense) => (
      accumulator + getExpensePeriodAmount(expense, expenseFilters.dateFrom, expenseFilters.dateTo)
    ), 0)
  const filteredBalanceValue = filteredRevenueValue - filteredCostValue
  const availableInvoiceDueMonths = Array.from(new Set(
    creditCardInvoices
      .map((invoice) => getInvoiceDueMonth(invoice.dataVencimento))
      .filter(Boolean),
  )).sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth))
  const creditCardUsageById = buildCreditCardUsageMap(expenses)
  const invoiceItemsById = expenses.reduce((groups, expense) => {
    const ownerLabel = expense.responsavelId === profile?.id
      ? 'Responsavel: voce'
      : `Responsavel: ${expense.responsavelNome || 'usuario compartilhado'}`

    if (expense.faturaCartaoId && expense.origemLancamento !== 'parcelado') {
      const entries = groups.get(expense.faturaCartaoId) ?? []
      entries.push({
        id: expense.id,
        label: expense.descricao || 'Gasto sem descricao',
        amount: Number(expense.valor ?? 0),
        status: getEffectiveExpenseStatus(expense),
        dueDate: expense.dataVencimento,
        competence: expense.competencia,
        createdAt: expense.createdAt,
        origin: expense.origemLancamento,
        ownerLabel,
      })
      groups.set(expense.faturaCartaoId, entries)
    }

    if (Array.isArray(expense.lancamentosBase) && expense.lancamentosBase.length > 0) {
      expense.lancamentosBase.forEach((installment) => {
        if (!installment.faturaCartaoId) {
          return
        }

        const entries = groups.get(installment.faturaCartaoId) ?? []
        entries.push({
          id: installment.id,
          label: `${expense.descricao || 'Gasto sem descricao'} - Parcela ${installment.numeroParcela}/${expense.numeroParcelas || expense.lancamentosBase.length}`,
          amount: Number(installment.valorParcela ?? 0),
          status: getInstallmentEffectiveStatus(installment),
          dueDate: installment.dataVencimentoParcela,
          competence: installment.competencia,
          createdAt: installment.createdAt,
          origin: 'parcelado',
          ownerLabel,
        })
        groups.set(installment.faturaCartaoId, entries)
      })
    }

    return groups
  }, new Map())
  const filteredCreditCardInvoices = creditCardInvoices.filter((invoice) => {
    if (!invoiceFilters.dueMonth) {
      return true
    }

    return getInvoiceDueMonth(invoice.dataVencimento) === invoiceFilters.dueMonth
  })
  const sortedCreditCardInvoices = filteredCreditCardInvoices.slice().sort((firstInvoice, secondInvoice) => {
    const firstTime = firstInvoice.dataVencimento ? new Date(firstInvoice.dataVencimento).getTime() : 0
    const secondTime = secondInvoice.dataVencimento ? new Date(secondInvoice.dataVencimento).getTime() : 0

    return invoiceFilters.sortOrder === 'asc'
      ? firstTime - secondTime
      : secondTime - firstTime
  })
  const sortedCategories = categories.slice().sort((firstCategory, secondCategory) => (
    String(firstCategory?.descricao ?? '').localeCompare(
      String(secondCategory?.descricao ?? ''),
      'pt-BR',
      { sensitivity: 'base' },
    )
  ))
  const monthlyReportValues = monthlyReportItems.map((item) => Number(item.total ?? item.total_gasto ?? 0))
  const monthlyReportMax = monthlyReportValues.length > 0 ? Math.max(...monthlyReportValues) : 0
  const monthlyReportTotal = monthlyReportValues.reduce((sum, item) => sum + item, 0)
  const monthlyReportAverage = monthlyReportValues.length > 0 ? monthlyReportTotal / monthlyReportValues.length : 0
  const firstReportMonth = monthlyReportItems[0]
  const lastReportMonth = monthlyReportItems[monthlyReportItems.length - 1]
  const highestMonthlyReportItem = monthlyReportItems.reduce((highest, item) => {
    if (!highest) {
      return item
    }

    const currentValue = Number(item.total ?? item.total_gasto ?? 0)
    const highestValue = Number(highest.total ?? highest.total_gasto ?? 0)

    return currentValue > highestValue ? item : highest
  }, null)
  const monthlyReportVariation = firstReportMonth
    ? ((Number(lastReportMonth.total ?? lastReportMonth.total_gasto ?? 0)
      - Number(firstReportMonth.total ?? firstReportMonth.total_gasto ?? 0))
      / Math.max(Number(firstReportMonth.total ?? firstReportMonth.total_gasto ?? 0), 1)) * 100
    : 0
  const expenseFilterMonthLabel = formatMonthYearLabel(expenseFilters.dateFrom)

  const monthlyReportPeriodLabel = monthlyReportRange.dateFrom && monthlyReportRange.dateTo
    ? `${new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(`${monthlyReportRange.dateFrom}T00:00:00`))} - ${new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(`${monthlyReportRange.dateTo}T00:00:00`))}`
    : 'Periodo nao informado'
  const getTopCategoryExpenseItems = (categoryName) => (
    expenses
      .filter((expense) => {
        if (expense.tipo !== 'despesa' || expense.responsavelId !== profile?.id) {
          return false
        }

        const category = categories.find((item) => item.id === expense.categoriaId)
        return category?.descricao === categoryName && isDateInRange(expense.competencia, topCategoryFilters.dateFrom, topCategoryFilters.dateTo)
      })
      .sort((firstExpense, secondExpense) => {
        const firstValue = Number(firstExpense.valor ?? 0)
        const secondValue = Number(secondExpense.valor ?? 0)

        if (secondValue !== firstValue) {
          return secondValue - firstValue
        }

        const firstDate = firstExpense.competencia ? new Date(firstExpense.competencia).getTime() : 0
        const secondDate = secondExpense.competencia ? new Date(secondExpense.competencia).getTime() : 0
        return secondDate - firstDate
      })
  )
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const category = categories.find((item) => item.id === expense.categoriaId)
    const categoryId = expense.categoriaId || 'sem-categoria'
    const currentGroup = groups.get(categoryId) ?? {
      id: categoryId,
      name: category?.descricao || 'Sem categoria',
      icon: getCategoryDisplayIcon(category),
      expenses: [],
      total: 0,
    }

    currentGroup.expenses.push(expense)
    currentGroup.total += getExpensePeriodAmount(expense, expenseFilters.dateFrom, expenseFilters.dateTo)
    groups.set(categoryId, currentGroup)

    return groups
  }, new Map())
  const groupedExpensesList = Array.from(groupedExpenses.values()).sort((first, second) => first.name.localeCompare(second.name))

  const toggleCategoryGroup = (categoryId) => {
    setExpandedCategoryIds((current) => ({
      ...current,
      [categoryId]: current[categoryId] === false,
    }))
  }

  const toggleExpenseInstallments = (expenseId) => {
    setExpandedInstallmentIds((current) => ({
      ...current,
      [expenseId]: !current[expenseId],
    }))
  }

  const toggleInvoiceItems = (invoiceId) => {
    setExpandedInvoiceIds((current) => ({
      ...current,
      [invoiceId]: !current[invoiceId],
    }))
  }

  useEffect(() => {
    if (groupedExpensesList.length === 0) {
      return
    }

    setExpandedCategoryIds((current) => {
      const nextState = { ...current }
      let hasChanged = false

      for (const group of groupedExpensesList) {
        if (!(group.id in nextState)) {
          nextState[group.id] = true
          hasChanged = true
        }
      }

      return hasChanged ? nextState : current
    })
  }, [groupedExpensesList])

  const navigateTo = (path) => {
    if (window.location.pathname === path) {
      return
    }

    window.history.pushState({}, '', path)
    setRoute(path)
    setSearch(window.location.search)
  }

  const navigateToExpenseEdit = (expenseId) => {
    setDashboardSection('gastos')
    navigateTo(`/dashboard/gastos/${expenseId}`)
  }

  const blockPaidExpenseEdition = () => {
    setStatus({
      type: 'error',
      message: 'Gastos quitados nao podem ser editados.',
    })
    setDashboardSection('gastos')
    navigateTo('/dashboard')
  }

  const blockSharedExpenseEdition = () => {
    setStatus({
      type: 'error',
      message: 'Somente o responsavel pelo gasto pode editar este registro.',
    })
    setDashboardSection('gastos')
    navigateTo('/dashboard')
  }

  const navigateToExpenseCreate = () => {
    setDashboardSection('gastos')
    setExpenseSuccessMessage('')
    navigateTo('/dashboard/gastos/novo')
  }

  useEffect(() => {
    if (!token && isDashboardRoute) {
      navigateTo('/')
      return
    }

    if (profile && !isPasswordResetRoute && route === '/') {
      navigateTo('/dashboard')
    }
  }, [token, profile, isDashboardRoute, isPasswordResetRoute, route])

  useEffect(() => {
    if (!isEmailValidationRoute) {
      return
    }

    if (!emailValidationToken) {
      setStatus({
        type: 'error',
        message: 'Link de validacao de email invalido.',
      })
      return
    }

    let isMounted = true

    const confirmEmail = async () => {
      setStatus({
        type: 'loading',
        message: 'Validando seu email...',
      })

      try {
        const response = await validateEmail(emailValidationToken)

        if (!isMounted) {
          return
        }

        setStatus({
          type: 'success',
          message: response.message || 'Email validado com sucesso. Agora voce ja pode entrar.',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatus({
          type: 'error',
          message: error.message || 'Nao foi possivel validar seu email.',
        })
      }
    }

    confirmEmail()

    return () => {
      isMounted = false
    }
  }, [isEmailValidationRoute, emailValidationToken])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({
      type: 'loading',
      message: 'Validando suas credenciais...',
    })

    try {
      const response = await login(form)
      localStorage.setItem('nossosaldo.token', response.token)
      setToken(response.token)
      setForm(initialForm)
      setLoginErrorMessage('')
      setStatus({
        type: 'success',
        message: 'Login realizado com sucesso. Carregando seus dados...',
      })
      navigateTo('/dashboard')
    } catch {
      const userMessage = 'Usuário não localizado ou não autorizado. Confira o e-mail e a senha informados.'

      setLoginErrorMessage(userMessage)
      setStatus({
        type: 'error',
        message: userMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    if (registerForm.senha !== registerForm.confirmarSenha) {
      setStatus({
        type: 'error',
        message: 'A confirmacao da senha precisa ser igual a senha informada.',
      })
      return
    }

    setIsRegistering(true)
    setStatus({
      type: 'loading',
      message: 'Criando sua conta com seguranca...',
    })

    try {
      const usuarioCriado = await createUser({
        nome: registerForm.nome,
        email: registerForm.email,
        senha: registerForm.senha,
      })

      setRegisterForm(initialRegisterForm)
      setForm((current) => ({ ...current, email: usuarioCriado.email || registerForm.email, senha: '' }))
      setStatus({
        type: 'success',
        message: 'Conta criada com sucesso. Enviamos um email para voce confirmar seu cadastro antes do primeiro acesso.',
      })
      navigateTo('/')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel criar sua conta agora.',
      })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('nossosaldo.token')
    setToken('')
    setProfile(null)
    setExpenses([])
    setCategories([])
    setJointAccounts([])
    setStatus({
      type: 'idle',
      message: 'Sessao encerrada. Entre novamente quando quiser.',
    })
    navigateTo('/')
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (!token && !recoveryToken) {
      setStatus({
        type: 'error',
        message: 'Use o link enviado por e-mail ou faca login antes de trocar sua senha.',
      })
      navigateTo('/')
      return
    }

    if (passwordForm.senha !== passwordForm.confirmarSenha) {
      setStatus({
        type: 'error',
        message: 'A confirmacao da senha precisa ser igual a nova senha.',
      })
      return
    }

    setIsUpdatingPassword(true)
    setStatus({
      type: 'loading',
      message: 'Atualizando sua senha com seguranca...',
    })

    try {
      const response = await updatePassword(token, passwordForm.senha, recoveryToken)
      setPasswordForm(initialPasswordForm)
      setStatus({
        type: 'success',
        message: response.message || 'Senha atualizada com sucesso.',
      })
      navigateTo(token ? '/dashboard' : '/')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel atualizar a senha.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCategorySubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setStatus({
        type: 'error',
        message: 'Sua sessao expirou. Entre novamente para criar categorias.',
      })
      navigateTo('/')
      return
    }

    setIsSavingCategory(true)
    setStatus({
      type: 'loading',
      message: 'Criando a nova categoria...',
    })

    try {
      const categoriaCriada = await createCategory(token, categoryForm)
      setCategories((current) => [categoriaCriada, ...current])
      setCategoryForm(initialCategoryForm)
      setStatus({
        type: 'success',
        message: `Categoria "${categoriaCriada.descricao}" criada com sucesso.`,
      })
      setDashboardSection('categorias')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel criar a categoria.',
      })
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleCreditCardSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setStatus({
        type: 'error',
        message: 'Sua sessao expirou. Entre novamente para criar cartoes de credito.',
      })
      navigateTo('/')
      return
    }

    setIsSavingCreditCard(true)
    setStatus({
      type: 'loading',
      message: selectedCreditCard
        ? `Salvando alteracoes do cartao "${creditCardForm.descricao}"...`
        : `Criando o cartao "${creditCardForm.descricao}"...`,
    })

    try {
      const payload = {
        descricao: creditCardForm.descricao,
        diaFechamento: Number(creditCardForm.diaFechamento),
        diaVencimento: Number(creditCardForm.diaVencimento),
        valorLimite: parseCurrencyInput(creditCardForm.valorLimite),
        observacoes: creditCardForm.observacoes,
      }
      const savedCard = selectedCreditCard
        ? await updateCreditCard(token, selectedCreditCard.id, payload)
        : await createCreditCard(token, payload)

      setCreditCards((current) => (
        selectedCreditCard
          ? current.map((card) => (card.id === savedCard.id ? { ...card, ...savedCard } : card))
          : [savedCard, ...current]
      ))
      setCreditCardForm(initialCreditCardForm)
      setSelectedCreditCard(null)
      setStatus({
        type: 'success',
        message: selectedCreditCard
          ? `Cartao "${savedCard.descricao}" atualizado com sucesso.`
          : `Cartao "${savedCard.descricao}" criado com sucesso.`,
      })
      setDashboardSection('cartoes')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel salvar o cartao de credito.',
      })
    } finally {
      setIsSavingCreditCard(false)
    }
  }

  const handleJointAccountSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setStatus({
        type: 'error',
        message: 'Sua sessao expirou. Entre novamente para criar a conta conjunta.',
      })
      navigateTo('/')
      return
    }

    if (jointAccounts.length > 0) {
      setStatus({
        type: 'error',
        message: 'Voce ja possui uma conta compartilhada ativa. Desvincule a conta atual antes de criar outra.',
      })
      return
    }

    setIsSavingJointAccount(true)
    setStatus({
      type: 'loading',
      message: `Criando vinculo "${jointAccountForm.nomeConta}"...`,
    })

    try {
      await createJointAccount(token, {
        nomeConta: jointAccountForm.nomeConta,
        usuarioConjunto: jointAccountForm.usuarioConjunto,
      })
      const updatedJointAccounts = await getJointAccounts(token)

      setJointAccounts(Array.isArray(updatedJointAccounts) ? updatedJointAccounts : [])
      setJointAccountForm(initialJointAccountForm)
      setStatus({
        type: 'success',
        message: `Conta conjunta "${jointAccountForm.nomeConta}" criada com sucesso.`,
      })
    } catch (error) {
      const updatedJointAccounts = await getJointAccounts(token).catch(() => [])

      if (Array.isArray(updatedJointAccounts) && updatedJointAccounts.length > 0) {
        setJointAccounts(updatedJointAccounts)
      }

      const accountNotFoundMessage = 'A conta informada nao foi localizada em nossa base de dados.'
      const userMessage = error.message === accountNotFoundMessage
        ? 'A conta informada n\u00e3o foi localizada em nossa base de dados'
        : error.message || 'Nao foi possivel criar a conta conjunta. Verifique se um dos usuarios ja possui vinculo ativo.'

      setJointAccountErrorMessage(userMessage)

      setStatus({
        type: 'error',
        message: error.message === accountNotFoundMessage
          ? 'A conta informada não foi localizada em nossa base de dados'
          : error.message || 'Nao foi possivel criar a conta conjunta. Verifique se um dos usuarios ja possui vinculo ativo.',
      })
      setStatus({
        type: 'error',
        message: userMessage,
      })
    } finally {
      setIsSavingJointAccount(false)
    }
  }

  const openPayExpenseModal = (expense) => {
    setSelectedExpense(expense)
    setExpenseModalMode('pay')
  }

  const openReopenExpenseModal = (expense) => {
    setSelectedExpense(expense)
    setExpenseModalMode('reopen')
  }

  const openPayInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice)
    setInvoiceModalMode('pay')
  }

  const openReopenInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice)
    setInvoiceModalMode('reopen')
  }

  const openDeleteExpenseModal = (expense) => {
    setSelectedExpense(expense)
    setExpenseModalMode('delete')
  }

  const closePayExpenseModal = () => {
    if (isPayingExpense || isDeletingExpense || isReopeningExpense) {
      return
    }

    setSelectedExpense(null)
    setExpenseModalMode(null)
  }

  const closePayInvoiceModal = () => {
    if (isPayingInvoice || isReopeningInvoice) {
      return
    }

    setSelectedInvoice(null)
    setInvoiceModalMode(null)
  }

  const openPayInstallmentModal = (expense, installment) => {
    if (installment.status === 'pago') {
      return
    }

    setSelectedInstallment({ expense, installment })
  }

  const closePayInstallmentModal = () => {
    if (isPayingInstallment) {
      return
    }

    setSelectedInstallment(null)
  }

  const openUnlinkJointAccountModal = (account) => {
    setSelectedJointAccount(account)
  }

  const closeUnlinkJointAccountModal = () => {
    if (isUnlinkingJointAccount) {
      return
    }

    setSelectedJointAccount(null)
  }

  const closeJointAccountErrorModal = () => {
    setJointAccountErrorMessage('')
  }

  const closeLoginErrorModal = () => {
    setLoginErrorMessage('')
  }

  const closeCreditCardDueDateNotice = () => {
    setCreditCardDueDateNotice(null)
  }

  const handlePayExpense = async () => {
    if (!token || !selectedExpense) {
      return
    }

    setIsPayingExpense(true)
    setStatus({
      type: 'loading',
      message: `Quitando o gasto "${selectedExpense.descricao}"...`,
    })

    try {
      const gastoPago = await payExpense(token, selectedExpense.id, {})
      setExpenses((current) => current.map((expense) => (expense.id === gastoPago.id ? gastoPago : expense)))
      setStatus({
        type: 'success',
        message: `Gasto "${gastoPago.descricao}" quitado com sucesso.`,
      })
      setSelectedExpense(null)
      setExpenseModalMode(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel quitar o gasto selecionado.',
      })
    } finally {
      setIsPayingExpense(false)
    }
  }

  const handleReopenExpense = async () => {
    if (!token || !selectedExpense) {
      return
    }

    setIsReopeningExpense(true)
    setStatus({
      type: 'loading',
      message: `Reabrindo o gasto "${selectedExpense.descricao}"...`,
    })

    try {
      const gastoReaberto = await reopenExpense(token, selectedExpense.id)
      const gastoCompleto = await getExpenseById(token, gastoReaberto.id).catch(() => gastoReaberto)

      setExpenses((current) => current.map((expense) => (expense.id === gastoReaberto.id ? gastoCompleto : expense)))
      setStatus({
        type: 'success',
        message: `Gasto "${selectedExpense.descricao}" reaberto com sucesso.`,
      })
      setSelectedExpense(null)
      setExpenseModalMode(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel reabrir o gasto selecionado.',
      })
    } finally {
      setIsReopeningExpense(false)
    }
  }

  const handlePayInstallment = async () => {
    if (!selectedInstallment || !token) {
      return
    }

    setIsPayingInstallment(true)
    setStatus({
      type: 'loading',
      message: `Pagando a parcela ${selectedInstallment.installment.numeroParcela}...`,
    })

    try {
      const paidInstallment = await payInstallment(token, selectedInstallment.installment.id, {
        dataPagamento: new Date().toISOString(),
      })

      setExpenses((current) => current.map((expense) => {
        if (expense.id !== selectedInstallment.expense.id) {
          return expense
        }

        return {
          ...expense,
          lancamentosBase: Array.isArray(expense.lancamentosBase)
            ? expense.lancamentosBase.map((installment) => (
              installment.id === paidInstallment.id ? paidInstallment : installment
            ))
            : expense.lancamentosBase,
        }
      }))
      setStatus({
        type: 'success',
        message: `Parcela ${paidInstallment.numeroParcela} paga com sucesso.`,
      })
      setSelectedInstallment(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel pagar a parcela.',
      })
    } finally {
      setIsPayingInstallment(false)
    }
  }

  const handlePayInvoice = async () => {
    if (!selectedInvoice || !token) {
      return
    }

    setIsPayingInvoice(true)
    setStatus({
      type: 'loading',
      message: `Quitando a fatura ${selectedInvoice.competencia}...`,
    })

    try {
      await payCreditCardInvoice(token, selectedInvoice.id, {
        dataPagamento: new Date().toISOString(),
      })

      const selectedCardId = invoiceFilters.cartaoCreditoId === 'todos' ? '' : invoiceFilters.cartaoCreditoId
      const [updatedInvoices, updatedExpenses] = await Promise.all([
        getCreditCardInvoices(token, selectedCardId),
        getExpenses(token),
      ])

      setCreditCardInvoices(Array.isArray(updatedInvoices) ? updatedInvoices : [])
      setExpenses(Array.isArray(updatedExpenses?.gastos) ? updatedExpenses.gastos : [])
      setSelectedInvoice(null)
      setInvoiceModalMode(null)
      setStatus({
        type: 'success',
        message: `Fatura ${selectedInvoice.competencia} quitada com sucesso.`,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel quitar a fatura selecionada.',
      })
    } finally {
      setIsPayingInvoice(false)
    }
  }

  const handleReopenInvoice = async () => {
    if (!selectedInvoice || !token) {
      return
    }

    setIsReopeningInvoice(true)
    setStatus({
      type: 'loading',
      message: `Reabrindo a fatura ${selectedInvoice.competencia}...`,
    })

    try {
      await reopenCreditCardInvoice(token, selectedInvoice.id)

      const selectedCardId = invoiceFilters.cartaoCreditoId === 'todos' ? '' : invoiceFilters.cartaoCreditoId
      const [updatedInvoices, updatedExpenses] = await Promise.all([
        getCreditCardInvoices(token, selectedCardId),
        getExpenses(token),
      ])

      setCreditCardInvoices(Array.isArray(updatedInvoices) ? updatedInvoices : [])
      setExpenses(Array.isArray(updatedExpenses?.gastos) ? updatedExpenses.gastos : [])
      setSelectedInvoice(null)
      setInvoiceModalMode(null)
      setStatus({
        type: 'success',
        message: `Fatura ${selectedInvoice.competencia} reaberta com sucesso.`,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel reabrir a fatura selecionada.',
      })
    } finally {
      setIsReopeningInvoice(false)
    }
  }

  const handleUnlinkJointAccount = async () => {
    if (!selectedJointAccount || !token) {
      return
    }

    setIsUnlinkingJointAccount(true)
    setStatus({
      type: 'loading',
      message: `Desvinculando a conta "${selectedJointAccount.nomeConta}"...`,
    })

    try {
      await unlinkJointAccount(token, selectedJointAccount.id)
      const [updatedJointAccounts, updatedExpenses] = await Promise.all([
        getJointAccounts(token),
        getExpenses(token),
      ])

      setJointAccounts(Array.isArray(updatedJointAccounts) ? updatedJointAccounts : [])
      setExpenses(Array.isArray(updatedExpenses.gastos) ? updatedExpenses.gastos : [])
      setSelectedJointAccount(null)
      setJointAccountForm(initialJointAccountForm)
      setStatus({
        type: 'success',
        message: 'Conta compartilhada desvinculada com sucesso. Agora voce pode criar um novo vinculo ativo.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel desvincular a conta conjunta.',
      })
    } finally {
      setIsUnlinkingJointAccount(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!token || !selectedExpense) {
      return
    }

    if (getEffectiveExpenseStatus(selectedExpense) === 'pago') {
      setStatus({
        type: 'error',
        message: 'Nao e possivel excluir um gasto que ja foi pago.',
      })
      setSelectedExpense(null)
      setExpenseModalMode(null)
      return
    }

    setIsDeletingExpense(true)
    setStatus({
      type: 'loading',
      message: `Excluindo o gasto "${selectedExpense.descricao}"...`,
    })

    try {
      const response = await deleteExpense(token, selectedExpense.id)
      setExpenses((current) => current.filter((expense) => expense.id !== selectedExpense.id))
      setStatus({
        type: 'success',
        message: response.message || `Gasto "${selectedExpense.descricao}" excluido com sucesso.`,
      })
      setSelectedExpense(null)
      setExpenseModalMode(null)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel excluir o gasto selecionado.',
      })
    } finally {
      setIsDeletingExpense(false)
    }
  }

  const handleExpenseUpdate = async (event) => {
    event.preventDefault()

    if (!token || !editingExpenseId) {
      return
    }

    const competenceMonth = getCompetenceMonthFromDueDate(expenseForm.dataVencimento) || expenseForm.competencia
    const payload = {
      descricao: expenseForm.descricao,
      tipo: expenseForm.tipo,
      status: expenseForm.status,
      naoCompartilhar: jointAccounts.length > 0 ? expenseForm.naoCompartilhar : false,
      valor: parseCurrencyInput(expenseForm.valor),
      competencia: normalizeCompetenceForPayload(competenceMonth),
      dataVencimento: expenseForm.dataVencimento || null,
      dataFimRecorrencia: expenseForm.origemLancamento === 'recorrente'
        ? (expenseForm.dataFimRecorrencia || null)
        : null,
      observacao: expenseForm.observacao || null,
      ...(expenseForm.categoriaId ? { categoriaId: expenseForm.categoriaId } : {}),
      cartaoCreditoId: expenseForm.cartaoCreditoId || null,
    }

    setIsSavingExpense(true)
    setStatus({
      type: 'loading',
      message: `Salvando alteracoes de "${expenseForm.descricao}"...`,
    })

    try {
      const updatedExpense = await updateExpense(token, editingExpenseId, payload)
      setExpenses((current) => current.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense)))
      setExpenseForm(normalizeExpenseForm(updatedExpense))
      setStatus({
        type: 'success',
        message: `Despesa "${updatedExpense.descricao}" atualizada com sucesso.`,
      })
      navigateTo('/dashboard')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel atualizar a despesa selecionada.',
      })
    } finally {
      setIsSavingExpense(false)
    }
  }

  const persistExpenseCreate = async (payload) => {
    setIsSavingExpense(true)
    setStatus({
      type: 'loading',
      message: `Criando o gasto "${payload.descricao}"...`,
    })

    try {
      const createdExpense = await createExpense(token, payload)
      const updatedInvoices = payload.cartaoCreditoId ? await getCreditCardInvoices(token).catch(() => null) : null
      setExpenses((current) => [createdExpense, ...current])
      if (Array.isArray(updatedInvoices)) {
        setCreditCardInvoices(updatedInvoices)
      }
      setExpenseForm(getInitialExpenseForm())
      setExpenseSuccessMessage(`Novo gasto "${createdExpense.descricao}" criado com sucesso.`)
      setStatus({
        type: 'success',
        message: `Gasto "${createdExpense.descricao}" criado com sucesso.`,
      })
      navigateTo('/dashboard')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel criar o novo gasto.',
      })
    } finally {
      setIsSavingExpense(false)
      setCreditCardLimitWarning(null)
      setPendingExpensePayload(null)
    }
  }

  const handleExpenseCreate = async (event) => {
    event.preventDefault()

    if (!token) {
      return
    }

    if (!expenseForm.dataVencimento) {
      setStatus({
        type: 'error',
        message: 'Informe a data de vencimento para cadastrar o gasto.',
      })
      return
    }

    if (expenseForm.origemLancamento === 'parcelado') {
      const totalInstallments = Number(expenseForm.numeroParcelas)

      if (!Number.isInteger(totalInstallments) || totalInstallments < 2) {
        setStatus({
          type: 'error',
          message: 'Informe um numero de parcelas valido para um lancamento parcelado.',
        })
        return
      }
    }

    const competenceMonth = getCompetenceMonthFromDueDate(expenseForm.dataVencimento) || expenseForm.competencia
    const payload = {
      descricao: expenseForm.descricao,
      tipo: expenseForm.tipo,
      status: expenseForm.status,
      origemLancamento: expenseForm.origemLancamento,
      numeroParcelas: expenseForm.origemLancamento === 'parcelado' ? Number(expenseForm.numeroParcelas) : 1,
      naoCompartilhar: jointAccounts.length > 0 ? expenseForm.naoCompartilhar : false,
      valor: parseCurrencyInput(expenseForm.valor),
      competencia: normalizeCompetenceForPayload(competenceMonth),
      dataVencimento: expenseForm.dataVencimento || null,
      dataFimRecorrencia: expenseForm.origemLancamento === 'recorrente'
        ? (expenseForm.dataFimRecorrencia || null)
        : null,
      observacao: expenseForm.observacao || null,
      categoriaId: expenseForm.categoriaId,
      cartaoCreditoId: expenseForm.cartaoCreditoId || null,
    }

    const limitWarning = await buildCreditCardLimitWarning(payload)

    if (limitWarning) {
      setCreditCardLimitWarning(limitWarning)
      setPendingExpensePayload(payload)
      return
    }

    await persistExpenseCreate(payload)
  }

  const handleContinueAfterLimitWarning = async () => {
    if (!pendingExpensePayload) {
      setCreditCardLimitWarning(null)
      return
    }

    await persistExpenseCreate(pendingExpensePayload)
  }

  const handleCancelLimitWarning = () => {
    setCreditCardLimitWarning(null)
    setPendingExpensePayload(null)
    setStatus({
      type: 'error',
      message: 'Cadastro do gasto cancelado apos alerta de limite do cartao.',
    })
  }

  const handleResetRequest = async (event) => {
    event.preventDefault()
    setIsUpdatingPassword(true)
    setStatus({
      type: 'loading',
      message: 'Preparando o link de redefinicao e enviando para o e-mail informado...',
    })

    try {
      const response = await requestPasswordReset(form.email)
      setStatus({
        type: 'success',
        message: response.message || 'Se o e-mail existir, enviaremos um link para redefinicao.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel solicitar a redefinicao de senha.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <main className={`app-shell ${isDashboardRoute ? 'app-shell-dashboard' : ''}`}>
      {!isDashboardRoute ? (
        <section className="brand-panel">
          <div className="brand-copy">
            <div className="brand-logo-lockup">
              <img src={nossoSaldoLogo} alt="NossoSaldo" className="brand-logo-image" />
              <div className="brand-name-block">
                <strong>NossoSaldo</strong>
                <span>Financas compartilhadas</span>
              </div>
            </div>
            <h1>Seu financeiro compartilhado com clareza, calma e controle.</h1>
            <p className="lead">
              Organize receitas e despesas em um so lugar, acompanhe compromissos do periodo e tenha mais transparencia na gestao financeira compartilhada.
            </p>
          </div>

          <div className="feature-grid">
          <article className="feature-card feature-card-highlight">
            <span className="feature-label">Conta compartilhada</span>
            <strong>Mais alinhamento financeiro entre duas pessoas</strong>
            <p>Centralize receitas, despesas e compromissos em um espaco comum para dividir responsabilidades com mais clareza.</p>
          </article>

            <article className="feature-card">
              <span className="feature-label">Experiencia</span>
              <strong>Responsiva e refinada</strong>
              <p>Visual premium com foco em legibilidade, hierarquia e movimento sutil.</p>
            </article>

            <article className="feature-card">
              <span className="feature-label">Proximo passo</span>
              <strong>Painel autenticado</strong>
              <p>Com o token salvo, a base ja fica pronta para navegar para areas privadas.</p>
            </article>
          </div>
        </section>
      ) : null}

      <section className="login-panel">
        <div className={isDashboardRoute && profile ? 'dashboard-card' : 'login-card'}>
          <div className="login-card-header">
            {isDevelopmentEnvironment ? (
              <span className={`status-pill status-pill-${status.type}`}>{status.type}</span>
            ) : null}
            <h2>
              {isPasswordResetRoute
                ? isRecoveryFlow
                  ? 'Definir nova senha'
                  : 'Solicitar troca de senha'
                : isEmailValidationRoute
                  ? 'Validar email'
                : isRegisterRoute
                  ? 'Criar sua conta'
                : isDashboardRoute && profile
                  ? `Dashboard de ${profile.nome}`
                : profile
                  ? `Bem-vindo, ${profile.nome}`
                  : 'Entrar na plataforma'}
            </h2>
            <p>{status.message}</p>
          </div>

          {isEmailValidationRoute ? (
            <div className="login-form">
              <div className="dashboard-empty-state">
                <strong>{status.type === 'success' ? 'Email confirmado' : 'Confirmacao de email'}</strong>
                <p>{status.message}</p>
              </div>

              <button type="button" className="primary-button" onClick={() => navigateTo('/')}>
                Ir para login
              </button>
            </div>
          ) : isPasswordResetRoute ? (
            isRecoveryFlow ? (
              <form className="login-form" onSubmit={handlePasswordSubmit}>
                <label className="field">
                  <span>Nova senha</span>
                  <input
                    type="password"
                    name="senha"
                    placeholder="Digite sua nova senha"
                    autoComplete="new-password"
                    minLength={6}
                    value={passwordForm.senha}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>

                <label className="field">
                  <span>Confirmar nova senha</span>
                  <input
                    type="password"
                    name="confirmarSenha"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    minLength={6}
                    value={passwordForm.confirmarSenha}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>

                <button type="submit" className="primary-button" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Salvando...' : 'Salvar nova senha'}
                </button>

                <button type="button" className="secondary-button" onClick={() => navigateTo('/')}>
                  Voltar para login
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleResetRequest}>
                <label className="field">
                  <span>E-mail da conta</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="joao@exemplo.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>

                <button type="submit" className="primary-button" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Enviando...' : 'Enviar link por e-mail'}
                </button>

                <button type="button" className="secondary-button" onClick={() => navigateTo('/')}>
                  Voltar para login
                </button>
              </form>
            )
          ) : isRegisterRoute ? (
            <form className="login-form" onSubmit={handleRegisterSubmit}>
              <label className="field">
                <span>Nome</span>
                <input
                  type="text"
                  name="nome"
                  placeholder="Seu nome"
                  autoComplete="name"
                  minLength={2}
                  value={registerForm.nome}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  placeholder="joao@exemplo.com"
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  name="senha"
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={50}
                  value={registerForm.senha}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <label className="field">
                <span>Confirmar senha</span>
                <input
                  type="password"
                  name="confirmarSenha"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={50}
                  value={registerForm.confirmarSenha}
                  onChange={handleRegisterChange}
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={isRegistering}>
                {isRegistering ? 'Criando...' : 'Criar conta'}
              </button>

              <button type="button" className="secondary-button" onClick={() => navigateTo('/')}>
                Voltar para login
              </button>
            </form>
          ) : isDashboardRoute && profile ? (
            <div className="dashboard-layout">
              <div className="dashboard-shell">
                <aside className="dashboard-sidebar">
                  <div className="dashboard-sidebar-brand">
                    <div className="dashboard-logo-lockup">
                      <img src={nossoSaldoLogo} alt="NossoSaldo" className="dashboard-logo-image" />
                      <strong>NossoSaldo</strong>
                    </div>
                    <p>{profile.email}</p>
                  </div>

                  <nav className="dashboard-nav">
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'gastos' || isExpenseEditRoute || isExpenseCreateRoute ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('gastos')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83E\uDDFE'}</span>
                      <span>Lista de gastos</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'cartoes' || dashboardSection === 'faturas' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('cartoes')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83D\uDCB3'}</span>
                      <span>Cartoes de credito</span>
                    </button>
                    {dashboardSection === 'cartoes' || dashboardSection === 'faturas' ? (
                      <div className="dashboard-subnav dashboard-subnav-compact">
                        <button
                          type="button"
                          className={`dashboard-subnav-item ${dashboardSection === 'cartoes' ? 'dashboard-subnav-item-active' : ''}`}
                          onClick={() => {
                            setDashboardSection('cartoes')
                            navigateTo('/dashboard')
                          }}
                        >
                          <span className="dashboard-subnav-dot" />
                          <span className="dashboard-subnav-item-title">Meus cartoes</span>
                        </button>
                        <button
                          type="button"
                          className={`dashboard-subnav-item ${dashboardSection === 'faturas' ? 'dashboard-subnav-item-active' : ''}`}
                          onClick={() => {
                            setDashboardSection('faturas')
                            navigateTo('/dashboard')
                          }}
                        >
                          <span className="dashboard-subnav-dot" />
                          <span className="dashboard-subnav-item-title">Faturas</span>
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'conta-conjunta' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('conta-conjunta')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83E\uDD1D'}</span>
                      <span>Conta Conjunta</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'diagnostico' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('diagnostico')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83D\uDCC8'}</span>
                      <span>Diagnostico</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'relatorios' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('relatorios')
                        setReportSection('evolucao-mensal')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83D\uDCCA'}</span>
                      <span>Relatorios</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'categorias' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('categorias')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\uD83C\uDFF7\uFE0F'}</span>
                      <span>Categorias</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'configuracoes' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('configuracoes')
                        navigateTo('/dashboard')
                      }}
                    >
                      <span className="dashboard-nav-icon">{'\u2699\uFE0F'}</span>
                      <span>Configuracoes</span>
                    </button>
                    {dashboardSection === 'relatorios' ? (
                      <div className="dashboard-subnav">
                        <div className="dashboard-subnav-header">
                          <span className="dashboard-subnav-kicker">Modulo aberto</span>
                          <strong>Analises financeiras</strong>
                          <span className="dashboard-subnav-chevron" aria-hidden="true">
                            ▾
                          </span>
                        </div>
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            className={`dashboard-subnav-item ${reportSection === reportItem.id ? 'dashboard-subnav-item-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="dashboard-subnav-dot" />
                            <span className="dashboard-subnav-item-copy">
                              <span className="dashboard-subnav-item-title">{reportItem.title}</span>
                              <small className="dashboard-subnav-item-description">
                                {reportItem.description}
                              </small>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </nav>

                  <div className="dashboard-sidebar-actions">
                    <button type="button" className="secondary-button" onClick={handleLogout}>
                      Encerrar sessao
                    </button>
                  </div>
                </aside>

                <div className="dashboard-main">
                  <section className="dashboard-hero">
                    <div>
                      <span className="dashboard-kicker">Visao geral</span>
                      <h3>Seja bem-vindo de volta, {profile.nome}.</h3>
                      <p>
                        Hoje e {currentDateLabel}. Abaixo voce acompanha os gastos vinculados ao usuario autenticado.
                      </p>
                    </div>
                  </section>

                  <section className="dashboard-metrics">
                    <article className="metric-card metric-card-revenue">
                      <span className="metric-label">Receitas do periodo</span>
                      <strong>{currencyFormatter.format(filteredRevenueValue)}</strong>
                      <p>Total de entradas dentro dos filtros selecionados.</p>
                    </article>
                    <article className="metric-card metric-card-expense">
                      <span className="metric-label">Despesas do periodo</span>
                      <strong>{currencyFormatter.format(filteredCostValue)}</strong>
                      <p>Total de saidas dentro dos filtros selecionados.</p>
                    </article>
                    <article className="metric-card metric-card-balance">
                      <span className="metric-label">Saldo do periodo</span>
                      <strong>{currencyFormatter.format(filteredBalanceValue)}</strong>
                      <p>Diferenca entre receitas e despesas do periodo filtrado.</p>
                    </article>
                  </section>

                  {dashboardSection === 'diagnostico' ? (
                    <section className={`radar-panel radar-panel-${insightsData?.nivelAtencao || 'baixo'}`}>
                    <div className="dashboard-section-header radar-panel-header">
                      <div>
                        <span className="feature-label">Radar</span>
                        <h4>Diagnostico financeiro do periodo</h4>
                        <p className="radar-panel-summary">
                          {insightsData?.resumo || 'Analise automatica para identificar gargalos nos seus gastos.'}
                        </p>
                      </div>
                      <div className="radar-panel-status">
                        <span className={`radar-status-pill radar-status-pill-${insightsData?.nivelAtencao || 'baixo'}`}>
                          {insightsData?.nivelAtencao || 'baixo'}
                        </span>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setIsInsightsExpanded((current) => !current)}
                        >
                          {isInsightsExpanded ? 'Ocultar detalhes' : 'Ver analise completa'}
                        </button>
                      </div>
                    </div>

                    <form className="radar-filter-form" onSubmit={handleInsightsSubmit}>
                      <div className="radar-preset-group" role="group" aria-label="Periodos sugeridos do Radar">
                        <button
                          type="button"
                          className={`radar-preset-button ${insightsFilters.preset === 'mes-atual' ? 'radar-preset-button-active' : ''}`}
                          onClick={() => handleInsightsPresetSelect('mes-atual')}
                        >
                          Mes atual
                        </button>
                        <button
                          type="button"
                          className={`radar-preset-button ${insightsFilters.preset === 'ultimos-30-dias' ? 'radar-preset-button-active' : ''}`}
                          onClick={() => handleInsightsPresetSelect('ultimos-30-dias')}
                        >
                          Ultimos 30 dias
                        </button>
                        <button
                          type="button"
                          className={`radar-preset-button ${insightsFilters.preset === 'mes-anterior' ? 'radar-preset-button-active' : ''}`}
                          onClick={() => handleInsightsPresetSelect('mes-anterior')}
                        >
                          Mes anterior
                        </button>
                      </div>

                      <label className="field">
                        <span>Data inicial</span>
                        <input type="date" name="dateFrom" value={insightsFilters.dateFrom} onChange={handleInsightsFilterChange} />
                      </label>

                      <label className="field">
                        <span>Data final</span>
                        <input type="date" name="dateTo" value={insightsFilters.dateTo} onChange={handleInsightsFilterChange} />
                      </label>

                      <button type="submit" className="primary-button" disabled={isLoadingInsights}>
                        {isLoadingInsights ? 'Analisando...' : 'Analisar novamente'}
                      </button>
                    </form>

                    {isLoadingInsights ? (
                      <div className="dashboard-empty-state">
                        <strong>Radar em analise...</strong>
                        <p>Estamos cruzando receitas, despesas e gargalos do periodo selecionado.</p>
                      </div>
                    ) : insightsData ? (
                      <>
                        <div className="radar-highlights">
                          <article className="radar-highlight-card">
                            <span className="metric-label">Receita analisada</span>
                            <strong>{currencyFormatter.format(Number(insightsData.indicadores?.totalReceita ?? 0))}</strong>
                          </article>
                          <article className="radar-highlight-card">
                            <span className="metric-label">Despesa analisada</span>
                            <strong>{currencyFormatter.format(Number(insightsData.indicadores?.totalDespesa ?? 0))}</strong>
                          </article>
                          <article className="radar-highlight-card">
                            <span className="metric-label">Uso da receita</span>
                            <strong>{`${Number(insightsData.indicadores?.percentualUsoReceita ?? 0).toFixed(1)}%`}</strong>
                          </article>
                          <article className="radar-highlight-card">
                            <span className="metric-label">Pendencias</span>
                            <strong>{Number(insightsData.indicadores?.quantidadePendentes ?? 0) + Number(insightsData.indicadores?.quantidadeAtrasados ?? 0)}</strong>
                          </article>
                        </div>

                        <div className="radar-body">
                          <div className="radar-column">
                            <span className="feature-label">Gargalos</span>
                            {Array.isArray(insightsData.gargalos) && insightsData.gargalos.length > 0 ? (
                              <div className="radar-list">
                                {insightsData.gargalos.map((gargalo) => (
                                  <article key={gargalo.codigo} className={`radar-item radar-item-${gargalo.severidade}`}>
                                    <div className="radar-item-header">
                                      <strong>{gargalo.titulo}</strong>
                                      <span className={`radar-item-badge radar-item-badge-${gargalo.severidade}`}>{gargalo.severidade}</span>
                                    </div>
                                    <p>{gargalo.descricao}</p>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <div className="dashboard-empty-state radar-empty-state">
                                <strong>Nenhum gargalo relevante.</strong>
                                <p>O Radar nao encontrou pontos criticos no periodo analisado.</p>
                              </div>
                            )}
                          </div>

                          <div className="radar-column">
                            <span className="feature-label">Dicas praticas</span>
                            <div className="radar-tips">
                              {(insightsData.dicas || []).map((dica, index) => (
                                <article key={`${index}-${dica}`} className="radar-tip-card">
                                  <strong>{`Dica ${index + 1}`}</strong>
                                  <p>{dica}</p>
                                </article>
                              ))}
                            </div>
                          </div>
                        </div>

                        {isInsightsExpanded ? (
                          <div className="radar-expanded-grid">
                            <article className="dashboard-panel-card radar-detail-card">
                              <span className="feature-label">Comparativo</span>
                              <strong>{`${Number(insightsData.indicadores?.variacaoDespesas ?? 0).toFixed(1)}%`}</strong>
                              <p>Variacao das despesas contra o periodo anterior equivalente.</p>
                            </article>
                            <article className="dashboard-panel-card radar-detail-card">
                              <span className="feature-label">Saldo</span>
                              <strong>{currencyFormatter.format(Number(insightsData.indicadores?.saldo ?? 0))}</strong>
                              <p>Resultado entre receitas e despesas dentro do periodo analisado.</p>
                            </article>
                            <article className="dashboard-panel-card radar-detail-card radar-detail-card-wide">
                              <span className="feature-label">Top categorias</span>
                              {Array.isArray(insightsData.topCategorias) && insightsData.topCategorias.length > 0 ? (
                                <div className="radar-top-categories">
                                  {insightsData.topCategorias.map((categoria) => (
                                    <div key={categoria.categoria} className="radar-top-category-row">
                                      <strong>{categoria.categoria}</strong>
                                      <span>{currencyFormatter.format(Number(categoria.totalGasto ?? 0))}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>Nao houve categorias com despesas suficientes para destacar.</p>
                              )}
                            </article>
                          </div>
                        ) : null}

                        <div className="radar-actions">
                          {insightsActions.map((action, index) => (
                            <button
                              key={`${action.tipo}-${action.label || index}`}
                              type="button"
                              className="secondary-button"
                              onClick={() => handleInsightsAction(action)}
                            >
                              {action.label || 'Abrir detalhe'}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : null}
                    </section>
                  ) : null}

                  {isExpenseEditRoute || isExpenseCreateRoute ? (
                    <section className="dashboard-expenses">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">{isExpenseCreateRoute ? 'Cadastro' : 'Edicao'}</span>
                          <h4>{isExpenseCreateRoute ? 'Criar novo gasto' : 'Editar despesa'}</h4>
                        </div>
                      </div>

                      {isLoadingExpenseDetails ? (
                        <div className="dashboard-empty-state">
                          <strong>{isExpenseCreateRoute ? 'Preparando formulario...' : 'Carregando despesa...'}</strong>
                          <p>{isExpenseCreateRoute ? 'Aguarde enquanto buscamos as dependencias do cadastro.' : 'Aguarde enquanto buscamos os dados para edicao.'}</p>
                        </div>
                      ) : (
                        <form className="expense-edit-form" onSubmit={isExpenseCreateRoute ? handleExpenseCreate : handleExpenseUpdate}>
                          <div className="expense-edit-grid">
                            <label className="field">
                              <span>Descricao</span>
                              <input type="text" name="descricao" value={expenseForm.descricao} onChange={handleExpenseFormChange} required />
                            </label>

                            <label className="field">
                              <span>Valor</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                name="valor"
                                placeholder="0,00"
                                value={expenseForm.valor}
                                onChange={handleExpenseFormChange}
                                required
                              />
                            </label>

                            <label className="field">
                              <span>Tipo</span>
                              <select name="tipo" value={expenseForm.tipo} onChange={handleExpenseFormChange}>
                                <option value="despesa">Despesa</option>
                                <option value="receita">Receita</option>
                              </select>
                            </label>

                            <label className="field">
                              <span>Status</span>
                              <select name="status" value={expenseForm.status} onChange={handleExpenseFormChange}>
                                <option value="pendente">Pendente</option>
                                <option value="pago">Pago</option>
                                <option value="atrasado">Atrasado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </label>

                            {jointAccounts.length > 0 ? (
                              <label className="share-toggle-field">
                                <input
                                  type="checkbox"
                                  name="naoCompartilhar"
                                  checked={expenseForm.naoCompartilhar}
                                  onChange={handleExpenseFormChange}
                                />
                                <span>
                                  <strong>Nao compartilhar este gasto</strong>
                                  <small>Marque para manter este registro somente na sua conta.</small>
                                </span>
                              </label>
                            ) : null}

                            {isExpenseCreateRoute ? (
                              <label className="field">
                                <span>Forma de lancamento</span>
                                <select
                                  name="origemLancamento"
                                  value={expenseForm.origemLancamento}
                                  onChange={handleExpenseFormChange}
                                >
                                  <option value="unico">Pagamento unico</option>
                                  <option value="recorrente">Recorrente</option>
                                  <option value="parcelado">Parcelado</option>
                                </select>
                              </label>
                            ) : null}

                            {isExpenseCreateRoute && expenseForm.origemLancamento === 'parcelado' ? (
                              <label className="field">
                                <span>Quantidade de parcelas</span>
                                <input
                                  type="number"
                                  min="2"
                                  step="1"
                                  name="numeroParcelas"
                                  value={expenseForm.numeroParcelas}
                                  onChange={handleExpenseFormChange}
                                  required
                                />
                              </label>
                            ) : null}

                            {expenseForm.origemLancamento === 'recorrente' ? (
                              <label className="field">
                                <span>Data final da recorrencia</span>
                                <input
                                  type="date"
                                  name="dataFimRecorrencia"
                                  value={expenseForm.dataFimRecorrencia}
                                  onChange={handleExpenseFormChange}
                                />
                                <small>Se informada, vamos criar automaticamente um registro por mes ate essa data.</small>
                              </label>
                            ) : null}

                            <label className="field">
                              <span>Categoria</span>
                              <select
                                name="categoriaId"
                                value={expenseForm.categoriaId}
                                onChange={handleExpenseFormChange}
                                required={isExpenseCreateRoute}
                              >
                                <option value="">Selecione uma categoria</option>
                                {sortedCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {`${getCategoryDisplayIcon(category)} ${category.descricao}`}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="field">
                              <span>Cartao de credito</span>
                              <select
                                name="cartaoCreditoId"
                                value={expenseForm.cartaoCreditoId}
                                onChange={handleExpenseFormChange}
                              >
                                <option value="">Sem cartao vinculado</option>
                                {creditCards.map((card) => {
                                  const isSharedCard = card.origemCartao === 'conta_conjunta'
                                  const ownerLabel = isSharedCard
                                    ? `Conta conjunta - ${card.usuarioNome || 'usuario compartilhado'}`
                                    : 'Meu cartao'

                                  return (
                                    <option key={card.id} value={card.id}>
                                      {`${card.descricao} | ${ownerLabel}`}
                                    </option>
                                  )
                                })}
                              </select>
                              <small>
                                {creditCards.length > 0
                                  ? 'Voce pode vincular cartoes seus ou da conta conjunta ativa.'
                                  : 'Nenhum cartao cadastrado para voce ou para a conta conjunta ativa.'}
                              </small>
                            </label>

                            <label className="field">
                              <span>Competencia</span>
                              <input type="month" name="competencia" value={expenseForm.competencia} onChange={handleExpenseFormChange} />
                            </label>

                            <label className="field">
                              <span>Vencimento</span>
                              <input
                                type="date"
                                name="dataVencimento"
                                value={expenseForm.dataVencimento}
                                onChange={handleExpenseFormChange}
                                required={isExpenseCreateRoute}
                              />
                            </label>
                          </div>

                          <label className="field">
                            <span>Observacao</span>
                            <textarea
                              name="observacao"
                              rows="4"
                              value={expenseForm.observacao}
                              onChange={handleExpenseFormChange}
                              placeholder="Adicione um contexto rapido sobre esta despesa."
                            />
                          </label>

                          <div className="expense-edit-actions">
                            <button type="button" className="secondary-button" onClick={() => navigateTo('/dashboard')}>
                              Voltar para lista
                            </button>
                            <button type="submit" className="primary-button" disabled={isSavingExpense}>
                              {isSavingExpense ? 'Salvando...' : isExpenseCreateRoute ? 'Criar gasto' : 'Salvar alteracoes'}
                            </button>
                          </div>
                        </form>
                      )}
                    </section>
                  ) : dashboardSection === 'gastos' ? (
                    <section className="dashboard-expenses">
                      <div className="expense-topbar">
                        <div className="expense-topbar-title">
                          <span className="feature-label">Conteudo inicial</span>
                          <h4>Lista de gastos</h4>
                        </div>
                        <div className="expense-period-nav">
                          <span className="feature-label">Periodo em foco</span>
                          <div className="expense-period-nav-toolbar">
                            <button
                              type="button"
                              className="secondary-button expense-period-nav-icon-button"
                              onClick={() => handleExpenseMonthNavigation(-1)}
                              aria-label="Ir para o mes anterior"
                            >
                              {'\u2039'}
                            </button>
                            <strong className="expense-period-nav-label">{expenseFilterMonthLabel}</strong>
                            <button
                              type="button"
                              className="secondary-button expense-period-nav-icon-button"
                              onClick={() => handleExpenseMonthNavigation(1)}
                              aria-label="Ir para o proximo mes"
                            >
                              {'\u203A'}
                            </button>
                            <button
                              type="button"
                              className="secondary-button expense-period-nav-today-button"
                              onClick={handleResetExpenseMonthNavigation}
                            >
                              Atual
                            </button>
                          </div>
                        </div>
                        <button type="button" className="primary-button expense-period-nav-create-button" onClick={navigateToExpenseCreate}>
                          Novo Registro
                        </button>
                      </div>






                      <div className="expense-filters">
                        <label className="field">
                          <span>Data inicial</span>
                          <input
                            type="date"
                            name="dateFrom"
                            value={expenseFilters.dateFrom}
                            onChange={handleExpenseFilterChange}
                          />
                        </label>

                        <label className="field">
                          <span>Data final</span>
                          <input
                            type="date"
                            name="dateTo"
                            value={expenseFilters.dateTo}
                            onChange={handleExpenseFilterChange}
                          />
                        </label>

                        <label className="field">
                          <span>Status</span>
                          <select
                            name="status"
                            value={expenseFilters.status}
                            onChange={handleExpenseFilterChange}
                          >
                            <option value="abertos">Pendentes e atrasados</option>
                            <option value="todos">Todos</option>
                            <option value="pendente">Pendente</option>
                            <option value="pago">Pago</option>
                            <option value="atrasado">Atrasado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </label>

                        <label className="field">
                          <span>Tipo</span>
                          <select
                            name="tipo"
                            value={expenseFilters.tipo}
                            onChange={handleExpenseFilterChange}
                          >
                            <option value="todos">Todos</option>
                            <option value="despesa">Despesa</option>
                            <option value="receita">Receita</option>
                          </select>
                        </label>

                        <label className="field">
                          <span>Cartao de credito</span>
                          <select
                            name="cartaoCreditoId"
                            value={expenseFilters.cartaoCreditoId}
                            onChange={handleExpenseFilterChange}
                          >
                            <option value="todos">Todos os cartoes</option>
                            <option value="sem-cartao">Sem cartao vinculado</option>
                            {creditCards.map((card) => {
                              const isSharedCard = card.origemCartao === 'conta_conjunta'
                              const ownerLabel = isSharedCard
                                ? `Conta conjunta - ${card.usuarioNome || 'usuario compartilhado'}`
                                : 'Meu cartao'

                              return (
                                <option key={card.id} value={card.id}>
                                  {`${card.descricao} | ${ownerLabel}`}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                      </div>

                      {expenseSuccessMessage ? (
                        <div className="success-inline-banner">
                          <strong>Cadastro concluido.</strong> {expenseSuccessMessage}
                        </div>
                      ) : null}

                      {isLoadingExpenses ? (
                        <div className="dashboard-empty-state">
                          <strong>Carregando gastos...</strong>
                          <p>Aguarde enquanto buscamos os registros do usuario logado.</p>
                        </div>
                      ) : filteredExpenses.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <strong>Nenhum gasto encontrado no periodo</strong>
                          <p>O filtro considera o vencimento do gasto e tambem o vencimento das parcelas vinculadas.</p>
                        </div>
                      ) : (
                        <div className="expense-tree">
                          {groupedExpensesList.map((group) => {
                            const isExpanded = expandedCategoryIds[group.id] !== false

                            return (
                              <section key={group.id} className="expense-group">
                                <button
                                  type="button"
                                  className="expense-group-header"
                                  onClick={() => toggleCategoryGroup(group.id)}
                                >
                                  <div className="expense-group-heading">
                                    <span className="expense-group-toggle" aria-hidden="true">
                                      {isExpanded ? '▾' : '▸'}
                                    </span>
                                    <span className="expense-group-icon">{group.icon}</span>
                                    <div>
                                      <strong>{group.name}</strong>
                                      <p>{group.expenses.length} registro(s)</p>
                                    </div>
                                  </div>
                                  <span className="expense-group-total">
                                    {currencyFormatter.format(group.total)}
                                  </span>
                                </button>

                                {isExpanded ? (
                                  <div className="expense-list">
                                    {group.expenses.map((expense) => {
                                      const effectiveStatus = getEffectiveExpenseStatus(expense)
                                      const installments = Array.isArray(expense.lancamentosBase)
                                        ? expense.lancamentosBase
                                        : []
                                      const hasInstallments = expense.origemLancamento === 'parcelado' && installments.length > 0
                                      const canManageExpense = expense.responsavelId === profile.id
                                      const isCreditCardExpense = Boolean(expense.cartaoCreditoId)
                                      const expenseOwnerLabel = canManageExpense
                                        ? 'Responsavel: voce'
                                        : `Responsavel: ${expense.responsavelNome || 'usuario compartilhado'}`
                                      const canEditExpense = canManageExpense && effectiveStatus !== 'pago'
                                      const canDeleteExpense = canManageExpense && effectiveStatus !== 'pago'
                                      const canPayExpense = canManageExpense
                                        && !isCreditCardExpense
                                        && effectiveStatus !== 'pago'
                                        && areAllInstallmentsPaid(expense)
                                      const canReopenExpense = canManageExpense
                                        && !isCreditCardExpense
                                        && effectiveStatus === 'pago'
                                      const isInstallmentsExpanded = Boolean(expandedInstallmentIds[expense.id])

                                      return (
                                        <article key={expense.id} className="expense-card">
                                          <div
                                            className={`expense-card-clickable${canEditExpense ? '' : ' expense-card-clickable-disabled'}`}
                                            onClick={
                                              canEditExpense
                                                ? () => navigateToExpenseEdit(expense.id)
                                                : undefined
                                            }
                                            title={
                                              canEditExpense
                                                ? 'Editar gasto'
                                                : effectiveStatus === 'pago'
                                                  ? 'Gastos quitados nao podem ser editados.'
                                                  : 'Somente o responsavel pelo gasto pode editar este registro.'
                                            }
                                          >
                                            <div className="expense-card-main">
                                              <div className="expense-card-primary">
                                                <div className="expense-card-badges">
                                                  <span className={`expense-badge expense-badge-${expense.tipo}`}>{expense.tipo}</span>
                                                  {effectiveStatus === 'pago' ? (
                                                  <span className="expense-paid-label">Quitado</span>
                                                  ) : effectiveStatus === 'atrasado' ? (
                                                    <span className="expense-overdue-label">Atrasado</span>
                                                  ) : (
                                                    <span className="expense-pending-label">Pendente</span>
                                                  )}
                                                </div>
                                                <h5>{expense.descricao}</h5>
                                                <p className="expense-card-subtitle">
                                                  {expense.competencia
                                                    ? `Competencia ${formatCompetenceDisplay(expense.competencia)}`
                                                    : 'Sem competencia informada'}
                                                </p>
                                              </div>
                                              <div className="expense-card-side">
                                                <div className="expense-card-amount-block">
                                                  <strong>{currencyFormatter.format(Number(expense.valor ?? 0))}</strong>
                                                  <span className="expense-card-status-text">Status: {effectiveStatus}</span>
                                                </div>
                                                <div className="expense-card-actions">
                                                  {canPayExpense ? (
                                                    <button
                                                      type="button"
                                                      className="pay-expense-button"
                                                      onClick={(event) => {
                                                        event.stopPropagation()
                                                        openPayExpenseModal(expense)
                                                      }}
                                                    >
                                                      Quitar
                                                    </button>
                                                  ) : null}
                                                  {canReopenExpense ? (
                                                    <button
                                                      type="button"
                                                      className="pay-expense-button"
                                                      onClick={(event) => {
                                                        event.stopPropagation()
                                                        openReopenExpenseModal(expense)
                                                      }}
                                                    >
                                                      Reabrir
                                                    </button>
                                                  ) : null}
                                                  {canDeleteExpense ? (
                                                    <button
                                                      type="button"
                                                      className="delete-expense-button"
                                                      onClick={(event) => {
                                                        event.stopPropagation()
                                                        openDeleteExpenseModal(expense)
                                                      }}
                                                    >
                                                      Excluir
                                                    </button>
                                                  ) : null}
                                                  {hasInstallments ? (
                                                    <button
                                                      type="button"
                                                      className="installment-toggle-button"
                                                      onClick={(event) => {
                                                        event.stopPropagation()
                                                        toggleExpenseInstallments(expense.id)
                                                      }}
                                                      aria-label={isInstallmentsExpanded ? 'Ocultar parcelas' : 'Exibir parcelas'}
                                                      title={isInstallmentsExpanded ? 'Ocultar parcelas' : 'Exibir parcelas'}
                                                    >
                                                      {isInstallmentsExpanded ? '-' : '+'}
                                                    </button>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="expense-card-meta">
                                              <span>
                                                Origem {expense.origemLancamento}
                                                {expense.origemLancamento === 'parcelado' && expense.numeroParcelas
                                                  ? ` - ${expense.numeroParcelas} parcelas`
                                                  : ''}
                                              </span>
                                              {expense.cartaoCreditoId ? (
                                                <span>
                                                  Cartao: {expense.cartaoCreditoDescricao || 'Cartao vinculado'}
                                                  {expense.cartaoCreditoUsuarioNome
                                                    ? ` (${expense.cartaoCreditoUsuarioNome})`
                                                    : ''}
                                                </span>
                                              ) : null}
                                              {isCreditCardExpense ? (
                                                <span>Quitacao disponivel somente pela tela de faturas</span>
                                              ) : null}
                                              <span>{expenseOwnerLabel}</span>
                                              {!canManageExpense ? (
                                                <span>Edicao bloqueada para gastos do usuario compartilhado</span>
                                              ) : null}
                                              <span>
                                                {expense.dataVencimento
                                                  ? `Vencimento ${dateFormatter.format(new Date(expense.dataVencimento))}`
                                                  : 'Sem vencimento informado'}
                                              </span>
                                              {expense.dataPagamento ? (
                                                <span>Pagamento {dateFormatter.format(new Date(expense.dataPagamento))}</span>
                                              ) : null}
                                              <span>
                                                {expense.createdAt
                                                  ? `Criado em ${dateFormatter.format(new Date(expense.createdAt))}`
                                                  : 'Data de criacao indisponivel'}
                                              </span>
                                            </div>
                                          </div>
                                          {hasInstallments && isInstallmentsExpanded ? (
                                            <div className="installment-list">
                                              {installments.map((installment) => (
                                                <button
                                                  key={installment.id}
                                                  type="button"
                                                  className={`installment-row ${installment.status === 'pago' ? 'installment-row-paid' : ''}`}
                                                  onClick={() => {
                                                    if (isCreditCardExpense) {
                                                      return
                                                    }
                                                    openPayInstallmentModal(expense, installment)
                                                  }}
                                                  disabled={installment.status === 'pago' || !canManageExpense || isCreditCardExpense}
                                                >
                                                  <span className="installment-number">
                                                    Parcela {installment.numeroParcela}/{expense.numeroParcelas}
                                                  </span>
                                                  <span>{currencyFormatter.format(Number(installment.valorParcela ?? 0))}</span>
                                                  <span>
                                                    {installment.dataVencimentoParcela
                                                      ? `Vencimento ${dateFormatter.format(new Date(installment.dataVencimentoParcela))}`
                                                      : 'Sem vencimento'}
                                                  </span>
                                                  <span>
                                                    {installment.competencia
                                                      ? `Competencia ${formatCompetenceDisplay(installment.competencia)}`
                                                      : 'Sem competencia'}
                                                  </span>
                                                  <span className={`installment-status ${installment.status === 'pago' ? 'installment-status-paid' : ''}`}>
                                                    {installment.status === 'pago' ? 'Pago' : installment.status}
                                                  </span>
                                                </button>
                                              ))}
                                            </div>
                                          ) : null}
                                        </article>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </section>
                            )
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'relatorios' && reportSection === 'evolucao-mensal' ? (
                    <section className="dashboard-expenses report-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Relatorios / Evolucao mensal</span>
                          <h4>Evolucao mensal de gastos</h4>
                        </div>
                        <span className="report-period-pill">{monthlyReportPeriodLabel}</span>
                      </div>

                      <div className="report-tabs" role="tablist" aria-label="Tipos de relatorio">
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            role="tab"
                            aria-selected={reportSection === reportItem.id}
                            className={`report-tab ${reportSection === reportItem.id ? 'report-tab-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="report-tab-title">{reportItem.title}</span>
                            <small className="report-tab-description">{reportItem.description}</small>
                          </button>
                        ))}
                      </div>

                      <form className="report-filter-form" onSubmit={handleMonthlyReportSubmit}>
                        <label className="field">
                          <span>Data inicial</span>
                          <input
                            type="date"
                            name="dateFrom"
                            value={monthlyReportFilters.dateFrom}
                            onChange={handleMonthlyReportFilterChange}
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Data final</span>
                          <input
                            type="date"
                            name="dateTo"
                            value={monthlyReportFilters.dateTo}
                            onChange={handleMonthlyReportFilterChange}
                            required
                          />
                        </label>

                        <button type="submit" className="primary-button" disabled={isLoadingMonthlyReport}>
                          {isLoadingMonthlyReport ? 'Gerando...' : 'Gerar relatorio'}
                        </button>
                      </form>

                      <div className="report-intro-card">
                        <div>
                          <strong>Como seus gastos variam ao longo do tempo</strong>
                          <p>
                            Este relatorio ajuda a identificar aumento de custo de vida, meses fora da curva
                            e cria uma base simples para previsoes futuras.
                          </p>
                        </div>
                        <span className="report-insight-badge">
                          {monthlyReportVariation >= 0 ? '+' : ''}
                          {monthlyReportVariation.toFixed(1).replace('.', ',')}%
                          <small>variacao do primeiro para o ultimo mes</small>
                        </span>
                      </div>

                      {isLoadingMonthlyReport ? (
                        <div className="dashboard-empty-state">
                          <strong>Gerando relatorio...</strong>
                          <p>Aguarde enquanto consolidamos a evolucao mensal do periodo informado.</p>
                        </div>
                      ) : monthlyReportItems.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <strong>Nenhum dado encontrado para o periodo.</strong>
                          <p>Escolha outro intervalo para visualizar a evolucao mensal do usuario logado.</p>
                        </div>
                      ) : (
                        <>
                          <div className="report-metrics-grid">
                            <article className="metric-card metric-card-expense">
                              <span className="metric-label">Total no periodo</span>
                              <strong>{currencyFormatter.format(monthlyReportTotal)}</strong>
                              <p>Soma consolidada dos meses retornados pela API.</p>
                            </article>
                            <article className="metric-card metric-card-balance">
                              <span className="metric-label">Media mensal</span>
                              <strong>{currencyFormatter.format(monthlyReportAverage)}</strong>
                              <p>Valor medio do periodo informado para apoiar sua leitura de tendencia.</p>
                            </article>
                            <article className="metric-card metric-card-strong">
                              <span className="metric-label">Maior mes</span>
                              <strong>{currencyFormatter.format(monthlyReportMax)}</strong>
                              <p>
                                {highestMonthlyReportItem
                                  ? `Pico registrado em ${formatMonthlyReference(highestMonthlyReportItem.referencia)}.`
                                  : 'Sem destaque no periodo.'}
                              </p>
                            </article>
                          </div>

                          <div className="monthly-report-card">
                            <div
                              className="monthly-report-grid"
                              style={{ gridTemplateColumns: `repeat(${monthlyReportItems.length}, minmax(0, 1fr))` }}
                            >
                              {monthlyReportItems.map((item) => {
                                const totalValue = Number(item.total ?? item.total_gasto ?? 0)
                                const barHeight = monthlyReportMax > 0
                                  ? Math.max(18, Math.round((totalValue / monthlyReportMax) * 100))
                                  : 18

                                return (
                                  <article key={item.referencia} className="monthly-report-bar-item">
                                    <div className="monthly-report-value">
                                      {currencyFormatter.format(totalValue)}
                                    </div>
                                    <div className="monthly-report-bar-track">
                                      <span
                                        className="monthly-report-bar"
                                        style={{ height: `${barHeight}%` }}
                                        aria-label={`${item.referencia}: ${currencyFormatter.format(totalValue)}`}
                                      />
                                    </div>
                                    <strong>{formatMonthlyReference(item.referencia)}</strong>
                                    <span>{item.referencia}</span>
                                  </article>
                                )
                              })}
                            </div>
                          </div>

                          <div className="report-notes-grid">
                            <article>
                              <span className="feature-label">Leitura</span>
                              <strong>Compare os meses com maior concentracao de gastos</strong>
                              <p>
                                Use a barra mensal para identificar meses fora da curva e cruzar depois com categorias
                                e gastos recorrentes.
                              </p>
                            </article>
                            <article>
                              <span className="feature-label">Valor</span>
                              <strong>Periodo definido pelo usuario</strong>
                              <p>
                                O relatorio considera somente o intervalo informado acima, sempre com base no usuario
                                logado.
                              </p>
                            </article>
                          </div>
                        </>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'relatorios' && reportSection === 'comparativo-mensal' ? (
                    <section className="dashboard-expenses report-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Relatorios / Comparativo mensal</span>
                          <h4>Comparativo entre mes atual e mes anterior</h4>
                        </div>
                      </div>

                      <div className="report-tabs" role="tablist" aria-label="Tipos de relatorio">
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            role="tab"
                            aria-selected={reportSection === reportItem.id}
                            className={`report-tab ${reportSection === reportItem.id ? 'report-tab-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="report-tab-title">{reportItem.title}</span>
                            <small className="report-tab-description">{reportItem.description}</small>
                          </button>
                        ))}
                      </div>

                      <form className="report-filter-form report-filter-form-comparison" onSubmit={handleComparisonReportSubmit}>
                        <label className="field">
                          <span>Mes atual</span>
                          <input
                            type="month"
                            name="currentMonth"
                            value={comparisonReportFilters.currentMonth}
                            onChange={handleComparisonReportFilterChange}
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Mes anterior</span>
                          <input
                            type="month"
                            name="previousMonth"
                            value={comparisonReportFilters.previousMonth}
                            onChange={handleComparisonReportFilterChange}
                            required
                          />
                        </label>

                        <button type="submit" className="primary-button" disabled={isLoadingComparisonReport}>
                          {isLoadingComparisonReport ? 'Gerando...' : 'Comparar meses'}
                        </button>
                      </form>

                      {isLoadingComparisonReport ? (
                        <div className="dashboard-empty-state">
                          <strong>Gerando comparativo...</strong>
                          <p>Aguarde enquanto consolidamos os totais dos dois meses selecionados.</p>
                        </div>
                      ) : comparisonReport ? (
                        <>
                          <div className="report-metrics-grid comparison-metrics-grid">
                            <article className="metric-card metric-card-expense">
                              <span className="metric-label">Mes atual</span>
                              <strong>{currencyFormatter.format(comparisonReport.mesAtual)}</strong>
                              <p>Total de despesas do mes atual selecionado.</p>
                            </article>
                            <article className="metric-card metric-card-balance">
                              <span className="metric-label">Mes anterior</span>
                              <strong>{currencyFormatter.format(comparisonReport.mesAnterior)}</strong>
                              <p>Total de despesas do mes anterior selecionado.</p>
                            </article>
                            <article className="metric-card metric-card-strong">
                              <span className="metric-label">Variacao</span>
                              <strong>{comparisonReport.variacao}</strong>
                              <p>Diferenca percentual do mes atual em relacao ao mes anterior.</p>
                            </article>
                          </div>

                          <div className="report-intro-card comparison-highlight-card">
                            <div>
                              <strong>Leitura rapida do comparativo</strong>
                              <p>
                                Use esse resumo para identificar se o nivel de gasto subiu ou caiu de um mes para o outro
                                e priorizar onde investigar.
                              </p>
                            </div>
                            <span className="report-insight-badge">
                              {comparisonReport.variacao}
                              <small>variacao do periodo</small>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="dashboard-empty-state">
                          <strong>Nenhum comparativo carregado.</strong>
                          <p>Escolha os meses desejados para visualizar o resumo comparativo.</p>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'relatorios' && reportSection === 'top-categorias' ? (
                    <section className="dashboard-expenses report-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Relatorios / Top categorias</span>
                          <h4>Categorias com maior peso no periodo</h4>
                        </div>
                      </div>

                      <div className="report-tabs" role="tablist" aria-label="Tipos de relatorio">
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            role="tab"
                            aria-selected={reportSection === reportItem.id}
                            className={`report-tab ${reportSection === reportItem.id ? 'report-tab-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="report-tab-title">{reportItem.title}</span>
                            <small className="report-tab-description">{reportItem.description}</small>
                          </button>
                        ))}
                      </div>

                      <form className="report-filter-form" onSubmit={handleTopCategoryReportSubmit}>
                        <label className="field">
                          <span>Data inicial</span>
                          <input
                            type="date"
                            name="dateFrom"
                            value={topCategoryFilters.dateFrom}
                            onChange={handleTopCategoryFilterChange}
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Data final</span>
                          <input
                            type="date"
                            name="dateTo"
                            value={topCategoryFilters.dateTo}
                            onChange={handleTopCategoryFilterChange}
                            required
                          />
                        </label>

                        <button type="submit" className="primary-button" disabled={isLoadingTopCategoryReport}>
                          {isLoadingTopCategoryReport ? 'Gerando...' : 'Gerar ranking'}
                        </button>
                      </form>

                      {isLoadingTopCategoryReport ? (
                        <div className="dashboard-empty-state">
                          <strong>Gerando top categorias...</strong>
                          <p>Aguarde enquanto calculamos as categorias com maior concentracao de gasto.</p>
                        </div>
                      ) : topCategoryItems.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <strong>Nenhuma categoria encontrada para o periodo.</strong>
                          <p>Escolha outro intervalo para montar o ranking de categorias.</p>
                        </div>
                      ) : (
                        <>
                          <div className="report-intro-card">
                            <div>
                              <strong>Onde seu dinheiro mais se concentra</strong>
                              <p>
                                Esse ranking destaca as categorias que mais consomem o seu orçamento no intervalo
                                selecionado.
                              </p>
                            </div>
                            <span className="report-insight-badge">
                              {topCategoryItems.length}
                              <small>categorias no ranking</small>
                            </span>
                          </div>

                          <div className="top-category-list">
                            {topCategoryItems.map((item, index) => {
                              const maxValue = Math.max(...topCategoryItems.map((entry) => entry.total), 1)
                              const barWidth = Math.max(8, Math.round((item.total / maxValue) * 100))
                              const isExpanded = Boolean(expandedTopCategoryNames[item.categoria])
                              const categoryExpenses = getTopCategoryExpenseItems(item.categoria)

                              return (
                                <article key={`${item.categoria}-${index}`} className="top-category-item">
                                  <div className="top-category-item-header">
                                    <div>
                                      <span className="top-category-rank">#{index + 1}</span>
                                      <strong>{item.categoria}</strong>
                                    </div>
                                    <div className="top-category-item-actions">
                                      <span className="top-category-value">
                                        {currencyFormatter.format(item.total)}
                                      </span>
                                      <button
                                        type="button"
                                        className="top-category-expand-button"
                                        onClick={() => toggleTopCategoryDetails(item.categoria)}
                                        aria-expanded={isExpanded}
                                        aria-label={isExpanded ? `Ocultar gastos de ${item.categoria}` : `Exibir gastos de ${item.categoria}`}
                                        title={isExpanded ? 'Ocultar detalhes' : 'Exibir detalhes'}
                                      >
                                        {isExpanded ? '-' : '+'}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="top-category-bar-track">
                                    <span className="top-category-bar" style={{ width: `${barWidth}%` }} />
                                  </div>
                                  {isExpanded ? (
                                    <div className="top-category-expense-list">
                                      {categoryExpenses.length > 0 ? categoryExpenses.map((expense) => (
                                        <div key={expense.id} className="top-category-expense-row">
                                          <div>
                                            <strong>{expense.descricao}</strong>
                                            <span>
                                              {expense.competencia
                                                ? `Competencia ${formatCompetenceDisplay(expense.competencia)}`
                                                : 'Sem competencia'}
                                            </span>
                                          </div>
                                          <span className="top-category-expense-value">
                                            {currencyFormatter.format(Number(expense.valor ?? 0))}
                                          </span>
                                        </div>
                                      )) : (
                                        <div className="top-category-expense-empty">
                                          Nenhum gasto detalhado encontrado nessa categoria para o periodo.
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </article>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'relatorios' && reportSection === 'quem-gasta-mais' ? (
                    <section className="dashboard-expenses report-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Relatorios / Quem gasta mais</span>
                          <h4>Ranking entre usuarios da conta conjunta</h4>
                        </div>
                      </div>

                      <div className="report-tabs" role="tablist" aria-label="Tipos de relatorio">
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            role="tab"
                            aria-selected={reportSection === reportItem.id}
                            className={`report-tab ${reportSection === reportItem.id ? 'report-tab-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="report-tab-title">{reportItem.title}</span>
                            <small className="report-tab-description">{reportItem.description}</small>
                          </button>
                        ))}
                      </div>

                      <form className="report-filter-form" onSubmit={handleWhoSpendsMoreReportSubmit}>
                        <label className="field">
                          <span>Data inicial</span>
                          <input
                            type="date"
                            name="dateFrom"
                            value={whoSpendsMoreFilters.dateFrom}
                            onChange={handleWhoSpendsMoreFilterChange}
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Data final</span>
                          <input
                            type="date"
                            name="dateTo"
                            value={whoSpendsMoreFilters.dateTo}
                            onChange={handleWhoSpendsMoreFilterChange}
                            required
                          />
                        </label>

                        <button type="submit" className="primary-button" disabled={isLoadingWhoSpendsMoreReport}>
                          {isLoadingWhoSpendsMoreReport ? 'Gerando...' : 'Gerar ranking'}
                        </button>
                      </form>

                      {isLoadingWhoSpendsMoreReport ? (
                        <div className="dashboard-empty-state">
                          <strong>Gerando ranking...</strong>
                          <p>Aguarde enquanto consolidamos os gastos dos dois usuarios da conta conjunta.</p>
                        </div>
                      ) : whoSpendsMoreReport?.usuario1 && whoSpendsMoreReport?.usuario2 ? (
                        <>
                          <div className="report-intro-card">
                            <div>
                              <strong>Quem puxou mais o gasto do periodo</strong>
                              <p>
                                O painel compara os dois usuarios da conta conjunta e mostra a participacao percentual
                                de cada um no total de despesas visiveis para o intervalo selecionado.
                              </p>
                            </div>
                            <span className="report-insight-badge">
                              {whoSpendsMoreReport.usuario1.percentual}%
                              <small>lider do ranking</small>
                            </span>
                          </div>

                          <div className="who-spends-more-grid">
                            {[whoSpendsMoreReport.usuario1, whoSpendsMoreReport.usuario2].map((usuario, index) => (
                              <article
                                key={`${usuario.nome}-${index}`}
                                className={`who-spends-more-card ${index === 0 ? 'who-spends-more-card-leading' : ''}`}
                              >
                                <span className="feature-label">{index === 0 ? 'Maior gasto' : 'Segundo lugar'}</span>
                                <strong>{usuario.nome}</strong>
                                <div className="who-spends-more-value">
                                  {currencyFormatter.format(Number(usuario.total ?? 0))}
                                </div>
                                <p>{usuario.percentual}% do total consolidado entre os participantes.</p>
                              </article>
                            ))}
                          </div>

                          <div className="who-spends-more-bar-card">
                            <div className="who-spends-more-bar-header">
                              <strong>Participacao no total do periodo</strong>
                              <span>
                                {whoSpendsMoreReport.usuario1.nome} x {whoSpendsMoreReport.usuario2.nome}
                              </span>
                            </div>
                            <div className="who-spends-more-bar-track" aria-hidden="true">
                              <span
                                className="who-spends-more-bar who-spends-more-bar-leading"
                                style={{ width: `${whoSpendsMoreReport.usuario1.percentual}%` }}
                              />
                              <span
                                className="who-spends-more-bar who-spends-more-bar-secondary"
                                style={{ width: `${whoSpendsMoreReport.usuario2.percentual}%` }}
                              />
                            </div>
                            <div className="who-spends-more-legend">
                              <span>{whoSpendsMoreReport.usuario1.nome}: {whoSpendsMoreReport.usuario1.percentual}%</span>
                              <span>{whoSpendsMoreReport.usuario2.nome}: {whoSpendsMoreReport.usuario2.percentual}%</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="dashboard-empty-state">
                          <strong>Nenhum ranking disponivel para o periodo.</strong>
                          <p>Verifique se existe uma conta conjunta ativa e gastos suficientes no intervalo informado.</p>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'relatorios' && !['evolucao-mensal', 'comparativo-mensal', 'top-categorias', 'quem-gasta-mais'].includes(reportSection) ? (
                    <section className="dashboard-expenses report-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Relatorios / Em construcao</span>
                          <h4>{reportMenuItems.find((item) => item.id === reportSection)?.title || 'Relatorio'}</h4>
                        </div>
                      </div>

                      <div className="report-tabs" role="tablist" aria-label="Tipos de relatorio">
                        {reportMenuItems.map((reportItem) => (
                          <button
                            key={reportItem.id}
                            type="button"
                            role="tab"
                            aria-selected={reportSection === reportItem.id}
                            className={`report-tab ${reportSection === reportItem.id ? 'report-tab-active' : ''}`}
                            onClick={() => {
                              setDashboardSection('relatorios')
                              setReportSection(reportItem.id)
                              navigateTo('/dashboard')
                            }}
                          >
                            <span className="report-tab-title">{reportItem.title}</span>
                            <small className="report-tab-description">{reportItem.description}</small>
                          </button>
                        ))}
                      </div>

                      <div className="dashboard-empty-state">
                        <strong>Esse relatorio entra como exemplo de navegacao.</strong>
                        <p>
                          A estrutura do submenu ja esta pronta para receber as versoes reais de
                          comparativo mensal, top categorias e comportamento.
                        </p>
                      </div>
                    </section>
                  ) : null}

                  {dashboardSection === 'configuracoes' ? (
                    <section className="dashboard-expenses settings-section">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Preferencias</span>
                          <h4>Configuracoes da experiencia</h4>
                          <p>
                            Ajuste o visual do painel para o estilo que fizer mais sentido no seu dia a dia.
                          </p>
                        </div>
                      </div>

                      <div className="settings-grid">
                        <article className="settings-option-card">
                          <div className="settings-option-copy">
                            <span className="settings-option-kicker">Tema do painel</span>
                            <strong>{themeMode === 'dark' ? 'Modo dark ativo' : 'Modo claro ativo'}</strong>
                            <p>
                              Troque a atmosfera do sistema sem perder contraste, leitura e identidade visual.
                            </p>
                          </div>

                          <div className="theme-switcher" role="radiogroup" aria-label="Selecao de tema do painel">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={themeMode !== 'dark'}
                              className={`theme-choice ${themeMode !== 'dark' ? 'theme-choice-active' : ''}`}
                              onClick={() => setThemeMode('light')}
                            >
                              <span className="theme-choice-preview theme-choice-preview-light" aria-hidden="true" />
                              <span className="theme-choice-copy">
                                <strong>Claro</strong>
                                <small>Visual leve e luminoso.</small>
                              </span>
                            </button>

                            <button
                              type="button"
                              role="radio"
                              aria-checked={themeMode === 'dark'}
                              className={`theme-choice ${themeMode === 'dark' ? 'theme-choice-active' : ''}`}
                              onClick={() => setThemeMode('dark')}
                            >
                              <span className="theme-choice-preview theme-choice-preview-dark" aria-hidden="true" />
                              <span className="theme-choice-copy">
                                <strong>Dark</strong>
                                <small>Mais conforto visual para uso prolongado.</small>
                              </span>
                            </button>
                          </div>
                        </article>

                        <article className="settings-hint-card">
                          <span className="feature-label">Em breve</span>
                          <h5>O que mais pode entrar aqui</h5>
                          <p>
                            Esta nova area pode receber notificacoes, preferencias dos relatorios e ajustes do diagnostico financeiro.
                          </p>
                        </article>
                      </div>
                    </section>
                  ) : null}

                  {dashboardSection === 'categorias' ? (
                    <section className="dashboard-expenses">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Cadastro</span>
                          <h4>Criar e visualizar categorias</h4>
                        </div>
                      </div>

                      <div className="categories-layout">
                        <form className="category-form-card" onSubmit={handleCategorySubmit}>
                          <label className="field">
                            <span>Nome da categoria</span>
                            <input
                              type="text"
                              name="descricao"
                              placeholder="Ex.: Alimentacao"
                              minLength={2}
                              value={categoryForm.descricao}
                              onChange={handleCategoryChange}
                              required
                            />
                          </label>

                          <div className="field">
                            <span>Escolha um icone</span>
                            <div className="emoji-picker">
                              {CATEGORY_ICON_OPTIONS.map((option) => (
                                <button
                                  key={option.icon}
                                  type="button"
                                  className={`emoji-option ${categoryForm.iconName === option.icon ? 'emoji-option-active' : ''}`}
                                  onClick={() => setCategoryForm((current) => ({ ...current, iconName: option.icon }))}
                                  aria-label={`Selecionar icone ${option.label}`}
                                  title={option.label}
                                >
                                  <span>{option.icon}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="category-preview-card">
                            <span className="feature-label">Preview</span>
                            <div className="category-preview-content">
                              <span className="category-preview-icon">{categoryForm.iconName}</span>
                              <strong>{categoryForm.descricao || 'Nova categoria'}</strong>
                            </div>
                          </div>

                          <button type="submit" className="primary-button" disabled={isSavingCategory}>
                            {isSavingCategory ? 'Salvando...' : 'Criar categoria'}
                          </button>
                        </form>

                        <div className="category-list-card">
                          <div className="category-list-header">
                            <div>
                              <span className="feature-label">Biblioteca</span>
                              <h5>Categorias cadastradas</h5>
                            </div>
                            <span className="category-counter">{categories.length}</span>
                          </div>

                          {isLoadingCategories ? (
                            <div className="dashboard-empty-state">
                              <strong>Carregando categorias...</strong>
                              <p>Aguarde enquanto buscamos as categorias ja criadas.</p>
                            </div>
                          ) : categories.length === 0 ? (
                            <div className="dashboard-empty-state">
                              <strong>Nenhuma categoria encontrada</strong>
                              <p>Crie a primeira categoria usando o formulario ao lado.</p>
                            </div>
                          ) : (
                            <div className="category-list">
                              {categories.map((category) => (
                                <article key={category.id} className="category-card">
                                  <div className="category-card-main">
                                    <span className="category-card-icon">{getCategoryDisplayIcon(category)}</span>
                                    <div>
                                    <span className="feature-label">Categoria</span>
                                    <h5>{category.descricao}</h5>
                                    </div>
                                  </div>
                                  <span className="category-id">#{category.id.slice(0, 8)}</span>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {dashboardSection === 'cartoes' ? (
                    <section className="dashboard-expenses">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Credito</span>
                          <h4>Cartoes de credito</h4>
                        </div>
                      </div>

                      <div className="credit-card-layout">
                        <form className="credit-card-form-card" onSubmit={handleCreditCardSubmit}>
                          <div className="category-list-header">
                            <div>
                              <span className="feature-label">{selectedCreditCard ? 'Edicao' : 'Cadastro'}</span>
                              <h5>{selectedCreditCard ? 'Editar cartao' : 'Novo cartao'}</h5>
                            </div>
                          </div>

                          <label className="field">
                            <span>Descricao do cartao</span>
                            <input
                              type="text"
                              name="descricao"
                              placeholder="Ex.: Nubank, Inter, Cartao da empresa"
                              minLength={2}
                              value={creditCardForm.descricao}
                              onChange={handleCreditCardChange}
                              required
                            />
                          </label>

                          <div className="credit-card-days-grid">
                            <label className="field">
                              <span>Fechamento</span>
                              <input
                                type="number"
                                name="diaFechamento"
                                min="1"
                                max="31"
                                placeholder="10"
                                value={creditCardForm.diaFechamento}
                                onChange={handleCreditCardChange}
                                required
                              />
                            </label>

                            <label className="field">
                              <span>Vencimento</span>
                              <input
                                type="number"
                                name="diaVencimento"
                                min="1"
                                max="31"
                                placeholder="17"
                                value={creditCardForm.diaVencimento}
                                onChange={handleCreditCardChange}
                                required
                              />
                            </label>
                          </div>

                          <label className="field">
                            <span>Limite do cartao</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              name="valorLimite"
                              placeholder="0,00"
                              value={creditCardForm.valorLimite}
                              onChange={handleCreditCardChange}
                              required
                            />
                          </label>

                          <label className="field">
                            <span>Observacoes</span>
                            <textarea
                              name="observacoes"
                              rows="4"
                              placeholder="Ex.: Cartao usado para gastos recorrentes da casa."
                              value={creditCardForm.observacoes}
                              onChange={handleCreditCardChange}
                            />
                          </label>

                          <div className="credit-card-preview">
                            <span className="feature-label">Preview</span>
                            <strong>{creditCardForm.descricao || 'Novo cartao'}</strong>
                            <p>
                              Fecha dia {creditCardForm.diaFechamento || '--'} e vence dia{' '}
                              {creditCardForm.diaVencimento || '--'}.
                            </p>
                            <p>Limite {creditCardForm.valorLimite ? `R$ ${creditCardForm.valorLimite}` : 'a definir'}.</p>
                          </div>

                          <div className="expense-edit-actions">
                            {selectedCreditCard ? (
                              <button type="button" className="secondary-button" onClick={cancelCreditCardEdit} disabled={isSavingCreditCard}>
                                Cancelar edicao
                              </button>
                            ) : null}
                            <button type="submit" className="primary-button" disabled={isSavingCreditCard}>
                              {isSavingCreditCard ? 'Salvando...' : selectedCreditCard ? 'Salvar alteracoes' : 'Criar cartao'}
                            </button>
                          </div>
                        </form>

                        <div className="credit-card-list-card">
                          <div className="category-list-header">
                            <div>
                              <span className="feature-label">Carteira</span>
                              <h5>Cartoes cadastrados</h5>
                            </div>
                            <span className="category-counter">{creditCards.length}</span>
                          </div>

                          {isLoadingCreditCards ? (
                            <div className="dashboard-empty-state">
                              <strong>Carregando cartoes...</strong>
                              <p>Aguarde enquanto buscamos os cartoes vinculados ao usuario logado.</p>
                            </div>
                          ) : creditCards.length === 0 ? (
                            <div className="dashboard-empty-state">
                              <strong>Nenhum cartao encontrado</strong>
                              <p>Cadastre seu primeiro cartao usando o formulario ao lado.</p>
                            </div>
                          ) : (
                            <div className="credit-card-list">
                              {creditCards.map((card) => {
                                const currentUsage = Number(creditCardUsageById.get(card.id) ?? 0)
                                const limit = Number(card.valorLimite ?? 0)
                                const usagePercent = limit > 0 ? (currentUsage / limit) * 100 : 0
                                const usageLevel = currentUsage > limit
                                  ? 'critical'
                                  : usagePercent >= 80
                                    ? 'warning'
                                    : 'safe'

                                return (
                                  <article
                                    key={card.id}
                                    className={`credit-card-item${card.origemCartao === 'conta_conjunta' ? ' credit-card-item-disabled' : ''}`}
                                    onClick={card.origemCartao === 'conta_conjunta' ? undefined : () => openCreditCardEdit(card)}
                                    title={card.origemCartao === 'conta_conjunta' ? 'Somente o titular pode editar este cartao.' : 'Editar cartao'}
                                  >
                                    <div className="credit-card-item-header">
                                      <div>
                                        <span className="feature-label">Cartao de credito</span>
                                        <h5>{card.descricao}</h5>
                                        {card.origemCartao === 'conta_conjunta' ? (
                                          <p className="credit-card-shared-note">
                                            Titular: {card.usuarioNome || 'usuario da conta conjunta'}
                                          </p>
                                        ) : null}
                                      </div>
                                      <span className="category-id">#{card.id.slice(0, 8)}</span>
                                    </div>

                                    <div className="credit-card-item-details">
                                      <span>Limite {currencyFormatter.format(limit)}</span>
                                      <span className={`credit-card-usage-pill credit-card-usage-pill-${usageLevel}`}>
                                        Em uso {currencyFormatter.format(currentUsage)}
                                      </span>
                                      <span>Fecha dia {card.diaFechamento}</span>
                                      <span>Vence dia {card.diaVencimento}</span>
                                    </div>

                                    {card.observacoes ? <p>{card.observacoes}</p> : null}
                                  </article>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {dashboardSection === 'faturas' ? (
                    <section className="dashboard-expenses">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Cartoes / Faturas</span>
                          <h4>Faturas dos cartoes</h4>
                        </div>
                      </div>

                      <div className="invoice-toolbar">
                        <label className="field">
                          <span>Filtrar por cartao</span>
                          <select
                            name="cartaoCreditoId"
                            value={invoiceFilters.cartaoCreditoId}
                            onChange={handleInvoiceFilterChange}
                          >
                            <option value="todos">Todos os cartoes</option>
                            {creditCards.map((card) => {
                              const isSharedCard = card.origemCartao === 'conta_conjunta'
                              const ownerLabel = isSharedCard
                                ? `Conta conjunta - ${card.usuarioNome || 'usuario compartilhado'}`
                                : 'Meu cartao'

                              return (
                                <option key={card.id} value={card.id}>
                                  {`${card.descricao} | ${ownerLabel}`}
                                </option>
                              )
                            })}
                          </select>
                        </label>

                        <label className="field">
                          <span>Filtrar por vencimento</span>
                          <select
                            name="dueMonth"
                            value={invoiceFilters.dueMonth}
                            onChange={handleInvoiceFilterChange}
                          >
                            <option value="">Todas as faturas do cartao</option>
                            {availableInvoiceDueMonths.map((dueMonth) => (
                              <option key={dueMonth} value={dueMonth}>
                                {formatInvoiceDueMonthOption(dueMonth)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Ordenar por vencimento</span>
                          <select
                            name="sortOrder"
                            value={invoiceFilters.sortOrder}
                            onChange={handleInvoiceFilterChange}
                          >
                            <option value="desc">Mais recente primeiro</option>
                            <option value="asc">Mais antigo primeiro</option>
                          </select>
                        </label>
                      </div>

                      {isLoadingInvoices ? (
                        <div className="dashboard-empty-state">
                          <strong>Carregando faturas...</strong>
                          <p>Aguarde enquanto buscamos as faturas dos cartoes acessiveis.</p>
                        </div>
                      ) : filteredCreditCardInvoices.length === 0 ? (
                        <div className="dashboard-empty-state">
                          <strong>Nenhuma fatura encontrada</strong>
                          <p>
                            {creditCardInvoices.length === 0
                              ? 'As faturas serao criadas automaticamente quando um gasto for vinculado a um cartao.'
                              : 'Nenhuma fatura corresponde ao cartao e ao periodo de vencimento selecionados.'}
                          </p>
                        </div>
                      ) : (
                        <div className="invoice-grid">
                          {sortedCreditCardInvoices.map((invoice) => {
                            const total = Number(invoice.valorTotal ?? 0)
                            const limit = Number(invoice.cartaoValorLimite ?? 0)
                            const isSharedCard = invoice.origemCartao === 'conta_conjunta'
                            const isCurrentInvoice = isCurrentCompetence(invoice.competencia)
                            const canPayInvoice = !['paga', 'cancelada'].includes(invoice.status)
                            const canReopenInvoice = invoice.status === 'paga'
                            const invoiceItems = (invoiceItemsById.get(invoice.id) ?? []).slice().sort((firstItem, secondItem) => {
                              const firstTime = firstItem.dueDate ? new Date(firstItem.dueDate).getTime() : 0
                              const secondTime = secondItem.dueDate ? new Date(secondItem.dueDate).getTime() : 0
                              return firstTime - secondTime
                            })
                            const isItemsExpanded = Boolean(expandedInvoiceIds[invoice.id])

                            return (
                              <article key={invoice.id} className={`invoice-card${isCurrentInvoice ? ' invoice-card-current' : ''}`}>
                                <div className="invoice-card-main">
                                  <div className="invoice-card-header">
                                    <div>
                                      <div className="invoice-title-row">
                                        <span className="feature-label">{formatMonthlyReference(invoice.competencia)}</span>
                                        {isCurrentInvoice ? <span className="invoice-current-pill">Fatura atual</span> : null}
                                      </div>
                                      <h5>{invoice.cartaoDescricao || 'Cartao de credito'}</h5>
                                    </div>
                                    <span className={`invoice-status invoice-status-${invoice.status}`}>
                                      {invoice.status}
                                    </span>
                                  </div>

                                  <strong className="invoice-total">
                                    {total === 0 ? 'Sem lancamentos' : currencyFormatter.format(total)}
                                  </strong>

                                  <div className="invoice-summary-grid">
                                    <div className="invoice-summary-item">
                                      <span>Limite</span>
                                      <strong>{currencyFormatter.format(limit)}</strong>
                                    </div>
                                    <div className="invoice-summary-item">
                                      <span>Fechamento</span>
                                      <strong>{invoice.dataFechamento ? dateFormatter.format(new Date(invoice.dataFechamento)) : '--'}</strong>
                                    </div>
                                    <div className="invoice-summary-item">
                                      <span>Vencimento</span>
                                      <strong>{invoice.dataVencimento ? dateFormatter.format(new Date(invoice.dataVencimento)) : '--'}</strong>
                                    </div>
                                    <div className="invoice-summary-item">
                                      <span>Itens</span>
                                      <strong>{Number(invoice.totalGastos ?? 0)} vinculados</strong>
                                    </div>
                                    <div className="invoice-summary-item">
                                      <span>Titular</span>
                                      <strong>{isSharedCard ? invoice.cartaoUsuarioNome || 'usuario compartilhado' : 'voce'}</strong>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="invoice-items-toggle"
                                    onClick={() => toggleInvoiceItems(invoice.id)}
                                    disabled={invoiceItems.length === 0}
                                  >
                                    <span>
                                      {invoiceItems.length === 0
                                        ? 'Nenhum item nesta fatura'
                                        : isItemsExpanded
                                          ? `Ocultar ${invoiceItems.length} itens`
                                          : `Ver ${invoiceItems.length} itens`}
                                    </span>
                                    <strong>{invoiceItems.length}</strong>
                                  </button>
                                  {canPayInvoice ? (
                                    <button
                                      type="button"
                                      className="primary-button invoice-pay-button"
                                      onClick={() => openPayInvoiceModal(invoice)}
                                    >
                                      Pagar fatura
                                    </button>
                                  ) : null}
                                  {canReopenInvoice ? (
                                    <button
                                      type="button"
                                      className="secondary-button invoice-pay-button"
                                      onClick={() => openReopenInvoiceModal(invoice)}
                                    >
                                      Reabrir fatura
                                    </button>
                                  ) : null}
                                </div>

                                {isItemsExpanded ? (
                                  <div className="invoice-items-panel">
                                    {invoiceItems.length > 0 ? (
                                      <div className="invoice-items-list">
                                        {invoiceItems.map((item) => (
                                          <article key={item.id} className="invoice-item-row">
                                            <div>
                                              <strong>{item.label}</strong>
                                              <p>
                                                {item.competence ? `Competencia ${formatCompetenceDisplay(item.competence)} - ` : ''}
                                                {item.dueDate ? `Vencimento ${dateFormatter.format(new Date(item.dueDate))}` : 'Sem vencimento'}
                                              </p>
                                              <p>
                                                {item.createdAt
                                                  ? `Cadastrado em ${dateFormatter.format(new Date(item.createdAt))}`
                                                  : 'Data de cadastro indisponivel'}
                                              </p>
                                            </div>
                                            <div className="invoice-item-side">
                                              <strong>{currencyFormatter.format(item.amount)}</strong>
                                              <span className={`invoice-item-status invoice-item-status-${item.status}`}>{item.status}</span>
                                              <small>{item.ownerLabel}</small>
                                            </div>
                                          </article>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="invoice-items-empty">
                                        Nenhum item vinculado foi encontrado para esta fatura.
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </article>
                            )
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {dashboardSection === 'conta-conjunta' ? (
                    <section className="dashboard-expenses">
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Compartilhamento</span>
                          <h4>Conta Conjunta</h4>
                        </div>
                      </div>

                      <div className={`joint-account-layout ${jointAccounts.length > 0 ? 'joint-account-layout-single' : ''}`}>
                        {jointAccounts.length === 0 ? (
                          <form className="joint-account-form-card" onSubmit={handleJointAccountSubmit}>
                            <label className="field">
                              <span>Nome da conta</span>
                              <input
                                type="text"
                                name="nomeConta"
                                placeholder="Ex.: Casa, Casal, Apartamento"
                                minLength={2}
                                value={jointAccountForm.nomeConta}
                                onChange={handleJointAccountChange}
                                required
                              />
                            </label>

                            <label className="field">
                              <span>E-mail da outra pessoa</span>
                              <input
                                type="email"
                                name="usuarioConjunto"
                                placeholder="parceiro@exemplo.com"
                                autoComplete="email"
                                value={jointAccountForm.usuarioConjunto}
                                onChange={handleJointAccountChange}
                                required
                              />
                            </label>

                            <button type="submit" className="primary-button" disabled={isSavingJointAccount}>
                              {isSavingJointAccount ? 'Criando...' : 'Criar vinculo'}
                            </button>
                          </form>
                        ) : null}

                        <div>
                          {isLoadingJointAccounts ? (
                            <div className="dashboard-empty-state">
                              <strong>Carregando conta conjunta...</strong>
                              <p>Aguarde enquanto buscamos os dados vinculados ao usuario logado.</p>
                            </div>
                          ) : jointAccounts.length === 0 ? (
                            <div className="dashboard-empty-state">
                              <strong>Nenhuma conta conjunta encontrada</strong>
                              <p>Crie o primeiro vinculo usando o formulario ao lado.</p>
                            </div>
                          ) : (
                            <div className="joint-account-list">
                              {jointAccounts.map((account) => {
                                const firstUser = account.usuario1
                                const secondUser = account.usuario2
                                const partner = firstUser?.id === profile.id ? secondUser : firstUser

                                return (
                                  <article key={account.id} className="joint-account-card">
                                    <div className="joint-account-card-header">
                                      <div>
                                        <span className="feature-label">Conta compartilhada</span>
                                        <h5>{account.nomeConta}</h5>
                                      </div>
                                      <span className="category-id">#{account.id.slice(0, 8)}</span>
                                    </div>

                                    <div className="joint-account-users">
                                      <div className="joint-account-user">
                                        <span>Usuario logado</span>
                                        <strong>{profile.nome}</strong>
                                        <p>{profile.email}</p>
                                      </div>
                                      <div className="joint-account-user">
                                        <span>Compartilhada com</span>
                                        <strong>{partner?.nome || 'Usuario vinculado'}</strong>
                                        <p>{partner?.email || 'E-mail nao informado'}</p>
                                      </div>
                                    </div>

                                    <div className="joint-account-meta">
                                      <span>
                                        Criada em{' '}
                                        {account.createdAt
                                          ? dateFormatter.format(new Date(account.createdAt))
                                          : 'data nao informada'}
                                      </span>
                                      <span>2 participantes</span>
                                    </div>

                                    <div className="joint-account-actions">
                                      <button
                                        type="button"
                                        className="danger-button joint-account-unlink-button"
                                        onClick={() => openUnlinkJointAccountModal(account)}
                                      >
                                        Desvincular conta
                                      </button>
                                      <p>
                                        Ao desvincular, a regra de uma conta compartilhada ativa por pessoa
                                        continua preservada e voce podera criar um novo vinculo.
                                      </p>
                                    </div>
                                  </article>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>
          ) : profile ? (
            <div className="session-card">
              <div>
                <span className="session-label">Usuario autenticado</span>
                <strong>{profile.email}</strong>
              </div>
              <div>
                <span className="session-label">Token salvo</span>
                <code>{token.slice(0, 22)}...</code>
              </div>
              <button type="button" className="primary-button ghost-button" onClick={handleLogout}>
                Sair da sessao
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  placeholder="joao@exemplo.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  name="senha"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  minLength={6}
                  value={form.senha}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Acessar conta'}
              </button>

              {isDevelopmentEnvironment ? (
                <>
                  <button type="button" className="secondary-button" onClick={() => navigateTo('/cadastro')}>
                    Criar nova conta
                  </button>

                  <button type="button" className="secondary-button" onClick={() => navigateTo('/redefinir-senha')}>
                    Esqueci minha senha
                  </button>
                </>
              ) : null}
            </form>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <span>NossoSaldo</span>
        <a href="mailto:nossosaldoenterprise@gmail.com">nossosaldoenterprise@gmail.com</a>
      </footer>

      {creditCardLimitWarning ? (
        <div className="modal-overlay" role="presentation" onClick={handleCancelLimitWarning}>
          <div
            className="confirm-modal warning-modal credit-limit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-limit-warning-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Alerta de limite</span>
            <span className="warning-modal-icon" aria-hidden="true">!</span>
            <h3 id="credit-limit-warning-title">Limite do cartao em atencao</h3>
            <p>
              O cartao <strong>{creditCardLimitWarning.card.descricao}</strong> esta se aproximando
              ou ultrapassando o limite cadastrado.
            </p>

            <div className="credit-limit-summary">
              <span>{creditCardLimitWarning.cardOwner}</span>
              <strong>{currencyFormatter.format(Number(creditCardLimitWarning.limit ?? 0))}</strong>
              <small>Limite cadastrado do cartao.</small>
            </div>

            <div className="credit-limit-warning-list">
              {creditCardLimitWarning.warnings.map((warning, index) => (
                <article
                  key={`${warning.level}-${warning.competence}-${index}`}
                  className={`credit-limit-warning-item credit-limit-warning-item-${warning.level}`}
                >
                  <span>{warning.title}</span>
                  <strong>{warning.competence}</strong>
                  <p>{warning.description}</p>
                  <small>
                    Saldo em aberto atual: {currencyFormatter.format(Number(warning.currentTotal ?? 0))} |
                    {' '}Disponivel antes deste gasto: {currencyFormatter.format(Number(warning.availableLimit ?? 0))}
                  </small>
                  {warning.level === 'critical' ? (
                    <small>Revise o gasto ou atualize o limite do cartao antes de continuar.</small>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelLimitWarning}
                disabled={isSavingExpense}
              >
                Cancelar cadastro
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleContinueAfterLimitWarning}
                disabled={isSavingExpense}
              >
                {isSavingExpense ? 'Salvando...' : 'Continuar mesmo assim'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedExpense ? (
        <div className="modal-overlay" role="presentation" onClick={closePayExpenseModal}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-expense-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Confirmacao</span>
            <h3 id="confirm-expense-action-title">
              {expenseModalMode === 'delete'
                ? 'Excluir gasto'
                : expenseModalMode === 'reopen'
                  ? 'Reabrir gasto'
                  : 'Quitar gasto'}
            </h3>
            <p>
              {expenseModalMode === 'delete'
                ? (
                  <>
                    Deseja confirmar a exclusao do gasto <strong>{selectedExpense.descricao}</strong> no valor de{' '}
                    <strong>{currencyFormatter.format(Number(selectedExpense.valor ?? 0))}</strong>?
                  </>
                )
                : expenseModalMode === 'reopen'
                  ? (
                    <>
                      Deseja confirmar a reabertura do gasto <strong>{selectedExpense.descricao}</strong> no valor de{' '}
                      <strong>{currencyFormatter.format(Number(selectedExpense.valor ?? 0))}</strong>?
                    </>
                  )
                  : (
                  <>
                    Deseja confirmar a quitacao do gasto <strong>{selectedExpense.descricao}</strong> no valor de{' '}
                    <strong>{currencyFormatter.format(Number(selectedExpense.valor ?? 0))}</strong>?
                  </>
                )}
            </p>
            {expenseModalMode === 'reopen' ? (
              <p>Ao confirmar, o gasto voltara para pendente. Se ele for parcelado e nao estiver vinculado a cartao, as parcelas tambem serao reabertas.</p>
            ) : null}
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closePayExpenseModal}
                disabled={isPayingExpense || isDeletingExpense || isReopeningExpense}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={expenseModalMode === 'delete' ? 'danger-button' : 'primary-button'}
                onClick={
                  expenseModalMode === 'delete'
                    ? handleDeleteExpense
                    : expenseModalMode === 'reopen'
                      ? handleReopenExpense
                      : handlePayExpense
                }
                disabled={isPayingExpense || isDeletingExpense || isReopeningExpense}
              >
                {expenseModalMode === 'delete'
                  ? (isDeletingExpense ? 'Excluindo...' : 'Confirmar exclusao')
                  : expenseModalMode === 'reopen'
                    ? (isReopeningExpense ? 'Reabrindo...' : 'Confirmar reabertura')
                    : (isPayingExpense ? 'Quitando...' : 'Confirmar quitacao')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedInvoice ? (
        <div className="modal-overlay" role="presentation" onClick={closePayInvoiceModal}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-invoice-action-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Confirmacao</span>
            <h3 id="confirm-invoice-action-title">{invoiceModalMode === 'reopen' ? 'Reabrir fatura' : 'Quitar fatura'}</h3>
            {invoiceModalMode === 'reopen' ? (
              <>
                <p>
                  Isso vai reabrir a fatura <strong>{formatMonthlyReference(selectedInvoice.competencia)}</strong> e desfazer a
                  quitacao de todos os gastos e parcelas vinculados a ela.
                </p>
                <p>Caso queira continuar, confirme a reabertura abaixo.</p>
              </>
            ) : (
              <>
                <p>
                  Deseja confirmar a quitacao da fatura <strong>{formatMonthlyReference(selectedInvoice.competencia)}</strong>{' '}
                  no valor de <strong>{currencyFormatter.format(Number(selectedInvoice.valorTotal ?? 0))}</strong>?
                </p>
                <p>
                  Ao confirmar, todos os gastos e parcelas vinculados a esta fatura serao marcados como pagos.
                </p>
              </>
            )}
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closePayInvoiceModal}
                disabled={isPayingInvoice || isReopeningInvoice}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={invoiceModalMode === 'reopen' ? handleReopenInvoice : handlePayInvoice}
                disabled={isPayingInvoice || isReopeningInvoice}
              >
                {invoiceModalMode === 'reopen'
                  ? (isReopeningInvoice ? 'Reabrindo...' : 'Confirmar reabertura')
                  : (isPayingInvoice ? 'Quitando...' : 'Confirmar quitacao')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedInstallment ? (
        <div className="modal-overlay" role="presentation" onClick={closePayInstallmentModal}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-pay-installment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Confirmacao</span>
            <h3 id="confirm-pay-installment-title">Pagar parcela</h3>
            <p>
              Deseja confirmar o pagamento da parcela{' '}
              <strong>
                {selectedInstallment.installment.numeroParcela}/{selectedInstallment.expense.numeroParcelas}
              </strong>{' '}
              de <strong>{selectedInstallment.expense.descricao}</strong> no valor de{' '}
              <strong>{currencyFormatter.format(Number(selectedInstallment.installment.valorParcela ?? 0))}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closePayInstallmentModal}
                disabled={isPayingInstallment}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handlePayInstallment}
                disabled={isPayingInstallment}
              >
                {isPayingInstallment ? 'Pagando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedJointAccount ? (
        <div className="modal-overlay" role="presentation" onClick={closeUnlinkJointAccountModal}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-unlink-joint-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Conta conjunta</span>
            <h3 id="confirm-unlink-joint-account-title">Desvincular conta compartilhada</h3>
            <p>
              Deseja desvincular a conta <strong>{selectedJointAccount.nomeConta}</strong>? Depois disso,
              os registros compartilhados deixam de aparecer para o outro usuario e voce podera criar um novo
              vinculo ativo.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeUnlinkJointAccountModal}
                disabled={isUnlinkingJointAccount}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleUnlinkJointAccount}
                disabled={isUnlinkingJointAccount}
              >
                {isUnlinkingJointAccount ? 'Desvinculando...' : 'Confirmar desvinculacao'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loginErrorMessage ? (
        <div className="modal-overlay" role="presentation" onClick={closeLoginErrorModal}>
          <div
            className="confirm-modal warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="warning-modal-icon" aria-hidden="true">!</span>
            <span className="feature-label">Acesso</span>
            <h3 id="login-error-title">Não foi possível entrar</h3>
            <p>{loginErrorMessage}</p>
            <div className="confirm-modal-actions confirm-modal-actions-single">
              <button
                type="button"
                className="primary-button"
                onClick={closeLoginErrorModal}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {creditCardDueDateNotice ? (
        <div className="modal-overlay" role="presentation" onClick={closeCreditCardDueDateNotice}>
          <div
            className="confirm-modal warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-card-due-date-notice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="warning-modal-icon" aria-hidden="true">!</span>
            <h3 id="credit-card-due-date-notice-title">Vencimento ajustado para a proxima fatura</h3>
            <p>
              O fechamento do cartao <strong>{creditCardDueDateNotice.cardDescription}</strong> ja passou.
              Por isso, o campo de vencimento foi alterado para{' '}
              <strong>{dateFormatter.format(creditCardDueDateNotice.dueDate)}</strong>, que corresponde ao vencimento da fatura do mes seguinte.
            </p>
            <p>
              Se quiser usar outra data, volte ao campo <strong>Vencimento</strong> e ajuste manualmente antes de salvar o gasto.
            </p>
            <div className="confirm-modal-actions confirm-modal-actions-single">
              <button type="button" className="primary-button" onClick={closeCreditCardDueDateNotice}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {jointAccountErrorMessage ? (
        <div className="modal-overlay" role="presentation" onClick={closeJointAccountErrorModal}>
          <div
            className="confirm-modal warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="joint-account-error-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="warning-modal-icon" aria-hidden="true">!</span>
            <span className="feature-label">Conta conjunta</span>
            <h3 id="joint-account-error-title">Não foi possível criar o vínculo</h3>
            <p>{jointAccountErrorMessage}</p>
            <div className="confirm-modal-actions confirm-modal-actions-single">
              <button
                type="button"
                className="primary-button"
                onClick={closeJointAccountErrorModal}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
