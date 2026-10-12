const db = require('../config/database');

function formatProduct(p) {
  if (!p) return null;
  let parsedImages = [];
  try {
    if (p.images) {
      parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
    }
  } catch (e) {
    parsedImages = [];
  }

  if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
    parsedImages = p.image_url ? [p.image_url] : [];
  }

  return {
    ...p,
    code: p.code || '',
    images: parsedImages
  };
}

const ProductModel = {
  getAll({ categoria_id, subcategoria_id, search, min_price, max_price, tipo_grupo } = {}) {
    let sql = `
      SELECT 
        p.*,
        COALESCE(c.name, 'Ropa') as categoria_name,
        COALESCE(c.slug, 'ropa') as categoria_slug,
        COALESCE(sc.name, 'General') as subcategoria_name,
        COALESCE(sc.slug, 'general') as subcategoria_slug,
        COALESCE(sc.tipo_grupo, 'Normal') as subcategoria_grupo
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(Number(categoria_id));
    }

    if (subcategoria_id) {
      sql += ' AND p.subcategoria_id = ?';
      params.push(Number(subcategoria_id));
    }

    if (tipo_grupo) {
      sql += ' AND sc.tipo_grupo = ?';
      params.push(tipo_grupo);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR sc.name LIKE ? OR p.code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (min_price !== undefined && min_price !== '') {
      sql += ' AND p.price >= ?';
      params.push(Number(min_price));
    }

    if (max_price !== undefined && max_price !== '') {
      sql += ' AND p.price <= ?';
      params.push(Number(max_price));
    }

    sql += ' ORDER BY p.id DESC';

    const rows = db.all(sql, params);
    return rows.map(formatProduct);
  },

  getById(id) {
    const sql = `
      SELECT 
        p.*,
        COALESCE(c.name, 'Ropa') as categoria_name,
        COALESCE(c.slug, 'ropa') as categoria_slug,
        COALESCE(sc.name, 'General') as subcategoria_name,
        COALESCE(sc.slug, 'general') as subcategoria_slug,
        COALESCE(sc.tipo_grupo, 'Normal') as subcategoria_grupo
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE p.id = ?
    `;
    const row = db.get(sql, [Number(id)]);
    return formatProduct(row);
  },

  create({ code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : (images || JSON.stringify([image_url]));
    const cleanCode = code ? String(code).trim() : null;

    const sql = `
      INSERT INTO productos (code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    const res = db.run(sql, [
      cleanCode,
      title,
      description || '',
      Number(price),
      original_price ? Number(original_price) : null,
      image_url,
      imagesStr,
      Number(categoria_id),
      Number(subcategoria_id),
      sizes || 'S, M, L, XL',
      stock !== undefined ? Number(stock) : 10,
      badge || null
    ]);

    return this.getById(res.lastInsertRowid);
  },

  update(id, { code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const existing = this.getById(id);
    if (!existing) return null;

    const cleanCode = code !== undefined ? (code ? String(code).trim() : null) : existing.code;
    const finalImagesStr = images !== undefined 
      ? (Array.isArray(images) ? JSON.stringify(images) : images)
      : (existing.images ? JSON.stringify(existing.images) : JSON.stringify([existing.image_url]));

    const sql = `
      UPDATE productos
      SET code = ?,
          title = ?,
          description = ?,
          price = ?,
          original_price = ?,
          image_url = ?,
          images = ?,
          categoria_id = ?,
          subcategoria_id = ?,
          sizes = ?,
          stock = ?,
          badge = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(sql, [
      cleanCode,
      title !== undefined ? title : existing.title,
      description !== undefined ? description : existing.description,
      price !== undefined ? Number(price) : existing.price,
      original_price !== undefined ? (original_price ? Number(original_price) : null) : existing.original_price,
      image_url !== undefined ? image_url : existing.image_url,
      finalImagesStr,
      categoria_id !== undefined ? Number(categoria_id) : existing.categoria_id,
      subcategoria_id !== undefined ? Number(subcategoria_id) : existing.subcategoria_id,
      sizes !== undefined ? sizes : existing.sizes,
      stock !== undefined ? Number(stock) : existing.stock,
      badge !== undefined ? badge : existing.badge,
      id
    ]);

    return this.getById(id);
  },

  delete(id) {
    const existing = this.getById(id);
    if (!existing) return false;
    db.run('DELETE FROM productos WHERE id = ?', [id]);
    return true;
  }
};

module.exports = ProductModel;
