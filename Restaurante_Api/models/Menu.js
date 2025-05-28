const { pool } = require('../config/database');

class Menu {
  // Crear nuevo elemento del menú
  static async create(menuData) {
    try {
      const {
        restaurante_id,
        nombre,
        descripcion = null,
        precio,
        categoria = 'General',
        imagen = null,
        disponible = true,
        ingredientes = null,
        alergenicos = null
      } = menuData;

      const [result] = await pool.execute(
        `INSERT INTO menus (restaurante_id, nombre, descripcion, precio, categoria, imagen, disponible, ingredientes, alergenicos)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          restaurante_id,
          nombre,
          descripcion,
          precio,
          categoria,
          imagen,
          disponible,
          ingredientes ? JSON.stringify(ingredientes) : null,
          alergenicos ? JSON.stringify(alergenicos) : null
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar elemento del menú por ID
  static async findById(id) {
    try {
      const [menus] = await pool.execute(
        `SELECT m.*, r.nombre as restaurante_nombre
         FROM menus m
         JOIN restaurantes r ON m.restaurante_id = r.id
         WHERE m.id = ?`,
        [id]
      );

      if (menus[0]) {
        if (menus[0].ingredientes) {
          menus[0].ingredientes = JSON.parse(menus[0].ingredientes);
        }
        if (menus[0].alergenicos) {
          menus[0].alergenicos = JSON.parse(menus[0].alergenicos);
        }
      }

      return menus[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener menú por restaurante
  static async findByRestaurante(restauranteId, filtros = {}) {
    try {
      let query = `
        SELECT m.*, r.nombre as restaurante_nombre
        FROM menus m
        JOIN restaurantes r ON m.restaurante_id = r.id
        WHERE m.restaurante_id = ?
      `;
      
      const params = [restauranteId];

      if (filtros.categoria) {
        query += ' AND m.categoria = ?';
        params.push(filtros.categoria);
      }

      if (filtros.disponible !== undefined) {
        query += ' AND m.disponible = ?';
        params.push(filtros.disponible);
      }

      // Ordenamiento
      const validOrderBy = ['nombre', 'precio', 'categoria', 'created_at'];
      const orderBy = validOrderBy.includes(filtros.orderBy) ? filtros.orderBy : 'categoria';
      query += ` ORDER BY m.${orderBy}`;

      // Paginación
      const limit = filtros.limit || 50;
      const offset = filtros.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [menus] = await pool.execute(query, params);

      // Parsear JSON fields
      menus.forEach(menu => {
        if (menu.ingredientes) {
          menu.ingredientes = JSON.parse(menu.ingredientes);
        }
        if (menu.alergenicos) {
          menu.alergenicos = JSON.parse(menu.alergenicos);
        }
      });

      // Agrupar por categoría
      const menuPorCategoria = {};
      menus.forEach(menu => {
        if (!menuPorCategoria[menu.categoria]) {
          menuPorCategoria[menu.categoria] = [];
        }
        menuPorCategoria[menu.categoria].push(menu);
      });

      return {
        menus,
        menuPorCategoria,
        total: menus.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Actualizar elemento del menú
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      const allowedFields = ['nombre', 'descripcion', 'precio', 'categoria', 'imagen', 'disponible', 'ingredientes', 'alergenicos'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'ingredientes' || field === 'alergenicos') {
            fields.push(`${field} = ?`);
            values.push(updateData[field] ? JSON.stringify(updateData[field]) : null);
          } else {
            fields.push(`${field} = ?`);
            values.push(updateData[field]);
          }
        }
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);

      const [result] = await pool.execute(
        `UPDATE menus SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Menu no encontrado');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar elemento del menú
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM menus WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Buscar en el menú
  static async search(restauranteId, searchTerm, filtros = {}) {
    try {
      let query = `
        SELECT m.*, r.nombre as restaurante_nombre
        FROM menus m
        JOIN restaurantes r ON m.restaurante_id = r.id
        WHERE m.restaurante_id = ?
        AND (m.nombre LIKE ? OR m.descripcion LIKE ?)
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const params = [restauranteId, searchPattern, searchPattern];

      if (filtros.categoria) {
        query += ' AND m.categoria = ?';
        params.push(filtros.categoria);
      }

      if (filtros.precio_max) {
        query += ' AND m.precio <= ?';
        params.push(filtros.precio_max);
      }

      if (filtros.disponible !== undefined) {
        query += ' AND m.disponible = ?';
        params.push(filtros.disponible);
      }

      query += ' ORDER BY m.nombre';

      const [menus] = await pool.execute(query, params);

      menus.forEach(menu => {
        if (menu.ingredientes) {
          menu.ingredientes = JSON.parse(menu.ingredientes);
        }
        if (menu.alergenicos) {
          menu.alergenicos = JSON.parse(menu.alergenicos);
        }
      });

      return menus;
    } catch (error) {
      throw error;
    }
  }

  // Obtener categorías de menú por restaurante
  static async getCategoriasByRestaurante(restauranteId) {
    try {
      const [categorias] = await pool.execute(
        'SELECT DISTINCT categoria FROM menus WHERE restaurante_id = ? ORDER BY categoria',
        [restauranteId]
      );

      return categorias.map(cat => cat.categoria);
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas del menú
  static async getEstadisticas(restauranteId) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
           COUNT(*) as total_elementos,
           COUNT(CASE WHEN disponible = 1 THEN 1 END) as disponibles,
           COUNT(DISTINCT categoria) as total_categorias,
           AVG(precio) as precio_promedio,
           MIN(precio) as precio_minimo,
           MAX(precio) as precio_maximo
         FROM menus 
         WHERE restaurante_id = ?`,
        [restauranteId]
      );

      const resultado = stats[0];
      resultado.precio_promedio = parseFloat(resultado.precio_promedio) || 0;
      resultado.precio_minimo = parseFloat(resultado.precio_minimo) || 0;
      resultado.precio_maximo = parseFloat(resultado.precio_maximo) || 0;

      return resultado;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Menu;