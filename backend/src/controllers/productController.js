const ProductModel = require('../models/productModel');

const ProductController = {
  // Obtener catálogo de productos con filtros
  getAll(req, res) {
    try {
      const { categoria_id, subcategoria_id, tipo_grupo, search, min_price, max_price } = req.query;

      const products = ProductModel.getAll({
        categoria_id,
        subcategoria_id,
        tipo_grupo,
        search,
        min_price,
        max_price
      });

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      console.error('[PRODUCT ERROR getAll]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener productos del catálogo.'
      });
    }
  },

  // Obtener producto individual por ID
  getById(req, res) {
    try {
      const { id } = req.params;
      const product = ProductModel.getById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado.'
        });
      }

      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('[PRODUCT ERROR getById]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener el producto.'
      });
    }
  },

  // Crear nuevo producto (Solo Administrador + Subida local de imágenes)
  create(req, res) {
    try {
      const {
        title,
        description,
        price,
        original_price,
        categoria_id,
        subcategoria_id,
        sizes,
        stock,
        badge
      } = req.body;

      if (!title || !price || !categoria_id || !subcategoria_id) {
        return res.status(400).json({
          success: false,
          error: 'Los campos título, precio, categoría y subcategoría son obligatorios.'
        });
      }

      // Gestión de imagen local en el servidor (PROHIBIDO CLOUDINARY)
      let imageUrl = '/uploads/sample-camisa-marca.svg';
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url;
      }

      const newProduct = ProductModel.create({
        title,
        description,
        price,
        original_price,
        image_url: imageUrl,
        categoria_id,
        subcategoria_id,
        sizes,
        stock,
        badge
      });

      // SINCRONIZACIÓN EN TIEMPO REAL:
      // Cuando el admin suba un producto, todos los clientes lo ven al instante
      if (req.io) {
        req.io.emit('product_created', newProduct);
        req.io.emit('catalog_changed', { action: 'create', product: newProduct });
        console.log(`📡 [SOCKET] Evento product_created emitido: ID ${newProduct.id}`);
      }

      return res.status(201).json({
        success: true,
        message: 'Producto creado y sincronizado exitosamente.',
        data: newProduct
      });
    } catch (error) {
      console.error('[PRODUCT ERROR create]', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno al registrar el producto.'
      });
    }
  },

  // Editar producto existente (Solo Administrador)
  update(req, res) {
    try {
      const { id } = req.params;
      const existing = ProductModel.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado.'
        });
      }

      const {
        title,
        description,
        price,
        original_price,
        categoria_id,
        subcategoria_id,
        sizes,
        stock,
        badge
      } = req.body;

      // Si subieron una nueva foto localmente
      let imageUrl = existing.image_url;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url;
      }

      const updatedProduct = ProductModel.update(id, {
        title,
        description,
        price,
        original_price,
        image_url: imageUrl,
        categoria_id,
        subcategoria_id,
        sizes,
        stock,
        badge
      });

      // SINCRONIZACIÓN EN TIEMPO REAL:
      // Cuando el admin edite un producto, todos los clientes conectados ven el cambio
      if (req.io) {
        req.io.emit('product_updated', updatedProduct);
        req.io.emit('catalog_changed', { action: 'update', product: updatedProduct });
        console.log(`📡 [SOCKET] Evento product_updated emitido: ID ${updatedProduct.id}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Producto actualizado y sincronizado en tiempo real.',
        data: updatedProduct
      });
    } catch (error) {
      console.error('[PRODUCT ERROR update]', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno al actualizar el producto.'
      });
    }
  },

  // Eliminar producto (Solo Administrador)
  delete(req, res) {
    try {
      const { id } = req.params;
      const existing = ProductModel.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado.'
        });
      }

      ProductModel.delete(id);

      // SINCRONIZACIÓN EN TIEMPO REAL:
      // Cuando el admin elimina un producto, se remueve de las pantallas de los clientes al instante
      if (req.io) {
        req.io.emit('product_deleted', { id: Number(id) });
        req.io.emit('catalog_changed', { action: 'delete', productId: Number(id) });
        console.log(`📡 [SOCKET] Evento product_deleted emitido: ID ${id}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Producto eliminado y sincronizado en tiempo real.',
        id: Number(id)
      });
    } catch (error) {
      console.error('[PRODUCT ERROR delete]', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno al eliminar el producto.'
      });
    }
  }
};

module.exports = ProductController;
