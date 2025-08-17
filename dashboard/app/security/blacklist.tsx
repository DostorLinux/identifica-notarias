import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const BlacklistScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBlacklisted: 0,
    blacklistUsers: 0,
    blacklistVehicles: 0,
    blacklistCompanies: 0,
    recentBlocks: 0,
    activeBlocks: 0,
  });

  useEffect(() => {
    loadBlacklistData();
  }, []);

  const loadBlacklistData = async () => {
    try {
      console.log('🚫 Blacklist: Cargando datos de lista negra...');
      // TODO: Implementar llamadas a la API
      setStats({
        totalBlacklisted: 26,
        blacklistUsers: 15,
        blacklistVehicles: 8,
        blacklistCompanies: 3,
        recentBlocks: 5,
        activeBlocks: 21,
      });
    } catch (error) {
      console.error('❌ Blacklist: Error cargando datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlacklistData();
    setRefreshing(false);
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

  const BlacklistCategoryCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress, 
    library, 
    count, 
    disabled = false 
  }) => {
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
          marginBottom: spacing.lg,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && !disabled && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: color + '20',
          }),
          minHeight: 220,
        }}
      >
        {/* Header con icono y badge */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}>
          <View style={{
            backgroundColor: color + '15',
            borderRadius: borderRadius.full,
            padding: spacing.md,
          }}>
            {library === 'MCI' ? (
              <MaterialCommunityIcons name={icon} size={32} color={color} />
            ) : (
              <Ionicons name={icon} size={32} color={color} />
            )}
          </View>

          {count !== undefined && count > 0 && (
            <View style={{
              backgroundColor: color,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              minWidth: 32,
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

        {/* Título */}
        <Text style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: isHovered && !disabled ? color : colors.text.primary,
          marginBottom: spacing.sm,
          lineHeight: typography.lineHeight.tight * typography.fontSize.lg,
        }}>
          {title}
        </Text>
        
        {/* Descripción */}
        <Text style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
          marginBottom: spacing.md,
          flex: 1,
        }}>
          {description}
        </Text>
        
        {/* Footer */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}>
          {disabled ? (
            <Text style={{
              fontSize: typography.fontSize.xs,
              color: colors.warning,
              fontStyle: 'italic',
            }}>
              Próximamente disponible
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {/* Arrow indicator */}
          {!disabled && (
            <View style={{
              backgroundColor: isHovered ? color : colors.background.light,
              borderRadius: borderRadius.full,
              padding: spacing.sm,
              transform: [{ scale: isHovered ? 1.1 : 1 }],
            }}>
              <Ionicons 
                name="chevron-forward" 
                size={18}
                color={isHovered ? colors.white : colors.text.secondary} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleUsersBlacklist = () => {
    router.push('/security/blacklist-categories/users');
  };

  const handleVehiclesBlacklist = () => {
    router.push('/security/blacklist-categories/vehicles');
  };

  const handleCompaniesBlacklist = () => {
    router.push('/security/blacklist-categories/companies');
  };

  const handleAddToBlacklist = () => {
    Alert.alert(
      'Agregar a Lista Negra',
      'Selecciona el tipo de elemento a agregar:',
      [
        { text: 'Usuario', onPress: () => handleUsersBlacklist() },
        { text: 'Vehículo', onPress: () => handleVehiclesBlacklist() },
        { text: 'Empresa', onPress: () => handleCompaniesBlacklist() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Calcular el ancho de las tarjetas basado en el ancho de pantalla
  const cardWidth = screenWidth > 768 ? (screenWidth - (spacing.lg * 2) - spacing.lg) / 2 : screenWidth - (spacing.lg * 2);
  const isTabletOrDesktop = screenWidth > 768;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
              }}>
                Lista Negra
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
                marginTop: spacing.xs,
              }}>
                Gestiona elementos denegados en el sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleAddToBlacklist}
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

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards - Grid 2x1 */}
        <View style={{
          paddingHorizontal: spacing.lg,
          marginTop: -spacing.md,
          marginBottom: spacing.xl,
        }}>
          <View style={{ 
            flexDirection: 'row',
            gap: spacing.lg,
            marginBottom: spacing.md,
          }}>
            <View style={{ flex: 1 }}>
              <StatCard
                title="Bloqueos Activos"
                value={stats.activeBlocks}
                icon="lock-closed-outline"
                color={colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard
                title="Total Categorías"
                value={3}
                icon="list-outline"
                color={colors.extended.red}
              />
            </View>
          </View>
        </View>

        {/* Blacklist Categories */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}>
            Categorías de Lista Negra
          </Text>

          {/* Grid responsivo para categorías */}
          {isTabletOrDesktop ? (
            // Layout para tablet/desktop - 3 columnas
            <View style={{
              flexDirection: 'row',
              gap: spacing.lg,
            }}>
              <View style={{ flex: 1 }}>
                <BlacklistCategoryCard
                  title="Usuarios Denegados"
                  description="Personas que tienen prohibido el acceso al sistema por razones de seguridad"
                  icon="person-remove-outline"
                  color={colors.error}
                  onPress={handleUsersBlacklist}
                  count={stats.blacklistUsers}
                />
              </View>
              <View style={{ flex: 1 }}>
                <BlacklistCategoryCard
                  title="Vehículos Denegados"
                  description="Vehículos que no están autorizados para ingresar a las instalaciones"
                  icon="car-outline"
                  color={colors.extended.red}
                  onPress={handleVehiclesBlacklist}
                  count={stats.blacklistVehicles}
                />
              </View>
              <View style={{ flex: 1 }}>
                <BlacklistCategoryCard
                  title="Empresas Denegadas"
                  description="Organizaciones que tienen restricciones de acceso al sistema"
                  icon="business-outline"
                  color={colors.extended.redLight}
                  onPress={handleCompaniesBlacklist}
                  count={stats.blacklistCompanies}
                />
              </View>
            </View>
          ) : (
            // Layout para móvil - columna única
            <View>
              <BlacklistCategoryCard
                title="Usuarios Denegados"
                description="Personas que tienen prohibido el acceso al sistema por razones de seguridad"
                icon="person-remove-outline"
                color={colors.error}
                onPress={handleUsersBlacklist}
                count={stats.blacklistUsers}
              />
              
              <BlacklistCategoryCard
                title="Vehículos Denegados"
                description="Vehículos que no están autorizados para ingresar a las instalaciones"
                icon="car-outline"
                color={colors.extended.red}
                onPress={handleVehiclesBlacklist}
                count={stats.blacklistVehicles}
              />
              
              <BlacklistCategoryCard
                title="Empresas Denegadas"
                description="Organizaciones que tienen restricciones de acceso al sistema"
                icon="business-outline"
                color={colors.extended.redLight}
                onPress={handleCompaniesBlacklist}
                count={stats.blacklistCompanies}
              />
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.lg,
          }}>
            Actividad Reciente
          </Text>

          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            ...shadows.md,
          }}>
            {[
              { 
                action: 'Usuario agregado a lista negra', 
                details: 'Juan Pérez - RUT: 12.345.678-9',
                time: 'Hace 2 horas', 
                icon: 'person-remove', 
                color: colors.error 
              },
              { 
                action: 'Intento de acceso bloqueado', 
                details: 'Usuario en lista negra intentó acceder',
                time: 'Hace 3 horas', 
                icon: 'shield-off', 
                color: colors.extended.red 
              },
              { 
                action: 'Usuario removido de lista negra', 
                details: 'María González - Apelación aprobada',
                time: 'Hace 1 día', 
                icon: 'checkmark-circle', 
                color: colors.success 
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
                  backgroundColor: activity.color + '15',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                  marginRight: spacing.md,
                  marginTop: spacing.xs,
                }}>
                  <Ionicons name={activity.icon} size={18} color={activity.color} />
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

export default BlacklistScreen;