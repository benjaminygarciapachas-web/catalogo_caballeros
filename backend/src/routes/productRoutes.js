const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { requireAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// GET /api/products - Consulta pública de productos con filtros
router.get('/', ProductController.getAll);

// GET /api/products/:id - Consulta de producto específico
router.get('/:id', ProductController.getById);

// POST /api/products - Crear nuevo producto (Solo Admin + Almacenamiento local de imagen)
router.post('/', requireAdmin, upload.single('image'), ProductController.create);

// PUT /api/products/:id - Actualizar producto (Solo Admin + Almacenamiento local de imagen)
router.put('/:id', requireAdmin, upload.single('image'), ProductController.update);

// DELETE /api/products/:id - Eliminar producto (Solo Admin)
router.delete('/:id', requireAdmin, ProductController.delete);

module.exports = router;
