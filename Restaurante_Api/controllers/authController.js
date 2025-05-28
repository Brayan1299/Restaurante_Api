const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { enviarNotificacion } = require('../services/notificationService');

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, email, password, telefono, role } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await Usuario.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Crear usuario
      const user = await Usuario.create({
        nombre,
        email,
        password,
        telefono,
        role: role || 'user'
      });

      // Generar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Configurar cookie con el token
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      // Guardar en sesión
      req.session.user = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      };

      // Enviar notificación de bienvenida
      await enviarNotificacion(user.id, {
        titulo: '¡Bienvenido a GastroAPI!',
        mensaje: 'Tu cuenta ha sido creada exitosamente. Explora los mejores restaurantes y eventos gastronómicos.',
        tipo: 'success'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono,
            role: user.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Inicio de sesión
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Buscar usuario
      const user = await Usuario.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await Usuario.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Configurar cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      // Guardar en sesión
      req.session.user = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      };

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono,
            role: user.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cerrar sesión
  static async logout(req, res) {
    try {
      // Limpiar cookie
      res.clearCookie('authToken');
      
      // Destruir sesión
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al destruir sesión:', err);
        }
      });

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req, res) {
    try {
      const user = await Usuario.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Obtener estadísticas del usuario
      const stats = await Usuario.getUserStats(user.id);

      res.json({
        success: true,
        data: {
          user,
          stats
        }
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar perfil
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { nombre, telefono, preferencias } = req.body;
      const userId = req.user.userId;

      const updatedUser = await Usuario.update(userId, {
        nombre,
        telefono,
        preferencias
      });

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Obtener usuario con contraseña
      const user = await Usuario.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await Usuario.verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Cambiar contraseña
      await Usuario.changePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar token (para middleware)
  static async verifyToken(req, res) {
    try {
      const user = await Usuario.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Error al verificar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Refrescar token
  static async refreshToken(req, res) {
    try {
      const user = await Usuario.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Generar nuevo token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Configurar nueva cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: { token }
      });

    } catch (error) {
      console.error('Error al refrescar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = AuthController;