import { Stack } from 'expo-router';
import React from 'react';

export default function BlacklistCategoriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="users"
        options={{
          title: 'Usuarios en Lista Negra',
        }}
      />
      <Stack.Screen
        name="vehicles"
        options={{
          title: 'Vehículos en Lista Negra',
        }}
      />
      <Stack.Screen
        name="companies"
        options={{
          title: 'Empresas en Lista Negra',
        }}
      />
    </Stack>
  );
}
