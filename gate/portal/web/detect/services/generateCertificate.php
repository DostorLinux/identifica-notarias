<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';

// Verificar si TCPDF está disponible
if (!class_exists('TCPDF')) {
    // Usar una versión simple sin librerías externas
    header('Content-Type: application/json');
    echo json_encode(['error' => 'PDF library not available. Install TCPDF with: composer require tecnickcom/tcpdf']);
    exit;
}

$rut = getParameter('rut');
$firstName = getParameter('firstName');
$lastName = getParameter('lastName');
$eventId = getParameter('eventId');
$timestamp = getParameter('timestamp');
$operatorRut = getParameter('operatorRut'); // RUT del operario desde la app

if (empty($rut) || empty($firstName) || empty($lastName)) {
    abort('MISSING_PARAMETERS');
}

error_log("Certificate generation started for RUT: $rut, Name: $firstName $lastName, EventId: $eventId, Timestamp: $timestamp, OperatorRUT: $operatorRut");

$con = new SimpleDb();

// Verificar y crear directorio de imágenes capturadas si no existe (ruta absoluta)
$upload_dir = '/var/www/html/gate/portal/web/uploads/captured_images/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
    error_log("Created captured_images directory: " . $upload_dir);
} else {
    error_log("Captured images directory exists: " . $upload_dir);
}

try {
    // Obtener número de auditoría de la base de datos
    $auditNumber = null;
    
    // Obtener imágenes
    $capturedImage = null;
    $systemImage = null;
    
    // 1. Obtener imagen capturada, número de auditoría y operador (buscar la más reciente para ese RUT)
    try {
        $query = "SELECT filename, filepath, event_id, audit_number, operator_rut FROM captured_images WHERE rut = ? ORDER BY created_at DESC";
        $imageRow = $con->get_row($query, array($rut));
        error_log("Searching captured image with RUT: $rut (latest)");
        
        if (!empty($imageRow)) {
            error_log("Captured image found in DB: " . json_encode($imageRow));
            
            // Obtener número de auditoría y operador
            $auditNumber = $imageRow['audit_number'];
            $operatorRutFromDB = $imageRow['operator_rut'];
            error_log("Audit number from DB: " . $auditNumber);
            error_log("Operator RUT from DB: " . $operatorRutFromDB);
            error_log("Operator RUT from parameter: " . $operatorRut);
            error_log("Final operator RUT will be: " . (!empty($operatorRutFromDB) ? $operatorRutFromDB : (!empty($operatorRut) ? $operatorRut : 'admin-default')));
            
            // Verificar si la ruta es absoluta o relativa
            $filepath = $imageRow['filepath'];
            if (!file_exists($filepath)) {
                // Si no existe, intentar rutas alternativas
                $alt_paths = [
                    '/var/www/html/gate/portal/web/uploads/captured_images/' . $imageRow['filename'],
                    __DIR__ . '/../../uploads/captured_images/' . $imageRow['filename'],
                    __DIR__ . '/../../../uploads/captured_images/' . $imageRow['filename']
                ];
                
                foreach ($alt_paths as $alt_path) {
                    error_log("Trying alternative path: " . $alt_path);
                    if (file_exists($alt_path)) {
                        $filepath = $alt_path;
                        error_log("Found captured image at alternative path: " . $alt_path);
                        break;
                    }
                }
            }
            
            if (file_exists($filepath)) {
                $capturedImage = base64_encode(file_get_contents($filepath));
                error_log("Captured image loaded successfully from: " . $filepath);
            } else {
                error_log("Captured image file does not exist anywhere. Original path: " . $imageRow['filepath']);
                error_log("Current directory: " . __DIR__);
                error_log("Upload dir should be: " . __DIR__ . '/../../uploads/captured_images/');
            }
        } else {
            error_log("No captured image found in database for RUT: $rut");
            
            // Debug: ver qué hay en la tabla captured_images
            $debug_query = "SELECT COUNT(*) as total FROM captured_images";
            $total_images = $con->get_one($debug_query, array());
            error_log("Total images in captured_images table: " . $total_images);
            
            // Simplificar debug - solo mostrar el conteo total
            error_log("Check the captured_images table manually for debugging");
        }
    } catch (Exception $e) {
        error_log("Error getting captured image: " . $e->getMessage());
    }
    
    error_log("Captured image status: " . ($capturedImage ? "Available" : "Not available"));
    
    // 2. Obtener imagen del sistema usando la misma función que getPicture.php
    try {
        // Buscar usuario por RUT (igual que getPicture.php)
        $userQuery = "SELECT id FROM user WHERE doc_id = ?";
        $user_id = $con->get_one($userQuery, array($rut));
        
        if (!empty($user_id)) {
            error_log("User found for RUT $rut with ID: $user_id");
            
            // Usar la misma función que getPicture.php
            $image_file = gate_get_face_path(FACE_TYPE_USER, $user_id);
            error_log("Looking for system image at: " . $image_file);
            
            if (file_exists($image_file)) {
                $systemImage = base64_encode(file_get_contents($image_file));
                error_log("System image loaded successfully from: " . $image_file);
            } else {
                error_log("System image file does not exist: " . $image_file);
            }
        } else {
            error_log("User not found for RUT: " . $rut);
        }
    } catch (Exception $e) {
        error_log("Error getting system image: " . $e->getMessage());
    }
    
    error_log("System image status: " . ($systemImage ? "Available" : "Not available"));
    
    // Fallback para número de auditoría si no se encontró en la base de datos
    if (empty($auditNumber)) {
        $auditNumber = 'CERT-' . substr(time(), -6) . strtoupper(substr(md5(rand()), 0, 5));
        error_log("Generated fallback audit number: " . $auditNumber);
    }
    
    // Crear PDF
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Configuración del documento
    $pdf->SetCreator('Sistema de Verificación Biométrica');
    $pdf->SetAuthor('Notaría');
    $pdf->SetTitle('Certificado de Verificación Biométrica');
    $pdf->SetSubject('Certificado');
    
    // Configuración de página
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
    $pdf->SetMargins(20, 20, 20);
    $pdf->SetAutoPageBreak(TRUE, 25);
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
    
    // Agregar página
    $pdf->AddPage();
    
    // Título principal
    $pdf->SetFont('helvetica', 'B', 24);
    $pdf->SetTextColor(46, 134, 171);
    $pdf->Cell(0, 15, 'CERTIFICADO', 0, 1, 'C');
    
    $pdf->SetFont('helvetica', '', 14);
    $pdf->SetTextColor(102, 102, 102);
    $pdf->Cell(0, 8, 'COMPROBANTE DE VERIFICACIÓN', 0, 1, 'C');
    
    // Estado de verificación
    $pdf->Ln(5);
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetTextColor(40, 167, 69);
    $pdf->Cell(0, 10, 'VERIFICACIÓN APROBADA', 0, 1, 'C');
    
    // Logo
    $pdf->Ln(8);
    $logoPath = __DIR__ . '/logo.png';
    if (file_exists($logoPath)) {
        // Mostrar logo centrado con tamaño reducido
        $logoHeight = 18; // Altura del logo reducida
        $logoWidth = 0; // Ancho automático para mantener proporción
        $xPos = ($pdf->getPageWidth() - 40) / 2; // Centrar asumiendo ~40mm de ancho
        $pdf->Image($logoPath, $xPos, $pdf->GetY(), $logoWidth, $logoHeight, 'PNG');
        $pdf->Ln($logoHeight + 8); // Más espacio después del logo
    } else {
        // Fallback al checkmark si no existe el logo
        $pdf->SetFont('helvetica', 'B', 30);
        $pdf->SetTextColor(40, 167, 69);
        $pdf->Cell(0, 15, '✓', 0, 1, 'C');
    }
    
    $pdf->Ln(10);
    
    // Información del certificado
    $pdf->SetFont('helvetica', '', 12);
    $pdf->SetTextColor(51, 51, 51);
    
    $infoData = [
        ['Nombre:', $firstName . ' ' . $lastName],
        ['Número de auditoría:', $auditNumber],
        ['RUT Verificado:', $rut],
        ['Fecha de Registro:', date('d/m/Y H:i:s')],
        ['Fecha de Verificación:', !empty($timestamp) ? date('d/m/Y H:i:s', $timestamp) : date('d/m/Y H:i:s')],
        ['Institución:', 'Sistema de Verificación Biométrica'],
        ['RUT Operario:', !empty($operatorRutFromDB) ? $operatorRutFromDB : (!empty($operatorRut) ? $operatorRut : 'admin-default')]
    ];
    
    foreach ($infoData as $info) {
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(60, 8, $info[0], 0, 0, 'L');
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, 8, $info[1], 0, 1, 'L');
    }
    
    $pdf->Ln(10);
    
    // Sección de evidencias
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->SetTextColor(51, 51, 51);
    $pdf->Cell(0, 10, 'REGISTRO DE EVIDENCIAS', 0, 1, 'C');
    
    $pdf->Ln(5);
    
    // Mostrar imágenes (siempre mostrar las dos secciones)
    $currentY = $pdf->GetY();
    $imageWidth = 40;
    $imageHeight = 40;
    $spacing = 50;
    
    // Imagen capturada
    $pdf->SetXY(40, $currentY);
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell($imageWidth, 5, 'FOTO CAPTURADA', 0, 1, 'C');
    
    if ($capturedImage) {
        // Crear imagen temporal
        $tempCaptured = tempnam(sys_get_temp_dir(), 'captured_') . '.jpg';
        file_put_contents($tempCaptured, base64_decode($capturedImage));
        $pdf->Image($tempCaptured, 40, $currentY + 5, $imageWidth, $imageHeight, 'JPG');
        unlink($tempCaptured);
    } else {
        $pdf->Rect(40, $currentY + 5, $imageWidth, $imageHeight, 'D');
        $pdf->SetXY(45, $currentY + 20);
        $pdf->SetFont('helvetica', '', 8);
        $pdf->Cell($imageWidth - 10, 5, 'No disponible', 0, 1, 'C');
    }
    
    // Imagen del sistema
    $pdf->SetXY(130, $currentY);
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell($imageWidth, 5, 'FOTO DEL SISTEMA', 0, 1, 'C');
    
    if ($systemImage) {
        // Crear imagen temporal
        $tempSystem = tempnam(sys_get_temp_dir(), 'system_') . '.jpg';
        file_put_contents($tempSystem, base64_decode($systemImage));
        $pdf->Image($tempSystem, 130, $currentY + 5, $imageWidth, $imageHeight, 'JPG');
        unlink($tempSystem);
    } else {
        $pdf->Rect(130, $currentY + 5, $imageWidth, $imageHeight, 'D');
        $pdf->SetXY(135, $currentY + 20);
        $pdf->SetFont('helvetica', '', 8);
        $pdf->Cell($imageWidth - 10, 5, 'No disponible', 0, 1, 'C');
    }
    
    $pdf->SetY($currentY + $imageHeight + 20);
    
    // Footer
    $pdf->Ln(10);
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetTextColor(102, 102, 102);
    $pdf->Cell(0, 5, 'Código de Validación: ' . $auditNumber, 0, 1, 'C');
    $pdf->Cell(0, 5, 'Su validez puede ser verificada en el sitio Web', 0, 1, 'C');
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell(0, 5, 'Documento generado electrónicamente', 0, 1, 'C');
    
    // Enviar PDF
    $filename = 'certificado_' . $rut . '_' . date('Ymd_His') . '.pdf';
    
    // Establecer headers para descarga
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    $pdf->Output($filename, 'I');
    
} catch (Exception $e) {
    error_log("Error generating certificate: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error generating certificate: ' . $e->getMessage()]);
}

?>