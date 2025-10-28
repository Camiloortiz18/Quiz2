// Configuración de la API
const API_BASE = 'http://localhost/crud_estudiantes';

// Variables globales
let isEditing = false;
let currentEditId = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function () {
    loadStudents();
    setupFormHandler();
});

// Configurar el manejador del formulario
function setupFormHandler() {
    const form = document.getElementById('studentForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (isEditing) {
            updateStudent();
        } else {
            createStudent();
        }
    });
}

// Mostrar mensaje
function showMessage(text, type = 'info') {
    const container = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    container.innerHTML = '';
    container.appendChild(messageDiv);

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Crear estudiante
async function createStudent() {
    const formData = getFormData();

    try {
        const response = await fetch(`${API_BASE}/php/create.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Estudiante creado exitosamente', 'success');
            clearForm();
            loadStudents();
        } else {
            showMessage(result.message || 'Error al crear estudiante', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Cargar estudiantes
async function loadStudents() {
    const loading = document.getElementById('loading');
    const tbody = document.getElementById('studentsBody');

    loading.classList.remove('hidden');
    tbody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/php/index.php`);
        const data = await response.json();

        loading.classList.add('hidden');

        if (response.ok && data.estudiantes) {
            displayStudents(data.estudiantes);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No hay estudiantes registrados</td></tr>';
        }
    } catch (error) {
        loading.classList.add('hidden');
        showMessage('Error al cargar estudiantes: ' + error.message, 'error');
    }
}

// Mostrar estudiantes en la tabla
function displayStudents(students) {
    const tbody = document.getElementById('studentsBody');
    tbody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.nombre}</td>
                    <td>${student.email}</td>
                    <td>${student.carrera}</td>
                    <td>${formatDate(student.created_at)}</td>
                    <td class="actions">
                        <button class="btn btn-warning" onclick="editStudent(${student.id})">Editar</button>
                        <button class="btn btn-danger" onclick="deleteStudent(${student.id})">Eliminar</button>
                    </td>
                `;
        tbody.appendChild(row);
    });
}

// Editar estudiante
async function editStudent(id) {
    try {
        const response = await fetch(`${API_BASE}/php/read_one.php?id=${id}`);
        const student = await response.json();

        if (response.ok) {
            // Llenar el formulario con los datos del estudiante
            document.getElementById('studentId').value = id;
            document.getElementById('nombre').value = student.nombre;
            document.getElementById('email').value = student.email;
            document.getElementById('carrera').value = student.carrera;

            // Cambiar el estado a edición
            isEditing = true;
            currentEditId = id;

            // Actualizar interfaz
            document.querySelector('.section-title').textContent = 'Editar Estudiante';
            document.getElementById('submitBtn').textContent = 'Actualizar Estudiante';
            document.getElementById('submitBtn').className = 'btn btn-success';
            document.getElementById('cancelBtn').classList.remove('hidden');

            // Scroll al formulario
            document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });

        } else {
            showMessage(student.message || 'Error al cargar estudiante', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Actualizar estudiante
async function updateStudent() {
    const formData = getFormData();
    formData.id = currentEditId;

    try {
        const response = await fetch(`${API_BASE}/php/update.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Estudiante actualizado exitosamente', 'success');
            cancelEdit();
            loadStudents();
        } else {
            showMessage(result.message || 'Error al actualizar estudiante', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Eliminar estudiante
async function deleteStudent(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este estudiante?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/php/delete.php`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Estudiante eliminado exitosamente', 'success');
            loadStudents();
        } else {
            showMessage(result.message || 'Error al eliminar estudiante', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión: ' + error.message, 'error');
    }
}

// Cancelar edición
function cancelEdit() {
    isEditing = false;
    currentEditId = null;

    // Restaurar interfaz
    document.querySelector('.section-title').textContent = 'Agregar Estudiante';
    document.getElementById('submitBtn').textContent = 'Agregar Estudiante';
    document.getElementById('submitBtn').className = 'btn btn-primary';
    document.getElementById('cancelBtn').classList.add('hidden');

    clearForm();
}

// Obtener datos del formulario
function getFormData() {
    return {
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        carrera: document.getElementById('carrera').value
    };
}

// Limpiar formulario
function clearForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}