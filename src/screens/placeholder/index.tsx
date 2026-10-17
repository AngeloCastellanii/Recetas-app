import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
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
    <Screen centered includeTopSafeArea={false}>
      <View style={styles.block}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
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
