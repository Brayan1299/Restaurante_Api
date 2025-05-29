
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./config/database');
const config = require('./config/config');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menus');
const reviewRoutes = require('./routes/reviews');
const recommendationRoutes = require('./routes/recommendations');
const ticketRoutes = require('./routes/tickets');

const { errorHandler, notFoundHandler, sanitizeInput } = require('./middleware/validation');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 'https://*.replit.dev', 'https://*.replit.co'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Restaurant BRABUS API'
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    try {
        await initDatabase();
        
        const server = app.listen(config.server.port, config.server.host, () => {
            console.log(`🚀 Servidor ejecutándose en http://${config.server.host}:${config.server.port}`);
            console.log(`📊 Panel disponible en http://${config.server.host}:${config.server.port}`);
            console.log(`✅ Restaurante BRABUS API está listo`);
        });

        server.on('error', (error) => {
            console.error('❌ Error del servidor:', error);
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
