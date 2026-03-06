import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({ label, error, leftIcon, rightIcon, onRightIconPress, containerStyle, isPassword = false, ...props }: InputProps) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, focused && styles.focused, !!error && styles.errored]}>
        {!!leftIcon && <Ionicons name={leftIcon} size={18} color={Colors.gray[400]} style={{ marginRight: 8 }} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.gray[400]}
          secureTextEntry={isPassword && !showPass}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
        {!isPassword && !!rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={{ padding: 4 }}>
            <Ionicons name={rightIcon} size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray[50], borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
  },
  focused:  { borderColor: Colors.primary, backgroundColor: Colors.white },
  errored:  { borderColor: Colors.error },
  input:    { flex: 1, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary },
  error:    { fontSize: 12, color: Colors.error, marginTop: 4 },
});