<?php
// fix_enum_rol.php — Migración: agrega INVITADO al ENUM de la columna rol
// ELIMINAR DESPUÉS DE USAR
require_once 'api/db.php';
header('Content-Type: text/html; charset=utf-8');

echo "<style>body{font-family:monospace;background:#111;color:#eee;padding:2rem;}
.ok{color:#32d74b;} .err{color:#ff453a;} .info{color:#60a5fa;}
pre{background:#1c1c1e;padding:1rem;border-radius:8px;overflow:auto;}
</style>";

echo "<h2 class='info'>🔧 Migración: Columna rol → agregar INVITADO</h2>";

try {
    // 1. Ver columna actual
    $stmt = $pdo->query("SHOW COLUMNS FROM usuarios WHERE Field = 'rol'");
    $col = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p class='info'>Tipo actual de la columna: <b>" . htmlspecialchars($col['Type']) . "</b></p>";
    echo "<p class='info'>Default: <b>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</b></p>";

    // 2. Modificar la columna para aceptar los 3 roles
    $sql = "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN','DIGITADOR','INVITADO') NOT NULL DEFAULT 'DIGITADOR'";
    $pdo->exec($sql);
    echo "<p class='ok'>✅ ALTER TABLE ejecutado correctamente.</p>";

    // 3. Verificar el resultado
    $stmt2 = $pdo->query("SHOW COLUMNS FROM usuarios WHERE Field = 'rol'");
    $col2 = $stmt2->fetch(PDO::FETCH_ASSOC);
    echo "<p class='ok'>Tipo nuevo de la columna: <b>" . htmlspecialchars($col2['Type']) . "</b></p>";

    // 4. Mostrar usuarios actuales
    $usuarios = $pdo->query("SELECT id, username, rol FROM usuarios ORDER BY id")->fetchAll();
    echo "<h3 class='info'>Usuarios en la BD:</h3>";
    echo "<table border='1' cellpadding='8' style='border-collapse:collapse;color:#fff;'>";
    echo "<tr><th>ID</th><th>Username</th><th>Rol</th><th>Cambiar a</th></tr>";
    foreach ($usuarios as $u) {
        echo "<tr><td>{$u['id']}</td><td>{$u['username']}</td><td><b>{$u['rol']}</b></td>";
        echo "<td>
            <a href='?set_id={$u['id']}&set_rol=INVITADO' style='color:#ffd60a;margin-right:8px;'>→ INVITADO</a>
            <a href='?set_id={$u['id']}&set_rol=DIGITADOR' style='color:#32d74b;margin-right:8px;'>→ DIGITADOR</a>
            <a href='?set_id={$u['id']}&set_rol=ADMIN' style='color:#af52de;'>→ ADMIN</a>
        </td></tr>";
    }
    echo "</table>";

    // 5. Cambio directo si se pidió
    if (isset($_GET['set_id'], $_GET['set_rol'])) {
        $sid = (int)$_GET['set_id'];
        $srol = strtoupper(trim($_GET['set_rol']));
        if (in_array($srol, ['ADMIN','DIGITADOR','INVITADO']) && $sid > 0) {
            $upd = $pdo->prepare("UPDATE usuarios SET rol = ? WHERE id = ?");
            $upd->execute([$srol, $sid]);
            $rows = $upd->rowCount();
            $check = $pdo->prepare("SELECT username, rol FROM usuarios WHERE id = ?");
            $check->execute([$sid]);
            $u2 = $check->fetch();
            echo "<p class='ok'>✅ Usuario #{$sid} ({$u2['username']}) → rol cambiado a <b>{$u2['rol']}</b> ({$rows} filas afectadas)</p>";
        }
    }

} catch (Exception $e) {
    echo "<p class='err'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<br><p style='color:#ff453a;font-weight:bold;'>⚠️ ELIMINAR ESTE ARCHIVO DEL SERVIDOR DESPUÉS DE USAR</p>";
?>
