import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import Colors from '@/constants/colors';
import { useColorScheme } from '@/components/use-color-scheme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

export function UiButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isDisabled = Boolean(disabled || loading);

  const backgroundColor =
    variant === 'primary'
      ? colors.tint
      : variant === 'danger'
        ? colors.danger
        : colors.tintSoft;

  const borderColor =
    variant === 'secondary' ? colors.tintSoft : backgroundColor;

  const textColor =
    variant === 'secondary'
      ? colors.tint
      : variant === 'danger'
        ? '#FFFFFF'
        : colors.onTint;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.55 : state.pressed ? 0.88 : 1,
          transform: [{ scale: state.pressed && !isDisabled ? 0.98 : 1 }],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
