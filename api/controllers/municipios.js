// Get all municipios with optional pagination and sorting
export const getMunicipios = async (req, res) => {
  try {
    const { page = 1, limit = 10, nome, sort = 'nome', order = 'asc' } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = req.app.locals.db;
    
    // Construir a consulta base
    let query = 'SELECT *, ST_X(location) as longitude, ST_Y(location) as latitude FROM municipios';
    const queryParams = [];
    
    // Adicionar filtro por nome se fornecido
    if (nome) {
      query += ' WHERE nome LIKE ?';
      queryParams.push(`%${nome}%`);
    }
    
    // Adicionar ordenação
    const validColumns = ['id', 'codigo_ibge', 'nome', 'capital', 'codigo_uf'];
    const sortColumn = validColumns.includes(sort) ? sort : 'nome';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    // Adicionar paginação
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));
    
    // Executar a consulta
    const [rows] = await pool.query(query, queryParams);
    
    // Formatar os resultados para manter compatibilidade com o formato MongoDB
    const formattedRows = rows.map(row => ({
      id: row.id,
      codigo_ibge: row.codigo_ibge,
      nome: row.nome,
      capital: row.capital === 1,
      codigo_uf: row.codigo_uf,
      local: {
        type: "Point",
        coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
      }
    }));
    
    // Obter o total de registros para paginação
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM municipios ${nome ? 'WHERE nome LIKE ?' : ''}`,
      nome ? [`%${nome}%`] : []
    );
    
    const total = countResult[0].total;
    
    res.status(200).json({
      data: formattedRows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar municípios:', error);
    res.status(500).json({ error: true, message: 'Falha ao buscar municípios' });
  }
};

// Get municipio by ID
export const getMunicipioById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    const [rows] = await pool.query(
      'SELECT *, ST_X(location) as longitude, ST_Y(location) as latitude FROM municipios WHERE id = ?', 
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Município não encontrado' });
    }
    
    // Formatar o resultado para manter compatibilidade com o formato MongoDB
    const municipio = {
      id: rows[0].id,
      codigo_ibge: rows[0].codigo_ibge,
      nome: rows[0].nome,
      capital: rows[0].capital === 1,
      codigo_uf: rows[0].codigo_uf,
      local: {
        type: "Point",
        coordinates: [parseFloat(rows[0].longitude), parseFloat(rows[0].latitude)]
      }
    };
    
    res.status(200).json(municipio);
  } catch (error) {
    console.error('Erro ao buscar município:', error);
    res.status(500).json({ error: true, message: 'Falha ao buscar município' });
  }
};

// Create new municipio
export const createMunicipio = async (req, res) => {
  try {
    const { codigo_ibge, nome, capital, codigo_uf, local } = req.body;
    const pool = req.app.locals.db;
    
    // Extrair coordenadas do objeto local
    const longitude = local?.coordinates?.[0];
    const latitude = local?.coordinates?.[1];
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: true,
        message: 'Coordenadas de localização são obrigatórias'
      });
    }
    
    // Verificar se já existe município com o mesmo código IBGE
    const [existing] = await pool.query(
      'SELECT id FROM municipios WHERE codigo_ibge = ?',
      [codigo_ibge]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'Município com este código IBGE já existe'
      });
    }
    
    // Inserir novo município
    const [result] = await pool.query(
      'INSERT INTO municipios (codigo_ibge, nome, capital, codigo_uf, location) VALUES (?, ?, ?, ?, ST_PointFromText(?))',
      [
        codigo_ibge, 
        nome, 
        capital ? 1 : 0, 
        codigo_uf, 
        `POINT(${longitude} ${latitude})`
      ]
    );
    
    // Buscar o município recém-criado
    const [newMunicipio] = await pool.query(
      'SELECT *, ST_X(location) as longitude, ST_Y(location) as latitude FROM municipios WHERE id = ?',
      [result.insertId]
    );
    
    // Formatar o resultado para manter compatibilidade com o formato MongoDB
    const formattedMunicipio = {
      id: newMunicipio[0].id,
      codigo_ibge: newMunicipio[0].codigo_ibge,
      nome: newMunicipio[0].nome,
      capital: newMunicipio[0].capital === 1,
      codigo_uf: newMunicipio[0].codigo_uf,
      local: {
        type: "Point",
        coordinates: [parseFloat(newMunicipio[0].longitude), parseFloat(newMunicipio[0].latitude)]
      }
    };
    
    res.status(201).json(formattedMunicipio);
  } catch (error) {
    console.error('Erro ao criar município:', error);
    res.status(500).json({ error: true, message: 'Falha ao criar município' });
  }
};

// Update municipio
export const updateMunicipio = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_ibge, nome, capital, codigo_uf, local } = req.body;
    const pool = req.app.locals.db;
    
    // Verificar se o município existe
    const [existing] = await pool.query(
      'SELECT id FROM municipios WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: true, message: 'Município não encontrado' });
    }
    
    // Se estiver atualizando o código IBGE, verificar se não conflita com outro município
    if (codigo_ibge) {
      const [conflicting] = await pool.query(
        'SELECT id FROM municipios WHERE codigo_ibge = ? AND id != ?',
        [codigo_ibge, id]
      );
      
      if (conflicting.length > 0) {
        return res.status(409).json({
          error: true,
          message: 'Outro município já possui este código IBGE'
        });
      }
    }
    
    // Construir a consulta de atualização dinamicamente
    const updates = [];
    const queryParams = [];
    
    if (codigo_ibge !== undefined) {
      updates.push('codigo_ibge = ?');
      queryParams.push(codigo_ibge);
    }
    
    if (nome !== undefined) {
      updates.push('nome = ?');
      queryParams.push(nome);
    }
    
    if (capital !== undefined) {
      updates.push('capital = ?');
      queryParams.push(capital ? 1 : 0);
    }
    
    if (codigo_uf !== undefined) {
      updates.push('codigo_uf = ?');
      queryParams.push(codigo_uf);
    }
    
    if (local?.coordinates) {
      updates.push('location = ST_PointFromText(?)');
      queryParams.push(`POINT(${local.coordinates[0]} ${local.coordinates[1]})`);
    }
    
    // Se não houver atualizações, retornar o município atual
    if (updates.length === 0) {
      const [municipio] = await pool.query(
        'SELECT *, ST_X(location) as longitude, ST_Y(location) as latitude FROM municipios WHERE id = ?',
        [id]
      );
      
      // Formatar o resultado para manter compatibilidade com o formato MongoDB
      const formattedMunicipio = {
        id: municipio[0].id,
        codigo_ibge: municipio[0].codigo_ibge,
        nome: municipio[0].nome,
        capital: municipio[0].capital === 1,
        codigo_uf: municipio[0].codigo_uf,
        local: {
          type: "Point",
          coordinates: [parseFloat(municipio[0].longitude), parseFloat(municipio[0].latitude)]
        }
      };
      
      return res.status(200).json(formattedMunicipio);
    }
    
    // Adicionar o ID ao final dos parâmetros
    queryParams.push(id);
    
    // Executar a atualização
    await pool.query(
      `UPDATE municipios SET ${updates.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Buscar o município atualizado
    const [updatedMunicipio] = await pool.query(
      'SELECT *, ST_X(location) as longitude, ST_Y(location) as latitude FROM municipios WHERE id = ?',
      [id]
    );
    
    // Formatar o resultado para manter compatibilidade com o formato MongoDB
    const formattedMunicipio = {
      id: updatedMunicipio[0].id,
      codigo_ibge: updatedMunicipio[0].codigo_ibge,
      nome: updatedMunicipio[0].nome,
      capital: updatedMunicipio[0].capital === 1,
      codigo_uf: updatedMunicipio[0].codigo_uf,
      local: {
        type: "Point",
        coordinates: [parseFloat(updatedMunicipio[0].longitude), parseFloat(updatedMunicipio[0].latitude)]
      }
    };
    
    res.status(200).json(formattedMunicipio);
  } catch (error) {
    console.error('Erro ao atualizar município:', error);
    res.status(500).json({ error: true, message: 'Falha ao atualizar município' });
  }
};

// Delete municipio
export const deleteMunicipio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    const [result] = await pool.query(
      'DELETE FROM municipios WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: true, message: 'Município não encontrado' });
    }
    
    res.status(200).json({ message: 'Município excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir município:', error);
    res.status(500).json({ error: true, message: 'Falha ao excluir município' });
  }
};

// Get municipios by distance from a point
export const getMunicipiosByDistance = async (req, res) => {
  try {
    const { latitude, longitude, distance = 100, page = 1, limit = 10 } = req.query;
    
    // Validar parâmetros
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: true, 
        message: "Latitude e longitude são obrigatórios" 
      });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseFloat(distance); // em km
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Validar valores
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ 
        error: true, 
        message: "Latitude deve ser um número entre -90 e 90" 
      });
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        error: true, 
        message: "Longitude deve ser um número entre -180 e 180" 
      });
    }
    
    if (isNaN(maxDistance) || maxDistance <= 0) {
      return res.status(400).json({ 
        error: true, 
        message: "Distância deve ser um número positivo" 
      });
    }
    
    const pool = req.app.locals.db;
    
    // Usar a fórmula de Haversine para calcular distância em MySQL
    const query = `
      SELECT 
        *, 
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        (
          6371 * acos(
            cos(radians(?)) * 
            cos(radians(ST_Y(location))) * 
            cos(radians(ST_X(location)) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(ST_Y(location)))
          )
        ) AS distanceFromUser 
      FROM 
        municipios 
      HAVING 
        distanceFromUser <= ? 
      ORDER BY 
        distanceFromUser 
      LIMIT ? OFFSET ?
    `;
    
    const [municipios] = await pool.query(
      query,
      [lat, lng, lat, maxDistance, parseInt(limit), offset]
    );
    
    // Formatar os resultados para manter compatibilidade com o formato MongoDB
    const formattedMunicipios = municipios.map(municipio => ({
      id: municipio.id,
      codigo_ibge: municipio.codigo_ibge,
      nome: municipio.nome,
      capital: municipio.capital === 1,
      codigo_uf: municipio.codigo_uf,
      local: {
        type: "Point",
        coordinates: [parseFloat(municipio.longitude), parseFloat(municipio.latitude)]
      },
      distanceFromUser: municipio.distanceFromUser
    }));
    
    // Contar o total de resultados (sem paginação)
    const countQuery = `
      SELECT 
        COUNT(*) as total
      FROM 
        municipios 
      WHERE
        (
          6371 * acos(
            cos(radians(?)) * 
            cos(radians(ST_Y(location))) * 
            cos(radians(ST_X(location)) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(ST_Y(location)))
          )
        ) <= ?
    `;
    
    const [countResult] = await pool.query(
      countQuery,
      [lat, lng, lat, maxDistance]
    );
    
    const total = countResult[0].total;
    
    res.status(200).json({
      data: formattedMunicipios,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar municípios por distância:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Falha ao buscar municípios por distância',
      details: error.message
    });
  }
};