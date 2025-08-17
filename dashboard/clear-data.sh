#!/bin/bash

# Script para limpiar datos de identifica.ai Dashboard
echo "🧹 Limpiando datos almacenados de identifica.ai..."

# Para iOS Simulator
if command -v xcrun &> /dev/null; then
    echo "📱 Limpiando datos del simulador iOS..."
    xcrun simctl privacy booted reset all com.yourcompany.dashboard 2>/dev/null || true
fi

# Para Android Emulator
if command -v adb &> /dev/null; then
    echo "🤖 Limpiando datos del emulador Android..."
    adb shell pm clear com.yourcompany.dashboard 2>/dev/null || true
fi

# Limpiar cache de Metro
echo "🔄 Limpiando cache de Metro..."
npx expo start --clear

echo ""
echo "✅ Limpieza completada!"
echo "📱 La próxima vez que abras la app debería mostrar la pantalla de login"
echo ""
echo "💡 Si sigues viendo el dashboard, usa la pantalla de Debug en la app:"
echo "   1. Ve a la tab 'Debug'"
echo "   2. Presiona 'Limpiar Todos los Datos'"
echo "   3. La app debería redirigir al login"
