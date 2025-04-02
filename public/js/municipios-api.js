// API URL base - altere para o endereço da sua API
const API_BASE_URL = "https://backend-geo-kappa.vercel.app/api"

// Objeto para gerenciar as chamadas à API - usando window para torná-lo global
window.ApiService = {
  // Buscar municípios com paginação, ordenação e filtro
  getMunicipios: async (page = 1, limit = 10, sort = "nome", order = "asc", nome = "") => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        sort,
        order,
      })

      if (nome) {
        queryParams.append("nome", nome)
      }

      const response = await fetch(`${API_BASE_URL}/municipios?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Erro ao buscar municípios: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Buscar municípios por distância
  getMunicipiosByDistance: async (latitude, longitude, distance = 100, page = 1, limit = 10) => {
    try {
      const queryParams = new URLSearchParams({
        latitude,
        longitude,
        distance,
        page,
        limit,
      })

      const response = await fetch(`${API_BASE_URL}/municipios/nearby?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Erro ao buscar municípios por distância: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Buscar município por ID
  getMunicipioById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/municipios/${id}`)

      if (!response.ok) {
        throw new Error(`Erro ao buscar município: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Criar novo município
  createMunicipio: async (municipioData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/municipios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(municipioData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar município")
      }

      return data
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Atualizar município existente
  updateMunicipio: async (id, municipioData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/municipios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(municipioData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar município")
      }

      return data
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Excluir município
  deleteMunicipio: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/municipios/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao excluir município")
      }

      return true
    } catch (error) {
      console.error("Erro na API:", error)
      throw error
    }
  },

  // Calcular distância entre dois pontos geográficos (fórmula de Haversine)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    // Raio da Terra em km
    const R = 6371

    // Converter graus para radianos
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180

    // Fórmula de Haversine
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distância em km

    return distance
  },
}

// Dados de exemplo para modo offline/demonstração
window.demoData = [
  {
    _id: "1",
    nome: "São Paulo",
    codigo_ibge: 3550308,
    codigo_uf: 35,
    capital: true,
    local: { type: "Point", coordinates: [-46.6333, -23.5505] },
  },
  {
    _id: "2",
    nome: "Rio de Janeiro",
    codigo_ibge: 3304557,
    codigo_uf: 33,
    capital: true,
    local: { type: "Point", coordinates: [-43.1729, -22.9068] },
  },
  {
    _id: "3",
    nome: "Belo Horizonte",
    codigo_ibge: 3106200,
    codigo_uf: 31,
    capital: true,
    local: { type: "Point", coordinates: [-43.9345, -19.9167] },
  },
  {
    _id: "4",
    nome: "Salvador",
    codigo_ibge: 2927408,
    codigo_uf: 29,
    capital: true,
    local: { type: "Point", coordinates: [-38.5011, -12.9722] },
  },
  {
    _id: "5",
    nome: "Brasília",
    codigo_ibge: 5300108,
    codigo_uf: 53,
    capital: true,
    local: { type: "Point", coordinates: [-47.9297, -15.7797] },
  },
  {
    _id: "6",
    nome: "Fortaleza",
    codigo_ibge: 2304400,
    codigo_uf: 23,
    capital: true,
    local: { type: "Point", coordinates: [-38.5266, -3.7172] },
  },
  {
    _id: "7",
    nome: "Recife",
    codigo_ibge: 2611606,
    codigo_uf: 26,
    capital: true,
    local: { type: "Point", coordinates: [-34.8811, -8.0539] },
  },
  {
    _id: "8",
    nome: "Porto Alegre",
    codigo_ibge: 4314902,
    codigo_uf: 43,
    capital: true,
    local: { type: "Point", coordinates: [-51.23, -30.0331] },
  },
  {
    _id: "9",
    nome: "Curitiba",
    codigo_ibge: 4106902,
    codigo_uf: 41,
    capital: true,
    local: { type: "Point", coordinates: [-49.2733, -25.4284] },
  },
  {
    _id: "10",
    nome: "Manaus",
    codigo_ibge: 1302603,
    codigo_uf: 13,
    capital: true,
    local: { type: "Point", coordinates: [-60.0212, -3.1186] },
  },
  {
    _id: "11",
    nome: "Goiânia",
    codigo_ibge: 5208707,
    codigo_uf: 52,
    capital: true,
    local: { type: "Point", coordinates: [-49.2647, -16.6868] },
  },
  {
    _id: "12",
    nome: "Belém",
    codigo_ibge: 1501402,
    codigo_uf: 15,
    capital: true,
    local: { type: "Point", coordinates: [-48.5044, -1.4558] },
  },
  {
    _id: "13",
    nome: "Campinas",
    codigo_ibge: 3509502,
    codigo_uf: 35,
    capital: false,
    local: { type: "Point", coordinates: [-47.0608, -22.9056] },
  },
  {
    _id: "14",
    nome: "Florianópolis",
    codigo_ibge: 4205407,
    codigo_uf: 42,
    capital: true,
    local: { type: "Point", coordinates: [-48.5482, -27.5969] },
  },
  {
    _id: "15",
    nome: "Vitória",
    codigo_ibge: 3205309,
    codigo_uf: 32,
    capital: true,
    local: { type: "Point", coordinates: [-40.3128, -20.3155] },
  },
]

