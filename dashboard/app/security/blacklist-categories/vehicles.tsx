import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

const BlacklistVehiclesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addVehicleModalVisible, setAddVehicleModalVisible] = useState(false);
  const [blacklistedVehicles, setBlacklistedVehicles] = useState([
    {
      id: '1',
      plate: 'ABC-123',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2020',
      color: 'Blanco',
      owner_name: 'Juan Pérez',
      owner_doc_id: '12.345.678-9',
      reason: 'Infracciones de tránsito repetidas',
      blocked_date: '2024-01-15',
      blocked_by: 'Admin Sistema',
      status: 'active'
    },
    {
      id: '2',
      plate: 'XYZ-789',
      brand: 'Nissan',
      model: 'Sentra',
      year: '2019',
      color: 'Azul',
      owner_name: 'María González',
      owner_doc_id: '98.765.432-1',
      reason: 'Vehículo involucrado en incidente de seguridad',
      blocked_date: '2024-01-10',
      blocked_by: 'Supervisor Seguridad',
      status: 'active'
    },
    {
      id: '3',
      plate: 'DEF-456',
      brand: 'Chevrolet',
      model: 'Spark',
      year: '2021',
      color: 'Rojo',
      owner_name: 'Pedro Silva',
      owner_doc_id: '11.222.333-4',
      reason: 'Documentación vencida',
      blocked_date: '2024-01-08',
      blocked_by: 'Admin Sistema',
      status: 'pending_review'
    }
  ]);
  const [stats, setStats] = useState({
    totalBlocked: 0,
    activeBlocks: 0,
    pendingReview: 0,
    recentBlocks: 0,
  });

  useEffect(() => {
    loadBlacklistVehicles();
    calculateStats();
  }, [blacklistedVehicles]);

  const loadBlacklistVehicles = async () => {
    try {
      console.log('🚗 Loading blacklisted vehicles...');
      // TODO: Implementar llamada a la API
      // const result = await api.getBlacklistedVehicles();
      // setBlacklistedVehicles(result.vehicles);
    } catch (error) {
      console.error('❌ Error loading blacklisted vehicles:', error);
    }
  };

  const calculateStats = () => {
    const stats = {
      totalBlocked: blacklistedVehicles.length,
      activeBlocks: blacklistedVehicles.filter(v => v.status === 'active').length,
      pendingReview: blacklistedVehicles.filter(v => v.status === 'pending_review').length,
      recentBlocks: blacklistedVehicles.filter(v => {
        const blockDate = new Date(v.blocked_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return blockDate >= weekAgo;
      }).length,
    };
    setStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlacklistVehicles();
    setRefreshing(false);
  };

  const filteredVehicles = blacklistedVehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.owner_doc_id.includes(searchQuery)
  );

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.error;
      case 'pending_review': return colors.warning;
      default: return colors.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending_review': return 'En Revisión';
      default: return status;
    }
  };

  const BlacklistedVehicleCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const handleRemoveFromBlacklist = () => {
      Alert.alert(
        'Remover de Lista Negra',
        `¿Estás seguro que deseas remover el vehículo ${item.plate} de la lista negra?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Remover', 
            style: 'destructive', 
            onPress: () => {
              // TODO: Implementar llamada a la API
              setBlacklistedVehicles(prev => prev.filter(v => v.id !== item.id));
              Alert.alert('Éxito', 'Vehículo removido de la lista negra');
            }
          },
        ]
      );
    };

    const handleViewDetails = () => {
      Alert.alert(
        'Detalles del Vehículo',
        `Patente: ${item.plate}\nMarca: ${item.brand}\nModelo: ${item.model}\nAño: ${item.year}\nColor: ${item.color}\nPropietario: ${item.owner_name}\nRUT: ${item.owner_doc_id}\nMotivo: ${item.reason}\nFecha de bloqueo: ${item.blocked_date}\nBloqueado por: ${item.blocked_by}`,
        [{ text: 'OK' }]
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleViewDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: colors.error + '20',
          }),
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {/* Header with plate and status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}>
                {item.plate}
              </Text>
              
              <View style={{
                backgroundColor: getStatusColor(item.status) + '20',
                borderColor: getStatusColor(item.status),
                borderWidth: 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.md,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: getStatusColor(item.status),
                  fontWeight: typography.fontWeight.medium,
                }}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>

            {/* Vehicle details */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="car-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  {item.brand} {item.model} {item.year} - {item.color}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  {item.owner_name} - {item.owner_doc_id}
                </Text>
              </View>
            </View>

            {/* Reason and date */}
            <View style={{
              backgroundColor: colors.error + '10',
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.error,
                marginBottom: spacing.xs,
              }}>
                Motivo del bloqueo:
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
              }}>
                {item.reason}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
              }}>
                Bloqueado el {item.blocked_date} por {item.blocked_by}
              </Text>
              
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveFromBlacklist();
                }}
                style={{
                  backgroundColor: colors.success + '20',
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark" size={14} color={colors.success} />
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.success,
                  marginLeft: spacing.xs,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AddVehicleModal = () => {
    const [newVehicle, setNewVehicle] = useState({
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      owner_name: '',
      owner_doc_id: '',
      reason: '',
    });

    const handleAddVehicle = () => {
      if (!newVehicle.plate || !newVehicle.brand || !newVehicle.model || !newVehicle.owner_name || !newVehicle.reason) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
        return;
      }

      const vehicleToAdd = {
        ...newVehicle,
        id: Date.now().toString(),
        blocked_date: new Date().toISOString().split('T')[0],
        blocked_by: 'Usuario Actual', // TODO: Obtener del contexto de autenticación
        status: 'active'
      };

      setBlacklistedVehicles(prev => [...prev, vehicleToAdd]);
      setNewVehicle({ plate: '', brand: '', model: '', year: '', color: '', owner_name: '', owner_doc_id: '', reason: '' });
      setAddVehicleModalVisible(false);
      Alert.alert('Éxito', 'Vehículo agregado a la lista negra');
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={addVehicleModalVisible}
        onRequestClose={() => setAddVehicleModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}>
          <ScrollView style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            ...shadows.lg,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              Agregar Vehículo a Lista Negra
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Patente (ej: ABC-123)"
              value={newVehicle.plate}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, plate: text.toUpperCase() }))}
            />

            <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                  flex: 1,
                  marginRight: spacing.sm,
                }}
                placeholder="Marca"
                value={newVehicle.brand}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, brand: text }))}
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                  flex: 1,
                  marginLeft: spacing.sm,
                }}
                placeholder="Modelo"
                value={newVehicle.model}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
              />
            </View>

            <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                  flex: 1,
                  marginRight: spacing.sm,
                }}
                placeholder="Año"
                value={newVehicle.year}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, year: text }))}
                keyboardType="numeric"
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  fontSize: typography.fontSize.base,
                  flex: 1,
                  marginLeft: spacing.sm,
                }}
                placeholder="Color"
                value={newVehicle.color}
                onChangeText={(text) => setNewVehicle(prev => ({ ...prev, color: text }))}
              />
            </View>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Nombre del propietario"
              value={newVehicle.owner_name}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, owner_name: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="RUT del propietario (opcional)"
              value={newVehicle.owner_doc_id}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, owner_doc_id: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                fontSize: typography.fontSize.base,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Motivo del bloqueo"
              value={newVehicle.reason}
              onChangeText={(text) => setNewVehicle(prev => ({ ...prev, reason: text }))}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setAddVehicleModalVisible(false)}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  flex: 1,
                  marginRight: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddVehicle}
                style={{
                  backgroundColor: colors.error,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  flex: 1,
                  marginLeft: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.white,
                  textAlign: 'center',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.error, colors.extended.red]}
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
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
                Vehículos en Lista Negra
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestiona vehículos denegados en el sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setAddVehicleModalVisible(true)}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={20} color={colors.error} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.error,
              marginLeft: spacing.xs,
            }}>
              Agregar
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
            title="Total Bloqueados"
            value={stats.totalBlocked}
            icon="car-outline"
            color={colors.error}
          />
          <StatCard
            title="Bloqueos Activos"
            value={stats.activeBlocks}
            icon="lock-closed-outline"
            color={colors.extended.red}
          />
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="En Revisión"
            value={stats.pendingReview}
            icon="time-outline"
            color={colors.warning}
          />
          <StatCard
            title="Recientes (7 días)"
            value={stats.recentBlocks}
            icon="calendar-outline"
            color={colors.extended.redLight}
          />
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          ...shadows.sm,
        }}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontSize: typography.fontSize.base,
              color: colors.text.primary,
            }}
            placeholder="Buscar por patente, marca, modelo o propietario..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Vehicles List */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BlacklistedVehicleCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ 
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        ListEmptyComponent={() => (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: spacing['3xl'],
          }}>
            <View style={{
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.full,
              padding: spacing.xl,
              marginBottom: spacing.lg,
            }}>
              <Ionicons name="car-outline" size={64} color={colors.text.secondary} />
            </View>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            }}>
              {searchQuery ? 'No se encontraron vehículos' : 'No hay vehículos en lista negra'}
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los vehículos denegados aparecerán aquí'}
            </Text>
          </View>
        )}
      />

      <AddVehicleModal />
    </SafeAreaView>
  );
};

export default BlacklistVehiclesScreen;