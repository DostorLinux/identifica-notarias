<?php
// Test script to verify PHPMailer SMTP implementation
include_once 'gate/common/include/config.php';
include_once 'gate/common/include/gate.php';

error_log("[TEST] Starting PHPMailer SMTP email test");

// Test with a real email to verify SMTP functionality
$result = gate_send_temporary_password_email(
    'contactosai@jtrack.cl', 
    'testuser_phpmailer', 
    'temppass_phpmailer_123', 
    'Test Company PHPMailer'
);

error_log("[TEST] PHPMailer email function returned: " . ($result ? 'SUCCESS' : 'FAILED'));
error_log("[TEST] PHPMailer test completed");

// Display results
$log_file = ini_get('error_log');
echo "PHP Error log location: " . ($log_file ?: 'system default') . "\n";
echo "PHPMailer SMTP test completed. Check the logs for detailed information.\n";
echo "Test result: " . ($result ? 'SUCCESS - Email should be sent via SMTP' : 'FAILED - Check logs for errors') . "\n";

// Check mail queue to see if it's still using local sendmail
echo "\nChecking mail queue (should be empty if SMTP is working):\n";
system('mailq 2>/dev/null || echo "mailq not available or empty"');
?>