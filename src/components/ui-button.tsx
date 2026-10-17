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
        : 'transparent';

  const textColor =
    variant === 'secondary' ? colors.tint : scheme === 'dark' ? '#0F1612' : '#FFFFFF';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor,
          borderColor: variant === 'secondary' ? colors.tint : backgroundColor,
          opacity: isDisabled || state.pressed ? 0.7 : 1,
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
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
