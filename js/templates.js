/**
 * Módulo de Templates y Visualización
 * Ubicación: js/templates.js
 * Quiz 2 - Desarrollo Web
 * 
 * Funciones para renderizar componentes, gráficos y tablas
 */

/**
 * Renderizar gráfico de barras usando Canvas
 * @param {string} canvasId - ID del elemento canvas
 * @param {array} data - Datos del gráfico [{label, value, color}]
 * @param {string} title - Título del gráfico
 */
export function renderBarChart(canvasId, data, title = '') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Configuración
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length - 20;
    const maxValue = Math.max(...data.map(d => d.value));
    
    // Título
    if (title) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 25);
    }
    
    // Dibujar barras con animación
    data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding + (index * (chartWidth / data.length)) + 10;
        const y = height - padding - barHeight;
        
        // Barra con gradiente
        const gradient = ctx.createLinearGradient(x, y, x, height - padding);
        gradient.addColorStop(0, item.color || '#667eea');
        gradient.addColorStop(1, item.color ? adjustColor(item.color, -20) : '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Borde de la barra
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Valor sobre la barra
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.fillText(
            item.value.toFixed(2), 
            x + barWidth / 2, 
            y - 5
        );
        
        // Etiqueta debajo de la barra
        ctx.font = '12px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText(
            item.label, 
            x + barWidth / 2, 
            height - padding + 20
        );
    });
    
    // Línea base
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Renderizar gráfico de dona usando Canvas
 */
export function renderDonutChart(canvasId, data, title = '') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const innerRadius = radius * 0.6;
    
    ctx.clearRect(0, 0, width, height);
    
    // Título
    if (title) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, 25);
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // Dibujar segmentos
    data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // Segmento
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        ctx.fillStyle = item.color || getColorByIndex(index);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Etiqueta
        const midAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(midAngle) * (radius + 30);
        const labelY = centerY + Math.sin(midAngle) * (radius + 30);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? 'right' : 'left';
        ctx.fillText(`${item.label}: ${item.value}`, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
    
    // Centro con total
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, centerX, centerY);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('Total', centerX, centerY + 20);
}

/**
 * Renderizar fila de estudiante en la tabla
 */
export function renderStudentRow(student, canEdit = true, canDelete = true) {
    const statusBadge = getStatusBadge(student.status);
    const gradeBadge = getGradeBadge(student.grade);
    
    return `
        <tr data-id="${student.id}" class="student-row">
            <td>
                <input type="checkbox" class="student-checkbox" value="${student.id}">
            </td>
            <td>${student.id}</td>
            <td>${student.nombre}</td>
            <td>${student.email}</td>
            <td>${student.carrera}</td>
            <td>${gradeBadge}</td>
            <td>${statusBadge}</td>
            <td>${formatDate(student.created_at)}</td>
            <td class="actions">
                ${canEdit ? `<button class="btn btn-warning btn-sm" onclick="editStudent(${student.id})">Editar</button>` : ''}
                ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id})">Eliminar</button>` : ''}
            </td>
        </tr>
    `;
}

/**
 * Renderizar badge de estado
 */
function getStatusBadge(status) {
    const statusConfig = {
        'active': { label: 'Activo', color: '#10b981'},
        'inactive': { label: 'Inactivo', color: '#f59e0b'},
        'graduated': { label: 'Graduado', color: '#3b82f6'}
    };
    
    const config = statusConfig[status] || statusConfig['active'];
    
    return `
        <span class="badge" style="background: ${config.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">
            ${config.emoji} ${config.label}
        </span>
    `;
}

/**
 * Renderizar badge de nota
 */
function getGradeBadge(grade) {
    if (grade === null || grade === undefined) {
        return '<span class="badge" style="background: #94a3b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Sin nota</span>';
    }
    
    const gradeNum = parseFloat(grade);
    let color = '#10b981'; // Verde por defecto
    
    if (gradeNum < 3.0) {
        color = '#ef4444'; // Rojo
    } else if (gradeNum < 4.0) {
        color = '#f59e0b'; // Amarillo
    }
    
    return `
        <span class="badge" style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
            ${gradeNum.toFixed(2)}
        </span>
    `;
}

/**
 * Renderizar controles de paginación
 */
export function renderPagination(pagination, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;
    
    const { page, total_pages } = pagination;
    let html = '<div class="pagination">';
    
    // Botón anterior
    html += `
        <button class="btn btn-sm ${page === 1 ? 'disabled' : ''}" 
                onclick="changePage(${page - 1})" 
                ${page === 1 ? 'disabled' : ''}>
            ← Anterior
        </button>
    `;
    
    // Números de página
    for (let i = 1; i <= total_pages; i++) {
        if (
            i === 1 || 
            i === total_pages || 
            (i >= page - 2 && i <= page + 2)
        ) {
            html += `
                <button class="btn btn-sm ${i === page ? 'btn-primary' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span class="pagination-dots">...</span>';
        }
    }
    
    // Botón siguiente
    html += `
        <button class="btn btn-sm ${page === total_pages ? 'disabled' : ''}" 
                onclick="changePage(${page + 1})" 
                ${page === total_pages ? 'disabled' : ''}>
            Siguiente →
        </button>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Renderizar mensaje de alerta
 */
export function showAlert(container, message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    const iconMap = {
        'success': '✓',
        'error': '✗',
        'warning': '⚠',
        'info': 'ℹ'
    };
    
    const html = `
        <div class="alert ${alertClass[type]}" role="alert">
            <span class="alert-icon">${iconMap[type]}</span>
            <span>${message}</span>
        </div>
    `;
    
    if (typeof container === 'string') {
        document.getElementById(container).innerHTML = html;
    } else {
        container.innerHTML = html;
    }
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        if (typeof container === 'string') {
            document.getElementById(container).innerHTML = '';
        } else {
            container.innerHTML = '';
        }
    }, 5000);
}

/**
 * Renderizar skeleton loader
 */
export function renderSkeleton(container, count = 5) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <tr class="skeleton-row">
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
                <td><div class="skeleton-box"></div></td>
            </tr>
        `;
    }
    
    if (typeof container === 'string') {
        document.getElementById(container).innerHTML = html;
    } else {
        container.innerHTML = html;
    }
}

// ============================================
// Funciones auxiliares
// ============================================

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Ajustar color (más claro u oscuro)
 */
function adjustColor(color, amount) {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/**
 * Obtener color por índice
 */
function getColorByIndex(index) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe', 
        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
    ];
    return colors[index % colors.length];
}