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

$id_mesa_nuevo = trim($data['id_mesa'] ?? '');
$id_mesa_original = trim($data['id_mesa_original'] ?? $id_mesa_nuevo);
$departamento = strtoupper(trim($data['departamento'] ?? 'PASCO'));
$provincia = strtoupper(trim($data['provincia'] ?? ''));
$distrito = strtoupper(trim($data['distrito'] ?? ''));
$centro_poblado = strtoupper(trim($data['centro_poblado'] ?? ''));
$electores_habiles = (int)($data['electores_habiles'] ?? 0);

if (empty($id_mesa_nuevo)) {
    echo json_encode(['success' => false, 'message' => 'Falta N° de Mesa.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Generar ubigeo único por hash del distrito
    $ubigeo_key = $departamento . '|' . $provincia . '|' . $distrito;
    $id_ubigeo = strtoupper(substr(md5($ubigeo_key), 0, 6));

    $pdo->prepare("INSERT IGNORE INTO ubigeo (id_ubigeo, departamento, provincia, distrito) VALUES (?, ?, ?, ?)")
        ->execute([$id_ubigeo, $departamento, $provincia, $distrito]);

    // 2. Nombre del local: si hay centro poblado lo usa, si no usa el nombre genérico
    $nombre_local = !empty($centro_poblado) ? $centro_poblado : 'LOCAL GENERICO - ' . $distrito;

    // 3. Buscar si ya existe un local con ese nombre en ese ubigeo
    $stmtLocal = $pdo->prepare("SELECT id_local FROM local_votacion WHERE id_ubigeo = ? AND nombre_local = ?");
    $stmtLocal->execute([$id_ubigeo, $nombre_local]);
    $localRow = $stmtLocal->fetch();

    if ($localRow) {
        $id_local = $localRow['id_local'];
    } else {
        $pdo->prepare("INSERT INTO local_votacion (id_ubigeo, nombre_local, direccion) VALUES (?, ?, 'Sin Dirección')")
            ->execute([$id_ubigeo, $nombre_local]);
        $id_local = $pdo->lastInsertId();
    }

    // 4. Verificar si la mesa original existe
    $stmtCheck = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
    $stmtCheck->execute([$id_mesa_original]);

    if ($stmtCheck->rowCount() > 0) {
        // Actualizar: si cambió el ID de mesa, hacer rename
        if ($id_mesa_nuevo !== $id_mesa_original) {
            // Verificar que el nuevo ID no exista ya
            $stmtCheck2 = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
            $stmtCheck2->execute([$id_mesa_nuevo]);
            if ($stmtCheck2->rowCount() > 0) {
                echo json_encode(['success' => false, 'message' => "El N° de mesa $id_mesa_nuevo ya existe."]);
                $pdo->rollBack();
                exit;
            }
            // Insertar nueva y eliminar la original
            $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, ?, ?)")
                ->execute([$id_mesa_nuevo, $id_local, $electores_habiles]);
            $pdo->prepare("DELETE FROM mesa_sufragio WHERE id_mesa = ?")
                ->execute([$id_mesa_original]);
        } else {
            $pdo->prepare("UPDATE mesa_sufragio SET id_local = ?, electores_habiles = ? WHERE id_mesa = ?")
                ->execute([$id_local, $electores_habiles, $id_mesa_original]);
        }
        $msg = "Mesa $id_mesa_nuevo actualizada correctamente.";
    } else {
        // Nueva mesa
        $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, ?, ?)")
            ->execute([$id_mesa_nuevo, $id_local, $electores_habiles]);
        $msg = "Mesa $id_mesa_nuevo registrada correctamente.";
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => $msg]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>
