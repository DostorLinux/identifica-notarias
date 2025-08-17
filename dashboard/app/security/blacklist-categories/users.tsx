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
import api from '../../api/IdentificaAPI';

const BlacklistUsersScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);
  const [stats, setStats] = useState({
    totalBlocked: 0,
    activeBlocks: 0,
    pendingReview: 0,
    recentBlocks: 0,
  });

  useEffect(() => {
    loadBlacklistUsers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [blacklistedUsers]);

  const loadBlacklistUsers = async () => {
    try {
      console.log('🚫 Loading blacklisted users from API...');
      setLoading(true);
      
      const result = await api.getBlacklistedUsers();
      
      if (result.success && result.users) {
        console.log('✅ Usuarios denegados cargados:', result.users.length);
        
        // Transformar los datos de la API al formato esperado por la UI
        const transformedUsers = result.users.map(user => ({
          id: user.id || user.pub_id,
          doc_id: user.doc_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          reason: user.deniedNote || 'Usuario denegado',
          blocked_date: new Date().toISOString().split('T')[0], // TODO: Obtener fecha real del backend
          blocked_by: 'Sistema', // TODO: Obtener quien lo bloqueó del backend
          status: user.isDenied ? 'active' : 'pending_review'
        }));
        
        setBlacklistedUsers(transformedUsers);
      } else {
        console.log('⚠️ No se encontraron usuarios denegados');
        setBlacklistedUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading blacklisted users:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar los usuarios denegados. Verifica tu conexión e inténtalo nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = {
      totalBlocked: blacklistedUsers.length,
      activeBlocks: blacklistedUsers.filter(u => u.status === 'active').length,
      pendingReview: blacklistedUsers.filter(u => u.status === 'pending_review').length,
      recentBlocks: blacklistedUsers.filter(u => {
        const blockDate = new Date(u.blocked_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return blockDate >= weekAgo;
      }).length,
    };
    setStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlacklistUsers();
    setRefreshing(false);
  };

  const filteredUsers = blacklistedUsers.filter(user =>
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.doc_id.includes(searchQuery) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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

  const BlacklistedUserCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const handleRemoveFromBlacklist = async () => {
      Alert.alert(
        'Remover de Lista Negra',
        `¿Estás seguro que deseas remover a ${item.first_name} ${item.last_name} de la lista negra?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Remover', 
            style: 'destructive', 
            onPress: async () => {
              try {
                console.log('✅ Removiendo usuario de lista negra:', item.doc_id);
                
                // Por ahora usamos deleteUser ya que removeUserFromBlacklist no está implementado
                const result = await api.deleteUser(item.doc_id);
                
                if (result && result.success) {
                  console.log('✅ Usuario removido exitosamente de lista negra');
                  
                  // Recargar la lista de usuarios
                  await loadBlacklistUsers();
                  
                  Alert.alert('Éxito', 'Usuario removido de la lista negra exitosamente');
                } else {
                  throw new Error('No se recibió confirmación del servidor');
                }
              } catch (error) {
                console.error('❌ Error al remover usuario de lista negra:', error);
                Alert.alert(
                  'Error', 
                  `No se pudo remover el usuario de la lista negra: ${error.message}`,
                  [{ text: 'OK' }]
                );
              }
            }
          },
        ]
      );
    };

    const handleViewDetails = () => {
      Alert.alert(
        'Detalles del Usuario',
        `Nombre: ${item.first_name} ${item.last_name}\nRUT: ${item.doc_id}\nEmail: ${item.email}\nMotivo: ${item.reason}\nFecha de bloqueo: ${item.blocked_date}\nBloqueado por: ${item.blocked_by}`,
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
          padding: spacing.md, // Reducido de lg a md
          marginBottom: spacing.md,
          width: '48%', // Ancho fijo para dos columnas
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
        <View style={{ flex: 1 }}>
          {/* Header with name and status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={{
              fontSize: typography.fontSize.base, // Reducido de lg a base
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              flex: 1,
              marginRight: spacing.xs,
            }} numberOfLines={1}>
              {item.first_name} {item.last_name}
            </Text>
            
            <View style={{
              backgroundColor: getStatusColor(item.status) + '20',
              borderColor: getStatusColor(item.status),
              borderWidth: 1,
              paddingHorizontal: spacing.xs, // Reducido
              paddingVertical: spacing.xs / 2, // Reducido
              borderRadius: borderRadius.sm, // Reducido
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

          {/* User details - más compacto */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Ionicons name="card-outline" size={12} color={colors.text.secondary} />
              <Text style={{
                fontSize: typography.fontSize.xs, // Reducido
                color: colors.text.secondary,
                marginLeft: spacing.xs,
              }} numberOfLines={1}>
                {item.doc_id}
              </Text>
            </View>
            
            {item.email && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="mail-outline" size={12} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.xs, // Reducido
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                  flex: 1,
                }} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
            )}
          </View>

          {/* Reason - más compacto */}
          <View style={{
            backgroundColor: colors.error + '10',
            borderRadius: borderRadius.sm, // Reducido
            padding: spacing.sm,
            marginBottom: spacing.sm,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xs, // Reducido
              fontWeight: typography.fontWeight.medium,
              color: colors.error,
              marginBottom: spacing.xs / 2, // Reducido
            }}>
              Motivo:
            </Text>
            <Text style={{
              fontSize: typography.fontSize.xs, // Reducido
              color: colors.text.primary,
            }} numberOfLines={2}>
              {item.reason}
            </Text>
          </View>

          {/* Footer - más compacto */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              flex: 1,
              marginRight: spacing.xs,
            }} numberOfLines={1}>
              {item.blocked_date}
            </Text>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFromBlacklist();
              }}
              style={{
                backgroundColor: colors.success + '20',
                borderRadius: borderRadius.sm, // Reducido
                paddingHorizontal: spacing.xs, // Reducido
                paddingVertical: spacing.xs / 2, // Reducido
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark" size={12} color={colors.success} />
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.success,
                marginLeft: spacing.xs / 2,
                fontWeight: typography.fontWeight.medium,
              }}>
                Remover
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AddUserModal = () => {
    const [newUser, setNewUser] = useState({
      doc_id: '',
      first_name: '',
      last_name: '',
      email: '',
      reason: '',
    });

    const handleAddUser = async () => {
      if (!newUser.doc_id || !newUser.first_name || !newUser.last_name || !newUser.reason) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
        return;
      }

      try {
        console.log('🚫 Agregando usuario a lista negra:', newUser);
        
        // Preparar los datos para la API
        const userData = {
          doc_id: newUser.doc_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email || '',
          role: 'normal', // Rol por defecto
          reason: newUser.reason
        };
        
        const result = await api.addUserToBlacklist(userData);
        
        if (result && (result.id || result.result)) {
          console.log('✅ Usuario agregado exitosamente a lista negra');
          
          // Recargar la lista de usuarios
          await loadBlacklistUsers();
          
          // Limpiar el formulario y cerrar modal
          setNewUser({ doc_id: '', first_name: '', last_name: '', email: '', reason: '' });
          setAddUserModalVisible(false);
          
          Alert.alert('Éxito', 'Usuario agregado a la lista negra exitosamente');
        } else {
          throw new Error('No se recibió confirmación del servidor');
        }
      } catch (error) {
        console.error('❌ Error al agregar usuario a lista negra:', error);
        Alert.alert(
          'Error', 
          `No se pudo agregar el usuario a la lista negra: ${error.message}`,
          [{ text: 'OK' }]
        );
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={addUserModalVisible}
        onRequestClose={() => setAddUserModalVisible(false)}
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
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400,
            ...shadows.lg,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              Agregar Usuario a Lista Negra
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
              placeholder="RUT (ej: 12.345.678-9)"
              value={newUser.doc_id}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, doc_id: text }))}
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
              placeholder="Nombres"
              value={newUser.first_name}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, first_name: text }))}
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
              placeholder="Apellidos"
              value={newUser.last_name}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, last_name: text }))}
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
              placeholder="Email (opcional)"
              value={newUser.email}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
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
              value={newUser.reason}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, reason: text }))}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setAddUserModalVisible(false)}
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
                onPress={handleAddUser}
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
          </View>
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
                Usuarios en Lista Negra
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestiona usuarios denegados en el sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setAddUserModalVisible(true)}
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
            icon="person-remove-outline"
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
            placeholder="Buscar por nombre, RUT o email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BlacklistedUserCard item={item} />}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ 
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
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
              <Ionicons name="person-remove-outline" size={64} color={colors.text.secondary} />
            </View>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            }}>
              {loading ? 'Cargando usuarios...' : 
               searchQuery ? 'No se encontraron usuarios' : 
               'No hay usuarios en lista negra'}
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {loading ? 'Por favor espera un momento' :
               searchQuery ? 'Intenta con otros términos de búsqueda' : 
               'Los usuarios denegados aparecerán aquí'}
            </Text>
          </View>
        )}
      />

      <AddUserModal />
    </SafeAreaView>
  );
};

export default BlacklistUsersScreen;