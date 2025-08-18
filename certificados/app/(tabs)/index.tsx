import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const BiometriaScreen = () => {
  const { isAuthenticated, currentUser, logout, isLoading } = useAuth();
  const router = useRouter();
  
  const [cameraConfig, setCameraConfig] = useState({
    qrCamera: '',
    biometricCamera: '',
  });
  
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManualRUT, setShowManualRUT] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [failureResult, setFailureResult] = useState(null);
  const [manualRUT, setManualRUT] = useState('');
  const [scannedRUT, setScannedRUT] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  
  const cameraRef = useRef(null);
  const qrCameraRef = useRef(null);

  useEffect(() => {
    loadCameraConfig();
    loadApiConfig();
    // No solicitar permisos automáticamente, solo cuando sea necesario
  }, []);

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('🎥 Solicitando permisos de cámara...');
      console.log('🎥 Estado actual:', cameraPermission);
      
      if (!cameraPermission?.granted) {
        console.log('🎥 Permisos no otorgados, solicitando...');
        const permission = await requestCameraPermission();
        console.log('🎥 Resultado de solicitud:', permission);
        
        if (!permission?.granted && permission?.canAskAgain === false) {
          // El usuario denegó permanentemente los permisos
          Alert.alert(
            'Permisos Denegados',
            'Los permisos de cámara fueron denegados permanentemente. Para usar esta función, debes habilitarlos manualmente en la configuración de la aplicación.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir Configuración', onPress: openAppSettings }
            ]
          );
          return false;
        }
        
        return permission?.granted;
      } else {
        console.log('🎥 Permisos ya otorgados');
        return true;
      }
    } catch (error) {
      console.error('🎥 Error solicitando permisos:', error);
      Alert.alert(
        'Error de Permisos',
        'No se pudieron solicitar los permisos de cámara. Por favor, ve a configuración y habilita manualmente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: openAppSettings }
        ]
      );
      return false;
    }
  };

  const loadApiConfig = async () => {
    try {
      // En React Native, usar require para archivos locales
      const configModule = require('../../config/api.json');
      setApiBaseUrl(configModule?.gate?.baseUrl || 'https://access-control-test.identifica.ai');
    } catch (error) {
      console.error('Error loading API config:', error);
      // Fallback to default
      setApiBaseUrl('https://access-control-test.identifica.ai');
    }
  };

  const loadCameraConfig = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setCameraConfig({
          qrCamera: settings.qrCamera || '',
          biometricCamera: settings.biometricCamera || '',
        });
      }
    } catch (error) {
      console.error('Error loading camera config:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleBiometricProcess = async () => {
    console.log('🎥 handleBiometricProcess called');
    
    // Verificar y solicitar permisos de cámara antes de mostrar opciones
    if (!cameraPermission?.granted) {
      console.log('🎥 Permisos no otorgados, solicitando primero...');
      
      const granted = await requestPermissions();
      
      if (!granted) {
        console.log('🎥 Permisos denegados');
        Alert.alert(
          'Permisos Requeridos',
          'La aplicación necesita acceso a la cámara para realizar verificaciones biométricas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: openAppSettings }
          ]
        );
        return;
      }
    }
    
    console.log('🎥 Permisos OK, mostrando modal de opciones');
    setShowOptionsModal(true);
  };

  const handleQRCodeScanned = ({ data }) => {
    setScannedRUT(data);
    setShowQRScanner(false);
    proceedWithBiometric(data);
  };

  const handleManualRUTSubmit = () => {
    if (!manualRUT.trim()) {
      Alert.alert('Error', 'Debe ingresar un RUT válido');
      return;
    }
    setShowManualRUT(false);
    proceedWithBiometric(manualRUT.trim());
  };

  const proceedWithBiometric = async (rut) => {
    console.log('🎥 proceedWithBiometric called for RUT:', rut);
    
    // Verificar permisos de cámara antes de proceder
    if (!cameraPermission?.granted) {
      console.log('🎥 Permisos no otorgados en proceedWithBiometric, solicitando...');
      
      const granted = await requestPermissions();
      
      if (!granted) {
        console.log('🎥 Permisos denegados en proceedWithBiometric');
        Alert.alert(
          'Permisos requeridos',
          'Se requiere acceso a la cámara para tomar la foto biométrica.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: openAppSettings }
          ]
        );
        return;
      }
    }
    
    console.log('🎥 Permisos OK, abriendo cámara para RUT:', rut);
    setScannedRUT(rut);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsProcessing(true);
      try {
        console.log('Taking picture...');
        
        // Tomar foto con calidad reducida para cumplir requisitos de tamaño
        let photo = await cameraRef.current.takePictureAsync({
          quality: 0.3, // Calidad baja para reducir tamaño
          base64: true,
          imageType: 'jpg', // Forzar formato JPG
        });
        
        console.log('Photo taken:', {
          uri: photo.uri,
          hasBase64: !!photo.base64,
          base64Length: photo.base64?.length || 0,
          estimatedKB: photo.base64 ? Math.round((photo.base64.length * 0.75) / 1024) : 0
        });
        
        if (!photo.base64) {
          throw new Error('No se pudo obtener la imagen en base64');
        }
        
        // Verificar tamaño (base64 * 0.75 para obtener tamaño aproximado en bytes)
        const estimatedBytes = photo.base64.length * 0.75;
        const estimatedKB = estimatedBytes / 1024;
        
        console.log(`Tamaño estimado: ${Math.round(estimatedKB)} KB`);
        
        // Si la imagen es muy grande, reducir más la calidad
        if (estimatedKB > 100) {
          console.log('Imagen muy grande, reduciendo calidad...');
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.1, // Calidad muy baja
            base64: true,
            imageType: 'jpg',
          });
          
          const newEstimatedBytes = photo.base64.length * 0.75;
          const newEstimatedKB = newEstimatedBytes / 1024;
          console.log(`Nuevo tamaño estimado: ${Math.round(newEstimatedKB)} KB`);
        }
        
        await submitBiometricData(photo.base64, scannedRUT);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'No se pudo tomar la foto: ' + error.message);
      } finally {
        setIsProcessing(false);
        setShowCamera(false);
      }
    } else {
      Alert.alert('Error', 'Referencia de cámara no disponible');
    }
  };

  const submitBiometricData = async (imageBase64, rut) => {
    try {
      // Usar URL base predeterminada o configurada
      let baseUrl = 'https://access-control-test.identifica.ai';
      let postEventEndpoint = '/detect/services/postEvent.php';

      // Intentar cargar configuración
      try {
        // En React Native necesitamos importar la configuración de forma diferente
        const configModule = require('../../config/api.json');
        if (configModule?.gate?.baseUrl) {
          baseUrl = configModule.gate.baseUrl;
          postEventEndpoint = configModule.gate.endpoints?.postEvent || postEventEndpoint;
        }
      } catch (configError) {
        console.log('Using default config:', configError.message);
      }

      const postEventUrl = `${baseUrl}${postEventEndpoint}`;
      
      const estimatedBytes = imageBase64.length * 0.75;
      const estimatedKB = estimatedBytes / 1024;
      
      const operatorRut = currentUser?.doc_id || currentUser?.rut || currentUser?.username || 'admin-default';
      
      console.log('Sending request to:', postEventUrl);
      console.log('Image Base64 length:', imageBase64?.length || 0);
      console.log('Estimated image size:', Math.round(estimatedKB), 'KB');
      console.log('RUT:', rut);
      console.log('👤 Operator RUT (from currentUser):', operatorRut);
      console.log('👤 CurrentUser data:', JSON.stringify(currentUser, null, 2));
      
      if (!imageBase64 || imageBase64.length === 0) {
        throw new Error('Imagen vacía o no válida');
      }
      
      if (estimatedKB > 100) {
        console.warn('ADVERTENCIA: La imagen puede ser muy grande:', Math.round(estimatedKB), 'KB');
      }
      
      const response = await fetch(postEventUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 segundos
        body: new URLSearchParams({
          image: `data:image/jpeg;base64,${imageBase64}`,
          type: 'enter',
          deviceId: '1',
          rut: rut,
          probe: 'false',
          operatorRut: operatorRut
        }).toString(),
      });

      const result = await response.json();
      console.log('Server response:', result);
      
      // Verificar si la respuesta contiene un error, independientemente del HTTP status
      if (response.ok && !result.error) {
        // Crear registro biométrico para guardar localmente
        const biometricRecord = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          firstName: result.first_name,
          lastName: result.last_name,
          rut: rut,
          timestamp: new Date().toISOString(),
          eventId: result.event_id || result.time,
          source: 'local'
        };
        
        // Guardar registro localmente
        await saveBiometricRecordLocal(biometricRecord);
        
        // Guardar resultado para mostrar en modal
        setVerificationResult({
          firstName: result.first_name,
          lastName: result.last_name,
          rut: rut,
          type: result.type,
          time: result.time
        });
        setShowSuccessModal(true);
      } else {
        console.error('Server response:', result);
        
        // Determinar el tipo de error
        let errorMessage = 'No se pudo verificar la identidad.';
        let errorDetail = '';
        
        if (result.error) {
          switch (result.error) {
            case 'CANNOT_IDENTIFY':
              errorMessage = 'Identidad no reconocida.';
              errorDetail = 'El rostro capturado no coincide con ningún registro o el RUT no está registrado en el sistema.';
              break;
            case 'INVALID_BASE64_IMAGE':
              errorMessage = 'Imagen inválida.';
              errorDetail = 'La imagen capturada no es válida. Intenta tomar la foto nuevamente.';
              break;
            case 'EMPTY_IMAGE':
              errorMessage = 'Imagen vacía.';
              errorDetail = 'No se pudo capturar la imagen. Verifica la cámara e intenta nuevamente.';
              break;
            default:
              errorMessage = 'Error de verificación.';
              errorDetail = `Código: ${result.error}`;
          }
        }
        
        // Guardar intento fallido localmente para que aparezca en el dashboard
        try {
          const failedBiometricRecord = {
            id: `local-failed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            firstName: '', // No hay datos de usuario en fallos
            lastName: '',
            fullName: 'Usuario no identificado',
            rut: rut,
            timestamp: new Date().toISOString(),
            eventId: `failed-${Date.now()}`,
            auditNumber: `FAIL-${Date.now().toString().slice(-6)}`,
            verificationResult: 'FAILED',
            isSuccess: false,
            errorCode: result.error || 'UNKNOWN_ERROR',
            source: 'local_failed'
          };
          
          await saveBiometricRecordLocal(failedBiometricRecord);
          console.log('Intento fallido guardado localmente:', failedBiometricRecord);
        } catch (saveError) {
          console.error('Error guardando intento fallido:', saveError);
        }
        
        // Guardar resultado del fallo para mostrar en modal
        setFailureResult({
          rut: rut,
          errorCode: result.error || 'UNKNOWN_ERROR',
          errorMessage: errorMessage,
          errorDetail: errorDetail,
          httpStatus: response.status
        });
        setShowFailureModal(true);
      }
    } catch (error) {
      console.error('Error submitting biometric data:', error);
      
      // Guardar error de conexión localmente
      try {
        const connectionErrorRecord = {
          id: `local-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          firstName: '',
          lastName: '',
          fullName: 'Error de conexión',
          rut: rut,
          timestamp: new Date().toISOString(),
          eventId: `error-${Date.now()}`,
          auditNumber: `ERR-${Date.now().toString().slice(-6)}`,
          verificationResult: 'ERROR',
          isSuccess: false,
          errorCode: 'CONNECTION_ERROR',
          source: 'local_error'
        };
        
        await saveBiometricRecordLocal(connectionErrorRecord);
        console.log('Error de conexión guardado localmente:', connectionErrorRecord);
      } catch (saveError) {
        console.error('Error guardando error de conexión:', saveError);
      }
      
      // Guardar resultado del error de conexión para mostrar en modal
      setFailureResult({
        rut: rut,
        errorCode: 'CONNECTION_ERROR',
        errorMessage: 'Error de Conexión',
        errorDetail: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        httpStatus: 'N/A',
        connectionError: error.message
      });
      setShowFailureModal(true);
    }
  };

  const saveBiometricRecordLocal = async (record) => {
    try {
      // Obtener registros existentes
      const existingRecordsStr = await AsyncStorage.getItem('biometric_records');
      const existingRecords = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      
      // Añadir nuevo registro
      const updatedRecords = [record, ...existingRecords];
      
      // Guardar de vuelta
      await AsyncStorage.setItem('biometric_records', JSON.stringify(updatedRecords));
      
      console.log('✅ Registro biométrico guardado localmente:', record);
    } catch (error) {
      console.error('❌ Error guardando registro biométrico:', error);
    }
  };

  const ActionCard = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    onPress, 
    configured = true 
  }) => (
    <Animatable.View animation="fadeInUp" style={{ marginBottom: spacing.md }}>
      <TouchableOpacity
        onPress={() => {
          console.log('ActionCard pressed:', title);
          onPress && onPress();
        }}
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          ...shadows.md,
          opacity: configured ? 1 : 0.7,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: color + '20',
            borderRadius: borderRadius.full,
            padding: spacing.lg,
            marginRight: spacing.lg,
          }}>
            <Ionicons name={icon} size={32} color={color} />
          </View>
          
          <View style={{ flex: 1 }}>
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
            }}>
              {subtitle}
            </Text>
            
            {!configured && (
              <View style={{
                backgroundColor: colors.warning + '20',
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginTop: spacing.xs,
                alignSelf: 'flex-start',
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.warning,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Configuración requerida
                </Text>
              </View>
            )}
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={colors.text.secondary} 
          />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  // No hay verificación de autenticación - la app siempre muestra las pestañas

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
              Biometría
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.white,
              opacity: 0.9,
            }}>
              Bienvenido, {currentUser?.username || 'Usuario'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Configurar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleLogout}
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
          </View>
        </View>
      </LinearGradient>

      {/* Welcome Section */}
      <View style={{
        paddingHorizontal: spacing.lg,
        marginTop: -spacing.md,
        marginBottom: spacing.lg,
      }}>
        <Animatable.View 
          animation="fadeIn"
          style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            ...shadows.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: colors.primary.green + '20',
              borderRadius: borderRadius.full,
              padding: spacing.md,
              marginRight: spacing.md,
            }}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary.green} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}>
                Verificación de Identidad
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}>
                Verifica tu identidad mediante código QR y captura biométrica
              </Text>
            </View>
          </View>
        </Animatable.View>
      </View>

      {/* Actions */}
      <View style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
      }}>
        <Text style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing.lg,
        }}>
          Opciones Biométricas
        </Text>

        <ActionCard
          title="Verificación Biométrica"
          subtitle="Escanea QR o ingresa RUT manualmente, luego toma foto para verificación"
          icon="scan-outline"
          color={colors.primary.green}
          onPress={handleBiometricProcess}
          configured={true}
        />

        {!cameraPermission?.granted && (
          <Animatable.View 
            animation="fadeIn"
            style={{
              backgroundColor: colors.warning + '10',
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginTop: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="warning" size={24} color={colors.warning} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.warning,
                marginBottom: spacing.xs,
              }}>
                Permisos requeridos
              </Text>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
              }}>
                Se requiere acceso a la cámara para funcionar
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                console.log('🎥 Botón permitir presionado');
                await requestPermissions();
              }}
              style={{
                backgroundColor: colors.warning,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
              }}>
                Permitir
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </View>
      
      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            margin: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 10,
              color: colors.text.primary,
            }}>
              Verificación Biométrica
            </Text>
            
            <Text style={{
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 30,
              color: colors.text.secondary,
            }}>
              Selecciona cómo obtener el RUT:
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                console.log('QR Scanner selected');
                setShowOptionsModal(false);
                setShowQRScanner(true);
              }}
              style={{
                backgroundColor: colors.primary.purple,
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="qr-code-outline" size={24} color="white" style={{ marginRight: 10 }} />
              <Text style={{
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
                Escanear QR
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                console.log('Manual RUT selected');
                setShowOptionsModal(false);
                setShowManualRUT(true);
              }}
              style={{
                backgroundColor: colors.primary.green,
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="create-outline" size={24} color="white" style={{ marginRight: 10 }} />
              <Text style={{
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
                Ingresar manualmente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
              style={{
                backgroundColor: colors.border,
                borderRadius: 10,
                padding: 15,
              }}
            >
              <Text style={{
                textAlign: 'center',
                color: colors.text.secondary,
                fontWeight: 'bold',
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1 }}>
            <View style={{
              position: 'absolute',
              top: 50,
              left: 20,
              right: 20,
              zIndex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={() => setShowQRScanner(false)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 20,
                  padding: 10,
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 15,
              }}>
                Escanear Código QR
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowQRScanner(false);
                  setShowManualRUT(true);
                }}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 15,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Manual</Text>
              </TouchableOpacity>
            </View>
            
            {cameraPermission?.granted && (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr']
                }}
                onBarcodeScanned={handleQRCodeScanned}
              />
            )}
            
            {!cameraPermission?.granted && (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black',
              }}>
                <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>
                  Se requiere acceso a la cámara para escanear códigos QR
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    console.log('🎥 Botón permitir acceso QR presionado');
                    await requestPermissions();
                  }}
                  style={{
                    backgroundColor: colors.primary.green,
                    borderRadius: 10,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    Permitir acceso
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Manual RUT Input Modal */}
      <Modal
        visible={showManualRUT}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualRUT(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 30,
            margin: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 20,
              color: colors.text.primary,
            }}>
              Ingresar RUT
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 15,
                fontSize: 16,
                marginBottom: 20,
                textAlign: 'center',
              }}
              placeholder="Ej: 12345678-9"
              value={manualRUT}
              onChangeText={setManualRUT}
              autoFocus={true}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowManualRUT(false);
                  setManualRUT('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.border,
                  borderRadius: 10,
                  padding: 15,
                  marginRight: 10,
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: colors.text.secondary,
                  fontWeight: 'bold',
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleManualRUTSubmit}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary.green,
                  borderRadius: 10,
                  padding: 15,
                  marginLeft: 10,
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                  Continuar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1 }}>
            <View style={{
              position: 'absolute',
              top: 50,
              left: 20,
              right: 20,
              zIndex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={() => setShowCamera(false)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 20,
                  padding: 10,
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 15,
                textAlign: 'center',
              }}>
                RUT: {scannedRUT}\nTomar Foto Biométrica
              </Text>
              <View style={{ width: 44 }} />
            </View>
            
            {cameraPermission?.granted && (
              <CameraView
                style={{ flex: 1 }}
                facing="front"
                ref={cameraRef}
              />
            )}
            
            <View style={{
              position: 'absolute',
              bottom: 50,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={takePicture}
                disabled={isProcessing}
                style={{
                  backgroundColor: isProcessing ? 'rgba(255,255,255,0.3)' : 'white',
                  borderRadius: 50,
                  padding: 20,
                  width: 80,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.primary.green} />
                ) : (
                  <Ionicons name="camera" size={32} color={colors.primary.green} />
                )}
              </TouchableOpacity>
            </View>
            
            {!cameraPermission?.granted && (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black',
              }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  Se requiere acceso a la cámara para tomar fotos
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 40,
            margin: 20,
            width: '90%',
            maxWidth: 400,
            alignItems: 'center',
          }}>
            {/* Ícono de éxito */}
            <View style={{
              backgroundColor: colors.primary.green + '20',
              borderRadius: 50,
              padding: 20,
              marginBottom: 20,
            }}>
              <Ionicons name="checkmark-circle" size={60} color={colors.primary.green} />
            </View>
            
            {/* Título */}
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 10,
              color: colors.primary.green,
            }}>
              Biometría Correcta
            </Text>
            
            {/* Nombre y apellido */}
            {verificationResult && (
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 30,
                color: colors.text.primary,
                lineHeight: 28,
              }}>
                {verificationResult.firstName} {verificationResult.lastName}
              </Text>
            )}
            
            {/* Botón de confirmación */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                // Limpiar estados para el siguiente uso
                setScannedRUT('');
                setManualRUT('');
                setVerificationResult(null);
              }}
              style={{
                backgroundColor: colors.primary.green,
                borderRadius: 15,
                paddingHorizontal: 40,
                paddingVertical: 15,
                minWidth: 150,
              }}
            >
              <Text style={{
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
                Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Failure Modal */}
      <Modal
        visible={showFailureModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFailureModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 40,
            margin: 20,
            width: '90%',
            maxWidth: 400,
            alignItems: 'center',
          }}>
            {/* Ícono de error */}
            <View style={{
              backgroundColor: '#dc3545' + '20',
              borderRadius: 50,
              padding: 20,
              marginBottom: 20,
            }}>
              <Ionicons name="close-circle" size={60} color="#dc3545" />
            </View>
            
            {/* Título */}
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 10,
              color: '#dc3545',
            }}>
              Biometría Fallida
            </Text>
            
            {/* Mensaje de error */}
            {failureResult && (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: 15,
                  color: colors.text.primary,
                }}>
                  {failureResult.errorMessage}
                </Text>
                
                <Text style={{
                  fontSize: 14,
                  textAlign: 'center',
                  marginBottom: 20,
                  color: colors.text.secondary,
                  lineHeight: 20,
                }}>
                  {failureResult.errorDetail}
                </Text>
                
                {/* Información técnica */}
                <View style={{
                  backgroundColor: colors.background.light,
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 25,
                  width: '100%',
                }}>
                  <Text style={{
                    fontSize: 12,
                    color: colors.text.secondary,
                    textAlign: 'center',
                  }}>
                    RUT: {failureResult.rut}{'\n'}
                    Código: {failureResult.errorCode}{'\n'}
                    {failureResult.connectionError ? `Error: ${failureResult.connectionError}` : `Estado HTTP: ${failureResult.httpStatus}`}
                  </Text>
                </View>
              </>
            )}
            
            {/* Botones */}
            <View style={{
              flexDirection: 'row',
              gap: 15,
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowFailureModal(false);
                  setShowOptionsModal(true);
                }}
                style={{
                  backgroundColor: colors.primary.purple,
                  borderRadius: 15,
                  paddingHorizontal: 30,
                  paddingVertical: 15,
                  flex: 1,
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                  Reintentar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setShowFailureModal(false);
                  // Limpiar estados para el siguiente uso
                  setScannedRUT('');
                  setManualRUT('');
                  setFailureResult(null);
                }}
                style={{
                  backgroundColor: colors.text.secondary,
                  borderRadius: 15,
                  paddingHorizontal: 30,
                  paddingVertical: 15,
                  flex: 1,
                }}
              >
                <Text style={{
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BiometriaScreen;