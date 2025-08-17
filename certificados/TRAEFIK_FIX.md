# 🔧 Fix Traefik CORS para Authorization Header

## Problema identificado
El servidor Traefik no está enviando el header `Access-Control-Allow-Headers` en la respuesta del preflight OPTIONS, lo que impide que el navegador envíe el header `Authorization`.

## Configuración actual
```yaml
- traefik.http.middlewares.ac-test-headers.headers.accessControlAllowHeaders=Origin,Content-Type,Accept,X-Custom-Header,Accept,Authorization,api-key
```

## Solución
Actualizar la configuración de Traefik con estos cambios:

```yaml
deploy:
  labels:
    - traefik.enable=true
    - traefik.http.services.ac-test.loadbalancer.server.port=80
    - traefik.http.routers.ac-test.rule=Host(`access-control-test.identifica.ai`,`api-access-control-test.identifica.ai`)
    - traefik.http.routers.ac-test.tls.certresolver=le
    - traefik.http.routers.ac-test.entrypoints=websecure
    - traefik.docker.network=traefik-proxy
    - traefik.http.services.ac-test.loadbalancer.passhostheader=true
    - traefik.http.routers.ac-test.middlewares=ac-test-headers@docker
    
    # CORS Headers - CORREGIDOS
    - traefik.http.middlewares.ac-test-headers.headers.accesscontrolalloworiginlist=*
    - traefik.http.middlewares.ac-test-headers.headers.accessControlAllowMethods=GET,OPTIONS,PUT,POST,DELETE,PATCH
    - traefik.http.middlewares.ac-test-headers.headers.accessControlAllowHeaders=Origin,Content-Type,Accept,Authorization,X-Requested-With,Cache-Control
    - traefik.http.middlewares.ac-test-headers.headers.accessControlAllowCredentials=true
    - traefik.http.middlewares.ac-test-headers.headers.accessControlExposeHeaders=*
    - traefik.http.middlewares.ac-test-headers.headers.addVaryHeader=true
    - traefik.http.middlewares.ac-test-headers.headers.accessControlMaxAge=86400
```

## Cambios clave:
1. **Simplificado `accessControlAllowHeaders`** - removido duplicados y headers innecesarios
2. **Agregado `accessControlAllowCredentials=true`** - necesario para Basic Auth
3. **Agregado `accessControlMaxAge=86400`** - cachea preflight por 24 horas
4. **Agregado `PATCH`** a métodos permitidos

## Para aplicar:
1. Actualizar docker-compose.yml
2. Hacer `docker stack deploy` o `docker-compose up -d`
3. Verificar con el botón "Probar Preflight" en la app

## Verificación exitosa:
El preflight debería responder con:
```
access-control-allow-headers: Origin,Content-Type,Accept,Authorization,X-Requested-With,Cache-Control
access-control-allow-credentials: true
```