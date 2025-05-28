const { pool } = require('../config/database');

class Resena {
  // Crear nueva reseña
  static async create(resenaData) {
    try {
      const {
        usuario_id,
        restaurante_id,
        calificacion,
        comentario,
        fecha_visita = null,
        imagenes = null
      } = resenaData;

      const [result] = await pool.execute(
        `INSERT INTO resenas (usuario_id, restaurante_id, calificacion, comentario, fecha_visita, imagenes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          usuario_id,
          restaurante_id,
          calificacion,
          comentario,
          fecha_visita,
          imagenes ? JSON.stringify(imagenes) : null
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya has reseñado este restaurante');
      }
      throw error;
    }
  }

  // Buscar reseña por ID
  static async findById(id) {
    try {
      const [resenas] = await pool.execute(
        `SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
                res.nombre as restaurante_nombre
         FROM resenas r
         JOIN usuarios u ON r.usuario_id = u.id
         JOIN restaurantes res ON r.restaurante_id = res.id
         WHERE r.id = ?`,
        [id]
      );

      if (resenas[0] && resenas[0].imagenes) {
        resenas[0].imagenes = JSON.parse(resenas[0].imagenes);
      }

      return resenas[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener reseñas por restaurante
  static async findByRestaurante(restauranteId, limit = 20, offset = 0) {
    try {
      const [resenas] = await pool.execute(
        `SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar
         FROM resenas r
         JOIN usuarios u ON r.usuario_id = u.id
         WHERE r.restaurante_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [restauranteId, limit, offset]
      );

      // Parsear imágenes JSON
      resenas.forEach(resena => {
        if (resena.imagenes) {
          resena.imagenes = JSON.parse(resena.imagenes);
        }
      });

      // Obtener total de reseñas
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM resenas WHERE restaurante_id = ?',
        [restauranteId]
      );

      return {
        resenas,
        total: countResult[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener reseñas por usuario
  static async findByUsuario(usuarioId, limit = 20, offset = 0) {
    try {
      const [resenas] = await pool.execute(
        `SELECT r.*, res.nombre as restaurante_nombre, res.imagen as restaurante_imagen
         FROM resenas r
         JOIN restaurantes res ON r.restaurante_id = res.id
         WHERE r.usuario_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [usuarioId, limit, offset]
      );

      resenas.forEach(resena => {
        if (resena.imagenes) {
          resena.imagenes = JSON.parse(resena.imagenes);
        }
      });

      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM resenas WHERE usuario_id = ?',
        [usuarioId]
      );

      return {
        resenas,
        total: countResult[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  // Actualizar reseña
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.calificacion !== undefined) {
        fields.push('calificacion = ?');
        values.push(updateData.calificacion);
      }
      
      if (updateData.comentario !== undefined) {
        fields.push('comentario = ?');
        values.push(updateData.comentario);
      }
      
      if (updateData.fecha_visita !== undefined) {
        fields.push('fecha_visita = ?');
        values.push(updateData.fecha_visita);
      }
      
      if (updateData.imagenes !== undefined) {
        fields.push('imagenes = ?');
        values.push(updateData.imagenes ? JSON.stringify(updateData.imagenes) : null);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);

      const [result] = await pool.execute(
        `UPDATE resenas SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Reseña no encontrada');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar reseña
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM resenas WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si un usuario ya reseñó un restaurante
  static async existeResena(usuarioId, restauranteId) {
    try {
      const [resenas] = await pool.execute(
        'SELECT id FROM resenas WHERE usuario_id = ? AND restaurante_id = ?',
        [usuarioId, restauranteId]
      );

      return resenas.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de reseñas por restaurante
  static async getEstadisticasRestaurante(restauranteId) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
           COUNT(*) as total_resenas,
           AVG(calificacion) as calificacion_promedio,
           COUNT(CASE WHEN calificacion = 5 THEN 1 END) as cinco_estrellas,
           COUNT(CASE WHEN calificacion = 4 THEN 1 END) as cuatro_estrellas,
           COUNT(CASE WHEN calificacion = 3 THEN 1 END) as tres_estrellas,
           COUNT(CASE WHEN calificacion = 2 THEN 1 END) as dos_estrellas,
           COUNT(CASE WHEN calificacion = 1 THEN 1 END) as una_estrella
         FROM resenas 
         WHERE restaurante_id = ?`,
        [restauranteId]
      );

      const resultado = stats[0];
      resultado.calificacion_promedio = parseFloat(resultado.calificacion_promedio) || 0;

      return resultado;
    } catch (error) {
      throw error;
    }
  }

  // Obtener reseñas recientes del sistema
  static async getRecientes(limit = 10) {
    try {
      const [resenas] = await pool.execute(
        `SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
                res.nombre as restaurante_nombre, res.imagen as restaurante_imagen
         FROM resenas r
         JOIN usuarios u ON r.usuario_id = u.id
         JOIN restaurantes res ON r.restaurante_id = res.id
         ORDER BY r.created_at DESC
         LIMIT ?`,
        [limit]
      );

      resenas.forEach(resena => {
        if (resena.imagenes) {
          resena.imagenes = JSON.parse(resena.imagenes);
        }
      });

      return resenas;
    } catch (error) {
      throw error;
    }
  }

  // Buscar reseñas con filtros
  static async findWithFilters(filtros = {}) {
    try {
      let query = `
        SELECT r.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar,
               res.nombre as restaurante_nombre, res.imagen as restaurante_imagen
        FROM resenas r
        JOIN usuarios u ON r.usuario_id = u.id
        JOIN restaurantes res ON r.restaurante_id = res.id
        WHERE 1=1
      `;
      
      const params = [];

      if (filtros.calificacion_min) {
        query += ' AND r.calificacion >= ?';
        params.push(filtros.calificacion_min);
      }

      if (filtros.calificacion_max) {
        query += ' AND r.calificacion <= ?';
        params.push(filtros.calificacion_max);
      }

      if (filtros.fecha_desde) {
        query += ' AND r.created_at >= ?';
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        query += ' AND r.created_at <= ?';
        params.push(filtros.fecha_hasta);
      }

      if (filtros.categoria) {
        query += ' AND res.categoria = ?';
        params.push(filtros.categoria);
      }

      if (filtros.verified !== undefined) {
        query += ' AND r.verified = ?';
        params.push(filtros.verified);
      }

      query += ' ORDER BY r.created_at DESC';

      const limit = filtros.limit || 20;
      const offset = filtros.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [resenas] = await pool.execute(query, params);

      resenas.forEach(resena => {
        if (resena.imagenes) {
          resena.imagenes = JSON.parse(resena.imagenes);
        }
      });

      return resenas;
    } catch (error) {
      throw error;
    }
  }

  // Marcar reseña como verificada (para admin)
  static async marcarComoVerificada(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE resenas SET verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Resena;