<?php
// fix_rol_temp.php — Script temporal para cambiar el rol de un usuario
// ELIMINAR ESTE ARCHIVO DESPUÉS DE USAR
session_start();
require_once 'api/db.php';
header('Content-Type: text/html; charset=utf-8');

$id  = isset($_GET['id'])  ? (int)$_GET['id']  : 0;
$rol = isset($_GET['rol']) ? strtoupper(trim($_GET['rol'])) : '';

$roles_validos = ['DIGITADOR', 'INVITADO', 'ADMIN'];

if ($id > 0 && in_array($rol, $roles_validos)) {
    try {
        $stmt = $pdo->prepare("UPDATE usuarios SET rol = ? WHERE id = ?");
        $stmt->execute([$rol, $id]);
        $rows = $stmt->rowCount();
        
        // Verificar resultado
        $check = $pdo->prepare("SELECT id, username, rol FROM usuarios WHERE id = ?");
        $check->execute([$id]);
        $u = $check->fetch();
        
        echo "<h2 style='color:green;font-family:sans-serif;'>✅ Actualizado correctamente</h2>";
        echo "<pre style='font-family:monospace;background:#111;color:#0f0;padding:1rem;'>";
        echo "Filas afectadas: $rows\n";
        echo "Usuario: {$u['username']}\n";
        echo "Rol actual en BD: {$u['rol']}\n";
        echo "</pre>";
    } catch (Exception $e) {
        echo "<h2 style='color:red;'>❌ Error: " . $e->getMessage() . "</h2>";
    }
} else {
    // Mostrar todos los usuarios
    $usuarios = $pdo->query("SELECT id, username, rol FROM usuarios ORDER BY id")->fetchAll();
    echo "<h2 style='font-family:sans-serif;'>Usuarios en la BD</h2>";
    echo "<table border='1' cellpadding='8' style='font-family:monospace;border-collapse:collapse;'>";
    echo "<tr><th>ID</th><th>Username</th><th>Rol Actual</th><th>Cambiar a INVITADO</th><th>Cambiar a DIGITADOR</th><th>Cambiar a ADMIN</th></tr>";
    foreach ($usuarios as $u) {
        echo "<tr>";
        echo "<td>{$u['id']}</td>";
        echo "<td>{$u['username']}</td>";
        echo "<td><b>{$u['rol']}</b></td>";
        echo "<td><a href='?id={$u['id']}&rol=INVITADO'>→ INVITADO</a></td>";
        echo "<td><a href='?id={$u['id']}&rol=DIGITADOR'>→ DIGITADOR</a></td>";
        echo "<td><a href='?id={$u['id']}&rol=ADMIN'>→ ADMIN</a></td>";
        echo "</tr>";
    }
    echo "</table>";
    echo "<p style='color:red;font-family:sans-serif;'><b>⚠️ ELIMINAR ESTE ARCHIVO DESPUÉS DE USAR</b></p>";
}
?>
