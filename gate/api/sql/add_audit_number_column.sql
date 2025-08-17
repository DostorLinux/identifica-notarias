-- Agregar columna audit_number a la tabla captured_images
ALTER TABLE captured_images 
ADD COLUMN audit_number VARCHAR(50) NULL AFTER event_id,
ADD INDEX idx_audit_number (audit_number);