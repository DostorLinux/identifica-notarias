#!/bin/bash

# Script para verificar la configuración de identifica.ai
echo "🔍 Verificando configuración de identifica.ai..."

CONFIG_FILE="./assets/config/settings.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ ERROR: No se encontró el archivo de configuración"
    echo "📁 Debería estar en: $CONFIG_FILE"
    exit 1
fi

echo "✅ Archivo de configuración encontrado"
echo ""

# Verificar valores por defecto
echo "🔍 Verificando si tienes valores por defecto..."

if grep -q "demo" "$CONFIG_FILE"; then
    echo "⚠️  ADVERTENCIA: Subdomain parece ser valor por defecto (demo)"
fi

if grep -q "admin" "$CONFIG_FILE"; then
    echo "⚠️  ADVERTENCIA: Username parece ser valor por defecto (admin)"
fi

if grep -q "password" "$CONFIG_FILE"; then
    echo "⚠️  ADVERTENCIA: Password parece ser valor por defecto (password)"
fi

if grep -q "your-api-key-here" "$CONFIG_FILE"; then
    echo "⚠️  ADVERTENCIA: API Key parece ser valor por defecto"
fi

echo ""
echo "📋 Configuración actual (sin mostrar password):"
echo "   Subdomain: $(grep '"subdomain"' $CONFIG_FILE | cut -d'"' -f4)"
echo "   Username: $(grep '"username"' $CONFIG_FILE | cut -d'"' -f4)"
echo "   Password: ***oculto***"
echo "   API Key: $(grep '"apiKey"' $CONFIG_FILE | cut -d'"' -f4 | cut -c1-8)..."
echo "   Device ID: $(grep '"deviceId"' $CONFIG_FILE | cut -d'"' -f4)"

echo ""
echo "💡 Para cambiar la configuración:"
echo "   1. Edita el archivo: $CONFIG_FILE"
echo "   2. Cambia los valores por tus credenciales reales"
echo "   3. Reinicia la app con: npm start"
echo "   4. Usa el Debug Panel para verificar"

echo ""
echo "📖 Lee la guía completa en: COMO-CONFIGURAR.md"
