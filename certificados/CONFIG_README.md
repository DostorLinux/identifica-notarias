# Configuración de API para Dashboard de Certificados

## Para desarrollo local (npx expo start --web)

El archivo de configuración se encuentra en:
```
public/config/api.json
```

## Para desarrollo en red local (npx expo start --web --host=lan)

1. **Obtener la IP de tu máquina:**
   ```bash
   # En Windows
   ipconfig
   
   # En macOS/Linux  
   ifconfig
   # o
   ip addr show
   ```

2. **Obtener la IP del servidor Gate:**
   - Si Gate está en la misma máquina: usar la IP de tu máquina
   - Si Gate está en otra máquina: usar la IP de esa máquina

3. **Editar `public/config/api.json`:**
   ```json
   {
     "gate": {
       "baseUrl": "http://192.168.1.XXX/notaria-service/gate/api/web"
     }
   }
   ```
   
   Reemplazar `192.168.1.XXX` con la IP correcta.

## Ejemplos de configuración:

### Desarrollo local:
```json
{
  "gate": {
    "baseUrl": "http://localhost/notaria-service/gate/api/web"
  }
}
```

### Red local (LAN):
```json
{
  "gate": {
    "baseUrl": "http://192.168.1.100/notaria-service/gate/api/web"
  }
}
```

### Producción:
```json
{
  "gate": {
    "baseUrl": "https://notaria.example.com/gate/api/web"
  }
}
```

## Verificación

1. **Iniciar la aplicación:**
   ```bash
   npx expo start --web --host=lan
   ```

2. **Verificar en la consola del navegador:**
   - Debería mostrar: `✅ API config loaded from public/config/api.json`
   - Si muestra: `🔄 Using fallback API configuration` significa que no encontró el archivo

3. **Probar el login:**
   - La aplicación intentará conectarse al endpoint configurado
   - Si hay errores de CORS, verificar la configuración del servidor Gate

## Solución de problemas

### Error CORS
Si obtienes errores de CORS, el servidor Gate necesita permitir requests desde tu IP:
- Verificar configuración Apache/Nginx
- Asegurar que el servidor Gate esté corriendo
- Verificar firewall y puertos

### No se carga la configuración
- Verificar que el archivo esté en `public/config/api.json`
- Verificar sintaxis JSON válida
- Reiniciar el servidor de desarrollo Expo