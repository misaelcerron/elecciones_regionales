<?php
// api/usuarios.php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Verificar que esté autenticado y sea ADMIN
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit;
}

if (($_SESSION['rol'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado: se requieren permisos de Administrador.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: LISTAR USUARIOS ──
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, username, rol, created_at FROM usuarios ORDER BY id ASC");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Resumen de conteos
        $total = count($usuarios);
        $digitadores = 0;
        $invitados = 0;
        $admins = 0;

        foreach ($usuarios as $u) {
            if ($u['rol'] === 'ADMIN') $admins++;
            elseif ($u['rol'] === 'DIGITADOR') $digitadores++;
            elseif ($u['rol'] === 'INVITADO') $invitados++;
        }

        echo json_encode([
            'success' => true,
            'usuarios' => $usuarios,
            'stats' => [
                'total' => $total,
                'digitadores' => $digitadores,
                'invitados' => $invitados,
                'admins' => $admins
            ],
            'current_user_id' => (int)$_SESSION['user_id']
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener usuarios: ' . $e->getMessage()]);
    }
    exit;
}

// ── POST / ACCIONES (CREAR, EDITAR, ELIMINAR) ──
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $action = $input['action'] ?? '';

    // 1. CREAR USUARIO
    if ($action === 'crear') {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $rol = strtoupper(trim($input['rol'] ?? 'DIGITADOR'));

        if (empty($username)) {
            echo json_encode(['success' => false, 'message' => 'El nombre de usuario es obligatorio.']);
            exit;
        }

        if (strlen($password) < 4) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 4 caracteres.']);
            exit;
        }

        if (!in_array($rol, ['ADMIN', 'DIGITADOR', 'INVITADO'])) {
            echo json_encode(['success' => false, 'message' => 'Rol no válido. Elija ADMIN, DIGITADOR o INVITADO.']);
            exit;
        }

        try {
            // Verificar si ya existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario "' . htmlspecialchars($username) . '" ya está registrado.']);
                exit;
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)");
            $stmt->execute([$username, $hash, $rol]);

            echo json_encode([
                'success' => true,
                'message' => "Usuario '$username' con rol '$rol' creado correctamente.",
                'id' => $pdo->lastInsertId()
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear usuario: ' . $e->getMessage()]);
        }
        exit;
    }

    // 2. EDITAR USUARIO
    if ($action === 'editar') {
        $id = (int)($input['id'] ?? 0);
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $rol = strtoupper(trim($input['rol'] ?? ''));

        if ($id <= 0 || empty($username)) {
            echo json_encode(['success' => false, 'message' => 'Datos insuficientes para editar usuario.']);
            exit;
        }

        if (!in_array($rol, ['ADMIN', 'DIGITADOR', 'INVITADO'])) {
            echo json_encode(['success' => false, 'message' => 'Rol no válido. Elija ADMIN, DIGITADOR o INVITADO.']);
            exit;
        }

        // Si el usuario edita su propia cuenta y no es más ADMIN, validar que haya otro ADMIN
        if ($id === (int)$_SESSION['user_id'] && $rol !== 'ADMIN') {
            echo json_encode(['success' => false, 'message' => 'No puedes remover tu propio rol de Administrador.']);
            exit;
        }

        try {
            // Verificar duplicado de username en otro ID
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = ? AND id != ?");
            $stmt->execute([$username, $id]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario ya pertenece a otra cuenta.']);
                exit;
            }

            if (!empty($password)) {
                if (strlen($password) < 4) {
                    echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 4 caracteres.']);
                    exit;
                }
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, password_hash = ?, rol = ? WHERE id = ?");
                $stmt->execute([$username, $hash, $rol, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, rol = ? WHERE id = ?");
                $stmt->execute([$username, $rol, $id]);
            }

            echo json_encode(['success' => true, 'message' => "Usuario '$username' actualizado correctamente."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al editar usuario: ' . $e->getMessage()]);
        }
        exit;
    }

    // 3. ELIMINAR USUARIO
    if ($action === 'eliminar') {
        $id = (int)($input['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de usuario inválido.']);
            exit;
        }

        // No permitir auto-eliminarse
        if ($id === (int)$_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia cuenta en sesión activa.']);
            exit;
        }

        try {
            // Verificar si es el último admin
            $stmt = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $u = $stmt->fetch();

            if (!$u) {
                echo json_encode(['success' => false, 'message' => 'El usuario no existe.']);
                exit;
            }

            if ($u['rol'] === 'ADMIN') {
                $countAdmins = (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'ADMIN'")->fetchColumn();
                if ($countAdmins <= 1) {
                    echo json_encode(['success' => false, 'message' => 'No puedes eliminar al único Administrador del sistema.']);
                    exit;
                }
            }

            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Usuario eliminado exitosamente.']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario: ' . $e->getMessage()]);
        }
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Acción no reconocida.']);
    exit;
}
