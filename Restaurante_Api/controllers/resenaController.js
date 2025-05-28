const { validationResult } = require('express-validator');
const Resena = require('../models/Resena');
const Restaurante = require('../models/Restaurante');
const { enviarNotificacion } = require('../services/notificationService');

class ResenaController {
  // Crear nueva reseña
  static async crear(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { restaurante_id, calificacion, comentario, fecha_visita, imagenes } = req.body;
      const usuario_id = req.user.userId;

      // Verificar si el restaurante existe
      const restaurante = await Restaurante.findById(restaurante_id);
      if (!restaurante) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      // Verificar si el usuario ya reseñó este restaurante
      const existeResena = await Resena.existeResena(usuario_id, restaurante_id);
      if (existeResena) {
        return res.status(409).json({
          success: false,
          message: 'Ya has reseñado este restaurante'
        });
      }

      // Crear la reseña
      const resena = await Resena.create({
        usuario_id,
        restaurante_id,
        calificacion,
        comentario,
        fecha_visita,
        imagenes
      });

      // Actualizar calificación promedio del restaurante
      await Restaurante.updateRating(restaurante_id);

      // Enviar notificación al usuario
      await enviarNotificacion(usuario_id, {
        titulo: '¡Reseña publicada!',
        mensaje: `Tu reseña de ${calificacion} estrellas para ${restaurante.nombre} ha sido publicada exitosamente.`,
        tipo: 'success',
        url: `/restaurantes/${restaurante_id}`
      });

      res.status(201).json({
        success: true,
        message: 'Reseña creada exitosamente',
        data: resena
      });

    } catch (error) {
      console.error('Error al crear reseña:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // Obtener reseñas por restaurante
  static async obtenerPorRestaurante(req, res) {
    try {
      const { restauranteId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const resultado = await Resena.findByRestaurante(
        restauranteId, 
        parseInt(limit), 
        parseInt(offset)
      );

      // Obtener estadísticas del restaurante
      const estadisticas = await Resena.getEstadisticasRestaurante(restauranteId);

      res.json({
        success: true,
        data: {
          resenas: resultado.resenas,
          estadisticas,
          total: resultado.total,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: resultado.total > parseInt(offset) + parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener reseñas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener reseñas del usuario autenticado
  static async obtenerMisResenas(req, res) {
    try {
      const usuario_id = req.user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const resultado = await Resena.findByUsuario(
        usuario_id, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({
        success: true,
        data: {
          resenas: resultado.resenas,
          total: resultado.total,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: resultado.total > parseInt(offset) + parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener mis reseñas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener reseña por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const resena = await Resena.findById(id);

      if (!resena) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      res.json({
        success: true,
        data: resena
      });

    } catch (error) {
      console.error('Error al obtener reseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar reseña
  static async actualizar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const usuario_id = req.user.userId;

      // Verificar que la reseña pertenece al usuario
      const resenaExistente = await Resena.findById(id);
      if (!resenaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      if (resenaExistente.usuario_id !== usuario_id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar esta reseña'
        });
      }

      // Actualizar reseña
      const resenaActualizada = await Resena.update(id, req.body);

      // Actualizar calificación del restaurante si cambió la calificación
      if (req.body.calificacion && req.body.calificacion !== resenaExistente.calificacion) {
        await Restaurante.updateRating(resenaExistente.restaurante_id);
      }

      res.json({
        success: true,
        message: 'Reseña actualizada exitosamente',
        data: resenaActualizada
      });

    } catch (error) {
      console.error('Error al actualizar reseña:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // Eliminar reseña
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const usuario_id = req.user.userId;

      // Verificar que la reseña pertenece al usuario o es admin
      const resenaExistente = await Resena.findById(id);
      if (!resenaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      if (resenaExistente.usuario_id !== usuario_id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar esta reseña'
        });
      }

      // Eliminar reseña
      const eliminada = await Resena.delete(id);

      if (!eliminada) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      // Actualizar calificación del restaurante
      await Restaurante.updateRating(resenaExistente.restaurante_id);

      res.json({
        success: true,
        message: 'Reseña eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener reseñas recientes del sistema
  static async obtenerRecientes(req, res) {
    try {
      const { limit = 10 } = req.query;
      const resenas = await Resena.getRecientes(parseInt(limit));

      res.json({
        success: true,
        data: resenas
      });

    } catch (error) {
      console.error('Error al obtener reseñas recientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar reseñas con filtros (para admin)
  static async buscarConFiltros(req, res) {
    try {
      const {
        calificacion_min,
        calificacion_max,
        fecha_desde,
        fecha_hasta,
        categoria,
        verified,
        limit = 20,
        offset = 0
      } = req.query;

      const filtros = {
        calificacion_min: calificacion_min ? parseInt(calificacion_min) : undefined,
        calificacion_max: calificacion_max ? parseInt(calificacion_max) : undefined,
        fecha_desde,
        fecha_hasta,
        categoria,
        verified: verified !== undefined ? verified === 'true' : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const resenas = await Resena.findWithFilters(filtros);

      res.json({
        success: true,
        data: resenas,
        filtros,
        total: resenas.length
      });

    } catch (error) {
      console.error('Error al buscar reseñas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar reseña (solo admin)
  static async verificar(req, res) {
    try {
      const { id } = req.params;

      const verificada = await Resena.marcarComoVerificada(id);

      if (!verificada) {
        return res.status(404).json({
          success: false,
          message: 'Reseña no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Reseña verificada exitosamente'
      });

    } catch (error) {
      console.error('Error al verificar reseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de un restaurante
  static async obtenerEstadisticas(req, res) {
    try {
      const { restauranteId } = req.params;

      const estadisticas = await Resena.getEstadisticasRestaurante(restauranteId);

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ResenaController;