<?php
session_start();
require_once 'db.php';

// Validar si el usuario tiene sesión activa
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado.']);
    exit;
}

// Validar que el rol sea exactamente ADMIN
if (($_SESSION['rol'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden limpiar el proceso.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

try {
    // Iniciar transacción de seguridad
    $pdo->beginTransaction();

    // Eliminar datos de las tablas relacionadas a resultados
    // Se elimina en orden para respetar llaves foráneas si existieran (depende de schema)
    $pdo->query("DELETE FROM auditoria_acta");
    $pdo->query("DELETE FROM voto_resultado");
    $pdo->query("DELETE FROM acta_electoral");

    // Opcionalmente reiniciar auto-incrementos
    $pdo->query("ALTER TABLE auditoria_acta AUTO_INCREMENT = 1");
    $pdo->query("ALTER TABLE voto_resultado AUTO_INCREMENT = 1");

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Proceso electoral limpiado correctamente.']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al intentar limpiar el proceso.', 'details' => $e->getMessage()]);
}
?>
