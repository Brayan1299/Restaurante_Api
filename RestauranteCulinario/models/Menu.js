const database = require('../config/database');

class Menu {
    // Crear nuevo elemento del menú
    static async create(menuData) {
        try {
            const sql = `
                INSERT INTO menus (restaurant_id, category, name, description, price, is_available, allergens, nutritional_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await database.query(sql, [
                menuData.restaurant_id,
                menuData.category,
                menuData.name,
                menuData.description,
                menuData.price,
                menuData.is_available,
                JSON.stringify(menuData.allergens),
                JSON.stringify(menuData.nutritional_info)
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error creando elemento del menú:', error);
            throw error;
        }
    }

    // Buscar elemento del menú por ID
    static async findById(id) {
        try {
            const sql = `
                SELECT m.id, m.restaurant_id, m.category, m.name, m.description, m.price, 
                       m.is_available, m.allergens, m.nutritional_info, m.created_at, m.updated_at,
                       r.name as restaurant_name, r.cuisine_type
                FROM menus m
                JOIN restaurants r ON m.restaurant_id = r.id
                WHERE m.id = ?
            `;
            
            const result = await database.query(sql, [id]);
            
            if (result.length === 0) {
                return null;
            }

            const menuItem = result[0];
            
            // Parsear JSON fields
            if (menuItem.allergens) {
                try {
                    menuItem.allergens = JSON.parse(menuItem.allergens);
                } catch (e) {
                    menuItem.allergens = [];
                }
            } else {
                menuItem.allergens = [];
            }

            if (menuItem.nutritional_info) {
                try {
                    menuItem.nutritional_info = JSON.parse(menuItem.nutritional_info);
                } catch (e) {
                    menuItem.nutritional_info = {};
                }
            } else {
                menuItem.nutritional_info = {};
            }

            return menuItem;
        } catch (error) {
            console.error('Error buscando elemento del menú por ID:', error);
            throw error;
        }
    }

    // Obtener todos los elementos del menú con filtros
    static async findAll(filters = {}, pagination = {}, sorting = {}) {
        try {
            let whereClause = '';
            const whereParams = [];

            // Construir filtros
            const conditions = [];

            if (filters.restaurant_id) {
                conditions.push('m.restaurant_id = ?');
                whereParams.push(filters.restaurant_id);
            }

            if (filters.category) {
                conditions.push('m.category = ?');
                whereParams.push(filters.category);
            }

            if (filters.min_price !== undefined) {
                conditions.push('m.price >= ?');
                whereParams.push(filters.min_price);
            }

            if (filters.max_price !== undefined) {
                conditions.push('m.price <= ?');
                whereParams.push(filters.max_price);
            }

            if (filters.is_available !== undefined) {
                conditions.push('m.is_available = ?');
                whereParams.push(filters.is_available);
            }

            if (filters.search) {
                conditions.push('(m.name LIKE ? OR m.description LIKE ?)');
                const searchTerm = `%${filters.search}%`;
                whereParams.push(searchTerm, searchTerm);
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }

            // Consulta para contar total
            const countSql = `
                SELECT COUNT(*) as total 
                FROM menus m
                JOIN restaurants r ON m.restaurant_id = r.id
                ${whereClause}
            `;
            const countResult = await database.query(countSql, whereParams);
            const total = countResult[0].total;

            // Construir ordenamiento
            let orderBy = 'ORDER BY m.category ASC, m.name ASC';
            const validSortFields = ['category', 'name', 'price', 'created_at'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'ASC';
                orderBy = `ORDER BY m.${sorting.sort_by} ${sortOrder}`;
            }

            // Consulta principal con paginación
            let sql = `
                SELECT m.id, m.restaurant_id, m.category, m.name, m.description, m.price, 
                       m.is_available, m.allergens, m.nutritional_info, m.created_at, m.updated_at,
                       r.name as restaurant_name, r.cuisine_type
                FROM menus m
                JOIN restaurants r ON m.restaurant_id = r.id
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

            const menuItems = await database.query(sql, queryParams);

            // Parsear JSON fields para cada elemento
            menuItems.forEach(item => {
                if (item.allergens) {
                    try {
                        item.allergens = JSON.parse(item.allergens);
                    } catch (e) {
                        item.allergens = [];
                    }
                } else {
                    item.allergens = [];
                }

                if (item.nutritional_info) {
                    try {
                        item.nutritional_info = JSON.parse(item.nutritional_info);
                    } catch (e) {
                        item.nutritional_info = {};
                    }
                } else {
                    item.nutritional_info = {};
                }
            });

            return { menuItems, total };
        } catch (error) {
            console.error('Error obteniendo elementos del menú:', error);
            throw error;
        }
    }

    // Obtener menú completo de un restaurante
    static async findByRestaurant(restaurantId, filters = {}, sorting = {}) {
        try {
            let whereClause = 'WHERE m.restaurant_id = ?';
            const whereParams = [restaurantId];

            // Filtros adicionales
            if (filters.category) {
                whereClause += ' AND m.category = ?';
                whereParams.push(filters.category);
            }

            if (filters.is_available !== undefined) {
                whereClause += ' AND m.is_available = ?';
                whereParams.push(filters.is_available);
            }

            // Construir ordenamiento
            let orderBy = 'ORDER BY m.category ASC, m.name ASC';
            const validSortFields = ['category', 'name', 'price', 'created_at'];
            const validSortOrders = ['ASC', 'DESC'];

            if (sorting.sort_by && validSortFields.includes(sorting.sort_by)) {
                const sortOrder = validSortOrders.includes(sorting.sort_order) ? sorting.sort_order : 'ASC';
                orderBy = `ORDER BY m.${sorting.sort_by} ${sortOrder}`;
            }

            const sql = `
                SELECT m.id, m.restaurant_id, m.category, m.name, m.description, m.price, 
                       m.is_available, m.allergens, m.nutritional_info, m.created_at, m.updated_at
                FROM menus m
                ${whereClause}
                ${orderBy}
            `;

            const menuItems = await database.query(sql, whereParams);

            // Parsear JSON fields para cada elemento
            menuItems.forEach(item => {
                if (item.allergens) {
                    try {
                        item.allergens = JSON.parse(item.allergens);
                    } catch (e) {
                        item.allergens = [];
                    }
                } else {
                    item.allergens = [];
                }

                if (item.nutritional_info) {
                    try {
                        item.nutritional_info = JSON.parse(item.nutritional_info);
                    } catch (e) {
                        item.nutritional_info = {};
                    }
                } else {
                    item.nutritional_info = {};
                }
            });

            return menuItems;
        } catch (error) {
            console.error('Error obteniendo menú del restaurante:', error);
            throw error;
        }
    }

    // Actualizar elemento del menú
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            // Construir consulta dinámicamente
            if (updateData.category !== undefined) {
                fields.push('category = ?');
                values.push(updateData.category);
            }
            if (updateData.name !== undefined) {
                fields.push('name = ?');
                values.push(updateData.name);
            }
            if (updateData.description !== undefined) {
                fields.push('description = ?');
                values.push(updateData.description);
            }
            if (updateData.price !== undefined) {
                fields.push('price = ?');
                values.push(updateData.price);
            }
            if (updateData.is_available !== undefined) {
                fields.push('is_available = ?');
                values.push(updateData.is_available);
            }
            if (updateData.allergens !== undefined) {
                fields.push('allergens = ?');
                values.push(JSON.stringify(updateData.allergens));
            }
            if (updateData.nutritional_info !== undefined) {
                fields.push('nutritional_info = ?');
                values.push(JSON.stringify(updateData.nutritional_info));
            }

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const sql = `
                UPDATE menus 
                SET ${fields.join(', ')}
                WHERE id = ?
            `;

            await database.query(sql, values);
            return true;
        } catch (error) {
            console.error('Error actualizando elemento del menú:', error);
            throw error;
        }
    }

    // Eliminar elemento del menú
    static async delete(id) {
        try {
            const sql = 'DELETE FROM menus WHERE id = ?';
            await database.query(sql, [id]);
            return true;
        } catch (error) {
            console.error('Error eliminando elemento del menú:', error);
            throw error;
        }
    }

    // Obtener categorías únicas
    static async getUniqueCategories() {
        try {
            const sql = `
                SELECT DISTINCT category 
                FROM menus 
                ORDER BY category ASC
            `;
            
            const result = await database.query(sql);
            return result.map(row => row.category);
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            throw error;
        }
    }

    // Obtener categorías de un restaurante específico
    static async getCategoriesByRestaurant(restaurantId) {
        try {
            const sql = `
                SELECT DISTINCT category 
                FROM menus 
                WHERE restaurant_id = ?
                ORDER BY category ASC
            `;
            
            const result = await database.query(sql, [restaurantId]);
            return result.map(row => row.category);
        } catch (error) {
            console.error('Error obteniendo categorías del restaurante:', error);
            throw error;
        }
    }

    // Obtener estadísticas generales del menú
    static async getGeneralStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(DISTINCT restaurant_id) as restaurants_with_menu,
                    COUNT(DISTINCT category) as unique_categories,
                    AVG(price) as average_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_items,
                    COUNT(CASE WHEN is_available = 0 THEN 1 END) as unavailable_items
                FROM menus
            `;

            const result = await database.query(sql);
            const stats = result[0];

            // Obtener distribución por categorías
            const categorySql = `
                SELECT category, COUNT(*) as count
                FROM menus
                GROUP BY category
                ORDER BY count DESC
            `;
            
            const categoryResult = await database.query(categorySql);
            stats.category_distribution = categoryResult;

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas generales del menú:', error);
            throw error;
        }
    }

    // Obtener estadísticas del menú de un restaurante específico
    static async getRestaurantStats(restaurantId) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(DISTINCT category) as unique_categories,
                    AVG(price) as average_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_items,
                    COUNT(CASE WHEN is_available = 0 THEN 1 END) as unavailable_items
                FROM menus
                WHERE restaurant_id = ?
            `;

            const result = await database.query(sql, [restaurantId]);
            const stats = result[0];

            // Obtener distribución por categorías del restaurante
            const categorySql = `
                SELECT category, COUNT(*) as count
                FROM menus
                WHERE restaurant_id = ?
                GROUP BY category
                ORDER BY count DESC
            `;
            
            const categoryResult = await database.query(categorySql, [restaurantId]);
            stats.category_distribution = categoryResult;

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas del menú del restaurante:', error);
            throw error;
        }
    }

    // Obtener elementos del menú más populares (por restaurantes que los tienen)
    static async getPopularItems(limit = 10) {
        try {
            const sql = `
                SELECT name, COUNT(*) as restaurant_count
                FROM menus
                GROUP BY LOWER(name)
                HAVING restaurant_count > 1
                ORDER BY restaurant_count DESC, name ASC
                LIMIT ?
            `;

            const result = await database.query(sql, [limit]);
            return result;
        } catch (error) {
            console.error('Error obteniendo elementos populares:', error);
            throw error;
        }
    }

    // Obtener rango de precios por categoría
    static async getPriceRangeByCategory() {
        try {
            const sql = `
                SELECT 
                    category,
                    COUNT(*) as item_count,
                    AVG(price) as average_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price
                FROM menus
                GROUP BY category
                ORDER BY average_price DESC
            `;

            const result = await database.query(sql);
            return result;
        } catch (error) {
            console.error('Error obteniendo rangos de precio por categoría:', error);
            throw error;
        }
    }

    // Buscar elementos por alérgenos
    static async findByAllergens(allergens, exclude = true) {
        try {
            let allergenConditions = [];
            let params = [];

            allergens.forEach(allergen => {
                if (exclude) {
                    // Excluir elementos que contengan estos alérgenos
                    allergenConditions.push('NOT JSON_CONTAINS(allergens, ?)');
                } else {
                    // Incluir elementos que contengan estos alérgenos
                    allergenConditions.push('JSON_CONTAINS(allergens, ?)');
                }
                params.push(`"${allergen}"`);
            });

            const whereClause = allergenConditions.length > 0 ? 
                'WHERE ' + allergenConditions.join(exclude ? ' AND ' : ' OR ') : '';

            const sql = `
                SELECT m.id, m.restaurant_id, m.category, m.name, m.description, m.price, 
                       m.is_available, m.allergens, m.nutritional_info, m.created_at, m.updated_at,
                       r.name as restaurant_name, r.cuisine_type
                FROM menus m
                JOIN restaurants r ON m.restaurant_id = r.id
                ${whereClause}
                AND m.is_available = 1
                ORDER BY m.category ASC, m.name ASC
            `;

            const menuItems = await database.query(sql, params);

            // Parsear JSON fields para cada elemento
            menuItems.forEach(item => {
                if (item.allergens) {
                    try {
                        item.allergens = JSON.parse(item.allergens);
                    } catch (e) {
                        item.allergens = [];
                    }
                } else {
                    item.allergens = [];
                }

                if (item.nutritional_info) {
                    try {
                        item.nutritional_info = JSON.parse(item.nutritional_info);
                    } catch (e) {
                        item.nutritional_info = {};
                    }
                } else {
                    item.nutritional_info = {};
                }
            });

            return menuItems;
        } catch (error) {
            console.error('Error buscando por alérgenos:', error);
            throw error;
        }
    }
}

module.exports = Menu;
