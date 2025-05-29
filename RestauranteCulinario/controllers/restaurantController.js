const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const { successResponse, errorResponse } = require('../utils/response');

class RestaurantController {
    // Obtener todos los restaurantes con filtros
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                cuisine_type,
                city,
                price_range,
                min_rating,
                search,
                sort_by = 'average_rating',
                sort_order = 'desc'
            } = req.query;

            const filters = {};
            if (cuisine_type) filters.cuisine_type = cuisine_type;
            if (city) filters.city = city;
            if (price_range) filters.price_range = price_range;
            if (min_rating) filters.min_rating = parseFloat(min_rating);
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

            const result = await Restaurant.findAll(filters, pagination, sorting);

            return successResponse(res, {
                restaurants: result.restaurants,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                },
                filters_applied: filters
            }, 'Restaurantes obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo restaurantes:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener restaurante por ID
    async getById(req, res) {
        try {
            const { id } = req.params;

            const restaurant = await Restaurant.findById(parseInt(id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            // Obtener reseñas recientes del restaurante
            const recentReviews = await Review.findByRestaurant(
                parseInt(id),
                { page: 1, limit: 5, offset: 0 }
            );

            return successResponse(res, {
                restaurant,
                recent_reviews: recentReviews.reviews
            }, 'Restaurante obtenido exitosamente');

        } catch (error) {
            console.error('Error obteniendo restaurante:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Crear nuevo restaurante
    async create(req, res) {
        try {
            const {
                name,
                description,
                cuisine_type,
                address,
                city,
                phone,
                email,
                price_range,
                opening_hours
            } = req.body;

            const restaurantData = {
                name: name.trim(),
                description: description ? description.trim() : null,
                cuisine_type: cuisine_type.trim(),
                address: address.trim(),
                city: city.trim(),
                phone: phone || null,
                email: email ? email.toLowerCase().trim() : null,
                price_range,
                opening_hours: opening_hours || {}
            };

            const restaurantId = await Restaurant.create(restaurantData);
            const newRestaurant = await Restaurant.findById(restaurantId);

            return successResponse(res, {
                restaurant: newRestaurant
            }, 'Restaurante creado exitosamente', 201);

        } catch (error) {
            console.error('Error creando restaurante:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return errorResponse(res, 'Ya existe un restaurante con ese email', 400);
            }
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Actualizar restaurante
    async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Verificar que el restaurante existe
            const existingRestaurant = await Restaurant.findById(parseInt(id));
            if (!existingRestaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            // Limpiar y preparar datos de actualización
            const cleanData = {};
            if (updateData.name) cleanData.name = updateData.name.trim();
            if (updateData.description !== undefined) cleanData.description = updateData.description ? updateData.description.trim() : null;
            if (updateData.cuisine_type) cleanData.cuisine_type = updateData.cuisine_type.trim();
            if (updateData.address) cleanData.address = updateData.address.trim();
            if (updateData.city) cleanData.city = updateData.city.trim();
            if (updateData.phone !== undefined) cleanData.phone = updateData.phone;
            if (updateData.email !== undefined) cleanData.email = updateData.email ? updateData.email.toLowerCase().trim() : null;
            if (updateData.price_range) cleanData.price_range = updateData.price_range;
            if (updateData.opening_hours) cleanData.opening_hours = updateData.opening_hours;

            await Restaurant.update(parseInt(id), cleanData);
            const updatedRestaurant = await Restaurant.findById(parseInt(id));

            return successResponse(res, {
                restaurant: updatedRestaurant
            }, 'Restaurante actualizado exitosamente');

        } catch (error) {
            console.error('Error actualizando restaurante:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return errorResponse(res, 'El email ya está en uso por otro restaurante', 400);
            }
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Eliminar restaurante
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el restaurante existe
            const existingRestaurant = await Restaurant.findById(parseInt(id));
            if (!existingRestaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            await Restaurant.delete(parseInt(id));

            return successResponse(res, null, 'Restaurante eliminado exitosamente');

        } catch (error) {
            console.error('Error eliminando restaurante:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener tipos de cocina únicos
    async getCuisineTypes(req, res) {
        try {
            const cuisineTypes = await Restaurant.getUniqueCuisineTypes();

            return successResponse(res, {
                cuisine_types: cuisineTypes
            }, 'Tipos de cocina obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo tipos de cocina:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener ciudades únicas
    async getCities(req, res) {
        try {
            const cities = await Restaurant.getUniqueCities();

            return successResponse(res, {
                cities: cities
            }, 'Ciudades obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo ciudades:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Buscar restaurantes
    async search(req, res) {
        try {
            const { q, cuisine_type, city, price_range, min_rating } = req.query;

            if (!q || q.trim().length < 2) {
                return errorResponse(res, 'El término de búsqueda debe tener al menos 2 caracteres', 400);
            }

            const filters = {
                search: q.trim()
            };

            if (cuisine_type) filters.cuisine_type = cuisine_type;
            if (city) filters.city = city;
            if (price_range) filters.price_range = price_range;
            if (min_rating) filters.min_rating = parseFloat(min_rating);

            const result = await Restaurant.findAll(filters, { page: 1, limit: 20, offset: 0 });

            return successResponse(res, {
                restaurants: result.restaurants,
                total: result.total,
                search_term: q.trim(),
                filters_applied: filters
            }, 'Búsqueda completada exitosamente');

        } catch (error) {
            console.error('Error en búsqueda:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener estadísticas de restaurantes
    async getStats(req, res) {
        try {
            const stats = await Restaurant.getStats();

            return successResponse(res, {
                statistics: stats
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener restaurantes mejor calificados
    async getTopRated(req, res) {
        try {
            const { limit = 10 } = req.query;

            const restaurants = await Restaurant.getTopRated(parseInt(limit));

            return successResponse(res, {
                restaurants
            }, 'Restaurantes mejor calificados obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo restaurantes mejor calificados:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener restaurantes por rango de precio
    async getByPriceRange(req, res) {
        try {
            const { price_range } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const validPriceRanges = ['$', '$$', '$$$', '$$$$'];
            if (!validPriceRanges.includes(price_range)) {
                return errorResponse(res, 'Rango de precio inválido. Use: $, $$, $$$, $$$$', 400);
            }

            const filters = { price_range };
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const result = await Restaurant.findAll(filters, pagination);

            return successResponse(res, {
                restaurants: result.restaurants,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                },
                price_range
            }, `Restaurantes con rango de precio ${price_range} obtenidos exitosamente`);

        } catch (error) {
            console.error('Error obteniendo restaurantes por precio:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = new RestaurantController();
