import FontAwesome from '@expo/vector-icons/FontAwesome';
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
    <View style={[styles.wrap, { backgroundColor: colors.tintSoft }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.card }]}>
        <FontAwesome name="cutlery" size={22} color={colors.tint} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
});
