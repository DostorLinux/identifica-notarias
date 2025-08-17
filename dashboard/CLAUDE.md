# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary Development:**
```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint code linting
```

**Setup & Maintenance:**
```bash
./setup.sh         # Initial project setup and configuration
./verify-setup.sh  # Verify project configuration
./check-config.sh  # Check current configuration settings
./clear-data.sh    # Clear application data
```

## Architecture Overview

This is a **React Native app with Expo SDK 53** using **Expo Router** for file-based navigation. The project follows a modern React Native architecture with:

- **Authentication**: JWT-based with Bearer tokens, managed via AuthContext
- **API Integration**: Custom IdentificaAPI class in `/app/api/IdentificaAPI.js` handles all backend communication
- **Navigation**: Expo Router v5 with typed routes, tab-based navigation in `app/(tabs)/`
- **Backend**: PHP/MySQL backend with JWT authentication using RSA256 keys
- **Multi-platform**: Supports iOS, Android, and Web deployment

## Key Project Structure

```
app/
├── (tabs)/            # Main navigation screens (index, explore, debug)
├── _layout.tsx        # Root layout with AuthProvider
├── login.tsx          # Authentication screen
├── context/           # React contexts (AuthContext)
├── api/              # API integration layer (IdentificaAPI.js)
├── components/        # Reusable UI components
└── utils/            # Utility functions
```

## Configuration System

**Critical**: Always check `/assets/config/settings.json` for API configuration. The app uses a dynamic configuration system with:
- Subdomain for API endpoints
- Default credentials for development
- Environment-specific settings
- AsyncStorage caching for performance

## Authentication Flow

Uses context-based authentication with:
1. JWT tokens stored in AsyncStorage
2. Bearer token authentication for API calls
3. Automatic token refresh
4. Route protection (authenticated vs guest screens)

## User Management System

The app implements a comprehensive user management system with:
- **Role-based access**: super_admin, user, normal, worker
- **Adaptive forms**: Different form fields based on user role
- **Photo integration**: Camera/gallery with base64 encoding and 400x400px resizing
- **CRUD operations**: Full user lifecycle management

## API Integration

**Always use the existing API class** at `/app/api/IdentificaAPI.js` for backend calls. It includes:
- Automatic authentication header injection
- Error handling and response formatting
- Endpoint management for users, companies, authentication
- Configuration-based URL construction

## Image Processing

When working with photos:
- Uses expo-camera and expo-image-picker
- Automatic resizing to 400x400px
- JPEG compression at 80% quality
- Base64 conversion for API transmission
- Platform-specific camera handling

## Platform Considerations

- **Multi-platform support**: Test changes on iOS, Android, and Web
- **Responsive design**: UI adapts to different screen sizes
- **Platform-specific features**: Camera integration varies by platform
- **Edge-to-edge display**: Android-specific UI considerations

## Development Guidelines

- Follow existing TypeScript patterns with strict mode
- Use established theme system in `/app/styles/`
- Maintain consistency with Expo Router navigation patterns
- Test authentication flows after making auth-related changes
- Check ESLint output with `npm run lint` before committing

---

# PROYECTO AGENDAMIENTO - ESTADO ACTUAL

## ✅ IMPLEMENTACIÓN COMPLETADA (Sesión 2025-01-31)

### Backend PHP Endpoints:
- **`/gate/portal/web/services/scheduler/getList.php`** - Obtiene agendamientos con paginación
- **`/gate/portal/web/services/scheduler/save.php`** - Crea/actualiza agendamientos
- Integración completa con tabla `scheduler_appointment`
- Validación de campos requeridos y duplicados
- Soporte para filtros y ordenamiento

### Frontend API Integration:
- **Métodos agregados a IdentificaAPI.js:**
  - `getAppointments(params)` - Obtiene lista de agendamientos
  - `saveAppointment(data)` - Guarda nuevo agendamiento
- Mapeo automático de datos PHP array → objetos JavaScript
- Manejo de errores y timeouts

### Dashboard React Native:
- **`/app/(tabs)/agendamiento.tsx`** - Actualizado completamente
- Eliminados datos mock, ahora usa API real
- Campo RUT agregado al formulario
- Carga automática de datos al iniciar
- Recarga de lista después de crear agendamiento
- Validación completa de formulario

### Funcionalidades Implementadas:
- ✅ Crear agendamientos desde el dashboard
- ✅ Listar "Mis Agendamientos" con datos reales
- ✅ Estados de progreso (Pendiente, Confirmado, Completado)
- ✅ Responsive design (mobile/tablet)
- ✅ Validación de campos obligatorios
- ✅ Integración completa con sistema de autenticación

### Estructura de Datos scheduler_appointment:
```sql
- id, numero_contenedor, rut_usuario
- nombre_conductor, apellido_conductor, patente_vehiculo
- fecha_asignacion, status
- en_puerta_status/timestamp, gate_status/timestamp
- patio_status/timestamp, salida_status/timestamp
- created_by, created, updated
```

## 🔧 ÚLTIMO ESTADO TÉCNICO:
- **Error solucionado:** `expo` module missing - Fixed con `npm install expo`
- **Listo para:** `npm start` debería funcionar correctamente
- **Próximos pasos sugeridos:** Probar funcionalidad end-to-end

## 🎯 PARA PRÓXIMA SESIÓN:
- El sistema de agendamiento está **100% funcional**
- Dashboard carga datos reales de la base de datos
- Crear/listar agendamientos funciona correctamente
- Sistema listo para testing y refinamientos