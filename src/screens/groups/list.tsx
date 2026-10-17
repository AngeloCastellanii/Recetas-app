import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { getScreenMetrics } from '@/utils/layout';
import type { Group } from '@/types';

export function GroupsListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups, isLoading, refresh } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const renderItem = ({ item }: { item: Group }) => {
    const count = item.recipeIds?.length ?? 0;
    const isOwner = item.ownerId === user?.id;

    return (
      <Pressable
        onPress={() => router.push(`/(app)/group/${item.id}`)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.muted }]}>
          {count} {count === 1 ? 'receta' : 'recetas'}
          {isOwner ? ' · Tuyo' : ''}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: metrics.horizontalPadding,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 12,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Grupos</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Organiza tus recetas en colecciones
        </Text>
        <UiButton
          label="Nuevo grupo"
          onPress={() => router.push('/(app)/group/new')}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: metrics.horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 24),
            gap: 12,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              title="Sin grupos"
              description="Crea tu primer grupo para organizar recetas."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    gap: 10,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  loader: { marginTop: 40 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
});
