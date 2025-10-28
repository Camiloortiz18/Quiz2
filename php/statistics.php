<?php
/**
 * Endpoint de Estadísticas - Datos para gráficos
 * Ubicación: php/statistics.php
 * Quiz 2 - Desarrollo Web
 * 
 * Método: GET
 * Response: Estadísticas generales y promedios por status
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');


// Requerir autenticación
include_once 'auth_middleware.php';
requireAuth();

include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

if(!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión a la base de datos"]);
    exit;
}

$student = new Student($db);

try {
    // Obtener estadísticas generales
    $stats = $student->getStatistics();
    
    // Obtener promedios por status
    $averages = $student->getAveragesByStatus();
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "statistics" => [
            "total_students" => intval($stats['total']),
            "average_grade" => round(floatval($stats['avg_grade']), 2),
            "active_students" => intval($stats['active_count']),
            "inactive_students" => intval($stats['inactive_count']),
            "graduated_students" => intval($stats['graduated_count'])
        ],
        "averages_by_status" => $averages
    ]);
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estadísticas: " . $e->getMessage()
    ]);
}
?>