<?php
// test para verificar la conexión a la base de datos
include_once '../database/connection.php';
$database = new Database();
$db = $database->getConnection();

// Verificar la conexión, si es exitosa o no
if($db) {
    echo "Conexión exitosa a la base de datos";
} else {
    echo "Error en la conexión";
}
?>