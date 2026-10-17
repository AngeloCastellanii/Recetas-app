import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import Colors from '@/constants/colors';
import { useColorScheme } from '@/components/use-color-scheme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
};

export function UiTextField({
  label,
  error,
  helperText,
  style,
  ...rest
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: colors.muted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  helper: {
    fontSize: 12,
  },
});
