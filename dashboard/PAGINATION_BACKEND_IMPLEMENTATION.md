# Documentación para Implementar Paginación de Usuarios

## Endpoint Requerido: `services/getUsersPaginated.php`

### Ubicación
`/ruta-del-servidor/services/getUsersPaginated.php`

### Método
`POST`

### Parámetros de Entrada (JSON)
```json
{
  "page": 1,
  "size": 10,
  "direction": "asc",
  "column": "first_name",
  "filter": null
}
```

| Parámetro | Tipo | Descripción | Valores Posibles |
|-----------|------|-------------|------------------|
| `page` | int | Número de página (empezando en 1) | 1, 2, 3, ... |
| `size` | int | Cantidad de usuarios por página | 5, 10, 25, 50, 100 |
| `direction` | string | Dirección del ordenamiento | "asc", "desc" |
| `column` | string | Columna para ordenar | "first_name", "last_name", "doc_id", "email", "role", "created" |
| `filter` | string\|null | Filtro de búsqueda (buscar en nombre, email, doc_id) | null o texto a buscar |

### Respuesta Esperada (JSON)
```json
{
  "data": [
    [
      "pub_id_1",
      "12.345.678-9",
      "sec_id_1",
      "usuario1",
      "Juan",
      "Pérez",
      "juan@email.com",
      "user",
      "Y",
      123,
      false,
      null
    ],
    [
      "pub_id_2",
      "98.765.432-1",
      "sec_id_2",
      "usuario2",
      "María",
      "González",
      "maria@email.com",
      "admin",
      "Y",
      124,
      false,
      null
    ]
  ],
  "total": 156,
  "page": 1,
  "totalPages": 16,
  "size": 10
}
```

### Estructura de Cada Usuario (Array)
```php
// Cada usuario en el array 'data' debe tener este formato:
[
  0 => $user['pub_id'],      // ID público del usuario
  1 => $user['doc_id'],      // Documento de identidad (RUT)
  2 => $user['sec_id'],      // ID secundario
  3 => $user['username'],    // Nombre de usuario
  4 => $user['first_name'],  // Nombres
  5 => $user['last_name'],   // Apellidos
  6 => $user['email'],       // Email
  7 => $user['role'],        // Rol (admin, user, gate, worker, normal, super_admin)
  8 => $user['active'],      // Estado activo ('Y' o 'N')
  9 => $user['id'],          // ID interno
  10 => $user['isDenied'],   // ¿Está denegado? (boolean)
  11 => $user['deniedNote']  // Nota de denegación
]
```

### Ejemplo de Implementación PHP

```php
<?php
// services/getUsersPaginated.php

// Incluir archivos de configuración y autenticación
require_once '../config/database.php';
require_once '../utils/auth.php';

// Verificar autenticación
if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado', 'code' => 'UNAUTHORIZED']);
    exit;
}

// Obtener parámetros JSON
$input = json_decode(file_get_contents('php://input'), true);

$page = (int)($input['page'] ?? 1);
$size = (int)($input['size'] ?? 10);
$direction = $input['direction'] ?? 'asc';
$column = $input['column'] ?? 'first_name';
$filter = $input['filter'] ?? null;

// Validar parámetros
if ($page < 1) $page = 1;
if ($size < 1 || $size > 100) $size = 10;
if (!in_array($direction, ['asc', 'desc'])) $direction = 'asc';

// Columnas válidas para ordenamiento
$validColumns = ['first_name', 'last_name', 'doc_id', 'email', 'role', 'created'];
if (!in_array($column, $validColumns)) $column = 'first_name';

try {
    $pdo = getConnection();
    
    // Construir consulta base
    $baseQuery = "FROM users WHERE 1=1";
    $params = [];
    
    // Aplicar filtro de búsqueda si existe
    if (!empty($filter)) {
        $baseQuery .= " AND (first_name LIKE :filter OR last_name LIKE :filter OR doc_id LIKE :filter OR email LIKE :filter)";
        $params['filter'] = '%' . $filter . '%';
    }
    
    // Contar total de registros
    $countQuery = "SELECT COUNT(*) " . $baseQuery;
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    
    // Calcular offset y total de páginas
    $offset = ($page - 1) * $size;
    $totalPages = ceil($total / $size);
    
    // Consulta principal con paginación
    $dataQuery = "SELECT pub_id, doc_id, sec_id, username, first_name, last_name, email, role, active, id, isDenied, deniedNote " . 
                 $baseQuery . 
                 " ORDER BY " . $column . " " . $direction . 
                 " LIMIT :size OFFSET :offset";
    
    $dataStmt = $pdo->prepare($dataQuery);
    $dataStmt->bindValue(':size', $size, PDO::PARAM_INT);
    $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    foreach ($params as $key => $value) {
        $dataStmt->bindValue(':' . $key, $value);
    }
    
    $dataStmt->execute();
    $users = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear datos como arrays indexados
    $formattedUsers = [];
    foreach ($users as $user) {
        $formattedUsers[] = [
            $user['pub_id'],
            $user['doc_id'],
            $user['sec_id'],
            $user['username'],
            $user['first_name'],
            $user['last_name'],
            $user['email'],
            $user['role'],
            $user['active'],
            (int)$user['id'],
            (bool)$user['isDenied'],
            $user['deniedNote']
        ];
    }
    
    // Respuesta exitosa
    echo json_encode([
        'data' => $formattedUsers,
        'total' => $total,
        'page' => $page,
        'totalPages' => $totalPages,
        'size' => $size
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor: ' . $e->getMessage(),
        'code' => 'INTERNAL_ERROR'
    ]);
}
?>
```

### Notas Importantes

1. **Fallback**: Si este endpoint no existe, la aplicación automáticamente usará el endpoint legacy `services/getUsers.php` pero simulará paginación en el frontend.

2. **Autenticación**: El endpoint debe usar el mismo sistema de autenticación que los otros servicios (Bearer token).

3. **Validación**: Es importante validar todos los parámetros de entrada para evitar inyección SQL.

4. **Performance**: Para tablas grandes, considera agregar índices en las columnas de ordenamiento más usadas.

5. **Filtro**: El filtro debe buscar en múltiples campos (nombre, apellido, documento, email) para una mejor experiencia de usuario.

### Testing

Puedes probar el endpoint con:

```bash
curl -X POST "https://api-tusubdominio.identifica.ai/services/getUsersPaginated.php" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "size": 10,
    "direction": "asc",
    "column": "first_name",
    "filter": null
  }'
```
