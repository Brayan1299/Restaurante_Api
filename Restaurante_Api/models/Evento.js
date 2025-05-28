const { pool } = require('../config/database');

class Evento {
  // Crear nuevo evento
  static async create(eventoData) {
    try {
      const {
        titulo,
        descripcion = null,
        fecha_inicio,
        fecha_fin = null,
        ubicacion,
        precio,
        capacidad_maxima,
        imagen = null,
        restaurante_id = null,
        categoria = null
      } = eventoData;

      const [result] = await pool.execute(
        `INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, precio, capacidad_maxima, imagen, restaurante_id, categoria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, precio, capacidad_maxima, imagen, restaurante_id, categoria]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar evento por ID
  static async findById(id) {
    try {
      const [eventos] = await pool.execute(
        `SELECT e.*, r.nombre as restaurante_nombre
         FROM eventos e
         LEFT JOIN restaurantes r ON e.restaurante_id = r.id
         WHERE e.id = ?`,
        [id]
      );

      return eventos[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los eventos activos
  static async findAll(filtros = {}) {
    try {
      let query = `
        SELECT e.*, r.nombre as restaurante_nombre
        FROM eventos e
        LEFT JOIN restaurantes r ON e.restaurante_id = r.id
        WHERE e.activo = TRUE
      `;

      const params = [];

      if (filtros.categoria) {
        query += ' AND e.categoria = ?';
        params.push(filtros.categoria);
      }

      if (filtros.fecha_desde) {
        query += ' AND e.fecha_inicio >= ?';
        params.push(filtros.fecha_desde);
      }

      if (filtros.precio_max) {
        query += ' AND e.precio <= ?';
        params.push(filtros.precio_max);
      }

      query += ' ORDER BY e.fecha_inicio ASC';

      const limit = filtros.limit || 20;
      const offset = filtros.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [eventos] = await pool.execute(query, params);
      return eventos;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar evento
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      const allowedFields = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'ubicacion', 'precio', 'capacidad_maxima', 'imagen', 'categoria'];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);

      const [result] = await pool.execute(
        `UPDATE eventos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Evento no encontrado');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar evento (soft delete)
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE eventos SET activo = FALSE WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verificar disponibilidad
  static async verificarDisponibilidad(id) {
    try {
      const evento = await this.findById(id);
      if (!evento) {
        throw new Error('Evento no encontrado');
      }

      const vendidos = await this.contarTicketsVendidos(id);
      return vendidos < evento.max_participantes;

    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      throw error;
    }
  }

  // Buscar eventos por restaurante
  static async findByRestaurant(restauranteId) {
    try {
      const query = `
        SELECT e.*, r.nombre as restaurante_nombre
        FROM eventos e
        JOIN restaurantes r ON e.restaurante_id = r.id
        WHERE e.restaurante_id = ?
        AND e.fecha >= CURDATE()
        ORDER BY e.fecha ASC
      `;

      const [rows] = await pool.execute(query, [restauranteId]);
      return rows;

    } catch (error) {
      console.error('Error al buscar eventos por restaurante:', error);
      throw error;
    }
  }

  // Incrementar tickets vendidos
  static async incrementarTicketsVendidos(id, cantidad = 1) {
    try {
      const [result] = await pool.execute(
        'UPDATE eventos SET tickets_vendidos = tickets_vendidos + ? WHERE id = ?',
        [cantidad, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Evento;