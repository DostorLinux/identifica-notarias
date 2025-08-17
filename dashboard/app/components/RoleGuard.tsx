import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackMessage?: string;
}

/**
 * Component that protects content based on user roles
 * @param allowedRoles - Array of roles that can access the content
 * @param children - Content to render if user has permission
 * @param fallbackMessage - Custom message to show when access is denied
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallbackMessage 
}) => {
  const { user } = useAuth();
  const userRole = user?.role;

  console.log('🛡️ RoleGuard: Verificando acceso para rol:', userRole, 'Roles permitidos:', allowedRoles);

  // If user role is not in allowed roles, show access denied
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log('❌ RoleGuard: Acceso denegado para rol:', userRole);
    
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background.light,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
      }}>
        <LinearGradient
          colors={['#ff6b6b', '#ee5a52']}
          style={{
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            ...shadows.lg,
          }}
        >
          <View style={{
            backgroundColor: colors.white + '20',
            borderRadius: borderRadius.full,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          }}>
            <Ionicons name="shield-outline" size={48} color={colors.white} />
          </View>
          
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.white,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}>
            Acceso Restringido
          </Text>
          
          <Text style={{
            fontSize: typography.fontSize.base,
            color: colors.white,
            textAlign: 'center',
            marginBottom: spacing.xl,
            opacity: 0.9,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
          }}>
            {fallbackMessage || 
             `No tienes permisos para acceder a esta sección. Tu rol actual (${userRole || 'sin definir'}) no tiene los permisos necesarios.`
            }
          </Text>
          
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/')}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="home" size={20} color="#ee5a52" style={{ marginRight: spacing.sm }} />
            <Text style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: "#ee5a52",
            }}>
              Ir al Inicio
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  console.log('✅ RoleGuard: Acceso permitido para rol:', userRole);
  return <>{children}</>;
};

/**
 * HOC that wraps a component with role-based access control
 * @param allowedRoles - Array of roles that can access the component
 * @param fallbackMessage - Custom message to show when access is denied
 */
export const withRoleGuard = (allowedRoles: string[], fallbackMessage?: string) => {
  return function<T>(Component: React.ComponentType<T>) {
    return function WrappedComponent(props: T) {
      return (
        <RoleGuard allowedRoles={allowedRoles} fallbackMessage={fallbackMessage}>
          <Component {...props} />
        </RoleGuard>
      );
    };
  };
};

export default RoleGuard;