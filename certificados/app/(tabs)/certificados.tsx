import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useAuthAPI } from '../../hooks/useAuthAPI';
import { generateCertificatePDF } from '../../services/certificateService';

const CertificadosScreen = () => {
  const { isAuthenticated, currentUser, logout, isLoading } = useAuth();
  const { authAPI } = useAuthAPI();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [biometricRecords, setBiometricRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordStats, setRecordStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [searchRut, setSearchRut] = useState('');
  const [searchAuditNumber, setSearchAuditNumber] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Configuración de paginación
  const PAGE_SIZE = 10;

  const loadBiometricRecords = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando registros biométricos...');
      
      // Priorizar registros del servidor si está autenticado
      let finalRecords = [];
      
      if (isAuthenticated) {
        try {
          console.log('🔐 Usuario autenticado, cargando desde servidor...');
          const serverRecords = await loadServerBiometricRecords();
          console.log('📊 Registros del servidor obtenidos:', serverRecords.length);
          
          if (serverRecords.length > 0) {
            finalRecords = serverRecords;
            console.log('✅ Usando registros del servidor con números de auditoría');
            // Log primer registro para debug
            if (serverRecords[0]) {
              console.log('🔍 Primer registro del servidor:', JSON.stringify(serverRecords[0], null, 2));
            }
          } else {
            console.log('⚠️ No hay registros en servidor, cargando locales...');
            const localRecords = await loadLocalBiometricRecords();
            finalRecords = localRecords;
            console.log('📱 Usando registros locales (sin números de auditoría)');
          }
        } catch (error) {
          console.log('❌ Error del servidor, usando registros locales:', error.message);
          const localRecords = await loadLocalBiometricRecords();
          finalRecords = localRecords;
          console.log('📱 Fallback a registros locales debido a error');
        }
      } else {
        console.log('🔒 Usuario no autenticado, usando registros locales...');
        const localRecords = await loadLocalBiometricRecords();
        finalRecords = localRecords;
        console.log('📱 Usuario no autenticado - usando registros locales');
      }
      
      // Ordenar por fecha (más recientes primero)
      const sortedRecords = finalRecords.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setBiometricRecords(sortedRecords);
      setTotalRecords(sortedRecords.length);
      calculateStats(sortedRecords);
      
      console.log('📋 Registros biométricos finales cargados:', sortedRecords.length);
      if (sortedRecords.length > 0) {
        console.log('📄 Primer registro:', JSON.stringify(sortedRecords[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Error cargando registros biométricos:', error);
      Alert.alert('Error', 'Error al cargar los registros biométricos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchRut, searchAuditNumber]);

  const handleSearch = () => {
    loadBiometricRecords();
  };

  const clearSearch = () => {
    setSearchRut('');
    setSearchAuditNumber('');
    setTimeout(() => {
      loadBiometricRecords();
    }, 100);
  };

  const loadLocalBiometricRecords = async () => {
    try {
      const storedRecords = await AsyncStorage.getItem('biometric_records');
      if (storedRecords) {
        return JSON.parse(storedRecords);
      }
      return [];
    } catch (error) {
      console.error('Error loading local biometric records:', error);
      return [];
    }
  };

  const loadServerBiometricRecords = async () => {
    try {
      // Obtener configuración de API
      let baseUrl = 'https://access-control-test.identifica.ai';
      try {
        const configModule = require('../config/api.json');
        if (configModule?.gate?.baseUrl) {
          baseUrl = configModule.gate.baseUrl;
        }
      } catch (configError) {
        console.log('Usando configuración por defecto para registros biométricos:', configError.message);
      }
      
      // Lista de servicios para probar en orden
      const serviceUrls = [
        `${baseUrl}/detect/services/getBiometricRecordsFixed.php`,  // Servicio mejorado que incluye fallos
        `${baseUrl}/detect/services/getBiometricRecords.php`,  // Servicio principal (solo exitosos)
        `${baseUrl}/detect/services/getBiometricRecordsWorking.php`, // Servicio que funciona
        `${baseUrl}/detect/services/mockBiometricRecords.php`, // Datos de prueba
      ];
      
      let params = new URLSearchParams({
        page: '1',
        size: '1000', // Aumentar límite para obtener más registros
        ...(searchRut && { searchRut }),
        ...(searchAuditNumber && { searchAuditNumber })
      });
      
      for (let i = 0; i < serviceUrls.length; i++) {
        const serviceUrl = serviceUrls[i];
        const serviceName = serviceUrl.includes('mock') ? 'MOCK' : 
                          serviceUrl.includes('Working') ? 'WORKING' : 
                          serviceUrl.includes('Fixed') ? 'FIXED' : 
                          serviceUrl.includes('Simple') ? 'SIMPLE' : 'PRINCIPAL';
        
        console.log(`📊 Intentando servicio ${serviceName}:`, `${serviceUrl}?${params}`);
        
        try {
          const response = await fetch(`${serviceUrl}?${params}`, {
            method: 'GET',
            timeout: 15000
          });
          
          if (!response.ok) {
            throw new Error(`Error del servidor ${serviceName}: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            console.log(`✅ Registros biométricos del servidor ${serviceName} cargados:`, result.data.length);
            if (result.data.length > 0) {
              console.log(`🔍 Primer registro del ${serviceName}:`, JSON.stringify(result.data[0], null, 2));
            }
            return result.data;
          } else {
            throw new Error(`Respuesta del servidor ${serviceName} inválida`);
          }
        } catch (error) {
          console.log(`⚠️ Error en servicio ${serviceName}:`, error.message);
          if (i === serviceUrls.length - 1) {
            // Último intento falló
            console.log('❌ Todos los servicios fallaron');
            return [];
          }
          // Continuar al siguiente servicio
        }
      }
    } catch (error) {
      console.error('❌ Error cargando registros biométricos del servidor:', error);
      return [];
    }
  };

  const deduplicateRecords = (records) => {
    const seen = new Set();
    return records.filter(record => {
      const key = `${record.rut}-${record.timestamp}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const saveBiometricRecord = async (record) => {
    try {
      const existingRecords = await loadLocalBiometricRecords();
      const newRecords = [...existingRecords, record];
      await AsyncStorage.setItem('biometric_records', JSON.stringify(newRecords));
      console.log('Registro biométrico guardado localmente');
    } catch (error) {
      console.error('Error saving biometric record:', error);
    }
  };

  useEffect(() => {
    loadBiometricRecords();
  }, [loadBiometricRecords]);

  const calculateStats = (recordsData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: recordsData.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    recordsData.forEach(record => {
      const recordDate = new Date(record.timestamp);
      
      if (recordDate >= today) {
        stats.today++;
      }
      if (recordDate >= weekStart) {
        stats.thisWeek++;
      }
      if (recordDate >= monthStart) {
        stats.thisMonth++;
      }
    });

    setRecordStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setBiometricRecords([]); // Limpiar registros actuales
    await loadBiometricRecords(); // Recargar registros biométricos
    setRefreshing(false);
  };

  const handleLogout = async () => {
    console.log('🚪 HandleLogout llamado');
    
    // En web, usar confirm nativo del navegador
    if (typeof window !== 'undefined' && window.confirm) {
      console.log('🌐 Usando confirm del navegador (web)');
      const confirmed = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
      if (confirmed) {
        console.log('🚪 Confirmando logout en web');
        console.log('🔍 Función logout:', typeof logout);
        try {
          await logout();
          console.log('✅ Logout ejecutado exitosamente');
        } catch (logoutError) {
          console.error('❌ Error en logout:', logoutError);
        }
      } else {
        console.log('🚪 Logout cancelado en web');
      }
      return;
    }
    
    // Para mobile, intentar Alert
    try {
      console.log('📱 Usando Alert (mobile)');
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cerrar Sesión', 
            style: 'destructive', 
            onPress: async () => {
              console.log('🚪 Confirmando logout en mobile');
              console.log('🔍 Función logout:', typeof logout);
              try {
                await logout();
                console.log('✅ Logout ejecutado exitosamente');
              } catch (logoutError) {
                console.error('❌ Error en logout:', logoutError);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error showing logout alert:', error);
      // Fallback: logout directo si Alert falla
      console.log('🚪 Ejecutando logout directo como fallback');
      console.log('🔍 Función logout:', typeof logout);
      try {
        await logout();
        console.log('✅ Logout ejecutado exitosamente (fallback)');
      } catch (logoutError) {
        console.error('❌ Error en logout (fallback):', logoutError);
      }
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Animatable.View animation="fadeInUp" style={{
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginHorizontal: spacing.xs,
      marginBottom: spacing.sm,
      ...shadows.md,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs,
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}>
            {value}
          </Text>
        </View>
        <View style={{
          backgroundColor: color + '20',
          borderRadius: borderRadius.full,
          padding: spacing.md,
        }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
    </Animatable.View>
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString || 'Fecha inválida';
    }
  };

  const handleDownloadCertificate = async (item) => {
    try {
      Alert.alert(
        'Generando Certificado',
        'Se está generando el certificado PDF...',
        [{ text: 'OK' }]
      );
      
      // Obtener RUT del usuario actual (operario)
      console.log('👤 CurrentUser completo:', JSON.stringify(currentUser, null, 2));
      
      // Intentar diferentes propiedades para obtener el RUT del operario
      let operatorRut = null;
      if (currentUser) {
        operatorRut = currentUser.doc_id || 
                     currentUser.rut || 
                     currentUser.username || 
                     currentUser.email ||
                     currentUser.user_id ||
                     currentUser.id ||
                     'admin-default'; // fallback por defecto
      }
      
      console.log('👤 Operario actual:', operatorRut);
      console.log('👤 Todas las propiedades de currentUser:', Object.keys(currentUser || {}));
      
      await generateCertificatePDF(item, operatorRut);
    } catch (error) {
      console.error('Error descargando certificado:', error);
    }
  };

  const BiometricRecordCard = ({ item }) => {
    // Debug: mostrar datos del item
    React.useEffect(() => {
      console.log('🃏 BiometricRecordCard recibió item:', JSON.stringify(item, null, 2));
    }, [item]);
    
    // Determinar el estado de verificación
    const isSuccess = item.isSuccess !== false && item.verificationResult !== 'FAILED';
    const verificationText = isSuccess ? '✓ Verificado' : '✗ Verificación Fallida';
    const statusColor = isSuccess ? colors.primary.green : '#dc3545'; // Rojo para fallos
    const avatarIcon = isSuccess ? 'person' : 'person-remove';
    
    return (
    <TouchableOpacity
      onPress={() => isSuccess ? handleDownloadCertificate(item) : null}
      activeOpacity={isSuccess ? 0.7 : 1.0}
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.md,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
      }}
    >
      {/* Header con estado de verificación */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
      }}>
        <View style={{
          backgroundColor: statusColor + '20',
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: statusColor,
            fontWeight: typography.fontWeight.medium,
          }}>
            {verificationText}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium,
            marginRight: spacing.sm,
          }}>
            {formatDate(item.timestamp)}
          </Text>
          
          {isSuccess && (
            <View style={{
              backgroundColor: colors.primary.purple + '20',
              borderRadius: borderRadius.md,
              padding: spacing.sm,
            }}>
              <Ionicons name="download-outline" size={16} color={colors.primary.purple} />
            </View>
          )}
          {!isSuccess && item.errorCode && (
            <View style={{
              backgroundColor: '#dc3545' + '20',
              borderRadius: borderRadius.md,
              padding: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: '#dc3545',
                fontWeight: typography.fontWeight.medium,
              }}>
                {item.errorCode}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Información principal */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <View style={{
          backgroundColor: statusColor + '20',
          borderRadius: borderRadius.full,
          width: 50,
          height: 50,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.md,
        }}>
          <Ionicons name={avatarIcon} size={24} color={statusColor} />
        </View>
        
        {/* Datos del usuario */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.xs,
          }}>
            {item.firstName} {item.lastName}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="card-outline" size={16} color={colors.text.secondary} />
            <Text style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginLeft: spacing.xs,
              fontWeight: typography.fontWeight.medium,
            }}>
              RUT: {item.rut}
            </Text>
          </View>
          
          {/* Debug: siempre mostrar info de auditoría */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="finger-print" size={16} color={colors.extended.blue} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.extended.blue,
              marginLeft: spacing.xs,
              fontWeight: typography.fontWeight.medium,
            }}>
              Auditoría: {item.auditNumber || 'No disponible'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary.purple} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.primary.purple,
              marginLeft: spacing.xs,
              fontWeight: typography.fontWeight.medium,
            }}>
              Toca para descargar certificado PDF
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    );
  };


  // Los certificados se muestran solo si hay autenticación
  const showCertificates = isAuthenticated;

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
              Certificados
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.white,
              opacity: 0.9,
            }}>
              Sistema de eventos - {currentUser?.username || 'Usuario'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={{
                backgroundColor: showSearch ? colors.primary.green : colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="search" size={20} color={showSearch ? colors.white : colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: showSearch ? colors.white : colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Buscar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onRefresh}
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Actualizar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                console.log('🚪 Botón Salir presionado');
                handleLogout();
              }}
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

      {/* Search Section */}
      {showSearch && (
        <Animatable.View animation="fadeInDown" duration={300} style={{
          backgroundColor: colors.white,
          marginHorizontal: spacing.lg,
          marginTop: spacing.md,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...shadows.md,
        }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            Buscar Certificados
          </Text>
          
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
              fontWeight: typography.fontWeight.medium,
            }}>
              Buscar por RUT
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border.light,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontSize: typography.fontSize.base,
                backgroundColor: colors.background.light,
              }}
              placeholder="Ej: 12345678-9"
              value={searchRut}
              onChangeText={setSearchRut}
              autoCapitalize="none"
            />
          </View>
          
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
              fontWeight: typography.fontWeight.medium,
            }}>
              Buscar por Número de Auditoría
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border.light,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontSize: typography.fontSize.base,
                backgroundColor: colors.background.light,
              }}
              placeholder="Ej: CERT-123456ABC"
              value={searchAuditNumber}
              onChangeText={setSearchAuditNumber}
              autoCapitalize="characters"
            />
          </View>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={handleSearch}
              style={{
                flex: 1,
                backgroundColor: colors.primary.green,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="search" size={20} color={colors.white} />
              <Text style={{
                color: colors.white,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                marginLeft: spacing.sm,
              }}>
                Buscar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={clearSearch}
              style={{
                flex: 1,
                backgroundColor: colors.text.secondary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.white} />
              <Text style={{
                color: colors.white,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                marginLeft: spacing.sm,
              }}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      )}

      {/* Statistics Cards */}
      <View style={{
        paddingHorizontal: spacing.md,
        marginTop: showSearch ? spacing.md : -spacing.md,
        marginBottom: spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="Total Verificaciones"
            value={recordStats.total}
            icon="shield-checkmark-outline"
            color={colors.primary.purple}
          />
          <StatCard
            title="Hoy"
            value={recordStats.today}
            icon="today-outline"
            color={colors.primary.green}
          />
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="Esta Semana"
            value={recordStats.thisWeek}
            icon="calendar-clear-outline"
            color={colors.extended.blue}
          />
          <StatCard
            title="Este Mes"
            value={recordStats.thisMonth}
            icon="calendar-number-outline"
            color={colors.extended.greenBright}
          />
        </View>
      </View>

      {/* Events List */}
      <View style={{ flex: 1 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}>
            Verificaciones Biométricas
          </Text>
          <View style={{
            backgroundColor: colors.primary.purple + '10',
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.primary.purple,
              fontWeight: typography.fontWeight.medium,
            }}>
              {biometricRecords.length} registros
            </Text>
          </View>
        </View>

        {true ? (
          <FlatList
            data={biometricRecords}
            keyExtractor={(item, index) => `biometric-${item.id || index}-${item.timestamp || Math.random()}`}
            renderItem={({ item }) => <BiometricRecordCard item={item} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            contentContainerStyle={{ 
              paddingBottom: spacing.xl,
              paddingHorizontal: spacing.lg,
            }}
            ListEmptyComponent={() => (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: spacing['3xl'],
                width: '100%',
              }}>
                <View style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.full,
                  padding: spacing.xl,
                  marginBottom: spacing.lg,
                }}>
                  <Ionicons name="shield-checkmark-outline" size={64} color={colors.text.secondary} />
                </View>
                <Text style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing.xs,
                  textAlign: 'center',
                }}>
                  {loading ? 'Cargando verificaciones...' : 'No hay verificaciones biométricas'}
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: spacing.lg,
                }}>
                  {loading ? 'Por favor espera un momento' : 'Realiza una verificación biométrica para ver los registros aquí'}
                </Text>
                {!loading && (
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/index')}
                    style={{
                      backgroundColor: colors.primary.green,
                      borderRadius: borderRadius.lg,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="scan-outline" size={20} color={colors.white} />
                    <Text style={{
                      color: colors.white,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.medium,
                      marginLeft: spacing.sm,
                    }}>
                      Ir a Biometría
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        ) : (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
          }}>
            <View style={{
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.full,
              padding: spacing.xl,
              marginBottom: spacing.lg,
            }}>
              <Ionicons name="lock-closed-outline" size={64} color={colors.text.secondary} />
            </View>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.xs,
              textAlign: 'center',
            }}>
              Inicia Sesión
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}>
              Ve a Configuración para iniciar sesión y ver los certificados
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={{
                backgroundColor: colors.primary.purple,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.white} />
              <Text style={{
                color: colors.white,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                marginLeft: spacing.sm,
              }}>
                Ir a Configuración
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CertificadosScreen;