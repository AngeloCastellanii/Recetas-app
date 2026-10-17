import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';

type Props = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
});
