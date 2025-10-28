<?php
/**
 * Middleware de Autenticación
 * Ubicación: php/auth_middleware.php
 * Quiz 2 - Desarrollo Web
 * 
 * Verifica que el usuario esté autenticado antes de acceder a recursos protegidos
 * Uso: include_once 'auth_middleware.php'; al inicio de endpoints protegidos
 */

session_start();

/**
 * Verificar si el usuario está autenticado
 * @return bool
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && 
           isset($_SESSION['token']) && 
           isset($_SESSION['login_time']);
}

/**
 * Verificar si la sesión ha expirado (2 horas)
 * @return bool
 */
function isSessionExpired() {
    if(!isset($_SESSION['login_time'])) {
        return true;
    }
    $timeout = 7200; // 2 horas en segundos
    return (time() - $_SESSION['login_time']) > $timeout;
}

/**
 * Obtener el usuario actual desde la sesión
 * @return array|null
 */
function getCurrentUser() {
    if(isAuthenticated()) {
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ];
    }
    return null;
}

/**
 * Verificar si el usuario es admin
 * @return bool
 */
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

/**
 * Verificar si el usuario es estudiante
 * @return bool
 */
function isStudent() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'student';
}

/**
 * Requerir autenticación - Detener ejecución si no está autenticado
 */
function requireAuth() {
    if(!isAuthenticated()) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "No autorizado. Por favor inicie sesión."
        ]);
        exit;
    }
    
    if(isSessionExpired()) {
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Sesión expirada. Por favor inicie sesión nuevamente."
        ]);
        exit;
    }
    
    // Renovar tiempo de sesión
    $_SESSION['login_time'] = time();
}

/**
 * Requerir rol de administrador
 */
function requireAdmin() {
    requireAuth();
    
    if(!isAdmin()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Acceso denegado. Se requiere rol de administrador."
        ]);
        exit;
    }
}

/**
 * Verificar que el token en el header coincida con el de la sesión
 */
function verifyToken() {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if(!$token || !isset($_SESSION['token']) || $token !== $_SESSION['token']) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Token inválido o no proporcionado"
        ]);
        exit;
    }
}
?>