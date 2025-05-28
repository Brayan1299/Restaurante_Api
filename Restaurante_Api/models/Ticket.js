const { pool } = require('../config/database');
const { generarCodigoQR } = require('../services/qrService');

class Ticket {
  // Generar código único para el ticket
  static generarCodigo() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TCK-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Crear nuevo ticket
  static async create(ticketData) {
    try {
      const {
        evento_id,
        usuario_id,
        cantidad = 1,
        precio_total,
        datos_pago = null
      } = ticketData;

      const codigo = this.generarCodigo();

      const [result] = await pool.execute(
        `INSERT INTO tickets (codigo, evento_id, usuario_id, cantidad, precio_total, datos_pago)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [codigo, evento_id, usuario_id, cantidad, precio_total, JSON.stringify(datos_pago)]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Buscar ticket por ID
  static async findById(id) {
    try {
      const [tickets] = await pool.execute(
        `SELECT t.*, 
                e.titulo as evento_titulo, 
                e.fecha_inicio as fecha_evento,
                e.ubicacion as evento_ubicacion,
                u.nombre as usuario_nombre,
                u.email as usuario_email
         FROM tickets t
         JOIN eventos e ON t.evento_id = e.id
         JOIN usuarios u ON t.usuario_id = u.id
         WHERE t.id = ?`,
        [id]
      );

      if (tickets[0] && tickets[0].datos_pago) {
        tickets[0].datos_pago = JSON.parse(tickets[0].datos_pago);
      }

      return tickets[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar ticket por código
  static async findByCodigo(codigo) {
    try {
      const [tickets] = await pool.execute(
        `SELECT t.*, 
                e.titulo as evento_titulo, 
                e.fecha_inicio as fecha_evento,
                e.ubicacion as evento_ubicacion,
                u.nombre as usuario_nombre,
                u.email as usuario_email
         FROM tickets t
         JOIN eventos e ON t.evento_id = e.id
         JOIN usuarios u ON t.usuario_id = u.id
         WHERE t.codigo = ?`,
        [codigo]
      );

      if (tickets[0] && tickets[0].datos_pago) {
        tickets[0].datos_pago = JSON.parse(tickets[0].datos_pago);
      }

      return tickets[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Obtener tickets por usuario
  static async findByUsuario(usuarioId, limit = 20, offset = 0) {
    try {
      const [tickets] = await pool.execute(
        `SELECT t.*, 
                e.titulo as evento_titulo, 
                e.fecha_inicio as fecha_evento,
                e.ubicacion as evento_ubicacion
         FROM tickets t
         JOIN eventos e ON t.evento_id = e.id
         WHERE t.usuario_id = ?
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [usuarioId, limit, offset]
      );

      // Parsear datos_pago JSON
      tickets.forEach(ticket => {
        if (ticket.datos_pago) {
          ticket.datos_pago = JSON.parse(ticket.datos_pago);
        }
      });

      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM tickets WHERE usuario_id = ?',
        [usuarioId]
      );

      return {
        tickets,
        total: countResult[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener tickets por evento
  static async findByEvento(eventoId, limit = 50, offset = 0) {
    try {
      const [tickets] = await pool.execute(
        `SELECT t.*, 
                u.nombre as usuario_nombre,
                u.email as usuario_email
         FROM tickets t
         JOIN usuarios u ON t.usuario_id = u.id
         WHERE t.evento_id = ?
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
        [eventoId, limit, offset]
      );

      tickets.forEach(ticket => {
        if (ticket.datos_pago) {
          ticket.datos_pago = JSON.parse(ticket.datos_pago);
        }
      });

      return tickets;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado del ticket
  static async updateEstado(id, nuevoEstado, datosPago = null) {
    try {
      let query = 'UPDATE tickets SET estado = ?';
      let params = [nuevoEstado];

      if (datosPago) {
        query += ', datos_pago = ?';
        params.push(JSON.stringify(datosPago));
      }

      query += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params.push(id);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Ticket no encontrado');
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Marcar ticket como usado
  static async marcarComoUsado(codigo) {
    try {
      const [result] = await pool.execute(
        'UPDATE tickets SET estado = "usado", usado_en = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE codigo = ? AND estado = "pagado"',
        [codigo]
      );

      if (result.affectedRows === 0) {
        throw new Error('Ticket no encontrado o no válido para uso');
      }

      return await this.findByCodigo(codigo);
    } catch (error) {
      throw error;
    }
  }

  // Generar QR para el ticket
  static async generarQR(ticketId) {
    try {
      const ticket = await this.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      const qrResult = await generarCodigoQR(ticket);
      
      // Actualizar ticket con el QR generado
      await pool.execute(
        'UPDATE tickets SET qr_code = ? WHERE id = ?',
        [qrResult.qrCode, ticketId]
      );

      return qrResult;
    } catch (error) {
      throw error;
    }
  }

  // Validar ticket
  static async validar(codigo) {
    try {
      const ticket = await this.findByCodigo(codigo);
      
      if (!ticket) {
        return {
          valido: false,
          mensaje: 'Ticket no encontrado'
        };
      }

      if (ticket.estado !== 'pagado') {
        return {
          valido: false,
          mensaje: `Ticket en estado: ${ticket.estado}`
        };
      }

      // Verificar si el evento ya pasó
      const fechaEvento = new Date(ticket.fecha_evento);
      const fechaActual = new Date();
      
      if (fechaEvento < fechaActual) {
        return {
          valido: false,
          mensaje: 'El evento ya finalizó'
        };
      }

      return {
        valido: true,
        mensaje: 'Ticket válido',
        ticket: ticket
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas de tickets
  static async getEstadisticas(eventoId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
          COUNT(CASE WHEN estado = 'usado' THEN 1 END) as usados,
          COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
          SUM(CASE WHEN estado = 'pagado' THEN precio_total ELSE 0 END) as ingresos_totales
        FROM tickets
      `;
      
      let params = [];
      
      if (eventoId) {
        query += ' WHERE evento_id = ?';
        params.push(eventoId);
      }

      const [stats] = await pool.execute(query, params);
      
      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  // Cancelar ticket
  static async cancelar(id, motivo = null) {
    try {
      const ticket = await this.findById(id);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      if (ticket.estado === 'usado') {
        throw new Error('No se puede cancelar un ticket ya usado');
      }

      const datosCancelacion = {
        motivo: motivo,
        fecha_cancelacion: new Date(),
        estado_anterior: ticket.estado
      };

      await pool.execute(
        'UPDATE tickets SET estado = "cancelado", datos_pago = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify({ ...ticket.datos_pago, cancelacion: datosCancelacion }), id]
      );

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Buscar tickets con filtros
  static async findWithFilters(filtros = {}) {
    try {
      let query = `
        SELECT t.*, 
               e.titulo as evento_titulo, 
               e.fecha_inicio as fecha_evento,
               u.nombre as usuario_nombre,
               u.email as usuario_email
        FROM tickets t
        JOIN eventos e ON t.evento_id = e.id
        JOIN usuarios u ON t.usuario_id = u.id
        WHERE 1=1
      `;
      
      const params = [];

      if (filtros.estado) {
        query += ' AND t.estado = ?';
        params.push(filtros.estado);
      }

      if (filtros.evento_id) {
        query += ' AND t.evento_id = ?';
        params.push(filtros.evento_id);
      }

      if (filtros.usuario_id) {
        query += ' AND t.usuario_id = ?';
        params.push(filtros.usuario_id);
      }

      if (filtros.fecha_desde) {
        query += ' AND t.created_at >= ?';
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        query += ' AND t.created_at <= ?';
        params.push(filtros.fecha_hasta);
      }

      query += ' ORDER BY t.created_at DESC';

      const limit = filtros.limit || 50;
      const offset = filtros.offset || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [tickets] = await pool.execute(query, params);

      tickets.forEach(ticket => {
        if (ticket.datos_pago) {
          ticket.datos_pago = JSON.parse(ticket.datos_pago);
        }
      });

      return tickets;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Ticket;