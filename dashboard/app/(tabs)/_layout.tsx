import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  // Define all available tabs with their permissions
  const allTabs = [
    {
      name: 'index',
      title: 'Dashboard',
      icon: 'house.fill',
      roles: ['admin', 'super_admin', 'user'] // No incluir 'gate' ni 'worker'
    },
    {
      name: 'explore',
      title: 'Usuarios',
      icon: 'person.3.fill',
      roles: ['admin', 'super_admin'] // Solo administradores
    },
    {
      name: 'marcaciones',
      title: 'Marcaciones',
      icon: 'calendar.fill',
      roles: ['admin', 'super_admin', 'gate', 'user'] // Todos excepto worker
    },
    {
      name: 'dispositivos',
      title: 'Dispositivos',
      icon: 'camera.fill',
      roles: ['admin', 'super_admin', 'gate'] // Admins y guardias
    },
    {
      name: 'invitaciones',
      title: 'Invitaciones',
      icon: 'envelope.fill',
      roles: ['admin', 'super_admin', 'gate', 'worker'] // Admins, guardias y workers
    },
    {
      name: 'agendamiento',
      title: 'Agendamiento',
      icon: 'calendar.fill',
      roles: ['admin', 'super_admin', 'empresa'] // Admins, super admins y empresas
    },
    {
      name: 'security',
      title: 'Seguridad',
      icon: 'shield.fill',
      roles: ['admin', 'super_admin'] // Solo administradores
    },
    {
      name: 'debug',
      title: 'Debug',
      icon: 'gear',
      roles: ['admin', 'super_admin'] // Solo administradores
    }
  ];

  // Get user role, default to 'user' if not found
  const userRole = user?.role || 'user';
  console.log('🔑 TabLayout: Usuario logueado con rol:', userRole);
  console.log('👤 TabLayout: Usuario completo:', user);

  // Filter tabs based on user role
  const allowedTabs = allTabs.filter(tab => tab.roles.includes(userRole));
  console.log('📋 TabLayout: Pestañas permitidas:', allowedTabs.map(t => t.title));
  console.log('📋 TabLayout: Pestañas permitidas completas:', allowedTabs);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.purple,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          web: { display: 'none' },
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      {allowedTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
