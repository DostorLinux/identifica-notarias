# Sistema de Gestión de Empresas - Identifica

## Descripción

Este módulo permite gestionar empresas dentro del sistema Identifica, incluyendo crear, editar, listar y eliminar empresas.

## Instalación

### 1. Base de Datos

Ejecuta el script SQL para crear la tabla de empresas:

```sql
-- Archivo: /gate/api/sql/create_company_table.sql
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
```

### 2. API Endpoints

Los siguientes endpoints han sido agregados al API:

- `POST /api/v1/company/save` - Crear/actualizar empresa
- `POST /api/v1/company/list` - Listar empresas (con POST para filtros)
- `GET /api/v1/company/listget` - Listar empresas (con GET para parámetros URL)
- `POST /api/v1/company/delete` - Eliminar empresa

### 3. Dashboard

La pantalla de gestión de empresas está disponible en el dashboard como una nueva pestaña "Empresas".

## Uso del API

### Autenticación

Todos los endpoints requieren autenticación JWT con rol de administrador.

### Crear/Actualizar Empresa

```bash
POST /api/v1/company/save
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Nombre de la Empresa",
  "rut": "99.999.999-9",
  "address": "Dirección de la empresa",
  "notes": "Notas adicionales"
}
```

Para actualizar, incluye el campo `id`:

```json
{
  "id": 1,
  "name": "Nombre Actualizado",
  "rut": "99.999.999-9",
  "address": "Nueva dirección",
  "notes": "Notas actualizadas"
}
```

### Listar Empresas

```bash
POST /api/v1/company/list
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "page": 1,
  "size": 25,
  "filter": "término de búsqueda",
  "column": "name",
  "direction": "asc"
}
```

O usando GET:

```bash
GET /api/v1/company/listget?page=1&size=25&filter=término&column=name&direction=asc
Authorization: Bearer YOUR_JWT_TOKEN
```

### Eliminar Empresa

```bash
POST /api/v1/company/delete
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "id": 1
}
```

## Estructura de Respuestas

### Respuesta de Creación/Actualización

```json
{
  "id": 1,
  "result": "created" // o "updated"
}
```

### Respuesta de Lista

```json
{
  "data": [
    [1, "99.999.999-9", "Nombre Empresa", "Dirección", "2024-01-01 10:00:00", 0, null],
    // ... más empresas
  ],
  "total": 50
}
```

### Respuesta de Eliminación

```json
{
  "success": true
}
```

## Dashboard - Gestión de Empresas

### Características

- ✅ Lista de empresas con búsqueda
- ✅ Crear nueva empresa
- ✅ Editar empresa existente
- ✅ Eliminar empresa
- ✅ Búsqueda por nombre y RUT
- ✅ Indicador de empresas denegadas
- ✅ Interfaz móvil responsiva

### Configuración del Dashboard

1. Asegúrate de que el archivo `app/utils/api.ts` tenga la URL correcta del API:

```typescript
const API_BASE_URL = 'https://tu-dominio.com/api/v1';
```

2. La pantalla de empresas está disponible en la pestaña "Empresas" del dashboard.

## Archivos Creados/Modificados

### API
- `/services/company/save.php` - Servicio para crear/actualizar empresas
- `/services/company/getList.php` - Servicio para listar empresas (POST)
- `/services/company/getListGET.php` - Servicio para listar empresas (GET)
- `/services/company/delete.php` - Servicio para eliminar empresas
- `/index.php` - Agregados nuevos endpoints
- `/sql/create_company_table.sql` - Script de creación de tabla

### Dashboard
- `/app/(tabs)/companies.tsx` - Pantalla de gestión de empresas
- `/app/(tabs)/_layout.tsx` - Agregada pestaña de empresas
- `/app/utils/api.ts` - Utilidades para llamadas al API

## Códigos de Error

- `COMPANY_NOT_FOUND` - Empresa no encontrada
- `MANDATORY` - Campo obligatorio faltante
- `INVALID_REQUEST` - Solicitud inválida
- `UNKNOWN_USER` - Usuario no válido
- `INVALID_KEY` - API Key inválido

## Próximas Mejoras

- [ ] Paginación mejorada en el dashboard
- [ ] Filtros avanzados (por fecha, estado)
- [ ] Export/Import de empresas
- [ ] Historial de cambios (audit log)
- [ ] Asignación de empresas a usuarios
- [ ] Validación de RUT chileno
- [ ] Campos personalizados por empresa

## Soporte

Para soporte o reportar problemas, contacta al equipo de desarrollo de Identifica.
