import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { SearchField } from '@/components/search-field';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { groupMatchesQuery } from '@/utils/filter';
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
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const data = useMemo(
    () =>
      (Array.isArray(groups) ? groups : [])
        .filter((group) => Boolean(group?.id && group?.name))
        .filter((group) => groupMatchesQuery(group, query)),
    [groups, query]
  );

  const renderItem = ({ item }: { item: Group }) => {
    const count = item.recipeIds?.length ?? 0;
    const isOwner = item.ownerId === user?.id;

    return (
      <Pressable
        onPress={() => router.push(`/(app)/group/${item.id}` as Href)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            opacity: pressed ? 0.9 : 1,
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
      <LinearGradient
        colors={[colors.heroFrom, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
        <Text style={[styles.eyebrow, { color: colors.tint }]}>Colecciones</Text>
        <Text style={[styles.title, { color: colors.text }]}>Grupos</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Organiza tus recetas en colecciones
        </Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar grupo por nombre o descripción"
        />
        <Text style={[styles.metaHeader, { color: colors.muted }]}>
          {data.length} {data.length === 1 ? 'grupo' : 'grupos'}
        </Text>
        <UiButton
          label="Nuevo grupo"
          onPress={() => router.push('/(app)/group/new' as Href)}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : (
        <FlatList
          data={data}
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
    gap: 12,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  metaHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
  loader: { marginTop: 40 },
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
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
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
