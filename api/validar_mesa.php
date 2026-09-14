<?php
// api/validar_mesa.php — Valida si un número de mesa existe en la BD
// Devuelve los datos de la mesa o un error claro si no existe
session_start();
require_once 'db.php';
header('Content-Type: application/json');

$id_mesa = trim($_GET['id_mesa'] ?? '');

if (empty($id_mesa)) {
    echo json_encode(['success' => false, 'message' => 'Debe indicar un número de mesa.']);
    exit;
}

// ── Verificar si la tabla personero existe antes de hacer el JOIN ──
$personeroTableExists = false;
try {
    $checkTable = $pdo->query("SELECT 1 FROM personero LIMIT 1");
    $personeroTableExists = true;
} catch (PDOException $e) {
    // La tabla no existe todavía — no pasa nada, seguimos sin ella
    $personeroTableExists = false;
}

try {
    if ($personeroTableExists) {
        // Query completo con datos del personero
        $sql = "
            SELECT
                m.id_mesa,
                m.electores_habiles,
                IFNULL(u.departamento, 'PASCO')  AS departamento,
                IFNULL(u.provincia,   '')         AS provincia,
                IFNULL(u.distrito,    '')         AS distrito,
                IFNULL(l.nombre_local,'')         AS local_votacion,
                p.nombres_apellidos               AS personero_nombre,
                p.dni                             AS personero_dni,
                p.celular                         AS personero_celular,
                p.tipo                            AS personero_tipo
            FROM mesa_sufragio m
            LEFT JOIN local_votacion l ON m.id_local = l.id_local
            LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
            LEFT JOIN personero p ON m.id_mesa = p.id_mesa
            WHERE m.id_mesa = ?
            LIMIT 1
        ";
    } else {
        // Query sin personero (tabla aún no creada)
        $sql = "
            SELECT
                m.id_mesa,
                m.electores_habiles,
                IFNULL(u.departamento, 'PASCO')  AS departamento,
                IFNULL(u.provincia,   '')         AS provincia,
                IFNULL(u.distrito,    '')         AS distrito,
                IFNULL(l.nombre_local,'')         AS local_votacion,
                NULL AS personero_nombre,
                NULL AS personero_dni,
                NULL AS personero_celular,
                NULL AS personero_tipo
            FROM mesa_sufragio m
            LEFT JOIN local_votacion l ON m.id_local = l.id_local
            LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
            WHERE m.id_mesa = ?
            LIMIT 1
        ";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_mesa]);
    $mesa = $stmt->fetch();

    if ($mesa) {
        echo json_encode([
            'success' => true,
            'data'    => $mesa
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => "La mesa N° {$id_mesa} no está registrada en el padrón."
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>
