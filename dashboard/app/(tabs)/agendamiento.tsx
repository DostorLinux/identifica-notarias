import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import api from '../api/IdentificaAPI';

// ISO 6346 Container Number Validation
const validateContainerNumber = (containerNumber: string): { isValid: boolean; message?: string } => {
  if (!containerNumber) {
    return { isValid: false, message: 'El número de contenedor es requerido' };
  }

  // Remove spaces and convert to uppercase
  const cleanNumber = containerNumber.replace(/\s/g, '').toUpperCase();
  
  // Check total length (11 characters)
  if (cleanNumber.length !== 11) {
    return { isValid: false, message: 'El número de contenedor debe tener 11 caracteres (ABCD1234567)' };
  }

  // Check first 4 characters are letters (Owner Code)
  const ownerCode = cleanNumber.substring(0, 4);
  if (!/^[A-Z]{4}$/.test(ownerCode)) {
    return { isValid: false, message: 'Los primeros 4 caracteres deben ser letras (código del propietario)' };
  }

  // Check 5th character is category identifier (U, J, Z)
  const categoryId = cleanNumber.charAt(4);
  if (!['U', 'J', 'Z'].includes(categoryId)) {
    return { isValid: false, message: 'El 5º carácter debe ser U, J o Z (identificador de categoría)' };
  }

  // Check next 6 characters are digits (Serial Number)
  const serialNumber = cleanNumber.substring(5, 11);
  if (!/^\d{6}$/.test(serialNumber)) {
    return { isValid: false, message: 'Los caracteres 6-11 deben ser dígitos (número de serie)' };
  }

  // Validate check digit using ISO 6346 algorithm
  const checkDigitIsValid = validateCheckDigit(cleanNumber);
  if (!checkDigitIsValid) {
    return { isValid: false, message: 'El dígito de verificación no es válido según ISO 6346' };
  }

  return { isValid: true };
};

const validateCheckDigit = (containerNumber: string): boolean => {
  // ISO 6346 check digit calculation
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letterValues: { [key: string]: number } = {};
  
  // Assign values to letters (A=10, B=12, C=13, ..., but skip 11)
  let value = 10;
  for (let i = 0; i < 26; i++) {
    letterValues[alphabet[i]] = value;
    value++;
    if (value === 11) value = 12; // Skip 11 as per ISO 6346
  }

  // Calculate weighted sum for first 10 characters
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = containerNumber[i];
    const weight = Math.pow(2, i);
    
    if (i < 4) {
      // Owner code (letters)
      sum += letterValues[char] * weight;
    } else if (i === 4) {
      // Category identifier (letter)
      sum += letterValues[char] * weight;
    } else {
      // Serial number (digits)
      sum += parseInt(char) * weight;
    }
  }

  // Calculate check digit
  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 0 : remainder;
  
  // Compare with the last digit
  const providedCheckDigit = parseInt(containerNumber[10]);
  return checkDigit === providedCheckDigit;
};

const formatContainerNumber = (input: string): string => {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Format as ABCD1234567 (no spaces, but could add formatting if needed)
  if (cleaned.length <= 4) {
    return cleaned;
  } else if (cleaned.length <= 5) {
    return cleaned;
  } else if (cleaned.length <= 11) {
    return cleaned;
  } else {
    // Limit to 11 characters
    return cleaned.substring(0, 11);
  }
};

// Move FormField outside component to prevent re-renders
const FormField = ({ label, value, onChangeText, placeholder, required = false, error = '', success = '', ...props }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={{
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      color: (colors.text?.primary || '#111827'),
      marginBottom: spacing.sm,
    }}>
      {label} {required && <Text style={{ color: colors.error }}>*</Text>}
    </Text>
    
    <TextInput
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: error ? colors.error : success ? colors.success : colors.background.light,
        padding: spacing.md,
        fontSize: typography.fontSize.base,
        color: (colors.text?.primary || '#111827'),
        minHeight: 50,
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={(colors.text?.secondary || '#6b7280')}
      {...props}
    />
    
    {error && (
      <Text style={{
        fontSize: typography.fontSize.sm,
        color: colors.error,
        marginTop: spacing.xs,
        marginLeft: spacing.sm,
      }}>
        {error}
      </Text>
    )}
    
    {success && !error && (
      <Text style={{
        fontSize: typography.fontSize.sm,
        color: colors.success,
        marginTop: spacing.xs,
        marginLeft: spacing.sm,
        fontWeight: typography.fontWeight.medium,
      }}>
        {success}
      </Text>
    )}
  </View>
);

const AgendamientoScreen = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    numeroContenedor: '',
    rutUsuario: '',
    nombreConductor: '',
    apellidoConductor: '',
    patenteVehiculo: '',
    fechaAsignacion: new Date(),
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agendamientos, setAgendamientos] = useState([]);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [containerError, setContainerError] = useState('');
  const [containerSuccess, setContainerSuccess] = useState('');
  const [rutError, setRutError] = useState('');
  const [rutSuccess, setRutSuccess] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    loadAgendamientos();
    
    return () => {
      subscription?.remove();
      // Cleanup search timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const isTabletOrDesktop = screenData.width > 768;

  const loadAgendamientos = async () => {
    try {
      console.log('📅 Cargando agendamientos desde la API...');
      const result = await api.getAppointments({
        page: 1,
        size: 20, // Cargar más registros para la lista
        direction: 'desc',
        column: 'created'
      });
      
      if (result.success && result.appointments) {
        console.log('✅ Agendamientos cargados exitosamente:', result.appointments.length);
        setAgendamientos(result.appointments);
      } else {
        console.error('❌ Error al cargar agendamientos:', result.error);
        // En caso de error, mantener array vacío
        setAgendamientos([]);
      }
    } catch (error) {
      console.error('❌ Error cargando agendamientos:', error);
      // En caso de error, mantener array vacío
      setAgendamientos([]);
    }
  };

  const searchUserByRut = async (rut) => {
    if (!rut || rut.length < 8) return; // Mínimo 8 caracteres para buscar
    
    setIsSearchingUser(true);
    setRutError('');
    setRutSuccess('');
    
    try {
      console.log('🔍 Buscando usuario por RUT:', rut);
      const result = await api.getUserByRut(rut);
      
      if (result.success && result.user) {
        console.log('✅ Usuario encontrado:', result.user);
        
        // Auto-llenar los campos del conductor
        setFormData(prev => ({
          ...prev,
          nombreConductor: result.user.first_name,
          apellidoConductor: result.user.last_name
        }));
        
        // Configurar foto del usuario si existe
        if (result.user.has_photo && result.user.photo_url) {
          setUserPhoto(result.user.photo_url);
        } else {
          setUserPhoto(null);
        }
        
        setRutSuccess(`✓ Conductor encontrado: ${result.user.first_name} ${result.user.last_name}`);
      } else {
        console.log('❌ Usuario no encontrado:', result.error);
        setRutError(result.error || 'No se encontró un conductor con este RUT');
        
        // Limpiar campos del conductor si no se encuentra
        setFormData(prev => ({
          ...prev,
          nombreConductor: '',
          apellidoConductor: ''
        }));
        
        // Limpiar foto
        setUserPhoto(null);
      }
    } catch (error) {
      console.error('❌ Error buscando usuario:', error);
      setRutError('Error al buscar conductor');
      
      // Limpiar campos del conductor en caso de error
      setFormData(prev => ({
        ...prev,
        nombreConductor: '',
        apellidoConductor: ''
      }));
      
      // Limpiar foto
      setUserPhoto(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'numeroContenedor') {
      // Format the container number input
      const formattedValue = formatContainerNumber(value);
      
      // Clear previous messages
      setContainerError('');
      setContainerSuccess('');
      
      // Validate only if user has entered a complete number (11 characters)
      if (formattedValue.length === 11) {
        const validation = validateContainerNumber(formattedValue);
        if (!validation.isValid) {
          setContainerError(validation.message || '');
        } else {
          setContainerSuccess('✓ Número de contenedor válido según ISO 6346');
        }
      } else if (formattedValue.length > 0) {
        // Show format hint while typing
        setContainerError('Formato: 4 letras + 1 letra (U/J/Z) + 6 dígitos (ej: ABCU1234567)');
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else if (field === 'rutUsuario') {
      // Clear previous messages and photo
      setRutError('');
      setRutSuccess('');
      setUserPhoto(null);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout for search (debounce)
      if (value && value.length >= 8) {
        const newTimeout = setTimeout(() => {
          searchUserByRut(value);
        }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
        
        setSearchTimeout(newTimeout);
      } else if (value.length > 0) {
        setRutError('Ingrese al menos 8 caracteres para buscar');
        // Limpiar campos del conductor si el RUT es muy corto
        setFormData(prev => ({
          ...prev,
          nombreConductor: '',
          apellidoConductor: ''
        }));
      } else {
        // RUT vacío, limpiar campos del conductor
        setFormData(prev => ({
          ...prev,
          nombreConductor: '',
          apellidoConductor: ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const openDatePicker = () => {
    setTempDate(formData.fechaAsignacion);
    // Set current month to the month of the selected date or current month
    const selectedMonth = new Date(formData.fechaAsignacion);
    const today = new Date();
    
    // If selected date is in the past, start from current month
    if (selectedMonth < today) {
      setCurrentMonth(new Date());
    } else {
      setCurrentMonth(selectedMonth);
    }
    
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    setFormData(prev => ({
      ...prev,
      fechaAsignacion: tempDate
    }));
    setShowDatePicker(false);
  };

  const cancelDate = () => {
    setShowDatePicker(false);
  };

  const generateDateOptions = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Generate all days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      
      // Only include dates from today onwards
      if (date >= today) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
    // Don't allow going to months before current month
    const today = new Date();
    if (newMonth.getFullYear() > today.getFullYear() || 
        (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() >= today.getMonth())) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    
    // Allow up to 12 months in the future
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 12);
    
    if (newMonth <= maxDate) {
      setCurrentMonth(newMonth);
    }
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('es-CL', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente':
        return colors.extended?.orange || '#f59e0b';
      case 'En Puerta':
        return colors.extended?.blue || '#3b82f6';
      case 'Gate':
        return colors.primary?.purple || '#8b5cf6';
      case 'Patio':
        return colors.extended?.yellow || '#eab308';
      case 'Salida':
        return colors.success || '#10b981';
      default:
        return colors.text?.secondary || '#6b7280';
    }
  };

  const getStatusSteps = () => {
    return [
      { key: 'Pendiente', label: 'Pendiente' },
      { key: 'En Puerta', label: 'Control acceso entrada' },
      { key: 'Gate', label: 'Gate control' },
      { key: 'Patio', label: 'Stacking - Bodega' },
      { key: 'Salida', label: 'Control Salida' }
    ];
  };

  const getCurrentStatusIndex = (status) => {
    const steps = getStatusSteps();
    return steps.findIndex(step => step.key === status);
  };

  const handleAppointmentPress = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAppointment(null);
  };

  const handleEditAppointment = (appointment) => {
    // Cargar datos del agendamiento directamente en el formulario
    if (appointment) {
      // Parsear la fecha correctamente
      let fechaAsignacion;
      try {
        // Si viene como string "YYYY-MM-DD", parsearlo correctamente
        if (typeof appointment.fechaAsignacion === 'string') {
          fechaAsignacion = new Date(appointment.fechaAsignacion + 'T00:00:00');
        } else {
          fechaAsignacion = new Date(appointment.fechaAsignacion);
        }
        
        // Verificar que la fecha sea válida
        if (isNaN(fechaAsignacion.getTime())) {
          fechaAsignacion = new Date();
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        fechaAsignacion = new Date();
      }
      
      setFormData({
        numeroContenedor: appointment.numeroContenedor,
        rutUsuario: appointment.rutUsuario,
        nombreConductor: appointment.nombreConductor,
        apellidoConductor: appointment.apellidoConductor,
        patenteVehiculo: appointment.patenteVehiculo,
        fechaAsignacion: fechaAsignacion,
      });
      
      // Limpiar mensajes de error/éxito
      setContainerError('');
      setContainerSuccess('');
      setRutError('');
      setRutSuccess('');
      
      // Mostrar mensaje de confirmación
      if (Platform.OS === 'web') {
        alert(`Datos cargados para editar: ${appointment.numeroContenedor}`);
      } else {
        Alert.alert(
          'Editar Agendamiento',
          `Los datos de ${appointment.numeroContenedor} han sido cargados en el formulario para edición.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const validateForm = () => {
    const { numeroContenedor, rutUsuario, nombreConductor, apellidoConductor, patenteVehiculo } = formData;
    
    if (!numeroContenedor.trim()) {
      Alert.alert('Error', 'El número de contenedor es requerido');
      return false;
    }
    
    // Validate container number with ISO 6346
    const containerValidation = validateContainerNumber(numeroContenedor);
    if (!containerValidation.isValid) {
      Alert.alert('Error', containerValidation.message || 'Número de contenedor inválido');
      return false;
    }
    
    if (!rutUsuario.trim()) {
      Alert.alert('Error', 'El RUT del usuario es requerido');
      return false;
    }
    
    if (!nombreConductor.trim()) {
      Alert.alert('Error', 'El nombre del conductor es requerido');
      return false;
    }
    
    if (!apellidoConductor.trim()) {
      Alert.alert('Error', 'El apellido del conductor es requerido');
      return false;
    }
    
    if (!patenteVehiculo.trim()) {
      Alert.alert('Error', 'La patente del vehículo es requerida');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('📅 Guardando agendamiento:', formData);
      
      const result = await api.saveAppointment(formData);
      
      if (result.success) {
        // Recargar la lista de agendamientos
        await loadAgendamientos();
        
        Alert.alert(
          'Éxito', 
          result.message || 'Agendamiento creado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar formulario
                setFormData({
                  numeroContenedor: '',
                  rutUsuario: '',
                  nombreConductor: '',
                  apellidoConductor: '',
                  patenteVehiculo: '',
                  fechaAsignacion: new Date(),
                });
                setContainerError('');
                setContainerSuccess('');
                setRutError('');
                setRutSuccess('');
                setUserPhoto(null);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el agendamiento');
      }
    } catch (error) {
      console.error('❌ Error creando agendamiento:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el agendamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    try {
      // Asegurar que tenemos un objeto Date válido
      let dateObj;
      if (typeof date === 'string') {
        dateObj = new Date(date + 'T00:00:00');
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        dateObj = new Date(date);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return dateObj.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  return (
    <RoleGuard 
      allowedRoles={['admin', 'super_admin', 'empresa']}
      fallbackMessage="Solo los administradores y empresas pueden crear agendamientos. Contacta a tu administrador para obtener los permisos necesarios."
    >
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
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </TouchableOpacity>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.white,
                }}>
                  Agendamiento
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.white,
                  opacity: 0.9,
                  marginTop: spacing.xs,
                }}>
                  Programación de citas y asignaciones
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={{ flex: 1, flexDirection: isTabletOrDesktop ? 'row' : 'column', padding: spacing.lg }}>
          {/* Form Section - 2/3 width on tablets/desktop, full width on mobile */}
          <View style={{
            flex: isTabletOrDesktop ? 2 : 1,
            marginRight: isTabletOrDesktop ? spacing.md : 0,
            marginBottom: !isTabletOrDesktop ? spacing.md : 0,
          }}>
            <ScrollView style={{ flex: 1 }}>
              {/* Form Card */}
              <View style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.xl,
                padding: spacing.xl,
                marginBottom: spacing.lg,
                ...shadows.md,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
                  <View style={{
                    backgroundColor: (colors.primary?.purple || '#8b5cf6') + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.md,
                    marginRight: spacing.md,
                  }}>
                    <Ionicons name="calendar-outline" size={24} color={(colors.primary?.purple || '#8b5cf6')} />
                  </View>
                  
                  <View>
                    <Text style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: (colors.text?.primary || '#111827'),
                    }}>
                      Nuevo Agendamiento
                    </Text>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      color: (colors.text?.secondary || '#6b7280'),
                      marginTop: spacing.xs,
                    }}>
                      Complete los datos requeridos
                    </Text>
                  </View>
                </View>

                <FormField
                  label="Número de Contenedor"
                  value={formData.numeroContenedor}
                  onChangeText={(value) => handleInputChange('numeroContenedor', value)}
                  placeholder="Ej: ABCU1234567"
                  required
                  autoCapitalize="characters"
                  maxLength={11}
                  error={containerError}
                  success={containerSuccess}
                />

                <FormField
                  label={isSearchingUser ? "RUT del Usuario (buscando...)" : "RUT del Usuario"}
                  value={formData.rutUsuario}
                  onChangeText={(value) => handleInputChange('rutUsuario', value)}
                  placeholder="Ej: 12345678-9"
                  required
                  error={rutError}
                  success={rutSuccess}
                />

                {/* Foto del Usuario */}
                {userPhoto && (
                  <View style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: colors.white,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.success || '#10b981',
                    }}>
                      <Text style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: (colors.text?.primary || '#111827'),
                        marginBottom: spacing.sm,
                      }}>
                        Foto del Conductor
                      </Text>
                      
                      <View style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        overflow: 'hidden',
                        borderWidth: 3,
                        borderColor: colors.success || '#10b981',
                      }}>
                        <Image
                          source={{ 
                            uri: api.buildUrl(userPhoto, false)
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          onError={(error) => {
                            console.log('Error cargando imagen:', error);
                            setUserPhoto(null);
                          }}
                        />
                      </View>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.success || '#10b981',
                        marginTop: spacing.sm,
                        fontWeight: typography.fontWeight.medium,
                      }}>
                        ✓ Conductor verificado
                      </Text>
                    </View>
                  </View>
                )}

                <FormField
                  label="Nombre del Conductor"
                  value={formData.nombreConductor}
                  onChangeText={(value) => handleInputChange('nombreConductor', value)}
                  placeholder="Ej: Juan"
                  required
                  autoCapitalize="words"
                />

                <FormField
                  label="Apellido del Conductor"
                  value={formData.apellidoConductor}
                  onChangeText={(value) => handleInputChange('apellidoConductor', value)}
                  placeholder="Ej: Pérez"
                  required
                  autoCapitalize="words"
                />

                <FormField
                  label="Patente del Vehículo"
                  value={formData.patenteVehiculo}
                  onChangeText={(value) => handleInputChange('patenteVehiculo', value)}
                  placeholder="Ej: ABCD12"
                  required
                  autoCapitalize="characters"
                />

                {/* Fecha de Asignación */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: (colors.text?.primary || '#111827'),
                    marginBottom: spacing.sm,
                  }}>
                    Fecha de Asignación <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  
                  <TouchableOpacity
                    onPress={openDatePicker}
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
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      color: (colors.text?.primary || '#111827'),
                    }}>
                      {formatDate(formData.fechaAsignacion)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={(colors.text?.secondary || '#6b7280')} />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting ? (colors.text?.secondary || '#6b7280') : (colors.primary?.purple || '#8b5cf6'),
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    alignItems: 'center',
                    ...shadows.sm,
                  }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.white,
                  }}>
                    {isSubmitting ? 'Creando...' : 'Crear Agendamiento'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Info Card */}
              <View style={{
                backgroundColor: (colors.extended?.blue || '#3b82f6') + '10',
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: (colors.extended?.blue || '#3b82f6') + '20',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.extended?.blue || '#3b82f6'} />
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.extended?.blue || '#3b82f6',
                    marginLeft: spacing.sm,
                  }}>
                    Información
                  </Text>
                </View>
                
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.extended?.blue || '#3b82f6',
                  lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
                }}>
                  Todos los campos marcados con (*) son obligatorios. El agendamiento será registrado para la fecha seleccionada y podrá ser consultado posteriormente.
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Sidebar - 1/3 width on tablets/desktop, show only on larger screens */}
          {isTabletOrDesktop && (
            <View style={{
              flex: 1,
              maxWidth: '33%',
              marginLeft: spacing.md,
            }}>
              <ScrollView style={{ flex: 1 }}>
                {/* Mis Agendamientos Card */}
                <View style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  padding: spacing.lg,
                  ...shadows.md,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                    <View style={{
                      backgroundColor: (colors.primary?.green || '#10b981') + '20',
                      borderRadius: borderRadius.full,
                      padding: spacing.sm,
                      marginRight: spacing.md,
                    }}>
                      <Ionicons name="list-outline" size={20} color={(colors.primary?.green || '#10b981')} />
                    </View>
                    <Text style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: (colors.text?.primary || '#111827'),
                    }}>
                      {user?.role === 'empresa' ? 'Mis Agendamientos' : 'Todos los Agendamientos'}
                    </Text>
                  </View>

                  {agendamientos.length > 0 ? (
                    <View>
                      {agendamientos.slice(0, 5).map((agendamiento, index) => {
                        const currentStatusIndex = getCurrentStatusIndex(agendamiento.status);
                        const statusSteps = getStatusSteps();
                        
                        return (
                        <View
                          key={agendamiento.id}
                          style={{
                            backgroundColor: colors.background.light,
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                            marginBottom: spacing.sm,
                            borderLeftWidth: 4,
                            borderLeftColor: getStatusColor(agendamiento.status),
                          }}
                        >
                          {/* Header con botones */}
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: spacing.xs,
                          }}>
                            <TouchableOpacity
                              onPress={() => handleAppointmentPress(agendamiento)}
                              style={{ flex: 1 }}
                            >
                              <Text style={{
                                fontSize: typography.fontSize.sm,
                                fontWeight: typography.fontWeight.bold,
                                color: (colors.primary?.purple || '#8b5cf6'),
                                textDecorationLine: 'underline',
                              }}>
                                {agendamiento.numeroContenedor}
                              </Text>
                            </TouchableOpacity>
                            
                            {agendamiento.status === 'Pendiente' && (
                              <TouchableOpacity
                                onPress={() => handleEditAppointment(agendamiento)}
                                style={{
                                  backgroundColor: (colors.primary?.purple || '#8b5cf6'),
                                  borderRadius: borderRadius.sm,
                                  paddingHorizontal: spacing.sm,
                                  paddingVertical: spacing.xs,
                                  marginLeft: spacing.sm,
                                }}
                              >
                                <Text style={{
                                  fontSize: typography.fontSize.xs,
                                  color: colors.white,
                                  fontWeight: typography.fontWeight.medium,
                                }}>
                                  Editar
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <Text style={{
                            fontSize: typography.fontSize.xs,
                            color: (colors.text?.secondary || '#6b7280'),
                            marginBottom: spacing.xs,
                          }}>
                            {agendamiento.nombreConductor} {agendamiento.apellidoConductor}
                          </Text>
                          <Text style={{
                            fontSize: typography.fontSize.xs,
                            color: (colors.text?.secondary || '#6b7280'),
                            marginBottom: spacing.sm,
                          }}>
                            {formatDate(agendamiento.fechaAsignacion)}
                          </Text>
                          
                          {/* Status Progress Bar */}
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: spacing.xs,
                          }}>
                            {statusSteps.map((step, stepIndex) => {
                              const isCompleted = stepIndex <= currentStatusIndex;
                              const isCurrent = stepIndex === currentStatusIndex;
                              
                              return (
                                <View key={step.key} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                  <View style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: isCompleted 
                                      ? getStatusColor(step.key)
                                      : (colors.text?.disabled || '#9ca3af'),
                                    opacity: isCurrent ? 1 : 0.7,
                                  }} />
                                  {stepIndex < statusSteps.length - 1 && (
                                    <View style={{
                                      flex: 1,
                                      height: 1,
                                      backgroundColor: stepIndex < currentStatusIndex 
                                        ? getStatusColor(agendamiento.status)
                                        : (colors.text?.disabled || '#9ca3af'),
                                      marginHorizontal: 2,
                                      opacity: 0.5,
                                    }} />
                                  )}
                                </View>
                              );
                            })}
                          </View>
                          
                          <View style={{
                            backgroundColor: getStatusColor(agendamiento.status) + '20',
                            borderRadius: borderRadius.sm,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            alignSelf: 'flex-start',
                          }}>
                            <Text style={{
                              fontSize: typography.fontSize.xs,
                              color: getStatusColor(agendamiento.status),
                              fontWeight: typography.fontWeight.medium,
                            }}>
                              {agendamiento.status}
                            </Text>
                          </View>
                        </View>
                        );
                      })}
                      
                      {agendamientos.length > 5 && (
                        <Text style={{
                          fontSize: typography.fontSize.xs,
                          color: (colors.text?.secondary || '#6b7280'),
                          textAlign: 'center',
                          marginTop: spacing.sm,
                          fontStyle: 'italic',
                        }}>
                          +{agendamientos.length - 5} más...
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: spacing.lg,
                    }}>
                      <Ionicons name="calendar-outline" size={32} color={(colors.text?.secondary || '#6b7280')} />
                      <Text style={{
                        fontSize: typography.fontSize.sm,
                        color: (colors.text?.secondary || '#6b7280'),
                        marginTop: spacing.sm,
                        textAlign: 'center',
                      }}>
                        No tienes agendamientos aún
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={cancelDate}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              width: '90%',
              maxWidth: 400,
              maxHeight: '70%',
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
                  Seleccionar Fecha
                </Text>
                
                <TouchableOpacity
                  onPress={cancelDate}
                  style={{
                    backgroundColor: colors.white + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.white} />
                </TouchableOpacity>
              </LinearGradient>

              {/* Month Navigation */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.background.light,
              }}>
                <TouchableOpacity
                  onPress={goToPreviousMonth}
                  style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color={(colors.text?.primary || '#111827')} />
                </TouchableOpacity>

                <Text style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: (colors.text?.primary || '#111827'),
                  textTransform: 'capitalize',
                }}>
                  {formatMonth(currentMonth)}
                </Text>

                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color={(colors.text?.primary || '#111827')} />
                </TouchableOpacity>
              </View>

              {/* Date Options */}
              <ScrollView style={{ 
                maxHeight: 300,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}>
                {generateDateOptions().length === 0 ? (
                  <View style={{
                    alignItems: 'center',
                    paddingVertical: spacing.xl,
                  }}>
                    <Ionicons name="calendar-outline" size={48} color={(colors.text?.secondary || '#6b7280')} />
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      color: (colors.text?.secondary || '#6b7280'),
                      marginTop: spacing.md,
                      textAlign: 'center',
                    }}>
                      No hay fechas disponibles en este mes.{'\n'}
                      Navega a un mes futuro.
                    </Text>
                  </View>
                ) : (
                  generateDateOptions().map((date, index) => {
                  const isSelected = formatDate(date) === formatDate(tempDate);
                  const isToday = formatDate(date) === formatDate(new Date());
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setTempDate(date)}
                      style={{
                        backgroundColor: isSelected ? (colors.primary?.purple || '#8b5cf6') + '10' : 'transparent',
                        borderRadius: borderRadius.lg,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? (colors.primary?.purple || '#8b5cf6') : colors.background.light,
                      }}
                    >
                      <View>
                        <Text style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.medium,
                          color: isSelected ? (colors.primary?.purple || '#8b5cf6') : (colors.text?.primary || '#111827'),
                        }}>
                          {formatDate(date)}
                        </Text>
                        
                        {isToday && (
                          <Text style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.success,
                            marginTop: spacing.xs,
                          }}>
                            Hoy
                          </Text>
                        )}
                        
                        <Text style={{
                          fontSize: typography.fontSize.sm,
                          color: (colors.text?.secondary || '#6b7280'),
                          marginTop: spacing.xs,
                        }}>
                          {date.toLocaleDateString('es-CL', { weekday: 'long' })}
                        </Text>
                      </View>
                      
                      {isSelected && (
                        <View style={{
                          backgroundColor: (colors.primary?.purple || '#8b5cf6'),
                          borderRadius: borderRadius.full,
                          padding: spacing.xs,
                        }}>
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                  })
                )}
              </ScrollView>

              {/* Footer */}
              <View style={{
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.background.light,
                flexDirection: 'row',
                gap: spacing.md,
              }}>
                <TouchableOpacity
                  onPress={cancelDate}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: (colors.text?.primary || '#111827'),
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={confirmDate}
                  style={{
                    flex: 1,
                    backgroundColor: (colors.primary?.purple || '#8b5cf6'),
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
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
            </View>
          </View>
        </Modal>

        {/* Simple Detail Modal */}
        <Modal
          visible={showDetailModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDetailModal}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
          }}>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90%',
            }}>
              {/* Header */}
              <View style={{
                backgroundColor: (colors.primary?.purple || '#8b5cf6'),
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                padding: spacing.lg,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.white,
                }}>
                  Detalle del Agendamiento
                </Text>
                
                <TouchableOpacity
                  onPress={closeDetailModal}
                  style={{
                    backgroundColor: colors.white + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>

              {selectedAppointment && (
                <ScrollView style={{ padding: spacing.lg }}>
                  {/* Container Info */}
                  <View style={{
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: (colors.text?.primary || '#111827'),
                      marginBottom: spacing.md,
                    }}>
                      {selectedAppointment.numeroContenedor}
                    </Text>
                    
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: typography.fontSize.sm, color: (colors.text?.secondary || '#6b7280') }}>
                        Conductor: <Text style={{ color: (colors.text?.primary || '#111827'), fontWeight: typography.fontWeight.medium }}>
                          {selectedAppointment.nombreConductor} {selectedAppointment.apellidoConductor}
                        </Text>
                      </Text>
                    </View>
                    
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: typography.fontSize.sm, color: (colors.text?.secondary || '#6b7280') }}>
                        RUT: <Text style={{ color: (colors.text?.primary || '#111827'), fontWeight: typography.fontWeight.medium }}>
                          {selectedAppointment.rutUsuario}
                        </Text>
                      </Text>
                    </View>
                    
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: typography.fontSize.sm, color: (colors.text?.secondary || '#6b7280') }}>
                        Patente: <Text style={{ color: (colors.text?.primary || '#111827'), fontWeight: typography.fontWeight.medium }}>
                          {selectedAppointment.patenteVehiculo}
                        </Text>
                      </Text>
                    </View>
                    
                    <View>
                      <Text style={{ fontSize: typography.fontSize.sm, color: (colors.text?.secondary || '#6b7280') }}>
                        Fecha: <Text style={{ color: (colors.text?.primary || '#111827'), fontWeight: typography.fontWeight.medium }}>
                          {formatDate(selectedAppointment.fechaAsignacion)}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Status Timeline */}
                  <View style={{
                    backgroundColor: colors.white,
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.background.light,
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: (colors.text?.primary || '#111827'),
                      marginBottom: spacing.lg,
                    }}>
                      Proceso de Estados
                    </Text>
                    
                    {getStatusSteps().map((step, index) => {
                      const currentStatusIndex = getCurrentStatusIndex(selectedAppointment.status);
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      
                      return (
                        <View key={step.key} style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          marginBottom: index < getStatusSteps().length - 1 ? spacing.md : 0
                        }}>
                          <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: isCompleted 
                              ? getStatusColor(step.key)
                              : (colors.text?.disabled || '#9ca3af'),
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: spacing.md,
                          }}>
                            {isCompleted && (
                              <Ionicons 
                                name={isCurrent ? "time" : "checkmark"} 
                                size={12} 
                                color={colors.white} 
                              />
                            )}
                          </View>
                          
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: typography.fontSize.base,
                              fontWeight: isCurrent ? typography.fontWeight.bold : typography.fontWeight.medium,
                              color: isCompleted ? (colors.text?.primary || '#111827') : (colors.text?.secondary || '#6b7280'),
                            }}>
                              {step.label}
                            </Text>
                            
                            {isCurrent && (
                              <Text style={{
                                fontSize: typography.fontSize.sm,
                                color: getStatusColor(step.key),
                                marginTop: spacing.xs,
                              }}>
                                Estado actual
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* Footer */}
              <View style={{
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.background.light,
                flexDirection: 'row',
                gap: spacing.md,
              }}>
                <TouchableOpacity
                  onPress={closeDetailModal}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background.light,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: (colors.text?.primary || '#111827'),
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
                
                {selectedAppointment?.status === 'Pendiente' && (
                  <TouchableOpacity
                    onPress={() => {
                      handleEditAppointment(selectedAppointment);
                      closeDetailModal();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: (colors.primary?.purple || '#8b5cf6'),
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      color: colors.white,
                      fontWeight: typography.fontWeight.bold,
                    }}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default AgendamientoScreen;