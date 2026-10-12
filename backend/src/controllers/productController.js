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
        error: error.message || 'Error al obtener productos del catálogo.'
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
        error: error.message || 'Error al obtener el producto.'
      });
    }
  },

  // Crear nuevo producto (Solo Administrador + Subida local de hasta 50 fotos)
  create(req, res) {
    try {
      const {
        code,
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

      // Gestión de múltiples fotos locales (hasta 50 fotos, PROHIBIDO CLOUDINARY)
      let imagesList = [];

      if (req.files) {
        if (Array.isArray(req.files)) {
          imagesList.push(...req.files.map(f => `/uploads/${f.filename}`));
        } else {
          if (req.files.images && Array.isArray(req.files.images)) {
            imagesList.push(...req.files.images.map(f => `/uploads/${f.filename}`));
          }
          if (req.files.image && Array.isArray(req.files.image)) {
            imagesList.push(...req.files.image.map(f => `/uploads/${f.filename}`));
          }
        }
      } else if (req.file) {
        imagesList.push(`/uploads/${req.file.filename}`);
      }

      // Si se envió alguna URL directa de imagen
      if (req.body.image_url && !imagesList.includes(req.body.image_url)) {
        imagesList.push(req.body.image_url);
      }

      // Límite estricto de máximo 50 fotos
      if (imagesList.length > 50) {
        imagesList = imagesList.slice(0, 50);
      }

      if (imagesList.length === 0) {
        imagesList.push('/uploads/sample-camisa-marca.svg');
      }

      const mainImageUrl = imagesList[0];

      const newProduct = ProductModel.create({
        code: code || '',
        title,
        description,
        price,
        original_price,
        image_url: mainImageUrl,
        images: imagesList,
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
        message: 'Producto creado y sincronizado exitosamente con hasta 50 fotos.',
        data: newProduct
      });
    } catch (error) {
      console.error('[PRODUCT ERROR create]', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno al registrar el producto.'
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
        code,
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

      // Recuperar fotos existentes si se enviaron
      let existingImages = [];
      if (req.body.existing_images !== undefined) {
        try {
          existingImages = typeof req.body.existing_images === 'string'
            ? JSON.parse(req.body.existing_images)
            : req.body.existing_images;
          if (!Array.isArray(existingImages)) existingImages = [];
        } catch (e) {
          existingImages = [];
        }
      } else {
        existingImages = existing.images || (existing.image_url ? [existing.image_url] : []);
      }

      // Fotos nuevas subidas
      let newImages = [];
      if (req.files) {
        if (Array.isArray(req.files)) {
          newImages.push(...req.files.map(f => `/uploads/${f.filename}`));
        } else {
          if (req.files.images && Array.isArray(req.files.images)) {
            newImages.push(...req.files.images.map(f => `/uploads/${f.filename}`));
          }
          if (req.files.image && Array.isArray(req.files.image)) {
            newImages.push(...req.files.image.map(f => `/uploads/${f.filename}`));
          }
        }
      } else if (req.file) {
        newImages.push(`/uploads/${req.file.filename}`);
      }

      let combinedImages = [...existingImages, ...newImages];
      if (combinedImages.length > 50) {
        combinedImages = combinedImages.slice(0, 50);
      }

      if (combinedImages.length === 0) {
        combinedImages = [existing.image_url || '/uploads/sample-camisa-marca.svg'];
      }

      const mainImageUrl = combinedImages[0];

      const updatedProduct = ProductModel.update(id, {
        code: code !== undefined ? code : existing.code,
        title,
        description,
        price,
        original_price,
        image_url: mainImageUrl,
        images: combinedImages,
        categoria_id,
        subcategoria_id,
        sizes,
        stock,
        badge
      });

      // SINCRONIZACIÓN EN TIEMPO REAL:
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
        error: error.message || 'Error interno al actualizar el producto.'
      });
    }
  },

  // Eliminar producto (Solo Administrador)
  delete(req, res) {
    try {
      const { id } = req.params;
      ProductModel.delete(id);

      // SINCRONIZACIÓN EN TIEMPO REAL:
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
        error: error.message || 'Error interno al eliminar el producto.'
      });
    }
  }
};

module.exports = ProductController;
