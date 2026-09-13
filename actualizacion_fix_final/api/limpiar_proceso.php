<?php
session_start();
require_once 'db.php';

// Validar si el usuario tiene sesión activa
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado.']);
    exit;
}

// Validar que el rol sea exactamente ADMIN
if (($_SESSION['rol'] ?? '') !== 'ADMIN') {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los administradores pueden limpiar el proceso.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

try {
    // Iniciar transacción de seguridad
    $pdo->beginTransaction();

    // Eliminar datos de las tablas relacionadas a resultados
    // Se elimina en orden para respetar llaves foráneas
    $pdo->query("DELETE FROM auditoria_acta");
    $pdo->query("DELETE FROM voto_resultado");
    $pdo->query("DELETE FROM acta_electoral");

    // Intentar reiniciar auto-incrementos, ignorar si falla por permisos
    try {
        $pdo->query("ALTER TABLE auditoria_acta AUTO_INCREMENT = 1");
        $pdo->query("ALTER TABLE voto_resultado AUTO_INCREMENT = 1");
    } catch(Exception $e) {
        // Ignorar error de ALTER (posiblemente falta de permisos en el hosting)
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Proceso electoral limpiado correctamente.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>
