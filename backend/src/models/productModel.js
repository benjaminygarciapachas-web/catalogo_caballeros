const db = require('../config/database');

const ProductModel = {
  getAll({ categoria_id, subcategoria_id, search, min_price, max_price, tipo_grupo } = {}) {
    let sql = `
      SELECT 
        p.*,
        c.name as categoria_name,
        c.slug as categoria_slug,
        sc.name as subcategoria_name,
        sc.slug as subcategoria_slug,
        sc.tipo_grupo as subcategoria_grupo
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    if (subcategoria_id) {
      sql += ' AND p.subcategoria_id = ?';
      params.push(subcategoria_id);
    }

    if (tipo_grupo) {
      sql += ' AND sc.tipo_grupo = ?';
      params.push(tipo_grupo);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR sc.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
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

    return db.all(sql, params);
  },

  getById(id) {
    const sql = `
      SELECT 
        p.*,
        c.name as categoria_name,
        c.slug as categoria_slug,
        sc.name as subcategoria_name,
        sc.slug as subcategoria_slug,
        sc.tipo_grupo as subcategoria_grupo
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE p.id = ?
    `;
    return db.get(sql, [id]);
  },

  create({ title, description, price, original_price, image_url, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const sql = `
      INSERT INTO productos (title, description, price, original_price, image_url, categoria_id, subcategoria_id, sizes, stock, badge, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    const res = db.run(sql, [
      title,
      description || '',
      Number(price),
      original_price ? Number(original_price) : null,
      image_url,
      Number(categoria_id),
      Number(subcategoria_id),
      sizes || 'S, M, L, XL',
      stock !== undefined ? Number(stock) : 10,
      badge || null
    ]);

    return this.getById(res.lastInsertRowid);
  },

  update(id, { title, description, price, original_price, image_url, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const existing = this.getById(id);
    if (!existing) return null;

    const sql = `
      UPDATE productos
      SET title = ?,
          description = ?,
          price = ?,
          original_price = ?,
          image_url = ?,
          categoria_id = ?,
          subcategoria_id = ?,
          sizes = ?,
          stock = ?,
          badge = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(sql, [
      title !== undefined ? title : existing.title,
      description !== undefined ? description : existing.description,
      price !== undefined ? Number(price) : existing.price,
      original_price !== undefined ? (original_price ? Number(original_price) : null) : existing.original_price,
      image_url !== undefined ? image_url : existing.image_url,
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
