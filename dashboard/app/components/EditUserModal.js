import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';
import FormField from './common/FormField';

// Imports seguros basados en el código que funciona
let ImagePicker = null;
let ImageManipulator = null;
let CameraView = null;
let useCameraPermissions = null;

// Cargar dependencias
try {
  ImagePicker = require('expo-image-picker');
  console.log('✅ expo-image-picker cargado');
} catch (error) {
  console.log('❌ expo-image-picker no disponible:', error.message);
}

try {
  ImageManipulator = require('expo-image-manipulator');
  console.log('✅ expo-image-manipulator cargado');
} catch (error) {
  console.log('❌ expo-image-manipulator no disponible:', error.message);
}

try {
  const CameraModule = require('expo-camera');
  CameraView = CameraModule.CameraView;
  useCameraPermissions = CameraModule.useCameraPermissions;
  console.log('✅ expo-camera cargado - CameraView:', !!CameraView, 'useCameraPermissions:', !!useCameraPermissions);
} catch (error) {
  console.log('❌ expo-camera no disponible:', error.message);
}

const EditUserModal = ({ visible, onClose, onUserUpdated, user }) => {
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    doc_id: '',
    sec_id: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    picture: null,
    role: '',
    user_type: '',
    pin: '',
    nationality: '',
    groups: '',
    placeIds: '',
    devicesIds: '',
    hasExpiration: false,
    expirationDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions ? useCameraPermissions() : [null, null];
  const cameraRef = useRef(null);
  const [webCameraActive, setWebCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  // Estados para selector de dispositivos
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  
  // Estados para selector de grupos
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Estados para selector de fecha
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Cargar datos del usuario cuando cambie
  useEffect(() => {
    if (user && visible) {
      setFormData({
        doc_id: user.doc_id || '',
        sec_id: user.sec_id || '',
        username: user.username || '',
        password: '', // No prellenamos la contraseña por seguridad
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        picture: null, // Solo enviamos si hay una nueva imagen
        role: user.role || '',
        user_type: user.user_type || '',
        pin: '', // No prellenamos el PIN por seguridad
        nationality: user.nationality || '',
        groups: user.groups || '',
        placeIds: user.placeIds || '',
        devicesIds: user.devicesIds || '',
        hasExpiration: user.has_expiration === 1 || user.has_expiration === '1',
        expirationDate: user.expiration_date || '',
      });
      
      // Cargar imagen existente
      loadExistingImage();
    }
  }, [user, visible]);

  const loadExistingImage = async () => {
    if (user?.id && user?.pub_id) {
      try {
        const result = await api.getUserPicture(user.id, user.pub_id);
        if (result.success) {
          setExistingImageUrl(result.imageUrl);
          setAuthToken(result.token);
        }
      } catch (error) {
        console.log('Error loading existing user image:', error);
      }
    }
  };

  const userTypes = [
    {
      id: 'admin',
      title: 'Administrador',
      subtitle: 'Acceso completo al sistema',
      icon: 'shield-checkmark',
      color: colors.extended.red,
      needsAuth: true,
    },
    {
      id: 'user',
      title: 'Conductor',
      subtitle: 'Acceso vehicular y parking',
      icon: 'car',
      color: colors.primary.green,
      needsAuth: false,
    },
    {
      id: 'gate',
      title: 'Guardia',
      subtitle: 'Personal de seguridad y control',
      icon: 'shield-outline',
      color: colors.extended.blue,
      needsAuth: true,
    },
    {
      id: 'worker',
      title: 'Trabajador',
      subtitle: 'Personal operativo',
      icon: 'construct',
      color: colors.extended.greenBright,
      needsAuth: true,
    },
  ];

  const getCurrentUserType = () => {
    return userTypes.find(type => type.id === formData.role) || userTypes[0];
  };

  const resetModal = () => {
    setCameraModalVisible(false);
    setWebCameraActive(false);
    stopWebCamera();
    setFormData({
      doc_id: '',
      sec_id: '',
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      email: '',
      picture: null,
      role: '',
      user_type: '',
      pin: '',
      nationality: '',
      groups: '',
      placeIds: '',
      devicesIds: '',
      hasExpiration: false,
      expirationDate: '',
    });
    setLoading(false);
    setExistingImageUrl(null);
    setAuthToken(null);
    setSelectedDevices([]);
    setShowDeviceSelector(false);
  };

  // Función para cargar dispositivos
  const loadDevices = async () => {
    if (devices.length > 0) return; // Ya cargados
    
    setLoadingDevices(true);
    try {
      console.log('🔧 Cargando lista de dispositivos...');
      const result = await api.getDevices();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
        console.log('✅ Dispositivos cargados:', result.devices.length);
      } else {
        console.error('❌ Error cargando dispositivos:', result.error);
        Alert.alert('Error', 'No se pudieron cargar los dispositivos');
      }
    } catch (error) {
      console.error('❌ Error cargando dispositivos:', error);
      Alert.alert('Error', 'Error al cargar la lista de dispositivos');
    } finally {
      setLoadingDevices(false);
    }
  };

  // Función para manejar selección de dispositivos
  const toggleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  // Función para aplicar selección de dispositivos
  const applyDeviceSelection = () => {
    const deviceIds = selectedDevices.join(',');
    handleInputChange('devicesIds', deviceIds);
    setShowDeviceSelector(false);
  };

  // Cargar dispositivos cuando se abre el selector
  const handleOpenDeviceSelector = async () => {
    await loadDevices();
    
    // Preseleccionar dispositivos si ya hay algunos en el formulario
    if (formData.devicesIds) {
      const currentDevices = formData.devicesIds.split(',').map(id => id.trim()).filter(id => id);
      setSelectedDevices(currentDevices);
    }
    
    setShowDeviceSelector(true);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.doc_id.trim()) {
      Alert.alert('Error', 'El número de documento es obligatorio');
      return false;
    }
    if (!formData.first_name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!formData.last_name.trim()) {
      Alert.alert('Error', 'El apellido es obligatorio');
      return false;
    }
    const userType = getCurrentUserType();
    if (userType?.needsAuth && !formData.username.trim()) {
      Alert.alert('Error', 'El nombre de usuario es obligatorio para este tipo de perfil');
      return false;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }
    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    console.log('🔥 EditUserModal: handleSubmit iniciado');
    console.log('📋 Datos actuales del formulario:', {
      ...formData,
      picture: formData.picture ? `[imagen presente - ${formData.picture.length} chars]` : 'sin imagen nueva'
    });
    console.log('👤 Usuario original:', {
      id: user?.id,
      pub_id: user?.pub_id,
      doc_id: user?.doc_id,
      role: user?.role
    });

    if (!validateForm()) {
      console.log('❌ Validación del formulario falló');
      return;
    }

    console.log('✅ Validación exitosa, iniciando actualización...');
    setLoading(true);
    
    try {
      // Para actualizaciones, necesitamos determinar si enviamos la imagen existente
      // La API requiere picture para actualizaciones, pero podemos usar la existente
      let pictureToSend = formData.picture; // Nueva imagen si existe
      
      // Si no hay nueva imagen pero hay imagen existente, podríamos necesitar enviarla
      if (!formData.picture && existingImageUrl) {
        console.log('ℹ️ No hay nueva imagen, pero existe imagen actual');
        // Para actualizaciones sin nueva imagen, no enviamos picture
        // La API debería mantener la imagen existente
      }

      // Preparar los datos según la documentación de la API
      const userData = {
        id: user.id, // Incluir ID para actualización
        doc_id: formData.doc_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
      };

      // Campos opcionales - solo agregar si tienen valor
      if (formData.sec_id && formData.sec_id.trim()) {
        userData.sec_id = formData.sec_id.trim();
      }
      
      if (formData.email && formData.email.trim()) {
        userData.email = formData.email.trim();
      }

      // Nuevos campos adicionales
      if (formData.user_type && formData.user_type.trim()) {
        userData.user_type = formData.user_type.trim();
      }

      if (formData.pin && formData.pin.trim()) {
        userData.pin = formData.pin.trim();
      }

      if (formData.nationality && formData.nationality.trim()) {
        userData.nationality = formData.nationality.trim();
      }

      if (formData.groups && formData.groups.trim()) {
        userData.groups = formData.groups.trim();
      }

      if (formData.placeIds && formData.placeIds.trim()) {
        userData.placeIds = formData.placeIds.trim();
      }

      if (formData.devicesIds && formData.devicesIds.trim()) {
        userData.devicesIds = formData.devicesIds.trim();
      }

      // Campos de expiración
      userData.hasExpiration = formData.hasExpiration ? 1 : 0;
      if (formData.hasExpiration && formData.expirationDate && formData.expirationDate.trim()) {
        userData.expirationDate = formData.expirationDate.trim();
      }

      // Solo incluir picture si hay una nueva imagen
      if (pictureToSend) {
        userData.picture = pictureToSend;
        console.log('📸 Incluyendo nueva imagen en la actualización');
      } else {
        console.log('⚠️ Actualizando usuario sin nueva imagen (mantendrá la actual)');
      }

      // Campos de autenticación - solo para roles que los necesitan
      const userType = getCurrentUserType();
      if (userType?.needsAuth) {
        if (formData.username && formData.username.trim()) {
          userData.username = formData.username.trim();
        }
        if (formData.password && formData.password.trim()) {
          userData.password = formData.password.trim();
          console.log('🔑 Incluyendo nueva contraseña');
        } else {
          console.log('🔑 Sin cambio de contraseña');
        }
      }

      console.log('📤 EDITANDO usuario con datos finales:', {
        ...userData,
        picture: userData.picture ? `[base64 image - ${userData.picture.length} chars]` : 'sin cambios'
      });
      
      console.log('🌐 Llamando a api.saveUser...');
      const result = await api.saveUser(userData);
      
      console.log('📥 Respuesta completa del servidor:', result);
      
      // Verificar diferentes formatos de respuesta
      if (result && (result.id || result.result === 'updated' || result.result === 'created')) {
        console.log('✅ Actualización exitosa!');
        // Mostrar mensaje de éxito y cerrar automáticamente
        Alert.alert(
          'Éxito',
          `Usuario ${result.result === 'updated' ? 'actualizado' : 'procesado'} correctamente`,
          [
            {
              text: 'OK',
              onPress: () => {
                // No hacer nada aquí, el cierre se maneja automáticamente abajo
              }
            }
          ]
        );
        
        // Cerrar la modal inmediatamente después de mostrar el alert
        console.log('🔄 Cerrando modal y recargando lista...');
        handleClose();
        onUserUpdated?.();
      } else {
        console.log('⚠️ Respuesta inesperada del servidor:', result);
        throw new Error(result?.error || 'Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('❌ Error completo actualizando usuario:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Manejar errores específicos de la API según la documentación
      let errorMessage = 'No se pudo actualizar el usuario';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        console.error('❌ Error del servidor:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Errores específicos según la documentación
      if (error.response?.data?.code) {
        const code = error.response.data.code;
        console.error('❌ Código de error del servidor:', code);
        switch (code) {
          case 'MANDATORY':
            errorMessage = 'Faltan campos obligatorios';
            break;
          case 'INVALID_EMAIL':
            errorMessage = 'El email proporcionado no es válido';
            break;
          case 'INVALID_IMAGE':
            errorMessage = 'La imagen proporcionada no es válida';
            break;
          case 'FACE_NOT_FOUND':
            errorMessage = 'No se detectó un rostro en la imagen';
            break;
          case 'INVALID_BASE64_ENCODING':
            errorMessage = 'La imagen no tiene el formato correcto';
            break;
          default:
            errorMessage = `Error: ${code}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('🏁 Finalizando actualización, limpiando loading...');
      setLoading(false);
    }
  };

  // Compresión de imágenes específica para web
  const compressImageWeb = async (uri) => {
    console.log('Usando web canvas para compresión de imagen');
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('No se pudo obtener el contexto del canvas');
          }
          
          // Mantener aspect ratio con ancho máximo de 400px
          const MAX_WIDTH = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.floor(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          console.log(`Dimensiones del canvas web: ${width} x ${height}`);
          
          // Dibujar imagen en canvas
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a base64 JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = dataUrl.split(',')[1];
          
          console.log(`Base64 comprimido (web): ${base64Data.length} caracteres`);
          resolve(base64Data);
        } catch (error) {
          console.error('Error procesando imagen en canvas:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error cargando imagen para compresión:', error);
        reject(error);
      };
      
      img.src = uri;
    });
  };

  // Compresión de imágenes
  const compressImage = async (uri) => {
    console.log(`Comprimiendo imagen en plataforma: ${Platform.OS}`);
    
    if (Platform.OS === 'web') {
      return await compressImageWeb(uri);
    } else {
      // Implementación mobile
      if (!ImageManipulator) {
        throw new Error('ImageManipulator no está disponible');
      }
      
      console.log('Usando ImageManipulator móvil');
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      console.log(`Base64 comprimido (mobile): ${manipulatedImage.base64.length} caracteres`);
      return manipulatedImage.base64;
    }
  };

  const processImage = async (imageUri) => {
    try {
      console.log('Procesando imagen:', imageUri);
      
      const base64Data = await compressImage(imageUri);
      const base64Image = `data:image/jpeg;base64,${base64Data}`;
      
      setFormData(prev => ({ 
        ...prev, 
        picture: base64Image 
      }));

      console.log('Imagen procesada correctamente, tamaño base64:', base64Image.length);
      Alert.alert('Éxito', 'Imagen cargada correctamente');
    } catch (error) {
      console.error('Error procesando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen: ' + error.message);
    }
  };

  // Funciones para cámara web
  const startWebCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Alert.alert('Error', 'Tu navegador no soporta acceso a la cámara');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      setWebCameraActive(true);
      
      // Esperar a que el video esté listo
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
  };

  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebCameraActive(false);
  };

  const captureWebPhoto = () => {
    if (!videoRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Procesar la imagen capturada
      processImage(dataUrl);
      
      // Cerrar la cámara
      stopWebCamera();
    } catch (error) {
      console.error('Error capturando foto:', error);
      Alert.alert('Error', 'No se pudo capturar la foto');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // En web, usar getUserMedia para acceder a la cámara
      if (Platform.OS === 'web') {
        console.log('Web detectado - usando getUserMedia para cámara web');
        await startWebCamera();
        return;
      }

      // En mobile, verificar permisos y usar expo-camera
      if (CameraView && Platform.OS !== 'web') {
        console.log('Usando expo-camera nativo');
        
        // Verificar permisos usando el hook
        if (useCameraPermissions && !cameraPermission?.granted) {
          const permission = await requestCameraPermission();
          if (!permission.granted) {
            Alert.alert('Error', 'Se necesitan permisos de cámara');
            return;
          }
        }
        
        setCameraModalVisible(true);
      } else if (ImagePicker) {
        console.log('Fallback a ImagePicker');
        await handleImagePickerCamera();
      } else {
        console.log('No hay opciones de cámara disponibles');
        Alert.alert(
          'Cámara no disponible', 
          'Para usar la cámara, instala las dependencias:\\n\\nnpx expo install expo-camera expo-image-picker expo-image-manipulator'
        );
      }
    } catch (error) {
      console.error('Error en handleTakePhoto:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara: ' + error.message);
    }
  };

  const handleImagePickerCamera = async () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'ImagePicker no está disponible');
      return;
    }

    try {
      console.log('Usando ImagePicker para cámara...');
      
      // En web no se puede acceder a la cámara nativa - redirigir a selector de archivos
      if (Platform.OS === 'web') {
        console.log('Web detectado - redirigiendo a selector de archivos');
        await handlePickImage();
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos de cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error con ImagePicker camera:', error);
      Alert.alert('Error', 'No se pudo usar la cámara');
    }
  };

  const takePictureWithCamera = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Cámara no está lista');
      return;
    }

    try {
      console.log('Tomando foto con expo-camera...');
      
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      
      console.log('Foto tomada:', photo);
      
      setCameraModalVisible(false);
      await processImage(photo.uri);
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto: ' + error.message);
    }
  };

  const handlePickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'ImagePicker no está disponible');
      return;
    }

    try {
      console.log('Seleccionando imagen...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos de galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Resultado galería:', result);

      if (!result.canceled && result.assets?.[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Modal de cámara - Solo para mobile
  const CameraModal = () => {
    if (!CameraView || !cameraModalVisible || Platform.OS === 'web') {
      return null;
    }

    return (
      <Modal
        visible={cameraModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
          >
            {/* Header con botón cerrar */}
            <View style={{
              position: 'absolute',
              top: 50,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
            }}>
              <TouchableOpacity
                onPress={() => setCameraModalVisible(false)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}>
                <Text style={{ color: 'white', fontSize: typography.fontSize.sm }}>
                  Centrar rostro en el cuadro
                </Text>
              </View>
            </View>

            {/* Controles inferiores */}
            <View style={{
              position: 'absolute',
              bottom: 50,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={takePictureWithCamera}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.full,
                  width: 80,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: colors.primary.green,
                }}
              >
                <Ionicons name="camera" size={32} color={colors.primary.green} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  };

  const PhotoSection = () => {
    const cameraAvailable = !!CameraView && Platform.OS !== 'web';
    const imagePickerAvailable = !!ImagePicker && !!ImageManipulator;
    const anyAvailable = cameraAvailable || imagePickerAvailable;
    const hasImage = formData.picture || existingImageUrl;
    const imageToShow = formData.picture || (existingImageUrl && !formData.picture ? existingImageUrl : null);
    
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.md,
        }}>
        Fotografía (Opcional para editar)
        </Text>
      
      {/* Mensaje informativo para edición */}
      <View style={{
        backgroundColor: colors.extended.blue + '10',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.md,
      }}>
        <Text style={{
          fontSize: typography.fontSize.xs,
          color: colors.extended.blue,
          textAlign: 'center',
          fontWeight: typography.fontWeight.medium,
        }}>
          📝 Solo sube una nueva imagen si quieres cambiar la actual
        </Text>
      </View>
        
        {hasImage ? (
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <Image
              source={{ 
                uri: imageToShow,
                headers: (!formData.picture && authToken) ? {
                  'Authorization': `Bearer ${authToken}`,
                } : undefined
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: borderRadius.full,
                marginBottom: spacing.md,
                borderWidth: 2,
                borderColor: colors.primary.green,
              }}
            />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
            }}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={{
                  backgroundColor: colors.primary.green + '20',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginRight: spacing.xs,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.primary.green,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Cambiar foto
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  backgroundColor: colors.primary.purple + '20',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginLeft: spacing.xs,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.primary.purple,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Subir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: spacing.md,
          }}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={{
                backgroundColor: (Platform.OS === 'web' || cameraAvailable) ? colors.primary.green + '20' : colors.background.light,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                alignItems: 'center',
                flex: 1,
                marginRight: spacing.sm,
                ...shadows.sm,
              }}
            >
              <Ionicons 
                name="camera" 
                size={28} 
                color={(Platform.OS === 'web' || cameraAvailable) ? colors.primary.green : colors.text.secondary} 
              />
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: (Platform.OS === 'web' || cameraAvailable) ? colors.primary.green : colors.text.secondary,
                fontWeight: typography.fontWeight.medium,
                marginTop: spacing.xs,
                textAlign: 'center',
              }}>
                {Platform.OS === 'web' ? 'Tomar Foto' : (cameraAvailable ? 'Tomar Foto' : 'Cámara')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handlePickImage}
              style={{
                backgroundColor: imagePickerAvailable ? colors.primary.purple + '20' : colors.background.light,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                alignItems: 'center',
                flex: 1,
                marginLeft: spacing.sm,
                ...shadows.sm,
              }}
            >
              <Ionicons 
                name="images" 
                size={28} 
                color={imagePickerAvailable ? colors.primary.purple : colors.text.secondary} 
              />
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: imagePickerAvailable ? colors.primary.purple : colors.text.secondary,
                fontWeight: typography.fontWeight.medium,
                marginTop: spacing.xs,
                textAlign: 'center',
              }}>
                Subir Imagen
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {formData.picture && (
          <View style={{
            backgroundColor: colors.success + '10',
            borderRadius: borderRadius.lg,
            padding: spacing.sm,
            marginTop: spacing.sm,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xs,
              color: colors.success,
              textAlign: 'center',
              fontWeight: typography.fontWeight.medium,
            }}>
              ✓ Nueva imagen lista para enviar ({Math.round(formData.picture.length / 1024)} KB)
            </Text>
          </View>
        )}
      </View>
    );
  };

  // FormField component moved to common/FormField.js to prevent focus loss

  const userType = getCurrentUserType();

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={handleClose}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.background.light,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '90%',
            ...shadows.lg,
          }}>
            <LinearGradient
              colors={colors.gradients.purple}
              style={{
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                padding: spacing.lg,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.white,
                }}>
                  Editar Usuario
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
              style={{ 
                padding: spacing.xl,
              }} 
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              indicatorStyle={Platform.OS === 'ios' ? 'black' : undefined}
              contentContainerStyle={{
                paddingBottom: spacing.md,
              }}
              scrollIndicatorInsets={{ right: 1 }}
            >
              {/* Información del tipo de usuario */}
              <View style={{
                backgroundColor: userType.color + '10',
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.xl,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  backgroundColor: userType.color + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                  marginRight: spacing.md,
                }}>
                  <Ionicons name={userType.icon} size={24} color={userType.color} />
                </View>
                <View>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: userType.color,
                  }}>
                    {userType.title}
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: userType.color,
                    opacity: 0.8,
                  }}>
                    {userType.subtitle}
                  </Text>
                </View>
              </View>

              <PhotoSection />

              <FormField
                label="Número de Documento"
                value={formData.doc_id}
                onChangeText={(value) => handleInputChange('doc_id', value)}
                placeholder="Ej: 12345678-9"
                required
              />

              <FormField
                label="Otro Documento"
                value={formData.sec_id}
                onChangeText={(value) => handleInputChange('sec_id', value)}
                placeholder="Documento secundario (opcional)"
              />

              <FormField
                label="Nombres"
                value={formData.first_name}
                onChangeText={(value) => handleInputChange('first_name', value)}
                placeholder="Nombres completos"
                required
              />

              <FormField
                label="Apellidos"
                value={formData.last_name}
                onChangeText={(value) => handleInputChange('last_name', value)}
                placeholder="Apellidos completos"
                required
              />

              <FormField
                label="Correo Electrónico"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
              />

              <FormField
                label="Tipo de Usuario"
                value={formData.user_type}
                onChangeText={(value) => handleInputChange('user_type', value)}
                placeholder="Ej: empleado, visitante, contratista"
              />

              <FormField
                label="PIN de Acceso (dejar vacío para mantener actual)"
                value={formData.pin}
                onChangeText={(value) => handleInputChange('pin', value)}
                placeholder="PIN numérico de 4-6 dígitos"
                keyboardType="numeric"
                maxLength={6}
              />

              <FormField
                label="Nacionalidad"
                value={formData.nationality}
                onChangeText={(value) => handleInputChange('nationality', value)}
                placeholder="Ej: Chilena, Argentina, Peruana"
              />

              <FormField
                label="Grupos (separados por coma)"
                value={formData.groups}
                onChangeText={(value) => handleInputChange('groups', value)}
                placeholder="Ej: 1,2,3 (IDs de grupos)"
              />

              <FormField
                label="Lugares Asignados (separados por coma)"
                value={formData.placeIds}
                onChangeText={(value) => handleInputChange('placeIds', value)}
                placeholder="Ej: 1,2,3 (IDs de lugares)"
              />

              {/* Selector de Dispositivos */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing.md,
                }}>
                  Dispositivos Asignados
                </Text>
                
                <TouchableOpacity
                  onPress={handleOpenDeviceSelector}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.background.light,
                    padding: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 50,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    {formData.devicesIds ? (
                      <Text style={{
                        fontSize: typography.fontSize.base,
                        color: colors.text.primary,
                      }}>
                        {formData.devicesIds.split(',').length} dispositivo(s) seleccionado(s)
                      </Text>
                    ) : (
                      <Text style={{
                        fontSize: typography.fontSize.base,
                        color: colors.text.secondary,
                      }}>
                        Seleccionar dispositivos...
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                
                {formData.devicesIds && (
                  <View style={{
                    backgroundColor: colors.success + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.success,
                      fontWeight: typography.fontWeight.medium,
                    }}>
                      ✓ IDs seleccionados: {formData.devicesIds}
                    </Text>
                  </View>
                )}
              </View>

              {/* Campo de expiración */}
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing.md,
                }}>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}>
                    ¿El usuario tiene fecha de expiración?
                  </Text>
                  <Switch
                    value={formData.hasExpiration}
                    onValueChange={(value) => {
                      handleInputChange('hasExpiration', value);
                      if (!value) {
                        handleInputChange('expirationDate', '');
                      }
                    }}
                    trackColor={{ false: colors.background.light, true: colors.primary.purple }}
                    thumbColor={formData.hasExpiration ? colors.white : colors.text.secondary}
                  />
                </View>
                
                {formData.hasExpiration && (
                  <FormField
                    label="Fecha de Expiración"
                    value={formData.expirationDate}
                    onChangeText={(value) => handleInputChange('expirationDate', value)}
                    placeholder="DD/MM/AAAA"
                  />
                )}
              </View>

              {userType?.needsAuth && (
                <>
                  <FormField
                    label="Nombre de Usuario"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    placeholder="Nombre de usuario único"
                    required
                  />

                  <FormField
                    label="Nueva Contraseña (dejar vacío para mantener actual)"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Nueva contraseña (opcional)"
                    secureTextEntry
                  />
                </>
              )}

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: spacing.xl,
                paddingBottom: spacing.xl,
              }}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginRight: spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    console.log('🖱️ Botón Actualizar presionado');
                    handleSubmit();
                  }}
                  disabled={loading}
                  style={{
                    flex: 2,
                    backgroundColor: loading ? colors.background.light : colors.primary.purple,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginLeft: spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: loading ? colors.text.secondary : colors.white,
                    fontWeight: typography.fontWeight.bold,
                  }}>
                    {loading ? 'Actualizando...' : 'Actualizar Usuario'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de cámara - Solo se renderiza si está disponible */}
      <CameraModal />

      {/* Modal de cámara web para Platform.OS === 'web' */}
      {Platform.OS === 'web' && webCameraActive && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={webCameraActive}
          onRequestClose={stopWebCamera}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: colors.background.dark,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              width: '90%',
              maxWidth: 600,
              alignItems: 'center',
              ...shadows.lg,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginBottom: spacing.lg,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.white,
                }}>
                  Tomar Foto
                </Text>
                <TouchableOpacity
                  onPress={stopWebCamera}
                  style={{
                    backgroundColor: colors.white + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              {/* Video container */}
              <View style={{
                width: '100%',
                aspectRatio: 4/3,
                backgroundColor: colors.background.dark,
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                marginBottom: spacing.lg,
              }}>
                {Platform.OS === 'web' && (
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)', // Espejo para selfie
                    }}
                    autoPlay
                    playsInline
                    muted
                  />
                )}
              </View>

              {/* Controles */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: spacing.md,
              }}>
                <TouchableOpacity
                  onPress={captureWebPhoto}
                  style={{
                    backgroundColor: colors.primary.green,
                    borderRadius: borderRadius.full,
                    width: 80,
                    height: 80,
                    justifyContent: 'center',
                    alignItems: 'center',
                    ...shadows.md,
                  }}
                >
                  <Ionicons name="camera" size={32} color={colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
                marginTop: spacing.md,
              }}>
                Centra tu rostro en el cuadro y presiona el botón para capturar
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Selector de Dispositivos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeviceSelector}
        onRequestClose={() => setShowDeviceSelector(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.background.light,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80%',
            ...shadows.lg,
          }}>
            {/* Header */}
            <LinearGradient
              colors={colors.gradients.purple}
              style={{
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                padding: spacing.lg,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
              }}>
                Seleccionar Dispositivos
              </Text>
              
              <TouchableOpacity
                onPress={() => setShowDeviceSelector(false)}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Content */}
            <ScrollView style={{ padding: spacing.lg, maxHeight: 400 }}>
              {loadingDevices ? (
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: spacing.xl,
                }}>
                  <ActivityIndicator size="large" color={colors.primary.purple} />
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginTop: spacing.md,
                  }}>
                    Cargando dispositivos...
                  </Text>
                </View>
              ) : devices.length === 0 ? (
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: spacing.xl,
                }}>
                  <Ionicons name="hardware-chip-outline" size={64} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginTop: spacing.md,
                    textAlign: 'center',
                  }}>
                    No hay dispositivos disponibles
                  </Text>
                </View>
              ) : (
                devices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    onPress={() => toggleDeviceSelection(device.id.toString())}
                    style={{
                      backgroundColor: selectedDevices.includes(device.id.toString()) 
                        ? colors.primary.purple + '20' 
                        : colors.white,
                      borderRadius: borderRadius.lg,
                      borderWidth: 2,
                      borderColor: selectedDevices.includes(device.id.toString()) 
                        ? colors.primary.purple 
                        : colors.background.light,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{
                      backgroundColor: selectedDevices.includes(device.id.toString()) 
                        ? colors.primary.purple 
                        : colors.background.light,
                      borderRadius: borderRadius.full,
                      padding: spacing.sm,
                      marginRight: spacing.md,
                    }}>
                      <Ionicons 
                        name="hardware-chip" 
                        size={24} 
                        color={selectedDevices.includes(device.id.toString()) 
                          ? colors.white 
                          : colors.text.secondary
                        } 
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        color: selectedDevices.includes(device.id.toString()) 
                          ? colors.primary.purple 
                          : colors.text.primary,
                        marginBottom: spacing.xs,
                      }}>
                        {device.name}
                      </Text>
                      
                      {device.description && (
                        <Text style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary,
                          marginBottom: spacing.xs,
                        }}>
                          {device.description}
                        </Text>
                      )}
                      
                      <Text style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.secondary,
                        fontWeight: typography.fontWeight.medium,
                      }}>
                        ID: {device.id}
                        {device.location && ` • ${device.location}`}
                      </Text>
                    </View>
                    
                    {selectedDevices.includes(device.id.toString()) && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary.purple} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.background.light,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <TouchableOpacity
                onPress={() => setShowDeviceSelector(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginRight: spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.primary,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={applyDeviceSelection}
                style={{
                  flex: 2,
                  backgroundColor: colors.primary.purple,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginLeft: spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.white,
                  fontWeight: typography.fontWeight.bold,
                }}>
                  Aplicar ({selectedDevices.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EditUserModal;
