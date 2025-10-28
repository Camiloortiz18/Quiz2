<?php
/**
 * Endpoint de Login - Autenticación de usuarios
 * Ubicación: php/login.php
 * Quiz 2 - Desarrollo Web
 * 
 * Método: POST
 * Body: { "username": "...", "password": "..." }
 * Response: { "success": true, "token": "...", "user": {...} }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');


// Iniciar sesión
session_start();

include_once '../database/connection.php';
include_once '../models/User.php';

// Instanciar conexión
$database = new Database();
$db = $database->getConnection();

// Verificar que la conexión sea exitosa
if(!$db) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos"
    ]);
    exit;
}

// Instanciar objeto User
$user = new User($db);

// Obtener datos del POST
$data = json_decode(file_get_contents("php://input"));

// Validar datos recibidos
if(empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Usuario y contraseña son requeridos"
    ]);
    exit;
}

try {
    // Asignar valores
    $user->username = $data->username;
    $user->password = $data->password;

    // Intentar login
    $userData = $user->login();

    if($userData) {
        // Login exitoso - Generar token simple (session ID)
        $token = bin2hex(random_bytes(32));
        
        // Guardar en sesión
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['username'] = $userData['username'];
        $_SESSION['role'] = $userData['role'];
        $_SESSION['token'] = $token;
        $_SESSION['login_time'] = time();

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login exitoso",
            "token" => $token,
            "user" => [
                "id" => $userData['id'],
                "username" => $userData['username'],
                "email" => $userData['email'],
                "role" => $userData['role']
            ]
        ]);
    } else {
        // Login fallido
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Usuario o contraseña incorrectos"
        ]);
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error en el servidor: " . $e->getMessage()
    ]);
}
?>