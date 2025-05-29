const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const { successResponse, errorResponse } = require('../utils/response');

class MenuController {
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                restaurant_id,
                category,
                min_price,
                max_price,
                is_available,
                search,
                sort_by = 'category',
                sort_order = 'asc'
            } = req.query;

            const filters = {};
            if (restaurant_id) filters.restaurant_id = parseInt(restaurant_id);
            if (category) filters.category = category;
            if (min_price) filters.min_price = parseFloat(min_price);
            if (max_price) filters.max_price = parseFloat(max_price);
            if (is_available !== undefined) filters.is_available = is_available === 'true';
            if (search) filters.search = search;

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const sorting = {
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Menu.findAll(filters, pagination, sorting);

            return successResponse(res, {
                menu_items: result.menuItems,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                },
                filters_applied: filters
            }, 'Elementos del menú obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo elementos del menú:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;

            const menuItem = await Menu.findById(parseInt(id));
            if (!menuItem) {
                return errorResponse(res, 'Elemento del menú no encontrado', 404);
            }

            return successResponse(res, {
                menu_item: menuItem
            }, 'Elemento del menú obtenido exitosamente');

        } catch (error) {
            console.error('Error obteniendo elemento del menú:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getByRestaurant(req, res) {
        try {
            const { restaurant_id } = req.params;
            const { category, is_available, sort_by = 'category', sort_order = 'asc' } = req.query;

            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const filters = {};
            if (category) filters.category = category;
            if (is_available !== undefined) filters.is_available = is_available === 'true';

            const sorting = {
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const menuItems = await Menu.findByRestaurant(parseInt(restaurant_id), filters, sorting);

            return successResponse(res, {
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    cuisine_type: restaurant.cuisine_type
                },
                menu_items: menuItems,
                total: menuItems.length
            }, 'Menú del restaurante obtenido exitosamente');

        } catch (error) {
            console.error('Error obteniendo menú del restaurante:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async create(req, res) {
        try {
            const {
                restaurant_id,
                category,
                name,
                description,
                price,
                is_available = true,
                allergens = [],
                nutritional_info = {}
            } = req.body;

            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const menuData = {
                restaurant_id: parseInt(restaurant_id),
                category: category.trim(),
                name: name.trim(),
                description: description ? description.trim() : null,
                price: parseFloat(price),
                is_available,
                allergens,
                nutritional_info
            };

            const menuId = await Menu.create(menuData);
            const newMenuItem = await Menu.findById(menuId);

            return successResponse(res, {
                menu_item: newMenuItem
            }, 'Elemento del menú creado exitosamente', 201);

        } catch (error) {
            console.error('Error creando elemento del menú:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const existingMenuItem = await Menu.findById(parseInt(id));
            if (!existingMenuItem) {
                return errorResponse(res, 'Elemento del menú no encontrado', 404);
            }

            const cleanData = {};
            if (updateData.category) cleanData.category = updateData.category.trim();
            if (updateData.name) cleanData.name = updateData.name.trim();
            if (updateData.description !== undefined) cleanData.description = updateData.description ? updateData.description.trim() : null;
            if (updateData.price !== undefined) cleanData.price = parseFloat(updateData.price);
            if (updateData.is_available !== undefined) cleanData.is_available = updateData.is_available;
            if (updateData.allergens !== undefined) cleanData.allergens = updateData.allergens;
            if (updateData.nutritional_info !== undefined) cleanData.nutritional_info = updateData.nutritional_info;

            await Menu.update(parseInt(id), cleanData);
            const updatedMenuItem = await Menu.findById(parseInt(id));

            return successResponse(res, {
                menu_item: updatedMenuItem
            }, 'Elemento del menú actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando elemento del menú:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            const existingMenuItem = await Menu.findById(parseInt(id));
            if (!existingMenuItem) {
                return errorResponse(res, 'Elemento del menú no encontrado', 404);
            }

            await Menu.delete(parseInt(id));

            return successResponse(res, null, 'Elemento del menú eliminado exitosamente');

        } catch (error) {
            console.error('Error eliminando elemento del menú:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getCategories(req, res) {
        try {
            const { restaurant_id } = req.query;

            let categories;
            if (restaurant_id) {
                categories = await Menu.getCategoriesByRestaurant(parseInt(restaurant_id));
            } else {
                categories = await Menu.getUniqueCategories();
            }

            return successResponse(res, {
                categories
            }, 'Categorías obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getStats(req, res) {
        try {
            const { restaurant_id } = req.query;

            let stats;
            if (restaurant_id) {
                stats = await Menu.getRestaurantStats(parseInt(restaurant_id));
            } else {
                stats = await Menu.getGeneralStats();
            }

            return successResponse(res, {
                statistics: stats
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = new MenuController();