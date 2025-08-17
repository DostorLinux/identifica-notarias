import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useAuthAPI } from '../../hooks/useAuthAPI';
import axios from 'axios';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface SettingsConfig {
  username: string;
  password: string;
  cliente: string;
  qrCamera: string;
  biometricCamera: string;
}

const SettingsScreen = () => {
  const { currentUser, logout, isAuthenticated, login, refreshAuthState } = useAuth();
  const { reloadConfig } = useAuthAPI();
  
  const [config, setConfig] = useState<SettingsConfig>({
    username: '',
    password: '',
    cliente: '',
    qrCamera: '',
    biometricCamera: '',
  });
  
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAvailableCameras();
  }, []);

  // Debug: verificar estado de autenticación
  useEffect(() => {
    console.log('🔍 Estado de autenticación actual:', {
      isAuthenticated,
      currentUser: currentUser?.username || 'No usuario',
      hasLogoutFunction: typeof logout === 'function'
    });
  }, [isAuthenticated, currentUser, logout]);

  const loadSettings = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('app_settings');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (showAlert = true) => {
    try {
      if (showAlert) setSaving(true);
      await AsyncStorage.setItem('app_settings', JSON.stringify(config));
      
      // Recargar la configuración de la API si se cambió el cliente
      if (config.cliente) {
        await reloadConfig();
        console.log('✅ API configuration reloaded with new client:', config.cliente);
      }
      
      if (showAlert) {
        Alert.alert('Éxito', 'Configuración guardada correctamente');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (showAlert) {
        Alert.alert('Error', 'No se pudo guardar la configuración');
      }
    } finally {
      if (showAlert) setSaving(false);
    }
  };

  const loadAvailableCameras = async () => {
    try {
      // En un entorno web, podemos usar navigator.mediaDevices
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        console.log('🎥 Solicitando permisos de cámara...');
        
        // Primero solicitar permisos de cámara
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); // Detener el stream inmediatamente
          console.log('✅ Permisos de cámara concedidos');
        } catch (permissionError) {
          console.warn('⚠️ No se pudieron obtener permisos de cámara:', permissionError);
        }

        // Ahora enumerar los dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('🎥 Dispositivos encontrados:', devices);
        
        const cameras = devices
          .filter(device => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Cámara ${index + 1}`,
            kind: device.kind,
          }));
        
        console.log('📹 Cámaras disponibles:', cameras);
        
        if (cameras.length === 0) {
          // Si no hay cámaras, agregar opciones predeterminadas
          setAvailableCameras([
            { deviceId: 'default', label: 'Cámara por Defecto', kind: 'videoinput' },
            { deviceId: 'user', label: 'Cámara Frontal', kind: 'videoinput' },
            { deviceId: 'environment', label: 'Cámara Trasera', kind: 'videoinput' },
          ]);
        } else {
          setAvailableCameras(cameras);
        }
      } else {
        // Fallback para dispositivos móviles - cámaras simuladas
        console.log('📱 Modo móvil detectado, usando cámaras predeterminadas');
        setAvailableCameras([
          { deviceId: 'user', label: 'Cámara Frontal', kind: 'videoinput' },
          { deviceId: 'environment', label: 'Cámara Trasera', kind: 'videoinput' },
          { deviceId: 'default', label: 'Cámara por Defecto', kind: 'videoinput' },
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading cameras:', error);
      // Fallback en caso de error
      setAvailableCameras([
        { deviceId: 'default', label: 'Cámara por Defecto', kind: 'videoinput' },
        { deviceId: 'user', label: 'Cámara Frontal', kind: 'videoinput' },
        { deviceId: 'environment', label: 'Cámara Trasera', kind: 'videoinput' },
      ]);
    }
  };

  const updateClienteDomain = useCallback((cliente: string) => {
    // Limpiar el input y agregar automáticamente .identifica.ai
    const cleanCliente = cliente.replace('.identifica.ai', '').trim();
    setConfig(prev => ({ ...prev, cliente: cleanCliente }));
  }, []);

  const updateUsername = useCallback((text: string) => {
    console.log('👤 Actualizando usuario:', text);
    setConfig(prev => ({ ...prev, username: text }));
  }, []);

  const updatePassword = useCallback((text: string) => {
    console.log('🔒 Actualizando contraseña');
    setConfig(prev => ({ ...prev, password: text }));
  }, []);

  const updateQRCamera = useCallback((cameraId: string) => {
    setConfig(prev => ({ ...prev, qrCamera: cameraId }));
  }, []);

  const updateBiometricCamera = useCallback((cameraId: string) => {
    setConfig(prev => ({ ...prev, biometricCamera: cameraId }));
  }, []);

  // Handlers memoizados para las cámaras
  const qrCameraHandler = useCallback((cameraId: string) => {
    console.log('📹 Seleccionando cámara QR:', cameraId);
    updateQRCamera(cameraId);
  }, [updateQRCamera]);

  const biometricCameraHandler = useCallback((cameraId: string) => {
    console.log('📹 Seleccionando cámara biométrica:', cameraId);
    updateBiometricCamera(cameraId);
  }, [updateBiometricCamera]);

  // Solicitar permisos de cámara manualmente
  const requestCameraPermissions = useCallback(async () => {
    try {
      console.log('🎥 Solicitando permisos de cámara manualmente...');
      await loadAvailableCameras();
      Alert.alert('Éxito', 'Permisos de cámara actualizados');
    } catch (error) {
      console.error('❌ Error al solicitar permisos:', error);
      Alert.alert('Error', 'No se pudieron obtener los permisos de cámara');
    }
  }, []);

  // Limpiar datos de autenticación almacenados usando función directa
  const clearStoredAuth = () => {
    console.log('🧹 clearStoredAuth llamado');
    Alert.alert(
      'Limpiar Datos de Autenticación',
      '¿Estás seguro? Esto eliminará todas las credenciales guardadas y recargará la página.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          style: 'destructive',
          onPress: directLogout
        }
      ]
    );
  };


  const getFullDomain = () => {
    return config.cliente ? `${config.cliente}.identifica.ai` : '';
  };

  const testConfiguration = async () => {
    if (!config.username || !config.password) {
      Alert.alert('Error', 'Debes ingresar usuario y contraseña para probar');
      return;
    }

    if (!config.cliente) {
      Alert.alert('Error', 'Debes configurar el cliente para probar la conexión');
      return;
    }

    try {
      setTesting(true);
      console.log('🔍 Probando configuración...');
      console.log('- Cliente:', config.cliente);
      console.log('- Usuario:', config.username);
      
      // Primero guardar la configuración incluyendo el cliente
      await saveSettings(false);
      
      // Hacer una prueba de login usando axios directamente
      const baseURL = `https://${config.cliente}.identifica.ai`;
      
      console.log('🌐 Probando conexión a:', baseURL);
      
      const loginData = new URLSearchParams({
        user: config.username,
        pass: config.password,
        mode: 'jwt'
      });
      
      const response = await axios.post(`${baseURL}/services/login.php`, loginData, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('📡 Respuesta del servidor:', response.data);
      console.log('📊 Estructura de respuesta:', {
        hasSuccess: 'success' in response.data,
        successValue: response.data?.success,
        hasToken: 'token' in response.data,
        tokenValue: response.data?.token ? `${response.data.token.substring(0, 20)}...` : 'No token',
        hasUser: 'user' in response.data,
        userValue: response.data?.user,
        allKeys: Object.keys(response.data || {})
      });
      
      if (response.data?.success && response.data?.token) {
        const user = response.data.user;
        Alert.alert(
          '✅ Configuración Válida',
          `Conexión exitosa!\n\n` +
          `🏢 Cliente: ${config.cliente}.identifica.ai\n` +
          `👤 Usuario: ${config.username}\n` +
          `🔑 Token obtenido: ${response.data.token.substring(0, 20)}...\n` +
          `📊 Estado: ${response.data.success ? 'Autenticado' : 'Error'}\n` +
          `👥 Datos usuario: ${user ? `${user.username || 'N/A'} (${user.email || 'N/A'})` : 'No disponible'}`
        );
        console.log('✅ Test exitoso - Token:', response.data.token.substring(0, 50) + '...');
        console.log('👤 Usuario obtenido:', user);
      } else {
        console.log('❌ Respuesta no contiene success=true o token');
        throw new Error(`Error de autenticación: ${response.data?.error || 'Respuesta inválida del servidor'}`);
      }
    } catch (error) {
      console.error('❌ Error en test de configuración:', error);
      
      let errorMessage = 'Error desconocido';
      if (error.response) {
        errorMessage = `Error del servidor (${error.response.status}): ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica la URL del cliente.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert(
        '❌ Error de Configuración',
        `No se pudo conectar:\n\n${errorMessage}\n\n` +
        `Verifica:\n` +
        `• Cliente: ${config.cliente}.identifica.ai\n` +
        `• Credenciales de usuario\n` +
        `• Conexión a internet`
      );
    } finally {
      setTesting(false);
    }
  };

  const handleLogin = async () => {
    if (!config.username || !config.password) {
      Alert.alert('Error', 'Debes ingresar usuario y contraseña');
      return;
    }

    if (!config.cliente) {
      Alert.alert('Error', 'Debes configurar el cliente antes de iniciar sesión');
      return;
    }

    try {
      setSaving(true);
      
      // Primero guardar la configuración incluyendo el cliente
      await saveSettings(false);
      
      // Luego hacer login con las credenciales
      await login({ 
        username: config.username, 
        password: config.password,
        cliente: config.cliente 
      });
      
      Alert.alert('Éxito', 'Sesión iniciada correctamente');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setSaving(false);
    }
  };

  // Función de logout directa que no depende del contexto
  const directLogout = async () => {
    try {
      console.log('🚪 Iniciando logout directo...');
      
      // Limpiar todos los datos de autenticación posibles
      const keysToRemove = [
        'gate_auth_token', 
        'gate_user_info',
        'auth_token',
        'user_info',
        'token',
        'user',
        'access_token',
        'refresh_token'
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('🗑️ Datos de autenticación eliminados');
      
      // Forzar recarga de la página para limpiar estado
      if (typeof window !== 'undefined') {
        console.log('🔄 Recargando página...');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Error en logout directo:', error);
      Alert.alert('Error', 'Error al cerrar sesión: ' + error.message);
    }
  };

  const handleLogout = () => {
    console.log('🚪 handleLogout llamado');
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive', 
          onPress: directLogout
        }
      ]
    );
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    secureTextEntry = false,
    autoCapitalize = 'none',
    icon,
    keyboardType = 'default'
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    icon: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  }) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
      }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={colors.text.secondary} 
          style={{ marginLeft: spacing.md }}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          blurOnSubmit={false}
          style={{
            flex: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
          }}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: spacing.md }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const CameraSelector = React.memo(({ 
    title, 
    subtitle, 
    selectedCamera, 
    onCameraSelect 
  }: {
    title: string;
    subtitle: string;
    selectedCamera: string;
    onCameraSelect: (cameraId: string) => void;
  }) => {
    console.log(`🎥 Renderizando ${title} con ${availableCameras.length} cámaras disponibles`);
    
    return (
    <View style={{
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.md,
    }}>
      <Text style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.md,
      }}>
        {subtitle}
      </Text>

      {availableCameras.map((camera) => (
        <TouchableOpacity
          key={camera.deviceId}
          onPress={() => onCameraSelect(camera.deviceId)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: selectedCamera === camera.deviceId 
              ? colors.primary.purple + '20' 
              : colors.background.light,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.sm,
            borderWidth: selectedCamera === camera.deviceId ? 2 : 1,
            borderColor: selectedCamera === camera.deviceId 
              ? colors.primary.purple 
              : colors.border,
          }}
        >
          <View style={{
            backgroundColor: selectedCamera === camera.deviceId 
              ? colors.primary.purple 
              : colors.text.secondary,
            borderRadius: borderRadius.full,
            padding: spacing.sm,
            marginRight: spacing.md,
          }}>
            <Ionicons 
              name="camera" 
              size={20} 
              color={colors.white} 
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}>
              {camera.label}
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>
              ID: {camera.deviceId.slice(0, 12)}...
            </Text>
          </View>

          {selectedCamera === camera.deviceId && (
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={colors.primary.purple} 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
    );
  });


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color={colors.primary.purple} />
          <Text style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.primary,
            marginTop: spacing.lg,
          }}>
            Cargando configuración...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.purple}
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
            }}>
              Configuración
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.white,
              opacity: 0.9,
            }}>
              {isAuthenticated ? `${currentUser?.username} - Configurado` : 'Sin autenticar'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {/* Botón de Logout Forzado */}
            <TouchableOpacity
              onPress={() => {
                console.log('🔴 LOGOUT FORZADO PRESIONADO');
                directLogout();
              }}
              style={{
                backgroundColor: colors.error,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="power-outline" size={16} color={colors.white} />
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
                marginLeft: spacing.xs,
              }}>
                Logout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                console.log('🔴 BOTÓN LIMPIAR PRESIONADO');
                clearStoredAuth();
              }}
              style={{
                backgroundColor: colors.warning + '30',
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.white} />
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
                marginLeft: spacing.xs,
              }}>
                Limpiar
              </Text>
            </TouchableOpacity>

            {isAuthenticated && (
              <TouchableOpacity
                onPress={() => {
                  console.log('🔴 BOTÓN SALIR PRESIONADO');
                  handleLogout();
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.white} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.white,
                  marginLeft: spacing.xs,
                }}>
                  Salir
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Main Form */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Login Section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          ...shadows.md,
        }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            🔐 Autenticación
          </Text>

          {/* Campo Usuario */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
            }}>
              Usuario
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={colors.text.secondary} 
                style={{ marginLeft: spacing.md }}
              />
              <TextInput
                value={config.username}
                onChangeText={updateUsername}
                placeholder="Ingrese su usuario"
                placeholderTextColor={colors.text.disabled}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary,
                }}
              />
            </View>
          </View>

          {/* Campo Contraseña */}
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
            }}>
              Contraseña
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={colors.text.secondary} 
                style={{ marginLeft: spacing.md }}
              />
              <TextInput
                value={config.password}
                onChangeText={updatePassword}
                placeholder="Ingrese su contraseña"
                placeholderTextColor={colors.text.disabled}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: spacing.md }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={{ 
            flexDirection: 'row', 
            gap: spacing.sm,
            marginTop: spacing.sm 
          }}>
            {/* Botón Probar Configuración */}
            <TouchableOpacity
              onPress={testConfiguration}
              disabled={testing || saving || !config.username || !config.password || !config.cliente}
              style={{
                flex: 1,
                backgroundColor: colors.extended.blue,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: (testing || saving || !config.username || !config.password || !config.cliente) ? 0.6 : 1,
              }}
            >
              {testing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                  <Text style={{
                    color: colors.white,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    marginLeft: spacing.xs,
                  }}>
                    Probar
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Botón Login - solo si no está autenticado */}
            {!isAuthenticated && (
              <TouchableOpacity
                onPress={handleLogin}
                disabled={saving || testing || !config.username || !config.password || !config.cliente}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary.purple,
                  borderRadius: borderRadius.lg,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: (saving || testing || !config.username || !config.password || !config.cliente) ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={colors.white} />
                    <Text style={{
                      color: colors.white,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      marginLeft: spacing.xs,
                    }}>
                      Login
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {isAuthenticated && (
            <View style={{
              backgroundColor: colors.success + '10',
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginTop: spacing.sm,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={{
                  color: colors.success,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  marginLeft: spacing.sm,
                }}>
                  Sesión activa
                </Text>
              </View>
              
              <View style={{ marginLeft: spacing.lg }}>
                <Text style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  marginBottom: spacing.xs,
                }}>
                  👤 Usuario: {currentUser?.username || 'No disponible'}
                </Text>
                <Text style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  marginBottom: spacing.xs,
                }}>
                  📧 Email: {currentUser?.email || 'No disponible'}
                </Text>
                <Text style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  marginBottom: spacing.xs,
                }}>
                  🏢 Cliente: {getFullDomain() || 'No configurado'}
                </Text>
                {currentUser?.role && (
                  <Text style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.sm,
                  }}>
                    🔐 Rol: {currentUser.role}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  console.log('🔴 BOTÓN CERRAR SESIÓN (SESIÓN ACTIVA) PRESIONADO');
                  handleLogout();
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.error,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: spacing.md,
                }}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.white} />
                <Text style={{
                  color: colors.white,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  marginLeft: spacing.xs,
                }}>
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Client Section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          ...shadows.md,
        }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            🏢 Cliente
          </Text>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
            }}>
              Nombre del Cliente
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Ionicons 
                name="business-outline" 
                size={20} 
                color={colors.text.secondary} 
                style={{ marginLeft: spacing.md }}
              />
              <TextInput
                value={config.cliente}
                onChangeText={updateClienteDomain}
                placeholder="nombre-cliente"
                placeholderTextColor={colors.text.disabled}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary,
                }}
              />
              <Text style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                paddingRight: spacing.md,
              }}>
                .identifica.ai
              </Text>
            </View>
          </View>

          {getFullDomain() && (
            <View style={{
              backgroundColor: colors.primary.purple + '10',
              borderRadius: borderRadius.lg,
              padding: spacing.md,
            }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.primary.purple,
                fontWeight: typography.fontWeight.medium,
              }}>
                Dominio completo: {getFullDomain()}
              </Text>
            </View>
          )}
        </View>

        {/* Camera Sections */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          ...shadows.md,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}>
              📱 Cámaras
            </Text>
            
            <TouchableOpacity
              onPress={requestCameraPermissions}
              style={{
                backgroundColor: colors.primary.purple + '20',
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="refresh" size={16} color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
          }}>
            {availableCameras.length} cámaras disponibles
          </Text>

          {/* QR Camera */}
          <Text style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm,
          }}>
            Cámara QR
          </Text>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
          }}>
            Selecciona la cámara para escanear códigos QR
          </Text>

          {availableCameras.map((camera) => (
            <TouchableOpacity
              key={`qr-${camera.deviceId}`}
              onPress={() => qrCameraHandler(camera.deviceId)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                backgroundColor: config.qrCamera === camera.deviceId 
                  ? colors.primary.purple + '20' 
                  : colors.background.light,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                borderWidth: config.qrCamera === camera.deviceId ? 2 : 1,
                borderColor: config.qrCamera === camera.deviceId 
                  ? colors.primary.purple 
                  : colors.border,
              }}
            >
              <View style={{
                backgroundColor: config.qrCamera === camera.deviceId 
                  ? colors.primary.purple 
                  : colors.text.secondary,
                borderRadius: borderRadius.full,
                padding: spacing.sm,
                marginRight: spacing.md,
              }}>
                <Ionicons 
                  name="qr-code" 
                  size={20} 
                  color={colors.white} 
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}>
                  {camera.label}
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}>
                  ID: {camera.deviceId.slice(0, 12)}...
                </Text>
              </View>

              {config.qrCamera === camera.deviceId && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.primary.purple} 
                />
              )}
            </TouchableOpacity>
          ))}

          {/* Biometric Camera */}
          <Text style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm,
            marginTop: spacing.lg,
          }}>
            Cámara Biométrica
          </Text>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
          }}>
            Selecciona la cámara para verificación biométrica
          </Text>

          {availableCameras.map((camera) => (
            <TouchableOpacity
              key={`bio-${camera.deviceId}`}
              onPress={() => biometricCameraHandler(camera.deviceId)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                backgroundColor: config.biometricCamera === camera.deviceId 
                  ? colors.primary.green + '20' 
                  : colors.background.light,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                borderWidth: config.biometricCamera === camera.deviceId ? 2 : 1,
                borderColor: config.biometricCamera === camera.deviceId 
                  ? colors.primary.green 
                  : colors.border,
              }}
            >
              <View style={{
                backgroundColor: config.biometricCamera === camera.deviceId 
                  ? colors.primary.green 
                  : colors.text.secondary,
                borderRadius: borderRadius.full,
                padding: spacing.sm,
                marginRight: spacing.md,
              }}>
                <Ionicons 
                  name="finger-print" 
                  size={20} 
                  color={colors.white} 
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}>
                  {camera.label}
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}>
                  ID: {camera.deviceId.slice(0, 12)}...
                </Text>
              </View>

              {config.biometricCamera === camera.deviceId && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.primary.green} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={saveSettings}
          disabled={saving}
          style={{
            opacity: saving ? 0.6 : 1,
          }}
        >
          <LinearGradient
            colors={colors.gradients.purple}
            style={{
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={colors.white} />
                <Text style={{
                  color: colors.white,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  marginLeft: spacing.sm,
                }}>
                  Guardar Configuración
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;