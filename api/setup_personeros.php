<?php
require_once 'db.php';
try {
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS `personero` (
      `id_personero` INT NOT NULL AUTO_INCREMENT,
      `nombres_apellidos` VARCHAR(150) NOT NULL,
      `dni` VARCHAR(8) NOT NULL,
      `celular` VARCHAR(15) NULL,
      `id_mesa` VARCHAR(10) NOT NULL,
      `tipo` ENUM('TITULAR', 'SUPLENTE') DEFAULT 'TITULAR',
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id_personero`),
      CONSTRAINT `fk_personero_mesa` FOREIGN KEY (`id_mesa`) REFERENCES `mesa_sufragio` (`id_mesa`)
    ) ENGINE=InnoDB;
    ");
    echo "Tabla personero creada exitosamente.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
