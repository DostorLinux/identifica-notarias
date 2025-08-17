import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

const FormField = ({ label, value, onChangeText, placeholder, required, secureTextEntry, keyboardType }) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={{
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    }}>
      {label} {required && <Text style={{ color: colors.error }}>*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.secondary}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.background.light,
        ...shadows.sm,
      }}
    />
  </View>
);

export default FormField;
