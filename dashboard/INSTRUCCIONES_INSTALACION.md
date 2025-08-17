# 🚀 Instalación de Dependencias para Fotos

## 📦 **Instalar dependencias necesarias:**

```bash
npx expo install expo-image-picker expo-image-manipulator
```

## 🔄 **Reiniciar servidor de desarrollo:**

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm start
```

## ✅ **Verificar instalación:**

Después de reiniciar, las funciones de "Tomar Foto" y "Subir Imagen" deberían funcionar completamente.

## 🎯 **Próximos pasos:**

1. **Instalar dependencias** (comando de arriba)
2. **Reiniciar servidor**
3. **Probar crear usuario** con foto
4. **¡Listo!** - Las fotos se enviarán en base64 a tu API

## 🔧 **Si hay problemas:**

### **En iOS:**
- Las dependencias deberían funcionar automáticamente

### **En Android:**
- Podría requerir rebuilding: `npx expo run:android`

### **En Web:**
- La cámara usa la cámara web del navegador
- La galería usa el selector de archivos del navegador

---

**¿Necesitas ayuda?** Estas dependencias son estándar de Expo y muy estables.