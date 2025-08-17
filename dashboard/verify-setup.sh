#!/bin/bash

# Script de verificación para identifica.ai Dashboard
echo "🔍 Verificando configuración del proyecto identifica.ai..."

# Verificar que existe el archivo de configuración
CONFIG_FILE="./assets/config/settings.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ ERROR: No se encontró el archivo de configuración $CONFIG_FILE"
    echo "📝 Por favor, copia settings.example.json a settings.json y configúralo:"
    echo "   cp assets/config/settings.example.json assets/config/settings.json"
    exit 1
fi

echo "✅ Archivo de configuración encontrado"

# Verificar que no tenga valores por defecto
if grep -q "your-subdomain-here\|your-username-here\|your-password-here" "$CONFIG_FILE"; then
    echo "⚠️  ADVERTENCIA: El archivo de configuración contiene valores por defecto"
    echo "📝 Por favor, edita $CONFIG_FILE con tus credenciales reales"
fi

# Verificar que existan las dependencias principales
echo "📦 Verificando dependencias..."

if [ ! -d "node_modules" ]; then
    echo "❌ ERROR: No se encontró node_modules"
    echo "📝 Ejecuta: npm install"
    exit 1
fi

echo "✅ node_modules encontrado"

# Verificar que existe el logo
LOGO_FILE="./assets/images/logo.png"
if [ ! -f "$LOGO_FILE" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró el logo en $LOGO_FILE"
    echo "📝 Agrega tu logo en assets/images/logo.png"
fi

# Verificar estructura de archivos críticos
CRITICAL_FILES=(
    "app/context/AuthContext.js"
    "app/_layout.tsx"
    "app/(tabs)/LoginScreen.js"
    "app/(tabs)/index.tsx"
    "app/utils/storage.js"
    "app/api/IdentificaAPI.js"
    "app/styles/theme.js"
)

echo "🏗️  Verificando estructura de archivos..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Archivo crítico faltante: $file"
        exit 1
    fi
done

echo "✅ Todos los archivos críticos están presentes"

# Mostrar resumen de configuración (sin mostrar credenciales)
echo ""
echo "📋 Resumen de configuración:"
echo "   - Subdomain: $(grep '"subdomain"' $CONFIG_FILE | cut -d'"' -f4)"
echo "   - Environment: $(grep '"environment"' $CONFIG_FILE | cut -d'"' -f4)"
echo "   - Version: $(grep '"version"' $CONFIG_FILE | cut -d'"' -f4)"

echo ""
echo "✅ ¡Verificación completada!"
echo "🚀 Puedes ejecutar la app con: npm start"
echo ""
echo "📱 La app debería mostrar automáticamente la pantalla de login"
echo "🔐 Usa las credenciales configuradas en $CONFIG_FILE"
