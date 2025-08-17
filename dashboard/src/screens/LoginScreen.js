import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';
import { saveUserData } from '../utils/storage';
import { Logo } from '../components/Logo';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Initialize API on component mount
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await api.initialize();
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert(
        'Error de configuración',
        'No se pudo cargar la configuración de la aplicación. Por favor, verifica tu conexión.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await api.login(username, password);
      
      if (result.success) {
        // Save user data
        await saveUserData(result.user);
        
        // Navigate to main screen
        // navigation.navigate('Main');
        Alert.alert('Éxito', 'Inicio de sesión exitoso', [{ text: 'OK' }]);
      } else {
        setErrorMessage(result.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.light} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[colors.primary.purple, colors.primary.purpleDark]}
            style={{
              flex: 1,
              minHeight: '100%',
            }}
          >
            {/* Logo Container */}
            <View style={{
              alignItems: 'center',
              marginTop: spacing['3xl'],
              marginBottom: spacing.xl,
            }}>
              <Animatable.View animation="fadeIn" duration={1000}>
                <View style={{
                  width: 120,
                  height: 120,
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...shadows.lg,
                }}>
                  <Logo width={80} height={80} />
                </View>
              </Animatable.View>
              
              <Animatable.Text
                animation="fadeIn"
                delay={500}
                style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.black,
                  color: colors.white,
                  marginTop: spacing.lg,
                }}
              >
                identifica.ai
              </Animatable.Text>
            </View>

            {/* Form Container */}
            <Animatable.View
              animation="fadeInUp"
              delay={700}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderTopLeftRadius: borderRadius.xl * 2,
                borderTopRightRadius: borderRadius.xl * 2,
                paddingHorizontal: spacing.xl,
                paddingTop: spacing['2xl'],
                ...shadows.lg,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: spacing.xl,
              }}>
                INGRESO A CONSOLA DE ADMINISTRACIÓN
              </Text>

              {/* Username Input */}
              <View style={{ marginBottom: spacing.lg }}>
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
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor={colors.text.disabled}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    borderWidth: 1,
                    borderColor: errorMessage ? colors.error : colors.background.light,
                  }}
                />
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: spacing.lg }}>
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
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor={colors.text.disabled}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      paddingRight: spacing['2xl'],
                      fontSize: typography.fontSize.base,
                      color: colors.text.primary,
                      borderWidth: 1,
                      borderColor: errorMessage ? colors.error : colors.background.light,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                    style={{
                      position: 'absolute',
                      right: spacing.md,
                      top: '50%',
                      transform: [{ translateY: -12 }],
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {secureTextEntry ? '👁️' : '👁️‍🗨️'}
                    </Text>
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
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading 
                    ? [colors.text.disabled, colors.text.disabled] 
                    : [colors.primary.purple, colors.primary.green]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: borderRadius.full,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                    ...shadows.md,
                  }}
                >
                  {loading ? (
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
              </TouchableOpacity>

              {/* Footer */}
              <View style={{
                flex: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: spacing.xl,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  textAlign: 'center',
                }}>
                  Reconocimiento Biométrico Facial Online
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.disabled,
                  marginTop: spacing.xs,
                }}>
                  v2.0.0
                </Text>
              </View>
            </Animatable.View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
