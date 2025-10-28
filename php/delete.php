<?php
header('Content-Type: application/json; charset=utf-8');

include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);

// Obtener datos del DELETE
$data = json_decode(file_get_contents("php://input"));

// Validar que tenemos ID
if(!empty($data->id)) {
    $student->id = $data->id;
    
    // Verificar que existe antes de eliminar
    if($student->readOne()) {
        if($student->delete()) {
            http_response_code(200);
            echo json_encode(array("message" => "Estudiante eliminado exitosamente."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo eliminar el estudiante."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Estudiante no encontrado."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "ID de estudiante requerido."));
}
?>