/**
 * Módulo de Autenticación (ES6 Module)
 * Ubicación: js/auth.js
 * Quiz 2 - Desarrollo Web
 * 
 * Maneja login, logout, verificación de sesión y tokens
 */

const API_BASE = 'http://localhost/crud_estudiantes';

/**
 * Guardar token y datos de usuario en localStorage
 */
export function saveAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTime', Date.now().toString());
}

/**
 * Obtener token del localStorage
 */
export function getToken() {
    return localStorage.getItem('token');
}

/**
 * Obtener datos del usuario actual
 */
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated() {
    const token = getToken();
    const user = getCurrentUser();
    const loginTime = localStorage.getItem('loginTime');

    if (!token || !user || !loginTime) {
        return false;
    }

    // Verificar si la sesión ha expirado (2 horas)
    const elapsed = Date.now() - parseInt(loginTime);
    const twoHours = 2 * 60 * 60 * 1000;

    if (elapsed > twoHours) {
        clearAuthData();
        return false;
    }

    return true;
}

/**
 * Verificar si el usuario es administrador
 */
export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Verificar si el usuario es estudiante
 */
export function isStudent() {
    const user = getCurrentUser();
    return user && user.role === 'student';
}

/**
 * Limpiar datos de autenticación
 */
export function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
}

/**
 * Login - Autenticar usuario
 */
export async function login(username, password) {
    try {

        const response = await fetch(`${API_BASE}/php/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            saveAuthData(data.token, data.user);
            return { success: true, user: data.user };
        } else {
            return { success: false, message: data.message || 'Error de autenticación' };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, message: 'Error de conexión: ' + error.message };
    }
}

/**
 * Logout - Cerrar sesión
 */
export async function logout() {
    try {
        const token = getToken();

        await fetch(`${API_BASE}/php/logout.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        clearAuthData();
        return { success: true };
    } catch (error) {
        console.error('Error en logout:', error);
        clearAuthData();
        return { success: false, message: error.message };
    }
}

/**
 * Obtener headers con autenticación
 */
export function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Redirigir a login si no está autenticado
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Redirigir a index si ya está autenticado
 */
export function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'index.html';
        return true;
    }
    return false;
}

// ============================================
// Inicialización de la página de login
// ============================================

if (window.location.pathname.includes('login.html')) {
    // Redirigir si ya está autenticado
    redirectIfAuthenticated();

    // Configurar formulario de login
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const messageContainer = document.getElementById('messageContainer');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Validaciones
            if (!username || !password) {
                showMessage('Por favor completa todos los campos', 'error');
                return;
            }

            // Deshabilitar botón y mostrar loading
            loginBtn.disabled = true;
            loginBtn.querySelector('.btn-text').classList.add('hidden');
            loginBtn.querySelector('.btn-loading').classList.remove('hidden');

            // Intentar login
            const result = await login(username, password);

            if (result.success) {
                showMessage('¡Login exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage(result.message, 'error');
                loginBtn.disabled = false;
                loginBtn.querySelector('.btn-text').classList.remove('hidden');
                loginBtn.querySelector('.btn-loading').classList.add('hidden');
            }
        });

        function showMessage(text, type = 'info') {
            messageContainer.innerHTML = `
                <div class="message ${type}">
                    ${text}
                </div>
            `;

            setTimeout(() => {
                messageContainer.innerHTML = '';
            }, 5000);
        }
    });
}