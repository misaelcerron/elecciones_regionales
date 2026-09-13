<?php
require_once 'db.php';

try {
    // Crear o actualizar tabla de usuarios
    $sql = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('ADMIN', 'DIGITADOR', 'INVITADO') DEFAULT 'DIGITADOR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);

    // Asegurar que la columna rol tenga los nuevos valores ENUM
    $pdo->exec("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN', 'DIGITADOR', 'INVITADO') NOT NULL DEFAULT 'DIGITADOR'");

    // Insertar administrador por defecto (admin / admin123)
    $hashAdmin = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)");
    $stmt->execute(['admin', $hashAdmin, 'ADMIN']);

    // Insertar digitador por defecto (digitador1 / digitador123)
    $hashDig = password_hash('digitador123', PASSWORD_DEFAULT);
    $stmt->execute(['digitador1', $hashDig, 'DIGITADOR']);

    // Insertar invitado por defecto (invitado / invitado123)
    $hashInv = password_hash('invitado', PASSWORD_DEFAULT);
    $stmt->execute(['invitado', $hashInv, 'INVITADO']);

    echo "Tabla de usuarios y cuentas por defecto (admin, digitador1, invitado) configuradas exitosamente.";
} catch (PDOException $e) {
    echo "Error al crear usuarios: " . $e->getMessage();
}
?>
