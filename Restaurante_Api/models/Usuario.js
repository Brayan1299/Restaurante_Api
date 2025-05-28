const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
  // Crear nuevo usuario
  static async create({ nombre, email, password, telefono = null, role = 'user' }) {
    try {
      // Encriptar contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const [result] = await pool.execute(
        'INSERT INTO usuarios (nombre, email, password, telefono, role) VALUES (?, ?, ?, ?, ?)',
        [nombre, email, hashedPassword, telefono, role]
      );
      
      return { id: result.insertId, nombre, email, telefono, role };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }
  
  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const [users] = await pool.execute(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Buscar usuario por ID
  static async findById(id) {
    try {
      const [users] = await pool.execute(
        'SELECT id, nombre, email, telefono, role, avatar, preferencias, email_verificado, created_at FROM usuarios WHERE id = ?',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Actualizar usuario
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      if (updateData.nombre) {
        fields.push('nombre = ?');
        values.push(updateData.nombre);
      }
      if (updateData.telefono) {
        fields.push('telefono = ?');
        values.push(updateData.telefono);
      }
      if (updateData.avatar) {
        fields.push('avatar = ?');
        values.push(updateData.avatar);
      }
      if (updateData.preferencias) {
        fields.push('preferencias = ?');
        values.push(JSON.stringify(updateData.preferencias));
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      
      const [result] = await pool.execute(
        `UPDATE usuarios SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
      }
      
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // Cambiar contraseña
  static async changePassword(id, newPassword) {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const [result] = await pool.execute(
        'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // Verificar email
  static async verifyEmail(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE usuarios SET email_verificado = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener todos los usuarios (para admin)
  static async findAll(limit = 50, offset = 0) {
    try {
      const [users] = await pool.execute(
        'SELECT id, nombre, email, telefono, role, email_verificado, created_at FROM usuarios ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM usuarios');
      const total = countResult[0].total;
      
      return {
        users,
        total,
        limit,
        offset
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Eliminar usuario
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Obtener estadísticas del usuario
  static async getUserStats(userId) {
    try {
      const [resenas] = await pool.execute(
        'SELECT COUNT(*) as total_resenas FROM resenas WHERE usuario_id = ?',
        [userId]
      );
      
      const [tickets] = await pool.execute(
        'SELECT COUNT(*) as total_tickets FROM tickets WHERE usuario_id = ?',
        [userId]
      );
      
      const [favoritos] = await pool.execute(
        'SELECT COUNT(*) as total_favoritos FROM favoritos WHERE usuario_id = ?',
        [userId]
      );
      
      return {
        total_resenas: resenas[0].total_resenas,
        total_tickets: tickets[0].total_tickets,
        total_favoritos: favoritos[0].total_favoritos
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Usuario;