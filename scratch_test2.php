<?php
$host = '127.0.0.1';
$dbname = 'u794164472_elecciones';
$user = 'root';
$pass = ''; // usually xampp root has no password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT id_personero, nombres_apellidos, id_mesa, tipo, dni FROM personero WHERE dni='72139357'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
