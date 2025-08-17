# 📸 Instalación completa para funciones de cámara

## 🚀 **Instalar dependencias (NUEVO):**

```bash
cd /Users/samuel/develop/identifica/identifica-2.0/dashboard

# Instalar todas las dependencias de cámara
npx expo install expo-camera expo-image-picker expo-image-manipulator

# Reiniciar servidor
npm start
```

## 🎯 **Cómo funciona ahora:**

### **📷 Con expo-camera (Recomendado):**
- **Cámara nativa** en móvil con interfaz personalizada
- **Cámara web** en navegador con controles profesionales
- **Modal fullscreen** con botón de captura grande
- **Preview en tiempo real** antes de tomar la foto

### **📁 Fallback con expo-image-picker:**
- Si expo-camera no está disponible, usa image-picker
- **Selección de archivos** en web
- **Galería** en móvil

## 🔍 **Estados visuales:**

Ahora verás mensajes claros:
- ✅ **"📷 expo-camera disponible"** → Funciones completas
- ⚠️ **"📁 solo selección archivos disponible"** → Solo galería
- ❌ **"Instala dependencias"** → Nada instalado

## 🐛 **Debugging mejorado:**

Logs detallados que verás:
```
=== INICIO handleTakePhoto ===
Platform.OS: web
Camera disponible: true
ImagePicker disponible: true
Usando expo-camera
```

## 📱 **Experiencia de usuario:**

1. **Hacer clic en "Tomar Foto"**
2. **Se abre modal fullscreen** con cámara en vivo
3. **Centrar rostro** en el preview
4. **Botón grande de captura** en la parte inferior
5. **Imagen se procesa** automáticamente a base64
6. **Preview** aparece en el formulario

## 🔧 **Para probar:**

1. **Instalar dependencias** (comando de arriba)
2. **Reiniciar servidor**
3. **Crear usuario → Tomar Foto**
4. **Verificar logs** en consola

¿Puedes instalar expo-camera y contarme qué mensaje ves en la sección de fotografía?