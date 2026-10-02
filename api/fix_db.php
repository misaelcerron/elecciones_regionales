<?php
require 'db.php';
try {
    // Actualizar todas las variaciones de Goyllarisquizga a una sola versión correcta
    $stmt = $pdo->prepare("UPDATE ubigeo SET distrito = 'GOYLLARISQUIZGA' WHERE distrito LIKE '%GOLL%' OR distrito LIKE '%GOYLL%'");
    $stmt->execute();
    
    echo "<h1>✅ Actualización Completa</h1>";
    echo "<p>Se han unificado los distritos de Goyllarisquizga en la base de datos correctamente.</p>";
    echo "<p>Por favor, recarga el Dashboard para ver los cambios.</p>";
} catch (Exception $e) {
    echo "<h1>❌ Error</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
