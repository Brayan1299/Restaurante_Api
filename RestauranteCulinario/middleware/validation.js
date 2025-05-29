const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));

        return errorResponse(res, 'Errores de validación', 400, {
            validation_errors: errorMessages
        });
    }
    next();
};

const errorHandler = (error, req, res, next) => {
    console.error('Error no manejado:', error);

    if (error.isJoi) {
        const validationErrors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
        }));

        return errorResponse(res, 'Errores de validación', 400, {
            validation_errors: validationErrors
        });
    }

    if (error.code) {
        switch (error.code) {
            case 'ER_DUP_ENTRY':
                return errorResponse(res, 'El registro ya existe', 409);
            case 'ER_NO_REFERENCED_ROW_2':
                return errorResponse(res, 'Referencia inválida a otro registro', 400);
            case 'ER_ROW_IS_REFERENCED_2':
                return errorResponse(res, 'No se puede eliminar, tiene referencias', 400);
            case 'ER_DATA_TOO_LONG':
                return errorResponse(res, 'Datos demasiado largos para el campo', 400);
            case 'ER_BAD_NULL_ERROR':
                return errorResponse(res, 'Campo requerido no puede ser nulo', 400);
            case 'ER_PARSE_ERROR':
                return errorResponse(res, 'Error de sintaxis en consulta', 500);
            default:
                console.error('Error de MySQL no manejado:', error);
                return errorResponse(res, 'Error de base de datos', 500);
        }
    }

    if (error.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Token inválido', 401);
    }

    if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expirado', 401);
    }

    if (error.name === 'ValidationError') {
        return errorResponse(res, error.message, 400);
    }

    if (error.name === 'UnauthorizedError') {
        return errorResponse(res, 'No autorizado', 403);
    }

    if (error.name === 'NotFoundError') {
        return errorResponse(res, 'Recurso no encontrado', 404);
    }

    if (error.type === 'entity.parse.failed') {
        return errorResponse(res, 'JSON inválido en el cuerpo de la solicitud', 400);
    }

    if (error.type === 'entity.too.large') {
        return errorResponse(res, 'Cuerpo de la solicitud demasiado grande', 413);
    }

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Error interno del servidor';

    return errorResponse(res, message, statusCode);
};

const notFoundHandler = (req, res) => {
    return errorResponse(res, `Ruta ${req.method} ${req.originalUrl} no encontrada`, 404);
};

const validateContentType = (contentTypes = ['application/json']) => {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'DELETE') {
            return next();
        }

        const contentType = req.get('Content-Type');

        if (!contentType) {
            return errorResponse(res, 'Header Content-Type requerido', 400);
        }

        const isValidContentType = contentTypes.some(type => 
            contentType.toLowerCase().includes(type)
        );

        if (!isValidContentType) {
            return errorResponse(res, `Content-Type debe ser uno de: ${contentTypes.join(', ')}`, 415);
        }

        next();
    };
};

const validateIdParam = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!id) {
            return errorResponse(res, `Parámetro ${paramName} requerido`, 400);
        }

        const idNumber = parseInt(id, 10);

        if (isNaN(idNumber) || idNumber <= 0) {
            return errorResponse(res, `Parámetro ${paramName} debe ser un número entero positivo`, 400);
        }

        req.params[paramName] = idNumber;
        next();
    };
};

const validatePagination = (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 1) {
        return errorResponse(res, 'El parámetro page debe ser un número entero mayor a 0', 400);
    }

    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return errorResponse(res, 'El parámetro limit debe ser un número entero entre 1 y 100', 400);
    }

    req.query.page = pageNumber;
    req.query.limit = limitNumber;

    next();
};

const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.trim();
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitize(value);
            }
            return sanitized;
        }

        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    if (req.query) {
        req.query = sanitize(req.query);
    }

    next();
};

module.exports = {
    handleValidationErrors,
    errorHandler,
    notFoundHandler,
    validateContentType,
    validateIdParam,
    validatePagination,
    sanitizeInput
};