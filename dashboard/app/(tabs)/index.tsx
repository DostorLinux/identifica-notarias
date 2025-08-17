import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Prevenir múltiples clicks
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayEvents: 0,
    lastEvents: [],
    totalDevices: 0,
    activeDevices: 0,
  });
  const [dashboardActions, setDashboardActions] = useState(null); // Acciones desde el servidor
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const router = useRouter();


  useEffect(() => {
    loadDashboardData();
    loadUserPermissions();
  }, []);

  // Configuración de fallback basada en roles (actual)
  const getFallbackActions = () => {
    const userRole = user?.role || 'user';
    
    return [
      { 
        id: 'usuarios', 
        title: 'Usuarios', 
        icon: 'people-outline', 
        color: colors.primary.green, 
        route: 'explore', 
        enabled: ['admin', 'super_admin'].includes(userRole)
      },
      { 
        id: 'marcaciones', 
        title: 'Marcaciones', 
        icon: 'calendar-outline', 
        color: colors.primary.green, 
        route: 'marcaciones', 
        enabled: ['admin', 'super_admin', 'gate'].includes(userRole)
      },
      { 
        id: 'parking', 
        title: 'Parking', 
        icon: 'car-outline', 
        color: colors.primary.green, 
        enabled: ['admin', 'super_admin'].includes(userRole)
      },
      { 
        id: 'empresas', 
        title: 'Empresas', 
        icon: 'business-outline', 
        color: colors.primary.green, 
        route: 'companies', 
        enabled: ['admin', 'super_admin'].includes(userRole)
      },
      { 
        id: 'seguridad', 
        title: 'Seguridad', 
        icon: 'shield-checkmark-outline', 
        color: colors.primary.green, 
        route: 'security', 
        enabled: ['admin', 'super_admin'].includes(userRole)
      },
      { 
        id: 'establecimientos', 
        title: 'Establecimientos', 
        icon: 'storefront-outline', 
        color: colors.primary.green, 
        enabled: ['admin', 'super_admin'].includes(userRole)
      },
      { 
        id: 'dispositivos', 
        title: 'Dispositivos', 
        icon: 'face-recognition', 
        color: colors.primary.green, 
        library: 'MCI', 
        route: 'dispositivos', 
        enabled: ['admin', 'super_admin', 'gate'].includes(userRole)
      },
      { 
        id: 'invitaciones', 
        title: 'Invitaciones', 
        icon: 'paper-plane-outline', 
        color: colors.primary.green, 
        route: 'invitaciones', 
        enabled: ['admin', 'super_admin', 'gate', 'worker'].includes(userRole)
      },
      { 
        id: 'agendamiento', 
        title: 'Agendamiento', 
        icon: 'calendar-outline', 
        color: colors.primary.green, 
        route: 'agendamiento', 
        enabled: ['admin', 'super_admin', 'empresa'].includes(userRole)
      },
    ];
  };

  const loadUserPermissions = async () => {
    try {
      console.log('🔐 Dashboard: Cargando permisos de usuario desde servidor...');
      
      // Intentar obtener permisos desde el servicio web
      const permissionsResult = await api.getUserPermissions();
      
      if (permissionsResult.success && permissionsResult.dashboard_actions) {
        console.log('✅ Dashboard: Permisos cargados desde servidor');
        setDashboardActions(permissionsResult.dashboard_actions);
        setPermissionsLoaded(true);
        return;
      }
      
      console.log('⚠️ Dashboard: Servicio de permisos no disponible, usando fallback local');
      setDashboardActions(getFallbackActions());
      setPermissionsLoaded(true);
      
    } catch (error) {
      console.error('❌ Dashboard: Error cargando permisos, usando fallback:', error);
      setDashboardActions(getFallbackActions());
      setPermissionsLoaded(true);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('📊 Dashboard: Cargando datos...');
      // Load dashboard statistics
      const usersResult = await api.getUsers();
      const eventsResult = await api.getLastEvents();
      const devicesResult = await api.getDevices({ page: 1, size: 100 }); // Cargar más dispositivos para stats
      
      console.log('📊 Dashboard: Resultados cargados:', {
        users: usersResult.success,
        events: !!eventsResult.last_events,
        devices: !!devicesResult.data
      });
      
      // Calcular dispositivos activos
      let activeDevices = 0;
      if (devicesResult.data) {
        devicesResult.data.forEach(device => {
          if (Array.isArray(device)) {
            // device[14] es is_active, device[3] es active
            if (device[14] === "1" || device[3] === "1") {
              activeDevices++;
            }
          }
        });
      }
      
      setStats({
        totalUsers: usersResult.success ? usersResult.users.length : 0,
        todayEvents: eventsResult.last_events ? eventsResult.last_events.length : 0,
        lastEvents: eventsResult.last_events || [],
        totalDevices: devicesResult.total || (devicesResult.data ? devicesResult.data.length : 0),
        activeDevices: activeDevices,
      });
    } catch (error) {
      console.error('❌ Dashboard: Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    let confirmLogout = false;

    if (Platform.OS === 'web') {
      confirmLogout = window.confirm('¿Estás seguro que deseas cerrar sesión?');
    } else {
      confirmLogout = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Cerrar Sesión',
          '¿Estás seguro que deseas cerrar sesión?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Cerrar Sesión', style: 'destructive', onPress: () => resolve(true) },
          ],
          { cancelable: true }
        );
      });
    }

    if (!confirmLogout) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      console.log('✅ Dashboard: Logout completado en AuthContext');
      router.replace('/login');
    } catch (error) {
      console.error('❌ Dashboard: Error durante logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const StatCard = ({ title, value, icon, color, library }) => (
    <Animatable.View animation="fadeInUp" style={{
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginHorizontal: spacing.xs,
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
            fontSize: typography.fontSize['3xl'],
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
            <MaterialCommunityIcons name={icon} size={24} color={color} />
          ) : (
            <Ionicons name={icon} size={24} color={color} />
          )}
        </View>
      </View>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={colors.gradients.purple}
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{
                  width: 150,
                  height: 60,
                  resizeMode: 'contain',
                  tintColor: colors.white,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={isLoggingOut}
              style={[
                styles.logoutButton,
                {
                  backgroundColor: isLoggingOut ? colors.text.disabled : colors.white + '20',
                  opacity: isLoggingOut ? 0.6 : 1,
                },
              ]}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="log-out-outline" size={24} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={{ marginTop: spacing.md }}>
            <Text style={{
              fontSize: typography.fontSize.base,
              color: colors.white,
              opacity: 0.9,
            }}>
              Bienvenido,
            </Text>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
            }}>
              {user?.first_name || user?.username || 'Usuario'}
            </Text>
          </View>
        </LinearGradient>

        {/* Statistics Cards - Only for admin and super_admin */}
        {user?.role !== 'empresa' && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: spacing.md,
            marginTop: -spacing.lg,
            marginBottom: spacing.md,
          }}>
            <StatCard
              title="Total Conductores"
              value={stats.totalUsers}
              icon="car-outline"
              color={colors.primary.green}
            />
            <StatCard
              title="Dispositivos Activos"
              value={stats.activeDevices}
              icon="face-recognition"
              color={colors.primary.green}
              library="MCI"
            />
            <StatCard
              title="Eventos Hoy"
              value={stats.todayEvents}
              icon="time-outline"
              color={colors.primary.purple}
            />
            <StatCard
              title="Total Dispositivos"
              value={stats.totalDevices}
              icon="face-recognition"
              color={colors.primary.green}
              library="MCI"
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            Módulos del Sistema
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {!permissionsLoaded ? (
              // Mostrar indicador de carga mientras se obtienen los permisos
              <View style={{ 
                width: '100%', 
                alignItems: 'center', 
                paddingVertical: spacing.xl 
              }}>
                <ActivityIndicator size="large" color={colors.primary.purple} />
                <Text style={{ 
                  marginTop: spacing.md, 
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.sm 
                }}>
                  Cargando permisos...
                </Text>
              </View>
            ) : (
              dashboardActions?.map((action, index) => {
                const isAllowed = action.enabled;
                
                return (
              <TouchableOpacity
                key={index}
                disabled={!isAllowed}
                onPress={() => {
                  if (!isAllowed) {
                    Alert.alert(
                      'Acceso Restringido',
                      `No tienes permisos para acceder a ${action.title}. Contacta al administrador si necesitas acceso.`,
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  if (action.route) {
                    // Check if it's a tab route or a separate screen
                    if (action.route === 'companies') {
                      router.push('/companies');
                    } else {
                      // Use tabs navigation for tab routes
                      router.push(`/(tabs)/${action.route}`);
                    }
                  } else {
                    Alert.alert(
                      action.title,
                      'Funcionalidad en desarrollo. Próximamente disponible.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                style={{
                  backgroundColor: isAllowed ? colors.white : colors.background.light,
                  borderRadius: borderRadius.xl,
                  padding: spacing.md,
                  marginRight: spacing.sm,
                  marginBottom: spacing.sm,
                  alignItems: 'center',
                  width: '23%',
                  opacity: isAllowed ? 1 : 0.5,
                  ...shadows.sm,
                }}
              >
                <View style={{
                  backgroundColor: isAllowed ? (action.color + '20') : (colors.text.secondary + '20'),
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }}>
                  {action.library === 'MCI' ? (
                    <MaterialCommunityIcons 
                      name={action.icon} 
                      size={24} 
                      color={isAllowed ? action.color : colors.text.secondary} 
                    />
                  ) : (
                    <Ionicons 
                      name={action.icon} 
                      size={24} 
                      color={isAllowed ? action.color : colors.text.secondary} 
                    />
                  )}
                </View>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: isAllowed ? colors.text.primary : colors.text.secondary,
                }}>
                  {action.title}
                </Text>
              </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  logoutButton: {
    borderRadius: borderRadius.full,
    padding: spacing.md,
  },
});