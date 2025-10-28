<?php
/**
 * Endpoint de Logout - Cerrar sesión
 * Ubicación: php/logout.php
 * Quiz 2 - Desarrollo Web
 * 
 * Método: POST
 * Response: { "success": true, "message": "..." }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

session_start();

// Destruir todas las variables de sesión
$_SESSION = array();

// Destruir la cookie de sesión si existe
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time()-3600, '/');
}

// Destruir la sesión
session_destroy();

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada exitosamente"
]);
?>