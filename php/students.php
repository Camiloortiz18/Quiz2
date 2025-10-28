<?php
/**
 * Endpoint avanzado de estudiantes con filtros y paginación
 * Ubicación: php/students.php
 * Quiz 2 - Desarrollo Web
 * 
 * GET: Listar estudiantes con filtros
 * Parámetros: search, status, grade_min, grade_max, carrera, limit, page
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
$currentUser = getCurrentUser();

// Construir filtros desde query parameters
$filters = [];

if(isset($_GET['search'])) {
    $filters['search'] = $_GET['search'];
}
if(isset($_GET['status'])) {
    $filters['status'] = $_GET['status'];
}
if(isset($_GET['grade_min'])) {
    $filters['grade_min'] = floatval($_GET['grade_min']);
}
if(isset($_GET['grade_max'])) {
    $filters['grade_max'] = floatval($_GET['grade_max']);
}
if(isset($_GET['carrera'])) {
    $filters['carrera'] = $_GET['carrera'];
}

// Si el usuario es estudiante, solo ver sus propios registros
if($currentUser['role'] === 'student') {
    $filters['user_id'] = $currentUser['id'];
}

// Paginación
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$offset = ($page - 1) * $limit;

// Obtener estudiantes con filtros y paginación
try {
    // Obtener total de registros
    $total = $student->count($filters);
    
    // Obtener estudiantes con filtros y paginación
    $stmt = $student->read($filters, $limit, $offset);
    $num = $stmt->rowCount();
    
    if($num > 0) {
        $students_arr = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $student_item = [
                "id" => $row['id'],
                "nombre" => $row['nombre'],
                "email" => $row['email'],
                "carrera" => $row['carrera'],
                "grade" => $row['grade'],
                "status" => $row['status'],
                "user_id" => $row['user_id'],
                "created_at" => $row['created_at']
            ];
            array_push($students_arr, $student_item);
        }
        
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "estudiantes" => $students_arr,
            "pagination" => [
                "total" => $total,
                "page" => $page,
                "limit" => $limit,
                "total_pages" => ceil($total / $limit)
            ]
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "estudiantes" => [],
            "pagination" => [
                "total" => 0,
                "page" => $page,
                "limit" => $limit,
                "total_pages" => 0
            ],
            "message" => "No se encontraron estudiantes con los filtros aplicados"
        ]);
    }
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estudiantes: " . $e->getMessage()
    ]);
}
?>