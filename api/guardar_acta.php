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
    echo json_encode(['success' => false, 'message' => 'Acceso denegado: El rol INVITADO solo tiene permisos de lectura de estadísticas.']);
    exit;
}

// Leer el JSON recibido
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload JSON inválido.']);
    exit;
}

// Extraer variables
$id_mesa = $data['id_mesa'] ?? '';
$tipo_eleccion = $data['tipo_eleccion'] ?? '';
$electores_habiles = (int)($data['electores_habiles'] ?? 0);
$total_votaron = (int)($data['total_votaron'] ?? 0);
$blancos = (int)($data['votos_blancos'] ?? 0);
$nulos = (int)($data['votos_nulos'] ?? 0);
$impugnados = (int)($data['votos_impugnados'] ?? 0);
$resultados = $data['resultados'] ?? [];

// Validaciones básicas de Backend
if (empty($id_mesa) || empty($tipo_eleccion)) {
    echo json_encode(['success' => false, 'message' => 'Falta el ID de Mesa o el Tipo de Elección.']);
    exit;
}

// Recalcular suma total por seguridad (Validación Server-Side)
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

// Generar Hash (Firma) del Acta para Inmutabilidad
$string_to_hash = $id_mesa . "_" . $tipo_eleccion . "_" . $total_votaron . "_" . $sumaTotal;
$hash_sha256 = hash('sha256', $string_to_hash);

try {
    // Iniciar Transacción
    $pdo->beginTransaction();

    // 1. Verificar si la mesa existe. Si no, la creamos (Mock para demo)
    // En un sistema real, la mesa ya existiría.
    $stmtMesa = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
    $stmtMesa->execute([$id_mesa]);
    if ($stmtMesa->rowCount() == 0) {
        // Insertamos local y ubigeo mock por rapidez si no existe
        $pdo->query("INSERT IGNORE INTO ubigeo (id_ubigeo, departamento, provincia, distrito) VALUES ('190101', 'PASCO', 'PASCO', 'CHAUPIMARCA')");
        $pdo->query("INSERT IGNORE INTO local_votacion (id_local, id_ubigeo, nombre_local, direccion) VALUES (1, '190101', 'Local Generico', 'Sin Direccion')");
        
        $stmtInsMesa = $pdo->prepare("INSERT INTO mesa_sufragio (id_mesa, id_local, electores_habiles) VALUES (?, 1, ?)");
        $stmtInsMesa->execute([$id_mesa, $electores_habiles]);
    }

    // 2. Insertar tipo de eleccion si no existe (Mock demo)
    $pdo->query("INSERT IGNORE INTO tipo_eleccion (id_tipo_eleccion, nombre) VALUES (1, 'REGIONAL'), (2, 'CONSEJERO'), (3, 'PROVINCIAL'), (4, 'DISTRITAL')");

    // 3. Generar un ID de acta único simulado (en vida real puede ser un UUID o combinación)
    $id_acta = "A-" . $id_mesa . "-" . $tipo_eleccion;

    // Verificar si ya existe para hacer update o insert
    $stmtCheck = $pdo->prepare("SELECT id_acta FROM acta_electoral WHERE id_acta = ?");
    $stmtCheck->execute([$id_acta]);
    
    if ($stmtCheck->rowCount() > 0) {
        // Update (Asumimos re-digitación si está pendiente o digitada)
        $sqlActa = "UPDATE acta_electoral SET estado=?, total_ciudadanos_votaron=?, votos_blancos=?, votos_nulos=?, votos_impugnados=?, hash_sha256=? WHERE id_acta=?";
        $stmtActa = $pdo->prepare($sqlActa);
        $stmtActa->execute([$estado_acta, $total_votaron, $blancos, $nulos, $impugnados, $hash_sha256, $id_acta]);
        
        // Limpiar votos anteriores para reinsertar
        $pdo->prepare("DELETE FROM voto_resultado WHERE id_acta = ?")->execute([$id_acta]);
    } else {
        // Insert
        $sqlActa = "INSERT INTO acta_electoral (id_acta, id_mesa, id_tipo_eleccion, estado, total_ciudadanos_votaron, votos_blancos, votos_nulos, votos_impugnados, hash_sha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtActa = $pdo->prepare($sqlActa);
        $stmtActa->execute([$id_acta, $id_mesa, $tipo_eleccion, $estado_acta, $total_votaron, $blancos, $nulos, $impugnados, $hash_sha256]);
    }

    // 4. Insertar los Partidos (Mock demo si no existen)
    foreach ($resultados as $res) {
        $id_partido = (int)$res['id_partido'];
        $votos = (int)$res['votos'];
        $pdo->prepare("INSERT IGNORE INTO organizacion_politica (id_partido, nombre) VALUES (?, ?)")->execute([$id_partido, "Partido $id_partido"]);
        
        // Guardar resultado
        $stmtRes = $pdo->prepare("INSERT INTO voto_resultado (id_acta, id_partido, cantidad_votos) VALUES (?, ?, ?)");
        $stmtRes->execute([$id_acta, $id_partido, $votos]);
    }

    // 5. Auditar si es Observada
    if ($estado_acta === 'OBSERVADA') {
        $msg_obs = implode(" | ", $observaciones);
        $stmtAud = $pdo->prepare("INSERT INTO auditoria_acta (id_acta, estado_nuevo, usuario_modificacion, observacion) VALUES (?, ?, ?, ?)");
        $stmtAud->execute([$id_acta, $estado_acta, 'operador_web', $msg_obs]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Datos procesados correctamente.',
        'estado' => $estado_acta
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de Base de Datos.',
        'details' => $e->getMessage()
    ]);
}
?>
