const database = require('../config/database');

class Review {
    // Crear nueva reseña
    static async create(reviewData) {
        try {
            const sql = `
                INSERT INTO reviews (user_id, restaurant_id, rating, comment, visit_date)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await database.query(sql, [
                reviewData.user_id,
                reviewData.restaurant_id,
                reviewData.rating,
                reviewData.comment,
                reviewData.visit_date
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error creando reseña:', error);
            throw error;
        }
    }

    // Buscar reseña por ID
    static async findById(id) {
        try {
            const sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name, u.email as user_email,
                       res.name as restaurant_name, res.cuisine_type
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                WHERE r.id = ?
            `;
            
            const result = await database.query(sql, [id]);
            
            if (result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            console.error('Error buscando reseña por ID:', error);
            throw error;
        }
    }

    // Obtener todas las reseñas con filtros
    static async findAll(filters = {}, pagination = {}, sorting = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            // Construir filtros
            const conditions = [];

            if (filters.restaurant_id) {
                conditions.push('r.restaurant_id = ?');
                whereParams.push(filters.restaurant_id);
            }

            if (filters.user_id) {
                conditions.push('r.user_id = ?');
                whereParams.push(filters.user_id);
            }

            if (filters.min_rating) {
                conditions.push('r.rating >= ?');
                whereParams.push(filters.min_rating);
            }

            if (filters.max_rating) {
                conditions.push('r.rating <= ?');
                whereParams.push(filters.max_rating);
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }

            // Consulta para contar total
            const countSql = `
                SELECT COUNT(*) as total 
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                ${whereClause}
            `;
            const countResult = await database.query(countSql, whereParams);
            const total = countResult[0].total;

            // Construir ordenamiento
            let orderBy = 'ORDER BY r.created_at DESC';
            const validSortFields = ['created_at', 'rating', 'visit_date'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'DESC';
                orderBy = `ORDER BY r.${sorting.sort_by} ${sortOrder}`;
            }

            // Consulta principal con paginación
            let sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name, u.email as user_email,
                       res.name as restaurant_name, res.cuisine_type
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                ${whereClause}
                ${orderBy}
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

            const reviews = await database.query(sql, queryParams);

            return { reviews, total };
        } catch (error) {
            console.error('Error obteniendo reseñas:', error);
            throw error;
        }
    }

    // Obtener reseñas de un restaurante
    static async findByRestaurant(restaurantId, pagination = {}, sorting = {}) {
        try {
            // Construir ordenamiento
            let orderBy = 'ORDER BY r.created_at DESC';
            const validSortFields = ['created_at', 'rating', 'visit_date'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'DESC';
                orderBy = `ORDER BY r.${sorting.sort_by} ${sortOrder}`;
            }

            // Consulta para contar total
            const countSql = `
                SELECT COUNT(*) as total 
                FROM reviews r
                WHERE r.restaurant_id = ?
            `;
            const countResult = await database.query(countSql, [restaurantId]);
            const total = countResult[0].total;

            // Consulta principal
            let sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name, u.email as user_email
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.restaurant_id = ?
                ${orderBy}
            `;

            const queryParams = [restaurantId];

            if (pagination.limit) {
                sql += ' LIMIT ?';
                queryParams.push(pagination.limit);
            }

            if (pagination.offset) {
                sql += ' OFFSET ?';
                queryParams.push(pagination.offset);
            }

            const reviews = await database.query(sql, queryParams);

            return { reviews, total };
        } catch (error) {
            console.error('Error obteniendo reseñas del restaurante:', error);
            throw error;
        }
    }

    // Obtener reseñas de un usuario
    static async findByUser(userId, pagination = {}, sorting = {}) {
        try {
            // Construir ordenamiento
            let orderBy = 'ORDER BY r.created_at DESC';
            const validSortFields = ['created_at', 'rating', 'visit_date'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'DESC';
                orderBy = `ORDER BY r.${sorting.sort_by} ${sortOrder}`;
            }

            // Consulta para contar total
            const countSql = `
                SELECT COUNT(*) as total 
                FROM reviews r
                WHERE r.user_id = ?
            `;
            const countResult = await database.query(countSql, [userId]);
            const total = countResult[0].total;

            // Consulta principal
            let sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       res.name as restaurant_name, res.cuisine_type, res.city, res.average_rating
                FROM reviews r
                JOIN restaurants res ON r.restaurant_id = res.id
                WHERE r.user_id = ?
                ${orderBy}
            `;

            const queryParams = [userId];

            if (pagination.limit) {
                sql += ' LIMIT ?';
                queryParams.push(pagination.limit);
            }

            if (pagination.offset) {
                sql += ' OFFSET ?';
                queryParams.push(pagination.offset);
            }

            const reviews = await database.query(sql, queryParams);

            return { reviews, total };
        } catch (error) {
            console.error('Error obteniendo reseñas del usuario:', error);
            throw error;
        }
    }

    // Buscar reseña específica de usuario y restaurante
    static async findByUserAndRestaurant(userId, restaurantId) {
        try {
            const sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name,
                       res.name as restaurant_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                WHERE r.user_id = ? AND r.restaurant_id = ?
            `;
            
            const result = await database.query(sql, [userId, restaurantId]);
            
            if (result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            console.error('Error buscando reseña de usuario y restaurante:', error);
            throw error;
        }
    }

    // Actualizar reseña
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            // Construir consulta dinámicamente
            if (updateData.rating !== undefined) {
                fields.push('rating = ?');
                values.push(updateData.rating);
            }
            if (updateData.comment !== undefined) {
                fields.push('comment = ?');
                values.push(updateData.comment);
            }
            if (updateData.visit_date !== undefined) {
                fields.push('visit_date = ?');
                values.push(updateData.visit_date);
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `
                UPDATE reviews 
                SET ${fields.join(', ')}
                WHERE id = ?
            `;

            await database.query(sql, values);
            return true;
        } catch (error) {
            console.error('Error actualizando reseña:', error);
            throw error;
        }
    }

    // Eliminar reseña
    static async delete(id) {
        try {
            const sql = 'DELETE FROM reviews WHERE id = ?';
            await database.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error eliminando reseña:', error);
            throw error;
        }
    }

    // Obtener estadísticas generales de reseñas
    static async getGeneralStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as reviews_last_30_days,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as reviews_last_7_days
                FROM reviews
            `;

            const result = await database.query(sql);
            return result[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas generales:', error);
            throw error;
        }
    }

    // Obtener estadísticas de un restaurante específico
    static async getRestaurantStats(restaurantId) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
                FROM reviews
                WHERE restaurant_id = ?
            `;

            const result = await database.query(sql, [restaurantId]);
            return result[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas del restaurante:', error);
            throw error;
        }
    }

    // Obtener reseñas más útiles (con mejor rating y más recientes)
    static async getMostHelpful(limit = 10, filters = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            if (filters.restaurant_id) {
                whereClause = 'WHERE r.restaurant_id = ?';
                whereParams.push(filters.restaurant_id);
            }

            const sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name,
                       res.name as restaurant_name, res.cuisine_type
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                ${whereClause}
                ORDER BY r.rating DESC, r.created_at DESC
                LIMIT ?
            `;

            whereParams.push(limit);
            const reviews = await database.query(sql, whereParams);

            return reviews;
        } catch (error) {
            console.error('Error obteniendo reseñas más útiles:', error);
            throw error;
        }
    }

    // Obtener reseñas recientes
    static async getRecent(limit = 10, filters = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            if (filters.restaurant_id) {
                whereClause = 'WHERE r.restaurant_id = ?';
                whereParams.push(filters.restaurant_id);
            }

            const sql = `
                SELECT r.id, r.user_id, r.restaurant_id, r.rating, r.comment, r.visit_date,
                       r.created_at, r.updated_at,
                       u.name as user_name,
                       res.name as restaurant_name, res.cuisine_type
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants res ON r.restaurant_id = res.id
                ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT ?
            `;

            whereParams.push(limit);
            const reviews = await database.query(sql, whereParams);

            return reviews;
        } catch (error) {
            console.error('Error obteniendo reseñas recientes:', error);
            throw error;
        }
    }

    // Obtener distribución de ratings
    static async getRatingDistribution(restaurantId = null) {
        try {
            let whereClause = '';
            const whereParams = [];

            if (restaurantId) {
                whereClause = 'WHERE restaurant_id = ?';
                whereParams.push(restaurantId);
            }

            const sql = `
                SELECT 
                    rating,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews ${whereClause})), 2) as percentage
                FROM reviews
                ${whereClause}
                GROUP BY rating
                ORDER BY rating DESC
            `;

            const result = await database.query(sql, whereParams);
            return result;
        } catch (error) {
            console.error('Error obteniendo distribución de ratings:', error);
            throw error;
        }
    }
}

module.exports = Review;
