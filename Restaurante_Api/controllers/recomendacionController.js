const { pool } = require('../config/database');

class RecomendacionController {
  // Obtener recomendaciones personalizadas
  static async obtenerPersonalizadas(req, res) {
    try {
      const usuario_id = req.user.userId;
      const { limit = 10 } = req.query;

      // Obtener recomendaciones basadas en reseñas previas del usuario
      const [recomendaciones] = await pool.execute(
        `SELECT DISTINCT r.*, 
                AVG(rev.calificacion) as calificacion_promedio,
                COUNT(rev.id) as total_resenas
         FROM restaurantes r
         LEFT JOIN resenas rev ON r.id = rev.restaurante_id
         WHERE r.categoria IN (
           SELECT DISTINCT res.categoria 
           FROM resenas re
           JOIN restaurantes res ON re.restaurante_id = res.id
           WHERE re.usuario_id = ? AND re.calificacion >= 4
         )
         AND r.id NOT IN (
           SELECT restaurante_id FROM resenas WHERE usuario_id = ?
         )
         AND r.activo = TRUE
         GROUP BY r.id
         ORDER BY calificacion_promedio DESC, total_resenas DESC
         LIMIT ?`,
        [usuario_id, usuario_id, parseInt(limit)]
      );

      res.json({
        success: true,
        data: recomendaciones,
        message: 'Recomendaciones basadas en tus gustos'
      });

    } catch (error) {
      console.error('Error al obtener recomendaciones personalizadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener restaurantes populares
  static async obtenerPopulares(req, res) {
    try {
      const { limit = 10 } = req.query;

      const [populares] = await pool.execute(
        `SELECT r.*, 
                AVG(rev.calificacion) as calificacion_promedio,
                COUNT(rev.id) as total_resenas
         FROM restaurantes r
         LEFT JOIN resenas rev ON r.id = rev.restaurante_id
         WHERE r.activo = TRUE
         GROUP BY r.id
         HAVING COUNT(rev.id) >= 5
         ORDER BY calificacion_promedio DESC, total_resenas DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      res.json({
        success: true,
        data: populares,
        message: 'Restaurantes más populares'
      });

    } catch (error) {
      console.error('Error al obtener restaurantes populares:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener restaurantes cercanos
  static async obtenerCercanas(req, res) {
    try {
      const usuario_id = req.user.userId;
      const { latitud, longitud, radio = 5, limit = 10 } = req.query;

      if (!latitud || !longitud) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      const [cercanos] = await pool.execute(
        `SELECT r.*, 
                AVG(rev.calificacion) as calificacion_promedio,
                COUNT(rev.id) as total_resenas,
                (6371 * acos(cos(radians(?)) * cos(radians(r.latitud)) * 
                cos(radians(r.longitud) - radians(?)) + sin(radians(?)) * 
                sin(radians(r.latitud)))) AS distancia
         FROM restaurantes r
         LEFT JOIN resenas rev ON r.id = rev.restaurante_id
         WHERE r.activo = TRUE 
         AND r.latitud IS NOT NULL 
         AND r.longitud IS NOT NULL
         GROUP BY r.id
         HAVING distancia <= ?
         ORDER BY distancia ASC, calificacion_promedio DESC
         LIMIT ?`,
        [
          parseFloat(latitud), 
          parseFloat(longitud), 
          parseFloat(latitud), 
          parseFloat(radio), 
          parseInt(limit)
        ]
      );

      res.json({
        success: true,
        data: cercanos,
        message: 'Restaurantes cercanos a tu ubicación'
      });

    } catch (error) {
      console.error('Error al obtener restaurantes cercanos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener restaurantes similares
  static async obtenerSimilares(req, res) {
    try {
      const { restauranteId } = req.params;
      const { limit = 5 } = req.query;

      // Obtener información del restaurante base
      const [restaurante] = await pool.execute(
        'SELECT categoria, precio_promedio FROM restaurantes WHERE id = ?',
        [restauranteId]
      );

      if (restaurante.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      const { categoria, precio_promedio } = restaurante[0];

      // Buscar restaurantes similares
      const [similares] = await pool.execute(
        `SELECT r.*, 
                AVG(rev.calificacion) as calificacion_promedio,
                COUNT(rev.id) as total_resenas
         FROM restaurantes r
         LEFT JOIN resenas rev ON r.id = rev.restaurante_id
         WHERE r.categoria = ? 
         AND r.precio_promedio = ? 
         AND r.id != ?
         AND r.activo = TRUE
         GROUP BY r.id
         ORDER BY calificacion_promedio DESC, total_resenas DESC
         LIMIT ?`,
        [categoria, precio_promedio, restauranteId, parseInt(limit)]
      );

      res.json({
        success: true,
        data: similares,
        message: 'Restaurantes similares'
      });

    } catch (error) {
      console.error('Error al obtener restaurantes similares:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = RecomendacionController;