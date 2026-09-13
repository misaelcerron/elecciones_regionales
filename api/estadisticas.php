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
    // 1. Tarjetas Superiores
    $stmtTotal = $pdo->query("SELECT COUNT(*) as mesas_procesadas, SUM(total_ciudadanos_votaron) as total_votantes FROM acta_electoral");
    $kpis = $stmtTotal->fetch();

    $stmtObservadas = $pdo->query("SELECT COUNT(*) as observadas FROM acta_electoral WHERE estado = 'OBSERVADA'");
    $kpis['observadas'] = $stmtObservadas->fetch()['observadas'];

    // 2. Gráfico: Votos por Partido
    $sqlPartidos = "
        SELECT op.nombre, op.siglas, op.simbolo_url, op.id_partido, IFNULL(SUM(vr.cantidad_votos), 0) as total_votos
        FROM organizacion_politica op
        LEFT JOIN voto_resultado vr ON op.id_partido = vr.id_partido
        GROUP BY op.id_partido, op.nombre, op.siglas, op.simbolo_url
        ORDER BY total_votos DESC
    ";
    $stmtPartidos = $pdo->query($sqlPartidos);
    $votos_partidos = $stmtPartidos->fetchAll();

    // 3. Gráfico: Distribución de Votos (Validos vs Nulos/Blancos)
    $stmtDistribucion = $pdo->query("
        SELECT 
            SUM(votos_blancos) as blancos, 
            SUM(votos_nulos) as nulos, 
            SUM(votos_impugnados) as impugnados 
        FROM acta_electoral
    ");
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
