<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';

header('Content-Type: application/json');

$con = new SimpleDb();

try {
    echo "Starting database migration...\n\n";
    
    // Check if operator_rut column already exists
    $checkQuery = "SHOW COLUMNS FROM captured_images LIKE 'operator_rut'";
    $exists = $con->get_array($checkQuery);
    
    if (empty($exists)) {
        echo "Adding operator_rut column to captured_images table...\n";
        
        // Execute the migration
        $alterQuery = "ALTER TABLE captured_images 
                       ADD COLUMN operator_rut VARCHAR(15) NULL AFTER audit_number,
                       ADD INDEX idx_operator_rut (operator_rut)";
        
        $con->execute($alterQuery, array());
        echo "✅ Successfully added operator_rut column and index\n\n";
    } else {
        echo "✅ operator_rut column already exists\n\n";
    }
    
    // Show current table structure
    echo "Current captured_images table structure:\n";
    $structure = $con->get_array("DESCRIBE captured_images");
    foreach ($structure as $column) {
        echo "  - {$column['Field']} ({$column['Type']}) {$column['Null']} {$column['Key']}\n";
    }
    
    echo "\n";
    
    // Show sample data
    echo "Sample records from captured_images table:\n";
    $sampleData = $con->get_array("SELECT rut, event_id, audit_number, operator_rut, created_at FROM captured_images ORDER BY created_at DESC LIMIT 5");
    
    if (empty($sampleData)) {
        echo "  No records found in captured_images table\n";
    } else {
        foreach ($sampleData as $record) {
            echo "  RUT: {$record['rut']}, EventID: {$record['event_id']}, Audit: {$record['audit_number']}, Operator: {$record['operator_rut']}, Date: {$record['created_at']}\n";
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error during migration: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

?>