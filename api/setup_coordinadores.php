<?php
require_once 'db.php';
try {
    $pdo->exec("
    CREATE TABLE IF NOT EXISTS `coordinador_local` (
      `id_coordinador` INT NOT NULL AUTO_INCREMENT,
      `nombres_apellidos` VARCHAR(150) NOT NULL,
      `dni` VARCHAR(8) NOT NULL,
      `celular` VARCHAR(15) NULL,
      `id_local` INT NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id_coordinador`),
      UNIQUE KEY `uk_dni` (`dni`),
      CONSTRAINT `fk_coord_local` FOREIGN KEY (`id_local`) REFERENCES `local_votacion` (`id_local`)
    ) ENGINE=InnoDB;
    ");
    echo "OK";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
