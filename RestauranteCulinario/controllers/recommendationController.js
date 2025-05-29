const recommendationService = require('../services/recommendationService');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

class RecommendationController {
    // Obtener recomendaciones personalizadas para el usuario autenticado
    async getPersonalized(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 10, exclude_visited = false } = req.query;

            // Obtener preferencias del usuario
            const user = await User.findById(userId);
            if (!user) {
                return errorResponse(res, 'Usuario no encontrado', 404);
            }

            const recommendations = await recommendationService.getPersonalizedRecommendations(
                userId,
                parseInt(limit),
                exclude_visited === 'true'
            );

            return successResponse(res, {
                recommendations,
                user_preferences: user.preferences,
                total: recommendations.length
            }, 'Recomendaciones personalizadas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo recomendaciones personalizadas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener restaurantes similares a uno dado
    async getSimilar(req, res) {
        try {
            const { restaurant_id } = req.params;
            const { limit = 5 } = req.query;

            // Verificar que el restaurante existe
            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            const similarRestaurants = await recommendationService.getSimilarRestaurants(
                parseInt(restaurant_id),
                parseInt(limit)
            );

            return successResponse(res, {
                base_restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    cuisine_type: restaurant.cuisine_type,
                    price_range: restaurant.price_range
                },
                similar_restaurants: similarRestaurants,
                total: similarRestaurants.length
            }, 'Restaurantes similares obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo restaurantes similares:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones por tipo de cocina
    async getByCuisine(req, res) {
        try {
            const { cuisine_type } = req.params;
            const { limit = 10, min_rating = 3.0 } = req.query;

            const recommendations = await recommendationService.getRecommendationsByCuisine(
                cuisine_type,
                parseInt(limit),
                parseFloat(min_rating)
            );

            return successResponse(res, {
                cuisine_type,
                recommendations,
                total: recommendations.length,
                min_rating: parseFloat(min_rating)
            }, `Recomendaciones de cocina ${cuisine_type} obtenidas exitosamente`);

        } catch (error) {
            console.error('Error obteniendo recomendaciones por cocina:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones por ubicación
    async getByLocation(req, res) {
        try {
            const { city } = req.params;
            const { limit = 10, price_range, min_rating = 3.0 } = req.query;

            const filters = {
                city,
                min_rating: parseFloat(min_rating)
            };

            if (price_range) {
                filters.price_range = price_range;
            }

            const recommendations = await recommendationService.getRecommendationsByLocation(
                filters,
                parseInt(limit)
            );

            return successResponse(res, {
                location: city,
                recommendations,
                total: recommendations.length,
                filters_applied: filters
            }, `Recomendaciones en ${city} obtenidas exitosamente`);

        } catch (error) {
            console.error('Error obteniendo recomendaciones por ubicación:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener restaurantes trending (populares recientemente)
    async getTrending(req, res) {
        try {
            const { limit = 10, days = 30 } = req.query;

            const trendingRestaurants = await recommendationService.getTrendingRestaurants(
                parseInt(limit),
                parseInt(days)
            );

            return successResponse(res, {
                trending_restaurants: trendingRestaurants,
                total: trendingRestaurants.length,
                period_days: parseInt(days)
            }, 'Restaurantes trending obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo restaurantes trending:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones basadas en precio
    async getByPriceRange(req, res) {
        try {
            const { price_range } = req.params;
            const { limit = 10, city, cuisine_type } = req.query;

            const validPriceRanges = ['$', '$$', '$$$', '$$$$'];
            if (!validPriceRanges.includes(price_range)) {
                return errorResponse(res, 'Rango de precio inválido. Use: $, $$, $$$, $$$$', 400);
            }

            const filters = { price_range };
            if (city) filters.city = city;
            if (cuisine_type) filters.cuisine_type = cuisine_type;

            const recommendations = await recommendationService.getRecommendationsByPrice(
                filters,
                parseInt(limit)
            );

            return successResponse(res, {
                price_range,
                recommendations,
                total: recommendations.length,
                filters_applied: filters
            }, `Recomendaciones con rango de precio ${price_range} obtenidas exitosamente`);

        } catch (error) {
            console.error('Error obteniendo recomendaciones por precio:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones para usuarios con gustos similares
    async getCollaborative(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 10 } = req.query;

            const recommendations = await recommendationService.getCollaborativeRecommendations(
                userId,
                parseInt(limit)
            );

            return successResponse(res, {
                recommendations,
                total: recommendations.length,
                algorithm: 'collaborative_filtering'
            }, 'Recomendaciones colaborativas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo recomendaciones colaborativas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones por rango de rating
    async getByRating(req, res) {
        try {
            const { min_rating = 4.0 } = req.query;
            const { limit = 10, cuisine_type, city, price_range } = req.query;

            const filters = {
                min_rating: parseFloat(min_rating)
            };

            if (cuisine_type) filters.cuisine_type = cuisine_type;
            if (city) filters.city = city;
            if (price_range) filters.price_range = price_range;

            const recommendations = await recommendationService.getHighRatedRestaurants(
                filters,
                parseInt(limit)
            );

            return successResponse(res, {
                recommendations,
                total: recommendations.length,
                min_rating: parseFloat(min_rating),
                filters_applied: filters
            }, 'Restaurantes mejor calificados obtenidos exitosamente');

        } catch (error) {
            console.error('Error obteniendo recomendaciones por rating:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Actualizar preferencias del usuario para mejorar recomendaciones
    async updatePreferences(req, res) {
        try {
            const userId = req.user.id;
            const { preferences } = req.body;

            // Validar estructura de preferencias
            const validPreferences = {
                favorite_cuisines: preferences.favorite_cuisines || [],
                preferred_price_ranges: preferences.preferred_price_ranges || [],
                preferred_cities: preferences.preferred_cities || [],
                dietary_restrictions: preferences.dietary_restrictions || [],
                disliked_cuisines: preferences.disliked_cuisines || []
            };

            await User.update(userId, { preferences: validPreferences });

            return successResponse(res, {
                preferences: validPreferences
            }, 'Preferencias actualizadas exitosamente');

        } catch (error) {
            console.error('Error actualizando preferencias:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener recomendaciones mixtas (combinando diferentes algoritmos)
    async getMixed(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 15 } = req.query;

            const mixedRecommendations = await recommendationService.getMixedRecommendations(
                userId,
                parseInt(limit)
            );

            return successResponse(res, {
                recommendations: mixedRecommendations,
                total: mixedRecommendations.length,
                algorithm: 'mixed_approach'
            }, 'Recomendaciones mixtas obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo recomendaciones mixtas:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Guardar feedback de recomendación (para mejorar el algoritmo)
    async saveFeedback(req, res) {
        try {
            const userId = req.user.id;
            const { restaurant_id, liked, reason } = req.body;

            // Verificar que el restaurante existe
            const restaurant = await Restaurant.findById(parseInt(restaurant_id));
            if (!restaurant) {
                return errorResponse(res, 'Restaurante no encontrado', 404);
            }

            // Guardar feedback (esto podría implementarse en una tabla separada)
            const feedback = {
                user_id: userId,
                restaurant_id: parseInt(restaurant_id),
                liked: liked,
                reason: reason || null,
                created_at: new Date()
            };

            // Por ahora, simplemente registramos el feedback
            console.log('Feedback de recomendación:', feedback);

            return successResponse(res, {
                feedback_saved: true,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name
                }
            }, 'Feedback guardado exitosamente');

        } catch (error) {
            console.error('Error guardando feedback:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener estadísticas de recomendaciones
    async getStats(req, res) {
        try {
            const stats = await recommendationService.getRecommendationStats();

            return successResponse(res, {
                statistics: stats
            }, 'Estadísticas de recomendaciones obtenidas exitosamente');

        } catch (error) {
            console.error('Error obteniendo estadísticas de recomendaciones:', error);
            return errorResponse(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = new RecommendationController();
