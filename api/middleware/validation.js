import { check, param, validationResult } from "express-validator"
import { ObjectId } from "mongodb"

// Middleware para verificar resultados da validação
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: "Erro de validação",
      errors: errors.array(),
    })
  }
  next()
}

// Validar ObjectId
export const validateObjectId = [param("id").isMongoId().withMessage("Formato de ID inválido"), validateRequest]

// Validações para o município
export const validateMunicipio = [
  // Valida o código IBGE
  check("codigo_ibge")
    .notEmpty()
    .withMessage("O código IBGE é obrigatório")
    .isInt({ min: 1000000, max: 9999999 })
    .withMessage("O código IBGE deve ser um número inteiro de 7 dígitos")
    .custom(async (codigo_ibge, { req }) => {
      const db = req.app.locals.db

      // Monta a query para verificar a unicidade
      const query = { codigo_ibge }
      if (req.method === "PUT" && req.params.id) {
        // Exclui o registro atual da verificação de unicidade
        query["_id"] = { $ne: new ObjectId(req.params.id) }
      }

      // Verifica se existe algum registro com o mesmo código IBGE
      const existe = await db.collection("municipios").countDocuments(query)
      if (existe > 0) {
        throw new Error("O código IBGE informado já está cadastrado em outro município")
      }
      return true
    }),

  // Valida o nome do município
  check("nome")
    .notEmpty()
    .withMessage("O nome do município é obrigatório")
    .isLength({ max: 100 })
    .withMessage("O nome do município deve ter no máximo 100 caracteres")
    .matches(/^[A-Za-zÀ-ú\s()\-.,'"!?]+$/, "i")
    .withMessage("O nome do município deve conter apenas letras, espaços e caracteres especiais válidos"),

  // Valida o campo capital
  check("capital")
    .isBoolean()
    .withMessage("O campo capital deve ser um valor booleano"),

  // Valida o código UF
  check("codigo_uf")
    .notEmpty()
    .withMessage("O código UF é obrigatório")
    .isInt({ min: 1, max: 99 })
    .withMessage("O código UF deve ser um número inteiro entre 1 e 99"),

  // Valida o objeto local
  check("local")
    .notEmpty()
    .withMessage("O campo local é obrigatório")
    .isObject()
    .withMessage("O campo local deve ser um objeto"),

  // Valida o tipo do local
  check("local.type")
    .notEmpty()
    .withMessage("O tipo do local é obrigatório")
    .equals("Point")
    .withMessage('O tipo do local deve ser "Point"'),

  // Valida as coordenadas
  check("local.coordinates")
    .notEmpty()
    .withMessage("As coordenadas são obrigatórias")
    .isArray({ min: 2, max: 2 })
    .withMessage("As coordenadas devem ser um array com exatamente 2 elementos"),

  // Valida a longitude (primeiro elemento das coordenadas)
  check("local.coordinates.0")
    .isFloat({ min: -180, max: 180 })
    .withMessage("A longitude deve estar entre -180 e 180"),

  // Valida a latitude (segundo elemento das coordenadas)
  check("local.coordinates.1")
    .isFloat({ min: -90, max: 90 })
    .withMessage("A latitude deve estar entre -90 e 90"),

  // Aplica as validações
  validateRequest,
]

// Validações para atualização parcial do município (PUT/PATCH)
export const validateUpdateMunicipio = [
  // Valida o código IBGE (opcional na atualização)
  check("codigo_ibge")
    .optional()
    .isInt({ min: 1000000, max: 9999999 })
    .withMessage("O código IBGE deve ser um número inteiro de 7 dígitos")
    .custom(async (codigo_ibge, { req }) => {
      const db = req.app.locals.db

      // Monta a query para verificar a unicidade
      const query = { codigo_ibge }
      if (req.params.id) {
        // Exclui o registro atual da verificação de unicidade
        query["_id"] = { $ne: new ObjectId(req.params.id) }
      }

      // Verifica se existe algum registro com o mesmo código IBGE
      const existe = await db.collection("municipios").countDocuments(query)
      if (existe > 0) {
        throw new Error("O código IBGE informado já está cadastrado em outro município")
      }
      return true
    }),

  // Valida o nome do município (opcional na atualização)
  check("nome")
    .optional()
    .isLength({ max: 100 })
    .withMessage("O nome do município deve ter no máximo 100 caracteres")
    .matches(/^[A-Za-zÀ-ú\s()\-.,'"!?]+$/, "i")
    .withMessage("O nome do município deve conter apenas letras, espaços e caracteres especiais válidos"),

  // Valida o campo capital (opcional na atualização)
  check("capital")
    .optional()
    .isBoolean()
    .withMessage("O campo capital deve ser um valor booleano"),

  // Valida o código UF (opcional na atualização)
  check("codigo_uf")
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage("O código UF deve ser um número inteiro entre 1 e 99"),

  // Valida o objeto local (opcional na atualização)
  check("local")
    .optional()
    .isObject()
    .withMessage("O campo local deve ser um objeto"),

  // Valida o tipo do local (opcional na atualização)
  check("local.type")
    .optional()
    .equals("Point")
    .withMessage('O tipo do local deve ser "Point"'),

  // Valida as coordenadas (opcional na atualização)
  check("local.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("As coordenadas devem ser um array com exatamente 2 elementos"),

  // Valida a longitude (primeiro elemento das coordenadas) (opcional na atualização)
  check("local.coordinates.0")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("A longitude deve estar entre -180 e 180"),

  // Valida a latitude (segundo elemento das coordenadas) (opcional na atualização)
  check("local.coordinates.1")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("A latitude deve estar entre -90 e 90"),

  // Aplica as validações
  validateRequest,
]

