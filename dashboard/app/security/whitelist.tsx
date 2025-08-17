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

const WhitelistScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWhitelisted: 0,
    whitelistUsers: 0,
    whitelistVehicles: 0,
    whitelistCompanies: 0,
    recentApprovals: 0,
    activeAuthorizations: 0,
  });

  useEffect(() => {
    loadWhitelistData();
  }, []);

  const loadWhitelistData = async () => {
    try {
      console.log('✅ Whitelist: Cargando datos de lista blanca...');
      // TODO: Implementar llamadas a la API
      setStats({
        totalWhitelisted: 324,
        whitelistUsers: 245,
        whitelistVehicles: 67,
        whitelistCompanies: 12,
        recentApprovals: 18,
        activeAuthorizations: 298,
      });
    } catch (error) {
      console.error('❌ Whitelist: Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWhitelistData();
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

  const WhitelistCategoryCard = ({ title, description, icon, color, onPress, library, count, disabled = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.95}
        onPress={disabled ? undefined : onPress}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: disabled ? colors.background.light : colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && !disabled && {
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
                color: isHovered && !disabled ? color : colors.text.primary,
                marginBottom: spacing.xs,
                transition: 'color 0.2s ease',
              }}>
                {title}
              </Text>
              
              {count !== undefined && count > 0 && (
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
                    {count}
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
            
            {disabled && (
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.warning,
                fontStyle: 'italic',
                marginTop: spacing.xs,
              }}>
                Próximamente disponible
              </Text>
            )}
          </View>

          {/* Arrow */}
          {!disabled && (
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
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleUsersWhitelist = () => {
    // TODO: Implementar navegación a usuarios en lista blanca
    Alert.alert(
      'Usuarios en Lista Blanca',
      'Funcionalidad en desarrollo. Aquí podrás gestionar usuarios autorizados.',
      [{ text: 'OK' }]
    );
  };

  const handleVehiclesWhitelist = () => {
    // TODO: Implementar navegación a vehículos en lista blanca
    Alert.alert(
      'Vehículos en Lista Blanca',
      'Funcionalidad en desarrollo. Aquí podrás gestionar vehículos autorizados.',
      [{ text: 'OK' }]
    );
  };

  const handleCompaniesWhitelist = () => {
    // TODO: Implementar navegación a empresas en lista blanca
    Alert.alert(
      'Empresas en Lista Blanca',
      'Funcionalidad en desarrollo. Aquí podrás gestionar empresas autorizadas.',
      [{ text: 'OK' }]
    );
  };

  const handleAddToWhitelist = () => {
    Alert.alert(
      'Agregar a Lista Blanca',
      'Selecciona el tipo de elemento a autorizar:',
      [
        { text: 'Usuario', onPress: () => handleUsersWhitelist() },
        { text: 'Vehículo', onPress: () => handleVehiclesWhitelist() },
        { text: 'Empresa', onPress: () => handleCompaniesWhitelist() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.success, colors.extended.greenBright]}
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
                Lista Blanca
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestiona elementos autorizados en el sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleAddToWhitelist}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={20} color={colors.success} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.success,
              marginLeft: spacing.xs,
            }}>
              Autorizar
            </Text>
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
              title="Total Autorizados"
              value={stats.totalWhitelisted}
              icon="shield-checkmark-outline"
              color={colors.success}
            />
            <StatCard
              title="Aprobaciones Recientes"
              value={stats.recentApprovals}
              icon="checkmark-circle-outline"
              color={colors.extended.greenBright}
            />
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCard
              title="Autorizaciones Activas"
              value={stats.activeAuthorizations}
              icon="key-outline"
              color={colors.extended.greenLight}
            />
            <StatCard
              title="Total Categorías"
              value={3}
              icon="list-outline"
              color={colors.extended.greenYellow}
            />
          </View>
        </View>

        {/* Whitelist Categories */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}>
            Categorías de Lista Blanca
          </Text>

          <WhitelistCategoryCard
            title="Usuarios Autorizados"
            description="Personas con acceso garantizado al sistema con permisos especiales"
            icon="person-add-outline"
            color={colors.success}
            onPress={handleUsersWhitelist}
            count={stats.whitelistUsers}
          />

          <WhitelistCategoryCard
            title="Vehículos Autorizados"
            description="Vehículos con acceso prioritario y sin restricciones a las instalaciones"
            icon="car-outline"
            color={colors.extended.greenBright}
            onPress={handleVehiclesWhitelist}
            count={stats.whitelistVehicles}
            disabled={true}
          />

          <WhitelistCategoryCard
            title="Empresas Autorizadas"
            description="Organizaciones con acceso preferencial y permisos extendidos"
            icon="business-outline"
            color={colors.extended.greenLight}
            onPress={handleCompaniesWhitelist}
            count={stats.whitelistCompanies}
            disabled={true}
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
              { 
                action: 'Usuario agregado a lista blanca', 
                details: 'Ana Torres - RUT: 98.765.432-1',
                time: 'Hace 1 hora', 
                icon: 'person-add', 
                color: colors.success 
              },
              { 
                action: 'Acceso autorizado exitoso', 
                details: 'Usuario VIP accedió sin restricciones',
                time: 'Hace 2 horas', 
                icon: 'checkmark-circle', 
                color: colors.extended.greenBright 
              },
              { 
                action: 'Empresa autorizada actualizada', 
                details: 'Tech Solutions S.A. - Permisos renovados',
                time: 'Hace 4 horas', 
                icon: 'business', 
                color: colors.extended.greenLight 
              },
            ].map((activity, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: spacing.md,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: colors.background.light,
                }}
              >
                <View style={{
                  backgroundColor: activity.color + '20',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                  marginRight: spacing.md,
                  marginTop: spacing.xs,
                }}>
                  <Ionicons name={activity.icon} size={16} color={activity.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginBottom: spacing.xs,
                  }}>
                    {activity.action}
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}>
                    {activity.details}
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
  );
};

export default WhitelistScreen;