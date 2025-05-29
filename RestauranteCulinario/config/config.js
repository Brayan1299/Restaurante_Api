const config = {
    database: {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        name: 'restaurant_brabus',
        port: 3306
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'restaurant-brabus-secret-key-2024',
        expiresIn: '24h'
    },
    server: {
        port: process.env.PORT || 5000,
        host: '0.0.0.0'
    },
    mercadoPago: {
        accessToken: 'TEST-6358356051055295-052820-cf01a4e49f7f7d99b66aad1a9194f4dd-434361213',
        publicKey: 'TEST-2b4f5a6c-8d9e-4f2a-b1c3-9e8f7d6c5b4a',
        sandbox: true
    },
    email: {
        service: 'gmail',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || ''
    },
    qr: {
        apiUrl: 'https://goqr.me/api/'
    },
    env: process.env.NODE_ENV || 'development',
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    },
    upload: {
        maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5000'
    },
    logs: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'app.log'
    }
};

const validateConfig = () => {
    const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.warn(`⚠ Variables de entorno faltantes: ${missing.join(', ')}`);
    }
};

const dotenv = require('dotenv');
dotenv.config();
validateConfig();

module.exports = config;