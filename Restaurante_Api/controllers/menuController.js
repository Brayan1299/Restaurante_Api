const { validationResult } = require('express-validator');
const Menu = require('../models/Menu');
const Restaurante = require('../models/Restaurante');

class MenuController {
  // Crear nuevo elemento del menú
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

      // Verificar que el restaurante existe
      const restaurante = await Restaurante.findById(req.body.restaurante_id);
      if (!restaurante) {
        return res.status(404).json({
          success: false,
          message: 'Restaurante no encontrado'
        });
      }

      const menu = await Menu.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Elemento del menú creado exitosamente',
        data: menu
      });

    } catch (error) {
      console.error('Error al crear elemento del menú:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener menú por restaurante
  static async obtenerPorRestaurante(req, res) {
    try {
      const { restauranteId } = req.params;
      const { categoria, disponible, orderBy = 'categoria', limit = 50, offset = 0 } = req.query;

      const filtros = {
        categoria,
        disponible: disponible !== undefined ? disponible === 'true' : undefined,
        orderBy,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const resultado = await Menu.findByRestaurante(restauranteId, filtros);

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Error al obtener menú:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener elemento del menú por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const menu = await Menu.findById(id);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Elemento del menú no encontrado'
        });
      }

      res.json({
        success: true,
        data: menu
      });

    } catch (error) {
      console.error('Error al obtener elemento del menú:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar elemento del menú
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
      const menuActualizado = await Menu.update(id, req.body);

      res.json({
        success: true,
        message: 'Elemento del menú actualizado exitosamente',
        data: menuActualizado
      });

    } catch (error) {
      console.error('Error al actualizar elemento del menú:', error);
      
      if (error.message === 'Menu no encontrado') {
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

  // Eliminar elemento del menú
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Menu.delete(id);

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Elemento del menú no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Elemento del menú eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar elemento del menú:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar en el menú
  static async buscar(req, res) {
    try {
      const { restauranteId } = req.params;
      const { q: searchTerm, categoria, precio_max, disponible } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const filtros = {
        categoria,
        precio_max: precio_max ? parseFloat(precio_max) : undefined,
        disponible: disponible !== undefined ? disponible === 'true' : undefined
      };

      const elementos = await Menu.search(restauranteId, searchTerm.trim(), filtros);

      res.json({
        success: true,
        data: elementos,
        searchTerm: searchTerm.trim(),
        total: elementos.length
      });

    } catch (error) {
      console.error('Error en búsqueda del menú:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = MenuController;