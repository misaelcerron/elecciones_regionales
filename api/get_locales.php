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
    $stmt = $pdo->query("
        SELECT l.id_local, l.nombre_local, IFNULL(u.distrito, '') as distrito 
        FROM local_votacion l
        LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
        ORDER BY u.distrito ASC, l.nombre_local ASC
    ");
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
