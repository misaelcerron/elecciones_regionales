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

if (!$data || !isset($data['personeros']) || !is_array($data['personeros'])) {
    echo json_encode(['success' => false, 'message' => 'Datos de personeros inválidos.']);
    exit;
}

$personeros = $data['personeros'];
$insertadas = 0;
$actualizadas = 0;
$errores = [];

try {
    $pdo->beginTransaction();

    foreach ($personeros as $index => $per) {
        $id_mesa = trim($per['id_mesa'] ?? '');
        $nombres = trim($per['nombres_apellidos'] ?? '');
        $dni = trim($per['dni'] ?? '');
        $celular = trim($per['celular'] ?? '');
        $tipo = trim($per['tipo'] ?? 'TITULAR');
        
        if ($tipo !== 'TITULAR' && $tipo !== 'SUPLENTE') {
            $tipo = 'TITULAR';
        }

        if (empty($id_mesa) || empty($nombres) || empty($dni)) {
            $errores[] = "Fila " . ($index + 2) . ": Datos incompletos (Mesa, Nombres o DNI vacíos).";
            continue;
        }

        // Verificar si la mesa existe
        $stmtMesa = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
        $stmtMesa->execute([$id_mesa]);
        if (!$stmtMesa->fetch()) {
            $errores[] = "Fila " . ($index + 2) . ": La mesa $id_mesa no existe en la base de datos.";
            continue;
        }

        // Insertar o Actualizar Personero
        $stmtCheck = $pdo->prepare("SELECT id_personero FROM personero WHERE dni = ? OR (id_mesa = ? AND tipo = ?)");
        $stmtCheck->execute([$dni, $id_mesa, $tipo]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $stmtUpd = $pdo->prepare("UPDATE personero SET nombres_apellidos = ?, celular = ?, id_mesa = ?, tipo = ?, dni = ? WHERE id_personero = ?");
            $stmtUpd->execute([$nombres, $celular, $id_mesa, $tipo, $dni, $existing['id_personero']]);
            $actualizadas++;
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO personero (nombres_apellidos, dni, celular, id_mesa, tipo) VALUES (?, ?, ?, ?, ?)");
            $stmtIns->execute([$nombres, $dni, $celular, $id_mesa, $tipo]);
            $insertadas++;
        }
    }

    $pdo->commit();
    echo json_encode([
        'success' => true,
        'message' => "Importación completada: $insertadas nuevos, $actualizadas actualizados.",
        'insertadas' => $insertadas,
        'actualizadas' => $actualizadas,
        'errores' => $errores
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error en base de datos: ' . $e->getMessage()]);
}
?>
