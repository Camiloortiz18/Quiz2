<?php
header('Content-Type: application/json; charset=utf-8');

// En mi maquina local, la ruta es diferente, no incluye (../)
include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);

// Obtener datos del PUT
$data = json_decode(file_get_contents("php://input"));

// Validar que tenemos ID y datos
if(!empty($data->id) && (!empty($data->nombre) || !empty($data->email) || !empty($data->carrera))) {
    
    $student->id = $data->id;
    
    // Primero verificamos que el estudiante existe
    if($student->readOne()) {
        
        // Actualizar solo los campos que vienen en el request
        if(!empty($data->nombre)) $student->nombre = $data->nombre;
        if(!empty($data->email)) $student->email = $data->email;
        if(!empty($data->carrera)) $student->carrera = $data->carrera;
        
        if($student->update()) {
            http_response_code(200);
            echo json_encode(array("message" => "Estudiante actualizado exitosamente."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo actualizar el estudiante."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Estudiante no encontrado."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos insuficientes para actualizar."));
}
?>