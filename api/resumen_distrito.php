<?php
// api/resumen_distrito.php
// Devuelve un resumen comparativo de los 4 tipos de elección para un distrito dado
if (session_status() === PHP_SESSION_NONE) session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$distrito = isset($_GET['distrito']) ? trim($_GET['distrito']) : '';

if (empty($distrito) || $distrito === 'TODOS') {
    echo json_encode(['data' => [], 'distrito' => '']);
    exit;
}

try {
    $tipos = [
        1 => ['nombre' => 'Presidente Regional',  'icono' => '🏛️', 'color' => '#0071e3'],
        2 => ['nombre' => 'Consejero Regional',   'icono' => '🤝', 'color' => '#af52de'],
        3 => ['nombre' => 'Alcalde Provincial',   'icono' => '🏙️', 'color' => '#ff9f0a'],
        4 => ['nombre' => 'Alcalde Distrital',    'icono' => '🏘️', 'color' => '#32d74b'],
    ];

    $resumen = [];

    foreach ($tipos as $id_tipo => $meta) {
        // Mesas procesadas y total votos en ese distrito para ese tipo
        $stmtMesas = $pdo->prepare("
            SELECT
                COUNT(DISTINCT a.id_acta) as mesas_procesadas,
                IFNULL(SUM(a.total_ciudadanos_votaron), 0) as total_votos,
                IFNULL(SUM(a.votos_blancos), 0) as blancos,
                IFNULL(SUM(a.votos_nulos), 0) as nulos
            FROM acta_electoral a
            INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa
            INNER JOIN local_votacion lv ON m.id_local = lv.id_local
            INNER JOIN ubigeo ub ON lv.id_ubigeo = ub.id_ubigeo
            WHERE a.id_tipo_eleccion = :tipo
              AND ub.distrito = :distrito
        ");
        $stmtMesas->execute([':tipo' => $id_tipo, ':distrito' => $distrito]);
        $row = $stmtMesas->fetch(PDO::FETCH_ASSOC);

        // Top 3 partidos en ese distrito y tipo
        $stmtTop = $pdo->prepare("
            SELECT op.nombre, op.siglas, op.simbolo_url,
                   SUM(vr.cantidad_votos) as votos
            FROM voto_resultado vr
            INNER JOIN acta_electoral a ON vr.id_acta = a.id_acta
            INNER JOIN organizacion_politica op ON vr.id_partido = op.id_partido
            INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa
            INNER JOIN local_votacion lv ON m.id_local = lv.id_local
            INNER JOIN ubigeo ub ON lv.id_ubigeo = ub.id_ubigeo
            WHERE a.id_tipo_eleccion = :tipo
              AND ub.distrito = :distrito
            GROUP BY vr.id_partido, op.nombre, op.siglas, op.simbolo_url
            ORDER BY votos DESC
            LIMIT 3
        ");
        $stmtTop->execute([':tipo' => $id_tipo, ':distrito' => $distrito]);
        $top3 = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

        $resumen[] = [
            'id_tipo'          => $id_tipo,
            'nombre'           => $meta['nombre'],
            'icono'            => $meta['icono'],
            'color'            => $meta['color'],
            'mesas_procesadas' => (int)($row['mesas_procesadas'] ?? 0),
            'total_votos'      => (int)($row['total_votos'] ?? 0),
            'blancos'          => (int)($row['blancos'] ?? 0),
            'nulos'            => (int)($row['nulos'] ?? 0),
            'top3'             => $top3,
        ];
    }

    echo json_encode(['data' => $resumen, 'distrito' => $distrito]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
