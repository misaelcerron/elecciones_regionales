<?php
require_once 'db.php';

try {
    // Crear tabla de usuarios
    $sql = "CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('ADMIN', 'OPERADOR') DEFAULT 'OPERADOR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);

    // Insertar administrador por defecto (admin / admin123)
    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)");
    $stmt->execute(['admin', $hash, 'ADMIN']);

    echo "Tabla de usuarios y cuenta admin creadas exitosamente.";
} catch (PDOException $e) {
    echo "Error al crear usuarios: " . $e->getMessage();
}
?>
