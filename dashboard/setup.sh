#!/bin/bash

# Identifica.ai - Quick Start Script

echo "🚀 Iniciando configuración de identifica.ai Dashboard v2.0..."

# Verificar si npm está instalado
if ! command -v npm &> /dev/null
then
    echo "❌ npm no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar si existe el archivo de configuración
if [ ! -f "assets/config/settings.json" ]; then
    echo "⚙️ Archivo de configuración no encontrado. Creando uno por defecto..."
    mkdir -p assets/config
    cat > assets/config/settings.json << EOL
{
  "subdomain": "demo",
  "username": "admin",
  "password": "password",
  "apiKey": "your-api-key-here",
  "deviceId": "device-001",
  "environment": "development",
  "version": "2.0.0"
}
EOL
fi

echo "✅ Configuración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita assets/config/settings.json con tus credenciales"
echo "2. Ejecuta 'npm start' para iniciar la aplicación"
echo ""
echo "📱 Comandos disponibles:"
echo "  npm start    - Inicia Expo"
echo "  npm run ios  - Ejecuta en iOS"
echo "  npm run android - Ejecuta en Android"
echo "  npm run web  - Ejecuta en web"
