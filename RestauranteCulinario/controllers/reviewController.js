const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

class ReviewController {
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                restaurant_id,
                user_id,
                min_rating,
                max_rating,
                sort_by = 'created_at',
                sort_order = 'desc'
            } = req.query;

            const filters = {};
            if (restaurant_id) filters.restaurant_id = parseInt(restaurant_id);
            if (user_id) filters.user_id = parseInt(user_id);
            if (min_rating) filters.min_rating = parseInt(min_rating);
            if (max_rating) filters.max_rating = parseInt(max_rating);

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const sorting = {
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Review.findAll(filters, pagination, sorting);

            return successResponse(res, {
                reviews: result.reviews,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                },
                filters_applied: filters
            }, 'Reseñas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseñas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;

            const review = await Review.findById(parseInt(id));
            if (!review) {
                return errorResponse(res, 'Reseña no encontrada', 404);
            }

            return successResponse(res, {
                review
            }, 'Reseña obtenida exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseña:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async create(req, res) {
        try {
            const user_id = req.user.id;
            const {
                restaurant_id,
                rating,
                comment,
                visit_date
            } = req.body;

            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const existingReview = await Review.findByUserAndRestaurant(user_id, parseInt(restaurant_id));
            if (existingReview) {
                return errorResponse(res, 'Ya has creado una reseña para este restaurante. Puedes editarla si deseas actualizarla.', 400);
            }

            const reviewData = {
                user_id,
                restaurant_id: parseInt(restaurant_id),
                rating: parseInt(rating),
                comment: comment ? comment.trim() : null,
                visit_date: visit_date || null
            };

            const reviewId = await Review.create(reviewData);
            const newReview = await Review.findById(reviewId);

            return successResponse(res, {
                review: newReview
            }, 'Reseña creada exitosamente', 201);

        } catch (error) {
            console.error('Error creando reseña:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;
            const updateData = req.body;

            const existingReview = await Review.findById(parseInt(id));
            if (!existingReview) {
                return errorResponse(res, 'Reseña no encontrada', 404);
            }

            if (existingReview.user_id !== user_id) {
                return errorResponse(res, 'No tienes permiso para editar esta reseña', 403);
            }

            const cleanData = {};
            if (updateData.rating !== undefined) cleanData.rating = parseInt(updateData.rating);
            if (updateData.comment !== undefined) cleanData.comment = updateData.comment ? updateData.comment.trim() : null;
            if (updateData.visit_date !== undefined) cleanData.visit_date = updateData.visit_date;

            await Review.update(parseInt(id), cleanData);
            const updatedReview = await Review.findById(parseInt(id));

            return successResponse(res, {
                review: updatedReview
            }, 'Reseña actualizada exitosamente');

        } catch (error) {
            console.error('Error actualizando reseña:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const existingReview = await Review.findById(parseInt(id));
            if (!existingReview) {
                return errorResponse(res, 'Reseña no encontrada', 404);
            }

            if (existingReview.user_id !== user_id) {
                return errorResponse(res, 'No tienes permiso para eliminar esta reseña', 403);
            }

            await Review.delete(parseInt(id));

            return successResponse(res, null, 'Reseña eliminada exitosamente');

        } catch (error) {
            console.error('Error eliminando reseña:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getByRestaurant(req, res) {
        try {
            const { restaurant_id } = req.params;
            const {
                page = 1,
                limit = 10,
                sort_by = 'created_at',
                sort_order = 'desc'
            } = req.query;

            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const sorting = {
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Review.findByRestaurant(parseInt(restaurant_id), pagination, sorting);

            return successResponse(res, {
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    cuisine_type: restaurant.cuisine_type,
                    average_rating: restaurant.average_rating,
                    total_reviews: restaurant.total_reviews
                },
                reviews: result.reviews,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                }
            }, 'Reseñas del restaurante obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseñas del restaurante:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getByUser(req, res) {
        try {
            const user_id = req.user.id;
            const {
                page = 1,
                limit = 10,
                sort_by = 'created_at',
                sort_order = 'desc'
            } = req.query;

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const sorting = {
                sort_by,
                sort_order: sort_order.toUpperCase()
            };

            const result = await Review.findByUser(user_id, pagination, sorting);

            return successResponse(res, {
                reviews: result.reviews,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                }
            }, 'Reseñas del usuario obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseñas del usuario:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getStats(req, res) {
        try {
            const { restaurant_id } = req.query;

            let stats;
            if (restaurant_id) {
                stats = await Review.getRestaurantStats(parseInt(restaurant_id));
            } else {
                stats = await Review.getGeneralStats();
            }

            return successResponse(res, {
                statistics: stats
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getMostHelpful(req, res) {
        try {
            const { limit = 10, restaurant_id } = req.query;

            const filters = {};
            if (restaurant_id) {
                filters.restaurant_id = parseInt(restaurant_id);
            }

            const reviews = await Review.getMostHelpful(parseInt(limit), filters);

            return successResponse(res, {
                reviews
            }, 'Reseñas más útiles obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseñas más útiles:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async getMyReviews(req, res) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10 } = req.query;

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const result = await Review.findByUser(userId, pagination);

            return successResponse(res, {
                reviews: result.reviews,
                pagination: {
                    current_page: pagination.page,
                    per_page: pagination.limit,
                    total: result.total,
                    total_pages: Math.ceil(result.total / pagination.limit)
                }
            }, 'Reseñas del usuario obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo reseñas del usuario:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    async canUserReview(req, res) {
        try {
            const { restaurant_id } = req.params;
            const user_id = req.user.id;

            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const existingReview = await Review.findByUserAndRestaurant(user_id, parseInt(restaurant_id));

            return successResponse(res, {
                can_review: !existingReview,
                has_existing_review: !!existingReview,
                existing_review: existingReview || null
            }, 'Verificación completada');

        } catch (error) {
            console.error('Error verificando si puede reseñar:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = new ReviewController();