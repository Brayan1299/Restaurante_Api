
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { errorResponse } = require('../utils/response');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    
    const token = authHeader?.split(' ')[1] || cookieToken;

    if (!token) {
        return errorResponse(res, 'Token de acceso requerido', 401);
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
            id: decoded.id,
            userId: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
        next();
    } catch (error) {
        console.error('Error verificando token:', error);
        
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Token expirado', 401);
        }
        
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Token inválido', 401);
        }
        
        return errorResponse(res, 'Error de autenticación', 401);
    }
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    
    const token = authHeader?.split(' ')[1] || cookieToken;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
            id: decoded.id,
            userId: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
    } catch (error) {
        req.user = null;
    }
    
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
};
