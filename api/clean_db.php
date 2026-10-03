<?php
require 'db.php';

// Fix duplicates: keep the one with lowest id_personero for each mesa + tipo combination
$stmt = $pdo->query("SELECT id_mesa, tipo, MIN(id_personero) as min_id FROM personero GROUP BY id_mesa, tipo HAVING COUNT(*) > 1");
$duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($duplicates as $row) {
    $mesa = $row['id_mesa'];
    $tipo = $row['tipo'];
    $min_id = $row['min_id'];
    
    // Delete all others for this mesa and tipo
    $del = $pdo->prepare("DELETE FROM personero WHERE id_mesa = ? AND tipo = ? AND id_personero > ?");
    $del->execute([$mesa, $tipo, $min_id]);
    echo "Deleted duplicates for mesa $mesa (tipo $tipo)\n";
}
echo "Cleanup done.\n";
