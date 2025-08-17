import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import RoleGuard from '../components/RoleGuard';
import { 
  getToken, 
  getUserData, 
  getSettings, 
  clearAllData,
  reloadSettingsFromFile
} from '../utils/storage';

const DebugScreen = () => {
  const { user, isAuthenticated, token, logout, forceLogout } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);

  const loadDebugInfo = async () => {
    try {
      console.log('🔍 Debug: Cargando información completa...');
      
      const storedToken = await getToken();
      const storedUser = await getUserData();
      const settings = await getSettings();
      
      console.log('🔍 Debug: Información cargada:', {
        storedToken: !!storedToken,
        storedUser: !!storedUser,
        settings: !!settings,
        subdomain: settings?.subdomain
      });
      
      setDebugInfo({
        contextUser: user,
        contextAuthenticated: isAuthenticated,
        contextToken: token,
        storedToken,
        storedUser,
        settings,
      });
    } catch (error) {
      console.error('❌ Debug: Error cargando info:', error);
      Alert.alert('Error', error.message);
    }
  };

  const reloadSettings = async () => {
    try {
      console.log('🔄 Debug: Recargando settings desde archivo...');
      const newSettings = await reloadSettingsFromFile();
      if (newSettings) {
        Alert.alert('Éxito', `Settings recargados. Subdomain: ${newSettings.subdomain}`);
        setTimeout(() => loadDebugInfo(), 500);
      } else {
        Alert.alert('Error', 'No se pudieron recargar los settings');
      }
    } catch (error) {
      console.error('❌ Debug: Error recargando settings:', error);
      Alert.alert('Error', error.message);
    }
  };

  const clearAllStoredData = async () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro? Esto eliminará TODOS los datos almacenados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Debug: Limpiando todos los datos...');
              await clearAllData();
              await forceLogout();
              Alert.alert('Éxito', 'Todos los datos han sido eliminados. Los settings se recargarán automáticamente.');
              setTimeout(() => loadDebugInfo(), 1000);
            } catch (error) {
              console.error('❌ Debug: Error limpiando datos:', error);
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const doLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Quieres cerrar sesión normalmente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Logout',
          style: 'default',
          onPress: async () => {
            try {
              console.log('🚪 Debug: Ejecutando logout...');
              const result = await logout();
              if (result.success) {
                Alert.alert('Éxito', 'Sesión cerrada correctamente');
              } else {
                Alert.alert('Error', result.error);
              }
              setTimeout(() => loadDebugInfo(), 1000);
            } catch (error) {
              console.error('❌ Debug: Error en logout:', error);
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <RoleGuard 
      allowedRoles={['admin', 'super_admin']}
      fallbackMessage="Solo los administradores pueden acceder a las herramientas de depuración."
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      <ScrollView style={{ flex: 1, padding: spacing.lg }}>
        <Text style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing.xl,
          textAlign: 'center',
        }}>
          🔍 Debug Panel
        </Text>

        <View style={{ marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={loadDebugInfo}
            style={{
              backgroundColor: colors.primary.purple,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: typography.fontWeight.bold }}>
              🔄 Cargar Info de Debug
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reloadSettings}
            style={{
              backgroundColor: colors.extended.blue,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: typography.fontWeight.bold }}>
              📁 Recargar Settings desde Archivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={doLogout}
            style={{
              backgroundColor: colors.primary.green,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: typography.fontWeight.bold }}>
              🚪 Logout Normal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearAllStoredData}
            style={{
              backgroundColor: colors.error,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.white, fontWeight: typography.fontWeight.bold }}>
              🗑️ Limpiar Todos los Datos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Estado Actual Rápido */}
        <View style={{
          backgroundColor: isAuthenticated ? colors.success + '20' : colors.error + '20',
          padding: spacing.md,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.lg,
          borderLeftWidth: 4,
          borderLeftColor: isAuthenticated ? colors.success : colors.error,
        }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: isAuthenticated ? colors.success : colors.error,
          }}>
            {isAuthenticated ? '✅ AUTENTICADO' : '❌ NO AUTENTICADO'}
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            Usuario: {user?.username || 'Ninguno'}
          </Text>
        </View>

        {/* Settings Status */}
        {debugInfo?.settings && (
          <View style={{
            backgroundColor: debugInfo.settings.subdomain ? colors.success + '20' : colors.error + '20',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: debugInfo.settings.subdomain ? colors.success : colors.error,
          }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: debugInfo.settings.subdomain ? colors.success : colors.error,
            }}>
              {debugInfo.settings.subdomain ? '✅ SETTINGS CARGADOS' : '❌ SETTINGS FALTAN'}
            </Text>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Subdomain: {debugInfo.settings.subdomain || 'UNDEFINED'}
            </Text>
          </View>
        )}

        {debugInfo && (
          <View style={{
            backgroundColor: colors.white,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
          }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing.md,
            }}>
              📊 Información Detallada:
            </Text>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontWeight: typography.fontWeight.bold, color: colors.primary.purple }}>
                Contexto de Autenticación:
              </Text>
              <Text>• Autenticado: {debugInfo.contextAuthenticated ? '✅ Sí' : '❌ No'}</Text>
              <Text>• Usuario: {debugInfo.contextUser?.username || 'null'}</Text>
              <Text>• Nombre: {debugInfo.contextUser?.first_name || 'null'}</Text>
              <Text>• Token: {debugInfo.contextToken ? '✅ Presente' : '❌ Ausente'}</Text>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontWeight: typography.fontWeight.bold, color: colors.primary.green }}>
                AsyncStorage:
              </Text>
              <Text>• Token Almacenado: {debugInfo.storedToken ? '✅ Presente' : '❌ Ausente'}</Text>
              <Text>• Usuario Almacenado: {debugInfo.storedUser ? '✅ Presente' : '❌ Ausente'}</Text>
              <Text>• Username: {debugInfo.storedUser?.username || 'null'}</Text>
              <Text>• Nombre: {debugInfo.storedUser?.first_name || 'null'}</Text>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontWeight: typography.fontWeight.bold, color: colors.primary.gray }}>
                Settings.json:
              </Text>
              <Text>• Subdomain: {debugInfo.settings?.subdomain || '❌ UNDEFINED'}</Text>
              <Text>• Username: {debugInfo.settings?.username || 'null'}</Text>
              <Text>• Password: {debugInfo.settings?.password ? '***configurado***' : 'null'}</Text>
              <Text>• API Key: {debugInfo.settings?.apiKey ? '***configurado***' : 'null'}</Text>
              <Text>• Environment: {debugInfo.settings?.environment || 'null'}</Text>
            </View>
          </View>
        )}

        {/* Instrucciones */}
        <View style={{
          backgroundColor: colors.white,
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          marginTop: spacing.lg,
        }}>
          <Text style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.sm,
          }}>
            💡 Para resolver "Subdomain is undefined":
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, marginBottom: spacing.xs }}>
            1. Presiona "Cargar Info de Debug" para ver el estado actual
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, marginBottom: spacing.xs }}>
            2. Si Subdomain aparece como UNDEFINED, presiona "Recargar Settings"
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, marginBottom: spacing.xs }}>
            3. Revisa la consola para ver logs detallados
          </Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            4. Si sigue fallando, hay un problema con el archivo settings.json
          </Text>
        </View>
      </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default DebugScreen;
