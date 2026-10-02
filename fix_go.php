<?php
require 'api/db.php';
$stmt = $pdo->query("SELECT * FROM ubigeo WHERE distrito LIKE '%GOYLL%' OR distrito LIKE '%GOLL%'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "UBIGEO:\n";
print_r($rows);

$stmt2 = $pdo->query("SELECT * FROM mesa_sufragio WHERE id_local IN (SELECT id_local FROM local_votacion WHERE id_ubigeo IN (SELECT id_ubigeo FROM ubigeo WHERE distrito LIKE '%GOYLL%' OR distrito LIKE '%GOLL%'))");
$rows2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "MESAS:\n";
print_r($rows2);
