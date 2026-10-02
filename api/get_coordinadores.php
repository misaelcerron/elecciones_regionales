<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

try {
    $sql = "
        SELECT 
            c.id_coordinador,
            c.nombres_apellidos,
            c.dni,
            c.celular,
            c.id_local,
            l.nombre_local as local_votacion,
            IFNULL(u.distrito, '') as distrito
        FROM coordinador_local c
        LEFT JOIN local_votacion l ON c.id_local = l.id_local
        LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
        ORDER BY c.id_coordinador DESC
    ";
    $stmt = $pdo->query($sql);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
