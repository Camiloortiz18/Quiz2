/**
 * Módulo Principal de la Aplicación
 * Ubicación: js/app.js
 * Quiz 2 - Desarrollo Web
 * 
 * Importa y utiliza los módulos de autenticación y templates
 * Incluye: Optimistic UI, Debounce, Polling, Paginación
 */

import * as Auth from './auth.js';
import * as Templates from './templates.js';

// Configuración
const API_BASE = 'http://localhost/crud_estudiantes';
const ITEMS_PER_PAGE = 10;
const POLLING_INTERVAL = 30000; // 30 segundos
const DEBOUNCE_DELAY = 500; // 500ms

// Estado global
let currentPage = 1;
let currentFilters = {};
let isEditing = false;
let currentEditId = null;
let pollingTimer = null;
let studentsCache = [];

// ============================================
// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!Auth.requireAuth()) {
        return;
    }
    
    initializeApp();
});

/**
 * Inicializar aplicación
 */
function initializeApp() {
    const user = Auth.getCurrentUser();
    
    // Mostrar información del usuario
    displayUserInfo(user);
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar formulario
    setupFormHandler();
    
    // Configurar búsqueda con debounce
    setupSearchWithDebounce();
    
    // Configurar filtros
    setupFilters();
    
    // Configurar selección múltiple
    setupBatchSelection();
    
    // Cargar datos iniciales
    loadStudents();
    loadStatistics();
    
    // Iniciar polling
    startPolling();
    
    // Limpiar polling al salir
    window.addEventListener('beforeunload', () => {
        stopPolling();
    });
}

/**
 * Mostrar información del usuario en el header
 */
function displayUserInfo(user) {
    const userInfoContainer = document.getElementById('userInfo');
    if (!userInfoContainer) return;
    
    const roleLabel = user.role === 'admin' ? 'Administrador' : 'Estudiante';
    const roleEmoji = user.role === 'admin';
    
    userInfoContainer.innerHTML = `
        <div class="user-info">
            <span class="user-greeting">Hola, <strong>${user.username}</strong> ${roleEmoji}</span>
            <span class="user-role">${roleLabel}</span>
            <button class="btn btn-sm btn-secondary" onclick="handleLogout()">Cerrar Sesión</button>
        </div>
    `;
}

/**
 * Configurar navegación
 */
function setupNavigation() {
    // Marcar página actual
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Gestión de estudiantes (CRUD)
// ============================================

/**
 * Cargar estudiantes con filtros y paginación
 */
async function loadStudents(showLoading = true) {
    const tbody = document.getElementById('studentsBody');
    const loadingEl = document.getElementById('loading');
    
    if (showLoading && loadingEl) {
        loadingEl.classList.remove('hidden');
        Templates.renderSkeleton(tbody, 5);
    }
    
    try {
        // Construir query string con filtros
        const params = new URLSearchParams({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            ...currentFilters
        });
        
        const response = await fetch(`${API_BASE}/php/students.php?${params}`, {
            headers: Auth.getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (response.ok && data.success) {
            studentsCache = data.estudiantes;
            displayStudents(data.estudiantes);
            Templates.renderPagination(data.pagination, 'paginationContainer');
            updateStudentCount(data.pagination.total);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #7f8c8d;">
                        ${data.message || 'No se encontraron estudiantes'}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        if (loadingEl) loadingEl.classList.add('hidden');
        Templates.showAlert('messageContainer', 'Error al cargar estudiantes: ' + error.message, 'error');
    }
}

/**
 * Mostrar estudiantes en la tabla
 */
function displayStudents(students) {
    const tbody = document.getElementById('studentsBody');
    const user = Auth.getCurrentUser();
    const isAdmin = user.role === 'admin';
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #7f8c8d;">
                    No hay estudiantes registrados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = students.map(student => 
        Templates.renderStudentRow(student, true, isAdmin)
    ).join('');
}

/**
 * Crear estudiante con Optimistic UI
 */
async function createStudent(formData) {
    const tempId = Date.now();
    const tempStudent = {
        id: tempId,
        ...formData,
        status: 'active',
        created_at: new Date().toISOString()
    };
    
    // Optimistic UI: Agregar inmediatamente a la vista
    studentsCache.unshift(tempStudent);
    displayStudents(studentsCache);
    Templates.showAlert('messageContainer', 'Creando estudiante...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/php/create.php`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            Templates.showAlert('messageContainer', 'Estudiante creado exitosamente', 'success');
            clearForm();
            // Recargar para obtener datos actualizados del servidor
            await loadStudents(false);
        } else {
            // Rollback: Remover el estudiante temporal
            studentsCache = studentsCache.filter(s => s.id !== tempId);
            displayStudents(studentsCache);
            Templates.showAlert('messageContainer', result.message || 'Error al crear estudiante', 'error');
        }
    } catch (error) {
        // Rollback en caso de error
        studentsCache = studentsCache.filter(s => s.id !== tempId);
        displayStudents(studentsCache);
        Templates.showAlert('messageContainer', 'Error de conexión: ' + error.message, 'error');
    }
}

/**
 * Actualizar estudiante con Optimistic UI
 */
async function updateStudent(id, formData) {
    // Guardar estado anterior para rollback
    const oldStudent = studentsCache.find(s => s.id === id);
    const oldIndex = studentsCache.findIndex(s => s.id === id);
    
    // Optimistic UI: Actualizar inmediatamente
    studentsCache[oldIndex] = { ...oldStudent, ...formData };
    displayStudents(studentsCache);
    Templates.showAlert('messageContainer', 'Actualizando estudiante...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/php/update.php`, {
            method: 'PUT',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ id, ...formData })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            Templates.showAlert('messageContainer', 'Estudiante actualizado exitosamente', 'success');
            cancelEdit();
            await loadStudents(false);
        } else {
            // Rollback: Restaurar estado anterior
            studentsCache[oldIndex] = oldStudent;
            displayStudents(studentsCache);
            Templates.showAlert('messageContainer', result.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        // Rollback
        studentsCache[oldIndex] = oldStudent;
        displayStudents(studentsCache);
        Templates.showAlert('messageContainer', 'Error de conexión: ' + error.message, 'error');
    }
}

/**
 * Eliminar estudiante con confirmación
 */
window.deleteStudent = async function(id) {
    if (!confirm('¿Estás seguro de eliminar este estudiante?')) {
        return;
    }
    
    // Optimistic UI
    const oldStudents = [...studentsCache];
    studentsCache = studentsCache.filter(s => s.id !== id);
    displayStudents(studentsCache);
    Templates.showAlert('messageContainer', 'Eliminando estudiante...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/php/delete.php`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            Templates.showAlert('messageContainer', 'Estudiante eliminado exitosamente', 'success');
            await loadStudents(false);
        } else {
            // Rollback
            studentsCache = oldStudents;
            displayStudents(studentsCache);
            Templates.showAlert('messageContainer', result.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        // Rollback
        studentsCache = oldStudents;
        displayStudents(studentsCache);
        Templates.showAlert('messageContainer', 'Error de conexión: ' + error.message, 'error');
    }
};

/**
 * Cargar estudiante para editar
 */
window.editStudent = async function(id) {
    try {
        const response = await fetch(`${API_BASE}/php/read_one.php?id=${id}`, {
            headers: Auth.getAuthHeaders()
        });
        
        const student = await response.json();
        
        if (response.ok) {
            // Llenar formulario
            document.getElementById('studentId').value = id;
            document.getElementById('nombre').value = student.nombre;
            document.getElementById('email').value = student.email;
            document.getElementById('carrera').value = student.carrera;
            document.getElementById('grade').value = student.grade || '';
            document.getElementById('status').value = student.status || 'active';
            
            // Cambiar UI a modo edición
            isEditing = true;
            currentEditId = id;
            document.querySelector('.section-title').textContent = 'Editar Estudiante';
            document.getElementById('submitBtn').textContent = 'Actualizar';
            document.getElementById('submitBtn').className = 'btn btn-success';
            document.getElementById('cancelBtn').classList.remove('hidden');
            
            // Scroll al formulario
            document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        Templates.showAlert('messageContainer', 'Error al cargar estudiante: ' + error.message, 'error');
    }
};

// ============================================
// Formulario
// ============================================

/**
 * Configurar manejador del formulario
 */
function setupFormHandler() {
    const form = document.getElementById('studentForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            carrera: document.getElementById('carrera').value,
            grade: document.getElementById('grade')?.value || null,
            status: document.getElementById('status')?.value || 'active'
        };
        
        if (isEditing) {
            await updateStudent(currentEditId, formData);
        } else {
            await createStudent(formData);
        }
    });
}

/**
 * Cancelar edición
 */
window.cancelEdit = function() {
    isEditing = false;
    currentEditId = null;
    
    document.querySelector('.section-title').textContent = 'Agregar Estudiante';
    document.getElementById('submitBtn').textContent = 'Agregar';
    document.getElementById('submitBtn').className = 'btn btn-primary';
    document.getElementById('cancelBtn').classList.add('hidden');
    
    clearForm();
};

/**
 * Limpiar formulario
 */
function clearForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
}

// ============================================
// Búsqueda con Debounce
// ============================================

let searchTimeout;

function setupSearchWithDebounce() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value.trim();
            currentPage = 1;
            loadStudents();
        }, DEBOUNCE_DELAY);
    });
}

// ============================================
// Filtros
// ============================================

function setupFilters() {
    // Filtro por status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            currentPage = 1;
            loadStudents();
        });
    }
    
    // Filtro por carrera
    const carreraFilter = document.getElementById('carreraFilter');
    if (carreraFilter) {
        carreraFilter.addEventListener('change', (e) => {
            currentFilters.carrera = e.target.value;
            currentPage = 1;
            loadStudents();
        });
    }
}

// ============================================
// Selección múltiple y Batch Delete
// ============================================

function setupBatchSelection() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    
    if (!selectAllCheckbox || !batchDeleteBtn) return;
    
    // Seleccionar/deseleccionar todos
    selectAllCheckbox.addEventListener('change', (e) => {
        document.querySelectorAll('.student-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
        updateBatchDeleteButton();
    });

    // Actualizar botón al seleccionar individualmente
    document.getElementById('studentsBody').addEventListener('change', (e) => {
        if (e.target.classList.contains('student-checkbox')) { 
            updateBatchDeleteButton();
        }
    });
    
    // Batch delete
    batchDeleteBtn.addEventListener('click', handleBatchDelete);
}

function updateBatchDeleteButton() {
    const selected = document.querySelectorAll('.student-checkbox:checked');
    const btn = document.getElementById('batchDeleteBtn');
    
    if (btn) {
        btn.textContent = `Eliminar seleccionados (${selected.length})`;
        btn.disabled = selected.length === 0;
    }
}

async function handleBatchDelete() {
    const selectedIds = Array.from(document.querySelectorAll('.student-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        Templates.showAlert('messageContainer', 'No hay estudiantes seleccionados', 'warning');
        return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar ${selectedIds.length} estudiante(s)?`)) {
        return;
    }
    
    // Optimistic UI
    const oldStudents = [...studentsCache];
    studentsCache = studentsCache.filter(s => !selectedIds.includes(s.id));
    displayStudents(studentsCache);
    Templates.showAlert('messageContainer', 'Eliminando estudiantes...', 'info');
    
    try {
        const response = await fetch(`${API_BASE}/php/batch_delete.php`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({ ids: selectedIds })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            Templates.showAlert('messageContainer', 
                `${result.deleted} estudiante(s) eliminado(s) exitosamente`, 'success');
            await loadStudents(false);
        } else {
            // Rollback
            studentsCache = oldStudents;
            displayStudents(studentsCache);
            Templates.showAlert('messageContainer', 
                result.message || 'Error al eliminar estudiantes', 'error');
        }
    } catch (error) {
        // Rollback
        studentsCache = oldStudents;
        displayStudents(studentsCache);
        Templates.showAlert('messageContainer', 'Error de conexión: ' + error.message, 'error');
    }
}

// ============================================
// Paginación
// ============================================

window.changePage = function(page) {
    currentPage = page;
    loadStudents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================
// Estadísticas y Gráficos
// ============================================

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/php/statistics.php`, {
            headers: Auth.getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayStatistics(data.statistics);
            renderCharts(data.averages_by_status);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Mostrar estadísticas en cards
 */
function displayStatistics(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total_students}</div>
                <div class="stat-label">Total Estudiantes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.average_grade.toFixed(2)}</div>
                <div class="stat-label">Promedio General</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.active_students}</div>
                <div class="stat-label">Activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.graduated_students}</div>
                <div class="stat-label">Graduados</div>
            </div>
        </div>
    `;
}

/**
 * Renderizar gráficos
 */
function renderCharts(averages) {
    // Preparar datos para gráfico de barras
    const chartData = averages.map(avg => ({
        label: getStatusLabel(avg.status),
        value: parseFloat(avg.avg_grade) || 0,
        color: getStatusColor(avg.status)
    }));
    
    // Renderizar gráfico de barras
    if (document.getElementById('gradesChart')) {
        Templates.renderBarChart('gradesChart', chartData, 'Promedio de notas por estado');
    }
    
    // Preparar datos para gráfico de dona
    const donutData = averages.map(avg => ({
        label: getStatusLabel(avg.status),
        value: parseInt(avg.count),
        color: getStatusColor(avg.status)
    }));
    
    // Renderizar gráfico de dona
    if (document.getElementById('statusChart')) {
        Templates.renderDonutChart('statusChart', donutData, 'Distribución por estado');
    }
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Activos',
        'inactive': 'Inactivos',
        'graduated': 'Graduados'
    };
    return labels[status] || status;
}

function getStatusColor(status) {
    const colors = {
        'active': '#10b981',
        'inactive': '#f59e0b',
        'graduated': '#3b82f6'
    };
    return colors[status] || '#667eea';
}

// ============================================
// Polling para actualizaciones en tiempo real
// ============================================

function startPolling() {
    pollingTimer = setInterval(() => {
        loadStudents(false); // Sin mostrar loading
        loadStatistics();
    }, POLLING_INTERVAL);
}

function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

// ============================================
// Logout
// ============================================

window.handleLogout = async function() {
    if (!confirm('¿Deseas cerrar sesión?')) {
        return;
    }
    
    await Auth.logout();
    window.location.href = 'login.html';
};

// ============================================
// Actualizar contador de estudiantes
// ============================================

function updateStudentCount(count) {
    const countElements = document.querySelectorAll('.student-count');
    countElements.forEach(el => {
        el.textContent = count;
    });
    
    // Actualizar en footer si existe
    const footerCount = document.getElementById('footerStudentsCount');
    if (footerCount) {
        footerCount.textContent = count;
    }
}

// ============================================
// Exportar funciones globales necesarias
// ============================================

window.loadStudents = loadStudents;
window.loadStatistics = loadStatistics;

console.log('Aplicación inicializada correctamente');