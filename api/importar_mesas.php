<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['mesas']) || !is_array($data['mesas'])) {
    echo json_encode(['success' => false, 'message' => 'Datos de mesas inválidos.']);
    exit;
}

$mesas = $data['mesas'];
$insertadas = 0;
$actualizadas = 0;
$errores = [];

try {
    $pdo->beginTransaction();

    foreach ($mesas as $index => $mesa) {
        $id_mesa = trim($mesa['id_mesa'] ?? '');
        $departamento = trim($mesa['departamento'] ?? 'PASCO');
        $provincia = trim($mesa['provincia'] ?? 'PASCO');
        $distrito = trim($mesa['distrito'] ?? 'SIN DISTRITO');
        $centro_poblado = trim($mesa['centro_poblado'] ?? '');
        $electores_habiles = (int)($mesa['electores_habiles'] ?? 0);

        if (empty($id_mesa)) {
            $errores[] = "Fila " . ($index + 2) . ": Número de mesa vacío.";
            continue;
        }

        // 1. Crear Ubigeo único por Departamento-Provincia-Distrito si no existe
        $id_ubigeo = substr(preg_replace('/[^A-Z0-9]/', '', strtoupper($departamento . $provincia . $distrito)), 0, 6);
        $id_ubigeo = str_pad($id_ubigeo, 6, '0', STR_PAD_RIGHT);

        $stmtUb = $pdo->prepare("INSERT IGNORE INTO ubigeo (id_ubigeo, departamento, provincia, distrito) VALUES (?, ?, ?, ?)");
        $stmtUb->execute([$id_ubigeo, strtoupper($departamento), strtoupper($provincia), strtoupper($distrito)]);

        // 2. Crear Local de Votación usando Centro Poblado o nombre genérico
        $nombre_local = !empty($centro_poblado) ? strtoupper($centro_poblado) : 'LOCAL GENERICO - ' . strtoupper($distrito);
        
        // Verificar si ya existe un local con ese nombre en ese ubigeo
        $stmtLocal = $pdo->prepare("SELECT id_local FROM local_votacion WHERE id_ubigeo = ? AND nombre_local = ?");
        $stmtLocal->execute([$id_ubigeo, $nombre_local]);
        $localRow = $stmtLocal->fetch();
        
        if ($localRow) {
            $id_local = $localRow['id_local'];
        } else {
            $stmtInsLocal = $pdo->prepare("INSERT INTO local_votacion (id_ubigeo, nombre_local, direccion) VALUES (?, ?, 'Sin Dirección')");
            $stmtInsLocal->execute([$id_ubigeo, $nombre_local]);
            $id_local = $pdo->lastInsertId();
        }

        // 3. Insertar o Actualizar Mesa
        $stmtCheck = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
        $stmtCheck->execute([$id_mesa]);

        if ($stmtCheck->rowCount() > 0) {
            $stmtUpd = $pdo->prepare("UPDATE mesa_sufragio SET id_local = ?, electores_habiles = ? WHERE id_mesa = ?");
            $stmtUpd->execute([$id_local, $electores_habiles, $id_mesa]);
            $actualizadas++;
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, ?, ?)");
            $stmtIns->execute([$id_mesa, $id_local, $electores_habiles]);
            $insertadas++;
        }
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => "Importación completada: $insertadas nuevas, $actualizadas actualizadas.",
        'insertadas' => $insertadas,
        'actualizadas' => $actualizadas,
        'errores' => $errores
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error en base de datos: ' . $e->getMessage()]);
}
?>
