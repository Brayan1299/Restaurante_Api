// JavaScript principal para GastroAPI

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 GastroAPI cargado correctamente');
    
    // Inicializar funcionalidades
    initializeApp();
});

function initializeApp() {
    // Configurar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar alerts automáticos
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert-auto-dismiss');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Configurar búsqueda de restaurantes
    setupRestaurantSearch();
    
    // Configurar rating stars
    setupRatingStars();
}

function setupRestaurantSearch() {
    const searchForm = document.getElementById('restaurant-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performRestaurantSearch();
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(performRestaurantSearch, 500);
        });
    }
}

function performRestaurantSearch() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (!searchInput || !resultsContainer) return;
    
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Mostrar spinner de carga
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
    
    // Realizar búsqueda
    fetch(`/api/restaurantes/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            if (data.success) {
                displaySearchResults(data.data);
            } else {
                showAlert('Error en la búsqueda: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            showAlert('Error al realizar la búsqueda', 'danger');
        });
}

function displaySearchResults(restaurants) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (restaurants.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted text-center">No se encontraron restaurantes</p>';
        return;
    }
    
    const html = restaurants.map(restaurant => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card restaurant-card h-100">
                <img src="${restaurant.imagen || '/images/default-restaurant.jpg'}" 
                     class="card-img-top" alt="${restaurant.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${restaurant.nombre}</h5>
                    <p class="card-text text-muted">${restaurant.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="rating-stars">
                            ${generateStars(restaurant.calificacion_promedio)}
                        </div>
                        <span class="price-range">${restaurant.precio_promedio || ''}</span>
                    </div>
                    <div class="mt-2">
                        <span class="badge bg-primary">${restaurant.categoria}</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <a href="/restaurantes/${restaurant.id}" class="btn btn-primary btn-sm">Ver Detalles</a>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = `<div class="row">${html}</div>`;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Media estrella
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function setupRatingStars() {
    const ratingContainers = document.querySelectorAll('.rating-input');
    
    ratingContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const input = container.querySelector('input[name="calificacion"]');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                const rating = index + 1;
                input.value = rating;
                
                // Actualizar visualización
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
            
            star.addEventListener('mouseenter', function() {
                const rating = index + 1;
                
                stars.forEach((s, i) => {
                    if (i < rating) {
                        s.style.color = '#ffc107';
                    } else {
                        s.style.color = '#dee2e6';
                    }
                });
            });
        });
        
        container.addEventListener('mouseleave', function() {
            const currentRating = parseInt(input.value) || 0;
            
            stars.forEach((s, i) => {
                if (i < currentRating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#dee2e6';
                }
            });
        });
    });
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container') || document.body;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, 5000);
}

// Función para manejar formularios con AJAX
function submitFormAjax(formId, successCallback) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        fetch(form.action, {
            method: form.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert(result.message || 'Operación exitosa', 'success');
                if (successCallback) successCallback(result);
            } else {
                showAlert(result.message || 'Error en la operación', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error de conexión', 'danger');
        });
    });
}

// Función para cargar contenido dinámico
function loadContent(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="text-center"><div class="loading-spinner"></div> Cargando...</div>';
    
    fetch(url)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = '<div class="alert alert-danger">Error al cargar el contenido</div>';
        });
}

// Exportar funciones globales
window.GastroAPI = {
    showAlert,
    submitFormAjax,
    loadContent,
    performRestaurantSearch
};
// Función para logout
function logout() {
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Redirigir de cualquier manera
        window.location.href = '/';
    });
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Manejar formularios de autenticación
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Inicio de sesión exitoso', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    showAlert(data.message || 'Error al iniciar sesión', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error de conexión', 'danger');
            });
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            if (data.password !== data.confirmPassword) {
                showAlert('Las contraseñas no coinciden', 'danger');
                return;
            }
            
            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Registro exitoso', 'success');
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 1000);
                } else {
                    showAlert(data.message || 'Error al registrarse', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error de conexión', 'danger');
            });
        });
    }
});
