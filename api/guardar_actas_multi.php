<?php
session_start();
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado. Por favor, inicie sesión.']);
    exit;
}

if (($_SESSION['rol'] ?? '') === 'INVITADO') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || empty($data['actas']) || empty($data['id_mesa'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload JSON inválido.']);
    exit;
}

$id_mesa = $data['id_mesa'];
$electores_habiles = (int)($data['electores_habiles'] ?? 0);
$actas = $data['actas'];

try {
    $pdo->beginTransaction();

    // Validar mesa
    $stmtMesa = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
    $stmtMesa->execute([$id_mesa]);
    if ($stmtMesa->rowCount() == 0) {
        $pdo->query("INSERT IGNORE INTO ubigeo (id_ubigeo, departamento, provincia, distrito) VALUES ('190101', 'PASCO', 'PASCO', 'CHAUPIMARCA')");
        $pdo->query("INSERT IGNORE INTO local_votacion (id_local, id_ubigeo, nombre_local, direccion) VALUES (1, '190101', 'Local Generico', 'Sin Direccion')");
        $stmtInsMesa = $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, 1, ?)");
        $stmtInsMesa->execute([$id_mesa, $electores_habiles]);
    }

    $pdo->query("INSERT IGNORE INTO tipo_eleccion (id_tipo_eleccion, nombre) VALUES (1, 'REGIONAL'), (2, 'CONSEJERO'), (3, 'PROVINCIAL'), (4, 'DISTRITAL')");

    foreach ($actas as $actaData) {
        $tipo_eleccion = (int)$actaData['tipo_eleccion'];
        $total_votaron = (int)$actaData['total_votaron'];
        $blancos = (int)$actaData['votos_blancos'];
        $nulos = (int)$actaData['votos_nulos'];
        $impugnados = (int)$actaData['votos_impugnados'];
        $resultados = $actaData['resultados'] ?? [];

        $sumaPartidos = 0;
        foreach ($resultados as $res) {
            $sumaPartidos += (int)$res['votos'];
        }
        $sumaTotal = $sumaPartidos + $blancos + $nulos + $impugnados;

        $estado_acta = 'DIGITADA';
        $observaciones = [];

        if ($sumaTotal !== $total_votaron) {
            $estado_acta = 'OBSERVADA';
            $observaciones[] = "Inconsistencia matemática (Server).";
        }
        if ($total_votaron > $electores_habiles && $electores_habiles > 0) {
            $estado_acta = 'OBSERVADA';
            $observaciones[] = "Votantes exceden el padrón.";
        }

        $string_to_hash = $id_mesa . "_" . $tipo_eleccion . "_" . $total_votaron . "_" . $sumaTotal;
        $hash_sha256 = hash('sha256', $string_to_hash);

        $id_acta = "A-" . $id_mesa . "-" . $tipo_eleccion;

        $stmtCheck = $pdo->prepare("SELECT id_acta FROM acta_electoral WHERE id_acta = ?");
        $stmtCheck->execute([$id_acta]);
        
        if ($stmtCheck->rowCount() > 0) {
            $sqlActa = "UPDATE acta_electoral SET estado=?, total_ciudadanos_votaron=?, votos_blancos=?, votos_nulos=?, votos_impugnados=?, hash_sha256=? WHERE id_acta=?";
            $stmtActa = $pdo->prepare($sqlActa);
            $stmtActa->execute([$estado_acta, $total_votaron, $blancos, $nulos, $impugnados, $hash_sha256, $id_acta]);
            $pdo->prepare("DELETE FROM voto_resultado WHERE id_acta = ?")->execute([$id_acta]);
        } else {
            $sqlActa = "INSERT INTO acta_electoral (id_acta, id_mesa, id_tipo_eleccion, estado, total_ciudadanos_votaron, votos_blancos, votos_nulos, votos_impugnados, hash_sha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmtActa = $pdo->prepare($sqlActa);
            $stmtActa->execute([$id_acta, $id_mesa, $tipo_eleccion, $estado_acta, $total_votaron, $blancos, $nulos, $impugnados, $hash_sha256]);
        }

        foreach ($resultados as $res) {
            $id_partido = (int)$res['id_partido'];
            $votos = (int)$res['votos'];
            $pdo->prepare("INSERT IGNORE INTO organizacion_politica (id_partido, nombre) VALUES (?, ?)")->execute([$id_partido, "Partido $id_partido"]);
            $stmtRes = $pdo->prepare("INSERT INTO voto_resultado (id_acta, id_partido, cantidad_votos) VALUES (?, ?, ?)");
            $stmtRes->execute([$id_acta, $id_partido, $votos]);
        }

        if ($estado_acta === 'OBSERVADA') {
            $msg_obs = implode(" | ", $observaciones);
            $stmtAud = $pdo->prepare("INSERT INTO auditoria_acta (id_acta, estado_nuevo, usuario_modificacion, observacion) VALUES (?, ?, ?, ?)");
            $stmtAud->execute([$id_acta, $estado_acta, 'operador_web', $msg_obs]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Actas guardadas correctamente.']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de Base de Datos.', 'details' => $e->getMessage()]);
}
?>
