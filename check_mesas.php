<?php
require 'api/db.php';
try {
    $stmt = $pdo->query("SELECT m.id_mesa FROM mesa_sufragio m JOIN local_votacion l ON m.id_local = l.id_local WHERE l.nombre_local = 'LOCAL GENERICO - CHACAYAN'");
    $mesas = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "MESAS_ENCONTRADAS:\n";
    echo implode(", ", $mesas);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
