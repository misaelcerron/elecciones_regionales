<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM personero ORDER BY id_personero DESC");
            $personeros = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['data' => $personeros]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            $nombres = trim($data['nombres_apellidos']);
            $dni = trim($data['dni']);
            $celular = trim($data['celular']);
            $id_mesa = trim($data['id_mesa']);
            $tipo = trim($data['tipo']);

            // Validate mesa exists
            $stmtMesa = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
            $stmtMesa->execute([$id_mesa]);
            if (!$stmtMesa->fetch()) {
                echo json_encode(['error' => 'La mesa no existe.']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO personero (nombres_apellidos, dni, celular, id_mesa, tipo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$nombres, $dni, $celular, $id_mesa, $tipo]);
            echo json_encode(['success' => true]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            $id = $data['id_personero'];
            $nombres = trim($data['nombres_apellidos']);
            $dni = trim($data['dni']);
            $celular = trim($data['celular']);
            $id_mesa = trim($data['id_mesa']);
            $tipo = trim($data['tipo']);
            
            // Validate mesa exists
            $stmtMesa = $pdo->prepare("SELECT id_mesa FROM mesa_sufragio WHERE id_mesa = ?");
            $stmtMesa->execute([$id_mesa]);
            if (!$stmtMesa->fetch()) {
                echo json_encode(['error' => 'La mesa no existe.']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE personero SET nombres_apellidos=?, dni=?, celular=?, id_mesa=?, tipo=? WHERE id_personero=?");
            $stmt->execute([$nombres, $dni, $celular, $id_mesa, $tipo, $id]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            $stmt = $pdo->prepare("DELETE FROM personero WHERE id_personero=?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Error de BD: ' . $e->getMessage()]);
}
