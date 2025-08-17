-- Crear tabla de empresas para el sistema Identifica
-- Ejecutar este script en la base de datos para crear la tabla

CREATE TABLE IF NOT EXISTS company (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    notes TEXT,
    isDenied TINYINT(1) DEFAULT 0,
    deniedNote TEXT,
    active TINYINT(1) DEFAULT 1,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_rut (rut),
    INDEX idx_company_name (name),
    INDEX idx_company_active (active),
    INDEX idx_company_created (created)
);

-- Insertar datos de ejemplo (opcional)
INSERT INTO company (name, rut, address, notes) VALUES 
('Identifica AI SpA', '99.999.999-9', 'Santiago, Chile', 'Empresa principal del sistema'),
('Empresa Ejemplo 1', '12.345.678-9', 'Providencia, Santiago', 'Cliente de ejemplo'),
('Empresa Ejemplo 2', '98.765.432-1', 'Las Condes, Santiago', 'Otro cliente de ejemplo');
