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
            m.id_mesa, 
            m.electores_habiles,
            IFNULL(u.distrito, 'Genérico') as distrito,
            IFNULL(l.nombre_local, 'Local Genérico') as local
        FROM mesa_sufragio m
        LEFT JOIN local_votacion l ON m.id_local = l.id_local
        LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
        ORDER BY m.id_mesa ASC
    ";
    $stmt = $pdo->query($sql);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
