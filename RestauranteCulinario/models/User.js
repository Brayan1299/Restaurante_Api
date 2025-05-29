const database = require('../config/database');

class User {
    // Crear nuevo usuario
    static async create(userData) {
        try {
            const sql = `
                INSERT INTO users (name, email, password, phone, preferences)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await database.query(sql, [
                userData.name,
                userData.email,
                userData.password,
                userData.phone,
                JSON.stringify(userData.preferences)
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error creando usuario:', error);
            throw error;
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        try {
            const sql = `
                SELECT id, name, email, password, phone, preferences, created_at, updated_at
                FROM users 
                WHERE id = ?
            `;
            
            const result = await database.query(sql, [id]);
            
            if (result.length === 0) {
                return null;
            }

            const user = result[0];
            // Parsear preferences JSON
            if (user.preferences) {
                try {
                    user.preferences = JSON.parse(user.preferences);
                } catch (e) {
                    user.preferences = {};
                }
            } else {
                user.preferences = {};
            }

            return user;
        } catch (error) {
            console.error('Error buscando usuario por ID:', error);
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        try {
            const sql = `
                SELECT id, name, email, password, phone, preferences, created_at, updated_at
                FROM users 
                WHERE email = ?
            `;
            
            const result = await database.query(sql, [email]);
            
            if (result.length === 0) {
                return null;
            }

            const user = result[0];
            // Parsear preferences JSON
            if (user.preferences) {
                try {
                    user.preferences = JSON.parse(user.preferences);
                } catch (e) {
                    user.preferences = {};
                }
            } else {
                user.preferences = {};
            }

            return user;
        } catch (error) {
            console.error('Error buscando usuario por email:', error);
            throw error;
        }
    }

    // Actualizar usuario
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            // Construir consulta dinámicamente
            if (updateData.name !== undefined) {
                fields.push('name = ?');
                values.push(updateData.name);
            }
            if (updateData.email !== undefined) {
                fields.push('email = ?');
                values.push(updateData.email);
            }
            if (updateData.password !== undefined) {
                fields.push('password = ?');
                values.push(updateData.password);
            }
            if (updateData.phone !== undefined) {
                fields.push('phone = ?');
                values.push(updateData.phone);
            }
            if (updateData.preferences !== undefined) {
                fields.push('preferences = ?');
                values.push(JSON.stringify(updateData.preferences));
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `
                UPDATE users 
                SET ${fields.join(', ')}
                WHERE id = ?
            `;

            await database.query(sql, values);
            return true;
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            throw error;
        }
    }

    // Eliminar usuario
    static async delete(id) {
        try {
            const sql = 'DELETE FROM users WHERE id = ?';
            await database.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            throw error;
        }
    }

    // Actualizar último login
    static async updateLastLogin(id) {
        try {
            const sql = `
                UPDATE users 
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await database.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error actualizando último login:', error);
            throw error;
        }
    }

    // Obtener todos los usuarios (para admin)
    static async findAll(filters = {}, pagination = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            // Construir filtros
            const conditions = [];
            
            if (filters.search) {
                conditions.push('(name LIKE ? OR email LIKE ?)');
                whereParams.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }

            // Consulta para contar total
            const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
            const countResult = await database.query(countSql, whereParams);
            const total = countResult[0].total;

            // Consulta principal con paginación
            let sql = `
                SELECT id, name, email, phone, preferences, created_at, updated_at
                FROM users 
                ${whereClause}
                ORDER BY created_at DESC
            `;

            const queryParams = [...whereParams];

            if (pagination.limit) {
                sql += ' LIMIT ?';
                queryParams.push(pagination.limit);
            }

            if (pagination.offset) {
                sql += ' OFFSET ?';
                queryParams.push(pagination.offset);
            }

            const users = await database.query(sql, queryParams);

            // Parsear preferences para cada usuario
            users.forEach(user => {
                if (user.preferences) {
                    try {
                        user.preferences = JSON.parse(user.preferences);
                    } catch (e) {
                        user.preferences = {};
                    }
                } else {
                    user.preferences = {};
                }
            });

            return { users, total };
        } catch (error) {
            console.error('Error obteniendo usuarios:', error);
            throw error;
        }
    }

    // Verificar si el email ya existe
    static async emailExists(email, excludeUserId = null) {
        try {
            let sql = 'SELECT id FROM users WHERE email = ?';
            const params = [email];

            if (excludeUserId) {
                sql += ' AND id != ?';
                params.push(excludeUserId);
            }

            const result = await database.query(sql, params);
            return result.length > 0;
        } catch (error) {
            console.error('Error verificando email:', error);
            throw error;
        }
    }

    // Obtener estadísticas de usuarios
    static async getStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_last_30_days,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_last_7_days,
                    COUNT(CASE WHEN JSON_LENGTH(preferences) > 0 THEN 1 END) as users_with_preferences
                FROM users
            `;

            const result = await database.query(sql);
            return result[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas de usuarios:', error);
            throw error;
        }
    }

    // Obtener preferencias de cocina más populares
    static async getPopularCuisinePreferences() {
        try {
            const sql = `
                SELECT preferences
                FROM users 
                WHERE JSON_LENGTH(preferences) > 0
            `;

            const result = await database.query(sql);
            const cuisineCount = {};

            result.forEach(user => {
                try {
                    const prefs = JSON.parse(user.preferences);
                    if (prefs.favorite_cuisines && Array.isArray(prefs.favorite_cuisines)) {
                        prefs.favorite_cuisines.forEach(cuisine => {
                            cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
                        });
                    }
                } catch (e) {
                    // Ignorar errores de parsing
                }
            });

            // Convertir a array y ordenar
            const sortedCuisines = Object.entries(cuisineCount)
                .map(([cuisine, count]) => ({ cuisine, count }))
                .sort((a, b) => b.count - a.count);

            return sortedCuisines;
        } catch (error) {
            console.error('Error obteniendo preferencias populares:', error);
            throw error;
        }
    }

    // Obtener usuarios con preferencias similares
    static async findUsersWithSimilarPreferences(userId, limit = 10) {
        try {
            const targetUser = await this.findById(userId);
            if (!targetUser || !targetUser.preferences) {
                return [];
            }

            const sql = `
                SELECT id, name, preferences
                FROM users 
                WHERE id != ? AND JSON_LENGTH(preferences) > 0
                LIMIT ?
            `;

            const users = await database.query(sql, [userId, limit * 2]); // Obtenemos más para filtrar

            const targetCuisines = targetUser.preferences.favorite_cuisines || [];
            const targetPriceRanges = targetUser.preferences.preferred_price_ranges || [];

            if (targetCuisines.length === 0 && targetPriceRanges.length === 0) {
                return [];
            }

            // Calcular similitud
            const similarUsers = users.map(user => {
                try {
                    const prefs = JSON.parse(user.preferences);
                    const userCuisines = prefs.favorite_cuisines || [];
                    const userPriceRanges = prefs.preferred_price_ranges || [];

                    let similarity = 0;

                    // Similitud en cocinas
                    const commonCuisines = targetCuisines.filter(c => userCuisines.includes(c));
                    similarity += commonCuisines.length;

                    // Similitud en rangos de precio
                    const commonPriceRanges = targetPriceRanges.filter(p => userPriceRanges.includes(p));
                    similarity += commonPriceRanges.length;

                    return {
                        id: user.id,
                        name: user.name,
                        similarity_score: similarity
                    };
                } catch (e) {
                    return null;
                }
            }).filter(user => user && user.similarity_score > 0)
              .sort((a, b) => b.similarity_score - a.similarity_score)
              .slice(0, limit);

            return similarUsers;
        } catch (error) {
            console.error('Error encontrando usuarios similares:', error);
            throw error;
        }
    }
}

module.exports = User;
