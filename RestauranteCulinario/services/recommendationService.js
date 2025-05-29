const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');
const database = require('../config/database');

class RecommendationService {
    // Obtener recomendaciones personalizadas basadas en preferencias del usuario
    async getPersonalizedRecommendations(userId, limit = 10, excludeVisited = false) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.preferences) {
                // Si no hay preferencias, devolver restaurantes mejor calificados
                return await Restaurant.getTopRated(limit);
            }

            const preferences = user.preferences;
            let sql = `
                SELECT DISTINCT r.*, 
                       (CASE 
                        WHEN r.cuisine_type IN (${this.createPlaceholders(preferences.favorite_cuisines)}) THEN 3
                        WHEN r.price_range IN (${this.createPlaceholders(preferences.preferred_price_ranges)}) THEN 2
                        WHEN r.city IN (${this.createPlaceholders(preferences.preferred_cities)}) THEN 1
                        ELSE 0
                       END) as preference_score
                FROM restaurants r
                WHERE r.average_rating >= 3.0
            `;

            const params = [
                ...(preferences.favorite_cuisines || []),
                ...(preferences.preferred_price_ranges || []),
                ...(preferences.preferred_cities || [])
            ];

            // Excluir restaurantes ya visitados si se solicita
            if (excludeVisited) {
                sql += ` AND r.id NOT IN (
                    SELECT DISTINCT restaurant_id 
                    FROM reviews 
                    WHERE user_id = ?
                )`;
                params.push(userId);
            }

            sql += `
                ORDER BY preference_score DESC, r.average_rating DESC, r.total_reviews DESC
                LIMIT ?
            `;
            params.push(limit);

            const restaurants = await database.query(sql, params);

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
            console.error('Error obteniendo recomendaciones personalizadas:', error);
            throw error;
        }
    }

    // Obtener restaurantes similares basados en características
    async getSimilarRestaurants(restaurantId, limit = 5) {
        try {
            return await Restaurant.findSimilar(restaurantId, limit);
        } catch (error) {
            console.error('Error obteniendo restaurantes similares:', error);
            throw error;
        }
    }

    // Obtener recomendaciones por tipo de cocina
    async getRecommendationsByCuisine(cuisineType, limit = 10, minRating = 3.0) {
        try {
            const filters = {
                cuisine_type: cuisineType,
                min_rating: minRating
            };

            const pagination = { page: 1, limit, offset: 0 };
            const sorting = { sort_by: 'average_rating', sort_order: 'DESC' };

            const result = await Restaurant.findAll(filters, pagination, sorting);
            return result.restaurants;
        } catch (error) {
            console.error('Error obteniendo recomendaciones por cocina:', error);
            throw error;
        }
    }

    // Obtener recomendaciones por ubicación
    async getRecommendationsByLocation(filters, limit = 10) {
        try {
            const pagination = { page: 1, limit, offset: 0 };
            const sorting = { sort_by: 'average_rating', sort_order: 'DESC' };

            const result = await Restaurant.findAll(filters, pagination, sorting);
            return result.restaurants;
        } catch (error) {
            console.error('Error obteniendo recomendaciones por ubicación:', error);
            throw error;
        }
    }

    // Obtener restaurantes trending (con muchas reseñas recientes)
    async getTrendingRestaurants(limit = 10, days = 30) {
        try {
            const sql = `
                SELECT r.*, COUNT(rev.id) as recent_reviews
                FROM restaurants r
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id 
                    AND rev.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                WHERE r.average_rating >= 3.5
                GROUP BY r.id
                HAVING recent_reviews > 0
                ORDER BY recent_reviews DESC, r.average_rating DESC
                LIMIT ?
            `;

            const restaurants = await database.query(sql, [days, limit]);

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
            console.error('Error obteniendo restaurantes trending:', error);
            throw error;
        }
    }

    // Obtener recomendaciones por rango de precio
    async getRecommendationsByPrice(filters, limit = 10) {
        try {
            const pagination = { page: 1, limit, offset: 0 };
            const sorting = { sort_by: 'average_rating', sort_order: 'DESC' };

            const result = await Restaurant.findAll(filters, pagination, sorting);
            return result.restaurants;
        } catch (error) {
            console.error('Error obteniendo recomendaciones por precio:', error);
            throw error;
        }
    }

    // Recomendaciones colaborativas (basadas en usuarios con gustos similares)
    async getCollaborativeRecommendations(userId, limit = 10) {
        try {
            // Obtener usuarios con preferencias similares
            const similarUsers = await User.findUsersWithSimilarPreferences(userId, 10);
            
            if (similarUsers.length === 0) {
                // Si no hay usuarios similares, devolver recomendaciones personalizadas básicas
                return await this.getPersonalizedRecommendations(userId, limit);
            }

            const similarUserIds = similarUsers.map(user => user.id);

            // Obtener restaurantes bien calificados por usuarios similares
            const sql = `
                SELECT r.*, AVG(rev.rating) as avg_rating_similar_users, COUNT(rev.id) as reviews_count
                FROM restaurants r
                JOIN reviews rev ON r.id = rev.restaurant_id
                WHERE rev.user_id IN (${this.createPlaceholders(similarUserIds)})
                    AND rev.rating >= 4
                    AND r.id NOT IN (
                        SELECT DISTINCT restaurant_id 
                        FROM reviews 
                        WHERE user_id = ?
                    )
                GROUP BY r.id
                HAVING reviews_count >= 2
                ORDER BY avg_rating_similar_users DESC, r.average_rating DESC
                LIMIT ?
            `;

            const params = [...similarUserIds, userId, limit];
            const restaurants = await database.query(sql, params);

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
            console.error('Error obteniendo recomendaciones colaborativas:', error);
            throw error;
        }
    }

    // Obtener restaurantes mejor calificados con filtros
    async getHighRatedRestaurants(filters, limit = 10) {
        try {
            const pagination = { page: 1, limit, offset: 0 };
            const sorting = { sort_by: 'average_rating', sort_order: 'DESC' };

            const result = await Restaurant.findAll(filters, pagination, sorting);
            return result.restaurants;
        } catch (error) {
            console.error('Error obteniendo restaurantes mejor calificados:', error);
            throw error;
        }
    }

    // Recomendaciones mixtas (combinando diferentes algoritmos)
    async getMixedRecommendations(userId, limit = 15) {
        try {
            const results = {
                personalized: [],
                collaborative: [],
                trending: [],
                high_rated: []
            };

            // Obtener recomendaciones de diferentes tipos (menos cantidad de cada una)
            const partialLimit = Math.ceil(limit / 4);

            try {
                results.personalized = await this.getPersonalizedRecommendations(userId, partialLimit);
            } catch (e) {
                console.warn('Error en recomendaciones personalizadas:', e.message);
            }

            try {
                results.collaborative = await this.getCollaborativeRecommendations(userId, partialLimit);
            } catch (e) {
                console.warn('Error en recomendaciones colaborativas:', e.message);
            }

            try {
                results.trending = await this.getTrendingRestaurants(partialLimit);
            } catch (e) {
                console.warn('Error en restaurantes trending:', e.message);
            }

            try {
                results.high_rated = await this.getHighRatedRestaurants({ min_rating: 4.0 }, partialLimit);
            } catch (e) {
                console.warn('Error en restaurantes mejor calificados:', e.message);
            }

            // Combinar y eliminar duplicados
            const allRestaurants = [
                ...results.personalized,
                ...results.collaborative,
                ...results.trending,
                ...results.high_rated
            ];

            const uniqueRestaurants = [];
            const seenIds = new Set();

            allRestaurants.forEach(restaurant => {
                if (!seenIds.has(restaurant.id)) {
                    seenIds.add(restaurant.id);
                    uniqueRestaurants.push(restaurant);
                }
            });

            // Ordenar por calificación y limitar
            uniqueRestaurants.sort((a, b) => b.average_rating - a.average_rating);

            return uniqueRestaurants.slice(0, limit);
        } catch (error) {
            console.error('Error obteniendo recomendaciones mixtas:', error);
            throw error;
        }
    }

    // Obtener estadísticas del sistema de recomendaciones
    async getRecommendationStats() {
        try {
            const stats = {};

            // Estadísticas básicas
            const basicStatsSql = `
                SELECT 
                    COUNT(DISTINCT r.id) as total_restaurants,
                    COUNT(DISTINCT u.id) as total_users,
                    COUNT(DISTINCT rev.id) as total_reviews,
                    AVG(r.average_rating) as overall_avg_rating
                FROM restaurants r
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                LEFT JOIN users u ON rev.user_id = u.id
            `;

            const basicStatsResult = await database.query(basicStatsSql);
            stats.basic = basicStatsResult[0];

            // Distribución por tipos de cocina
            const cuisineStatsSql = `
                SELECT cuisine_type, COUNT(*) as count
                FROM restaurants
                GROUP BY cuisine_type
                ORDER BY count DESC
                LIMIT 10
            `;

            const cuisineStatsResult = await database.query(cuisineStatsSql);
            stats.cuisine_distribution = cuisineStatsResult;

            // Distribución por rangos de precio
            const priceStatsSql = `
                SELECT price_range, COUNT(*) as count
                FROM restaurants
                GROUP BY price_range
                ORDER BY 
                    CASE price_range
                        WHEN '$' THEN 1
                        WHEN '$$' THEN 2
                        WHEN '$$$' THEN 3
                        WHEN '$$$$' THEN 4
                    END
            `;

            const priceStatsResult = await database.query(priceStatsSql);
            stats.price_distribution = priceStatsResult;

            // Usuarios con preferencias
            const userPrefsSql = `
                SELECT 
                    COUNT(CASE WHEN JSON_LENGTH(preferences) > 0 THEN 1 END) as users_with_preferences,
                    COUNT(*) as total_users
                FROM users
            `;

            const userPrefsResult = await database.query(userPrefsSql);
            stats.user_preferences = userPrefsResult[0];

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas de recomendaciones:', error);
            throw error;
        }
    }

    // Función auxiliar para crear placeholders SQL
    createPlaceholders(array) {
        if (!array || array.length === 0) {
            return "''"; // Placeholder vacío que no coincidirá con nada
        }
        return array.map(() => '?').join(',');
    }

    // Obtener recomendaciones basadas en historial de reseñas del usuario
    async getRecommendationsBasedOnHistory(userId, limit = 10) {
        try {
            // Obtener restaurantes favoritos del usuario (rating >= 4)
            const userFavoritesSql = `
                SELECT r.cuisine_type, r.price_range, r.city
                FROM reviews rev
                JOIN restaurants r ON rev.restaurant_id = r.id
                WHERE rev.user_id = ? AND rev.rating >= 4
            `;

            const userFavorites = await database.query(userFavoritesSql, [userId]);

            if (userFavorites.length === 0) {
                // Si no tiene historial, devolver recomendaciones generales
                return await Restaurant.getTopRated(limit);
            }

            // Extraer preferencias del historial
            const cuisineTypes = [...new Set(userFavorites.map(f => f.cuisine_type))];
            const priceRanges = [...new Set(userFavorites.map(f => f.price_range))];
            const cities = [...new Set(userFavorites.map(f => f.city))];

            // Buscar restaurantes similares
            const sql = `
                SELECT r.*, 
                       (CASE 
                        WHEN r.cuisine_type IN (${this.createPlaceholders(cuisineTypes)}) THEN 3
                        WHEN r.price_range IN (${this.createPlaceholders(priceRanges)}) THEN 2
                        WHEN r.city IN (${this.createPlaceholders(cities)}) THEN 1
                        ELSE 0
                       END) as similarity_score
                FROM restaurants r
                WHERE r.average_rating >= 3.5
                AND r.id NOT IN (
                    SELECT restaurant_id FROM reviews WHERE user_id = ?
                )
                ORDER BY similarity_score DESC, r.average_rating DESC
                LIMIT ?
            `;

            const params = [...cuisineTypes, ...priceRanges, ...cities, userId, limit];
            const restaurants = await database.query(sql, params);

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
            console.error('Error obteniendo recomendaciones basadas en historial:', error);
            throw error;
        }
    }
}

module.exports = new RecommendationService();
