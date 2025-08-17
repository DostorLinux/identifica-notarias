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
  Platform,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';

const DispositivosScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withLocation: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Configuración de paginación
  const PAGE_SIZE = 10;

  const loadDevices = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Asegurar que page sea >= 1
      const safePage = Math.max(page, 1);
      console.log('📱 Dispositivos: Cargando dispositivos... Página:', safePage);
      
      // Preparar parámetros EXACTO como el otro sistema: {"page":1,"size":5,"direction":"","column":"asc","filter":null}
      const params = {
        page: safePage, // Asegurar que page >= 1
        size: PAGE_SIZE,
        direction: "", // String vacío como en el otro sistema
        column: "asc", // "asc" como en el otro sistema
        filter: null
      };
      
      console.log('📱 Parámetros enviados:', params);
      
      const result = await api.getDevices(params);
      
      // Debug: Log para ver qué datos estamos recibiendo
      console.log('🔍 Datos recibidos en pantalla dispositivos:', JSON.stringify(result, null, 2));
      
      // Handle different response formats
      let devicesData = [];
      let total = 0;
      
      if (result && result.devices) {
        // Formato nuevo: {success: true, devices: [...], total: 74}
        devicesData = result.devices;
        total = result.total || result.devices.length;
        console.log('📊 Usando result.devices - Total:', total, 'Dispositivos:', devicesData.length);
      } else if (result && result.data) {
        // Formato original: {data: [...], total: 4}
        devicesData = result.data;
        total = result.total || result.data.length;
        console.log('📊 Usando result.data - Total:', total, 'Dispositivos:', devicesData.length);
      } else if (Array.isArray(result)) {
        devicesData = result;
        total = result.length;
        console.log('📊 Usando result directo - Total:', total);
      }
      
      // Convertir array de arrays a objetos más manejables
      const formattedDevices = devicesData.map(device => {
        if (Array.isArray(device)) {
          // Formato: ["4","Divisa 900-B","0","1","0","20","3","La Divisa","333236","704148","20","1969-12-31 20:33:45","1969-12-31 20:33:45",["conductor","externo"],"1"]
          return {
            id: device[0],
            name: device[1],
            status1: device[2],
            active: device[3],
            status2: device[4],
            limit: device[5],
            location_id: device[6],
            location_name: device[7],
            coord1: device[8],
            coord2: device[9],
            field10: device[10],
            created_at: device[11],
            updated_at: device[12],
            allowed_roles: Array.isArray(device[13]) ? device[13] : [],
            is_active: device[14]
          };
        }
        return device;
      });
      
      if (append) {
        setDevices(prevDevices => [...prevDevices, ...formattedDevices]);
      } else {
        setDevices(formattedDevices);
        setCurrentPage(1);
      }
      
      setTotalDevices(total);
      
      // Solo calcular stats con los primeros datos
      if (page === 1) {
        calculateStats(formattedDevices, total);
      }
      
      console.log('📱 Dispositivos: Dispositivos cargados:', formattedDevices.length, 'Total:', total);
    } catch (error) {
      console.error('❌ Dispositivos: Error cargando dispositivos:', error);
      Alert.alert('Error', 'Error al cargar los dispositivos: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreDevices = useCallback(async () => {
    if (loadingMore || devices.length >= totalDevices) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadDevices(nextPage, true);
  }, [currentPage, loadingMore, devices.length, totalDevices, loadDevices]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const calculateStats = (devicesData, total) => {
    const stats = {
      total: total || devicesData.length,
      active: 0,
      inactive: 0,
      withLocation: 0,
    };

    devicesData.forEach(device => {
      if (device.is_active === "1" || device.active === "1") {
        stats.active++;
      } else {
        stats.inactive++;
      }
      
      if (device.location_name && device.location_name !== "null") {
        stats.withLocation++;
      }
    });

    setDeviceStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setDevices([]); // Limpiar dispositivos actuales
    await loadDevices(1, false); // Cargar desde la primera página
    setRefreshing(false);
  };

  const handleCreateDevice = () => {
    setEditingDevice(null);
    setShowCreateModal(true);
  };

  const handleEditDevice = async (deviceData) => {
    try {
      console.log('📱 Cargando datos del dispositivo para editar:', deviceData);
      
      // Si deviceData es un array (formato de la lista), usar el id
      const deviceId = Array.isArray(deviceData) ? deviceData[0] : deviceData.id;
      
      const result = await api.getDevice(deviceId);
      
      if (result.success) {
        setEditingDevice(result.device);
        setShowCreateModal(true);
      } else {
        Alert.alert('Error', result.error || 'No se pudo cargar el dispositivo');
      }
    } catch (error) {
      console.error('Error cargando dispositivo:', error);
      Alert.alert('Error', 'Error al cargar los datos del dispositivo');
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingDevice(null);
  };

  const handleDeviceSaved = () => {
    setShowCreateModal(false);
    setEditingDevice(null);
    // Recargar la lista de dispositivos
    onRefresh();
  };

  const StatCard = ({ title, value, icon, color, library }) => (
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
          {library === 'MCI' ? (
            <MaterialCommunityIcons name={icon} size={20} color={color} />
          ) : (
            <Ionicons name={icon} size={20} color={color} />
          )}
        </View>
      </View>
    </Animatable.View>
  );

  const getDeviceStatusColor = (device) => {
    if (device.is_active === "1" || device.active === "1") {
      return colors.success;
    }
    return colors.error;
  };

  const getDeviceStatusText = (device) => {
    if (device.is_active === "1" || device.active === "1") {
      return 'Activo';
    }
    return 'Inactivo';
  };

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

  const DeviceCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          // Handle device details if needed
          console.log('Dispositivo seleccionado:', item);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          flex: 1,
          maxWidth: '48%',
          margin: spacing.xs,
        }}
      >
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          minHeight: 180,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: colors.primary.purple + '20',
          }),
          transition: 'all 0.2s ease-in-out',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Device Status Badge */}
            <View style={{
              backgroundColor: getDeviceStatusColor(item) + '20',
              borderColor: getDeviceStatusColor(item) + '40',
              borderWidth: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: getDeviceStatusColor(item),
                fontWeight: typography.fontWeight.medium,
              }}>
                {getDeviceStatusText(item)}
              </Text>
            </View>

            {/* Device ID */}
            <Text style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium,
            }}>
              ID: {item.id}
            </Text>
          </View>

          {/* Device Info */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <MaterialCommunityIcons name="face-recognition" size={16} color={colors.text.secondary} />
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginLeft: spacing.xs,
              }} numberOfLines={1}>
                {item.name || 'Dispositivo sin nombre'}
              </Text>
            </View>
            
            {item.limit && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  Límite: {item.limit}
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginLeft: spacing.xs,
            }} numberOfLines={1}>
              {item.location_name || 'Sin ubicación'}
            </Text>
          </View>

          {/* Allowed Roles */}
          {item.allowed_roles && item.allowed_roles.length > 0 && (
            <View style={{ 
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginTop: spacing.sm,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="shield-checkmark-outline" size={12} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Roles:
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {item.allowed_roles.slice(0, 2).map((role, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.primary.green + '20',
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs / 2,
                      marginRight: spacing.xs,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.primary.green,
                      fontWeight: typography.fontWeight.medium,
                    }}>
                      {role}
                    </Text>
                  </View>
                ))}
                {item.allowed_roles.length > 2 && (
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    alignSelf: 'center',
                  }}>
                    +{item.allowed_roles.length - 2}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Coordinates (if available) */}
          {(item.coord1 && item.coord2 && item.coord1 !== "null" && item.coord2 !== "null") && (
            <View style={{ 
              backgroundColor: colors.extended.blue + '10',
              borderColor: colors.extended.blue + '30',
              borderWidth: 1,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginTop: spacing.sm,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="location-outline" size={14} color={colors.extended.blue} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.extended.blue,
                  fontWeight: typography.fontWeight.medium,
                  marginLeft: spacing.xs,
                }}>
                  Coordenadas
                </Text>
              </View>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: colors.white + '50',
                borderRadius: borderRadius.md,
                padding: spacing.sm,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs / 2,
                  }}>
                    Latitud
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.extended.blue,
                    fontWeight: typography.fontWeight.medium,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}>
                    {item.coord1}
                  </Text>
                </View>
                <View style={{ 
                  width: 1, 
                  height: '100%', 
                  backgroundColor: colors.extended.blue + '30',
                  marginHorizontal: spacing.sm,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs / 2,
                  }}>
                    Longitud
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.extended.blue,
                    fontWeight: typography.fontWeight.medium,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}>
                    {item.coord2}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Edit Button */}
          <View style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
          }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleEditDevice(item);
              }}
              style={{
                backgroundColor: colors.primary.purple,
                borderRadius: borderRadius.full,
                padding: spacing.sm,
                ...shadows.sm,
              }}
            >
              <Ionicons name="pencil" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={{ 
        paddingVertical: spacing.lg, 
        alignItems: 'center',
        width: '100%',
      }}>
        <ActivityIndicator size="small" color={colors.primary.purple} />
        <Text style={{
          marginTop: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}>
          Cargando más dispositivos...
        </Text>
      </View>
    );
  };

  const canLoadMore = devices.length < totalDevices && !loadingMore;

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            
            <View>
              <Text style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
              }}>
                Dispositivos
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestión de dispositivos de reconocimiento facial
              </Text>
            </View>
          </View>
          
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
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={{
        paddingHorizontal: spacing.md,
        marginTop: -spacing.md,
        marginBottom: spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="Total Dispositivos"
            value={deviceStats.total}
            icon="face-recognition"
            color={colors.primary.purple}
            library="MCI"
          />
          <StatCard
            title="Con Ubicación"
            value={deviceStats.withLocation}
            icon="location-outline"
            color={colors.extended.blue}
          />
        </View>
      </View>

      {/* Devices List */}
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
            Lista de Dispositivos
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
              {devices.length} de {totalDevices} dispositivos
            </Text>
          </View>
        </View>

        <FlatList
          data={devices}
          keyExtractor={(item, index) => `device-${item.id || index}-${item.name || Math.random()}`}
          renderItem={({ item }) => <DeviceCard item={item} />}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={canLoadMore ? loadMoreDevices : null}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{ 
            paddingBottom: spacing.xl,
            paddingHorizontal: spacing.sm,
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
                <MaterialCommunityIcons name="face-recognition" size={64} color={colors.text.secondary} />
              </View>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs,
                textAlign: 'center',
              }}>
                {loading ? 'Cargando dispositivos...' : 'No hay dispositivos'}
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                {loading ? 'Por favor espera un momento' : 'No se encontraron dispositivos en el sistema'}
              </Text>
            </View>
          )}
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          onPress={handleCreateDevice}
          style={{
            position: 'absolute',
            bottom: spacing.xl,
            right: spacing.xl,
            backgroundColor: colors.primary.purple,
            borderRadius: borderRadius.full,
            padding: spacing.lg,
            ...shadows.lg,
          }}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Create/Edit Device Modal */}
      <DeviceModal
        visible={showCreateModal}
        device={editingDevice}
        onClose={handleCloseModal}
        onSaved={handleDeviceSaved}
      />
    </SafeAreaView>
  );
};

// Modal component for creating/editing devices
const DeviceModal = ({ visible, device, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    hasDependency: false,
    dependencyId: '',
    maxMinutes: '',
    hasPlate: false,
    placeId: '',
    lat: '',
    lng: '',
    radio: '',
    allowInvitation: false,
    user_types: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      // Editing mode - populate form with device data
      setFormData({
        name: device.name || '',
        location: device.location || '',
        hasDependency: device.hasDependency === 1 || device.hasDependency === '1',
        dependencyId: device.dependencyId || '',
        maxMinutes: device.maxMinutes?.toString() || '',
        hasPlate: device.hasPlate === 1 || device.hasPlate === '1',
        placeId: device.placeId || '',
        lat: device.lat?.toString() || '',
        lng: device.lng?.toString() || '',
        radio: device.radio?.toString() || '',
        allowInvitation: device.allowInvitation === 1 || device.allowInvitation === '1',
        user_types: device.user_types || []
      });
    } else {
      // Creating mode - reset form
      setFormData({
        name: '',
        location: '',
        hasDependency: false,
        dependencyId: '',
        maxMinutes: '',
        hasPlate: false,
        placeId: '',
        lat: '',
        lng: '',
        radio: '',
        allowInvitation: false,
        user_types: []
      });
    }
  }, [device, visible]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del dispositivo es requerido');
      return;
    }

    setSaving(true);
    try {
      const deviceData = {
        ...formData,
        ...(device && { id: device.id })
      };

      const result = await api.saveDevice(deviceData);

      if (result.success) {
        // Cerrar modal inmediatamente y recargar datos
        onSaved();
        
        // Mostrar mensaje de éxito sin bloquear el cierre
        setTimeout(() => {
          Alert.alert('Éxito', 'Dispositivo guardado correctamente');
        }, 100);
      } else {
        Alert.alert('Error', result.error || 'Error al guardar dispositivo');
      }
    } catch (error) {
      console.error('Error saving device:', error);
      Alert.alert('Error', 'Error al guardar dispositivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
      }}>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          maxHeight: '90%',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.background.light,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}>
              {device ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={{ padding: spacing.lg }}>
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.sm,
              }}>
                Nombre del Dispositivo *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                }}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Ej: Cámara Principal"
              />
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.sm,
              }}>
                Ubicación
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                }}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Ej: Entrada Principal"
              />
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.sm,
              }}>
                Configuración Geográfica
              </Text>
              
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      fontSize: typography.fontSize.base,
                    }}
                    value={formData.lat}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lat: text }))}
                    placeholder="Latitud"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      fontSize: typography.fontSize.base,
                    }}
                    value={formData.lng}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lng: text }))}
                    placeholder="Longitud"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <TextInput
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                }}
                value={formData.radio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, radio: text }))}
                placeholder="Radio (metros)"
                keyboardType="numeric"
              />
            </View>

            {/* Checkboxes */}
            <View style={{ marginBottom: spacing.lg }}>
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, hasPlate: !prev.hasPlate }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: formData.hasPlate ? colors.primary.purple : colors.text.secondary,
                  backgroundColor: formData.hasPlate ? colors.primary.purple : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  {formData.hasPlate && (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  )}
                </View>
                <Text style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>
                  Reconocimiento de patentes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, allowInvitation: !prev.allowInvitation }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: formData.allowInvitation ? colors.primary.purple : colors.text.secondary,
                  backgroundColor: formData.allowInvitation ? colors.primary.purple : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  {formData.allowInvitation && (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  )}
                </View>
                <Text style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>
                  Permitir invitaciones
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            flexDirection: 'row',
            gap: spacing.md,
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.background.light,
          }}>
            <TouchableOpacity
              onPress={onClose}
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
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
              }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                backgroundColor: saving ? colors.text.secondary : colors.primary.purple,
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
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DispositivosScreen;