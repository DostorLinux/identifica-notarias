import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, borderRadius, shadows } from './styles/theme';
import { useAuth } from './context/AuthContext';
import { 
  getSettings, 
  reloadSettingsFromFile, 
  clearAllData,
  resetToFileDefaults,
  forceLoadFromFile
} from './utils/storage';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Referencias para navegación entre campos
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const { login, isLoading, isAuthenticated } = useAuth();

  // Obtener el año actual
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    console.log('🔐 LoginScreen: Estado de autenticación:', isAuthenticated);
    // La navegación será manejada automáticamente por AppNavigator
  }, [isAuthenticated]);

  const loadDebugInfo = async () => {
    try {
      console.log('🔍 LoginScreen Debug: Cargando información...');
      const settings = await getSettings();
      const fileSettings = await forceLoadFromFile();
      
      setDebugInfo({
        asyncStorageSettings: settings,
        fileSettings: fileSettings,
        hasSubdomain: !!settings?.subdomain,
        subdomain: settings?.subdomain,
        username: settings?.username,
        hasPassword: !!settings?.password,
        hasApiKey: !!settings?.apiKey,
        fileSubdomain: fileSettings?.subdomain,
        fileUsername: fileSettings?.username,
        fileHasApiKey: !!fileSettings?.apiKey,
      });
      
      console.log('🔍 LoginScreen Debug: Comparación:', {
        'AsyncStorage subdomain': settings?.subdomain,
        'File subdomain': fileSettings?.subdomain,
        'AsyncStorage username': settings?.username,
        'File username': fileSettings?.username,
      });
    } catch (error) {
      console.error('❌ LoginScreen Debug: Error:', error);
      Alert.alert('Error Debug', error.message);
    }
  };

  const reloadSettings = async () => {
    try {
      console.log('🔄 LoginScreen: Recargando settings...');
      const newSettings = await reloadSettingsFromFile();
      if (newSettings?.subdomain) {
        Alert.alert('Éxito', `Settings recargados correctamente!\nSubdomain: ${newSettings.subdomain}\nUsername: ${newSettings.username}`);
        await loadDebugInfo();
      } else {
        Alert.alert('Error', 'No se pudieron cargar los settings del archivo');
      }
    } catch (error) {
      console.error('❌ LoginScreen: Error recargando:', error);
      Alert.alert('Error', error.message);
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Completo',
      '¿Resetear COMPLETAMENTE a configuración de archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'RESET',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔥 RESET: Iniciando reset completo...');
              const newSettings = await resetToFileDefaults();
              Alert.alert(
                'Reset Completo', 
                `✅ Settings reseteados exitosamente!\n\nSubdomain: ${newSettings.subdomain}\nUsername: ${newSettings.username}\nAPI Key: ${newSettings.apiKey ? 'OK' : 'MISSING'}`
              );
              await loadDebugInfo();
            } catch (error) {
              console.error('❌ RESET ERROR:', error);
              Alert.alert('Error Reset', error.message);
            }
          }
        }
      ]
    );
  };

  const clearData = async () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Limpiar todos los datos almacenados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Datos Limpiados', 'Los settings se recargarán automáticamente');
            await loadDebugInfo();
          }
        }
      ]
    );
  };

  const handleLogin = async () => {
    console.log('🔐 LoginScreen: Intentando login con usuario:', username);
    
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu usuario y contraseña');
      return;
    }

    setErrorMessage('');

    try {
      const result = await login(username, password);
      
      if (result.success) {
        console.log('✅ LoginScreen: Login exitoso, la navegación será automática');
        // La navegación será manejada automáticamente por el contexto y AppNavigator
      } else {
        console.log('❌ LoginScreen: Login falló:', result.error);
        setErrorMessage(result.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('❌ LoginScreen: Error inesperado:', error);
      setErrorMessage('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
      
      {/* Debug Button in top corner */}
      <TouchableOpacity
        onPress={() => setShowDebug(!showDebug)}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: colors.primary.purple,
          borderRadius: borderRadius.full,
          padding: spacing.sm,
          zIndex: 1000,
        }}
      >
        <Ionicons name="bug" size={20} color={colors.white} />
      </TouchableOpacity>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          {showDebug && (
            <Animatable.View
              animation="slideInDown"
              style={{
                backgroundColor: colors.white,
                margin: spacing.lg,
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                ...shadows.lg,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.primary.purple,
                marginBottom: spacing.md,
                textAlign: 'center',
              }}>
                🔍 Debug Panel
              </Text>

              <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                <TouchableOpacity
                  onPress={loadDebugInfo}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary.purple,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginRight: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, textAlign: 'center' }}>
                    📊 Info
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={reloadSettings}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary.green,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginHorizontal: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, textAlign: 'center' }}>
                    🔄 Reload
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resetToDefaults}
                  style={{
                    flex: 1,
                    backgroundColor: colors.extended.blue,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginHorizontal: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, textAlign: 'center' }}>
                    🔥 RESET
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={clearData}
                  style={{
                    flex: 1,
                    backgroundColor: colors.error,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginLeft: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 12, textAlign: 'center' }}>
                    🗑️ Clear
                  </Text>
                </TouchableOpacity>
              </View>

              {debugInfo && (
                <View>
                  {/* AsyncStorage Info */}
                  <View style={{
                    backgroundColor: debugInfo.hasSubdomain ? colors.success + '20' : colors.error + '20',
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    borderLeftWidth: 3,
                    borderLeftColor: debugInfo.hasSubdomain ? colors.success : colors.error,
                    marginBottom: spacing.xs,
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: debugInfo.hasSubdomain ? colors.success : colors.error,
                    }}>
                      {debugInfo.hasSubdomain ? '✅ ASYNCSTORAGE OK' : '❌ ASYNCSTORAGE FAIL'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      Subdomain: {debugInfo.subdomain || 'UNDEFINED'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      Username: {debugInfo.username || 'UNDEFINED'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      API Key: {debugInfo.hasApiKey ? 'OK' : 'MISSING'}
                    </Text>
                  </View>

                  {/* File Info */}
                  <View style={{
                    backgroundColor: debugInfo.fileSubdomain ? colors.success + '20' : colors.error + '20',
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    borderLeftWidth: 3,
                    borderLeftColor: debugInfo.fileSubdomain ? colors.success : colors.error,
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: debugInfo.fileSubdomain ? colors.success : colors.error,
                    }}>
                      {debugInfo.fileSubdomain ? '✅ FILE OK' : '❌ FILE FAIL'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      Subdomain: {debugInfo.fileSubdomain || 'UNDEFINED'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      Username: {debugInfo.fileUsername || 'UNDEFINED'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                      API Key: {debugInfo.fileHasApiKey ? 'OK' : 'MISSING'}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={{
                fontSize: 10,
                color: colors.text.disabled,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}>
                📊=Info | 🔄=Reload | 🔥=RESET Total | 🗑️=Clear
              </Text>
            </Animatable.View>
          )}

          <View style={{ 
            flex: 1, 
            justifyContent: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}>
            {/* Logo Container */}
            <Animatable.View
              animation="fadeIn"
              duration={1000}
              style={{
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../assets/images/logo.png')}
                style={{
                  width: 260,
                  height: 130,
                  resizeMode: 'contain',
                }}
              />
            </Animatable.View>

            {/* Form Container */}
            <Animatable.View
              animation="fadeInUp"
              delay={700}
              style={{
                backgroundColor: colors.white,
                maxWidth: 400,
                alignSelf: 'center',
                borderRadius: borderRadius.xl * 2,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.xl,
                ...shadows.lg,
                width: '100%',
                marginTop: spacing.sm,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: spacing.sm,
              }}>
                CONSOLA DE ADMINISTRACIÓN
              </Text>

              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
                marginBottom: spacing.lg,
              }}>
                Reconocimiento Biométrico Facial Online
              </Text>

              {/* Username Input */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  NOMBRE DE USUARIO
                </Text>
                <TextInput
                  ref={usernameInputRef}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={colors.text.disabled}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  style={{
                    width: '100%',
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    borderWidth: 1,
                    borderColor: errorMessage ? colors.error : colors.background.light,
                    opacity: isLoading ? 0.6 : 1,
                  }}
                />
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  CONTRASEÑA
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    ref={passwordInputRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor={colors.text.disabled}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    style={{
                      width: '100%',
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      paddingRight: spacing['2xl'],
                      fontSize: typography.fontSize.base,
                      color: colors.text.primary,
                      borderWidth: 1,
                      borderColor: errorMessage ? colors.error : colors.background.light,
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    disabled={isLoading}
                    style={{
                      position: 'absolute',
                      right: spacing.md,
                      top: '50%',
                      transform: [{ translateY: -12 }],
                    }}
                  >
                    <Ionicons
                      name={secureTextEntry ? 'eye-off' : 'eye'}
                      size={24}
                      color={isLoading ? colors.text.disabled : colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {errorMessage ? (
                <Animatable.Text
                  animation="shake"
                  style={{
                    color: colors.error,
                    fontSize: typography.fontSize.sm,
                    textAlign: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  {errorMessage}
                </Animatable.Text>
              ) : null}

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ hovered }) => [
                  {
                    width: '100%',
                    borderRadius: borderRadius.full,
                    opacity: isLoading ? 0.6 : 1,
                    marginBottom: spacing.lg,
                  },
                  hovered && !isLoading && {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    isLoading
                      ? [colors.text.disabled, colors.text.disabled]
                      : [colors.primary.purple, colors.primary.green]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: '100%',
                    borderRadius: borderRadius.full,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={{
                      color: colors.white,
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      letterSpacing: 1,
                    }}>
                      ACCEDER
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Footer */}
              <View style={{
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: spacing.xs,
                }}>
                  identifica.ai
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.disabled,
                  marginBottom: spacing.xs,
                }}>
                  v2.0.0
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.disabled,
                  textAlign: 'center',
                }}>
                  {currentYear} New Stack all rights reserved.
                </Text>
              </View>
            </Animatable.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
