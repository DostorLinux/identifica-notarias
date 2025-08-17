import React, { useState, useRef } from 'react';
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
  Dimensions,
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

// Componentes movidos fuera para evitar recreación y pérdida de foco
const UserTypeSelector = ({ userTypes, onTypeSelect }) => (
  <View style={{ padding: spacing.xl }}>
    <Text style={{
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    }}>
      Crear Nuevo Usuario
    </Text>
    
    <Text style={{
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    }}>
      Selecciona el tipo de usuario que deseas crear
    </Text>

    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }}>
      {userTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          onPress={() => onTypeSelect(type)}
          style={{
            width: '48%',
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
            alignItems: 'center',
            ...shadows.md,
          }}
        >
          <View style={{
            backgroundColor: type.color + '20',
            borderRadius: borderRadius.full,
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}>
            <Ionicons name={type.icon} size={32} color={type.color} />
          </View>
          
          <Text style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            textAlign: 'center',
            marginBottom: spacing.xs,
          }}>
            {type.title}
          </Text>
          
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
            {type.subtitle}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const PhotoSection = ({ formData, handleTakePhoto, handlePickImage, setFormData }) => {
  const cameraAvailable = !!CameraView && Platform.OS !== 'web';
  const imagePickerAvailable = !!ImagePicker && !!ImageManipulator;
  const anyAvailable = cameraAvailable || imagePickerAvailable;
  
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.md,
      }}>
        Fotografía <Text style={{ color: colors.error }}>*</Text>
      </Text>
      
      {/* Mensaje de obligatoriedad */}
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
          📸 La fotografía es obligatoria para crear el usuario
        </Text>
      </View>
      
      {/* Estado de dependencias */}
      <View style={{
        backgroundColor: anyAvailable ? colors.success + '10' : colors.extended.red + '10',
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.md,
      }}>
        <Text style={{
          fontSize: typography.fontSize.xs,
          color: anyAvailable ? colors.success : colors.extended.red,
          textAlign: 'center',
          fontWeight: typography.fontWeight.medium,
        }}>
          {Platform.OS === 'web' ? 
            '🌐 Web: puedes tomar fotos o seleccionar archivos' :
            (cameraAvailable ? '📷 Cámara nativa disponible' : 
             imagePickerAvailable ? '📁 Solo selección de archivos' :
             '⚠️ Instala: npx expo install expo-camera expo-image-picker expo-image-manipulator')
          }
        </Text>
      </View>
      
      {formData.picture ? (
        <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
          <Image
            source={{ uri: formData.picture }}
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
              onPress={() => setFormData(prev => ({ ...prev, picture: null }))}
              style={{
                backgroundColor: colors.error + '20',
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginLeft: spacing.xs,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.error,
                fontWeight: typography.fontWeight.medium,
              }}>
                Eliminar
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
            ✓ Imagen lista para enviar ({Math.round(formData.picture.length / 1024)} KB)
          </Text>
        </View>
      )}
    </View>
  );
};

// Lista de nacionalidades del continente americano (movida aquí para ser accesible globalmente)
const americanNationalities = [
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷' },
  { id: 'bolivia', name: 'Bolivia', flag: '🇧🇴' },
  { id: 'brasil', name: 'Brasil', flag: '🇧🇷' },
  { id: 'canada', name: 'Canadá', flag: '🇨🇦' },
  { id: 'chile', name: 'Chile', flag: '🇨🇱' },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴' },
  { id: 'costa_rica', name: 'Costa Rica', flag: '🇨🇷' },
  { id: 'cuba', name: 'Cuba', flag: '🇨🇺' },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨' },
  { id: 'el_salvador', name: 'El Salvador', flag: '🇸🇻' },
  { id: 'estados_unidos', name: 'Estados Unidos', flag: '🇺🇸' },
  { id: 'guatemala', name: 'Guatemala', flag: '🇬🇹' },
  { id: 'guyana', name: 'Guyana', flag: '🇬🇾' },
  { id: 'haiti', name: 'Haití', flag: '🇭🇹' },
  { id: 'honduras', name: 'Honduras', flag: '🇭🇳' },
  { id: 'jamaica', name: 'Jamaica', flag: '🇯🇲' },
  { id: 'mexico', name: 'México', flag: '🇲🇽' },
  { id: 'nicaragua', name: 'Nicaragua', flag: '🇳🇮' },
  { id: 'panama', name: 'Panamá', flag: '🇵🇦' },
  { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾' },
  { id: 'peru', name: 'Perú', flag: '🇵🇪' },
  { id: 'republica_dominicana', name: 'República Dominicana', flag: '🇩🇴' },
  { id: 'suriname', name: 'Suriname', flag: '🇸🇷' },
  { id: 'trinidad_tobago', name: 'Trinidad y Tobago', flag: '🇹🇹' },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'venezuela', name: 'Venezuela', flag: '🇻🇪' },
];

// Función helper para obtener la bandera por nombre de nacionalidad (función global)
const getFlagByNationality = (nationalityName) => {
  const nationality = americanNationalities.find(n => n.name === nationalityName);
  return nationality ? nationality.flag : '🌎';
};

const AdaptiveUserForm = ({ 
  userType, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  handleTakePhoto, 
  handlePickImage, 
  setFormData, 
  setStep, 
  loading,
  handleOpenDeviceSelector,
  handleOpenGroupSelector,
  handleOpenDatePicker,
  handleOpenNationalitySelector
}) => (
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
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
    }}>
      <TouchableOpacity
        onPress={() => setStep('type-selection')}
        style={{
          backgroundColor: colors.background.light,
          borderRadius: borderRadius.full,
          padding: spacing.sm,
          marginRight: spacing.md,
        }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
      </TouchableOpacity>
      
      <View>
        <Text style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
        }}>
          {userType?.title}
        </Text>
        <Text style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}>
          {userType?.subtitle}
        </Text>
      </View>
    </View>

    <PhotoSection 
      formData={formData}
      handleTakePhoto={handleTakePhoto}
      handlePickImage={handlePickImage}
      setFormData={setFormData}
    />

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
      label="PIN de Acceso"
      value={formData.pin}
      onChangeText={(value) => handleInputChange('pin', value)}
      placeholder="PIN numérico de 4-6 dígitos"
      keyboardType="numeric"
      maxLength={6}
    />

    {/* Selector de Nacionalidad */}
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.md,
      }}>
        Nacionalidad
      </Text>
      
      <TouchableOpacity
        onPress={handleOpenNationalitySelector}
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
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {formData.nationality ? (
            <>
              <Text style={{
                fontSize: 24,
                marginRight: spacing.sm,
              }}>
                {getFlagByNationality(formData.nationality)}
              </Text>
              <Text style={{
                fontSize: typography.fontSize.base,
                color: colors.text.primary,
              }}>
                {formData.nationality}
              </Text>
            </>
          ) : (
            <>
              <Ionicons 
                name="globe-outline" 
                size={20} 
                color={colors.text.secondary} 
                style={{ marginRight: spacing.sm }}
              />
              <Text style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
              }}>
                Seleccionar nacionalidad...
              </Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
      
      {formData.nationality && (
        <View style={{
          backgroundColor: colors.success + '10',
          borderRadius: borderRadius.lg,
          padding: spacing.sm,
          marginTop: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={{
            fontSize: typography.fontSize.xs,
            color: colors.success,
            fontWeight: typography.fontWeight.medium,
            marginLeft: spacing.xs,
          }}>
            Nacionalidad seleccionada: {formData.nationality}
          </Text>
        </View>
      )}
    </View>

    {/* Selector de Grupos */}
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.md,
      }}>
        Grupos
      </Text>
      
      <TouchableOpacity
        onPress={handleOpenGroupSelector}
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
          {formData.groups ? (
            <Text style={{
              fontSize: typography.fontSize.base,
              color: colors.text.primary,
            }}>
              Tipo seleccionado: {formData.groups}
            </Text>
          ) : (
            <Text style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
            }}>
              Seleccionar grupos...
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
      
      {formData.groups && (
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
            ✓ Tipo seleccionado: {formData.groups}
          </Text>
        </View>
      )}
    </View>

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
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            Fecha de Expiración
          </Text>
          
          <TouchableOpacity
            onPress={handleOpenDatePicker}
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
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={formData.expirationDate ? colors.primary.purple : colors.text.secondary} 
                style={{ marginRight: spacing.sm }}
              />
              <Text style={{
                fontSize: typography.fontSize.base,
                color: formData.expirationDate ? colors.text.primary : colors.text.secondary,
              }}>
                {formData.expirationDate || 'Seleccionar fecha...'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          
          {formData.expirationDate && (
            <View style={{
              backgroundColor: colors.success + '10',
              borderRadius: borderRadius.lg,
              padding: spacing.sm,
              marginTop: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.success,
                fontWeight: typography.fontWeight.medium,
                marginLeft: spacing.xs,
              }}>
                Fecha seleccionada: {formData.expirationDate}
              </Text>
            </View>
          )}
        </View>
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
          label="Contraseña"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Contraseña segura"
          required
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
        onPress={() => setStep('type-selection')}
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
          Atrás
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={handleSubmit}
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
          {loading ? 'Creando...' : 'Crear Usuario'}
        </Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

// Modal de cámara - Solo para mobile
const CameraModal = ({ visible, onClose, cameraRef, takePicture }) => {
  if (!CameraView || !visible || Platform.OS === 'web') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
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
              onPress={onClose}
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
              onPress={takePicture}
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

const CreateUserModal = ({ visible, onClose, onUserCreated }) => {
  const [step, setStep] = useState('type-selection');
  const [userType, setUserType] = useState(null);
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
  
  // Estados para selector de nacionalidad
  const [showNationalitySelector, setShowNationalitySelector] = useState(false);
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedNationalityFlag, setSelectedNationalityFlag] = useState('');

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

  const resetModal = () => {
    setStep('type-selection');
    setUserType(null);
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
    setSelectedDevices([]);
    setShowDeviceSelector(false);
    setSelectedGroups([]);
    setShowGroupSelector(false);
    setShowDatePicker(false);
    setSelectedDate(new Date());
    setShowNationalitySelector(false);
    setSelectedNationality('');
    setSelectedNationalityFlag('');
  };

  // Función para cargar dispositivos
  const loadDevices = async () => {
    if (devices.length > 0) {
      console.log('🔧 Dispositivos ya cargados:', devices.length);
      return; // Ya cargados
    }
    
    setLoadingDevices(true);
    try {
      console.log('🔧 Iniciando carga de dispositivos...');
      const result = await api.getDevices();
      
      console.log('🔧 Respuesta del servidor:', result);
      
      if (result.success && result.devices) {
        setDevices(result.devices);
        console.log('✅ Dispositivos cargados exitosamente:', result.devices.length);
        console.log('🔧 Dispositivos:', result.devices);
      } else {
        console.error('❌ Error en respuesta:', result);
        Alert.alert('Error', result.error || 'No se pudieron cargar los dispositivos');
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

  // Función para cargar grupos/tipos de usuario
  const loadGroups = async () => {
    if (availableGroups.length > 0) {
      console.log('👥 Grupos ya cargados:', availableGroups.length);
      return; // Ya cargados
    }
    
    setLoadingGroups(true);
    try {
      console.log('👥 Iniciando carga de grupos...');
      const result = await api.getSettings();
      
      console.log('👥 Respuesta de configuración:', result);
      
      if (result.success && result.settings && result.settings.user_types_array) {
        const groups = result.settings.user_types_array.map((type, index) => ({
          id: (index + 1).toString(), // ID numérico para compatibilidad
          name: type,
          title: type.charAt(0).toUpperCase() + type.slice(1), // Capitalizar primera letra
          description: `Grupo de tipo ${type}`,
          type: 'user_type'
        }));
        
        setAvailableGroups(groups);
        console.log('✅ Grupos cargados exitosamente:', groups);
      } else {
        console.error('❌ Error en respuesta de configuración:', result);
        Alert.alert('Error', result.error || 'No se pudieron cargar los tipos de usuario');
      }
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
      Alert.alert('Error', 'Error al cargar la lista de tipos de usuario');
    } finally {
      setLoadingGroups(false);
    }
  };

  // Función para manejar selección de grupos (selección única)
  const toggleGroupSelection = (groupId) => {
    // Solo permite seleccionar un grupo a la vez
    setSelectedGroups([groupId]);
  };

  // Función para aplicar selección de grupos (selección única)
  const applyGroupSelection = () => {
    // Como es selección única, tomar solo el primer elemento
    const groupId = selectedGroups.length > 0 ? selectedGroups[0] : '';
    handleInputChange('groups', groupId);
    setShowGroupSelector(false);
  };

  // Funciones para el selector de fecha
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpenDatePicker = () => {
    // Si ya hay una fecha seleccionada, usarla como base
    if (formData.expirationDate) {
      const parts = formData.expirationDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Los meses van de 0-11
        const year = parseInt(parts[2]);
        const existingDate = new Date(year, month, day);
        if (!isNaN(existingDate.getTime())) {
          setSelectedDate(existingDate);
        }
      }
    }
    setShowDatePicker(true);
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    const formattedDate = formatDate(date);
    handleInputChange('expirationDate', formattedDate);
    
    // En web, cerrar inmediatamente
    if (Platform.OS === 'web') {
      setShowDatePicker(false);
    }
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleConfirmDate = () => {
    const formattedDate = formatDate(selectedDate);
    handleInputChange('expirationDate', formattedDate);
    setShowDatePicker(false);
  };

  // Funciones para el selector de nacionalidad
  const handleOpenNationalitySelector = () => {
    setShowNationalitySelector(true);
  };

  const handleSelectNationality = (nationality) => {
    setSelectedNationality(nationality.name);
    setSelectedNationalityFlag(nationality.flag);
    handleInputChange('nationality', nationality.name);
    setShowNationalitySelector(false);
  };

  const handleCloseNationalitySelector = () => {
    setShowNationalitySelector(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleTypeSelection = (type) => {
    setUserType(type);
    setFormData(prev => ({ ...prev, role: type.id }));
    setStep('form');
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

  // Cargar grupos cuando se abre el selector
  const handleOpenGroupSelector = async () => {
    await loadGroups();
    
    // Preseleccionar grupos si ya hay algunos en el formulario
    if (formData.groups) {
      const currentGroups = formData.groups.split(',').map(id => id.trim()).filter(id => id);
      setSelectedGroups(currentGroups);
    }
    
    setShowGroupSelector(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    console.log('🔍 Validando formulario...');
    console.log('📋 FormData para validación:', {
      doc_id: formData.doc_id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      picture: formData.picture ? 'SI' : 'NO',
      username: formData.username,
      password: formData.password ? 'SI' : 'NO',
      email: formData.email,
      userType: userType,
    });
    
    if (!formData.doc_id.trim()) {
      console.log('❌ Falta doc_id');
      const message = 'El número de documento es obligatorio';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    if (!formData.first_name.trim()) {
      console.log('❌ Falta first_name');
      const message = 'El nombre es obligatorio';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    if (!formData.last_name.trim()) {
      console.log('❌ Falta last_name');
      const message = 'El apellido es obligatorio';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    if (!formData.role) {
      console.log('❌ Falta role');
      const message = 'El rol del usuario es obligatorio';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    // Picture es obligatorio según la documentación de la API
    if (!formData.picture) {
      console.log('❌ Falta picture');
      if (Platform.OS === 'web') {
        // En web, usar window.alert como fallback
        window.alert('Error: La fotografía es obligatoria para crear un usuario');
      } else {
        Alert.alert('Error', 'La fotografía es obligatoria para crear un usuario');
      }
      return false;
    }
    if (userType?.needsAuth && !formData.username.trim()) {
      console.log('❌ Falta username para tipo que necesita auth');
      const message = 'El nombre de usuario es obligatorio para este tipo de perfil';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    if (userType?.needsAuth && !formData.password.trim()) {
      console.log('❌ Falta password para tipo que necesita auth');
      const message = 'La contraseña es obligatoria para este tipo de perfil';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      console.log('❌ Email inválido');
      const message = 'Por favor ingresa un email válido';
      Platform.OS === 'web' ? window.alert(`Error: ${message}`) : Alert.alert('Error', message);
      return false;
    }
    console.log('✅ Validación completa exitosa');
    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit iniciado');
    console.log('📋 FormData actual:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validación falló');
      return;
    }
    
    console.log('✅ Validación pasó, iniciando creación');
    setLoading(true);
    try {
      // Preparar los datos según la documentación de la API
      const userData = {
        doc_id: formData.doc_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        picture: formData.picture, // Obligatorio
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

      // Si se seleccionó un grupo, necesitamos enviarlo como user_type
      if (formData.groups && formData.groups.trim()) {
        // Buscar el nombre del grupo por ID
        const selectedGroupId = formData.groups.trim();
        const selectedGroup = availableGroups.find(group => group.id === selectedGroupId);
        if (selectedGroup) {
          userData.user_type = selectedGroup.name; // Enviar el nombre del grupo como user_type
          console.log('📤 Enviando user_type:', selectedGroup.name, 'desde grupo ID:', selectedGroupId);
        }
      }

      if (formData.pin && formData.pin.trim()) {
        userData.pin = formData.pin.trim();
      }

      if (formData.nationality && formData.nationality.trim()) {
        userData.nationality = formData.nationality.trim();
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

      // Campos de autenticación - solo para roles que los necesitan
      if (userType?.needsAuth) {
        if (formData.username && formData.username.trim()) {
          userData.username = formData.username.trim();
        }
        if (formData.password && formData.password.trim()) {
          userData.password = formData.password.trim();
        }
      }

      console.log('📤 Creando usuario con datos:', {
        ...userData,
        picture: userData.picture ? `[base64 image - ${userData.picture.length} chars]` : null
      });
      
      const result = await api.saveUser(userData);
      
      console.log('📥 Respuesta del servidor:', result);
      
      if (result.id && (result.result === 'created' || result.result === 'updated')) {
        // Mostrar mensaje de éxito y cerrar automáticamente
        Alert.alert(
          'Éxito',
          `Usuario ${result.result === 'created' ? 'creado' : 'actualizado'} correctamente`,
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
        handleClose();
        onUserCreated?.();
      } else {
        throw new Error(result.error || 'Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      
      // Manejar errores específicos de la API según la documentación
      let errorMessage = 'No se pudo crear el usuario';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Errores específicos según la documentación
      if (error.response?.data?.code) {
        const code = error.response.data.code;
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
      setLoading(false);
    }
  };

  // Compresión de imágenes específica para web (copiada del código que funciona)
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

  // Compresión de imágenes adaptada del código que funciona
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
    console.log('=== INICIANDO CAPTURA DE FOTO ===');
    console.log('Platform.OS:', Platform.OS);
    console.log('CameraView disponible:', !!CameraView);
    console.log('ImagePicker disponible:', !!ImagePicker);

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
          'Para usar la cámara, instala las dependencias:\n\nnpx expo install expo-camera expo-image-picker expo-image-manipulator'
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
      
      // Usar la misma lógica que en el código que funciona
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      
      console.log('Foto tomada:', photo);
      console.log('Photo URI:', photo.uri);
      console.log('Photo width:', photo.width, 'height:', photo.height);
      
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
                  {step === 'type-selection' ? 'Nuevo Usuario' : `Crear ${userType?.title}`}
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

            {step === 'type-selection' && (
              <UserTypeSelector 
                userTypes={userTypes} 
                onTypeSelect={handleTypeSelection} 
              />
            )}
            {step === 'form' && (
              <AdaptiveUserForm 
                userType={userType}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                handleTakePhoto={handleTakePhoto}
                handlePickImage={handlePickImage}
                setFormData={setFormData}
                setStep={setStep}
                loading={loading}
                handleOpenDeviceSelector={handleOpenDeviceSelector}
                handleOpenGroupSelector={handleOpenGroupSelector}
                handleOpenDatePicker={handleOpenDatePicker}
                handleOpenNationalitySelector={handleOpenNationalitySelector}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de cámara - Solo se renderiza si está disponible */}
      <CameraModal 
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        cameraRef={cameraRef}
        takePicture={takePictureWithCamera}
      />

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
        // Agregar estas propiedades para mejorar la visibilidad
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          // Agregar zIndex alto para asegurar visibilidad
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white, // Cambiar a blanco sólido
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80%',
            ...shadows.lg,
            // Agregar elevación para Android
            elevation: 10,
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
                onPress={() => {
                  console.log('🔧 Cerrando selector de dispositivos');
                  setShowDeviceSelector(false);
                }}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Debug info - temporal para verificar que se carga */}
            {__DEV__ && (
              <View style={{
                backgroundColor: colors.extended.blue + '10',
                padding: spacing.sm,
                margin: spacing.sm,
                borderRadius: borderRadius.md,
              }}>
                <Text style={{ fontSize: 12, color: colors.extended.blue }}>
                  Debug: Modal visible={showDeviceSelector.toString()} | 
                  Devices: {devices.length} | 
                  Loading: {loadingDevices.toString()}
                </Text>
              </View>
            )}

            {/* Content */}
            <ScrollView 
              style={{ 
                padding: spacing.lg, 
                maxHeight: 400,
                backgroundColor: colors.white, // Asegurar fondo blanco
              }}
              showsVerticalScrollIndicator={true}
            >
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
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  }}>
                    Verifica la conexión o contacta al administrador
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.md,
                    textAlign: 'center',
                  }}>
                    Selecciona los dispositivos donde este usuario tendrá acceso
                  </Text>
                  
                  {devices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      onPress={() => {
                        console.log('🔧 Toggle dispositivo:', device.id, device.name);
                        toggleDeviceSelection(device.id.toString());
                      }}
                      style={{
                        backgroundColor: selectedDevices.includes(device.id.toString()) 
                          ? colors.primary.purple + '10' 
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
                        // Agregar sombra para mejor visibilidad
                        ...shadows.sm,
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
                          {device.name || `Dispositivo ${device.id}`}
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
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          <Text style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.text.secondary,
                            fontWeight: typography.fontWeight.medium,
                          }}>
                            ID: {device.id}
                          </Text>
                          {device.location && (
                            <Text style={{
                              fontSize: typography.fontSize.xs,
                              color: colors.text.secondary,
                              marginLeft: spacing.sm,
                            }}>
                              📍 {device.location}
                            </Text>
                          )}
                          {device.status && (
                            <Text style={{
                              fontSize: typography.fontSize.xs,
                              color: device.status === 'active' ? colors.success : colors.error,
                              marginLeft: spacing.sm,
                            }}>
                              ● {device.status}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      {selectedDevices.includes(device.id.toString()) && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary.purple} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.background.light,
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: colors.white,
            }}>
              <TouchableOpacity
                onPress={() => {
                  console.log('🔧 Cancelando selección de dispositivos');
                  setShowDeviceSelector(false);
                }}
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
                  console.log('🔧 Aplicando selección:', selectedDevices);
                  applyDeviceSelection();
                }}
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

      {/* Modal de Selector de Grupos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGroupSelector}
        onRequestClose={() => setShowGroupSelector(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80%',
            ...shadows.lg,
            elevation: 10,
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
                Seleccionar Grupos
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  console.log('👥 Cerrando selector de grupos');
                  setShowGroupSelector(false);
                }}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Debug info - temporal para verificar que se carga */}
            {__DEV__ && (
              <View style={{
                backgroundColor: colors.extended.blue + '10',
                padding: spacing.sm,
                margin: spacing.sm,
                borderRadius: borderRadius.md,
              }}>
                <Text style={{ fontSize: 12, color: colors.extended.blue }}>
                  Debug: Modal visible={showGroupSelector.toString()} | 
                  Groups: {availableGroups.length} | 
                  Loading: {loadingGroups.toString()}
                </Text>
              </View>
            )}

            {/* Content */}
            <ScrollView 
              style={{ 
                padding: spacing.lg, 
                maxHeight: 400,
                backgroundColor: colors.white,
              }}
              showsVerticalScrollIndicator={true}
            >
              {loadingGroups ? (
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
                    Cargando tipos de usuario...
                  </Text>
                </View>
              ) : availableGroups.length === 0 ? (
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: spacing.xl,
                }}>
                  <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginTop: spacing.md,
                    textAlign: 'center',
                  }}>
                    No hay tipos de usuario disponibles
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  }}>
                    Verifica la configuración del sistema
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.md,
                    textAlign: 'center',
                  }}>
                    Selecciona el tipo de usuario para este perfil
                  </Text>
                  
                  {availableGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      onPress={() => {
                        console.log('👥 Toggle grupo:', group.id, group.name);
                        toggleGroupSelection(group.id);
                      }}
                      style={{
                        backgroundColor: selectedGroups.includes(group.id) 
                          ? colors.primary.purple + '10' 
                          : colors.white,
                        borderRadius: borderRadius.lg,
                        borderWidth: 2,
                        borderColor: selectedGroups.includes(group.id) 
                          ? colors.primary.purple 
                          : colors.background.light,
                        padding: spacing.md,
                        marginBottom: spacing.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        ...shadows.sm,
                      }}
                    >
                      <View style={{
                        backgroundColor: selectedGroups.includes(group.id) 
                          ? colors.primary.purple 
                          : colors.background.light,
                        borderRadius: borderRadius.full,
                        padding: spacing.sm,
                        marginRight: spacing.md,
                      }}>
                        <Ionicons 
                          name="people" 
                          size={24} 
                          color={selectedGroups.includes(group.id) 
                            ? colors.white 
                            : colors.text.secondary
                          } 
                        />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.bold,
                          color: selectedGroups.includes(group.id) 
                            ? colors.primary.purple 
                            : colors.text.primary,
                          marginBottom: spacing.xs,
                        }}>
                          {group.title}
                        </Text>
                        
                        <Text style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary,
                          marginBottom: spacing.xs,
                        }}>
                          {group.description}
                        </Text>
                        
                        <Text style={{
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                          fontWeight: typography.fontWeight.medium,
                        }}>
                          ID: {group.id} • Tipo: {group.name}
                        </Text>
                      </View>
                      
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selectedGroups.includes(group.id) 
                          ? colors.primary.purple 
                          : colors.background.light,
                        backgroundColor: selectedGroups.includes(group.id) 
                          ? colors.primary.purple 
                          : colors.white,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {selectedGroups.includes(group.id) && (
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.white,
                          }} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.background.light,
              flexDirection: 'row',
              justifyContent: 'space-between',
              backgroundColor: colors.white,
            }}>
              <TouchableOpacity
                onPress={() => {
                  console.log('👥 Cancelando selección de grupos');
                  setShowGroupSelector(false);
                }}
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
                  console.log('👥 Aplicando selección:', selectedGroups);
                  applyGroupSelection();
                }}
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
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Selector de Fecha */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={handleCloseDatePicker}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 400,
            ...shadows.lg,
            elevation: 10,
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
                Seleccionar Fecha
              </Text>
              
              <TouchableOpacity
                onPress={handleCloseDatePicker}
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
            <View style={{ padding: spacing.lg }}>
              {Platform.OS === 'web' ? (
                /* Selector web nativo */
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de expiración
                  </Text>
                  
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      handleDateSelection(newDate);
                    }}
                    style={{
                      padding: spacing.md,
                      borderRadius: borderRadius.lg,
                      border: `1px solid ${colors.background.light}`,
                      fontSize: typography.fontSize.base,
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  />
                </View>
              ) : (
                /* Selector móvil con controles personalizados */
                <View>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de expiración
                  </Text>
                  
                  {/* Selector de año */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Año
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setFullYear(selectedDate.getFullYear() - 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginHorizontal: spacing.xl,
                        minWidth: 80,
                        textAlign: 'center',
                      }}>
                        {selectedDate.getFullYear()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setFullYear(selectedDate.getFullYear() + 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Selector de mes */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Mes
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(selectedDate.getMonth() - 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginHorizontal: spacing.xl,
                        minWidth: 120,
                        textAlign: 'center',
                      }}>
                        {selectedDate.toLocaleDateString('es-ES', { month: 'long' })}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(selectedDate.getMonth() + 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Selector de día */}
                  <View style={{ marginBottom: spacing.lg }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Día
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(selectedDate.getDate() - 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginHorizontal: spacing.xl,
                        minWidth: 60,
                        textAlign: 'center',
                      }}>
                        {selectedDate.getDate()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(selectedDate.getDate() + 1);
                          setSelectedDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.primary.purple + '20',
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.primary.purple} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Fecha seleccionada preview */}
                  <View style={{
                    backgroundColor: colors.primary.purple + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      color: colors.primary.purple,
                      fontWeight: typography.fontWeight.medium,
                    }}>
                      Fecha seleccionada: {formatDate(selectedDate)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Footer - Solo para móvil */}
            {Platform.OS !== 'web' && (
              <View style={{
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.background.light,
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: colors.white,
              }}>
                <TouchableOpacity
                  onPress={handleCloseDatePicker}
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
                  onPress={handleConfirmDate}
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
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Selector de Nacionalidad */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNationalitySelector}
        onRequestClose={handleCloseNationalitySelector}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80%',
            ...shadows.lg,
            elevation: 10,
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
                Seleccionar Nacionalidad
              </Text>
              
              <TouchableOpacity
                onPress={handleCloseNationalitySelector}
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
            <ScrollView 
              style={{ 
                padding: spacing.lg, 
                maxHeight: 400,
                backgroundColor: colors.white,
              }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.md,
                textAlign: 'center',
              }}>
                Selecciona la nacionalidad del continente americano
              </Text>
              
              {americanNationalities.map((nationality) => (
                <TouchableOpacity
                  key={nationality.id}
                  onPress={() => handleSelectNationality(nationality)}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.background.light,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...shadows.sm,
                  }}
                >
                  <Text style={{
                    fontSize: 28,
                    marginRight: spacing.md,
                  }}>
                    {nationality.flag}
                  </Text>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}>
                      {nationality.name}
                    </Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.background.light,
              backgroundColor: colors.white,
            }}>
              <TouchableOpacity
                onPress={handleCloseNationalitySelector}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
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
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CreateUserModal;
