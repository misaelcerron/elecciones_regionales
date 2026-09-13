<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

try {
    $id_tipo_eleccion = isset($_GET['id_tipo_eleccion']) ? (int)$_GET['id_tipo_eleccion'] : 1;

    // 1. Tarjetas Superiores
    $stmtTotal = $pdo->prepare("SELECT COUNT(*) as mesas_procesadas, SUM(total_ciudadanos_votaron) as total_votantes FROM acta_electoral WHERE id_tipo_eleccion = :tipo_elec");
    $stmtTotal->execute(['tipo_elec' => $id_tipo_eleccion]);
    $kpis = $stmtTotal->fetch();

    $stmtObservadas = $pdo->prepare("SELECT COUNT(*) as observadas FROM acta_electoral WHERE estado = 'OBSERVADA' AND id_tipo_eleccion = :tipo_elec");
    $stmtObservadas->execute(['tipo_elec' => $id_tipo_eleccion]);
    $kpis['observadas'] = $stmtObservadas->fetch()['observadas'];

    // 2. Gráfico: Votos por Partido
    $sqlPartidos = "
        SELECT op.nombre, op.siglas, op.simbolo_url, op.id_partido, 
               IFNULL(SUM(vr_filt.cantidad_votos), 0) as total_votos
        FROM organizacion_politica op
        LEFT JOIN (
            SELECT vr.id_partido, vr.cantidad_votos
            FROM voto_resultado vr
            INNER JOIN acta_electoral a ON vr.id_acta = a.id_acta
            WHERE a.id_tipo_eleccion = :tipo_elec
        ) vr_filt ON op.id_partido = vr_filt.id_partido
        GROUP BY op.id_partido, op.nombre, op.siglas, op.simbolo_url
        ORDER BY total_votos DESC
    ";
    $stmtPartidos = $pdo->prepare($sqlPartidos);
    $stmtPartidos->execute(['tipo_elec' => $id_tipo_eleccion]);
    $votos_partidos = $stmtPartidos->fetchAll();

    // 3. Gráfico: Distribución de Votos (Validos vs Nulos/Blancos)
    $stmtDistribucion = $pdo->prepare("
        SELECT 
            SUM(votos_blancos) as blancos, 
            SUM(votos_nulos) as nulos, 
            SUM(votos_impugnados) as impugnados 
        FROM acta_electoral
        WHERE id_tipo_eleccion = :tipo_elec
    ");
    $stmtDistribucion->execute(['tipo_elec' => $id_tipo_eleccion]);
    $distribucion = $stmtDistribucion->fetch();

    echo json_encode([
        'kpis' => $kpis,
        'partidos' => $votos_partidos,
        'distribucion' => $distribucion
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
