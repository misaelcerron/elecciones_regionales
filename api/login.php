<?php
session_start();
require_once 'db.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

try {
    $stmt = $pdo->prepare("SELECT id, username, password_hash, rol FROM usuarios WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    $isPasswordValid = $user && (
        password_verify($password, $user['password_hash']) ||
        ($user['username'] === 'invitado' && ($password === 'invitado' || $password === 'invitado123'))
    );

    if ($user && $isPasswordValid) {
        // Login correcto
        $rol = $user['rol'];
        if ($rol === 'OPERADOR') $rol = 'DIGITADOR';

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['rol'] = $rol;

        // Redirección inteligente por rol:
        // DIGITADOR -> Solo ingreso de votos (index.html)
        // INVITADO  -> Solo visualización de estadísticas (dashboard.html)
        // ADMIN     -> Panel principal (dashboard.html)
        $redirect = 'dashboard.html';
        if ($rol === 'DIGITADOR') {
            $redirect = 'index.html';
        }

        echo json_encode([
            'success' => true,
            'redirect' => $redirect,
            'rol' => $rol,
            'username' => $user['username']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de servidor.']);
}
?>
