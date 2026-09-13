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
    $distrito = isset($_GET['distrito']) ? $_GET['distrito'] : '';

    // Condición extra para distrito si se envía
    $distritoJoin = "";
    $distritoWhere = "";
    $params = ['tipo_elec' => $id_tipo_eleccion];
    
    if (!empty($distrito) && $distrito !== 'TODOS') {
        $distritoJoin = " LEFT JOIN local_votacion l ON m.id_local = l.id_local LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo ";
        $distritoWhere = " AND u.distrito = :distrito ";
        $params['distrito'] = $distrito;
    }

    // 1. Tarjetas Superiores
    $sqlTotal = "SELECT COUNT(*) as mesas_procesadas, SUM(a.total_ciudadanos_votaron) as total_votantes FROM acta_electoral a";
    if ($distritoWhere) {
        $sqlTotal .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $distritoJoin ";
    }
    $sqlTotal .= " WHERE a.id_tipo_eleccion = :tipo_elec $distritoWhere";
    $stmtTotal = $pdo->prepare($sqlTotal);
    $stmtTotal->execute($params);
    $kpis = $stmtTotal->fetch();

    $sqlObs = "SELECT COUNT(*) as observadas FROM acta_electoral a";
    if ($distritoWhere) {
        $sqlObs .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $distritoJoin ";
    }
    $sqlObs .= " WHERE a.estado = 'OBSERVADA' AND a.id_tipo_eleccion = :tipo_elec $distritoWhere";
    $stmtObservadas = $pdo->prepare($sqlObs);
    $stmtObservadas->execute($params);
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
            " . ($distritoWhere ? " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $distritoJoin " : "") . "
            WHERE a.id_tipo_eleccion = :tipo_elec $distritoWhere
        ) vr_filt ON op.id_partido = vr_filt.id_partido
        GROUP BY op.id_partido, op.nombre, op.siglas, op.simbolo_url
        ORDER BY total_votos DESC
    ";
    $stmtPartidos = $pdo->prepare($sqlPartidos);
    $stmtPartidos->execute($params);
    $votos_partidos = $stmtPartidos->fetchAll();

    // 3. Gráfico: Distribución de Votos (Validos vs Nulos/Blancos)
    $sqlDist = "
        SELECT 
            SUM(a.votos_blancos) as blancos, 
            SUM(a.votos_nulos) as nulos, 
            SUM(a.votos_impugnados) as impugnados 
        FROM acta_electoral a
    ";
    if ($distritoWhere) {
        $sqlDist .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $distritoJoin ";
    }
    $sqlDist .= " WHERE a.id_tipo_eleccion = :tipo_elec $distritoWhere";
    $stmtDistribucion = $pdo->prepare($sqlDist);
    $stmtDistribucion->execute($params);
    $distribucion = $stmtDistribucion->fetch();

    // 4. Lista de todos los distritos disponibles (para llenar el select)
    $stmtDistritos = $pdo->query("SELECT DISTINCT distrito FROM ubigeo WHERE distrito IS NOT NULL ORDER BY distrito ASC");
    $distritos_list = $stmtDistritos->fetchAll(PDO::FETCH_COLUMN);

    // 5. Total de mesas en el sistema
    $stmtTotalMesas = $pdo->query("SELECT COUNT(DISTINCT id_mesa) as total FROM mesa_sufragio");
    $kpis['total_mesas'] = $stmtTotalMesas->fetch()['total'] ?? 106;

    echo json_encode([
        'kpis'                 => $kpis,
        'partidos'             => $votos_partidos,
        'distribucion'         => $distribucion,
        'distritos_disponibles' => $distritos_list
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
