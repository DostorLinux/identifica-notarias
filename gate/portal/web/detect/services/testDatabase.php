<?php

header('Content-Type: application/json');

// Configuración de base de datos - ajustar según tu configuración
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'gate';

try {
    // Conectar a la base de datos
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>Test de Base de Datos</h1>";
    
    // Verificar si la tabla existe
    $tableExists = $pdo->query("SHOW TABLES LIKE 'captured_images'")->rowCount() > 0;
    echo "<p><strong>Tabla captured_images existe:</strong> " . ($tableExists ? 'SÍ' : 'NO') . "</p>";
    
    if ($tableExists) {
        // Verificar estructura de la tabla
        $columns = $pdo->query("DESCRIBE captured_images")->fetchAll(PDO::FETCH_ASSOC);
        echo "<h2>Estructura de la tabla:</h2>";
        echo "<pre>" . json_encode($columns, JSON_PRETTY_PRINT) . "</pre>";
        
        // Contar registros
        $totalCount = $pdo->query("SELECT COUNT(*) FROM captured_images")->fetchColumn();
        echo "<p><strong>Total de registros:</strong> $totalCount</p>";
        
        // Contar registros con audit_number
        $auditCount = $pdo->query("SELECT COUNT(*) FROM captured_images WHERE audit_number IS NOT NULL AND audit_number != ''")->fetchColumn();
        echo "<p><strong>Registros con audit_number:</strong> $auditCount</p>";
        
        // Mostrar últimos 5 registros
        $recentRecords = $pdo->query("SELECT * FROM captured_images ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        echo "<h2>Últimos 5 registros:</h2>";
        echo "<pre>" . json_encode($recentRecords, JSON_PRETTY_PRINT) . "</pre>";
    }
    
    // Verificar tabla user
    $userTableExists = $pdo->query("SHOW TABLES LIKE 'user'")->rowCount() > 0;
    echo "<p><strong>Tabla user existe:</strong> " . ($userTableExists ? 'SÍ' : 'NO') . "</p>";
    
    if ($userTableExists) {
        $userCount = $pdo->query("SELECT COUNT(*) FROM user")->fetchColumn();
        echo "<p><strong>Total de usuarios:</strong> $userCount</p>";
    }
    
} catch (Exception $e) {
    echo "<h1>Error de Base de Datos</h1>";
    echo "<p><strong>Error:</strong> " . $e->getMessage() . "</p>";
}

?>