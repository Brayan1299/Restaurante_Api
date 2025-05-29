const API_BASE_URL = window.location.origin + '/api';

let currentUser = null;
let currentPage = 1;
let currentFilters = {};

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadInitialData();
    setupEventListeners();
});

function setupEventListeners() {
    // Event listeners para los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const searchInput = document.getElementById('searchInput');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchRestaurants, 300));
    }

    // Event listeners para filtros
    ['cuisineFilter', 'cityFilter', 'priceFilter', 'ratingFilter'].forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', searchRestaurants);
        }
    });
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        updateUIForLoggedOutUser();
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            updateUIForLoggedInUser();
            closeModal('loginModal');
            showNotification('¡Bienvenido!', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showNotification(data.message || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('Error de conexión', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            updateUIForLoggedInUser();
            closeModal('registerModal');
            showNotification('¡Registro exitoso! Bienvenido!', 'success');
            document.getElementById('registerForm').reset();
        } else {
            showNotification(data.message || 'Error al registrarse', 'error');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        showNotification('Error de conexión', 'error');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        currentUser = null;
        updateUIForLoggedOutUser();
        showNotification('Sesión cerrada correctamente', 'success');
    } catch (error) {
        console.error('Error en logout:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('loginNav').style.display = 'none';
    document.getElementById('registerNav').style.display = 'none';
    document.getElementById('userNav').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
}

function updateUIForLoggedOutUser() {
    document.getElementById('loginNav').style.display = 'block';
    document.getElementById('registerNav').style.display = 'block';
    document.getElementById('userNav').style.display = 'none';
}

function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadCuisineTypes(),
            loadCities(),
            loadFeaturedRestaurants()
        ]);
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }
}

async function loadCuisineTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/cuisine-types`);
        if (response.ok) {
            const data = await response.json();
            populateSelect('cuisineFilter', data.cuisineTypes, 'cuisine_type', 'cuisine_type');
        }
    } catch (error) {
        console.error('Error cargando tipos de cocina:', error);
    }
}

async function loadCities() {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/cities`);
        if (response.ok) {
            const data = await response.json();
            populateSelect('cityFilter', data.cities, 'city', 'city');
        }
    } catch (error) {
        console.error('Error cargando ciudades:', error);
    }
}

async function loadFeaturedRestaurants() {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants?limit=6`);
        if (response.ok) {
            const data = await response.json();
            displayRestaurants(data.restaurants);
        }
    } catch (error) {
        console.error('Error cargando restaurantes destacados:', error);
    }
}

function populateSelect(selectId, options, valueField, textField) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Limpiar opciones existentes (excepto la primera)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option[valueField];
        optionElement.textContent = option[textField];
        select.appendChild(optionElement);
    });
}

async function searchRestaurants() {
    const searchInput = document.getElementById('searchInput');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const cityFilter = document.getElementById('cityFilter');
    const priceFilter = document.getElementById('priceFilter');
    const ratingFilter = document.getElementById('ratingFilter');

    const filters = {
        search: searchInput ? searchInput.value : '',
        cuisine_type: cuisineFilter ? cuisineFilter.value : '',
        city: cityFilter ? cityFilter.value : '',
        price_range: priceFilter ? priceFilter.value : '',
        min_rating: ratingFilter ? ratingFilter.value : ''
    };

    // Remover filtros vacíos
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    currentFilters = filters;
    currentPage = 1;

    showLoading(true);

    try {
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/restaurants/search?${queryParams}`);

        if (response.ok) {
            const data = await response.json();
            displayRestaurants(data.restaurants);
        } else {
            showNotification('Error buscando restaurantes', 'error');
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showNotification('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurantResults');
    if (!container) return;

    if (!restaurants || restaurants.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron restaurantes con los criterios seleccionados.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = restaurants.map(restaurant => createRestaurantCard(restaurant)).join('');
}

function createRestaurantCard(restaurant) {
    const rating = restaurant.average_rating || 0;
    const starsHTML = generateStarsHTML(rating);

    return `
        <div class="col-md-6 col-lg-4">
            <div class="restaurant-card" onclick="showRestaurantDetails(${restaurant.id})">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5 class="restaurant-name mb-0">${restaurant.name}</h5>
                    <span class="price-badge">${restaurant.price_range}</span>
                </div>

                <div class="mb-2">
                    <span class="cuisine-tag">${restaurant.cuisine_type}</span>
                </div>

                <p class="text-muted mb-3">${restaurant.description || 'Sin descripción disponible'}</p>

                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="rating-stars">
                        ${starsHTML}
                        <small class="text-muted ms-1">(${restaurant.total_reviews || 0})</small>
                    </div>
                </div>

                <div class="text-muted small">
                    <i class="fas fa-map-marker-alt me-1"></i>${restaurant.city}
                </div>

                ${restaurant.phone ? `
                    <div class="text-muted small">
                        <i class="fas fa-phone me-1"></i>${restaurant.phone}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }

    return html;
}

async function showRestaurantDetails(restaurantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
        if (response.ok) {
            const data = await response.json();
            displayRestaurantModal(data.restaurant);
        } else {
            showNotification('Error cargando detalles del restaurante', 'error');
        }
    } catch (error) {
        console.error('Error cargando detalles:', error);
        showNotification('Error de conexión', 'error');
    }
}

function displayRestaurantModal(restaurant) {
    const modal = document.getElementById('restaurantModal');
    const title = document.getElementById('restaurantModalTitle');
    const body = document.getElementById('restaurantModalBody');

    title.textContent = restaurant.name;

    const rating = restaurant.average_rating || 0;
    const starsHTML = generateStarsHTML(rating);

    body.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6>Información General</h6>
                <p><strong>Tipo de Cocina:</strong> ${restaurant.cuisine_type}</p>
                <p><strong>Dirección:</strong> ${restaurant.address}</p>
                <p><strong>Ciudad:</strong> ${restaurant.city}</p>
                <p><strong>Teléfono:</strong> ${restaurant.phone || 'No disponible'}</p>
                <p><strong>Email:</strong> ${restaurant.email || 'No disponible'}</p>
                <p><strong>Rango de Precio:</strong> ${restaurant.price_range}</p>

                <h6 class="mt-4">Descripción</h6>
                <p>${restaurant.description || 'Sin descripción disponible'}</p>

                ${restaurant.opening_hours ? `
                    <h6 class="mt-4">Horarios</h6>
                    <div class="opening-hours">
                        ${formatOpeningHours(restaurant.opening_hours)}
                    </div>
                ` : ''}
            </div>

            <div class="col-md-4">
                <div class="text-center">
                    <div class="rating-display mb-3">
                        <div class="rating-stars fs-4">
                            ${starsHTML}
                        </div>
                        <div class="rating-number">
                            ${rating.toFixed(1)} / 5.0
                        </div>
                        <div class="text-muted">
                            (${restaurant.total_reviews || 0} reseñas)
                        </div>
                    </div>

                    ${currentUser ? `
                        <div class="d-grid gap-2">
                            <button class="btn btn-gold" onclick="purchaseTicket(${restaurant.id})">
                                <i class="fas fa-ticket-alt me-2"></i>Comprar Ticket
                            </button>
                            <button class="btn btn-outline-secondary" onclick="writeReview(${restaurant.id})">
                                <i class="fas fa-edit me-2"></i>Escribir Reseña
                            </button>
                        </div>
                    ` : `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Inicia sesión para comprar tickets y escribir reseñas
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

function formatOpeningHours(hours) {
    if (typeof hours === 'string') {
        try {
            hours = JSON.parse(hours);
        } catch (e) {
            return 'Horarios no disponibles';
        }
    }

    if (!hours || typeof hours !== 'object') {
        return 'Horarios no disponibles';
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return days.map((day, index) => {
        const schedule = hours[day];
        if (schedule && schedule.open && schedule.close) {
            return `<div><strong>${dayNames[index]}:</strong> ${schedule.open} - ${schedule.close}</div>`;
        } else {
            return `<div><strong>${dayNames[index]}:</strong> Cerrado</div>`;
        }
    }).join('');
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';

    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function exploreRestaurants() {
    document.getElementById('restaurants').scrollIntoView({ behavior: 'smooth' });
}

// Funciones adicionales para funcionalidades futuras
async function showProfile() {
    showNotification('Funcionalidad en desarrollo', 'info');
}

async function showMyTickets() {
    showNotification('Funcionalidad en desarrollo', 'info');
}

async function showMyReviews() {
    showNotification('Funcionalidad en desarrollo', 'info');
}

async function purchaseTicket(restaurantId) {
    showNotification('Funcionalidad en desarrollo', 'info');
}

async function writeReview(restaurantId) {
    showNotification('Funcionalidad en desarrollo', 'info');
}