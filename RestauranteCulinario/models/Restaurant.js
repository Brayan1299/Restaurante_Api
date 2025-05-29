const database = require('../config/database');

class Restaurant {
    // Crear nuevo restaurante
    static async create(restaurantData) {
        try {
            const sql = `
                INSERT INTO restaurants (name, description, cuisine_type, address, city, phone, email, price_range, opening_hours)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await database.query(sql, [
                restaurantData.name,
                restaurantData.description,
                restaurantData.cuisine_type,
                restaurantData.address,
                restaurantData.city,
                restaurantData.phone,
                restaurantData.email,
                restaurantData.price_range,
                JSON.stringify(restaurantData.opening_hours)
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error creando restaurante:', error);
            throw error;
        }
    }

    // Buscar restaurante por ID
    static async findById(id) {
        try {
            const sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
                WHERE id = ?
            `;
            
            const result = await database.query(sql, [id]);
            
            if (result.length === 0) {
                return null;
            }

            const restaurant = result[0];
            // Parsear opening_hours JSON
            if (restaurant.opening_hours) {
                try {
                    restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                } catch (e) {
                    restaurant.opening_hours = {};
                }
            } else {
                restaurant.opening_hours = {};
            }

            return restaurant;
        } catch (error) {
            console.error('Error buscando restaurante por ID:', error);
            throw error;
        }
    }

    // Obtener todos los restaurantes con filtros
    static async findAll(filters = {}, pagination = {}, sorting = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            // Construir filtros
            const conditions = [];

            if (filters.cuisine_type) {
                conditions.push('cuisine_type = ?');
                whereParams.push(filters.cuisine_type);
            }

            if (filters.city) {
                conditions.push('city = ?');
                whereParams.push(filters.city);
            }

            if (filters.price_range) {
                conditions.push('price_range = ?');
                whereParams.push(filters.price_range);
            }

            if (filters.min_rating) {
                conditions.push('average_rating >= ?');
                whereParams.push(filters.min_rating);
            }

            if (filters.search) {
                conditions.push('(name LIKE ? OR description LIKE ? OR cuisine_type LIKE ?)');
                const searchTerm = `%${filters.search}%`;
                whereParams.push(searchTerm, searchTerm, searchTerm);
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }

            // Consulta para contar total
            const countSql = `SELECT COUNT(*) as total FROM restaurants ${whereClause}`;
            const countResult = await database.query(countSql, whereParams);
            const total = countResult[0].total;

            // Construir ordenamiento
            let orderBy = 'ORDER BY average_rating DESC';
            const validSortFields = ['name', 'average_rating', 'total_reviews', 'created_at', 'price_range'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'DESC';
                orderBy = `ORDER BY ${sorting.sort_by} ${sortOrder}`;
            }

            // Consulta principal con paginación
            let sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
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

            const restaurants = await database.query(sql, queryParams);

            // Parsear opening_hours para cada restaurante
            restaurants.forEach(restaurant => {
                if (restaurant.opening_hours) {
                    try {
                        restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                    } catch (e) {
                        restaurant.opening_hours = {};
                    }
                } else {
                    restaurant.opening_hours = {};
                }
            });

            return { restaurants, total };
        } catch (error) {
            console.error('Error obteniendo restaurantes:', error);
            throw error;
        }
    }

    // Actualizar restaurante
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            // Construir consulta dinámicamente
            if (updateData.name !== undefined) {
                fields.push('name = ?');
                values.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                fields.push('description = ?');
                values.push(updateData.description);
            }
            if (updateData.cuisine_type !== undefined) {
                fields.push('cuisine_type = ?');
                values.push(updateData.cuisine_type);
            }
            if (updateData.address !== undefined) {
                fields.push('address = ?');
                values.push(updateData.address);
            }
            if (updateData.city !== undefined) {
                fields.push('city = ?');
                values.push(updateData.city);
            }
            if (updateData.phone !== undefined) {
                fields.push('phone = ?');
                values.push(updateData.phone);
            }
            if (updateData.email !== undefined) {
                fields.push('email = ?');
                values.push(updateData.email);
            }
            if (updateData.price_range !== undefined) {
                fields.push('price_range = ?');
                values.push(updateData.price_range);
            }
            if (updateData.opening_hours !== undefined) {
                fields.push('opening_hours = ?');
                values.push(JSON.stringify(updateData.opening_hours));
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `
                UPDATE restaurants 
                SET ${fields.join(', ')}
                WHERE id = ?
            `;

            await database.query(sql, values);
            return true;
        } catch (error) {
            console.error('Error actualizando restaurante:', error);
            throw error;
        }
    }

    // Eliminar restaurante
    static async delete(id) {
        try {
            const sql = 'DELETE FROM restaurants WHERE id = ?';
            await database.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error eliminando restaurante:', error);
            throw error;
        }
    }

    // Obtener tipos de cocina únicos
    static async getUniqueCuisineTypes() {
        try {
            const sql = `
                SELECT DISTINCT cuisine_type 
                FROM restaurants 
                ORDER BY cuisine_type ASC
            `;
            
            const result = await database.query(sql);
            return result.map(row => row.cuisine_type);
        } catch (error) {
            console.error('Error obteniendo tipos de cocina:', error);
            throw error;
        }
    }

    // Obtener ciudades únicas
    static async getUniqueCities() {
        try {
            const sql = `
                SELECT DISTINCT city 
                FROM restaurants 
                ORDER BY city ASC
            `;
            
            const result = await database.query(sql);
            return result.map(row => row.city);
        } catch (error) {
            console.error('Error obteniendo ciudades:', error);
            throw error;
        }
    }

    // Obtener estadísticas generales
    static async getStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_restaurants,
                    AVG(average_rating) as overall_average_rating,
                    COUNT(DISTINCT cuisine_type) as unique_cuisines,
                    COUNT(DISTINCT city) as unique_cities,
                    COUNT(CASE WHEN average_rating >= 4.0 THEN 1 END) as highly_rated_count,
                    COUNT(CASE WHEN total_reviews >= 10 THEN 1 END) as well_reviewed_count
                FROM restaurants
            `;

            const result = await database.query(sql);
            const stats = result[0];

            // Obtener distribución por rango de precio
            const priceDistSql = `
                SELECT price_range, COUNT(*) as count
                FROM restaurants
                GROUP BY price_range
                ORDER BY price_range
            `;
            
            const priceDistResult = await database.query(priceDistSql);

            stats.price_distribution = priceDistResult;
            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // Obtener restaurantes mejor calificados
    static async getTopRated(limit = 10) {
        try {
            const sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
                WHERE total_reviews >= 3
                ORDER BY average_rating DESC, total_reviews DESC
                LIMIT ?
            `;

            const restaurants = await database.query(sql, [limit]);

            // Parsear opening_hours para cada restaurante
            restaurants.forEach(restaurant => {
                if (restaurant.opening_hours) {
                    try {
                        restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                    } catch (e) {
                        restaurant.opening_hours = {};
                    }
                } else {
                    restaurant.opening_hours = {};
                }
            });

            return restaurants;
        } catch (error) {
            console.error('Error obteniendo restaurantes mejor calificados:', error);
            throw error;
        }
    }

    // Buscar restaurantes por proximidad de características
    static async findSimilar(restaurantId, limit = 5) {
        try {
            // Primero obtener el restaurante base
            const baseRestaurant = await this.findById(restaurantId);
            if (!baseRestaurant) {
                return [];
            }

            const sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
                WHERE id != ? 
                AND (
                    cuisine_type = ? 
                    OR city = ? 
                    OR price_range = ?
                )
                ORDER BY 
                    (CASE WHEN cuisine_type = ? THEN 3 ELSE 0 END) +
                    (CASE WHEN city = ? THEN 2 ELSE 0 END) +
                    (CASE WHEN price_range = ? THEN 1 ELSE 0 END) DESC,
                    average_rating DESC
                LIMIT ?
            `;

            const restaurants = await database.query(sql, [
                restaurantId,
                baseRestaurant.cuisine_type,
                baseRestaurant.city,
                baseRestaurant.price_range,
                baseRestaurant.cuisine_type,
                baseRestaurant.city,
                baseRestaurant.price_range,
                limit
            ]);

            // Parsear opening_hours para cada restaurante
            restaurants.forEach(restaurant => {
                if (restaurant.opening_hours) {
                    try {
                        restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                    } catch (e) {
                        restaurant.opening_hours = {};
                    }
                } else {
                    restaurant.opening_hours = {};
                }
            });

            return restaurants;
        } catch (error) {
            console.error('Error encontrando restaurantes similares:', error);
            throw error;
        }
    }

    // Verificar si el email ya existe
    static async emailExists(email, excludeRestaurantId = null) {
        try {
            let sql = 'SELECT id FROM restaurants WHERE email = ?';
            const params = [email];

            if (excludeRestaurantId) {
                sql += ' AND id != ?';
                params.push(excludeRestaurantId);
            }

            const result = await database.query(sql, params);
            return result.length > 0;
        } catch (error) {
            console.error('Error verificando email:', error);
            throw error;
        }
    }

    // Obtener restaurantes por múltiples IDs
    static async findByIds(ids) {
        try {
            if (!ids || ids.length === 0) {
                return [];
            }

            const placeholders = ids.map(() => '?').join(',');
            const sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
                WHERE id IN (${placeholders})
                ORDER BY average_rating DESC
            `;

            const restaurants = await database.query(sql, ids);

            // Parsear opening_hours para cada restaurante
            restaurants.forEach(restaurant => {
                if (restaurant.opening_hours) {
                    try {
                        restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                    } catch (e) {
                        restaurant.opening_hours = {};
                    }
                } else {
                    restaurant.opening_hours = {};
                }
            });

            return restaurants;
        } catch (error) {
            console.error('Error obteniendo restaurantes por IDs:', error);
            throw error;
        }
    }

    // Obtener restaurantes recientes
    static async getRecent(limit = 10) {
        try {
            const sql = `
                SELECT id, name, description, cuisine_type, address, city, phone, email, 
                       price_range, opening_hours, average_rating, total_reviews, created_at, updated_at
                FROM restaurants 
                ORDER BY created_at DESC
                LIMIT ?
            `;

            const restaurants = await database.query(sql, [limit]);

            // Parsear opening_hours para cada restaurante
            restaurants.forEach(restaurant => {
                if (restaurant.opening_hours) {
                    try {
                        restaurant.opening_hours = JSON.parse(restaurant.opening_hours);
                    } catch (e) {
                        restaurant.opening_hours = {};
                    }
                } else {
                    restaurant.opening_hours = {};
                }
            });

            return restaurants;
        } catch (error) {
            console.error('Error obteniendo restaurantes recientes:', error);
            throw error;
        }
    }
}

module.exports = Restaurant;
