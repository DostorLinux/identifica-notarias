import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import RoleGuard from '../components/RoleGuard';

const SecurityScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    blacklistUsers: 0,
    blacklistVehicles: 0,
    blacklistCompanies: 0,
    whitelistUsers: 0,
    whitelistVehicles: 0,
    whitelistCompanies: 0,
    totalBlacklist: 0,
    totalWhitelist: 0,
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      console.log('🔒 Security: Cargando datos de seguridad...');
      // TODO: Implementar llamadas a la API para obtener estadísticas
      // Datos de ejemplo por ahora
      setStats({
        blacklistUsers: 15,
        blacklistVehicles: 8,
        blacklistCompanies: 3,
        whitelistUsers: 245,
        whitelistVehicles: 67,
        whitelistCompanies: 12,
        totalBlacklist: 26,
        totalWhitelist: 324,
      });
    } catch (error) {
      console.error('❌ Security: Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
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

  const SecurityOptionCard = ({ title, description, icon, color, onPress, library, badgeCount }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
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
            borderColor: color + '20',
          }),
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Icon */}
          <View style={{
            backgroundColor: color + '20',
            borderRadius: borderRadius.full,
            padding: spacing.lg,
            marginRight: spacing.md,
          }}>
            {library === 'MCI' ? (
              <MaterialCommunityIcons name={icon} size={32} color={color} />
            ) : (
              <Ionicons name={icon} size={32} color={color} />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: isHovered ? color : colors.text.primary,
                marginBottom: spacing.xs,
                transition: 'color 0.2s ease',
              }}>
                {title}
              </Text>
              
              {badgeCount !== undefined && badgeCount > 0 && (
                <View style={{
                  backgroundColor: color,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  minWidth: 28,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.white,
                  }}>
                    {badgeCount}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.normal * typography.fontSize.base,
            }}>
              {description}
            </Text>
          </View>

          {/* Arrow */}
          <View style={{
            backgroundColor: isHovered ? color : colors.background.light,
            borderRadius: borderRadius.full,
            padding: spacing.sm,
            marginLeft: spacing.md,
            transform: [{ scale: isHovered ? 1.1 : 1 }],
            transition: 'all 0.2s ease',
          }}>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isHovered ? colors.white : colors.text.secondary} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleBlacklistNavigation = () => {
    router.push('/security/blacklist');
  };

  const handleWhitelistNavigation = () => {
    router.push('/security/whitelist');
  };

  return (
    <RoleGuard 
      allowedRoles={['admin', 'super_admin']}
      fallbackMessage="Solo los administradores pueden acceder a las configuraciones de seguridad."
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
                Seguridad
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestión de listas de acceso y control
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Configuración',
                'Funcionalidad de configuración avanzada en desarrollo.',
                [{ text: 'OK' }]
              );
            }}
            style={{
              backgroundColor: colors.white + '20',
              borderRadius: borderRadius.full,
              padding: spacing.md,
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={{
          paddingHorizontal: spacing.md,
          marginTop: -spacing.md,
          marginBottom: spacing.lg,
        }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCard
              title="Total Lista Negra"
              value={stats.totalBlacklist}
              icon="shield-off-outline"
              color={colors.error}
            />
            <StatCard
              title="Total Lista Blanca"
              value={stats.totalWhitelist}
              icon="shield-checkmark-outline"
              color={colors.success}
            />
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCard
              title="Usuarios Denegados"
              value={stats.blacklistUsers}
              icon="person-remove-outline"
              color={colors.extended.red}
            />
            <StatCard
              title="Usuarios Autorizados"
              value={stats.whitelistUsers}
              icon="person-add-outline"
              color={colors.extended.greenBright}
            />
          </View>
        </View>

        {/* Security Options */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}>
            Opciones de Seguridad
          </Text>

          <SecurityOptionCard
            title="Lista Negra"
            description="Gestiona usuarios, vehículos y empresas denegados que no pueden acceder al sistema"
            icon="shield-off-outline"
            color={colors.error}
            onPress={handleBlacklistNavigation}
            badgeCount={stats.totalBlacklist}
          />

          <SecurityOptionCard
            title="Lista Blanca"
            description="Administra usuarios, vehículos y empresas autorizados con acceso garantizado"
            icon="shield-checkmark-outline"
            color={colors.success}
            onPress={handleWhitelistNavigation}
            badgeCount={stats.totalWhitelist}
          />
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
            {[
              { action: 'Usuario agregado a lista negra', time: 'Hace 2 horas', icon: 'person-remove', color: colors.error },
              { action: 'Empresa autorizada en lista blanca', time: 'Hace 4 horas', icon: 'business', color: colors.success },
              { action: 'Vehículo removido de lista negra', time: 'Hace 1 día', icon: 'car', color: colors.warning },
            ].map((activity, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: colors.background.light,
                }}
              >
                <View style={{
                  backgroundColor: activity.color + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                  marginRight: spacing.md,
                }}>
                  <Ionicons name={activity.icon} size={16} color={activity.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                  }}>
                    {activity.action}
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}>
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default SecurityScreen;