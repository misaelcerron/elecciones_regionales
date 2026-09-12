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

if (!$data || empty($data['id_mesa'])) {
    echo json_encode(['success' => false, 'message' => 'Falta N° de Mesa.']);
    exit;
}

$id_mesa = trim($data['id_mesa']);
$electores_habiles = (int)$data['electores_habiles'];

try {
    $pdo->beginTransaction();

    // 1. Asegurar un Local Genérico para simplificar el alta rápida si no hay locales.
    // Esto previene errores de llave foránea.
    $pdo->query("INSERT IGNORE INTO ubigeo (id_ubigeo, departamento, provincia, distrito) VALUES ('190101', 'PASCO', 'PASCO', 'CHAUPIMARCA')");
    $pdo->query("INSERT IGNORE INTO local_votacion (id_local, id_ubigeo, nombre_local, direccion) VALUES (1, '190101', 'Local Generico', 'Sin Direccion')");

    // 2. Revisar si la mesa ya existe
    $stmtCheck = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
    $stmtCheck->execute([$id_mesa]);

    if ($stmtCheck->rowCount() > 0) {
        // ACTUALIZAR (Update)
        $stmtUpdate = $pdo->prepare("UPDATE mesa_sufragio SET electores_habiles = ? WHERE id_mesa = ?");
        $stmtUpdate->execute([$electores_habiles, $id_mesa]);
        $msg = "Mesa $id_mesa actualizada correctamente.";
    } else {
        // CREAR (Insert)
        $stmtInsert = $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, 1, ?)");
        $stmtInsert->execute([$id_mesa, $electores_habiles]);
        $msg = "Mesa $id_mesa registrada correctamente.";
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => $msg]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>
