import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

const InvitacionesScreen = () => {
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
                Invitaciones
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
                marginTop: spacing.xs,
              }}>
                Gestión de invitaciones y accesos
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: spacing.lg }}>
        {/* Placeholder Content */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          alignItems: 'center',
          ...shadows.md,
        }}>
          <View style={{
            backgroundColor: colors.primary.purple + '20',
            borderRadius: borderRadius.full,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          }}>
            <Ionicons name="mail-outline" size={48} color={colors.primary.purple} />
          </View>
          
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}>
            Módulo de Invitaciones
          </Text>
          
          <Text style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            textAlign: 'center',
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
          }}>
            Aquí podrás gestionar invitaciones, crear códigos de acceso temporal y administrar permisos especiales para visitantes.
          </Text>
          
          <View style={{
            marginTop: spacing.xl,
            width: '100%',
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary.purple,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
              }}>
                Crear Nueva Invitación
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: colors.background.light,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
              }}>
                Ver Invitaciones Activas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvitacionesScreen;