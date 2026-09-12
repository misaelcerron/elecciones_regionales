<?php
// api/db.php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'u794164472_elecciones';
$user = 'u794164472_elecciones';
$pass = 'Dayanara1502@1981';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    // Configurar PDO para que lance excepciones en caso de error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Si falla la conexión, devolver error JSON estructurado
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos.',
        'details' => $e->getMessage()
    ]);
    exit;
}
?>
