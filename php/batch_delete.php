<?php
// Headers HTTP comunes para APIs RESTful
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight request
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Requerir autenticación y rol de administrador
include_once 'auth_middleware.php';
requireAdmin();

include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

if(!$db) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos"
    ]);
    exit;
}

$student = new Student($db);

// Obtener datos del DELETE
$data = json_decode(file_get_contents("php://input"));

// Validar que tenemos un array de IDs
if(!isset($data->ids) || !is_array($data->ids) || empty($data->ids)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Se requiere un array de IDs válido"
    ]);
    exit;
}

try {
    // Ejecutar batch delete
    $result = $student->batchDelete($data->ids);
    
    if($result['total_deleted'] > 0) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Estudiantes eliminados exitosamente",
            "deleted" => $result['total_deleted'],
            "deleted_ids" => $result['success'],
            "errors" => $result['errors']
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No se pudo eliminar ningún estudiante",
            "errors" => $result['errors']
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