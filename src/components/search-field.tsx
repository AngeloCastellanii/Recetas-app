import { StyleSheet } from 'react-native';

import { UiTextField } from '@/components/ui-text-field';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Buscar...',
}: Props) {
  return (
    <UiTextField
      label="Buscar"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCorrect={false}
      autoCapitalize="none"
      maxLength={60}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
  },
});
