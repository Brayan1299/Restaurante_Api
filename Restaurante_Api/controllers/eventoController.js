const Evento = require('../models/Evento');
const { validationResult } = require('express-validator');

class EventoController {
  // Crear nuevo evento
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

      const evento = await Evento.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: evento
      });

    } catch (error) {
      console.error('Error al crear evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener todos los eventos
  static async obtenerTodos(req, res) {
    try {
      const filtros = {
        categoria: req.query.categoria,
        fecha_desde: req.query.fecha_desde,
        precio_max: req.query.precio_max ? parseFloat(req.query.precio_max) : undefined,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0
      };

      // Limpiar filtros undefined
      Object.keys(filtros).forEach(key => 
        filtros[key] === undefined && delete filtros[key]
      );

      const eventos = await Evento.findAll(filtros);

      res.json({
        success: true,
        data: eventos,
        pagination: {
          limit: filtros.limit,
          offset: filtros.offset
        }
      });

    } catch (error) {
      console.error('Error al obtener eventos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener evento por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const evento = await Evento.findById(id);

      if (!evento) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      res.json({
        success: true,
        data: evento
      });

    } catch (error) {
      console.error('Error al obtener evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar evento
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
      const evento = await Evento.update(id, req.body);

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: evento
      });

    } catch (error) {
      if (error.message === 'Evento no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar evento
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Evento.delete(id);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Evento eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar disponibilidad
  static async verificarDisponibilidad(req, res) {
    try {
      const { id } = req.params;
      const disponible = await Evento.verificarDisponibilidad(id);

      res.json({
        success: true,
        disponible: disponible,
        message: disponible ? 'Evento disponible' : 'Evento agotado'
      });

    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener eventos por restaurante
  static async obtenerPorRestaurante(req, res) {
    try {
      const { restauranteId } = req.params;
      const eventos = await Evento.findByRestaurant(restauranteId);

      res.json({
        success: true,
        data: eventos
      });

    } catch (error) {
      console.error('Error al obtener eventos por restaurante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar disponibilidad
  static async verificarDisponibilidad(req, res) {
    try {
      const { id } = req.params;
      const disponible = await Evento.verificarDisponibilidad(id);

      res.json({
        success: true,
        disponible: disponible,
        message: disponible ? 'Evento disponible' : 'Evento agotado'
      });

    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = EventoController;