import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, Alert, Platform } from 'react-native';

// Imports seguros
let ImagePicker = null;
let ImageManipulator = null;
let CameraView = null;
let useCameraPermissions = null;

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

const SimpleCameraTest = () => {
  const [image, setImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions ? useCameraPermissions() : [null, null];
  const cameraRef = useRef(null);

  // Compresión web
  const compressImageWeb = async (uri) => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const MAX_WIDTH = 300;
          let { width, height } = img;
          
          if (width > MAX_WIDTH) {
            height = Math.floor(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = dataUrl.split(',')[1];
          
          resolve(`data:image/jpeg;base64,${base64Data}`);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = uri;
    });
  };

  const processImage = async (uri) => {
    try {
      let processedImage;
      
      if (Platform.OS === 'web') {
        processedImage = await compressImageWeb(uri);
      } else {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 300 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        processedImage = `data:image/jpeg;base64,${manipulated.base64}`;
      }
      
      setImage(processedImage);
      console.log('✅ Imagen procesada, tamaño:', processedImage.length);
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: usar ImagePicker
        if (!ImagePicker) {
          Alert.alert('Error', 'ImagePicker no disponible');
          return;
        }
        
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
          await processImage(result.assets[0].uri);
        }
      } else {
        // Mobile: usar CameraView
        if (!CameraView) {
          Alert.alert('Error', 'CameraView no disponible');
          return;
        }
        
        if (!cameraPermission?.granted) {
          const permission = await requestCameraPermission();
          if (!permission.granted) {
            Alert.alert('Error', 'Se necesitan permisos de cámara');
            return;
          }
        }
        
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setShowCamera(false);
      await processImage(photo.uri);
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  if (showCamera && CameraView) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
        >
          <View style={{ 
            position: 'absolute', 
            bottom: 80, 
            left: 0, 
            right: 0, 
            alignItems: 'center' 
          }}>
            <TouchableOpacity
              onPress={takePicture}
              style={{
                backgroundColor: 'white',
                borderRadius: 50,
                width: 80,
                height: 80,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, color: 'black' }}>📷</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 20,
              padding: 10,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20,
      backgroundColor: 'white'
    }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        Prueba de Cámara Simplificada
      </Text>
      
      <Text style={{ 
        fontSize: 14, 
        marginBottom: 20, 
        textAlign: 'center',
        backgroundColor: Platform.OS === 'web' ? '#e3f2fd' : '#e8f5e8',
        padding: 10,
        borderRadius: 8,
      }}>
        {Platform.OS === 'web' ? 
          '🌐 Web: Selección de archivos' : 
          '📱 Mobile: Cámara nativa'}
      </Text>
      
      {image && (
        <Image
          source={{ uri: image }}
          style={{ 
            width: 200, 
            height: 200, 
            borderRadius: 100, 
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#4CAF50'
          }}
        />
      )}
      
      <TouchableOpacity
        onPress={handleTakePhoto}
        style={{
          backgroundColor: '#2196F3',
          borderRadius: 8,
          paddingHorizontal: 20,
          paddingVertical: 12,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {Platform.OS === 'web' ? 'Seleccionar Imagen' : 'Tomar Foto'}
        </Text>
      </TouchableOpacity>
      
      <Text style={{ 
        fontSize: 12, 
        color: '#666', 
        textAlign: 'center' 
      }}>
        CameraView: {CameraView ? '✅' : '❌'} | 
        ImagePicker: {ImagePicker ? '✅' : '❌'} | 
        Platform: {Platform.OS}
      </Text>
    </View>
  );
};

export default SimpleCameraTest;
