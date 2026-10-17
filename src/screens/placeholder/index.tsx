import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';

type Props = {
  title: string;
  description: string;
};

export function PlaceholderScreen({ title, description }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
});
