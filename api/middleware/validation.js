import { check, param, validationResult } from "express-validator";
import { db } from "../config/db.js"; // Importe o pool de conexões do seu db.js

// Middleware para verificar resultados da validação
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: "Erro de validação",
      errors: errors.array(),
    });
  }
  next();
};

// Validar ID (assumindo que o ID no MySQL é um inteiro)
export const validateId = [
  param("id").isInt({ min: 1 }).withMessage("Formato de ID inválido"),
  validateRequest,
];

// Validações para o município (CREATE)
export const validateMunicipio = [
  // Valida o código IBGE
  check("codigo_ibge")
    .notEmpty()
    .withMessage("O código IBGE é obrigatório")
    .isInt({ min: 1000000, max: 9999999 })
    .withMessage("O código IBGE deve ser um número inteiro de 7 dígitos")
    .custom(async (codigo_ibge, { req }) => {
      try {
        const [rows] = await db.execute(
          "SELECT COUNT(*) AS count FROM municipios WHERE codigo_ibge = ?",
          [codigo_ibge]
        );

        const count = rows[0].count;
        if (count > 0) {
          throw new Error(
            "O código IBGE informado já está cadastrado em outro município"
          );
        }
        return true;
      } catch (error) {
        console.error("Erro ao verificar código IBGE:", error);
        throw error;
      }
    }),

  // Valida o nome do município
  check("nome")
    .notEmpty()
    .withMessage("O nome do município é obrigatório")
    .isLength({ max: 255 })
    .withMessage("O nome do município deve ter no máximo 255 caracteres")
    .matches(/^[A-Za-zÀ-ú\s()\-.,'"!?]+$/, "i")
    .withMessage(
      "O nome do município deve conter apenas letras, espaços e caracteres especiais válidos"
    ),

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

  // Valida a longitude
  check("longitude")
    .notEmpty()
    .withMessage("A longitude é obrigatória")
    .isFloat({ min: -180, max: 180 })
    .withMessage("A longitude deve estar entre -180 e 180"),

  // Valida a latitude
  check("latitude")
    .notEmpty()
    .withMessage("A latitude é obrigatória")
    .isFloat({ min: -90, max: 90 })
    .withMessage("A latitude deve estar entre -90 e 90"),

  // Aplica as validações
  validateRequest,
];

// Validações para atualização parcial do município (PUT/PATCH)
export const validateUpdateMunicipio = [
  // Valida o código IBGE (opcional na atualização)
  check("codigo_ibge")
    .optional()
    .isInt({ min: 1000000, max: 9999999 })
    .withMessage("O código IBGE deve ser um número inteiro de 7 dígitos")
    .custom(async (codigo_ibge, { req }) => {
      if (codigo_ibge) {
        try {
          const [rows] = await db.execute(
            "SELECT COUNT(*) AS count FROM municipios WHERE codigo_ibge = ? AND id != ?",
            [codigo_ibge, req.params.id]
          );
          const count = rows[0].count;
          if (count > 0) {
            throw new Error(
              "O código IBGE informado já está cadastrado em outro município"
            );
          }
          return true;
        } catch (error) {
          console.error("Erro ao verificar código IBGE:", error);
          throw error;
        }
      }
      return true;
    }),

  // Valida o nome do município (opcional na atualização)
  check("nome")
    .optional()
    .isLength({ max: 255 })
    .withMessage("O nome do município deve ter no máximo 255 caracteres")
    .matches(/^[A-Za-zÀ-ú\s()\-.,'\"!?]+$/, "i")
    .withMessage(
      "O nome do município deve conter apenas letras, espaços e caracteres especiais válidos"
    ),

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

  // Valida a longitude (opcional na atualização)
  check("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("A longitude deve estar entre -180 e 180"),

  // Valida a latitude (opcional na atualização)
  check("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("A latitude deve estar entre -90 e 90"),

  // Aplica as validações
  validateRequest,
];