import { Stack } from 'expo-router';
import React from 'react';

export default function SecurityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="blacklist"
        options={{
          title: 'Lista Negra',
        }}
      />
      <Stack.Screen
        name="whitelist"
        options={{
          title: 'Lista Blanca',
        }}
      />
    </Stack>
  );
}
