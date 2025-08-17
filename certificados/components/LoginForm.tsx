import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthAPI, LoginCredentials } from '@/hooks/useAuthAPI';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuthAPI();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!credentials.username.trim()) {
      errors.username = 'El usuario es requerido';
    }

    if (!credentials.password.trim()) {
      errors.password = 'La contraseña es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      console.log('🚀 Iniciando proceso de login...');
      await login(credentials);
      Alert.alert('Éxito', 'Inicio de sesión exitoso');
      onLoginSuccess?.();
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Error desconocido al iniciar sesión';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'Error de conexión. Verificar configuración del servidor.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Error de red. Verificar conexión a internet.';
        } else if (error.message.includes('Invalid user')) {
          errorMessage = 'Usuario o contraseña incorrectos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error de autenticación', errorMessage);
    }
  };

  const updateCredentials = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Text style={styles.subtitle}>Sistema de Certificados</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={[styles.input, formErrors.username && styles.inputError]}
            value={credentials.username}
            onChangeText={(value) => updateCredentials('username', value)}
            placeholder="Ingrese su usuario o RUT"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          {formErrors.username && (
            <Text style={styles.errorText}>{formErrors.username}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, formErrors.password && styles.inputError]}
            value={credentials.password}
            onChangeText={(value) => updateCredentials('password', value)}
            placeholder="Ingrese su contraseña"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          {formErrors.password && (
            <Text style={styles.errorText}>{formErrors.password}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Use su usuario del sistema Gate o su RUT para acceder
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});