<?php
header('Content-Type: application/json; charset=utf-8');

// Incluir configuración de BD y modelo
include_once '../database/connection.php';
include_once '../models/Student.php';

// Instanciar conexión a BD
$database = new Database();
$db = $database->getConnection();

// Instanciar objeto Student
$student = new Student($db);

// Obtener datos del POST
$data = json_decode(file_get_contents("php://input"));

// Validar que los datos existen
if(!empty($data->nombre) && !empty($data->email) && !empty($data->carrera)) {
    
    // Asignar valores al objeto student
    $student->nombre = $data->nombre;
    $student->email = $data->email;
    $student->carrera = $data->carrera;
    
    // Crear el estudiante
    if($student->create()) {
        http_response_code(201); // Created
        echo json_encode(array("message" => "Estudiante creado exitosamente."));
    } else {
        http_response_code(503); // Service unavailable
        echo json_encode(array("message" => "No se pudo crear el estudiante."));
    }
} else {
    http_response_code(400); // Bad request
    echo json_encode(array("message" => "Datos incompletos."));
}
?>