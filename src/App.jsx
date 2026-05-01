import { useEffect, useState } from 'react'
import './App.css'
import {
  createExpense,
  createCategory,
  deleteExpense,
  getCategories,
  getExpenseById,
  getExpenses,
  getProfile,
  login,
  payExpense,
  requestPasswordReset,
  updateExpense,
  updatePassword,
} from './services/api'

const initialForm = {
  email: '',
  senha: '',
}

const initialPasswordForm = {
  senha: '',
  confirmarSenha: '',
}

const initialCategoryForm = {
  descricao: '',
  iconName: '🏷️',
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
    tipo: 'despesa',
  }
}

const initialExpenseForm = {
  descricao: '',
  tipo: 'despesa',
  status: 'pendente',
  origemLancamento: 'unico',
  numeroParcelas: '2',
  valor: '',
  competencia: '',
  dataVencimento: '',
  observacao: '',
  categoriaId: '',
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

function normalizeExpenseForm(expense) {
  return {
    descricao: expense.descricao ?? '',
    tipo: expense.tipo ?? 'despesa',
    status: expense.status ?? 'pendente',
    origemLancamento: expense.origemLancamento ?? 'unico',
    numeroParcelas: expense.numeroParcelas != null ? String(expense.numeroParcelas) : '2',
    valor: expense.valor != null ? formatCurrencyInput(expense.valor) : '',
    competencia: formatDateForInput(expense.competencia),
    dataVencimento: formatDateForInput(expense.dataVencimento),
    observacao: expense.observacao ?? '',
    categoriaId: expense.categoriaId ?? '',
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

function App() {
  const [form, setForm] = useState(initialForm)
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [status, setStatus] = useState({
    type: 'idle',
    message: 'Entre com seu e-mail e senha para acessar seu painel financeiro.',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('nossosaldo.token') ?? '')
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm)
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [isPayingExpense, setIsPayingExpense] = useState(false)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)
  const [isLoadingExpenseDetails, setIsLoadingExpenseDetails] = useState(false)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [expenseModalMode, setExpenseModalMode] = useState(null)
  const [expenseSuccessMessage, setExpenseSuccessMessage] = useState('')
  const [expenseFilters, setExpenseFilters] = useState(() => getCurrentMonthRange())
  const [expandedCategoryIds, setExpandedCategoryIds] = useState({})
  const [route, setRoute] = useState(() => window.location.pathname)
  const [search, setSearch] = useState(() => window.location.search)
  const [dashboardSection, setDashboardSection] = useState('gastos')
  const resetParams = new URLSearchParams(search)
  const recoveryToken = resetParams.get('token') ?? ''
  const isPasswordResetRoute = route === '/redefinir-senha' || route === '/trocar-senha'
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
    if (!token) {
      setProfile(null)
      setExpenses([])
      setCategories([])
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
    if (!token || !profile || !isDashboardRoute || dashboardSection !== 'gastos' || isExpenseEditRoute || isExpenseCreateRoute) {
      return
    }

    let isMounted = true

    const hydrateExpenses = async () => {
      setIsLoadingExpenses(true)

      try {
        const [expensesResponse, categoriesResponse] = await Promise.all([
          getExpenses(token),
          getCategories(token),
        ])

        if (!isMounted) {
          return
        }

        setExpenses(Array.isArray(expensesResponse.gastos) ? expensesResponse.gastos : [])
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : [])
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
  ])

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
    if (!token || !profile || !isExpenseCreateRoute) {
      return
    }

    let isMounted = true

    const hydrateCreateDependencies = async () => {
      setIsLoadingExpenseDetails(true)

      try {
        const categoriesResponse = categories.length === 0 ? await getCategories(token) : categories

        if (!isMounted) {
          return
        }

        setExpenseForm(initialExpenseForm)

        if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse)
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
  }, [token, profile, isExpenseCreateRoute, categories])

  useEffect(() => {
    if (!token || !profile || !isExpenseEditRoute || !editingExpenseId) {
      return
    }

    let isMounted = true

    const hydrateExpenseDetails = async () => {
      setIsLoadingExpenseDetails(true)

      try {
        const [expenseResponse, categoriesResponse] = await Promise.all([
          getExpenseById(token, editingExpenseId),
          categories.length === 0 ? getCategories(token) : Promise.resolve(categories),
        ])

        if (!isMounted) {
          return
        }

        setExpenseForm(normalizeExpenseForm(expenseResponse))

        if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse)
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
  }, [token, profile, isExpenseEditRoute, editingExpenseId, categories])

  const handleChange = ({ target }) => {
    const { name, value } = target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handlePasswordChange = ({ target }) => {
    const { name, value } = target
    setPasswordForm((current) => ({ ...current, [name]: value }))
  }

  const handleCategoryChange = ({ target }) => {
    const { name, value } = target
    setCategoryForm((current) => ({ ...current, [name]: value }))
  }

  const handleExpenseFormChange = ({ target }) => {
    const { name, value } = target
    setExpenseForm((current) => {
      if (name === 'origemLancamento') {
        return {
          ...current,
          origemLancamento: value,
          numeroParcelas: value === 'parcelado' ? current.numeroParcelas || '2' : '2',
        }
      }

      return {
        ...current,
        [name]: name === 'valor' ? formatCurrencyInput(value) : value,
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

  const filteredExpenses = expenses.filter((expense) => {
    const effectiveStatus = getEffectiveExpenseStatus(expense)
    const matchesStatus =
      expenseFilters.status === 'todos' ||
      (expenseFilters.status === 'abertos' && ['pendente', 'atrasado'].includes(effectiveStatus)) ||
      effectiveStatus === expenseFilters.status
    const matchesTipo = expenseFilters.tipo === 'todos' || expense.tipo === expenseFilters.tipo

    if (!matchesStatus || !matchesTipo) {
      return false
    }

    if (!expenseFilters.dateFrom && !expenseFilters.dateTo) {
      return true
    }

    if (!expense.dataVencimento) {
      return false
    }

    const dueDate = new Date(expense.dataVencimento)

    if (Number.isNaN(dueDate.getTime())) {
      return false
    }

    const dueDateOnly = dueDate.toISOString().slice(0, 10)
    const isAfterStart = !expenseFilters.dateFrom || dueDateOnly >= expenseFilters.dateFrom
    const isBeforeEnd = !expenseFilters.dateTo || dueDateOnly <= expenseFilters.dateTo

    return isAfterStart && isBeforeEnd
  })
  const periodExpenses = expenses.filter((expense) => {
    if (!expenseFilters.dateFrom && !expenseFilters.dateTo) {
      return true
    }

    if (!expense.dataVencimento) {
      return false
    }

    const dueDate = new Date(expense.dataVencimento)

    if (Number.isNaN(dueDate.getTime())) {
      return false
    }

    const dueDateOnly = dueDate.toISOString().slice(0, 10)
    const isAfterStart = !expenseFilters.dateFrom || dueDateOnly >= expenseFilters.dateFrom
    const isBeforeEnd = !expenseFilters.dateTo || dueDateOnly <= expenseFilters.dateTo

    return isAfterStart && isBeforeEnd
  })
  const filteredRevenueValue = periodExpenses
    .filter((expense) => expense.tipo === 'receita')
    .reduce((accumulator, expense) => accumulator + Number(expense.valor ?? 0), 0)
  const filteredCostValue = periodExpenses
    .filter((expense) => expense.tipo === 'despesa')
    .reduce((accumulator, expense) => accumulator + Number(expense.valor ?? 0), 0)
  const filteredBalanceValue = filteredRevenueValue - filteredCostValue
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
    currentGroup.total += Number(expense.valor ?? 0)
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
      setStatus({
        type: 'success',
        message: 'Login realizado com sucesso. Carregando seus dados...',
      })
      navigateTo('/dashboard')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Nao foi possivel entrar agora.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('nossosaldo.token')
    setToken('')
    setProfile(null)
    setExpenses([])
    setCategories([])
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

  const openPayExpenseModal = (expense) => {
    setSelectedExpense(expense)
    setExpenseModalMode('pay')
  }

  const openDeleteExpenseModal = (expense) => {
    setSelectedExpense(expense)
    setExpenseModalMode('delete')
  }

  const closePayExpenseModal = () => {
    if (isPayingExpense || isDeletingExpense) {
      return
    }

    setSelectedExpense(null)
    setExpenseModalMode(null)
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

  const handleDeleteExpense = async () => {
    if (!token || !selectedExpense) {
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

    const payload = {
      descricao: expenseForm.descricao,
      tipo: expenseForm.tipo,
      status: expenseForm.status,
      valor: parseCurrencyInput(expenseForm.valor),
      competencia: expenseForm.competencia || null,
      dataVencimento: expenseForm.dataVencimento || null,
      observacao: expenseForm.observacao || null,
      ...(expenseForm.categoriaId ? { categoriaId: expenseForm.categoriaId } : {}),
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

  const handleExpenseCreate = async (event) => {
    event.preventDefault()

    if (!token) {
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

    const payload = {
      descricao: expenseForm.descricao,
      tipo: expenseForm.tipo,
      status: expenseForm.status,
      origemLancamento: expenseForm.origemLancamento,
      numeroParcelas: expenseForm.origemLancamento === 'parcelado' ? Number(expenseForm.numeroParcelas) : 1,
      valor: parseCurrencyInput(expenseForm.valor),
      competencia: expenseForm.competencia || null,
      dataVencimento: expenseForm.dataVencimento || null,
      observacao: expenseForm.observacao || null,
      categoriaId: expenseForm.categoriaId,
    }

    setIsSavingExpense(true)
    setStatus({
      type: 'loading',
      message: `Criando o gasto "${expenseForm.descricao}"...`,
    })

    try {
      const createdExpense = await createExpense(token, payload)
      setExpenses((current) => [createdExpense, ...current])
      setExpenseForm(initialExpenseForm)
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
    }
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
          <span className="eyebrow">NossoSaldo</span>
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
            <span className={`status-pill status-pill-${status.type}`}>{status.type}</span>
            <h2>
              {isPasswordResetRoute
                ? isRecoveryFlow
                  ? 'Definir nova senha'
                  : 'Solicitar troca de senha'
                : isDashboardRoute && profile
                  ? `Dashboard de ${profile.nome}`
                : profile
                  ? `Bem-vindo, ${profile.nome}`
                  : 'Entrar na plataforma'}
            </h2>
            <p>{status.message}</p>
          </div>

          {isPasswordResetRoute ? (
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
          ) : isDashboardRoute && profile ? (
            <div className="dashboard-layout">
              <div className="dashboard-shell">
                <aside className="dashboard-sidebar">
                  <div className="dashboard-sidebar-brand">
                    <span className="eyebrow">Workspace</span>
                    <strong>NossoSaldo</strong>
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
                      Lista de gastos
                    </button>
                    <button
                      type="button"
                      className={`dashboard-nav-item ${dashboardSection === 'categorias' ? 'dashboard-nav-item-active' : ''}`}
                      onClick={() => {
                        setDashboardSection('categorias')
                        navigateTo('/dashboard')
                      }}
                    >
                      Categorias
                    </button>
                    <button type="button" className="dashboard-nav-item dashboard-nav-item-muted">
                      Contas conjuntas
                    </button>
                    <button type="button" className="dashboard-nav-item dashboard-nav-item-muted">
                      Relatorios
                    </button>
                  </nav>

                  <div className="dashboard-sidebar-actions">
                    <button type="button" className="secondary-button" onClick={() => navigateTo('/redefinir-senha')}>
                      Redefinir senha
                    </button>
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

                            <label className="field">
                              <span>Categoria</span>
                              <select
                                name="categoriaId"
                                value={expenseForm.categoriaId}
                                onChange={handleExpenseFormChange}
                                required={isExpenseCreateRoute}
                              >
                                <option value="">Selecione uma categoria</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {`${getCategoryDisplayIcon(category)} ${category.descricao}`}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="field">
                              <span>Competencia</span>
                              <input type="date" name="competencia" value={expenseForm.competencia} onChange={handleExpenseFormChange} />
                            </label>

                            <label className="field">
                              <span>Vencimento</span>
                              <input type="date" name="dataVencimento" value={expenseForm.dataVencimento} onChange={handleExpenseFormChange} />
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
                      <div className="dashboard-section-header">
                        <div>
                          <span className="feature-label">Conteudo inicial</span>
                          <h4>Lista de gastos</h4>
                        </div>
                        <button type="button" className="primary-button" onClick={navigateToExpenseCreate}>
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
                          <p>O filtro considera a data de vencimento e, por padrao, mostra apenas os gastos com vencimento entre o primeiro e o ultimo dia do mes atual.</p>
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

                                      return (
                                        <article
                                          key={expense.id}
                                          className="expense-card expense-card-clickable"
                                          onClick={() => navigateToExpenseEdit(expense.id)}
                                        >
                                          <div className="expense-card-main">
                                            <div>
                                              <div className="expense-card-badges">
                                                <span className={`expense-badge expense-badge-${expense.tipo}`}>{expense.tipo}</span>
                                                {effectiveStatus === 'pago' ? (
                                                  <span className="expense-paid-label">Quitado</span>
                                                ) : effectiveStatus === 'atrasado' ? (
                                                  <span className="expense-overdue-label">Atrasado</span>
                                                ) : null}
                                              </div>
                                              <h5>{expense.descricao}</h5>
                                              <p>
                                                Status: {effectiveStatus} {expense.competencia ? ` - Competencia ${dateFormatter.format(new Date(expense.competencia))}` : ''}
                                              </p>
                                            </div>
                                            <div className="expense-card-side">
                                              <strong>{currencyFormatter.format(Number(expense.valor ?? 0))}</strong>
                                              <div className="expense-card-actions">
                                                {effectiveStatus !== 'pago' ? (
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
                                              </div>
                                            </div>
                                          </div>
                                          <div className="expense-card-meta">
                                            <span>
                                              Origem: {expense.origemLancamento}
                                              {expense.origemLancamento === 'parcelado' && expense.numeroParcelas
                                                ? ` - ${expense.numeroParcelas} parcelas`
                                                : ''}
                                            </span>
                                            <span>
                                              {expense.dataVencimento
                                                ? `Vencimento: ${dateFormatter.format(new Date(expense.dataVencimento))}`
                                                : 'Sem vencimento informado'}
                                            </span>
                                            <span>
                                              {expense.dataPagamento
                                                ? `Pagamento: ${dateFormatter.format(new Date(expense.dataPagamento))}`
                                                : 'Pagamento pendente'}
                                            </span>
                                          </div>
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
              <button type="button" className="secondary-button" onClick={() => navigateTo('/redefinir-senha')}>
                Redefinir senha
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

              <button type="button" className="secondary-button" onClick={() => navigateTo('/redefinir-senha')}>
                Esqueci minha senha
              </button>
            </form>
          )}
        </div>
      </section>

      {selectedExpense ? (
        <div className="modal-overlay" role="presentation" onClick={closePayExpenseModal}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-pay-expense-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="feature-label">Confirmacao</span>
            <h3 id="confirm-pay-expense-title">
              {expenseModalMode === 'delete' ? 'Excluir gasto' : 'Quitar gasto'}
            </h3>
            <p>
              {expenseModalMode === 'delete'
                ? (
                  <>
                    Deseja confirmar a exclusao do gasto <strong>{selectedExpense.descricao}</strong> no valor de{' '}
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
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closePayExpenseModal}
                disabled={isPayingExpense || isDeletingExpense}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={expenseModalMode === 'delete' ? 'danger-button' : 'primary-button'}
                onClick={expenseModalMode === 'delete' ? handleDeleteExpense : handlePayExpense}
                disabled={isPayingExpense || isDeletingExpense}
              >
                {expenseModalMode === 'delete'
                  ? (isDeletingExpense ? 'Excluindo...' : 'Confirmar exclusao')
                  : (isPayingExpense ? 'Quitando...' : 'Confirmar quitacao')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
