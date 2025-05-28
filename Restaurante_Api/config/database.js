const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gastroapi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  charset: 'utf8mb4'
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para inicializar la base de datos
async function initDb() {
  try {
    console.log('🔄 Inicializando base de datos...');

    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');

    // Crear tablas si no existen
    await createTables(connection);
    console.log('✅ Tablas verificadas/creadas correctamente');

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Crear tablas necesarias
async function createTables(connection) {
  // Tabla usuarios
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      telefono VARCHAR(20),
      role ENUM('user', 'admin', 'restaurant_owner') DEFAULT 'user',
      avatar VARCHAR(255),
      verificado BOOLEAN DEFAULT FALSE,
      preferencias JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabla restaurantes
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS restaurantes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      direccion VARCHAR(500) NOT NULL,
      telefono VARCHAR(20),
      email VARCHAR(255),
      categoria ENUM(
        'Italiana', 'Mexicana', 'Japonesa', 'Peruana', 'Colombiana', 
        'Francesa', 'China', 'Vegetariana', 'Fusión', 'Mediterránea',
        'India', 'Tailandesa', 'Árabe', 'Americana', 'Brasileña'
      ) NOT NULL,
      precio_promedio ENUM('$', '$$', '$$$', '$$$$'),
      calificacion_promedio DECIMAL(2,1) DEFAULT 0,
      total_resenas INT DEFAULT 0,
      imagen VARCHAR(255),
      horarios JSON,
      servicios JSON,
      latitud DECIMAL(10,8),
      longitud DECIMAL(11,8),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Tabla menus
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS menus (
      id INT PRIMARY KEY AUTO_INCREMENT,
      restaurante_id INT NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10,2) NOT NULL,
      categoria VARCHAR(100) DEFAULT 'General',
      imagen VARCHAR(255),
      disponible BOOLEAN DEFAULT TRUE,
      ingredientes JSON,
      alergenicos JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE
    )
  `);

  // Tabla reseñas
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS resenas (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      restaurante_id INT NOT NULL,
      calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
      comentario TEXT NOT NULL,
      fecha_visita DATE,
      imagenes JSON,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_usuario_restaurante (usuario_id, restaurante_id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE
    )
  `);

  // Tabla eventos
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      titulo VARCHAR(255) NOT NULL,
      descripcion TEXT,
      fecha_inicio DATETIME NOT NULL,
      fecha_fin DATETIME,
      ubicacion VARCHAR(255) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      capacidad_maxima INT NOT NULL,
      tickets_vendidos INT DEFAULT 0,
      imagen VARCHAR(255),
      restaurante_id INT,
      categoria VARCHAR(100),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE SET NULL
    )
  `);

  // Tabla tickets
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      codigo VARCHAR(50) UNIQUE NOT NULL,
      evento_id INT NOT NULL,
      usuario_id INT NOT NULL,
      cantidad INT NOT NULL DEFAULT 1,
      precio_total DECIMAL(10,2) NOT NULL,
      estado ENUM('pendiente', 'pagado', 'usado', 'cancelado') DEFAULT 'pendiente',
      qr_code TEXT,
      datos_pago JSON,
      usado_en TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  // Tabla notificaciones
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      mensaje TEXT NOT NULL,
      tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
      url VARCHAR(255),
      leida BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  // Tabla recomendaciones
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS recomendaciones (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      restaurante_id INT NOT NULL,
      motivo VARCHAR(255),
      puntuacion DECIMAL(3,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE
    )
  `);
}

module.exports = {
  pool,
  initDb,
  initializeDatabase: initDb
};