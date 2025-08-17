import React from 'react';
import { View, Text, Button, Alert } from 'react-native';

const CameraTest = () => {
  const testCameraImport = () => {
    try {
      console.log('=== TESTING EXPO-CAMERA IMPORT ===');
      
      // Probar import dinámico
      const CameraModule = require('expo-camera');
      console.log('CameraModule:', Object.keys(CameraModule));
      
      // Verificar diferentes exports
      console.log('CameraModule.Camera:', !!CameraModule.Camera);
      console.log('CameraModule.CameraView:', !!CameraModule.CameraView);
      console.log('CameraModule.CameraType:', !!CameraModule.CameraType);
      console.log('CameraModule.FlashMode:', !!CameraModule.FlashMode);
      console.log('CameraModule.useCameraPermissions:', !!CameraModule.useCameraPermissions);
      
      // Verificar si Camera tiene métodos
      if (CameraModule.Camera) {
        console.log('Camera methods:', Object.getOwnPropertyNames(CameraModule.Camera));
        console.log('Camera.requestCameraPermissionsAsync:', !!CameraModule.Camera.requestCameraPermissionsAsync);
      }
      
      // Verificar si CameraView existe (nueva API)
      if (CameraModule.CameraView) {
        console.log('CameraView found - using new API');
      }
      
      Alert.alert('Test Complete', 'Check console for results');
      
    } catch (error) {
      console.error('Error testing camera:', error);
      Alert.alert('Error', 'expo-camera import failed: ' + error.message);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: 'white', flex: 1, justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        Camera Import Test
      </Text>
      <Button title="Test expo-camera Import" onPress={testCameraImport} />
    </View>
  );
};

export default CameraTest;
