const { validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { crearPreferenciaPago } = require('../services/mercadopagoService');
const { enviarNotificacion } = require('../services/notificationService');

class TicketController {
  // Comprar tickets
  static async comprar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { evento_id, cantidad } = req.body;
      const usuario_id = req.user.userId;

      // Obtener información del evento
      const evento = await pool.execute(
        'SELECT * FROM eventos WHERE id = ? AND activo = TRUE',
        [evento_id]
      );

      if (evento[0].length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado o inactivo'
        });
      }

      const eventoData = evento[0][0];
      const precio_total = eventoData.precio * cantidad;

      // Crear ticket pendiente
      const ticket = await Ticket.create({
        evento_id,
        usuario_id,
        cantidad,
        precio_total
      });

      res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: ticket
      });

    } catch (error) {
      console.error('Error al comprar ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener tickets del usuario
  static async misTickets(req, res) {
    try {
      const usuario_id = req.user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const resultado = await Ticket.findByUsuario(
        usuario_id,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Error al obtener tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Validar ticket
  static async validar(req, res) {
    try {
      const { codigo } = req.params;
      const resultado = await Ticket.validar(codigo);

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Error al validar ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Usar ticket
  static async usar(req, res) {
    try {
      const { codigo } = req.params;
      const ticket = await Ticket.marcarComoUsado(codigo);

      res.json({
        success: true,
        message: 'Ticket usado exitosamente',
        data: ticket
      });

    } catch (error) {
      console.error('Error al usar ticket:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // Generar QR
  static async generarQR(req, res) {
    try {
      const { id } = req.params;
      const qrResult = await Ticket.generarQR(id);

      res.json({
        success: true,
        data: qrResult
      });

    } catch (error) {
      console.error('Error al generar QR:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // Obtener todos los tickets (admin)
  static async obtenerTodos(req, res) {
    try {
      const { 
        estado, 
        evento_id, 
        limit = 50, 
        offset = 0 
      } = req.query;

      const filtros = {
        estado,
        evento_id,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const tickets = await Ticket.findWithFilters(filtros);

      res.json({
        success: true,
        data: tickets
      });

    } catch (error) {
      console.error('Error al obtener tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(req, res) {
    try {
      const { evento_id } = req.query;
      const estadisticas = await Ticket.getEstadisticas(evento_id);

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

  // Cancelar ticket
  static async cancelar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const ticket = await Ticket.cancelar(id, motivo);

      res.json({
        success: true,
        message: 'Ticket cancelado exitosamente',
        data: ticket
      });

    } catch (error) {
      console.error('Error al cancelar ticket:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

module.exports = TicketController;