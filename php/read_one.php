<?php
header('Content-Type: application/json; charset=utf-8');

include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);

// Obtener ID de la URL
$student->id = isset($_GET['id']) ? $_GET['id'] : die();

// Obtener el estudiante
if($student->readOne()) {
    $student_arr = array(
        "id" => $student->id,
        "nombre" => $student->nombre,
        "email" => $student->email,
        "carrera" => $student->carrera
    );
    
    http_response_code(200);
    echo json_encode($student_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "Estudiante no encontrado."));
}
?>