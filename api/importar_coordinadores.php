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

if (!$data || !isset($data['coordinadores']) || !is_array($data['coordinadores'])) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$coordinadores = $data['coordinadores'];
$insertadas = 0;
$actualizadas = 0;
$errores = [];

try {
    $pdo->beginTransaction();

    foreach ($coordinadores as $index => $coord) {
        $nombres = trim($coord['nombres_apellidos'] ?? '');
        $dni = trim($coord['dni'] ?? '');
        $celular = trim($coord['celular'] ?? '');
        $nombre_local = trim($coord['local_votacion'] ?? '');
        
        if (empty($nombres) || empty($dni) || empty($nombre_local)) {
            $errores[] = "Fila " . ($index + 2) . ": Datos incompletos.";
            continue;
        }

        // Buscar el id_local por su nombre aproximado
        $stmtLocal = $pdo->prepare("SELECT id_local FROM local_votacion WHERE nombre_local LIKE ? LIMIT 1");
        $stmtLocal->execute(['%' . $nombre_local . '%']);
        $local = $stmtLocal->fetch();

        if (!$local) {
            $errores[] = "Fila " . ($index + 2) . ": El local '$nombre_local' no existe.";
            continue;
        }

        $id_local = $local['id_local'];

        // Verificar si existe el coordinador por DNI
        $stmtCheck = $pdo->prepare("SELECT id_coordinador FROM coordinador_local WHERE dni = ?");
        $stmtCheck->execute([$dni]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $stmtUpd = $pdo->prepare("UPDATE coordinador_local SET nombres_apellidos = ?, celular = ?, id_local = ? WHERE id_coordinador = ?");
            $stmtUpd->execute([$nombres, $celular, $id_local, $existing['id_coordinador']]);
            $actualizadas++;
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO coordinador_local (nombres_apellidos, dni, celular, id_local) VALUES (?, ?, ?, ?)");
            $stmtIns->execute([$nombres, $dni, $celular, $id_local]);
            $insertadas++;
        }
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => "Completado: $insertadas nuevos, $actualizadas actualizados.",
        'insertadas' => $insertadas,
        'actualizadas' => $actualizadas,
        'errores' => $errores
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
