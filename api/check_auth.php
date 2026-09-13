<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    $rol = $_SESSION['rol'] ?? 'DIGITADOR';
    if ($rol === 'OPERADOR') $rol = 'DIGITADOR';
    echo json_encode([
        'authenticated' => true,
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'rol' => $rol
    ]);
} else {
    echo json_encode([
        'authenticated' => false
    ]);
}
?>
