<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Solo el rol ADMIN puede hacer esto
if ($_SESSION['rol'] !== 'ADMIN') {
    echo json_encode(['success' => false, 'message' => 'Solo el Administrador puede eliminar todas las mesas.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Eliminar primero los resultados de votos (dependen de actas)
    $pdo->exec("DELETE FROM voto_resultado");
    // 2. Eliminar auditorías
    $pdo->exec("DELETE FROM auditoria_acta");
    // 3. Eliminar actas (dependen de mesas)
    $pdo->exec("DELETE FROM acta_electoral");
    // 4. Eliminar todas las mesas
    $pdo->exec("DELETE FROM mesa_sufragio");
    // 5. Eliminar locales de votación
    $pdo->exec("DELETE FROM local_votacion");
    // 6. Eliminar ubigeos (excepto los que no se usaron)
    $pdo->exec("DELETE FROM ubigeo");

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Se han eliminado todas las mesas, locales y ubigeos del sistema.'
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
