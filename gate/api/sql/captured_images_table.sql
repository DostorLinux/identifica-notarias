-- Tabla para almacenar las imágenes capturadas durante verificación biométrica
CREATE TABLE IF NOT EXISTS captured_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) NOT NULL,
    event_id VARCHAR(50) NULL,
    audit_number VARCHAR(50) NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rut (rut),
    INDEX idx_event_id (event_id),
    INDEX idx_audit_number (audit_number),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_rut_event (rut, event_id)
);