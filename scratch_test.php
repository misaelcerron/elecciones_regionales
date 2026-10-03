<?php
require 'c:\xampp\htdocs\elecciones\api\db.php';
$stmt = $pdo->query("SELECT id_personero, nombres_apellidos, id_mesa, tipo, dni FROM personero WHERE dni='72139357'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
