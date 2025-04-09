import express from "express"
import {
getMunicipios,
getMunicipioById,
createMunicipio,
updateMunicipio,
deleteMunicipio
} from "../controllers/municipios.js"
import { validateMunicipio, validateUpdateMunicipio, validateId } from "../middleware/validation.js"

const router = express.Router()

// Get all municipios
router.get("/", getMunicipios)

// Get municipio by ID
router.get("/:id", validateId, getMunicipioById)

// Create new municipio
router.post("/", validateMunicipio, createMunicipio)

// Update municipio
router.put("/:id", validateId, validateUpdateMunicipio, updateMunicipio)

// Delete municipio
router.delete("/:id", validateId, deleteMunicipio)

export default router
