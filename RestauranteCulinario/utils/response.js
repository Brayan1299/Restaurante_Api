/**
 * Utilidades para manejo consistente de respuestas de la API
 */

// Estructura estándar de respuesta exitosa
const successResponse = (res, data = null, message = 'Operación exitosa', statusCode = 200, meta = {}) => {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        ...meta
    };

    return res.status(statusCode).json(response);
};

// Estructura estándar de respuesta de error
const errorResponse = (res, message = 'Error interno del servidor', statusCode = 500, details = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        error: {
            code: statusCode,
            details
        }
    };

    // Solo incluir stack trace en desarrollo
    if (process.env.NODE_ENV === 'development' && details && details.stack) {
        response.error.stack = details.stack;
    }

    return res.status(statusCode).json(response);
};

// Respuesta para recursos no encontrados
const notFoundResponse = (res, resource = 'Recurso') => {
    return errorResponse(res, `${resource} no encontrado`, 404);
};

// Respuesta para errores de validación
const validationErrorResponse = (res, errors, message = 'Errores de validación') => {
    return errorResponse(res, message, 400, {
        validation_errors: errors
    });
};

// Respuesta para errores de autenticación
const unauthorizedResponse = (res, message = 'No autorizado') => {
    return errorResponse(res, message, 401);
};

// Respuesta para errores de autorización (forbidden)
const forbiddenResponse = (res, message = 'Acceso denegado') => {
    return errorResponse(res, message, 403);
};

// Respuesta para conflictos (datos duplicados, etc.)
const conflictResponse = (res, message = 'Conflicto con datos existentes') => {
    return errorResponse(res, message, 409);
};

// Respuesta para datos creados exitosamente
const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
    return successResponse(res, data, message, 201);
};

// Respuesta para operaciones exitosas sin contenido
const noContentResponse = (res, message = 'Operación completada') => {
    return res.status(204).json({
        success: true,
        message,
        timestamp: new Date().toISOString()
    });
};

// Respuesta paginada
const paginatedResponse = (res, data, pagination, message = 'Datos obtenidos exitosamente') => {
    return successResponse(res, data, message, 200, {
        pagination: {
            current_page: pagination.page || 1,
            per_page: pagination.limit || 10,
            total: pagination.total || 0,
            total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
            has_next_page: (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
            has_prev_page: (pagination.page || 1) > 1
        }
    });
};

// Respuesta con metadatos adicionales
const responseWithMeta = (res, data, meta, message = 'Operación exitosa', statusCode = 200) => {
    return successResponse(res, data, message, statusCode, meta);
};

// Función para envolver async controllers y manejar errores automáticamente
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error('Error en controller async:', error);
            
            // Si ya se envió una respuesta, no enviar otra
            if (res.headersSent) {
                return next(error);
            }

            // Manejar diferentes tipos de errores
            if (error.name === 'ValidationError') {
                return validationErrorResponse(res, error.details, error.message);
            }

            if (error.name === 'UnauthorizedError') {
                return unauthorizedResponse(res, error.message);
            }

            if (error.name === 'ForbiddenError') {
                return forbiddenResponse(res, error.message);
            }

            if (error.name === 'NotFoundError') {
                return notFoundResponse(res, error.message);
            }

            if (error.name === 'ConflictError') {
                return conflictResponse(res, error.message);
            }

            // Error genérico
            return errorResponse(res, error.message || 'Error interno del servidor', error.statusCode || 500);
        });
    };
};

// Función para formatear errores de base de datos MySQL
const formatDatabaseError = (error) => {
    const dbErrorMessages = {
        'ER_DUP_ENTRY': 'El registro ya existe',
        'ER_NO_REFERENCED_ROW_2': 'Referencia inválida',
        'ER_ROW_IS_REFERENCED_2': 'No se puede eliminar, tiene dependencias',
        'ER_DATA_TOO_LONG': 'Datos demasiado largos',
        'ER_BAD_NULL_ERROR': 'Campo requerido faltante',
        'ER_PARSE_ERROR': 'Error de sintaxis en consulta',
        'ER_ACCESS_DENIED_ERROR': 'Acceso denegado a la base de datos',
        'ER_BAD_DB_ERROR': 'Base de datos no encontrada',
        'ER_TABLE_EXISTS_ERROR': 'La tabla ya existe',
        'ER_BAD_TABLE_ERROR': 'Tabla no encontrada',
        'ER_NON_UNIQ_ERROR': 'Columna ambigua',
        'ER_BAD_FIELD_ERROR': 'Campo desconocido'
    };

    return {
        message: dbErrorMessages[error.code] || 'Error de base de datos',
        code: error.code,
        sqlState: error.sqlState,
        errno: error.errno
    };
};

// Función para sanitizar datos sensibles en respuestas
const sanitizeResponse = (data) => {
    if (!data) return data;

    // Función recursiva para limpiar objetos
    const sanitize = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Excluir campos sensibles
                if (!['password', 'reset_token', 'api_key', 'secret'].includes(key.toLowerCase())) {
                    sanitized[key] = sanitize(value);
                }
            }
            return sanitized;
        }

        return obj;
    };

    return sanitize(data);
};

// Middleware para logging de respuestas
const responseLogger = (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
        // Log de respuesta (solo en desarrollo o si se especifica)
        if (process.env.NODE_ENV === 'development' || process.env.LOG_RESPONSES === 'true') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
            
            if (res.statusCode >= 400) {
                console.error('Response Error:', JSON.parse(data));
            }
        }

        return originalSend.call(this, data);
    };

    next();
};

module.exports = {
    successResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    unauthorizedResponse,
    forbiddenResponse,
    conflictResponse,
    createdResponse,
    noContentResponse,
    paginatedResponse,
    responseWithMeta,
    asyncHandler,
    formatDatabaseError,
    sanitizeResponse,
    responseLogger
};