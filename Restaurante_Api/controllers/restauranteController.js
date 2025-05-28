const { validationResult } = require('express-validator');
const Restaurante = require('../models/Restaurante');

class RestauranteController {
  // Crear nuevo restaurante
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

      const restaurante = await Restaurante.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Restaurante creado exitosamente',
        data: restaurante
      });

    } catch (error) {
      console.error('Error al crear restaurante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener todos los restaurantes con filtros
  static async obtenerTodos(req, res) {
    try {
      const {
        categoria,
        ubicacion,
        precio_promedio,
        nombre,
        calificacion_min,
        orderBy = 'calificacion_promedio',
        orderDirection = 'DESC',
        limit = 20,
        offset = 0
      } = req.query;

      const filtros = {
        categoria,
        ubicacion,
        precio_promedio,
        nombre,
        calificacion_min: calificacion_min ? parseFloat(calificacion_min) : undefined,
        orderBy,
        orderDirection,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const restaurantes = await Restaurante.findAll(filtros);

      res.json({
        success: true,
        data: restaurantes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: restaurantes.length
        }
      });

    } catch (error) {
      console.error('Error al obtener restaurantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener restaurante por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const restaurante = await Restaurante.findById(id);

      if (!restaurante) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      res.json({
        success: true,
        data: restaurante
      });

    } catch (error) {
      console.error('Error al obtener restaurante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar restaurante
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
      const restauranteActualizado = await Restaurante.update(id, req.body);

      res.json({
        success: true,
        message: 'Restaurante actualizado exitosamente',
        data: restauranteActualizado
      });

    } catch (error) {
      console.error('Error al actualizar restaurante:', error);
      
      if (error.message === 'Restaurante no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar restaurante (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Restaurante.delete(id);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Restaurante eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar restaurante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar restaurantes
  static async buscar(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const filtros = {
        categoria: req.query.categoria,
        precio_promedio: req.query.precio_promedio,
        limit: parseInt(req.query.limit) || 20
      };

      const restaurantes = await Restaurante.search(searchTerm.trim(), filtros);

      res.json({
        success: true,
        data: restaurantes,
        searchTerm: searchTerm.trim(),
        total: restaurantes.length
      });

    } catch (error) {
      console.error('Error en búsqueda:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener categorías disponibles
  static async obtenerCategorias(req, res) {
    try {
      const categorias = await Restaurante.getCategories();

      res.json({
        success: true,
        data: categorias
      });

    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener restaurantes cercanos
  static async obtenerCercanos(req, res) {
    try {
      const { latitud, longitud, radio = 10, limit = 20 } = req.query;

      if (!latitud || !longitud) {
        return res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
      }

      const lat = parseFloat(latitud);
      const lng = parseFloat(longitud);
      const radiusKm = parseFloat(radio);
      const limitNum = parseInt(limit);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
      }

      const restaurantes = await Restaurante.findNearby(lat, lng, radiusKm, limitNum);

      res.json({
        success: true,
        data: restaurantes,
        location: { latitud: lat, longitud: lng, radio: radiusKm },
        total: restaurantes.length
      });

    } catch (error) {
      console.error('Error al obtener restaurantes cercanos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar calificación de restaurante
  static async actualizarCalificacion(req, res) {
    try {
      const { id } = req.params;
      await Restaurante.updateRating(id);

      const restaurante = await Restaurante.findById(id);
      
      if (!restaurante) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Calificación actualizada exitosamente',
        data: {
          calificacion_promedio: restaurante.calificacion_promedio,
          total_resenas: restaurante.total_resenas
        }
      });

    } catch (error) {
      console.error('Error al actualizar calificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = RestauranteController;