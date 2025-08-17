import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import RoleGuard from '../components/RoleGuard';

const { width: screenWidth } = Dimensions.get('window');

const UsersScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    admin: 0,
    user: 0,
    gate: 0,
    worker: 0,
    normal: 0,
    super_admin: 0,
  });
  
  // Estados para filtrado
  const [searchText, setSearchText] = useState('');
  const [allUsers, setAllUsers] = useState([]); // Todos los usuarios sin filtrar
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Estados para filtro por tipo de usuario
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [showUserTypeFilter, setShowUserTypeFilter] = useState(false);
  
  // Tipos de usuario disponibles para filtrar
  const userTypeFilters = [
    { id: 'all', name: 'Todos los usuarios', icon: 'people-outline', color: colors.text.secondary },
    { id: 'admin', name: 'Administrador', icon: 'shield-checkmark-outline', color: colors.extended.red },
    { id: 'user', name: 'Conductor', icon: 'car-outline', color: colors.primary.green },
    { id: 'gate', name: 'Guardia', icon: 'eye-outline', color: colors.extended.blue },
    { id: 'worker', name: 'Trabajador', icon: 'hammer-outline', color: colors.extended.greenBright },
  ];

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    direction: "asc",
    column: "first_name",
    filter: null,
    totalPages: 1,
    totalItems: 0,
    hasMore: true,
  });

  const isTabletOrDesktop = screenWidth > 768;

  useEffect(() => {
    loadUsers(true); // true para reset
  }, []);

  const loadUsers = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : pagination.page;
      console.log('👥 Users: Cargando usuarios página:', currentPage);
      
      if (reset) {
        setLoading(true);
        setUsers([]);
      } else {
        setLoadingMore(true);
      }

      // Parámetros de paginación según el formato requerido
      const params = {
        page: currentPage,
        size: pagination.size,
        direction: pagination.direction,
        column: pagination.column,
        filter: pagination.filter,
      };

      const result = await api.getUsers(params);
      
      if (result.success && result.users) {
        const newUsers = result.users;
        
        if (reset) {
          setUsers(newUsers);
        } else {
          setUsers(prevUsers => [...prevUsers, ...newUsers]);
        }

        // Actualizar información de paginación
        setPagination(prev => ({
          ...prev,
          page: currentPage,
          totalPages: result.totalPages || 1,
          totalItems: result.totalItems || newUsers.length,
          hasMore: newUsers.length === pagination.size && currentPage < (result.totalPages || 1),
        }));

        // Calcular estadísticas solo con el primer load o si es reset
        if (reset || currentPage === 1) {
          calculateStats(result.allUsersStats || newUsers);
        }
        
        console.log('👥 Users: Usuarios cargados:', newUsers.length, 'Página:', currentPage);
      } else {
        if (reset) {
          Alert.alert('Error', 'No se pudieron cargar los usuarios');
        }
      }
    } catch (error) {
      console.error('❌ Users: Error cargando usuarios:', error);
      if (reset) {
        Alert.alert('Error', 'Error al cargar los usuarios');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      loadUsers(false);
    }
  }, [loadingMore, pagination.hasMore, pagination.page]);

  const calculateStats = (usersData) => {
    const stats = {
      total: usersData.length,
      admin: 0,
      user: 0,
      gate: 0,
      worker: 0,
      normal: 0,
      super_admin: 0,
    };

    usersData.forEach(user => {
      if (user.role && stats.hasOwnProperty(user.role)) {
        stats[user.role]++;
      }
    });

    setUserStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    await loadUsers(true);
    setRefreshing(false);
  };

  const handleCreateUser = () => {
    setCreateUserModalVisible(true);
  };

  const handleUserCreated = () => {
    // Recargar desde el principio
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(true);
  };

  const handleUserUpdated = () => {
    // Recargar desde el principio
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(true);
  };

  // Función para buscar usuarios usando el servicio legacy
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando usuarios con query:', query);
      
      // Usar el endpoint legacy para obtener todos los usuarios
      const result = await api.getUsers(''); // Sin tipo para obtener todos
      
      if (result.success && result.users) {
        // Filtrar localmente por nombre, apellido, doc_id, email, username
        const filteredUsers = result.users.filter(user => {
          const searchLower = query.toLowerCase();
          return (
            user.first_name?.toLowerCase().includes(searchLower) ||
            user.last_name?.toLowerCase().includes(searchLower) ||
            user.doc_id?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.username?.toLowerCase().includes(searchLower) ||
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
          );
        });
        
        console.log('🔍 Usuarios encontrados:', filteredUsers.length);
        setUsers(filteredUsers);
        setShowSearchResults(true);
        calculateStats(filteredUsers);
      }
    } catch (error) {
      console.error('❌ Error buscando usuarios:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar búsqueda
  const clearSearch = () => {
    setSearchText('');
    setShowSearchResults(false);
    // Recargar los usuarios paginados
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(true);
  };

  // Funciones para filtro por tipo de usuario
  const filterUsersByType = (usersToFilter, userTypeId) => {
    if (userTypeId === 'all') {
      return usersToFilter;
    }
    return usersToFilter.filter(user => user.role === userTypeId);
  };

  const handleUserTypeFilter = (userTypeId) => {
    console.log('🔽 Filtrando por tipo de usuario:', userTypeId);
    setSelectedUserType(userTypeId);
    setShowUserTypeFilter(false);
    
    if (showSearchResults) {
      // Si estamos en modo búsqueda, filtrar los resultados actuales
      const filteredUsers = filterUsersByType(users, userTypeId);
      setUsers(filteredUsers);
      calculateStats(filteredUsers);
    } else {
      // Si no estamos en búsqueda, recargar con filtro
      setPagination(prev => ({ ...prev, page: 1 }));
      loadUsersWithFilter(userTypeId);
    }
  };

  const loadUsersWithFilter = async (userTypeId, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setUsers([]);
      }

      console.log('👥 Cargando usuarios con filtro:', userTypeId);
      
      // Usar el endpoint legacy para obtener todos los usuarios
      const result = await api.getUsers('');
      
      if (result.success && result.users) {
        let filteredUsers = result.users;
        
        // Aplicar filtro por tipo si no es 'all'
        if (userTypeId !== 'all') {
          filteredUsers = filterUsersByType(result.users, userTypeId);
        }
        
        setUsers(filteredUsers);
        calculateStats(filteredUsers);
        console.log('👥 Usuarios filtrados cargados:', filteredUsers.length);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios con filtro:', error);
      Alert.alert('Error', 'Error al cargar los usuarios filtrados');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUserTypeName = () => {
    const selectedType = userTypeFilters.find(type => type.id === selectedUserType);
    return selectedType ? selectedType.name : 'Todos los usuarios';
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserModalVisible(true);
  };

  const StatCard = ({ title, value, icon, color, library }) => (
    <Animatable.View 
      animation="fadeInUp" 
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.md,
        minHeight: 100,
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        height: '100%',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium,
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}>
            {value}
          </Text>
        </View>
        <View style={{
          backgroundColor: color + '15',
          borderRadius: borderRadius.full,
          padding: spacing.lg,
          marginLeft: spacing.md,
        }}>
          {library === 'MCI' ? (
            <MaterialCommunityIcons name={icon} size={28} color={color} />
          ) : (
            <Ionicons name={icon} size={28} color={color} />
          )}
        </View>
      </View>
    </Animatable.View>
  );

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrador',
      user: 'Conductor',
      gate: 'Guardia',
      worker: 'Trabajador',
      normal: 'Normal', // Mantener por compatibilidad
      super_admin: 'Super Admin', // Mantener por compatibilidad
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: colors.extended.red,
      user: colors.primary.green,
      gate: colors.extended.blue,
      worker: colors.extended.greenBright,
      normal: colors.text.secondary, // Mantener por compatibilidad
      super_admin: colors.extended.red, // Mantener por compatibilidad
    };
    return roleColors[role] || colors.text.secondary;
  };

  const UserAvatar = ({ user }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        try {
          const result = await api.getUserPicture(user.id, user.pub_id);
          if (result.success) {
            setImageUrl(result.imageUrl);
            setAuthToken(result.token);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.log('Error loading user image:', error);
          setImageError(true);
        }
      };

      if (user.id && user.pub_id) {
        loadImage();
      } else {
        setImageError(true);
      }
    }, [user.id, user.pub_id]);

    const handleImagePress = () => {
      if (imageUrl && !imageError) {
        setSelectedImage({
          uri: imageUrl,
          user: user,
          token: authToken
        });
        setImageModalVisible(true);
      }
    };

    if (imageError || !imageUrl) {
      return (
        <View style={{
          backgroundColor: getRoleColor(user.role) + '20',
          borderRadius: borderRadius.full,
          width: 64,
          height: 64,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="person" size={28} color={getRoleColor(user.role)} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          e.stopPropagation();
          handleImagePress();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 64,
          height: 64,
          borderRadius: borderRadius.full,
          borderWidth: isHovered ? 3 : 0,
          borderColor: isHovered ? getRoleColor(user.role) : 'transparent',
          padding: isHovered ? 0 : 1.5,
          transform: [{ scale: isHovered ? 1.05 : 1 }],
        }}
      >
        <Image
          source={{
            uri: imageUrl,
            headers: authToken ? {
              'Authorization': `Bearer ${authToken}`,
            } : undefined
          }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: borderRadius.full,
            backgroundColor: colors.background.light,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(error) => {
            console.log('Image failed to load for user:', user.pub_id, error.nativeEvent.error);
            setImageError(true);
          }}
        />
        {!imageLoaded && !imageError && (
          <View style={{
            position: 'absolute',
            top: isHovered ? 1.5 : 0,
            left: isHovered ? 1.5 : 0,
            right: isHovered ? 1.5 : 0,
            bottom: isHovered ? 1.5 : 0,
            backgroundColor: getRoleColor(user.role) + '20',
            borderRadius: borderRadius.full,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="person" size={28} color={getRoleColor(user.role)} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const StatusIndicator = ({ active }) => (
    <View style={{
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: active === 'Y' ? colors.success : colors.error,
      borderRadius: borderRadius.full,
      width: 12,
      height: 12,
      borderWidth: 2,
      borderColor: colors.white,
      ...shadows.sm,
    }} />
  );

  const UserCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleEditUser(item)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          minHeight: 160,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: colors.primary.purple + '20',
          }),
        }}
      >
        <StatusIndicator active={item.active} />
        
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <UserAvatar user={item} />
          
          <View style={{ flex: 1, marginLeft: spacing.md, paddingRight: spacing.sm }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: isHovered ? colors.primary.purple : colors.text.primary,
              marginBottom: spacing.sm,
              lineHeight: typography.lineHeight.tight * typography.fontSize.lg,
            }} numberOfLines={2}>
              {item.first_name} {item.last_name}
            </Text>

            <View style={{
              backgroundColor: getRoleColor(item.role) + (isHovered ? '25' : '15'),
              borderColor: getRoleColor(item.role) + (isHovered ? '60' : '40'),
              borderWidth: 1,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.md,
              alignSelf: 'flex-start',
              marginBottom: spacing.md,
              transform: [{ scale: isHovered ? 1.05 : 1 }],
            }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: getRoleColor(item.role),
                fontWeight: typography.fontWeight.medium,
              }}>
                {getRoleDisplayName(item.role)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Ionicons 
                name="card-outline" 
                size={16} 
                color={isHovered ? colors.primary.purple : colors.text.secondary} 
              />
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: isHovered ? colors.primary.purple : colors.text.secondary,
                marginLeft: spacing.xs,
                fontWeight: typography.fontWeight.medium,
              }}>
                {item.doc_id}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Ionicons 
                name="at" 
                size={16} 
                color={isHovered ? colors.primary.purple : colors.text.secondary}
              />
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: isHovered ? colors.primary.purple : colors.text.secondary,
                marginLeft: spacing.xs,
                fontStyle: (!item.username || item.username === 'null' || item.username === 'undefined') ? 'italic' : 'normal',
                opacity: (!item.username || item.username === 'null' || item.username === 'undefined') ? 0.5 : 1,
              }} numberOfLines={1}>
                {item.username && item.username !== 'null' && item.username !== 'undefined' ? item.username : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons 
                name="mail-outline" 
                size={16} 
                color={isHovered ? colors.primary.purple : colors.text.secondary}
              />
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: isHovered ? colors.primary.purple : colors.text.secondary,
                marginLeft: spacing.xs,
                flex: 1,
                fontStyle: (!item.email || item.email === 'null' || item.email === 'undefined') ? 'italic' : 'normal',
                opacity: (!item.email || item.email === 'null' || item.email === 'undefined') ? 0.5 : 1,
              }} numberOfLines={1}>
                {item.email && item.email !== 'null' && item.email !== 'undefined' ? item.email : ''}
              </Text>
            </View>
          </View>
        </View>
        
        {isHovered && (
          <View style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            backgroundColor: colors.primary.purple,
            borderRadius: borderRadius.full,
            padding: spacing.xs,
            opacity: isHovered ? 1 : 0,
            transform: [{ scale: isHovered ? 1 : 0.8 }],
          }}>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const PaginationControls = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.white,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderRadius: borderRadius.xl,
      ...shadows.sm,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          textAlign: 'center',
        }}>
          Página {pagination.page} • {users.length} de {pagination.totalItems} usuarios
        </Text>
      </View>
      
      {pagination.hasMore && !loadingMore && (
        <TouchableOpacity
          onPress={loadMoreUsers}
          style={{
            backgroundColor: colors.primary.purple,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.white,
            marginRight: spacing.xs,
          }}>
            Cargar más
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.white} />
        </TouchableOpacity>
      )}
      
      {loadingMore && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
          <ActivityIndicator size="small" color={colors.primary.purple} />
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginLeft: spacing.sm,
          }}>
            Cargando...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <RoleGuard 
      allowedRoles={['admin', 'super_admin']}
      fallbackMessage="Solo los administradores pueden gestionar usuarios del sistema."
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
                Usuarios
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
                marginTop: spacing.xs,
              }}>
                Gestión de usuarios del sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleCreateUser}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              ...shadows.sm,
            }}
          >
            <Ionicons name="add" size={20} color={colors.primary.purple} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary.purple,
              marginLeft: spacing.xs,
            }}>
              Nuevo
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar and Filter Row */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}>
        {/* Combined Search and Filter Row */}
        <View style={{
          flexDirection: 'row',
          gap: spacing.md,
        }}>
          {/* Search Bar */}
          <View style={{
            flex: 2,
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
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
                fontSize: typography.fontSize.base,
                color: colors.text.primary,
                marginLeft: spacing.sm,
                paddingVertical: spacing.xs,
              }}
              placeholder="Buscar por nombre, documento, email..."
              placeholderTextColor={colors.text.secondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => searchUsers(searchText)}
              returnKeyType="search"
            />
            {searchText ? (
              <TouchableOpacity
                onPress={clearSearch}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.full,
                  padding: spacing.xs,
                  marginLeft: spacing.sm,
                }}
              >
                <Ionicons name="close" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : null}
            {searchText && !showSearchResults ? (
              <TouchableOpacity
                onPress={() => searchUsers(searchText)}
                style={{
                  backgroundColor: colors.primary.purple,
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  marginLeft: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.white,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Buscar
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* User Type Filter */}
          <View style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            ...shadows.sm,
          }}>
            <Ionicons name="filter" size={18} color={colors.text.secondary} />
            
            <TouchableOpacity
              onPress={() => setShowUserTypeFilter(true)}
              style={{
                flex: 1,
                backgroundColor: colors.background.light,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginLeft: spacing.sm,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium,
              }} numberOfLines={1}>
                {selectedUserType === 'all' ? 'Todos' : getSelectedUserTypeName()}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.text.secondary} />
            </TouchableOpacity>
            
            {selectedUserType !== 'all' && (
              <TouchableOpacity
                onPress={() => handleUserTypeFilter('all')}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.full,
                  padding: spacing.xs,
                  marginLeft: spacing.xs,
                }}
              >
                <Ionicons name="close" size={14} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results Indicator */}
        {showSearchResults && (
          <View style={{
            backgroundColor: colors.primary.purple + '10',
            borderRadius: borderRadius.lg,
            padding: spacing.sm,
            marginTop: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.primary.purple,
              fontWeight: typography.fontWeight.medium,
            }}>
              🔍 Mostrando resultados para "{searchText}"
            </Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.primary.purple,
                fontWeight: typography.fontWeight.medium,
              }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Results Indicator */}
        {selectedUserType !== 'all' && !showSearchResults && (
          <View style={{
            backgroundColor: colors.extended.blue + '10',
            borderRadius: borderRadius.lg,
            padding: spacing.sm,
            marginTop: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.extended.blue,
              fontWeight: typography.fontWeight.medium,
            }}>
              🔽 Mostrando solo: {getSelectedUserTypeName()}
            </Text>
            <TouchableOpacity onPress={() => handleUserTypeFilter('all')}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.extended.blue,
                fontWeight: typography.fontWeight.medium,
              }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards - Grid 2x1 */}
        <View style={{
          paddingHorizontal: spacing.lg,
          marginTop: spacing.md,
          marginBottom: spacing.lg,
        }}>
          <View style={{ 
            flexDirection: 'row',
            gap: spacing.lg,
            marginBottom: spacing.md,
          }}>
            <View style={{ flex: 1 }}>
              <StatCard
                title="Total Usuarios"
                value={userStats.total}
                icon="people-outline"
                color={colors.primary.green}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard
                title="Administradores"
                value={userStats.admin + userStats.super_admin}
                icon="shield-checkmark-outline"
                color={colors.primary.purple}
              />
            </View>
          </View>
        </View>

        {/* Users List */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}>
            Lista de Usuarios
          </Text>

          {loading ? (
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: spacing['3xl'],
            }}>
              <ActivityIndicator size="large" color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.lg,
                color: colors.text.secondary,
                marginTop: spacing.lg,
              }}>
                Cargando usuarios...
              </Text>
            </View>
          ) : users.length === 0 ? (
            <View style={{
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
                <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
              </View>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs,
              }}>
                No hay usuarios
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                No se encontraron usuarios en el sistema
              </Text>
            </View>
          ) : (
            // Grid responsivo para usuarios
            <View>
              {isTabletOrDesktop ? (
                // Layout para tablet/desktop - 3 columnas
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.lg,
                }}>
                  {users.map((user) => (
                    <View key={user.pub_id} style={{ flex: 1, minWidth: '30%', maxWidth: '32%' }}>
                      <UserCard item={user} />
                    </View>
                  ))}
                </View>
              ) : (
                // Layout para móvil - columna única
                <View>
                  {users.map((user) => (
                    <UserCard key={user.pub_id} item={user} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Pagination Controls - Solo mostrar si no estamos en modo búsqueda */}
        {!loading && users.length > 0 && !showSearchResults && <PaginationControls />}
      </ScrollView>
      
      {/* Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              backgroundColor: colors.white + '20',
              borderRadius: borderRadius.full,
              padding: spacing.md,
              zIndex: 1,
            }}
            onPress={() => {
              setImageModalVisible(false);
              setSelectedImage(null);
            }}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={{ alignItems: 'center' }}>
              <Image
                source={{
                  uri: selectedImage.uri,
                  headers: selectedImage.token ? {
                    'Authorization': `Bearer ${selectedImage.token}`,
                  } : undefined
                }}
                style={{
                  width: Math.min(350, Dimensions.get('window').width * 0.8),
                  height: Math.min(350, Dimensions.get('window').width * 0.8),
                  borderRadius: borderRadius.xl,
                  backgroundColor: colors.background.light,
                }}
                resizeMode="cover"
              />
              
              <View style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
                marginTop: spacing.lg,
                alignItems: 'center',
                minWidth: 250,
                ...shadows.lg,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  marginBottom: spacing.xs,
                  textAlign: 'center',
                }}>
                  {selectedImage.user.first_name} {selectedImage.user.last_name}
                </Text>
                
                <View style={{
                  backgroundColor: getRoleColor(selectedImage.user.role) + '20',
                  borderColor: getRoleColor(selectedImage.user.role) + '40',
                  borderWidth: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.sm,
                }}>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: getRoleColor(selectedImage.user.role),
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    {getRoleDisplayName(selectedImage.user.role)}
                  </Text>
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}>
                  <Ionicons name="card-outline" size={16} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    {selectedImage.user.doc_id}
                  </Text>
                </View>
                
                {selectedImage.user.username && selectedImage.user.username !== 'null' && selectedImage.user.username !== 'undefined' && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: spacing.xs,
                  }}>
                    <Ionicons name="at" size={16} color={colors.text.secondary} />
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginLeft: spacing.xs,
                    }}>
                      {selectedImage.user.username}
                    </Text>
                  </View>
                )}
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                    fontStyle: (!selectedImage.user.email || selectedImage.user.email === 'null' || selectedImage.user.email === 'undefined') ? 'italic' : 'normal',
                    opacity: (!selectedImage.user.email || selectedImage.user.email === 'null' || selectedImage.user.email === 'undefined') ? 0.5 : 1,
                  }}>
                    {selectedImage.user.email && selectedImage.user.email !== 'null' && selectedImage.user.email !== 'undefined' ? selectedImage.user.email : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
      
      {/* Create User Modal */}
      <CreateUserModal
        visible={createUserModalVisible}
        onClose={() => setCreateUserModalVisible(false)}
        onUserCreated={handleUserCreated}
      />
      
      {/* Edit User Modal */}
      <EditUserModal
        visible={editUserModalVisible}
        onClose={() => {
          setEditUserModalVisible(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />
      
      {/* User Type Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUserTypeFilter}
        onRequestClose={() => setShowUserTypeFilter(false)}
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
            maxHeight: '70%',
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
                Filtrar por Tipo de Usuario
              </Text>
              
              <TouchableOpacity
                onPress={() => setShowUserTypeFilter(false)}
                style={{
                  backgroundColor: colors.white + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                }}
              >
                <Ionicons name="close" size={20} color={colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            {/* Content */}
            <ScrollView style={{ 
              maxHeight: 400,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}>
              {userTypeFilters.map((userType) => (
                <TouchableOpacity
                  key={userType.id}
                  onPress={() => handleUserTypeFilter(userType.id)}
                  style={{
                    backgroundColor: selectedUserType === userType.id ? userType.color + '10' : 'transparent',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: selectedUserType === userType.id ? 2 : 1,
                    borderColor: selectedUserType === userType.id ? userType.color : colors.background.light,
                  }}
                >
                  <View style={{
                    backgroundColor: userType.color + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.md,
                    marginRight: spacing.md,
                  }}>
                    <Ionicons name={userType.icon} size={24} color={userType.color} />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: selectedUserType === userType.id ? typography.fontWeight.bold : typography.fontWeight.medium,
                      color: selectedUserType === userType.id ? userType.color : colors.text.primary,
                      marginBottom: spacing.xs,
                    }}>
                      {userType.name}
                    </Text>
                    
                    {userType.id !== 'all' && (
                      <Text style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                      }}>
                        Mostrar solo usuarios de tipo {userType.name.toLowerCase()}
                      </Text>
                    )}
                    
                    {userType.id === 'all' && (
                      <Text style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                      }}>
                        Mostrar todos los tipos de usuario
                      </Text>
                    )}
                  </View>
                  
                  {selectedUserType === userType.id && (
                    <View style={{
                      backgroundColor: userType.color,
                      borderRadius: borderRadius.full,
                      padding: spacing.xs,
                    }}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={{
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.background.light,
              backgroundColor: colors.white,
              borderBottomLeftRadius: borderRadius.xl,
              borderBottomRightRadius: borderRadius.xl,
            }}>
              <TouchableOpacity
                onPress={() => setShowUserTypeFilter(false)}
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
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default UsersScreen;