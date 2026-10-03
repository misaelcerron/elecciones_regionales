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
    $local_votacion = isset($_GET['local_votacion']) ? $_GET['local_votacion'] : '';
    $id_mesa = isset($_GET['id_mesa']) ? $_GET['id_mesa'] : '';

    $filtersJoin = "";
    $filtersWhere = "";
    $params = ['tipo_elec' => $id_tipo_eleccion];
    
    if (!empty($distrito) || !empty($local_votacion) || !empty($id_mesa)) {
        $filtersJoin .= " LEFT JOIN local_votacion l ON m.id_local = l.id_local LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo ";
    }
    
    if (!empty($distrito) && $distrito !== 'TODOS') {
        $filtersWhere .= " AND u.distrito = :distrito ";
        $params['distrito'] = $distrito;
    }
    
    if (!empty($local_votacion) && $local_votacion !== 'TODOS') {
        $filtersWhere .= " AND l.nombre_local = :local_votacion ";
        $params['local_votacion'] = $local_votacion;
    }
    
    if (!empty($id_mesa) && $id_mesa !== 'TODOS') {
        $filtersWhere .= " AND m.id_mesa = :id_mesa ";
        $params['id_mesa'] = $id_mesa;
    }

    // 1. Tarjetas Superiores
    $sqlTotal = "SELECT COUNT(*) as mesas_procesadas, SUM(a.total_ciudadanos_votaron) as total_votantes FROM acta_electoral a";
    if ($filtersWhere) {
        $sqlTotal .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $filtersJoin ";
    }
    $sqlTotal .= " WHERE a.id_tipo_eleccion = :tipo_elec $filtersWhere";
    $stmtTotal = $pdo->prepare($sqlTotal);
    $stmtTotal->execute($params);
    $kpis = $stmtTotal->fetch();

    $sqlObs = "SELECT COUNT(*) as observadas FROM acta_electoral a";
    if ($filtersWhere) {
        $sqlObs .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $filtersJoin ";
    }
    $sqlObs .= " WHERE a.estado = 'OBSERVADA' AND a.id_tipo_eleccion = :tipo_elec $filtersWhere";
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
            " . ($filtersWhere ? " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $filtersJoin " : "") . "
            WHERE a.id_tipo_eleccion = :tipo_elec $filtersWhere
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
    if ($filtersWhere) {
        $sqlDist .= " INNER JOIN mesa_sufragio m ON a.id_mesa = m.id_mesa $filtersJoin ";
    }
    $sqlDist .= " WHERE a.id_tipo_eleccion = :tipo_elec $filtersWhere";
    $stmtDistribucion = $pdo->prepare($sqlDist);
    $stmtDistribucion->execute($params);
    $distribucion = $stmtDistribucion->fetch();

    // 4. Listas para los filtros
    $stmtDistritos = $pdo->query("SELECT DISTINCT distrito FROM ubigeo WHERE distrito IS NOT NULL ORDER BY distrito ASC");
    $distritos_list = $stmtDistritos->fetchAll(PDO::FETCH_COLUMN);
    
    // Locales (depende del distrito seleccionado, o todos)
    $sqlLocales = "SELECT DISTINCT l.nombre_local FROM local_votacion l LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo WHERE l.nombre_local IS NOT NULL";
    $locParams = [];
    if (!empty($distrito) && $distrito !== 'TODOS') {
        $sqlLocales .= " AND u.distrito = ?";
        $locParams[] = $distrito;
    }
    $sqlLocales .= " ORDER BY l.nombre_local ASC";
    $stmtLoc = $pdo->prepare($sqlLocales);
    $stmtLoc->execute($locParams);
    $locales_list = $stmtLoc->fetchAll(PDO::FETCH_COLUMN);

    // Mesas (depende del local seleccionado, o todos)
    $sqlMesas = "SELECT DISTINCT m.id_mesa FROM mesa_sufragio m LEFT JOIN local_votacion l ON m.id_local = l.id_local LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo WHERE m.id_mesa IS NOT NULL";
    $mesParams = [];
    if (!empty($local_votacion) && $local_votacion !== 'TODOS') {
        $sqlMesas .= " AND l.nombre_local = ?";
        $mesParams[] = $local_votacion;
    } else if (!empty($distrito) && $distrito !== 'TODOS') {
        $sqlMesas .= " AND u.distrito = ?";
        $mesParams[] = $distrito;
    }
    $sqlMesas .= " ORDER BY m.id_mesa ASC";
    $stmtMesas = $pdo->prepare($sqlMesas);
    $stmtMesas->execute($mesParams);
    $mesas_list = $stmtMesas->fetchAll(PDO::FETCH_COLUMN);

    // 5. Total de mesas en el sistema
    $stmtTotalMesas = $pdo->query("SELECT COUNT(DISTINCT id_mesa) as total FROM mesa_sufragio");
    $kpis['total_mesas'] = $stmtTotalMesas->fetch()['total'] ?? 106;

    echo json_encode([
        'kpis'                 => $kpis,
        'partidos'             => $votos_partidos,
        'distribucion'         => $distribucion,
        'distritos_disponibles' => $distritos_list,
        'locales_disponibles'   => $locales_list,
        'mesas_disponibles'     => $mesas_list
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
