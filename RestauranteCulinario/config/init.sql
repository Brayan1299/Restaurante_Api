CREATE DATABASE IF NOT EXISTS restaurante_app;
USE restaurante_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    price_range ENUM('$', '$$', '$$$', '$$$$') NOT NULL,
    opening_hours JSON,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cuisine_type (cuisine_type),
    INDEX idx_city (city),
    INDEX idx_price_range (price_range),
    INDEX idx_average_rating (average_rating)
);

CREATE TABLE IF NOT EXISTS menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_category (category),
    INDEX idx_available (available)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_user_restaurant (user_id, restaurant_id)
);

CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled', 'used') DEFAULT 'pending',
    payment_id VARCHAR(255),
    qr_code_url VARCHAR(500),
    expires_at TIMESTAMP NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_ticket_code (ticket_code)
);

DELIMITER $$

CREATE TRIGGER update_restaurant_rating_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE restaurants 
    SET 
        average_rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE restaurant_id = NEW.restaurant_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE restaurant_id = NEW.restaurant_id
        )
    WHERE id = NEW.restaurant_id;
END$$

CREATE TRIGGER update_restaurant_rating_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE restaurants 
    SET 
        average_rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE restaurant_id = NEW.restaurant_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE restaurant_id = NEW.restaurant_id
        )
    WHERE id = NEW.restaurant_id;
END$$

CREATE TRIGGER update_restaurant_rating_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE restaurants 
    SET 
        average_rating = COALESCE((
            SELECT AVG(rating) 
            FROM reviews 
            WHERE restaurant_id = OLD.restaurant_id
        ), 0),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE restaurant_id = OLD.restaurant_id
        )
    WHERE id = OLD.restaurant_id;
END$$

DELIMITER ;

INSERT IGNORE INTO menus (restaurant_id, name, description, price, category, available) VALUES
(1, 'Wagyu Premium', 'Corte de wagyu con salsa de vino tinto y vegetales gourmet', 85.00, 'Carnes', true),
(1, 'Langosta Thermidor', 'Langosta gratinada con salsa cremosa y hierbas finas', 95.00, 'Mariscos', true),
(1, 'Foie Gras', 'Foie gras con compota de higo y pan brioche', 65.00, 'Entradas', true),
(2, 'Tacos al Pastor', 'Tres tacos con carne al pastor, piña, cebolla y cilantro', 12.50, 'Tacos', true),
(2, 'Quesadilla Oaxaca', 'Quesadilla con queso Oaxaca y champiñones', 15.00, 'Antojitos', true),
(2, 'Pozole Rojo', 'Pozole tradicional con carne de cerdo y garnachas', 18.00, 'Sopas', true),
(3, 'Pizza Margherita', 'Pizza clásica con tomate, mozzarella y albahaca', 16.00, 'Pizzas', true),
(3, 'Pizza Quattro Formaggi', 'Pizza con cuatro quesos italianos', 22.00, 'Pizzas', true),
(3, 'Lasagna Bolognesa', 'Lasagna tradicional con salsa bolognesa', 19.00, 'Pastas', true),
(4, 'Sashimi Variado', 'Selección de pescados frescos en sashimi', 32.00, 'Sashimi', true),
(4, 'Ramen Tonkotsu', 'Ramen con caldo de hueso de cerdo y chashu', 18.00, 'Ramen', true),
(4, 'Tempura de Camarón', 'Camarones en tempura con salsa tentsuyu', 24.00, 'Tempura', true)

INSERT IGNORE INTO restaurants (name, description, cuisine_type, address, city, phone, email, price_range, opening_hours, average_rating, total_reviews) VALUES
('Restaurant BRABUS', 'Restaurante de alta cocina con especialidades gourmet y ambiente exclusivo', 'Gourmet', 'Avenida Principal 123', 'Ciudad de México', '+52-55-1234-5678', 'reservas@brabus.com', '$$$$', '{"lunes": "12:00-23:00", "martes": "12:00-23:00", "miercoles": "12:00-23:00", "jueves": "12:00-23:00", "viernes": "12:00-00:00", "sabado": "12:00-00:00", "domingo": "12:00-22:00"}', 4.8, 25),
('Taco Mexicano', 'Auténtica comida mexicana con sabores tradicionales', 'Mexicana', 'Calle Reforma 456', 'Guadalajara', '+52-33-9876-5432', 'info@tacomexicano.com', '$', '{"lunes": "08:00-22:00", "martes": "08:00-22:00", "miercoles": "08:00-22:00", "jueves": "08:00-22:00", "viernes": "08:00-23:00", "sabado": "08:00-23:00", "domingo": "09:00-21:00"}', 4.2, 18),
('Pizza Italiana', 'Pizzas artesanales con ingredientes importados de Italia', 'Italiana', 'Boulevard Roma 789', 'Monterrey', '+52-81-5555-1234', 'contacto@pizzaitaliana.com', '$$', '{"lunes": "11:00-23:00", "martes": "11:00-23:00", "miercoles": "11:00-23:00", "jueves": "11:00-23:00", "viernes": "11:00-00:00", "sabado": "11:00-00:00", "domingo": "12:00-22:00"}', 4.5, 12),
('Sushi Zen', 'Cocina japonesa auténtica con pescado fresco importado', 'Japonesa', 'Centro Comercial Plaza Norte', 'Bogotá', '+57-1-555-0123', 'info@sushizen.com', '$$$', '{"lunes": "12:00-22:00", "martes": "12:00-22:00", "miercoles": "12:00-22:00", "jueves": "12:00-22:00", "viernes": "12:00-23:00", "sabado": "12:00-23:00", "domingo": "12:00-21:00"}', 4.7, 32),
('Burger House', 'Las mejores hamburguesas gourmet de la ciudad', 'Americana', 'Avenida Libertador 321', 'Buenos Aires', '+54-11-4444-5555', 'contacto@burgerhouse.com', '$$', '{"lunes": "11:30-23:30", "martes": "11:30-23:30", "miercoles": "11:30-23:30", "jueves": "11:30-23:30", "viernes": "11:30-00:30", "sabado": "11:30-00:30", "domingo": "12:00-23:00"}', 4.3, 28),
('Pasta Roma', 'Pasta fresca italiana hecha a mano todos los días', 'Italiana', 'Calle San Martín 567', 'Lima', '+51-1-999-8888', 'reservas@pastaroma.com', '$$', '{"lunes": "12:00-22:00", "martes": "12:00-22:00", "miercoles": "12:00-22:00", "jueves": "12:00-22:00", "viernes": "12:00-23:00", "sabado": "12:00-23:00", "domingo": "13:00-21:00"}', 4.6, 15),
('El Asador', 'Carnes a la parrilla y cortes premium', 'Parrilla', 'Boulevard del Río 890', 'Medellín', '+57-4-333-2222', 'info@elasador.com', '$$$', '{"lunes": "18:00-23:00", "martes": "18:00-23:00", "miercoles": "18:00-23:00", "jueves": "18:00-23:00", "viernes": "18:00-00:00", "sabado": "18:00-00:00", "domingo": "18:00-22:00"}', 4.4, 22),
('Café París', 'Bistró francés con ambiente romántico', 'Francesa', 'Plaza Mayor 111', 'Santiago', '+56-2-7777-6666', 'contacto@cafeparis.com', '$$$', '{"lunes": "08:00-22:00", "martes": "08:00-22:00", "miercoles": "08:00-22:00", "jueves": "08:00-22:00", "viernes": "08:00-23:00", "sabado": "09:00-23:00", "domingo": "09:00-21:00"}', 4.1, 19),
('Mariscos del Puerto', 'Pescados y mariscos frescos del día', 'Mariscos', 'Malecón Costero 222', 'Cartagena', '+57-5-444-3333', 'info@mariscospuerto.com', '$$', '{"lunes": "11:00-22:00", "martes": "11:00-22:00", "miercoles": "11:00-22:00", "jueves": "11:00-22:00", "viernes": "11:00-23:00", "sabado": "11:00-23:00", "domingo": "11:00-21:00"}', 4.0, 14),
('Vegetalia', 'Cocina vegetariana y vegana saludable', 'Vegetariana', 'Calle Verde 333', 'Quito', '+593-2-555-4444', 'hola@vegetalia.com', '$', '{"lunes": "08:00-21:00", "martes": "08:00-21:00", "miercoles": "08:00-21:00", "jueves": "08:00-21:00", "viernes": "08:00-22:00", "sabado": "09:00-22:00", "domingo": "09:00-20:00"}', 4.2, 11));

INSERT IGNORE INTO menus (restaurant_id, name, description, price, category) VALUES
(1, 'Filet Mignon BRABUS', 'Corte premium de res con salsa de trufa negra', 850.00, 'Carnes'),
(1, 'Langosta Thermidor', 'Langosta fresca gratinada con queso gruyere', 1200.00, 'Mariscos'),
(1, 'Risotto de Hongos', 'Risotto cremoso con mezcla de hongos silvestres', 450.00, 'Vegetarianos'),
(2, 'Tacos al Pastor', 'Tres tacos de cerdo marinado con piña', 85.00, 'Tacos'),
(2, 'Quesadillas de Flor de Calabaza', 'Quesadillas rellenas con flor de calabaza y queso oaxaca', 120.00, 'Antojitos'),
(3, 'Pizza Margherita', 'Pizza tradicional con tomate, mozzarella y albahaca', 220.00, 'Pizzas'),
(3, 'Pasta Carbonara', 'Pasta con huevo, pancetta y queso parmesano', 180.00, 'Pastas');