# Restaurant BRABUS 🍽️

Sistema completo de gestión y descubrimiento de restaurantes con todas las funcionalidades implementadas.

## 🚀 Funcionalidades Implementadas

### ✅ Autenticación de Usuarios
- Registro de nuevos usuarios
- Inicio de sesión con JWT
- Gestión de perfil de usuario
- Middleware de autenticación

### ✅ CRUD de Restaurantes
- Crear, leer, actualizar y eliminar restaurantes
- Gestión completa de información del restaurante
- Validaciones de entrada
- Arquitectura MVC implementada

### ✅ Sistema de Reseñas y Puntuación
- Los usuarios pueden escribir reseñas
- Sistema de calificación de 1-5 estrellas
- Visualización de reseñas por restaurante
- Cálculo automático de calificación promedio

### ✅ Filtrado Avanzado
- **Por tipo de cocina**: Italiana, Mexicana, Japonesa, etc.
- **Por ubicación**: Ciudad/región
- **Por precio**: $, $$, $$$, $$$$
- **Por calificación**: Mínima calificación requerida
- **Búsqueda por texto**: Nombre y descripción

### ✅ Sistema de Recomendaciones
- Recomendaciones personalizadas basadas en historial
- Recomendaciones colaborativas
- Restaurantes trending
- Restaurantes mejor calificados
- Recomendaciones mixtas

### ✅ Sistema de Tickets/Compras
- Compra de tickets para restaurantes
- Generación de códigos QR
- Gestión de estado de tickets
- Historial de compras

### ✅ Interfaz Gráfica (GUI)
- Diseño responsivo con Bootstrap 5
- Interfaz moderna y atractiva
- Modales para interacciones
- Sistema de notificaciones

### ✅ Gestión de Menús
- CRUD completo de menús por restaurante
- Categorización de platillos
- Precios y disponibilidad

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **MySQL** como base de datos
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **express-validator** para validaciones

### Frontend
- **HTML5, CSS3, JavaScript**
- **Bootstrap 5** para diseño responsivo
- **Font Awesome** para iconos
- **Fetch API** para comunicación con backend

### Arquitectura
- **Patrón MVC** (Model-View-Controller)
- **Middleware** personalizado para autenticación y validaciones
- **Servicios** para lógica de negocio
- **Utilidades** para respuestas estandarizadas

## 📁 Estructura del Proyecto

```
restaurant-brabus/
├── config/
│   ├── database.js          # Configuración de base de datos
│   ├── config.js           # Configuraciones generales
│   └── init.sql            # Script de inicialización DB
├── controllers/
│   ├── authController.js    # Autenticación
│   ├── restaurantController.js # CRUD restaurantes
│   ├── reviewController.js  # Sistema de reseñas
│   ├── menuController.js    # Gestión de menús
│   ├── recommendationController.js # Recomendaciones
│   └── ticketController.js  # Sistema de tickets
├── middleware/
│   ├── auth.js             # Middleware de autenticación
│   └── validation.js       # Validaciones
├── models/
│   ├── User.js             # Modelo de usuario
│   ├── Restaurant.js       # Modelo de restaurante
│   ├── Review.js           # Modelo de reseña
│   └── Menu.js             # Modelo de menú
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   ├── restaurants.js      # Rutas de restaurantes
│   ├── reviews.js          # Rutas de reseñas
│   ├── menus.js            # Rutas de menús
│   ├── recommendations.js  # Rutas de recomendaciones
│   └── tickets.js          # Rutas de tickets
├── services/
│   ├── recommendationService.js # Lógica de recomendaciones
│   ├── emailService.js     # Servicio de email
│   └── ticketService.js    # Lógica de tickets
├── utils/
│   ├── response.js         # Respuestas estandarizadas
│   └── validators.js       # Validadores personalizados
├── public/
│   ├── index.html          # Interfaz principal
│   └── app.js              # JavaScript del frontend
└── app.js                  # Punto de entrada de la aplicación
```

## 🚀 Instalación y Configuración

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd restaurant-brabus
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` con:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=restaurante_app
JWT_SECRET=tu_jwt_secret
PORT=5000
```

4. **Inicializar la base de datos**
La base de datos se inicializa automáticamente al ejecutar la aplicación.

5. **Ejecutar la aplicación**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:5000`

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/logout` - Cerrar sesión

### Restaurantes
- `GET /api/restaurants` - Listar restaurantes (con filtros)
- `GET /api/restaurants/:id` - Obtener restaurante específico
- `POST /api/restaurants` - Crear restaurante (autenticado)
- `PUT /api/restaurants/:id` - Actualizar restaurante (autenticado)
- `DELETE /api/restaurants/:id` - Eliminar restaurante (autenticado)
- `GET /api/restaurants/cuisine-types` - Tipos de cocina
- `GET /api/restaurants/cities` - Ciudades disponibles
- `GET /api/restaurants/top-rated` - Mejor calificados

### Reseñas
- `GET /api/reviews` - Listar reseñas
- `POST /api/reviews` - Crear reseña (autenticado)
- `GET /api/reviews/my-reviews` - Mis reseñas (autenticado)
- `GET /api/reviews/restaurant/:id` - Reseñas por restaurante

### Menús
- `GET /api/menus/restaurant/:id` - Menú de restaurante
- `POST /api/menus` - Crear item de menú (autenticado)
- `PUT /api/menus/:id` - Actualizar item (autenticado)
- `DELETE /api/menus/:id` - Eliminar item (autenticado)

### Recomendaciones
- `GET /api/recommendations/personalized` - Recomendaciones personalizadas
- `GET /api/recommendations/trending` - Restaurantes trending
- `GET /api/recommendations/similar/:id` - Similares a un restaurante

### Tickets
- `POST /api/tickets/purchase` - Comprar ticket (autenticado)
- `GET /api/tickets/my-tickets` - Mis tickets (autenticado)
- `GET /api/tickets/verify/:code` - Verificar ticket

## 🔧 Características Técnicas

### Seguridad
- Autenticación JWT
- Hash de contraseñas con bcrypt
- Validación de entrada en todas las rutas
- Sanitización de datos
- Middleware de autenticación

### Base de Datos
- Conexión MySQL con pool de conexiones
- Triggers para actualización automática de calificaciones
- Índices optimizados para consultas rápidas
- Manejo de transacciones

### Frontend
- SPA (Single Page Application)
- Diseño responsivo
- Manejo de estados de autenticación
- Sistema de notificaciones
- Modales interactivos

## 📱 Uso de la Aplicación

1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Explorar**: Navegar por restaurantes disponibles
3. **Filtrar**: Usar filtros para encontrar restaurantes específicos
4. **Reseñar**: Escribir reseñas y calificar restaurantes visitados
5. **Recomendaciones**: Recibir sugerencias personalizadas
6. **Perfil**: Gestionar información personal y ver historial

## 🤝 Contribución

Este proyecto está completamente funcional y listo para producción. Todas las funcionalidades solicitadas han sido implementadas y probadas.

## 📄 Licencia

Este proyecto es de uso académico y personal.

---

**Restaurant BRABUS** - Sistema completo de gestión de restaurantes 🍽️