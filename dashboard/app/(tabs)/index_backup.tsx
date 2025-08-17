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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayEvents: 0,
    lastEvents: [],
  });

  console.log('📊 Dashboard: Usuario actual:', user?.username || 'Ninguno');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Dashboard: Cargando datos...');
      // Load dashboard statistics
      const usersResult = await api.getUsers();
      const eventsResult = await api.getLastEvents();
      
      console.log('📊 Dashboard: Resultados cargados:', {
        users: usersResult.success,
        events: !!eventsResult.last_events
      });
      
      setStats({
        totalUsers: usersResult.success ? usersResult.users.length : 0,
        todayEvents: eventsResult.last_events ? eventsResult.last_events.length : 0,
        lastEvents: eventsResult.last_events || [],
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

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 Dashboard: Ejecutando logout...');
            try {
              const result = await logout();
              
              if (result.success) {
                console.log('✅ Dashboard: Logout exitoso');
              } else {
                console.log('⚠️ Dashboard: Logout con problemas pero forzando salida');
                // Incluso si hay error, la sesión ya fue limpiada en AuthContext
              }
              
              // La navegación debería ser automática por el AuthContext
              
            } catch (error) {
              console.error('❌ Dashboard: Error crítico en logout:', error);
              // La sesión ya fue limpiada en AuthContext incluso con error
              Alert.alert('Sesión cerrada', 'Se cerró la sesión con algunos problemas técnicos');
            }
          }
        },
      ]
    );
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
            paddingTop: spacing.xl,
            paddingBottom: spacing['2xl'],
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{
                  width: 200,
                  height: 80,
                  resizeMode: 'contain',
                  tintColor: colors.white,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: colors.white + '20',
                borderRadius: borderRadius.full,
                padding: spacing.md,
              }}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={{ marginTop: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              color: colors.white,
              opacity: 0.9,
            }}>
              Bienvenido,
            </Text>
            <Text style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
            }}>
              {user?.first_name || user?.username || 'Usuario'}
            </Text>
          </View>
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: spacing.md,
          marginTop: -spacing.xl,
          marginBottom: spacing.lg,
        }}>
          <StatCard
            title="Total Conductores"
            value={stats.totalUsers}
            icon="car-outline"
            color={colors.primary.green}
          />
          <StatCard
            title="Total Colaboradores"
            value={stats.totalUsers}
            icon="people-outline"
            color={colors.primary.green}
          />
          <StatCard
            title="Eventos Hoy"
            value={stats.todayEvents}
            icon="time-outline"
            color={colors.primary.purple}
          />
          <StatCard
            title="Dispositivos"
            value={0}
            icon="face-recognition"
            color={colors.primary.green}
            library="MCI"
          />
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            Acciones Rápidas
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[
              { title: 'Usuarios',        icon: 'people-outline',           color: colors.primary.green, route: 'explore' },
              { title: 'Eventos',         icon: 'calendar-outline',         color: colors.primary.green },
              { title: 'Parking',         icon: 'car-outline',              color: colors.primary.green },
              { title: 'Empresas',        icon: 'business-outline',         color: colors.primary.green },
              { title: 'Seguridad',       icon: 'shield-checkmark-outline', color: colors.primary.green },
              { title: 'Establecimientos',icon: 'storefront-outline',       color: colors.primary.green },
              { title: 'Dispositivos',    icon: 'face-recognition',          color: colors.primary.green, library: 'MCI' },
              { title: 'Invitaciones',    icon: 'paper-plane-outline',       color: colors.primary.green },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (action.route) {
                    router.push(`/(tabs)/${action.route}`);
                  } else {
                    Alert.alert(
                      action.title,
                      'Funcionalidad en desarrollo. Próximamente disponible.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  padding: spacing.md,
                  marginRight: spacing.sm,
                  marginBottom: spacing.sm,
                  alignItems: 'center',
                  width: '23%',
                  ...shadows.sm,
                }}
              >
                <View style={{
                  backgroundColor: colors.primary.green + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }}>
                  {action.library === 'MCI' ? (
                    <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
                  ) : (
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  )}
                </View>
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.md,
          }}>
            Actividad Reciente
          </Text>

          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            ...shadows.sm,
          }}>
            {stats.lastEvents.length > 0 ? (
              stats.lastEvents.slice(0, 5).map((event, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderBottomWidth: index < stats.lastEvents.length - 1 ? 1 : 0,
                    borderBottomColor: colors.background.light,
                  }}
                >
                  <View style={{
                    backgroundColor: colors.primary.green + '20',
                    borderRadius: borderRadius.full,
                    padding: spacing.sm,
                    marginRight: spacing.md,
                  }}>
                    <Ionicons name="checkmark" size={16} color={colors.primary.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                    }}>
                      Ubicación {event.location}
                    </Text>
                    <Text style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}>
                      Hace {event.elapsed} segundos
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                No hay actividad reciente
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
