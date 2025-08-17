-- Agregar columna operator_rut a la tabla captured_images
ALTER TABLE captured_images 
ADD COLUMN operator_rut VARCHAR(15) NULL AFTER audit_number,
ADD INDEX idx_operator_rut (operator_rut);