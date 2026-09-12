<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);
$id_mesa = trim($data['id_mesa'] ?? '');

if (empty($id_mesa)) {
    echo json_encode(['success' => false, 'message' => 'Falta el N° de Mesa.']);
    exit;
}

try {
    // No eliminar si ya tiene actas asociadas
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) as total FROM acta_electoral WHERE id_mesa = ?");
    $stmtCheck->execute([$id_mesa]);
    $count = $stmtCheck->fetch()['total'];

    if ($count > 0) {
        echo json_encode(['success' => false, 'message' => "No se puede eliminar la mesa $id_mesa porque ya tiene $count acta(s) registrada(s)."]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM mesa_sufragio WHERE id_mesa = ?");
    $stmt->execute([$id_mesa]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => "Mesa $id_mesa eliminada correctamente."]);
    } else {
        echo json_encode(['success' => false, 'message' => "Mesa $id_mesa no encontrada."]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
