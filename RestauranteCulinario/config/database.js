
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

let connection = null;

async function createConnection() {
    try {
        // Primero conectar sin especificar la base de datos para crearla si no existe
        const tempConnection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            multipleStatements: true
        });

        // Crear la base de datos si no existe
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\``);
        await tempConnection.end();

        // Ahora conectar a la base de datos específica
        connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            multipleStatements: true
        });

        console.log('✅ Conexión a la base de datos establecida');
        return connection;

    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error);
        throw error;
    }
}

async function initDatabase() {
    try {
        if (!connection) {
            await createConnection();
        }

        // Leer y ejecutar el script de inicialización
        const initSqlPath = path.join(__dirname, 'init.sql');
        const initSql = await fs.readFile(initSqlPath, 'utf8');

        // Dividir el script en declaraciones individuales
        const statements = initSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        // Ejecutar cada declaración
        for (const statement of statements) {
            try {
                await connection.execute(statement);
            } catch (error) {
                // Ignorar errores de "tabla ya existe"
                if (!error.message.includes('already exists')) {
                    console.error('Error ejecutando statement:', error.message);
                }
            }
        }

        console.log('✅ Base de datos inicializada correctamente');

        // Insertar datos de ejemplo si las tablas están vacías
        await insertSampleData();

    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
        throw error;
    }
}

async function insertSampleData() {
    try {
        // Verificar si ya hay datos
        const [restaurants] = await connection.execute('SELECT COUNT(*) as count FROM restaurants');
        
        if (restaurants[0].count === 0) {
            console.log('🌱 Insertando datos de ejemplo...');
            
            // Insertar restaurantes de ejemplo
            const sampleRestaurants = [
                {
                    name: 'La Bella Italia',
                    description: 'Auténtica cocina italiana en el corazón de la ciudad',
                    cuisine_type: 'Italiana',
                    address: 'Calle 85 #15-20',
                    city: 'Bogotá',
                    phone: '+57 1 234-5678',
                    email: 'info@labellaitalia.com',
                    price_range: '$$$',
                    opening_hours: JSON.stringify({
                        monday: { open: '12:00', close: '22:00' },
                        tuesday: { open: '12:00', close: '22:00' },
                        wednesday: { open: '12:00', close: '22:00' },
                        thursday: { open: '12:00', close: '22:00' },
                        friday: { open: '12:00', close: '23:00' },
                        saturday: { open: '12:00', close: '23:00' },
                        sunday: { open: '12:00', close: '21:00' }
                    }),
                    average_rating: 4.5,
                    total_reviews: 127
                },
                {
                    name: 'Sushi Zen',
                    description: 'Experiencia gastronómica japonesa premium',
                    cuisine_type: 'Japonesa',
                    address: 'Carrera 13 #93-40',
                    city: 'Bogotá',
                    phone: '+57 1 345-6789',
                    email: 'contacto@sushizen.com',
                    price_range: '$$$$',
                    opening_hours: JSON.stringify({
                        monday: { open: '18:00', close: '23:00' },
                        tuesday: { open: '18:00', close: '23:00' },
                        wednesday: { open: '18:00', close: '23:00' },
                        thursday: { open: '18:00', close: '23:00' },
                        friday: { open: '18:00', close: '00:00' },
                        saturday: { open: '18:00', close: '00:00' },
                        sunday: { open: '18:00', close: '22:00' }
                    }),
                    average_rating: 4.8,
                    total_reviews: 89
                },
                {
                    name: 'Tacos El Mariachi',
                    description: 'Los mejores tacos mexicanos de la ciudad',
                    cuisine_type: 'Mexicana',
                    address: 'Calle 19 #4-62',
                    city: 'Medellín',
                    phone: '+57 4 567-8901',
                    email: 'hola@tacoselmariachi.com',
                    price_range: '$$',
                    opening_hours: JSON.stringify({
                        monday: { open: '11:00', close: '22:00' },
                        tuesday: { open: '11:00', close: '22:00' },
                        wednesday: { open: '11:00', close: '22:00' },
                        thursday: { open: '11:00', close: '22:00' },
                        friday: { open: '11:00', close: '23:00' },
                        saturday: { open: '11:00', close: '23:00' },
                        sunday: { open: '12:00', close: '21:00' }
                    }),
                    average_rating: 4.2,
                    total_reviews: 156
                },
                {
                    name: 'Burger House',
                    description: 'Hamburguesas gourmet y papas artesanales',
                    cuisine_type: 'Americana',
                    address: 'Avenida 68 #23-45',
                    city: 'Cali',
                    phone: '+57 2 678-9012',
                    email: 'info@burgerhouse.com',
                    price_range: '$$',
                    opening_hours: JSON.stringify({
                        monday: { open: '12:00', close: '22:00' },
                        tuesday: { open: '12:00', close: '22:00' },
                        wednesday: { open: '12:00', close: '22:00' },
                        thursday: { open: '12:00', close: '22:00' },
                        friday: { open: '12:00', close: '23:00' },
                        saturday: { open: '12:00', close: '23:00' },
                        sunday: { open: '12:00', close: '21:00' }
                    }),
                    average_rating: 4.1,
                    total_reviews: 203
                },
                {
                    name: 'El Rincón Criollo',
                    description: 'Comida tradicional colombiana con sazón casero',
                    cuisine_type: 'Colombiana',
                    address: 'Carrera 7 #12-35',
                    city: 'Bogotá',
                    phone: '+57 1 789-0123',
                    email: 'contacto@rinconcriollo.com',
                    price_range: '$',
                    opening_hours: JSON.stringify({
                        monday: { open: '07:00', close: '20:00' },
                        tuesday: { open: '07:00', close: '20:00' },
                        wednesday: { open: '07:00', close: '20:00' },
                        thursday: { open: '07:00', close: '20:00' },
                        friday: { open: '07:00', close: '21:00' },
                        saturday: { open: '08:00', close: '21:00' },
                        sunday: { open: '08:00', close: '19:00' }
                    }),
                    average_rating: 4.6,
                    total_reviews: 312
                },
                {
                    name: 'Café Literario',
                    description: 'Café de especialidad y biblioteca en un solo lugar',
                    cuisine_type: 'Café',
                    address: 'Calle 70 #11-30',
                    city: 'Medellín',
                    phone: '+57 4 890-1234',
                    email: 'hola@cafeliterario.com',
                    price_range: '$$',
                    opening_hours: JSON.stringify({
                        monday: { open: '07:00', close: '21:00' },
                        tuesday: { open: '07:00', close: '21:00' },
                        wednesday: { open: '07:00', close: '21:00' },
                        thursday: { open: '07:00', close: '21:00' },
                        friday: { open: '07:00', close: '22:00' },
                        saturday: { open: '08:00', close: '22:00' },
                        sunday: { open: '08:00', close: '20:00' }
                    }),
                    average_rating: 4.4,
                    total_reviews: 98
                }
            ];

            for (const restaurant of sampleRestaurants) {
                await connection.execute(`
                    INSERT INTO restaurants (
                        name, description, cuisine_type, address, city, phone, email, 
                        price_range, opening_hours, average_rating, total_reviews
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    restaurant.name,
                    restaurant.description,
                    restaurant.cuisine_type,
                    restaurant.address,
                    restaurant.city,
                    restaurant.phone,
                    restaurant.email,
                    restaurant.price_range,
                    restaurant.opening_hours,
                    restaurant.average_rating,
                    restaurant.total_reviews
                ]);
            }

            console.log('✅ Datos de ejemplo insertados');
        }
    } catch (error) {
        console.error('Error insertando datos de ejemplo:', error);
    }
}

async function query(sql, params = []) {
    try {
        if (!connection) {
            await createConnection();
        }
        
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error ejecutando query:', error);
        throw error;
    }
}

async function closeConnection() {
    if (connection) {
        await connection.end();
        connection = null;
        console.log('✅ Conexión a la base de datos cerrada');
    }
}

module.exports = {
    query,
    initDatabase,
    closeConnection
};
