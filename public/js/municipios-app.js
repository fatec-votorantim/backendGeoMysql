// Estado da aplicação
const appState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
  sortField: "nome",
  sortOrder: "asc",
  searchTerm: "",
  municipios: [],
  selectedMunicipioId: null,
  userLocation: null,
  distanceFilter: 100, // Valor padrão em km
  isDistanceFilterActive: false,
}

// Elementos DOM
const elements = {
  // Tabela e paginação
  tableBody: document.getElementById("municipiosTableBody"),
  btnPrevPage: document.getElementById("btnPrevPage"),
  btnNextPage: document.getElementById("btnNextPage"),
  currentPage: document.getElementById("currentPage"),
  pageStart: document.getElementById("pageStart"),
  pageEnd: document.getElementById("pageEnd"),
  totalItems: document.getElementById("totalItems"),

  // Filtros e ordenação
  searchInput: document.getElementById("searchInput"),
  sortField: document.getElementById("sortField"),
  sortOrder: document.getElementById("sortOrder"),
  btnFilter: document.getElementById("btnFilter"),

  // Filtro por localização
  btnGetLocation: document.getElementById("btnGetLocation"),
  locationStatus: document.getElementById("locationStatus"),
  userLocation: document.getElementById("userLocation"),
  distanceFilter: document.getElementById("distanceFilter"),
  btnFilterByDistance: document.getElementById("btnFilterByDistance"),

  // Modal de adição/edição
  municipioModal: document.getElementById("municipioModal"),
  modalTitle: document.getElementById("modalTitle"),
  municipioForm: document.getElementById("municipioForm"),
  municipioId: document.getElementById("municipioId"),
  btnAddMunicipio: document.getElementById("btnAddMunicipio"),
  btnCloseModal: document.getElementById("btnCloseModal"),
  btnCancelModal: document.getElementById("btnCancelModal"),
  btnSaveMunicipio: document.getElementById("btnSaveMunicipio"),

  // Modal de exclusão
  deleteModal: document.getElementById("deleteModal"),
  deleteItemName: document.getElementById("deleteItemName"),
  btnCancelDelete: document.getElementById("btnCancelDelete"),
  btnConfirmDelete: document.getElementById("btnConfirmDelete"),

  // Toast
  toast: document.getElementById("toast"),
  toastIcon: document.getElementById("toastIcon"),
  toastMessage: document.getElementById("toastMessage"),
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Carregar dados iniciais
  loadMunicipios()

  // Configurar event listeners
  setupEventListeners()
})

// Configurar todos os event listeners
function setupEventListeners() {
  // Paginação
  elements.btnPrevPage.addEventListener("click", () => {
    if (appState.currentPage > 1) {
      appState.currentPage--
      if (appState.isDistanceFilterActive) {
        filterByDistance()
      } else {
        loadMunicipios()
      }
    }
  })

  elements.btnNextPage.addEventListener("click", () => {
    if (appState.currentPage < appState.totalPages) {
      appState.currentPage++
      if (appState.isDistanceFilterActive) {
        filterByDistance()
      } else {
        loadMunicipios()
      }
    }
  })

  // Filtros e ordenação
  elements.btnFilter.addEventListener("click", () => {
    appState.sortField = elements.sortField.value
    appState.sortOrder = elements.sortOrder.value
    appState.searchTerm = elements.searchInput.value.trim()
    appState.currentPage = 1
    appState.isDistanceFilterActive = false
    loadMunicipios()
  })

  elements.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      appState.searchTerm = elements.searchInput.value.trim()
      appState.currentPage = 1
      appState.isDistanceFilterActive = false
      loadMunicipios()
    }
  })

  // Localização do usuário
  elements.btnGetLocation.addEventListener("click", getUserLocation)
  elements.distanceFilter.addEventListener("change", () => {
    appState.distanceFilter = Number.parseFloat(elements.distanceFilter.value)
  })
  elements.btnFilterByDistance.addEventListener("click", () => {
    appState.currentPage = 1
    filterByDistance()
  })

  // Modal de adição/edição
  elements.btnAddMunicipio.addEventListener("click", () => {
    openModalForCreate()
  })

  elements.btnCloseModal.addEventListener("click", closeModal)
  elements.btnCancelModal.addEventListener("click", closeModal)

  elements.municipioForm.addEventListener("submit", (e) => {
    e.preventDefault()
    saveMunicipio()
  })

  // Modal de exclusão
  elements.btnCancelDelete.addEventListener("click", closeDeleteModal)
}

// Obter localização do usuário
function getUserLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocalização não é suportada pelo seu navegador", "error")
    return
  }

  // Mostrar status de carregamento
  elements.locationStatus.classList.remove("hidden")
  elements.btnGetLocation.disabled = true

  navigator.geolocation.getCurrentPosition(
    // Sucesso
    (position) => {
      const { latitude, longitude } = position.coords
      appState.userLocation = { latitude, longitude }

      // Atualizar UI
      elements.userLocation.innerHTML = `
        <span class="text-green-600"><i class="fas fa-check-circle mr-1"></i> Localização detectada:</span> 
        Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}
      `
      elements.btnFilterByDistance.disabled = false

      // Esconder status de carregamento
      elements.locationStatus.classList.add("hidden")
      elements.btnGetLocation.disabled = false

      showToast("Localização obtida com sucesso!", "success")
    },
    // Erro
    (error) => {
      let errorMessage
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Permissão para geolocalização negada"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Informação de localização indisponível"
          break
        case error.TIMEOUT:
          errorMessage = "Tempo esgotado ao obter localização"
          break
        default:
          errorMessage = "Erro desconhecido ao obter localização"
      }

      // Atualizar UI
      elements.userLocation.innerHTML = `
        <span class="text-red-600"><i class="fas fa-exclamation-circle mr-1"></i> Erro:</span> ${errorMessage}
      `

      // Esconder status de carregamento
      elements.locationStatus.classList.add("hidden")
      elements.btnGetLocation.disabled = false

      showToast(errorMessage, "error")
    },
    // Opções
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  )
}

// Filtrar municípios por distância usando a API
async function filterByDistance() {
  if (!appState.userLocation) {
    showToast("Localização do usuário não disponível", "error")
    return
  }

  const distance = Number.parseFloat(elements.distanceFilter.value)
  if (isNaN(distance) || distance <= 0) {
    showToast("Por favor, informe uma distância válida", "error")
    return
  }

  // Filtrar municípios por distância
  try {
    // Mostrar indicador de carregamento
    showLoadingState()

    // Marcar que o filtro de distância está ativo
    appState.isDistanceFilterActive = true

    // Obter dados da API
    const { latitude, longitude } = appState.userLocation

    let result
    try {
      result = await window.ApiService.getMunicipiosByDistance(
        latitude,
        longitude,
        distance,
        appState.currentPage,
        appState.itemsPerPage,
      )
    } catch (apiError) {
      console.warn("Erro ao conectar com a API, usando dados de demonstração:", apiError)

      // Usar dados de demonstração para filtragem
      const filteredData = window.demoData.filter((municipio) => {
        // Calcular distância entre o usuário e o município
        const municipioLat = municipio.local.coordinates[1] // Latitude é o segundo elemento
        const municipioLon = municipio.local.coordinates[0] // Longitude é o primeiro elemento

        const calculatedDistance = window.ApiService.calculateDistance(latitude, longitude, municipioLat, municipioLon)

        // Adicionar a distância calculada ao objeto do município para exibição
        municipio.distanceFromUser = calculatedDistance

        // Filtrar por distância
        return calculatedDistance <= distance
      })

      // Ordenar por distância
      filteredData.sort((a, b) => a.distanceFromUser - b.distanceFromUser)

      // Paginar dados
      const startIndex = (appState.currentPage - 1) * appState.itemsPerPage
      const endIndex = startIndex + appState.itemsPerPage
      const paginatedData = filteredData.slice(startIndex, endIndex)

      result = {
        data: paginatedData,
        pagination: {
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / appState.itemsPerPage),
          page: appState.currentPage,
          limit: appState.itemsPerPage,
        },
      }

      // Mostrar toast informando que estamos usando dados de demonstração
      showToast("Usando dados de demonstração (modo offline)", "info")
    }

    // Atualizar estado da aplicação
    appState.municipios = result.data
    appState.totalItems = result.pagination.total
    appState.totalPages = result.pagination.pages

    // Atualizar UI
    renderMunicipiosWithDistance()
    updatePagination()

    showToast(`Encontrados ${result.pagination.total} municípios em um raio de ${distance}km`, "info")
  } catch (error) {
    showToast("Erro ao filtrar municípios: " + error.message, "error")
    // Mostrar estado de erro na tabela
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center text-red-500">
          <i class="fas fa-exclamation-circle mr-2"></i>
          Erro ao filtrar dados. Tente novamente.
        </td>
      </tr>
    `
  }
}

// Renderizar municípios com informação de distância
function renderMunicipiosWithDistance() {
  if (appState.municipios.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
          Nenhum município encontrado na distância especificada
        </td>
      </tr>
    `
    return
  }

  // Atualizar cabeçalho da tabela para incluir coluna de distância
  const tableHeader = document.querySelector("thead tr")
  if (!tableHeader.querySelector("th:nth-child(7)")) {
    const distanceHeader = document.createElement("th")
    distanceHeader.className = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
    distanceHeader.textContent = "Distância"
    tableHeader.appendChild(distanceHeader)
  }

  elements.tableBody.innerHTML = appState.municipios
    .map(
      (municipio) => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-medium text-gray-900">${municipio.nome}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.codigo_ibge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.codigo_uf}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${
          municipio.capital
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sim</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Não</span>'
        }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.local.coordinates[0].toFixed(4)}, ${municipio.local.coordinates[1].toFixed(4)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex justify-end space-x-2">
          <button class="btn-action btn-edit" data-id="${municipio._id}" onclick="openModalForEdit('${municipio._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" data-id="${municipio._id}" onclick="openDeleteModal('${municipio._id}', '${municipio.nome}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.distanceFromUser !== undefined ? municipio.distanceFromUser.toFixed(2) + " km" : "-"}
      </td>
    </tr>
  `,
    )
    .join("")
}

// Carregar municípios da API
async function loadMunicipios() {
  try {
    // Mostrar indicador de carregamento
    showLoadingState()

    // Buscar dados da API
    let result
    try {
      result = await window.ApiService.getMunicipios(
        appState.currentPage,
        appState.itemsPerPage,
        appState.sortField,
        appState.sortOrder,
        appState.searchTerm,
      )
    } catch (apiError) {
      console.warn("Erro ao conectar com a API, usando dados de demonstração:", apiError)

      // Usar dados de demonstração em caso de falha na API
      const filteredData = window.demoData.filter(
        (item) => !appState.searchTerm || item.nome.toLowerCase().includes(appState.searchTerm.toLowerCase()),
      )

      // Ordenar dados
      const sortedData = [...filteredData].sort((a, b) => {
        const aValue = a[appState.sortField]
        const bValue = b[appState.sortField]
        const direction = appState.sortOrder === "asc" ? 1 : -1

        if (typeof aValue === "string") {
          return aValue.localeCompare(bValue) * direction
        }
        return (aValue - bValue) * direction
      })

      // Paginar dados
      const startIndex = (appState.currentPage - 1) * appState.itemsPerPage
      const endIndex = startIndex + appState.itemsPerPage
      const paginatedData = sortedData.slice(startIndex, endIndex)

      result = {
        data: paginatedData,
        pagination: {
          total: filteredData.length,
          pages: Math.ceil(filteredData.length / appState.itemsPerPage),
          page: appState.currentPage,
          limit: appState.itemsPerPage,
        },
      }

      // Mostrar toast informando que estamos usando dados de demonstração
      showToast("Usando dados de demonstração (modo offline)", "info")
    }

    // Atualizar estado da aplicação
    appState.municipios = result.data
    appState.totalItems = result.pagination.total
    appState.totalPages = result.pagination.pages

    // Atualizar UI
    if (appState.isDistanceFilterActive) {
      renderMunicipiosWithDistance()
    } else {
      renderMunicipios()
    }
    updatePagination()
  } catch (error) {
    showToast("Erro ao carregar municípios: " + error.message, "error")
    // Mostrar estado de erro na tabela
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-red-500">
          <i class="fas fa-exclamation-circle mr-2"></i>
          Erro ao carregar dados. Tente novamente.
        </td>
      </tr>
    `
  }
}

// Renderizar municípios na tabela
function renderMunicipios() {
  if (appState.municipios.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          Nenhum município encontrado
        </td>
      </tr>
    `
    return
  }

  // Remover coluna de distância se existir
  const tableHeader = document.querySelector("thead tr")
  const distanceHeader = tableHeader.querySelector("th:nth-child(7)")
  if (distanceHeader) {
    tableHeader.removeChild(distanceHeader)
  }

  elements.tableBody.innerHTML = appState.municipios
    .map(
      (municipio) => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-medium text-gray-900">${municipio.nome}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.codigo_ibge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.codigo_uf}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${
          municipio.capital
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sim</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Não</span>'
        }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-500">
        ${municipio.local.coordinates[0].toFixed(4)}, ${municipio.local.coordinates[1].toFixed(4)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex justify-end space-x-2">
          <button class="btn-action btn-edit" data-id="${municipio._id}" onclick="openModalForEdit('${municipio._id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" data-id="${municipio._id}" onclick="openDeleteModal('${municipio._id}', '${municipio.nome}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")
}

// Atualizar informações de paginação
function updatePagination() {
  const start = (appState.currentPage - 1) * appState.itemsPerPage + 1
  const end = Math.min(start + appState.itemsPerPage - 1, appState.totalItems)

  elements.pageStart.textContent = appState.totalItems > 0 ? start : 0
  elements.pageEnd.textContent = end
  elements.totalItems.textContent = appState.totalItems
  elements.currentPage.textContent = appState.currentPage

  // Habilitar/desabilitar botões de paginação
  elements.btnPrevPage.disabled = appState.currentPage <= 1
  elements.btnNextPage.disabled = appState.currentPage >= appState.totalPages
}

// Mostrar estado de carregamento
function showLoadingState() {
  elements.tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="px-6 py-4 text-center text-gray-500">
        <div class="flex justify-center">
          <div class="loading-spinner"></div>
          <span class="ml-2">Carregando dados...</span>
        </div>
      </td>
    </tr>
  `
}

// Abrir modal para criar novo município
function openModalForCreate() {
  elements.modalTitle.textContent = "Adicionar Município"
  elements.municipioId.value = ""
  elements.municipioForm.reset()

  // Definir valor padrão para capital (Não)
  document.querySelector('input[name="capital"][value="false"]').checked = true

  // Limpar mensagens de erro
  clearFormErrors()

  // Exibir modal
  elements.municipioModal.classList.remove("hidden")
}

// Abrir modal para editar município
async function openModalForEdit(id) {
  try {
    // Mostrar indicador de carregamento no modal
    elements.modalTitle.textContent = "Carregando..."
    elements.municipioModal.classList.remove("hidden")

    // Buscar dados do município
    let municipio

    try {
      municipio = await window.ApiService.getMunicipioById(id)
    } catch (apiError) {
      console.warn("Erro ao conectar com a API, usando dados de demonstração:", apiError)

      // Usar dados de demonstração em caso de falha na API
      municipio = window.demoData.find((m) => m._id === id)

      if (!municipio) {
        throw new Error("Município não encontrado")
      }

      // Mostrar toast informando que estamos usando dados de demonstração
      showToast("Usando dados de demonstração (modo offline)", "info")
    }

    // Preencher formulário
    elements.modalTitle.textContent = "Editar Município"
    elements.municipioId.value = municipio._id

    document.getElementById("nome").value = municipio.nome
    document.getElementById("codigo_ibge").value = municipio.codigo_ibge
    document.getElementById("codigo_uf").value = municipio.codigo_uf

    // Definir valor para capital
    document.querySelector(`input[name="capital"][value="${municipio.capital}"]`).checked = true

    // Preencher coordenadas
    document.getElementById("longitude").value = municipio.local.coordinates[0]
    document.getElementById("latitude").value = municipio.local.coordinates[1]

    // Limpar mensagens de erro
    clearFormErrors()
  } catch (error) {
    showToast("Erro ao carregar dados do município: " + error.message, "error")
    closeModal()
  }
}

// Fechar modal
function closeModal() {
  elements.municipioModal.classList.add("hidden")
}

// Salvar município (criar ou atualizar)
async function saveMunicipio() {
  try {
    // Obter dados do formulário
    const id = elements.municipioId.value
    const isEdit = !!id

    // Construir objeto com dados do município
    const municipioData = {
      nome: document.getElementById("nome").value,
      codigo_ibge: Number.parseInt(document.getElementById("codigo_ibge").value),
      codigo_uf: Number.parseInt(document.getElementById("codigo_uf").value),
      capital: document.querySelector('input[name="capital"]:checked').value === "true",
      local: {
        type: "Point",
        coordinates: [
          Number.parseFloat(document.getElementById("longitude").value),
          Number.parseFloat(document.getElementById("latitude").value),
        ],
      },
    }

    // Validar dados
    const errors = validateMunicipioData(municipioData)
    if (errors.length > 0) {
      displayFormErrors(errors)
      return
    }

    // Enviar para API
    try {
      if (isEdit) {
        await window.ApiService.updateMunicipio(id, municipioData)
      } else {
        await window.ApiService.createMunicipio(municipioData)
      }
    } catch (apiError) {
      console.warn("Erro ao conectar com a API, simulando operação em modo offline:", apiError)

      // Simular operação em modo offline
      if (isEdit) {
        // Atualizar no array de demonstração
        const index = window.demoData.findIndex((m) => m._id === id)
        if (index !== -1) {
          window.demoData[index] = { ...window.demoData[index], ...municipioData }
        }
      } else {
        // Adicionar ao array de demonstração
        const newId = "demo_" + Date.now()
        window.demoData.push({ _id: newId, ...municipioData })
      }

      // Mostrar toast informando que estamos usando dados de demonstração
      showToast("Operação simulada em modo offline", "info")
    }

    showToast(isEdit ? "Município atualizado com sucesso!" : "Município criado com sucesso!", "success")

    // Fechar modal e recarregar dados
    closeModal()
    if (appState.isDistanceFilterActive) {
      filterByDistance()
    } else {
      loadMunicipios()
    }
  } catch (error) {
    // Verificar se é um erro de validação
    if (error.errors) {
      displayFormErrors(error.errors)
    } else {
      showToast(error.message, "error")
    }
  }
}

// Validar dados do município
function validateMunicipioData(data) {
  const errors = []

  if (!data.nome || data.nome.trim() === "") {
    errors.push({ param: "nome", msg: "Nome é obrigatório" })
  }

  if (!data.codigo_ibge || isNaN(data.codigo_ibge)) {
    errors.push({ param: "codigo_ibge", msg: "Código IBGE é obrigatório e deve ser um número" })
  } else if (data.codigo_ibge < 1000000 || data.codigo_ibge > 9999999) {
    errors.push({ param: "codigo_ibge", msg: "Código IBGE deve ter 7 dígitos" })
  }

  if (!data.codigo_uf || isNaN(data.codigo_uf)) {
    errors.push({ param: "codigo_uf", msg: "Código UF é obrigatório e deve ser um número" })
  } else if (data.codigo_uf < 1 || data.codigo_uf > 99) {
    errors.push({ param: "codigo_uf", msg: "Código UF deve estar entre 1 e 99" })
  }

  if (isNaN(data.local.coordinates[0])) {
    errors.push({ param: "local.coordinates.0", msg: "Longitude é obrigatória e deve ser um número" })
  } else if (data.local.coordinates[0] < -180 || data.local.coordinates[0] > 180) {
    errors.push({ param: "local.coordinates.0", msg: "Longitude deve estar entre -180 e 180" })
  }

  if (isNaN(data.local.coordinates[1])) {
    errors.push({ param: "local.coordinates.1", msg: "Latitude é obrigatória e deve ser um número" })
  } else if (data.local.coordinates[1] < -90 || data.local.coordinates[1] > 90) {
    errors.push({ param: "local.coordinates.1", msg: "Latitude deve estar entre -90 e 90" })
  }

  return errors
}

// Exibir erros de validação no formulário
function displayFormErrors(errors) {
  // Limpar erros anteriores
  clearFormErrors()

  // Exibir novos erros
  errors.forEach((error) => {
    const field = error.param
    const message = error.msg

    // Encontrar elemento de erro correspondente
    let errorElement

    if (field.startsWith("local.coordinates.0")) {
      errorElement = document.getElementById("longitudeError")
    } else if (field.startsWith("local.coordinates.1")) {
      errorElement = document.getElementById("latitudeError")
    } else {
      errorElement = document.getElementById(`${field}Error`)
    }

    if (errorElement) {
      errorElement.textContent = message
      errorElement.classList.remove("hidden")
    }
  })
}

// Limpar mensagens de erro do formulário
function clearFormErrors() {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = ""
    el.classList.add("hidden")
  })
}

// Abrir modal de confirmação de exclusão
function openDeleteModal(id, nome) {
  appState.selectedMunicipioId = id
  elements.deleteItemName.textContent = nome
  elements.deleteModal.classList.remove("hidden")

  // Adicionar event listener para confirmar exclusão
  elements.btnConfirmDelete.onclick = confirmDelete
}

// Fechar modal de exclusão
function closeDeleteModal() {
  elements.deleteModal.classList.add("hidden")
}

// Confirmar exclusão de município
async function confirmDelete() {
  try {
    try {
      await window.ApiService.deleteMunicipio(appState.selectedMunicipioId)
    } catch (apiError) {
      console.warn("Erro ao conectar com a API, simulando operação em modo offline:", apiError)

      // Simular exclusão em modo offline
      const index = window.demoData.findIndex((m) => m._id === appState.selectedMunicipioId)
      if (index !== -1) {
        window.demoData.splice(index, 1)
      }

      // Mostrar toast informando que estamos usando dados de demonstração
      showToast("Operação simulada em modo offline", "info")
    }

    showToast("Município excluído com sucesso!", "success")
    closeDeleteModal()
    if (appState.isDistanceFilterActive) {
      filterByDistance()
    } else {
      loadMunicipios()
    }
  } catch (error) {
    showToast("Erro ao excluir município: " + error.message, "error")
    closeDeleteModal()
  }
}

// Exibir toast de notificação
function showToast(message, type = "info") {
  // Configurar tipo de toast
  elements.toast.className =
    "fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg transform transition-transform duration-300 z-50"

  switch (type) {
    case "success":
      elements.toast.classList.add("toast-success")
      elements.toastIcon.className = "fas fa-check-circle mr-2"
      break
    case "error":
      elements.toast.classList.add("toast-error")
      elements.toastIcon.className = "fas fa-exclamation-circle mr-2"
      break
    default:
      elements.toast.classList.add("toast-info")
      elements.toastIcon.className = "fas fa-info-circle mr-2"
  }

  // Definir mensagem
  elements.toastMessage.textContent = message

  // Exibir toast
  elements.toast.classList.add("toast-show")

  // Esconder toast após 3 segundos
  setTimeout(() => {
    elements.toast.classList.remove("toast-show")
  }, 3000)
}

// Expor funções para uso global (para os botões na tabela)
window.openModalForEdit = openModalForEdit
window.openDeleteModal = openDeleteModal

