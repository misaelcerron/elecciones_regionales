<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$tipo = $_GET['tipo'] ?? 'mesas';

try {
    if ($tipo === 'mesas') {
        // Reporte por Mesas
        $sql = "
            SELECT 
                m.id_mesa, 
                IFNULL(u.distrito, 'Sin Distrito') as distrito, 
                m.electores_habiles, 
                IFNULL(a.total_ciudadanos_votaron, 0) as votantes,
                IFNULL(a.estado, 'FALTA ENTREGAR') as estado
            FROM mesa_sufragio m
            LEFT JOIN local_votacion l ON m.id_local = l.id_local
            LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
            LEFT JOIN acta_electoral a ON m.id_mesa = a.id_mesa
            ORDER BY u.distrito ASC, m.id_mesa ASC
        ";
        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll();

        // Calcular KPIs de resumen para el reporte de mesas
        $totalMesas = count($data);
        $contabilizadas = 0;
        $digitadas = 0;
        $observadas = 0;
        $falta = 0;
        $totalElectores = 0;
        $totalVotantes = 0;

        foreach ($data as $r) {
            $st = strtoupper($r['estado'] ?? '');
            if ($st === 'CONTABILIZADA') $contabilizadas++;
            elseif ($st === 'DIGITADA') $digitadas++;
            elseif ($st === 'OBSERVADA') $observadas++;
            else $falta++;

            $totalElectores += (int)($r['electores_habiles'] ?? 0);
            $totalVotantes += (int)($r['votantes'] ?? 0);
        }

        $pctAvance = $totalMesas > 0 ? round((($contabilizadas + $digitadas) / $totalMesas) * 100, 1) : 0;

        echo json_encode([
            'success' => true,
            'data' => $data,
            'kpis' => [
                'total_mesas' => $totalMesas,
                'contabilizadas' => $contabilizadas,
                'digitadas' => $digitadas,
                'observadas' => $observadas,
                'falta' => $falta,
                'total_electores' => $totalElectores,
                'total_votantes' => $totalVotantes,
                'pct_avance' => $pctAvance
            ]
        ]);
        
    } else if ($tipo === 'distritos') {
        // Reporte a nivel de Distrito
        $sql = "
            SELECT 
                IFNULL(u.distrito, 'Sin Distrito') as distrito,
                COUNT(m.id_mesa) as total_mesas,
                SUM(CASE WHEN a.estado IN ('DIGITADA', 'CONTABILIZADA', 'EN_VERIFICACION') THEN 1 ELSE 0 END) as mesas_escrutadas,
                SUM(m.electores_habiles) as electores_habiles,
                SUM(IFNULL(a.total_ciudadanos_votaron, 0)) as total_votantes
            FROM mesa_sufragio m
            LEFT JOIN local_votacion l ON m.id_local = l.id_local
            LEFT JOIN ubigeo u ON l.id_ubigeo = u.id_ubigeo
            LEFT JOIN acta_electoral a ON m.id_mesa = a.id_mesa
            GROUP BY u.distrito
            ORDER BY u.distrito ASC
        ";
        $stmt = $pdo->query($sql);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Tipo de reporte inválido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
