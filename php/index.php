<?php
header('Content-Type: application/json; charset=utf-8');

include_once '../database/connection.php';
include_once '../models/Student.php';

$database = new Database();
$db = $database->getConnection();

$student = new Student($db);

// Consultar estudiantes
$stmt = $student->read();
$num = $stmt->rowCount();

if($num > 0) {
    $students_arr = array();
    $students_arr["estudiantes"] = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $student_item = array(
            "id" => $id,
            "nombre" => $nombre,
            "email" => $email,
            "carrera" => $carrera,
            "created_at" => $created_at
        );
        array_push($students_arr["estudiantes"], $student_item);
    }
    
    http_response_code(200);
    echo json_encode($students_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No se encontraron estudiantes."));
}
?>