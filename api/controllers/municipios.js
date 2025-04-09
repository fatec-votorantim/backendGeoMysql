// Get all municipios with optional pagination and sorting
export const getMunicipios = async (req, res) => {
  try {
    const { page = 1, limit = 10, nome, sort = 'nome', order = 'asc' } = req.query;
    const offset = (page - 1) * limit;

    const pool = req.app.locals.db;

    // Construir a consulta base
    let query = 'SELECT * FROM municipios';
    const queryParams = [];

    // Adicionar filtro por nome se fornecido
    if (nome) {
      query += ' WHERE nome LIKE ?';
      queryParams.push(`%${nome}%`);
    }

    // Adicionar ordenação
    const validColumns = ['id', 'codigo_ibge', 'nome', 'capital', 'codigo_uf', 'longitude', 'latitude'];
    const sortColumn = validColumns.includes(sort) ? sort : 'nome';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    // Adicionar paginação
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    // Executar a consulta
    const [rows] = await pool.query(query, queryParams);

    // Formatar os resultados para manter compatibilidade com o formato MongoDB (opcional agora)
    const formattedRows = rows.map(row => ({
      id: row.id,
      codigo_ibge: row.codigo_ibge,
      nome: row.nome,
      capital: row.capital === 1,
      codigo_uf: row.codigo_uf,
      longitude: parseFloat(row.longitude),
      latitude: parseFloat(row.latitude),
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
      'SELECT * FROM municipios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Município não encontrado' });
    }

    const municipio = {
      id: rows[0].id,
      codigo_ibge: rows[0].codigo_ibge,
      nome: rows[0].nome,
      capital: rows[0].capital === 1,
      codigo_uf: rows[0].codigo_uf,
      longitude: parseFloat(rows[0].longitude),
      latitude: parseFloat(rows[0].latitude),
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
    const { codigo_ibge, nome, capital, codigo_uf, longitude, latitude } = req.body;
    const pool = req.app.locals.db;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({
        error: true,
        message: 'As coordenadas de longitude e latitude são obrigatórias'
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

    // Inserir novo município usando longitude e latitude diretamente
    const [result] = await pool.query(
      'INSERT INTO municipios (codigo_ibge, nome, capital, codigo_uf, longitude, latitude) VALUES (?, ?, ?, ?, ?, ?)',
      [
        codigo_ibge,
        nome,
        capital ? 1 : 0,
        codigo_uf,
        longitude,
        latitude
      ]
    );

    // Buscar o município recém-criado
    const [newMunicipio] = await pool.query(
      'SELECT * FROM municipios WHERE id = ?',
      [result.insertId]
    );

    const formattedMunicipio = {
      id: newMunicipio[0].id,
      codigo_ibge: newMunicipio[0].codigo_ibge,
      nome: newMunicipio[0].nome,
      capital: newMunicipio[0].capital === 1,
      codigo_uf: newMunicipio[0].codigo_uf,
      longitude: parseFloat(newMunicipio[0].longitude),
      latitude: parseFloat(newMunicipio[0].latitude),
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
    const { codigo_ibge, nome, capital, codigo_uf, longitude, latitude } = req.body;
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

    if (longitude !== undefined) {
      updates.push('longitude = ?');
      queryParams.push(longitude);
    }

    if (latitude !== undefined) {
      updates.push('latitude = ?');
      queryParams.push(latitude);
    }

    // Se não houver atualizações, retornar o município atual
    if (updates.length === 0) {
      const [municipio] = await pool.query(
        'SELECT * FROM municipios WHERE id = ?',
        [id]
      );

      return res.status(200).json({
        id: municipio[0].id,
        codigo_ibge: municipio[0].codigo_ibge,
        nome: municipio[0].nome,
        capital: municipio[0].capital === 1,
        codigo_uf: municipio[0].codigo_uf,
        longitude: parseFloat(municipio[0].longitude),
        latitude: parseFloat(municipio[0].latitude),
      });
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
      'SELECT * FROM municipios WHERE id = ?',
      [id]
    );

    res.status(200).json({
      id: updatedMunicipio[0].id,
      codigo_ibge: updatedMunicipio[0].codigo_ibge,
      nome: updatedMunicipio[0].nome,
      capital: updatedMunicipio[0].capital === 1,
      codigo_uf: updatedMunicipio[0].codigo_uf,
      longitude: parseFloat(updatedMunicipio[0].longitude),
      latitude: parseFloat(updatedMunicipio[0].latitude),
    });
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