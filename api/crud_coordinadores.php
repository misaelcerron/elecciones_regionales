<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO coordinador_local (nombres_apellidos, dni, celular, id_local) VALUES (?, ?, ?, ?)");
        $stmt->execute([trim($data['nombres_apellidos']), trim($data['dni']), trim($data['celular']), $data['id_local']]);
        echo json_encode(['success' => true]);
    } 
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE coordinador_local SET nombres_apellidos=?, dni=?, celular=?, id_local=? WHERE id_coordinador=?");
        $stmt->execute([trim($data['nombres_apellidos']), trim($data['dni']), trim($data['celular']), $data['id_local'], $data['id_coordinador']]);
        echo json_encode(['success' => true]);
    } 
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM coordinador_local WHERE id_coordinador=?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
