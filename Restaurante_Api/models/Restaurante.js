const { pool } = require('../config/database');

class Restaurante {
  // Crear nuevo restaurante
  static async create(data) {
    try {
      const {
        nombre,
        descripcion,
        direccion,
        telefono,
        email,
        categoria,
        precio_promedio = '$$',
        imagen,
        horario,
        servicios,
        latitud,
        longitud
      } = data;
      
      const [result] = await pool.execute(
        `INSERT INTO restaurantes 
         (nombre, descripcion, direccion, telefono, email, categoria, precio_promedio, imagen, horario, servicios, latitud, longitud) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre,
          descripcion,
          direccion,
          telefono,
          email,
          categoria,
          precio_promedio,
          imagen,
          horario ? JSON.stringify(horario) : null,
          servicios ? JSON.stringify(servicios) : null,
          latitud,
          longitud
        ]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar restaurante por ID
  static async findById(id) {
    try {
      const [restaurants] = await pool.execute(
        'SELECT * FROM restaurantes WHERE id = ? AND activo = TRUE',
        [id]
      );
      
      if (restaurants[0]) {
        // Parsear campos JSON
        if (restaurants[0].horario) {
          restaurants[0].horario = JSON.parse(restaurants[0].horario);
        }
        if (restaurants[0].servicios) {
          restaurants[0].servicios = JSON.parse(restaurants[0].servicios);
        }
      }
      
      return restaurants[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener todos los restaurantes con filtros
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT r.*, 
               COALESCE(AVG(res.calificacion), 0) as calificacion_promedio,
               COUNT(res.id) as total_resenas
        FROM restaurantes r 
        LEFT JOIN resenas res ON r.id = res.restaurante_id 
        WHERE r.activo = TRUE
      `;
      
      const conditions = [];
      const params = [];
      
      // Filtro por categoría
      if (filters.categoria) {
        conditions.push('r.categoria = ?');
        params.push(filters.categoria);
      }
      
      // Filtro por ubicación (búsqueda en dirección)
      if (filters.ubicacion) {
        conditions.push('r.direccion LIKE ?');
        params.push(`%${filters.ubicacion}%`);
      }
      
      // Filtro por precio
      if (filters.precio_promedio) {
        conditions.push('r.precio_promedio = ?');
        params.push(filters.precio_promedio);
      }
      
      // Filtro por nombre (búsqueda)
      if (filters.nombre) {
        conditions.push('(r.nombre LIKE ? OR r.descripcion LIKE ?)');
        params.push(`%${filters.nombre}%`, `%${filters.nombre}%`);
      }
      
      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY r.id';
      
      // Filtro por calificación mínima
      if (filters.calificacion_min) {
        query += ' HAVING calificacion_promedio >= ?';
        params.push(filters.calificacion_min);
      }
      
      // Ordenamiento
      const orderBy = filters.orderBy || 'calificacion_promedio';
      const orderDirection = filters.orderDirection || 'DESC';
      query += ` ORDER BY ${orderBy} ${orderDirection}`;
      
      // Límite y offset
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [restaurants] = await pool.execute(query, params);
      
      // Parsear campos JSON
      restaurants.forEach(restaurant => {
        if (restaurant.horario) {
          restaurant.horario = JSON.parse(restaurant.horario);
        }
        if (restaurant.servicios) {
          restaurant.servicios = JSON.parse(restaurant.servicios);
        }
        restaurant.calificacion_promedio = parseFloat(restaurant.calificacion_promedio);
      });
      
      return restaurants;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar restaurante
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      const allowedFields = [
        'nombre', 'descripcion', 'direccion', 'telefono', 'email', 
        'categoria', 'precio_promedio', 'imagen', 'horario', 'servicios',
        'latitud', 'longitud'
      ];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'horario' || field === 'servicios') {
            fields.push(`${field} = ?`);
            values.push(JSON.stringify(updateData[field]));
          } else {
            fields.push(`${field} = ?`);
            values.push(updateData[field]);
          }
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const [result] = await pool.execute(
        `UPDATE restaurantes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Restaurante no encontrado');
      }
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // Eliminar restaurante (soft delete)
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE restaurantes SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Actualizar calificación promedio
  static async updateRating(id) {
    try {
      await pool.execute(
        `UPDATE restaurantes r 
         SET calificacion_promedio = (
           SELECT COALESCE(AVG(calificacion), 0) 
           FROM resenas 
           WHERE restaurante_id = r.id
         ),
         total_resenas = (
           SELECT COUNT(*) 
           FROM resenas 
           WHERE restaurante_id = r.id
         )
         WHERE r.id = ?`,
        [id]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener categorías disponibles
  static async getCategories() {
    try {
      const [categories] = await pool.execute(
        'SELECT DISTINCT categoria FROM restaurantes WHERE activo = TRUE ORDER BY categoria'
      );
      
      return categories.map(cat => cat.categoria);
    } catch (error) {
      throw error;
    }
  }
  
  // Búsqueda avanzada
  static async search(searchTerm, filters = {}) {
    try {
      let query = `
        SELECT r.*, 
               COALESCE(AVG(res.calificacion), 0) as calificacion_promedio,
               COUNT(res.id) as total_resenas,
               MATCH(r.nombre, r.descripcion) AGAINST(? IN BOOLEAN MODE) as relevance
        FROM restaurantes r 
        LEFT JOIN resenas res ON r.id = res.restaurante_id 
        WHERE r.activo = TRUE
        AND (
          MATCH(r.nombre, r.descripcion) AGAINST(? IN BOOLEAN MODE)
          OR r.nombre LIKE ?
          OR r.descripcion LIKE ?
          OR r.categoria LIKE ?
        )
      `;
      
      const params = [
        searchTerm,
        searchTerm,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
      ];
      
      // Aplicar filtros adicionales
      if (filters.categoria) {
        query += ' AND r.categoria = ?';
        params.push(filters.categoria);
      }
      
      if (filters.precio_promedio) {
        query += ' AND r.precio_promedio = ?';
        params.push(filters.precio_promedio);
      }
      
      query += ' GROUP BY r.id ORDER BY relevance DESC, calificacion_promedio DESC';
      
      const limit = filters.limit || 20;
      query += ' LIMIT ?';
      params.push(limit);
      
      const [restaurants] = await pool.execute(query, params);
      
      // Parsear campos JSON
      restaurants.forEach(restaurant => {
        if (restaurant.horario) {
          restaurant.horario = JSON.parse(restaurant.horario);
        }
        if (restaurant.servicios) {
          restaurant.servicios = JSON.parse(restaurant.servicios);
        }
        restaurant.calificacion_promedio = parseFloat(restaurant.calificacion_promedio);
      });
      
      return restaurants;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener restaurantes cercanos (si se tienen coordenadas)
  static async findNearby(latitud, longitud, radiusKm = 10, limit = 20) {
    try {
      const query = `
        SELECT r.*, 
               COALESCE(AVG(res.calificacion), 0) as calificacion_promedio,
               COUNT(res.id) as total_resenas,
               (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(r.latitud)) * 
                COS(RADIANS(r.longitud) - RADIANS(?)) + 
                SIN(RADIANS(?)) * SIN(RADIANS(r.latitud)))) AS distancia
        FROM restaurantes r 
        LEFT JOIN resenas res ON r.id = res.restaurante_id 
        WHERE r.activo = TRUE 
        AND r.latitud IS NOT NULL 
        AND r.longitud IS NOT NULL
        GROUP BY r.id
        HAVING distancia <= ?
        ORDER BY distancia ASC
        LIMIT ?
      `;
      
      const [restaurants] = await pool.execute(query, [
        latitud, longitud, latitud, radiusKm, limit
      ]);
      
      // Parsear campos JSON
      restaurants.forEach(restaurant => {
        if (restaurant.horario) {
          restaurant.horario = JSON.parse(restaurant.horario);
        }
        if (restaurant.servicios) {
          restaurant.servicios = JSON.parse(restaurant.servicios);
        }
        restaurant.calificacion_promedio = parseFloat(restaurant.calificacion_promedio);
        restaurant.distancia = parseFloat(restaurant.distancia);
      });
      
      return restaurants;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Restaurante;